import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, SelectInput, DateField, Modal } from '../../components/ui';
import { listUsers } from '../../services/masterService';
import { absenManual } from '../../services/absensiService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const EMPTY = { user_id: '', tanggal: '', keterangan: 'izin' };

export default function IzinManualPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listUsers().then(setUsers);
  }, []);

  function openModal() {
    setForm(EMPTY);
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await absenManual(form);
      toast.success('Status kehadiran tersimpan.');
      setOpen(false);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Input Izin / Sakit / Alpa"
        subtitle="Catat ketidakhadiran guru atau pegawai secara manual."
      >
        <Button onClick={openModal}>+ Input Izin Manual</Button>
      </PageHeader>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Panduan</h2>
        <p className="text-sm text-text-muted">
          Gunakan tombol di kanan atas untuk mencatat izin, sakit, atau alpa bagi guru/pegawai yang
          tidak bisa melakukan absen GPS. Data akan tercatat di laporan kehadiran.
        </p>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Input Izin / Sakit / Alpa"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="form-izin" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <form id="form-izin" onSubmit={submit} className="space-y-4">
          <Field label="Guru / Pegawai">
            <SelectInput
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              placeholder="Pilih"
              options={users.map((u) => ({
                value: String(u.id),
                label: `${u.name} (${u.role})`,
              }))}
              required
            />
          </Field>
          <Field label="Tanggal">
            <DateField value={form.tanggal} onChange={(v) => setForm({ ...form, tanggal: v })} />
          </Field>
          <Field label="Status">
            <SelectInput
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              options={[
                { value: 'izin', label: 'Izin' },
                { value: 'sakit', label: 'Sakit' },
                { value: 'alpa', label: 'Alpa' },
              ]}
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
