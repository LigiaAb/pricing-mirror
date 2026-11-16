import { useMemo } from "react";
import {
  useFetchEntidadContacto,
  useFetchEntidadesDireccion,
  useFetchEntidadIdentificacion,
} from "@/features/entidades";
import { buildCambiosClienteRows, buildMaestroSeparado } from "./cambios-cliente";
import { DIRECCION_TIPO_RECOLECCION, type EntidadPublicConfig, type JsonRecord } from "./model";
import type { EntidadPublicCatalogos } from "./use-entidad-public-catalogos";

interface UseCambiosClientePanelParams {
  readonly apiMode: "public" | "private";
  readonly readOnly: boolean;
  readonly config: EntidadPublicConfig;
  readonly data?: JsonRecord;
  readonly rawEntidadActual: JsonRecord | null | undefined;
  readonly values: JsonRecord;
  readonly catalogos: EntidadPublicCatalogos;
}

// G15: en privado, el snapshot de recuperar-datos-entidad-relacionada puede
// traer contacto/dirección/NIT vacíos o desactualizados — se consultan
// directo por cod_tipo + entidad_id, igual que el legacy, para que el panel
// "Cambios del cliente" compare contra el maestro real.
export function useCambiosClientePanel({
  apiMode,
  readOnly,
  config,
  data,
  rawEntidadActual,
  values,
  catalogos,
}: UseCambiosClientePanelParams) {
  const codTipoEntidad = (rawEntidadActual?.cod_tipo ?? (readOnly ? config.tipo : null)) as
    | number
    | null;
  const separadosEnabled = readOnly && Boolean(values.entidad_id) && Boolean(codTipoEntidad);
  const { data: contactosSepResp } = useFetchEntidadContacto(
    { cod_tipo: Number(codTipoEntidad), entidad_id: Number(values.entidad_id) },
    { enabled: separadosEnabled },
  );
  const { data: direccionesSep = [] } = useFetchEntidadesDireccion(
    { cod_tipo: Number(codTipoEntidad), entidad_id: Number(values.entidad_id) },
    { enabled: separadosEnabled },
  );
  const { data: identSepResp } = useFetchEntidadIdentificacion(
    { cod_tipo: Number(codTipoEntidad), entidad_id: Number(values.entidad_id) },
    { enabled: separadosEnabled },
  );

  const maestroSeparado = useMemo(() => {
    if (!readOnly) return {};
    return buildMaestroSeparado({
      contactos: contactosSepResp?.data as unknown as JsonRecord[],
      direcciones: direccionesSep as unknown as JsonRecord[],
      identificaciones: identSepResp?.data as unknown as JsonRecord[],
      entidadcontactoId: values.entidadcontacto_id,
      direccionTipoRecoleccion: DIRECCION_TIPO_RECOLECCION,
    });
  }, [readOnly, contactosSepResp, direccionesSep, identSepResp, values.entidadcontacto_id]);

  // Panel "Cambios del cliente" (solo privado): maestro BD vs carta.
  const cambiosClienteRows = useMemo(() => {
    if (apiMode === "public") return [];
    return buildCambiosClienteRows({
      modificados: data?._modificados,
      rawEntidad: rawEntidadActual,
      values,
      sectionInfo: config.sectionLabel || config.title,
      catalogs: {
        paises: catalogos.paisOptions,
        ciudades: catalogos.ciudadOptions,
        departamentos: catalogos.departamentoOptionsParaComparar,
        municipios: catalogos.municipioOptionsParaComparar,
        industrias: catalogos.industriaOptions,
        tiposContacto: catalogos.tiposContactoOptions,
      },
      separated: maestroSeparado,
    });
  }, [
    apiMode,
    data,
    rawEntidadActual,
    values,
    config.sectionLabel,
    config.title,
    catalogos,
    maestroSeparado,
  ]);

  return { cambiosClienteRows, maestroSeparado };
}
