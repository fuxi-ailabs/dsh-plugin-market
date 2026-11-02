"""Encode eight native 1080p DSH captures into the 72-second website demo.

Usage: python3 encode-hd-video.py /private/capture-directory /path/to/assets
Requires ffmpeg and ffprobe. Captures contain real saved conversation views.
"""
import json
from pathlib import Path
import subprocess
import sys


def encode(raw, assets):
    names = ["01-request", "02-change", "03-response", "04-tests",
             "05-note", "06-read", "07-change", "08-tests"]
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for name in names:
        path = raw / f"{name}.webm"
        metadata = json.loads(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]))
        video = next(s for s in metadata["streams"] if s["codec_type"] == "video")
        if (video["width"], video["height"]) != (1920, 1080):
            raise ValueError(f"{name}: native 1920x1080 required; upscaling is not allowed")
        if float(metadata["format"]["duration"]) < 9.5:
            raise ValueError(f"{name}: capture must contain at least 9.5 seconds")
        command += ["-i", str(path)]
    filters = [f"[{i}:v]trim=start=0.5:duration=9,setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{i}]"
               for i in range(8)]
    filters.append("".join(f"[v{i}]" for i in range(8)) + "concat=n=8:v=1:a=0[out]")
    command += ["-filter_complex", ";".join(filters), "-map", "[out]", "-c:v", "libx264",
                "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                "-an", str(assets / "coding-agent-demo.mp4")]
    subprocess.run(command, check=True)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i",
                    str(raw / "06-read.png"), "-frames:v", "1", "-q:v", "2",
                    str(assets / "coding-agent-poster.jpg")], check=True)


if __name__ == "__main__":
    encode(Path(sys.argv[1]), Path(sys.argv[2]))
