import { IconLogout, IconMapPin, IconMapPinOff, IconArrowLeft } from "@tabler/icons-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdminUnauthorizedError,
  adminLogout,
  deleteSite,
  fetchConfiguredSites,
  fetchUnmappedSiteNames,
  upsertSite,
} from "../api/adminClient";
import logo from "../img/logo_gcs_blanco.png";
import { SITE_TYPE_LABELS } from "../lib/labels";
import { Site, SiteType } from "../types";

const SITE_TYPES: SiteType[] = ["aduana_terrestre", "aduana_maritima", "aduana_aerea", "sede"];

interface FormState {
  name: string;
  type: SiteType;
  lat: string;
  lng: string;
}

export function AdminSitesPage() {
  const navigate = useNavigate();
  const [configured, setConfigured] = useState<Site[]>([]);
  const [unmapped, setUnmapped] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [sites, names] = await Promise.all([fetchConfiguredSites(), fetchUnmappedSiteNames()]);
      setConfigured(sites);
      setUnmapped(names);
      setError(null);
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await adminLogout().catch(() => {});
    navigate("/admin/login", { replace: true });
  };

  const openAssignForm = (name: string) => {
    setFormError(null);
    setForm({ name, type: "sede", lat: "", lng: "" });
  };

  const openEditForm = (site: Site) => {
    setFormError(null);
    setForm({ name: site.name, type: site.type, lat: String(site.lat), lng: String(site.lng) });
  };

  const closeForm = () => setForm(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFormError("lat y lng deben ser números válidos.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await upsertSite({ name: form.name, type: form.type, lat, lng });
      setForm(null);
      await load();
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el sitio.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`¿Quitar coordenadas de "${name}"? El sitio deja de verse en el mapa hasta que se vuelva a configurar.`)) {
      return;
    }
    try {
      await deleteSite(name);
      await load();
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo borrar el sitio.");
    }
  };

  if (loading) {
    return (
      <div className="mono-label flex h-screen items-center justify-center text-xs text-[color:var(--muted)]">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--map-bg)] px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <header className="glass-panel mb-6 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Global Customs Solutions" className="h-9 w-auto" />
            <div>
              <h1 className="font-display text-lg font-semibold text-[color:var(--text)]">
                Administración de sitios
              </h1>
              <p className="mono-label mt-0.5 text-[10px] text-[color:var(--muted)]">
                Global Customs Solutions · Coordenadas de sitios reales de osTicket
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-[color:var(--muted)] hover:bg-white/5 hover:text-[color:var(--text)]"
            >
              <IconArrowLeft size={14} stroke={2} />
              Volver al dashboard
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-[color:var(--text)] hover:bg-white/10"
            >
              <IconLogout size={14} stroke={2} />
              Cerrar sesión
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-[#FF4D6D]/40 bg-[#2a0f16]/90 px-4 py-2 text-sm text-[#ff8fa3]">
            {error}
          </div>
        )}

        {unmapped.length > 0 && (
          <div
            className="mb-6 flex items-center gap-3 rounded-lg border px-4 py-3"
            style={{ borderColor: "color-mix(in srgb, var(--amber) 40%, transparent)", backgroundColor: "color-mix(in srgb, var(--amber) 12%, transparent)" }}
          >
            <span className="text-lg leading-none" style={{ color: "var(--amber)" }}>
              ⚠
            </span>
            <p className="text-sm" style={{ color: "var(--amber)" }}>
              <strong>
                {unmapped.length} sitio{unmapped.length === 1 ? "" : "s"} sin mapear
              </strong>{" "}
              — {unmapped.length === 1 ? "existe en osTicket pero no tiene" : "existen en osTicket pero no tienen"}{" "}
              coordenadas asignadas. Sus tickets cuentan en las métricas globales, pero no aparecen en el mapa ni en
              el desglose por sitio hasta que se les asigne tipo y ubicación abajo.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="glass-panel p-5">
            <h2 className="mono-label mb-4 flex items-center gap-2 text-[11px] text-[color:var(--muted)]">
              <IconMapPinOff size={15} stroke={2} />
              Sitios sin configurar ({unmapped.length})
            </h2>
            {unmapped.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                Todos los sitios reales de osTicket ya tienen coordenadas asignadas.
              </p>
            ) : (
              <ul className="space-y-2">
                {unmapped.map((name) => (
                  <li
                    key={name}
                    className="flex items-center justify-between gap-2 rounded-md bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)]"
                  >
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() => openAssignForm(name)}
                      className="rounded-md bg-[#1A294C] px-2.5 py-1 text-xs font-medium text-[#7099FF] hover:bg-[#223868]"
                    >
                      Asignar coordenadas
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass-panel p-5">
            <h2 className="mono-label mb-4 flex items-center gap-2 text-[11px] text-[color:var(--muted)]">
              <IconMapPin size={15} stroke={2} />
              Sitios configurados ({configured.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="mono-label text-[10px] text-[color:var(--muted)]">
                    <th className="pb-2 pr-3">Nombre</th>
                    <th className="pb-2 pr-3">Tipo</th>
                    <th className="pb-2 pr-3">Lat</th>
                    <th className="pb-2 pr-3">Lng</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {configured.map((site) => (
                    <tr
                      key={site.id}
                      className="border-t border-[color:var(--glass-border)] transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="py-2.5 pr-3 text-[color:var(--text)]">{site.name}</td>
                      <td className="py-2.5 pr-3 text-[color:var(--muted)]">{SITE_TYPE_LABELS[site.type]}</td>
                      <td className="py-2.5 pr-3 text-[color:var(--muted)]">{site.lat}</td>
                      <td className="py-2.5 pr-3 text-[color:var(--muted)]">{site.lng}</td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEditForm(site)}
                          className="mr-2 text-xs text-[color:var(--cyan)] hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(site.name)}
                          className="text-xs text-[#FF718A] hover:underline"
                        >
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form onSubmit={handleSubmit} className="glass-panel w-full max-w-sm space-y-4 p-6">
            <h3 className="font-display text-base font-semibold text-[color:var(--text)]">
              {form.name}
            </h3>

            <label className="block text-sm text-[color:var(--muted)]">
              Tipo
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as SiteType })}
                className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-[#0b1220] px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
              >
                {SITE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SITE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-3">
              <label className="block flex-1 text-sm text-[color:var(--muted)]">
                Latitud
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
                />
              </label>
              <label className="block flex-1 text-sm text-[color:var(--muted)]">
                Longitud
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-[color:var(--glass-border)] bg-black/20 px-3 py-2 text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
                />
              </label>
            </div>

            {formError && <p className="text-sm text-[#FF718A]">{formError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-[color:var(--text)] hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-[#1A294C] px-3 py-1.5 text-sm font-medium text-[#7099FF] hover:bg-[#223868] disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
