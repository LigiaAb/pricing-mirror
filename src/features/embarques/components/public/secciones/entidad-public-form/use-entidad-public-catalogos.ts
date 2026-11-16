"use client";

/**
 * Catálogos del formulario público de entidad, con selección por `apiMode`.
 * Ambas variantes (privada y pública) se declaran siempre —las reglas de hooks
 * prohíben el ternario del legacy— y se habilita solo la del modo activo.
 *
 * Incluye los catálogos "scopeados al maestro": el panel de comparación debe
 * resolver labels de departamento/municipio del valor ANTES (dirección guardada
 * en BD), que puede pertenecer a un país/departamento distinto al seleccionado.
 */

import { useMemo } from "react";
import {
  ciudades,
  ciudadesPublico,
  departamentos,
  departamentosPublico,
  industrias,
  industriasPublico,
  municipios,
  municipiosPublico,
  paises,
  paisesPublico,
  tipos,
  tiposPublico,
} from "@/features/catalogos";
import type { OpcionCatalogo } from "./model";

// Referencia estable para queries deshabilitadas (p. ej. las "priv" en modo
// público): el default `= []` del destructuring crea un array nuevo en cada
// render mientras `data` sea `undefined`, invalidando los useMemo de abajo
// en cada tecla escrita — cascada que rompe la memoización de `datos` en
// use-datos-carta-publica.ts y fuerza re-render de las 7 secciones del wizard.
const EMPTY: never[] = [];

interface Params {
  apiMode: "public" | "private";
  /** El token público se setea async en el padre; sin esto los fetch públicos disparan sin Authorization. */
  tokenReady: boolean;
  /** País de la sección Información (scope de ciudades). */
  codPaisInfo: string;
  /** País de la dirección (scope de departamentos). */
  codPaisDir: string;
  /** Departamento de la dirección (scope de municipios). */
  codDepto: string;
  /** País/departamento del maestro (dirección BD) para el panel de comparación. */
  masterCodPais: string;
  masterCodDepto: string;
}

export interface EntidadPublicCatalogos {
  paisOptions: OpcionCatalogo[];
  ciudadOptions: OpcionCatalogo[];
  departamentoOptions: OpcionCatalogo[];
  municipioOptions: OpcionCatalogo[];
  industriaOptions: OpcionCatalogo[];
  tiposContactoOptions: OpcionCatalogo[];
  /** Catálogos combinados (selección actual + maestro) para resolver labels del "antes". */
  departamentoOptionsParaComparar: OpcionCatalogo[];
  municipioOptionsParaComparar: OpcionCatalogo[];
  /** Datos crudos de países para resolver nombre→código del valor inicial. */
  paisesRaw: Array<{ cod_pais: string | number; nombre_pais: string }>;
}

const mapDeptos = (
  data: Array<{ cod_depto: string | number; nombre_depto: string }>,
): OpcionCatalogo[] => data.map((d) => ({ value: d.cod_depto, label: d.nombre_depto }));

const mapMunis = (
  data: Array<{ cod_muni: string | number; nombre_muni: string }>,
): OpcionCatalogo[] => data.map((m) => ({ value: m.cod_muni, label: m.nombre_muni }));

