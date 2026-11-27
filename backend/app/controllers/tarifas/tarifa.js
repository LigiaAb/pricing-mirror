const dayjs = require("dayjs")
const { insertar_notificacion_correo_transaccion } = require("../admon/notificaciones/notificacion_correo")
const { generar_html_notificacion_vencidas_y_por_vencer } = require("../admon/notificaciones/plantilla_html_notificacion_vencidas")

module.exports.calcular_tarifa_plantilla = async (campos) => {

    if(('cod_tarifaplantilla' in campos)

        // --- CAMPOS OBLIGATORIOS ---
        // campos.cod_empresa
        // campos.cod_cc
        // campos.cod_tipo_servicio
        // campos.cod_tipo_transporte

        // --- CRITERIOS OBLIGATORIOS ---
        // campos.entidad_id
        
        // --- POSIBLES CRITERIOS ---
        // campos.cod_puntoenlace_origen
        // campos.cod_puntoenlace_destino

        // campos.valor_libras
        // campos.valor_kilos
        // campos.valor_flete
        // campos.valor_dueagent
        // campos.valor_cwm 
        // campos.cod_equipo

        // campos.cod_tipo_carga
        // campos.cod_clasificacion_carga
        // campos.incoterm_id
        // campos.cod_tipo_pago

    ){

        if(campos.cod_tarifaplantilla == 0){
            return await this.calcular_tarifa_servicios(campos)
        }

        const fecha_actual = await cropa_fecha_hora_actual()

        const consultaLoc = await azureSqlClient({PE: "PUNTO_ENLACE"})
        .leftJoin({ PA: "PAIS" }, function () {
            this.on( 'PA.PAIS_ID', '=', 'PE.PAIS_ID')
        })
        .select('PE.PUNTOENLACE_ID', "PA.PAIS_ID", "PA.CONTINENTE_ID")

        const catalogo_localizacion = {}
        for(const i of consultaLoc){
            catalogo_localizacion[i.PUNTOENLACE_ID] = i
        }

        const consultaRubros =  azureSqlClient({TP:"TARIFA_PLANTILLA"})
        .leftJoin({TPR:"TARIFA_PLANTILLA_RUBRO"}, function () {
            this.on( 'TPR.TARIFAPLANTILLA_ID', '=', 'TP.TARIFAPLANTILLA_ID');
        })
        .leftJoin({R:"RUBRO"}, function () {
            this.on( 'R.RUBRO_ID', '=', 'TPR.RUBRO_ID');
        })
        .where('TP.TARIFAPLANTILLA_ID', campos.cod_tarifaplantilla)
        .where('TP.ESTADO_ID', 1)
        .where('R.ESTADO_ID', 1)
        
        const rubros = await consultaRubros.select(
            'R.RUBRO_ID AS COD_RUBRO', 
            'R.RUBRO_NOMBRE AS NOMBRE_RUBRO', 
            'TP.TIPO_SERVICIO_ID AS COD_TIPO_SERVICIO',
            'TP.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE',
            'TP.TIPO_CARGA_ID AS COD_TIPO_CARGA',
            'TP.CLASIFICACION_CARGA_ID AS COD_CLASIFICACION_CARGA',
            'TP.INCOTERM_ID',
            'TP.TIPO_PAGO_ID AS COD_TIPO_PAGO',
            'TPR.TARIFAPLANTILLARUBRO_OBLIGATORIO AS OBLIGATORIO',
            'TPR.TARIFAPLANTILLARUBRO_COSTO AS COSTO',
            'TPR.TARIFAPLANTILLARUBRO_VENTA AS VENTA',
            'R.ES_FLETE'
        )

        for await (let rubro of rubros) {

            if(rubro.COSTO && rubro.VENTA){
                rubro.SERVICIOS = []
                continue
            }

            const consultaServicios =  azureSqlClient({S:"SERVICIO"})
            .leftJoin({ TS: "TIPO" }, function () {
                this.on( 'TS.TIPO_ID', '=', 'S.TIPO_SERVICIO_ID');
            })
            .leftJoin({ TTR: "TIPO" }, function () {
                this.on( 'TTR.TIPO_ID', '=', 'S.TIPO_TRANSPORTE_ID');
            })
            .leftJoin({ TC: "TIPO" }, function () {
                this.on( 'TC.TIPO_ID', '=', 'S.TIPO_CALCULO_ID');
            })
            .leftJoin({ TA: "TIPO" }, function () {
                this.on( 'TA.TIPO_ID', '=', 'S.TIPO_APLICACION_ID');
            })
            .leftJoin({ TCA: "TIPO" }, function () {
                this.on( 'TCA.TIPO_ID', '=', 'S.TIPO_CARGA_ID');
            })
            .leftJoin({ CLA: "TIPO" }, function () {
                this.on( 'CLA.TIPO_ID', '=', 'S.CLASIFICACION_CARGA_ID');
            })
            .leftJoin({ TP: "TIPO" }, function () {
                this.on( 'TP.TIPO_ID', '=', 'S.TIPO_PAGO_ID');
            })
            .leftJoin({E:"ENTIDAD"}, function () {
                this.on( 'E.ENTIDAD_ID', '=', 'S.ENTIDAD_ID');
            })
            .leftJoin({IT:"INCOTERM"}, function () {
                this.on( 'IT.INCOTERM_ID', '=', 'S.INCOTERM_ID');
            })
            .where('S.TIPO_TRANSPORTE_ID', rubro.COD_TIPO_TRANSPORTE)
            .where('S.RUBRO_ID', rubro.COD_RUBRO)
            .where('S.ESTADO_ID', 1)

            if('cod_tipo_servicio' in campos && !!campos.cod_tipo_servicio){
                consultaServicios.where(function() {
                    this.where('S.TIPO_SERVICIO_ID',`${campos.cod_tipo_servicio}`)
                    .orWhereNull('S.TIPO_SERVICIO_ID')
                })

            } else {
                const tipo_servicio_posible = await azureSqlClient({ TR: "TIPO_RELACION" })
                .leftJoin({ T: "TIPO" }, function () {
                    this.on( 'T.TIPO_ID', '=', 'TR.TIPO_ID');
                })
                .leftJoin({ TP: "TIPO" }, function () {
                    this.on( 'TP.TIPO_ID', '=', 'TR.TIPO_PADRE_ID');
                })
                .where('TR.TIPO_PADRE_ID', `${campos.cod_tipo_transporte}`)
                .where('T.TIPO_TABLA', `SERVICIO`)
                .where('T.ESTADO_ID', 1)
                .where('TP.ESTADO_ID', 1)
                .where('TR.ESTADO_ID', 1)
                .select(
                    "TR.TIPO_ID",
                );
                consultaServicios.where(function() {
                    this.whereIn('S.TIPO_SERVICIO_ID', tipo_servicio_posible.map(tipo => tipo.TIPO_ID))
                    .orWhereNull('S.TIPO_SERVICIO_ID')
                })
            }

            if('cod_tipo_carga' in campos){
                consultaServicios.where(function() {
                    this.where('S.TIPO_CARGA_ID',`${campos.cod_tipo_carga}`)
                    .orWhere('S.TIPO_CARGA_ID', 119)
                    .orWhereNull('S.TIPO_CARGA_ID')
                })
            } 

            if('cod_clasificacion_carga' in campos){
                consultaServicios.where(function() {
                    this.where('S.CLASIFICACION_CARGA_ID',`${campos.cod_clasificacion_carga}`)
                    .orWhere('S.CLASIFICACION_CARGA_ID', 123)
                    .orWhereNull('S.CLASIFICACION_CARGA_ID')
                })
            }

            if(('incoterm_id' in campos)){
                consultaServicios.where(function() {
                    this.where('S.INCOTERM_ID',`${campos.incoterm_id}`)
                    .orWhereNull('S.INCOTERM_ID')
                })
            }       
            
            if('cod_tipo_pago' in campos){
                consultaServicios.where(function() {
                    this.where('S.TIPO_PAGO_ID',`${campos.cod_tipo_pago}`)
                    .orWhere('S.TIPO_PAGO_ID', 131)
                    .orWhereNull('S.TIPO_PAGO_ID')
                })
            }

            if('categoria_transporte' in campos){
                consultaServicios.where(function() {
                    this.where('S.CATEGORIA_TRANSPORTE',`${campos.categoria_transporte}`)
                    .orWhereNull('S.CATEGORIA_TRANSPORTE')
                })
            }

            if('cod_proveedor' in campos){
                consultaServicios.whereIn('S.ENTIDAD_ID', Array.isArray(campos.cod_proveedor) ? campos.cod_proveedor : [campos.cod_proveedor])
            }

            let servicios = await consultaServicios.select(
                'S.SERVICIO_ID AS COD_SERVICIO', 
                'S.SERVICIO_NOMBRE AS NOMBRE', 
                'S.SERVICIO_SIGLAS AS SIGLAS', 
                'S.SERVICIO_INTERNO', 
                'S.RUBRO_ID AS COD_RUBRO', 

                'S.TIPO_SERVICIO_ID AS COD_TIPO_SERVICIO', 
                'TS.TIPO_DESCRIPCION AS TIPO_SERVICIO_DESC', 
                'S.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
                'TTR.TIPO_DESCRIPCION AS TIPO_TRANSPORTE_DESC', 

                'S.ENTIDAD_ID',
                'E.ENTIDAD_NOMBRE',

                'S.TIPO_CALCULO_ID AS COD_TIPO_CALCULO',
                'TC.TIPO_DESCRIPCION AS TIPO_CALCULO_DESC', 
                'S.TIPO_APLICACION_ID AS COD_TIPO_APLICACION',
                'TA.TIPO_DESCRIPCION AS TIPO_APLICACION_DESC', 

                'S.TIPO_CARGA_ID AS COD_TIPO_CARGA',
                'TCA.TIPO_DESCRIPCION AS TIPO_CARGA_DESC', 
                'S.CLASIFICACION_CARGA_ID AS COD_CLASIFICACION_CARGA',
                'CLA.TIPO_DESCRIPCION AS CLASIFICACION_CARGA_DESC', 
                'S.TIPO_PAGO_ID AS COD_TIPO_PAGO',
                'TP.TIPO_DESCRIPCION AS TIPO_PAGO_DESC', 
                'S.SERVICIO_CLASIFICACION',
                'S.CATEGORIA_TRANSPORTE',

                "IT.INCOTERM_ID",
                "IT.INCOTERM_CODIGO",
                "IT.INCOTERM_NOMBRE",

                'S.OBLIGATORIO'
            )

            rubro.SERVICIOS = []

            for await (let servicio of servicios) {

                const metodo = await azureSqlClient({M:"METODO"})
                .leftJoin({ TM: "TIPO" }, function () {
                    this.on( 'TM.TIPO_ID', '=', 'M.TIPO_ID');
                })
                .leftJoin({ TTA: "TIPO" }, function () {
                    this.on( 'TTA.TIPO_ID', '=', 'M.TIPO_TARIFA_ID');
                })
                .where('M.SERVICIO_ID', servicio.COD_SERVICIO)
                .where('M.ESTADO_ID', 1)
                .where(function() {
                    this.whereRaw('CAST(M.METODO_FECHA_FINAL AS DATE) >= CAST(? AS DATE)', [fecha_actual])
                        .orWhereNull('M.METODO_FECHA_FINAL')
                })
                .where(function() {
                    this.whereRaw('CAST(M.METODO_FECHA_INICIAL AS DATE) <= CAST(? AS DATE)', [fecha_actual])
                        .orWhereNull('M.METODO_FECHA_INICIAL')
                })
                .select(
                    'M.METODO_ID AS COD_METODO', 
                    'M.TIPO_ID AS COD_TIPO_METODO', 
                    'TM.TIPO_DESCRIPCION AS TIPO_METODO_DESC', 
                    'M.TIPO_TARIFA_ID AS COD_TIPO_TARIFA', 
                    'TTA.TIPO_DESCRIPCION AS TIPO_TARIFA_DESC', 
                    'M.METODO_TODOS_LOS_PAISES',
                    'M.METODO_TODOS_LOS_CLIENTES',
                    'M.METODO_TODOS_LOS_COMMODITIES',
                ).first()

                if(metodo){
                    let porcentaje = false
                    let cod_rubro = 0

                     const ruta = await validarRutas({
                        "cod_metodo": metodo.COD_METODO, 
                        "metodo_todos_los_paises": metodo.METODO_TODOS_LOS_PAISES, 
                        "cod_puntoenlace_origen": campos.cod_puntoenlace_origen, 
                        "cod_puntoenlace_destino": campos.cod_puntoenlace_destino, 
                        "cod_ciudad_origen": campos.cod_ciudad_origen, 
                        "cod_ciudad_destino": campos.cod_ciudad_destino, 
                        "cod_pais_origen": catalogo_localizacion[campos.cod_puntoenlace_origen]["PAIS_ID"], 
                        "cod_pais_destino": catalogo_localizacion[campos.cod_puntoenlace_destino]["PAIS_ID"], 
                        "cod_continente_origen": catalogo_localizacion[campos.cod_puntoenlace_origen]["CONTINENTE_ID"], 
                        "cod_continente_destino": catalogo_localizacion[campos.cod_puntoenlace_destino]["CONTINENTE_ID"], 
                        "cod_cc": campos.cod_cc
                    })

                    const entidad = await validarEntidad(metodo.COD_METODO, campos.entidad_id, metodo.COD_TIPO_TARIFA)
                    const commodity = await validarCommodity(metodo.COD_METODO, metodo.METODO_TODOS_LOS_COMMODITIES, campos.cod_commodity)
                    const valor_calculo = obtenerValorCalculo({...campos, cod_tipo_calculo: servicio.COD_TIPO_CALCULO})

                    // Consulta de fletes: no trae valor_flete. El 504 no usa valor_calculo.
                    const fleteCostoPorcentajeSinValor =
                        metodo.COD_TIPO_METODO == 504 && !!rubro.ES_FLETE && campos.valor_flete == null

                    if(!valor_calculo && !fleteCostoPorcentajeSinValor) continue
                    // NO SE HA ENVIADO EL VALOR CORRECTO PARA EL CALCULO
                    if(!valor_calculo) continue

                    // EL METODO NO APLICA PARA EL PAIS O LA ENTIDAD
                    if(!ruta || !entidad) continue 
                    
                    let costo = 0
                    let venta = 0
                    let cod_moneda_costo = 0
                    let cod_moneda_venta = 0
                    let rate_costo = 0
                    let rate_venta = 0
                    
                    if(metodo.COD_TIPO_METODO == 101){
                        const inferior = await azureSqlClient({TR:"TARIFA_RANGO"})
                        .where('TR.METODO_ID', metodo.COD_METODO)
                        .where('TR.ESTADO_ID', 1)
                        .select(
                            'TR.TARIFARANGO_COSTO AS COSTO', 
                            'TR.TARIFARANGO_VENTA AS VENTA', 
                            'TR.TARIFARANGO_COSTO_MINIMO AS COSTO_MINIMO', 
                            'TR.TARIFARANGO_VENTA_MINIMO AS VENTA_MINIMO',  
                            'TR.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
                            'TR.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
                        )
                        .orderBy('TR.TARIFARANGO_INICIO', 'ASC')
                        .first()

                         const calculo = await azureSqlClient({TR:"TARIFA_RANGO"})
                        .where('TR.METODO_ID', metodo.COD_METODO)
                        .where('TR.ESTADO_ID', 1)
                        .where('TR.TARIFARANGO_INICIO', '<=', valor_calculo)
                        .select(
                            'TR.TARIFARANGO_COSTO AS COSTO', 
                            'TR.TARIFARANGO_VENTA AS VENTA', 
                            'TR.TARIFARANGO_COSTO_MINIMO AS COSTO_MINIMO', 
                            'TR.TARIFARANGO_VENTA_MINIMO AS VENTA_MINIMO',  
                            'TR.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
                            'TR.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
                        )
                        .orderBy('TR.TARIFARANGO_INICIO', 'DESC')
                        .first()

                        if(calculo){
                            costo = calculo.COSTO_MINIMO > (calculo.COSTO * valor_calculo) ? calculo.COSTO_MINIMO : (calculo.COSTO * valor_calculo)
                            venta = calculo.VENTA_MINIMO > (calculo.VENTA * valor_calculo) ? calculo.VENTA_MINIMO : (calculo.VENTA * valor_calculo)
                            cod_moneda_costo = calculo.COD_MONEDA_COSTO
                            cod_moneda_venta = calculo.COD_MONEDA_VENTA
                            rate_costo = calculo.COSTO_MINIMO > (calculo.COSTO * valor_calculo) ? calculo.COSTO_MINIMO : calculo.COSTO 
                            rate_venta = calculo.VENTA_MINIMO > (calculo.VENTA * valor_calculo) ? calculo.VENTA_MINIMO : calculo.VENTA 
                        } else {
                            if(!inferior) continue
                            costo = inferior.COSTO_MINIMO
                            venta = inferior.VENTA_MINIMO
                            cod_moneda_costo = inferior.COD_MONEDA_COSTO
                            cod_moneda_venta = inferior.COD_MONEDA_VENTA
                            rate_costo = 0
                            rate_venta = 0
                        }

                    } else if(metodo.COD_TIPO_METODO == 102){
                        const calculo = await azureSqlClient({TCV:"TARIFA_COSTOVENTA"})
                        .where('TCV.METODO_ID', metodo.COD_METODO)
                        .select( 
                            'TCV.COSTOVENTA_COSTO AS COSTO', 
                            'TCV.COSTOVENTA_VENTA AS VENTA', 
                            'TCV.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
                            'TCV.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
                        ).first()
                        
                        if(calculo){
                            costo = calculo.COSTO * valor_calculo
                            venta = calculo.VENTA * valor_calculo
                            rate_costo = calculo.COSTO 
                            rate_venta = calculo.VENTA
                            cod_moneda_costo = calculo.COD_MONEDA_COSTO
                            cod_moneda_venta = calculo.COD_MONEDA_VENTA
                        } else {
                            continue
                        }

                    } else if (metodo.COD_TIPO_METODO == 103) {
                        const calculo = await azureSqlClient({TE:"TARIFA_EQUIPO"})
                        .where('TE.METODO_ID', metodo.COD_METODO)
                        .select(
                            'TE.TARIFAEQUIPO_COSTO AS COSTO', 
                            'TE.TARIFAEQUIPO_VENTA AS VENTA', 
                            'TE.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
                            'TE.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
                        ).first()
                        
                        if(calculo){
                            costo = calculo.COSTO * valor_calculo
                            venta = calculo.VENTA * valor_calculo
                            rate_costo = calculo.COSTO 
                            rate_venta = calculo.VENTA
                            cod_moneda_costo = calculo.COD_MONEDA_COSTO
                            cod_moneda_venta = calculo.COD_MONEDA_VENTA
                        } else {
                            continue
                        }

                    } else if (metodo.COD_TIPO_METODO == 148) {
                        const calculo = await azureSqlClient({TP:"TARIFA_PORCENTAJE"})
                        .where('TP.METODO_ID', metodo.COD_METODO)
                        .select(
                            'TP.TARIFAPORCENTAJE_PORCENTAJE_COSTO', 
                            'TP.TARIFAPORCENTAJE_PORCENTAJE_VENTA', 
                            'TP.MONEDA_COSTO_ID', 
                            'TP.MONEDA_VENTA_ID', 
                            'TP.RUBRO_ID ', 
                        ).first()
                        if(calculo){
                            porcentaje = true
                            cod_rubro = calculo.RUBRO_ID
                            costo = calculo.TARIFAPORCENTAJE_PORCENTAJE_COSTO
                            venta = calculo.TARIFAPORCENTAJE_PORCENTAJE_VENTA
                            cod_moneda_costo = calculo.MONEDA_COSTO_ID
                            cod_moneda_venta = calculo.MONEDA_VENTA_ID
                        }
                    } else {
                        continue
                    }

                    const detalles = await azureSqlClient({TD: "TARIFA_DETALLE"})
                        .leftJoin({ TI: "TIPO" }, function () {
                            this.on( 'TD.TIPO_ID', '=', 'TI.TIPO_ID');
                        })
                        .where('TD.METODO_ID',`${metodo.COD_METODO}`)
                        .where('TD.ESTADO_ID', 1)
                        .select(
                            "TD.TARIFADETALLE_ID", 
                            "TD.TARIFADETALLE_DESCRIPCION", 
                            "TD.TARIFADETALLE_VALOR",
                            "TD.TIPO_ID", 
                            'TI.TIPO_DESCRIPCION AS TIPO_DESC',
                        )

                    if(porcentaje){
                        rubro.SERVICIOS.push({
                        ...servicio,
                        PORCENTAJE: {
                                ...metodo,
                                COD_RUBRO: cod_rubro,
                                PORCENTAJE_COSTO: costo,
                                PORCENTAJE_VENTA: venta,
                                RATE_COSTO: rate_costo,
                                RATE_VENTA: rate_venta,
                                COD_MONEDA_COSTO: cod_moneda_costo,
                                COD_MONEDA_VENTA: cod_moneda_venta,
                                DETALLES: detalles
                            },
                        })
                    } else {
                        rubro.SERVICIOS.push({
                            ...servicio,
                            METODO: {
                                ...metodo,
                                COSTO: costo,
                                VENTA: venta,
                                RATE_COSTO: rate_costo,
                                RATE_VENTA: rate_venta,
                                COD_MONEDA_COSTO: cod_moneda_costo,
                                COD_MONEDA_VENTA: cod_moneda_venta,
                                DETALLES: detalles
                            },
                        })
                    }
                }
            }
        }

        return rubros


    }else{
        return {'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Debe enviar los atributos requeridos'};
    }
    

}

