import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authClient";
import { PasswordInput } from "../components/PasswordInput";
import logo from "../img/logo_gcs_blanco.png";
import { AuthBackground } from "./AuthBackground";

/** Ruta pública /reset-password?token=... — no requiere sesión, es a donde lleva el enlace del correo de "¿Olvidaste tu contraseña?". */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthBackground>
      <div className="flex flex-col items-center gap-3 text-center">
        <img src={logo} alt="Global Customs Solutions" className="h-10 w-auto" />
        <div>
          <h1 className="font-display text-lg font-semibold text-[color:var(--text)]">
            Restablecer contraseña
          </h1>
          <p className="mono-label mt-1 text-[10px] text-[color:var(--muted)]">
            Global Customs Solutions · Sitios El Salvador
          </p>
        </div>
      </div>

      {!token ? (
        <p className="text-center text-sm text-[#FF718A]">
          Este enlace no es válido. Pedí uno nuevo desde la pantalla de inicio de sesión.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-[color:var(--muted)]">
            Contraseña nueva
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              minLength={8}
              className="rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
            />
          </label>

          <label className="block text-sm text-[color:var(--muted)]">
            Repetir contraseña nueva
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
            />
          </label>

          {error && <p className="text-sm text-[#FF718A]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#1A294C] px-3 py-2 text-sm font-medium text-[#7099FF] transition-colors hover:bg-[#223868] disabled:opacity-50"
          >
            {submitting ? "Guardando..." : "Restablecer contraseña"}
          </button>
        </form>
      )}
    </AuthBackground>
  );
}
