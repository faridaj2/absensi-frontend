const MAP = {
  hadir: { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Hadir' },
  tepat_waktu: { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Tepat Waktu' },
  telat: { bg: 'bg-status-danger-bg', text: 'text-status-danger-text', label: 'Telat' },
  alpa: { bg: 'bg-status-danger-bg', text: 'text-status-danger-text', label: 'Alpa' },
  izin: { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'Izin' },
  sakit: { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'Sakit' },
  belum: { bg: 'bg-status-info-bg', text: 'text-status-info-text', label: 'Belum Absen' },
  pending: { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'Pending' },
  aktif: { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Aktif' },
};

export default function StatusBadge({ status, label }) {
  const s = MAP[status] || { bg: 'bg-status-info-bg', text: 'text-status-info-text', label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      {label || s.label}
    </span>
  );
}
