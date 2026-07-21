// tsc no copia archivos que no importa como módulo — los *.seed.json (y el
// logo del correo de recuperación) se leen con fs.readFileSync (no con
// `import`), así que hay que copiarlos a dist/ a mano después de compilar
// para que existan en producción.
const fs = require("fs");
const path = require("path");

const FILES_TO_COPY = [
  ["data", "site-metadata.seed.json"],
  ["data", "users.seed.json"],
  ["assets", "logo_gcs_blanco.png"],
];

for (const [dir, fileName] of FILES_TO_COPY) {
  const src = path.join(__dirname, "..", "src", dir, fileName);
  const dest = path.join(__dirname, "..", "dist", dir, fileName);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[copy-assets] ${src} -> ${dest}`);
}
