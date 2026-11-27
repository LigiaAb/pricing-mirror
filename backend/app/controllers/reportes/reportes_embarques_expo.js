const { reporte_emb_cliente_expo_oracle, reporte_contenedores_cliente } = require("../admon/entidad/entidad_externas")
const { getdatosusuarios } = require("../admon/usuario/usuarios")
const { ext_reporte_embarques_por_cliente_impo_oracle, api_ext_reporte_embarques_por_cliente_impo_oracle, api_ext_reporte_embarques_por_cliente_tropicargo_oracle } = require("../servicios_externos/rutas_externas")

module.exports.reporte_embarques_por_cliente_azure = async (campos) => {

    if(('entidad_id' in campos) && ('cod_empresa' in campos) && ('cod_cenco' in campos)){
        const { entidad_id, cod_empresa, cod_cenco, cod_usuario } = campos

        // EMBARQUES POR MES
        const embarques_x_mes = await azureSqlClient({"VRE": "V_REPORTE_EMBARQUES"})  
        .select('TIPO_EMBARQUE', 'ANIO', 'MES')
        .count('EMBARQUE_ID AS EMBARQUES')
        .groupBy('TIPO_EMBARQUE', 'ANIO', 'MES')
        .where({
            ENTIDAD_ID: entidad_id,
            EMPRESA_ID: cod_empresa,
            CENCOS_ID: cod_cenco,
            USUARIO_ID_ASESOR: cod_usuario || undefined
        })

        // EMBARQUES POR TIPO DE PAGO
        const embarques_x_pago = await azureSqlClient({ VRE: "V_REPORTE_EMBARQUES" })
        .select(
            'ANIO',
            'TIPO_EMBARQUE',
            azureSqlClient.raw(`
            CASE 
                WHEN TIPO_PAGO = 'PREPAID / COLLECT' OR TIPO_PAGO IS NULL THEN 'PREPAID / COLLECT'
                ELSE TIPO_PAGO
            END AS TIPO_PAGO
            `)
        )
        .count('EMBARQUE_ID AS EMBARQUES')
        .groupByRaw(`
            ANIO,
            TIPO_EMBARQUE,
            CASE 
                WHEN TIPO_PAGO = 'PREPAID / COLLECT' OR TIPO_PAGO IS NULL THEN 'PREPAID / COLLECT'
                ELSE TIPO_PAGO
            END   
        `)
        .where({
            ENTIDAD_ID: entidad_id,
            EMPRESA_ID: cod_empresa,
            CENCOS_ID: cod_cenco,
            USUARIO_ID_ASESOR: cod_usuario || undefined
        })

        // EMBARQUES POR CLASIFICACION

        // POR VOLUMEN Y PESO
        const embarques_x_peso_volumen = await azureSqlClient({"VRE": "V_REPORTE_EMBARQUES"})  
        .select('TIPO_EMBARQUE', 'ANIO')
        .count('EMBARQUE_ID AS EMBARQUES')
        .sum('EMB_VOLUMEN AS VOLUMEN')
        .sum('EMB_PESO AS PESO')
        .groupBy('TIPO_EMBARQUE', 'ANIO')
        .where({
            ENTIDAD_ID: entidad_id,
            EMPRESA_ID: cod_empresa,
            CENCOS_ID: cod_cenco,
            USUARIO_ID_ASESOR: cod_usuario || undefined
        })

        // EMBARQUES POR PAIS
        const embarques_x_pais = await azureSqlClient({"VRE": "V_REPORTE_EMBARQUES"})  
        .select('TIPO_EMBARQUE', 'ANIO', 'PAIS_NOMBRE', 'PAIS_CODIGO_2')
        .count('EMBARQUE_ID AS EMBARQUES')
        .groupBy('TIPO_EMBARQUE', 'ANIO' , 'PAIS_NOMBRE', 'PAIS_CODIGO_2')
        .where({
            ENTIDAD_ID: entidad_id,
            EMPRESA_ID: cod_empresa,
            CENCOS_ID: cod_cenco,
            USUARIO_ID_ASESOR: cod_usuario || undefined
        })

        // VOLUMEN Y PESO POR PAIS
        const peso_volumen_x_pais = await azureSqlClient({"VRE": "V_REPORTE_EMBARQUES"})  
        .select('TIPO_EMBARQUE', 'ANIO', 'PAIS_NOMBRE', 'PAIS_CODIGO_2')
        .count('EMBARQUE_ID AS EMBARQUES')
        .sum('EMB_VOLUMEN AS VOLUMEN')
        .sum('EMB_PESO AS PESO')
        .groupBy('TIPO_EMBARQUE', 'ANIO', 'PAIS_NOMBRE', 'PAIS_CODIGO_2')
        .where({
            ENTIDAD_ID: entidad_id,
            EMPRESA_ID: cod_empresa,
            CENCOS_ID: cod_cenco,
            USUARIO_ID_ASESOR: cod_usuario || undefined
        })

        return {embarques_x_mes, embarques_x_pago, embarques_x_peso_volumen, embarques_x_pais, peso_volumen_x_pais};
    }

    else {
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }


}

