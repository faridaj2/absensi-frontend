import { useState, useMemo } from 'react';

const STATUS_CONFIG = {
  H: { label: 'Hadir', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  A: { label: 'Alpa', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
  I: { label: 'Izin', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  S: { label: 'Sakit', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' },
};

// Backend mengirim status dalam bentuk kata ('hadir','alpa','izin','sakit').
// Normalisasi ke kode H/A/I/S agar konsisten untuk matriks & ringkasan.
function normalizeStatus(s) {
  const v = String(s ?? '').trim().toLowerCase();
  if (v === 'hadir' || v === 'h' || v === 'masuk') return 'H';
  if (v === 'alpa' || v === 'a') return 'A';
  if (v === 'izin' || v === 'i') return 'I';
  if (v === 'sakit' || v === 's') return 'S';
  return 'H';
}

function formatDate(id) {
  const d = new Date(id + 'T00:00:00');
  if (isNaN(d.getTime())) return { day: '-', date: '-' };
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return {
    day: days[d.getDay()],
    date: d.getDate(),
    full: `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
  };
}

function StatCard({ title, value, subtitle, highlight }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-red-500/10 border-red-500/20' : 'bg-surface-card border-border-subtle'}`}>
      <div className={`text-2xl font-bold ${highlight ? 'text-red-400' : 'text-text-primary'}`}>
        {value}
      </div>
      <div className="text-xs text-text-muted mt-0.5">{title}</div>
      {subtitle && <div className="text-[11px] text-text-muted mt-1">{subtitle}</div>}
    </div>
  );
}

function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.H;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded-md font-medium ${config.bg} ${config.text} ${config.border} border ${sizeClasses}`}>
      {config.label}
    </span>
  );
}

export default function RekapSiswaPanel({ rows, bulanLabel, bulan }) {
  const [selectedCell, setSelectedCell] = useState(null);

  const matrixData = useMemo(() => {
    if (!rows || rows.length === 0) return { students: [], dates: [], summary: {} };

    const dates = [...new Set(rows.map(d => d.tanggal))].sort();
    const studentMap = {};

    rows.forEach(row => {
      const sId = row.siswa_id;
      if (!sId) return;
      if (!studentMap[sId]) {
        studentMap[sId] = {
          id: sId,
          name: row.siswa_nama || row.siswa?.nama || 'Unknown',
          kelas: row.kelas_nama || row.kelas_id || '-',
          days: {},
          total: { H: 0, A: 0, I: 0, S: 0 }
        };
      }
      if (!studentMap[sId].days[row.tanggal]) {
        studentMap[sId].days[row.tanggal] = [];
      }
      studentMap[sId].days[row.tanggal].push(row);

      const st = normalizeStatus(row.status);
      studentMap[sId].total[st]++;
    });

    let students = Object.values(studentMap).map(s => {
      const totalSessions = s.total.H + s.total.A + s.total.I + s.total.S;
      s.attendanceRate = totalSessions > 0 ? ((s.total.H / totalSessions) * 100).toFixed(1) : 0;
      return s;
    });

    students.sort((a, b) => b.total.A - a.total.A);

    const totalSessions = rows.length;
    const totalH = rows.filter(d => normalizeStatus(d.status) === 'H').length;
    const classAvg = totalSessions > 0 ? ((totalH / totalSessions) * 100).toFixed(1) : 0;

    const totalA = rows.filter(d => normalizeStatus(d.status) === 'A').length;
    const below85 = students.filter(s => parseFloat(s.attendanceRate) < 85).length;

    const dayAbsences = {};
    dates.forEach(d => dayAbsences[d] = 0);
    rows.filter(d => normalizeStatus(d.status) === 'A').forEach(d => {
      if (d.tanggal) dayAbsences[d.tanggal]++;
    });
    const worstDay = Object.keys(dayAbsences).reduce((a, b) => dayAbsences[a] > dayAbsences[b] ? a : b, dates[0] || '-');
    const worstDayInfo = formatDate(worstDay);
    const worstDayCount = Object.values(dayAbsences).reduce((a, b) => Math.max(a, b), 0);

    return {
      students,
      dates,
      summary: {
        avg: classAvg,
        totalA,
        below85,
        worstDay: { date: worstDayInfo.full, count: worstDayCount }
      }
    };
  }, [rows]);

  const getWorstStatus = (sessions) => {
    if (!sessions || sessions.length === 0) return { status: 'H', count: 0, total: 0 };
    const weight = { A: 4, S: 3, I: 2, H: 1 };
    let worstStatus = normalizeStatus(sessions[0].status);
    for (const s of sessions) {
      const cSt = normalizeStatus(s.status);
      if ((weight[cSt] || 1) > (weight[worstStatus] || 1)) {
        worstStatus = cSt;
      }
    }
    const absentCount = sessions.filter(s => normalizeStatus(s.status) !== 'H').length;
    return { status: worstStatus, count: absentCount, total: sessions.length };
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-medium text-text-primary">Belum ada data absensi bulan ini.</p>
        <p className="mt-1 text-xs text-text-muted">Silakan pilih bulan lain atau pastikan guru sudah menginput absensi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          title="Rata-rata kehadiran"
          value={`${matrixData.summary.avg}%`}
        />
        <StatCard 
          title="Jam pelajaran alpa"
          value={matrixData.summary.totalA}
        />
        <StatCard 
          title="Kehadiran di bawah 85%"
          value={`${matrixData.summary.below85} siswa`}
          highlight={matrixData.summary.below85 > 0}
        />
        <StatCard 
          title="Hari terburuk"
          value={(matrixData.summary.worstDay.date || '-').split(',')[0]}
          subtitle={`${matrixData.summary.worstDay.count} siswa tidak hadir`}
        />
      </div>

      {/* LEGENDA */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
          <span>Hadir</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div>
          <span>Alpa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30"></div>
          <span>Izin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-500/20 border border-slate-500/30"></div>
          <span>Sakit</span>
        </div>
        <div className="text-[11px] text-text-muted/70">
          Angka kecil = jam pelajaran yang tidak hadir
        </div>
      </div>

      {/* TABEL MATRIKS */}
      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="sticky left-0 z-10 bg-surface-card px-3 py-2.5 text-left font-medium text-text-muted border-r border-border-subtle min-w-[180px]">
                Siswa
              </th>
              {matrixData.dates.map(date => {
                const fd = formatDate(date);
                const absentCount = matrixData.students.filter(s => {
                  const day = s.days[date];
                  return day && day.some(sess => normalizeStatus(sess.status) === 'A');
                }).length;
                const isBadDay = absentCount >= 6 || (matrixData.students.length > 0 && (absentCount / matrixData.students.length) > 0.3);
                
                return (
                  <th key={date} className={`px-1 py-2 text-center font-medium min-w-[36px] ${isBadDay ? 'text-red-400' : 'text-text-muted'}`}>
                    <div className="text-[10px] leading-tight">{fd.day}</div>
                    <div className={`text-sm font-bold ${isBadDay ? 'text-red-400' : 'text-text-primary'}`}>{fd.date}</div>
                  </th>
                );
              })}
              <th className="px-2 py-2 text-center font-medium text-text-muted border-l border-border-subtle min-w-[40px]">Alpa</th>
              <th className="px-2 py-2 text-center font-medium text-text-muted min-w-[40px]">Izin</th>
              <th className="px-2 py-2 text-center font-medium text-text-muted min-w-[40px]">Sakit</th>
              <th className="px-3 py-2 text-right font-medium text-text-muted min-w-[120px]">Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {matrixData.students.map((student) => (
              <tr key={student.id} className="hover:bg-surface/50 transition-colors">
                <td className="sticky left-0 z-10 bg-surface-card px-3 py-2 font-medium text-text-primary border-r border-border-subtle">
                  {student.name}
                </td>
                {matrixData.dates.map(date => {
                  const sessions = student.days[date];
                  if (!sessions) {
                    return <td key={date} className="px-1 py-2"><div className="w-7 h-7 rounded bg-surface/30 mx-auto"></div></td>;
                  }

                  const worst = getWorstStatus(sessions);
                  const st = worst.status;
                  const config = STATUS_CONFIG[st] || STATUS_CONFIG.H;
                  const label = worst.count > 0 && worst.count < worst.total 
                    ? <><span className="text-[10px]">A</span><span className="text-[8px] opacity-70">{worst.count}/{worst.total}</span></>
                    : st;

                  return (
                    <td key={date} className="px-1 py-2">
                      <button
                        onClick={() => setSelectedCell({ student, date, sessions })}
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-bold ${config.bg} ${config.text} ${config.border} border hover:ring-2 hover:ring-brand-500/50 transition-all`}
                        title={`${student.name} - ${formatDate(date).full}`}
                      >
                        <span className="leading-none">{label}</span>
                      </button>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-bold text-red-400 border-l border-border-subtle tabular-nums">
                  {student.total.A}
                </td>
                <td className="px-2 py-2 text-center text-amber-400 tabular-nums">
                  {student.total.I || '-'}
                </td>
                <td className="px-2 py-2 text-center text-slate-400 tabular-nums">
                  {student.total.S || '-'}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`tabular-nums ${student.attendanceRate < 85 ? 'text-red-400 font-bold' : 'text-emerald-400 font-medium'}`}>
                      {student.attendanceRate}%
                    </span>
                    <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${student.attendanceRate < 85 ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ width: `${student.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PANEL DETAIL SESI */}
      {selectedCell && (
        <div className="rounded-xl border border-border-subtle bg-surface-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle bg-surface/50">
            <h3 className="font-semibold text-text-primary">
              {selectedCell.student.name}
              <span className="text-text-muted font-normal"> • {formatDate(selectedCell.date).full}</span>
            </h3>
          </div>
          <div className="divide-y divide-border-subtle">
            {[...selectedCell.sessions]
              .sort((a, b) => (a.jam_ke ?? 0) - (b.jam_ke ?? 0))
              .map((ses, i) => {
              const st = normalizeStatus(ses.status);
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{ses.mapel || 'Lainnya'}</span>
                    <span className="text-text-muted text-xs">• jam ke-{ses.jam_ke}</span>
                  </div>
                  <StatusBadge status={st} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
