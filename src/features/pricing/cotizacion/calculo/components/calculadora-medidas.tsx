"use client";

import { Plus, Trash2 } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

import {
  calcularTotalesMedidas,
  crearDimension,
  type DimensionCalculo,
  type TotalesMedidas,
  type Unidad,
} from "../lib/calculadora-medidas";

import { obtenerEtiquetasCalculadora } from "../lib/etiquetas-calculadora";

import type { Id } from "../lib/tipos";
import { numero } from "../lib/utils";
import { UNIDAD_DEFAULT } from "../lib/constantes";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";

type FormMedida = {
  cantidad: string;

  largo: string;
  ancho: string;
  alto: string;

  pesoUnitario: string;

  unidadMedida: Unidad | null;

  unidadPeso: Unidad | null;
};

type Props = {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  dimensiones: DimensionCalculo[];

  /**
   * Totales que ya estaban aplicados anteriormente.
   *
   * Son importantes porque la calculadora permite
   * ingresar peso/volumétrico directamente sin filas.
   */
  pesoInicial?: number | string | null;

  volumenInicial?: number | string | null;

  codTipoTransporte?: Id | null | undefined;

  lectura?: boolean;

  onAplicar: (data: {
    dimensiones: DimensionCalculo[];

    totales: TotalesMedidas;
  }) => void;
};

/* ==========================================================================
 * HELPERS
 * ========================================================================== */

function crearFormularioInicial({
  unidadesMedida,
  unidadesPeso,
}: {
  unidadesMedida: Unidad[];

  unidadesPeso: Unidad[];
}): FormMedida {
  return {
    cantidad: "1",

    largo: "",
    ancho: "",
    alto: "",

    pesoUnitario: "",

    /*
     * Defaults actuales del componente legado.
     *
     * 165 = unidad de volumen por defecto
     * 162 = unidad de peso por defecto
     */
    unidadMedida: unidadesMedida.find((item) => Number(item.value) === UNIDAD_DEFAULT.MEDIDA) ?? null,

    unidadPeso: unidadesPeso.find((item) => Number(item.value) === UNIDAD_DEFAULT.PESO) ?? null,
  };
}

function mostrarNumero(value: unknown) {
  const result = numero(value);

  /*
   * El componente anterior muestra estos
   * resultados con redondeo a 0 decimales.
   */
  return result.toFixed(0);
}

/* ==========================================================================
 * COMPONENTE
 * ========================================================================== */

