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
  DialogTrigger,
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
  combinarTotales,
  crearDimension,
  type DimensionCalculo,
  type Id,
  numero,
  type TotalesMedidas,
  type Unidad,
} from "../lib/calculos";
import { UNIDAD_DEFAULT } from "../lib/constantes";
import { obtenerEtiquetasCalculadora } from "../lib/etiquetas";
import { useUnidadesEmbarque } from "../hooks/use-unidades-embarque";

type FormMedida = {
  cantidad: string;

  largo: string;
  ancho: string;
  alto: string;

  pesoUnitario: string;

  unidadMedida: Unidad | null;

  unidadPeso: Unidad | null;
};

export type CalculadoraMedidasProps = {
  /*
   * Apertura. Dos formas de usarla:
   *
   * - `trigger`: el botón que la abre (texto/ícono a gusto de cada pantalla).
   *   La calculadora maneja su propio estado abierto/cerrado.
   * - `open` + `onOpenChange`: la pantalla controla cuándo se abre.
   */
  trigger?: React.ReactNode;

  open?: boolean | undefined;

  onOpenChange?: ((open: boolean) => void) | undefined;

  /** Filas ya calculadas (por ejemplo, las guardadas). Por defecto ninguna. */
  dimensiones?: DimensionCalculo[] | undefined;

  /**
   * Totales que ya estaban aplicados anteriormente.
   *
   * Son importantes porque la calculadora permite
   * ingresar peso/volumétrico directamente sin filas.
   */
  pesoInicial?: number | string | null;

  volumenInicial?: number | string | null;

  codTipoTransporte?: Id | null | undefined;

  lectura?: boolean | undefined;

  /** Se llama al presionar "Aplicar"; cada módulo decide dónde guardar el resultado. */
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
    unidadMedida:
      unidadesMedida.find((item) => Number(item.value) === UNIDAD_DEFAULT.MEDIDA) ?? null,

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

const SIN_DIMENSIONES: DimensionCalculo[] = [];

/**
 * Calculadora de embarques: volumen, peso, peso volumétrico y CW por tipo de
 * transporte. No depende de cotizaciones: lee sus unidades sola y devuelve el
 * resultado en `onAplicar`.
 */
export function CalculadoraMedidas({
  trigger,

  open: openControlado,
  onOpenChange: onOpenChangeControlado,

  dimensiones = SIN_DIMENSIONES,

  pesoInicial = 0,
  volumenInicial = 0,

  codTipoTransporte,

  lectura = false,

  onAplicar,
}: CalculadoraMedidasProps) {
  const { unidadesMedida, unidadesPeso } = useUnidadesEmbarque();

  /* ==========================================================================
   * APERTURA (controlada o con trigger)
   * ========================================================================== */

  const [openInterno, setOpenInterno] = React.useState(false);

  const open = openControlado ?? openInterno;

  const onOpenChange = React.useCallback(
    (siguiente: boolean) => {
      if (openControlado === undefined) {
        setOpenInterno(siguiente);
      }

      onOpenChangeControlado?.(siguiente);
    },
    [openControlado, onOpenChangeControlado],
  );

  /* ==========================================================================
   * ESTADO
   * ========================================================================== */

  /* IDs únicos: permite varias calculadoras en la misma pantalla. */
  const idBase = React.useId();
  const ids = {
    unidadMedida: `${idBase}-unidad-medida`,
    largo: `${idBase}-largo`,
    ancho: `${idBase}-ancho`,
    alto: `${idBase}-alto`,
    unidadPeso: `${idBase}-unidad-peso`,
    pesoUnitario: `${idBase}-peso-unitario`,
    cantidad: `${idBase}-cantidad`,
  };

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

    setItems(dimensiones);

    setPesoDirecto(numero(pesoInicial) > 0 ? String(pesoInicial) : "");

    setVolumenDirecto(numero(volumenInicial) > 0 ? String(volumenInicial) : "");

    setForm(
      crearFormularioInicial({
        unidadesMedida,
        unidadesPeso,
      }),
    );
  }, [open, dimensiones, pesoInicial, volumenInicial, unidadesMedida, unidadesPeso]);

  /*
   * Si las unidades terminan de cargar con el diálogo ya abierto,
   * se asignan las de por defecto (solo si aún no hay ninguna elegida).
   */
  React.useEffect(() => {
    if (!open) {
      return;
    }

    setForm((prev) => {
      if (prev.unidadMedida || prev.unidadPeso) {
        return prev;
      }

      const iniciales = crearFormularioInicial({ unidadesMedida, unidadesPeso });

      if (!iniciales.unidadMedida && !iniciales.unidadPeso) {
        return prev;
      }

      return {
        ...prev,
        unidadMedida: iniciales.unidadMedida,
        unidadPeso: iniciales.unidadPeso,
      };
    });
  }, [open, unidadesMedida, unidadesPeso]);

  /* ==========================================================================
   * TOTALES DE FILAS
   * ========================================================================== */

  const totalesFilas = React.useMemo(
    () => calcularTotalesMedidas(items, codTipoTransporte),
    [items, codTipoTransporte],
  );

  /*
   * Las filas tienen prioridad; si un total de filas es 0
   * se usa el escrito directamente.
   */
  const totalesFinales = React.useMemo(
    () => combinarTotales(totalesFilas, pesoDirecto, volumenDirecto),
    [totalesFilas, pesoDirecto, volumenDirecto],
  );

  const { cantidadTotal, valorCw, tipo: tipoCw } = totalesFinales;

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
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{etiquetas.titulo}</DialogTitle>
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
                    <label htmlFor={ids.unidadMedida} className="text-sm">
                      Unidad de medida
                    </label>

                    <select
                      id={ids.unidadMedida}
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
                      <label htmlFor={ids.largo} className="text-xs text-muted-foreground">
                        Largo
                      </label>

                      <Input
                        id={ids.largo}
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.largo}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setForm((prev) => ({
                            ...prev,

                            largo: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={ids.ancho} className="text-xs text-muted-foreground">
                        Ancho
                      </label>

                      <Input
                        id={ids.ancho}
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.ancho}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setForm((prev) => ({
                            ...prev,

                            ancho: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={ids.alto} className="text-xs text-muted-foreground">
                        Alto
                      </label>

                      <Input
                        id={ids.alto}
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.alto}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
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
                    <label htmlFor={ids.unidadPeso} className="text-sm">
                      Unidad de peso
                    </label>

                    <select
                      id={ids.unidadPeso}
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
                    <label htmlFor={ids.pesoUnitario} className="text-xs text-muted-foreground">
                      Peso unitario
                    </label>

                    <Input
                      id={ids.pesoUnitario}
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.pesoUnitario}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
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
                  <label htmlFor={ids.cantidad} className="text-sm">
                    Cantidad
                  </label>

                  <Input
                    id={ids.cantidad}
                    type="number"
                    min={1}
                    step={1}
                    value={form.cantidad}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
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
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setVolumenDirecto(event.target.value)
                  }
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
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setPesoDirecto(event.target.value)
                  }
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
                    : etiquetas.sinCalculo}
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
