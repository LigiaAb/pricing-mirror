/* ==========================================================================
 * DATOS DE EJEMPLO (SOLO MAQUETA)
 *
 * Exportación aérea (el tracking actual es el de Expo Aéreo).
 * Se eliminan cuando exista la API de embarques (`v2/embarques/api`).
 * ========================================================================== */

import type { ArchivoEmbarque, EmbarqueMaqueta, InformacionEmbarque } from "../../shared/lib/tipos";

export const EMBARQUES_MAQUETA: EmbarqueMaqueta[] = [
  {
    codFile: "000101",
    coordinacion: 5101,
    cod_file: "000101",
    estadoId: 1,
    seg_coord_id: 9101,
    estado_id_tracking: 0,
    id: 1001,
    cliente: "CROPA DSV",
    tipoTransporte: "AÉREO",
    origen: "Guatemala, GT",
    destino: "Miami, US",
    carrier: "AVIANCA CARGO",
    etd: "02-11-2026",
    eta: "03-11-2026",
    estado: "EN PROCESO",
    pasoActual: 3,
  },
  {
    codFile: "000102",
    coordinacion: 5102,
    cod_file: "000102",
    estadoId: 1,
    seg_coord_id: 9102,
    estado_id_tracking: 0,
    id: 1002,
    cliente: "DISTRIBUIDORA ABC",
    tipoTransporte: "AÉREO",
    origen: "Guatemala, GT",
    destino: "Madrid, ES",
    carrier: "IBERIA CARGO",
    etd: "14-11-2026",
    eta: "15-11-2026",
    estado: "EN PROCESO",
    pasoActual: 5,
  },
  {
    codFile: "000103",
    coordinacion: 5103,
    cod_file: "000103",
    estadoId: 1,
    seg_coord_id: 9103,
    estado_id_tracking: 0,
    id: 1003,
    cliente: "IMPORTADORA XYZ",
    tipoTransporte: "AÉREO",
    origen: "Guatemala, GT",
    destino: "Ciudad de México, MX",
    carrier: "AEROMÉXICO CARGO",
    etd: "16-11-2026",
    eta: "17-11-2026",
    estado: "NUEVO",
    pasoActual: 1,
  },
  {
    codFile: "000104",
    coordinacion: 5104,
    cod_file: "000104",
    estadoId: 1,
    seg_coord_id: 9104,
    estado_id_tracking: 0,
    id: 1004,
    cliente: "COMERCIAL DEL SUR",
    tipoTransporte: "AÉREO",
    origen: "Guatemala, GT",
    destino: "Los Ángeles, US",
    carrier: "COPA CARGO",
    etd: "20-10-2026",
    eta: "21-10-2026",
    estado: "CERRADO",
    pasoActual: 6,
  },
];

/**
 * Archivos de cada embarque (por `id`), para la tab Archivos.
 * Subidos en la actividad que los pide o en el tracking interactivo.
 */
export const ARCHIVOS_MAQUETA: Record<number, ArchivoEmbarque[]> = {
  1001: [
    {
      id: 1,
      nombre: "reserva-avianca-000101.pdf",
      tipo: "Confirmación de reserva",
      origen: "tracking",
      paso: 1,
      usuario: "jlopez",
      fecha: "28-10-2026 10:15",
    },
    {
      id: 2,
      nombre: "comprobante-aduana-000101.pdf",
      tipo: "Comprobante",
      origen: "actividad",
      actividad: "OPS 5.3",
      paso: 2,
      usuario: "jlopez",
      fecha: "30-10-2026 16:40",
    },
    {
      id: 3,
      nombre: "carga-recibida-01.jpg",
      tipo: "Fotografía",
      origen: "actividad",
      actividad: "Bodega 7.5",
      paso: 3,
      usuario: "mperez",
      fecha: "01-11-2026 09:05",
    },
  ],
  1002: [
    {
      id: 4,
      nombre: "pesaje-terminal-000102.pdf",
      tipo: "Comprobante",
      origen: "actividad",
      actividad: "CBX 8.3",
      paso: 4,
      usuario: "rgarcia",
      fecha: "12-11-2026 11:20",
    },
    {
      id: 5,
      nombre: "hojas-seguridad-000102.pdf",
      tipo: "Hojas de seguridad",
      origen: "actividad",
      actividad: "CBX 10.1",
      paso: 4,
      usuario: "rgarcia",
      fecha: "12-11-2026 15:02",
    },
    {
      id: 6,
      nombre: "guia-master-000102.pdf",
      tipo: "Guía aérea",
      origen: "tracking",
      paso: 5,
      usuario: "jlopez",
      fecha: "14-11-2026 08:30",
    },
  ],
};

/**
 * Ciudad y país de cada destino de la maqueta (Rutas y Consignatario se
 * escriben con nombres, como los muestra la CTS al resolver los catálogos).
 */
const DESTINOS_MAQUETA: Record<string, { ciudad: string; pais: string }> = {
  "Miami, US": {
    ciudad: "Miami",
    pais: "Estados Unidos",
  },
  "Madrid, ES": {
    ciudad: "Madrid",
    pais: "España",
  },
  "Ciudad de México, MX": {
    ciudad: "Ciudad de México",
    pais: "México",
  },
  "Los Ángeles, US": {
    ciudad: "Los Ángeles",
    pais: "Estados Unidos",
  },
};