export function CalculadoraMedidas({
  open,
  onOpenChange,

  dimensiones,

  pesoInicial = 0,
  volumenInicial = 0,

  codTipoTransporte,

  lectura = false,

  onAplicar,
}: Props) {
  const { unidadesMedida, unidadesPeso } = useCatalogosCotizacion().calculo;

  /* ==========================================================================
   * ESTADO
   * ========================================================================== */

  const etiquetas = obtenerEtiquetasCalculadora(codTipoTransporte);

  const [items, setItems] = React.useState<DimensionCalculo[]>([]);

  const [form, setForm] = React.useState<FormMedida>(() =>
    crearFormularioInicial({
      unidadesMedida,
      unidadesPeso,
    }),
  );

  /*
   * Entradas directas.
   *
   * Permiten calcular CW aunque no existan
   * filas de dimensiones.
   */
  const [pesoDirecto, setPesoDirecto] = React.useState("");

  const [volumenDirecto, setVolumenDirecto] = React.useState("");

  /*
   * Inicializar únicamente cuando el diálogo
   * pasa de cerrado -> abierto.
   *
   * El legado utiliza wasOpenRef con la misma
   * intención.
   */
  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;

      return;
    }

    if (wasOpenRef.current) {
      return;
    }

    wasOpenRef.current = true;

    setItems(dimensiones ?? []);

    setPesoDirecto(numero(pesoInicial) > 0 ? String(pesoInicial) : "");

    setVolumenDirecto(numero(volumenInicial) > 0 ? String(volumenInicial) : "");

    setForm(
      crearFormularioInicial({
        unidadesMedida,
        unidadesPeso,
      }),
    );
  }, [open, dimensiones, pesoInicial, volumenInicial, unidadesMedida, unidadesPeso]);

  /* ==========================================================================
   * TOTALES DE FILAS
   * ========================================================================== */

  const totalesFilas = React.useMemo(
    () => calcularTotalesMedidas(items, codTipoTransporte),
    [items, codTipoTransporte],
  );

  /*
   * El legado da prioridad al total calculado
   * desde filas.
   *
   * Solo si no existe (> 0) usa el total
   * escrito directamente.
   */
  const pesoTotal = totalesFilas.pesoTotal > 0 ? totalesFilas.pesoTotal : numero(pesoDirecto);

  const volumenTotal =
    totalesFilas.volumenTotal > 0 ? totalesFilas.volumenTotal : numero(volumenDirecto);

  const cantidadTotal = totalesFilas.cantidadTotal;

  const valorCw = Math.max(pesoTotal, volumenTotal);

  const tipoCw: TotalesMedidas["tipo"] =
    valorCw <= 0
      ? "AUN NO SE HA CALCULADO"
      : pesoTotal >= volumenTotal
        ? "KILOGRAMOS"
        : "KILOS VOLUMETRICOS";

  const totalesFinales = React.useMemo<TotalesMedidas>(
    () => ({
      pesoTotal,

      volumenTotal,

      cantidadTotal,

      valorCw,

      tipo: tipoCw,
    }),
    [pesoTotal, volumenTotal, cantidadTotal, valorCw, tipoCw],
  );

  /* ==========================================================================
   * VALIDACIÓN DE NUEVA FILA
   * ========================================================================== */

  const medidas = [form.largo, form.ancho, form.alto];

  const medidasLlenas = medidas.filter(Boolean).length;

  const medidasCompletas = medidasLlenas === 3;

  const medidasParciales = medidasLlenas > 0 && !medidasCompletas;

  const pesoCompleto = Boolean(form.pesoUnitario);

  const pesoParcial = pesoCompleto && !form.unidadPeso;

  const medidasValidas = medidasCompletas && Boolean(form.unidadMedida);

  const pesoValido = pesoCompleto && Boolean(form.unidadPeso);

  /*
   * Para agregar UNA FILA:
   *
   * - no puede haber dimensiones parciales
   * - no puede haber peso sin unidad
   * - debe existir volumen válido o peso válido
   */
  const puedeAgregarFila =
    !lectura && !medidasParciales && !pesoParcial && (medidasValidas || pesoValido);

  /* ==========================================================================
   * AGREGAR FILA
   * ========================================================================== */

  const agregarFila = React.useCallback(() => {
    if (!puedeAgregarFila) {
      return;
    }

    const cantidad = numero(form.cantidad) || 1;

    /*
     * Evita colisionar con IDs recuperados de BD.
     * El ID solo tiene uso local en la tabla.
     */
    const id =
      items.reduce((max, item) => {
        const actual = Number(item.id);

        return Number.isFinite(actual) ? Math.max(max, actual) : max;
      }, 0) + 1;

    const dimension = crearDimension({
      id,

      cantidad,

      largo: medidasValidas ? numero(form.largo) : 0,

      ancho: medidasValidas ? numero(form.ancho) : 0,

      alto: medidasValidas ? numero(form.alto) : 0,

      pesoUnitario: pesoValido ? numero(form.pesoUnitario) : 0,

      unidadMedida: medidasValidas ? form.unidadMedida : null,

      unidadPeso: pesoValido ? form.unidadPeso : null,

      codTipoTransporte: codTipoTransporte ?? null,
    });

    setItems((prev) => [...prev, dimension]);

    /*
     * Después de agregar:
     *
     * limpia valores,
     * conserva unidades.
     */
    setForm((prev) => ({
      ...prev,

      cantidad: "1",

      largo: "",
      ancho: "",
      alto: "",

      pesoUnitario: "",
    }));
  }, [puedeAgregarFila, form, items, medidasValidas, pesoValido, codTipoTransporte]);

  /* ==========================================================================
   * ELIMINAR FILA
   * ========================================================================== */

  const eliminarFila = React.useCallback(
    (id: Id) => {
      if (lectura) {
        return;
      }

      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    },
    [lectura],
  );

  /* ==========================================================================
   * LIMPIAR TODO
   * ========================================================================== */

  const limpiar = React.useCallback(() => {
    if (lectura) {
      return;
    }

    setItems([]);

    setPesoDirecto("");

    setVolumenDirecto("");

    setForm(
      crearFormularioInicial({
        unidadesMedida,
        unidadesPeso,
      }),
    );
  }, [lectura, unidadesMedida, unidadesPeso]);

  /* ==========================================================================
   * APLICAR RESULTADO
   * ========================================================================== */

  /*
   * En el legado el botón final está habilitado si:
   *
   * - existen filas
   *      O
   * - existe peso/volumen directo
   */
  const tieneTotalDirecto = numero(pesoDirecto) > 0 || numero(volumenDirecto) > 0;

  const puedeAplicar = items.length > 0 || tieneTotalDirecto;

  const aplicar = React.useCallback(() => {
    if (!puedeAplicar) {
      return;
    }

    onAplicar({
      dimensiones: items,

      totales: totalesFinales,
    });

    onOpenChange(false);
  }, [puedeAplicar, items, totalesFinales, onAplicar, onOpenChange]);

  /* ==========================================================================
   * RENDER
   * ========================================================================== */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Calculadora de volumen y peso</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* ================================================================
              INGRESO DE UNA FILA
          ================================================================= */}

          {!lectura ? (
            <div className="rounded-lg border p-4">
              <div className="grid gap-5 md:grid-cols-2">
                {/* VOLUMEN */}

                <div className="space-y-3">
                  <p className="font-medium">Volumen</p>

                  <div className="space-y-1">
                    <label htmlFor="unidad-medida" className="text-sm">
                      Unidad de medida
                    </label>

                    <select
                      id="unidad-medida"
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      value={form.unidadMedida?.value ?? ""}
                      onChange={(event) => {
                        const unidad =
                          unidadesMedida.find(
                            (item) => String(item.value) === event.target.value,
                          ) ?? null;

                        setForm((prev) => ({
                          ...prev,

                          unidadMedida: unidad,
                        }));
                      }}
                    >
                      <option value="">Seleccione</option>

                      {unidadesMedida.map((unidad) => (
                        <option key={String(unidad.value)} value={String(unidad.value)}>
                          {unidad.tipo_desc ?? unidad.label ?? unidad.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="largo" className="text-xs text-muted-foreground">
                        Largo
                      </label>

                      <Input
                        id="largo"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.largo}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,

                            largo: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="ancho" className="text-xs text-muted-foreground">
                        Ancho
                      </label>

                      <Input
                        id="ancho"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.ancho}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,

                            ancho: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="alto" className="text-xs text-muted-foreground">
                        Alto
                      </label>

                      <Input
                        id="alto"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.alto}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,

                            alto: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {medidasParciales ? (
                    <p className="text-xs text-destructive">Debe ingresar largo, ancho y alto.</p>
                  ) : null}
                </div>

                {/* PESO */}

                <div className="space-y-3">
                  <p className="font-medium">Peso</p>

                  <div className="space-y-1">
                    <label htmlFor="unidad-peso" className="text-sm">
                      Unidad de peso
                    </label>

                    <select
                      id="unidad-peso"
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      value={form.unidadPeso?.value ?? ""}
                      onChange={(event) => {
                        const unidad =
                          unidadesPeso.find((item) => String(item.value) === event.target.value) ??
                          null;

                        setForm((prev) => ({
                          ...prev,

                          unidadPeso: unidad,
                        }));
                      }}
                    >
                      <option value="">Seleccione</option>

                      {unidadesPeso.map((unidad) => (
                        <option key={String(unidad.value)} value={String(unidad.value)}>
                          {unidad.tipo_desc ?? unidad.label ?? unidad.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="peso-unitario" className="text-xs text-muted-foreground">
                      Peso unitario
                    </label>

                    <Input
                      id="peso-unitario"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.pesoUnitario}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,

                          pesoUnitario: event.target.value,
                        }))
                      }
                    />
                  </div>

                  {pesoParcial ? (
                    <p className="text-xs text-destructive">Debe seleccionar una unidad de peso.</p>
                  ) : null}
                </div>
              </div>

              {/* CANTIDAD / AGREGAR */}

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-32 space-y-1">
                  <label htmlFor="cantidad" className="text-sm">
                    Cantidad
                  </label>

                  <Input
                    id="cantidad"
                    type="number"
                    min={1}
                    step={1}
                    value={form.cantidad}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,

                        cantidad: event.target.value,
                      }))
                    }
                  />
                </div>

                <Button type="button" disabled={!puedeAgregarFila} onClick={agregarFila}>
                  <Plus className="size-4" />
                  Agregar a cálculo
                </Button>
              </div>
            </div>
          ) : null}

          {/* ================================================================
              FILAS
          ================================================================= */}

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cantidad</TableHead>

                  <TableHead>Dimensiones</TableHead>

                  <TableHead>Unidad</TableHead>

                  <TableHead className="text-right">{etiquetas.volumen}</TableHead>

                  <TableHead className="text-right">{etiquetas.peso}</TableHead>

                  {!lectura ? <TableHead className="w-12" /> : null}
                </TableRow>
              </TableHeader>

              <TableBody>
                {!items.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={lectura ? 5 : 6}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No hay dimensiones ingresadas.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={String(item.id)}>
                      <TableCell>{item.cantidad}</TableCell>

                      <TableCell className="font-mono text-xs">
                        {item.formulaVolumen || "—"}
                      </TableCell>

                      <TableCell>
                        {item.unidadMedida?.tipo_desc ?? item.unidadMedida?.label ?? "—"}
                      </TableCell>

                      <TableCell className="text-right font-mono">
                        {item.volumenTotalKg > 0 ? mostrarNumero(item.volumenTotalKg) : "—"}
                      </TableCell>

                      <TableCell className="text-right font-mono">
                        {item.pesoTotalKg > 0 ? mostrarNumero(item.pesoTotalKg) : "—"}
                      </TableCell>

                      {!lectura ? (
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => eliminarFila(item.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ================================================================
              TOTALES
          ================================================================= */}

          <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-4">
            {/* CANTIDAD */}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cantidad total</p>

              <p className="text-lg font-semibold tabular-nums">{cantidadTotal}</p>
            </div>

            {/* VOLUMÉTRICO */}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{etiquetas.volumen}</p>

              {totalesFilas.volumenTotal > 0 ? (
                <p className="text-lg font-semibold tabular-nums">
                  {mostrarNumero(totalesFilas.volumenTotal)}
                </p>
              ) : (
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={lectura}
                  value={volumenDirecto}
                  onChange={(event) => setVolumenDirecto(event.target.value)}
                />
              )}
            </div>

            {/* PESO */}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{etiquetas.peso}</p>

              {totalesFilas.pesoTotal > 0 ? (
                <p className="text-lg font-semibold tabular-nums">
                  {mostrarNumero(totalesFilas.pesoTotal)}
                </p>
              ) : (
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={lectura}
                  value={pesoDirecto}
                  onChange={(event) => setPesoDirecto(event.target.value)}
                />
              )}
            </div>

            {/* CW */}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{etiquetas.cw}</p>

              <p className="text-xl font-semibold tabular-nums">{mostrarNumero(valorCw)}</p>

              <p className="text-xs text-muted-foreground">
                {tipoCw === "KILOS VOLUMETRICOS"
                  ? etiquetas.tipoVolumen
                  : tipoCw === "KILOGRAMOS"
                    ? etiquetas.tipoPeso
                    : tipoCw}
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================
            ACCIONES
        ================================================================= */}

        <DialogFooter className="gap-2">
          {!lectura ? (
            <Button
              type="button"
              variant="outline"
              disabled={!items.length && !tieneTotalDirecto}
              onClick={limpiar}
            >
              Limpiar
            </Button>
          ) : null}

          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>

          {!lectura ? (
            <Button type="button" disabled={!puedeAplicar} onClick={aplicar}>
              Aplicar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
