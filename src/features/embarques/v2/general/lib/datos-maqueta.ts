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
 * Información de un embarque (tab Información). Toma lo que ya tiene la fila
 * (cliente, carrier, origen, destino, ETD/ETA) y completa el resto con ejemplos.
 */
export function informacionMaqueta(embarque: EmbarqueMaqueta): InformacionEmbarque {
  const [ciudadDestino = embarque.destino, paisDestino = ""] = embarque.destino.split(", ");
  return {
    shipper: {
      entidad_nombre: "AGROEXPORTADORA LOS ALTOS, S.A.",
      entidad_nit: "1234567-8",
      entidad_industria: "Agrícola",
      entidad_pais: "Guatemala",
      direccion_recoleccion: "Km 17.5 Carretera a El Salvador, Bodega 4",
      direccion_recoleccion_muni: "Santa Catarina Pinula",
      direccion_recoleccion_depto: "Guatemala",
      direccion_recoleccion_pais: "Guatemala",
      entidad_contacto_nombre: "Ana Morales",
      _contacto_tipo_list: ["Operativo", "Facturación"],
      entidad_contacto_email: "amorales@losaltos.com.gt",
      entidad_contacto_telefono: "+502 2233-4455",
    },
    consignatario: {
      entidad_nombre: "GLOBAL FRESH IMPORTS LLC",
      entidad_nit: "98-7654321",
      entidad_industria: "Comercio",
      entidad_pais: paisDestino,
      direccion_recoleccion: "1200 NW 78th Ave, Suite 210",
      direccion_recoleccion_ciudad: ciudadDestino,
      direccion_recoleccion_pais: paisDestino,
      entidad_contacto_nombre: "Carlos Rivera",
      _contacto_tipo_list: ["Operativo"],
      entidad_contacto_email: "crivera@importer.com",
      entidad_contacto_telefono: "+1 305 555 0142",
    },
    facturacion: {
      cliente: embarque.cliente,
      numero: "7654321-0",
      direccionFiscal: "6a. Avenida 12-34 Zona 10, Guatemala",
      clienteContacto: "Luis Méndez",
      clienteContactoEmail: "lmendez@cliente.com.gt",
      clienteContactoTelefono: "+502 2211-0099",
    },
    detalles: {
      tipoPago: "PREPAID",
      tipoCarga: "General",
      incoterm: "FCA",
      servicio: "Puerta a aeropuerto",
      clasificacionCarga: "Perecedero",
      peligrosidad: ["Cobertura de Seguro"],
      documentosCropa: ["DUA Definitiva"],
      instruccionesManejo: "Mantener refrigerado entre 2 °C y 8 °C. No apilar.",
    },
    cargas: [
      {
        descripcion: "Arveja china fresca",
        cantidad: "120",
        pesoTotal: "1,450.00",
        unidadMedida: "cm",
        largo: "60",
        alto: "30",
        ancho: "40",
        valor: "USD 8,700.00",
        paisOrigenId: "Guatemala",
        partidaArancelaria: "0708.10.00",
      },
      {
        descripcion: "Ejote francés",
        cantidad: "40",
        pesoTotal: "380.50",
        unidadMedida: "cm",
        largo: "50",
        alto: "25",
        ancho: "35",
        valor: "USD 2,100.00",
        paisOrigenId: "Guatemala",
        partidaArancelaria: "0708.20.00",
      },
    ],
    rutas: [
      {
        codEntidadProv: embarque.carrier,
        codPaisOrigen: "Guatemala",
        puertoIdOrigen: "La Aurora (GUA)",
        codPaisDestino: paisDestino,
        puertoIdDestino: ciudadDestino,
        flightNumber: "AV 571",
      },
    ],
    fechaRecoleccion: { fecha_recoleccion: embarque.etd },
    fechas: [
      { id_tipo_fecha: "ETD", fecha: embarque.etd },
      { id_tipo_fecha: "ETA", fecha: embarque.eta, observacion: "Sujeto a confirmación." },
    ],
  };
}
