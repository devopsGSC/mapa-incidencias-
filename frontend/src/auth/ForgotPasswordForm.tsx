import { FormEvent, useState } from "react";
import { requestPasswordReset } from "../api/authClient";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

// Siempre el mismo texto, exista o no el correo — no hay forma de que la UI
// distinga ambos casos, y así debe seguir siendo.
const GENERIC_CONFIRMATION =
  "Si el correo existe en nuestro sistema, vas a recibir instrucciones para restablecer tu contraseña.";

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // A propósito: nunca se muestra un error distinto acá — el mensaje de
      // éxito es el mismo pase lo que pase, para no filtrar qué correos
      // existen ni delatar fallas puntuales del envío.
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-[color:var(--text)]">{GENERIC_CONFIRMATION}</p>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[color:var(--muted)] hover:text-[color:var(--text)]"
        >
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-[color:var(--muted)]">
        Correo electrónico
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
          className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-[#1A294C] px-3 py-2 text-sm font-medium text-[#7099FF] transition-colors hover:bg-[#223868] disabled:opacity-50"
      >
        {submitting ? "Enviando..." : "Enviar instrucciones"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="block w-full text-center text-xs text-[color:var(--muted)] hover:text-[color:var(--text)]"
      >
        Volver a iniciar sesión
      </button>
    </form>
  );
}