module.exports.calcular_tarifa_servicios = async (campos) => {

    if(('cod_cc' in campos) && ('cod_empresa' in campos) && ('cod_tipo_transporte' in campos) 
       && ('entidad_id' in campos)

        // --- CAMPOS OBLIGATORIOS ---
        // campos.cod_empresa
        // campos.cod_cc
        // campos.cod_tipo_servicio
        // campos.cod_tipo_transporte

        // --- CAMPOS OPCIONALES
        // campos.cod_tipo_carga
        // campos.cod_clasificacion_carga
        // campos.incoterm_id
        // campos.cod_tipo_pago

        // --- CRITERIOS OBLIGATORIOS ---
        // campos.entidad_id
        
        // --- POSIBLES CRITERIOS ---
        // campos.cod_pais_origen
        // campos.cod_pais_destino
        // campos.valor_libras
        // campos.valor_kilos
        // campos.valor_flete
        // campos.valor_dueagent
        // campos.valor_cwm 
        // campos.cod_equipo
    ){  
        const fecha_actual = await cropa_fecha_hora_actual()

        const consultaLoc = await azureSqlClient({PE: "PUNTO_ENLACE"})
        .leftJoin({ PA: "PAIS" }, function () {
            this.on( 'PA.PAIS_ID', '=', 'PE.PAIS_ID')
        })
        .select('PE.PUNTOENLACE_ID', "PA.PAIS_ID", "PA.CONTINENTE_ID")

        const consultaCiudad = await azureSqlClient({C: "CIUDAD"})
        .leftJoin({ PA: "PAIS" }, function () {
            this.on( 'PA.PAIS_ID', '=', 'C.PAIS_ID')
        })
        .select('C.CIUDAD_ID', "PA.PAIS_ID", "PA.CONTINENTE_ID")

        const catalogo_localizacion = {}
        for(const i of consultaLoc){
            catalogo_localizacion[`PE_${i.PUNTOENLACE_ID}`] = i
        }
        for(const i of consultaCiudad){
            catalogo_localizacion[`CI_${i.CIUDAD_ID}`] = i
        }

        const consultaRubros =  azureSqlClient({R:"RUBRO"})
        .where('R.ESTADO_ID', 1)

        if('cod_rubro' in campos){
            consultaRubros.whereIn('R.RUBRO_ID', Array.isArray(campos.cod_rubro) ? campos.cod_rubro : [campos.cod_rubro])
        }

        let rubros_validos = []
        
        const rubros = await consultaRubros.select(
            'R.RUBRO_ID AS COD_RUBRO', 
            'R.RUBRO_NOMBRE AS NOMBRE_RUBRO', 
            'R.ES_FLETE'
        )

        for await (let rubro of rubros) {
            const consultaServicios = azureSqlClient({S:"SERVICIO"})
            .leftJoin({E:"ENTIDAD"}, function () {
                this.on( 'E.ENTIDAD_ID', '=', 'S.ENTIDAD_ID');
            })
            .where('S.RUBRO_ID', rubro.COD_RUBRO)
            .where('S.ESTADO_ID', 1)
            .where('S.TIPO_TRANSPORTE_ID',`${campos.cod_tipo_transporte}`)
            .where('S.EMPRESA_ID',`${campos.cod_empresa}`)
            .where('S.CENCO_ID',`${campos.cod_cc}`)

            if('interna' in campos && !! campos.interna){
                consultaServicios.where('S.SERVICIO_INTERNO', 1)
            }
            
            if('cod_tipo_servicio' in campos && !!campos.cod_tipo_servicio){
                consultaServicios.where(function() {
                    this.where('S.TIPO_SERVICIO_ID',`${campos.cod_tipo_servicio}`)
                    .orWhereNull('S.TIPO_SERVICIO_ID')
                })
            } else {
                const tipo_servicio_posible = await azureSqlClient({ TR: "TIPO_RELACION" })
                .leftJoin({ T: "TIPO" }, function () {
                    this.on( 'T.TIPO_ID', '=', 'TR.TIPO_ID');
                })
                .leftJoin({ TP: "TIPO" }, function () {
                    this.on( 'TP.TIPO_ID', '=', 'TR.TIPO_PADRE_ID');
                })
                .where('TR.TIPO_PADRE_ID', `${campos.cod_tipo_transporte}`)
                .where('T.TIPO_TABLA', `SERVICIO`)
                .where('T.ESTADO_ID', 1)
                .where('TP.ESTADO_ID', 1)
                .where('TR.ESTADO_ID', 1)
                .select(
                    "TR.TIPO_ID",
                );
                consultaServicios.where(function() {
                    this.whereIn('S.TIPO_SERVICIO_ID', tipo_servicio_posible.map(tipo => tipo.TIPO_ID))
                    .orWhereNull('S.TIPO_SERVICIO_ID')
                })
            }

            if('cod_tipo_carga' in campos){
                consultaServicios.where(function() {
                    this.where('S.TIPO_CARGA_ID',`${campos.cod_tipo_carga}`)
                    .orWhere('S.TIPO_CARGA_ID', 119)
                    .orWhereNull('S.TIPO_CARGA_ID')
                })
            }

            if('cod_clasificacion_carga' in campos){
                consultaServicios.where(function() {
                    this.where('S.CLASIFICACION_CARGA_ID',`${campos.cod_clasificacion_carga}`)
                    .orWhere('S.CLASIFICACION_CARGA_ID', 123)
                    .orWhereNull('S.CLASIFICACION_CARGA_ID')
                })
            }

            if(('incoterm_id' in campos)){
                consultaServicios.where(function() {
                    this.where('S.INCOTERM_ID',`${campos.incoterm_id}`)
                    .orWhereNull('S.INCOTERM_ID')
                })
            }       
            
            if('cod_tipo_pago' in campos){
                consultaServicios.where(function() {
                    this.where('S.TIPO_PAGO_ID',`${campos.cod_tipo_pago}`)
                    .orWhere('S.TIPO_PAGO_ID', 131)
                    .orWhereNull('S.TIPO_PAGO_ID')
                })
            }

            if('categoria_transporte' in campos){
                consultaServicios.where(function() {
                    this.where('S.CATEGORIA_TRANSPORTE',`${campos.categoria_transporte}`)
                    .orWhereNull('S.CATEGORIA_TRANSPORTE')
                })
            }

            if('cod_proveedor' in campos){
                consultaServicios.whereIn('S.ENTIDAD_ID', Array.isArray(campos.cod_proveedor) ? campos.cod_proveedor : [campos.cod_proveedor])
            }

            if('cod_tipo_calculo' in campos){
                consultaServicios.where('S.TIPO_CALCULO_ID',`${campos.cod_tipo_calculo}`)
            }

            let servicios = await consultaServicios.select(
                'S.SERVICIO_ID AS COD_SERVICIO', 
                'S.SERVICIO_NOMBRE AS NOMBRE', 
                'S.SERVICIO_SIGLAS AS SIGLAS', 
                'S.SERVICIO_INTERNO', 
                'S.RUBRO_ID AS COD_RUBRO', 
                'S.TIPO_SERVICIO_ID AS COD_TIPO_SERVICIO', 
                'S.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
                'S.ENTIDAD_ID',
                'E.ENTIDAD_NOMBRE',
                'S.TIPO_CALCULO_ID AS COD_TIPO_CALCULO',
                'S.TIPO_APLICACION_ID AS COD_TIPO_APLICACION',
                'S.TIPO_CARGA_ID AS COD_TIPO_CARGA',
                'S.CLASIFICACION_CARGA_ID AS COD_CLASIFICACION_CARGA',
                'S.TIPO_PAGO_ID AS COD_TIPO_PAGO',
                'S.SERVICIO_CLASIFICACION',
                'S.CATEGORIA_TRANSPORTE',
                "S.INCOTERM_ID",
                "S.OBLIGATORIO"
            )

            if(servicios.length <= 0){
                continue
            }

            rubro.SERVICIOS = []

            for await (let servicio of servicios) {

                const metodo = await azureSqlClient({M:"METODO"})
                .leftJoin({ TM: "TIPO" }, function () {
                    this.on( 'TM.TIPO_ID', '=', 'M.TIPO_ID');
                })
                .leftJoin({ TTA: "TIPO" }, function () {
                    this.on( 'TTA.TIPO_ID', '=', 'M.TIPO_TARIFA_ID');
                })
                .where('M.SERVICIO_ID', servicio.COD_SERVICIO)
                .where('M.ESTADO_ID', 1)
                .where(function() {
                    this.whereRaw('CAST(M.METODO_FECHA_FINAL AS DATE) >= CAST(? AS DATE)', [fecha_actual])
                        .orWhereNull('M.METODO_FECHA_FINAL')
                })
                .where(function() {
                    this.whereRaw('CAST(M.METODO_FECHA_INICIAL AS DATE) <= CAST(? AS DATE)', [fecha_actual])
                        .orWhereNull('M.METODO_FECHA_INICIAL')
                })
                .select(
                    'M.METODO_ID AS COD_METODO', 
                    'M.TIPO_ID AS COD_TIPO_METODO', 
                    'TM.TIPO_DESCRIPCION AS TIPO_METODO_DESC', 
                    'M.TIPO_TARIFA_ID AS COD_TIPO_TARIFA', 
                    'TTA.TIPO_DESCRIPCION AS TIPO_TARIFA_DESC', 
                    'M.METODO_TODOS_LOS_PAISES',
                    'M.METODO_TODOS_LOS_CLIENTES',
                    'M.METODO_TODOS_LOS_COMMODITIES',
                    'M.METODO_MINIMO AS MINIMO'
                ).first()

                if(metodo){

                    const valor_calculo = obtenerValorCalculo({...campos, cod_tipo_calculo: servicio.COD_TIPO_CALCULO})
                    if(!valor_calculo) continue
                         
                    const entidad = await validarEntidad(metodo.COD_METODO, campos.entidad_id, metodo.COD_TIPO_TARIFA)
                    if(!entidad) continue

                    const key_origen = !!campos.cod_puntoenlace_origen ? `PE_${campos.cod_puntoenlace_origen}`
                                            : `CI_${campos.cod_ciudad_origen}`
                    const key_destino = !!campos.cod_puntoenlace_destino ? `PE_${campos.cod_puntoenlace_destino}`
                                            : `CI_${campos.cod_ciudad_destino}`

                    const origen = catalogo_localizacion[key_origen]
                    const destino = catalogo_localizacion[key_destino]

                    const ruta = await validarRutas({
                        "cod_metodo": metodo.COD_METODO, 
                        "metodo_todos_los_paises": metodo.METODO_TODOS_LOS_PAISES, 
                        "cod_puntoenlace_origen": campos.cod_puntoenlace_origen, 
                        "cod_puntoenlace_destino": campos.cod_puntoenlace_destino, 
                        "cod_ciudad_origen": campos.cod_ciudad_origen, 
                        "cod_ciudad_destino": campos.cod_ciudad_destino, 
                        "cod_pais_origen": origen["PAIS_ID"], 
                        "cod_pais_destino": destino["PAIS_ID"], 
                        "cod_continente_origen": origen["CONTINENTE_ID"], 
                        "cod_continente_destino": destino["CONTINENTE_ID"], 
                        "cod_cc": campos.cod_cc
                    })
                    if(!ruta) continue 

                    if(servicio.COD_TIPO_CALCULO == 340){
                        const detalles = await azureSqlClient({TD: "TARIFA_DETALLE"})
                        .where('TD.METODO_ID',`${metodo.COD_METODO}`)
                        .where('TD.ESTADO_ID', 1)
                        .select(
                            "TD.TARIFADETALLE_ID", 
                            "TD.TARIFADETALLE_DESCRIPCION", 
                            "TD.TARIFADETALLE_VALOR",
                            "TD.TIPO_ID", 
                        )
                        rubro.SERVICIOS.push({
                            ...servicio,
                            METODO: {
                                ...metodo,  
                                DETALLES: detalles,
                            },
                        })
                        continue
                    }

                    let costo = 0
                    let venta = 0
                    let rate_costo = 0
                    let rate_venta = 0
                    let cod_moneda_costo = 0
                    let cod_moneda_venta = 0
                    let porcentaje = false
                    let porcentaje_cotizacon = false
                    let cobertura = false
                    let cod_rubro = 0
                    let costo_minimo = 0
                    let venta_minimo = 0
                    let es_porcentaje = 0

                    if(metodo.COD_TIPO_METODO == 101){
                        const inferior = await azureSqlClient({TR:"TARIFA_RANGO"})
                        .where('TR.METODO_ID', metodo.COD_METODO)
                        .where('TR.ESTADO_ID', 1)
                        .select(
                            'TR.TARIFARANGO_COSTO AS COSTO', 
                            'TR.TARIFARANGO_VENTA AS VENTA', 
                            'TR.TARIFARANGO_COSTO_MINIMO AS COSTO_MINIMO', 
                            'TR.TARIFARANGO_VENTA_MINIMO AS VENTA_MINIMO',  
                            'TR.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
                            'TR.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
                        )
                        .orderBy('TR.TARIFARANGO_INICIO', 'ASC')
                        .first()

                         const calculo = await azureSqlClient({TR:"TARIFA_RANGO"})
                        .where('TR.METODO_ID', metodo.COD_METODO)
                        .where('TR.ESTADO_ID', 1)
                        .where('TR.TARIFARANGO_INICIO', '<=', valor_calculo)
                        .select(
                            'TR.TARIFARANGO_COSTO AS COSTO', 
                            'TR.TARIFARANGO_VENTA AS VENTA', 
                            'TR.TARIFARANGO_COSTO_MINIMO AS COSTO_MINIMO', 
                            'TR.TARIFARANGO_VENTA_MINIMO AS VENTA_MINIMO',  
                            'TR.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
                            'TR.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
                        )
                        .orderBy('TR.TARIFARANGO_INICIO', 'DESC')
                        .first()

                        if(calculo){
                            costo = calculo.COSTO_MINIMO > (calculo.COSTO * valor_calculo) ? calculo.COSTO_MINIMO : (calculo.COSTO * valor_calculo)
                            venta = calculo.VENTA_MINIMO > (calculo.VENTA * valor_calculo) ? calculo.VENTA_MINIMO : (calculo.VENTA * valor_calculo)
                            cod_moneda_costo = calculo.COD_MONEDA_COSTO
                            cod_moneda_venta = calculo.COD_MONEDA_VENTA
                            rate_costo = calculo.COSTO_MINIMO > (calculo.COSTO * valor_calculo) ? calculo.COSTO_MINIMO : calculo.COSTO 
                            rate_venta = calculo.VENTA_MINIMO > (calculo.VENTA * valor_calculo) ? calculo.VENTA_MINIMO : calculo.VENTA 
                        } else {
                            if(!inferior) continue
                            costo = inferior.COSTO_MINIMO
                            venta = inferior.VENTA_MINIMO
                            cod_moneda_costo = inferior.COD_MONEDA_COSTO
                            cod_moneda_venta = inferior.COD_MONEDA_VENTA
                            rate_costo = 0
                            rate_venta = 0
                        }

                    } else if(metodo.COD_TIPO_METODO == 102){
                        const calculo = await azureSqlClient({TCV:"TARIFA_COSTOVENTA"})
                        .where('TCV.METODO_ID', metodo.COD_METODO)
                        .select( 
                            'TCV.COSTOVENTA_COSTO AS COSTO', 
                            'TCV.COSTOVENTA_VENTA AS VENTA', 
                            'TCV.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
                            'TCV.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
                        ).first()
                        
                        if(calculo){
                            costo = calculo.COSTO * valor_calculo
                            venta = calculo.VENTA * valor_calculo
                            cod_moneda_costo = calculo.COD_MONEDA_COSTO
                            cod_moneda_venta = calculo.COD_MONEDA_VENTA
                            rate_costo = calculo.COSTO
                            rate_venta = calculo.VENTA
                        } else {
                            continue
                        }

                    } else if (metodo.COD_TIPO_METODO == 103) {
                        const calculo = await azureSqlClient({TE:"TARIFA_EQUIPO"})
                        .where('TE.METODO_ID', metodo.COD_METODO)
                        .select(
                            'TE.TARIFAEQUIPO_COSTO AS COSTO', 
                            'TE.TARIFAEQUIPO_VENTA AS VENTA', 
                            'TE.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
                            'TE.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
                        ).first()
                        
                        if(calculo){
                            costo = calculo.COSTO * valor_calculo
                            venta = calculo.VENTA * valor_calculo
                            cod_moneda_costo = calculo.COD_MONEDA_COSTO
                            cod_moneda_venta = calculo.COD_MONEDA_VENTA
                            rate_costo = calculo.COSTO
                            rate_venta = calculo.VENTA
                        } else {
                            continue
                        }

                    } else if (metodo.COD_TIPO_METODO == 148) {
                        const calculo = await azureSqlClient({TP:"TARIFA_PORCENTAJE"})
                        .where('TP.METODO_ID', metodo.COD_METODO)
                        .select(
                            'TP.TARIFAPORCENTAJE_PORCENTAJE_COSTO', 
                            'TP.TARIFAPORCENTAJE_PORCENTAJE_VENTA', 
                            'TP.TARIFAPORCENTAJE_MINIMO_COSTO',
                            'TP.TARIFAPORCENTAJE_MINIMO_VENTA',    
                            'TP.MONEDA_COSTO_ID', 
                            'TP.MONEDA_VENTA_ID', 
                            'TP.RUBRO_ID', 
                        ).first()

                        if(calculo){
                            porcentaje = true
                            cod_rubro = calculo.RUBRO_ID
                            costo = calculo.TARIFAPORCENTAJE_PORCENTAJE_COSTO
                            venta = calculo.TARIFAPORCENTAJE_PORCENTAJE_VENTA
                            cod_moneda_costo = calculo.MONEDA_COSTO_ID
                            cod_moneda_venta = calculo.MONEDA_VENTA_ID
                            rate_costo = calculo.TARIFAPORCENTAJE_PORCENTAJE_COSTO
                            rate_venta = calculo.TARIFAPORCENTAJE_PORCENTAJE_VENTA
                            costo_minimo = calculo.TARIFAPORCENTAJE_MINIMO_COSTO
                            venta_minimo = calculo.TARIFAPORCENTAJE_MINIMO_VENTA
                        } else {
                            continue
                        }

                    } else if (metodo.COD_TIPO_METODO == 504) {
                        const calculo = await azureSqlClient({TP:"TARIFA_PORCENTAJE"})
                        .where('TP.METODO_ID', metodo.COD_METODO)
                        .where('TP.ESTADO_ID', 1)
                        .select(
                            'TP.TARIFAPORCENTAJE_PORCENTAJE_COSTO', 
                            'TP.TARIFAPORCENTAJE_PORCENTAJE_VENTA', 
                            'TP.TARIFAPORCENTAJE_MINIMO_COSTO',
                            'TP.TARIFAPORCENTAJE_MINIMO_VENTA',    
                            'TP.MONEDA_COSTO_ID', 
                            'TP.MONEDA_VENTA_ID',
                            'TP.TARIFAPORCENTAJE_ES_PORCENTAJE',  
                        ).first()

                        if(calculo){
                            porcentaje_cotizacon = true
                            costo = calculo.TARIFAPORCENTAJE_PORCENTAJE_COSTO
                            venta = calculo.TARIFAPORCENTAJE_PORCENTAJE_VENTA
                            cod_moneda_costo = calculo.MONEDA_COSTO_ID
                            cod_moneda_venta = calculo.MONEDA_VENTA_ID
                            rate_costo = calculo.TARIFAPORCENTAJE_PORCENTAJE_COSTO
                            rate_venta = calculo.TARIFAPORCENTAJE_PORCENTAJE_VENTA
                            costo_minimo = calculo.TARIFAPORCENTAJE_MINIMO_COSTO
                            venta_minimo = calculo.TARIFAPORCENTAJE_MINIMO_VENTA
                            es_porcentaje = calculo.TARIFAPORCENTAJE_ES_PORCENTAJE
                        } else {
                            continue
                        }

                    } else if (metodo.COD_TIPO_METODO == 363) {
                        const calculo = await azureSqlClient({TP:"TARIFA_COBERTURA"})
                        .where('TP.METODO_ID', metodo.COD_METODO)
                        .select(
                            'TP.TARIFACOBERTURA_COSTO_MINIMO',
                            'TP.TARIFACOBERTURA_VENTA_MINIMO',
                            'TP.TARIFACOBERTURA_PORCENTAJE_COSTO', 
                            'TP.TARIFACOBERTURA_PORCENTAJE_VENTA', 
                            'TP.MONEDA_COSTO_ID', 
                            'TP.MONEDA_VENTA_ID', 
                        ).first()
                        if(calculo){
                            cobertura = true
                            costo = calculo.TARIFACOBERTURA_PORCENTAJE_COSTO
                            venta = calculo.TARIFACOBERTURA_PORCENTAJE_VENTA
                            costo_minimo = calculo.TARIFACOBERTURA_COSTO_MINIMO
                            venta_minimo = calculo.TARIFACOBERTURA_VENTA_MINIMO
                            cod_moneda_costo = calculo.MONEDA_COSTO_ID
                            cod_moneda_venta = calculo.MONEDA_VENTA_ID
                            rate_costo = calculo.TARIFACOBERTURA_PORCENTAJE_COSTO
                            rate_venta = calculo.TARIFACOBERTURA_PORCENTAJE_VENTA
                        } else {
                            continue
                        }
                    } else {
                        continue
                    }

                    const detalles = await azureSqlClient({TD: "TARIFA_DETALLE"})
                    .leftJoin({ TI: "TIPO" }, function () {
                        this.on( 'TD.TIPO_ID', '=', 'TI.TIPO_ID');
                    })
                    .where('TD.METODO_ID',`${metodo.COD_METODO}`)
                    .where('TD.ESTADO_ID', 1)
                    .select(
                        "TD.TARIFADETALLE_ID", 
                        "TD.TARIFADETALLE_DESCRIPCION", 
                        "TD.TARIFADETALLE_VALOR",
                        "TD.TIPO_ID", 
                        'TI.TIPO_DESCRIPCION AS TIPO_DESC',
                    )

                    if(porcentaje){
                        rubro.SERVICIOS.push({
                            ...servicio,
                            PORCENTAJE: {
                                ...metodo,
                                COD_RUBRO: cod_rubro,
                                PORCENTAJE_COSTO: costo,
                                PORCENTAJE_VENTA: venta,
                                COD_MONEDA_COSTO: cod_moneda_costo,
                                COD_MONEDA_VENTA: cod_moneda_venta,
                                DETALLES: detalles,
                                RATE_COSTO: rate_costo,
                                RATE_VENTA: rate_venta,
                                MINIMO_COSTO: costo_minimo,
                                MINIMO_VENTA: venta_minimo,
                            },
                        })
                    } else if(porcentaje_cotizacon){
                        rubro.SERVICIOS.push({
                            ...servicio,
                            PORCENTAJE_COTIZACION: {
                                ...metodo,
                                PORCENTAJE_COSTO: costo,
                                PORCENTAJE_VENTA: venta,
                                COD_MONEDA_COSTO: cod_moneda_costo,
                                COD_MONEDA_VENTA: cod_moneda_venta,
                                DETALLES: detalles,
                                RATE_COSTO: rate_costo,
                                RATE_VENTA: rate_venta,
                                MINIMO_COSTO: costo_minimo,
                                MINIMO_VENTA: venta_minimo,
                                ES_PORCENTAJE: es_porcentaje
                            },
                        })
                    } else if (cobertura){
                        rubro.SERVICIOS.push({                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                            ...servicio,
                            COBERTURA: {
                                ...metodo,
                                PORCENTAJE_COSTO: costo,
                                PORCENTAJE_VENTA: venta,
                                MINIMO_COSTO: costo_minimo,
                                MINIMO_VENTA: venta_minimo,
                                COD_MONEDA_COSTO: cod_moneda_costo,
                                COD_MONEDA_VENTA: cod_moneda_venta,
                                DETALLES: detalles,
                                RATE_COSTO: rate_costo,
                                RATE_VENTA: rate_venta
                            },
                        })
                    } else {
                        rubro.SERVICIOS.push({
                            ...servicio,
                            METODO: {
                                ...metodo,
                                COSTO: costo,
                                VENTA: venta,
                                COD_MONEDA_COSTO: cod_moneda_costo,
                                COD_MONEDA_VENTA: cod_moneda_venta,
                                DETALLES: detalles,
                                RATE_COSTO: rate_costo,
                                RATE_VENTA: rate_venta
                            },
                        })
                    }
                }
            }   
            
            //REMOVER REPETIDOS
            if(rubro.SERVICIOS.length > 1 && !rubro.ES_FLETE && (rubro.SERVICIOS[0].SERVICIO_CLASIFICACION == 274 || rubro.SERVICIOS[0].SERVICIO_CLASIFICACION == 3)){
                const mejor_match = obtenerMejorServicio( 
                    rubro.SERVICIOS, 
                    Number(campos.cod_clasificacion_carga) || null, 
                    Number(campos.cod_tipo_carga) || null,
                    Number(campos.cod_tipo_servicio) || null,
                    Number(campos.categoria_transporte) || null
                )
                rubro.SERVICIOS = [mejor_match]
            }

            rubros_validos.push(rubro)
        }

        return rubros_validos

    }else{
        return {'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Debe enviar los atributos requeridos'};
    }
    

}

