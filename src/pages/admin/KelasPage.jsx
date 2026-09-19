import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, TextInput, Modal } from '../../components/ui';
import {
  hapusKelas,
  listKelas,
  simpanKelas,
  syncKelas,
  updateKelas,
} from '../../services/masterDataService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = { nama: '', kode: '', tingkat: '' };

export default function KelasPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    setRows(await listKelas());
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(EMPTY);
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({ nama: row.nama, kode: row.kode || '', tingkat: row.tingkat || '' });
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await updateKelas(editing.id, form);
        toast.success('Kelas diperbarui.');
      } else {
        await simpanKelas(form);
        toast.success('Kelas ditambahkan.');
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
    if (!window.confirm(`Hapus kelas ${row.nama}?`)) return;
    try {
      await hapusKelas(row.id);
      toast.success('Kelas dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await syncKelas();
      toast.success(res.message || 'Sinkron selesai.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Kelas"
        subtitle="Kelola daftar kelas. Kode kelas dipakai untuk sinkronisasi data siswa."
      >
        <Button variant="secondary" onClick={handleSync} disabled={syncing}>
          {syncing ? 'Menyinkron...' : 'Sinkron dari Admin'}
        </Button>
        <Button onClick={openCreate}>+ Tambah Kelas</Button>
      </PageHeader>

      <Card className="mb-5">
        <h2 className="mb-2 text-base font-semibold text-text-primary">Informasi</h2>
        <p className="text-sm text-text-muted">
          Kolom <strong>Kode</strong> harus sama dengan kode kelas di sistem admin sekolah (contoh:
          <code className="mx-1 rounded bg-surface px-1.5 py-0.5">1smp</code> untuk formal, atau
          <code className="mx-1 rounded bg-surface px-1.5 py-0.5">1diniyah</code> untuk diniyah).
          Digunakan untuk menarik daftar siswa saat absen.
        </p>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Daftar Kelas</h2>
          <span className="text-xs text-text-muted">{rows.length} kelas</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Belum ada kelas.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Kelas</th>
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Tingkat</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 font-medium text-text-primary">{r.nama}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {r.kode ? (
                        <code className="rounded bg-surface px-1.5 py-0.5 text-xs">{r.kode}</code>
                      ) : (
                        <span className="text-status-warning-text">belum diisi</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{r.tingkat || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(r)}>Hapus</Button>
                      </div>
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
        title={editing ? 'Edit Kelas' : 'Tambah Kelas'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="form-kelas" disabled={loading}>
              {loading ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form id="form-kelas" onSubmit={submit} className="space-y-4">
          <Field label="Nama Kelas">
            <TextInput
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: Kelas 7A"
              required
              autoFocus
            />
          </Field>
          <Field label="Kode (untuk API siswa)">
            <TextInput
              value={form.kode}
              onChange={(e) => setForm({ ...form, kode: e.target.value })}
              placeholder="Contoh: 1smp atau 1diniyah"
            />
          </Field>
          <Field label="Tingkat (opsional)">
            <TextInput
              value={form.tingkat}
              onChange={(e) => setForm({ ...form, tingkat: e.target.value })}
              placeholder="Contoh: 7"
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
