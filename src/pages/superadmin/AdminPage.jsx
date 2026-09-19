import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, TextInput, SelectInput, Modal } from '../../components/ui';
import {
  createAdmin,
  deleteAdmin,
  listAdmin,
  listInstansi,
  updateAdmin,
} from '../../services/masterService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = { name: '', email: '', password: '', role: 'admin', instansi_id: '' };

export default function AdminPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [instansi, setInstansi] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    const [a, i] = await Promise.all([listAdmin(), listInstansi()]);
    setRows(a);
    setInstansi(i);
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
    setForm({
      name: row.name,
      email: row.email,
      password: '',
      role: row.role || 'admin',
      instansi_id: row.instansi_id ? String(row.instansi_id) : '',
    });
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, instansi_id: form.instansi_id || null };
    try {
      if (editing) {
        await updateAdmin(
          editing.id,
          form.password ? payload : { ...payload, password: undefined }
        );
        toast.success('Admin diperbarui.');
      } else {
        await createAdmin(payload);
        toast.success('Admin ditambahkan.');
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
    if (!window.confirm(`Hapus admin ${row.name}?`)) return;
    try {
      await deleteAdmin(row.id);
      toast.success('Admin dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Manajemen Admin"
        subtitle="Kelola akun admin tiap instansi."
      >
        <Button onClick={openCreate}>+ Tambah Admin</Button>
      </PageHeader>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Daftar Admin</h2>
          <span className="text-xs text-text-muted">{rows.length} admin</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Instansi</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 font-medium text-text-primary">{r.name}</td>
                    <td className="px-4 py-3 text-text-muted">
                       <span className={`px-2 py-1 rounded text-xs font-semibold ${r.role === 'superadmin' ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-text-secondary'}`}>
                         {r.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{r.email}</td>
                    <td className="px-4 py-3 text-text-muted">{r.instansi?.nama || '-'}</td>
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
        title={editing ? 'Edit Admin' : 'Tambah Admin'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="form-admin" disabled={loading}>
              {loading ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form id="form-admin" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label={editing ? 'Password (kosongkan jika tetap)' : 'Password'}>
            <TextInput
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
            />
          </Field>
          <Field label="Role">
            <SelectInput
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { value: 'admin', label: 'Admin Instansi' },
                { value: 'superadmin', label: 'Superadmin' }
              ]}
              required
            />
          </Field>
          {form.role === 'admin' && (
          <Field label="Instansi">
            <SelectInput
              value={form.instansi_id}
              onChange={(e) => setForm({ ...form, instansi_id: e.target.value })}
              placeholder="Pilih instansi"
              options={instansi.map((i) => ({ value: String(i.id), label: i.nama }))}
              required
            />
          </Field>
          )}
        </form>
      </Modal>
    </>
  );
}
