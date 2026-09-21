import { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, Button, Field, TextInput, SelectInput, TimeField, Modal } from '../../components/ui';
import {
  hapusAssignment,
  hapusJamIstirahat,
  listAssignment,
  listJamIstirahat,
  listJadwal,
  listKelas,
  listMapel,
  simpanAssignment,
  simpanJamIstirahat,
  updateAssignment,
} from '../../services/masterDataService';
import { listUsers } from '../../services/masterService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DEFAULT_HARI = [1, 2, 3, 4, 5, 6];
const EMPTY = { mapel_id: '', guru_id: '', kelas_id: '', hari: '1', jam_ke: '', jam_mulai: '', jam_selesai: '' };
const EMPTY_ISTIRAHAT = { hari: '1', jam_mulai: '', jam_selesai: '', label: 'Istirahat' };

function todayIndex(activeDays) {
  const d = new Date().getDay(); // 0=Sunday
  const iso = d === 0 ? 7 : d;
  if (activeDays.includes(iso)) return iso;
  return activeDays[0] ?? 1;
}

function sortByJam(a, b) {
  if (a.jam_mulai && b.jam_mulai) return a.jam_mulai.localeCompare(b.jam_mulai);
  if (a.jam_ke != null && b.jam_ke != null) return a.jam_ke - b.jam_ke;
  return (a.jam_ke ?? 99) - (b.jam_ke ?? 99);
}

function AvatarInitial({ name }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[11px] font-semibold text-text-inverse">
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function JamLabel({ row }) {
  if (row.jam_mulai && row.jam_selesai) return `${row.jam_mulai}–${row.jam_selesai}`;
  if (row.jam_ke != null) return `Jam ke-${row.jam_ke}`;
  return '-';
}

function PelajaranRow({ row, onEdit, onRemove }) {
  return (
    <tr className="border-t border-border-subtle">
      <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
        <JamLabel row={row} />
      </td>
      <td className="px-4 py-3 text-text-primary">{row.mapel?.nama_mapel || '-'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <AvatarInitial name={row.guru?.name} />
          <span className="text-text-muted">{row.guru?.name || '-'}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-text-muted">{row.kelas_nama || row.kelas_id}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(row)}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => onRemove(row)}>Hapus</Button>
        </div>
      </td>
    </tr>
  );
}

function PelajaranCard({ row, onEdit, onRemove }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{row.mapel?.nama_mapel || '-'}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            <JamLabel row={row} /> · Kelas {row.kelas_nama || row.kelas_id}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-medium text-brand-900">
          <JamLabel row={row} />
        </span>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <AvatarInitial name={row.guru?.name} />
        <span className="text-sm text-text-muted">{row.guru?.name || '-'}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => onEdit(row)} className="flex-1">Edit</Button>
        <Button variant="ghost" size="sm" onClick={() => onRemove(row)} className="flex-1">Hapus</Button>
      </div>
    </div>
  );
}

