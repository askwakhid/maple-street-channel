# Membangun channel YouTube Maple Street English

Panduan sekali jalan untuk membuat dan mengisi channel di YouTube Studio. Semua file gambar ada di `channels/maplestreet/brand/`. Teks yang dipakai penonton (deskripsi, kata kunci) ditulis dalam bahasa Inggris karena audiensnya internasional.

## 1. Buat channel

1. YouTube → foto profil → **Create a channel** (sebaiknya sebagai *Brand Account* supaya bisa dikelola beberapa orang).
2. Nama: **Maple Street English**
3. Handle: **@maplestreetenglish** (kalau sudah dipakai, coba `@maplestreet.english` atau `@maplestreetEN`, lalu ganti `handle` di `brand/brand.json` dan build ulang skill).

## 2. Branding (YouTube Studio → Customization → Branding)

| Slot | File | Ukuran |
|---|---|---|
| Picture (foto profil) | `youtube-profile.png` | 800×800 (YouTube memotongnya jadi lingkaran) |
| Banner image | `youtube-banner.png` | 2560×1440; judul dan pemeran ada di area aman 1546×423 sehingga tetap terlihat di HP |
| Video watermark | `youtube-watermark.png` | 150×150, tampil "Entire video" |

File tambahan: `cast-lineup.png` (1920×1080) untuk postingan Community dan thumbnail trailer; `logo-wordmark.png` untuk keperluan lain.

Membuat ulang semua gambar setelah mengubah warna/karakter:
```bash
python3 tools/logo.py --brand channels/maplestreet/brand          # logo, wordmark, watermark
python3 tools/channel_art.py --brand channels/maplestreet/brand   # banner, profil, cast-lineup (jalankan SESUDAH logo.py)
```

## 3. Basic info (Customization → Basic info)

**Description** (salin apa adanya):
```
Learn everyday English with the neighbors of Maple Street!

Every episode is one short, real-life scene: ordering at the bakery, feeling sick at the pharmacy, asking for directions at the corner shop. Listen to the story, learn 5-8 phrases people really use, hear it again slowly, and practice speaking with "Your turn".

• Level: A2-B1 (every video is labelled)
• New full episode every week + daily Shorts
• Natural American English with clear captions

Meet the street: Mia (new in town), Walter and Grace (Brooks Bakery), Dr. Park (Maple Pharmacy), the Millers, Omar (Corner Shop) and June (Mia's landlady).

See you on Maple Street!
```

**Links:** tambahkan nanti (worksheet gratis / website / Instagram).
**Contact info:** email bisnis channel.

## 4. Pengaturan default upload (Settings → Upload defaults)

| Pengaturan | Nilai |
|---|---|
| Category | Education |
| Video language / Caption language | English |
| Audience | No, it's not made for kids |
| Title template | `... | Maple Street English (A2)` |
| Tags | learn english, english conversation, english speaking practice, esl, english for beginners, daily english, maple street english |
| Comments | Allow all, hold potentially inappropriate for review |
| Altered content | No (karakter animasi, bukan orang nyata) |

Settings → Channel → **Country**: negara tempat tinggal Anda. **Keywords:** `learn english, english conversation, speak english, esl, english listening, english for beginners, american english, english lessons, a2 english, b1 english`.

## 5. Playlist (buat sebelum upload pertama)

| Playlist | Isi |
|---|---|
| Maple Street Episodes | semua episode 16:9 berurutan (Season 1, 2, ...) |
| Maple Street Shorts | semua Shorts |
| At the Bakery / At the Pharmacy / ... | satu playlist per tempat (penonton mencari situasi) |
| A2 Level / B1 Level | per level |

Nama dua playlist pertama sudah ada di `brand.json → youtube.playlist_long / playlist_shorts`, dan `UPLOAD.md` di setiap folder publish menyebutnya.

## 6. Layout halaman channel (Customization → Layout)

- **Channel trailer** (untuk yang belum subscribe): Shorts 30-45 detik "Welcome to Maple Street" yang memperkenalkan pemeran. Bisa dibuat dengan skill: `/maplestreet-scriptwriter write a 40-second Shorts trailer that introduces the cast`.
- **Featured video** (untuk subscriber): episode terbaru.
- **Sections:** Episodes (playlist), Shorts, playlist per tempat.

## 7. Produksi rutin

```
/maplestreet-scriptwriter write episode 3 from the season plan
        ↓ (setujui naskah)
/maplestreet-studio make a 16:9 video from videos/<topic>/script.txt
        ↓
videos/<topic>/publish/UPLOAD.md   ← ikuti langkahnya untuk upload
```

Jadwal yang disarankan (lihat `MONETISASI.md`): 1 episode 16:9 per minggu (Selasa) + 4-5 Shorts per minggu yang diambil dari episode itu. Jam upload sudah ada di `brand.json → youtube.schedule_local_times` (waktu penonton, America/New_York) dan UPLOAD.md mengonversinya ke waktu Anda.

## 8. Checklist sebelum upload pertama

- [ ] Foto profil, banner, watermark terpasang
- [ ] Deskripsi, keywords, kontak terisi
- [ ] Upload defaults diset (Education, English, not made for kids)
- [ ] Playlist "Maple Street Episodes" dan "Maple Street Shorts" dibuat
- [ ] Episode 1 dan 2 sudah dibuat dan ditonton penuh dengan suara
- [ ] Trailer channel diset
- [ ] 3-5 Shorts siap untuk minggu pertama
