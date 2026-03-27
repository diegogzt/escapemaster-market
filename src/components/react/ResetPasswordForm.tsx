import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { auth } from '../../lib/auth';
import { Lock, KeyRound, Loader2 } from 'lucide-react';

interface ResetPasswordFormProps {
  lang: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ lang }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract email from URL query param
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('El correo es obligatorio');
      return;
    }

    if (!code || code.length !== 6) {
      setError('Introduce el código de 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      await auth.verifyResetCode(email, code);
      setCodeVerified(true);
    } catch (err: any) {
      setError(err.message || 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!codeVerified) {
      setError('Primero verifica el código');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await auth.resetPassword(email, code, newPassword);
      alert('Contraseña restablecida con éxito. Ahora puedes iniciar sesión.');
      window.location.href = `/${lang}/login`;
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-[#E8F1EF] p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-tropical-text">Nueva Contraseña</h2>
        <p className="text-gray-500 text-sm mt-1">
          {!codeVerified
            ? 'Primero verifica el código que te enviamos'
            : 'Ahora crea tu nueva contraseña'}
        </p>
      </div>

      {!codeVerified ? (
        <form onSubmit={handleVerifyCode} className="space-y-4">
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="space-y-1">
            <Input
            label="Código de Verificación"
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center tracking-widest font-mono text-lg"
            maxLength={6}
            required
            icon={<KeyRound size={18} />}
            />
            <p className="text-[10px] text-gray-400 text-center">Código de 6 dígitos enviado a tu correo</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg text-center animate-in fade-in">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'Verificar Código'}
        </Button>
      </form>
      ) : (
        <form onSubmit={handleSubmitNewPassword} className="space-y-4">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="space-y-1">
            <Input
              label="Código verificado"
              type="text"
              value={code}
              disabled
              className="text-center tracking-widest font-mono text-lg"
              icon={<KeyRound size={18} />}
            />
            <p className="text-[10px] text-gray-400 text-center">Puedes crear una nueva contraseña</p>
          </div>

          <Input
            label="Nueva Contraseña"
            type="password"
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            min={8}
            icon={<Lock size={18} />}
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            min={8}
            icon={<Lock size={18} />}
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg text-center animate-in fade-in">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Restablecer Contraseña'}
          </Button>
        </form>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-600">
        <a href={`/${lang}/login`} className="text-gray-500 hover:text-tropical-primary transition-colors">
            Cancelar
        </a>
      </div>
    </div>
  );
};
