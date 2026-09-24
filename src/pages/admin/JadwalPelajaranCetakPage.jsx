import { useEffect, useMemo, useState } from 'react';
import { listAssignment, listJadwal, listJamIstirahat } from '../../services/masterDataService';
import { extractError } from '../../services/apiClient';
import './jadwalPelajaranCetak.css';

const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const PALETTE = [
  { bd: '#3b82f6' }, { bd: '#22c55e' }, { bd: '#ef4444' }, { bd: '#f59e0b' },
  { bd: '#8b5cf6' }, { bd: '#06b6d4' }, { bd: '#ec4899' }, { bd: '#6366f1' },
  { bd: '#84cc16' }, { bd: '#f97316' }, { bd: '#10b981' }, { bd: '#d946ef' },
];

function hashToPalette(id) {
  const n = Number(id) || 0;
  return PALETTE[Math.abs(n) % PALETTE.length];
}

// --- 1. Helper Normalisasi Baris Waktu ---
function normalizeTimeRows(assignments, istirahatList) {
  const warnings = [];
  const allItems = [
    ...assignments.map(a => ({ ...a, _type: 'pelajaran' })),
    ...istirahatList.map(i => ({ ...i, _type: 'istirahat' }))
  ];

  // 1. Bangun peta rentangWaktu -> nomorJam
  const timeToJamKe = new Map();
  for (const item of allItems) {
    if (item._type === 'pelajaran' && item.jam_ke != null) {
      const timeRange = (item.jam_mulai && item.jam_selesai)
        ? `${String(item.jam_mulai).slice(0,5)}-${String(item.jam_selesai).slice(0,5)}`
        : null;
      if (timeRange && !timeToJamKe.has(timeRange)) {
        timeToJamKe.set(timeRange, item.jam_ke);
      }
    }
  }

  const rowGroups = new Map();

  // 2 & 3. Pemetaan dan Penggabungan Baris
  for (const item of allItems) {
    let finalJamKe = item.jam_ke;
    const timeRange = (item.jam_mulai && item.jam_selesai)
      ? `${String(item.jam_mulai).slice(0,5)}-${String(item.jam_selesai).slice(0,5)}`
      : (item.jam_mulai ? String(item.jam_mulai).slice(0,5) : 'unknown');

    if (item._type === 'pelajaran') {
      // Petakan baris tanpa nomor jam ke nomor jam via rentang waktu
      if (finalJamKe == null && timeRange !== 'unknown' && timeToJamKe.has(timeRange)) {
        finalJamKe = timeToJamKe.get(timeRange);
      }
      // Jika bertentangan, nomor jam menang
      if (item.jam_ke != null && timeRange !== 'unknown' && timeToJamKe.has(timeRange)) {
        const mappedJam = timeToJamKe.get(timeRange);
        if (mappedJam !== item.jam_ke) {
          warnings.push(`Anomali label waktu: Waktu '${timeRange}' mayoritas tercatat di Jam ke-${mappedJam} tapi record ini diatur ke Jam ke-${item.jam_ke} (Mapel: ${item.mapel?.nama_mapel}). Mempertahankan Jam ke-${item.jam_ke}.`);
        }
      }
    }

    const rowKey = item._type === 'istirahat'
      ? `ist-${item.jam_mulai || item.label}`
      : (finalJamKe != null ? `jam-${finalJamKe}` : `unmapped-${timeRange}`);

    if (!rowGroups.has(rowKey)) {
      rowGroups.set(rowKey, {
        rowKey,
        jam_ke: finalJamKe,
        jam_mulai: item.jam_mulai,
        timeRange,
        type: item._type,
        label: item.label,
        items: []
      });
    }
    rowGroups.get(rowKey).items.push(item);
  }

  // 5 & 6. Gabung sel dan tangani konflik
  const normalizedRows = [];
  for (const group of rowGroups.values()) {
    const cellMap = new Map();
    let hasItems = false;

    for (const item of group.items) {
      if (!cellMap.has(item.hari)) cellMap.set(item.hari, []);
      const dayCards = cellMap.get(item.hari);

      const clsName = String(item.kelas_nama || item.kelas_id);
      const guruId = item.guru?.id ?? item.guru_id;
      const cardKey = item._type === 'istirahat'
        ? `ist-${item.label}`
        : `${clsName}-${item.mapel?.id || item.mapel?.nama_mapel}-${guruId}`;

      const exactDup = dayCards.find(c => c._cardKey === cardKey);
      if (!exactDup) {
        // Cek konflik: 2 mapel berbeda di (Hari + Jam + Kelas) yang sama
        if (item._type === 'pelajaran') {
          const conflict = dayCards.find(c => c._type === 'pelajaran' && String(c.kelas_nama || c.kelas_id) === clsName);
          if (conflict) {
            warnings.push(`Konflik jadwal: Hari ${HARI[item.hari]} Jam ke-${group.jam_ke || group.timeRange} Kelas ${clsName} menumpuk 2 pelajaran berbeda ('${conflict.mapel?.nama_mapel}' dan '${item.mapel?.nama_mapel}'). Kartu akan ditampilkan bertumpuk.`);
          }
        }
        dayCards.push({ ...item, _cardKey: cardKey });
        hasItems = true;
      }
    }

    if (hasItems || group.type === 'istirahat') {
      // 7. Catat yang gagal terpetakan ke jam ke-N
      if (group.type === 'pelajaran' && group.jam_ke == null) {
        warnings.push(`Baris tanpa nomor jam: Slot dengan rentang waktu '${group.timeRange}' gagal dipetakan ke nomor jam.`);
      }
      normalizedRows.push({ ...group, cells: cellMap });
    }
  }

  normalizedRows.sort((a, b) => {
    if (a.jam_ke != null && b.jam_ke != null) return a.jam_ke - b.jam_ke;
    if (a.jam_mulai && b.jam_mulai) return a.jam_mulai.localeCompare(b.jam_mulai);
    return 0;
  });

  return { rows: normalizedRows, warnings };
}

