/**
 * Contratos del motor "Crear Coordinación" (Fase A.3 del plan de paridad):
 * aplica a sus endpoints reales los cambios que quedaron guardados como
 * borrador en la carta de instrucciones (`json_data_usuario`).
 *
 * El motor es lógica imperativa pura: recibe un cliente HTTP mínimo
 * (`CommitApi`) y los datos ya cargados por la vista (`CommitContext`), de
 * modo que los tests lo ejecutan completo con un API falso.
 */

export type JsonRecord = Record<string, unknown>;

/** Cliente HTTP mínimo que necesita el motor (inyectable en tests). */
export interface CommitApi {
  get(endpoint: string, options?: { params?: Record<string, unknown> }): Promise<unknown>;
  post(endpoint: string, body: unknown): Promise<unknown>;
}

/** Opción de catálogo con las variantes de clave que persisten carta/backend. */
export interface OpcionCatalogo {
  value?: unknown;
  label?: unknown;
  codTipo?: unknown;
  cod_tipo?: unknown;
  cod_relacion_tipo?: unknown;
  [key: string]: unknown;
}

export interface CommitCatalogos {
  tiposPagoCatalog?: OpcionCatalogo[];
  tiposCargaCatalog?: OpcionCatalogo[];
  tiposServicioCatalog?: OpcionCatalogo[];
  tiposEmbalajeCatalog?: OpcionCatalogo[];
  clasificacionCargaCatalog?: OpcionCatalogo[];
}

export type RolCommit = "shipper" | "consignatario";

export interface CommitContext {
  /** Coordinación mapeada (`Coordinacion` de features/coordinaciones). */
  embarqueData: JsonRecord | null | undefined;
  /** Carta fusionada (`json_data` + `json_data_usuario`). */
  jsonCartaCliente: JsonRecord | null | undefined;
  /**
   * Objeto `lista-coordinacion` DENTRO de la carta (con las secciones
   * carta_shipper/carta_consignatario/carta_facturacion/carta_fechas). No
   * confundir con la coordinación adaptada del mismo nombre en la vista.
   */
  cartaListaCoordinacion: JsonRecord | null | undefined;
  /** Fechas de movimiento ya cargadas (listar-coordinacion-fecha-mov). */
  fechasMovData: JsonRecord[] | null | undefined;
  catalogos: CommitCatalogos;
  /** Claves de los documentos CROPA de la sección Detalles. */
  cropaDocKeys: string[];
  codUsuario: string | number | null;
  entidadIdCliente: unknown;
  cotizacionCabeceraId: string | number | null;
  embarqueId: number | null;
  /** Preselección que el formulario ya muestra como válida (fallback D/A.3). */
  entidadIdShipperCoord: unknown;
  entidadIdConsignatarioCoord: unknown;
}

export interface CommitDeps {
  api: CommitApi;
  /** POST actualizar-json-link privado (sin cod_link_publico — workaround §4.A.2.5). */
  actualizarJsonCarta(payload: JsonRecord): Promise<unknown>;
  /** Entidades relacionadas al cliente (recuperar-datos-entidad-relacionada). */
  fetchEntidadesRelacionadas(params: JsonRecord): Promise<{ data: JsonRecord[] }>;
  refetchCartaCliente?: (() => Promise<unknown>) | undefined;
}

export interface ResultadoCommitEntidad {
  entidadId: number | null;
  contactoId: number | null;
}

export interface CommitEntidadParams {
  mods: JsonRecord;
  candidateEntidadId: unknown;
  entidadTipo: number;
  tipoEntidadFiltro: string;
  nitCodIdentificacion: number;
  addressCodTipoCandidates: number[];
  nombreFallback?: string;
  aliases?: ReadonlySet<string>;
  verifyExistence?: boolean;
  allowCreate?: boolean;
  clienteNombre?: string;
  tipoEntidadNombre?: string;
  entidadIdCliente: unknown;
  empresaId: number | null;
  centroCostoId: number | null;
}
