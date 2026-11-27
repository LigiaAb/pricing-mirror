const { default: axios } = require("axios");
const moment = require("moment");

module.exports.consultar_ultimas_tarifas = async (campos) => {
    try {
        const fecha = moment(campos.fechaValidacion, 'MM-DD-YYYY').toDate();
        const query = azureSqlClient("ENTIDAD AS E")
            .leftJoin("SERVICIO AS S", "S.ENTIDAD_ID", "E.ENTIDAD_ID")
            .leftJoin("PAIS AS P", "P.PAIS_ID", "E.PAIS_ID")
            .leftJoin("RUBRO AS R", "R.RUBRO_ID", "S.RUBRO_ID")
            .leftJoin("METODO AS M", "M.SERVICIO_ID", "S.SERVICIO_ID")
            .leftJoin("TARIFA_COSTOVENTA AS T", "T.METODO_ID", "M.METODO_ID")
            .leftJoin("TIPO AS TI", function () {
                this.on("TI.TIPO_ID", "S.TIPO_CALCULO_ID")
                    .andOnVal("TI.TIPO_TABLA", "CALCULO");
            })
            .leftJoin("TIPO AS TI2", function () {
                this.on("TI2.TIPO_ID", "S.TIPO_CARGA_ID")
                    .andOnVal("TI2.TIPO_TABLA", "TIPO_CARGA");
            })
            .leftJoin("TIPO AS TI3", function () {
                this.on("TI3.TIPO_ID", "S.TIPO_PAGO_ID")
                    .andOnVal("TI3.TIPO_TABLA", "PAGO");
            })
            .leftJoin("TIPO AS TI4", function () {
                this.on("TI4.TIPO_ID", "S.CATEGORIA_TRANSPORTE")
                    .andOnVal("TI4.TIPO_TABLA", "CATEGORIA_TRANSPORTE");
            })
            .leftJoin("TIPO AS TT5", "TT5.TIPO_ID", "M.TIPO_TARIFA_ID");

        query
            .whereRaw("TRIM(E.ENTIDAD_CLASIFICACION) = ?", ["PROVEEDOR"])
            .where("S.TIPO_TRANSPORTE_ID", 49)
            .where("S.SERVICIO_CLASIFICACION", 274)
            .where("S.CENCO_ID", 16)
            .orderBy("E.ENTIDAD_NOMBRE", "asc");

        query
            .select(
                "S.SERVICIO_ID AS SERVICIO",
                "E.ENTIDAD_ID AS ENTIDAD",
                "E.ENTIDAD_NOMBRE AS LINEA",
                "S.SERVICIO_NOMBRE AS DESC",
                "S.SERVICIO_SIGLAS AS IMPRIME",
                "R.RUBRO_NOMBRE AS COBRO",
                "M.METODO_MINIMO AS MINIMO",
                "M.METODO_TODOS_LOS_PAISES AS PAIS",
                azureSqlClient.raw("CASE WHEN TT5.TIPO_DESCRIPCION = 'PUBLICA' THEN 1 ELSE 0 END AS CLIENTE"),
                "T.COSTOVENTA_COSTO AS VALOR",
                "TI.TIPO_DESCRIPCION AS TIPO_COBRO",
                "TI2.TIPO_DESCRIPCION AS NIVEL",
                "TI3.TIPO_DESCRIPCION AS TIPO_PAGO",
                "TI4.TIPO_DESCRIPCION AS TIPTRANS",
                azureSqlClient.raw(`(
                    SELECT EI.ENTIDADIDENTIFICACIO_NUMERO AS VALOR
                    FROM TARIFA_ENTIDAD AS TE
                    CROSS APPLY (
                        SELECT TOP 1 ENTIDADIDENTIFICACIO_NUMERO
                        FROM ENTIDAD_IDENTIFICACION
                        WHERE ENTIDAD_ID = TE.ENTIDAD_ID
                        AND IDENTIFICACION_ID = 12
                    ) AS EI
                    WHERE TE.METODO_ID = M.METODO_ID
                    AND TT5.TIPO_DESCRIPCION = 'PUBLICA'
                    FOR JSON PATH
                ) AS ARRAY_1`),
                azureSqlClient.raw(`(
                    SELECT EI.ENTIDADIDENTIFICACIO_NUMERO AS VALOR
                    FROM TARIFA_ENTIDAD AS TE
                    CROSS APPLY (
                        SELECT TOP 1 ENTIDADIDENTIFICACIO_NUMERO
                        FROM ENTIDAD_IDENTIFICACION
                        WHERE ENTIDAD_ID = TE.ENTIDAD_ID
                        AND IDENTIFICACION_ID = 12
                    ) AS EI
                    WHERE TE.METODO_ID = M.METODO_ID
                    AND (TT5.TIPO_DESCRIPCION <> 'PUBLICA' OR TT5.TIPO_DESCRIPCION IS NULL)
                    FOR JSON PATH
                ) AS ARRAY_2`),
                azureSqlClient.raw(`(
                    SELECT
                        ISNULL(PR.PAIS_CODIGO_2, '') AS PAIS,
                        ISNULL(PEI.PEIDENTFICACION_CODIGO, '') AS IATA
                    FROM TARIFA_RUTA AS TR
                    LEFT JOIN PAIS AS PR ON PR.PAIS_ID = TR.PAIS_ID
                    OUTER APPLY (
                        SELECT TOP 1 PEI.PEIDENTFICACION_CODIGO
                        FROM PUNTO_ENLACE_IDENTIFICACION AS PEI
                        WHERE PEI.PUNTOENLACE_ID = TR.PUNTOENLACE_ID
                        AND PEI.TIPO_ID = 78
                    ) AS PEI
                    WHERE TR.METODO_ID = M.METODO_ID
                    FOR JSON PATH
                ) AS RUTAS`)
            )
            .select(azureSqlClient.raw("FORMAT(M.METODO_FECHA_INICIAL, 'dd/MM/yyyy') AS FECHINI"));

        const query_activas = query.clone()
            .whereNull("M.METODO_FECHA_FINAL");

        const query_vencidas = query.clone()
            .whereNotNull("M.METODO_FECHA_FINAL")
            .select(azureSqlClient.raw("FORMAT(M.METODO_FECHA_FINAL, 'dd/MM/yyyy') AS FECHFIN"));

        if ("fechaValidacion" in campos) {
            const inicio = moment(fecha).startOf("isoWeek").format("YYYY-MM-DD");
            const fin = moment(fecha).add(1, "week").startOf("isoWeek").format("YYYY-MM-DD");

            query_activas
                .where("M.METODO_FECHA_INICIAL", ">=", inicio)
                .where("M.METODO_FECHA_INICIAL", "<", fin);

            query_vencidas
                .where("M.METODO_FECHA_FINAL", ">=", inicio)
                .where("M.METODO_FECHA_FINAL", "<", fin);
        }

        const activas = (await query_activas).map(item => {
            const { ARRAY_1, ARRAY_2, RUTAS, ...datos } = item;
            const rutas = JSON.parse(RUTAS || "[]");
            const paises = rutas.map(i => i.PAIS);
            const iatas = rutas.map(i => i.IATA);
            const todosPaises = Number(item.PAIS) === 1;

            return {
                ...datos,
                CLIENTES_NO: (JSON.parse(ARRAY_1 || "[]").map(i => i.VALOR)).slice(0, 10),
                CLIENTES_SI: (JSON.parse(ARRAY_2 || "[]").map(i => i.VALOR)).slice(0, 10),
                PAISES_NO: (todosPaises ? paises : []).slice(0, 10),
                CIUDADES_NO: (todosPaises ? iatas : []).slice(0, 10),
                PAISES_SI: (!todosPaises ? paises : []).slice(0, 10),
                CIUDADES_SI: (!todosPaises ? iatas : []).slice(0, 10),
            };
        });

        const vencidas = (await query_vencidas).map(item => {
            const { ARRAY_1, ARRAY_2, RUTAS, ...datos } = item;
            const rutas = JSON.parse(RUTAS || "[]");
            const paises = rutas.map(i => i.PAIS);
            const iatas = rutas.map(i => i.IATA);
            const todosPaises = Number(item.PAIS) === 1;

            return {
                ...datos,
                CLIENTES_NO: (JSON.parse(ARRAY_1 || "[]").map(i => i.VALOR)).slice(0, 10),
                CLIENTES_SI: (JSON.parse(ARRAY_2 || "[]").map(i => i.VALOR)).slice(0, 10),
                PAISES_NO: (todosPaises ? paises : []).slice(0, 10),
                CIUDADES_NO: (todosPaises ? iatas : []).slice(0, 10),
                PAISES_SI: (!todosPaises ? paises : []).slice(0, 10),
                CIUDADES_SI: (!todosPaises ? iatas : []).slice(0, 10),
            };
        });

        //url del servicio; se concatena la api a consultar
        const url_servicio = `${process.env.URL_NODE_CLIENTE}/api/azureapp/procesar-tarifas`;

        //confir basica de la peticion
        const config = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const resultado_peticion = await axios.post(url_servicio, { listas: {activas, vencidas}, excel: campos.excel, dbf: campos.dbf }, config)
            .then(async response => {
                console_log("Respuesta de peticion api:", url_servicio);
                // console_log(JSON.stringify(response.data));
                return (response.data.data);
            })
            .catch(async error => {
                console_error('Error al realizar la petición de la api :', url_servicio, error);
                return { 'success': false, "cod_mensaje": 1060, 'mensaje': `Error al consumir servicio api. ${url_servicio}` };
            });

        return resultado_peticion;

        // return lista;
    } catch (error) {
        console_error(error);
        throw error.message;
    }
}