/** Código de vuelo de ejemplo por aerolínea (para que coincida con el carrier). */
const VUELOS_MAQUETA: Record<string, string> = {
  "AVIANCA CARGO": "AV 571",
  "IBERIA CARGO": "IB 6342",
  "AEROMÉXICO CARGO": "AM 663",
  "COPA CARGO": "CM 418",
};

/** Un día antes de una fecha `DD-MM-AAAA` (recolección de ejemplo antes del ETD). */
function diaAnterior(fecha: string): string | undefined {
  const [dia, mes, anio] = fecha.split("-").map(Number);
  if (!dia || !mes || !anio) return undefined;
  const anterior = new Date(anio, mes - 1, dia - 1);
  const dos = (valor: number) => String(valor).padStart(2, "0");
  return `${dos(anterior.getDate())}-${dos(anterior.getMonth() + 1)}-${anterior.getFullYear()}`;
}

/**
 * Información de un embarque (tab Información): solo los datos que muestra la
 * CTS del módulo actual (`shared/lib/campos-embarque.ts`). Toma lo que ya tiene
 * la fila (cliente, carrier, destino) y completa con ejemplos solo los datos que
 * se escriben a mano (nombres, NIT, direcciones, contactos, cargas) o que son
 * opciones fijas del módulo actual (peligrosidad, documentos CROPA). Los que
 * salen de catálogos que aún no se consultan (industria, tipos de contacto,
 * pago, carga, incoterm, servicio, clasificación, unidad de medida, embalaje,
 * régimen y aeropuertos) quedan vacíos ("—") hasta conectar la API.
 */
export function informacionMaqueta(embarque: EmbarqueMaqueta): InformacionEmbarque {
  const destino = DESTINOS_MAQUETA[embarque.destino];
  return {
    shipper: {
      entidad_nombre: "AGROEXPORTADORA LOS ALTOS, S.A.",
      entidad_nit: "1234567-8",
      entidad_pais: "Guatemala",
      direccion_recoleccion: "Km 17.5 Carretera a El Salvador, Bodega 4",
      direccion_recoleccion_muni: "Santa Catarina Pinula",
      direccion_recoleccion_depto: "Guatemala",
      direccion_recoleccion_pais: "Guatemala",
      entidad_contacto_nombre: "Ana Morales",
      entidad_contacto_email: "amorales@losaltos.com.gt",
      entidad_contacto_telefono: "+502 2233-4455",
    },
    consignatario: {
      entidad_nombre: "GLOBAL FRESH IMPORTS LLC",
      entidad_nit: "98-7654321",
      entidad_pais: destino?.pais,
      direccion_recoleccion: "1200 Commerce Ave, Suite 210",
      direccion_recoleccion_ciudad: destino?.ciudad,
      direccion_recoleccion_pais: destino?.pais,
      entidad_contacto_nombre: "Carlos Rivera",
      entidad_contacto_email: "crivera@importer.com",
      entidad_contacto_telefono: "+1 305 555 0142",
    },
    notificacion: {
      nombre: "Carlos Rivera",
      email: "crivera@importer.com",
      telefono: "+1 305 555 0142",
      telefonoEmergencia: "+1 305 555 0199",
    },
    cargas: [
      {
        descripcion: "Arveja china fresca",
        cantidad: "120",
        pesoTotal: "1,450.00",
        largo: "60",
        alto: "30",
        ancho: "40",
        valor: "8,700.00",
        paisOrigenId: "Guatemala",
        partidaArancelaria: "0708.10.00",
        // max(peso 1,450, volumétrico 120 × 60 × 30 × 40 / 6000 = 1,440)
        cw: "1,450.00",
      },
      {
        descripcion: "Ejote francés",
        cantidad: "40",
        pesoTotal: "380.50",
        largo: "50",
        alto: "25",
        ancho: "35",
        valor: "2,100.00",
        paisOrigenId: "Guatemala",
        partidaArancelaria: "0708.20.00",
        // max(peso 380.50, volumétrico 40 × 50 × 25 × 35 / 6000 = 292)
        cw: "380.50",
      },
    ],
    facturacion: {
      cliente: embarque.cliente,
      numero: "7654321-0",
      direccionFiscal: "6a. Avenida 12-34 Zona 10, Guatemala",
      clienteContacto: "Luis Méndez",
      clienteContactoEmail: "lmendez@cliente.com.gt",
      clienteContactoTelefono: "+502 2211-0099",
    },
    detalles: {
      peligrosidad: ["Cobertura de Seguro"],
      documentosCropa: ["DUA Definitiva"],
      instruccionesManejo: "Mantener refrigerado entre 2 °C y 8 °C. No apilar.",
    },
    fechas: { fecha_recoleccion: diaAnterior(embarque.etd) },
    rutas: [
      {
        codEntidadProv: embarque.carrier,
        codPaisOrigen: "Guatemala",
        codPaisDestino: destino?.pais,
        flightNumber: VUELOS_MAQUETA[embarque.carrier],
      },
    ],
  };
}