module.exports.calcular_scalling_fee = async (campos) => {

    if(('cod_cc' in campos) && ('cod_empresa' in campos) && ('cod_tipo_transporte' in campos) 
       && ('entidad_id' in campos)

        // --- CAMPOS OBLIGATORIOS ---
        // campos.cod_empresa
        // campos.cod_cc
        // campos.cod_tipo_servicio
        // campos.cod_tipo_transporte

        // --- CAMPOS OPCIONALES
        // campos.cod_tipo_carga
        // campos.cod_clasificacion_carga
        // campos.incoterm_id
        // campos.cod_tipo_pago

        // --- CRITERIOS OBLIGATORIOS ---
        // campos.entidad_id
        
        // --- POSIBLES CRITERIOS ---
        // campos.cod_pais_origen
        // campos.cod_pais_destino
        // campos.valor_libras
        // campos.valor_kilos
        // campos.valor_flete
        // campos.valor_dueagent
        // campos.valor_cwm 
        // campos.cod_equipo
    ){
        const fecha_actual = await cropa_fecha_hora_actual()

        let lista_paises = Array.isArray(campos.lista_paises) ? campos.lista_paises : []
        let servicios_validos = []

        const consultaLoc = await azureSqlClient({PE: "PUNTO_ENLACE"})
        .leftJoin({ PA: "PAIS" }, function () {
            this.on( 'PA.PAIS_ID', '=', 'PE.PAIS_ID')
        })
        .select('PE.PUNTOENLACE_ID', "PA.PAIS_ID", "PA.CONTINENTE_ID")

        const consultaCiudad = await azureSqlClient({C: "CIUDAD"})
        .leftJoin({ PA: "PAIS" }, function () {
            this.on( 'PA.PAIS_ID', '=', 'C.PAIS_ID')
        })
        .select('C.CIUDAD_ID', "PA.PAIS_ID", "PA.CONTINENTE_ID")

        const catalogo_localizacion = {}
        for(const i of consultaLoc){
            catalogo_localizacion[`PE_${i.PUNTOENLACE_ID}`] = i
        }
        for(const i of consultaCiudad){
            catalogo_localizacion[`CI_${i.CIUDAD_ID}`] = i
        }
       
        const consultaServicios =  azureSqlClient({S:"SERVICIO"})
            .leftJoin({E:"ENTIDAD"}, function () {
                this.on( 'E.ENTIDAD_ID', '=', 'S.ENTIDAD_ID');
            })
            .where('S.RUBRO_ID', 134)
            .where('S.ESTADO_ID', 1)
            .where('S.TIPO_TRANSPORTE_ID',`${campos.cod_tipo_transporte}`)
            .where('S.EMPRESA_ID',`${campos.cod_empresa}`)
            .where('S.CENCO_ID',`${campos.cod_cc}`)

        if('carrier_id' in campos){
            consultaServicios.where('S.ENTIDAD_ID', `${campos.carrier_id}`)
        }

        if('interna' in campos && !! campos.interna){
            consultaServicios.where('S.SERVICIO_INTERNO', 1)
        }
        
        if('cod_tipo_servicio' in campos && !!campos.cod_tipo_servicio){
            consultaServicios.where(function() {
                this.where('S.TIPO_SERVICIO_ID',`${campos.cod_tipo_servicio}`)
                .orWhereNull('S.TIPO_SERVICIO_ID')
            })
        } else {
            const tipo_servicio_posible = await azureSqlClient({ TR: "TIPO_RELACION" })
            .leftJoin({ T: "TIPO" }, function () {
                this.on( 'T.TIPO_ID', '=', 'TR.TIPO_ID');
            })
            .leftJoin({ TP: "TIPO" }, function () {
                this.on( 'TP.TIPO_ID', '=', 'TR.TIPO_PADRE_ID');
            })
            .where('TR.TIPO_PADRE_ID', `${campos.cod_tipo_transporte}`)
            .where('T.TIPO_TABLA', `SERVICIO`)
            .where('T.ESTADO_ID', 1)
            .where('TP.ESTADO_ID', 1)
            .where('TR.ESTADO_ID', 1)
            .select(
                "TR.TIPO_ID",
            );
            consultaServicios.where(function() {
                this.whereIn('S.TIPO_SERVICIO_ID', tipo_servicio_posible.map(tipo => tipo.TIPO_ID))
                .orWhereNull('S.TIPO_SERVICIO_ID')
            })
        }

        if('cod_tipo_carga' in campos){
            consultaServicios.where(function() {
                this.where('S.TIPO_CARGA_ID',`${campos.cod_tipo_carga}`)
                .orWhere('S.TIPO_CARGA_ID', 119)
                .orWhereNull('S.TIPO_CARGA_ID')
            })
        }

        if('cod_clasificacion_carga' in campos){
            consultaServicios.where(function() {
                this.where('S.CLASIFICACION_CARGA_ID',`${campos.cod_clasificacion_carga}`)
                .orWhere('S.CLASIFICACION_CARGA_ID', 123)
                .orWhereNull('S.CLASIFICACION_CARGA_ID')
            })
        }

        if(('incoterm_id' in campos)){
            consultaServicios.where(function() {
                this.where('S.INCOTERM_ID',`${campos.incoterm_id}`)
                .orWhereNull('S.INCOTERM_ID')
            })
        }        
        
        if('cod_tipo_pago' in campos){
            consultaServicios.where(function() {
                this.where('S.TIPO_PAGO_ID',`${campos.cod_tipo_pago}`)
                .orWhere('S.TIPO_PAGO_ID', 131)
                .orWhereNull('S.TIPO_PAGO_ID')
            })
        }

        if('categoria_transporte' in campos){
            consultaServicios.where(function() {
                this.where('S.CATEGORIA_TRANSPORTE',`${campos.categoria_transporte}`)
                .orWhereNull('S.CATEGORIA_TRANSPORTE')
            })
        }

        if('cod_proveedor' in campos){
            consultaServicios.whereIn('S.ENTIDAD_ID', Array.isArray(campos.cod_proveedor) ? campos.cod_proveedor : [campos.cod_proveedor])
        }

        let servicios = await consultaServicios.select(
            'S.SERVICIO_ID AS COD_SERVICIO', 
            'S.SERVICIO_NOMBRE AS NOMBRE', 
            'S.SERVICIO_SIGLAS AS SIGLAS', 
            'S.SERVICIO_INTERNO', 
            'S.RUBRO_ID AS COD_RUBRO', 
            'S.TIPO_SERVICIO_ID AS COD_TIPO_SERVICIO', 
            'S.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
            'S.ENTIDAD_ID',
            'E.ENTIDAD_NOMBRE',
            'S.TIPO_CALCULO_ID AS COD_TIPO_CALCULO',
            'S.TIPO_APLICACION_ID AS COD_TIPO_APLICACION',
            'S.TIPO_CARGA_ID AS COD_TIPO_CARGA',
            'S.CLASIFICACION_CARGA_ID AS COD_CLASIFICACION_CARGA',
            'S.TIPO_PAGO_ID AS COD_TIPO_PAGO',
            'S.SERVICIO_CLASIFICACION',
            'S.CATEGORIA_TRANSPORTE',
            "S.INCOTERM_ID",
            "S.OBLIGATORIO"
        )

        for await (let servicio of servicios) {

            const metodo = await azureSqlClient({M:"METODO"})
            .leftJoin({ TM: "TIPO" }, function () {
                this.on( 'TM.TIPO_ID', '=', 'M.TIPO_ID');
            })
            .leftJoin({ TTA: "TIPO" }, function () {
                this.on( 'TTA.TIPO_ID', '=', 'M.TIPO_TARIFA_ID');
            })
            .where('M.SERVICIO_ID', servicio.COD_SERVICIO)
            .where('M.ESTADO_ID', 1)
            .where('M.TIPO_ID', 342)
            .where(function() {
                this.whereRaw('CAST(M.METODO_FECHA_FINAL AS DATE) >= CAST(? AS DATE)', [fecha_actual])
                    .orWhereNull('M.METODO_FECHA_FINAL')
            })
            .where(function() {
                this.whereRaw('CAST(M.METODO_FECHA_INICIAL AS DATE) <= CAST(? AS DATE)', [fecha_actual])
                    .orWhereNull('M.METODO_FECHA_INICIAL')
            })
            .select(
                'M.METODO_ID AS COD_METODO', 
                'M.TIPO_ID AS COD_TIPO_METODO', 
                'TM.TIPO_DESCRIPCION AS TIPO_METODO_DESC', 
                'M.TIPO_TARIFA_ID AS COD_TIPO_TARIFA', 
                'TTA.TIPO_DESCRIPCION AS TIPO_TARIFA_DESC', 
                'M.METODO_TODOS_LOS_PAISES',
                'M.METODO_TODOS_LOS_CLIENTES',
                'M.METODO_TODOS_LOS_COMMODITIES',
                'M.METODO_MINIMO AS MINIMO'
            ).first()

            if(metodo){
                const valor_calculo = obtenerValorCalculo({...campos, cod_tipo_calculo: servicio.COD_TIPO_CALCULO})
                if(!valor_calculo) continue
                
                const entidad = await validarEntidad(metodo.COD_METODO, campos.entidad_id, metodo.COD_TIPO_TARIFA)
                if(!entidad) continue 

                const key_origen = !!campos.cod_puntoenlace_origen ? `PE_${campos.cod_puntoenlace_origen}`
                                        : `CI_${campos.cod_ciudad_origen}`
                const key_destino = !!campos.cod_puntoenlace_destino ? `PE_${campos.cod_puntoenlace_destino}`
                                        : `CI_${campos.cod_ciudad_destino}`

                const origen = catalogo_localizacion[key_origen]
                const destino = catalogo_localizacion[key_destino]

                const ruta = await validarRutas({
                    "cod_metodo": metodo.COD_METODO, 
                    "metodo_todos_los_paises": metodo.METODO_TODOS_LOS_PAISES, 
                    "cod_puntoenlace_origen": campos.cod_puntoenlace_origen, 
                    "cod_puntoenlace_destino": campos.cod_puntoenlace_destino, 
                    "cod_ciudad_origen": campos.cod_ciudad_origen, 
                    "cod_ciudad_destino": campos.cod_ciudad_destino, 
                    "cod_pais_origen": origen["PAIS_ID"], 
                    "cod_pais_destino": destino["PAIS_ID"], 
                    "cod_continente_origen": origen["CONTINENTE_ID"], 
                    "cod_continente_destino": destino["CONTINENTE_ID"], 
                    "cod_cc": campos.cod_cc
                    })

                if(!ruta) continue 
                
                let costo = 0
                let rate = 0
                let cod_moneda = 0
                let punto_enlace = undefined
                let rutas = []

                const detalles = await azureSqlClient({TD: "TARIFA_DETALLE"})
                .leftJoin({ TI: "TIPO" }, function () {
                    this.on( 'TD.TIPO_ID', '=', 'TI.TIPO_ID');
                })
                .where('TD.METODO_ID',`${metodo.COD_METODO}`)
                .where('TD.ESTADO_ID', 1)
                .select(
                    "TD.TARIFADETALLE_ID", 
                    "TD.TARIFADETALLE_DESCRIPCION", 
                    "TD.TARIFADETALLE_VALOR",
                    "TD.TIPO_ID", 
                    'TI.TIPO_DESCRIPCION AS TIPO_DESC',
                )

                const calculos = await azureSqlClient({TS:"TARIFA_SCALLING"})
                .leftJoin({ PE:"PUNTO_ENLACE" }, function () {
                    this.on( 'TS.PUNTOENLACE_ID', '=', 'PE.PUNTOENLACE_ID');
                })
                .leftJoin({PEI:"PUNTO_ENLACE_IDENTIFICACION"}, function () {
                    this.on( 'PE.PUNTOENLACE_ID', '=', 'PEI.PUNTOENLACE_ID')
                    .onIn('PEI.TIPO_ID', [78, 80, 112])
                })
                .where('TS.METODO_ID', metodo.COD_METODO)
                .where('TS.ESTADO_ID', 1)
                .whereIn('PEI.PEIDENTFICACION_CODIGO', lista_paises)
                .select(
                    "TS.SCALLING_ID AS COD_TARIFA_SCALLING",
                    "TS.METODO_ID AS COD_METODO",
                    "TS.PUNTOENLACE_ID AS COD_PUNTOENLACE",
                    'PEI.PEIDENTFICACION_CODIGO AS CODIGO',
                    "TS.SCALLING_COSTO AS COSTO",
                    "TS.MONEDA_ID AS COD_MONEDA",
                    "TS.ESTADO_ID AS COD_ESTADO",
                )
                .orderBy('TS.SCALLING_COSTO', 'DESC')

                for(let calculo of calculos){
                    rutas.push({
                        COSTO: calculo.COSTO * valor_calculo,
                        COD_MONEDA: calculo.COD_MONEDA,
                        RATE: calculo.COSTO,
                        PUNTO_ENLACE: calculo.CODIGO,
                    })
                }

                servicios_validos.push({
                    ...servicio,
                    METODO: {
                        ...metodo,
                        RUTAS: rutas
                    },
                })
            }
        }

        return servicios_validos

    }else{
        return {'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Debe enviar los atributos requeridos'};
    }
    

}

