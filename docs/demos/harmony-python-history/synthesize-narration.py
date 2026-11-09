"""Generate the documented synthetic narration in an isolated Python environment.

Install edge-tts there, then run: python synthesize-narration.py OUTPUT_DIRECTORY
Only the public narration.json text is sent to the speech service.
"""
import asyncio
import json
from pathlib import Path
import sys
import edge_tts

async def main():
    spec = json.loads(Path(__file__).with_name("narration.json").read_text())
    output = Path(sys.argv[1])
    output.mkdir(parents=True, exist_ok=True)
    scenes = spec["scenes"]
    if spec.get("continuous"):
        scenes = [{"id":"narration", "speech":"".join(s["speech"] for s in scenes)}]
    for scene in scenes:
        audio = output / (scene["id"] + ".mp3")
        metadata = output / (scene["id"] + ".jsonl")
        await edge_tts.Communicate(scene["speech"], spec["voice"], rate=spec["rate"]).save(str(audio), str(metadata))
        maker = edge_tts.SubMaker()
        for line in metadata.read_text().splitlines(): maker.feed(json.loads(line))
        (output / (scene["id"] + ".srt")).write_text(maker.get_srt())
        print("Generated", scene["id"], flush=True)

if __name__ == "__main__": asyncio.run(main())
