# Brand: buat channel Anda beda dari pembeli lain

Edit `brand.json` SEKALI. Semua video setelahnya otomatis memakai identitas ini.

| Kunci | Fungsi | Contoh |
|---|---|---|
| `channel` | Nama channel (tampil di outro) | `"Curious Paper"` |
| `handle` | @handle (tampil di watermark) | `"@curiouspaper"` |
| `initials` | 1-3 huruf untuk logo otomatis | `"CP"` |
| `color`, `color2` | Warna utama & warna teks logo/watermark | `"#2F7FB8"`, `"#FFFFFF"` |
| `theme` | Tema default: `ink` (cerita stickman) atau paper: `meadow` `kraft` `midnight` `notebook` `candy` | `"midnight"` |
| `seed` | Angka bebas. Mengubah posisi awan/bukit/dekorasi DAN melodi musik. Pakai angka unik Anda | `4821` |
| `mascot` | Paper: `body`, `fold`, `limb`, `cheek`, `scarf`. Ink (Sam): `hoodie`. `name` untuk catatan | `"hoodie": "#19C37D"` |
| `watermark.enabled` | Tampilkan watermark | `true` |
| `watermark.move` | `scene` = pindah tiap ganti adegan (default), `timer` = pindah tiap `hop_every` detik, `static` = diam di `position` | `"scene"` |
| `watermark.spots` | (opsional) daftar posisi yang boleh dipakai. Shorts: `top-left` `top-right` `low-left` `low-center`. Long: `top-left` `top-right` `mid-left` `mid-right` `low-left` `low-right` | `["top-left","low-center"]` |
| `watermark.opacity` / `size` | Transparansi 0-1 / ukuran logo px | `0.92` / `96` |
| `watermark.show_handle` / `subtitle` | Pita @handle di samping logo / teks kecil di bawahnya | `true` / `"on YouTube"` |
| `watermark.ghost` | Tulisan @handle samar yang melayang di atas gambar (anti-crop/blur) | `{"enabled": true, "opacity": 0.08}` |
| `watermark.caption_tag` | @handle kecil di dalam kartu caption | `true` |
| `outro.cta` | Kalimat ajakan di akhir video | `"Follow for daily science!"` |
| `outro.button` / `subscribed` | Teks tombol | `"SUBSCRIBE"` / `"SUBSCRIBED"` |
| `music` | `auto` (ikut tema), `playful`, `calm`, `curious`, `lofi` | `"curious"` |
| `progress_bar` | Bar progres di bawah (khusus format long) | `true` |

## Logo
- **Cara cepat:** `python3 tools/logo.py` membuat `logo.png`, `logo-wordmark.png`, `youtube-profile.png` (800x800), `youtube-banner.png` (2560x1440), dan `youtube-watermark.png` (150x150) dari `brand.json` (bagian `logo` untuk warna, `tagline` untuk banner).
- Taruh file **`brand/logo.png`** (persegi, latar transparan, minimal 512x512). Otomatis dipakai di watermark dan outro. `logo.svg` / `logo.webp` juga bisa.
- Tanpa file logo, logo dibuat dari kode (lingkaran warna `color` + `initials`), jadi tetap ringan.

## Ikon sendiri
Taruh PNG/SVG di `brand/icons/` lalu pakai di storyboard: `"icon": "img:namafile.png"`.

## Suara (voice-over)
Bagian `voice` di `brand.json` menentukan suara tetap channel:

| Kunci | Fungsi | Contoh |
|---|---|---|
| `provider` | `voicebox` = suara dibuat di aplikasi Voicebox lokal saat `init` tanpa `--voice` | `"voicebox"` |
| `profile` | Nama profil di Voicebox | `"Maple Street English - Narrator"` |
| `engine` / `preset_voice_id` | Model dan suara preset (dipakai `voicebox.py setup` untuk membuat ulang profil) | `"kokoro"` / `"am_puck"` |
| `gap` | Jeda antarkalimat (detik) | `0.35` |
| `seed` | Angka tetap supaya hasil suara konsisten | `7` |
| `pronounce` | Cara mengucapkan kata tertentu. Caption tetap memakai ejaan aslinya, hanya suaranya yang berubah | `{"Haddad": "ha-dad"}` |

Perintah: `python3 tools/voicebox.py profiles` (lihat profil), `python3 tools/voicebox.py setup` (buat profil jika hilang), `python3 tools/voicebox.py make --script naskah.txt --out voice.mp3`. Tetap bisa memakai file suara sendiri (ElevenLabs, rekaman) dengan `--voice`.

### Banyak karakter (opsional)
Channel dialog (misalnya Maple Street) menambahkan `voice.cast`: satu entri per karakter, dengan `preset_voice_id` (suara Kokoro), `color` (warna label caption dan baju), `look` (`hair`: messy|short|long|bun|ponytail|curly|bald, `hair_color`, `items`: apron|glasses|coat|cardigan|vest|scarf|cap|headphones|backpack|pencil|flour, `item_color`, `scale`), `label: false` (tanpa label nama, untuk narator), dan `default: true` (dipakai untuk baris tanpa tag). Kunci lain: `turn_gap` (jeda saat ganti speaker), `segment_gap`, dan `pause_segments` (misalnya `{"REPEAT": 3.0}` = jeda 3 detik setelah baris di segmen REPEAT). `slow_segments` (misalnya `{"REPEAT": 0.8, "STORY SLOW": 0.85}`) memperlambat baris karakter di segmen itu (pitch tetap, narator tidak ikut diperlambat). Di level atas: `"character_style": "chibi"` mengganti semua karakter menjadi gaya stiker (kepala besar, pipi merona, emote), dan tema `maple` memberi latar pastel modern. Bagian `places` (di level atas brand.json) berisi daftar lokasi untuk scene `dialogue` dan `location`: `no`, `name`, `short`, `kind` (bakery|pharmacy|shop|home|busstop|street), `color`. Tanpa `voice.cast`, script dibaca seperti biasa (satu narator).

## YouTube (paket publish)
Bagian `youtube` di `brand.json` dipakai oleh `pf.py publish` untuk membuat folder `publish/` (video, thumbnail, judul, deskripsi, komentar pin, `UPLOAD.md`).

| Kunci | Fungsi | Contoh |
|---|---|---|
| `guide_language` | Bahasa panduan `UPLOAD.md`: `id` atau `en` | `"id"` |
| `category`, `language`, `audience`, `altered_content`, `remix` | Isi yang ditampilkan di tabel pengaturan upload | `"Education"`, `"English"` |
| `playlist_shorts`, `playlist_long` | Nama playlist | `"Money Stories (Shorts)"` |
| `hashtags`, `tags` | Hashtag dan tag tetap channel | `["#personalfinance"]` |
| `footer`, `disclaimer` | Ditambahkan otomatis di akhir setiap deskripsi | |
| `schedule_local_times`, `audience_timezone`, `my_timezone` | Jam tayang target penonton dan zona waktu Anda (dihitung otomatis, termasuk perubahan jam musim panas) | `["11:00","13:00"]`, `"America/New_York"`, `"Asia/Jakarta"` |
| `rules` | Aturan posting channel, ditampilkan di setiap `UPLOAD.md` | |

## Musik sendiri
Taruh mp3 di `assets/music/` (dipakai untuk semua video), atau `--music lagu.mp3` saat `init` (khusus 1 video). Gunakan musik bebas royalti yang lisensinya jelas (misalnya YouTube Audio Library). Tanpa file, musik dibuat otomatis oleh skrip (orisinal, tanpa lisensi pihak lain).
