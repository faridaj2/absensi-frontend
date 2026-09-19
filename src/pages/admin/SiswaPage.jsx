import { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, Button, Field, SelectInput } from '../../components/ui';
import { listKelas, listSiswa } from '../../services/masterDataService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

export default function SiswaPage() {
  const toast = useToast();
  const [kelas, setKelas] = useState([]);
  const [kelasId, setKelasId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listKelas()
      .then((list) => {
        setKelas(list);
        if (list.length > 0) setKelasId(list[0].kode || list[0].id);
      })
      .catch((err) => toast.error(extractError(err)));
  }, []);

  async function load() {
    if (!kelasId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listSiswa(kelasId);
      setRows(data || []);
    } catch (err) {
      setError(extractError(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  const kelasOptions = useMemo(
    () => kelas.map((k) => ({ value: k.kode || k.id, label: k.nama })),
    [kelas]
  );

  return (
    <>
      <PageHeader
        title="Data Siswa"
        subtitle="Daftar siswa per kelas, ditarik dari sistem admin sekolah."
      />

      <Card className="mb-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Pilih Kelas">
            <SelectInput
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              placeholder={kelasOptions.length === 0 ? 'Belum ada kelas' : 'Pilih kelas'}
              options={kelasOptions}
            />
          </Field>
          <Button onClick={load} disabled={loading || !kelasId}>
            {loading ? 'Memuat...' : 'Tampilkan'}
          </Button>
        </div>
      </Card>

      {error && (
        <div className="mb-4 rounded-xl bg-status-danger-bg px-4 py-2.5 text-sm text-status-danger-text">
          {error}
        </div>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Daftar Siswa</h2>
          <span className="text-xs text-text-muted">{rows.length} siswa</span>
        </div>

        {kelasOptions.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Belum ada kelas. Tambah / sinkron kelas dulu di menu Kelas.
          </p>
        ) : loading ? (
          <p className="py-8 text-center text-sm text-text-muted">Memuat data...</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Tidak ada siswa di kelas ini.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium w-12">No</th>
                  <th className="px-4 py-3 font-medium">Nama Siswa</th>
                  <th className="px-4 py-3 font-medium">NIS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{s.nama}</td>
                    <td className="px-4 py-3 text-text-muted">{s.nis || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
