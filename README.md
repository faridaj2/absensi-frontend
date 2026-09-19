# Absensi Frontend - Hudhur Darussalam 2

SPA untuk aplikasi absensi guru, pegawai, dan siswa. Dibangun dengan React 19 + Vite 8 + Tailwind 4 + HeroUI.

## Fitur Halaman

| Role | Halaman |
|---|---|
| Semua | Login, Pengaturan profil, Bantuan |
| Superadmin | Instansi, Admin, Monitor, Laporan |
| Admin | Guru & Pegawai, Mapel, Kelas, Siswa, Lokasi, Jadwal Kerja, Jadwal Pelajaran, Izin Manual, Monitor, Laporan |
| Guru | Absen, Absen Siswa, Riwayat, Laporan |
| Pegawai | Absen, Riwayat |

## Stack

- React 19 + Vite 8
- React Router 7
- TailwindCSS 4 (@tailwindcss/vite)
- HeroUI + React Aria
- Axios
- Leaflet (peta lokasi)

## Setup

git clone git@github.com:faridaj2/absensi-frontend.git
cd absensi-frontend
npm install

Buat .env untuk dev:

VITE_API_URL=http://127.0.0.1:8000/api

Jalankan dev server:

npm run dev

## Build

Untuk produksi, buat .env.production:

VITE_API_URL=/api

Lalu:

npm run build

Output ada di dist/. Salin isinya ke folder public/ repo backend (absensi-backend) agar bisa di-deploy sekaligus.

## Struktur

src/
  components/    UI, layout, maps, absensi
  contexts/      AuthContext, ToastContext
  pages/         halaman per role
  routes/        AppRoutes
  services/      apiClient + service per domain

## Lint

npm run lint

---

Bagian dari ekosistem Hudhur untuk SMP Darussalam 2.
