// Modelo compartido de la "carta de instrucciones".
//
// Es la ÚNICA fuente de verdad para:
//  - leer/derivar lo que se muestra en pantalla (construir*), aplicando los
//    overrides del cliente guardados bajo `lista-coordinacion.carta_*`.
//  - construir el payload canónico { json_data, json_data_usuario } que tanto la
//    vista pública (cliente) como la privada (asesor) escriben de forma idéntica.
//
// Ambas vistas importan de aquí para no desincronizarse.

export function obtenerTexto(...valores) {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && valor !== "") return String(valor);
  }
  return "";
}

export function extraerCodigoIncoterm(text) {
  if (text === undefined || text === null || text === "") return "";
  const str = String(text).trim();
  const m = /^([A-Za-z]{3})/.exec(str);
  return m ? m[1].toUpperCase() : str.split(/\s+/)[0];
}

// De un objeto de formulario { _modificados:[...], campoA, campoB } extrae solo
// los campos realmente modificados. Devuelve null si no hubo cambios.
export function extraerCamposModificados(values = {}) {
  const campos = Array.isArray(values?._modificados) ? values._modificados : [];
  if (campos.length === 0) return null;
  const out = { _modificados: campos };
  campos.forEach((c) => {
    if (Object.hasOwn(values, c)) out[c] = values[c];
  });
  return out;
}

// Combina los cambios de cliente/detalles de facturación en un único objeto, o
// null si no hubo cambios. Mismo shape que espera el display (carta_facturacion).
export function buildFacturacionMods(clienteMods, detallesMods) {
  if (!clienteMods && !detallesMods) return null;
  return {
    ...(clienteMods ? { cliente: clienteMods } : {}),
    ...(detallesMods ? { detalles: detallesMods } : {}),
  };
}

// Resuelve el entidad_id (shipper|consignatario) que debe mostrar el select:
// prioriza la última selección guardada del cliente (entidad_id_*), cae al
// original de la coordinación (admite ambas grafías: camelCase y snake_case).
export function resolveEntidadId(jsonCarta = {}, listaCoordinacion = {}, rol = "shipper") {
  const lc = jsonCarta?.["lista-coordinacion"] || {};
  if (rol === "consignatario") {
    return (
      lc.entidad_id_consignatario ??
      lc.entidadIdConsignatario ??
      listaCoordinacion?.entidadIdConsignatario ??
      listaCoordinacion?.entidad_id_consignatario ??
      null
    );
  }
  return (
    lc.entidad_id_shipper ??
    lc.entidadIdShipper ??
    listaCoordinacion?.entidadIdShipper ??
    listaCoordinacion?.entidad_id_shipper ??
    null
  );
}

