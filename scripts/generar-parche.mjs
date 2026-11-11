// Genera un parche (git diff) de src/features/pricing para aplicarlo en erp-web con `git apply`,
// sin copiar y pegar archivos.
//
//   npm run parche                 → cambios de la rama actual vs origin/main (commits + sin commitear)
//   npm run parche -- <base>       → vs otra base (rama, tag o commit), ej. `npm run parche -- HEAD~1`
//
// Escribe parches/<rama>.patch. Solo incluye src/features/pricing (lo único que se copia al proyecto real);
// las rutas del parche son las mismas del proyecto real, así que se aplica desde la raíz de erp-web.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const RUTA = "src/features/pricing";
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const baseArg = process.argv[2] ?? "origin/main";
// Punto donde la rama se separó de la base: así el parche trae solo los cambios propios de la rama.
const base = git("merge-base", baseArg, "HEAD").trim();

// Sin segundo commit = compara base contra el árbol de trabajo (incluye cambios aún sin commitear).
// --binary conserva bytes exactos (CRLF/LF por archivo) y soporta archivos binarios.
const parche = git("diff", "--binary", "--no-color", "--no-ext-diff", base, "--", RUTA);

if (parche.trim() === "") {
  console.log(`Sin cambios en ${RUTA} respecto a ${baseArg} (${base.slice(0, 7)}).`);
  process.exit(0);
}

const rama = git("rev-parse", "--abbrev-ref", "HEAD").trim().replace(/[^\w.-]+/g, "-");
const salida = `parches/${rama}.patch`;
mkdirSync("parches", { recursive: true });
writeFileSync(salida, parche);

console.log(`Parche: ${salida}  (base ${baseArg} @ ${base.slice(0, 7)})`);
console.log(git("diff", "--stat", base, "--", RUTA));
console.log("En la raíz de erp-web:");
console.log(`  git apply --check ruta/a/${rama}.patch`);
console.log(`  git apply ruta/a/${rama}.patch`);
