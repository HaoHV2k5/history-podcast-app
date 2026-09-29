#!/usr/bin/env python3
"""
Tạo giọng đọc thuyết minh tiếng Việt chuẩn qua ElevenLabs (giọng Brian - phong cách phim tài liệu lịch sử)
cho video thời tiền sử đồ đá và ghép chính xác vào timeline 57 giây.
"""
import json
import subprocess
import urllib.request
from pathlib import Path

API_KEY = "sk_9fb92427a518f0da605cbd39b821a88e80416afb65844f43"
VOICE_ID = "nPczCjzI2devNBz1zQrb"  # Brian - Giọng tài liệu lịch sử đĩnh đạc, trầm ấm
MODEL_ID = "eleven_turbo_v2_5"

SEGMENTS = [
    {
        "id": "seg_01",
        "start_sec": 0.5,
        "max_dur": 8.0,
        "text": "Hàng chục vạn năm trước trong thời kỳ đồ đá, con người sống thành từng bầy đàn du mục, phụ thuộc hoàn toàn vào thiên nhiên hoang dã."
    },
    {
        "id": "seg_02",
        "start_sec": 9.0,
        "max_dur": 8.5,
        "text": "Hằng ngày, phụ nữ và trẻ em tỏa đi khắp các cánh rừng để hái lượm quả dại, đào rễ cây và thu nhặt hạt ngũ cốc làm nguồn sống chính."
    },
    {
        "id": "seg_03",
        "start_sec": 18.0,
        "max_dur": 9.5,
        "text": "Trong khi đó, những người đàn ông khéo léo ghè đẽo đá cuội thành rìu tay và mũi giáo sắc nhọn để chuẩn bị cho những cuộc săn sinh tử."
    },
    {
        "id": "seg_04",
        "start_sec": 29.0,
        "max_dur": 8.0,
        "text": "Để săn được những con mồi khổng lồ như voi ma mút, các thợ săn phải phối hợp ăn ý, dùng mưu trí và bẫy hiểm để khuất phục dã thú."
    },
    {
        "id": "seg_05",
        "start_sec": 37.5,
        "max_dur": 9.0,
        "text": "Bước ngoặt vĩ đại xuất hiện khi con người tìm ra lửa – vũ khí xua đuổi bóng tối, sưởi ấm cơ thể và làm chín thức ăn giúp não bộ phát triển."
    },
    {
        "id": "seg_06",
        "start_sec": 47.0,
        "max_dur": 9.0,
        "text": "Bên đống lửa bập bùng, họ quây quần chia sẻ chiến lợi phẩm, khắc họa hình ảnh săn bắn lên vách hang – đặt nền móng cho bình minh nhân loại."
    }
]


def generate_audio(text: str, out_path: Path) -> Path:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    payload = {
        "text": text,
        "model_id": MODEL_ID,
        "language_code": "vi",
        "voice_settings": {
            "stability": 0.75,
            "similarity_boost": 0.85,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        out_path.write_bytes(resp.read())
    return out_path


def get_audio_duration(file_path: Path) -> float:
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return float(res.stdout.strip())


def main():
    work_dir = Path("assets/whiteboard/prehistoric_stoneage/audio_segments")
    work_dir.mkdir(parents=True, exist_ok=True)

    print("=== TẠO THUYẾT MINH ELEVENLABS (GIỌNG BRIAN - TIẾNG VIỆT) ===")
    clip_files = []

    for seg in SEGMENTS:
        sid = seg["id"]
        out_file = work_dir / f"{sid}.mp3"
        print(f"  [TTS] Đang tạo {sid}: \"{seg['text'][:38]}...\"")
        
        generate_audio(seg["text"], out_file)
        dur = get_audio_duration(out_file)
        print(f"        Thời lượng: {dur:.2f}s (Khung cho phép: {seg['max_dur']}s)")

        adj_file = work_dir / f"{sid}_adj.wav"
        if dur > seg["max_dur"]:
            speed = min(1.3, dur / (seg["max_dur"] - 0.3))
            print(f"        Tăng tốc nhẹ {speed:.2f}x để khớp khung thời gian...")
            subprocess.run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(out_file),
                "-filter:a", f"atempo={speed:.3f}",
                str(adj_file)
            ], check=True)
        else:
            subprocess.run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(out_file),
                str(adj_file)
            ], check=True)

        clip_files.append((adj_file, seg["start_sec"]))

    print("\n=== GHÉP TRACK ÂM THANH HOÀN CHỈNH 57 GIÂY ===")
    filter_inputs = []
    filter_parts = []
    
    for i, (clip_p, start_s) in enumerate(clip_files):
        filter_inputs.extend(["-i", str(clip_p)])
        delay_ms = int(round(start_s * 1000))
        filter_parts.append(f"[{i}]adelay={delay_ms}|{delay_ms}[a{i}]")

    mix_inputs = "".join(f"[a{i}]" for i in range(len(clip_files)))
    filter_parts.append(f"{mix_inputs}amix=inputs={len(clip_files)}:dropout_transition=0:normalize=0[aout]")
    filter_complex = ";".join(filter_parts)

    timeline_audio = work_dir / "stoneage_narration.wav"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        *filter_inputs,
        "-filter_complex", filter_complex,
        "-map", "[aout]",
        "-t", "57.0",
        str(timeline_audio)
    ]
    subprocess.run(cmd, check=True)
    print(f"[ok] Đã tạo track thuyết minh: {timeline_audio}")

    # Ghép âm thanh vào video
    input_video = Path("assets/whiteboard/prehistoric_stoneage/prehistoric_stoneage_video.mp4")
    final_output = Path("assets/whiteboard/prehistoric_stoneage/prehistoric_stoneage_voiceover_final.mp4")

    print(f"\n=== GHÉP TRACK THUYẾT MINH VÀO VIDEO ===")
    cmd_mux = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(input_video),
        "-i", str(timeline_audio),
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", "57.0",
        str(final_output)
    ]
    subprocess.run(cmd_mux, check=True)
    print(f"[ok] VIDEO HOÀN THIỆN: {final_output}")
    print(f"OUTPUT={final_output}")


if __name__ == "__main__":
    main()