module.exports.obtener_criterios = async (campos) => {
    if('cod_tarifaplantilla' in campos){

        const consultaTipoCalculo =  azureSqlClient({TP:"TARIFA_PLANTILLA"})
        .leftJoin({ TPR: "TARIFA_PLANTILLA_RUBRO" }, function () {
            this.on( 'TPR.TARIFAPLANTILLA_ID', '=', 'TP.TARIFAPLANTILLA_ID');
        })
        .leftJoin({ R: "RUBRO" }, function () {
            this.on( 'R.RUBRO_ID', '=', 'TPR.RUBRO_ID');
        })
        .leftJoin({ S: 'SERVICIO' }, function () {
            this.on( 'R.RUBRO_ID', '=', 'S.RUBRO_ID')
            .andOn('S.TIPO_SERVICIO_ID', '=', 'TP.TIPO_SERVICIO_ID')
            .andOn('S.TIPO_TRANSPORTE_ID', '=', 'TP.TIPO_TRANSPORTE_ID')
        })
        .leftJoin({ M: "METODO" }, function () {
            this.on( 'M.SERVICIO_ID', '=', 'S.SERVICIO_ID');
        })
        .where('TP.TARIFAPLANTILLA_ID', campos.cod_tarifaplantilla)
        .where('TP.ESTADO_ID', 1)
        .where('R.ESTADO_ID', 1)
        .where('M.ESTADO_ID', 1)
        .where('S.ESTADO_ID', 1)

        const consultaTipoMetodo = consultaTipoCalculo.clone()

        const tiposCalculo = await consultaTipoCalculo.select(
            'S.TIPO_CALCULO_ID AS COD_TIPO',
        ).groupBy(
            'S.TIPO_CALCULO_ID', 
        )

        const tiposMetodo = await consultaTipoMetodo.select(
            'M.TIPO_ID AS COD_TIPO', 
        ).groupBy( 
            'M.TIPO_ID'
        )

        const listaTipos = [...tiposCalculo, ...tiposMetodo].map(tipo => tipo.COD_TIPO).filter(n => n)

        const listaCriterios = azureSqlClient({C:"CRITERIO"})
        .leftJoin({T:"TIPO_DATO"}, function () {
            this.on('T.TIPODATO_ID', '=', 'C.TIPODATO_ID');
        })
        .whereIn('C.TIPO_ID', [...listaTipos, -1])
        .where("CRITERIO_FORMULARIO", "CALCULO_TARIFA")
        .select(
            'C.CRITERIO_ID AS COD_CRITERIO',
            'C.CRITERIO_DESCRIPCION AS DESCRIPCION', 
            'C.CRITERIO_CAMPO AS CAMPO', 
            'C.CRITERIO_FORMULARIO AS FORMULARIO', 
            'C.TIPODATO_ID AS COD_TIPO_DATO', 
            'T.TIPODATO_DESCRIPCION AS TIPO_DATO', 
        )
        return listaCriterios
    }
}

