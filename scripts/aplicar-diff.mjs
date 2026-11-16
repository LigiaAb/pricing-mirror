#!/usr/bin/env node
/* ==========================================================================
 * APLICAR DIFF EN EL PROYECTO REAL (sin pelear con CRLF / LF)
 *
 * Los diff de diff/ vienen en LF. Este script, por cada archivo del diff,
 * mira qué final de línea tiene ESE archivo en tu proyecto y adapta el diff
 * a ese final antes de llamar a `git apply`. Así no importa si el archivo
 * está en CRLF o en LF: el resultado conserva el final que ya tenía.
 *
 * - Archivos nuevos: se crean en LF.
 * - Primero corre `git apply --check`: si algo no aplica, NO toca nada y dice
 *   qué archivo falló.
 * - Diffs viejos en formato binario ("GIT binary patch") se pasan tal cual.
 * - Si un archivo no aplica, dice si es porque YA ESTÁ APLICADO (el diff aplica
 *   al revés) o porque YA ES IGUAL AL ESPEJO (ej. se copió la carpeta); si todo
 *   el diff está en ese caso, no hay nada que hacer y termina sin error.
 *
 * Uso (desde la raíz del proyecto real):
 *   node <ruta-al-espejo>/scripts/aplicar-diff.mjs <ruta-al-espejo>/diff/<archivo>.diff
 *   node ... --check    # solo verifica, no aplica
 * ========================================================================== */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const soloCheck = args.includes("--check");
const rutaDiff = args.find((a) => !a.startsWith("--"));

if (!rutaDiff) {
  console.error("Uso: node aplicar-diff.mjs <archivo.diff> [--check]");
  process.exit(1);
}

if (!existsSync(rutaDiff)) {
  console.error(`No existe el archivo: ${rutaDiff}`);
  console.error("¿Ya se hizo git pull del espejo en la rama donde se generó el diff?");
  process.exit(1);
}

const original = readFileSync(rutaDiff, "utf8").replace(/\r\n/g, "\n");

/** Raíz del espejo: el diff vive en <espejo>/diff/. */
const raizEspejo = resolve(dirname(rutaDiff), "..");

/* ---------- Separar el diff por archivo ---------- */
const secciones = original.split(/^(?=diff --git )/m).filter((s) => s.trim());

/** Final de línea del archivo en el proyecto (nuevo = LF). */
function finalDe(ruta) {
  if (!existsSync(ruta)) return "LF";
  const texto = readFileSync(ruta, "latin1");
  const crlf = (texto.match(/\r\n/g) ?? []).length;
  const lf = (texto.match(/\n/g) ?? []).length - crlf;
  if (crlf && lf) return "MEZCLADO";
  return crlf ? "CRLF" : "LF";
}

function rutaDestino(seccion) {
  const menos = seccion.match(/^--- (?:a\/)?(.+)$/m)?.[1];
  const mas = seccion.match(/^\+\+\+ (?:b\/)?(.+)$/m)?.[1];
  if (menos && menos !== "/dev/null") return menos;
  if (mas && mas !== "/dev/null") return mas;
  return seccion.match(/^diff --git a\/(\S+)/)?.[1] ?? "";
}

/** Agrega \r solo a las líneas de contenido de los hunks. */
function aCrlf(seccion) {
  let enHunk = false;
  return seccion
    .split("\n")
    .map((linea) => {
      if (linea.startsWith("@@")) enHunk = true;
      else if (enHunk && /^[ +-]/.test(linea)) return `${linea}\r`;
      return linea;
    })
    .join("\n");
}

/** Contenido sin CR (para comparar sin importar CRLF/LF). */
function sinCr(ruta) {
  return readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
}

/** Por qué no aplica un archivo: ya aplicado, ya igual al espejo o distinto. */
function estadoSinAplicar(ruta, variantes) {
  if (variantes.some((v) => aplica(v, true))) return "YA APLICADO";
  const enEspejo = join(raizEspejo, ruta);
  if (existsSync(ruta) && existsSync(enEspejo) && sinCr(ruta) === sinCr(enEspejo)) {
    return "IGUAL AL ESPEJO";
  }
  return "NO APLICA";
}

