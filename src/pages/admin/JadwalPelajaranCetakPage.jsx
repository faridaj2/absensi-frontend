import { useEffect, useMemo, useState } from 'react';
import { listAssignment, listJadwal } from '../../services/masterDataService';
import { extractError } from '../../services/apiClient';
import './jadwalPelajaranCetak.css';

const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const PALETTE = [
  { bg: '#dbeafe', bd: '#3b82f6', tx: '#1e3a8a' },
  { bg: '#dcfce7', bd: '#22c55e', tx: '#14532d' },
  { bg: '#fee2e2', bd: '#ef4444', tx: '#7f1d1d' },
  { bg: '#fef3c7', bd: '#f59e0b', tx: '#78350f' },
  { bg: '#ede9fe', bd: '#8b5cf6', tx: '#4c1d95' },
  { bg: '#cffafe', bd: '#06b6d4', tx: '#164e63' },
  { bg: '#fce7f3', bd: '#ec4899', tx: '#831843' },
  { bg: '#e0e7ff', bd: '#6366f1', tx: '#312e81' },
  { bg: '#ecfccb', bd: '#84cc16', tx: '#365314' },
  { bg: '#ffedd5', bd: '#f97316', tx: '#7c2d12' },
  { bg: '#d1fae5', bd: '#10b981', tx: '#064e3b' },
  { bg: '#fae8ff', bd: '#d946ef', tx: '#701a75' },
];

function hashToPalette(id) {
  const n = Number(id) || 0;
  return PALETTE[Math.abs(n) % PALETTE.length];
}

function jamKey(r) {
  if (r.jam_ke != null) return `k${String(r.jam_ke).padStart(3, '0')}`;
  if (r.jam_mulai) return `t${r.jam_mulai}`;
  return 'zzz';
}

function jamLabel(r) {
  if (r.jam_mulai && r.jam_selesai) {
    return `${String(r.jam_mulai).slice(0, 5)}–${String(r.jam_selesai).slice(0, 5)}`;
  }
  if (r.jam_ke != null) return `Jam ke-${r.jam_ke}`;
  return '-';
}

export default function JadwalPelajaranCetakPage() {
  const [rows, setRows] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const [a, j] = await Promise.all([listAssignment(), listJadwal()]);
        if (!alive) return;
        setRows(a || []);
        setJadwal(j || []);
      } catch (err) {
        if (alive) setError(extractError(err));
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (loading || error) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [loading, error]);

  const hariList = useMemo(() => {
    const set = new Set(rows.map((r) => r.hari));
    const fromJadwal = jadwal.map((j) => j.hari);
    const all = [...new Set([...set, ...fromJadwal])].filter(Boolean).sort((a, b) => a - b);
    return all.length > 0 ? all : [1, 2, 3, 4, 5, 6];
  }, [rows, jadwal]);

  const jamList = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const k = jamKey(r);
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          jam_ke: r.jam_ke,
          jam_mulai: r.jam_mulai,
          jam_selesai: r.jam_selesai,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [rows]);

  const cellMap = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = `${r.hari}|${jamKey(r)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return map;
  }, [rows]);

  const guruList = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const id = r.guru?.id ?? r.guru_id;
      if (!id) continue;
      if (!map.has(id)) map.set(id, { id, nama: r.guru?.name || `Guru #${id}` });
    }
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [rows]);

  const dicetakPada = new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="jp-cetak-root">
      <div className="jp-toolbar no-print">
        <button type="button" onClick={() => window.print()}>Cetak</button>
        <button type="button" onClick={() => window.close()}>Tutup</button>
      </div>

      <div className="jp-sheet">
        <div className="jp-title">
          <h1>JADWAL PELAJARAN</h1>
          <p>Matriks Hari × Jam · Kode warna per guru</p>
        </div>

        {loading ? (
          <div className="jp-empty">Memuat data...</div>
        ) : error ? (
          <div className="jp-empty">Gagal memuat: {error}</div>
        ) : rows.length === 0 ? (
          <div className="jp-empty">Belum ada jadwal pelajaran.</div>
        ) : (
          <>
            <div className="jp-wrap">
              <table className="jp-tbl">
                <thead>
                  <tr>
                    <th className="jp-th-jam">Jam</th>
                    {hariList.map((h) => (
                      <th key={h} className="jp-th-hari">{HARI[h] || `Hari ${h}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jamList.map((j) => (
                    <tr key={j.key}>
                      <td className="jp-td-jam">
                        <div className="jp-jam-label">{jamLabel(j)}</div>
                        {j.jam_ke != null && j.jam_mulai && (
                          <div className="jp-jam-sub">{String(j.jam_mulai).slice(0, 5)}–{String(j.jam_selesai || '').slice(0, 5)}</div>
                        )}
                      </td>
                      {hariList.map((h) => {
                        const items = cellMap.get(`${h}|${j.key}`) || [];
                        return (
                          <td key={h} className="jp-td-cell">
                            {items.length === 0 ? (
                              <span className="jp-kosong">–</span>
                            ) : (
                              <div className="jp-cell-stack">
                                {items.map((r) => {
                                  const p = hashToPalette(r.guru?.id ?? r.guru_id);
                                  return (
                                    <div
                                      key={r.id}
                                      className="jp-card"
                                      style={{ background: p.bg, borderColor: p.bd, color: p.tx }}
                                    >
                                      <div className="jp-card-mapel">{r.mapel?.nama_mapel || '-'}</div>
                                      <div className="jp-card-kelas">Kelas {r.kelas_nama || r.kelas_id || '-'}</div>
                                      <div className="jp-card-guru">{r.guru?.name || '-'}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="jp-legend">
              <div className="jp-legend-title">Keterangan Warna Guru:</div>
              <div className="jp-legend-grid">
                {guruList.map((g) => {
                  const p = hashToPalette(g.id);
                  return (
                    <div key={g.id} className="jp-legend-item">
                      <span className="jp-legend-swatch" style={{ background: p.bg, borderColor: p.bd }} />
                      <span>{g.nama}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="jp-footer">
              <span>Dicetak: {dicetakPada}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
