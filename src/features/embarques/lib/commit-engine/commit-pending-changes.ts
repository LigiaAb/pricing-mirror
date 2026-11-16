/**
 * Orquestador del motor "Crear Coordinación" (Fase A.3): aplica a sus
 * endpoints reales los cambios que quedaron guardados en la carta
 * (`json_data_usuario`) para cada sección del flujo CTS — Shipper,
 * Consignatario, Producto (cargas), Facturación, Detalles y Fechas — antes de
 * asignar el correlativo/guía. Al final persiste la carta con los entidad_id
 * recién aplicados y `json_data_usuario: null` (reintentos idempotentes).
 */

import { unwrapEnvelope } from "@/shared/api/envelope";
import { logger } from "@/shared/lib/logger";
import { buildCoordPayload, getEmbarqueId } from "@/shared/lib/payload-utils";
import {
  DIRECCION_TIPO,
  NIT_COD_IDENTIFICACION,
  TIPO_ENTIDAD,
  TIPO_FECHA_RECOLECCION,
} from "../constantes";
import { commitEntidad } from "./commit-entidad";
import {
  assertOk,
  mapFacturacionMods,
  ROLE_ALIASES,
  ROLE_COORD_FIELDS,
  ROLE_NOMBRE_FALLBACK,
  ROLE_TIPO_ENTIDAD_NOMBRE,
  toNum,
} from "./helpers";
import {
  buildCargaPayload,
  construirDetallesOverrides,
  sincronizarCartaConOverrides,
} from "./payloads";
import type { CommitApi, CommitContext, CommitDeps, JsonRecord, RolCommit } from "./tipos";

async function postChecked(
  api: CommitApi,
  url: string,
  body: JsonRecord,
  accion: string,
): Promise<void> {
  assertOk(await api.post(url, body), accion);
}

/** lista-entidad tipo CLIENTE: detecta pre-cliente y aporta nombre/cod_tipo. */
async function fetchClienteEntidades(api: CommitApi, entidadIdCliente: unknown) {
  if (!entidadIdCliente) return [] as JsonRecord[];
  const response = await api.get("/api/appweb/lista-entidad", {
    params: { tipo_entidad: "CLIENTE", entidad_id: entidadIdCliente },
  });
  return unwrapEnvelope<JsonRecord>(response);
}

function candidatoEntidadRol(ctx: CommitContext, lc: JsonRecord, role: RolCommit): unknown {
  // El id de la carta puede venir vacío aunque la coordinación YA tenga una
  // entidad asignada (p.ej. un intento previo que creó la entidad sin
  // sincronizarla de vuelta a la carta): se toma también el id real de la
  // coordinación y, como última red, el preseleccionado que el formulario ya
  // muestra como válido (coordinación nueva donde nunca se tocó el selector).
  const embarqueData = ctx.embarqueData ?? {};
  if (role === "shipper") {
    return (
      lc.entidad_id_shipper ??
      embarqueData.entidad_id_shipper ??
      embarqueData.entidadIdShipper ??
      ctx.entidadIdShipperCoord
    );
  }
  return (
    lc.entidad_id_consignatario ??
    embarqueData.entidad_id_consignatario ??
    embarqueData.entidadIdConsignatario ??
    ctx.entidadIdConsignatarioCoord
  );
}

async function commitRoles(
  ctx: CommitContext,
  deps: CommitDeps,
  lc: JsonRecord,
  clienteNombre: string,
  coordOverrides: JsonRecord,
  base: { empresaId: number | null; centroCostoId: number | null },
): Promise<void> {
  const roles: RolCommit[] = ["shipper", "consignatario"];
  for (const role of roles) {
    const mods = lc[`carta_${role}`] as JsonRecord | undefined;
    const candidateEntidadId = candidatoEntidadRol(ctx, lc, role);

    // Sin id candidato y sin datos capturados no hay nada que procesar del rol.
    if (!candidateEntidadId && !mods) continue;

    const { entidadId, contactoId } = await commitEntidad(deps, {
      mods: mods || {},
      candidateEntidadId,
      entidadTipo: TIPO_ENTIDAD[role],
      tipoEntidadFiltro: role,
      nitCodIdentificacion: NIT_COD_IDENTIFICACION[role],
      addressCodTipoCandidates: [DIRECCION_TIPO.recoleccion],
      nombreFallback: ROLE_NOMBRE_FALLBACK[role](lc),
      aliases: ROLE_ALIASES[role],
      verifyExistence: true,
      allowCreate: true,
      clienteNombre,
      tipoEntidadNombre: ROLE_TIPO_ENTIDAD_NOMBRE[role],
      entidadIdCliente: ctx.entidadIdCliente,
      ...base,
    });

    if (entidadId) {
      coordOverrides[ROLE_COORD_FIELDS[role].entidadField] = entidadId;
      if (contactoId) coordOverrides[ROLE_COORD_FIELDS[role].contactoField] = contactoId;
    }
  }
}