const dir = mkdtempSync(join(tmpdir(), "aplicar-diff-"));
const temporal = join(dir, "adaptado.diff");

/** `git apply --check` de un texto de diff; true si aplica (`alReves`: si ya está aplicado). */
function aplica(texto, alReves = false) {
  writeFileSync(temporal, texto);
  try {
    const extra = alReves ? ["--reverse"] : [];
    execFileSync("git", ["apply", "--check", ...extra, "--whitespace=nowarn", temporal], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/* ---------- Elegir, por archivo, la variante que aplica ----------
 * Primero la del final de línea del archivo; si no, la otra. La segunda
 * existe porque con core.autocrlf=true (Windows) git convierte al leer. */
const resumen = [];
const fallidos = [];
const yaAplicados = [];
const finales = new Map(); // ruta -> final original ("LF" | "CRLF" | "MEZCLADO")
const partes = [];

try {
  for (const seccion of secciones) {
    const ruta = rutaDestino(seccion);
    if (seccion.includes("GIT binary patch")) {
      resumen.push(`  ${ruta}  (binario, sin adaptar)`);
      partes.push(seccion);
      continue;
    }
    const final = finalDe(ruta);
    finales.set(ruta, final);
    const variantes = final === "CRLF" ? [aCrlf(seccion), seccion] : [seccion, aCrlf(seccion)];
    const elegida = variantes.find((v) => aplica(v));
    let motivo = "";
    if (!elegida) {
      const estado = estadoSinAplicar(ruta, variantes);
      motivo = `  <-- ${estado}`;
      if (estado === "NO APLICA") fallidos.push(ruta);
      else yaAplicados.push(ruta);
    }
    resumen.push(`  ${ruta}  (${existsSync(ruta) ? final : "nuevo, LF"})${motivo}`);
    if (elegida) partes.push(elegida);
  }

  console.log(`Archivos en el diff:\n${resumen.join("\n")}`);

  if (!fallidos.length && yaAplicados.length === secciones.length) {
    console.log(
      "\nNada que hacer: este diff ya está aplicado en el proyecto (o los archivos ya son " +
        "iguales al espejo). No se modificó nada.",
    );
  } else if (fallidos.length) {
    console.error(
      "\nNo aplica en los archivos marcados: son distintos a lo que espera el diff " +
        "(otro cambio en esas líneas, no por CRLF/LF). No se modificó nada.",
    );
    if (yaAplicados.length) {
      console.error("Los marcados YA APLICADO / IGUAL AL ESPEJO no necesitan este diff.");
    }
    process.exitCode = 1;
  } else if (yaAplicados.length) {
    console.error(
      "\nParte del diff ya está aplicada y parte no: revisar antes de seguir. No se modificó nada.",
    );
    process.exitCode = 1;
  } else if (!aplica(partes.join(""))) {
    console.error("\nEl diff completo no aplica. No se modificó nada.");
    process.exitCode = 1;
  } else if (soloCheck) {
    console.log("OK: el diff aplica (no se cambió nada, --check).");
  } else {
    execFileSync("git", ["apply", "--whitespace=nowarn", temporal], { stdio: "inherit" });

    // Si git cambió el final de línea (autocrlf), regresarlo al original.
    for (const [ruta, final] of finales) {
      if (!existsSync(ruta) || final === "MEZCLADO") continue;
      const texto = readFileSync(ruta, "utf8");
      const lf = texto.replace(/\r\n/g, "\n");
      const correcto = final === "CRLF" ? lf.replace(/\n/g, "\r\n") : lf;
      if (correcto !== texto) writeFileSync(ruta, correcto);
    }
    console.log("OK: diff aplicado conservando el final de línea de cada archivo.");
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
