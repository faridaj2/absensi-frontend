import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, DateField, SelectInput } from '../../components/ui';
import { monitorHariIni } from '../../services/laporanService';
import { listInstansi } from '../../services/masterService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

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

const EXCEPTIONS = ['S.Pd', 'M.Pd', 'A.Md', 'SMK', 'SMP', 'SMA', 'GIM', 'TIK', 'NU', 'IPA', 'IPS', 'SD'];
const toTitleCase = (str = '') =>
  str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      return EXCEPTIONS.includes(upper) ? upper : word;
    })
    .join(' ');

function SlotRow({ s, isContinuation, isGroupStart }) {
  const mapelTitle = toTitleCase(s.mapel || '-');
  // TODO: Evaluasi jam terlewat (jika ada s.jam_mulai / s.jam_selesai dan terlewat)
  // Saat ini diasumsikan belum terlewat
  const isTerlewat = false; 

  let statusColor = '';
  let statusText = '';
  let accentColor = '';

  if (s.terabsen) {
    statusColor = 'text-status-success-text font-medium';
    statusText = `${s.jumlah_siswa} siswa`;
    accentColor = 'border-l-status-success-text';
  } else if (isTerlewat) {
    statusColor = 'text-red-400 font-medium';
    statusText = 'Belum';
    accentColor = 'border-l-red-400';
  } else {
    statusColor = 'text-gray-400';
    statusText = 'Belum';
    accentColor = 'border-l-gray-300';
  }

  return (
    <li 
      className={`flex items-center gap-3 bg-white px-2.5 py-2 ${isGroupStart ? 'mt-1 border-t border-gray-100' : ''} border-l-[3px] ${accentColor}`}
      aria-label={`Jam ${s.jam_ke}, ${mapelTitle}, ${statusText}`}
    >
      {/* Kotak Jam */}
      <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${s.terabsen ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {s.jam_ke}
      </div>

      {/* Info Mapel & Guru */}
      <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ minHeight: '36px' }}>
        <div 
          className={`truncate text-sm font-medium ${isContinuation ? 'text-gray-400 opacity-90' : 'text-gray-900'}`}
          title={mapelTitle}
        >
          {mapelTitle}
        </div>
        {!isContinuation && (
          <div className="flex items-center truncate">
            <span className="truncate text-xs text-gray-500" title={s.guru_nama}>
              {toTitleCase(s.guru_nama || '-')}
            </span>
            {s.sebagai_pengganti && (
              <span className="ml-1.5 shrink-0 rounded-full bg-amber-100 px-1.5 py-[1px] text-[10px] font-medium text-amber-700">
                Pengganti
              </span>
            )}
          </div>
        )}
        {isContinuation && (
          <div className="truncate text-xs text-gray-400 italic">lanjutan</div>
        )}
      </div>

      {/* Status Kanan */}
      <div className={`shrink-0 text-right text-xs tabular-nums ${statusColor} flex items-center justify-end gap-1.5`}>
        {s.terabsen && <span className="h-1.5 w-1.5 rounded-full bg-status-success-text"></span>}
        {statusText}
      </div>
    </li>
  );
}

function KelasCard({ k }) {
  const total = k.total_slot || 0;
  const current = k.slot_terabsen || 0;
  const allDone = current === total && total > 0;
  const noneDone = current === 0;
  const percentage = total > 0 ? (current / total) * 100 : 0;

  const badge = allDone
    ? { cls: 'bg-status-success-bg text-status-success-text ring-status-success-text/20', label: 'Lengkap' }
    : noneDone
    ? { cls: 'bg-status-danger-bg text-status-danger-text ring-status-danger-text/20', label: 'Belum' }
    : { cls: 'bg-status-warning-bg text-status-warning-text ring-status-warning-text/20', label: 'Sebagian' };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-text-primary">{k.kelas_nama}</p>
          <p className="text-[11px] text-text-muted">
            {current} / {total} slot terabsen
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      
      {/* Progress Bar Tipis */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full bg-status-success-text transition-all duration-300" style={{ width: `${percentage}%` }} />
      </div>

      <ul className="flex flex-col gap-[2px]">
        {k.slot.length === 0 ? (
          <p className="text-xs italic text-text-muted">Tidak ada slot hari ini.</p>
        ) : (
          k.slot.map((s, index) => {
            const prev = k.slot[index - 1];
            const isContinuation = prev && prev.mapel === s.mapel && prev.guru_nama === s.guru_nama;
            const isGroupStart = index > 0 && !isContinuation;
            return <SlotRow key={s.id} s={s} isContinuation={isContinuation} isGroupStart={isGroupStart} />;
          })
        )}
      </ul>
    </div>
  );
}

export default function MonitorPage() {
  const toast = useToast();
  const { role } = useAuth();
  const isSuperadmin = role === 'superadmin';
  
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [instansiId, setInstansiId] = useState('');
  const [instansiList, setInstansiList] = useState([]);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (isSuperadmin) {
      listInstansi().then(setInstansiList).catch(console.error);
    }
  }, [isSuperadmin]);

  async function load() {
    if (isSuperadmin && !instansiId) {
      setData(null);
      return; // superadmin harus pilih instansi dulu
    }
    
    setLoading(true);
    try {
      const params = { tanggal };
      if (isSuperadmin && instansiId) params.instansi_id = instansiId;
      
      const res = await monitorHariIni(params);
      setData(res);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tanggal, instansiId]);

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
          {isSuperadmin && (
            <Field label="Instansi">
              <SelectInput
                value={instansiId}
                onChange={(e) => setInstansiId(e.target.value)}
                placeholder="-- Pilih Instansi --"
                options={instansiList.map((ins) => ({ value: ins.id, label: ins.nama }))}
              />
            </Field>
          )}
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