// Construye los objetos exportador/consignatario que consumen las secciones.
// Precedencia: override del cliente (carta_shipper/carta_consignatario) →
// original de la coordinación (listaCoordinacion / lista-coordinacion) →
// fallback de datos adicionales de la cotización.
export function construirEntidadesPublicas(jsonCarta = {}, listaCoordinacion = {}) {
  const lc = jsonCarta?.["lista-coordinacion"] || {};
  const datosAdicionales = jsonCarta?.datosAdicionales || lc?.datosAdicionales || {};
  const shipper = lc?.carta_shipper || {};
  const consignatario = lc?.carta_consignatario || {};

  return {
    exportador: {
      _modificados: shipper._modificados || [],
      _contacto_tipo_list: Array.isArray(shipper._contacto_tipo_list) ? shipper._contacto_tipo_list : [],
      entidad_id: shipper.entidad_id ?? undefined,
      entidaddireccion_id: shipper.entidaddireccion_id ?? null,
      entidadidentificacion_id: shipper.entidadidentificacion_id ?? null,
      entidadcontacto_id: shipper.entidadcontacto_id ?? null,
      nombre: obtenerTexto(
        shipper.entidad,
        shipper.entidad_nombre,
        shipper.nombre,
        listaCoordinacion?.entidadShipperNombre,
        listaCoordinacion?.nombreExp,
        lc?.entidad_nombre,
        lc?.cliente,
        datosAdicionales.nombreEntidad,
      ),
      codigoExportador: obtenerTexto(shipper.codigoExportador, datosAdicionales.codigoExportador),
      contacto: obtenerTexto(shipper.entidad_contacto_nombre, shipper.contacto_nombre, datosAdicionales.contactoExportador),
      telefono: obtenerTexto(shipper.entidad_contacto_telefono, shipper.contacto_telefono, datosAdicionales.telefonoExportador),
      email: obtenerTexto(shipper.entidad_contacto_email, shipper.contacto_email, datosAdicionales.emailExportador),
      // carta_fechas es la fuente autoritativa de este campo (la sección "Fechas"
      // la actualiza directamente); carta_shipper solo guarda una copia heredada
      // del envío inicial del cliente (ver handleGuardarSeccion en public/page.jsx)
      // que ya no se vuelve a tocar cuando el asesor edita la fecha desde CTS. Si
      // shipper.fecha_recoleccion tuviera prioridad, quedaría "congelada" con el
      // valor viejo y el formulario mostraría "Aún no se ha guardado" para
      // siempre tras editar la fecha.
      fechaRecoleccion: obtenerTexto(
        lc?.carta_fechas?.fecha_recoleccion,
        lc?.carta_fechas?.fechaRecoleccion,
        shipper.fechaRecoleccion,
        shipper.fecha_recoleccion,
        datosAdicionales.fechaRecoleccion,
        datosAdicionales.fecha_recoleccion,
      ),
      horaRecoleccion: obtenerTexto(
        shipper.horaRecoleccion,
        shipper.hora_recoleccion,
        datosAdicionales.horaRecoleccion,
        datosAdicionales.hora_recoleccion,
      ),
      sitioRecoleccion: obtenerTexto(shipper.sitioRecoleccion, datosAdicionales.sitioRecoleccion),
      direccionRecoleccion: obtenerTexto(shipper.direccion_recoleccion, listaCoordinacion?.direccionExp),
      paisDestino: obtenerTexto(shipper.entidad_pais, shipper.direccion_recoleccion_pais),
      ciudadDestino: obtenerTexto(shipper.direccion_recoleccion_ciudad),
      departamentoDestino: obtenerTexto(shipper.direccion_recoleccion_depto),
      municipioDestino: obtenerTexto(shipper.direccion_recoleccion_muni),
      industria: obtenerTexto(shipper.entidad_industria),
      nit: obtenerTexto(
        shipper.entidad_nit,
        shipper.identificacion_numero,
        listaCoordinacion?.nitExp,
        datosAdicionales.nitCliente,
        datosAdicionales.nit,
      ),
      telefonoEmergencia: obtenerTexto(
        shipper.telefonoEmergencia,
        listaCoordinacion?.jsonAtributosOpcionales?.telefonoEmergencia,
      ),
    },
    consignatario: {
      _modificados: consignatario._modificados || [],
      _contacto_tipo_list: Array.isArray(consignatario._contacto_tipo_list) ? consignatario._contacto_tipo_list : [],
      entidad_id: consignatario.entidad_id ?? undefined,
      entidaddireccion_id: consignatario.entidaddireccion_id ?? null,
      entidadidentificacion_id: consignatario.entidadidentificacion_id ?? null,
      entidadcontacto_id: consignatario.entidadcontacto_id ?? listaCoordinacion?.contactoIdConsignatario ?? listaCoordinacion?.contacto_id_consignatario ?? null,
      nombre: obtenerTexto(
        consignatario.entidad_nombre,
        consignatario.nombre,
        listaCoordinacion?.entidadConsignatarioNombre,
        datosAdicionales.nombreConsignatario,
      ),
      direccion: obtenerTexto(consignatario.direccion_recoleccion, consignatario.direccion, listaCoordinacion?.direccionConsignatario, listaCoordinacion?.direccion_cons, datosAdicionales.direccionConsignatario),
      paisDestino: obtenerTexto(consignatario.entidad_pais, consignatario.direccion_recoleccion_pais, consignatario.paisDestino, datosAdicionales.paisDestino),
      ciudadDestino: obtenerTexto(consignatario.direccion_recoleccion_ciudad, consignatario.ciudadDestino),
      departamentoDestino: obtenerTexto(consignatario.direccion_recoleccion_depto),
      municipioDestino: obtenerTexto(consignatario.direccion_recoleccion_muni),
      industria: obtenerTexto(consignatario.entidad_industria),
      contacto: obtenerTexto(consignatario.entidad_contacto_nombre, consignatario.contacto_nombre),
      telefonos: obtenerTexto(consignatario.entidad_contacto_telefono, consignatario.contacto_telefono),
      email: obtenerTexto(consignatario.entidad_contacto_email, consignatario.contacto_email),
      nit: obtenerTexto(consignatario.entidad_nit, consignatario.nit, listaCoordinacion?.nitConsignatario, listaCoordinacion?.nit_cons, datosAdicionales.nitCliente, datosAdicionales.nit),
    },
  };
}

