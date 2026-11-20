#!/usr/bin/env node
/* ==========================================================================
 * GUARDAR DIFF DE UN COMMIT
 *
 * Genera diff/[DDMMYY-HHmm]-[nombre-del-commit].diff con los cambios de
 * src/features/pricing y src/features/embarques de un commit (por defecto HEAD), listo para aplicarse
 * en el proyecto real con scripts/aplicar-diff.mjs (ver ese archivo).
 *
 * - Solo incluye RUTAS_CODIGO (los stubs nunca salen del mirror). De src/shared solo salen
 *   async-combobox-input.tsx y data-table-pagination.tsx, código real del proyecto.
 * - Diff de TEXTO con todas las líneas en LF: no depende de los finales de
 *   línea. aplicar-diff.mjs lo adapta a CRLF o LF según cada archivo destino.
 * - Fecha/hora: la del autor del commit, en hora de Guatemala.
 *
 * Uso:
 *   node scripts/guardar-diff.mjs            # diff de HEAD
 *   node scripts/guardar-diff.mjs <commit>   # diff de otro commit
 *   node scripts/guardar-diff.mjs --amend    # además lo agrega al commit HEAD
 * ========================================================================== */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RUTAS_CODIGO = [
  "src/features/pricing",
  "src/features/embarques",
  "src/shared/components/form/fields/async-combobox-input.tsx",
  "src/shared/components/data-table/data-table-pagination.tsx",
];
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

/* ---------- Diff de texto, normalizado a LF ---------- */
// Antes se usaba --binary: exigía que el archivo destino fuera idéntico byte
// por byte (hash) y fallaba ante cualquier diferencia de CRLF/LF.
const diff = execFileSync(
  "git",
  [
    "diff",
    "--no-color",
    "--no-ext-diff",
    "--text",
    // Sin renombres: un archivo movido sale como borrado + nuevo. Con renombres,
    // git empareja archivos vacíos entre sí (p. ej. un .gitkeep con un .tsx
    // vacío) y el diff exige archivos que el proyecto real no tiene.
    "--no-renames",
    `${commit}^`,
    commit,
    "--",
    ...RUTAS_CODIGO,
    // Los .gitkeep solo existen en el espejo (marcan carpetas vacías).
    ":(exclude,glob)**/.gitkeep",
  ],
  { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
).replace(/\r\n/g, "\n");

if (!diff.trim()) {
  console.log(`El commit no cambia nada en ${RUTAS_CODIGO.join(", ")}; no se genera diff.`);
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
