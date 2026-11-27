const { lista_reportes_disponibles } = require("../../app/controllers/reportes/reportes");
const { reporte_embarques_por_cliente_expo, reporte_embarques_por_cliente_expo_oracle, reporte_embarques_por_cliente_impo_oracle, reporte_embarques_por_cliente_impo, reporte_embarques_por_cliente_tropicargo_oracle, reporte_contenedores, reporte_embarques_por_cliente_azure } = require("../../app/controllers/reportes/reportes_embarques_expo");
const { reporte_emb_fcl_transito_gt } = require("../../app/controllers/reportes/reportes_embarques_transito");

module.exports.AppCloudRoutesModuloReportes = (app) => {
    // Consulta de Reports Disponibles
    app.get('/lista-reportes-disponibles', (req, res) => {
        lista_reportes_disponibles(req.query)
        .then(i => res.apiResponse(i))
        .catch(e => res.apiResponse(undefined,e.message,404));
    })

    // Reportes Embarques
    app.get("/reporte-emb-cliente-azure", (req, res) => {
        reporte_embarques_por_cliente_azure(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/reporte-emb-cliente-expo-oracle", (req, res) => {
        reporte_embarques_por_cliente_expo_oracle(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/reporte-emb-cliente-impo-oracle", (req, res) => {
        reporte_embarques_por_cliente_impo_oracle(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/reporte-emb-cliente-expo", (req, res) => {
        reporte_embarques_por_cliente_expo(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/reporte-emb-cliente-impo", (req, res) => {
        reporte_embarques_por_cliente_impo(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });


    app.get("/reporte-emb-cliente-tropicargo", (req, res) => {
        reporte_embarques_por_cliente_tropicargo_oracle(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/reporte-contenedores-cliente", (req, res) => {
        reporte_contenedores(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    // EMB-EFCLTGT-01 Embarques FCL en transito GT (SQL fijo en Oracle)
    app.get("/reporte-emb-fcl-transito-gt", (req, res) => {
        reporte_emb_fcl_transito_gt(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });
}