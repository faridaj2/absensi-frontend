import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { laporanSiswa } from '../../services/laporanService';
import { extractError } from '../../services/apiClient';
import './laporanCetak.css';

const STATUS_LABEL = { hadir: 'Hadir', alpa: 'Alpa', izin: 'Izin', sakit: 'Sakit' };

function badgeClass(status) {
  const k = String(status || '').toLowerCase();
  return ['hadir', 'alpa', 'izin', 'sakit'].includes(k) ? k : 'lain';
}

function hasKeterangan(v) {
  if (v == null) return false;
  const t = String(v).trim();
  return t !== '' && t !== '-';
}

function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function computeStats(rows) {
  const s = { total: rows.length, hadir: 0, alpa: 0, izin: 0, sakit: 0 };
  for (const r of rows) {
    const k = String(r.status || '').toLowerCase();
    if (k in s) s[k] += 1;
  }
  return s;
}

function groupRows(rows) {
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
}

export default function LaporanCetakPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dari = params.get('dari') || '';
  const sampai = params.get('sampai') || '';
  const kelasId = params.get('kelas_id') || '';
  const kelasNama = params.get('kelas_nama') || '';
  const mapelId = params.get('mapel_id') || '';
  const mapelNama = params.get('mapel_nama') || '';

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const q = {};
        if (dari) q.dari = dari;
        if (sampai) q.sampai = sampai;
        if (kelasId) q.kelas_id = kelasId;
        if (mapelId) q.mapel_id = mapelId;
        const data = await laporanSiswa(q);
        if (!alive) return;
        setRows(data);
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
  }, [dari, sampai, kelasId, mapelId]);

  const groups = useMemo(() => groupRows(rows), [rows]);
  const totalStats = useMemo(() => computeStats(rows), [rows]);

  const instansi = user?.instansi;
  const namaInstansi = instansi?.nama || 'Instansi';
  const inisial = (instansi?.jenis || namaInstansi).slice(0, 3).toUpperCase();

  const dicetakPada = new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const periode = dari || sampai
    ? `${dari ? formatTanggal(dari) : '...'} s/d ${sampai ? formatTanggal(sampai) : '...'}`
    : 'Semua tanggal';

  // Auto-trigger print setelah data siap
  useEffect(() => {
    if (loading || error) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [loading, error]);

  return (
    <div className="lp-cetak-root">
      <div className="lp-toolbar no-print">
        <button type="button" onClick={() => window.print()}>Cetak Ulang</button>
        <button type="button" onClick={() => window.close()}>Tutup</button>
      </div>

      <div className="lp-sheet">
        {/* KOP */}
        <div className="lp-kop">
          <div className="lp-kop-logo">{inisial}</div>
          <div className="lp-kop-text">
            <h1>{namaInstansi}</h1>
            {instansi?.alamat && <p>{instansi.alamat}</p>}
            {instansi?.jenis && <p>Jenis: {instansi.jenis}</p>}
          </div>
        </div>

        <div className="lp-title">
          <h2>LAPORAN ABSENSI SISWA</h2>
        </div>

        <div className="lp-meta">
          <span>Periode: <b>{periode}</b></span>
          {kelasNama && <span>Kelas: <b>{kelasNama}</b></span>}
          {mapelNama && <span>Mata Pelajaran: <b>{mapelNama}</b></span>}
          <span>Total: <b>{totalStats.total} siswa</b> ({totalStats.hadir} H · {totalStats.alpa} A · {totalStats.izin} I · {totalStats.sakit} S)</span>
          <span>Dicetak: <b>{dicetakPada}</b></span>
        </div>

        {loading ? (
          <div className="lp-empty">Memuat data...</div>
        ) : error ? (
          <div className="lp-empty">Gagal memuat: {error}</div>
        ) : groups.length === 0 ? (
          <div className="lp-empty">Tidak ada data absensi untuk filter ini.</div>
        ) : (
          groups.map((g, gi) => {
            const st = computeStats(g.rows);
            return (
              <div className="lp-sesi" key={gi}>
                <div className="lp-sesi-head">
                  <span>{g.meta.mapel || '-'}</span>
                  <span className="dot">·</span>
                  <span>Kelas {g.meta.kelas || '-'}</span>
                  {g.meta.jam_ke != null && (
                    <>
                      <span className="dot">·</span>
                      <span>Jam ke-{g.meta.jam_ke}</span>
                    </>
                  )}
                  {g.meta.tanggal && (
                    <>
                      <span className="dot">·</span>
                      <span>{formatTanggal(g.meta.tanggal)}</span>
                    </>
                  )}
                  {g.meta.dicatat_oleh && (
                    <>
                      <span className="dot">·</span>
                      <span>oleh {g.meta.dicatat_oleh}</span>
                    </>
                  )}
                  <span className="lp-sesi-stat">
                    {st.total} siswa ({st.hadir}H/{st.alpa}A/{st.izin}I/{st.sakit}S)
                  </span>
                </div>
                <table className="lp-tbl">
                  <thead>
                    <tr>
                      <th className="num">#</th>
                      <th>Nama Siswa</th>
                      <th className="st">Status</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r, i) => (
                      <tr key={r.id}>
                        <td className="num">{i + 1}</td>
                        <td>{r.siswa_nama || r.siswa_id}</td>
                        <td className="st">
                          <span className={`lp-badge ${badgeClass(r.status)}`}>
                            {STATUS_LABEL[String(r.status || '').toLowerCase()] || r.status || '-'}
                          </span>
                        </td>
                        <td className="ket">{hasKeterangan(r.keterangan) ? r.keterangan : '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        {/* TANDA TANGAN */}
        {!loading && !error && groups.length > 0 && (
          <div className="lp-ttd">
            <div className="lp-ttd-col">
              <div>Mengetahui,</div>
              <div>Kepala Sekolah</div>
              <div className="space" />
              <div className="line" />
            </div>
            <div className="lp-ttd-col">
              <div>{dicetakPada.split(',')[0]}</div>
              <div>Wali Kelas</div>
              <div className="space" />
              <div className="line" />
            </div>
          </div>
        )}

        <div className="lp-footer">
          <span>{namaInstansi} — Sistem Absensi</span>
          <span>Halaman 1</span>
        </div>
      </div>
    </div>
  );
}
