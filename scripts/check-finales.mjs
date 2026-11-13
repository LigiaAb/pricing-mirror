#!/usr/bin/env node
/* ==========================================================================
 * CHECK DE FINALES DE LÍNEA
 *
 * Falla si algún archivo modificado (en el área de trabajo o staged, contra
 * HEAD) cambió su final de línea (CRLF <-> LF), o si un archivo nuevo no está
 * en LF. Evita convertir archivos sin querer al editarlos.
 *
 * Uso: node scripts/check-finales.mjs   (también corre en check:nuevos)
 * ========================================================================== */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const git = (...a) =>
  execFileSync("git", a, { encoding: "buffer", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

function tipo(buffer) {
  const texto = buffer.toString("latin1");
  const crlf = (texto.match(/\r\n/g) ?? []).length;
  const lf = (texto.match(/\n/g) ?? []).length - crlf;
  if (crlf === 0 && lf === 0) return "SIN-SALTOS";
  if (crlf && lf) return crlf > lf ? "CRLF (mezclado)" : "LF (mezclado)";
  return crlf ? "CRLF" : "LF";
}
const base = (t) => t.replace(" (mezclado)", "");

const cambiados = git("diff", "HEAD", "--name-only", "--diff-filter=AM", "-z")
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const nuevos = git("ls-files", "--others", "--exclude-standard", "-z")
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const problemas = [];
for (const ruta of [...new Set([...cambiados, ...nuevos])]) {
  if (!existsSync(ruta) || /\.(diff|png|jpg|ico|woff2?)$/.test(ruta)) continue;
  const ahora = tipo(readFileSync(ruta));
  let antes = null;
  try {
    antes = tipo(git("show", `HEAD:${ruta}`));
  } catch {
    // no existe en HEAD: archivo nuevo
  }
  if (antes === null) {
    if (base(ahora) === "CRLF") problemas.push(`${ruta}: archivo nuevo en ${ahora} (debe ser LF)`);
  } else if (antes !== "SIN-SALTOS" && ahora !== "SIN-SALTOS" && base(antes) !== base(ahora)) {
    problemas.push(`${ruta}: era ${antes} y ahora es ${ahora}`);
  }
}

if (problemas.length) {
  console.error("Finales de línea cambiados (conservar el que tenía el archivo):");
  for (const p of problemas) console.error(`  ${p}`);
  process.exit(1);
}
console.log("Finales de línea: OK");
