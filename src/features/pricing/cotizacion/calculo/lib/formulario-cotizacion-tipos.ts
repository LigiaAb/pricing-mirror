import type { Id } from "./tipos";

export type TipoFormularioCotizacion = "filtro" | "ingreso" | "edicion" | "lectura";

export type OpcionFormularioCotizacion = {
  value: Id;
  label: string;

  cod_tipo?: Id | null;
  cod_tipo_padre?: Id | null;

  cod_empresa?: Id | null;
  codEmpresaCc?: Id | null;
  cod_empresa_cc?: Id | null;

  cod_pais?: Id | null;

  cod_puntoenlace?: Id | null;
  cod_tipo_puntoenlace?: Id | null;
  codigo?: string | null;

  cod_continente?: Id | null;
  cod_continent?: Id | null;

  entidad_id?: Id | null;
  entidad_nombre?: string | null;
  codigo_entidad?: string | null;

  entidadcontacto_id?: Id | null;
  entidadcontacto_nombre?: string | null;
  entidadcontacto_email?: string | null;

  [key: string]: unknown;
};

export type CatalogosFormularioCotizacion = {
  empresas?: OpcionFormularioCotizacion[];
  centrosCosto?: OpcionFormularioCotizacion[];

  tiposTransporte?: OpcionFormularioCotizacion[];
  tiposServicio?: OpcionFormularioCotizacion[];

  tiposCarga?: OpcionFormularioCotizacion[];
  clasificacionesCarga?: OpcionFormularioCotizacion[];

  incoterms?: OpcionFormularioCotizacion[];
  tiposPago?: OpcionFormularioCotizacion[];

  paises?: OpcionFormularioCotizacion[];
  tiposPuntoEnlace?: OpcionFormularioCotizacion[];
  puntosEnlace?: OpcionFormularioCotizacion[];

  ciudades?: OpcionFormularioCotizacion[];
  continentes?: OpcionFormularioCotizacion[];

  clientes?: OpcionFormularioCotizacion[];
  contactos?: OpcionFormularioCotizacion[];

  /**
   * Carrier existe en el formulario legado, aunque GestionCotizacion
   * actualmente lo oculta tanto en filtro como en información.
   */
  proveedores?: OpcionFormularioCotizacion[];
};

export type ValoresFormulario = Record<string, unknown>;
