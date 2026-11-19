"use client";

import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useNombreTransporte } from "../hooks/use-nombre-transporte";
import { useUnidadesEmbarque } from "../hooks/use-unidades-embarque";
import {
  calcularTotalesMedidas,
  combinarTotales,
  crearDimension,
  type DimensionCalculo,
  esUnidadConocida,
  type Id,
  numero,
  recalcularDimension,
  redondearArriba,
  type TotalesMedidas,
  type Unidad,
} from "../lib/calculos";
import { UNIDAD_DEFAULT } from "../lib/constantes";
import { obtenerEtiquetasCalculadora } from "../lib/etiquetas";

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

  /* Redondeo hacia arriba a entero (#157). */
  return String(redondearArriba(result));
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

  /* Las conversiones deciden por el nombre del transporte, no por su código (#157). */
  const {
    nombre: transporte,
    reconocido: transporteReconocido,
    isLoading: cargandoTransporte,
  } = useNombreTransporte(codTipoTransporte);

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

  const etiquetas = obtenerEtiquetasCalculadora(transporte);

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

  /* Fila cuyo detalle se muestra (doble clic, como el legado) (#159). */
  const [detalleId, setDetalleId] = React.useState<Id | null>(null);

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

      setDetalleId(null);

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

  /* Cada fila con el volumétrico del transporte actual (si cambia, se recalcula). */
  const itemsCalculados = React.useMemo(
    () => items.map((item) => recalcularDimension(item, transporte)),
    [items, transporte],
  );

  /* Se busca en las filas calculadas: si la fila se elimina, el detalle se cierra. */
  const detalle =
    detalleId == null
      ? null
      : (itemsCalculados.find((item) => String(item.id) === String(detalleId)) ?? null);

  const totalesFilas = React.useMemo(
    () => calcularTotalesMedidas(items, transporte),
    [items, transporte],
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

      transporte,
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
  }, [puedeAgregarFila, form, items, medidasValidas, pesoValido, transporte]);

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
      dimensiones: itemsCalculados,

      totales: totalesFinales,
    });

    onOpenChange(false);
  }, [puedeAplicar, itemsCalculados, totalesFinales, onAplicar, onOpenChange]);

  /* ==========================================================================
   * AVISOS (#157): transporte o unidad sin conversión
   * ========================================================================== */

  const avisoTransporte =
    !cargandoTransporte && !transporteReconocido
      ? `No se reconoce el tipo de transporte${transporte ? ` "${transporte}"` : ""}; se calcula como AEREO.`
      : null;

  const unidadesSinConversion = [
    ...new Set(
      [form.unidadMedida, form.unidadPeso, ...items.flatMap((i) => [i.unidadMedida, i.unidadPeso])]
        .map((unidad) => unidad?.tipo_desc)
        .filter((nombre): nombre is string => Boolean(nombre) && !esUnidadConocida(nombre)),
    ),
  ];

  /* Transporte con el que se calcula, visible en la calculadora y en el detalle (#161). */
  const textoTransporte = cargandoTransporte ? "Cargando…" : (transporte ?? "Sin seleccionar");

  const avisos = [
    ...(avisoTransporte ? [avisoTransporte] : []),
    ...(unidadesSinConversion.length
      ? [`Sin conversión para: ${unidadesSinConversion.join(", ")}; esas medidas cuentan como 0.`]
      : []),
  ];

  /* ==========================================================================
   * RENDER
   * ========================================================================== */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{etiquetas.titulo}</DialogTitle>
          <DialogDescription>
            Tipo de transporte:{" "}
            <span className="font-semibold text-primary">{textoTransporte}</span>
          </DialogDescription>
        </DialogHeader>

        {avisos.length ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              {avisos.map((aviso) => (
                <p key={aviso}>{aviso}</p>
              ))}
            </div>
          </div>
        ) : null}

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

          {itemsCalculados.length ? (
            <p className="text-xs text-primary">
              * Dar doble clic en una fila para ver los detalles
            </p>
          ) : null}

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
                {!itemsCalculados.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={lectura ? 5 : 6}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No hay dimensiones ingresadas.
                    </TableCell>
                  </TableRow>
                ) : (
                  itemsCalculados.map((item) => (
                    <TableRow
                      key={String(item.id)}
                      tabIndex={0}
                      title="Doble clic para ver los detalles"
                      aria-selected={String(item.id) === String(detalle?.id)}
                      className="cursor-pointer aria-selected:bg-primary/10"
                      onDoubleClick={() => setDetalleId(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && event.target === event.currentTarget) {
                          setDetalleId(item.id);
                        }
                      }}
                    >
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

        <DetalleFila
          detalle={detalle}
          etiquetas={etiquetas}
          transporte={textoTransporte}
          onCerrar={() => setDetalleId(null)}
        />
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================================================
 * DETALLE DE UNA FILA (doble clic, como el legado) (#159)
 * ========================================================================== */

function mostrarDecimal(value: unknown) {
  return numero(value).toLocaleString("es-GT", { maximumFractionDigits: 4 });
}

function DatoDetalle({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded px-2 py-1 hover:bg-primary/10">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold">{valor}</span>
    </div>
  );
}

function DetalleFila({
  detalle,
  etiquetas,
  transporte,
  onCerrar,
}: {
  detalle: DimensionCalculo | null;
  etiquetas: ReturnType<typeof obtenerEtiquetasCalculadora>;
  transporte: string;
  onCerrar: () => void;
}) {
  const unidadMedida = detalle?.unidadMedida?.tipo_desc ?? detalle?.unidadMedida?.label ?? "—";
  const unidadPeso = detalle?.unidadPeso?.tipo_desc ?? detalle?.unidadPeso?.label ?? "—";

  return (
    <Dialog
      open={detalle != null}
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles del volumen o peso</DialogTitle>
          <DialogDescription>
            Resumen de dimensiones seleccionadas · Tipo de transporte:{" "}
            <span className="font-semibold text-primary">{transporte}</span>
          </DialogDescription>
        </DialogHeader>

        {detalle ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <DatoDetalle label="Cantidad" valor={detalle.cantidad} />

              <div className="space-y-1 border-t pt-2">
                <p className="px-2 text-sm font-semibold text-primary">Volumen</p>
                <DatoDetalle label="Unidad" valor={unidadMedida} />
                <DatoDetalle label="Largo" valor={mostrarDecimal(detalle.largo)} />
                <DatoDetalle label="Ancho" valor={mostrarDecimal(detalle.ancho)} />
                <DatoDetalle label="Alto" valor={mostrarDecimal(detalle.alto)} />
                <DatoDetalle
                  label="Volumen unitario"
                  valor={mostrarDecimal(detalle.volumenUnitario)}
                />
                <DatoDetalle
                  label={etiquetas.volumen}
                  valor={detalle.volumenTotalKg > 0 ? mostrarNumero(detalle.volumenTotalKg) : "—"}
                />
              </div>

              <div className="space-y-1 border-t pt-2">
                <p className="px-2 text-sm font-semibold text-primary">Peso</p>
                <DatoDetalle label="Unidad" valor={unidadPeso} />
                <DatoDetalle label="Peso unitario" valor={mostrarDecimal(detalle.pesoUnitario)} />
                <DatoDetalle
                  label={etiquetas.peso}
                  valor={detalle.pesoTotalKg > 0 ? mostrarNumero(detalle.pesoTotalKg) : "—"}
                />
              </div>
            </div>

            <DibujoCaja
              cantidad={detalle.cantidad}
              largo={mostrarDecimal(detalle.largo)}
              ancho={mostrarDecimal(detalle.ancho)}
              alto={mostrarDecimal(detalle.alto)}
              volumen={`${mostrarDecimal(detalle.volumenUnitario)} ${unidadMedida}`}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Caja con sus medidas: mismo dibujo que VolumenIconTexto del legado. */
const TRAZO_CAJA =
  "M 360.368 417.132 C 359.44 417.131 358.524 416.906 357.704 416.474 L 324.831 399.23 C 320.893 397.215 320.613 391.691 324.327 389.288 C 326.085 388.151 328.324 388.06 330.17 389.052 L 345.359 397.018 L 466.812 333.313 L 458.656 329.035 C 454.759 326.94 454.59 321.413 458.353 319.085 C 460.064 318.026 462.205 317.938 463.996 318.856 L 496.867 336.098 C 500.806 338.113 501.085 343.638 497.371 346.04 C 495.612 347.178 493.374 347.269 491.528 346.276 L 479.185 339.803 L 357.732 403.507 L 363.042 406.293 C 366.961 408.348 367.186 413.874 363.448 416.239 C 362.527 416.823 361.459 417.134 360.368 417.132 Z M 247.163 417.132 C 245.024 417.134 243.062 415.946 242.069 414.051 C 240.594 411.241 241.678 407.768 244.489 406.292 L 249.798 403.507 L 128.345 339.802 L 116.002 346.275 C 112.105 348.37 107.402 345.461 107.537 341.038 C 107.601 338.945 108.797 337.051 110.662 336.097 L 143.535 318.854 C 147.432 316.761 152.135 319.67 152 324.093 C 151.937 326.185 150.738 328.079 148.873 329.035 L 140.719 333.312 L 262.171 397.018 L 277.36 389.052 C 280.172 387.575 283.645 388.66 285.119 391.47 C 286.593 394.282 285.509 397.756 282.698 399.228 L 249.828 416.472 C 249.006 416.906 248.092 417.131 247.163 417.132 Z M 303.765 387.58 C 302.835 387.581 301.92 387.355 301.096 386.923 L 167.27 316.726 C 165.377 315.734 164.192 313.773 164.192 311.637 L 164.192 147.277 C 164.192 145.141 165.377 143.18 167.27 142.187 L 301.096 71.991 C 302.768 71.113 304.764 71.113 306.437 71.991 L 360.091 100.135 C 364.03 102.151 364.31 107.675 360.596 110.078 C 358.838 111.215 356.598 111.306 354.752 110.315 L 303.766 83.571 L 261.647 105.664 L 383.097 169.37 L 425.219 147.277 L 374.856 120.86 C 370.918 118.844 370.638 113.322 374.354 110.917 C 376.112 109.78 378.35 109.69 380.195 110.679 L 440.261 142.187 C 442.153 143.18 443.339 145.141 443.339 147.277 L 443.339 311.638 C 443.339 313.774 442.153 315.734 440.261 316.727 L 306.435 386.924 C 305.612 387.355 304.695 387.581 303.765 387.58 Z M 303.765 315.379 C 306.94 315.379 309.512 317.951 309.512 321.127 L 309.512 372.326 L 431.844 308.16 L 431.844 156.781 L 388.845 179.338 L 388.845 229.639 C 388.845 231.841 387.584 233.852 385.601 234.811 L 360.764 246.834 C 356.949 248.683 352.512 245.903 352.512 241.662 L 352.512 198.393 L 309.512 220.949 L 309.512 298.138 C 309.512 301.313 306.94 303.886 303.765 303.886 C 300.592 303.886 298.018 301.313 298.018 298.138 L 298.018 220.948 L 175.688 156.781 L 175.688 308.16 L 298.018 372.326 L 298.018 321.127 C 298.018 317.951 300.592 315.379 303.765 315.379 Z M 364.007 192.364 L 364.007 232.493 L 377.349 226.033 L 377.349 185.366 L 364.007 192.364 Z M 182.314 147.277 L 303.765 210.983 L 345.887 188.889 L 224.435 125.183 L 182.314 147.277 Z M 236.808 118.692 L 358.261 182.398 L 370.723 175.861 L 249.271 112.155 L 236.808 118.692 Z M 146.199 305.079 C 145.271 305.079 144.356 304.852 143.533 304.421 L 110.662 287.178 C 107.851 285.703 106.769 282.23 108.244 279.418 C 109.716 276.607 113.191 275.524 116.002 277 L 122.614 280.467 L 122.862 129.073 L 110.934 122.816 C 106.994 120.8 106.714 115.276 110.428 112.874 C 112.187 111.736 114.426 111.645 116.271 112.638 L 149.144 129.877 C 153.042 131.973 153.209 137.501 149.447 139.829 C 147.736 140.888 145.596 140.976 143.804 140.059 L 134.348 135.098 L 134.099 286.49 L 148.873 294.24 C 151.684 295.714 152.768 299.186 151.294 301.998 C 150.301 303.894 148.338 305.08 146.199 305.079 Z";

function DibujoCaja({
  cantidad,
  largo,
  ancho,
  alto,
  volumen,
}: {
  cantidad: number;
  largo: string;
  ancho: string;
  alto: string;
  volumen: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-40 -0.555 600 530"
      className="h-auto w-full max-w-xs justify-self-center fill-current text-primary"
      role="img"
      aria-label={`Caja de ${largo} × ${ancho} × ${alto}, cantidad ${cantidad}, volumen ${volumen}`}
    >
      <path d={TRAZO_CAJA} />

      <g className="fill-foreground" fontFamily="Arial, sans-serif" fontSize="40">
        <text x="-40" y="60" textAnchor="start">
          Cantidad: {cantidad}
        </text>

        <text x="100" y="230" textAnchor="end">
          {alto}
        </text>

        <text x="180" y="420" textAnchor="end">
          {ancho}
        </text>

        <text x="412.925" y="420" textAnchor="start">
          {largo}
        </text>

        <text x="260" y="470" textAnchor="middle" fontWeight="bold">
          Volumen:
        </text>

        <text x="260" y="518" textAnchor="middle" fontWeight="bold" fontSize="36">
          {volumen}
        </text>
      </g>
    </svg>
  );
}
