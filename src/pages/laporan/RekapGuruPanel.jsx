import { useEffect, useMemo, useState } from 'react';
import { Card, Button } from '../../components/ui';
import { laporanRekapGuru } from '../../services/laporanService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const HARI_LABEL = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function formatTanggalPanjang(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function hhmm(t) {
  if (!t) return '-';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

export default function RekapGuruPanel({ dari, sampai, instansiId, guruId }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState({ A: true, B: true });

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const q = {};
        if (dari) q.dari = dari;
        if (sampai) q.sampai = sampai;
        if (instansiId) q.instansi_id = instansiId;
        if (guruId) q.guru_id = guruId;
        const res = await laporanRekapGuru(q);
        if (alive) setData(res);
      } catch (err) {
        if (alive) toast.error(extractError(err));
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [dari, sampai, instansiId, guruId]);

  const guruList = data?.guru || [];
  const tanggalList = data?.tanggal_list || [];
  const detailJam = data?.detail_jam || [];
  const periode = data?.periode || {};

  const perGuruJam = useMemo(() => {
    const map = new Map();
    for (const d of detailJam) {
      if (!map.has(d.guru_id)) map.set(d.guru_id, []);
      map.get(d.guru_id).push(d);
    }
    return map;
  }, [detailJam]);

  // Matrix JP per guru x tanggal — hanya slot yang REALISASI (sudah diabsen)
  const jpMatrix = useMemo(() => {
    const map = new Map();
    for (const d of detailJam) {
      const ket = String(d.keterangan || '').toLowerCase();
      if (ket === 'belum diabsen') continue;
      const key = `${d.guru_id}|${d.tanggal}`;
      map.set(key, (map.get(key) || 0) + (d.jp || 1));
    }
    return map;
  }, [detailJam]);

  const totalJP = detailJam.reduce((a, b) => a + (b.jp || 1), 0);

  function toggleSection(k) {
    setSections((s) => ({ ...s, [k]: !s[k] }));
  }

  function cetakSection(k, guruIdOnly) {
    const qs = new URLSearchParams();
    qs.set('section', k);
    if (dari) qs.set('dari', dari);
    if (sampai) qs.set('sampai', sampai);
    if (instansiId) qs.set('instansi_id', instansiId);
    if (guruIdOnly) {
      qs.set('guru_id', guruIdOnly);
      qs.set('only_guru', '1');
    } else if (guruId) {
      qs.set('guru_id', guruId);
    }
    window.open(`/laporan/cetak-guru?${qs.toString()}`, '_blank', 'noopener,noreferrer');
  }

  const tabCls = (on) =>
    `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
      on ? 'bg-brand-900 text-text-inverse shadow-sm' : 'text-text-muted hover:bg-surface'
    }`;

  const printBtnCls = 'inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-primary hover:bg-surface';

  return (
    <div className="space-y-4">
      {/* Toggle section */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface-card p-2">
        <span className="px-2 text-[11px] font-semibold text-text-muted">Tampilkan:</span>
        <button type="button" onClick={() => toggleSection('A')} className={tabCls(sections.A)}>
          {sections.A ? '\u2713' : '\u2715'} A. Rekap Kehadiran
        </button>
        <button type="button" onClick={() => toggleSection('B')} className={tabCls(sections.B)}>
          {sections.B ? '\u2713' : '\u2715'} B. Kehadiran Harian
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">Memuat...</p>
      ) : !data ? (
        <p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p>
      ) : guruList.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">Tidak ada data guru untuk periode ini.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-[11px] text-text-muted">
            <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-1 ring-1 ring-border-subtle">
              Periode: <b className="ml-1 text-text-primary">{periode.dari ? formatTanggalPanjang(periode.dari) : '-'} — {periode.sampai ? formatTanggalPanjang(periode.sampai) : '-'}</b>
            </span>
            <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-1 ring-1 ring-border-subtle">
              Total Guru: <b className="ml-1 text-text-primary">{guruList.length}</b>
            </span>
            <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-1 ring-1 ring-border-subtle">
              Total JP: <b className="ml-1 text-text-primary">{totalJP}</b>
            </span>
          </div>

          {/* A. Rekap Kehadiran */}
          {sections.A && (
            <Card className="overflow-hidden p-0">
              <div className="lg-sec-head flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-2.5">
                <span className="text-sm font-semibold text-text-primary">A. Rekap Kehadiran Guru</span>
                <button type="button" onClick={() => cetakSection('A')} className={printBtnCls}>
                  {'\uD83D\uDDA8'} Cetak A
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-left text-[10px] uppercase tracking-wide text-text-muted">
                    <tr>
                      <th className="px-3 py-2">No</th>
                      <th className="px-3 py-2">Nama Guru</th>
                      <th className="px-3 py-2 text-center">Hadir</th>
                      <th className="px-3 py-2 text-center">Izin</th>
                      <th className="px-3 py-2 text-center">Sakit</th>
                      <th className="px-3 py-2 text-center">Alpa</th>
                      <th className="px-3 py-2 text-center">Total JP</th>
                      <th className="px-3 py-2 text-center">Realisasi JP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guruList.map((g, i) => (
                      <tr key={g.id} className="border-t border-border-subtle">
                        <td className="px-3 py-2 text-text-muted">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-text-primary">{g.nama}</td>
                        <td className="px-3 py-2 text-center">{g.stat.hadir}</td>
                        <td className="px-3 py-2 text-center">{g.stat.izin}</td>
                        <td className="px-3 py-2 text-center">{g.stat.sakit}</td>
                        <td className="px-3 py-2 text-center">{g.stat.alpa}</td>
                        <td className="px-3 py-2 text-center font-semibold">{g.jp_jadwal}</td>
                        <td className="px-3 py-2 text-center">{g.jp_realisasi}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border-strong bg-surface font-semibold">
                      <td className="px-3 py-2 text-center" colSpan={2}>JUMLAH</td>
                      <td className="px-3 py-2 text-center">{guruList.reduce((a, b) => a + b.stat.hadir, 0)}</td>
                      <td className="px-3 py-2 text-center">{guruList.reduce((a, b) => a + b.stat.izin, 0)}</td>
                      <td className="px-3 py-2 text-center">{guruList.reduce((a, b) => a + b.stat.sakit, 0)}</td>
                      <td className="px-3 py-2 text-center">{guruList.reduce((a, b) => a + b.stat.alpa, 0)}</td>
                      <td className="px-3 py-2 text-center">{guruList.reduce((a, b) => a + b.jp_jadwal, 0)}</td>
                      <td className="px-3 py-2 text-center">{guruList.reduce((a, b) => a + b.jp_realisasi, 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="border-t border-border-subtle px-3 py-1.5 text-[11px] text-text-muted">
                Angka = total JP yang diisi hari itu · <b>H</b> = hadir tapi tidak mengajar · <b>I</b>=Izin, <b>S</b>=Sakit, <b>A</b>=Alpa, <b>L</b>=Libur
              </div>
            </Card>
          )}

          {/* B. Kehadiran Harian */}
          {sections.B && (
            <Card className="overflow-hidden p-0">
              <div className="lg-sec-head flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-2.5">
                <span className="text-sm font-semibold text-text-primary">B. Daftar Kehadiran Harian ({tanggalList.length} hari)</span>
                <button type="button" onClick={() => cetakSection('B')} className={printBtnCls}>
                  {'\uD83D\uDDA8'} Cetak B
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-surface text-text-muted">
                    <tr>
                      <th className="sticky left-0 z-10 bg-surface px-2 py-2 text-left">Nama</th>
                      {tanggalList.map((t) => (
                        <th key={t.tanggal} className={`px-1 py-1 text-center ${t.is_libur ? 'bg-rose-50' : ''}`}>
                          <div className="text-[10px] font-bold">{formatTanggal(t.tanggal)}</div>
                          <div className="text-[9px] font-normal">{HARI_LABEL[t.hari]}</div>
                        </th>
                      ))}
                      <th className="px-2 py-2 text-center text-[10px] uppercase tracking-wide">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guruList.map((g) => {
                      const totalRow = tanggalList.reduce((a, t) => a + (jpMatrix.get(`${g.id}|${t.tanggal}`) || 0), 0);
                      return (
                      <tr key={g.id} className="border-t border-border-subtle">
                        <td className="sticky left-0 z-10 whitespace-nowrap bg-surface-card px-2 py-1.5 font-medium text-text-primary">{g.nama}</td>
                        {tanggalList.map((t) => {
                          const k = g.harian?.[t.tanggal] || '-';
                          const jp = jpMatrix.get(`${g.id}|${t.tanggal}`) || 0;
                          const color = {
                            H: 'text-emerald-700',
                            I: 'text-amber-700',
                            S: 'text-sky-700',
                            A: 'text-rose-700 font-bold',
                            L: 'text-slate-400',
                          }[k] || 'text-text-muted';
                          // Jika ada JP realisasi, tampilkan jumlah JP
                          if (jp > 0) {
                            return (
                              <td key={t.tanggal} className="px-1 py-1.5 text-center font-bold text-emerald-700">
                                {jp}
                              </td>
                            );
                          }
                          if (k === 'H') {
                            return (
                              <td key={t.tanggal} className="px-1 py-1.5 text-center font-semibold text-sky-700">
                                H
                              </td>
                            );
                          }
                          return (
                            <td key={t.tanggal} className={`px-1 py-1.5 text-center font-semibold ${color}`}>{k}</td>
                          );
                        })}
                        <td className="px-2 py-1.5 text-center font-bold text-text-primary">{totalRow}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border-strong bg-surface font-bold">
                      <td className="sticky left-0 z-10 bg-surface px-2 py-1.5">JUMLAH</td>
                      {tanggalList.map((t) => {
                        const dayTotal = guruList.reduce((a, g) => a + (jpMatrix.get(`${g.id}|${t.tanggal}`) || 0), 0);
                        return <td key={t.tanggal} className="px-1 py-1.5 text-center text-emerald-700">{dayTotal || ''}</td>;
                      })}
                      <td className="px-2 py-1.5 text-center text-text-primary">
                        {guruList.reduce((a, g) => a + tanggalList.reduce((b, t) => b + (jpMatrix.get(`${g.id}|${t.tanggal}`) || 0), 0), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}

          {null}
        </>
      )}
    </div>
  );
}
