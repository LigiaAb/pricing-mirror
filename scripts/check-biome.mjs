// Corre Biome (mismo biome.json que el proyecto real) sobre el código que se copia al proyecto.
// En el proyecto real Biome bloquea el commit: aquí no se acepta ningún error.
//
//   npm run check:biome            → revisa (incluido en check:nuevos)
//   npm run biome:arreglar         → aplica formato, orden de imports y arreglos seguros
//
// Única excepción del espejo: `next` no está instalado (next/link es stub), así que se ignora
// `noUndeclaredDependencies` para `next`. En el proyecto real sí está en package.json.
import { execFileSync } from "node:child_process";

const RUTAS = [
  "src/features/pricing",
  "src/features/embarques/v2", // el resto de embarques es solo referencia
  "src/shared/components/form/fields/async-combobox-input.tsx",
];

const arreglar = process.argv.includes("--arreglar");
const biome = "node_modules/@biomejs/biome/bin/biome";

if (arreglar) {
  try {
    execFileSync(process.execPath, [biome, "check", "--write", ...RUTAS], { stdio: "inherit" });
  } catch {
    // Los errores que no se arreglan solos se muestran abajo.
  }
}

let salida = "";
try {
  salida = execFileSync(process.execPath, [biome, "check", "--reporter=json", "--max-diagnostics=none", ...RUTAS], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
} catch (error) {
  salida = error.stdout ?? "";
}

let resultado;
try {
  resultado = JSON.parse(salida);
} catch {
  console.error("Biome no devolvió un resultado válido. ¿Corriste npm install?");
  process.exit(2);
}

const esStubNext = (d) =>
  d.category === "lint/correctness/noUndeclaredDependencies" && /Dependency next\b/.test(d.message);

const diagnosticos = resultado.diagnostics.filter((d) => !esStubNext(d));
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
