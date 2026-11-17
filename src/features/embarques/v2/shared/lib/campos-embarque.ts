/* ==========================================================================
 * CAMPOS DE LA INFORMACIÓN DEL EMBARQUE
 *
 * Los mismos campos que muestra la CTS del módulo actual (clave, nombre,
 * obligatorio, tipo de dato y opciones fijas), agrupados por sus pasos
 * (`STEPS_CTS` en components/cts-detalle/secciones-wizard-privado.tsx). Gastos y
 * Documentos no van aquí (los archivos están en la tab Archivos) y Seguimiento
 * es el tracking. El diseño es de v2: una card por paso que combina varios
 * datos (`general/components/pasos/paso-informacion.tsx`).
 *
 * Origen (módulo actual, solo referencia):
 *   Shipper / Consignatario → public/secciones/entidad-public-form/fields.ts y model.ts
 *   Notificación            → public/secciones/notificaciones-publicas.tsx
 *   Producto                → public/secciones/cargas-publicas* y secciones/carga-form-dialog.tsx
 *   Facturación             → public/secciones/facturacion-publica.tsx
 *   Detalles                → public/secciones/detalles-publica-model.ts
 *   Fechas                  → fechas-publicas, rutas y fechas de movimiento (ver CAMPOS_FECHAS)
 *   Rutas                   → secciones/rutas.tsx y secciones/ruta-dialog.tsx
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
  /** Actividad del Excel de procesos que registra el dato (`ACTIVIDADES_TRACKING`). */
  actividad?: string;
  /** Fechas: se muestra aunque no tenga valor ("—"); las demás solo si tienen valor. */
  mostrarSiempre?: boolean;
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

/** Notificación: `NOTIFICACIONES_FIELDS` (en la CTS privada es de consulta). */
export const CAMPOS_NOTIFICACION: readonly CampoEmbarque[] = [
  { key: "nombre", label: "Nombre", requerido: true },
  { key: "email", label: "Email", requerido: true },
  { key: "telefono", label: "Teléfono", requerido: true },
  { key: "telefonoEmergencia", label: "Teléfono de emergencia" },
];

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
  // CROPA_DOCS (lib/constantes.ts); solo si algún gasto tiene cod_rubro 127 (`showCropaDocs`).
  {
    key: "documentosCropa",
    label: "Documentos CROPA",
    tipo: "casillas",
    requerido: true,
    opciones: ["Deprex", "DUA Complementaria", "DUA Definitiva", "DUA Simplificada", "Otros"],
  },
  { key: "instruccionesManejo", label: "Instrucciones de manejo", tipo: "area" },
];

/**
 * Producto (cada carga): `carga-form-dialog`. El CW lo calcula la CTS
 * (`normalizeCargaRows`) y lo muestra en la tabla con el "CW total".
 */
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
  { key: "tipoEmbalaje", label: "Tipo embalaje", tipo: "catalogo", requerido: true },
  { key: "partidaArancelaria", label: "Partida arancelaria", requerido: true },
  { key: "regimenAduanal", label: "Régimen aduanal", tipo: "catalogo", requerido: true },
  { key: "cw", label: "CW (kg)", tipo: "numero", soloLectura: true },
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

/**
 * Fechas: todas las del embarque, en el orden del proceso. La card muestra las
 * que tienen valor y, aunque no tengan, las `mostrarSiempre` (Recolección, ETD,
 * ATD, ETA y ATA, con "—"). `actividad` = actividad del Excel de procesos
 * ("Tracking-Expo-Aereo-6Pasos.xlsx") que la registra.
 *
 * Con dato en el módulo actual (`key` = nombre del dato):
 *   fechaInicio          → columna "Fecha Inicio" (pages/coordinaciones-columns-base.tsx)
 *   fecha_recoleccion    → `fechas-publicas` (CTS, gasto cod_rubro 12); fecha-mov tipo 266
 *   fecha_salida         → ETD: salida del primer tramo (secciones/rutas.tsx)
 *   fecha_llegada        → ETA: llegada del último tramo (secciones/rutas.tsx)
 *   fecha_entrega_combex → fecha-mov tipo 324 (`TIPO_FECHA_ENTREGA_COMBEX`, seleccionar-destino)
 *
 * Solo del Excel (sin dato en el módulo actual; `key` propuesta):
 *   fecha_envio_reserva     → OPS 2.2  "Registrar fecha y hora de envío"
 *   fecha_recepcion_bodega  → Bodega 0.1 "Registrar fecha, hora y responsable"
 *   fecha_salida_real       → CBX 12.1 "Registrar vuelo y fecha reales"
 *   fecha_aviso_salida      → CBX 12.3 "Registrar fecha del correo"
 *   fecha_nueva_salida      → CBX E2 "Indicar motivo y nueva fecha" (excepción; OPS E1 la reserva)
 *   fecha_llegada_real      → CBX 14.1 "Registrar fecha y hora"
 */
export const CAMPOS_FECHAS: readonly CampoEmbarque[] = [
  { key: "fechaInicio", label: "Fecha Inicio", tipo: "fecha-hora", soloLectura: true },
  {
    key: "fecha_recoleccion",
    label: "Fecha de Recolección",
    tipo: "fecha",
    requerido: true,
    actividad: "OPS 0.1",
    mostrarSiempre: true,
  },
  {
    key: "fecha_envio_reserva",
    label: "Envío de solicitud de reserva",
    tipo: "fecha-hora",
    actividad: "OPS 2.2",
  },
  {
    key: "fecha_recepcion_bodega",
    label: "Recepción en bodega",
    tipo: "fecha-hora",
    actividad: "Bodega 0.1",
  },
  {
    key: "fecha_entrega_combex",
    label: "Fecha de entrega COMBEX",
    tipo: "fecha",
    actividad: "CBX 8.1",
  },
  {
    key: "fecha_salida",
    label: "Estimated time of departure (ETD)",
    tipo: "fecha",
    actividad: "OPS 3.1",
    mostrarSiempre: true,
  },
  {
    key: "fecha_salida_real",
    label: "Actual time of departure (ATD)",
    tipo: "fecha-hora",
    actividad: "CBX 12.1",
    mostrarSiempre: true,
  },
  {
    key: "fecha_aviso_salida",
    label: "Aviso de salida al cliente",
    tipo: "fecha-hora",
    actividad: "CBX 12.3",
  },
  { key: "fecha_nueva_salida", label: "Nueva fecha de salida", tipo: "fecha", actividad: "CBX E2" },
  {
    key: "fecha_llegada",
    label: "Estimated time of arrival (ETA)",
    tipo: "fecha",
    mostrarSiempre: true,
  },
  {
    key: "fecha_llegada_real",
    label: "Actual time of arrival (ATA)",
    tipo: "fecha-hora",
    actividad: "CBX 14.1",
    mostrarSiempre: true,
  },
];
