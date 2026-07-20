import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Uso: npm run hash-password -- "tu-contraseña"');
  process.exit(1);
}

bcrypt
  .hash(password, 12)
  .then((hash) => {
    console.log(hash);
  })
  .catch((error) => {
    console.error("No se pudo generar el hash:", error.message);
    process.exit(1);
  });
