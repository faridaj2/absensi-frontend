import { useState, useEffect } from 'react';
import { arsipService } from '../../services/arsipService';

export default function ArsipLaporanPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodeInput, setPeriodeInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const fetchArsip = async () => {
    try {
      setLoading(true);
      const data = await arsipService.getAll();
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArsip();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!periodeInput) return;
    try {
      setGenerating(true);
      setMessage('');
      const res = await arsipService.generate(periodeInput);
      setMessage(res.message);
      setPeriodeInput('');
      fetchArsip();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal generate arsip');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (periode) => {
    if (!confirm(`Yakin ingin menghapus arsip periode ${periode}?`)) return;
    try {
      const res = await arsipService.delete(periode);
      setMessage(res.message);
      fetchArsip();
    } catch (err) {
      setMessage('Gagal menghapus arsip');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Arsip Laporan Bulanan</h1>
          <p className="text-sm text-text-secondary mt-1">Kelola data laporan absensi yang telah dibekukan (freeze).</p>
        </div>
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="YYYY-MM (2026-08)"
              value={periodeInput}
              onChange={(e) => setPeriodeInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-surface hover:bg-surface-hover focus:bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm text-text-primary transition-all outline-none"
              required
              pattern="\d{4}-\d{2}"
              title="Format: YYYY-MM (Contoh: 2026-08)"
            />
          </div>
          <button
            type="submit"
            disabled={generating}
            style={{ backgroundColor: 'var(--color-brand-700)', color: 'var(--color-text-inverse)' }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm transition-all active:scale-[0.98]"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Generate Freeze
              </>
            )}
          </button>
        </form>
      </div>

      {message && (
        <div className="p-4 bg-surface border border-border rounded-xl text-sm text-text-primary shadow-sm">
          {message}
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-hover/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-3.5 px-6">Periode (Bulan)</th>
                <th className="py-3.5 px-6">Total Data Tersimpan</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-text-secondary">Memuat data...</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-text-secondary">Belum ada arsip laporan yang di-freeze.</td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.periode} className="hover:bg-surface-hover/30 transition">
                    <td className="py-4 px-6 font-medium text-text-primary">
                      {item.periode}
                    </td>
                    <td className="py-4 px-6 text-text-secondary">
                      {item.total_data} Pegawai / Guru
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(item.periode)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-medium rounded-md transition"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
