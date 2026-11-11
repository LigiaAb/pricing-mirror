// Corre tsc y muestra SOLO los errores nuevos respecto a la línea base (.tsc-baseline.txt).
// Los errores que ya existían (código previo o stubs con `any`) se ignoran.
//
//   npm run check:nuevos           → compara contra la línea base
//   npm run check:actualizar-base  → guarda el estado actual como nueva línea base
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const BASE = ".tsc-baseline.txt";
const actualizar = process.argv.includes("--actualizar");

let salida = "";
try {
  salida = execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch (error) {
  salida = `${error.stdout ?? ""}${error.stderr ?? ""}`;
}

// Firma de cada error sin número de línea/columna, para que mover código no cuente como error nuevo.
const firmas = salida
  .split(/\r?\n/)
  .filter((linea) => linea.includes("error TS"))
  .map((linea) => linea.replace(/\(\d+,\d+\)/, "").replace(/\\/g, "/").trim());

if (actualizar) {
  writeFileSync(BASE, `${firmas.sort().join("\n")}\n`);
  console.log(`Línea base actualizada: ${firmas.length} errores existentes.`);
  process.exit(0);
}

if (!existsSync(BASE)) {
  console.error(`No existe ${BASE}. Corre: npm run check:actualizar-base`);
  process.exit(2);
}

// Comparación como multiconjunto: si un error ya existía 2 veces y ahora hay 3, el tercero es nuevo.
const restantes = new Map();
for (const firma of readFileSync(BASE, "utf8").split(/\r?\n/).filter(Boolean)) {
  restantes.set(firma, (restantes.get(firma) ?? 0) + 1);
}

const nuevos = [];
for (const firma of firmas) {
  const n = restantes.get(firma) ?? 0;
  if (n > 0) restantes.set(firma, n - 1);
  else nuevos.push(firma);
}

const resueltos = [...restantes.values()].reduce((a, b) => a + b, 0);

console.log(`Errores totales: ${firmas.length} | nuevos: ${nuevos.length} | resueltos: ${resueltos}`);
for (const n of nuevos) console.log(`  NUEVO  ${n}`);

if (nuevos.length) {
  // Mostrar la línea exacta de los nuevos.
  const lineas = salida.split(/\r?\n/).filter((l) => nuevos.some((n) => l.replace(/\(\d+,\d+\)/, "").replace(/\\/g, "/").trim() === n));
  console.log("\nUbicación:");
  for (const l of lineas) console.log(`  ${l.trim()}`);
}

process.exit(nuevos.length ? 1 : 0);
