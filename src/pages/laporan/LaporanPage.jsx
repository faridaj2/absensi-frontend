import { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, Button, Field, SelectInput, DateField } from '../../components/ui';
import { laporanPegawai, laporanSiswa, filterLaporanSiswa } from '../../services/laporanService';
import RekapGuruPanel from './RekapGuruPanel';
import { listInstansi, listUsers } from '../../services/masterService';
import { useAuth } from '../../contexts/AuthContext';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const STATUS_STYLES = {
  hadir: 'bg-status-success-bg text-status-success-text ring-1 ring-status-success-text/20',
  alpa: 'bg-status-danger-bg text-status-danger-text ring-1 ring-status-danger-text/20',
  izin: 'bg-status-warning-bg text-status-warning-text ring-1 ring-status-warning-text/20',
  sakit: 'bg-status-info-bg text-status-info-text ring-1 ring-status-info-text/20',
};

const STATUS_LABEL = {
  hadir: 'Hadir',
  alpa: 'Alpa',
  izin: 'Izin',
  sakit: 'Sakit',
};

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  const cls = STATUS_STYLES[key] || 'bg-surface text-text-muted ring-1 ring-border-subtle';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${cls}`}>
      {STATUS_LABEL[key] || status || '-'}
    </span>
  );
}

function isConfirmed(text) {
  if (!text) return false;
  const t = String(text).trim().toLowerCase();
  return t === 'oke' || t === 'ok' || t === 'dikonfirmasi';
}

function hasKeterangan(value) {
  if (value == null) return false;
  const t = String(value).trim();
  return t !== '' && t !== '-';
}

function StatusWithInfo({ status, keterangan }) {
  const show = hasKeterangan(keterangan);
  const confirmed = isConfirmed(keterangan);
  return (
    <div className="flex items-center gap-1.5">
      <StatusBadge status={status} />
      {show && (
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ring-1 ${
            confirmed
              ? 'bg-status-success-bg text-status-success-text ring-status-success-text/20'
              : 'bg-surface text-text-muted ring-border-subtle'
          }`}
          title={keterangan}
        >
          {confirmed ? '\u2713' : 'i'}
        </span>
      )}
    </div>
  );
}

function SudahBadge({ ok }) {
  return ok ? (
    <span className="inline-flex items-center rounded-full bg-status-success-bg px-2 py-0.5 text-[11px] font-medium text-status-success-text ring-1 ring-status-success-text/20">
      Sudah
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-status-danger-bg px-2 py-0.5 text-[11px] font-medium text-status-danger-text ring-1 ring-status-danger-text/20">
      Belum
    </span>
  );
}

