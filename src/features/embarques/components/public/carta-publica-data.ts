/**
 * Constructores puros de la carta pública: DetallesData (IDs del resumen
 * resueltos a los valores de los selectores) y el payload del PDF
 * (`cartaPublicaData`). Separados de use-datos-carta-publica para poder
 * testearlos sin montar las queries; los resolvers viven en entidad-resolvers.
 *
 * Regla clave: el payload refleja solo datos ya GUARDADOS (carta, resumen o
 * maestro de la entidad), nunca ediciones en memoria sin guardar.
 */

import type { EntidadesPublicas } from "@/features/carta-instrucciones";
import { CLASIFICACION_CARGA_PELIGROSA } from "@/features/embarques/lib/constantes";
import {
  type ContactoResuelto,
  type JsonRecord,
  normalizarPeligrosidad,
  type OpcionLabel,
  primeroConDatos,
  resolverContactoEntidad,
  resolverDireccionEntidad,
  resolverLabelCatalogo,
  resolverNitEntidad,
  resolverNombreEntidad,
  texto,
} from "./entidad-resolvers";

export interface CatalogosCartaPublica {
  incoterm: OpcionLabel[];
  tipoPago: OpcionLabel[];
  tipoCarga: OpcionLabel[];
  transportes?: OpcionLabel[];
  servicios: OpcionLabel[];
  clasificacionCarga?: OpcionLabel[];
}

/** Sección Detalles: lo guardado en carta gana sobre lo de la coordinación. */
export function construirDetallesData({
  facturacionPublica,
  listaCoordinacion,
  catalogos,
}: {
  facturacionPublica: JsonRecord;
  listaCoordinacion: JsonRecord;
  catalogos: CatalogosCartaPublica;
}): JsonRecord {
  const desdeCoordinacion = {
    tipoPago: resolverLabelCatalogo(catalogos.tipoPago, listaCoordinacion?.tipoIdPago),
    tipoCarga: resolverLabelCatalogo(catalogos.tipoCarga, listaCoordinacion?.tipoIdCarga),
    incoterm: catalogos.incoterm.some(
      (t) => String(t.value ?? "") === String(listaCoordinacion?.incotermId ?? ""),
    )
      ? String(listaCoordinacion?.incotermId ?? "")
      : texto(listaCoordinacion?.incotermId),
    servicio: resolverLabelCatalogo(catalogos.servicios, listaCoordinacion?.idServicio),
    peligrosidad: listaCoordinacion?.peligrosidad,
  };
  // La clasificación viaja como ID crudo (sin resolver a label): la resolución
  // contra el catálogo la hace el selector de Detalles y el payload del PDF.
  const clasificacionCarta = facturacionPublica.clasificacionCarga;
  return {
    ...facturacionPublica,
    tipoPago: primeroConDatos(facturacionPublica.tipoPago, desdeCoordinacion.tipoPago),
    tipoCarga: primeroConDatos(facturacionPublica.tipoCarga, desdeCoordinacion.tipoCarga),
    incoterm: primeroConDatos(facturacionPublica.incoterm, desdeCoordinacion.incoterm),
    servicio: primeroConDatos(facturacionPublica.servicio, desdeCoordinacion.servicio),
    peligrosidad: normalizarPeligrosidad(
      facturacionPublica.peligrosidad ?? desdeCoordinacion.peligrosidad,
    ),
    clasificacionCarga:
      clasificacionCarta !== undefined && clasificacionCarta !== null && clasificacionCarta !== ""
        ? clasificacionCarta
        : (listaCoordinacion?.clasificacionCargaId ?? ""),
  };
}