module.exports.obtener_criterios_especificos = async (campos) => {

    if(('cod_tarifaplantilla' in campos) || ('cod_rubro' in campos) || ('cod_servicio' in campos)){

        const consultaTipoCalculo =  azureSqlClient({ S: 'SERVICIO' }, function () {
            this.on( 'R.RUBRO_ID', '=', 'S.RUBRO_ID')
            .andOn('S.TIPO_SERVICIO_ID', '=', 'TP.TIPO_SERVICIO_ID')
            .andOn('S.TIPO_TRANSPORTE_ID', '=', 'TP.TIPO_TRANSPORTE_ID')
        })
        .leftJoin({ M: "METODO" }, function () {
            this.on( 'M.SERVICIO_ID', '=', 'S.SERVICIO_ID');
        })
        .where('M.ESTADO_ID', 1)
        .where('S.ESTADO_ID', 1)

        if('cod_servicio' in campos){
            consultaTipoCalculo.whereIn('S.SERVICIO_ID', Array.isArray(campos.cod_servicio) ? campos.cod_servicio : [campos.cod_servicio])
        }
        if(('cod_tarifaplantilla' in campos)){
            consultaTipoCalculo.leftJoin({ R: "RUBRO" }, function () {
                this.on( 'R.RUBRO_ID', '=', 'S.RUBRO_ID')
            }).leftJoin({ TPR: "TARIFA_PLANTILLA_RUBRO" }, function () {
                this.on( 'TPR.RUBRO_ID', '=', 'R.RUBRO_ID');
            }).leftJoin({ TP: "TARIFA_PLANTILLA" }, function () {
                this.on( 'TPR.TARIFAPLANTILLA_ID', '=', 'TP.TARIFAPLANTILLA_ID')
            })
            // .where('TP.TARIFAPLANTILLA_ID', campos.cod_tarifaplantilla)
            .whereIn('TP.TARIFAPLANTILLA_ID', Array.isArray(campos.cod_tarifaplantilla) ? campos.cod_tarifaplantilla : [campos.cod_tarifaplantilla])
            .where('TP.ESTADO_ID', 1)
            .where('R.ESTADO_ID', 1)

            if(('cod_rubro' in campos)){
                // consultaTipoCalculo.where('R.RUBRO_ID', campos.cod_rubro)
                consultaTipoCalculo.whereIn('R.RUBRO_ID', Array.isArray(campos.cod_rubro) ? campos.cod_rubro : [campos.cod_rubro])
            }
        }
        if(('cod_rubro' in campos) && !('cod_tarifaplantilla' in campos)){
            // console.log(campos.cod_rubro, Array.isArray(campos.cod_rubro))
            consultaTipoCalculo.leftJoin({ R: "RUBRO" }, function () {
                this.on( 'R.RUBRO_ID', '=', 'S.RUBRO_ID')
            })
            // consultaTipoCalculo.where('S.RUBRO_ID', campos.cod_rubro)
            .whereIn('R.RUBRO_ID', Array.isArray(campos.cod_rubro) ? campos.cod_rubro : [campos.cod_rubro])
            .where('R.ESTADO_ID', 1)
        }

        const consultaTipoMetodo = consultaTipoCalculo.clone()

        const tiposCalculo = await consultaTipoCalculo.select(
            'S.TIPO_CALCULO_ID AS COD_TIPO',
        ).groupBy(
            'S.TIPO_CALCULO_ID', 
        )

        const tiposMetodo = await consultaTipoMetodo.select(
            'M.TIPO_ID AS COD_TIPO', 
        ).groupBy( 
            'M.TIPO_ID'
        )

        const listaTipos = [...tiposCalculo, ...tiposMetodo].map(tipo => tipo.COD_TIPO).filter(n => n)

        const listaCriterios = azureSqlClient({C:"CRITERIO"})
        .leftJoin({T:"TIPO_DATO"}, function () {
            this.on('T.TIPODATO_ID', '=', 'C.TIPODATO_ID');
        })
        .whereIn('C.TIPO_ID', [...listaTipos, -1])
        .where("CRITERIO_FORMULARIO", "CALCULO_TARIFA")
        .select(
            'C.CRITERIO_ID AS COD_CRITERIO',
            'C.CRITERIO_DESCRIPCION AS DESCRIPCION', 
            'C.CRITERIO_CAMPO AS CAMPO', 
            'C.CRITERIO_FORMULARIO AS FORMULARIO', 
            'C.TIPODATO_ID AS COD_TIPO_DATO', 
            'T.TIPODATO_DESCRIPCION AS TIPO_DATO', 
        )
        return listaCriterios
    } else{
        return {'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Debe enviar los atributos requeridos'};
    }

}