async function commitFacturacion(
  ctx: CommitContext,
  deps: CommitDeps,
  lc: JsonRecord,
  clienteEntidades: JsonRecord[],
  coordOverrides: JsonRecord,
  base: { empresaId: number | null; centroCostoId: number | null },
): Promise<void> {
  // Corre siempre que haya entidadIdCliente (no solo con cambios), para poder
  // reportar contacto_id_cliente aunque nada se haya modificado.
  if (!ctx.entidadIdCliente) return;
  const facturacionCliente = (lc.carta_facturacion as JsonRecord | undefined)?.cliente;
  const esPreCliente = clienteEntidades.length === 0;
  const codTipoCliente =
    toNum(clienteEntidades[0]?.cod_tipo) ??
    (esPreCliente ? TIPO_ENTIDAD.preCliente : TIPO_ENTIDAD.cliente);
  const { contactoId } = await commitEntidad(deps, {
    mods: mapFacturacionMods(facturacionCliente) || {},
    candidateEntidadId: ctx.entidadIdCliente,
    entidadTipo: codTipoCliente,
    tipoEntidadFiltro: "CLIENTE",
    nitCodIdentificacion: NIT_COD_IDENTIFICACION.cliente,
    addressCodTipoCandidates: [DIRECCION_TIPO.facturacion, DIRECCION_TIPO.fiscal],
    // El cliente de la coordinación siempre existe: no se verifica ni se crea.
    verifyExistence: false,
    allowCreate: false,
    entidadIdCliente: ctx.entidadIdCliente,
    ...base,
  });
  if (contactoId) coordOverrides.contacto_id_cliente = contactoId;
}

async function commitCargas(
  ctx: CommitContext,
  api: CommitApi,
  embarqueIdNum: number | null,
): Promise<void> {
  const cargasCarta = ctx.jsonCartaCliente?.["lista-coordinacion-carga"];
  if (!Array.isArray(cargasCarta) || cargasCarta.length === 0) return;
  for (const fila of cargasCarta as JsonRecord[]) {
    const payload = buildCargaPayload(fila, embarqueIdNum, ctx.catalogos.tiposEmbalajeCatalog);
    if (fila.embCargaId) {
      await postChecked(
        api,
        "/api/appweb/actualizar-coordinacion-carga",
        { ...payload, emb_carga_id: Number.parseInt(String(fila.embCargaId), 10) || 0 },
        "actualizar la carga",
      );
    } else {
      await postChecked(
        api,
        "/api/appweb/insertar-coordinacion-carga",
        payload,
        "insertar la carga",
      );
    }
  }
}

async function commitFechaRecoleccion(
  ctx: CommitContext,
  api: CommitApi,
  lc: JsonRecord,
  embarqueIdNum: number | null,
): Promise<void> {
  const fechaRecoleccion = (lc.carta_fechas as JsonRecord | undefined)?.fecha_recoleccion;
  if (!fechaRecoleccion) return;
  const existing = (ctx.fechasMovData || []).find(
    (f) => Number(f.id_tipo_fecha ?? f.id_fecha_tipo) === TIPO_FECHA_RECOLECCION,
  );
  if (existing) {
    await postChecked(
      api,
      "/api/appweb/actualizar-coordinacion-fecha-mov",
      {
        id_fecha_reg_embarque: existing.id_fecha_reg_embarque ?? existing.idFechaRegEmbarque,
        embarque_id: embarqueIdNum,
        id_tipo_fecha: TIPO_FECHA_RECOLECCION,
        fecha: fechaRecoleccion,
        observacion: existing.observacion ?? "",
        estado_cod: "1",
      },
      "actualizar la fecha de recolección",
    );
  } else {
    await postChecked(
      api,
      "/api/appweb/insertar-coordinacion-fecha-mov",
      {
        embarque_id: embarqueIdNum,
        id_tipo_fecha: TIPO_FECHA_RECOLECCION,
        fecha: fechaRecoleccion,
        observacion: "",
        estado_cod: "1",
      },
      "crear la fecha de recolección",
    );
  }
}

