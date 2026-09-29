#!/usr/bin/env python3
"""
Đóng phụ đề trực tiếp lên video (Hardsub) với phong cách thẩm mỹ cao:
- Chữ trắng sắc nét, hỗ trợ 100% tiếng Việt
- Khung nền bo tròn mờ tinh tế (dark translucent pill)
- Tự động xuống dòng, căn giữa ở cạnh dưới video
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import textwrap
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR))
import stream_render as sr  # noqa: E402


def parse_srt(srt_path: Path) -> list[dict]:
    content = srt_path.read_text(encoding="utf-8-sig")
    blocks = re.split(r"\n\s*\n", content.strip().replace("\r\n", "\n").replace("\r", "\n"))
    time_re = re.compile(r"(\d+):(\d{2}):(\d{2})[,.](\d{1,3})")
    cues = []

    def to_ms(h, m, s, ms):
        return ((int(h) * 60 + int(m)) * 60 + int(s)) * 1000 + int(ms.ljust(3, "0"))

    for block in blocks:
        lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
        if not lines:
            continue
        time_idx = next((i for i, ln in enumerate(lines) if "-->" in ln), None)
        if time_idx is None:
            continue
        matches = time_re.findall(lines[time_idx])
        if len(matches) < 2:
            continue
        start_ms = to_ms(*matches[0])
        end_ms = to_ms(*matches[1])
        text = " ".join(lines[time_idx + 1:]).strip()
        if text:
            cues.append({"startMs": start_ms, "endMs": end_ms, "text": text})
    return cues


def parse_annotation(ann_path: Path) -> list[dict]:
    data = json.loads(ann_path.read_text(encoding="utf-8"))
    elements = sorted(data.get("elements", []), key=lambda e: e.get("reveal", {}).get("startMs", 0))
    cues = []
    for i, el in enumerate(elements):
        text = el.get("subtitle", "").strip()
        if not text:
            continue
        if "speech" in el and "startMs" in el["speech"] and "endMs" in el["speech"]:
            cues.append({
                "startMs": el["speech"]["startMs"],
                "endMs": el["speech"]["endMs"],
                "text": text
            })
            continue
        rev = el.get("reveal", {})
        start_ms = rev.get("startMs", 0)
        dur_ms = rev.get("durationMs", 3000)
        if i + 1 < len(elements):
            next_start = elements[i + 1].get("reveal", {}).get("startMs", 28500)
            end_ms = max(start_ms + dur_ms, next_start - 300)
        else:
            scene_dur = data.get("sceneDurationMs", 28500)
            end_ms = min(scene_dur - 1000, max(start_ms + dur_ms, start_ms + 7500))
        cues.append({"startMs": start_ms, "endMs": end_ms, "text": text})
    return cues


def get_font(size: int):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/PingFang.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "C:/Windows/Fonts/msyh.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for font_p in candidates:
        if Path(font_p).exists():
            try:
                return ImageFont.truetype(font_p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def render_subtitle_overlay(text: str, width: int, height: int, font) -> tuple[np.ndarray, np.ndarray] | None:
    if not text:
        return None

    # Tự động chia dòng hợp lý (tối đa ~50 ký tự mỗi dòng)
    lines = textwrap.wrap(text, width=max(35, int(width / 26)))
    if not lines:
        return None

    line_spacing = max(4, int(height * 0.008))
    dummy_img = Image.new("RGBA", (1, 1))
    draw = ImageDraw.Draw(dummy_img)

    line_bboxes = [draw.textbbox((0, 0), ln, font=font) for ln in lines]
    line_w = [b[2] - b[0] for b in line_bboxes]
    line_h = [b[3] - b[1] for b in line_bboxes]
    max_w = max(line_w)
    total_h = sum(line_h) + (len(lines) - 1) * line_spacing

    pad_x = max(16, int(width * 0.02))
    pad_y = max(8, int(height * 0.015))
    bottom_margin = int(height * 0.04)

    box_w = max_w + pad_x * 2
    box_h = total_h + pad_y * 2
    box_x = (width - box_w) // 2
    box_y = height - bottom_margin - box_h

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)

    # Nền mờ bo tròn (Dark pill)
    ov_draw.rounded_rectangle(
        (box_x, box_y, box_x + box_w, box_y + box_h),
        radius=max(8, int(height * 0.018)),
        fill=(20, 24, 30, 220),
        outline=(255, 255, 255, 45),
        width=1,
    )

    # Vẽ chữ màu trắng sắc nét
    curr_y = box_y + pad_y
    for i, line in enumerate(lines):
        lw = line_w[i]
        lx = box_x + (box_w - lw) // 2
        ov_draw.text((lx, curr_y), line, font=font, fill=(255, 255, 255, 255))
        curr_y += line_h[i] + line_spacing

    # Chuyển thành BGR và Alpha map cho OpenCV
    arr = np.array(overlay)
    bgr = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2BGR)
    alpha = (arr[:, :, 3] / 255.0)[:, :, None].astype(np.float32)
    return bgr, alpha


def add_subtitles(video_path: Path, cues: list[dict], output_path: Path) -> Path:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Không thể mở video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    font_size = max(18, int(height * 0.038))
    font = get_font(font_size)

    # Pre-render overlays cho từng cue để tăng tốc tối đa
    print(f"  Đang chuẩn bị {len(cues)} phụ đề...")
    rendered_cues = []
    for c in cues:
        res = render_subtitle_overlay(c["text"], width, height, font)
        rendered_cues.append({
            "startMs": c["startMs"],
            "endMs": c["endMs"],
            "overlay": res
        })

    raw_out = output_path.with_name(output_path.stem + "_sub_raw.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(raw_out), fourcc, fps, (width, height))
    if not writer.isOpened():
        raise RuntimeError(f"Không thể khởi tạo VideoWriter: {raw_out}")

    print(f"  Đang đóng phụ đề vào video ({total_frames} khung hình)...")
    frame_idx = 0
    ms_per_frame = 1000.0 / fps

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        cur_ms = frame_idx * ms_per_frame

        # Tìm phụ đề đang hoạt động
        active_ov = None
        for rc in rendered_cues:
            if rc["startMs"] <= cur_ms <= rc["endMs"]:
                active_ov = rc["overlay"]
                break

        if active_ov is not None:
            sub_bgr, alpha = active_ov
            frame = (frame.astype(np.float32) * (1.0 - alpha) + sub_bgr.astype(np.float32) * alpha).astype(np.uint8)

        writer.write(frame)
        frame_idx += 1

    cap.release()
    writer.release()

    final = sr.transcode_h264(raw_out, output_path)
    print(f"[ok] Video có phụ đề đã sẵn sàng: {final}")
    return final


def main():
    p = argparse.ArgumentParser(description="Đóng phụ đề trực tiếp lên video (Hardsub)")
    p.add_argument("--video", required=True, help="File video MP4 đầu vào")
    p.add_argument("--subtitles", help="File phụ đề .srt")
    p.add_argument("--annotation", help="File cấu hình .annotation.json")
    p.add_argument("--output", "-o", required=True, help="File video MP4 đầu ra")
    args = p.parse_args()

    if not args.subtitles and not args.annotation:
        print("[err] Vui lòng cung cấp --subtitles hoặc --annotation", file=sys.stderr)
        sys.exit(1)

    video_p = Path(args.video)
    out_p = Path(args.output)
    out_p.parent.mkdir(parents=True, exist_ok=True)

    if args.subtitles:
        cues = parse_srt(Path(args.subtitles))
    else:
        cues = parse_annotation(Path(args.annotation))

    add_subtitles(video_p, cues, out_p)


if __name__ == "__main__":
    main()
