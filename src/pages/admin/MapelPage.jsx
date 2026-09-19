import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, TextInput, Modal } from '../../components/ui';
import { hapusMapel, listMapel, simpanMapel, updateMapel } from '../../services/masterDataService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

export default function MapelPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setRows(await listMapel());
  }

  useEffect(() => {
    load();
  }, []);

  function openModal() {
    setNama('');
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row) {
    setNama(row.nama_mapel);
    setEditing(row);
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await updateMapel(editing.id, { nama_mapel: nama });
        toast.success('Mapel diperbarui.');
      } else {
        await simpanMapel({ nama_mapel: nama });
        toast.success('Mapel berhasil ditambahkan.');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Hapus mapel ${row.nama_mapel}?`)) return;
    try {
      await hapusMapel(row.id);
      toast.success('Mapel dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Mata Pelajaran"
        subtitle="Kelola daftar mata pelajaran untuk instansi."
      >
        <Button onClick={openModal}>+ Tambah Mapel</Button>
      </PageHeader>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Daftar Mapel</h2>
          <span className="text-xs text-text-muted">{rows.length} item</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[360px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Mapel</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 text-text-primary">{r.nama_mapel}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(r)}>
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Mapel" : "Tambah Mapel"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="form-mapel" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <form id="form-mapel" onSubmit={submit} className="space-y-4">
          <Field label="Nama Mapel">
            <TextInput
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Matematika"
              required
              autoFocus
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
