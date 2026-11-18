/* ==========================================================================
 * FORMATOS DE SOLICITUD DE RESERVA POR PROVEEDOR (SOLO MAQUETA)
 *
 * OPS 2.1 "Preparar solicitud de reserva": cada aerolínea pide su propio
 * formato. Fuente: "FLUJO_AEREO_17092026_version_1.xlsx", hojas "Reserva
 * Iberia", "Reserva LAN" y "Reserva Delta" (mismos datos y orden).
 *
 * `proveedor` = nombre con el que se busca la aerolínea en su catálogo (por
 * nombre, no por código). Sin formato para la aerolínea: formulario general
 * de OPS 2.1 (`gestion-actividades.ts`).
 *
 * `key` = mismo dato que en Información (se consulta si ya se ingresó).
 * Pendiente: formato del documento que se genera (Excel, PDF, Word…) (#127).
 * ========================================================================== */

import type { CampoGestion } from "../../shared/lib/interacciones";

export type FormatoReserva = {
  /** Nombre del formato en pantalla. */
  nombre: string;
  /** Nombre de la aerolínea en su catálogo (búsqueda por nombre). */
  proveedor: string;
  /** Cómo es el documento del Excel (referencia para generarlo). */
  documento: string;
  campos: readonly CampoGestion[];
};

const PP_CC: CampoGestion = {
  label: "PP / CC",
  tipo: "seleccion",
  requerido: true,
  opciones: ["PP", "CC"],
};

