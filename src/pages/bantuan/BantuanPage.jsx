import { PageHeader, Card } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

const FAQ = [
  {
    q: 'Bagaimana cara absen masuk?',
    a: 'Buka menu Absen, ambil foto dari kamera, ambil lokasi GPS, lalu tekan Kirim Absen Masuk. Absen di luar radius instansi akan ditolak.',
  },
  {
    q: 'Lokasi GPS tidak terbaca, apa yang harus dilakukan?',
    a: 'Pastikan izin lokasi di browser sudah diaktifkan dan Anda berada di area dengan sinyal GPS yang baik. Coba muat ulang halaman.',
  },
  {
    q: 'Mengapa saya tidak bisa mengabsen siswa?',
    a: 'Anda harus absen masuk terlebih dahulu, dan hanya bisa mengabsen pada slot mengajar yang terdaftar (asli atau sebagai guru pengganti).',
  },
  {
    q: 'Bagaimana jika lupa password?',
    a: 'Ubah password sendiri lewat menu Pengaturan. Jika terkendala, hubungi administrator instansi untuk reset.',
  },
  {
    q: 'Kapan laporan bisa dicetak?',
    a: 'Buka menu Laporan, pilih jenis laporan dan rentang tanggal, klik Tampilkan, lalu klik Cetak untuk membuka dialog print browser.',
  },
];

const ROLE_TIPS = {
  superadmin: [
    'Kelola daftar instansi dan admin tiap instansi.',
    'Pantau laporan lintas instansi lewat menu Laporan.',
  ],
  admin: [
    'Lengkapi master data: Jadwal, Lokasi, Mapel, Guru & Pegawai.',
    'Atur Assignment dan Guru Pengganti untuk hari-hari tertentu.',
    'Gunakan menu Izin Manual untuk input izin/sakit/alpa tanpa absen GPS.',
  ],
  guru: [
    'Absen masuk sebelum mengabsen siswa.',
    'Cek slot mengajar Anda di halaman Absen Siswa.',
  ],
  pegawai: [
    'Absen masuk dan pulang setiap hari kerja.',
    'Cek riwayat kehadiran Anda di menu Riwayat.',
  ],
};

export default function BantuanPage() {
  const { role } = useAuth();
  const tips = ROLE_TIPS[role] || [];

  return (
    <>
      <PageHeader
        title="Bantuan"
        subtitle="Panduan singkat penggunaan sistem absensi."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-text-primary">Pertanyaan Umum</h2>
          <div className="divide-y divide-border-subtle">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-3">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-text-primary">
                  {item.q}
                  <span className="text-text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 text-base font-semibold text-text-primary">Tips untuk Anda</h2>
            {tips.length === 0 ? (
              <p className="text-sm text-text-muted">Tidak ada tips khusus.</p>
            ) : (
              <ul className="space-y-2 text-sm text-text-muted">
                {tips.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-2 text-base font-semibold text-text-primary">Kontak</h2>
            <p className="text-sm text-text-muted">
              Jika masalah berlanjut, hubungi administrator instansi atau tim IT sekolah.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