// Construye los datos de la sección "Notificaciones" (nombre/email/teléfono a
// notificar), leyendo el override guardado por el cliente/asesor en
// `lista-coordinacion.carta_notificaciones` (ver construirSeccionesBase).
export function construirNotificacionesPublica(jsonCarta = {}) {
  const lc = jsonCarta?.["lista-coordinacion"] || {};
  const notif = lc?.carta_notificaciones || {};

  return {
    _modificados: notif._modificados || [],
    nombre: obtenerTexto(notif.nombre),
    email: obtenerTexto(notif.email),
    telefono: obtenerTexto(notif.telefono),
    contacto: obtenerTexto(notif.contacto),
  };
}

export function construirFacturacionPublica(jsonCarta = {}) {
  const lc = jsonCarta?.["lista-coordinacion"] || {};
  const datosAdicionales = jsonCarta?.datosAdicionales || lc?.datosAdicionales || {};
  const datosCotizacion = datosAdicionales?.datosCompletosCotizacion || lc?.datosCompletosCotizacion || {};
  const cartaFacturacion = lc?.carta_facturacion || {};
  const facturaCliente = cartaFacturacion.cliente || {};
  const facturaDetalles = cartaFacturacion.detalles || {};
  const cropaMap = lc?.carta_documentos?.cropa || {};

  const documentosCropa = (() => {
    if (Array.isArray(facturaDetalles.documentosCropa)) return facturaDetalles.documentosCropa;
    return Object.entries(cropaMap)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
  })();

  return {
    entidad_id: facturaCliente.entidad_id ?? null,
    _modificadosCliente: facturaCliente._modificados || [],
    _modificadosDetalles: facturaDetalles._modificados || [],
    documentosCropa,
    cliente: obtenerTexto(
      datosAdicionales.nombreFacturacion,
      datosCotizacion?.empresa?.nombre_empresa,
      lc?.entidad_nombre,
      lc?.ENTIDAD_NOMBRE,
      lc?.cliente,
      lc?.CLIENTE,
      facturaCliente.cliente,
    ),
    numero: obtenerTexto(datosAdicionales.nit, datosAdicionales.nitCliente, facturaCliente.numero),
    entidadPais: obtenerTexto(facturaCliente.entidadPais),
    entidadCiudad: obtenerTexto(facturaCliente.entidadCiudad),
    entidadIndustria: obtenerTexto(facturaCliente.entidadIndustria),
    direccionFiscal: obtenerTexto(datosAdicionales.direccionFiscal, facturaCliente.direccionFiscal),
    direccionFiscalPais: obtenerTexto(facturaCliente.direccionFiscalPais),
    direccionFiscalDepto: obtenerTexto(facturaCliente.direccionFiscalDepto),
    direccionFiscalMuni: obtenerTexto(facturaCliente.direccionFiscalMuni),
    clienteContacto: obtenerTexto(datosAdicionales.contactoExportador, facturaCliente.clienteContacto),
    clienteContactoEmail: obtenerTexto(datosAdicionales.emailExportador, facturaCliente.clienteContactoEmail),
    clienteContactoTelefono: obtenerTexto(datosAdicionales.telefonoExportador, facturaCliente.clienteContactoTelefono),
    _contacto_tipo_list: Array.isArray(facturaCliente._contacto_tipo_list) ? facturaCliente._contacto_tipo_list : [],
    tipoPago: obtenerTexto(facturaDetalles.tipoPago),
    tipoCarga: obtenerTexto(facturaDetalles.tipoCarga),
    // Preserve the saved incoterm value as-is (may be a numeric catalog ID) to avoid
    // extraerCodigoIncoterm converting "5" → "5" (string) when the select option value is 5 (number).
    // Only apply code extraction when falling back to a text description.
    incoterm: (facturaDetalles.incoterm != null && facturaDetalles.incoterm !== "")
      ? facturaDetalles.incoterm
      : extraerCodigoIncoterm(obtenerTexto(datosAdicionales.incoterm, lc.incoterm)),
    servicio: obtenerTexto(facturaDetalles.servicio),
    clasificacionCarga: facturaDetalles.clasificacionCarga ?? "",
    peligrosidad: facturaDetalles.peligrosidad ?? lc.peligrosidad,
    cargaValiosa: facturaDetalles.cargaValiosa ?? lc.cargaValiosa,
    coberturaSeguro: facturaDetalles.coberturaSeguro ?? lc.coberturaSeguro,
    instruccionesManejo: facturaDetalles.instruccionesManejo || "",
  };
}