export function useEntidadPublicCatalogos({
  apiMode,
  tokenReady,
  codPaisInfo,
  codPaisDir,
  codDepto,
  masterCodPais,
  masterCodDepto,
}: Params): EntidadPublicCatalogos {
  const esPrivado = apiMode === "private";
  const habilitarPublico = !esPrivado && tokenReady;

  const { data: paisesPriv = EMPTY } = paises.useLista({}, { enabled: esPrivado });
  const { data: paisesPub = EMPTY } = paisesPublico.useLista({}, { enabled: habilitarPublico });
  const paisesRaw = esPrivado ? paisesPriv : paisesPub;
  const paisOptions = useMemo(
    () => paisesRaw.map((p) => ({ value: p.cod_pais, label: p.nombre_pais })),
    [paisesRaw],
  );

  // Privado: lista completa filtrada client-side; público: endpoint por país.
  const { data: ciudadesPriv = EMPTY } = ciudades.useLista({}, { enabled: esPrivado });
  const { data: ciudadesPub = EMPTY } = ciudadesPublico.useLista(
    { cod_pais: codPaisInfo },
    { enabled: habilitarPublico && Boolean(codPaisInfo) },
  );
  const ciudadOptions = useMemo(() => {
    const data = esPrivado
      ? ciudadesPriv.filter((c) => codPaisInfo && String(c.cod_pais) === String(codPaisInfo))
      : ciudadesPub;
    return data.map((c) => ({ value: c.cod_ciudad, label: c.nombre_ciudad }));
  }, [esPrivado, ciudadesPriv, ciudadesPub, codPaisInfo]);

  const { data: deptosPriv = EMPTY } = departamentos.useLista(
    { cod_pais: codPaisDir },
    { enabled: esPrivado && Boolean(codPaisDir) },
  );
  const { data: deptosPub = EMPTY } = departamentosPublico.useLista(
    { cod_pais: codPaisDir },
    { enabled: habilitarPublico && Boolean(codPaisDir) },
  );
  const departamentoOptions = useMemo(
    () => mapDeptos(esPrivado ? deptosPriv : deptosPub),
    [esPrivado, deptosPriv, deptosPub],
  );

  const { data: munisPriv = EMPTY } = municipios.useLista(
    { cod_depto: codDepto },
    { enabled: esPrivado && Boolean(codDepto) },
  );
  const { data: munisPub = EMPTY } = municipiosPublico.useLista(
    { cod_depto: codDepto },
    { enabled: habilitarPublico && Boolean(codDepto) },
  );
  const municipioOptions = useMemo(
    () => mapMunis(esPrivado ? munisPriv : munisPub),
    [esPrivado, munisPriv, munisPub],
  );

  // Scope del maestro: solo cuando difiere de la selección actual.
  const habilitarMasterDeptos = Boolean(masterCodPais) && masterCodPais !== codPaisDir;
  const { data: masterDeptosPriv = EMPTY } = departamentos.useLista(
    { cod_pais: masterCodPais },
    { enabled: esPrivado && habilitarMasterDeptos },
  );
  const { data: masterDeptosPub = EMPTY } = departamentosPublico.useLista(
    { cod_pais: masterCodPais },
    { enabled: habilitarPublico && habilitarMasterDeptos },
  );
  const habilitarMasterMunis = Boolean(masterCodDepto) && masterCodDepto !== codDepto;
  const { data: masterMunisPriv = EMPTY } = municipios.useLista(
    { cod_depto: masterCodDepto },
    { enabled: esPrivado && habilitarMasterMunis },
  );
  const { data: masterMunisPub = EMPTY } = municipiosPublico.useLista(
    { cod_depto: masterCodDepto },
    { enabled: habilitarPublico && habilitarMasterMunis },
  );
  const departamentoOptionsParaComparar = useMemo(
    () => [...departamentoOptions, ...mapDeptos(esPrivado ? masterDeptosPriv : masterDeptosPub)],
    [departamentoOptions, esPrivado, masterDeptosPriv, masterDeptosPub],
  );
  const municipioOptionsParaComparar = useMemo(
    () => [...municipioOptions, ...mapMunis(esPrivado ? masterMunisPriv : masterMunisPub)],
    [municipioOptions, esPrivado, masterMunisPriv, masterMunisPub],
  );

  const { data: industriasPriv = EMPTY } = industrias.useLista({}, { enabled: esPrivado });
  const { data: industriasPub = EMPTY } = industriasPublico.useLista(
    {},
    { enabled: habilitarPublico },
  );
  const industriaOptions = useMemo(() => {
    const data = esPrivado ? industriasPriv : industriasPub;
    return data.map((i) => ({ value: i.cod_industria, label: i.nom_industria_es }));
  }, [esPrivado, industriasPriv, industriasPub]);

  const { data: tiposContactoPriv = EMPTY } = tipos.useLista(
    { tipo_tabla: "ENTIDAD_CONTACTOS" },
    { enabled: esPrivado },
  );
  const { data: tiposContactoPub = EMPTY } = tiposPublico.useLista(
    { tipo_tabla: "ENTIDAD_CONTACTOS" },
    { enabled: habilitarPublico },
  );
  const tiposContactoOptions = useMemo(() => {
    const data: Array<{ value: string | number; label: string }> = esPrivado
      ? tiposContactoPriv
      : tiposContactoPub;
    return data.map((t) => ({ value: t.value, label: t.label }));
  }, [esPrivado, tiposContactoPriv, tiposContactoPub]);

  return useMemo(
    () => ({
      paisOptions,
      ciudadOptions,
      departamentoOptions,
      municipioOptions,
      industriaOptions,
      tiposContactoOptions,
      departamentoOptionsParaComparar,
      municipioOptionsParaComparar,
      paisesRaw,
    }),
    [
      paisOptions,
      ciudadOptions,
      departamentoOptions,
      municipioOptions,
      industriaOptions,
      tiposContactoOptions,
      departamentoOptionsParaComparar,
      municipioOptionsParaComparar,
      paisesRaw,
    ],
  );
}
