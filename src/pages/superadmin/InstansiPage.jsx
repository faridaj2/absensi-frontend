import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, TextInput, SelectInput, Modal } from '../../components/ui';
import {
  createInstansi,
  deleteInstansi,
  listInstansi,
  listKodeAdmin,
  updateInstansi,
} from '../../services/masterService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = { nama: '', jenis: '', alamat: '', mode_absensi_siswa: 'per_jam', jenis_kelas_siswa: 'formal', kode_admin: '' };

export default function InstansiPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [kodeFormal, setKodeFormal] = useState([]);
  const [kodeDiniyah, setKodeDiniyah] = useState([]);
  const [kodeLoading, setKodeLoading] = useState(false);

  async function load() {
    setRows(await listInstansi());
  }

  async function loadKodeAdmin() {
    setKodeLoading(true);
    try {
      const res = await listKodeAdmin();
      setKodeFormal((res.formal || []).map((g) => ({ value: g.key, label: g.label })));
      setKodeDiniyah((res.diniyah || []).map((g) => ({ value: g.key, label: g.label })));
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setKodeLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadKodeAdmin();
  }, []);

  function kodeOptions(jenis) {
    return jenis === 'diniyah' ? kodeDiniyah : kodeFormal;
  }

  function openCreate() {
    const list = kodeOptions('formal');
    setForm({ ...EMPTY, kode_admin: list[0]?.value || '' });
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row) {
    const jenis = row.jenis_kelas_siswa || 'formal';
    const list = kodeOptions(jenis);
    setEditing(row);
    setForm({
      nama: row.nama,
      jenis: row.jenis,
      alamat: row.alamat || '',
      mode_absensi_siswa: row.mode_absensi_siswa,
      jenis_kelas_siswa: jenis,
      kode_admin: row.kode_admin || list[0]?.value || '',
    });
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await updateInstansi(editing.id, form);
        toast.success('Instansi diperbarui.');
      } else {
        await createInstansi(form);
        toast.success('Instansi ditambahkan.');
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
    if (!window.confirm(`Hapus instansi ${row.nama}?`)) return;
    try {
      await deleteInstansi(row.id);
      toast.success('Instansi dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Manajemen Instansi"
        subtitle="Kelola sekolah/instansi yang memakai sistem absensi."
      >
        <Button onClick={openCreate}>+ Tambah Instansi</Button>
      </PageHeader>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Daftar Instansi</h2>
          <span className="text-xs text-text-muted">{rows.length} instansi</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium">Alamat</th>
                  <th className="px-4 py-3 font-medium">Mode Siswa</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 font-medium text-text-primary">{r.nama}</td>
                    <td className="px-4 py-3 text-text-muted">{r.jenis}</td>
                    <td className="px-4 py-3 text-text-muted">{r.alamat || '-'}</td>
                    <td className="px-4 py-3 text-text-muted">{r.mode_absensi_siswa}</td>
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
        title={editing ? 'Edit Instansi' : 'Tambah Instansi'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="form-instansi" disabled={loading}>
              {loading ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form id="form-instansi" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama">
            <TextInput
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="SMP Darussalam"
              required
              autoFocus
            />
          </Field>
          <Field label="Jenis">
            <TextInput
              value={form.jenis}
              onChange={(e) => setForm({ ...form, jenis: e.target.value })}
              placeholder="SMP / SMA / SMK"
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Alamat">
              <TextInput
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Opsional"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Mode Absensi Siswa">
              <SelectInput
                value={form.mode_absensi_siswa}
                onChange={(e) => setForm({ ...form, mode_absensi_siswa: e.target.value })}
                options={[
                  { value: 'per_jam', label: 'Per Jam' },
                  { value: 'per_hari', label: 'Per Hari' },
                ]}
              />
            </Field>
          </div>
          <Field label="Jenis Kelas Siswa">
            <SelectInput
              value={form.jenis_kelas_siswa}
              onChange={(e) => {
                const jenis = e.target.value;
                const list = kodeOptions(jenis);
                setForm({ ...form, jenis_kelas_siswa: jenis, kode_admin: list[0]?.value || '' });
              }}
              options={[
                { value: 'formal', label: 'Formal' },
                { value: 'diniyah', label: 'Diniyah' },
              ]}
            />
          </Field>
          <Field label={kodeLoading ? 'Kode Admin (memuat...)' : 'Kode Admin (unit kelas)'}>
            <SelectInput
              value={form.kode_admin}
              onChange={(e) => setForm({ ...form, kode_admin: e.target.value })}
              placeholder={kodeOptions(form.jenis_kelas_siswa).length === 0 ? 'Tidak ada opsi' : 'Pilih unit'}
              options={kodeOptions(form.jenis_kelas_siswa)}
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
