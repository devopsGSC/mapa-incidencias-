import { FormEvent, useState } from "react";
import { adminLogin } from "../api/adminClient";

interface AdminLoginFormProps {
  onSuccess: () => void;
  autoFocus?: boolean;
}

/** Formulario de login puro, reutilizado tanto por la página /admin/login como por el modal accesible desde el dashboard. */
export function AdminLoginForm({ onSuccess, autoFocus = true }: AdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminLogin(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-[color:var(--muted)]">
        Usuario
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus={autoFocus}
          required
          className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
        />
      </label>

      <label className="block text-sm text-[color:var(--muted)]">
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
        />
      </label>

      {error && <p className="text-sm text-[#FF718A]">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-[#1A294C] px-3 py-2 text-sm font-medium text-[#7099FF] transition-colors hover:bg-[#223868] disabled:opacity-50"
      >
        {submitting ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