export const FORMATOS_RESERVA: readonly FormatoReserva[] = [
  {
    nombre: "Iberia",
    proveedor: "IBERIA",
    documento: "Formulario de dos columnas (dato · valor)",
    campos: [
      { label: "Fecha de entrega en aeropuerto", tipo: "fecha", requerido: true },
      {
        key: "fechas.fecha_salida",
        label: "Fecha de salida deseada",
        tipo: "fecha",
        requerido: true,
      },
      { label: "Número de AWB", requerido: true },
      {
        key: "rutas.puertoIdDestino",
        label: "Aeropuerto Destino",
        tipo: "catalogo",
        requerido: true,
      },
      { key: "cargas.pesoTotal", label: "Peso total (kg)", tipo: "numero", requerido: true },
      { label: "Peso por pieza (kg)", tipo: "numero" },
      { key: "cargas.cantidad", label: "Cantidad (bultos)", tipo: "numero", requerido: true },
      { key: "cargas.largo", label: "Largo", tipo: "numero" },
      { key: "cargas.ancho", label: "Ancho", tipo: "numero" },
      { key: "cargas.alto", label: "Alto", tipo: "numero" },
      { label: "Unidad de medidas", tipo: "seleccion", opciones: ["CMS", "PULGADAS"] },
      {
        key: "cargas.descripcion",
        label: "Naturaleza de la carga",
        tipo: "area",
        requerido: true,
      },
      { key: "cargas.partidaArancelaria", label: "Partida arancelaria", requerido: true },
      { label: "Tarifa neta / spot autorizada", tipo: "numero" },
      { label: "Temperatura (perecedera)" },
      PP_CC,
      { label: "Número UN (peligrosa)" },
      { label: "Clase (peligrosa)" },
      { label: "Packing instructions (peligrosa)" },
      { label: "Agencia de carga (No. IATA)" },
      { key: "shipper.entidad_id", label: "Exportador", tipo: "catalogo", requerido: true },
      {
        key: "consignatario.entidad_id",
        label: "Consignatario",
        tipo: "catalogo",
        requerido: true,
      },
      { label: "EORI / registro tributario del consignatario", requerido: true },
      { label: "Requerimiento especial de manejo", tipo: "area" },
    ],
  },
  {
    nombre: "LATAM (LAN)",
    proveedor: "LATAM",
    documento: "Una fila por guía (MAWB + HAWB), columnas en inglés",
    campos: [
      { label: "Agencia" },
      { label: "Shipper MAWB", tipo: "catalogo", requerido: true },
      { label: "Dirección shipper MAWB", tipo: "area" },
      { label: "Consignee MAWB", tipo: "catalogo", requerido: true },
      { label: "Dirección consignee MAWB", tipo: "area" },
      { label: "Prefijo", requerido: true },
      { label: "No. MAWB", requerido: true },
      { label: "No. HAWB", requerido: true },
      { key: "shipper.entidad_id", label: "Shipper HAWB", tipo: "catalogo", requerido: true },
      { key: "shipper.entidad_contacto_telefono", label: "Teléfono shipper" },
      { key: "shipper.direccion_recoleccion", label: "Dirección shipper", tipo: "area" },
      { key: "shipper.direccion_recoleccion_ciudad", label: "Ciudad shipper", tipo: "catalogo" },
      { key: "shipper.direccion_recoleccion_pais", label: "País shipper", tipo: "catalogo" },
      { key: "shipper.direccion_recoleccion_depto", label: "Estado shipper", tipo: "catalogo" },
      { label: "ZIP shipper" },
      {
        key: "consignatario.entidad_id",
        label: "Consignee HAWB",
        tipo: "catalogo",
        requerido: true,
      },
      { key: "consignatario.entidad_contacto_telefono", label: "Teléfono consignee" },
      { key: "consignatario.direccion_recoleccion", label: "Dirección consignee", tipo: "area" },
      {
        key: "consignatario.direccion_recoleccion_ciudad",
        label: "Ciudad consignee",
        tipo: "catalogo",
      },
      {
        key: "consignatario.direccion_recoleccion_pais",
        label: "País consignee",
        tipo: "catalogo",
      },
      {
        key: "consignatario.direccion_recoleccion_depto",
        label: "Estado consignee",
        tipo: "catalogo",
      },
      { label: "ZIP consignee" },
      { label: "FB" },
      { label: "Piezas reservadas", tipo: "numero", requerido: true },
      { key: "cargas.cantidad", label: "Cantidad (bultos)", tipo: "numero", requerido: true },
      { label: "Dimensiones (ej. 1= 25*21*25)", requerido: true },
      { key: "cargas.pesoTotal", label: "Peso total (kg)", tipo: "numero", requerido: true },
      { label: "Código" },
      { key: "cargas.descripcion", label: "Descripción", tipo: "area", requerido: true },
      { key: "fechas.fecha_salida", label: "Fecha de salida", tipo: "fecha", requerido: true },
      {
        key: "rutas.puertoIdOrigen",
        label: "Aeropuerto Origen",
        tipo: "catalogo",
        requerido: true,
      },
      {
        key: "rutas.puertoIdDestino",
        label: "Aeropuerto Destino",
        tipo: "catalogo",
        requerido: true,
      },
      { label: "Naturaleza y cantidades (corte de la guía)", tipo: "area" },
    ],
  },
  {
    nombre: "Delta Cargo",
    proveedor: "DELTA",
    documento: "Formulario de dos columnas (dato · valor)",
    campos: [
      { label: "No. AWB", requerido: true },
      {
        key: "rutas.puertoIdDestino",
        label: "Aeropuerto Destino",
        tipo: "catalogo",
        requerido: true,
      },
      { key: "cargas.cantidad", label: "Cantidad (bultos)", tipo: "numero", requerido: true },
      { key: "cargas.pesoTotal", label: "Peso total (kg)", tipo: "numero", requerido: true },
      { key: "cargas.descripcion", label: "Commodity", tipo: "area", requerido: true },
      { key: "cargas.partidaArancelaria", label: "Partida arancelaria" },
      { label: "Medidas (ej. 02=37*24*30)", requerido: true },
      { key: "shipper.entidad_id", label: "Shipper", tipo: "catalogo", requerido: true },
      {
        key: "consignatario.entidad_id",
        label: "Consignatario",
        tipo: "catalogo",
        requerido: true,
      },
      { label: "EORI (carga para Europa)" },
      PP_CC,
      { key: "fechas.fecha_salida", label: "Fecha de salida", tipo: "fecha", requerido: true },
    ],
  },
];