module.exports.reporte_embarques_por_cliente_expo_oracle = async (campos) => {

    if(('entidad_id' in campos)){
        const { entidad_id } = campos

        const resultado = await reporte_emb_cliente_expo_oracle(campos);

        return resultado;
        
        const cliente = await azureSqlClient({"E": "ENTIDAD"})  
        .where('ENTIDAD_ID', `${entidad_id}`)
        .first('ENTIDAD_NOMBRE')

        const now = await cropa_fecha_hora_actual()
        const anioHasta = new Date(now).getFullYear();
        const anioDesde = anioHasta - 2;

        const baseWhere = function(query){
        query
            .where('FILE_ANIO', '>=', anioDesde)
            .andWhere('FILE_ANIO', '<=', anioHasta)
            .whereNotIn('FILE_CLASIFICACION', [
                'DOCUMENTACION',
                'LOCAL ADUANAS',
                'LOCAL EXPO',
            ])
            .andWhere('CLI_NOMBRE', cliente.ENTIDAD_NOMBRE);
        };

        // EMBARQUES POR MES
        const embarques_x_mes = await oracleClient('VM_EMB_EXPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE', 
            'FILE_ANIO AS ANIO', 
            'FILE_MES AS MES'
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_MES')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_MES']);

        // EMBARQUES POR TIPO DE PAGO
        const embarques_x_pago = await oracleClient('VM_EMB_EXPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE', 
            'FILE_ANIO AS ANIO', 
            'FILE_TIPOPAGO AS TIPO_PAGO'
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_TIPOPAGO')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_TIPOPAGO']);


        // EMBARQUES POR CLASIFICACION
        const embarques_x_clasificacion = await oracleClient('VM_EMB_EXPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE', 
            'FILE_ANIO AS ANIO', 
            'FILE_CLASIFICACION AS CLASIFICACION'
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_CLASIFICACION')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_CLASIFICACION']);


        // POR VOLUMEN Y PESO
        const embarques_x_peso_volumen = await oracleClient('VM_EMB_EXPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE',
            'FILE_ANIO AS ANIO',
            oracleClient.raw('SUM(FILE_VOLUMEN) as VOLUMEN'),
            oracleClient.raw('SUM(FILE_PESONETO_TONE) as PESO')
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO']);


        // EMBARQUES POR PAIS
        const embarques_x_pais = await oracleClient('VM_EMB_EXPO')
        .select( 
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE', 
            'FILE_ANIO AS ANIO', 
            oracleClient.raw('TRIM(PAIS_CODIGO) AS PAIS_CODIGO_2')
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'PAIS_CODIGO')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO', 'PAIS_CODIGO']);


        // VOLUMEN Y PESO POR PAIS
        const peso_volumen_x_pais = await oracleClient('VM_EMB_EXPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE',
            'FILE_ANIO AS ANIO',
            oracleClient.raw('TRIM(PAIS_CODIGO) as PAIS_CODIGO_2'),
            oracleClient.raw('SUM(FILE_VOLUMEN) as VOLUMEN'),
            oracleClient.raw('SUM(FILE_PESONETO_TONE) as PESO')
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'PAIS_CODIGO', 'PAIS_NOMBRE')
        .orderBy('EMBARQUES', 'desc');

        
        return {embarques_x_mes, embarques_x_pago, embarques_x_peso_volumen, embarques_x_pais, peso_volumen_x_pais};
    }

    else {
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }


}

