#!/usr/bin/env node
/* ==========================================================================
 * GUARDAR DIFF DE UN COMMIT
 *
 * Genera diff/[DDMMYY-HHmm]-[nombre-del-commit].diff con los cambios de
 * src/features/pricing de un commit (por defecto HEAD), listo para aplicarse
 * en el proyecto real con:  git apply diff/<archivo>.diff
 *
 * - Solo incluye src/features/pricing (los stubs nunca salen del mirror).
 * - Formato binario (--binary --full-index): conserva CRLF/LF byte por byte.
 * - Fecha/hora: la del autor del commit, en hora de Guatemala.
 *
 * Uso:
 *   node scripts/guardar-diff.mjs            # diff de HEAD
 *   node scripts/guardar-diff.mjs <commit>   # diff de otro commit
 *   node scripts/guardar-diff.mjs --amend    # además lo agrega al commit HEAD
 * ========================================================================== */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RUTA_CODIGO = "src/features/pricing";
const CARPETA_DIFF = "diff";
const ZONA_HORARIA = "America/Guatemala";

const args = process.argv.slice(2);
const amend = args.includes("--amend");
const commit = args.find((arg) => !arg.startsWith("--")) ?? "HEAD";

const git = (...params) => execFileSync("git", params, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

if (amend && git("rev-parse", commit).trim() !== git("rev-parse", "HEAD").trim()) {
  console.error("--amend solo se puede usar con HEAD.");
  process.exit(1);
}

/* ---------- Nombre: DDMMYY-HHmm-nombre-del-commit ---------- */
const [fechaIso, asunto] = git("log", "-1", "--format=%aI%n%s", commit).trim().split("\n");

const partes = Object.fromEntries(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(new Date(fechaIso))
    .map((parte) => [parte.type, parte.value]),
);
const fecha = `${partes.day}${partes.month}${partes.year}-${partes.hour}${partes.minute}`;

const slug = asunto
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 60)
  .replace(/-+$/, "");

const archivo = join(CARPETA_DIFF, `${fecha}-${slug || "cambio"}.diff`);

/* ---------- Diff binario (conserva finales de línea) ---------- */
// .gitattributes tiene `* -text`; marcar todo como binary obliga a --binary a
// codificar el contenido exacto, sin depender de cómo viaje el archivo.
const dirTemporal = mkdtempSync(join(tmpdir(), "guardar-diff-"));
const atributos = join(dirTemporal, "attributes");
writeFileSync(atributos, "* binary\n");

let diff;
try {
  diff = execFileSync(
    "git",
    ["-c", `core.attributesFile=${atributos}`, "diff", "--binary", "--full-index", `${commit}^`, commit, "--", RUTA_CODIGO],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
} finally {
  rmSync(dirTemporal, { recursive: true, force: true });
}

if (!diff.trim()) {
  console.log(`El commit no cambia nada en ${RUTA_CODIGO}; no se genera diff.`);
  process.exit(0);
}

mkdirSync(CARPETA_DIFF, { recursive: true });
writeFileSync(archivo, diff);
console.log(`Diff guardado: ${archivo}`);

if (amend) {
  git("add", archivo);
  git("commit", "--amend", "--no-edit", "--no-verify");
  console.log("Agregado al commit HEAD.");
}