// --- Hook Penskalaan Cetak ---
function usePrintFit() {
  useEffect(() => {
    const handleBefore = () => {
      const sheet = document.querySelector('.jp-sheet');
      if (!sheet) return;
      const contentHeight = sheet.scrollHeight;
      const targetHeight = 720;
      if (contentHeight > targetHeight) {
        let scale = targetHeight / contentHeight;
        if (scale < 0.6) {
           scale = 0.6;
           const warn = document.getElementById('jp-print-warn');
           if (warn) warn.style.display = 'block';
        }
        sheet.style.transform = `scale(${scale})`;
        sheet.style.transformOrigin = 'top left';
        sheet.style.width = `${100 / scale}%`;
      }
    };
    const handleAfter = () => {
      const sheet = document.querySelector('.jp-sheet');
      if (sheet) {
         sheet.style.transform = '';
         sheet.style.width = '';
      }
      const warn = document.getElementById('jp-print-warn');
      if (warn) warn.style.display = 'none';
    };
    window.addEventListener('beforeprint', handleBefore);
    window.addEventListener('afterprint', handleAfter);
    return () => {
      window.removeEventListener('beforeprint', handleBefore);
      window.removeEventListener('afterprint', handleAfter);
    };
  }, []);
}

// --- Komponen Presentasional ---

function LessonCard({ item, colIdx }) {
  const p = hashToPalette(item.guru?.id ?? item.guru_id);
  return (
    <div
      className="jp-card"
      style={{ '--accent': p.bd, gridColumn: colIdx > 0 ? colIdx : 'auto' }}
    >
      <div className="jp-card-mapel-wrap">
        <span className="jp-card-mapel" title={item.mapel?.nama_mapel || '-'}>
          {item.mapel?.nama_mapel || '-'}
        </span>
      </div>
      <div className="jp-card-guru" title={item.guru?.name || '-'}>
        {item.guru?.name || '-'}
      </div>
    </div>
  );
}

