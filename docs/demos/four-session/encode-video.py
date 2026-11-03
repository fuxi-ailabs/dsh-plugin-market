"""Compose twelve native DSH clips into a 54-second 4K comparison.

Usage: python3 encode-video.py CAPTURES ASSETS
CAPTURES contains a-1.webm through d-3.webm (three stages per session).
The versioned layout.png next to this script is the label/background plate.
Requires ffmpeg/ffprobe. There is no input poster or low-resolution upscaling.
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
    for actor_index, actor in enumerate("abcd"):
        for stage in range(1, 4):
            path = captures / f"{actor}-{stage}.webm"
            info = probe(path)
            video = next(s for s in info["streams"] if s["codec_type"] == "video")
            if (video["width"], video["height"]) != (1920, 920):
                raise ValueError(f"{path.name}: native 1920x920 required")
            if float(info["format"]["duration"]) < 19.5:
                raise ValueError(f"{path.name}: at least 19.5 seconds required")
            command += ["-threads", "2", "-i", str(path)]
            index = actor_index * 3 + stage - 1
            filters.append(f"[{index}:v]trim=start=0.5:duration=18,setpts=PTS-STARTPTS,fps=30,format=yuv420p[{actor}{stage}]")
        filters.append("".join(f"[{actor}{stage}]" for stage in range(1, 4)) + f"concat=n=3:v=1:a=0[{actor}]")
    command += ["-loop", "1", "-framerate", "30", "-i", str(plate)]
    filters += ["[12:v]format=yuv420p[base]",
                "[base][a]overlay=0:240:shortest=1[p1]",
                "[p1][c]overlay=1920:240:shortest=1[p2]",
                "[p2][b]overlay=0:1240:shortest=1[p3]",
                "[p3][d]overlay=1920:1240:shortest=1[out]"]
    # Input validation and all encodes must succeed before replacing any asset.
    with tempfile.TemporaryDirectory(prefix=".four-session-", dir=assets) as temporary:
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
        for path in (video, poster, representative):
            path.replace(assets / path.name)


if __name__ == "__main__":
    encode(Path(sys.argv[1]), Path(sys.argv[2]))
