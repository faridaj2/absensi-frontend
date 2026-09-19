import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, TextInput, SelectInput, StatusBadge, Modal } from '../../components/ui';
import { createUser, deleteUser, listUsers, updateUser } from '../../services/masterService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = { name: '', email: '', password: '', role: 'guru' };

export default function GuruPegawaiPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setRows(await listUsers());
  }

  useEffect(() => {
    load();
  }, []);

  function openModal() {
    setForm(EMPTY);
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row) {
    setForm({
      name: row.name,
      email: row.email,
      role: row.role,
      password: '',
    });
    setEditing(row);
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) {
        delete payload.password;
      }

      if (editing) {
        await updateUser(editing.id, payload);
        toast.success('Akun diperbarui.');
      } else {
        await createUser(payload);
        toast.success('Akun berhasil ditambahkan.');
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
    if (!window.confirm(`Hapus ${row.name}?`)) return;
    try {
      await deleteUser(row.id);
      toast.success('Akun dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Guru & Pegawai"
        subtitle="Kelola akun guru dan pegawai instansi."
      >
        <Button onClick={openModal}>+ Tambah Akun</Button>
      </PageHeader>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Daftar Akun</h2>
          <span className="text-xs text-text-muted">{rows.length} akun</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 font-medium text-text-primary">{r.name}</td>
                    <td className="px-4 py-3 text-text-muted">{r.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.role === 'guru' ? 'aktif' : 'pending'} label={r.role} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(r)}>Hapus</Button>
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
        title={editing ? "Edit Akun" : "Tambah Akun"}
        subtitle="Akun guru atau pegawai instansi."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="form-user" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <form id="form-user" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap"
              required
              autoFocus
            />
          </Field>
          <Field label="Role">
            <SelectInput
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { value: 'guru', label: 'Guru' },
                { value: 'pegawai', label: 'Pegawai' },
              ]}
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nama@sekolah.sch.id"
              required
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editing ? "Kosongkan jika tidak diubah" : "Min. 8 karakter"}
              required={!editing}
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