const obtenerValorCalculo = (campos) =>{
    return valor_calculo = campos.cod_tipo_calculo == 87 ? campos.valor_kilos
        : campos.cod_tipo_calculo == 88 ? campos.valor_libras
        : campos.cod_tipo_calculo == 89 ? campos.valor_flete
        : campos.cod_tipo_calculo == 90 ? campos.valor_dueagent
        : campos.cod_tipo_calculo == 91 ? campos.valor_cw
        : campos.cod_tipo_calculo == 152 ? campos.valor_por_peso
        : [132, 340, 356, 584].includes(campos.cod_tipo_calculo) ? 1
        : null
}

async function validarRutas({cod_metodo, metodo_todos_los_paises, cod_puntoenlace_origen, cod_puntoenlace_destino, 
    cod_pais_origen, cod_pais_destino, cod_continente_origen, cod_continente_destino, cod_cc, cod_ciudad_origen, cod_ciudad_destino}) {


    const rutas = await azureSqlClient({TR: "TARIFA_RUTA"})
        .where('TR.METODO_ID',`${cod_metodo}`)
        .where('TR.ESTADO_ID',1)
        .select("TR.METODO_ID", "TR.PUNTOENLACE_ID", "TR.PAIS_ID", "TR.CONTINENTE_ID", "TR.CIUDAD_ID", "TR.TIPO_RUTA_ID");

    const matchesOrigen = (ruta) => {
        if (ruta.CIUDAD_ID)         return ruta.CIUDAD_ID       == cod_ciudad_origen;
        if (ruta.PUNTOENLACE_ID)    return ruta.PUNTOENLACE_ID  == cod_puntoenlace_origen;
        if (ruta.PAIS_ID)           return ruta.PAIS_ID         == cod_pais_origen;
        if (ruta.CONTINENTE_ID)     return ruta.CONTINENTE_ID   == cod_continente_origen;
        return false;
    };

    const matchesDestino = (ruta) => {
        if (ruta.CIUDAD_ID)         return ruta.CIUDAD_ID       == cod_ciudad_destino;
        if (ruta.PUNTOENLACE_ID)    return ruta.PUNTOENLACE_ID  == cod_puntoenlace_destino;
        if (ruta.PAIS_ID)           return ruta.PAIS_ID         == cod_pais_destino;
        if (ruta.CONTINENTE_ID)     return ruta.CONTINENTE_ID   == cod_continente_destino;
        return false;
    };

    if (metodo_todos_los_paises) {
        return !rutas.some(ruta =>
            ruta.TIPO_RUTA_ID === 113 ? matchesOrigen(ruta) : matchesDestino(ruta)
        );
    } else {
        const rutasOrigen  = rutas.filter(r => r.TIPO_RUTA_ID === 113);
        const rutasDestino = rutas.filter(r => r.TIPO_RUTA_ID !== 113);

        const tiene_origen  = rutasOrigen.length  > 0;
        const tiene_destino = rutasDestino.length > 0;
        const check_origen_destino = cod_cc == 16 ? tiene_destino : tiene_origen

        const origen_valido  = tiene_origen  ? rutasOrigen.some(matchesOrigen)   : true;
        const destino_valido = tiene_destino ? rutasDestino.some(matchesDestino) : true;

        return check_origen_destino && (origen_valido && destino_valido);
    }
}

