import { useState } from "react";
import logo from "../img/logo_gcs_blanco.png";
import { AuthBackground } from "./AuthBackground";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";

type Mode = "login" | "forgot-password";

export function LoginModal() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <AuthBackground>
      <div className="flex flex-col items-center gap-3 text-center">
        <img src={logo} alt="Global Customs Solutions" className="h-10 w-auto" />
        <div>
          <h1 className="font-display text-lg font-semibold text-[color:var(--text)]">
            {mode === "login" ? "Iniciar sesión" : "Recuperar contraseña"}
          </h1>
          <p className="mono-label mt-1 text-[10px] text-[color:var(--muted)]">
            Global Customs Solutions · Sitios El Salvador
          </p>
        </div>
      </div>

      {mode === "login" ? (
        <div className="space-y-4">
          <LoginForm />
          <button
            type="button"
            onClick={() => setMode("forgot-password")}
            className="block w-full text-center text-xs text-[color:var(--muted)] hover:text-[color:var(--text)]"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      ) : (
        <ForgotPasswordForm onBack={() => setMode("login")} />
      )}
    </AuthBackground>
  );
}