// Construye un objeto plano (con campos a nivel raíz) que `useInformacionPdf`
// pueda aplicar directamente sobre `formData` mediante su `aplicar()`. La carta
// de instrucciones se guarda con estructura anidada (`lista-coordinacion.carta_shipper`,
// `lista-coordinacion.carta_consignatario`, `lista-coordinacion.carta_facturacion`,
// `lista-coordinacion.carta_documentos`, etc.); sin este aplanado el PDF siempre
// mostraba "N/A" o "-" en NIT, dirección, contacto, teléfono, email, etc., porque
// `useInformacionPdf` busca `cartaPublicaData.exportador`, `cartaPublicaData.nitCliente`,
// etc. a nivel raíz, no en la estructura anidada.
//
// `catalogs` puede traer:
//   - incoterms: catálogo de incoterms (para resolver el ID guardado en la carta
//     a su etiqueta legible; sin esto el PDF mostraba "No especificado" o un ID
//     numérico en lugar del Incoterm seleccionado).
//   - tiposPago / tiposCarga / tiposServicio: catálogos usados para resolver los
//     IDs guardados en `carta_facturacion.detalles` (tipoPago, tipoCarga, servicio)
//     a su etiqueta legible. Sin esto esos tres campos, aunque el cliente los
//     hubiera llenado y guardado en el paso "Detalles", nunca llegaban al PDF.
// `clienteContacto` puede traer un fallback de nombre/email/teléfono del cliente
// de facturación (típicamente extraído de `recuperar-datos-entidad-relacionada`
// del cliente). Se usa cuando la carta no tiene esos campos guardados — sin este
// fallback el PDF mostraba "N/A" en Email de Facturación aunque el contacto sí
// existiera en el maestro de la entidad.
export function construirCartaPlanaParaPdf(jsonCarta = {}, embarqueData = {}, catalogs = {}, clienteContacto = {}) {
  const lc = jsonCarta?.["lista-coordinacion"] || {};
  const entidades = construirEntidadesPublicas(jsonCarta, embarqueData || {});
  const facturacion = construirFacturacionPublica(jsonCarta);
  const infoCoord = construirInfoCoordinacionPublica(embarqueData || {}, jsonCarta);

  // Resuelve un ID de catálogo guardado en la carta a su etiqueta legible; si no
  // hay catálogo o no hace match, devuelve el valor crudo tal cual (puede que ya
  // sea un texto legible en vez de un ID).
  const resolverLabel = (catalog, rawValue) => {
    if (rawValue == null || rawValue === "") return "";
    if (!Array.isArray(catalog) || catalog.length === 0) return rawValue;
    const opcion = catalog.find((t) => String(t.value ?? t.cod_tipo ?? t.codTipo ?? "") === String(rawValue));
    return opcion?.label ?? rawValue;
  };

  const incotermLabel = resolverLabel(catalogs.incoterms, facturacion.incoterm) || facturacion.incoterm;
  const tipoPagoLabel = resolverLabel(catalogs.tiposPago, facturacion.tipoPago);
  const tipoCargaLabel = resolverLabel(catalogs.tiposCarga, facturacion.tipoCarga);
  const servicioLabel = resolverLabel(catalogs.tiposServicio, facturacion.servicio);

  // Documentos CROPA persistidos como mapa { [key]: true }.
  const cropaMap = lc?.carta_documentos?.cropa || {};
  const documentosCropa = Object.entries(cropaMap)
    .filter(([, value]) => Boolean(value))
    .reduce((acc, [key]) => {
      acc[key] = true;
      return acc;
    }, {});

  // Fallback de los datos del cliente de facturación desde el maestro de la
  // entidad. Sólo se aplica cuando la carta no trae el dato guardado (es decir,
  // cuando el usuario nunca tocó ese campo del formulario) — sin esto, NIT/
  // Teléfono/Email de Facturación quedaban en blanco en el PDF aunque la
  // entidad sí tuviera esos datos, simplemente porque nadie los había editado
  // manualmente (y por tanto nunca se persistieron dentro de la carta).
  const fallbackEmail = clienteContacto?.email || '';
  const fallbackTelefono = clienteContacto?.telefono || '';
  const fallbackNombre = clienteContacto?.nombre || '';
  const fallbackNit = clienteContacto?.nit || '';

  return {
    // ID de entidad shipper/consignatario resuelto con la misma prioridad que
    // usa `resolveEntidadId` (selección del cliente en la carta > original de
    // la coordinación). `useInformacionPdf` lo usa para pedir dirección/
    // contacto/NIT de la entidad correcta al armar el PDF — sin esto, cuando
    // el cliente seleccionaba una entidad distinta a la de `lista-coordinacion`
    // (típico antes de "Crear Coordinación") el PDF pedía los datos de la
    // entidad equivocada y mostraba "N/A" aunque el formulario tuviera todo
    // guardado.
    shipperEntidadId: resolveEntidadId(jsonCarta, embarqueData, "shipper"),
    consignatarioEntidadId: resolveEntidadId(jsonCarta, embarqueData, "consignatario"),

    // Shipper / exportador
    exportador: entidades.exportador.nombre,
    contactoExportador: entidades.exportador.contacto,
    telefonoExportador: entidades.exportador.telefono,
    emailExportador: entidades.exportador.email,
    telefonoEmergencia: entidades.exportador.telefonoEmergencia,
    sitioRecoleccion:
      entidades.exportador.direccionRecoleccion || entidades.exportador.sitioRecoleccion,
    shipperNit: entidades.exportador.nit,
    fechaRecoleccion: entidades.exportador.fechaRecoleccion,
    horaRecoleccion: entidades.exportador.horaRecoleccion,

    // Consignatario
    consignatario: entidades.consignatario.nombre,
    direccionConsignatario: entidades.consignatario.direccion,
    contactoConsignatario: entidades.consignatario.contacto,
    telefonosConsignatario: entidades.consignatario.telefonos,
    emailConsignatario: entidades.consignatario.email,
    nitCliente: entidades.consignatario.nit,

    // Facturación — la carta gana, pero si no trae NIT/email/teléfono/nombre
    // del cliente (porque nadie los editó) los tomamos del maestro de la
    // entidad (clienteContacto).
    nombreFacturacion: facturacion.cliente,
    nitFactura: facturacion.numero || fallbackNit,
    direccionFiscal: facturacion.direccionFiscal,
    contactoFacturacion: facturacion.clienteContacto || fallbackNombre,
    telefonoFacturacion: facturacion.clienteContactoTelefono || fallbackTelefono,
    emailFacturacion: facturacion.clienteContactoEmail || fallbackEmail,
    incoterm: incotermLabel,
    tipoPago: tipoPagoLabel,
    tipoCarga: tipoCargaLabel,
    servicio: servicioLabel,
    peligrosidad: facturacion.peligrosidad,

    // Coordinación / trayecto
    paisOrigen: infoCoord.nombre_pais_origen,
    paisDestino: infoCoord.nombre_pais_destino,
    enlaceOrigen: infoCoord.puntoenlace_nombre_origen,
    enlaceDestino: infoCoord.puntoenlace_nombree_destino,
    observaciones: infoCoord.observaciones,
    instruccionesManejo: facturacion.instruccionesManejo,
    handlingInformation: facturacion.instruccionesManejo,

    // Documentos CROPA
    documentosCropa,

    // File
    codFile: infoCoord.cod_file,
  };
}

