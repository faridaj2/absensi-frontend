import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, DateField } from '../../components/ui';
import { monitorHariIni } from '../../services/laporanService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

function RingkasanCard({ label, value, total, tone = 'brand' }) {
  const tones = {
    brand: 'from-brand-800 to-brand-950 text-text-inverse',
    emerald: 'from-brand-500 to-brand-900 text-white',
    sky: 'from-gold-500 to-gold-700 text-brand-950',
    amber: 'from-amber-500 to-amber-700 text-white',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${tones[tone]} p-4 shadow-md`}>
      <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value}
        {total != null && <span className="text-base font-normal opacity-70"> / {total}</span>}
      </p>
    </div>
  );
}

function PegawaiRow({ p }) {
  const statusColor = p.sudah_masuk
    ? p.status_masuk === 'telat'
      ? 'bg-status-warning-bg text-status-warning-text ring-status-warning-text/20'
      : 'bg-status-success-bg text-status-success-text ring-status-success-text/20'
    : 'bg-status-danger-bg text-status-danger-text ring-status-danger-text/20';
  const label = p.keterangan
    ? p.keterangan.toUpperCase()
    : p.sudah_masuk
    ? p.status_masuk === 'telat'
      ? 'TELAT'
      : 'HADIR'
    : 'BELUM';
  return (
    <tr className="border-t border-border-subtle">
      <td className="px-3 py-2 font-medium text-text-primary">{p.nama}</td>
      <td className="px-3 py-2 text-text-muted capitalize">{p.role}</td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusColor}`}>
          {label}
        </span>
      </td>
      <td className="px-3 py-2 text-text-muted">{p.jam_masuk || '-'}</td>
      <td className="px-3 py-2 text-text-muted">{p.jam_pulang || '-'}</td>
    </tr>
  );
}

function KelasCard({ k }) {
  const allDone = k.slot_terabsen === k.total_slot && k.total_slot > 0;
  const noneDone = k.slot_terabsen === 0;
  const badge = allDone
    ? { cls: 'bg-status-success-bg text-status-success-text ring-status-success-text/20', label: 'Lengkap' }
    : noneDone
    ? { cls: 'bg-status-danger-bg text-status-danger-text ring-status-danger-text/20', label: 'Belum' }
    : { cls: 'bg-status-warning-bg text-status-warning-text ring-status-warning-text/20', label: 'Sebagian' };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">{k.kelas_nama}</p>
          <p className="text-[11px] text-text-muted">
            {k.slot_terabsen} / {k.total_slot} slot terabsen
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="space-y-1.5">
        {k.slot.length === 0 ? (
          <p className="text-xs italic text-text-muted">Tidak ada slot hari ini.</p>
        ) : (
          k.slot.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                s.terabsen ? 'bg-status-success-bg/50' : 'bg-status-danger-bg/50'
              }`}
            >
              <div className="min-w-0">
                <span className="font-semibold text-text-primary">Jam {s.jam_ke}</span>
                <span className="text-text-muted"> · {s.mapel || '-'}</span>
                <span className="text-text-muted"> · {s.guru_nama || '-'}</span>
                {s.sebagai_pengganti && (
                  <span className="ml-1 rounded-full bg-status-warning-bg px-1.5 py-0.5 text-[9px] font-medium text-status-warning-text ring-1 ring-status-warning-text/20">
                    Pengganti
                  </span>
                )}
              </div>
              <div className="shrink-0 text-right">
                {s.terabsen ? (
                  <span className="font-semibold text-status-success-text">{s.jumlah_siswa} siswa</span>
                ) : (
                  <span className="text-status-danger-text">belum</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function MonitorPage() {
  const toast = useToast();
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const res = await monitorHariIni({ tanggal });
      setData(res);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tanggal]);

  const pegawaiFiltered = (data?.pegawai || []).filter((p) =>
    filterRole === 'all' ? true : p.role === filterRole
  );

  const summary = data?.summary || {};

  return (
    <>
      <PageHeader
        title="Monitor Absensi"
        subtitle="Pantau guru/pegawai yang sudah absen dan kelas yang sudah terabsen."
      >
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? 'Memuat...' : 'Refresh'}
        </Button>
      </PageHeader>

      <Card className="mb-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Tanggal">
            <DateField value={tanggal} onChange={setTanggal} />
          </Field>
          <Field label="Filter Role">
            <div className="flex gap-1.5">
              {[
                { v: 'all', l: 'Semua' },
                { v: 'guru', l: 'Guru' },
                { v: 'pegawai', l: 'Pegawai' },
              ].map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setFilterRole(r.v)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filterRole === r.v
                      ? 'bg-brand-900 text-text-inverse'
                      : 'bg-surface text-text-muted hover:bg-brand-100'
                  }`}
                >
                  {r.l}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      {/* Ringkasan */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RingkasanCard
          label="Guru Hadir"
          value={summary.guru_hadir || 0}
          total={summary.guru_total || 0}
          tone="emerald"
        />
        <RingkasanCard
          label="Pegawai Hadir"
          value={summary.pegawai_hadir || 0}
          total={summary.pegawai_total || 0}
          tone="sky"
        />
        <RingkasanCard
          label="Kelas Terabsen"
          value={summary.kelas_terabsen || 0}
          total={summary.kelas_total || 0}
          tone="brand"
        />
        <RingkasanCard
          label="Slot Terabsen"
          value={summary.slot_terabsen || 0}
          total={summary.slot_total || 0}
          tone="amber"
        />
      </div>

      {loading ? (
        <Card><p className="py-8 text-center text-sm text-text-muted">Memuat...</p></Card>
      ) : !data ? (
        <Card><p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p></Card>
      ) : (
        <div className="space-y-5">
          {/* Guru & Pegawai */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary">
              Status Absen Guru & Pegawai ({pegawaiFiltered.filter((p) => p.sudah_masuk).length} / {pegawaiFiltered.length} sudah absen masuk)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-[10px] uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Masuk</th>
                    <th className="px-3 py-2">Pulang</th>
                  </tr>
                </thead>
                <tbody>
                  {pegawaiFiltered.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-text-muted">Tidak ada data.</td></tr>
                  ) : pegawaiFiltered.map((p) => <PegawaiRow key={p.id} p={p} />)}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Kelas */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-text-primary">Status Kelas Hari Ini</h2>
            {(data.kelas || []).length === 0 ? (
              <Card><p className="py-8 text-center text-sm text-text-muted">Tidak ada kelas dengan jadwal hari ini.</p></Card>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {data.kelas.map((k) => (
                  <KelasCard key={k.kelas_id} k={k} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
