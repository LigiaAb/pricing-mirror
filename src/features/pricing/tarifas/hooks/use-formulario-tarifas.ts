"use client";

import { isBefore, isEqual } from "date-fns";
import * as React from "react";
import { useContextoOperativoStore } from "@/features/shell";
import { useAuthStore } from "@/shared/stores/auth-store";
import { fieldRules } from "../lib//tarifa-field-rules";
import {
  CATALOGOS_AGREGAR_TODOS,
  convertClasificacionServicio,
  DEFAULT_TODOS_VALUE,
} from "../lib/tarifa-helpers";
import {
  valoresSoloCodigos as buildValoresSoloCodigos,
  filtrarValoresPorPayload,
  getPlainValue,
} from "../lib/transforms-tarifa";

// ─── Tipos/helpers mínimos de soporte ────────────────────────────────────────
// Se agregan helpers pequeños para no cambiar la lógica original del hook
// y solo ayudar a TypeScript a entender cuándo un unknown sí se puede usar.

type UnknownRecord = Record<string, unknown>;

type CatalogosProcesados = Record<string, readonly unknown[] | undefined>;

type UseFormularioOptions = {
  tipoFormulario: string;
  defaultValues?: Record<string, unknown> | null | undefined;
  catalogosProcesados?: CatalogosProcesados;
  isLoading?: boolean;
  inputsReadOnly?: readonly string[];
  inputsToHide?: readonly string[];
  inputsReadOnlyScale?: readonly string[];
  groupsToHide?: readonly string[];
  obligatorios?: readonly string[];
  // fetchClienteById?: unknown;
  validarSiTieneMetodoDeCalculo?: boolean;
};

type EmpresaOption = {
  cod_empresa?: unknown;
};

type CentroCostoOption = {
  codEmpresaCc?: unknown;
  codCc?: unknown;
};

type TipoOption = {
  value?: unknown;
};

