const { getrubros_opcionales } = require("./cotizacion_cabecera");
const { generarPDFCotizacion } = require("./generar_pdf_cotizacion");
const { crea_link_carta_instrucciones_2 } = require("../admon/embarques/coordinacion_link_carta_instrucciones");
const { generar_html_cotizacion_aprobada } = require("../admon/notificaciones/plantilla_html_cotizacion_aprobada");
const { insertar_notificacion_correo_transaccion } = require("../admon/notificaciones/notificacion_correo");
const { generar_html_cotizacion } = require("../admon/notificaciones/plantilla_html_cotizacion");
const { get_resumen_coordinacion } = require("../admon/embarques/coordinacion_embarque");
const { generarPDFCotizacionIngles } = require("./generar_pdf_cotizacion_ingles");
const moment = require("moment");

module.exports.listar_cotizacion_documentos = async(campos) => {
    if('cod_cotizacion_cabecera' in campos){
        const estructuraConsulta = azureSqlClient({COD:"COTIZACION_DOCUMENTOS"})
                                .leftJoin({ TIPDOC: "TIPO" }, function () {
                                    this.on( 'TIPDOC.TIPO_ID', '=', 'COD.TIPO_DOCUMENTO_ID');
                                })
                                .leftJoin({ USU: "USUARIO" }, function () {
                                    this.on( 'USU.USUARIO_ID', '=', 'COD.USUARIO_ID_CARGA');
                                })
                                .leftJoin({ ES: "ESTADO" }, function () {
                                    this.on( 'ES.ESTADO_ID', '=', 'COD.COORDINACION_ESTADO_ID');
                                })
        estructuraConsulta.where("COTIZACIONCABECERA_ID", campos.cod_cotizacion_cabecera);

        if ('cod_cotizaciondetalle' in campos) {
            estructuraConsulta.where('COD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`);
        }

        if ('cod_tipo' in campos) {
            estructuraConsulta.where('COD.TIPO_DOCUMENTO_ID', `${campos.cod_tipo}`);
        }

        const data = await estructuraConsulta.select(
            "COD.COTIZACIONDOCUMENTO_ID",
            "COD.COTIZACIONCABECERA_ID",
            "COD.COTIZACIONDETALLE_ID",
            "COD.TIPO_DOCUMENTO_ID",
            "TIPDOC.TIPO_DESCRIPCION",
            "COD.COTIZACION_FECHA",
            "COD.COTIZACION_URL_DOCUMENTO",
            "COD.USUARIO_ID_CARGA",
            "USU.USUARIO_CORREO",
            "COD.COORDINACION_ESTADO_ID"
        );

        return {success : true ,"data" : data };

    }else{
        return {
            'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Faltan parametros, verifica los requeridos'
        };
    }
}

module.exports.crear_cotizacion_documento = async (campos) => {
    if('cod_cotizacion_cabecera' in campos && 'cod_tip_doc' in campos && 'url_documento' in campos){
        //revisar que exista el tipo y que la cotizacion sea valida
        const fila_cotizacion = await azureSqlClient("COTIZACION_CABECERA")
                            .where("COTIZACIONCABECERA_ID", campos.cod_cotizacion_cabecera)
                            .first();

        if(fila_cotizacion){
            //revisar que el tipo este habilitado
            const fila_tipo_docu = await azureSqlClient("TIPO")
                            .where("TIPO_ID", campos.cod_tip_doc)
                            .first();
            if(fila_tipo_docu){
                
                const fila_valida_existente = await azureSqlClient("COTIZACION_DOCUMENTOS")
                .where({
                    "COTIZACIONCABECERA_ID"     : campos.cod_cotizacion_cabecera,
                    "TIPO_DOCUMENTO_ID"         : campos.cod_tip_doc,
                    "COTIZACIONDETALLE_ID"      : campos.cod_cotizaciondetalle,
                })
                .first();

                if(fila_valida_existente){
                    return {
                        "success" : false,
                        "cod_mensaje" : 1043,
                        "mensaje" : "No puedes crear mas de un documento con el mismo tipo para la cotizacion."
                    };
                }

                //Registrar en cotizacion documentos
                let resultado_crea = await azureSqlClient("COTIZACION_DOCUMENTOS")
                    .insert({
                        "COTIZACIONCABECERA_ID"     : campos.cod_cotizacion_cabecera,
                        "COTIZACIONDETALLE_ID"      : campos.cod_cotizaciondetalle,
                        "TIPO_DOCUMENTO_ID"         : campos.cod_tip_doc,
                        "COTIZACION_FECHA"          : await cropa_fecha_hora_actual(),
                        "COTIZACION_URL_DOCUMENTO"  : campos.url_documento,
                        "USUARIO_ID_CARGA"          : usuario.USUARIO_ID,
                        "COORDINACION_ESTADO_ID"    : 1
                    })
                    .returning("COTIZACIONDOCUMENTO_ID")
                    .then(async (id_coti_doc) => {
                        console.log('Nuevo documento cotizacion ID:' , id_coti_doc);
                        console_log("Registra en historico coordinacion");                        
                        return {'success' : true,
                                "cod_mensaje" : 1041,
                                'mensaje' : 'Documento cotizacion creado correctamente' ,
                                'cotizaciondocumento_id' : id_coti_doc[0]["COTIZACIONDOCUMENTO_ID"].toString(),
                                'cod_cotizacion_cabecera': campos.cod_cotizacion_cabecera
                            };
                    }).catch((e) => {
                        console_log(e.toString());
                        return {"success" : false,
                            "mensaje" : "Revisa los parametros enviados",
                            "cod_mensaje" : 1042,
                            "error" : e.toString()
                        };
                    });
            
                    return resultado_crea; 
            }else{
                return {
                    "success" : false,
                    "cod_mensaje" : 1043,
                    "mensaje" : "El tipo de Documento no fue localizado, revisar el tipo enviado."
                };
            }
        }else{
            return {
                "success" : false,
                "cod_mensaje" : 1043,
                "mensaje" : "La cotizacion no fue localizada"
            };
        }
    }else{
        return {
            "success" : false,
            "cod_mensaje" : 1043,
            "mensaje" : "Faltan parametros requeridos, revisa tu documentacion"
        };
    }
}

module.exports.actualizar_cotizacion_documento = async (campos) => {
    if('cotizaciondocumento_id' in campos && 'cod_cotizacion_cabecera' in campos 
        && 'cod_tip_doc' in campos && 'url_documento' in campos && 'cod_estado' in campos){
        //revisar que exista la cotizacion sea valida
        const fila_cotizacion = await azureSqlClient("COTIZACION_DOCUMENTOS")
                            .where("COTIZACIONDOCUMENTO_ID", campos.cotizaciondocumento_id)
                            .first();

        if(fila_cotizacion){
            //revisar que el tipo este habilitado
            const fila_tipo_docu = await azureSqlClient("TIPO")
                            .where("TIPO_ID", campos.cod_tip_doc)
                            .first();
            if(fila_tipo_docu){
                //Actualizar en cotizacion documentos
                let resultado_crea = await azureSqlClient("COTIZACION_DOCUMENTOS")
                    .where({
                        COTIZACIONDOCUMENTO_ID : campos.cotizaciondocumento_id
                    })
                    .update({
                        "COTIZACION_FECHA"          : await cropa_fecha_hora_actual(),
                        "COTIZACION_URL_DOCUMENTO"  : campos.url_documento,
                        "USUARIO_ID_CARGA"          : usuario.USUARIO_ID,
                        "COORDINACION_ESTADO_ID"    : campos.cod_estado
                    })
                    .then(async (id_coti_doc) => {
                        console.log('Actualizado documento cotizacion ID:' , id_coti_doc);
                        return {'success' : true,
                                "cod_mensaje" : 1031,
                                'mensaje' : 'Documento cotizacion actualizado correctamente' ,
                                'cotizaciondocumento_id' : campos.cotizaciondocumento_id,
                                'cod_cotizacion_cabecera': campos.cod_cotizacion_cabecera
                            };
                    }).catch((e) => {
                        console_log(e.toString());
                        return {"success" : false, "cod_mensaje" : 1032,"error" : e.toString()};
                    });
            
                    return resultado_crea; 
            }else{
                return {
                    "success" : false,
                    "cod_mensaje" : 1033,
                    "mensaje" : "El tipo de Documento no fue localizado, revisar el tipo enviado."
                };
            }
        }else{
            return {
                "success" : false,
                "cod_mensaje" : 1033,
                "mensaje" : "La cotizacion no fue localizada"
            };
        }
    }else{
        return {
            "success" : false,
            "cod_mensaje" : 1033,
            "mensaje" : "Faltan parametros requeridos, revisa tu documentacion"
        };
    }
}

module.exports.generar_pdf_cotizacion_detalle = async(campos) => {
    if ('cod_cotizaciondetalle' in campos) {

        const idioma = campos?.idioma == "en" ? "en" : "es"
        const tipo_documento = campos.tipo_documento || null
    
        const consulta_cotizacion = azureSqlClient({ CD: "COTIZACION_DETALLE" })
        .leftJoin({ CC: "COTIZACION_CABECERA" }, function () {
            this.on( 'CC.COTIZACIONCABECERA_ID', '=', 'CD.COTIZACIONCABECERA_ID');
        })   
        .leftJoin({ EMP: "EMPRESA" }, function () {
            this.on( 'CC.EMPRESA_ID', '=', 'EMP.EMPRESA_ID');
        }) 
        .leftJoin({ CCO: "CENTRO_COSTO" }, function () {
            this.on( 'CC.CENCO_ID', '=', 'CCO.CENCOS_ID');
        })  
        .leftJoin({ CL: "ENTIDAD" }, function () {
            this.on( 'CL.ENTIDAD_ID', '=', 'CC.ENTIDAD_ID');
        }) 
        .leftJoin({ EST: "ENTIDAD" }, function () {
            this.on( 'EST.ENTIDAD_ID', '=', 'CC.ENTIDAD_ID_ESTACION');
        }) 
        // .leftJoin({ PEO: "PUNTO_ENLACE" }, function () {
        //     this.on( 'PEO.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_ORIGEN_ID');
        // }) 
        // .leftJoin({ PO: "PAIS" }, function () {
        //     this.on( 'PO.PAIS_ID', '=', 'PEO.PAIS_ID');
        // }) 
        // .leftJoin({ PED: "PUNTO_ENLACE" }, function () {
        //     this.on( 'PED.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_DESTINO_ID');
        // }) 
        // .leftJoin({ PD: "PAIS" }, function () {
        //     this.on( 'PD.PAIS_ID', '=', 'PED.PAIS_ID');
        // }) 
        .leftJoin({ IT: "INCOTERM" }, function () {
            this.on( 'IT.INCOTERM_ID', '=', 'CC.INCOTERM_ID');
        }) 
        .leftJoin({ UE: "USUARIO_EMPLEADO_PUESTO" }, function () {
            this.on( 'UE.USUARIO_ID', '=', 'CD.USUARIO_ID');
        })
        .leftJoin({ E: "EMPLEADO" }, function () {
            this.on( 'E.EMPLEADO_ID', '=', 'UE.EMPLEADO_ID');
        })
        .leftJoin({ P: "PUESTO" }, function () {
            this.on( 'P.PUESTO_ID', '=', 'UE.PUESTO_ID');
        })
        .leftJoin({ EC: "ENTIDAD_CONTACTO"}, function () {
            this.on( 'EC.ENTIDADCONTACTO_ID', '=', 'CC.ENTIDADCONTACTO_ID');
        })
        .where('CD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
        
        const data_cotizacion = await consulta_cotizacion.first(
            'CC.COTIZACIONCABECERA_ID AS COD_COTIZACION_CABECERA',
            'CCO.CENCOS_CODCROPA AS COD_CENCO',
            'CCO.CENCOD_NOMBRE AS NOMBRE_CENCO',
            'EMP.EMPRESA_NOMBRE',
            'CC.COTIZACIONCABECERA_FECHA AS FECHA_CREACION',
            'CC.ENTIDAD_ID',
            'CL.ENTIDAD_NOMBRE',
            'EC.ENTIDADCONTACTO_NOMBRE',
            'CC.TIPO_PAGO_ID AS COD_TIPO_PAGO',
            'CC.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
            'CC.PUNTOENLACE_ORIGEN_ID AS PUNTOENLACE_ORIGEN', 
            'CC.DIRECCION_ORIGEN AS DIRECCION_ORIGEN', 
            'CC.DIRECCION_DESTINO AS DIRECCION_DESTINO', 

            'CC.PUNTOENLACE_ORIGEN_ID', 
            'CC.PUNTOENLACE_DESTINO_ID',
            'CC.CIUDAD_ORIGEN_ID',
            'CC.CIUDAD_DESTINO_ID',
            
            'CD.COTIZACIONDETALLE_VERSION AS VERSION',
            'IT.INCOTERM_CODIGO',
            'CD.COTIZACIONDETALLE_FECHA_VENCIMIENTO AS FECHA_VENCIMIENTO',
            'E.EMPLEADO_NOMBRES',
            'E.EMPLEADO_APELLIDOS',
            'P.PUESTO_DESCRIPCION AS PUESTO_DESC',
            'CD.COTIZACIONDETALLE_SALIDA AS SALIDA',
            'CD.COTIZACIONDETALLE_TIPO_TRANSITO AS TIPO_TRANSITO',
            'CD.COTIZACIONDETALLE_OPCIONALES AS OPCIONALES',
            'CD.COTIZACIONDETALLE_TIPO_SERVICIO AS TIPO_SERVICIO_TXT',
            'CD.COTIZACIONDETALLE_OBSERVACION AS OBSERVACION',
            'CC.ENTIDAD_ID_ESTACION',
            'EST.ENTIDAD_NOMBRE AS ESTACION_NOMBRE',
            'CC.CONTACTO_ESTACION',
            'CD.COTIZACIONDETALLE_TIPO_PRODUCTO AS TIPO_PRODUCTO'
        );

        if(!data_cotizacion){
            return { success: false, cod_mensaje: 1043, mensaje: 'No se ha encontrado la cotización.' };
        }

        let busca_documento_prepaid
        let busca_documento_collect
        let busca_documento
        
        if(data_cotizacion.COD_TIPO_PAGO == 131 && !!data_cotizacion.ENTIDAD_ID_ESTACION){
            busca_documento_prepaid = await this.listar_cotizacion_documentos({
                cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
                cod_cotizaciondetalle: campos.cod_cotizaciondetalle,
                cod_tipo: 352,
            })
            busca_documento_collect = await this.listar_cotizacion_documentos({
                cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
                cod_cotizaciondetalle: campos.cod_cotizaciondetalle,
                cod_tipo: 353,
            })

            if(!("forzar" in campos && campos.forzar) && (busca_documento_prepaid?.data?.length > 0) && (busca_documento_collect?.data?.length > 0)){
                return {
                    success: true,
                    cod_mensaje: 1041,
                    mensaje: 'Documento recuperado correctamente',
                    cotizaciondocumento_id_prepaid: busca_documento_prepaid.data[0].COTIZACIONDOCUMENTO_ID,
                    url_documento_prepaid: busca_documento_prepaid.data[0].COTIZACION_URL_DOCUMENTO,
                    cotizaciondocumento_id_collect: busca_documento_collect.data[0].COTIZACIONDOCUMENTO_ID,
                    url_documento_collect: busca_documento_collect.data[0].COTIZACION_URL_DOCUMENTO
                }
            } 
        } else {
            busca_documento = await this.listar_cotizacion_documentos({
                cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
                cod_cotizaciondetalle: campos.cod_cotizaciondetalle,
                cod_tipo: 341,
            })

            if(!("forzar" in campos && campos.forzar) && (busca_documento?.data?.length > 0)){
                return {
                    success: true,
                    cod_mensaje: 1041,
                    mensaje: 'Documento recuperado correctamente',
                    cotizaciondocumento_id: busca_documento.data[0].COTIZACIONDOCUMENTO_ID,
                    url_documento: busca_documento.data[0].COTIZACION_URL_DOCUMENTO,
                }
            } 
        }

        const consulta_rubros = await azureSqlClient({ CDR: "COTIZACION_DETALLE_RUBRO" })
            .leftJoin({ R: "RUBRO" }, function () {
                this.on( 'CDR.RUBRO_ID', '=', 'R.RUBRO_ID');
            }) 
            .leftJoin({ M: "MONEDA" }, function () {
                this.on( 'M.MONEDA_ID', '=', 'CDR.MONEDA_VENTA_ID');
            }) 
            .where('CDR.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
            .select(
                'CDR.COTDETRUB_ID',
                'CDR.GRUPORUBRO_NOMBRE AS rubro',
                'CDR.COTDETRUB_DETALLE AS detalle',
                // 'CDR.GRUPORUBRO_NOMBRE AS detalle',
                'M.MONEDA_SIMBOLO AS moneda',
                'CDR.TIPO_PAGO_ID AS tipo_pago',
                // 'CDR.COTDETRUB_VENTA_RUBRO as monto'
                azureSqlClient.raw(`
                    SUM(CDR.COTDETRUB_VENTA_RUBRO) AS monto
                `)
            )
            .groupBy(
                'CDR.COTDETRUB_ID',
                'CDR.GRUPORUBRO_NOMBRE',
                'M.MONEDA_SIMBOLO',
                'CDR.COTDETRUB_DETALLE',
                'CDR.TIPO_PAGO_ID'
            )
            .orderBy('CDR.COTDETRUB_ID', 'ASC')

        const data_dimension = await azureSqlClient({ CDD: "COTIZACION_DETALLE_DIMENSION" })
            .where('CDD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
            .first(
                "CDD.COTDETDIM_ID",
                "CDD.COTIZACIONDETALLE_ID",
                "CDD.COTDETDIM_ANCHO",
                "CDD.COTDETDIM_LARGO",
                "CDD.COTDETDIM_ALTO",
                "CDD.COTDETDIM_PESO_UNITARIO",
                "CDD.COTDETDIM_CANTIDAD",
                "CDD.COTDETDIM_UNIDAD_MEDIDA",
                "CDD.COTDETDIM_UNIDAD_PESO",
                "CDD.COTDETDIM_TOTAL_PESO",
                "CDD.COTDETDIM_TOTAL_VOLUMEN",
                "CDD.COTDETDIM_TOTAL_CW",
            )
            .orderBy('CDD.COTDETDIM_ID', "DESC")
        
        let no_piezas = await azureSqlClient({ CDD: "COTIZACION_DETALLE_DIMENSION" })
            .where('CDD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
            .first(
                azureSqlClient.raw('SUM(CDD.COTDETDIM_CANTIDAD) AS TOTAL')
            )

        if(!!data_cotizacion.PUNTOENLACE_ORIGEN){
            const origen = await azureSqlClient({PE:"PUNTO_ENLACE"})
                .leftJoin({ P: "PAIS" }, function () {
                    this.on( 'P.PAIS_ID', '=', 'PE.PAIS_ID');
                })
                .where('PE.PUNTOENLACE_ID',`${data_cotizacion.PUNTOENLACE_ORIGEN_ID}`)
                .first(
                    'PE.PUNTOENLACE_NOMBRE AS NOMBRE', 
                    'P.PAIS_NOMBRE AS NOMBRE_PAIS',
                )
                if(!!origen){
                    data_cotizacion["ORIGEN"] = origen["NOMBRE"]
                    data_cotizacion["PAIS_ORIGEN"] = origen["NOMBRE_PAIS"]
                }
        } else if (!!data_cotizacion.CIUDAD_ORIGEN_ID){
            const origen = await azureSqlClient({C:"CIUDAD"})
                .leftJoin({ P: "PAIS" }, function () {
                    this.on( 'P.PAIS_ID', '=', 'C.PAIS_ID');
                })
                .where('C.CIUDAD_ID',`${data_cotizacion.CIUDAD_ORIGEN_ID}`)
                .first(
                    "P.PAIS_NOMBRE AS NOMBRE_PAIS",
                    "C.CIUDAD_NOMBRE AS NOMBRE_CIUDAD",
                )
                if(!!origen){
                    data_cotizacion["ORIGEN"] = origen["NOMBRE_CIUDAD"]
                    data_cotizacion["PAIS_ORIGEN"] = origen["NOMBRE_PAIS"]
                }

        }

        if(!!data_cotizacion.PUNTOENLACE_DESTINO_ID){
            const destino = await azureSqlClient({PE:"PUNTO_ENLACE"})
                .leftJoin({ P: "PAIS" }, function () {
                    this.on( 'P.PAIS_ID', '=', 'PE.PAIS_ID');
                })
                .where('PE.PUNTOENLACE_ID',`${data_cotizacion.PUNTOENLACE_DESTINO_ID}`)
                .first(
                    'PE.PUNTOENLACE_NOMBRE AS NOMBRE', 
                    'P.PAIS_NOMBRE AS NOMBRE_PAIS',
                )
                if(!!destino){
                    data_cotizacion["DESTINO"] = destino["NOMBRE"]
                    data_cotizacion["PAIS_DESTINO"] = destino["NOMBRE_PAIS"]
                }
        } else if (!!data_cotizacion.CIUDAD_DESTINO_ID){
            const destino = await azureSqlClient({C:"CIUDAD"})
                .leftJoin({ P: "PAIS" }, function () {
                    this.on( 'P.PAIS_ID', '=', 'C.PAIS_ID');
                })
                .where('C.CIUDAD_ID',`${data_cotizacion.CIUDAD_DESTINO_ID}`)
                .first(
                    "P.PAIS_NOMBRE AS NOMBRE_PAIS",
                    "C.CIUDAD_NOMBRE AS NOMBRE_CIUDAD",
                )
                if(!!destino){
                    data_cotizacion["DESTINO"] = destino["NOMBRE_CIUDAD"]
                    data_cotizacion["PAIS_DESTINO"] = destino["NOMBRE_PAIS"]
                }

        }

        const datos = {
            horizontal: false,
            tamano: "letter",
            fechaActual: `${moment(data_cotizacion.FECHA_CREACION).format('DD-MM-YYYY')}`,
            centroCosto:  data_cotizacion.COD_CENCO,
            codCotizacion: data_cotizacion.COD_COTIZACION_CABECERA,
            ano: `${new Date(data_cotizacion.FECHA_CREACION).getFullYear()}`,
            version: data_cotizacion.VERSION,
            cliente: data_cotizacion.ENTIDAD_NOMBRE,
            entidad_id: data_cotizacion.ENTIDAD_ID,
            tipo_transporte: data_cotizacion.COD_TIPO_TRANSPORTE == 51 ? 2 : data_cotizacion.COD_TIPO_TRANSPORTE == 50 ? 1 : 0,
            incoterm: data_cotizacion.INCOTERM_CODIGO,
           
            origen: (data_cotizacion.COD_TIPO_TRANSPORTE == 51 ? data_cotizacion?.DIRECCION_ORIGEN : data_cotizacion.ORIGEN) || "-",
            paisOrigen: data_cotizacion.PAIS_ORIGEN || "-",
            destino:  (data_cotizacion.COD_TIPO_TRANSPORTE == 51 ? data_cotizacion?.DIRECCION_DESTINO : data_cotizacion.DESTINO) || "-",
            paisDestino: data_cotizacion.PAIS_DESTINO || "-",

            salidas: data_cotizacion.SALIDA || "Semanales",
            opcionales: data_cotizacion.OPCIONALES || "",
            fechaVencimiento: `${moment(data_cotizacion.FECHA_VENCIMIENTO).format('DD-MM-YYYY')}`,
            nombreCreador: `${data_cotizacion.EMPLEADO_NOMBRES || ""} ${data_cotizacion.EMPLEADO_APELLIDOS || ""}`,
            puestoCreador: !!data_cotizacion.PUESTO_DESC ? `${data_cotizacion.PUESTO_DESC}` :  "Servicio al cliente",

            pesoVolumetrico: data_dimension?.COTDETDIM_TOTAL_VOLUMEN || 0,
            pesoReal: data_dimension?.COTDETDIM_TOTAL_PESO || 0,
            chargeWeight: Math.max(data_dimension?.COTDETDIM_TOTAL_VOLUMEN || 0, data_dimension?.COTDETDIM_TOTAL_PESO || 0),
            peso: data_dimension?.COTDETDIM_TOTAL_PESO || 0,
            volumen: data_dimension?.COTDETDIM_TOTAL_VOLUMEN || 0,
            tarifa: data_cotizacion.tarifa || "",

            observacionServicio: data_cotizacion.OBSERVACION || "",
            contacto: data_cotizacion.ENTIDADCONTACTO_NOMBRE || "",
            tipoServicio: data_cotizacion.TIPO_SERVICIO_TXT || "",
            tiempoTransito: data_cotizacion.TIPO_TRANSITO || "",

            tipo_pago: data_cotizacion.COD_TIPO_PAGO,
            estacion: data_cotizacion.ESTACION_NOMBRE || "",
            contactoEstacion: data_cotizacion.CONTACTO_ESTACION || "",

            totalPiezas: no_piezas.TOTAL || 0,
            tipoProducto: data_cotizacion.TIPO_PRODUCTO || "",
        };

       if(data_cotizacion.COD_TIPO_PAGO == 131 && !!data_cotizacion.ENTIDAD_ID_ESTACION){
          
            let ruta_prepaid = ""
            let ruta_collect = ""

            try {

                if(tipo_documento == "prepaid" || !tipo_documento){
                    ruta_prepaid = await generar_documento_idioma({ 
                        pdfData: datos, 
                        pdfItems: groupByRubro(consulta_rubros).filter(rub => rub.tipo_pago == 128), 
                        guardarSFTP: true, 
                        copiaLocal: false,
                        prepaid: true,
                        idioma: idioma
                    })
                }

                if(tipo_documento == "collect" || !tipo_documento){
                    ruta_collect = await generar_documento_idioma({ 
                        pdfData: datos, 
                        pdfItems: groupByRubro(consulta_rubros).filter(rub => rub.tipo_pago == 127), 
                        guardarSFTP: true, 
                        copiaLocal: false,
                        collect: true,
                        idioma: idioma
                    })
                }

            } catch(e){
                console_log(e.toString());
                return { success: false, cod_mensaje: 1042, error: e.toString() };
            }

            if((busca_documento_prepaid?.data?.length > 0) && (busca_documento_collect?.data?.length > 0)){

                if(tipo_documento == "prepaid" || !tipo_documento){
                    const actualiza_cotizacio_documento_prepaid = await this.actualizar_cotizacion_documento({
                        cotizaciondocumento_id: busca_documento_prepaid.data[0]["COTIZACIONDOCUMENTO_ID"],
                        cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
                        cod_tip_doc: 352,
                        url_documento: ruta_prepaid,
                        cod_estado: 1
                    })   
                    if(!actualiza_cotizacio_documento_prepaid.success) return actualiza_cotizacio_documento_prepaid
                }

                if(tipo_documento == "collect" || !tipo_documento){
                    const actualiza_cotizacio_documento_collect = await this.actualizar_cotizacion_documento({
                        cotizaciondocumento_id: busca_documento_collect.data[0]["COTIZACIONDOCUMENTO_ID"],
                        cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
                        cod_tip_doc: 353,
                        url_documento: ruta_collect,
                        cod_estado: 1
                    })  
                    if(!actualiza_cotizacio_documento_collect.success) return actualiza_cotizacio_documento_collect
                } 

                return {
                    success: true,
                    cod_mensaje: 1041,
                    mensaje: 'Documento actualizado',
                    cotizaciondocumento_id_prepaid: 
                        (tipo_documento == "prepaid" || !tipo_documento) ? busca_documento_prepaid.data[0].COTIZACIONDOCUMENTO_ID : undefined,
                    url_documento_prepaid:  
                        (tipo_documento == "prepaid" || !tipo_documento) ?  ruta_prepaid : undefined,
                    cotizaciondocumento_id_collect: 
                        (tipo_documento == "collect" || !tipo_documento) ? busca_documento_collect.data[0].COTIZACIONDOCUMENTO_ID : undefined,
                    url_documento_collect: 
                        (tipo_documento == "collect" || !tipo_documento) ? ruta_collect : undefined,
                }
            } 


            const crea_cotizacio_documento_prepaid = await this.crear_cotizacion_documento({
                cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
                cod_cotizaciondetalle: campos.cod_cotizaciondetalle,
                cod_tip_doc: 352,
                url_documento: ruta_prepaid
            })  
            
            const crea_cotizacio_documento_collect = await this.crear_cotizacion_documento({
                cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
                cod_cotizaciondetalle: campos.cod_cotizaciondetalle,
                cod_tip_doc: 353,
                url_documento: ruta_collect
            })  

            if((!crea_cotizacio_documento_prepaid.success) || (!crea_cotizacio_documento_collect.success)){
                return !crea_cotizacio_documento_collect.success ? crea_cotizacio_documento_collect : crea_cotizacio_documento_prepaid
            }

            return {
                success: true,
                cod_mensaje: 1041,
                mensaje: 'Documento generado',
                cotizaciondocumento_id_prepaid: crea_cotizacio_documento_prepaid.cotizaciondocumento_id,
                url_documento_prepaid: ruta_prepaid,
                cotizaciondocumento_id_collect: crea_cotizacio_documento_collect.cotizaciondocumento_id,
                url_documento_collect: ruta_collect
            }
        } 

        let ruta = ""
        try {
            ruta = await generar_documento_idioma({ 
                pdfData: datos, 
                pdfItems: groupByRubro(consulta_rubros), 
                guardarSFTP: true, 
                copiaLocal: false,
                idioma: idioma

            })

        } catch(e){
            console_log(e.toString());
            return { success: false, cod_mensaje: 1042, error: e.toString() };
        }

        if(busca_documento?.data?.length > 0){
            const actualiza_cotizacio_documento = await this.actualizar_cotizacion_documento({
                cotizaciondocumento_id: busca_documento.data[0]["COTIZACIONDOCUMENTO_ID"],
                cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
                cod_tip_doc: 341,

                url_documento: ruta,
                cod_estado: 1
            })   
            if(!actualiza_cotizacio_documento.success){
                return actualiza_cotizacio_documento
            }
            return {
                success: true,
                cod_mensaje: 1041,
                mensaje: 'Documento actualizado',
                cotizaciondocumento_id: busca_documento.data[0]["COTIZACIONDOCUMENTO_ID"],
                url_documento: ruta
            }
        } 

        const crea_cotizacio_documento = await this.crear_cotizacion_documento({
            cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
            cod_cotizaciondetalle: campos.cod_cotizaciondetalle,
            cod_tip_doc: 341,
            url_documento: ruta
        })        

        if(!crea_cotizacio_documento.success){
            return crea_cotizacio_documento
        }

        return {
            success: true,
            cod_mensaje: 1041,
            mensaje: 'Documento generado',
            cotizaciondocumento_id: crea_cotizacio_documento.cotizaciondocumento_id,
            url_documento: ruta
        }
            
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
}

async function generar_documento_idioma(data){
    const { idioma } = data
    if(idioma == "es"){
        return await generarPDFCotizacion(data)
    } else {
        return await generarPDFCotizacionIngles(data)
    }
}

function groupByRubro(items) {
  const grouped = {};

  for (const item of items) {
    const rubro = item.rubro;
    const detalle = item.detalle;
    const monto = item.monto ?? 0; 
    const tipo_pago = item.tipo_pago

    if (!grouped[rubro]) {
      grouped[rubro] = {
        rubro,
        detalle: "",
        detalle_arr: [],
        moneda: item.moneda,
        tipo_pago,
        monto: 0,
      };
    }

    if(!!detalle){
        grouped[rubro].detalle_arr.push(detalle)
        grouped[rubro].detalle =  grouped[rubro].detalle_arr.join(", ")
    }
    grouped[rubro].monto += monto;
  }

  return Object.values(grouped);
}


module.exports.enviar_cotizacion = async (campos) => {
    if( 'cod_cotizacion_cabecera' in campos && 'cod_cotizaciondetalle' in campos){

        const consulta_cotizacion = azureSqlClient({ CD: "COTIZACION_DETALLE" })
        .leftJoin({ CC: "COTIZACION_CABECERA" }, function () {
            this.on( 'CC.COTIZACIONCABECERA_ID', '=', 'CD.COTIZACIONCABECERA_ID');
        })   
        .leftJoin({ EMP: "EMPRESA" }, function () {
            this.on( 'CC.EMPRESA_ID', '=', 'EMP.EMPRESA_ID');
        }) 
        .leftJoin({ CCO: "CENTRO_COSTO" }, function () {
            this.on( 'CC.CENCO_ID', '=', 'CCO.CENCOS_ID');
        })  
        .leftJoin({ CL: "ENTIDAD" }, function () {
            this.on( 'CL.ENTIDAD_ID', '=', 'CC.ENTIDAD_ID');
        }) 
        .leftJoin({ PEO: "PUNTO_ENLACE" }, function () {
            this.on( 'PEO.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_ORIGEN_ID');
        }) 
        .leftJoin({ PO: "PAIS" }, function () {
            this.on( 'PO.PAIS_ID', '=', 'PEO.PAIS_ID');
        }) 
        .leftJoin({ PED: "PUNTO_ENLACE" }, function () {
            this.on( 'PED.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_DESTINO_ID');
        }) 
        .leftJoin({ PD: "PAIS" }, function () {
            this.on( 'PD.PAIS_ID', '=', 'PED.PAIS_ID');
        }) 
        .leftJoin({ IT: "INCOTERM" }, function () {
            this.on( 'IT.INCOTERM_ID', '=', 'CC.INCOTERM_ID');
        }) 
        .leftJoin({ UE: "USUARIO_EMPLEADO_PUESTO" }, function () {
            this.on( 'UE.USUARIO_ID', '=', 'CD.USUARIO_ID');
        })
        .leftJoin({ E: "EMPLEADO" }, function () {
            this.on( 'E.EMPLEADO_ID', '=', 'UE.EMPLEADO_ID');
        })
        .leftJoin({ P: "PUESTO" }, function () {
            this.on( 'P.PUESTO_ID', '=', 'UE.PUESTO_ID');
        })
        .where('CD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
        
        const data_cotizacion = await consulta_cotizacion.first(
            'CC.COTIZACIONCABECERA_ID AS COD_COTIZACION_CABECERA',
            'CC.CENCO_ID AS COD_CENCO',
            'CCO.CENCOD_NOMBRE AS NOMBRE_CENCO',
            'CC.EMPRESA_ID AS COD_EMPRESA',
            'EMP.EMPRESA_NOMBRE',
            'CC.ENTIDAD_ID',
            'CC.ENTIDADCONTACTO_ID',
            'CL.ENTIDAD_NOMBRE',
            'E.EMPLEADO_NOMBRES',
            'E.EMPLEADO_APELLIDOS',
            'P.PUESTO_DESCRIPCION AS PUESTO_DESC' 
        );

        const lista_distribucion = await azureSqlClient({EC:"ENTIDAD_CONTACTO"})
        .where('EC.ENTIDADCONTACTO_ID',`${data_cotizacion.ENTIDADCONTACTO_ID}`)
        .select(
            "EC.ENTIDADCONTACTO_EMAIL",
        )
        
        const documentos = await this.generar_pdf_cotizacion_detalle(campos)
        let rutas = [] 
        if(!!documentos){
            if(documentos.url_documento) rutas.push(documentos.url_documento)
            if(documentos.url_documento_prepaid) rutas.push(documentos.url_documento_prepaid)
            // if(documentos.url_documento_collect) rutas.push(documentos.url_documento_collect)
        }

        const json_data = await get_resumen_coordinacion({embarque_id: campos.embarque_id})

        const enlace = await crea_link_carta_instrucciones_2({
            entidad_id: data_cotizacion.ENTIDAD_ID,
            cod_cotizacion_cabecera: campos.cod_cotizacion_cabecera,
            cod_cotizaciondetalle: campos.cod_cotizaciondetalle,
            cod_modulo: 12, 
            json_data: json_data || {},
            cod_cc: data_cotizacion.COD_CENCO,
            cod_empresa: data_cotizacion.COD_EMPRESA,
            endpoint_front: global.request_url || process.env.URL_FRONT || "http://appdev.cropa.com.gt",
            url_front: '/public/cts',
            embarque_id: campos.embarque_id,
        })

        const notificacion = await insertar_notificacion_correo_transaccion({
            "autor": "CROPA",
            "asunto": `COTIZACION #${data_cotizacion.COD_COTIZACION_CABECERA} APROBADA - CROPA DSV`,
            "nombre": null,
            "lista_distribucion": lista_distribucion.map(contacto => contacto.ENTIDADCONTACTO_EMAIL).filter(email => validateEmail(email)).join(","),
            "version": "0.0.1",
            "html_doc": generar_html_cotizacion_aprobada({
                cliente: data_cotizacion.ENTIDAD_NOMBRE,
                empleado: `${data_cotizacion.EMPLEADO_NOMBRES} ${data_cotizacion.EMPLEADO_APELLIDOS}`,
                puesto: `${data_cotizacion.PUESTO_DESC}`, 
                empresa: `${data_cotizacion.EMPRESA_NOMBRE}`, 
                cenco: `${data_cotizacion.NOMBRE_CENCO}`, 
                enlace: enlace?.url_cliente || "http://appdev.cropa.com.gt/"
            }),
            "attachments": rutas.join(",")
        })
        return {
            success: true,
            cod_mensaje: 1041,
            mensaje: 'Cotizacion enviada'
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
