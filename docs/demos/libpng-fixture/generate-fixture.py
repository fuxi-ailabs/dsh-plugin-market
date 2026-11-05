"""Generate a deterministic 2x2 RGBA PNG used by both real libpng tests."""
from pathlib import Path
import struct
import zlib

def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

pixels = b"\x00\xff\x00\x00\xff\x00\xff\x00\xff\x00\x00\x00\xff\xff\xff\xff\xff\xff"
png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 2, 2, 8, 6, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(pixels, 9)) + chunk(b"IEND", b"")
target = Path(__file__).with_name("fixtures") / "sample.png"
target.parent.mkdir(exist_ok=True)
target.write_bytes(png)