export function construirInfoCoordinacionPublica(embarqueData = {}, jsonCarta = {}) {
  const lc = jsonCarta?.["lista-coordinacion"] || {};
  const datosAdicionales = jsonCarta?.datosAdicionales || lc?.datosAdicionales || {};
  const datosCotizacion = datosAdicionales?.datosCompletosCotizacion || lc?.datosCompletosCotizacion || {};

  return {
    ...embarqueData,
    cod_file: obtenerTexto(lc?.cod_file, lc?.COD_FILE, embarqueData?.cod_file, embarqueData?.codFile),
    // nombre_pais_*: texto legible del país. NO se incluyen aquí las variantes
    // "pais_origen"/"PAIS_ORIGEN" porque en la fila cruda de coordinación ese
    // campo puede contener el ID numérico del país (cod_pais), no el nombre;
    // usar `pais_id_origen`/`pais_id_destino` (abajo) para resolver el nombre
    // real contra el catálogo de países.
    nombre_pais_origen: obtenerTexto(
      datosCotizacion?.origen?.nombre_pais_origen,
      lc?.nombre_pais_origen,
      lc?.NOMBRE_PAIS_ORIGEN,
      datosAdicionales.paisOrigen,
      embarqueData?.nombre_pais_origen,
    ),
    nombre_pais_destino: obtenerTexto(
      datosCotizacion?.destino?.nombre_pais_destino,
      lc?.nombre_pais_destino,
      lc?.NOMBRE_PAIS_DESTINO,
      datosAdicionales.paisDestino,
      embarqueData?.nombre_pais_destino,
    ),
    // IDs numéricos de país (cod_pais), usados como respaldo cuando la fila de
    // coordinación no trae el nombre resuelto; el llamador puede traducirlos
    // con el catálogo de países (useFetchPaisesPublico).
    pais_id_origen:
      lc?.pais_id_origen ?? lc?.PAIS_ID_ORIGEN ?? lc?.cod_pais_origen ?? lc?.COD_PAIS_ORIGEN ??
      embarqueData?.pais_id_origen ?? embarqueData?.PAIS_ID_ORIGEN ?? null,
    pais_id_destino:
      lc?.pais_id_destino ?? lc?.PAIS_ID_DESTINO ?? lc?.cod_pais_destino ?? lc?.COD_PAIS_DESTINO ??
      embarqueData?.pais_id_destino ?? embarqueData?.PAIS_ID_DESTINO ?? null,
    entidad_nombre: obtenerTexto(
      datosCotizacion?.cliente?.nombre_cliente,
      datosAdicionales.nombreEntidad,
      lc?.entidad_nombre,
      lc?.ENTIDAD_NOMBRE,
      lc?.cliente,
      lc?.CLIENTE,
      embarqueData?.entidad_nombre,
      embarqueData?.cliente,
    ),
    puntoenlace_nombre_origen: obtenerTexto(
      datosCotizacion?.origen?.nombre_puntoenlace_origen,
      datosAdicionales.sitioRecoleccion,
      lc?.puntoenlace_nombre_origen,
      lc?.PUNTOENLACE_NOMBRE_ORIGEN,
      embarqueData?.puntoenlace_nombre_origen,
      embarqueData?.puntoEnlaceOrigen,
    ),
    puntoenlace_nombree_destino: obtenerTexto(
      datosCotizacion?.destino?.nombre_puntoenlace_destino,
      datosAdicionales.ciudadDestino,
      lc?.puntoenlace_nombree_destino,
      lc?.PUNTOENLACE_NOMBREE_DESTINO,
      lc?.puntoenlace_nombre_destino,
      lc?.PUNTOENLACE_NOMBRE_DESTINO,
      embarqueData?.puntoenlace_nombree_destino,
      embarqueData?.puntoEnlaceDestino,
    ),
    observaciones: obtenerTexto(embarqueData?.observaciones),
  };
}

