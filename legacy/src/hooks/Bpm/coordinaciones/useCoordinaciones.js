import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_SEMI_STATIC } from "../utils";

const normalizePeligrosidad = (value) =>
  /^(s|si|true|1|y|yes)$/i.test(String(value ?? "").trim());

/**
 * Hook para obtener lista de coordinaciones (embarques)
 *
 * Se pueden enviar varios parámetros opcionales además de los requeridos.  Todos
 * ellos se transmiten como query params al endpoint `/api/appweb/lista-coordinacion`.
 *
 * NOMBRE                     OBLIGATORIO   TIPO        TAMAÑO   DESCRIPCIÓN
 * cod_cc                     SI            Numerico    1-6     Corresponde al centro de costo del usuario autenticado.
 * cod_empresa                SI            Numerico    1-6     Corresponde al id de empresa del usuario autenticado.
 * embarque_id               NO            Numerico    1-6     Identificador único para filtrar por coordinación.
 * cod_tipo_embarque         NO            Numerico    1-6
 * cod_entidad_cli           NO            Numerico    1-6
 * cod_file                  NO            Texto       10
 * cod_emb_padre             NO            Numerico    1-6
 * cod_cotizacion_cabecera   NO            Numerico    1-6
 *
 * @param {Object} params - Filtros para la consulta.
 *   @param {number|string} params.cod_empresa - (requerido) id de empresa.
 *   @param {number|string} params.cod_cc - (requerido) centro de costo.
 *   @param {number|string} [params.embarque_id] - identificador de coordinación.
 *   @param {number|string} [params.cod_tipo_embarque]
 *   @param {number|string} [params.cod_entidad_cli]
 *   @param {string} [params.cod_file] - texto de hasta 10 caracteres.
 *   @param {number|string} [params.cod_emb_padre]
 *   @param {number|string} [params.cod_cotizacion_cabecera]
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con coordinaciones mapeadas
 */
