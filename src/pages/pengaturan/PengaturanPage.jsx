import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Field, TextInput } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { updatePassword } from '../../services/authService';
import { extractError } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

export default function PengaturanPage() {
  const toast = useToast();
  const { user, updateProfile } = useAuth();

  const [profile, setProfile] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', email: user.email || '' });
  }, [user]);

  async function submitProfile(e) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile(profile);
      toast.success('Profil berhasil diperbarui.');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setProfileLoading(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    setPwdLoading(true);
    try {
      await updatePassword(pwd);
      setPwd({ current_password: '', password: '', password_confirmation: '' });
      toast.success('Password berhasil diubah.');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Pengaturan" subtitle="Kelola profil dan keamanan akun Anda." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Profil</h2>

          <form onSubmit={submitProfile} className="space-y-4">
            <Field label="Nama">
              <TextInput
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Email">
              <TextInput
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </Field>
            <div className="text-xs text-text-muted">
              Role: <span className="font-medium text-text-primary capitalize">{user?.role}</span>
              {user?.instansi?.nama && ` · ${user.instansi.nama}`}
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Ubah Password</h2>

          <form onSubmit={submitPassword} className="space-y-4">
            <Field label="Password Lama">
              <TextInput
                type="password"
                value={pwd.current_password}
                onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
                required
              />
            </Field>
            <Field label="Password Baru">
              <TextInput
                type="password"
                value={pwd.password}
                onChange={(e) => setPwd({ ...pwd, password: e.target.value })}
                placeholder="Min. 8 karakter"
                required
              />
            </Field>
            <Field label="Konfirmasi Password Baru">
              <TextInput
                type="password"
                value={pwd.password_confirmation}
                onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })}
                required
              />
            </Field>
            <Button type="submit" disabled={pwdLoading}>
              {pwdLoading ? 'Menyimpan...' : 'Ubah Password'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