/**
 * Aplica todos los cambios pendientes de la carta contra los endpoints reales.
 * Lanza en el primer paso que falle (assertOk) para no dejar la coordinación a
 * medio armar creyendo que todo salió bien.
 */
export async function ejecutarCommitPendingChanges(
  ctx: CommitContext,
  deps: CommitDeps,
): Promise<void> {
  const { api } = deps;
  const embarqueData = ctx.embarqueData ?? {};
  const embarqueIdNum = getEmbarqueId(embarqueData, ctx.embarqueId);
  const lc = ctx.cartaListaCoordinacion ?? {};
  const coordOverrides: JsonRecord = {};

  const base = {
    empresaId: toNum(embarqueData.empresa_id ?? embarqueData.empresaId ?? embarqueData.cod_empresa),
    centroCostoId: toNum(embarqueData.cencos_id ?? embarqueData.centroId ?? embarqueData.cod_cc),
  };

  // Nombre del cliente: detecta cuándo el shipper/consignatario ES el propio
  // cliente para reutilizar su entidad_id en vez de duplicarla.
  const clienteEntidades = await fetchClienteEntidades(api, ctx.entidadIdCliente);
  const clienteNombre = String(
    clienteEntidades[0]?.entidad_nombre ?? lc.entidad_nombre ?? lc.cliente ?? "",
  );

  await commitRoles(ctx, deps, lc, clienteNombre, coordOverrides, base);
  await commitFacturacion(ctx, deps, lc, clienteEntidades, coordOverrides, base);

  Object.assign(
    coordOverrides,
    construirDetallesOverrides(
      (lc.carta_facturacion as JsonRecord | undefined)?.detalles as JsonRecord | undefined,
      ctx.catalogos,
      embarqueData,
      ctx.cropaDocKeys,
    ),
  );

  await commitCargas(ctx, api, embarqueIdNum);
  await commitFechaRecoleccion(ctx, api, lc, embarqueIdNum);

  // Batch final a actualizar-coordinacion con los overrides acumulados.
  if (Object.keys(coordOverrides).length > 0) {
    const finalPayload = buildCoordPayload(embarqueData, coordOverrides, ctx.codUsuario);
    await postChecked(
      api,
      "/api/appweb/actualizar-coordinacion",
      finalPayload,
      "actualizar la coordinación",
    );
  }

  // Limpiar overlay: json_data final con los entidad_id aplicados sincronizados
  // y json_data_usuario: null, SIN cod_link_publico (workaround §4.A.2.5).
  // G18: este paso no tiene equivalente en el legacy (es una limpieza propia
  // del port) y corre DESPUÉS de que todo el trabajo de negocio real ya se
  // aplicó (roles/facturación/cargas/fechas/coordinación). Si falla, no debe
  // tumbar "Crear Coordinación" completo — el asesor ya obtuvo el resultado
  // esperado (guía asignada, estado avanzado); solo queda un draft de carta
  // sin limpiar, que el próximo guardado/consulta ya resuelve igual. Se
  // reporta para diagnóstico en vez de relanzar.
  if (ctx.jsonCartaCliente) {
    try {
      const jsonDataFinal = sincronizarCartaConOverrides(ctx.jsonCartaCliente, coordOverrides);
      assertOk(
        await deps.actualizarJsonCarta({
          json_data: jsonDataFinal,
          json_data_usuario: null,
          cod_cotizacion_cabecera: ctx.cotizacionCabeceraId,
        }),
        "limpiar el borrador de la carta",
      );
      await deps.refetchCartaCliente?.();
    } catch (error) {
      logger.warn("No se pudo limpiar el borrador de la carta tras Crear Coordinación", error);
    }
  }
}
