import { useEffect, useState } from 'react';
import { PageHeader, Card, StatusBadge } from '../../components/ui';
import { riwayatAbsensi } from '../../services/absensiService';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function formatWaktu(dt) {
  if (!dt) return '-';
  const d = new Date(dt.replace(' ', 'T'));
  if (isNaN(d.getTime())) return dt;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function RiwayatPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    riwayatAbsensi()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Riwayat Absensi"
        subtitle="Catatan kehadiran Anda."
      />

      <Card>
        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">Memuat...</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Belum ada riwayat.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 font-medium text-text-primary">{formatTanggal(r.tanggal)}</td>
                    <td className="px-4 py-3 text-text-muted capitalize">{r.jenis || '-'}</td>
                    <td className="px-4 py-3 text-text-muted">{formatWaktu(r.waktu_absen)}</td>
                    <td className="px-4 py-3">
                      {r.status ? <StatusBadge status={r.status} /> : <span className="text-text-muted">-</span>}
                    </td>
                    <td className="px-4 py-3 text-text-muted capitalize">{r.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
