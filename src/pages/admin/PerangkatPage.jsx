import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Modal, Field, TextInput as Input } from '../../components/ui';
import { getDeviceRequests, getDevices, getDeviceAuditLogs, approveDeviceRequest, rejectDeviceRequest, revokeDevice } from '../../services/deviceService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function PerangkatPage() {
  const [tab, setTab] = useState('permintaan');
  const { role } = useAuth();
  const toast = useToast();
  const isSuperadmin = role === 'superadmin';

  const [requests, setRequests] = useState([]);
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'permintaan') setRequests(await getDeviceRequests());
      if (tab === 'perangkat') setDevices(await getDevices());
      if (tab === 'anomali') setLogs(await getDeviceAuditLogs());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [tab]);

  return (
    <>
      <PageHeader
        title="Perangkat & Anomali"
        subtitle="Kelola perangkat (device binding) guru untuk mencegah kecurangan absensi."
      />

      <div className="mb-5 flex border-b border-border-subtle">
        <button
          className={`px-4 py-2 font-medium ${tab === 'permintaan' ? 'border-b-2 border-brand-500 text-brand-700' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setTab('permintaan')}
        >Permintaan Ganti</button>
        <button
          className={`px-4 py-2 font-medium ${tab === 'perangkat' ? 'border-b-2 border-brand-500 text-brand-700' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setTab('perangkat')}
        >Perangkat Aktif</button>
        <button
          className={`px-4 py-2 font-medium ${tab === 'anomali' ? 'border-b-2 border-brand-500 text-brand-700' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setTab('anomali')}
        >Log Audit & Anomali</button>
      </div>

      <Card>
        {loading ? (
          <p className="p-4 text-center text-text-muted">Memuat data...</p>
        ) : (
          <>
            {tab === 'permintaan' && <TabPermintaan data={requests} onReload={loadData} isSuperadmin={isSuperadmin} />}
            {tab === 'perangkat' && <TabPerangkat data={devices} onReload={loadData} isSuperadmin={isSuperadmin} />}
            {tab === 'anomali' && <TabAnomali data={logs} />}
          </>
        )}
      </Card>
    </>
  );
}

function TabPermintaan({ data, onReload, isSuperadmin }) {
  const toast = useToast();
  const [rejectId, setRejectId] = useState(null);
  const [note, setNote] = useState('');

  async function handleApprove(id) {
    if (!confirm('Setujui permintaan ini? Perangkat lama akan dinonaktifkan.')) return;
    try {
      await approveDeviceRequest(id);
      toast.success('Permintaan disetujui');
      onReload();
    } catch (err) {
      toast.error('Gagal menyetujui');
    }
  }

  async function handleReject() {
    try {
      await rejectDeviceRequest(rejectId, note);
      toast.success('Permintaan ditolak');
      setRejectId(null);
      setNote('');
      onReload();
    } catch (err) {
      toast.error('Gagal menolak');
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-muted text-text-muted">
            <th className="p-3 font-medium">Tanggal</th>
            <th className="p-3 font-medium">Guru</th>
            <th className="p-3 font-medium">Perangkat Baru</th>
            <th className="p-3 font-medium">Alasan</th>
            <th className="p-3 font-medium">Status</th>
            {isSuperadmin && <th className="p-3 font-medium">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={6} className="p-3 text-center text-text-muted">Tidak ada permintaan.</td></tr>
          ) : data.map(r => (
            <tr key={r.id} className="border-b border-border-subtle">
              <td className="p-3">{new Date(r.created_at).toLocaleString('id-ID')}</td>
              <td className="p-3">{r.teacher?.name}</td>
              <td className="p-3">{r.device?.label}</td>
              <td className="p-3">{r.reason || '-'}</td>
              <td className="p-3">
                <span className={`rounded-full px-2 py-1 text-xs ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {r.status}
                </span>
              </td>
              {isSuperadmin && (
                <td className="p-3">
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button onClick={() => handleApprove(r.id)} size="sm">Setujui</Button>
                      <Button onClick={() => setRejectId(r.id)} variant="secondary" size="sm">Tolak</Button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={!!rejectId} onClose={() => setRejectId(null)} title="Tolak Permintaan">
        <Field label="Alasan Penolakan (Opsional)">
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Tulis catatan penolakan..." />
        </Field>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRejectId(null)}>Batal</Button>
          <Button onClick={handleReject}>Tolak Permintaan</Button>
        </div>
      </Modal>
    </div>
  );
}

function TabPerangkat({ data, onReload, isSuperadmin }) {
  const toast = useToast();
  
  async function handleRevoke(id) {
    if (!confirm('Anda yakin ingin mencabut izin perangkat ini? Guru harus mendaftar ulang.')) return;
    try {
      await revokeDevice(id);
      toast.success('Perangkat dicabut');
      onReload();
    } catch (err) {
      toast.error('Gagal mencabut perangkat');
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-muted text-text-muted">
            <th className="p-3 font-medium">Guru</th>
            <th className="p-3 font-medium">Perangkat</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Terakhir Dipakai</th>
            {isSuperadmin && <th className="p-3 font-medium">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={5} className="p-3 text-center text-text-muted">Tidak ada perangkat.</td></tr>
          ) : data.map(d => (
            <tr key={d.id} className="border-b border-border-subtle">
              <td className="p-3">{d.teacher?.name}</td>
              <td className="p-3">{d.label}</td>
              <td className="p-3">
                 <span className={`rounded-full px-2 py-1 text-xs ${d.status === 'active' ? 'bg-green-100 text-green-700' : d.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                  {d.status}
                </span>
              </td>
              <td className="p-3">{d.last_used_at ? new Date(d.last_used_at).toLocaleString('id-ID') : '-'}</td>
              {isSuperadmin && (
                <td className="p-3">
                  {d.status !== 'revoked' && (
                    <Button onClick={() => handleRevoke(d.id)} variant="secondary" size="sm">Cabut (Revoke)</Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabAnomali({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-muted text-text-muted">
            <th className="p-3 font-medium">Waktu</th>
            <th className="p-3 font-medium">Event</th>
            <th className="p-3 font-medium">Alasan</th>
            <th className="p-3 font-medium">IP / User Agent</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={4} className="p-3 text-center text-text-muted">Belum ada log anomali.</td></tr>
          ) : data.map(log => (
            <tr key={log.id} className={`border-b border-border-subtle ${['anomaly', 'unauthorized_attempt'].includes(log.event) ? 'bg-red-50' : ''}`}>
              <td className="p-3">{new Date(log.created_at).toLocaleString('id-ID')}</td>
              <td className="p-3 font-semibold">{log.event}</td>
              <td className="p-3">{log.reason_code || '-'} {log.meta && JSON.stringify(log.meta)}</td>
              <td className="p-3 text-xs max-w-xs truncate" title={log.user_agent}>{log.ip}<br/>{log.user_agent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