export interface CartaPublicaDataParams {
  entidadesPublicas: EntidadesPublicas;
  facturacionPublica: JsonRecord;
  notificacionesPublica: JsonRecord;
  infoCoordinacionPublica: JsonRecord;
  detallesData: JsonRecord;
  listaCoordinacion: JsonRecord;
  facturacionResuelta: {
    nit: string;
    direccionFiscal: string;
    nombre: string;
    contacto: ContactoResuelto;
  };
  codFile: string;
  entidades: JsonRecord[];
  /**
   * Maestro puntual del shipper (`recuperar-datos-entidad`), igual al que ya
   * hidrata el formulario interactivo (useEntidadFallback, commit 6f1041be).
   * No se filtra por ID contra el shipper real: ese endpoint, vía token
   * público, siempre devuelve la entidad del propio token sin importar qué
   * `entidad_id` se pida, así que nunca calzaría un shipper distinto del
   * cliente. Se usa tal cual para que el PDF muestre lo mismo que ve el
   * cliente en pantalla.
   */
  entidadShipperFallback: JsonRecord | null;
  entidadIdShipperCoord: unknown;
  entidadIdConsignatarioCoord: unknown;
  entidadIdClienteCoord: unknown;
  contactoIdClienteCoord: unknown;
  catalogos: CatalogosCartaPublica;
  resolverNombrePais: (id: unknown) => string;
}

