import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { alpha, Box, Grid, Typography } from "@mui/material";
import { AreaPlot, Gauge, gaugeClasses, LineChart, useGaugeState } from "@mui/x-charts";
import moment from "moment";
import { coloresChart } from "../../theme/colors";
import { useSelector } from "react-redux";
import { api } from "../../api";

const GraficasPersonales = (props) => {
  const { actividades, usuario, cod_tipo_asignacion, cod_empresa, cod_cc, fecha_inicial, fecha_final } = props;
  const { json, cod_usuario } = useSelector((state) => state.auth);
  const { configuracion = {} } = json || {};
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const [dataGraficasObjetivos, setDataGraficasObjetivos] = useState([]);
  const [actividadesConsultadas, setactividadesConsultadas] = useState([]);
  let usuario_localStore = localStorage.getItem("cod_usuario")?.toString() || "";

  const [cod_tipo_asignacion_proceso, setCod_tipo_asignacion_proceso] = useState(cod_tipo_asignacion || configuracion?.puesto_default?.cod_tipo_asignacion || 0);
  const [cod_usuario_proceso, setcod_usuario_proceso] = useState(usuario ?? cod_usuario ?? usuario_localStore);
  const [cod_empresa_proceso, setCod_empresa_proceso] = useState(cod_empresa || currentEmpresa?.cod_empresa);
  const [cod_cc_proceso, setCod_cc_proceso] = useState(cod_cc || currentCentroCosto?.cod_cc);
  const [fecha_inicial_proceso, setFecha_inicial_proceso] = useState(fecha_inicial ? moment(fecha_inicial).toDate() : moment().startOf("W").toDate());
  const [fecha_final_proceso, setFecha_final_proceso] = useState(fecha_final ? moment(fecha_final).toDate() : moment().endOf("W").toDate());

  useEffect(() => {
    if (usuario !== undefined) setcod_usuario_proceso(usuario);
    if (cod_tipo_asignacion !== undefined) setCod_tipo_asignacion_proceso(cod_tipo_asignacion);
    if (cod_empresa !== undefined) setCod_empresa_proceso(cod_empresa);
    if (cod_cc !== undefined) setCod_cc_proceso(cod_cc);
    if (fecha_inicial !== undefined) setFecha_inicial_proceso(fecha_inicial);
    if (fecha_final !== undefined) setFecha_final_proceso(fecha_final);
  }, [cod_cc, cod_empresa, cod_tipo_asignacion, fecha_final, fecha_inicial, usuario]);

  const obtenerActividades = useCallback(async () => {
    await api.get("api/appweb/lista-actividades", { params: { cod_asesor: cod_usuario_proceso } }).then(({ data }) => {
      const info = data.data;

      setactividadesConsultadas(info);
    });
  }, [cod_usuario_proceso]);

  useEffect(() => {
    if (actividades) setactividadesConsultadas(actividades);
  }, [actividades]);

  const obtenerInfoGraficas = useCallback(async () => {
    const codEmp = cod_empresa_proceso || currentEmpresa?.cod_empresa;
    const codCc = cod_cc_proceso || currentCentroCosto?.cod_cc;

    if (!cod_usuario_proceso || !codEmp || !codCc) return;

    await api
      .get("api/appweb/reporte-objetivos", {
        params: {
          cod_usuario: cod_usuario_proceso,
          cod_tipo_asignacion: cod_tipo_asignacion || cod_tipo_asignacion_proceso || 1,
          cod_emp: codEmp,
          cod_cc: codCc,
          fecha_inicial: moment().startOf("W").toDate(),
          fecha_final: moment().endOf("W").toDate(),
        },
      })
      .then(({ data }) => setDataGraficasObjetivos(data?.data?.map((i) => ({ ...i, empleados: i?.empleados[0] }))));
  }, [cod_cc_proceso, cod_empresa_proceso, cod_tipo_asignacion, cod_tipo_asignacion_proceso, cod_usuario_proceso, currentCentroCosto, currentEmpresa]);

  const semanas = useMemo(() => {
    const arr = [];
    const keys = {};
    const listaArr = [];
    const dataSet = [];
    const semanas = {};
    const añoActual = moment().year();
    const totalSemanas = moment(`${añoActual}-12-31`).isoWeeksInYear(); // Total de semanas en el año

    for (let i = 1; i <= totalSemanas; i++) {
      const fechaInicio = moment().year(añoActual).isoWeek(i).startOf("isoWeek");
      const fechaFin = moment().year(añoActual).isoWeek(i).endOf("isoWeek");

      semanas[`semana ${i}`] = {
        fechaInicio,
        fechaFin,
      };
    }
    actividadesConsultadas.forEach((i) => {
      if (!keys[i.nom_tipo]) keys[i.nom_tipo] = 1;
    });

    Object.keys(semanas).map((key, ind) => {
      let num = {};

      actividadesConsultadas.forEach((i) => {
        if (!num[i.nom_tipo]) num[i.nom_tipo] = 0;
      });

      actividadesConsultadas.forEach((i) => {
        if (moment(i.fecha_programada).isBetween(moment(semanas[key]["fechaInicio"]), moment(semanas[key]["fechaFin"]))) {
          num[i.nom_tipo] = num[i.nom_tipo] + 1;
        }
      });

      listaArr[ind] = `${moment(semanas[key]["fechaInicio"]).format("DD-MM-YYYY")} - ${moment(semanas[key]["fechaFin"]).format("DD-MM-YYYY")}`;
      dataSet[ind] = {
        key,
        weeks: listaArr[ind],
      };

      Object.keys(keys).map((i) => (dataSet[ind][i] = num[i] || 0));

      arr[ind] = num;
    });

    const colors = {};

    Object.keys(keys).map((i, ind) => (colors[[`& .MuiAreaElement-series-${i.replaceAll(" ", "_")}`]] = { fill: alpha(coloresChart[1 + ind] ? coloresChart[1 + ind] : coloresChart[1], 0.1) }));

    return { keys: Object.keys(keys), listaArr, arr, colors, dataSet };
  }, [actividadesConsultadas]);

  const realizarConsultas = useCallback(async () => {
    await Promise.all([obtenerInfoGraficas(), obtenerActividades()]);
  }, [obtenerInfoGraficas, obtenerActividades]);

  useEffect(() => {
    realizarConsultas();
  }, [realizarConsultas]);

  return (
    <Grid width="100%" direction="row" container alignItems="center" justifyContent="center" columnGap={5}>
      <Grid width="100%">
        <LineChart
          dataset={semanas.dataSet}
          series={semanas.keys.map((i, ind) => ({
            id: i.replaceAll(" ", "_"),
            dataKey: i,
            label: i,
            area: true,
            showMark: false,
            color: alpha(coloresChart[1 + ind] ? coloresChart[1 + ind] : coloresChart[1], 1),
          }))}
          xAxis={[{ scaleType: "point", dataKey: "weeks" }]}
          height={250}
          sx={{
            ...(semanas.colors || {}),
            "& .MuiChartsAxis-tickLabel * ": { fontSize: 10 },
          }}
          bottomAxis={{ tickLabelStyle: { angle: 45, textAnchor: "start", fontSize: 12 } }}
        >
          <AreaPlot />
        </LineChart>
      </Grid>
      {cod_tipo_asignacion_proceso ? (
        dataGraficasObjetivos.length === 0 ? (
          <Grid size={12} py={2}>
            <Typography variant="h6" sx={{ my: 5, mx: "auto !important" }} fontWeight={"bolder"} textAlign="center">
              No se encontraron Objetivos Activos
            </Typography>
          </Grid>
        ) : (
          dataGraficasObjetivos?.map((i) => {
            const emp = i.empleados;

            const datosDeHoyEncontrados = emp?.datos.find((d) => moment().isSameOrAfter(d.fecha_inicial) && moment().isSameOrBefore(d.fecha_final));

            const datoDeHoy = { ...(datosDeHoyEncontrados || {}), actividades: datosDeHoyEncontrados?.actividades.length || 0 };

            return (
              <Grid key={`${i.cod_tipo_actividad}-${i.descripcion}`} size="auto" sx={{ minWidth: 200 }} container direction="column">
                <Box width="100%" sx={{ position: "relative", width: 200, height: 110, margin: "auto" }}>
                  <Gauge
                    sx={{
                      p: 0,
                      m: 0,
                      mt: 0,
                      [`& .${gaugeClasses.valueText}`]: { fontSize: 40, transform: "translate(0px, -10px)", zIndex: 100 },
                      [`& .${gaugeClasses.valueArc}`]: { fill: coloresChart[0] },
                    }}
                    width={200}
                    height={100}
                    value={i.cantidad && datoDeHoy?.actividades ? (datoDeHoy?.actividades >= i.cantidad ? i.cantidad : datoDeHoy?.actividades) : 0}
                    valueMax={i.cantidad || 0}
                    startAngle={-90}
                    endAngle={90}
                    outerRadius={30}
                    cornerRadius={5}
                    cy={0}
                    text=""
                  >
                    <GaugePointer />
                  </Gauge>
                  <Typography
                    variant="h6"
                    color={datoDeHoy?.actividades < i?.cantidad ? "error.main" : "success.main"}
                    sx={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%)", fontWeight: "bold" }}
                  >
                    {datoDeHoy?.actividades}
                  </Typography>
                  <Typography variant="caption" color="grey.main" sx={{ position: "absolute", bottom: "10", left: "25%", transform: "translate(-50%, -50%)", fontWeight: "100 !important" }}>
                    {0}
                  </Typography>
                  <Typography variant="h6" color="primary.main" sx={{ position: "absolute", bottom: "-10", right: "25%", transform: "translate(50%, -50%)", fontWeight: "bold" }}>
                    {i?.cantidad}
                  </Typography>
                </Box>
                <Typography color="primary.main" fontWeight={"bold"} textAlign="center">
                  {i.tipo_descripcion}
                </Typography>
                <Typography textAlign="center">
                  Calculado por:{" "}
                  <Typography variant="span" fontWeight={"700"} textAlign="center">
                    {i.periodicidad_unidad}
                  </Typography>
                </Typography>
                <Typography variant="caption" color="primary.main" sx={{ margin: "auto !important" }} fontWeight={"bolder"} maxWidth={200} textAlign="center">
                  {i.descripcion}
                </Typography>
              </Grid>
            );
          })
        )
      ) : (
        <Grid size={12} py={2}>
          <Typography variant="h6" sx={{ my: 5, mx: "auto !important" }} fontWeight={"bolder"} textAlign="center">
            No se Encontro el tipo de Asignacion
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

GraficasPersonales.propTypes = {
  actividades: PropTypes.array,
  usuario: PropTypes.number,
  cod_tipo_asignacion: PropTypes.number,
  cod_empresa: PropTypes.number,
  cod_cc: PropTypes.number,
  fecha_inicial: PropTypes.string,
  fecha_final: PropTypes.string,
};

function GaugePointer() {
  const { valueAngle, outerRadius, cx, cy, value, valueMax, maxRadius } = useGaugeState();

  if (valueAngle === null) {
    // No value to display
    return null;
  }

  let val = valueAngle;

  if (value >= valueMax) val = 1.55;

  const calc_x = cx + outerRadius * 2 * Math.sin(val);
  const calc_y = cy - outerRadius * 2 * Math.cos(val);

  const target = {
    x: cx + outerRadius * 2 * Math.sin(val), // Number.isNan(calc_x) ? 0 : calc_x,
    y: cy - outerRadius * 2 * Math.cos(val), // Number.isNan(calc_y) ? 0 : calc_y,
  };

  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="red" />
      <path d={`M ${cx} ${cy} L ${target.x} ${target.y}`} stroke="red" strokeWidth={3} />
    </g>
  );
}

export default GraficasPersonales;