function ScheduleCell({ items, classList }) {
  if (!items || items.length === 0) return <td className="jp-td-cell empty" />;
  return (
    <td className="jp-td-cell">
      <div className="jp-cell-stack" style={{ gridTemplateColumns: `repeat(${classList.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          if (item._type === 'istirahat') {
            return (
              <div key={`ist-${item.id}`} className="jp-card-istirahat">
                {item.label || 'Istirahat'}
              </div>
            );
          }
          const clsName = String(item.kelas_nama || item.kelas_id);
          const colIdx = classList.indexOf(clsName) + 1;
          return <LessonCard key={item._cardKey} item={item} colIdx={colIdx} />;
        })}
      </div>
    </td>
  );
}

function ScheduleTable({ normalizedRows, activeDays, classList }) {
  return (
    <table className="jp-tbl">
      <thead>
        <tr>
          <th className="jp-th-jam">Waktu</th>
          {activeDays.map((h) => (
            <th key={h} className="jp-th-hari">
              <div className="jp-day-name">{HARI[h]}</div>
              <div className="jp-class-names" style={{ gridTemplateColumns: `repeat(${classList.length}, minmax(0, 1fr))` }}>
                {classList.map(cls => (
                  <div key={cls} className="jp-class-name">
                    {cls.replace(/\s*(SMK|SMP|SMA)\s*/i, '')}
                  </div>
                ))}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {normalizedRows.map((r) => {
          const lblUtama = r.type === 'istirahat'
             ? (r.timeRange !== 'unknown' ? r.timeRange : 'Istirahat')
             : (r.jam_ke != null ? `Jam ke-${r.jam_ke}` : (r.timeRange !== 'unknown' ? r.timeRange : '-'));
          const lblSub = r.type === 'pelajaran' && r.jam_ke != null && r.timeRange !== 'unknown' ? r.timeRange : null;
             
          return (
            <tr key={r.rowKey}>
              <td className="jp-td-jam">
                <span className="jp-jam-label">{lblUtama}</span>
                {lblSub && <span className="jp-jam-sub">{lblSub}</span>}
              </td>
              {activeDays.map((h) => (
                <ScheduleCell key={`${r.rowKey}-${h}`} items={r.cells.get(h)} classList={classList} />
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TeacherLegend({ guruList }) {
  return (
    <div className="jp-legend">
      <div className="jp-legend-title">Guru Pengajar:</div>
      {guruList.map((g) => {
        const p = hashToPalette(g.id);
        return (
          <div key={g.id} className="jp-legend-item">
            <span className="jp-legend-swatch" style={{ backgroundColor: p.bd }} />
            <span>{g.nama}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- Komponen Halaman Utama ---

export default function JadwalPelajaranCetakPage() {
  const [rows, setRows] = useState([]);
  const [istirahat, setIstirahat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePrintFit();

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const [a, , ist] = await Promise.all([listAssignment(), listJadwal(), listJamIstirahat()]);
        if (!alive) return;
        setRows(a || []);
        setIstirahat(ist || []);
      } catch (err) {
        if (alive) setError(extractError(err));
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, []);

  const { rows: normalizedRows, warnings } = useMemo(() => {
    return normalizeTimeRows(rows, istirahat);
  }, [rows, istirahat]);

  const activeDays = useMemo(() => {
    const days = new Set();
    for (const r of normalizedRows) {
      for (const d of r.cells.keys()) days.add(d);
    }
    const list = HARI.map((_, i) => i).filter(h => days.has(h)).sort((a, b) => a - b);
    return list.length > 0 ? list : [1, 2, 3, 4, 5];
  }, [normalizedRows]);

  const classList = useMemo(() => {
    const set = new Set(rows.map(r => String(r.kelas_nama || r.kelas_id)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
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

  if (warnings.length > 0) {
    warnings.forEach(w => console.warn("Data Warning:", w));
  }

  return (
    <div className="jp-cetak-root">
      <div className="jp-toolbar no-print">
        <button type="button" onClick={() => window.print()}>Cetak</button>
        <button type="button" onClick={() => window.close()}>Tutup</button>
      </div>

      {warnings.length > 0 && (
        <div className="jp-warnings no-print">
          <strong>Peringatan Data Anomali (disembunyikan saat dicetak):</strong>
          <ul className="list-disc pl-5 mt-1 text-left">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div id="jp-print-warn" className="jp-warnings no-print" style={{ display: 'none' }}>
        Jadwal terlalu padat. Skala sudah ditekan maksimal (60%). Mungkin akan ada konten yang terpotong.
      </div>

      <div className="jp-sheet">
        <div className="jp-title">
          <h1>Jadwal Pelajaran</h1>
          <p>Daftar Pelajaran dan Guru Pengajar</p>
        </div>

        {loading ? (
          <div className="jp-empty">Memuat data...</div>
        ) : error ? (
          <div className="jp-empty">Gagal memuat: {error}</div>
        ) : normalizedRows.length === 0 ? (
          <div className="jp-empty">Belum ada jadwal pelajaran.</div>
        ) : (
          <>
            <ScheduleTable 
              normalizedRows={normalizedRows} 
              activeDays={activeDays} 
              classList={classList} 
            />
            <TeacherLegend guruList={guruList} />
            <div className="jp-footer">Dicetak: {dicetakPada}</div>
          </>
        )}
      </div>
    </div>
  );
}