/** Payload del PDF de la carta pública (solo datos persistidos). */
export function construirCartaPublicaData({
  entidadesPublicas,
  facturacionPublica,
  notificacionesPublica,
  infoCoordinacionPublica,
  detallesData,
  listaCoordinacion,
  facturacionResuelta,
  codFile,
  entidades,
  entidadShipperFallback,
  entidadIdShipperCoord,
  entidadIdConsignatarioCoord,
  entidadIdClienteCoord,
  contactoIdClienteCoord,
  catalogos,
  resolverNombrePais,
}: CartaPublicaDataParams) {
  const exportador = entidadesPublicas.exportador;
  const consignatario = entidadesPublicas.consignatario;
  const idShipper = exportador.entidad_id ?? entidadIdShipperCoord;
  const idConsignatario = consignatario.entidad_id ?? entidadIdConsignatarioCoord;
  const idCliente = facturacionPublica.entidad_id ?? entidadIdClienteCoord;

  const contactoExportador = resolverContactoEntidad(
    entidades,
    idShipper,
    exportador._contacto_tipo_list,
  );
  // Último recurso para los campos de solo lectura del shipper: el mismo
  // maestro puntual que ya usa el formulario interactivo, sin filtrar por ID
  // (ver comentario en `entidadShipperFallback` arriba).
  const maestroShipper = entidadShipperFallback ? [entidadShipperFallback] : [];
  const idMaestroShipper = entidadShipperFallback?.entidad_id;
  const contactoMaestroShipper = resolverContactoEntidad(
    maestroShipper,
    idMaestroShipper,
    exportador._contacto_tipo_list,
  );
  const contactoConsignatario = resolverContactoEntidad(
    entidades,
    idConsignatario,
    consignatario._contacto_tipo_list,
  );
  const contactoCliente = resolverContactoEntidad(
    entidades,
    idCliente,
    (facturacionPublica._contacto_tipo_list as unknown[]) ?? [],
    contactoIdClienteCoord,
  );

  const documentosCropa = (
    Array.isArray(facturacionPublica.documentosCropa)
      ? (facturacionPublica.documentosCropa as string[])
      : []
  ).reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});

  return {
    // Shipper: fallback al maestro (dato persistido) cuando el campo nunca
    // se editó explícitamente y por tanto no vive en carta_shipper.
    exportador: primeroConDatos(exportador.nombre, resolverNombreEntidad(entidades, idShipper)),
    contactoExportador: primeroConDatos(
      exportador.contacto,
      contactoExportador.nombre,
      contactoMaestroShipper.nombre,
    ),
    telefonoExportador: primeroConDatos(
      exportador.telefono,
      contactoExportador.telefono,
      contactoMaestroShipper.telefono,
    ),
    emailExportador: primeroConDatos(
      exportador.email,
      contactoExportador.email,
      contactoMaestroShipper.email,
    ),
    sitioRecoleccion: primeroConDatos(
      exportador.direccionRecoleccion,
      exportador.sitioRecoleccion,
      resolverDireccionEntidad(entidades, idShipper),
      resolverDireccionEntidad(maestroShipper, idMaestroShipper),
    ),
    shipperNit: primeroConDatos(
      exportador.nit,
      resolverNitEntidad(entidades, idShipper),
      resolverNitEntidad(maestroShipper, idMaestroShipper),
    ),
    fechaRecoleccion: texto(exportador.fechaRecoleccion),
    horaRecoleccion: texto(exportador.horaRecoleccion),
    documentosCropa,
    // Consignatario
    consignatario: primeroConDatos(
      consignatario.nombre,
      resolverNombreEntidad(entidades, idConsignatario),
    ),
    direccionConsignatario: primeroConDatos(
      consignatario.direccion,
      resolverDireccionEntidad(entidades, idConsignatario),
    ),
    contactoConsignatario: primeroConDatos(consignatario.contacto, contactoConsignatario.nombre),
    telefonosConsignatario: primeroConDatos(
      consignatario.telefonos,
      contactoConsignatario.telefono,
    ),
    emailConsignatario: primeroConDatos(consignatario.email, contactoConsignatario.email),
    nitCliente: primeroConDatos(consignatario.nit, resolverNitEntidad(entidades, idConsignatario)),
    // Facturación
    nombreFacturacion: primeroConDatos(
      facturacionPublica.cliente,
      resolverNombreEntidad(entidades, idCliente),
      facturacionResuelta.nombre,
    ),
    nitFactura: primeroConDatos(facturacionPublica.numero, facturacionResuelta.nit),
    direccionFiscal: primeroConDatos(
      facturacionPublica.direccionFiscal,
      facturacionResuelta.direccionFiscal,
    ),
    contactoFacturacion: primeroConDatos(
      facturacionPublica.clienteContacto,
      contactoCliente.nombre,
      facturacionResuelta.contacto.nombre,
    ),
    telefonoFacturacion: primeroConDatos(
      facturacionPublica.clienteContactoTelefono,
      contactoCliente.telefono,
      facturacionResuelta.contacto.telefono,
    ),
    emailFacturacion: primeroConDatos(
      facturacionPublica.clienteContactoEmail,
      contactoCliente.email,
      facturacionResuelta.contacto.email,
    ),
    // Detalles: resueltos a etiqueta legible (el PDF no tiene selectores).
    incoterm: resolverLabelCatalogo(catalogos.incoterm, detallesData.incoterm),
    tipoPago: resolverLabelCatalogo(catalogos.tipoPago, detallesData.tipoPago),
    tipoCarga: resolverLabelCatalogo(catalogos.tipoCarga, detallesData.tipoCarga),
    transportMode: resolverLabelCatalogo(
      catalogos.transportes ?? [],
      listaCoordinacion.tipoIdEmbarque,
    ),
    servicio: resolverLabelCatalogo(catalogos.servicios, detallesData.servicio),
    peligrosidad: detallesData.peligrosidad,
    clasificacionCarga: resolverLabelCatalogo(
      catalogos.clasificacionCarga ?? [],
      detallesData.clasificacionCarga,
    ),
    // La vista pública no expone el checkbox "S" de Carga Peligrosa: la
    // peligrosidad que obliga la Hoja de Seguridad se deriva de la
    // clasificación de carga y viaja como flag explícito para el PDF.
    cargaPeligrosa: Number(detallesData.clasificacionCarga) === CLASIFICACION_CARGA_PELIGROSA,
    // Coordinación / trayecto
    paisOrigen: primeroConDatos(
      infoCoordinacionPublica.nombre_pais_origen,
      resolverNombrePais(infoCoordinacionPublica.pais_id_origen ?? listaCoordinacion?.paisIdOrigen),
    ),
    paisDestino: primeroConDatos(
      infoCoordinacionPublica.nombre_pais_destino,
      resolverNombrePais(
        infoCoordinacionPublica.pais_id_destino ?? listaCoordinacion?.paisIdDestino,
      ),
    ),
    // Notificar A
    notificacionesNombre: texto(notificacionesPublica.nombre),
    notificacionesEmail: texto(notificacionesPublica.email),
    notificacionesTelefono: texto(notificacionesPublica.telefono),
    notificacionesContacto: texto(notificacionesPublica.contacto),
    telefonoEmergencia: texto(notificacionesPublica.telefonoEmergencia),
    observaciones: texto(infoCoordinacionPublica.observaciones),
    instruccionesManejo: texto(facturacionPublica.instruccionesManejo),
    codFile,
  };
}
