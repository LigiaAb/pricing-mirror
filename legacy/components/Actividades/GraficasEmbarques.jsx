import React, { useEffect, useState, useMemo, useCallback } from "react";
import propTypes from "prop-types";
import { Box, Typography, Grid, Button, Icon, CircularProgress, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from "@mui/material";
import { useSelector } from "react-redux";
import TabComponent from "../../components/Tabs/TabComponent";
import { useDispatch } from "react-redux";
import { api } from "../../api";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";

import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart, PieChart, pieArcLabelClasses } from "@mui/x-charts";
import SelectComponent from "../../components/Formulario/SelectComponent";

import { MapChartBubblesComponent } from "../../components/MapChartComponent/MapChartBubblesComponent";
import MapChartComponent from "../../components/MapChartComponent/MapChartComponent";
import TablaEditableComponent from "../../components/Tabla/TablaEditableComponent";
import { CardCliente } from "./CardCliente";
import { coloresChart } from "../../theme/colors";

export const GraficasEmbarques = ({ cliente, cod_empresa, cod_cenco, cardAsignacion = false, usuario }) => {
  const { themeMode } = useSelector((state) => state.theme);
  const { cod_usuario } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [asesores, setAsesores] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [listaPaises, setListaPaises] = useState([]);
  const [tipoTransporte, setTipoTransporte] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [anioTipoPago, setAnioTipoPago] = useState(null);

  const months = Array.from({ length: 12 }, (_, i) => new Date(2025, i, 1).toLocaleString("es-US", { month: "short" }));

  const pieParams = {
    height: 250,
    margin: { top: 0, bottom: 40, left: 5, right: 5 },
    hideLegend: true,
  };

  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo", {
        params: { tipo_tabla: "TRANSPORTE" },
      })
      .then(({ data }) => setTipoTransporte(data.data || []))
      .catch((e) => console.error(e));
  }, []);

  const obtenerPaises = useCallback(async () => {
    await api
      .get("/api/appweb/listapaises")
      .then(({ data }) => setListaPaises(data.data || []))
      .catch((e) => console.error(e));
  }, []);

  const obtenerAsesores = useCallback(async () => {
    if (!!cliente.entidad_id) {
      await api
        .get("api/appweb/lista-asignacion-entidad", {
          params: { entidad_id: cliente?.entidad_id, cod_estado: 1 },
        })
        .then(({ data }) => {
          setAsesores(data.data || []);
        })
        .catch((e) => console.error(e));
    }
  }, []);

  const obtenerHistorial = useCallback(async () => {
    if (!!cliente.entidad_id) {
      if (cod_empresa == 1 && cod_cenco == 16) {
        await api
          .get("api/appweb/reporte-emb-cliente-expo", { params: { entidad_id: cliente?.entidad_id, cod_empresa, cod_cenco, cod_usuario: usuario?.cod_usuario || cod_usuario || undefined } })
          .then(({ data }) => {
            setHistorial(data.data || []);
          })
          .catch((e) => console.error(e));
      } else if (cod_empresa == 1 && cod_cenco == 4) {
        await api
          .get("api/appweb/reporte-emb-cliente-impo", { params: { entidad_id: cliente?.entidad_id, cod_empresa, cod_cenco, cod_usuario: usuario?.cod_usuario || cod_usuario || undefined } })
          .then(({ data }) => {
            setHistorial(data.data || []);
          })
          .catch((e) => console.error(e));
      }
    }
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerPaises(), obtenerTipos(), obtenerAsesores(), obtenerHistorial()]).then(() => dispatch(apagarCarga()));
  }, [obtenerPaises, obtenerTipos, obtenerAsesores, obtenerHistorial, cliente, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const tipos_transporte = useMemo(() => {
    return tipoTransporte.map((tipo) => ({
      ...tipo,
      value: tipo.cod_tipo.toString(),
      label: tipo.nom_tipo,
    }));
  }, [tipoTransporte]);

  const paises_obj = useMemo(() => {
    const obj = {};
    listaPaises.forEach((item, index) => {
      obj[item.ref_pais_2] = item.nombre_pais;
    });
    return obj;
  }, [listaPaises]);

  const asesores_filtrados = useMemo(() => {
    return asesores?.filter((asesor) => asesor.cod_cc == cod_cenco);
  }, [asesores]);

  const embarques_x_mes = useMemo(() => {
    const map = new Map();
    historial?.embarques_x_mes?.forEach((registro) => {
      if (!map.has(registro.ANIO)) map.set(registro.ANIO, Array(12).fill(0));
      map.get(registro.ANIO)[Number(registro.MES) - 1] = map.get(registro.ANIO)[Number(registro.MES) - 1] + (registro.EMBARQUES || 0);
    });
    return Object.fromEntries(map);
  }, [historial]);

  const embarques_x_tipo = useMemo(() => {
    const map = new Map();
    historial?.embarques_x_mes?.forEach((registro) => {
      if (!map.has(registro.ANIO)) map.set(registro.ANIO, {});
      map.get(registro.ANIO)[registro.TIPO_EMBARQUE] = (map.get(registro.ANIO)[registro.TIPO_EMBARQUE] || 0) + (registro.EMBARQUES || 0);
    });
    return Object.fromEntries(map);
  }, [historial]);

  const embarques_x_mes_x_tipo = useMemo(() => {
    if (!tipoSeleccionado) {
      return {};
    }
    const map = new Map();
    historial?.embarques_x_mes
      ?.filter((reg) => reg.TIPO_EMBARQUE == tipoSeleccionado.nom_tipo)
      .forEach((registro) => {
        if (!map.has(registro.ANIO)) map.set(registro.ANIO, Array(12).fill(0));
        map.get(registro.ANIO)[Number(registro.MES) - 1] = map.get(registro.ANIO)[Number(registro.MES) - 1] + (registro.EMBARQUES || 0);
      });
    return Object.fromEntries(map);
  }, [historial, tipoSeleccionado]);

  const embarques_x_tipodepago = useMemo(() => {
    if (!tipoSeleccionado) {
      return {};
    }
    const map = new Map();
    historial?.embarques_x_pago
      ?.filter((reg) => reg.TIPO_EMBARQUE == tipoSeleccionado.nom_tipo)
      .forEach((registro) => {
        if (!map.has(registro.ANIO)) map.set(registro.ANIO, {});
        map.get(registro.ANIO)[registro.TIPO_PAGO] = (map.get(registro.ANIO)[registro.TIPO_PAGO] || 0) + (registro.EMBARQUES || 0);
      });
    return Object.fromEntries(map);
  }, [historial, tipoSeleccionado]);

  const embarques_x_peso_volumen = useMemo(() => {
    if (!tipoSeleccionado) {
      return {};
    }
    const map = new Map();
    historial?.embarques_x_peso_volumen
      ?.filter((reg) => reg.TIPO_EMBARQUE == tipoSeleccionado.nom_tipo)
      .forEach((registro) => {
        if (!map.has(registro.ANIO)) map.set(registro.ANIO, {});
        map.get(registro.ANIO)["PESO"] = (map.get(registro.ANIO)["PESO"] || 0) + (registro.PESO || 0);
        map.get(registro.ANIO)["VOLUMEN"] = (map.get(registro.ANIO)["VOLUMEN"] || 0) + (registro.VOLUMEN || 0);
      });
    return Object.fromEntries(map);
  }, [historial, tipoSeleccionado]);

  const embarques_x_pais = useMemo(() => {
    if (!tipoSeleccionado) {
      return [];
    }

    const obj = {};

    historial?.embarques_x_pais
      .filter((registro) => registro.TIPO_EMBARQUE == tipoSeleccionado.nom_tipo)
      .filter((registro) => !!paises_obj[registro.PAIS_CODIGO_2])
      .forEach((registro, i) => {
        if (!!obj[registro.PAIS_CODIGO_2]) {
          obj[registro.PAIS_CODIGO_2]["value"] += registro.EMBARQUES;
        } else {
          obj[registro.PAIS_CODIGO_2] = {
            id: registro.PAIS_CODIGO_2,
            name: paises_obj[registro.PAIS_CODIGO_2],
            value: registro.EMBARQUES,
          };
        }
      });

    return obj;
  }, [historial, tipoSeleccionado]);

  const volumen_x_pais = useMemo(() => {
    if (!tipoSeleccionado) {
      return [];
    }

    const obj = {};

    historial?.peso_volumen_x_pais
      .filter((registro) => registro.TIPO_EMBARQUE == tipoSeleccionado.nom_tipo)
      .filter((registro) => !!paises_obj[registro.PAIS_CODIGO_2])
      .forEach((registro, i) => {
        if (!!obj[registro.PAIS_CODIGO_2]) {
          obj[registro.PAIS_CODIGO_2][registro.ANIO] = (obj[registro.PAIS_CODIGO_2][registro.ANIO] || 0) + registro.VOLUMEN;
        } else {
          obj[registro.PAIS_CODIGO_2] = {
            ref_pais: registro.PAIS_CODIGO_2,
            nombre_pais: paises_obj[registro.PAIS_CODIGO_2],
            [registro.ANIO]: registro.VOLUMEN,
          };
        }
      });
    return Object.entries(obj).map(([key, value]) => value);
  }, [historial, tipoSeleccionado]);

  const peso_x_pais = useMemo(() => {
    if (!tipoSeleccionado) {
      return [];
    }

    const obj = {};

    historial?.peso_volumen_x_pais
      .filter((registro) => registro.TIPO_EMBARQUE == tipoSeleccionado.nom_tipo)
      .filter((registro) => !!paises_obj[registro.PAIS_CODIGO_2])
      .forEach((registro, i) => {
        if (!!obj[registro.PAIS_CODIGO_2]) {
          obj[registro.PAIS_CODIGO_2][registro.ANIO] = (obj[registro.PAIS_CODIGO_2][registro.ANIO] || 0) + registro.PESO;
        } else {
          obj[registro.PAIS_CODIGO_2] = {
            ref_pais: registro.PAIS_CODIGO_2,
            nombre_pais: paises_obj[registro.PAIS_CODIGO_2],
            [registro.ANIO]: registro.PESO,
          };
        }
      });
    return Object.entries(obj).map(([key, value]) => value);
  }, [historial, tipoSeleccionado]);

  const embarques_x_pais_2 = useMemo(() => {
    if (!tipoSeleccionado) {
      return [];
    }

    const obj = {};

    historial?.peso_volumen_x_pais
      .filter((registro) => registro.TIPO_EMBARQUE == tipoSeleccionado.nom_tipo)
      .filter((registro) => !!paises_obj[registro.PAIS_CODIGO_2])
      .forEach((registro, i) => {
        if (!!obj[registro.PAIS_CODIGO_2]) {
          obj[registro.PAIS_CODIGO_2][registro.ANIO] = (obj[registro.PAIS_CODIGO_2][registro.ANIO] || 0) + registro.EMBARQUES;
        } else {
          obj[registro.PAIS_CODIGO_2] = {
            ref_pais: registro.PAIS_CODIGO_2,
            nombre_pais: paises_obj[registro.PAIS_CODIGO_2],
            [registro.ANIO]: registro.EMBARQUES,
          };
        }
      });
    return Object.entries(obj).map(([key, value]) => value);
  }, [historial, tipoSeleccionado]);

  let encabezado = useMemo(() => {
    let base = [
      { id: "ref_pais", name: "ref_pais", field: "ref_pais", label: "CODIGO PAIS", editable: false, filtrar: true },
      { id: "nombre_pais", name: "nombre_pais", field: "nombre_pais", label: "PAIS", editable: false, filtrar: true },
    ];

    if (!tipoSeleccionado) {
      return base;
    }

    let obj = {};

    historial?.peso_volumen_x_pais
      .filter((registro) => registro.TIPO_EMBARQUE == tipoSeleccionado.nom_tipo)
      .filter((registro) => !!paises_obj[registro.PAIS_CODIGO_2])
      .forEach((registro, i) => {
        obj[registro.ANIO] = 1;
      });

    Object.entries(obj)
      .map(([key, value]) => key)
      .sort((a, b) => a > b)
      .forEach((anio, i) => {
        base.push({ id: `${anio}`, name: `${anio}`, field: `${anio}`, label: `${anio}`, editable: false, filtrar: true });
      });
    return base;
  }, [historial, paises_obj, tipoSeleccionado]);

  return (
    <Grid container mt={1} mb={2} spacing={2}>
      {/* <pre>{JSON.stringify(cliente)}</pre>.
            <pre>{JSON.stringify(asesores, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(historial, null, 2)}</pre> */}

      {/* ------------ LABELS --------------------- */}
      <Grid container spacing={2} size={12} display={!!cardAsignacion ? "box" : "none"}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Box
            py={1}
            height={"100%"}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: "linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(45, 76, 156, 1) 50%, rgba(11, 41, 103, 1) 100%)",
              color: "white.main",
              borderRadius: 2,
            }}
          >
            <Typography fontSize="1.5rem" fontWeight="bold" align="center">
              {cliente?.entidad_nombre}
            </Typography>
            <Typography fontSize="1rem" fontWeight="" align="center">
              {cliente?.tipo}
            </Typography>
          </Box>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Box
            py={1}
            height={"100%"}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: "linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(45, 76, 156, 1) 50%, rgba(11, 41, 103, 1) 100%)",
              color: "white.main",
              borderRadius: 2,
            }}
          >
            <Typography fontSize="1.5rem" fontWeight="bold" align="center">
              {usuario?.nombre}
            </Typography>
            <Typography fontSize="1rem" fontWeight="">
              {usuario?.tipo_asesor || "ASESOR"}
            </Typography>
          </Box>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Box
            py={1}
            height={"100%"}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: "linear-gradient(90deg,rgba(11, 41, 103, 1) 0%, rgba(45, 76, 156, 1) 50%, rgba(11, 41, 103, 1) 100%)",
              color: "white.main",
              borderRadius: 2,
            }}
          >
            <Typography fontSize="1.5rem" fontWeight="bold" align="center">
              {cliente?.industria}
            </Typography>
            <Typography fontSize="1rem" fontWeight="">
              INDUSTRIA
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid pt={1} size={12} display={!!cardAsignacion ? "none" : "box"}>
        <CardCliente cliente={cliente} />
      </Grid>

      {/* ------------ POR AÑO GLOBAL --------------------- */}
      <Grid
        container
        spacing={2}
        size={12}
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
          px: 1,
        }}
      >
        <Grid item size={12}>
          <Typography fontSize="1.5rem" fontWeight="bold">
            Por año
          </Typography>
          <Box>
            <LineChart
              xAxis={[{ data: months, scaleType: "band", id: "EMBARQUES" }]}
              series={Object.entries(embarques_x_mes).map(([key, value]) => ({
                label: key,
                data: value,
              }))}
              height={300}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ POR TIPO --------------------- */}
      <Grid
        container
        spacing={2}
        size={12}
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
          px: 1,
        }}
      >
        <Grid item size={12}>
          <Typography fontSize="1.5rem" fontWeight="bold">
            Por tipo
          </Typography>
          <Grid container size={12} mb={1}>
            {Object.entries(embarques_x_tipo).map(([key, value]) => (
              <Grid item size={4} display="flex" justifyContent="center" flexDirection="column" alignItems="center">
                <PieChart
                  slotProps={{
                    legend: { hidden: false, direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 },
                  }}
                  series={[
                    {
                      data: Object.entries(value).map(([tipo, count], i) => ({ id: i, value: count, label: tipo })),
                    },
                  ]}
                  {...pieParams}
                />

                <Typography fontSize="1.2rem" fontWeight="bold">
                  {key}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* ------------ SELECT --------------------- */}
      <Grid
        container
        spacing={2}
        size={12}
        mt={4}
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
          px: 1,
        }}
      >
        <Box width={"100%"} pb={1}>
          <SelectComponent
            input={{
              id: "tipo",
              label: "Tipo Actividad",
              val: tipoSeleccionado,
              tipo: "select",
              size: 6,
              options: tipos_transporte,
              // readonly: true,
            }}
            onInput={(val) => setTipoSeleccionado(val)}
            id={0}
          />
        </Box>
        {/* <pre>{JSON.stringify(tipoSeleccionado)}</pre>
                <pre>{JSON.stringify(embarques_x_mes_x_tipo)}</pre> */}
      </Grid>

      {/* ------------ POR AÑO --------------------- */}
      <Grid
        container
        spacing={2}
        size={6}
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
          px: 1,
        }}
      >
        <Grid item size={12}>
          <Typography fontSize="1.5rem" fontWeight="bold">
            Por año
          </Typography>
          <Box>
            <LineChart
              xAxis={[{ data: months, scaleType: "band", id: "EMBARQUES" }]}
              series={Object.entries(embarques_x_mes_x_tipo).map(([key, value]) => ({
                label: key,
                data: value,
              }))}
              height={300}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ POR TIPO DE PAGO --------------------- */}
      <Grid
        container
        spacing={2}
        size={6}
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
          px: 1,
        }}
      >
        <Grid item size={10}>
          <Typography fontSize="1.5rem" fontWeight="bold">
            Por tipo de pago
          </Typography>
          <Box>
            <PieChart
              slotProps={{
                legend: { hidden: false, direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 },
              }}
              series={[
                {
                  data: !anioTipoPago ? [] : Object.entries(embarques_x_tipodepago[anioTipoPago] || {}).map(([tipo, count], i) => ({ id: i, value: count, label: tipo })),
                },
              ]}
              {...pieParams}
            />
          </Box>
        </Grid>
        <Grid item size={2}>
          <FormControl>
            <FormLabel>Año</FormLabel>
            <RadioGroup value={anioTipoPago} onChange={(val) => setAnioTipoPago(val.target.value)}>
              {Object.entries(embarques_x_tipodepago).map(([key, value]) => (
                <FormControlLabel value={key} control={<Radio />} label={key} />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>

      {/* ------------ POR PESO --------------------- */}
      <Grid
        container
        spacing={2}
        size={6}
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
          px: 1,
        }}
      >
        <Grid item size={12}>
          <Typography fontSize="1.5rem" fontWeight="bold">
            Por peso
          </Typography>
          <Box>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  // data: ['group A', 'group B', 'group C']
                  data: Object.entries(embarques_x_peso_volumen).map(([key, value]) => key),
                },
              ]}
              series={
                // [{ data: [4, 3, 5] }, { data: [1, 6, 3] }, { data: [2, 5, 6] }]
                [
                  {
                    data: Object.entries(embarques_x_peso_volumen).map(([key, value]) => value["PESO"]),
                  },
                ]
              }
              height={300}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ POR VOLUMEN --------------------- */}
      <Grid
        container
        spacing={2}
        size={6}
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
          px: 1,
        }}
      >
        <Grid item size={12}>
          <Typography fontSize="1.5rem" fontWeight="bold">
            Por volumen
          </Typography>
          <Box>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  // data: ['group A', 'group B', 'group C']
                  data: Object.entries(embarques_x_peso_volumen).map(([key, value]) => key),
                },
              ]}
              series={
                // [{ data: [4, 3, 5] }, { data: [1, 6, 3] }, { data: [2, 5, 6] }]
                [
                  {
                    data: Object.entries(embarques_x_peso_volumen).map(([key, value]) => value["VOLUMEN"]),
                  },
                ]
              }
              height={300}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ MAPA --------------------- */}
      <Grid
        container
        spacing={2}
        size={12}
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
          p: 2,
        }}
      >
        <Typography fontSize="1.5rem" fontWeight="bold">
          Por Pais
        </Typography>
        <Box width={"100%"}>
          <TabComponent
            tabInicial={1}
            opciones={[
              {
                id: 1,
                icono: "c-mapa",
                label: "Mapa",
                content: (
                  // <MapChartBubblesComponent data={Object.entries(embarques_x_pais).map(([key, value]) => (value))}/>
                  <MapChartComponent data={Object.entries(embarques_x_pais).map(([key, value]) => value)} />
                ),
              },
              {
                id: 2,
                icono: "c-caja",
                label: "Volumen",
                content: (
                  <>
                    <TablaEditableComponent
                      encabezados={encabezado || []}
                      data={volumen_x_pais || []}
                      idKey="embarque_id"
                      rowKey="embarque_id"
                      acciones={{
                        add: false,
                        edit: false,
                        delete: false,
                        save: false,
                        cancel: false,
                        view: false,
                      }}
                      editarEnTabla={false}
                      filtrarPorColunmas={true}
                      useSeach={true}
                    />
                  </>
                ),
              },
              {
                id: 3,
                icono: "c-grua",
                label: "Peso",
                content: (
                  <TablaEditableComponent
                    encabezados={encabezado || []}
                    data={peso_x_pais || []}
                    idKey="embarque_id"
                    rowKey="embarque_id"
                    acciones={{
                      add: false,
                      edit: false,
                      delete: false,
                      save: false,
                      cancel: false,
                      view: false,
                    }}
                    editarEnTabla={false}
                    filtrarPorColunmas={true}
                    useSeach={true}
                  />
                ),
              },
              {
                id: 4,
                icono: "c-pallet",
                label: "Embarques",
                content: (
                  <TablaEditableComponent
                    encabezados={encabezado || []}
                    data={embarques_x_pais_2 || []}
                    idKey="embarque_id"
                    rowKey="embarque_id"
                    acciones={{
                      add: false,
                      edit: false,
                      delete: false,
                      save: false,
                      cancel: false,
                      view: false,
                    }}
                    editarEnTabla={false}
                    filtrarPorColunmas={true}
                    useSeach={true}
                  />
                ),
              },
            ]}
          />
        </Box>
      </Grid>
    </Grid>
  );
};
