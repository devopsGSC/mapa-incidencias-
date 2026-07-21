import path from "path";
import nodemailer from "nodemailer";

const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL ?? "https://mapaincidencias.gcslatam.com").replace(
  /\/+$/,
  ""
);

// Copia de frontend/src/img/logo_gcs_blanco.png — el backend necesita su
// propia copia porque el correo se arma acá, no en el frontend, y en
// producción son dos paquetes desplegados por separado. Ver
// backend/scripts/copy-assets.js para el paso que la lleva a dist/ al buildear.
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo_gcs_blanco.png");
const LOGO_CID = "gcs-logo";

function getTransportOrThrow() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Falta GMAIL_USER/GMAIL_APP_PASSWORD en backend/.env");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

function buildHtml(resetUrl: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#0b1220;padding:28px 32px;text-align:center;">
                <img src="cid:${LOGO_CID}" alt="Global Customs Solutions" width="140" style="display:block;margin:0 auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:18px;line-height:1.3;color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
                  Restablecer tu contraseña
                </h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                  Recibimos una solicitud para restablecer la contraseña de tu cuenta en el
                  <strong>Dashboard de Tickets</strong> de Global Customs Solutions.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:8px;background:#1A294C;">
                      <a
                        href="${resetUrl}"
                        style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#7099FF;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;"
                      >
                        Restablecer contraseña
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">
                  Este enlace es válido por <strong>1 hora</strong>. Si no fuiste vos quien lo pidió, ignorá
                  este correo — tu contraseña actual sigue funcionando normalmente.
                </p>
                <p style="margin:24px 0 0;font-size:11px;line-height:1.5;color:#94a3b8;word-break:break-all;">
                  Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br />
                  <a href="${resetUrl}" style="color:#4c7fff;">${resetUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11px;color:#94a3b8;">
                  Global Customs Solutions · Dashboard de Tickets
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Envía el correo de recuperación de contraseña. Se llama "fire and forget"
 * desde routes/auth.ts (nunca se espera esta promesa antes de responder al
 * cliente): la ruta debe responder en el mismo tiempo exista o no el
 * usuario, y el envío real por SMTP de Gmail tarda variable — awaitearlo
 * filtraría por timing si un correo existe o no.
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const transport = getTransportOrThrow();
  const resetUrl = `${FRONTEND_BASE_URL}/reset-password?token=${token}`;

  await transport.sendMail({
    from: `"Global Customs Solutions" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Restablecer contraseña — Dashboard de Tickets",
    text: `Recibimos una solicitud para restablecer tu contraseña.\n\nEste enlace es válido por 1 hora:\n${resetUrl}\n\nSi no fuiste vos quien lo pidió, ignorá este correo — tu contraseña actual sigue funcionando normalmente.`,
    html: buildHtml(resetUrl),
    attachments: [
      {
        filename: "logo.png",
        path: LOGO_PATH,
        cid: LOGO_CID,
      },
    ],
  });
}
