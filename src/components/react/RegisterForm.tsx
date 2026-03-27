import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { auth } from "../../lib/auth";
import { requestGoogleCredential } from "../../lib/google-auth";
import {
  User,
  Building2,
  ArrowRight,
  Check,
  Loader2,
  Mail,
  Lock,
} from "lucide-react";

type AccountType = "customer" | "enterprise";
type Step = 0 | 1 | 2; // Step 0: Account type, Step 1: Form, Step 2: Verification

interface RegisterFormProps {
  lang: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ lang }) => {
  const googleLoginEnabled = Boolean(import.meta.env.PUBLIC_GOOGLE_CLIENT_ID?.trim());
  // Check if we came from login with ?verify=email param
  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const verifyEmail = urlParams?.get("verify") || "";

  const [step, setStep] = useState<Step>(verifyEmail ? 2 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [email, setEmail] = useState(verifyEmail || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 1: Collect ALL Data & Register (which triggers code email)
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        email,
        password,
        full_name: fullName,
        ...(accountType === "enterprise" && {
          organization_name: organizationName,
        }),
      };

      // Calls backend registration which now sends the code
      await auth.register(registerData);

      // Move to verification step
      setStep(2);
    } catch (err: any) {
      // Handle "Email already registered" gracefully
      setError(err.message || "Error al enviar datos de registro");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await auth.verifyEmailCode(email, verificationCode);

      // Auto-login after verification; go to onboarding
      window.location.href = `/${lang}/onboarding`;
    } catch (err: any) {
      setError(err.message || "Código inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);

    if (accountType === "enterprise" && !organizationName.trim()) {
      setError("El nombre de la empresa es obligatorio");
      return;
    }

    setLoading(true);

    try {
      const credential = await requestGoogleCredential();
      await auth.loginWithGoogle(credential, {
        accountType,
        organizationName:
          accountType === "enterprise" ? organizationName.trim() : undefined,
      });
      const session = await auth.getSession();
      if (session.user && !session.user.onboarding_completed) {
        window.location.href = `/${lang}/onboarding`;
      } else {
        window.location.href = `/${lang}/profile`;
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesion con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 px-4 sm:px-16">
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            className="flex flex-col items-center relative z-10 text-center"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= s
                  ? "bg-tropical-primary text-white shadow-lg scale-110"
                  : "bg-tropical-secondary/10 text-tropical-text/40"
              }`}
            >
              {step > s ? <Check size={20} /> : s + 1}
            </div>
            <span
              className={`text-xs mt-2 font-medium transition-colors ${step >= s ? "text-tropical-primary" : "text-tropical-text/40"}`}
            >
              {s === 0 ? "Tipo" : s === 1 ? "Datos" : "Verificación"}
            </span>
          </div>
        ))}
        {/* Progress Bar Background */}
        <div className="absolute top-11 left-12 right-12 h-0.5 bg-tropical-secondary/10 z-0 w-[85%] mx-auto" />
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-tropical-secondary/15 p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-tropical-text">
            {step === 0 && "¿Qué tipo de cuenta?"}
            {step === 1 && "Crea tu cuenta"}
            {step === 2 && "Verifica tu identidad"}
          </h2>
          <p className="text-tropical-text/50 text-sm mt-1">
            {step === 0 && "Selecciona si eres jugador o empresa"}
            {step === 1 && "Completa tus datos para empezar"}
            {step === 2 && `Hemos enviado un código a ${email}`}
          </p>
        </div>

        {/* Step 0: Account Type Selection */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAccountType("customer") || setStep(1)}
                className="p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all hover:border-tropical-primary hover:bg-tropical-primary/5 border-tropical-secondary/15 text-tropical-text/70 hover:text-tropical-primary active:scale-[0.98]"
              >
                <User size={32} />
                <span className="text-base font-bold">Soy Jugador</span>
                <span className="text-xs text-tropical-text/50">Busca y reserva salas</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("enterprise") || setStep(1)}
                className="p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all hover:border-tropical-primary hover:bg-tropical-primary/5 border-tropical-secondary/15 text-tropical-text/70 hover:text-tropical-primary active:scale-[0.98]"
              >
                <Building2 size={32} />
                <span className="text-base font-bold">Soy Empresa</span>
                <span className="text-xs text-tropical-text/50">Gestiona tus salas</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Data Form */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre Completo"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                icon={<User size={18} />}
              />

              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon={<Mail size={18} />}
              />
            </div>

            {accountType === "enterprise" && (
              <Input
                label="Nombre de la Empresa"
                placeholder="Mi Escape Room S.L."
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                icon={<Building2 size={18} />}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contraseña"
                type="password"
                placeholder="Minimum 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                min={8}
                icon={<Lock size={18} />}
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                min={8}
                icon={<Check size={18} />}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4 h-14 text-lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Registrarse y Enviar Código{" "}
                  <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </Button>
          </form>
        )}

        {step === 1 && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-tropical-secondary/20"></span>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-tropical-text/50 uppercase tracking-widest font-bold text-[10px]">
                  O CONTINUA CON
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || !googleLoginEnabled}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border-2 border-tropical-secondary/15 rounded-xl hover:bg-tropical-secondary/5 hover:border-tropical-primary/30 transition-all shadow-sm active:scale-[0.98] group"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-tropical-text/70 font-bold">Google</span>
              </button>
              {!googleLoginEnabled && (
                <p className="text-xs text-center text-tropical-text/40">
                  El login con Google no esta disponible en este entorno.
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 2: Verification Code Form */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-6">
            <div className="space-y-3">
              <Input
                label="Código de Verificación"
                type="text"
                placeholder="XXXXXX"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                className="text-center text-3xl tracking-[0.5em] font-mono h-16"
                required
                maxLength={6}
              />
              <p className="text-xs text-center text-tropical-text/40">
                Introduce el código de 6 dígitos que acabamos de enviar a tu
                correo.
                <br />
                Revisa la carpeta de Spam si no lo encuentras.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Verificar y Finalizar"
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-tropical-text/40 w-full text-center hover:text-tropical-primary transition-colors mt-2"
            >
              ¿Correo incorrecto? Volver atrás
            </button>
          </form>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-tropical-accent/10 border border-tropical-accent/20 text-tropical-accent text-sm rounded-lg text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-tropical-text/60">
          ¿Ya tienes cuenta?
          <a
            href={`/${lang}/login`}
            className="text-tropical-primary font-bold hover:underline ml-1"
          >
            Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
};
