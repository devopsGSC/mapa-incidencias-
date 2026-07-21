import { IconKey, IconTrash, IconUserPlus } from "@tabler/icons-react";
import { FormEvent, useEffect, useState } from "react";
import {
  createUser,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  setUserRole,
} from "../api/adminClient";
import { UnauthorizedError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PasswordInput } from "../components/PasswordInput";
import { AdminUserSummary, Role } from "../types";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  normal: "Usuario",
};

interface CreateFormState {
  username: string;
  email: string;
  password: string;
  role: Role;
}

interface ResetPasswordState {
  username: string;
  password: string;
}

export function AdminUsersSection() {
  const { user: currentUser, clearSession } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetForm, setResetForm] = useState<ResetPasswordState | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const load = async () => {
    try {
      const list = await fetchUsers();
      setUsers(list);
      setError(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearSession();
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setCreateError(null);
    setCreateForm({ username: "", email: "", password: "", role: "normal" });
  };

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!createForm) return;
    if (createForm.password.length < 8) {
      setCreateError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSaving(true);
    setCreateError(null);
    try {
      await createUser(createForm);
      setCreateForm(null);
      await load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearSession();
        return;
      }
      setCreateError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (username: string, role: Role) => {
    try {
      await setUserRole(username, role);
      await load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearSession();
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo cambiar el rol.");
    }
  };

  const handleResetSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!resetForm) return;
    if (resetForm.password.length < 8) {
      setResetError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      await resetUserPassword(resetForm.username, resetForm.password);
      setResetForm(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearSession();
        return;
      }
      setResetError(err instanceof Error ? err.message : "No se pudo resetear la contraseña.");
    }
  };

  const handleDelete = async (username: string) => {
    if (!window.confirm(`¿Borrar el usuario "${username}"? No va a poder volver a loguearse.`)) {
      return;
    }
    try {
      await deleteUser(username);
      await load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearSession();
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo borrar el usuario.");
    }
  };

  if (loading) {
    return <p className="text-sm text-[color:var(--text-secondary)]">Cargando...</p>;
  }

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-[color:var(--text)]">Usuarios</h2>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-[color:var(--text)] hover:bg-white/15"
        >
          <IconUserPlus size={14} stroke={2} />
          Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#FF4D6D]/40 bg-[#2a0f16]/90 px-4 py-2 text-sm text-[#ff8fa3]">
          {error}
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="mono-label text-[10px] text-[color:var(--text-secondary)]">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.username.toLowerCase() === currentUser?.username.toLowerCase();
                const isLastAdmin = u.role === "admin" && adminCount <= 1;
                const deleteDisabled = isSelf || isLastAdmin;
                const deleteTitle = isSelf
                  ? "No podés borrar tu propia cuenta"
                  : isLastAdmin
                    ? "No se puede borrar al único administrador"
                    : "Borrar";

                return (
                  <tr
                    key={u.username}
                    className="border-t border-[color:var(--glass-border)] transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-2.5 text-[color:var(--text)]">
                      {u.username}
                      {isSelf && (
                        <span className="mono-label ml-1.5 text-[9px] text-[color:var(--text-disabled)]">
                          (tú)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[color:var(--text-secondary)]">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.username, e.target.value as Role)}
                        className="mono-label rounded bg-transparent px-2 py-0.5 text-[10px] font-medium outline-none"
                        style={{
                          border: `0.5px solid ${u.role === "admin" ? "var(--border-accent)" : "var(--border-strong)"}`,
                          color: u.role === "admin" ? "var(--text-accent)" : "var(--text-secondary)",
                        }}
                      >
                        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                          <option key={role} value={role} className="bg-[#0b1220] text-[color:var(--text)]">
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setResetError(null);
                          setResetForm({ username: u.username, password: "" });
                        }}
                        aria-label={`Resetear clave de ${u.username}`}
                        title="Resetear clave"
                        className="mr-2 rounded p-1 text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text)]"
                      >
                        <IconKey size={15} stroke={2} />
                      </button>
                      <button
                        type="button"
                        onClick={deleteDisabled ? undefined : () => handleDelete(u.username)}
                        disabled={deleteDisabled}
                        aria-label={`Borrar ${u.username}`}
                        title={deleteTitle}
                        className={`rounded p-1 transition-colors disabled:cursor-not-allowed ${
                          deleteDisabled
                            ? "text-[color:var(--text-disabled)]"
                            : "text-[color:var(--text-secondary)] hover:text-[#FF718A]"
                        }`}
                      >
                        <IconTrash size={15} stroke={2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {createForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form onSubmit={handleCreateSubmit} className="glass-panel w-full max-w-sm space-y-4 p-6">
            <h3 className="font-display text-base font-semibold text-[color:var(--text)]">Nuevo usuario</h3>

            <label className="block text-sm text-[color:var(--text-secondary)]">
              Usuario
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
                autoFocus
                className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
              />
            </label>

            <label className="block text-sm text-[color:var(--text-secondary)]">
              Email
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
                className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
              />
            </label>

            <label className="block text-sm text-[color:var(--text-secondary)]">
              Contraseña inicial
              <PasswordInput
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={8}
                className="rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
              />
            </label>

            <label className="block text-sm text-[color:var(--text-secondary)]">
              Rol
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
                className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-[#0b1220] px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>

            {createError && <p className="text-sm text-[#FF718A]">{createError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateForm(null)}
                className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-[color:var(--text)] hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-white/15 disabled:opacity-50"
              >
                {saving ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {resetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form onSubmit={handleResetSubmit} className="glass-panel w-full max-w-sm space-y-4 p-6">
            <h3 className="font-display text-base font-semibold text-[color:var(--text)]">
              Resetear contraseña de {resetForm.username}
            </h3>

            <label className="block text-sm text-[color:var(--text-secondary)]">
              Contraseña nueva
              <PasswordInput
                value={resetForm.password}
                onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                required
                autoFocus
                minLength={8}
                className="rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
              />
            </label>

            {resetError && <p className="text-sm text-[#FF718A]">{resetError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetForm(null)}
                className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-[color:var(--text)] hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-white/15"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
