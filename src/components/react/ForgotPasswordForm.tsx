import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { auth } from "../../lib/auth";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

interface ForgotPasswordFormProps {
  lang: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  lang,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await auth.forgotPassword(email);
      // Redirect to reset password page with email param
      window.location.href = `/${lang}/reset-password?email=${encodeURIComponent(email)}`;
    } catch (err: any) {
      setError(err.message || "Error al solicitar recuperación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-[#E8F1EF] p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-tropical-text">
          Recuperar Contraseña
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Ingresa tu correo para recibir un código de recuperación
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail size={18} />}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg text-center animate-in fade-in">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Enviar Código <ArrowRight size={18} className="ml-2" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <a
          href={`/${lang}/login`}
          className="text-gray-500 hover:text-tropical-primary transition-colors"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  );
};
