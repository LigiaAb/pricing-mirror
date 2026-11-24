import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid, Icon } from "@mui/material";
import { LineChart, PieChart } from "@mui/x-charts";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import { useTheme } from "@emotion/react";
import { ListaActividades } from "../../../pages/Actividades/ListaActividades";
import { useSelector } from "react-redux";
import { api } from "../../../api";
import { isBefore, getWeek, eachWeekOfInterval, startOfYear, endOfYear, format, isAfter, isEqual, add, compareAsc, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const GraficasEstadisticasPersonales = (props) => {
  const formatDate = (date, formato = "PPPP") => {
    return format(date, formato, { locale: es });
  };
  const { opositeMode } = useSelector((state) => state.theme);
  const { cod_usuario } = useSelector((state) => state.auth);
  // const {} = props;
  const theme = useTheme();

  const [actividades, setActividades] = useState([]);
  const [fechas, setFechas] = useState([1]);

  // Estado inicial del gráfico con visibilidad
  const [chartData, setChartData] = useState([
    { label: "Finalizados", value: 60, visible: true },
    { label: "Pendientes", value: 40, visible: true },
  ]);
  const [chartData1, setChartData1] = useState([
    { label: "Finalizados", value: 60, visible: true },
    { label: "Pendientes", value: 40, visible: true },
    { label: "Agendadas", value: 50, visible: true },
  ]);
  const [chartData2, setChartData2] = useState([]);

  // Cambiar visibilidad al hacer clic en la leyenda
  const toggleVisibility = (index) => {
    setChartData((prevData) => prevData.map((data, i) => (i === index ? { ...data, visible: !data.visible } : data)));
  };
  const toggleVisibility1 = (index) => {
    setChartData1((prevData) => prevData.map((data, i) => (i === index ? { ...data, visible: !data.visible } : data)));
  };
  const toggleVisibility2 = (index) => {
    setChartData2((prevData) => prevData.map((data, i) => (i === index ? { ...data, visible: !data.visible } : data)));
  };

  useEffect(() => {
    api.get("api/appweb/lista-actividades", { params: { cod_asesor: cod_usuario } }).then(({ data }) => {
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
      console.log(obtenerSemanasDelAno(2024));
      const ordenadoAsc = info.sort((a, b) => compareAsc(parseISO(a.fecha_programada), parseISO(b.fecha_programada)));

      console.log(ordenadoAsc.map((i) => getWeek(new Date(i.fecha_programada))));

      listaFechas = obtenerSemanasDelAno(2024);

      console.log({ listaFechas });

      listaFechas.map((i, ind) => {
        agendaPorFecha["finalizados"][ind] = 0;
        agendaPorFecha["pendientes"][ind] = 0;
        agendaPorFecha["agendados"][ind] = 0;
      });

      const obtenerIdDeFecha = (fecha) => listaFechas.findIndex((v) => v === fecha);

      setFechas(listaFechas);

      console.log({ fechas });
      console.log(listaFechas);

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

      console.log({ agendaPorFecha });

      setChartData([
        { label: "Atrasadas", value: agendados.length + pendientes.length, visible: true },
        { label: "Finalizados", value: finalizados.length, visible: true },
      ]);
      setChartData1([
        { label: "Finalizados", value: finalizados.length, visible: true },
        { label: "Atrasadas", value: pendientes.length, visible: true },
        { label: "Agendadas", value: agendados.length, visible: true },
      ]);
      listaFechas.map((i, ind) => {
        agendaPorFecha["finalizados"][ind] = agendaPorFecha["finalizados"][ind] == 0 ? null : agendaPorFecha["finalizados"][ind];
        agendaPorFecha["pendientes"][ind] = agendaPorFecha["pendientes"][ind] == 0 ? null : agendaPorFecha["pendientes"][ind];
        agendaPorFecha["agendados"][ind] = agendaPorFecha["agendados"][ind] == 0 ? null : agendaPorFecha["agendados"][ind];
      });
      setChartData2([
        { label: "Finalizados", data: agendaPorFecha["finalizados"], visible: true },
        { label: "Atrasadas", data: agendaPorFecha["pendientes"], visible: true },
        { label: "Agendadas", data: agendaPorFecha["agendados"], visible: true },
      ]);
    });
  }, [cod_usuario]);

  // Genera los datos ajustados para el gráfico
  const adjustedData = chartData.map((data) => ({
    ...data,
    value: data.visible ? data.value : 0, // Oculta el valor al asignarlo a 0
  }));
  const adjustedData1 = chartData1.map((data) => ({
    ...data,
    value: data.visible ? data.value : 0, // Oculta el valor al asignarlo a 0
  }));
  const adjustedData2 = chartData2.map((data) => ({
    ...data,
    data: data.visible ? data.data : data.data.map(() => null), // Oculta los puntos asignando `null`
  }));

  return (
    <Box>
      <Grid container>
        <Grid key={JSON.stringify({ chartData })} size={{ md: 4, xs: 12 }}>
          <Box width="100%">
            <LineChart
              xAxis={[{ min: 1, max: Math.max(...fechas), data: [...fechas], valueFormatter: (value) => `Semana ${value}` }]}
              series={adjustedData2}
              colors={theme.chart.colors}
              slotProps={{ margin: { right: 0, bottom: 0, top: 0 }, legend: { hidden: true } }}
              height={200}
            />
          </Box>
          <Grid size={12} sx={{ textAlign: "center" }}>
            {chartData2.map(({ label, visible }, index) => (
              <Button
                key={label}
                variant="text"
                onClick={() => toggleVisibility2(index)}
                sx={{
                  margin: 0,
                  color: visible ? `primary.${opositeMode}` : "grey.main",
                }}
              >
                <Icon sx={{ color: visible ? theme.chart.colors[index] : "grey.main", mr: 1 }} className={visible ? "c-radio-button" : "c-circulo"} />
                {label}
              </Button>
            ))}
          </Grid>
        </Grid>
        <Grid key={JSON.stringify({ chartData1 })} size={{ md: 4, xs: 12 }} container>
          <Box width="100%">
            <PieChart
              series={[{ innerRadius: 0, outerRadius: 80, data: adjustedData1 }]}
              slotProps={{ margin: { right: 0, bottom: 0, top: 0 }, legend: { hidden: true } }}
              colors={theme.chart.colors}
              height={200}
              width={"1"}
            />
          </Box>
          <Grid size={12} sx={{ textAlign: "center" }}>
            {chartData1.map(({ label, visible }, index) => (
              <Button
                key={label}
                variant="text"
                onClick={() => toggleVisibility1(index)}
                sx={{
                  margin: 0,
                  color: visible ? `primary.${opositeMode}` : "grey.main",
                }}
              >
                <Icon
                  sx={{
                    color: visible ? theme.chart.colors[index < theme.chart.colors.length ? index : index - theme.chart.colors.length] : "grey.main",
                    mr: 1,
                  }}
                  className={visible ? "c-radio-button" : "c-circulo"}
                />
                {label}
              </Button>
            ))}
          </Grid>
        </Grid>
        <Grid key={JSON.stringify({ chartData2 })} size={{ md: 4, xs: 12 }} container>
          <Box width="100%">
            <PieChart
              series={[{ startAngle: -90, endAngle: 90, innerRadius: 10, outerRadius: 80, data: adjustedData }]}
              colors={theme.chart.colors}
              height={200}
              width={"1"}
              // skipAnimation
              slotProps={{ margin: { right: 0, bottom: 0, top: 0 }, legend: { hidden: true } }}
            />
          </Box>
          <Grid size={12} sx={{ textAlign: "center" }}>
            {chartData.map(({ label, visible }, index) => (
              <Button
                key={label}
                variant="text"
                onClick={() => toggleVisibility(index)}
                sx={{
                  margin: 0,
                  color: visible ? `primary.${opositeMode}` : "grey.main",
                }}
              >
                <Icon sx={{ color: visible ? theme.chart.colors[index] : "grey.main", mr: 1 }} className={visible ? "c-radio-button" : "c-circulo"} />
                {label}
              </Button>
            ))}
          </Grid>
        </Grid>

        <Grid size={12} sx={{ mt: 3 }}>
          <ListaActividades cod_usuario_prop={cod_usuario} filtros={{ estado: true }} retrasadas={true} />
        </Grid>
        {/* <pre>{JSON.stringify(fechas)}</pre> */}
      </Grid>
    </Box>
  );
};

GraficasEstadisticasPersonales.propTypes = {};

export default GraficasEstadisticasPersonales;
