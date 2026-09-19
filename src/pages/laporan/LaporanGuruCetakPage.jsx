import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { laporanRekapGuru } from '../../services/laporanService';
import { extractError } from '../../services/apiClient';
import './laporanCetak.css';
import './laporanGuruCetak.css';

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

function formatBulanTahun(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function hhmm(t) {
  if (!t) return '-';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

export default function LaporanGuruCetakPage() {
  const [params] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sectionParam = params.get('section');
  const [sections, setSections] = useState(() => {
    if (!sectionParam) return { A: true, B: true };
    const s = sectionParam.toUpperCase();
    return { A: s.includes('A'), B: s.includes('B') || !s.includes('A') };
  });

  function toggleSection(k) {
    setSections((s) => ({ ...s, [k]: !s[k] }));
  }

  const allOff = !sections.A && !sections.B;

  const dari = params.get('dari') || '';
  const sampai = params.get('sampai') || '';
  const instansiId = params.get('instansi_id') || '';
  const guruId = params.get('guru_id') || '';

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setError('');
      try {
        const q = {};
        if (dari) q.dari = dari;
        if (sampai) q.sampai = sampai;
        if (instansiId) q.instansi_id = instansiId;
        if (guruId) q.guru_id = guruId;
        const res = await laporanRekapGuru(q);
        if (alive) {
          let filtered = res;
          const guruOnly = params.get('guru_id');
          const onlyGuru = params.get('only_guru') === '1';
          if (onlyGuru && guruOnly && res?.guru) {
            filtered = { ...res, guru: res.guru.filter((g) => String(g.id) === String(guruOnly)) };
          }
          setData(filtered);
        }
      } catch (err) {
        if (alive) setError(extractError(err));
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [dari, sampai, instansiId, guruId]);

  useEffect(() => {
    if (loading || error) return;
    if (sectionParam) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [loading, error, sectionParam]);

  const instansi = data?.instansi || {};
  const periode = data?.periode || {};
  const tanggalList = data?.tanggal_list || [];
  const guruList = data?.guru || [];
  const detailJam = data?.detail_jam || [];

  const dicetakPada = new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

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

  return (
    <div className="lp-cetak-root lg-cetak-root">
      <div className="lp-toolbar no-print">
        <span className="lp-toolbar-label">Tampilkan:</span>
        {['A', 'B'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => toggleSection(k)}
            className={`lp-toolbar-toggle ${sections[k] ? 'is-on' : 'is-off'}`}
            title={
              k === 'A'
                ? 'Rekap Kehadiran Guru'
                : 'Daftar Kehadiran Harian'
            }
          >
            {sections[k] ? '\u2713 ' : '\u2715 '}
            {k}
          </button>
        ))}
        <span className="lp-toolbar-sep" />
        <button type="button" onClick={() => window.print()}>Cetak</button>
        <button type="button" onClick={() => window.close()}>Tutup</button>
      </div>

      <div className="lp-sheet lg-sheet">
        {/* KOP */}
        <div className="lp-kop">
          <div className="lp-kop-logo">{(instansi.nama || 'SKL').slice(0, 3).toUpperCase()}</div>
          <div className="lp-kop-text">
            <h1>{instansi.nama || 'Nama Sekolah'}</h1>
            {instansi.alamat && <p>{instansi.alamat}</p>}
            {instansi.jenis && <p>Jenis: {instansi.jenis}</p>}
          </div>
        </div>

        <div className="lp-title">
          <h2>LAPORAN KEHADIRAN DAN JAM MENGAJAR GURU</h2>
        </div>

        <div className="lp-meta">
          <span>Periode: <b>{periode.dari ? formatTanggalPanjang(periode.dari) : '-'} s/d {periode.sampai ? formatTanggalPanjang(periode.sampai) : '-'}</b></span>
          {periode.dari && <span>Bulan: <b>{formatBulanTahun(periode.dari)}</b></span>}
          <span>Jumlah Hari: <b>{periode.jumlah_hari || 0}</b></span>
          <span>Total Guru: <b>{guruList.length}</b></span>
          <span>Total JP: <b>{totalJP}</b></span>
        </div>

        {loading ? (
          <div className="lp-empty">Memuat data...</div>
        ) : error ? (
          <div className="lp-empty">Gagal memuat: {error}</div>
        ) : guruList.length === 0 ? (
          <div className="lp-empty">Tidak ada data guru untuk periode ini.</div>
        ) : allOff ? (
          <div className="lp-empty">Pilih minimal satu bagian (A/B) untuk ditampilkan.</div>
        ) : (
          <>
            {/* ===== BAGIAN 1: REKAP KEHADIRAN ===== */}
            <section className="lg-section" style={{ display: sections.A ? '' : 'none' }}>
              <h3 className="lg-sec-title">A. REKAP KEHADIRAN GURU</h3>
              <table className="lp-tbl lg-tbl-rekap">
                <thead>
                  <tr>
                    <th className="num">No</th>
                    <th>Nama Guru</th>
                    <th className="ctr">Hadir</th>
                    <th className="ctr">Izin</th>
                    <th className="ctr">Sakit</th>
                    <th className="ctr">Alpa</th>
                    <th className="ctr">Total JP Mengajar</th>
                    <th className="ctr">Realisasi JP</th>
                  </tr>
                </thead>
                <tbody>
                  {guruList.map((g, i) => (
                    <tr key={g.id}>
                      <td className="num">{i + 1}</td>
                      <td>{g.nama}</td>
                      <td className="ctr">{g.stat.hadir}</td>
                      <td className="ctr">{g.stat.izin}</td>
                      <td className="ctr">{g.stat.sakit}</td>
                      <td className="ctr">{g.stat.alpa}</td>
                      <td className="ctr"><b>{g.jp_jadwal}</b></td>
                      <td className="ctr">{g.jp_realisasi}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="ctr"><b>JUMLAH</b></td>
                    <td className="ctr"><b>{guruList.reduce((a, b) => a + b.stat.hadir, 0)}</b></td>
                    <td className="ctr"><b>{guruList.reduce((a, b) => a + b.stat.izin, 0)}</b></td>
                    <td className="ctr"><b>{guruList.reduce((a, b) => a + b.stat.sakit, 0)}</b></td>
                    <td className="ctr"><b>{guruList.reduce((a, b) => a + b.stat.alpa, 0)}</b></td>
                    <td className="ctr"><b>{guruList.reduce((a, b) => a + b.jp_jadwal, 0)}</b></td>
                    <td className="ctr"><b>{guruList.reduce((a, b) => a + b.jp_realisasi, 0)}</b></td>
                  </tr>
                </tfoot>
              </table>
              <div className="lg-legend">
                Kode kehadiran: <b>H</b> = Hadir, <b>I</b> = Izin, <b>S</b> = Sakit, <b>A</b> = Alpa, <b>L</b> = Libur
              </div>
            </section>

            {/* ===== BAGIAN 2: TABEL KEHADIRAN HARIAN ===== */}
            <section
              className={`lg-section lg-section-harian${sections.B && sections.A ? ' has-break' : ''}`}
              style={{ display: sections.B ? '' : 'none' }}
            >
              <h3 className="lg-sec-title">B. DAFTAR KEHADIRAN HARIAN ({tanggalList.length} HARI)</h3>
              <div className="lg-harian-wrap">
                <table className="lp-tbl lg-tbl-harian">
                  <thead>
                    <tr>
                      <th className="num" rowSpan={2}>No</th>
                      <th rowSpan={2} className="lg-nama-col">Nama Guru</th>
                      <th colSpan={tanggalList.length} className="ctr">Tanggal</th>
                      <th rowSpan={2} className="ctr lg-th-total">Total</th>
                    </tr>
                    <tr>
                      {tanggalList.map((t) => (
                        <th key={t.tanggal} className={`ctr lg-th-tgl ${t.is_libur ? 'is-libur' : ''}`}>
                          <div className="lg-tgl-day">{formatTanggal(t.tanggal)}</div>
                          <div className="lg-tgl-hari">{HARI_LABEL[t.hari]}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guruList.map((g, i) => {
                      const totalRow = tanggalList.reduce((a, t) => a + (jpMatrix.get(`${g.id}|${t.tanggal}`) || 0), 0);
                      return (
                      <tr key={g.id}>
                        <td className="num">{i + 1}</td>
                        <td className="lg-nama-col">{g.nama}</td>
                        {tanggalList.map((t) => {
                          const jp = jpMatrix.get(`${g.id}|${t.tanggal}`) || 0;
                          const k = g.harian?.[t.tanggal] || '-';
                          if (jp > 0) {
                            return (
                              <td key={t.tanggal} className="ctr lg-kode lg-kode-h font-bold">
                                {jp}
                              </td>
                            );
                          }
                          return (
                            <td key={t.tanggal} className={`ctr lg-kode lg-kode-${k.toLowerCase()}`}>
                              {k}
                            </td>
                          );
                        })}
                        <td className="ctr lg-total-cell"><b>{totalRow}</b></td>
                      </tr>
                      );
                    })}
                    <tr className="lg-total-row">
                      <td colSpan={2} className="ctr"><b>JUMLAH</b></td>
                      {tanggalList.map((t) => {
                        const dayTotal = guruList.reduce((a, g) => a + (jpMatrix.get(`${g.id}|${t.tanggal}`) || 0), 0);
                        return <td key={t.tanggal} className="ctr">{dayTotal || ''}</td>;
                      })}
                      <td className="ctr"><b>{guruList.reduce((a, g) => a + tanggalList.reduce((b, t) => b + (jpMatrix.get(`${g.id}|${t.tanggal}`) || 0), 0), 0)}</b></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>



            {/* TANDA TANGAN */}
            <div className="lp-ttd">
              <div className="lp-ttd-col">
                <div>Mengetahui,</div>
                <div><b>Kepala Sekolah</b></div>
                <div className="space" />
                <div className="line" />
                <div className="lg-nama-ttd">(...................................)</div>
              </div>
              <div className="lp-ttd-col">
                <div>{dicetakPada.split(',')[0]}</div>
                <div><b>Petugas / Admin</b></div>
                <div className="space" />
                <div className="line" />
                <div className="lg-nama-ttd">(...................................)</div>
              </div>
            </div>
          </>
        )}

        <div className="lp-footer">
          <span>{instansi.nama || 'Sekolah'} — Sistem Absensi</span>
          <span>Dicetak: {dicetakPada}</span>
        </div>
      </div>
    </div>
  );
}
