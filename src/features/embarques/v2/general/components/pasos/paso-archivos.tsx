"use client";

import { Download, Eye, FileText, Route, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { BotonLimpiar } from "../../../shared/components/campos";
import { useOperacion } from "../../../shared/components/operacion-context";
import { EncabezadoPaso } from "../../../shared/components/utils";
import {
  type DefinicionOperacion,
  type PasoEmbarque,
  pasoTrackingDe,
} from "../../../shared/lib/operacion";
import type { ArchivoEmbarque, EmbarqueMaqueta } from "../../../shared/lib/tipos";
import { ARCHIVOS_MAQUETA } from "../../lib/datos-maqueta";

/** Fila de la tabla: el archivo + textos para mostrar y buscar. */
type FilaArchivo = ArchivoEmbarque & {
  /** "OPS 5.3 · <actividad>" o "Tracking". */
  origenTexto: string;
  /** "3 · Bodega". */
  pasoTexto: string;
};

/** Columnas de la tabla (encabezados + celda vacía de "sin archivos"). */
const TOTAL_COLUMNAS = 7;

function aFila(operacion: DefinicionOperacion, archivo: ArchivoEmbarque): FilaArchivo {
  const actividad =
    archivo.origen === "actividad"
      ? operacion.actividades.find((item) => item.id === archivo.actividad)
      : undefined;
  const corto = pasoTrackingDe(operacion, archivo.paso)?.corto ?? "";
  return {
    ...archivo,
    origenTexto:
      archivo.origen === "tracking"
        ? "Tracking"
        : actividad
          ? `${actividad.id} · ${actividad.actividad}`
          : (archivo.actividad ?? "Actividad"),
    pasoTexto: `${archivo.paso} · ${corto}`,
  };
}

/** Busca en archivo, tipo, origen, paso, usuario y fecha (sin distinguir mayúsculas). */
function coincide(fila: FilaArchivo, busqueda: string) {
  return [fila.nombre, fila.tipo, fila.origenTexto, fila.pasoTexto, fila.usuario, fila.fecha].some(
    (texto) => texto.toLowerCase().includes(busqueda),
  );
}

/**
 * Archivos del embarque: solo lista para consulta y descarga.
 * No hay subida general: cada archivo se sube en la actividad que lo pide
 * (campos `archivo`) o en el tracking interactivo.
 * Tabla propia (mismo formato que `VersionesTable` de Cotizaciones): encabezado con título,
 * búsqueda y conteo, y `Table` simple sin paginación.
 */
export function PasoArchivos({
  paso,
  embarque,
}: {
  paso: PasoEmbarque;
  embarque: EmbarqueMaqueta;
}) {
  const operacion = useOperacion();
  const [busqueda, setBusqueda] = React.useState("");
  const filas = React.useMemo(
    () => (ARCHIVOS_MAQUETA[embarque.id] ?? []).map((archivo) => aFila(operacion, archivo)),
    [operacion, embarque.id],
  );
  const texto = busqueda.trim().toLowerCase();
  const visibles = texto ? filas.filter((fila) => coincide(fila, texto)) : filas;

  return (
    <div className="space-y-4">
      <EncabezadoPaso titulo={paso.label} descripcion={paso.descripcion} />

      <section className="overflow-hidden rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h3 className="font-semibold">Archivos del embarque</h3>
            <p className="text-xs text-muted-foreground">
              {texto
                ? `${visibles.length} de ${filas.length} archivos`
                : `${filas.length} ${filas.length === 1 ? "archivo" : "archivos"}`}{" "}
              · se suben en la actividad que los pide o en el tracking
            </p>
          </div>

          {filas.length ? (
            <InputGroup className="w-full sm:w-72">
              <InputGroupAddon>
                <Search className="size-4" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                value={busqueda}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
                placeholder="Buscar archivo…"
                aria-label="Buscar archivo"
              />
              {busqueda ? (
                <InputGroupAddon align="inline-end">
                  <BotonLimpiar onClick={() => setBusqueda("")} />
                </InputGroupAddon>
              ) : null}
            </InputGroup>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Subido en</TableHead>
                <TableHead>Paso</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!visibles.length ? (
                <TableRow>
                  <TableCell
                    colSpan={TOTAL_COLUMNAS}
                    className="h-20 text-center text-muted-foreground"
                  >
                    {filas.length
                      ? "Ningún archivo coincide con la búsqueda."
                      : "Este embarque aún no tiene archivos."}
                  </TableCell>
                </TableRow>
              ) : (
                visibles.map((fila) => (
                  <TableRow key={fila.id} className="hover:bg-muted">
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <FileText
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="break-all">{fila.nombre}</span>
                      </span>
                    </TableCell>

                    <TableCell>{fila.tipo}</TableCell>

                    <TableCell>
                      {fila.origen === "tracking" ? (
                        <span className="flex items-center gap-1">
                          <Route className="size-4 shrink-0 text-primary" aria-hidden="true" />
                          Tracking
                        </span>
                      ) : (
                        fila.origenTexto
                      )}
                    </TableCell>

                    <TableCell className="text-nowrap">{fila.pasoTexto}</TableCell>

                    <TableCell>{fila.usuario}</TableCell>

                    <TableCell className="text-nowrap">{fila.fecha}</TableCell>

                    <TableCell>
                      {/* Maqueta: se habilitan con la API de archivos. */}
                      <div className="flex flex-nowrap justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Ver archivo"
                          aria-label={`Ver ${fila.nombre}`}
                          disabled
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Descargar archivo"
                          aria-label={`Descargar ${fila.nombre}`}
                          disabled
                        >
                          <Download className="size-4 text-primary" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
