import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { PageHeader, Card, Button, Field, TextInput } from '../../components/ui';
import { listLokasi, simpanLokasi } from '../../services/masterDataService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

const LocationMap = lazy(() => import('../../components/maps/LocationMap'));

export default function LokasiPage() {
  const toast = useToast();
  const [form, setForm] = useState({ latitude: '', longitude: '', radius_meter: '50' });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const initialRef = useRef(true);

  useEffect(() => {
    listLokasi().then((rows) => {
      if (rows[0]) {
        setForm({
          latitude: String(rows[0].latitude),
          longitude: String(rows[0].longitude),
          radius_meter: String(rows[0].radius_meter),
        });
      }
    });
  }, []);

  function pickFromMap(lt, lg) {
    setForm((f) => ({ ...f, latitude: String(lt), longitude: String(lg) }));
    initialRef.current = false;
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await simpanLokasi({
        latitude: form.latitude,
        longitude: form.longitude,
        radius_meter: Number(form.radius_meter),
      });
      toast.success('Lokasi absen tersimpan.');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
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

  return (
    <>
      <PageHeader
        title="Lokasi Absen & Radius"
        subtitle="Tentukan titik koordinat dan radius yang dipakai untuk validasi absensi."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-text-primary">Titik Absen</h2>
          <form onSubmit={submit} className="space-y-4">
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

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={useCurrentLocation} disabled={locating} className="flex-1">
                {locating ? 'Mengambil lokasi...' : 'Gunakan Lokasi Saya'}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>

            <p className="rounded-xl bg-brand-100 px-3 py-2 text-xs text-brand-900">
              Tips: klik titik di peta untuk memilih koordinat secara visual. Lingkaran hijau menampilkan area radius absen.
            </p>
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Pratinjau Peta</h2>
            <span className="text-xs text-text-muted">Radius {form.radius_meter || 0} m</span>
          </div>
          <Suspense
            fallback={
              <div className="flex h-[420px] items-center justify-center rounded-xl border border-border-subtle bg-surface text-sm text-text-muted">
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
              height={420}
            />
          </Suspense>
        </Card>
      </div>
    </>
  );
}