function PegawaiMatrix({ rows, bulan }) {
  const users = useMemo(() => {
    const userMap = new Map();
    for (const r of rows) {
      const uid = r.user?.id ?? r.user_id;
      if (!userMap.has(uid)) {
        userMap.set(uid, { id: uid, nama: r.user?.name || '-', role: r.user?.role || '' });
      }
    }
    return Array.from(userMap.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [rows]);

  const tanggalList = useMemo(() => {
    if (!bulan) {
      const tglSet = new Set();
      for (const r of rows) if (r.tanggal) tglSet.add(String(r.tanggal));
      return Array.from(tglSet).sort();
    }
    const [y, m] = bulan.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    const arr = [];
    for (let d = 1; d <= last; d++) {
      arr.push(`${bulan}-${String(d).padStart(2, '0')}`);
    }
    return arr;
  }, [rows, bulan]);

  const cellMap = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const uid = r.user?.id ?? r.user_id;
      const key = `${uid}|${r.tanggal}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return map;
  }, [rows]);

  function cellInfo(list) {
    if (!list || list.length === 0) return { kode: '-', cls: 'text-text-muted/50' };
    let adaMasuk = false;
    let ket = null;
    for (const r of list) {
      if (String(r.jenis || '').toLowerCase() === 'masuk') adaMasuk = true;
      if (r.keterangan) ket = String(r.keterangan).toLowerCase();
    }
    if (ket === 'izin') return { kode: 'I', cls: 'text-status-warning-text' };
    if (ket === 'sakit') return { kode: 'S', cls: 'text-status-info-text' };
    if (ket === 'alpa') return { kode: 'A', cls: 'text-status-danger-text font-bold' };
    if (adaMasuk) return { kode: 'H', cls: 'text-status-success-text' };
    return { kode: 'A', cls: 'text-status-danger-text font-bold' };
  }

  function fmtTgl(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }

  const HARI = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  if (users.length === 0 || tanggalList.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle">
      <table className="w-full text-xs">
        <thead className="bg-surface text-text-muted">
          <tr>
            <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left text-[10px] uppercase tracking-wide">Nama</th>
            {tanggalList.map((t) => {
              const d = new Date(t + 'T00:00:00');
              const hari = d.getDay() === 0 ? 7 : d.getDay();
              const libur = hari === 6 || hari === 7;
              return (
                <th key={t} className={`px-1 py-1 text-center text-[10px] ${libur ? 'bg-status-danger-bg' : ''}`}>
                  <div className="font-bold">{fmtTgl(t)}</div>
                  <div className="font-normal opacity-70">{HARI[hari]}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border-subtle">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-surface-card px-3 py-1.5 font-medium text-text-primary">
                {u.nama}
                {u.role && <span className="ml-1 text-[10px] capitalize text-text-muted">({u.role})</span>}
              </td>
              {tanggalList.map((t) => {
                const info = cellInfo(cellMap.get(`${u.id}|${t}`));
                return (
                  <td key={t} className={`px-1 py-1.5 text-center font-semibold ${info.cls}`}>
                    {info.kode}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border-subtle bg-surface px-3 py-1.5 text-[11px] text-text-muted">
        Kode: <b>H</b>=Hadir, <b>I</b>=Izin, <b>S</b>=Sakit, <b>A</b>=Alpa
      </div>
    </div>
  );
}

function computeStats(rows) {
  const stats = { total: rows.length, hadir: 0, alpa: 0, izin: 0, sakit: 0 };
  for (const r of rows) {
    const key = String(r.status || '').toLowerCase();
    if (key in stats) stats[key] += 1;
  }
  return stats;
}

function SesiHeader({ meta, stat, expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-brand-100/60"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-text-primary">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            <path d="M7 5l6 5-6 5V5z" />
          </svg>
          <span className="font-semibold">{meta.mapel || '-'}</span>
          <span className="text-text-muted">·</span>
          <span>{meta.kelas ? `Kelas ${meta.kelas}` : '-'}</span>
          {meta.jam_ke != null && (
            <>
              <span className="text-text-muted">·</span>
              <span>Jam ke-{meta.jam_ke}</span>
            </>
          )}
          {meta.tanggal && (
            <>
              <span className="text-text-muted">·</span>
              <span>{meta.tanggal}</span>
            </>
          )}
          {meta.dicatat_oleh && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-text-muted">
                oleh <span className="text-text-primary font-medium">{meta.dicatat_oleh}</span>
              </span>
            </>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-5 text-[11px] text-text-muted">
          <span className="font-medium text-text-primary">{stat.total} siswa</span>
          <span className="text-status-success-text">{stat.hadir} Hadir</span>
          <span className="text-status-danger-text">{stat.alpa} Alpa</span>
          <span className="text-status-warning-text">{stat.izin} Izin</span>
          <span className="text-status-info-text">{stat.sakit} Sakit</span>
        </div>
      </div>
    </button>
  );
}

function SesiGroup({ group }) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const stat = useMemo(() => computeStats(group.rows), [group.rows]);

  const visibleRows = useMemo(() => {
    if (showAll) return group.rows;
    return group.rows.filter((r) => {
      const s = String(r.status || '').toLowerCase();
      if (s !== 'hadir') return true;
      return hasKeterangan(r.keterangan);
    });
  }, [group.rows, showAll]);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      <SesiHeader
        meta={group.meta}
        stat={stat}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />

      {expanded && (
        <div className="border-t border-border-subtle">
          <div className="flex items-center justify-between gap-2 bg-surface px-3 py-1.5 text-[11px] text-text-muted">
            <span>
              Menampilkan {visibleRows.length} dari {group.rows.length} siswa
            </span>
            <label className="inline-flex cursor-pointer items-center gap-1.5 select-none">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-brand-500"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Tampilkan hadir tanpa catatan
            </label>
          </div>

          {visibleRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-muted">Semua siswa hadir tanpa catatan.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-card text-left text-[10px] uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-3 py-1.5 font-medium">Siswa</th>
                  <th className="px-3 py-1.5 font-medium w-32">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.id} className="border-t border-border-subtle">
                    <td className="px-3 py-1.5 font-medium text-text-primary">{r.siswa_nama || r.siswa_id}</td>
                    <td className="px-3 py-1.5">
                      <StatusWithInfo status={r.status} keterangan={r.keterangan} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function LaporanPage() {
  const toast = useToast();
  const { role } = useAuth();
  const [mode, setMode] = useState(role === 'guru' ? 'siswa' : 'pegawai');
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [instansiId, setInstansiId] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [mapelId, setMapelId] = useState('');
  const [instansi, setInstansi] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [guruOptions, setGuruOptions] = useState([]);
  const [guruId, setGuruId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulan, setBulan] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const bulanOptions = useMemo(() => {
    const arr = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 0; i < 18; i++) {
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      arr.push({ value: val, label });
      d.setMonth(d.getMonth() - 1);
    }
    return arr;
  }, []);

  const dariBulan = bulan ? `${bulan}-01` : '';
  const sampaiBulan = useMemo(() => {
    if (!bulan) return '';
    const [y, m] = bulan.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return `${bulan}-${String(last).padStart(2, '0')}`;
  }, [bulan]);

  const tabs = role === 'guru'
    ? [{ value: 'siswa', label: 'Absensi Siswa' }]
    : [
        { value: 'pegawai', label: 'Guru / Pegawai' },
        { value: 'rekap', label: 'Rekap Guru (A/B)' },
        { value: 'siswa', label: 'Siswa' },
      ];

  useEffect(() => {
    if (role === 'superadmin') {
      listInstansi().then(setInstansi);
    }
    if (role === 'guru' || role === 'admin') {
      filterLaporanSiswa()
        .then((res) => {
          setKelasOptions(res.kelas || []);
          setMapelOptions(res.mapel || []);
        })
        .catch(() => {});
    }
    if (role === 'admin' || role === 'superadmin') {
      listUsers()
        .then((users) => {
          setGuruOptions((users || []).filter((u) => u.role === 'guru'));
        })
        .catch(() => {});
    }
  }, [role]);

  const sesiGroups = useMemo(() => {
    if (rows.length === 0) return [];
    const map = new Map();
    for (const r of rows) {
      const key = [r.tanggal, r.kelas_id || r.kelas_nama || '-', r.mapel_id || r.mapel || '-', r.jam_ke ?? '-', r.dicatat_oleh_nama || '-'].join('|');
      if (!map.has(key)) {
        map.set(key, {
          meta: {
            mapel: r.mapel,
            kelas: r.kelas_nama || r.kelas_id,
            jam_ke: r.jam_ke,
            tanggal: r.tanggal,
            dicatat_oleh: r.dicatat_oleh_nama,
          },
          rows: [],
        });
      }
      map.get(key).rows.push(r);
    }
    return Array.from(map.values());
  }, [rows]);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (dariBulan) params.dari = dariBulan;
      if (sampaiBulan) params.sampai = sampaiBulan;
      if (role === 'superadmin' && instansiId) params.instansi_id = instansiId;
      if (mode === 'siswa') {
        if (kelasId) params.kelas_id = kelasId;
        if (mapelId) params.mapel_id = mapelId;
      }
      let data;
      if (mode === 'pegawai') {
        data = await laporanPegawai(params);
      } else {
        data = await laporanSiswa(params);
      }
      setRows(data);
      toast.success(`Menampilkan ${data.length} baris laporan.`);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'rekap') {
    return (
      <>
        <div className="no-print">
          <PageHeader title="Laporan" subtitle="Rekap kehadiran & jam mengajar guru." />
        </div>

        {tabs.length > 1 && (
          <div className="no-print mb-5 inline-flex flex-wrap rounded-xl border border-border-subtle bg-surface-card p-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setMode(t.value); setRows([]); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === t.value
                    ? 'bg-brand-900 text-text-inverse shadow-sm'
                    : 'text-text-muted hover:bg-surface hover:text-text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <Card className="no-print mb-5 overflow-visible">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Filter Rekap Guru</h2>
            <p className="mt-0.5 text-xs text-text-muted">Pilih bulan lalu tentukan bagian yang ingin ditampilkan (A/B/C).</p>
          </div>
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Bulan">
              <SelectInput
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                options={bulanOptions}
              />
            </Field>
            {role === 'superadmin' && (
              <Field label="Instansi">
                <SelectInput
                  value={instansiId}
                  onChange={(e) => setInstansiId(e.target.value)}
                  placeholder="Semua instansi"
                  options={instansi.map((i) => ({ value: String(i.id), label: i.nama }))}
                />
              </Field>
            )}
            {(role === 'admin' || role === 'superadmin') && (
              <Field label="Guru">
                <SelectInput
                  value={guruId}
                  onChange={(e) => setGuruId(e.target.value)}
                  placeholder="Semua guru"
                  options={guruOptions.map((g) => ({ value: String(g.id), label: g.name }))}
                />
              </Field>
            )}
          </div>
        </Card>

        <RekapGuruPanel
          dari={dariBulan}
          sampai={sampaiBulan}
          instansiId={role === 'superadmin' ? instansiId : ''}
          guruId={guruId}
        />
      </>
    );
  }

  function handleCetak() {
    if (mode === 'pegawai') {
      const qs = new URLSearchParams();
      if (dariBulan) qs.set('dari', dariBulan);
      if (sampaiBulan) qs.set('sampai', sampaiBulan);
      if (role === 'superadmin' && instansiId) qs.set('instansi_id', instansiId);
      if (guruId) qs.set('guru_id', guruId);
      const url = `/laporan/cetak-guru${qs.toString() ? '?' + qs.toString() : ''}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (mode !== 'siswa') {
      toast.error('Cetak tersedia untuk mode Siswa dan Guru/Pegawai.');
      return;
    }
    const qs = new URLSearchParams();
    if (dariBulan) qs.set('dari', dariBulan);
    if (sampaiBulan) qs.set('sampai', sampaiBulan);
    if (kelasId) {
      qs.set('kelas_id', kelasId);
      const k = kelasOptions.find((x) => String(x.id) === String(kelasId));
      if (k) qs.set('kelas_nama', k.nama);
    }
    if (mapelId) {
      qs.set('mapel_id', mapelId);
      const m = mapelOptions.find((x) => String(x.id) === String(mapelId));
      if (m) qs.set('mapel_nama', m.nama);
    }
    const url = `/laporan/cetak${qs.toString() ? '?' + qs.toString() : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Laporan"
          subtitle="Rekap absensi guru, pegawai, dan siswa."
        >
          <Button variant="secondary" onClick={handleCetak}>
            Cetak
          </Button>
        </PageHeader>
      </div>

      {tabs.length > 1 && (
        <div className="no-print mb-5 inline-flex rounded-xl border border-border-subtle bg-surface-card p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setMode(t.value);
                setRows([]);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === t.value
                  ? 'bg-brand-900 text-text-inverse shadow-sm'
                  : 'text-text-muted hover:bg-surface hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <Card className="no-print mb-5 overflow-visible">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Filter Laporan</h2>
            <p className="mt-0.5 text-xs text-text-muted">Atur periode dan kriteria sebelum menampilkan data.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Bulan">
            <SelectInput
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              options={bulanOptions}
            />
          </Field>
          {role === 'superadmin' && (
            <Field label="Instansi">
              <SelectInput
                value={instansiId}
                onChange={(e) => setInstansiId(e.target.value)}
                placeholder="Semua instansi"
                options={instansi.map((i) => ({ value: String(i.id), label: i.nama }))}
              />
            </Field>
          )}
          {mode === 'siswa' && (role === 'guru' || role === 'admin') && (
            <Field label="Kelas">
              <SelectInput
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
                placeholder="Semua kelas"
                options={kelasOptions.map((k) => ({ value: String(k.id), label: k.nama }))}
              />
            </Field>
          )}
          {mode === 'siswa' && (role === 'guru' || role === 'admin') && (
            <Field label="Mata Pelajaran">
              <SelectInput
                value={mapelId}
                onChange={(e) => setMapelId(e.target.value)}
                placeholder="Semua mapel"
                options={mapelOptions.map((m) => ({ value: String(m.id), label: m.nama }))}
              />
            </Field>
          )}
          {(mode === 'aktivitas' || mode === 'pegawai') && (role === 'admin' || role === 'superadmin') && (
            <Field label="Guru">
              <SelectInput
                value={guruId}
                onChange={(e) => setGuruId(e.target.value)}
                placeholder="Semua guru"
                options={guruOptions.map((g) => ({ value: String(g.id), label: g.name }))}
              />
            </Field>
          )}
          <div className="flex sm:col-span-2 xl:col-span-1">
            <Button onClick={load} disabled={loading} className="w-full">
              {loading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-2 border-b border-border-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {mode === 'pegawai' ? 'Absensi Guru / Pegawai' : mode === 'aktivitas' ? 'Aktivitas Mengajar Guru' : 'Absensi Siswa'}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {rows.length > 0 ? `${rows.length} data ditemukan` : 'Belum ada data yang ditampilkan'}
            </p>
          </div>
          {bulan && (
            <span className="inline-flex w-fit items-center rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-text-muted ring-1 ring-border-subtle">
              {bulanOptions.find((b) => b.value === bulan)?.label || bulan}
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5">
        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">Memuat...</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p>
        ) : mode === 'aktivitas' ? (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Tanggal</th>
                  <th className="px-3 py-2 font-medium">Jam ke</th>
                  <th className="px-3 py-2 font-medium">Jam</th>
                  <th className="px-3 py-2 font-medium">Mapel</th>
                  <th className="px-3 py-2 font-medium">Kelas</th>
                  <th className="px-3 py-2 font-medium">Guru</th>
                  <th className="px-3 py-2 font-medium">Status Absen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border-subtle">
                    <td className="px-3 py-2 text-text-muted">{r.tanggal}</td>
                    <td className="px-3 py-2 text-text-muted">{r.jam_ke ?? '-'}</td>
                    <td className="px-3 py-2 text-text-muted">{r.jam_mulai && r.jam_selesai ? `${String(r.jam_mulai).slice(0,5)}–${String(r.jam_selesai).slice(0,5)}` : '-'}</td>
                    <td className="px-3 py-2 font-medium text-text-primary">{r.mapel || '-'}</td>
                    <td className="px-3 py-2 text-text-muted">{r.kelas_nama || r.kelas_id || '-'}</td>
                    <td className="px-3 py-2 text-text-muted">
                      {r.guru_nama || '-'}
                      {r.sebagai_pengganti && (
                        <span className="ml-1 rounded-full bg-status-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-status-warning-text ring-1 ring-status-warning-text/20">
                          Pengganti
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2"><SudahBadge ok={r.sudah_diabsen} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : mode === 'pegawai' ? (
          <PegawaiMatrix rows={rows} bulan={bulan} />
        ) : (
          <div className="space-y-2">
            {sesiGroups.map((group, gi) => (
              <SesiGroup key={gi} group={group} />
            ))}
          </div>
        )}
        </div>
      </Card>
    </>
  );
}
