import "leaflet/dist/leaflet.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminSitesPage } from "./admin/AdminSitesPage";
import { AuthGate } from "./auth/AuthGate";
import { AuthProvider } from "./auth/AuthContext";
import { RequireRole } from "./auth/RequireRole";
import { ResetPasswordPage } from "./auth/ResetPasswordPage";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Público, sin sesión: a donde lleva el enlace del correo de "¿Olvidaste tu contraseña?". */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/*"
            element={
              <AuthGate>
                <Routes>
                  <Route
                    path="/admin/sites"
                    element={
                      <RequireRole role="admin">
                        <AdminSitesPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/*" element={<App />} />
                </Routes>
              </AuthGate>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