type TipoRelacionadoOption = TipoOption & {
  label?: string;
  cod_tipo_padre?: unknown;
  tipo_padre_tabla?: string;
  tipo_tabla?: string;
  cod_tipo?: unknown;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

// const isPrimitiveComparable = (value: unknown): value is string | number | boolean => ["string", "number", "boolean"].includes(typeof value);

const CAMPOS_SIEMPRE_LECTURA = [
  "usuario",
  "empresa",
  "centroCosto",
  "fechaCreacion",
  "fechaModificacion",
];

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useFormulario({
  tipoFormulario,
  defaultValues,
  catalogosProcesados,
  isLoading = false,
  inputsReadOnly = [],
  inputsToHide = [],
  inputsReadOnlyScale = [],
  groupsToHide = [],
  obligatorios = [],
  // fetchClienteById,
  validarSiTieneMetodoDeCalculo = false,
}: UseFormularioOptions) {
  const centroCostoActual = useContextoOperativoStore((state) => state.currentCentroCosto);
  const empresaActual = useContextoOperativoStore((state) => state.currentEmpresa);
  const usuarioSistema = useAuthStore((state) => state.user);
  const usuario = isRecord(usuarioSistema) ? usuarioSistema.email : undefined;
  const cod_usuario = isRecord(usuarioSistema) ? usuarioSistema.cod_usuario : undefined;

  const ctx = React.useMemo(
    () => ({ empresaId: empresaActual, centroCostoId: centroCostoActual }),
    [empresaActual, centroCostoActual],
  );

  // ─── Valores iniciales ────────────────────────────────────────────────────────
  // Se mantienen como unknown para no alterar la estructura actual del formulario.
  const DEFAULT_VALUES: Record<string, unknown> = Object.fromEntries(
    Object.keys(fieldRules).map((key) => [key, fieldRules[key]?.default ?? null]),
  );

  const [values, setValues] = React.useState<Record<string, unknown>>(DEFAULT_VALUES);

  // ─── Valores derivados de los inputs ────────────────────────────────────────
  const esScale = React.useMemo(() => values?.cod_rubro === 134, [values]);

  // ─── Valores derivados de las reglas ────────────────────────────────────────
  const tipoForm = /* validarSiTieneMetodoDeCalculo ? "lectura" : */ tipoFormulario;

  // ── Valores iniciales derivados de fieldRules ──────────────────────────────
  // Se recalculan desde las reglas para tener una base consistente al inicializar.
  const valoresIniciales = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(fieldRules).map(([key, regla]) => [key, regla?.default ?? null]),
      ),
    [],
  );

  // ── Conversión: defaultValues (API) → objetos de catálogo ─────────────────
  const defaultValuesProcesados = React.useMemo(() => {
    const resultado: Record<string, unknown> = { ...(defaultValues ?? {}) };
    const ctxValue = ctx ?? {};

    Object.entries(fieldRules).forEach(([campo, regla]) => {
      const codigo =
        defaultValues?.[regla.cod] ??
        (campo === "categoriaTransporte" ? defaultValues?.categoria_transporte : undefined);

      // Los campos simples y las fechas ya vienen resueltos en la tarifa consultada.
      if (!regla.catalogo) {
        if (codigo !== undefined) resultado[campo] = codigo;
        return;
      }

      // Selects
      const catalogo = catalogosProcesados?.[regla.catalogo ?? ""];
      if (!Array.isArray(catalogo)) return;

      const coincide = (a: unknown, b: unknown) =>
        a != null && b != null && String(a) === String(b);

      if (codigo != null) {
        const encontrado = catalogo.find((item) => {
          if (!isRecord(item)) return false;
          if (campo === "tipoClasificacion") {
            const clasificacion = convertClasificacionServicio(Number(codigo));
            return (
              clasificacion != null &&
              convertClasificacionServicio(Number(item.value)) === clasificacion
            );
          }
          return (
            coincide(item.value, codigo) || (campo === "incoterm" && coincide(item.codigo, codigo))
          );
        });

        if (encontrado) {
          resultado[campo] = encontrado;
        } else if (!isRecord(resultado[campo])) {
          resultado[campo] = null;
        }
        return;
      }

      if (isRecord(resultado[campo])) return;

      if (campo === "tipoPago") {
        resultado[campo] =
          catalogo.find((item) => isRecord(item) && coincide(item.value, 131)) ?? null;
      } else if (CATALOGOS_AGREGAR_TODOS[regla.catalogo as keyof typeof CATALOGOS_AGREGAR_TODOS]) {
        resultado[campo] = catalogo.find((item) => isRecord(item) && item.value === null) ?? null;
      }
    });

    // ── Defaults desde ctx para empresa y centroCosto ─────────────────────────
    const empresas = Array.isArray(catalogosProcesados?.empresas)
      ? catalogosProcesados.empresas
      : [];

    const centrosCosto = Array.isArray(catalogosProcesados?.centrosCosto)
      ? catalogosProcesados.centrosCosto
      : [];

    const getCtxMatchValue = (source: unknown, fallbackKeys: string[]): unknown => {
      if (source === undefined || source === null) return null;

      if (typeof source !== "object") return source;

      // Si ya viene como valor primitivo, se usa directo.
      if (!isRecord(source)) return source;

      if ("value" in source) return source.value;

      for (const key of fallbackKeys) {
        if (key in source) return source[key];
      }

      return null;
    };

    if (resultado.empresa == null) {
      const ctxEmpresaValue =
        defaultValues?.cod_empresa ??
        getCtxMatchValue((ctxValue as UnknownRecord)?.empresaId, [
          "cod_empresa",
          "empresaId",
          "id",
        ]);

      if (ctxEmpresaValue !== null) {
        resultado.empresa = empresas.find((e) => e.cod_empresa === ctxEmpresaValue) ?? null;
      }
    }

    if (resultado.centroCosto == null) {
      const ctxCentroCostoValue =
        defaultValues?.cod_cc ??
        getCtxMatchValue((ctxValue as UnknownRecord)?.centroCostoId, [
          "cod_cc",
          "centroCostoId",
          "id",
        ]);

      if (ctxCentroCostoValue !== null) {
        resultado.centroCosto =
          centrosCosto.find((cc) => cc.cod_cc === ctxCentroCostoValue) ?? null;
      }
    }

    resultado.usuario = usuario;

    return resultado;
  }, [defaultValues, ctx, catalogosProcesados, usuario /* fetchClienteById */]);

  // ── Helper para obtener catálogo de un campo ───────────────────────────────
  const obtenerCatalogoById = React.useCallback(
    (id: string, currentValues: Record<string, unknown> = values) => {
      const values_inter = currentValues ?? values;
      const catalogoId = fieldRules?.[id]?.catalogo;

      if (!catalogoId) return [];

      const validarTodos = (valor: unknown) => {
        if (CATALOGOS_AGREGAR_TODOS[catalogoId as keyof typeof CATALOGOS_AGREGAR_TODOS]) {
          return valor === DEFAULT_TODOS_VALUE;
        }
        return false;
      };

      if (id === "centroCosto") {
        const empresaSeleccionada = values_inter.empresa as EmpresaOption | null;

        return ((catalogosProcesados?.[catalogoId] ?? []) as readonly CentroCostoOption[]).filter(
          (cc) => cc.codEmpresaCc === empresaSeleccionada?.cod_empresa || validarTodos(cc.codCc),
        );
      }

      if (id === "tipoServicio") {
        const tipoTransporteSeleccionado = values_inter.tipoTransporte as TipoOption | null;

        return (
          (catalogosProcesados?.[catalogoId] ?? []) as readonly TipoRelacionadoOption[]
        ).filter((ts) => {
          const esDelTipoTransporte = ts.cod_tipo_padre === tipoTransporteSeleccionado?.value;

          const tieneTodos = validarTodos(ts.value);

          if (esDelTipoTransporte || tieneTodos) return true;

          return false;
        });
      }

      if (id === "tipoClasificacion") {
        const tipoTransporteSeleccionado = values_inter.tipoTransporte as TipoOption | null;
        const rubroSeleccionado = values_inter.rubro as {
          label?: string;
          es_flete?: boolean;
        } | null;

        const normalizarTexto = (texto: unknown) =>
          String(texto ?? "")
            .trim()
            .toLowerCase();

        const rubroLabel = normalizarTexto(rubroSeleccionado?.label);
        // const esFlete = rubroSeleccionado?.esFlete;

        const rubroEsFlete = rubroSeleccionado?.es_flete === true;
        const rubroEsExpress = rubroLabel.includes("express");

        const catalogoFiltrado = (
          (catalogosProcesados?.[catalogoId] ?? []) as readonly TipoRelacionadoOption[]
        ).filter((ct) => {
          const esDelTipoTransporte = ct.cod_tipo_padre === tipoTransporteSeleccionado?.value;

          if (!esDelTipoTransporte) return validarTodos(ct.cod_tipo);

          const clasificacionLabel = normalizarTexto(ct.label);

          const clasificacionEsFlete = clasificacionLabel === "flete";
          const clasificacionEsFleteExpress = clasificacionLabel === "flete express";

          // NUEVO: si el rubro es FLETE EXPRESS, solo mostrar FLETE EXPRESS
          if (rubroEsFlete && rubroEsExpress) {
            return clasificacionEsFleteExpress || validarTodos(ct.cod_tipo);
          }

          // NUEVO: si el rubro es FLETE normal, solo mostrar FLETE
          if (rubroEsFlete) {
            return clasificacionEsFlete || validarTodos(ct.value);
          }

          // NUEVO: si el rubro es EXPRESS, solo mostrar EXPRESS
          if (rubroEsExpress) {
            return clasificacionEsFleteExpress || validarTodos(ct.value);
          }

          // NUEVO: si el rubro no es FLETE, ocultar FLETE y FLETE EXPRESS
          return ct.value;
        });

        return catalogoFiltrado;
      }

      if (id === "metodoCalculo") {
        return esScale
          ? ((catalogosProcesados?.metodosCalculo || []) as readonly TipoOption[]).filter(
              (td) => td.value === 342,
            )
          : ((catalogosProcesados?.metodosCalculo || []) as readonly TipoOption[]).filter(
              (td) => td.value !== 342,
            );
      }

      return catalogosProcesados?.[catalogoId] ?? [];
    },
    [catalogosProcesados, values, esScale],
  );

  // ── Inicialización (solo una vez, cuando catalogos cargan) ─────────────────
  const yaInicializoRef = React.useRef(false);

  React.useEffect(() => {
    if (!usuario) return;
    if (isLoading) return;
    if (yaInicializoRef.current) return;
    if (defaultValues && Object.keys(defaultValuesProcesados).length === 0) return;

    setValues(() => ({ ...valoresIniciales, ...defaultValuesProcesados }));
    yaInicializoRef.current = true;
  }, [isLoading, valoresIniciales, usuario, defaultValuesProcesados, defaultValues]);

  // ── Parchar valores cuando llegan tarde ───────────────────────────────────

  React.useEffect(() => {
    if (!defaultValues) return;
    if (!yaInicializoRef.current) return;

    setValues((prev) => {
      const siguiente = { ...prev };
      let huboCambios = false;

      Object.keys(defaultValuesProcesados).forEach((key) => {
        const valorActual = prev[key];
        const nuevoValor = defaultValuesProcesados[key];

        if (
          (valorActual === undefined || valorActual === null) &&
          nuevoValor !== undefined &&
          nuevoValor !== null &&
          !Object.is(valorActual, nuevoValor)
        ) {
          siguiente[key] = nuevoValor;
          huboCambios = true;
        }
      });

      return huboCambios ? siguiente : prev;
    });
  }, [defaultValues, defaultValuesProcesados]);

  // ── Auto-seleccionar campos cuando su catálogo solo tiene 1 opción ─────────

  React.useEffect(() => {
    if (tipoForm === "lectura") return;
    if (isLoading) return;
    if (!yaInicializoRef.current) return;

    setValues((prev) => {
      const next = { ...prev };
      let huboCambios = false;

      Object.entries(fieldRules).forEach(([id, regla]) => {
        if (!regla?.catalogo) return;
        if (inputsToHide.includes(id)) return;

        const valorActual = next[id];

        // No sobreescribir si el usuario ya seleccionó algo
        if (valorActual !== undefined && valorActual !== null) return;

        const catalogo = obtenerCatalogoById(id, next);

        if (!Array.isArray(catalogo)) return;
        if (catalogo.length !== 1) return;

        const unico = catalogo[0] ?? null;
        if (!unico) return;

        next[id] = unico;

        if (regla.cod) {
          next[regla.cod] = getPlainValue(unico);
        }

        huboCambios = true;
      });

      return huboCambios ? next : prev;
    });
  }, [tipoForm, isLoading, inputsToHide, obtenerCatalogoById]);

  // ── onInput: cambiar un campo ──────────────────────────────────────────────

  const onInput = React.useCallback(
    ({ id, val }: { id: string; val: unknown }) => {
      setValues((prev) => {
        if (Object.is(prev?.[id], val)) return prev;

        const next = { ...prev };
        const regla = fieldRules[id];

        if (id === "tipoTransporte") {
          const tipoTransporteSeleccionado = val as { label?: string } | null;

          const tipoOrigenVsTipoTransporte: Record<string, string> = {
            AEREO: "AEROPUERTO",
            MARITIMO: "PUERTO",
            TERRESTRE: "ADUANA",
          };

          const tipoPuntoEnlace =
            tipoOrigenVsTipoTransporte?.[tipoTransporteSeleccionado?.label ?? ""];

          const tipoPuntoEnlaceEncontrado =
            (
              (catalogosProcesados?.tiposPuntoEnlace || []) as Array<{
                label?: string;
                value?: unknown;
              }>
            ).find((item) => item.label === tipoPuntoEnlace) ?? null;

          next.tipoPuntoEnlaceOrigen = tipoPuntoEnlaceEncontrado;
          next.tipoPuntoEnlaceDestino = tipoPuntoEnlaceEncontrado;
        }

        if (id === "rubro") {
          const rubroSeleccionado = val as { value?: number; label?: string } | null;

          if (rubroSeleccionado?.value === 134) {
            const metodoCalculoSeleccionado =
              ((catalogosProcesados?.metodosCalculo || []) as readonly TipoOption[]).find(
                (td) => td.value === 342,
              ) ?? null;

            next.metodoCalculo = metodoCalculoSeleccionado;
            next.cod_tipo = getPlainValue(metodoCalculoSeleccionado);
          }

          const normalizarTexto = (texto: unknown) =>
            String(texto ?? "")
              .trim()
              .toLowerCase();

          const rubroLabel = normalizarTexto(rubroSeleccionado?.label);

          const rubroEsFlete = rubroLabel.includes("flete");
          const rubroEsExpress = rubroLabel.includes("express");

          const tipoTransporteSeleccionado = prev.tipoTransporte as TipoOption | null;

          const clasificacionesDisponibles = (
            (catalogosProcesados?.tiposClasificacion || []) as readonly TipoRelacionadoOption[]
          ).filter((ct) => {
            const esDelTipoTransporte =
              ct.cod_tipo_padre === tipoTransporteSeleccionado?.value &&
              ct.tipo_padre_tabla === "TRANSPORTE" &&
              ct.tipo_tabla === "CLASIFICACION_SERVICIO";

            if (!esDelTipoTransporte) return false;

            const clasificacionLabel = normalizarTexto(ct.label);

            const clasificacionEsFlete = clasificacionLabel === "flete";
            const clasificacionEsFleteExpress = clasificacionLabel === "flete express";

            if (rubroEsFlete && rubroEsExpress) {
              return clasificacionEsFleteExpress;
            }

            if (rubroEsFlete) {
              return clasificacionEsFlete;
            }

            return !clasificacionEsFlete && !clasificacionEsFleteExpress;
          });

          const tipoClasificacionActual = prev.tipoClasificacion as { value?: number } | null;

          const tipoClasificacionActualSigueDisponible = clasificacionesDisponibles.some(
            (ct) => ct.value === tipoClasificacionActual?.value,
          );

          if (!tipoClasificacionActualSigueDisponible) {
            next.tipoClasificacion = null;
            next.clasificacion = null;
          }
        }

        if (!regla) {
          next[id] = val;
          return next;
        }

        next[id] = val ?? null;

        // Reset de campos dependientes
        regla.reset?.forEach((keyToReset) => {
          const reglaReset = fieldRules?.[keyToReset];

          next[keyToReset] = fieldRules?.[keyToReset]?.default ?? null;

          if (reglaReset?.cod) {
            next[reglaReset.cod] = getPlainValue(next[keyToReset]);
          }
        });

        const codigo = regla.cod;

        if (codigo) {
          next[codigo] = getPlainValue(next[id]);
        }

        return next;
      });
    },
    [catalogosProcesados],
  );

  // ── Helpers de visibilidad / readonly / require ───────────────────────────

  const verificarSiEsLectura = React.useCallback(
    (id: string): boolean => {
      let resultadoFinal = false;

      // console.group(+`verificarSiEsLectura: ${id}`);

      try {
        if (tipoForm === "lectura") {
          resultadoFinal = true;

          if (id === "fechaFin") {
            if (!defaultValues?.fechaFin) {
              resultadoFinal = false;
            } else if (validarSiTieneMetodoDeCalculo) {
              const fechaFinDefault = defaultValues?.fechaFin;

              if (!fechaFinDefault) {
                resultadoFinal = true;
              } else {
                const fechaActual = new Date();
                const fechaFin = new Date(fechaFinDefault as string | Date);

                const fechaFinSigueVigente =
                  isBefore(fechaActual, fechaFin) || isEqual(fechaActual, fechaFin);

                if (fechaFinSigueVigente) {
                  resultadoFinal = false;
                } else {
                  resultadoFinal = true;
                }
              }
            }
          }
        } else if (CAMPOS_SIEMPRE_LECTURA.includes(id)) {
          resultadoFinal = true;
        } else if (id === "fechaInicio" && defaultValues?.[id]) {
          resultadoFinal = true;
        } else if (esScale && inputsReadOnlyScale.includes(id)) {
          resultadoFinal = true;
        } else if (inputsReadOnly.includes(id)) {
          resultadoFinal = true;
        } else if (fieldRules[id]?.readonly) {
          resultadoFinal = true;
        } else {
          const require = fieldRules[id]?.require;

          if (require) {
            const requireList = Array.isArray(require) ? require : [require];

            const dependenciaFaltante = requireList.find((dependencia) => !values?.[dependencia]);

            if (dependenciaFaltante) {
              resultadoFinal = true;
            }
          }
        }
      } catch {
        resultadoFinal = true;

        // console.error("Error en+ verificarSiEsLectura:", error);
      }

      return resultadoFinal;
    },
    [
      tipoForm,
      inputsReadOnly,
      inputsReadOnlyScale,
      values,
      defaultValues,
      esScale,
      validarSiTieneMetodoDeCalculo,
    ],
  );

  const verificarSiEsObligatorio = React.useCallback(
    (id: string): boolean => {
      if (tipoForm === "lectura") return false;
      if (obligatorios.includes(id)) return true;
      return false;
    },
    [tipoForm, obligatorios],
  );

  const verificarSiEsVisible = React.useCallback(
    (id: string): boolean => {
      if (inputsToHide.includes(id)) return false;

      const visibleWhen = fieldRules[id]?.visibleWhen;
      if (!visibleWhen) return true;

      const { field, key, value } = visibleWhen;
      const valorCampo = values?.[field];

      if (valorCampo === null || valorCampo === undefined) return false;

      if (key) {
        const valorCapoByKey = isRecord(valorCampo) ? valorCampo[key] : undefined;

        if (Array.isArray(value)) {
          return value.some((item) => item === valorCapoByKey);
        }

        return valorCapoByKey === value;
      }

      if (Array.isArray(value)) {
        return value.some((item) => item === valorCampo);
      }

      return valorCampo === value;
    },
    [inputsToHide, values],
  );

  const verificarSiGrupoEsVisible = React.useCallback(
    (id: string): boolean => !groupsToHide.includes(id),
    [groupsToHide],
  );

  // ── Payload ───────────────────────────────────────────────────────────────

  const valoresSoloCodigos = React.useCallback(
    (payload?: string) => {
      return { ...buildValoresSoloCodigos(values, fieldRules, payload), cod_usuario };
    },
    [values, cod_usuario],
  );

  return {
    values,
    setValues,
    onInput,
    valoresSoloCodigos,
    filtrarValoresPorPayload: (sourceValues: Record<string, unknown>, payload: string) =>
      filtrarValoresPorPayload(sourceValues, fieldRules, payload),
    verificarSiEsLectura,
    verificarSiEsVisible,
    verificarSiGrupoEsVisible,
    verificarSiEsObligatorio,
    obtenerCatalogoById,
  };
}