const validarEntidad = async (cod_metodo, entidad_id, cod_tipo_tarifa) => {
    const entidades = await azureSqlClient({TE: "TARIFA_ENTIDAD"})
        .where('TE.METODO_ID',`${cod_metodo}`)
        .where('TE.ESTADO_ID',1)
        .select("TE.ENTIDAD_ID")

    let entidad_valida = (cod_tipo_tarifa == 97) ? true : false
    entidades.forEach(entidad => {
        if(entidad.ENTIDAD_ID == entidad_id){
            entidad_valida = !entidad_valida
        }
    })
    return entidad_valida
}

const validarCommodity = async (cod_metodo, metodo_todos_los_commodities, cod_commodity) => {
    const commodities = await azureSqlClient({MC: "METODO_COMMODITY"})
        .where('MC.METODO_ID',`${cod_metodo}`)
        .where('MC.ESTADO_ID',1)
        .select("MC.COMMODITY_ID")

    let commodity_valida = (metodo_todos_los_commodities) ? true : false
    commodities.forEach(commoodity => {
        if(commoodity.COMMODITY_ID == cod_commodity){
            commodity_valida = !commodity_valida
        }
    })
    return commodity_valida
}

function obtenerMejorServicio(servicios, filtro_clasificacion, filtro_tipo, filtro_servicio, filtro_transporte) {
    if (!servicios || servicios.length === 0) return null;
    if (servicios.length === 1) return servicios[0];

    const CLASIFICACION_GENERAL = new Set([null, undefined, 123]);
    const TIPO_GENERAL = new Set([null, undefined, 119]);
    const SERVICIO_GENERAL = new Set([null, undefined]);
    const TRANSPORTE_GENERAL = new Set([null, undefined]);

    const isGeneric = (set, value) => set.has(value);

    function getScore(genericSet, targetValue, serviceValue) {
        if (isGeneric(genericSet, targetValue))   return 0; // dimension irrelevant
        if (isGeneric(genericSet, serviceValue))  return 1; // service is generic, target is specific
        if (serviceValue === targetValue)         return 0; // exact match
        return Infinity;                                    // specific but wrong — upstream bug
    }

    function getPriority(servicio) {
        const classScore       = getScore(CLASIFICACION_GENERAL, filtro_clasificacion, servicio.COD_CLASIFICACION_CARGA);
        const typeScore        = getScore(TIPO_GENERAL, filtro_tipo, servicio.COD_TIPO_CARGA);
        const servicioScore    = getScore(SERVICIO_GENERAL, filtro_servicio, servicio.COD_TIPO_SERVICIO);
        const transporteScore  = getScore(TRANSPORTE_GENERAL, filtro_transporte, servicio.CATEGORIA_TRANSPORTE);

        // Class > Type > everything else (equal weight among the rest)
        return (classScore * 6)
        + (typeScore * 4)
        + (servicioScore * 1)
        + (transporteScore * 1)
    }

    return servicios.reduce((best, current) => {
        return  getPriority(current) < getPriority(best) ? current : best;
    });
}

