import { z } from "zod";
import { CACHE_SEMI_STATIC, CACHE_STATIC } from "@/shared/api/cache";
import { httpPublic } from "@/shared/api/client";
import { zId, zIdNull } from "@/shared/lib/zod-scalars";
import { ciudadSchema } from "./ciudades";
import { createCatalogo } from "./create-catalogo";
import { departamentoSchema } from "./departamentos";
import { industriaSchema } from "./industrias";
import { municipioSchema } from "./municipios";
import { paisSchema } from "./paises";
import { relacionTipoSchema } from "./relacion-tipo";

/**
 * Catálogos públicos (`/clientes/api/v2/*`) que consume la vista pública de la
 * carta de instrucciones. Autenticación por token de interacción vía
 * `shared/api/public-session` (la vista lo setea al montar).
 *
 * Los schemas son más laxos que los privados: el backend público expone menos
 * columnas por endpoint.
 */

export const paisesPublico = createCatalogo({
  nombre: "paises-publico",
  schema: paisSchema,
  endpoints: { lista: "/clientes/api/v2/listapaises" },
  map: (raw) => ({ ...raw, value: raw.cod_pais, label: raw.nombre_pais }),
  cache: CACHE_STATIC,
  client: httpPublic,
});

export const industriasPublico = createCatalogo({
  nombre: "industrias-publico",
  schema: industriaSchema,
  endpoints: { lista: "/clientes/api/v2/lista-industria" },
  cache: CACHE_STATIC,
  client: httpPublic,
});

export const ciudadesPublico = createCatalogo({
  nombre: "ciudades-publico",
  schema: ciudadSchema,
  endpoints: { lista: "/clientes/api/v2/lista-ciudad" },
  cache: CACHE_STATIC,
  habilitado: (filtros) => Boolean(filtros.cod_pais),
  client: httpPublic,
});

export const departamentosPublico = createCatalogo({
  nombre: "departamentos-publico",
  schema: departamentoSchema,
  endpoints: { lista: "/clientes/api/v2/lista-depto-x-pais" },
  cache: CACHE_STATIC,
  habilitado: (filtros) => Boolean(filtros.cod_pais),
  client: httpPublic,
});

export const municipiosPublico = createCatalogo({
  nombre: "municipios-publico",
  schema: municipioSchema,
  endpoints: { lista: "/clientes/api/v2/lista-municipios" },
  cache: CACHE_STATIC,
  habilitado: (filtros) => Boolean(filtros.cod_depto),
  client: httpPublic,
});

const tipoPublicoSchema = z.object({
  cod_tipo: zId,
  nom_tipo: z.string().catch(""),
  tipo_tabla: z.string().catch("").optional(),
  nomenclatura: z.string().catch("").optional(),
});

export interface TipoPublico {
  codTipo: string | number;
  nomTipo: string;
  tipoTabla: string;
  nomenclatura: string;
  value: string | number;
  label: string;
}

export const tiposPublico = createCatalogo({
  nombre: "lista-tipo-publico",
  schema: tipoPublicoSchema,
  endpoints: { lista: "/clientes/api/v2/lista-tipo" },
  map: (raw): TipoPublico => ({
    codTipo: raw.cod_tipo,
    nomTipo: raw.nom_tipo,
    tipoTabla: raw.tipo_tabla ?? "",
    nomenclatura: raw.nomenclatura ?? "",
    value: raw.cod_tipo,
    label: raw.nom_tipo,
  }),
  cache: CACHE_SEMI_STATIC,
  habilitado: (filtros) => Boolean(filtros.tipo_tabla),
  client: httpPublic,
});

export interface RelacionTipoPublico {
  codRelacionTipo: string | number;
  codTipo: string | number;
  value: string | number;
  label: string;
}

export const relacionTipoPublico = createCatalogo({
  nombre: "lista-relacion-tipo-publico",
  schema: relacionTipoSchema,
  endpoints: { lista: "/clientes/api/v2/lista-relacion-tipo" },
  map: (raw): RelacionTipoPublico => ({
    codRelacionTipo: raw.cod_relacion_tipo,
    codTipo: raw.cod_tipo,
    value: raw.cod_relacion_tipo ?? raw.cod_tipo,
    label: raw.tipo_desc ?? "",
  }),
  cache: CACHE_SEMI_STATIC,
  client: httpPublic,
});

const incotermPublicoSchema = z.object({
  incoterm_id: zId,
  nombre: z.string().catch(""),
  nombre_eng: z.string().catch("").optional(),
  codigo: zIdNull.optional(),
  descripcion: z.string().catch("").optional(),
});

export interface IncotermPublico {
  incotermId: string | number;
  codigo: string | number | null;
  nombre: string;
  nombreEng: string;
  value: string | number;
  label: string;
}

export const incotermsPublico = createCatalogo({
  nombre: "incoterms-publico",
  schema: incotermPublicoSchema,
  endpoints: { lista: "/clientes/api/v2/lista-incoterm" },
  map: (raw): IncotermPublico => ({
    incotermId: raw.incoterm_id,
    codigo: raw.codigo ?? null,
    nombre: raw.nombre,
    nombreEng: raw.nombre_eng ?? "",
    value: raw.incoterm_id,
    label: `${raw.codigo ?? ""} - ${raw.nombre_eng ?? ""} ( ${raw.nombre} )`,
  }),
  cache: CACHE_STATIC,
  client: httpPublic,
});