export default function JadwalPelajaranPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [istirahat, setIstirahat] = useState([]);
  const [mapel, setMapel] = useState([]);
  const [guru, setGuru] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hariAktif, setHariAktif] = useState(DEFAULT_HARI);
  const [activeHari, setActiveHari] = useState(() => todayIndex(DEFAULT_HARI));

  // Form istirahat
  const [istirahatOpen, setIstirahatOpen] = useState(false);
  const [formIstirahat, setFormIstirahat] = useState(EMPTY_ISTIRAHAT);
  const [loadingIstirahat, setLoadingIstirahat] = useState(false);

  async function load() {
    const [a, m, u, k, j, ist] = await Promise.all([
      listAssignment(),
      listMapel(),
      listUsers(),
      listKelas(),
      listJadwal(),
      listJamIstirahat(),
    ]);
    setRows(a);
    setMapel(m);
    setGuru(u.filter((x) => x.role === 'guru'));
    setKelas(k);
    setIstirahat(ist);

    const days = [...new Set(j.map((x) => x.hari))].sort((x, y) => x - y);
    const next = days.length > 0 ? days : DEFAULT_HARI;
    setHariAktif(next);
    setActiveHari((prev) => (next.includes(prev) ? prev : todayIndex(next)));
  }

  useEffect(() => {
    load();
  }, []);

  const rowsByHari = useMemo(
    () => rows.filter((r) => r.hari === activeHari).sort(sortByJam),
    [rows, activeHari]
  );

  const istirahatHari = useMemo(
    () =>
      istirahat
        .filter((r) => r.hari === activeHari)
        .sort((a, b) => (a.jam_mulai || '').localeCompare(b.jam_mulai || '')),
    [istirahat, activeHari]
  );

  // Timeline gabungan: pelajaran + istirahat, terurut by jam_mulai
  const timeline = useMemo(() => {
    const items = rowsByHari.map((r) => ({ type: 'pelajaran', row: r, key: `p-${r.id}` }));
    for (const ist of istirahatHari) {
      items.push({ type: 'istirahat', row: ist, key: `i-${ist.id}` });
    }
    return items.sort((a, b) => {
      const ta = a.row.jam_mulai || '';
      const tb = b.row.jam_mulai || '';
      if (ta && tb) return ta.localeCompare(tb);
      if (ta) return -1;
      if (tb) return 1;
      return (a.row.jam_ke ?? 99) - (b.row.jam_ke ?? 99);
    });
  }, [rowsByHari, istirahatHari]);

  function openCreate() {
    setForm({ ...EMPTY, hari: String(activeHari) });
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      mapel_id: String(row.mapel_id || ''),
      guru_id: String(row.guru_id || ''),
      kelas_id: row.kelas_id || '',
      hari: String(row.hari),
      jam_ke: row.jam_ke != null ? String(row.jam_ke) : '',
      jam_mulai: row.jam_mulai || '',
      jam_selesai: row.jam_selesai || '',
    });
    setModalOpen(true);
  }

  function closeForm() {
    setForm(EMPTY);
    setEditing(null);
    setModalOpen(false);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const selected = kelas.find((k) => k.id === form.kelas_id);
      const payload = {
        ...form,
        hari: Number(form.hari),
        jam_ke: form.jam_ke ? Number(form.jam_ke) : null,
        kelas_nama: selected?.nama || null,
      };

      if (editing) {
        await updateAssignment(editing.id, payload);
        toast.success('Jadwal diperbarui.');
      } else {
        await simpanAssignment(payload);
        toast.success('Jadwal ditambahkan.');
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Hapus jadwal ${row.mapel?.nama_mapel || ''}?`)) return;
    try {
      await hapusAssignment(row.id);
      toast.success('Jadwal dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  function openIstirahat() {
    setFormIstirahat({ ...EMPTY_ISTIRAHAT, hari: String(activeHari) });
    setIstirahatOpen(true);
  }

  async function submitIstirahat(e) {
    e.preventDefault();
    setLoadingIstirahat(true);
    try {
      await simpanJamIstirahat({
        hari: Number(formIstirahat.hari),
        jam_mulai: formIstirahat.jam_mulai,
        jam_selesai: formIstirahat.jam_selesai,
        label: formIstirahat.label || null,
      });
      toast.success('Jam istirahat ditambahkan.');
      setIstirahatOpen(false);
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoadingIstirahat(false);
    }
  }

  async function removeIstirahat(row) {
    if (!window.confirm(`Hapus istirahat ${row.jam_mulai}-${row.jam_selesai}?`)) return;
    try {
      await hapusJamIstirahat(row.id);
      toast.success('Jam istirahat dihapus.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  const hariIni = todayIndex(hariAktif);

  return (
    <>
      <PageHeader
        title="Jadwal Pelajaran"
        subtitle="Jadwal mengajar per guru, dikelompokkan per hari."
      >
        <Button
          variant="secondary"
          onClick={() => window.open('/jadwal-pelajaran/cetak', '_blank', 'noopener,noreferrer')}
        >
          🖨 Cetak Jadwal
        </Button>
        <Button variant="secondary" onClick={openIstirahat}>☕ Istirahat</Button>
        <Button onClick={openCreate}>+ Tambah Jadwal</Button>
      </PageHeader>

      <Modal
        open={modalOpen}
        onClose={closeForm}
        title={editing ? 'Edit Jadwal' : 'Tambah Jadwal'}
        subtitle={`Hari ${HARI[Number(form.hari)] || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Batal</Button>
            <Button type="submit" form="form-jadwal-pelajaran" disabled={loading}>
              {loading ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form id="form-jadwal-pelajaran" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Mapel">
            <SelectInput
              value={form.mapel_id}
              onChange={(e) => setForm({ ...form, mapel_id: e.target.value })}
              placeholder="Pilih mapel"
              options={mapel.map((m) => ({ value: String(m.id), label: m.nama_mapel }))}
              required
            />
          </Field>
          <Field label="Guru">
            <SelectInput
              value={form.guru_id}
              onChange={(e) => setForm({ ...form, guru_id: e.target.value })}
              placeholder="Pilih guru"
              options={guru.map((g) => ({ value: String(g.id), label: g.name }))}
              required
            />
          </Field>
          <Field label="Kelas">
            <SelectInput
              value={form.kelas_id}
              onChange={(e) => setForm({ ...form, kelas_id: e.target.value })}
              placeholder="Pilih kelas"
              options={kelas.map((k) => ({ value: k.id, label: k.nama }))}
              required
            />
          </Field>
          <Field label="Hari">
            <SelectInput
              value={form.hari}
              onChange={(e) => setForm({ ...form, hari: e.target.value })}
              options={HARI.slice(1).map((h, i) => ({ value: String(i + 1), label: h }))}
              required
            />
          </Field>
          <Field label="Jam Ke (opsional)">
            <TextInput
              type="number"
              value={form.jam_ke}
              onChange={(e) => setForm({ ...form, jam_ke: e.target.value })}
              placeholder="Misal: 1"
            />
          </Field>
          <Field label="Jam Mulai">
            <TimeField
              value={form.jam_mulai}
              onChange={(v) => setForm({ ...form, jam_mulai: v })}
            />
          </Field>
          <Field label="Jam Selesai">
            <TimeField
              value={form.jam_selesai}
              onChange={(v) => setForm({ ...form, jam_selesai: v })}
            />
          </Field>
        </form>
      </Modal>

      {/* Modal istirahat */}
      <Modal
        open={istirahatOpen}
        onClose={() => setIstirahatOpen(false)}
        title="Jam Istirahat"
        subtitle="Kelola slot istirahat di antara jam pelajaran."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIstirahatOpen(false)}>Tutup</Button>
            <Button type="submit" form="form-istirahat" disabled={loadingIstirahat}>
              {loadingIstirahat ? 'Menyimpan...' : 'Tambah Istirahat'}
            </Button>
          </>
        }
      >
        <form id="form-istirahat" onSubmit={submitIstirahat} className="grid gap-4 sm:grid-cols-3">
          <Field label="Hari">
            <SelectInput
              value={formIstirahat.hari}
              onChange={(e) => setFormIstirahat({ ...formIstirahat, hari: e.target.value })}
              options={HARI.slice(1).map((h, i) => ({ value: String(i + 1), label: h }))}
              required
            />
          </Field>
          <Field label="Jam Mulai">
            <TimeField
              value={formIstirahat.jam_mulai}
              onChange={(v) => setFormIstirahat({ ...formIstirahat, jam_mulai: v })}
            />
          </Field>
          <Field label="Jam Selesai">
            <TimeField
              value={formIstirahat.jam_selesai}
              onChange={(v) => setFormIstirahat({ ...formIstirahat, jam_selesai: v })}
            />
          </Field>
          <div className="sm:col-span-3">
            <Field label="Label (opsional)">
              <TextInput
                value={formIstirahat.label}
                onChange={(e) => setFormIstirahat({ ...formIstirahat, label: e.target.value })}
                placeholder="Istirahat / Dzuhur / Senam"
              />
            </Field>
          </div>
        </form>

        <div className="mt-4 border-t border-border-subtle pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Slot Terpasang</p>
          {istirahat.length === 0 ? (
            <p className="py-2 text-sm text-text-muted">Belum ada jam istirahat.</p>
          ) : (
            <div className="space-y-2">
              {[...istirahat].sort((a, b) => a.hari - b.hari || (a.jam_mulai || '').localeCompare(b.jam_mulai || '')).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2">
                  <div className="text-sm">
                    <span className="font-medium text-text-primary">{HARI[r.hari] || r.hari}</span>
                    <span className="ml-2 text-text-muted">{r.jam_mulai}–{r.jam_selesai}</span>
                    {r.label && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] text-brand-900">{r.label}</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeIstirahat(r)}>Hapus</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Tab hari */}
      <div className="mb-5 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5 min-w-max">
          {hariAktif.map((h) => {
            const isActive = activeHari === h;
            const isToday = hariIni === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => setActiveHari(h)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-900 text-text-inverse shadow-md shadow-brand-900/20'
                    : 'bg-surface-card text-text-muted hover:bg-brand-100 hover:text-brand-900'
                }`}
              >
                {HARI[h]}
                {isToday && (
                  <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            Jadwal Hari {HARI[activeHari]}
          </h2>
          <span className="text-xs text-text-muted">
            {rowsByHari.length} pelajaran{istirahatHari.length > 0 ? ` · ${istirahatHari.length} istirahat` : ''}
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-900">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">Belum ada jadwal untuk hari {HARI[activeHari]}.</p>
            <Button size="sm" onClick={openCreate}>
              + Tambah Jadwal
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto rounded-xl border border-border-subtle md:block">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Jam</th>
                    <th className="px-4 py-3 font-medium">Kegiatan</th>
                    <th className="px-4 py-3 font-medium">Guru</th>
                    <th className="px-4 py-3 font-medium">Kelas</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((item) =>
                    item.type === 'istirahat' ? (
                      <tr key={item.key} className="border-t border-border-subtle bg-brand-100/40">
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-brand-900">
                          {item.row.jam_mulai}–{item.row.jam_selesai}
                        </td>
                        <td className="px-4 py-3 font-medium text-brand-900" colSpan={4}>
                          ☕ {item.row.label || 'Istirahat'}
                        </td>
                      </tr>
                    ) : (
                      <PelajaranRow key={item.key} row={item.row} onEdit={openEdit} onRemove={remove} />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: list card */}
            <div className="space-y-3 md:hidden">
              {timeline.map((item) =>
                item.type === 'istirahat' ? (
                  <div
                    key={item.key}
                    className="rounded-xl border border-dashed border-brand-500/40 bg-brand-100/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-brand-900">☕ {item.row.label || 'Istirahat'}</p>
                        <p className="mt-0.5 text-xs text-brand-900/70">{item.row.jam_mulai}–{item.row.jam_selesai}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeIstirahat(item.row)}>Hapus</Button>
                    </div>
                  </div>
                ) : (
                  <PelajaranCard key={item.key} row={item.row} onEdit={openEdit} onRemove={remove} />
                )
              )}
            </div>
          </>
        )}
      </Card>
    </>
  );
}
