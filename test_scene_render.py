import os
import win32com.client
import subprocess

FFMPEG = r"C:\Users\ULS\AppData\Local\Programs\Python\Python312\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
TEMP_DIR = r"C:\Users\ULS\Desktop\ERP for Egypt\video_temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# 1. Test TTS audio generation
speaker = win32com.client.Dispatch("SAPI.SpVoice")
# Set voice to David or Zira
for i in range(speaker.GetVoices().Count):
    v = speaker.GetVoices().Item(i)
    if "David" in v.GetDescription():
        speaker.Voice = v
        break

speaker.Rate = 0 # Normal speaking rate

text = "Welcome to FactoryFlow ERP. An intelligent Make-to-Order Manufacturing ERP designed specifically for Egyptian industrial factories."
wav_path = os.path.join(TEMP_DIR, "scene1_test.wav")

filestream = win32com.client.Dispatch("SAPI.SpFileStream")
filestream.Open(wav_path, 3, False) # 3 = SSFMCreateForWrite
speaker.AudioOutputStream = filestream
speaker.Speak(text)
filestream.Close()

print(f"Audio generated: {wav_path} ({os.path.getsize(wav_path)} bytes)")

# 2. Get audio duration using ffprobe or ffmpeg
cmd = [
    FFMPEG,
    "-i", wav_path,
    "-f", "null",
    "-"
]
r = subprocess.run(cmd, capture_output=True, text=True)
import re
duration_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", r.stderr)
if duration_match:
    h, m, s = duration_match.groups()
    duration = int(h) * 3600 + int(m) * 60 + float(s)
    print(f"Audio Duration: {duration:.2f} seconds")
else:
    print("Could not determine duration, default to 10s")
    duration = 10.0

# 3. Test video rendering with image + audio
img_path = r"C:\Users\ULS\Desktop\ERP for Egypt\FactoryFlow_ERP_Screenshots\01_intro_title.png"
out_video = os.path.join(TEMP_DIR, "scene1_test.mp4")

# Pad duration by 1.0s for natural transition
total_sec = duration + 1.0

cmd_vid = [
    FFMPEG,
    "-y",
    "-loop", "1",
    "-i", img_path,
    "-i", wav_path,
    "-c:v", "libx264",
    "-tune", "stillimage",
    "-c:a", "aac",
    "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    "-t", str(total_sec),
    "-shortest",
    out_video
]

r_vid = subprocess.run(cmd_vid, capture_output=True, text=True)
print(f"Video rendered: {out_video} ({os.path.getsize(out_video)} bytes)")
print("Test completed successfully!")
