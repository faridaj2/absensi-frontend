import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { checkSetup, setup } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Field, TextInput } from '../../components/ui';

export default function Register() {
  const [isReady, setIsReady] = useState(false);
  const [canRegister, setCanRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    checkSetup().then(req => {
      setCanRegister(req);
      setIsReady(true);
    }).catch(() => setIsReady(true));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await setup(form);
      login(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Setup gagal.');
    } finally {
      setLoading(false);
    }
  }

  if (!isReady) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!canRegister) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Setup SIKAP</h1>
          <p className="text-sm text-text-muted">Buat akun Superadmin pertama Anda</p>
        </div>
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {error && <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</div>}
            <Field label="Nama">
              <TextInput value={form.name} onChange={e => setForm({...form, name: e.target.value})} required autoFocus />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </Field>
            <Field label="Password">
              <TextInput type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
            </Field>
            <Button type="submit" className="mt-2" disabled={loading}>
              {loading ? 'Memproses...' : 'Buat Akun'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