// `explicito` = true cuando la sección (shipperMods/consignatarioMods) trae
// "entidad_id" dentro de `_modificados`: el cliente lo cambió a propósito,
// incluso si el nuevo valor es "" (entidad recién creada vía "Nuevo", sin
// entidad_id todavía). Sin distinguir este caso, una selección vacía nunca se
// persistía en `lista-coordinacion.entidad_id_*` y el selector volvía a
// mostrar la entidad ANTERIOR preseleccionada tras recargar/abrir en CTS,
// aunque el resto del formulario ya mostrara los datos de la entidad nueva.
const idCambio = (selected, original, explicito = false) => {
  if (explicito) return String(selected ?? "") !== String(original ?? "");
  return (
    selected !== undefined &&
    selected !== null &&
    selected !== "" &&
    String(selected) !== String(original ?? "")
  );
};

const unionListas = (a = [], b = []) => Array.from(new Set([...(a || []), ...(b || [])]));

const construirSeccionesBase = (prevLc, secciones) => {
  const lc = {};
  const seccionesBase = [
    "carta_shipper",
    "carta_consignatario",
    "carta_facturacion",
    "carta_notificaciones",
    "carta_fechas",
    "carta_documentos",
  ];

  seccionesBase.forEach((key) => {
    if (prevLc[key]) lc[key] = prevLc[key];
  });

  const seccionesMod = {
    carta_shipper: secciones.shipperMods,
    carta_consignatario: secciones.consignatarioMods,
    carta_facturacion: secciones.facturacionMods,
    carta_notificaciones: secciones.notificacionesMods,
    carta_fechas: secciones.fechasMods,
    carta_documentos: secciones.documentosMods,
  };

  // Fusionar (no reemplazar) los mods sobre lo ya guardado: `mods` puede traer
  // solo un subconjunto de los campos listados en `_modificados` (p.ej. cuando
  // el reporte de otra sección — ver FechasPublicas — u otra ronda de guardado
  // solo trae valor para el campo que tocó esta vez). Reemplazar la sección
  // entera perdía silenciosamente los valores de los campos ya guardados que
  // no vinieran en `mods`, dejando el formulario vacío al recargar.
  Object.entries(seccionesMod).forEach(([key, mods]) => {
    if (!mods) return;
    const prevSection = lc[key] || {};
    lc[key] = {
      ...prevSection,
      ...mods,
      _modificados: unionListas(prevSection._modificados, mods._modificados),
    };
  });

  return lc;
};

