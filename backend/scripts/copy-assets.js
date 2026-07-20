// tsc no copia archivos que no importa como módulo — site-metadata.seed.json
// se lee con fs.readFileSync (no con `import`), así que hay que copiarlo a
// dist/ a mano después de compilar para que el seed exista en producción.
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src", "data", "site-metadata.seed.json");
const dest = path.join(__dirname, "..", "dist", "data", "site-metadata.seed.json");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`[copy-assets] ${src} -> ${dest}`);
