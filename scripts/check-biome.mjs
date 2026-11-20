// Corre Biome (mismo biome.json que el proyecto real) sobre el código que se copia al proyecto.
// En el proyecto real Biome bloquea el commit: aquí no se acepta ningún error.
//
//   npm run check:biome            → revisa (incluido en check:nuevos)
//   npm run biome:arreglar         → aplica formato, orden de imports y arreglos seguros
//
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const RUTAS = [
  "src/features/pricing",
  "src/features/embarques/v2", // el resto de embarques es solo referencia
  "src/features/actividades",
  "src/shared/components/form/fields/async-combobox-input.tsx",
  "src/shared/components/data-table/data-table-pagination.tsx",
];

// El proyecto real mezcla CRLF y LF por archivo. Cada archivo se revisa con su propio final de
// línea (--line-ending), así el formato no marca error por CRLF y nunca se convierte el archivo.
const archivos = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", ...RUTAS], { encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.(ts|tsx|js|jsx|mjs|json|css)$/.test(f));
const esCrlf = (f) => readFileSync(f, "latin1").includes("\r\n");
const grupos = [
  { finLinea: "lf", archivos: archivos.filter((f) => !esCrlf(f)) },
  { finLinea: "crlf", archivos: archivos.filter(esCrlf) },
].filter((g) => g.archivos.length);

const arreglar = process.argv.includes("--arreglar");
const biome = "node_modules/@biomejs/biome/bin/biome";

if (arreglar) {
  try {
    for (const g of grupos) {
      execFileSync(
        process.execPath,
        [biome, "check", "--write", `--line-ending=${g.finLinea}`, ...g.archivos],
        { stdio: "inherit" },
      );
    }
  } catch {
    // Los errores que no se arreglan solos se muestran abajo.
  }
}

const diagnosticos = [];
for (const g of grupos) {
  let salida = "";
  try {
    salida = execFileSync(
      process.execPath,
      [biome, "check", "--reporter=json", "--max-diagnostics=none", `--line-ending=${g.finLinea}`, ...g.archivos],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    );
  } catch (error) {
    salida = error.stdout ?? "";
  }
  try {
    diagnosticos.push(...JSON.parse(salida).diagnostics);
  } catch {
    console.error("Biome no devolvió un resultado válido. ¿Corriste npm install?");
    process.exit(2);
  }
}

const errores = diagnosticos.filter((d) => d.severity === "error" || d.severity === "fatal");
const avisos = diagnosticos.filter((d) => d.severity === "warning");

const ubicacion = (d) => {
  const l = d.location ?? {};
  const pos = l.start ? `:${l.start.line}:${l.start.column}` : "";
  return `${l.path ?? "?"}${pos}`;
};

console.log(`Biome: errores ${errores.length} | avisos ${avisos.length}`);
for (const d of errores) console.log(`  ERROR  ${ubicacion(d)}  ${d.category ?? ""}  ${d.message}`);
for (const d of avisos) console.log(`  AVISO  ${ubicacion(d)}  ${d.category ?? ""}  ${d.message}`);

if (errores.length) {
  console.log("\nDetalle: npx biome check <archivo>. Formato e imports: npm run biome:arreglar");
  process.exit(1);
}
