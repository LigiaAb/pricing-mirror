/* ==========================================================================
 * CAMPOS DE LA INFORMACIÓN DEL EMBARQUE
 *
 * Los mismos campos que ya tiene el módulo actual de embarques (clave, nombre,
 * obligatorio, tipo de dato y opciones fijas). Solo se toman los CAMPOS: ni la
 * agrupación ni el diseño del módulo actual. Dónde y cómo se muestran lo decide
 * v2 (`general/components/pasos/paso-informacion.tsx`).
 *
 * Origen (módulo actual, solo referencia):
 *   Shipper / Consignatario → public/secciones/entidad-public-form/fields.ts y model.ts
 *   Facturación             → public/secciones/facturacion-publica.tsx
 *   Producto                → secciones/carga-form-dialog.tsx
 *   Detalles                → public/secciones/detalles-publica-model.ts
 *   Rutas                   → secciones/ruta-dialog.tsx
 *   Fechas                  → public/secciones/fechas-publicas.tsx y secciones/fechas.tsx
 *   Cod File                → info-coordinacion/info-coordinacion.tsx
 *
 * `key` = nombre del dato en el módulo actual: al conectar la API se usa tal cual.
 * ========================================================================== */

import type { CampoGestion } from "./interacciones";

export type CampoEmbarque = CampoGestion & {
  /** Clave del dato en el módulo actual. */
  key: string;
  /** Solo consulta también al editar (en el módulo actual viene del maestro). */
  soloLectura?: boolean;
};

export const CAMPO_COD_FILE: CampoEmbarque = {
  key: "cod_file",
  label: "Cod File",
  soloLectura: true,
};

/** Shipper y Consignatario: `buildEntidadPublicFields` (obligatorios: `ENTIDAD_PUBLIC_REQUIRED_FIELDS`). */
function camposEntidad(titulo: string): readonly CampoEmbarque[] {
  return [
    { key: "entidad_id", label: `Seleccionar ${titulo}`, tipo: "catalogo", requerido: true },
    { key: "entidad_nombre", label: "Nombre", requerido: true },
    { key: "entidad_pais", label: "País", tipo: "catalogo", requerido: true },
    { key: "direccion_recoleccion_ciudad", label: "Ciudad", tipo: "catalogo" },
    { key: "entidad_industria", label: "Industria", tipo: "catalogo", requerido: true },
    {
      key: "direccion_recoleccion",
      label: "Dirección de Recolección",
      tipo: "area",
      requerido: true,
    },
    {
      key: "direccion_recoleccion_pais",
      label: "País",
      tipo: "catalogo",
      requerido: true,
      soloLectura: true,
    },
    { key: "direccion_recoleccion_depto", label: "Departamento", tipo: "catalogo" },
    { key: "direccion_recoleccion_muni", label: "Municipio", tipo: "catalogo" },
    { key: "entidadcontacto_id", label: "Seleccionar Contacto", tipo: "catalogo" },
    { key: "_contacto_tipo_list", label: "Tipo(s) de Contacto", tipo: "casillas" },
    { key: "entidad_contacto_nombre", label: "Nombre Contacto", requerido: true },
    { key: "entidad_contacto_email", label: "Email", requerido: true },
    { key: "entidad_contacto_telefono", label: "Teléfono", requerido: true },
    { key: "entidad_nit", label: "NIT", requerido: true },
  ];
}

export const CAMPOS_SHIPPER = camposEntidad("Shipper");
export const CAMPOS_CONSIGNATARIO = camposEntidad("Consignatario");

/** Facturación: en el módulo actual es siempre de consulta (refleja el maestro del cliente). */
export const CAMPOS_FACTURACION: readonly CampoEmbarque[] = [
  { key: "cliente", label: "Nombre", requerido: true, soloLectura: true },
  { key: "direccionFiscal", label: "Dirección Fiscal", tipo: "area", soloLectura: true },
  { key: "clienteContacto", label: "Nombre Contacto", soloLectura: true },
  { key: "clienteContactoEmail", label: "Email", soloLectura: true },
  { key: "clienteContactoTelefono", label: "Teléfono", soloLectura: true },
  { key: "numero", label: "NIT", requerido: true, soloLectura: true },
];