module.exports.enviar_notificacion = async () => {
    console_log("SE HA INICIADO EL PROCESO DE NOTIFICACION DE TARIFAS POR VENCER");
    const fecha_actual = await cropa_fecha_hora_actual();
    var resultado = {};
    try {

        const hoy = dayjs(fecha_actual).format('YYYY-MM-DD');
        const dentroDe30Dias = dayjs(fecha_actual).add(30, 'day').format('YYYY-MM-DD');
        const hace7Dias = dayjs(fecha_actual).subtract(7, 'day').format('YYYY-MM-DD');

        const consultaServicios = azureSqlClient({ S: 'SERVICIO' })
            .leftJoin({ M: 'METODO' }, function () {
                this.on('S.SERVICIO_ID', 'M.SERVICIO_ID');
            })
            .leftJoin({ TT: 'TIPO' }, function () {
                this.on('TT.TIPO_ID', 'S.TIPO_TRANSPORTE_ID');
            })
            .select([
                // 'S.*',
                'S.SERVICIO_ID AS TARIFA',
                'S.SERVICIO_NOMBRE AS NOMBRE',
                'TT.TIPO_DESCRIPCION AS TRANSPORTE',
                azureSqlClient.raw('CONVERT(VARCHAR(10), M.METODO_FECHA_FINAL, 103) AS FECHA')
            ])
            .whereNotNull('M.METODO_FECHA_FINAL')
            .where('S.ESTADO_ID', 1);

        // Fecha final desde hoy hasta dentro de 30 días, inclusive.
        const serviciosPorVencer = await consultaServicios.clone()
            .whereRaw(
                'CAST(M.METODO_FECHA_FINAL AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)',
                [hoy, dentroDe30Dias]
            )
            .orderBy('S.TIPO_TRANSPORTE_ID', 'desc');

        // Fecha final desde hace 7 días hasta ayer, inclusive.
        const serviciosVencidos = await consultaServicios.clone()
            .whereRaw(
                'CAST(M.METODO_FECHA_FINAL AS DATE) >= CAST(? AS DATE) AND CAST(M.METODO_FECHA_FINAL AS DATE) < CAST(? AS DATE)',
                [hace7Dias, hoy]
            )
            .orderBy('S.TIPO_TRANSPORTE_ID', 'desc');

        const params = {por_vencer:serviciosPorVencer, vencidas:serviciosVencidos} 
        
        resultado = {
            "autor": "CROPA",
            "asunto": `REPORTE DE TARIFAS VECIDAS Y POR VENCER - CROPA DSV`,
            "nombre": null,
            "lista_distribucion": 'pricing.exportaciones@cropa.com.gt',
            "version": "0.0.1",
            "html_doc": generar_html_notificacion_vencidas_y_por_vencer(params)
        };

        if (params.por_vencer.length || params.vencidas.length) insertar_notificacion_correo_transaccion(resultado);

        // console_log(resultado);
    } catch (error) {
        console_log("HA OCURRIDO UN ERROR EN EL PROCESO DE NOTIFICACION DE TARIFAS POR VENCER");
        console_log(error.toString());
        resultado ={
            success: false,
            mensaje: "Se ha presentado un error al procesar la notificacion de tarifas por vencer, el proceso se detuvo",
            error: error.toString()
        };
    }

    return resultado
}