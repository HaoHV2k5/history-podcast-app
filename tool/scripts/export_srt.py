#!/usr/bin/env python3
"""
Xuất file phụ đề SRT từ file annotation.json (hỗ trợ đơn cảnh và đa cảnh).

Cách dùng:
  python scripts/export_srt.py <annotation.json> -o <output.srt>
  python scripts/export_srt.py <scene1.json> <scene2.json> -o <full.srt>
"""
import argparse
import json
import sys
from pathlib import Path


def format_srt_time(ms: float) -> str:
    total_ms = max(0, int(round(ms)))
    hours = total_ms // 3600000
    minutes = (total_ms % 3600000) // 60000
    seconds = (total_ms % 60000) // 1000
    millis = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"


def export_srt(json_paths: list[str], output_srt: str) -> None:
    cues = []
    time_offset = 0.0

    for json_path in json_paths:
        p = Path(json_path)
        if not p.exists():
            print(f"[err] Không tìm thấy file: {json_path}", file=sys.stderr)
            sys.exit(1)

        data = json.loads(p.read_text(encoding="utf-8"))
        elements = data.get("elements", [])
        scene_duration = data.get("sceneDurationMs", 0)

        # Sắp xếp các phần tử theo thứ tự startMs
        elements = sorted(elements, key=lambda e: e.get("reveal", {}).get("startMs", 0))

        for idx, el in enumerate(elements):
            sub_text = el.get("subtitle", "").strip()
            if not sub_text:
                continue

            if "speech" in el and "startMs" in el["speech"] and "endMs" in el["speech"]:
                start_ms = time_offset + el["speech"]["startMs"]
                end_ms = time_offset + el["speech"]["endMs"]
            else:
                reveal = el.get("reveal", {})
                start_ms = time_offset + reveal.get("startMs", 0)
                dur_ms = reveal.get("durationMs", 3000)
                if idx + 1 < len(elements):
                    next_start = time_offset + elements[idx + 1].get("reveal", {}).get("startMs", 28500)
                    end_ms = max(start_ms + dur_ms, next_start - 300)
                else:
                    end_ms = min(time_offset + (scene_duration or 28500) - 1000, max(start_ms + dur_ms, start_ms + 7500))

            if end_ms <= start_ms:
                end_ms = start_ms + 2500

            cues.append({
                "start": start_ms,
                "end": end_ms,
                "text": sub_text
            })

        if not scene_duration and elements:
            last_el = elements[-1]["reveal"]
            scene_duration = last_el.get("startMs", 0) + last_el.get("durationMs", 0) + 1000

        time_offset += scene_duration

    # Ghi file SRT
    lines = []
    for i, cue in enumerate(cues, start=1):
        lines.append(str(i))
        lines.append(f"{format_srt_time(cue['start'])} --> {format_srt_time(cue['end'])}")
        lines.append(cue["text"])
        lines.append("")

    out_p = Path(output_srt)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    out_p.write_text("\n".join(lines), encoding="utf-8")
    print(f"[ok] Đã xuất {len(cues)} câu phụ đề ra: {out_p}")


def main():
    parser = argparse.ArgumentParser(description="Xuất file phụ đề SRT từ annotation.json")
    parser.add_argument("annotations", nargs="+", help="Đường dẫn các file annotation.json")
    parser.add_argument("-o", "--output", required=True, help="Đường dẫn file .srt đầu ra")
    args = parser.parse_args()

    export_srt(args.annotations, args.output)


if __name__ == "__main__":
    main()