module.exports.reporte_embarques_por_cliente_impo_oracle = async (campos) => {

    if(('entidad_id' in campos)){
        const { entidad_id } = campos

        const response = await api_ext_reporte_embarques_por_cliente_impo_oracle(campos);

        return response;

        const cliente = await azureSqlClient({"E": "ENTIDAD"})  
        .where('ENTIDAD_ID', `${entidad_id}`)
        .first('ENTIDAD_NOMBRE')

        const now = await cropa_fecha_hora_actual()
        const anioHasta = new Date(now).getFullYear();
        const anioDesde = anioHasta - 2;

        const baseWhere = function(query){
            query
                .where("FILE_ANIO", ">=", anioDesde)
                .where("FILE_ANIO", "<=", anioHasta)
                .where('CLI_NOMBRE', cliente.ENTIDAD_NOMBRE);
        };

        // EMBARQUES POR MES
        const embarques_x_mes = await oracleClient('V_EMB_IMPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE', 
            'FILE_ANIO AS ANIO', 
            'FILE_MES AS MES'
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_MES')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_MES']);

        // EMBARQUES POR TIPO DE PAGO
        const embarques_x_pago = await oracleClient('V_EMB_IMPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE', 
            'FILE_ANIO AS ANIO', 
            'FILE_TIPOPAGO AS TIPO_PAGO'
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_TIPOPAGO')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_TIPOPAGO']);


        // EMBARQUES POR CLASIFICACION
        const embarques_x_clasificacion = await oracleClient('V_EMB_IMPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE', 
            'FILE_ANIO AS ANIO', 
            'FILE_CLASIFICACION AS CLASIFICACION'
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_CLASIFICACION')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO', 'FILE_CLASIFICACION']);


        // POR VOLUMEN Y PESO
        const embarques_x_peso_volumen = await oracleClient('V_EMB_IMPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE',
            'FILE_ANIO AS ANIO',
            oracleClient.raw('SUM(FILE_VOLUMEN) as VOLUMEN'),
            oracleClient.raw('SUM(FILE_PESONETO_TONE) as PESO')
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO']);


        // EMBARQUES POR PAIS
        const embarques_x_pais = await oracleClient('V_EMB_IMPO')
        .select( 
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE', 
            'FILE_ANIO AS ANIO', 
            oracleClient.raw('TRIM(PAIS_CODIGO) AS PAIS_CODIGO_2')
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'PAIS_CODIGO')
        .orderBy(['FILE_TIPOEMBARQUE', 'FILE_ANIO', 'PAIS_CODIGO']);


        // VOLUMEN Y PESO POR PAIS
        const peso_volumen_x_pais = await oracleClient('V_EMB_IMPO')
        .select(
            'FILE_TIPOEMBARQUE AS TIPO_EMBARQUE',
            'FILE_ANIO AS ANIO',
            oracleClient.raw('TRIM(PAIS_CODIGO) as PAIS_CODIGO_2'),
            oracleClient.raw('SUM(FILE_VOLUMEN) as VOLUMEN'),
            oracleClient.raw('SUM(FILE_PESONETO_TONE) as PESO')
        )
        .count('FILE_MASTER as EMBARQUES')
        .modify(baseWhere)
        .groupBy('FILE_TIPOEMBARQUE', 'FILE_ANIO', 'PAIS_CODIGO', 'PAIS_NOMBRE')
        .orderBy('EMBARQUES', 'desc');

        
        return {embarques_x_mes, embarques_x_pago, embarques_x_peso_volumen, embarques_x_pais, peso_volumen_x_pais};
    }

    else {
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }


}

