import { useState, useEffect } from 'react';
import { PageHeader, Card } from '../../components/ui';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

import { getJadwalSaya } from '../../services/absensiService';

export default function JamMengajarPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getJadwalSaya();
        setData(res.data);
        setLoading(false);
      } catch (err) {
        toast.error(extractError(err));
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  return (
    <>
      <PageHeader 
        title="Jam Mengajar" 
        subtitle="Jadwal mengajar mingguan Anda berdasarkan kelas dan mata pelajaran." 
      />

      {loading ? (
        <Card><p className="py-8 text-center text-sm text-text-muted">Memuat jadwal...</p></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((hariItem, index) => (
            <Card key={index} className="p-0 overflow-hidden border border-border-subtle shadow-sm">
              <div className="border-b border-border-subtle bg-surface px-4 py-3 text-sm font-semibold text-text-primary">
                Hari {hariItem.hari}
              </div>
              
              {hariItem.jadwal.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs italic text-text-muted bg-surface-card">
                  Tidak ada jadwal mengajar
                </div>
              ) : (
                <ul className="divide-y divide-border-subtle bg-surface-card">
                  {hariItem.jadwal.map((j, i) => (
                    <li key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-surface transition-colors">
                      {/* Ikon Jam Ke- */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-text-primary font-bold text-xs ring-1 ring-border-subtle">
                        {j.jam_ke}
                      </div>
                      
                      {/* Info Kelas & Mapel */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {j.kelas}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {j.mapel}
                        </p>
                      </div>
                      
                      {/* Waktu */}
                      <div className="text-right shrink-0">
                        <span className="inline-block rounded-full bg-surface px-2 py-1 text-[10px] font-medium text-text-muted ring-1 ring-inset ring-border-subtle">
                          {j.waktu || '-'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
