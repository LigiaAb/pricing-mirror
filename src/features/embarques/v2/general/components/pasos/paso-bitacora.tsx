"use client";

import { Search } from "lucide-react";
import type { ChangeEvent } from "react";
import * as React from "react";
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
import { EncabezadoPaso } from "../../../shared/components/utils";
import type { EmbarqueMaqueta, RegistroBitacora } from "../../../shared/lib/tipos";
import { bitacoraMaqueta } from "../../lib/datos-maqueta";
import { type PasoEmbarque, TRACKING_PASOS } from "../../lib/pasos";

/** Fila de la tabla: el registro + el paso como texto ("3 · Bodega"). */
type FilaBitacora = RegistroBitacora & { pasoTexto: string };

/** Columnas de la tabla (encabezados + celda vacía de "sin registros"). */
const TOTAL_COLUMNAS = 5;

function aFila(registro: RegistroBitacora): FilaBitacora {
  const corto = TRACKING_PASOS.find((paso) => paso.id === registro.paso)?.corto;
  return { ...registro, pasoTexto: corto ? `${registro.paso} · ${corto}` : "—" };
}

/** Busca en fecha, usuario, acción, detalle y paso (sin distinguir mayúsculas). */
function coincide(fila: FilaBitacora, busqueda: string) {
  return [fila.fecha, fila.usuario, fila.accion, fila.detalle, fila.pasoTexto].some((texto) =>
    texto.toLowerCase().includes(busqueda),
  );
}

/**
 * Bitácora del embarque: historial de solo consulta (quién, qué y cuándo).
 * MAQUETA: datos de `bitacoraMaqueta` hasta que exista la API (#124).
 * Mismo formato que la tab Archivos: encabezado con título, conteo y búsqueda,
 * y `Table` simple sin paginación.
 */
export function PasoBitacora({
  paso,
  embarque,
}: {
  paso: PasoEmbarque;
  embarque: EmbarqueMaqueta;
}) {
  const [busqueda, setBusqueda] = React.useState("");
  const filas = React.useMemo(() => bitacoraMaqueta(embarque).map(aFila), [embarque]);
  const texto = busqueda.trim().toLowerCase();
  const visibles = texto ? filas.filter((fila) => coincide(fila, texto)) : filas;

  return (
    <div className="space-y-4">
      <EncabezadoPaso titulo={paso.label} descripcion={paso.descripcion} />

      <section className="overflow-hidden rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h3 className="font-semibold">Bitácora del embarque</h3>
            <p className="text-xs text-muted-foreground">
              {texto
                ? `${visibles.length} de ${filas.length} registros`
                : `${filas.length} ${filas.length === 1 ? "registro" : "registros"}`}{" "}
              · del más reciente al más antiguo
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
                placeholder="Buscar en la bitácora…"
                aria-label="Buscar en la bitácora"
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
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Paso</TableHead>
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
                      ? "Ningún registro coincide con la búsqueda."
                      : "Este embarque aún no tiene registros."}
                  </TableCell>
                </TableRow>
              ) : (
                visibles.map((fila) => (
                  <TableRow key={fila.id} className="hover:bg-muted">
                    <TableCell className="text-nowrap">{fila.fecha}</TableCell>
                    <TableCell>{fila.usuario}</TableCell>
                    <TableCell className="font-medium">{fila.accion}</TableCell>
                    <TableCell>{fila.detalle}</TableCell>
                    <TableCell className="text-nowrap">{fila.pasoTexto}</TableCell>
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
