#!/usr/bin/env python3
"""
Tạo giọng đọc thuyết minh tiếng Việt chuẩn qua ElevenLabs (giọng Adam)
và ghép chính xác vào video hoạt họa theo từng mốc thời gian.
"""
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from pathlib import Path

API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
if not API_KEY:
    raise EnvironmentError("ELEVENLABS_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env")

# Brian (nPczCjzI2devNBz1zQrb) - Giọng thuyết minh tài liệu trầm ấm, rõ chữ và chuẩn xác nhất
VOICE_ID = "nPczCjzI2devNBz1zQrb"
MODEL_ID = "eleven_turbo_v2_5"

SEGMENTS = [
    {
        "id": "seg_01",
        "start_sec": 0.5,
        "max_dur": 8.0,
        "text": "Sinh ra trong một gia đình lao động nghèo, Trấn Thành từng phải bươn chải từ sớm và thậm chí bị đuổi học vì không đủ tiền đóng học phí."
    },
    {
        "id": "seg_02",
        "start_sec": 9.0,
        "max_dur": 8.5,
        "text": "Không bỏ cuộc, với đam mê và chiếc micro trên tay, giải Ba Én Vàng 2006 đã mở ra cánh cửa giúp anh bước chân vào con đường nghệ thuật."
    },
    {
        "id": "seg_03",
        "start_sec": 18.0,
        "max_dur": 9.0,
        "text": "Bằng sự duyên dáng và hoạt ngôn, anh nhanh chóng vụt sáng thành một MC Quốc dân phủ sóng khắp các chương trình truyền hình ăn khách nhất."
    },
    {
        "id": "seg_04",
        "start_sec": 29.0,
        "max_dur": 8.0,
        "text": "Không dừng lại ở vai trò MC, Trấn Thành bước lên chiếc ghế đạo diễn điện ảnh với những câu chuyện chạm đến trái tim người xem."
    },
    {
        "id": "seg_05",
        "start_sec": 37.5,
        "max_dur": 9.5,
        "text": "Bộ ba tác phẩm Bố Già, Nhà Bà Nữ và Mai đã xô đổ mọi kỷ lục phòng vé, đưa anh trở thành Đạo diễn nghìn tỷ đầu tiên của điện ảnh Việt."
    },
    {
        "id": "seg_06",
        "start_sec": 47.5,
        "max_dur": 8.5,
        "text": "Một hành trình rực rỡ từ con số không, trọn vẹn bên người bạn đời Hari Won và sự ghi nhận của hàng triệu khán giả."
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
        audio_data = resp.read()
        out_path.write_bytes(audio_data)
    return out_path


def get_audio_duration(file_path: Path) -> float:
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return float(res.stdout.strip())


def main():
    work_dir = Path("assets/whiteboard/tran_thanh/audio_segments")
    work_dir.mkdir(parents=True, exist_ok=True)

    print("=== BẮT ĐẦU TẠO GIỌNG ĐỌC ELEVENLABS (ADAM) ===")
    clip_files = []

    for seg in SEGMENTS:
        seg_id = seg["id"]
        out_file = work_dir / f"{seg_id}.mp3"
        print(f"  [TTS] Đang tạo {seg_id} với Turbo v2.5 (Tiếng Việt): \"{seg['text'][:35]}...\"")
        
        # Luôn tạo mới để đảm bảo model tiếng Việt chuẩn
        generate_audio(seg["text"], out_file)
        
        dur = get_audio_duration(out_file)
        print(f"        Thời lượng gốc: {dur:.2f}s (Khung tối đa: {seg['max_dur']}s)")

        # Nếu đoạn đọc dài hơn khung thời gian cho phép, tăng tốc nhẹ bằng atempo
        adjusted_file = work_dir / f"{seg_id}_adj.wav"
        if dur > seg["max_dur"]:
            speed = min(1.3, dur / (seg["max_dur"] - 0.3))
            print(f"        Tự động tăng tốc nhẹ {speed:.2f}x để khớp thời gian...")
            subprocess.run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(out_file),
                "-filter:a", f"atempo={speed:.3f}",
                str(adjusted_file)
            ], check=True)
        else:
            subprocess.run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(out_file),
                str(adjusted_file)
            ], check=True)

        clip_files.append((adjusted_file, seg["start_sec"]))

    print("\n=== GHÉP CÁC ĐOẠN ÂM THANH THEO TIMELINE 57 GIÂY ===")
    # Dùng ffmpeg amerge / adelay để đặt chính xác từng câu vào đúng mili-giây
    filter_inputs = []
    filter_parts = []
    
    for i, (clip_p, start_s) in enumerate(clip_files):
        filter_inputs.extend(["-i", str(clip_p)])
        delay_ms = int(round(start_s * 1000))
        filter_parts.append(f"[{i}]adelay={delay_ms}|{delay_ms}[a{i}]")

    mix_inputs = "".join(f"[a{i}]" for i in range(len(clip_files)))
    filter_parts.append(f"{mix_inputs}amix=inputs={len(clip_files)}:dropout_transition=0:normalize=0[aout]")
    filter_complex = ";".join(filter_parts)

    timeline_audio = work_dir / "narration_timeline.wav"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        *filter_inputs,
        "-filter_complex", filter_complex,
        "-map", "[aout]",
        "-t", "57.0",
        str(timeline_audio)
    ]
    subprocess.run(cmd, check=True)
    print(f"[ok] Đã tạo track thuyết minh hoàn chỉnh: {timeline_audio}")

    # Ghép âm thanh vào video hoàn chỉnh
    input_video = Path("assets/whiteboard/tran_thanh/tran_thanh_complete_video.mp4")
    final_output = Path("assets/whiteboard/tran_thanh/tran_thanh_voiceover_final.mp4")

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
    print(f"[ok] VIDEO HOÀN TẤT: {final_output}")
    print(f"OUTPUT={final_output}")


if __name__ == "__main__":
    main()