module.exports.reporte_embarques_por_cliente_tropicargo_oracle = async (campos) => {

    if(('entidad_id' in campos)){
        const { entidad_id, filtro_anio, filtro_mes} = campos        

        const response = await api_ext_reporte_embarques_por_cliente_tropicargo_oracle(campos);

        return response;
         
        const now = await cropa_fecha_hora_actual()
        const anio = filtro_anio || new Date(now).getFullYear();
        const mes = filtro_mes || new Date(now).getMonth() + 1;

        // OBTENER COD_CROPA
        let cod_cliente = -1
        let tipo_identificacion = -1

        const tipo_cliente = await azureSqlClient({"E": "ENTIDAD"})  
        .where('ENTIDAD_ID', `${entidad_id}`)
        .first('TIPO_ID')

        if(tipo_cliente["TIPO_ID"] == 3){
           tipo_identificacion = 12
        }
        if(tipo_cliente["TIPO_ID"] == 5){
            tipo_identificacion = 14
        }
        if(tipo_cliente["TIPO_ID"] == 2){
            tipo_identificacion = 16
        }

        if(tipo_identificacion <= 0){
            return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'No existe una identificacion para este cliente'};
        }

        const cod_cropa = await azureSqlClient({"EI": "ENTIDAD_IDENTIFICACION"})  
        .where('ENTIDAD_ID', `${entidad_id}`)
        .where('IDENTIFICACION_ID', `${tipo_identificacion}`)
        .first('ENTIDADIDENTIFICACIO_NUMERO AS COD_CROPA')

        cod_cliente = cod_cropa["COD_CROPA"] || 0

        if (cod_cliente <= 0) {
            return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'No se ha podido localizar el cliente'};
        }

        const tipoCambioDefault = 7.70;

        // ===========================================
        // 1) FILES
        // ===========================================
        const filesData = await oracleClient({"FI": "FILES"})
            .select(
                azureSqlClient.raw("FI.FILNUM AS ID_TROPICARGO"),
                azureSqlClient.raw("FI.FILGUIA AS GUIA"),
                azureSqlClient.raw("FI.FILFECHA AS FECHA"),
                azureSqlClient.raw("TO_CHAR(FI.FILFECHA,'YYYY') AS ANIO"),
                azureSqlClient.raw("TO_CHAR(FI.FILFECHA,'MM') AS MES"),
                "FI.FIL_CIF AS CIF",
                "FI.FILCODIGO AS AGENTE",
                "FI.FILCODAGE AS CODIGO",
                "FC.FILCLA_DESCRIPCION AS CLASIFICACION",
                azureSqlClient.raw("TRIM(TT.TIPTRA_DESCRIPCION) AS TIPO_TRANSPORTE",),
                "FI.FIL_PAIORI AS PAIS_ORIGEN",
                "FI.FILREG AS REGIMEN",
                "PF.PAISFIL_NOMBRE AS PAIS",
                "FI.FIL_CODCLIDIV AS DIVISION",
                "DC.CLIDIV_DESCRIPCION AS DESCRIPCION_DIVISION",
                "FI.FILREG",
                "FI.FIL_TIPCAMBG AS TIPO_CAMBIO",
                "FI.FILCLA_CODIGO AS CODIGO_CLASIFICACION",
                "FI.FIL_TIPTRA"
            )
            .leftJoin({"FC": "FILE_CLASIFICACION"}, function (join) {
                join
                    .on("FI.FILCLA_CODIGO", "=", "FC.FILCLA_CODIGO")
                    .on("FI.EMP_CODIGO", "=", "FC.EMP_CODIGO")
                    .on("FI.DEPORG_CODIGO", "=", "FC.DEPORG_CODIGO");
            })
            .leftJoin({"TT": "TIPO_TRANSPORTE"}, "FI.FIL_TIPTRA", "TT.TIPTRA_CODIGO")
            .leftJoin({"PF": "PAIS_FILE"}, "FI.FIL_PAIORI", "PF.PAISFIL_CODIGO")
            .leftJoin({"DC": "DIVISION_CLIENTE"}, function (join) {
                join
                    .on("DC.CLIDIV_CODIGO", "=", "FI.FIL_CODCLIDIV")
                    .on("DC.CLI_CODIGO", "=", "FI.CLI_CODIGO");
            })
            .where("FI.EMP_CODIGO", 1)
            .where("FI.DEPORG_CODIGO", "ADU")
            .where("FI.CLI_CODIGO", cod_cliente)
            // Oracle date comparison
            .whereRaw(`FI.FILFECHA >= DATE '2020-01-01'`)
            .whereRaw(`TO_CHAR(FI.FILFECHA,'YYYY') = ?`, [anio])
            .whereRaw(`TO_CHAR(FI.FILFECHA,'MM') = ?`, [mes])
            .orderBy("FI.FILFECHA", "ASC");

        if (!filesData.length) {
            console.log(cod_cliente, mes, anio)
            return []
        }

        const numeroFiles = filesData.map(f => f.ID_TROPICARGO);
        const polizas = filesData.map(f => f.CODIGO);

        // ===========================================
        // 2) HONORARIOS
        // ===========================================
        const honorariosRaw = await oracleClient({"DD": "DETALLE_DOCUMENTO"})
            .leftJoin({"CD": "CABECERA_DOCUMENTO"}, function (join) {
                join
                    .on("CD.EMP_CODIGO", "=", "DD.EMP_CODIGO")
                    .on("CD.TIPDOC_CODIGO", "=", "DD.TIPDOC_CODIGO")
                    .on("CD.CABDOC_NUMERO", "=", "DD.CABDOC_NUMERO")
                    .on("CD.CABDOC_SERIE", "=", "DD.CABDOC_SERIE");
            })
            .select("*")
            .where("CD.EMP_CODIGO", 1)
            .where("CD.TIPDOC_CODIGO", "FA")
            .where("CD.ESTDOC_CODIGO", 1)
            .where("DD.RUB_CODIGO", 11)
            .whereIn("DD.FIL_CODIGO", numeroFiles);

        const honorarios = {};
        honorariosRaw.forEach(h => {
            honorarios[h.FIL_CODIGO] = h;
        });

        // ===========================================
        // 3) DUCAS 
        // ===========================================
        const ducasRaw = await mysqlClientASPRADCO({"de": "duca_encabezado"})
        .join({"di": "duca_impuestos"}, "de.id_duca", "di.id_declaracion")
        .whereIn("de.correlativo", polizas);

        const ducas = {};
        ducasRaw.forEach(d => {
            if(d.correlativo in ducas){
                ducas[d.correlativo].push(d)
            } else {
                ducas[d.correlativo] = [d]
            }
        });

        // return ducas

        // ===========================================
        // 4) ARMAR RESULTADO
        // ===========================================
        const result = [];

        for (const file of filesData) {
            const f = {
                id_tropicargo: file.ID_TROPICARGO,
                guia: file.GUIA,
                fecha: file.FECHA,
                anio: file.ANIO,
                mes: file.MES,
                cif: file.CIF,
                agente: file.AGENTE,
                codigo: file.CODIGO,
                clasificacion: file.CLASIFICACION,
                codigo_clasificacion: file.CODIGO_CLASIFICACION,
                tipo_transporte: file.TIPO_TRANSPORTE,
                fil_tiptra: file.FIL_TIPTRA,
                pais_origen: file.PAIS_ORIGEN,
                regimen: file.REGIMEN,
                pais: file.PAIS,
                division: file.DIVISION,
                descripcion_division: file.DESCRIPCION_DIVISION,
                filreg: file.FILREG,
                tipo_cambio_file: parseFloat(file.TIPO_CAMBIO),
                impuestos: {}
            };

            // // DUCAS + impuestos
            if(!!ducas[file.CODIGO]) {
                const impuestos = ducas[file.CODIGO];
                impuestos.forEach(impuesto => {
                    const key = impuesto.id_impuesto.toLowerCase();
                    f.tipo_cambio_impuesto = impuesto.tipo_cambio
                    f.selectivo = impuesto.selectivo
                    if (impuesto.tipo_cambio > 0) {
                        f["impuestos"][`${key}`] = Number((impuesto.valor / impuesto.tipo_cambio).toFixed(2))
                    } else {
                        f["impuestos"][`${key}`] = Number((impuesto.valor / tipoCambioDefault).toFixed(2))
                    }
                })
            }

            // Honorarios
            f.honorarios_gtq = 0;
            f.honorarios_usd = 0;

            if (honorarios[file.ID_TROPICARGO]) {
                const h = honorarios[file.ID_TROPICARGO];

                f.honorarios_gtq = Number(h.DETDOC_VALOR);
                f.honorarios_usd = Number(
                    (h.DETDOC_VALOR /
                        (file.TIPO_CAMBIO > 0 ? file.TIPO_CAMBIO : tipoCambioDefault)
                    ).toFixed(2)
                );
            }

            result.push(f);
        }

        return result
    }
}

