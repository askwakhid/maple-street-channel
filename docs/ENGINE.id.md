# PaperFold Studio

**Dari naskah (atau cukup topik) menjadi video animasi YouTube siap upload, langsung di komputer Anda.**

[English → README.md](README.md)

> **Untuk channel YouTube?** Bangun pasangan skill khusus channel, jangan memakai skill generik ini: `<channel>-scriptwriter` (naskah, dengan series bible channel) dan `<channel>-studio` (produksi, dengan brand dan suara channel). Lihat [`channels/README.id.md`](../channels/README.id.md). Pasangan maplestreet dibangun dengan `python3 tools/package.py channel maplestreet --install antigravity`.

Anda mengirim naskah `.txt`, atau cukup topiknya. PaperFold Studio membuat voice-over, adegan animasi, caption yang menyorot setiap kata yang diucapkan, musik, efek suara, dan watermark Anda. Lalu semua yang Anda butuhkan untuk YouTube dikumpulkan dalam satu folder: video, thumbnail, pilihan judul, deskripsi, komentar untuk di-pin, dan panduan upload langkah demi langkah.

Paket ini bekerja sebagai **skill** untuk AI agent (Google Antigravity, Claude Code, Claude.ai), dan juga sebagai alat command-line biasa.

---

## Daftar isi

