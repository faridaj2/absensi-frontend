import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, SelectInput, TimeField, TextInput, Modal } from '../../components/ui';
import { hapusJadwal, listJadwal, simpanJadwal, updateJadwal } from '../../services/masterDataService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const EMPTY = { hari: '1', jam_masuk: '', jam_pulang: '', toleransi_menit: 15 };

export default function JadwalPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setRows(await listJadwal());
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
      hari: String(row.hari),
      jam_masuk: row.jam_masuk,
      jam_pulang: row.jam_pulang,
      toleransi_menit: row.toleransi_menit ?? 15,
    });
    setEditing(row);
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, hari: Number(form.hari), toleransi_menit: Number(form.toleransi_menit) };
      if (editing) {
        await updateJadwal(editing.id, payload);
        toast.success('Jadwal kerja diperbarui.');
      } else {
        await simpanJadwal(payload);
        toast.success('Jadwal kerja tersimpan.');
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
    if (!window.confirm(`Hapus jadwal hari ${HARI[row.hari]}?`)) return;
    try {
      await hapusJadwal(row.id);
      toast.success('Jadwal dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Jadwal Jam Kerja"
        subtitle="Atur jam masuk dan jam pulang per hari."
      >
        <Button onClick={openModal}>+ Tambah Jadwal</Button>
      </PageHeader>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Daftar Jadwal</h2>
          <span className="text-xs text-text-muted">{rows.length} hari</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Belum ada data.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Hari</th>
                  <th className="px-4 py-3 font-medium">Jam Masuk</th>
                  <th className="px-4 py-3 font-medium">Jam Pulang</th>
                  <th className="px-4 py-3 font-medium">Toleransi</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {HARI[r.hari] || r.hari}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{r.jam_masuk}</td>
                    <td className="px-4 py-3 text-text-muted">{r.jam_pulang}</td>
                    <td className="px-4 py-3 text-text-muted">{r.toleransi_menit ?? 15} Menit</td>
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
        title={editing ? "Edit Jadwal" : "Tambah Jadwal"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="form-jadwal" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <form id="form-jadwal" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Hari">
            <SelectInput
              value={form.hari}
              onChange={(e) => setForm({ ...form, hari: e.target.value })}
              options={HARI.slice(1).map((h, i) => ({ value: String(i + 1), label: h }))}
            />
          </Field>
          <div />
          <Field label="Jam Masuk">
            <TimeField
              value={form.jam_masuk}
              onChange={(v) => setForm({ ...form, jam_masuk: v })}
            />
          </Field>
          <Field label="Jam Pulang">
            <TimeField
              value={form.jam_pulang}
              onChange={(v) => setForm({ ...form, jam_pulang: v })}
            />
          </Field>
          <Field label="Toleransi Telat (Menit)">
            <TextInput
              type="number"
              value={form.toleransi_menit}
              onChange={(e) => setForm({ ...form, toleransi_menit: e.target.value })}
              required
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