module.exports.reporte_contenedores= async (campos) => {

    if(('entidad_id' in campos)){
        const { entidad_id, filtro_anio, filtro_mes} = campos      
        
        const now = await cropa_fecha_hora_actual()
        const anio = filtro_anio || new Date(now).getFullYear();
        const mes = filtro_mes || new Date(now).getMonth() + 1;

        // OBTENER COD_CROPA
        let clicodigo = -1
        let tipo_identificacion = -1

        const tipo_cliente = await azureSqlClient({"E": "ENTIDAD"})  
        .where('ENTIDAD_ID', `${entidad_id}`)
        .first('TIPO_ID')

        if(tipo_cliente["TIPO_ID"] == 3){
           tipo_identificacion = 12
        }
        if(tipo_cliente["TIPO_ID"] == 5){
            tipo_identificacion = 14
        }
        if(tipo_cliente["TIPO_ID"] == 2){
            tipo_identificacion = 16
        }

        if(tipo_identificacion <= 0){
            return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'No existe una identificacion para este cliente'};
        }

        const cod_cropa = await azureSqlClient({"EI": "ENTIDAD_IDENTIFICACION"})  
        .where('ENTIDAD_ID', `${entidad_id}`)
        .where('IDENTIFICACION_ID', `${tipo_identificacion}`)
        .first('ENTIDADIDENTIFICACIO_NUMERO AS COD_CROPA')

        clicodigo = cod_cropa["COD_CROPA"] || 0

        if (clicodigo <= 0) {
            return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'No se ha podido localizar el cliente'};
        }

        const response = await reporte_contenedores_cliente({ clicodigo, anio, mes });

        return response;
    }
}