export function useCoordinaciones({ cod_empresa, cod_cc, embarque_id, cod_tipo_embarque, cod_entidad_cli, cod_file, cod_emb_padre, cod_cotizacion_cabecera } = {}, options = {}) {
  return useQuery({
    queryKey: ["coordinaciones", cod_empresa || null, cod_cc || null, embarque_id || null],
    queryFn: async () => {
      const params = {};
      if (cod_empresa) params.cod_empresa = cod_empresa;
      if (cod_cc) params.cod_cc = cod_cc;
      if (embarque_id) params.embarque_id = embarque_id;
      if (cod_tipo_embarque) params.cod_tipo_embarque = cod_tipo_embarque;
      if (cod_entidad_cli) params.cod_entidad_cli = cod_entidad_cli;
      if (cod_file) params.cod_file = cod_file;
      if (cod_emb_padre) params.cod_emb_padre = cod_emb_padre;
      if (cod_cotizacion_cabecera) params.cod_cotizacion_cabecera = cod_cotizacion_cabecera;
      const { data } = await api.get("/api/appweb/lista-coordinacion", { params });

      const Data = extractFromData(data);
      return Data.map((item) => ({
        // ── camelCase (campos principales) ──────────────────────────────────
        embarqueId: item.embarque_id,
        cod_file: item.cod_file,
        empresa: item.empresa_nombre,
        centroCosto: item.cencod_nombre,
        tipoEmbarque: item.tipo_descripcion_embarque,
        estado: item.estado_descripcion,
        fechaInicio: item.fecha_creacion,
        cliente: item.entidad_nombre,
        entidadIdCli:
          item.entidad_id_cli ??
          item.cod_entidad_cli ??
          item.COD_ENTIDAD_CLI ??
          item.ENTIDAD_ID_CLI ??
          null,
        entidadIdShipper:
          item.entidad_id_shipper ??
          item.cod_entidad_shipper ??
          item.COD_ENTIDAD_SHIPPER ??
          null,
        entidad_id_shipper:
          item.entidad_id_shipper ??
          item.cod_entidad_shipper ??
          item.COD_ENTIDAD_SHIPPER ??
          null,
        entidadShipperNombre: item.entidad_shipper_nombre,
        entidadIdConsignatario:
          item.entidad_id_consignatario ??
          item.cod_entidad_consignatario ??
          item.COD_ENTIDAD_CONSIGNATARIO ??
          null,
        entidad_id_consignatario:
          item.entidad_id_consignatario ??
          item.cod_entidad_consignatario ??
          item.COD_ENTIDAD_CONSIGNATARIO ??
          null,
        entidadConsignatarioNombre:
          item.entidad_consig_nombre ??
          item.entidad_consignatario_nombre ??
          null,
        entidadIdEstacion:
          item.entidad_id_estacion ??
          item.ENTIDAD_ID_ESTACION ??
          item.estacion_dsv_id ??
          item.ESTACION_DSV_ID ??
          null,
        entidad_id_estacion:
          item.entidad_id_estacion ??
          item.ENTIDAD_ID_ESTACION ??
          item.estacion_dsv_id ??
          item.ESTACION_DSV_ID ??
          null,
        responsable: item.usuario_correo_crea,
        empresaId: item.empresa_id,
        centroId: item.cencos_id,
        estadoId: item.estado_id,
        // prefer the human-readable name fields, but fall back to any alternate
        // properties that the backend might return.  The UI layers (e.g. the
        // details panel) already do similar fallbacks, so doing it here ensures
        // the table always has a sensible string value instead of an id or
        // undefined.
        // numeric codes for countries and ports are required by several
        // form sections when building an update payload.  previously we only
        // exposed the *names* which meant `buildCoordPayload` would fall back
        // to string values and convert them to null.  this produced payloads
        // that wiped out the fields on save.
        cod_pais_origen:
          (Number(item.cod_pais_origen) > 0 ? Number(item.cod_pais_origen) : undefined) ??
          (Number(item.COD_PAIS_ORIGEN) > 0 ? Number(item.COD_PAIS_ORIGEN) : undefined) ??
          (Number(item.pais_id_origen) > 0 ? Number(item.pais_id_origen) : undefined) ??
          (Number(item.PAIS_ID_ORIGEN) > 0 ? Number(item.PAIS_ID_ORIGEN) : undefined) ??
          null,
        pais_id_origen:
          (Number(item.pais_id_origen) > 0 ? Number(item.pais_id_origen) : undefined) ??
          (Number(item.PAIS_ID_ORIGEN) > 0 ? Number(item.PAIS_ID_ORIGEN) : undefined) ??
          null,
        cod_pais_destino:
          (Number(item.cod_pais_destino) > 0 ? Number(item.cod_pais_destino) : undefined) ??
          (Number(item.COD_PAIS_DESTINO) > 0 ? Number(item.COD_PAIS_DESTINO) : undefined) ??
          (Number(item.pais_id_destino) > 0 ? Number(item.pais_id_destino) : undefined) ??
          (Number(item.PAIS_ID_DESTINO) > 0 ? Number(item.PAIS_ID_DESTINO) : undefined) ??
          null,
        pais_id_destino:
          (Number(item.pais_id_destino) > 0 ? Number(item.pais_id_destino) : undefined) ??
          (Number(item.PAIS_ID_DESTINO) > 0 ? Number(item.PAIS_ID_DESTINO) : undefined) ??
          null,
        puerto_id_origen:
          item.puerto_id_origen ??
          item.PUNTOENLACE_ID_ORIGEN ??
          item.puntoenlace_id_origen ??
          null,
        // also expose numeric destination port to avoid losing its value
        puerto_id_destino:
          item.puerto_id_destino ??
          item.puntoenlace_id_destino ??
          item.PUNTOENLACE_ID_DESTINO ??
          null,
        paisOrigen: item.nombre_pais_origen ?? item.pais_origen ?? item.paisOrigen ?? "",
        paisDestino: item.nombre_pais_destino ?? item.pais_destino ?? item.paisDestino ?? "",
        puntoEnlaceOrigen: item.puntoenlace_nombre_origen ?? item.punto_enlace_origen ?? item.puntoEnlaceOrigen ?? "",
        // The backend historically had a typo for the destination field, hence
        // the double "e" in nombree; keep both names for compatibility.
        puntoEnlaceDestino:
          item.puntoenlace_nombree_destino ??
          item.puntoenlace_nombre_destino ??
          item.punto_enlace_destino ??
          item.puntoEnlaceDestino ??
          "",
        // expose the numeric id for destination so the table can render it
        // separately when required (see tablaCoordinaciones format).
        puntoEnlaceDestinoId:
          item.puntoenlace_id_destino ??
          item.PUNTOENLACE_ID_DESTINO ??
          item.puerto_id_destino ??
          item.PUERTO_ID_DESTINO ??
          null,
        servicio: item.servicio_nombre,
        tipoCarga: item.tipo_descripcion,
        tipoPago: item.tipo_id_pago,
        incoterm: item.incoterm_descripcion,
        observaciones: item.observaciones,
        repeso: item.repeso,
        fechaRepeso: item.fecha_repeso,
        fechaPosicionamiento: item.fecha_posicionamiento,
        horaPosicionamiento: item.hora_posicionamiento,
        idServicio: item.id_servicio,
        tipoIdCarga: item.tipo_id_carga,
        tipoIdEmbarque: item.tipo_id_embarque,
        incotermId: item.incoterm_id,
        clasificacionCargaId:
          item.cod_clasificacion_carga ??
          item.clasificacion_carga_id ??
          item.CLASIFICACION_CARGA_ID ??
          null,
        clasificacion_carga_id:
          item.cod_clasificacion_carga ??
          item.clasificacion_carga_id ??
          item.CLASIFICACION_CARGA_ID ??
          null,
        usuarioIdAsesor: item.usuario_id_asesor,
        usuarioCorreoAsesor: item.usuario_correo_asesor,
        embarqueIdPadre: item.embarque_id_padre,
        // Igual que entidad_id_shipper/entidad_id_consignatario (arriba): el backend
        // no es consistente con la grafía de este campo entre respuestas, así que se
        // prueban varias variantes. Sin este fallback, cuando el backend responde con
        // otra grafía, cotizacionCabeceraId queda undefined y la vista privada
        // (CTS/[id]/page.jsx) nunca logra cargar la carta de instrucciones guardada
        // por el cliente (useCartaInstruccionesData no dispara sin este id), dejando
        // secciones como Facturación sin datos aunque en la vista pública sí aparezcan.
        cotizacionCabeceraId:
          item.cotizacioncabecera_id ??
          item.COTIZACIONCABECERA_ID ??
          item.cod_cotizacion_cabecera ??
          item.COD_COTIZACION_CABECERA ??
          null,
        entidadIdEstacion: item.entidad_id_estacion ?? item.ESTACION_DSV_ID ?? item.estacion_dsv_id,
        entidad_id_estacion: item.entidad_id_estacion ?? item.ESTACION_DSV_ID ?? item.estacion_dsv_id,
        ESTACION_DSV_ID: item.ESTACION_DSV_ID ?? item.estacion_dsv_id ?? item.entidad_id_estacion,
        jsonDatosOpcionales: item.json_datos_opcionales ?? item.json_atributos_opcionales,
        peligrosidad: normalizePeligrosidad(
          item.peligrosidad ??
          item.PELIGROSIDAD ??
          item.cargaPeligrosa ??
          item.dangerous,
        ),
        cargaValiosa: normalizePeligrosidad(
          item.cargaValiosa ??
          item.CARGA_VALIOSA ??
          (item.json_datos_opcionales && (typeof item.json_datos_opcionales === 'string' ? (() => { try { return JSON.parse(item.json_datos_opcionales).cargaValiosa; } catch (e) { return null; } })() : item.json_datos_opcionales?.cargaValiosa)) ??
          (item.json_atributos_opcionales && (typeof item.json_atributos_opcionales === 'string' ? (() => { try { return JSON.parse(item.json_atributos_opcionales).cargaValiosa; } catch (e) { return null; } })() : item.json_atributos_opcionales?.cargaValiosa)) ??
          null,
        ),
        coberturaSeguro: normalizePeligrosidad(
          item.coberturaSeguro ??
          item.COBERTURA_SEGURO ??
          item.cobertura_seguro ??
          (item.json_datos_opcionales && (typeof item.json_datos_opcionales === 'string' ? (() => { try { return JSON.parse(item.json_datos_opcionales).coberturaSeguro; } catch (e) { return null; } })() : item.json_datos_opcionales?.coberturaSeguro)) ??
          (item.json_atributos_opcionales && (typeof item.json_atributos_opcionales === 'string' ? (() => { try { return JSON.parse(item.json_atributos_opcionales).coberturaSeguro; } catch (e) { return null; } })() : item.json_atributos_opcionales?.coberturaSeguro)) ??
          null,
        ),
        nitExp: item.nit_exp,
        nombreExp: item.nombre_exp,
        direccionExp: item.direccion_exp,
        nitConsignatario:
          item.nit_consignatario ??
          item.NIT_CONSIGNATARIO ??
          item.cons_identificacion_numero ??
          item.CONS_IDENTIFICACION_NUMERO ??
          item.identificacion_numero_consignatario ??
          null,
        direccionConsignatario:
          item.direccion_consignatario ??
          item.DIRECCION_CONSIGNATARIO ??
          item.cons_direccion ??
          item.CONS_DIRECCION ??
          null,
        contactoIdShipper: item.contacto_id_shipper,
        contacto_id_shipper: item.contacto_id_shipper,
        contactoIdConsignatario: item.contacto_id_consignatario,
        contacto_id_consignatario: item.contacto_id_consignatario,
        contactoIdCliente: item.contacto_id_cliente,
        contacto_id_cliente: item.contacto_id_cliente,
        jsonDocumentos: item.json_documentos,
        json_documentos: item.json_documentos,
        usuarioIdCrea: item.usuario_id_crea,
        usuario_id_crea: item.usuario_id_crea,
        entidadEstacionNombre: item.entidad_estacion_nombre,
        entidad_estacion_nombre: item.entidad_estacion_nombre,
        embarque_id: item.embarque_id,
        EMBARQUE_ID: item.embarque_id,
        empresa_id: item.empresa_id,
        cencos_id: item.cencos_id,
        entidad_id_cli:
          item.entidad_id_cli ??
          item.cod_entidad_cli ??
          item.COD_ENTIDAD_CLI ??
          item.ENTIDAD_ID_CLI ??
          null,
        ENTIDAD_ID_CLI:
          item.entidad_id_cli ??
          item.cod_entidad_cli ??
          item.COD_ENTIDAD_CLI ??
          item.ENTIDAD_ID_CLI ??
          null,
        entidad_nombre: item.entidad_nombre,
        tipo_id_embarque: item.tipo_id_embarque,
        TIPO_ID_EMBARQUE: item.tipo_id_embarque,
        tipo_id_pago: item.tipo_id_pago,
        tipo_id_carga: item.tipo_id_carga,
        TIPO_ID_CARGA: item.tipo_id_carga,
        incoterm_id: item.incoterm_id,
        INCOTERM_ID: item.incoterm_id,
        id_servicio: item.id_servicio,
        ID_SERVICIO: item.id_servicio,
        puntoenlace_nombre_origen: item.puntoenlace_nombre_origen,
        puntoenlace_nombree_destino: item.puntoenlace_nombree_destino,
        puntoenlace_nombre_destino: item.puntoenlace_nombre_destino,
        puntoenlace_id_destino: item.puntoenlace_id_destino,
        PUNTOENLACE_ID_DESTINO: item.PUNTOENLACE_ID_DESTINO,
        puerto_id_destino: item.puerto_id_destino,
        PUERTO_ID_DESTINO: item.PUERTO_ID_DESTINO,
        nombre_pais_origen: item.nombre_pais_origen,
        nombre_pais_destino: item.nombre_pais_destino,
        pais_origen: item.pais_origen,
        pais_destino: item.pais_destino,
        punto_enlace_origen: item.punto_enlace_origen,
        punto_enlace_destino: item.punto_enlace_destino,
      }));
    },
    enabled: !!cod_empresa && !!cod_cc,
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
