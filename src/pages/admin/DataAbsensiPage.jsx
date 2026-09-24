import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, DateField, Field } from '../../components/ui';
import { riwayatAbsensi, deleteAbsensiPegawai } from '../../services/absensiService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

export default function DataAbsensiPage() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));

  async function load() {
    setLoading(true);
    try {
      const res = await riwayatAbsensi({ dari: tanggal, sampai: tanggal });
      setData(res);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tanggal]);

  async function handleDelete(id) {
    if (!window.confirm('Hapus record absensi ini? Pegawai yang bersangkutan akan bisa melakukan absen ulang.')) return;
    try {
      await deleteAbsensiPegawai(id);
      toast.success('Record absensi berhasil dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Data Absensi"
        subtitle="Pantau dan kelola data absensi."
      >
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? 'Memuat...' : 'Refresh'}
        </Button>
      </PageHeader>

      <Card className="mb-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Tanggal Absensi">
            <DateField value={tanggal} onChange={setTanggal} />
          </Field>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Pegawai</th>
                <th className="px-4 py-3 font-medium">Jenis</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Keterangan</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">Tidak ada data absensi pada tanggal ini.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{item.user?.name}</p>
                      <p className="text-xs text-text-muted capitalize">{item.user?.role}</p>
                    </td>
                    <td className="px-4 py-3 uppercase text-xs font-semibold">{item.jenis || '-'}</td>
                    <td className="px-4 py-3 text-text-primary">{item.waktu_absen ? new Date(item.waktu_absen).toLocaleTimeString('id-ID') : '-'}</td>
                    <td className="px-4 py-3 text-text-primary capitalize font-medium">
                      {item.keterangan ? item.keterangan : (item.status ? item.status : '-')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
