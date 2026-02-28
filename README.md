# FinFlow — Aplikasi Keuangan Modern Open-Source

FinFlow adalah solusi manajemen keuangan (**Financial Command Center**) modern yang dirancang untuk membantu bisnis dan individu melacak transaksi, mengelola anggaran, dan menganalisis pertumbuhan finansial secara efisien. Dibuat dengan antarmuka premium, multi-bahasa, dan terintegrasi penuh dengan database cloud.

![FinFlow Banner](/og-image.png)

## 🚀 Fitur Utama

- **Dashboard Interaktif**: Visualisasi data pendapatan, pengeluaran, dan saldo bersih dengan grafik area dan pie yang dinamis.
- **Ledger (Buku Kas)**: Catat transaksi lengkap dengan kategori, catatan, dan tanggal secara real-time.
- **Multi-Bahasa**: Dukungan penuh untuk bahasa **Indonesia**, **Inggris (English)**, dan **Mandarin (Chinese 中文)**.
- **Ekspor Data**: Fitur ekspor laporan transaksi langsung ke format Excel (.xlsx).
- **Sistem Autentikasi**: Login dan Register aman menggunakan profil permanen (Email & Password) via Supabase Auth.
- **Workspace Perusahaan**: Buat workspace baru atau bergabung dengan tim melalui kode undangan unik.
- **PWA Ready**: Aplikasi web progresif yang bisa diinstal di layar utama HP atau desktop.
- **SEO Optimized**: Sudah teroptimasi untuk mesin pencari dengan metadata lengkap.

## 🛠️ Stack Teknologi

- **Frontend**: [Vite](https://vitejs.dev/) + [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Internationalization**: [i18next](https://www.i18next.com/)
- **Visualisasi Data**: [Recharts](https://recharts.org/)
- **Utility**: [XLSX](https://sheetjs.com/) (Export Excel), [Lucide React](https://lucide.dev/) (Icons)

## ⚙️ Cara Instalasi (Lokal)

Ikuti langkah berikut untuk menjalankan project di komputer Anda:

1. **Clone Repositori**
   ```bash
   git clone https://github.com/khaliddean31-collab/finflow.git
   cd FinFlow
   ```

2. **Instal Dependencies**
   ```bash
   npm install
   ```

3. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```

## 📦 Cara Setup Supabase ke FinFlow

Ikuti langkah-langkah berikut untuk mengintegrasikan Supabase dengan aplikasi Anda:

1️⃣ **Buat Project di Supabase**
- Buka [supabase.com](https://supabase.com/) → Login → **New Project**.
- Isi nama project (misal: FinFlow), masukkan password database pilihan Anda.
- Pilih region **Singapore** (paling dekat dengan Indonesia) untuk performa terbaik.
- Tunggu sekitar 2 menit sampai proses provisioning selesai.

2️⃣ **Ambil API Keys**
- Masuk ke menu **Settings (⚙️)** di sidebar kiri → **API**.
- Copy nilai **Project URL** dan **anon public key**.

3️⃣ **Isi file .env.example**
- Buka file `.env.example` di direktori utama proyek Anda. Masukkan nilai yang sudah Anda copy:
  ```env
  VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGci...
  ```
- **Penting**: Setelah diisi, restart dev server (`Ctrl+C` → `npm run dev`) agar Vite dapat membaca perubahan file `.env` dan jangan lupa untuk rename file `.env.example` menjadi `.env`.

4️⃣ **Jalankan SQL Migration**
- Di Dashboard Supabase → **SQL Editor** → **New query**.
- Buka file `supabase_migration.sql` yang ada di repositori ini, lalu copy semua isinya.
- Paste ke SQL Editor dan klik **Run**. Ini akan membuat tabel `profiles`, `companies`, dan `transactions` secara otomatis beserta kebijakan keamanannya (RLS).

5️⃣ **(Opsional) Matikan Konfirmasi Email**
- Masuk ke **Authentication** → **Providers** → **Email**.
- Matikan opsi **"Confirm email"**.
- Ini dilakukan agar Anda bisa langsung login setelah registrasi tanpa harus melakukan verifikasi link di email (sangat disarankan untuk tahap testing).

6️⃣ **Test Aplikasi**
- Jalankan perintah:
  ```bash
  npm run dev
  ```
- Buka `http://localhost:3000` (atau port yang tertera) → coba lakukan **Register** → **Login** → **Buat Company** → pastikan transaksi Ledger bisa disimpan dan tersinkronisasi ke DB.

## 🌐 Live Demo

Lihat aplikasi yang sudah berjalan di sini:
[**👉 Lihat Live Demo FinFlow**](https://finflow-dk.vercel.app/)

## 📧 Kontak & Kontribusi

Dibuat dengan penuh dedikasi oleh **Dean Khalid**. Jika Anda tertarik untuk berkontribusi atau memiliki pertanyaan, silakan hubungi saya melalui:

- **Email**: khaliddean31@gmail.com
- **GitHub**: khaliddean31-collab

---
# finflow by Dean Khalid
