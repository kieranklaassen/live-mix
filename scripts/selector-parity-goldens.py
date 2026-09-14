#!/usr/bin/env python3
"""
Record the tuin music selector's picks for the parity goldens.

Runs `select_songs_for_session` from kieranklaassen/tuin's breathwork skill
(`.claude/skills/breathwork/scripts/music_selector.py`, read-only, not part
of this repo) over the fixture libraries in
`src/agent/authoring/__tests__/fixtures/selector-library.json` for a matrix
of seeds and durations, and writes what it picked to `selector-goldens.json`.
The TypeScript port (`src/agent/authoring/selector.ts`) must reproduce every
entry exactly — same track ids in the same order, same summed durations.

Usage:
    TUIN_DIR=~/tuin python3 scripts/selector-parity-goldens.py

No music files are read: the fixture carries only ids, intensities, Camelot
codes and durations.
"""

import json
import os
import random
import sys
from pathlib import Path
from uuid import UUID

repo = Path(__file__).resolve().parent.parent
fixtures = repo / "src" / "agent" / "authoring" / "__tests__" / "fixtures"
tuin = Path(os.environ.get("TUIN_DIR", Path.home() / "tuin")).expanduser()
scripts = tuin / ".claude" / "skills" / "breathwork" / "scripts"
if not (scripts / "music_selector.py").exists():
    sys.exit(f"music_selector.py not found under {scripts}; set TUIN_DIR")
sys.path.insert(0, str(scripts))

from music_selector import MusicTrack, select_songs_for_session  # noqa: E402

SEEDS = [0, 1, 7, 42, 2024, 123456789]
DURATIONS = [600, 900, 1200, 1800, 3000]


def to_tracks(items):
    return [
        MusicTrack(
            id=item["id"],  # strings work as set members exactly like UUIDs
            name=item["title"],
            url=item.get("url", f"music_processed/{item['id']}.mp3"),
            intensity_score=item["intensity"],
            length_seconds=item["durationSec"],
            bpm=item.get("bpm", 0),
            librosa_intensity=item.get("energy", 0.0),
            camelot_code=item["camelot"],
        )
        for item in items
    ]


def main():
    libraries = json.loads((fixtures / "selector-library.json").read_text())
    goldens = []
    for library_name, items in libraries.items():
        tracks = to_tracks(items)
        for seed in SEEDS:
            for duration in DURATIONS:
                random.seed(seed)
                s1, s2, s3, used = select_songs_for_session(duration, tracks)
                goldens.append(
                    {
                        "library": library_name,
                        "seed": seed,
                        "totalSec": duration,
                        "sections": [
                            {
                                "ids": [t.id for t in section.tracks],
                                "totalDurationSec": section.total_duration_seconds,
                            }
                            for section in (s1, s2, s3)
                        ],
                        "usedIds": sorted(str(u) for u in used),
                    }
                )
    out = fixtures / "selector-goldens.json"
    out.write_text(json.dumps({"seeds": SEEDS, "durations": DURATIONS, "cases": goldens}, indent=2) + "\n")
    print(f"wrote {len(goldens)} cases to {out}")


if __name__ == "__main__":
    main()