1. [Mulai cepat](#1-mulai-cepat)
2. [Apa yang Anda dapat](#2-apa-yang-anda-dapat)
3. [Cara kerjanya](#3-cara-kerjanya)
4. [Kebutuhan](#4-kebutuhan)
5. [Memasang kebutuhan](#5-memasang-kebutuhan)
6. [Memasang Voicebox dan suara Kokoro (voice-over gratis)](#6-memasang-voicebox-dan-suara-kokoro-voice-over-gratis)
7. [Memasang skill](#7-memasang-skill)
8. [Persiapan pertama: channel Anda](#8-persiapan-pertama-channel-anda)
9. [Memilih suara channel](#9-memilih-suara-channel)
10. [Membuat video dengan AI agent](#10-membuat-video-dengan-ai-agent)
11. [Membuat video dengan satu perintah (tanpa AI)](#11-membuat-video-dengan-satu-perintah-tanpa-ai)
12. [Folder publish dan cara upload](#12-folder-publish-dan-cara-upload)
13. [File storyboard](#13-file-storyboard)
14. [Menulis naskah](#14-menulis-naskah)
15. [Daftar perintah](#15-daftar-perintah)
16. [Mengatasi masalah](#16-mengatasi-masalah)
17. [Batasan](#17-batasan)
18. [Struktur folder](#18-struktur-folder)
19. [Lisensi](#19-lisensi)

---

## 1. Mulai cepat

Sekali saja di komputer baru (detail di bagian 5–9):

```bash
# 1. alat (contoh macOS; Windows/Linux di bagian 5)
brew install python node ffmpeg
python3 -m pip install numpy
# 2. pasang aplikasi Voicebox dari https://github.com/jamiepine/voicebox (Releases), lalu buka
# 3. di folder PaperFold Studio: pasang skill untuk AI tool Anda
python3 tools/package.py channel maplestreet --install all
# 4. cek semuanya, unduh suara Kokoro, buat suara channel
python3 tools/pf.py doctor
python3 tools/voicebox.py setup
```

Setiap kali membuat video:

- **Dengan AI agent:** ketik `/maplestreet-studio buat video Shorts dari naskah.txt` (atau cukup beri topiknya).
- **Tanpa AI:** `python3 tools/pf.py make videos/topik-saya --script naskah.txt`

Hasilnya: `videos/topik-saya/publish/` berisi MP4, thumbnail, judul, deskripsi, komentar pin, dan `UPLOAD.md`.

## 2. Apa yang Anda dapat

| | |
|---|---|
| **Format** | YouTube Shorts / Reels / TikTok **9:16** (1080×1920) dan YouTube biasa **16:9** (1920×1080), 30 fps, H.264 + AAC |
| **Gaya** | **ink**: cerita stickman dengan tokoh *Sam*, panel data, catatan tulisan tangan (keuangan, psikologi, self-improvement). **paper**: paper-craft dengan maskot *Foldy* (sains, pengetahuan umum) |
| **Tema** | `ink`, `meadow`, `kraft`, `midnight`, `notebook`, `candy` |
| **Template adegan** | 23: hook, meet, budget, growth, phone, talk, icons, list, steps, cycle, versus, myth, fact, number, chart, timeline, cause, zoom, warning, bigtext, title, image, outro |
| **Ikon** | 93 ikon bawaan, plus PNG/SVG milik Anda |
| **Caption** | Dua baris; setiap kata disorot saat diucapkan |
| **Suara** | Gratis dan offline dengan Voicebox (suara Kokoro, dibuat kalimat per kalimat supaya sinkron tepat), atau file sendiri (ElevenLabs, rekaman) |
| **Audio** | Suara + musik latar orisinal + efek suara, loudness dinormalkan ke −14 LUFS (standar YouTube) |
| **Branding** | Logo, outro dengan tombol subscribe, watermark yang pindah pojok di setiap adegan, tulisan @handle samar yang melayang, dan tag di kartu caption (video yang di-reupload orang lain sulit di-crop atau diburamkan) |
| **Paket publish** | Video, 1–3 thumbnail/cover dengan judul besar, 3 pilihan judul, deskripsi lengkap dengan disclaimer dan hashtag, komentar pin, panduan upload dengan pengaturan dan jam tayang terbaik di zona waktu Anda |
| **Bantuan naskah** | Panduan menulis naskah untuk AI agent, plus kalkulator keuangan (`calc`) supaya angka selalu benar |
| **Kecepatan** | Di Mac uji kami (8 core): Shorts 50 detik selesai dari `.txt` sampai folder publish dalam sekitar 65 detik |

Input yang sama selalu menghasilkan video yang sama (deterministik).

## 3. Cara kerjanya

```
topik ──(AI menulis, Anda setujui)──┐
                                    ▼
naskah.txt ──► init ──► voice-over (Voicebox atau file Anda) + timing setiap kalimat dan kata
                    ──► lines.md (kalimat bernomor) + draft storyboard.json
storyboard.json + publish.json ──► make ──► check ► preview ► render ► publish/
```

Semua kode gambar, animasi, timing, render, dan pengemasan sudah jadi. Per video hanya tiga hal kecil yang berubah:
- **naskah**;
- **`storyboard.json`**: template adegan untuk setiap kalimat, ikon yang dipakai, dan pada kata apa sesuatu muncul;
- **`publish.json`**: judul, deskripsi, komentar pin, teks thumbnail.

Model AI murah (Gemini Flash/Lite, Claude Haiku) bisa mengerjakannya dengan andal karena mereka hanya mengisi formulir, bukan menulis kode animasi. Perintah `check` juga memberi tahu persis apa yang harus diperbaiki. Tanpa AI sama sekali, `make` membuat draft otomatis untuk kedua file itu.

## 4. Kebutuhan

| Apa | Versi | Untuk apa | Cara cek |
|---|---|---|---|
| **Python** | 3.9+ | semua tools | `python3 --version` (Windows: `python --version`) |
| **numpy** | versi terbaru mana pun | analisis dan mixing audio | `python3 -c "import numpy"` |
| **Node.js** | **22+** | mengendalikan browser yang menggambar frame | `node -v` |
| **ffmpeg** (termasuk ffprobe) | versi terbaru mana pun | membaca audio, membuat video dan thumbnail | `ffmpeg -version` |
| **Browser Chromium** | Google Chrome, Microsoft Edge, Brave, atau Chromium | menggambar setiap frame | cukup terpasang |
| **Aplikasi Voicebox** | 0.5+ | voice-over gratis (lewati jika selalu pakai file suara sendiri) | buka `http://127.0.0.1:17493` |
| **Model Kokoro** (di dalam Voicebox) | sekitar 300 MB | suara-suaranya | diunduh oleh `voicebox.py setup` |
| **AI agent** *(opsional)* | Antigravity, Claude Code, atau Claude.ai | menulis naskah, storyboard, dan teks publish | — |

Ruang disk: sekitar 2 MB untuk skill, 300 MB untuk Kokoro, dan kira-kira 25–40 MB per menit video jadi.
Tidak perlu paket npm, Remotion, atau layanan berbayar.

`python3 tools/pf.py doctor` mengecek semua isi tabel ini.

## 5. Memasang kebutuhan

### macOS (dengan [Homebrew](https://brew.sh))
```bash
brew install python node ffmpeg
```
```bash
python3 -m pip install numpy
```
Pasang Google Chrome kalau belum punya browser Chromium.

### Windows (PowerShell, winget)
```powershell
winget install Python.Python.3.12
winget install OpenJS.NodeJS.LTS
winget install Gyan.FFmpeg
python -m pip install numpy
```
Tutup lalu buka lagi terminalnya. Di Windows, ketik `python` setiap kali panduan ini menulis `python3`. Microsoft Edge bisa dipakai sebagai browser.

### Linux (Debian/Ubuntu)
```bash
sudo apt install python3 python3-pip ffmpeg
python3 -m pip install numpy
```
Node.js bawaan Ubuntu sering terlalu lama: pasang Node 22+ dari [nodejs.org](https://nodejs.org) atau NodeSource. Pasang juga Chrome atau Chromium.

### Cek
Di folder PaperFold Studio:
```bash
python3 tools/pf.py doctor
```
Setiap baris harus `OK` (baris Voicebox opsional).

## 6. Memasang Voicebox dan suara Kokoro (voice-over gratis)

Lewati bagian ini kalau Anda selalu memakai file suara sendiri.

1. **Unduh Voicebox** dari halaman Releases repository resminya: [github.com/jamiepine/voicebox](https://github.com/jamiepine/voicebox). Gratis, open-source, dan berjalan sepenuhnya di komputer Anda. Aplikasi siap pakai tersedia untuk macOS dan Windows; di Linux harus dibangun dari source (lihat README-nya).
2. **Buka aplikasi Voicebox.** Aplikasi ini menjalankan layanan lokal di `http://127.0.0.1:17493`. Biarkan terbuka setiap kali membuat video tanpa file suara sendiri.
3. **Unduh Kokoro dan buat suara channel** dengan satu perintah (di folder PaperFold Studio, atau folder skill yang terpasang):
   ```bash
   python3 tools/voicebox.py setup
   ```
   Saat pertama kali, perintah ini mengunduh model Kokoro (sekitar 300 MB) dan membuat profil suara sesuai `brand/brand.json → voice` (default: `Maple Street English - Narrator`, suara `am_liam`). Kokoro juga bisa diunduh manual di Voicebox → **Models**.
4. Cek:
   ```bash
   python3 tools/voicebox.py profiles
   ```

Suara Kokoro berlisensi Apache-2.0, jadi aman untuk channel yang dimonetisasi. Voice-over dibuat kalimat per kalimat dan disambung dengan jeda tetap, sehingga timing caption tepat.

## 7. Memasang skill

Di terminal, **di folder PaperFold Studio**:

| Dipakai di | Perintah | Terpasang di |
|---|---|---|
| **Google Antigravity**, semua workspace | `python3 tools/package.py channel maplestreet --install antigravity` | `~/.gemini/config/skills/maplestreet-studio` |
| Antigravity, satu workspace | `python3 tools/package.py channel maplestreet --install antigravity /path/ke/workspace` | `<workspace>/.agents/skills/maplestreet-studio` |
| **Claude Code** | `python3 tools/package.py channel maplestreet --install claude` | `~/.claude/skills/maplestreet-studio` |
| **Claude.ai** (web/desktop) | `python3 tools/package.py channel maplestreet --zip` | `dist/maplestreet-studio.skill + maplestreet-scriptwriter.skill` → unggah di Settings → Capabilities → Skills |

- **Pasangan skill channel** (`channels/`) juga bisa dipasang ke Tencent CodeBuddy (`~/.codebuddy/skills`), Tencent WorkBuddy AI (`~/.workbuddy-ai/skills`), dan folder bersama Agent Skills `~/.agents/skills` (Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, ...): `python3 tools/package.py channel <id> --install all`. Lihat `channels/README.id.md`, bagian 2.
- Di Antigravity, skill ini menjadi slash command **`/maplestreet-studio`** (tidak perlu file workflow terpisah). Mulai percakapan baru setelah memasang.
- **Update:** jalankan perintah yang sama lagi. Folder `brand/` yang terpasang tidak ditimpa, jadi pengaturan Anda aman. Untuk menerapkan pengaturan brand baru dari folder sumber, salin `brand/brand.json` ke folder yang terpasang secara manual.
- **Claude.ai** berjalan di sandbox cloud: di sana perlu Node 22+ dan Chromium, dan tidak bisa menjangkau Voicebox di komputer Anda, jadi sertakan file suara. Untuk alur lengkap, pakai Antigravity atau Claude Code.
- Keluarkan skill lama yang tugasnya mirip supaya agent tidak salah memilih.

## 8. Persiapan pertama: channel Anda

Lakukan sekali saja. Langkah inilah yang membuat video Anda berbeda dari pengguna lain. Semua pengaturan ada di `brand/brand.json` **pada skill yang terpasang** (daftar lengkap di [`brand/README.md`](../brand/README.md)).

| Bagian | Yang diatur |
|---|---|
| `channel`, `handle`, `initials`, `color`, `color2` | Nama channel, @handle, huruf untuk logo otomatis, warna brand |
| `theme` | Tampilan default: `ink` atau salah satu tema paper |
| `seed` | **Angka acak milik Anda**: mengubah dekorasi dan melodi musik |
| `mascot` | Warna tokoh (`hoodie` untuk Sam) |
| `watermark` | Cara watermark berpindah, transparansi, ukuran, @handle samar, tag di caption |
| `outro`, `music` | Teks penutup, gaya musik (`auto`, `lofi`, `playful`, `calm`, `curious`) |
| `voice` | Suara channel (diatur dengan `voicebox.py use`, bagian 9) |
| `youtube` | Kategori, audiens, playlist, hashtag, footer, disclaimer, jam tayang, aturan posting, bahasa `UPLOAD.md` (`id`/`en`) |
| `logo`, `tagline` | Warna logo dan tagline banner |

Lalu buat logo dan gambar channel:
```bash
python3 tools/logo.py
```
Hasilnya: `brand/logo.png` (dipakai di video), `logo-wordmark.png`, `youtube-profile.png` (800×800), `youtube-banner.png` (2560×1440), dan `youtube-watermark.png` (150×150, untuk YouTube Studio → Customization → Branding). Anda juga bisa memakai `brand/logo.png` buatan sendiri.

Pilih satu tema dan pakai terus: tampilan yang konsisten membuat penonton mengenali channel Anda.

## 9. Memilih suara channel

```bash
python3 tools/voicebox.py voices                                  # daftar suara Kokoro
python3 tools/voicebox.py audition --voices am_puck,af_heart,am_michael --script naskah.txt
python3 tools/voicebox.py use am_puck                             # jadikan suara channel
```

- `voices` menampilkan semua ID suara. `a` = Amerika, `b` = Inggris, `f` = wanita, `m` = pria (`af_heart` = wanita Amerika "Heart").
- `audition` membacakan kalimat-kalimat pertama naskah Anda dengan setiap suara, lalu menyimpan satu mp3 per suara di `voice-samples/`. Profil sementara dihapus lagi setelahnya.
- `use` menyimpan suara ke `brand.json → voice` dan membuat profilnya di Voicebox. Semua video baru memakai suara ini.

Perhatikan terutama cara angka diucapkan. Pakai satu suara untuk seluruh channel: suara itu menjadi "pembawa acara" channel Anda.

## 10. Membuat video dengan AI agent

1. Buka folder project (workspace) di Antigravity atau Claude Code. Buka aplikasi Voicebox.
2. Minta, misalnya:
   - **Punya naskah:** `/maplestreet-studio buat video Shorts dari naskah.txt`
   - **Dengan file suara sendiri:** `/maplestreet-studio buat video 16:9 dari naskah.txt dengan voice.mp3`
   - **Cuma topik:** `/maplestreet-studio buat Shorts tentang kenapa orang kehabisan uang sebelum gajian`
3. Kalau hanya memberi topik, agent menulis naskah dengan panduan bawaan dan `calc` untuk setiap angka, lalu **menunjukkannya ke Anda dan menunggu persetujuan**. Setujui atau minta perubahan.
4. Setelah itu agent membuat suara, menulis storyboard dan teks publish, menjalankan `make`, mengecek preview dan thumbnail, lalu memberi tahu lokasi folder publish.

Semua file untuk satu video ada di **satu folder per topik**, dinamai sesuai topiknya (`videos/subscription-creep`; versi baru: `videos/subscription-creep-v2`). Nama generik seperti `v3` atau `test`, dan naskah yang disimpan di samping folder, ditolak oleh tool:

```
videos/topik-saya/
  script.txt        naskah (edit yang ini)
  input/            voice-over dan salinan naskah yang dipakai untuk membuatnya
  lines.md          kalimat bernomor beserta waktunya
  storyboard.json   adegan
  publish.json      judul, deskripsi, komentar pin, teks thumbnail
  build/            file kerja (preview.jpg)
  out/              MP4 hasil render
  publish/          ← semua yang di-upload (lihat bagian 12)
```

Untuk mengubah sesuatu, cukup bilang, misalnya, "adegan 4 pakai panel anggaran" atau "judulnya dipersingkat". Agent akan mengedit lalu menjalankan `make` lagi. Suaranya dipakai ulang, jadi prosesnya cepat.

### Contoh permintaan

Bisa ditulis dalam bahasa apa pun. Agent menerjemahkan kata-kata Anda ke pengaturan di bawah ini.

**Format.** Kalau format tidak disebut, hasilnya Shorts (9:16).

| Anda menulis | Hasil |
|---|---|
| "Shorts", "vertikal", "Reels", "TikTok", "9:16" | `--format shorts` (1080×1920) |
| "16:9", "horizontal", "landscape", "video panjang", "video YouTube biasa" | `--format long` (1920×1080) |

**Memulai video**
```
/maplestreet-studio buat video Shorts dari naskah.txt
/maplestreet-studio buat video 16:9 dari naskah.txt
/maplestreet-studio buat video Shorts dari naskah.txt dengan voice.mp3
/maplestreet-studio buat Shorts tentang kenapa orang kehabisan uang sebelum gajian
/maplestreet-studio buat video 16:9 berdurasi 6 menit tentang cara melunasi utang kartu kredit
/maplestreet-studio buat Shorts tentang bunga majemuk, tema kraft
/maplestreet-studio buat Shorts tentang anggaran 50/30/20, langsung buat saja (tanpa tanya-tanya)
```

**Dua format dari satu topik** (jadi dua project; naskah 16:9 berisi 3–5 bab, dan Shorts-nya menjadi cuplikan dari salah satu bab)
```
/maplestreet-studio buat video 16:9 dan versi Shorts tentang dana darurat
```

**Tahap naskah** (mode topik)
```
hook-nya dibuat lebih kuat
persingkat, di bawah 45 detik
pakai $2,500 per bulan, bukan $3,200
tambahkan satu kalimat tentang tabungan berbunga tinggi
OK, naskahnya disetujui
```

**Setelah versi pertama jadi**
```
adegan 4 pakai panel anggaran
adegan pembuka pakai adegan ponsel
label "Everything else" terlalu panjang, ganti jadi "Other"
judulnya dipersingkat dan dibuat jadi pertanyaan
thumbnail pakai adegan 7 dengan teks "$21,000 for free?"
komentar pin diganti jadi pertanyaan tentang berapa persen mereka menabung
render ulang versi 16:9
```

**Suara dan channel**
```
tampilkan daftar suara yang tersedia
buat sampel suara am_puck, af_heart, dan am_michael dari naskah.txt
pakai af_heart sebagai suara channel
watermark-nya diam di pojok kanan atas saja
buat ulang logo dan banner YouTube
```

Agent tidak pernah meng-upload apa pun; hasilnya selalu berupa folder `publish/`.

## 11. Membuat video dengan satu perintah (tanpa AI)

```bash
python3 tools/pf.py make videos/topik-saya --script naskah.txt
```
Opsi: `--format long` (16:9), `--voice voice.mp3` (file suara sendiri), `--theme kraft`, `--music lagu.mp3`.

Variasi yang sering dipakai:
```bash
python3 tools/pf.py make videos/dana-darurat --script naskah.txt                            # Shorts, suara Voicebox
python3 tools/pf.py make videos/dana-darurat-panjang --script naskah-panjang.txt --format long  # 16:9
python3 tools/pf.py make videos/topik-saya --script naskah.txt --voice voice.mp3          # file suara sendiri
python3 tools/pf.py make videos/topik-saya --script naskah.txt --theme kraft --music lagu.mp3
python3 tools/pf.py make videos/topik-saya                  # setelah mengedit script.txt, storyboard.json, atau publish.json (suara dipakai ulang kecuali script.txt berubah)
python3 tools/pf.py make videos/topik-saya --script naskah.txt --force   # buat ulang suara dan draft storyboard otomatis
python3 tools/pf.py publish videos/topik-saya               # hanya membuat ulang folder publish (setelah mengedit publish.json)
```

Naskah disalin ke `videos/topik-saya/script.txt`, jadi semua file video tetap di folder itu. Lain kali cukup edit file itu lalu jalankan `python3 tools/pf.py make videos/topik-saya` (perubahan terdeteksi dan suara dibuat ulang).

`make` menjalankan semuanya: suara (Voicebox) → timing → draft storyboard otomatis → check → preview → render → folder publish. Tanpa AI, storyboard dan teks publish berupa draft otomatis. Hasilnya sudah jalan, tapi versi yang ditulis tangan (atau oleh AI) lebih bagus: edit `storyboard.json` dan `publish.json`, lalu jalankan `make videos/topik-saya` lagi.

Kalau dijalankan dari workspace dengan skill yang terpasang, ganti `tools/pf.py` dengan path lengkapnya, misalnya `python3 ~/.gemini/config/skills/maplestreet-studio/tools/pf.py make ...`.

## 12. Folder publish dan cara upload

`videos/<nama>/publish/` berisi:

| File | Kegunaan |
|---|---|
| `<nama>.mp4` | video |
| `cover-9x16.jpg` (+`-2`, `-3`) | Shorts: cover / acuan frame; juga untuk TikTok dan Reels |
| `thumbnail.jpg` (+`-2`, `-3`) | Video panjang: thumbnail 1280×720; tambahan untuk fitur Test & compare YouTube |
| `title.txt` | 3 pilihan judul |
| `description.txt` | deskripsi lengkap: isi, hitungan/sumber, footer channel, disclaimer, hashtag |
| `pinned-comment.txt` | komentar pertama untuk diposting lalu di-pin |
| `UPLOAD.md` | langkah demi langkah: apa yang dicek, semua pengaturan upload, dan jam tayang yang sudah dikonversi ke zona waktu Anda (termasuk perubahan jam musim panas) |

Buka `UPLOAD.md` dan ikuti isinya. Catatan:
- YouTube tidak menerima gambar thumbnail kustom untuk Shorts di desktop; `UPLOAD.md` menyebutkan detik persis frame cover yang bisa dipilih lewat aplikasi YouTube di HP.
- PaperFold Studio tidak pernah meng-upload apa pun sendiri. Kendali channel tetap di tangan Anda.
- Selalu tonton videonya sekali dengan suara sebelum upload.

## 13. File storyboard

`lines.md` berisi kalimat bernomor. `storyboard.json` mengelompokkannya menjadi adegan:

```json
{
  "format": "shorts",
  "theme": "ink",
  "scenes": [
    { "lines": [1, 2], "type": "phone", "items": [
        { "icon": "paycheck", "title": "Payday", "text": "+$3,200", "at": "$3,200" },
        { "icon": "bank", "title": "Bank alert", "text": "Balance: $0.00", "at": "zero", "color": "#FF4D4D" } ] },
    { "lines": [3], "type": "meet", "title": "Meet Sam.", "subtitle": "24 · first job" },
    { "lines": [4], "type": "outro", "text": "New money story every week" }
  ]
}
```

Aturannya (dicek oleh `check`, dan setiap kesalahan dijelaskan):
- setiap nomor baris dipakai tepat sekali, berurutan; `lines` dalam satu adegan harus berurutan;
- `type` salah satu dari 23 template; ikon diambil dari daftar ikon (`python3 tools/pf.py catalog`);
- `"at"` adalah kata yang disalin dari kalimat adegan itu: visualnya muncul saat kata itu diucapkan (tidak pernah ditulis dalam detik);
- jangan menulis `start`, `end`, atau `t` (dihitung otomatis);
- opsional `"tint": "alert" | "calm" | "happy" | "sad"` per adegan, dan `"transition": "fold" | "slide" | "torn" | "ink"` di tingkat atas.

Semua jenis adegan beserta contohnya: [`reference/STORYBOARD.md`](reference/STORYBOARD.md). Teks publish: [`reference/PUBLISH.md`](reference/PUBLISH.md). Contoh lengkap: `reference/example-ink-storyboard.json`.
Ikon sendiri: taruh PNG/SVG di `brand/icons/` atau `videos/<nama>/images/`, lalu pakai `"icon": "img:file.png"`.

## 14. Menulis naskah

Bawa naskah sendiri, atau biarkan agent menulisnya dari topik dengan panduan the maplestreet-scriptwriter skill. Apa pun caranya:

- **Satu kalimat = satu ide**, maksimal sekitar 20 kata. Akhiri dengan `.` `?` atau `!`; baris baru juga memulai kalimat baru.
- **Hook di 2 detik pertama:** masalah atau angka yang mengejutkan, bukan perkenalan.
- **Tulis angka sebagai digit** (`$3,200`, `10%`), dan cek dengan `calc`:
  ```bash
  python3 tools/pf.py calc save --monthly 320 --rate 4 --years 5
  python3 tools/pf.py calc loan --amount 2000 --rate 24 --months 12
  python3 tools/pf.py calc percent 10 3200
  ```
- **Durasi:** Shorts 35–55 detik (90–140 kata); video panjang 5–8 menit.
- **Fakta:** alat ini tidak pernah mengubah naskah Anda. Untuk topik keuangan atau kesehatan, setiap angka butuh sumber atau hitungan, dan disclaimer otomatis ditambahkan ke deskripsi.
- **Pakai file suara sendiri?** Beri jeda jelas antarkalimat (Voicebox melakukannya otomatis).

## 15. Daftar perintah

Jalankan perintah apa pun dengan `-h` untuk detailnya. Path relatif terhadap folder PaperFold Studio (atau folder skill yang terpasang).

**`tools/pf.py`**

| Perintah | Fungsinya |
|---|---|
| `doctor` | Mengecek Python, numpy, Node, ffmpeg, browser, dan Voicebox |
| `catalog` | Menampilkan jenis adegan (beserta field-nya) dan nama ikon |
| `make PROJECT [--script FILE] [--voice FILE] [--format shorts\|long] [--theme T] [--music FILE] [--no-preview] [--force] [--accept-warnings]` | **All-in-one**: init (kalau naskah baru atau berubah) → check → preview → render → publish. Berhenti sebelum render selama masih ada butir `MUST FIX` |
| `init PROJECT --script FILE [--voice FILE] [--format ...] [--theme T] [--music FILE] [--force]` | Suara (Voicebox kalau tanpa `--voice`), timing, `lines.md`, draft `storyboard.json` (yang sudah ada tidak ditimpa, kecuali dengan `--force`) |
| `check PROJECT` | Memvalidasi storyboard dan kualitas video. Menampilkan error, butir `MUST FIX` (menghentikan render/publish), dan peringatan, lalu `OK` atau `NOT READY` |
| `preview PROJECT` | Satu gambar per adegan → `build/preview.jpg` |
| `render PROJECT [--cpu eco\|balanced\|max\|N] [--workers N] [--accept-warnings]` | Render MP4 ke `out/`; `--cpu` membatasi pemakaian prosesor (lihat di bawah) |
| `publish PROJECT [--accept-warnings]` | Membuat `publish/` dari `publish.json` (kalau belum ada, dibuatkan draft) |
| `calc save --monthly M --rate R --years Y [--start S]` | Pertumbuhan tabungan, bunga majemuk bulanan |
| `calc loan --amount A --rate R --months N` | Cicilan pinjaman / kartu kredit dan total bunganya |
| `calc percent P DARI` · `calc share BAGIAN TOTAL` | Persen dari suatu angka · berapa persen sebuah bagian |

### Fitur kualitas (otomatis)

| Fitur | Fungsinya | Pengaturan |
|---|---|---|
| Output lebih tajam | render 1440p (1440×2560 / 2560×1440) supaya garis dan teks tetap tajam setelah dikompres YouTube | `brand.json → render.resolution` (`1080p`, `1440p`, `2160p`) atau `--resolution` |
| Olah suara | filter dengung, kehangatan, kejelasan, de-esser, dan kompresi ringan pada voice-over | `brand.json → voice_polish` (true/false) |
| Musik | musik buatan kode diberi kesan stereo + reverb; lagu Anda di `assets/music/` dipakai bergantian per video dan diulang dengan crossfade | `brand.json → music` |
| Gerak | kamera bergerak pelan di setiap adegan, squash & stretch saat elemen muncul, mulut tokoh mengikuti volume suara | selalu aktif |
| Timing | waktu kata dihitung dari suku kata yang diucapkan ("$3,200" = "three thousand two hundred dollars") | selalu aktif |
| Cek pelafalan | voice-over ditranskripsi dan angka yang tidak diucapkan sesuai naskah ditandai (MUST FIX) | juga memastikan nama channel terdengar; perbaiki pelafalan nama lewat `brand.json → voice.pronounce` (`{"Haddad": "ha-dad"}`: caption tetap memakai ejaan asli). Butuh model Whisper: Voicebox → Models → Whisper (base atau small), atau `whisper-cli` dengan `PF_WHISPER_MODEL` (sekaligus memberi timing kata yang tepat). Dijalankan oleh `init`; atau `python3 tools/speech.py check videos/<topik>` |
| QA akhir | gambar diam lebih dari 3 detik, frame hitam, loudness (−14 LUFS), puncak audio, jumlah frame; ditampilkan setelah render dan di `UPLOAD.md` | selalu aktif |
| Khusus 16:9 | chapter YouTube dari `"chapter"` di storyboard; outro 8 detik untuk elemen end screen | storyboard |
| Cek di HP | `phone-preview-*.png` menampilkan thumbnail seukuran tampilan feed | selalu aktif |

### Pemakaian CPU

Render menggambar setiap frame di Chrome tanpa jendela, lalu meng-encode-nya dengan ffmpeg. Secara default, prosesnya menyisakan ruang untuk aplikasi Anda yang lain:

| `--cpu` | Fungsinya | Contoh (Mac 8 core, Shorts 53 detik) |
|---|---|---|
| `balanced` (default) | prioritas rendah + sekitar separuh prosesor | render ±62 detik, CPU rata-rata ±285% |
| `eco` | prioritas rendah + sekitar seperempat prosesor (dijeda-lanjutkan dalam potongan singkat) | ±113 detik, ±135% |
| `max` | semua core, prioritas normal (paling cepat saat komputer sedang tidak dipakai) | ±45–54 detik, ±350–400% |
| angka, misalnya `30` | kira-kira sebesar persen itu | |

Pakai di `make` atau `render` (`python3 tools/pf.py make videos/<topik> --cpu eco`), atau atur sekali untuk semua proses dengan variabel lingkungan `PF_CPU=eco` (misalnya di `~/.zshrc`). Di Windows, yang diturunkan hanya prioritasnya (tanpa jeda-lanjut). Aplikasi Voicebox memakai sekitar satu core saat membuat voice-over.

**`tools/voicebox.py`**

| Perintah | Fungsinya |
|---|---|
| `setup` | Mengunduh model kalau perlu dan membuat profil suara channel |
| `voices [--engine kokoro]` | Menampilkan suara preset |
| `audition --voices a,b,c [--script FILE] [--out FOLDER]` | Satu sampel mp3 per suara |
| `use ID_SUARA [--name NAMA]` | Menetapkan suara channel di `brand.json` dan membuat profilnya |
| `profiles` | Menampilkan profil suara di Voicebox |
| `make --script FILE --out FILE [--profile NAMA] [--gap DETIK] [--seed N]` | Membuat voice-over saja |

**`tools/logo.py`**: logo, foto profil, banner, dan watermark YouTube dari `brand.json`.
**`tools/package.py channel maplestreet [--install TARGET] [--zip]`**: membuat paket atau memasang skill.

Variabel lingkungan: `PF_CHROME` (lokasi browser kalau tidak ditemukan), `VOICEBOX_URL` (kalau Voicebox tidak berada di `http://127.0.0.1:17493`).

## 16. Mengatasi masalah

| Pesan atau gejala | Solusi |
|---|---|
| `numpy is missing` | `python3 -m pip install numpy` |
| `OLD node` / `need 22+` | Pasang Node.js 22 atau lebih baru |
| `MISSING browser` / `Chrome/Edge/Chromium not found` | Pasang Chrome, atau set `PF_CHROME=/path/ke/chrome` |
| `Voicebox not running` / `cannot reach Voicebox` | Buka aplikasi Voicebox, atau pakai `--voice file-anda.mp3`, atau set `VOICEBOX_URL` |
| `download of "kokoro" stopped` | Buka Voicebox → Models, unduh Kokoro di sana, lalu `voicebox.py setup` |
| `profile "..." not found` | `python3 tools/voicebox.py setup` |
| `WARNING: found only N pauses for M sentences` | File suara Anda kurang jeda antarkalimat, jadi timing diperkirakan. Pakai Voicebox, atau ekspor ulang dengan jeda yang lebih jelas |
| `STORYBOARD HAS ERRORS` / `publish.json HAS ERRORS` | Perbaiki persis seperti yang tertulis di setiap baris, lalu jalankan perintahnya lagi |
| `MUST FIX: ...` / `NOT READY` / `STOPPED before rendering` | Masalah kualitas yang membuat video lemah (detik pertama kosong, adegan lebih dari 12 detik, angka sen dibacakan, angka yang tidak diucapkan narator, warna teks tak terbaca). Perbaiki di `script.txt` atau `storyboard.json`. Untuk tetap publish, tambahkan `--accept-warnings` sendiri |
| `folder name "v3" does not say what the video is about` | Beri nama folder sesuai topik: `videos/subscription-creep`, dan `videos/subscription-creep-v3` untuk versi baru |
| `... is saved outside its topic folder` / `found videos/NAME-script.txt outside the topic folder` | Simpan naskah hanya sebagai `videos/NAMA/script.txt`: pindahkan ke sana (atau hapus duplikatnya) |
| `... is not valid JSON: line X col Y` | Ada koma, tanda kutip, atau kurung yang hilang di posisi itu |
| `at="..." not found in its lines` (peringatan) | Pakai kata yang benar-benar ada di kalimat adegan itu |
| `... not found. Run render first.` | Jalankan `make` (atau `render`) sebelum `publish` |
| Angka diucapkan salah | Tulis dengan cara lain di naskah (misalnya `3,200 dollars`), atau pilih suara lain |
| Ada yang bertumpuk di preview atau thumbnail | Persingkat teks, kurangi item, pilih jenis adegan lain, atau pilih adegan lain untuk thumbnail |
| Render lambat | Pakai `--cpu max` saat komputer sedang tidak dipakai; tutup aplikasi berat |
| Komputer jadi lambat / kipas berisik saat render | `--cpu eco` (atau `export PF_CPU=eco` sekali saja) |
| Agent memilih skill yang salah | Ketik `/maplestreet-studio` secara eksplisit, keluarkan skill lama yang mirip |

## 17. Batasan

- Timing per kata untuk file suara sendiri diperkirakan dari jeda (timing per kalimat akurat). Suara dari Voicebox memberi timing kalimat yang tepat.
- Adegan berupa template: Anda bisa mengganti kata, ikon, warna, dan urutan, tapi tidak gambarnya.
- Draft otomatis (tanpa AI) sudah berfungsi tapi lebih polos dibanding storyboard yang ditulis AI atau ditulis tangan.
- Alat ini tidak bisa menilai kualitas audio: dengarkan setiap video sekali.
- Sandbox cloud Claude.ai mungkin tidak punya Node 22+/Chromium dan tidak bisa menjangkau Voicebox lokal.
- Musik yang dibuat otomatis sederhana; pakai lagu bebas royalti sendiri untuk suara yang lebih kaya.

## 18. Struktur folder

```
README.md / README.id.md panduan ini
MONETISASI.md            panduan pertumbuhan dan monetisasi YouTube
brand/                   brand.json, file logo, brand/icons/   ← pengaturan Anda
themes/                  6 tema
engine/                  mesin render (jangan diedit per video)
tools/pf.py              alat utama (make, init, check, preview, render, publish, calc)
tools/voicebox.py        suara: setup, voices, audition, use, make
tools/logo.py            logo / banner / foto profil
tools/package.py         membuat paket dan memasang skill
reference/               STORYBOARD.md, PUBLISH.md, SCRIPT.md, contoh
assets/fonts, assets/music
```

## 19. Lisensi

- Font Fredoka, Nunito, Space Grotesk, Caveat: SIL Open Font License (`assets/fonts/OFL-LICENSE.txt`).
- Ikon, tokoh, musik, dan efek suara dibuat oleh kode di paket ini.
- Voicebox open-source ([github.com/jamiepine/voicebox](https://github.com/jamiepine/voicebox)); suara Kokoro berlisensi Apache-2.0. Cek lisensi suara lain sebelum mempublikasikan video.
- Jangan meng-clone suara siapa pun tanpa izin mereka.