module.exports.reporte_embarques_por_cliente_expo = async (campos) => {

    if(('entidad_id' in campos) && ('cod_empresa' in campos) && ('cod_cenco' in campos)){
        const { entidad_id, cod_empresa, cod_cenco, cod_usuario} = campos

        if(!!cod_usuario){{
            const usuario = await getdatosusuarios({cod_usuario})
            if(usuario.length > 0 &&  !!usuario[0].COD_CROPA){
                campos.cod_cropa = usuario[0].COD_CROPA
            }
            console.log(usuario)
        }}

        const data_azure = await this.reporte_embarques_por_cliente_azure(campos)
        const data_oracle = await this.reporte_embarques_por_cliente_expo_oracle(campos)

        return {
            "embarques_x_mes": [
                ...data_azure.embarques_x_mes,
                ...data_oracle.embarques_x_mes
            ],
            "embarques_x_pago": [
                ...data_azure.embarques_x_pago,
                ...data_oracle.embarques_x_pago
            ],
            "embarques_x_peso_volumen": [
                ...data_azure.embarques_x_peso_volumen,
                ...data_oracle.embarques_x_peso_volumen
            ],
            "embarques_x_pais": [
                ...data_azure.embarques_x_pais,
                ...data_oracle.embarques_x_pais
            ],
            "peso_volumen_x_pais": [
                ...data_azure.peso_volumen_x_pais,
                ...data_oracle.peso_volumen_x_pais
            ]
        }
    } else {
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }

}

module.exports.reporte_embarques_por_cliente_impo = async (campos) => {

    if(('entidad_id' in campos) && ('cod_empresa' in campos) && ('cod_cenco' in campos)){
        const { entidad_id, cod_empresa, cod_cenco, cod_usuario } = campos

        const data_azure = await this.reporte_embarques_por_cliente_azure(campos)
        const data_oracle = await this.reporte_embarques_por_cliente_impo_oracle(campos)

        return {
            "embarques_x_mes": [
                ...data_azure.embarques_x_mes,
                ...data_oracle.embarques_x_mes
            ],
            "embarques_x_pago": [
                ...data_azure.embarques_x_pago,
                ...data_oracle.embarques_x_pago
            ],
            "embarques_x_peso_volumen": [
                ...data_azure.embarques_x_peso_volumen,
                ...data_oracle.embarques_x_peso_volumen
            ],
            "embarques_x_pais": [
                ...data_azure.embarques_x_pais,
                ...data_oracle.embarques_x_pais
            ],
            "peso_volumen_x_pais": [
                ...data_azure.peso_volumen_x_pais,
                ...data_oracle.peso_volumen_x_pais
            ]
        }
    } else {
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }

}

