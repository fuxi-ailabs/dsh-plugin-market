"""Encode a narrated walkthrough from native browser captures and TTS output.

Usage: python encode-narrated-video.py FOCUS ORIGINAL AUDIO ASSETS [--font FONT]
FOCUS: five native 3840x1920 WebM files named for narration views.
ORIGINAL: native 1920x1920 a-2/b-2/a-3/b-3 clips for two-Agent overview/end.
AUDIO: one continuous narration.mp3 and narration.srt from narration.json.
Requires Pillow, ffmpeg and ffprobe. All input validation precedes replacement.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFont

DOCS = Path(__file__).resolve().parent
FPS = 30

def sha(path):
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()

def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]))

def seconds(text):
    h, m, s = text.replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)

def timestamp(value):
    milliseconds = round(value * 1000)
    h, rest = divmod(milliseconds, 3600000)
    m, rest = divmod(rest, 60000)
    s, ms = divmod(rest, 1000)
    return f"{h:02}:{m:02}:{s:02}.{ms:03}"

def captions(path, duration):
    result = []
    for block in path.read_text().strip().split("\n\n"):
        lines = block.splitlines()
        start, end = lines[1].split(" --> ")
        result.append({"start":seconds(start),
                       "end":min(seconds(end), duration),
                       "text":" ".join(lines[2:])})
    # Provider sentence boundaries can overlap by ~50ms. Avoid double subtitles.
    for index, cue in enumerate(result[:-1]):
        cue["end"] = min(cue["end"], result[index + 1]["start"] - 1 / FPS)
    if not result or any(c["end"] <= c["start"] for c in result):
        raise ValueError(f"Invalid captions: {path.name}")
    return result

def label_plate(scene, target, font_path):
    image = Image.new("RGB", (3840, 2160), "white")
    draw = ImageDraw.Draw(image)
    title = ImageFont.truetype(str(font_path), 62)
    small = ImageFont.truetype(str(font_path), 34)
    label = ImageFont.truetype(str(font_path), 44)
    draw.rectangle((0, 0, 3840, 160), fill="#102e27")
    draw.text((54, 24), "Crowd Memory · 三方库接入经验复用", font=title, fill="white")
    draw.text((54, 104), "libpng 1.6.59 · Agent A → Agent B · 独立工程", font=small, fill="#c2dfd3")
    draw.text((2920, 58), "真实运行回看 · 非同步计时", font=small, fill="#c2dfd3")
    if scene["view"] == "two_agents":
        draw.rectangle((0, 160, 1920, 240), fill="#edf0f3")
        draw.rectangle((1920, 160, 3840, 240), fill="#e3f3e8")
        draw.text((44, 174), "Agent A · 形成经验：修复并记录", font=label, fill="#354451")
        draw.text((1964, 174), "Agent B · 复用经验：核对并验证", font=label, fill="#17643c")
    else:
        draw.rectangle((0, 160, 3840, 240), fill="#e3f3e8")
        draw.text((54, 174), scene["label"], font=label, fill="#17643c")
    image.save(target)

def subtitle_plate(text, target, font_path):
    image = Image.new("RGBA", (3840, 2160), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(str(font_path), 76)
    lines = []
    line = ""
    for token in re.findall(r"[A-Za-z0-9]+|.", text):
        if draw.textlength(line + token, font=font) > 2500 and line:
            lines.append(line.strip())
            line = token
        else:
            line += token
    if line: lines.append(line.strip())
    if len(lines) > 2:
        raise ValueError("Narration sentence needs shorter subtitle: " + text)
    line_height = 98
    height = line_height * len(lines) + 32
    # Leave room for native player controls when the walkthrough is paused.
    top = 2160 - 240 - height
    width = math.ceil(max(draw.textlength(line, font=font) for line in lines)) + 52
    left = (3840 - width) // 2
    draw.rectangle((left, top, left + width, top + height), fill=(0, 0, 0, 220))
    for index, line in enumerate(lines):
        x = (3840 - draw.textlength(line, font=font)) / 2
        draw.text((x, top + 8 + index * line_height), line, font=font, fill="white")
    image.save(target)

def encode(args):
    spec = json.loads((DOCS / "narration.json").read_text())
    if not spec.get("continuous"):
        raise ValueError("This encoder requires a single continuous narration")
    master_audio = args.audio / "narration.mp3"
    master_duration = float(probe(master_audio)["format"]["duration"])
    master_cues = captions(args.audio / "narration.srt", master_duration)
    normalize = lambda text: re.sub(r"[^\w\u4e00-\u9fff]", "", text).lower()
    grouped_cues = []
    cursor = 0
    for source in spec["scenes"]:
        target = normalize(source["speech"])
        text = ""
        group = []
        while cursor < len(master_cues) and text != target:
            cue = master_cues[cursor]
            text += normalize(cue["text"])
            if not target.startswith(text):
                raise ValueError("Narration boundaries do not match scene: " + source["id"])
            group.append(cue)
            cursor += 1
        if text != target or not group:
            raise ValueError("Missing narration for scene: " + source["id"])
        grouped_cues.append(group)
    if cursor != len(master_cues):
        raise ValueError("Unexpected narration after the last scene")
    starts = [0] + [math.floor(group[0]["start"] * FPS) / FPS for group in grouped_cues[1:]]
    ends = starts[1:] + [math.ceil(master_duration * FPS) / FPS]
    scenes = []
    for source, group, start, end in zip(spec["scenes"], grouped_cues, starts, ends):
        scene = dict(source)
        scene["start"] = start
        scene["duration"] = end - start
        scene["captions"] = [{"start":c["start"] - start,"end":c["end"] - start,"text":c["text"]} for c in group]
        if scene["view"] == "two_agents":
            stage = 2 if scene["id"] == "overview" else 3
            inputs = [args.original / f"{actor}-{stage}.webm" for actor in "ab"]
            expected = (1920, 1920)
        else:
            inputs = [args.focus / (scene["view"] + ".webm")]
            expected = (3840, 1920)
        for path in inputs:
            info = probe(path)
            stream = next(s for s in info["streams"] if s["codec_type"] == "video")
            if (stream["width"], stream["height"]) != expected:
                raise ValueError(f"{path.name}: expected native {expected}")
            if float(info["format"]["duration"]) < scene["duration"] + 0.5:
                raise ValueError(f"{path.name}: capture too short")
        scene["inputs"] = inputs
        scenes.append(scene)
    # Fail before publication if the font is missing.
    ImageFont.truetype(str(args.font), 76)
    with tempfile.TemporaryDirectory(prefix=".narrated-demo-", dir=args.assets) as temporary:
        stage = Path(temporary)
        timeline = []
        elapsed = 0
        output_clips = []
        for scene_index, scene in enumerate(scenes):
            sid = scene["id"]
            duration = scene["duration"]
            plate = stage / (sid + "-plate.png")
            label_plate(scene, plate, args.font)
            command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                       "-loop", "1", "-framerate", str(FPS), "-i", str(plate)]
            filters = ["[0:v]format=yuv420p[base]"]
            for index, path in enumerate(scene["inputs"], 1):
                command += ["-threads", "2", "-i", str(path)]
                filters.append(f"[{index}:v]trim=start=0.5:duration={duration},setpts=PTS-STARTPTS,fps={FPS},format=yuv420p[v{index}]")
            if len(scene["inputs"]) == 2:
                filters += ["[base][v1]overlay=0:240:shortest=1[p1]",
                            "[p1][v2]overlay=1920:240:shortest=1[content]"]
            else:
                filters += ["[base][v1]overlay=0:240:shortest=1[content]"]
            current = "content"
            for index, cue in enumerate(scene["captions"]):
                overlay = stage / f"{sid}-caption-{index}.png"
                subtitle_plate(cue["text"], overlay, args.font)
                command += ["-loop", "1", "-framerate", str(FPS), "-i", str(overlay)]
                stream_index = len(scene["inputs"]) + index + 1
                after = f"c{index}"
                filters.append(f"[{current}][{stream_index}:v]overlay=0:0:enable='gte(t,{cue['start']})*lt(t,{cue['end']})'[{after}]")
                current = after
                timeline.append({"scene":sid,"start":round(elapsed + cue["start"],3),
                                 "end":round(elapsed + cue["end"],3),"text":cue["text"]})
            clip = stage / (sid + ".mp4")
            subprocess.run(command + ["-filter_complex_threads", "2", "-filter_complex", ";".join(filters),
                "-map", f"[{current}]", "-an", "-t", str(duration),
                "-c:v", "libx264", "-threads", "4", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", str(clip)], check=True)
            output_clips.append(clip)
            elapsed += duration
            print("Encoded", sid, round(duration,3), flush=True)
        playlist = stage / "playlist.txt"
        playlist.write_text("".join(f"file '{p.name}'\n" for p in output_clips))
        video = stage / "coding-agent-demo.mp4"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(playlist),
            "-i", str(master_audio), "-map", "0:v:0", "-map", "1:a:0", "-t", str(elapsed), "-c:v", "copy",
            "-af", f"loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000,apad,atrim=duration={elapsed}",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(video)], check=True)
        poster = stage / "coding-agent-poster.jpg"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", "3", "-i", str(video),
                        "-frames:v", "1", "-q:v", "2", str(poster)], check=True)
        representative = stage / "coding-memory.jpg"
        shutil.copyfile(poster, representative)
        vtt = stage / "coding-agent-zh.vtt"
        vtt.write_text("WEBVTT\n\n" + "\n\n".join(
            f"{timestamp(c['start'])} --> {timestamp(c['end'])}\n{c['text']}" for c in timeline) + "\n")
        metadata = {"duration_seconds":round(elapsed,3),
            "container_duration_seconds":round(float(probe(video)["format"]["duration"]),3),
            "fps":FPS,"width":3840,"height":2160,
            "narration":{"voice":spec["voice"],"rate":spec["rate"],"type":spec["type"],
                         "continuous":True,"audio_splice_count":0,
                         "audio_master":"AAC mono 48kHz / loudnorm target -16 LUFS, true peak target -1.5 dBTP"},
            "captions_burned_in":True,"caption_count":len(timeline),"captions":timeline,
            "font_name":args.font.name,"font_sha256":sha(args.font),
            "source_capture_sha256":{p.name:sha(p) for s in scenes for p in s["inputs"]},
            "source_audio_sha256":{"narration.mp3":sha(master_audio)},
            "scenes":[{"id":s["id"],"start_seconds":round(s["start"],3),"duration_seconds":round(s["duration"],3),"label":s["label"]} for s in scenes]}
        for path in (video, poster, representative, vtt): path.replace(args.assets / path.name)
        (DOCS / "narrated-encoding.json").write_text(json.dumps(metadata,ensure_ascii=False,indent=2) + "\n")
        print("Published narrated video", round(elapsed,3), "seconds", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    for name in ["focus", "original", "audio", "assets"]: parser.add_argument(name, type=Path)
    parser.add_argument("--font", type=Path, default=Path("/System/Library/Fonts/STHeiti Medium.ttc"))
    encode(parser.parse_args())
