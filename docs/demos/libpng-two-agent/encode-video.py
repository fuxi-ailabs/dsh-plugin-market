"""Compose six native 1920x1920 clips into a 54-second 4K two-Agent demo.

Usage: python3 encode-video.py CAPTURES ASSETS
Requires a-1.webm through b-3.webm, and versioned layout.png beside this script.
"""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]))

def encode(captures, assets):
    plate = Path(__file__).with_name("layout.png")
    image = probe(plate)["streams"][0]
    if (image["width"], image["height"]) != (3840, 2160):
        raise ValueError("layout.png must be 3840x2160")
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    filters = []
    for actor_index, actor in enumerate("ab"):
        for stage in range(1, 4):
            path = captures / f"{actor}-{stage}.webm"
            info = probe(path)
            video = next(s for s in info["streams"] if s["codec_type"] == "video")
            if (video["width"], video["height"]) != (1920, 1920):
                raise ValueError(f"{path.name}: native 1920x1920 required")
            if float(info["format"]["duration"]) < 19.5:
                raise ValueError(f"{path.name}: at least 19.5 seconds required")
            command += ["-threads", "2", "-i", str(path)]
            index = actor_index * 3 + stage - 1
            filters.append(f"[{index}:v]trim=start=0.5:duration=18,setpts=PTS-STARTPTS,fps=30,format=yuv420p[{actor}{stage}]")
        filters.append("".join(f"[{actor}{stage}]" for stage in range(1, 4)) + f"concat=n=3:v=1:a=0[{actor}]")
    command += ["-loop", "1", "-framerate", "30", "-i", str(plate)]
    filters += ["[6:v]format=yuv420p[base]", "[base][a]overlay=0:240:shortest=1[p1]",
                "[p1][b]overlay=1920:240:shortest=1[out]"]
    with tempfile.TemporaryDirectory(prefix=".libpng-demo-", dir=assets) as temporary:
        stage = Path(temporary)
        video = stage / "coding-agent-demo.mp4"
        poster = stage / "coding-agent-poster.jpg"
        subprocess.run(command + ["-filter_complex_threads", "2", "-filter_complex", ";".join(filters),
            "-map", "[out]", "-t", "54", "-c:v", "libx264", "-threads", "4", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(video)], check=True)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", "27", "-i", str(video),
                        "-frames:v", "1", "-q:v", "2", str(poster)], check=True)
        representative = stage / "coding-memory.jpg"
        shutil.copyfile(poster, representative)
        for path in (video, poster, representative): path.replace(assets / path.name)

if __name__ == "__main__": encode(Path(sys.argv[1]), Path(sys.argv[2]))
