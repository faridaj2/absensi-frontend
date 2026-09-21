import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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

const LocationMap = lazy(() => import('../../components/maps/LocationMap'));

const EMPTY = {
  nama: '',
  jenis: '',
  alamat: '',
  mode_absensi_siswa: 'per_jam',
  jenis_kelas_siswa: 'formal',
  kode_admin: '',
  latitude: '',
  longitude: '',
  radius_meter: '50',
};

export default function InstansiPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const initialRef = useRef(true);
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
    setMapKey((k) => k + 1);
    initialRef.current = true;
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
      latitude: row.latitude != null ? String(row.latitude) : '',
      longitude: row.longitude != null ? String(row.longitude) : '',
      radius_meter: row.radius_meter != null ? String(row.radius_meter) : '50',
    });
    setMapKey((k) => k + 1);
    initialRef.current = true;
    setOpen(true);
  }

  function pickFromMap(lt, lg) {
    setForm((f) => ({ ...f, latitude: String(lt), longitude: String(lg) }));
    initialRef.current = false;
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolokasi.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        initialRef.current = false;
        setMapKey((k) => k + 1);
        setLocating(false);
        toast.success('Lokasi GPS diambil.');
      },
      () => {
        toast.error('Gagal mengambil lokasi. Izinkan akses GPS.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nama: form.nama,
        jenis: form.jenis,
        alamat: form.alamat,
        mode_absensi_siswa: form.mode_absensi_siswa,
        jenis_kelas_siswa: form.jenis_kelas_siswa,
        kode_admin: form.kode_admin,
        latitude: form.latitude,
        longitude: form.longitude,
        radius_meter: Number(form.radius_meter),
      };
      if (editing) {
        await updateInstansi(editing.id, payload);
        toast.success('Instansi diperbarui.');
      } else {
        await createInstansi(payload);
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

  const hasPoint = form.latitude !== '' && form.longitude !== '';

  return (
    <>
      <PageHeader
        title="Manajemen Instansi"
        subtitle="Kelola sekolah/instansi yang memakai sistem absensi, termasuk titik lokasi absen."
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
                  <th className="px-4 py-3 font-medium">Lokasi</th>
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
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {r.latitude != null && r.longitude != null
                        ? `${Number(r.latitude).toFixed(5)}, ${Number(r.longitude).toFixed(5)}`
                        : '-'}
                    </td>
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

          <div className="sm:col-span-2 mt-2 border-t border-border-subtle pt-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Titik Lokasi Absen</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Latitude">
                <TextInput
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => {
                    setForm({ ...form, latitude: e.target.value });
                    initialRef.current = false;
                  }}
                  placeholder="-6.200000"
                  required
                />
              </Field>
              <Field label="Longitude">
                <TextInput
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => {
                    setForm({ ...form, longitude: e.target.value });
                    initialRef.current = false;
                  }}
                  placeholder="106.816666"
                  required
                />
              </Field>
              <Field label="Radius (meter)">
                <TextInput
                  type="number"
                  value={form.radius_meter}
                  onChange={(e) => setForm({ ...form, radius_meter: e.target.value })}
                  required
                />
              </Field>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={useCurrentLocation} disabled={locating} className="flex-1">
                {locating ? 'Mengambil lokasi...' : 'Gunakan Lokasi Saya'}
              </Button>
              <p className="flex flex-1 items-center rounded-xl bg-brand-100 px-3 py-2 text-xs text-brand-900">
                Klik titik di peta untuk memilih koordinat secara visual.
              </p>
            </div>
            <div className="mt-4">
              <Suspense
                fallback={
                  <div className="flex h-[320px] items-center justify-center rounded-xl border border-border-subtle bg-surface text-sm text-text-muted">
                    Memuat peta...
                  </div>
                }
              >
                <LocationMap
                  key={mapKey}
                  latitude={form.latitude}
                  longitude={form.longitude}
                  radius={Number(form.radius_meter) || 0}
                  onPick={pickFromMap}
                  height={320}
                />
              </Suspense>
              {!hasPoint && (
                <p className="mt-2 text-xs text-status-warning-text">
                  Peta belum menunjuk titik manapun. Pilih titik terlebih dahulu.
                </p>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