/** Detalles: `buildDetalleFields`. */
export const CAMPOS_DETALLES: readonly CampoEmbarque[] = [
  { key: "tipoPago", label: "Tipo de pago", tipo: "catalogo", requerido: true },
  { key: "tipoCarga", label: "Tipo de carga", tipo: "catalogo", requerido: true },
  { key: "incoterm", label: "Incoterm", tipo: "catalogo" },
  { key: "servicio", label: "Tipo de servicio", tipo: "catalogo", requerido: true },
  { key: "clasificacionCarga", label: "Clasificación de carga", tipo: "catalogo" },
  // PELIGROSIDAD_OPTIONS (V / C); en el módulo actual va sin etiqueta.
  {
    key: "peligrosidad",
    label: "Peligrosidad",
    tipo: "casillas",
    opciones: ["Carga Valiosa", "Cobertura de Seguro"],
  },
  // CROPA_DOCS (lib/constantes.ts)
  {
    key: "documentosCropa",
    label: "Documentos CROPA",
    tipo: "casillas",
    requerido: true,
    opciones: ["Deprex", "DUA Complementaria", "DUA Definitiva", "DUA Simplificada", "Otros"],
  },
  { key: "instruccionesManejo", label: "Instrucciones de manejo", tipo: "area" },
];

/** Producto (cada carga): `carga-form-dialog`. */
export const CAMPOS_PRODUCTO: readonly CampoEmbarque[] = [
  { key: "cantidad", label: "Cantidad (bultos)", tipo: "numero", requerido: true },
  { key: "pesoTotal", label: "Peso total (kg)", tipo: "numero", requerido: true },
  { key: "unidadMedida", label: "Unidad de medida", tipo: "catalogo", requerido: true },
  { key: "largo", label: "Largo", tipo: "numero" },
  { key: "alto", label: "Alto", tipo: "numero" },
  { key: "ancho", label: "Ancho", tipo: "numero" },
  { key: "descripcion", label: "Descripción", tipo: "area", requerido: true },
  { key: "valor", label: "Valor declarado", tipo: "numero", requerido: true },
  { key: "paisOrigenId", label: "País Origen", tipo: "catalogo", requerido: true },
  { key: "partidaArancelaria", label: "Partida arancelaria", requerido: true },
];

/** Rutas (cada tramo): `ruta-dialog`. */
export const CAMPOS_RUTA: readonly CampoEmbarque[] = [
  { key: "codEntidadProv", label: "Aerolínea", tipo: "catalogo" },
  { key: "codPaisOrigen", label: "País Origen", tipo: "catalogo", requerido: true },
  { key: "puertoIdOrigen", label: "Aeropuerto Origen", tipo: "catalogo", requerido: true },
  { key: "codPaisDestino", label: "País Destino", tipo: "catalogo", requerido: true },
  { key: "puertoIdDestino", label: "Aeropuerto Destino", tipo: "catalogo", requerido: true },
  { key: "flightNumber", label: "Nro. Vuelo" },
];

/** Fechas: recolección (`fechas-publicas`) y fechas de movimiento (`fechas`). */
export const CAMPOS_FECHAS: readonly CampoEmbarque[] = [
  { key: "fecha_recoleccion", label: "Fecha de Recolección", tipo: "fecha", requerido: true },
  { key: "id_tipo_fecha", label: "Tipo de Fecha", tipo: "catalogo", requerido: true },
  { key: "fecha", label: "Fecha", tipo: "fecha", requerido: true },
  { key: "observacion", label: "Observación", tipo: "area" },
];
