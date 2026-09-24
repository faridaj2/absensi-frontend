import { useEffect, useState } from 'react';
import { PageHeader, Card, Button } from '../../components/ui';
import {
  claimSlot,
  daftarSiswaSlot,
  releaseSlot,
  slotHariIni,
  submitAbsensiSiswa,
} from '../../services/absensiService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const STATUSES = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'izin', label: 'Izin' },
  { value: 'alpa', label: 'Alpa' },
];

function JamLabel({ slot }) {
  if (slot.jam_mulai && slot.jam_selesai) return `${slot.jam_mulai}–${slot.jam_selesai}`;
  if (slot.jam_ke != null) return `Jam ke-${slot.jam_ke}`;
  return '-';
}

function SlotCard({ slot, onAction, actionLabel, actionVariant = 'primary', disabled, note }) {
  const done = !!slot.sudah_diabsen;
  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${done ? 'border-status-success-text/30 bg-status-success-bg/40' : 'border-border-subtle bg-surface-card'}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-text-primary">{slot.mapel}</p>
          {done && (
            <span className="rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-semibold text-status-success-text ring-1 ring-status-success-text/20">
              ✓ Sudah diabsen
            </span>
          )}
          {slot.sebagai === 'pengganti' && (
            <span className="rounded-full bg-status-warning-bg px-2 py-0.5 text-[10px] font-medium text-status-warning-text">
              Pengganti
            </span>
          )}
          {slot.sebagai === 'terbuka' && (
            <span className="rounded-full bg-status-info-bg px-2 py-0.5 text-[10px] font-medium text-status-info-text">
              Terbuka
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">
          Kelas {slot.kelas_nama || slot.kelas_id} · <JamLabel slot={slot} />
        </p>
        {note && <p className="mt-1 text-xs text-text-muted">{note}</p>}
      </div>
      <Button size="sm" variant={actionVariant} onClick={onAction} disabled={disabled}>
        {actionLabel}
      </Button>
    </div>
  );
}

export default function AbsenSiswaPage() {
  const toast = useToast();
  const [info, setInfo] = useState({ slots: [], slots_terbuka: [], sudah_absen_masuk: false, tanggal: null });
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setInfo(await slotHariIni());
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleClaim(slot) {
    if (!window.confirm(`Ambil alih slot ${slot.mapel} (kelas ${slot.kelas_nama || slot.kelas_id})?`)) return;
    setClaiming(slot.id);
    try {
      await claimSlot(slot.id);
      toast.success(`Berhasil ambil alih ${slot.mapel} - ${slot.kelas_nama || slot.kelas_id}.`);
      await load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setClaiming(null);
    }
  }

  async function handleRelease(slot) {
    if (!window.confirm(`Ambil kembali slot ${slot.mapel} (kelas ${slot.kelas_nama || slot.kelas_id}) dari ${slot.diambil_alih_oleh}?`)) return;
    setClaiming(slot.id);
    try {
      await releaseSlot(slot.id);
      toast.success(`Slot ${slot.mapel} berhasil diambil kembali.`);
      await load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setClaiming(null);
    }
  }

  async function openSlot(slot) {
    if (slot.sudah_diabsen) {
      if (!window.confirm(`Slot ${slot.mapel} (kelas ${slot.kelas_nama || slot.kelas_id}) sudah diabsen hari ini. Buka ulang untuk memperbarui?`)) return;
    }
    setSelected(slot);
    setLoading(true);
    try {
      const list = await daftarSiswaSlot(slot.id);
      setStudents(list.map((s) => ({ ...s, status: 'hadir', keterangan: '' })));
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function updateStatus(id, status) {
    setStudents((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  function updateKeterangan(id, keterangan) {
    setStudents((prev) => prev.map((x) => (x.id === id ? { ...x, keterangan } : x)));
  }

  async function submit() {
    setLoading(true);
    try {
      await submitAbsensiSiswa({
        guru_mapel_kelas_id: selected.id,
        tanggal: info.tanggal,
        jam_ke: selected.jam_ke,
        siswa: students.map((s) => ({
          siswa_id: s.id,
          status: s.status,
          keterangan: s.keterangan || null,
        })),
      });
      toast.success('Absensi siswa tersimpan.');
      setSelected(null);
      setStudents([]);
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  const slotsTerbuka = info.slots_terbuka || [];

  return (
    <>
      <PageHeader
        title="Absensi Siswa"
        subtitle={info.tanggal ? `Tanggal ${info.tanggal}` : 'Memuat...'}
      >
        {!selected && (
          <Button variant="secondary" onClick={load} disabled={loading} className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={loading ? 'animate-spin' : ''}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21v-5h5" />
            </svg>
            {loading ? 'Memuat...' : 'Refresh'}
          </Button>
        )}
      </PageHeader>

      {!info.sudah_absen_masuk && (
        <div className="mb-4 rounded-xl bg-status-warning-bg px-4 py-2.5 text-sm text-status-warning-text">
          Aksi ditolak. Pastikan Anda sudah absen masuk dan belum melakukan absen pulang.
        </div>
      )}

      {!selected ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Slot Mengajar Saya</h2>
              <span className="text-xs text-text-muted">{info.slots.length} slot</span>
            </div>

            {info.slots.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">Tidak ada slot mengajar hari ini.</p>
            ) : (
              <div className="space-y-3">
                {info.slots.map((slot) => {
                  const diambilAlih = !!slot.diambil_alih_oleh;
                  return (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onAction={() => (diambilAlih ? handleRelease(slot) : openSlot(slot))}
                      actionLabel={
                        diambilAlih
                          ? claiming === slot.id
                            ? 'Mengambil...'
                            : 'Ambil Kembali'
                          : 'Absen'
                      }
                      actionVariant={diambilAlih ? 'secondary' : 'primary'}
                      disabled={!info.sudah_absen_masuk || claiming === slot.id}
                      note={
                        diambilAlih
                          ? `Sedang diambil alih oleh ${slot.diambil_alih_oleh}. Absen masuk dulu untuk mengambil kembali.`
                          : slot.sudah_diabsen
                          ? 'Absensi sudah tersimpan. Klik untuk memperbarui.'
                          : null
                      }
                    />
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Slot Terbuka</h2>
              <span className="text-xs text-text-muted">{slotsTerbuka.length} slot</span>
            </div>

            <p className="mb-3 text-xs text-text-muted">
              Slot berikut gurunya belum absen masuk hari ini. Anda bisa mengambil alih untuk mengabsen.
            </p>

            {slotsTerbuka.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                Tidak ada slot terbuka saat ini.
              </p>
            ) : (
              <div className="space-y-3">
                {slotsTerbuka.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onAction={() => handleClaim(slot)}
                    actionLabel={claiming === slot.id ? 'Mengambil...' : 'Ambil Alih'}
                    actionVariant="secondary"
                    disabled={claiming === slot.id || !info.sudah_absen_masuk}
                    note={slot.guru_asli ? `Guru asli: ${slot.guru_asli}` : null}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {selected.mapel} — {selected.kelas_nama || selected.kelas_id}
              </h2>
              <p className="mt-0.5 text-xs text-text-muted"><JamLabel slot={selected} /></p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
              Kembali
            </Button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">Memuat siswa...</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Siswa</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-t border-border-subtle">
                        <td className="px-4 py-3 font-medium text-text-primary">{s.nama}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {STATUSES.map((st) => (
                              <button
                                key={st.value}
                                type="button"
                                onClick={() => updateStatus(s.id, st.value)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                  s.status === st.value
                                    ? 'bg-brand-900 text-text-inverse'
                                    : 'bg-surface text-text-muted hover:bg-brand-100 hover:text-brand-900'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            placeholder="Opsional..."
                            value={s.keterangan}
                            onChange={(e) => updateKeterangan(s.id, e.target.value)}
                            disabled={s.status === 'hadir'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex justify-end">
                <Button onClick={submit} disabled={loading}>
                  Simpan Absensi
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}