const aplicarEntidades = (lc, prevLc, entidades) => {
  const prevEntidadShipper = prevLc.entidad_id_shipper ?? prevLc.entidadIdShipper;
  const prevEntidadConsignatario = prevLc.entidad_id_consignatario ?? prevLc.entidadIdConsignatario;

  if (prevEntidadShipper != null) lc.entidad_id_shipper = prevEntidadShipper;
  if (prevEntidadConsignatario != null) lc.entidad_id_consignatario = prevEntidadConsignatario;

  const entidadesParaGuardar = [
    {
      key: "entidad_id_shipper",
      selected: entidades.shipper?.selected,
      original: entidades.shipper?.original,
      explicito: entidades.shipper?.explicito,
    },
    {
      key: "entidad_id_consignatario",
      selected: entidades.consignatario?.selected,
      original: entidades.consignatario?.original,
      explicito: entidades.consignatario?.explicito,
    },
  ];

  entidadesParaGuardar.forEach(({ key, selected, original, explicito }) => {
    if (selected == null) return;
    if (idCambio(selected, original, explicito)) {
      lc[key] = selected;
    }
  });

  return lc;
};

const construirJsonUsuario = ({ lc, cargas, cargasChanged, originals }) => {
  const usuarioJsonData = {};
  if (Object.keys(lc).length > 0) usuarioJsonData["lista-coordinacion"] = lc;
  if (cargasChanged && Array.isArray(cargas) && cargas.length > 0) {
    usuarioJsonData["lista-coordinacion-carga"] = cargas;
  } else if (Array.isArray(originals.cargas) && originals.cargas.length > 0) {
    // Conserva las cargas ya guardadas en una sección previa para que esta
    // sección no las borre al sobrescribir json_data_usuario.
    usuarioJsonData["lista-coordinacion-carga"] = originals.cargas;
  }

  return usuarioJsonData;
};

