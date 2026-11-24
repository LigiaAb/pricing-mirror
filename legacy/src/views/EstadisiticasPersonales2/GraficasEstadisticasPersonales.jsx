import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { alpha, Box, Button, Grid, Icon, Typography } from "@mui/material";
import { AreaPlot, Gauge, gaugeClasses, GaugeReferenceArc, GaugeValueArc, LineChart, PieChart, useGaugeState } from "@mui/x-charts";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useTheme } from "@emotion/react";
import { ListaActividades2 } from "../../pages/Actividades/ListaActividades2";
import { useSelector } from "react-redux";
import { api } from "../../api";
import { isBefore, getWeek, eachWeekOfInterval, startOfYear, endOfYear, format, isAfter, isEqual, add, compareAsc, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { coloresChart } from "../../theme/colors";
import moment from "moment";
import GraficasPersonales from "./GraficasPersonales";

function GaugePointer() {
  const { valueAngle, outerRadius, cx, cy, value, valueMax, maxRadius } = useGaugeState();

  if (valueAngle === null) {
    // No value to display
    return null;
  }

  let val = valueAngle;

  if (value >= valueMax) val = 1.55;

  const target = {
    x: cx + outerRadius * 2 * Math.sin(val),
    y: cy - outerRadius * 2 * Math.cos(val),
  };

  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="red" />
      <path d={`M ${cx} ${cy} L ${target.x} ${target.y}`} stroke="red" strokeWidth={3} />
    </g>
  );
}
const GraficasEstadisticasPersonales = (props) => {
  const formatDate = (date, formato = "PPPP") => {
    return format(date, formato, { locale: es });
  };
  const { opositeMode, colors } = useSelector((state) => state.theme);
  const { cod_usuario, configuracion, usuario } = useSelector((state) => state.auth);
  const { currentPais, currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  // const {} = props;
  const theme = useTheme();

  const [actividades, setActividades] = useState([]);
  const [fechas, setFechas] = useState([1]);

  const obtenerActividades = useCallback(async () => {
    await api.get("api/appweb/lista-actividades", { params: { cod_asesor: cod_usuario } }).then(({ data }) => {
      const info = data.data;
      const finalizados = [];
      const pendientes = [];
      const agendados = [];
      let listaFechas = [];
      const agendaPorFecha = { finalizados: [], pendientes: [], agendados: [] };

      const hoy = new Date();
      const manana = add(hoy, { days: 1 });

      setActividades(info);

      // console.log(info.map((i) => i.fecha_programada));

      // Generar Array de fechas :

      function obtenerSemanasDelAno(ano) {
        const semanas = eachWeekOfInterval(
          {
            start: startOfYear(new Date(ano, 0, 1)),
            end: endOfYear(new Date(ano, 11, 31)),
          },
          { weekStartsOn: 1 }
        ); // La semana comienza el lunes

        return semanas.map((fecha, indice) => indice + 1);
        // return semanas.map((fecha, indice) => ({
        //   semana: indice + 1,
        //   inicio: format(fecha, "dd/MM/yyyy"),
        // }));
      }
      // console.log(obtenerSemanasDelAno(2024));
      const ordenadoAsc = info.sort((a, b) => compareAsc(parseISO(a.fecha_programada), parseISO(b.fecha_programada)));

      // console.log(ordenadoAsc.map((i) => getWeek(new Date(i.fecha_programada))));

      listaFechas = obtenerSemanasDelAno(2024);

      // console.log({ listaFechas });

      listaFechas.map((i, ind) => {
        agendaPorFecha["finalizados"][ind] = 0;
        agendaPorFecha["pendientes"][ind] = 0;
        agendaPorFecha["agendados"][ind] = 0;
      });

      const obtenerIdDeFecha = (fecha) => listaFechas.findIndex((v) => v === fecha);

      setFechas(listaFechas);

      // console.log({ fechas });
      // console.log(listaFechas);

      info.map((i) => {
        if (i.cod_estado === 24 || i.cod_estado === 25) {
          finalizados.push(i);

          const fecha = getWeek(new Date(i.fecha_programada));
          agendaPorFecha["finalizados"][obtenerIdDeFecha(fecha)]++;
        } else if (i.cod_estado === 23 && isBefore(new Date(i.fecha_programada), manana)) {
          pendientes.push(i);

          const fecha = getWeek(new Date(i.fecha_programada));
          agendaPorFecha["pendientes"][obtenerIdDeFecha(fecha)]++;
        } else if (i.cod_estado === 23 && isAfter(new Date(i.fecha_programada), manana)) {
          agendados.push(i);

          const fecha = getWeek(new Date(i.fecha_programada));
          agendaPorFecha["agendados"][obtenerIdDeFecha(fecha)]++;
        }
      });

      // console.log({ agendaPorFecha });
    });
  }, [cod_usuario, fechas]);

  const realizarConsultas = useCallback(async () => {
    await Promise.all([obtenerActividades()]);
  }, [obtenerActividades]);

  useEffect(() => {
    realizarConsultas();
  }, []);

  return (
    <Box>
      <Grid container width="100%">
        <GraficasPersonales usuario={cod_usuario} actividades={actividades} />
        <Grid size={12} sx={{ mt: 3 }}>
          <ListaActividades2
            filtros={{
              estado: false,
            }}
            cod_usuario={cod_usuario}
            proximas={true}
            newBtn={true}
          />
        </Grid>
        <Grid size={12} sx={{ mt: 3 }}>
          <ListaActividades2
            filtros={{
              estado: false,
            }}
            cod_usuario={cod_usuario}
            vencidas={true}
            newBtn={true}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

GraficasEstadisticasPersonales.propTypes = {};

export default GraficasEstadisticasPersonales;
