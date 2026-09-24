import { useState, useEffect } from 'react';
import { PageHeader, Card, Button } from '../../components/ui';
// import CameraCapture from '../../components/absensi/CameraCapture'; // foto dinonaktifkan sementara
import { absenPegawai, riwayatAbsensi } from '../../services/absensiService';
import { listJadwal } from '../../services/masterDataService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

export default function AbsenPage() {
  const toast = useToast();
  const [jenis, setJenis] = useState('masuk');
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [jadwalHariIni, setJadwalHariIni] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchJadwal() {
      try {
        const hariIni = new Date().getDay() || 7;
        const jadwalList = await listJadwal();
        const jadwalMatch = jadwalList.find(j => String(j.hari) === String(hariIni));
        if (jadwalMatch) setJadwalHariIni(jadwalMatch);
      } catch (err) {
        console.error('Gagal mengambil jadwal', err);
      }
    }
    fetchJadwal();
  }, []);

  // Deteksi otomatis status absen hari ini (Masuk / Pulang)
  useEffect(() => {
    async function checkTodayStatus() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const history = await riwayatAbsensi({ dari: today, sampai: today });
        const sudahMasuk = history.some((item) => item.jenis === 'masuk');
        const sudahPulang = history.some((item) => item.jenis === 'pulang');
        
        if (sudahPulang) {
          setJenis('selesai');
        } else if (sudahMasuk) {
          setJenis('pulang');
        } else {
          setJenis('masuk');
        }
      } catch (err) {
        console.error('Gagal memuat status absensi:', err);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkTodayStatus();
  }, []);

  async function handleSendAbsen() {
    // Foto dinonaktifkan sementara
    // if (!foto) {
    //   toast.warning('Silakan ambil foto terlebih dahulu.');
    //   return;
    // }

    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung GPS Geolocation.');
      return;
    }

    setLoading(true);
    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGettingLocation(false);
        const formData = new FormData();
        formData.append('jenis', jenis);
        // if (foto) formData.append('foto', foto); // foto dinonaktifkan
        formData.append('latitude', pos.coords.latitude);
        formData.append('longitude', pos.coords.longitude);

        try {
          const result = await absenPegawai(formData);
          toast.success(`Absen ${result.jenis} berhasil${result.status ? ` (${result.status})` : ''}.`);
          setFoto(null);
          if (jenis === 'masuk') {
            setJenis('pulang');
          } else if (jenis === 'pulang') {
            setJenis('selesai');
          }
        } catch (err) {
          toast.error(extractError(err));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setGettingLocation(false);
        setLoading(false);
        toast.error('Gagal mengambil lokasi GPS: ' + (err.message || 'Izin lokasi ditolak'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  return (
    <>
      <PageHeader
        title="Absen Pegawai & Guru"
        subtitle="Klik Kirim Absen. Lokasi GPS dan jenis absen diproses otomatis."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-text-primary">
            Form Absen ({checkingStatus ? 'Mendeteksi...' : jenis === 'masuk' ? 'Absen Masuk' : jenis === 'pulang' ? 'Absen Pulang' : 'Selesai'})
          </h2>
          <div className="space-y-5">
            {jenis === 'selesai' ? (
              <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 flex items-center justify-center border border-green-200">
                <p className="font-medium">Anda sudah menyelesaikan absen masuk dan pulang untuk hari ini.</p>
              </div>
            ) : (
              <Button onClick={handleSendAbsen} disabled={loading} className="w-full sm:w-auto">
                {gettingLocation
                  ? 'Mengambil Lokasi GPS...'
                  : loading
                  ? 'Mengirim Absensi...'
                  : `Kirim Absen ${jenis === 'masuk' ? 'Masuk' : 'Pulang'}`}
              </Button>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="mb-5 rounded-xl bg-brand-50 p-4 border border-brand-100">
            <p className="text-sm text-brand-700 mb-1 font-medium">Waktu Saat Ini</p>
            <p className="text-3xl font-bold tracking-tight text-brand-900">
              {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
            </p>
            {jadwalHariIni ? (
              <div className="mt-3 pt-3 border-t border-brand-200/50 flex justify-between text-sm">
                 <div>
                   <p className="text-brand-700/70 text-xs">Jam Masuk</p>
                   <p className="font-semibold text-brand-900">{jadwalHariIni.jam_masuk}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-brand-700/70 text-xs">Jam Pulang</p>
                   <p className="font-semibold text-brand-900">{jadwalHariIni.jam_pulang}</p>
                 </div>
              </div>
            ) : (
               <p className="mt-3 text-xs text-brand-700/70">Belum ada jadwal untuk hari ini.</p>
            )}
          </div>

          <h2 className="mb-2 text-base font-semibold text-text-primary">Panduan Absen</h2>
          <ul className="space-y-2 text-sm text-text-muted">
            <li>• Status otomatis (Masuk/Pulang) sesuai riwayat.</li>
            <li>• Absen masuk tidak bisa mendahului jam masuk jadwal. Absen pulang bisa kapan saja.</li>
            <li>• Koordinat GPS diambil otomatis secara real-time.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