/**
 * Construye el payload canónico { json_data, json_data_usuario } que escriben
 * AMBAS vistas (pública y privada) de forma idéntica.
 *
 * @param originals  { listaCoordinacion, cargas, fechasMov } — snapshot original
 *                   (resumen-coordinacion en público; json_data previo en privado).
 * @param secciones  mods ya extraídos por sección:
 *                   { shipperMods, consignatarioMods, facturacionMods,
 *                     notificacionesMods, fechasMods, documentosMods,
 *                     cargas, cargasChanged }
 * @param entidades  { shipper:{selected,original}, consignatario:{selected,original} }
 *                   — escribe entidad_id_* solo si la selección cambió.
 * @param entidadRelacionada  array slim (SOLO público) para sync de entidad en backend.
 */
export function buildCartaJson({
  originals = {},
  secciones = {},
  entidades = {},
  entidadRelacionada = null,
} = {}) {
  const {
    shipperMods = null,
    consignatarioMods = null,
    facturacionMods = null,
    notificacionesMods = null,
    fechasMods = null,
    documentosMods = null,
    cargas = [],
    cargasChanged = false,
  } = secciones;

  // Arranca desde lo ya guardado por otras secciones (originals.listaCoordinacion
  // es el overlay ya fusionado y recién refetcheado) para no perder esas secciones
  // al guardar solo la sección actual.
  const prevLc = originals.listaCoordinacion ?? {};
  const lc = construirSeccionesBase(prevLc, {
    shipperMods,
    consignatarioMods,
    facturacionMods,
    notificacionesMods,
    fechasMods,
    documentosMods,
  });
  aplicarEntidades(lc, prevLc, entidades);

  const usuarioJsonData = construirJsonUsuario({
    lc,
    cargas,
    cargasChanged,
    originals,
  });

  const entidadRelArray = Array.isArray(entidadRelacionada) ? entidadRelacionada : [];
  const hasEntidadRel = entidadRelArray.length > 0;
  const hasChanges = Object.keys(usuarioJsonData).length > 0;

  const json_data = {
    "lista-coordinacion": originals.listaCoordinacion ?? {},
    "lista-coordinacion-carga": originals.cargas ?? [],
    "lista-coordinacion-fecha-mov": originals.fechasMov ?? [],
  };

  const json_data_usuario =
    hasChanges || hasEntidadRel
      ? {
          json_data: usuarioJsonData,
          ...(hasEntidadRel ? { "recuperar-datos-entidad-relacionada": entidadRelArray } : {}),
        }
      : null;

  return { json_data, json_data_usuario };
}
