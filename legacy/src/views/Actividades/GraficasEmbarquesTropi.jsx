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

export const GraficasEmbarquesTropi = ({ cliente, cod_empresa, cod_cenco }) => {
  const { themeMode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  const [asesores, setAsesores] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [contenedores, setContenedores] = useState([]);
  const [listaPaises, setListaPaises] = useState([]);
  const [tipoTransporte, setTipoTransporte] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [anioTipoPago, setAnioTipoPago] = useState(null);
  const [filtrosFecha, setFiltrosFecha] = useState({
    anio: null,
    mes: null,
  });

  const months = Array.from({ length: 12 }, (_, i) => new Date(2025, i, 1).toLocaleString("es-US", { month: "short" }));

  const pieParams = {
    height: 250,
    margin: { top: 0, bottom: 40, left: 5, right: 5 },
    hideLegend: true,
  };

  const obtenerDatos = async () => {
    if (!!cliente.entidad_id) {
      await api
        .get("api/appweb/reporte-emb-cliente-tropicargo", {
          params: {
            entidad_id: cliente?.entidad_id,
            filtro_anio: filtrosFecha["anio"]?.value,
            filtro_mes: filtrosFecha["mes"]?.value,
          },
        })
        .then(({ data }) => {
          setHistorial(data.data || []);
        })
        .catch((e) => console.error(e));

      await api
        .get("api/appweb/reporte-contenedores-cliente", {
          params: {
            entidad_id: cliente?.entidad_id,
            filtro_anio: filtrosFecha["anio"]?.value,
            filtro_mes: filtrosFecha["mes"]?.value,
          },
        })
        .then(({ data }) => {
          setContenedores(data.data || []);
        })
        .catch((e) => console.error(e));
    }
    // console.log(filtrosFecha)
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

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerPaises(), obtenerTipos(), obtenerAsesores()]).then(() => dispatch(apagarCarga()));
  }, [obtenerPaises, obtenerTipos, obtenerAsesores, cliente, dispatch]);

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

  const lista_fecha = useMemo(() => {
    let obj = {
      anio: [],
      mes: [],
    };

    let today = new Date();
    Array.from({ length: 5 }, (_, i) =>
      obj["anio"].push({
        label: `${today.getFullYear() - i}`,
        value: today.getFullYear() - i,
      }),
    );
    Array.from({ length: 12 }, (_, i) =>
      obj["mes"].push({
        label: new Date(2025, i, 1).toLocaleString("es-US", { month: "long" }),
        value: i + 1,
      }),
    );
    return obj;
  }, []);

  const paises_obj = useMemo(() => {
    const obj = {};
    listaPaises.forEach((item, index) => {
      obj[item.ref_pais_2] = item.nombre_pais;
    });
    return obj;
  }, [listaPaises]);

  const embarques_importacion = useMemo(() => {
    let obj = {};
    historial
      .filter((registro) => !!registro.tipo_transporte)
      .filter((registro) => registro.codigo_clasificacion == "I")
      .forEach((registro) => {
        if (registro.tipo_transporte in obj) {
          obj[registro.tipo_transporte] += 1;
        } else {
          obj[registro.tipo_transporte] = 1;
        }
      });
    return obj;
  }, [historial]);

  const embarques_exportacion = useMemo(() => {
    let obj = {};
    historial
      .filter((registro) => !!registro.tipo_transporte)
      .filter((registro) => registro.codigo_clasificacion == "E")
      .forEach((registro) => {
        if (registro.tipo_transporte in obj) {
          obj[registro.tipo_transporte] += 1;
        } else {
          obj[registro.tipo_transporte] = 1;
        }
      });
    return obj;
  }, [historial]);

  const selectivos = useMemo(() => {
    let obj = {
      verde: {},
      rojo: {},
    };
    historial
      .filter((registro) => !!registro.selectivo)
      .forEach((registro) => {
        if (registro.selectivo == "LEVANTE SIN REVISION") {
          if (registro.tipo_transporte in obj) {
            obj["verde"][registro.tipo_transporte] += 1;
          } else {
            obj["verde"][registro.tipo_transporte] = 1;
          }
        } else if (registro.selectivo == "EXAMEN FISICO-DOCUMENTAL") {
          if (registro.tipo_transporte in obj) {
            obj["rojo"][registro.tipo_transporte] += 1;
          } else {
            obj["rojo"][registro.tipo_transporte] = 1;
          }
        }
      });
    return obj;
  }, [historial]);

  const impuestos = useMemo(() => {
    let obj = {};

    historial
      .filter((registro) => Object.entries(registro.impuestos).length > 0)
      .forEach((registro) => {
        Object.entries(registro.impuestos).forEach(([tipo, value], i) => {
          if (tipo in obj) {
            obj[tipo]["USD"] += value;
            obj[tipo]["GTQ"] += value * registro.tipo_cambio_impuesto;
          } else {
            obj[tipo] = {
              USD: value,
              GTQ: value * registro.tipo_cambio_impuesto,
            };
          }
        });
      });
    return obj;
  }, [historial]);

  const cif_division = useMemo(() => {
    let obj = {};
    historial
      .filter((registro) => !!registro.descripcion_division)
      .forEach((registro) => {
        if (registro.descripcion_division in obj) {
          obj[registro.descripcion_division] += registro.cif || 0;
        } else {
          obj[registro.descripcion_division] = registro.cif || 0;
        }
      });
    return obj;
  }, [historial]);

  const ducas_division = useMemo(() => {
    let obj = {};
    historial
      .filter((registro) => !!registro.descripcion_division)
      .filter((registro) => !!registro.selectivo)
      .forEach((registro) => {
        if (registro.descripcion_division in obj) {
          obj[registro.descripcion_division] += 1;
        } else {
          obj[registro.descripcion_division] = 1;
        }
      });
    return obj;
  }, [historial]);

  const cif_origen = useMemo(() => {
    let obj = {};
    historial
      .filter((registro) => !!registro.pais)
      .forEach((registro) => {
        if (registro.pais in obj) {
          obj[registro.pais] += registro.cif || 0;
        } else {
          obj[registro.pais] = registro.cif || 0;
        }
      });
    return obj;
  }, [historial]);

  const tipo_gestion = useMemo(() => {
    let obj = {};
    historial
      .filter((registro) => !!registro.filreg)
      .forEach((registro) => {
        if (registro.filreg in obj) {
          obj[registro.filreg] += 1;
        } else {
          obj[registro.filreg] = 1;
        }
      });
    return obj;
  }, [historial]);

  const honorarios = useMemo(() => {
    let obj = {
      gtq: 0,
      usd: 0,
    };
    historial.forEach((registro) => {
      obj["gtq"] += registro.honorarios_gtq || 0;
      obj["usd"] += registro.honorarios_usd || 0;
    });
    return obj;
  }, [historial]);

  const data_embarque_mock = [
    {
      id_tam_equipo: "45G1",
      descripcion: "40x8x9.5 Container with Vents",
      link: 1,
      id_declaracion: 103373,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 102344,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 102346,
    },
    {
      id_tam_equipo: "20G0",
      descripcion: null,
      link: 1,
      id_declaracion: 103286,
    },
    {
      id_tam_equipo: "42G0",
      descripcion: "40x8.5 Non-Vented, Open 1/Both Ends",
      link: 1,
      id_declaracion: 103486,
    },
    {
      id_tam_equipo: "45G1",
      descripcion: "40x8x9.5 Container with Vents",
      link: 1,
      id_declaracion: 102388,
    },
    {
      id_tam_equipo: "22T1",
      descripcion: "20x8.5 Tank Non-Danger Liquid Min. 1.5 Bar",
      link: 1,
      id_declaracion: 102386,
    },
    {
      id_tam_equipo: "22G0",
      descripcion: null,
      link: 1,
      id_declaracion: 103046,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 102384,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 102553,
    },
    {
      id_tam_equipo: "42G1",
      descripcion: "40x8.5 Passive Vents",
      link: 1,
      id_declaracion: 102495,
    },
    {
      id_tam_equipo: "45R1",
      descripcion: "40x9.5 Thermal, Mechanically Refrigerated & Heated",
      link: 1,
      id_declaracion: 103162,
    },
    {
      id_tam_equipo: "22G0",
      descripcion: null,
      link: 1,
      id_declaracion: 103199,
    },
    {
      id_tam_equipo: "20G0",
      descripcion: null,
      link: 1,
      id_declaracion: 103191,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 102582,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 102584,
    },
    {
      id_tam_equipo: "20G0",
      descripcion: null,
      link: 1,
      id_declaracion: 103192,
    },
    {
      id_tam_equipo: "42G0",
      descripcion: "40x8.5 Non-Vented, Open 1/Both Ends",
      link: 1,
      id_declaracion: 104071,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 102776,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 103196,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 102756,
    },
    {
      id_tam_equipo: "20G0",
      descripcion: null,
      link: 1,
      id_declaracion: 103282,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 103000,
    },
    {
      id_tam_equipo: "22G1",
      descripcion: null,
      link: 1,
      id_declaracion: 103183,
    },
    {
      id_tam_equipo: "20G0",
      descripcion: null,
      link: 1,
      id_declaracion: 103909,
    },
    {
      id_tam_equipo: "42G0",
      descripcion: "40x8.5 Non-Vented, Open 1/Both Ends",
      link: 1,
      id_declaracion: 103910,
    },
  ];

  const data_embarque = useMemo(() => {
    const obj = {};
    contenedores.forEach((embarque) => {
      let label = embarque["descripcion"] || embarque["id_tam_equipo"];
      if (label in obj) {
        obj[label] += 1;
      } else {
        obj[label] = 1;
      }
    });
    return obj;
  }, [contenedores]);

  return (
    <Grid container mt={1} mb={2} spacing={2}>
      <Grid pt={1} size={12}>
        <CardCliente cliente={cliente} />
      </Grid>

      {/* ------------ FILTRO AÑO --------------------- */}
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
        <Grid item size={5}>
          <Box width={"100%"} pb={1}>
            <SelectComponent
              input={{
                id: "mes",
                label: "Mes",
                val: filtrosFecha["mes"],
                tipo: "select",
                size: 6,
                options: lista_fecha["mes"],
                // readonly: true,
              }}
              onInput={(val) => setFiltrosFecha((old) => ({ ...old, mes: val }))}
              id={1}
            />
          </Box>
        </Grid>
        <Grid item size={5}>
          <Box width={"100%"} pb={1}>
            <SelectComponent
              input={{
                id: "anio",
                label: "Año",
                val: filtrosFecha["anio"],
                tipo: "select",
                size: 6,
                options: lista_fecha["anio"],
                // readonly: true,
              }}
              onInput={(val) => setFiltrosFecha((old) => ({ ...old, anio: val }))}
              id={0}
            />
          </Box>
        </Grid>
        <Grid item size={2}>
          <Box width={"100%"}>
            <Button variant="contained" color={"primary"} sx={{ bgcolor: "primary", width: "100%" }} onClick={() => obtenerDatos()}>
              FILTRAR
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* ------------ CONTENEDORES --------------------- */}
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
          <Typography fontSize="1.7rem" fontWeight="bold" align="center" py={1}>
            CONTENEDORES: {contenedores.length} *
          </Typography>
        </Grid>
      </Grid>
      {Object.entries(data_embarque).map(([key, value], i) => (
        <Grid
          container
          spacing={2}
          size={3}
          sx={{
            display: "flex",
            justifyContent: "left",
            alignItems: "center",
            bgcolor: themeMode === "dark" ? "background.50" : "background.900",
            borderRadius: 2,
            borderColor: themeMode === "dark" ? "background.100" : "background.700",
            borderWidth: 1,
            boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
            px: 2.5,
          }}
        >
          <Grid item size={10}>
            {/* {key} , {value} */}
            <Typography fontSize="1.2rem">{key}</Typography>
            <Typography fontSize="2.75rem">{value}</Typography>
          </Grid>
          <Grid item size={2}>
            <Typography className={"c-bienes"} fontSize="2.75rem" />
          </Grid>
        </Grid>
      ))}

      {/* ------------ EMBARQUES TITULO --------------------- */}
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
          <Typography fontSize="1.7rem" fontWeight="bold" align="center" py={1}>
            TIPOS DE EMBARQUES
          </Typography>
        </Grid>
      </Grid>

      {/* ------------ IMPORTACIONES --------------------- */}
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
            Importaciones
          </Typography>
          <Box py={1}>
            <PieChart
              slotProps={{
                legend: { hidden: false, direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 },
              }}
              series={[
                {
                  data: Object.entries(embarques_importacion || {}).map(([tipo, count], i) => ({ id: i, value: count, label: tipo })),
                },
              ]}
              {...pieParams}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ EXPORTACIONES --------------------- */}
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
            Exportaciones
          </Typography>
          <Box py={1}>
            <PieChart
              slotProps={{
                legend: { hidden: false, direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 },
              }}
              series={[
                {
                  data: Object.entries(embarques_exportacion || {}).map(([tipo, count], i) => ({ id: i, value: count, label: tipo })),
                },
              ]}
              {...pieParams}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ SELECTIVO VERDE --------------------- */}
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
            Selectivo Verde *
          </Typography>
          <Box py={1}>
            <PieChart
              slotProps={{
                legend: { hidden: false, direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 },
              }}
              series={[
                {
                  data: Object.entries(selectivos["verde"] || {}).map(([tipo, count], i) => ({ id: i, value: count, label: tipo })),
                },
              ]}
              {...pieParams}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ SELECTIVO ROJO --------------------- */}
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
            Selectivo Rojo *
          </Typography>
          <Box py={1}>
            <PieChart
              slotProps={{
                legend: { hidden: false, direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 },
              }}
              series={[
                {
                  data: Object.entries(selectivos["rojo"] || {}).map(([tipo, count], i) => ({ id: i, value: count, label: tipo })),
                },
              ]}
              {...pieParams}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ DUCAS TITULO --------------------- */}
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
          <Typography fontSize="1.7rem" fontWeight="bold" align="center" py={1}>
            DUCAS POR DIVISIÓN
          </Typography>
        </Grid>
      </Grid>

      {/* ------------ DUCAS DIVISION CHART --------------------- */}
      <Grid
        container
        spacing={2}
        size={7}
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
          <Box py={1}>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: Object.entries(ducas_division).map(([key, value]) => key),
                  labelStyle: {
                    fontSize: 14,
                  },
                  tickLabelStyle: {
                    angle: -13,
                    textAnchor: "end",
                    fontSize: 12,
                  },
                },
              ]}
              series={[
                {
                  data: Object.entries(ducas_division).map(([key, value]) => value),
                },
              ]}
              barLabel={(item, context) => (context.bar.height < 20 ? null : item.value?.toFixed(2).toString())}
              height={400}
              margin={{ left: 80, bottom: 70 }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ CIF DIVISION TABLE --------------------- */}
      <Grid
        container
        spacing={2}
        size={5}
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
          <Box py={1}>
            <TablaEditableComponent
              encabezados={[
                { id: "division", name: "division", field: "division", label: "DIVISION", editable: false, filtrar: true },
                { id: "ducas", name: "ducas", field: "ducas", label: "DUCAS", editable: false, filtrar: true },
              ]}
              data={Object.entries(ducas_division).map(([key, value]) => ({
                division: key,
                ducas: value.toFixed(2),
              }))}
              idKey="division"
              rowKey="division"
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
          </Box>
        </Grid>
      </Grid>

      {/* ------------ CIF DIVISION TITULO --------------------- */}
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
          <Typography fontSize="1.7rem" fontWeight="bold" align="center" py={1}>
            CIF POR DIVISIÓN
          </Typography>
        </Grid>
      </Grid>

      {/* ------------ CIF DIVISION CHART --------------------- */}
      <Grid
        container
        spacing={2}
        size={7}
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
          <Box py={1}>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: Object.entries(cif_division).map(([key, value]) => key),
                  labelStyle: {
                    fontSize: 14,
                  },
                  tickLabelStyle: {
                    angle: -13,
                    textAnchor: "end",
                    fontSize: 12,
                  },
                },
              ]}
              series={[
                {
                  data: Object.entries(cif_division).map(([key, value]) => value),
                },
              ]}
              barLabel={(item, context) => (context.bar.height < 20 ? null : item.value?.toFixed(2).toString())}
              height={400}
              margin={{ left: 80, bottom: 70 }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ CIF DIVISION TABLE --------------------- */}
      <Grid
        container
        spacing={2}
        size={5}
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
          <Box py={1}>
            <TablaEditableComponent
              encabezados={[
                { id: "division", name: "division", field: "division", label: "DIVISION", editable: false, filtrar: true },
                { id: "cif", name: "cif", field: "cif", label: "CIF", editable: false, filtrar: true },
              ]}
              data={Object.entries(cif_division).map(([key, value]) => ({
                division: key,
                cif: value.toFixed(2),
              }))}
              idKey="division"
              rowKey="division"
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
          </Box>
        </Grid>
      </Grid>

      {/* ------------ CIF ORIGEN TITULO --------------------- */}
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
          <Typography fontSize="1.7rem" fontWeight="bold" align="center" py={1}>
            CIF POR ORIGEN
          </Typography>
        </Grid>
      </Grid>

      {/* ------------ CIF ORIGEN CHART --------------------- */}
      <Grid
        container
        spacing={2}
        size={7}
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
          <Box py={1}>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: Object.entries(cif_origen).map(([key, value]) => key),
                  labelStyle: {
                    fontSize: 14,
                  },
                  tickLabelStyle: {
                    angle: -13,
                    textAnchor: "end",
                    fontSize: 12,
                  },
                },
              ]}
              series={[
                {
                  data: Object.entries(cif_origen).map(([key, value]) => value),
                },
              ]}
              barLabel={(item, context) => (context.bar.height < 20 ? null : item.value?.toFixed(2).toString())}
              height={400}
              margin={{ left: 80, bottom: 70 }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ CIF ORIGEN TABLE --------------------- */}
      <Grid
        container
        spacing={2}
        size={5}
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
          <Box py={1}>
            <TablaEditableComponent
              encabezados={[
                { id: "pais", name: "pais", field: "pais", label: "PAIS", editable: false, filtrar: true },
                { id: "cif", name: "cif", field: "cif", label: "CIF", editable: false, filtrar: true },
              ]}
              data={Object.entries(cif_origen).map(([key, value]) => ({
                pais: key,
                cif: value.toFixed(2),
              }))}
              idKey="pais"
              rowKey="pais"
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
          </Box>
        </Grid>
      </Grid>

      {/* ------------ TIPO GESTION TITULO --------------------- */}
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
          <Typography fontSize="1.7rem" fontWeight="bold" align="center" py={1}>
            TIPO DE GESTIÓN
          </Typography>
        </Grid>
      </Grid>

      {/* ------------ TIPO GESTION CHART --------------------- */}
      <Grid
        container
        spacing={2}
        size={7}
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
          <Box py={1}>
            <PieChart
              slotProps={{
                legend: { hidden: false, direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 },
              }}
              series={[
                {
                  data: Object.entries(tipo_gestion || {}).map(([tipo, count], i) => ({ id: i, value: count, label: tipo })),
                },
              ]}
              {...pieParams}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ TIPO GESTION TABLE --------------------- */}
      <Grid
        container
        spacing={2}
        size={5}
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
          <Box py={1}>
            <TablaEditableComponent
              encabezados={[
                { id: "tipo", name: "tipo", field: "tipo", label: "TIPO", editable: false, filtrar: true },
                { id: "num", name: "num", field: "num", label: "#", editable: false, filtrar: true },
              ]}
              data={Object.entries(tipo_gestion).map(([key, value]) => ({
                tipo: key,
                num: value,
              }))}
              idKey="pais"
              rowKey="pais"
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
          </Box>
        </Grid>
      </Grid>

      {/* ------------ IMPUESTOS TITULO --------------------- */}
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
          <Typography fontSize="1.7rem" fontWeight="bold" align="center" py={1}>
            IMPUESTOS PAGADOS *
          </Typography>
        </Grid>
      </Grid>

      {/* ------------ IMPUESTOS CHART --------------------- */}
      <Grid
        container
        spacing={2}
        size={7}
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
          <Box py={1}>
            <PieChart
              slotProps={{
                legend: { hidden: false, direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 },
              }}
              series={[
                {
                  data: Object.entries(impuestos || {}).map(([tipo, valores], i) => ({ id: i, value: valores["GTQ"], label: tipo.toUpperCase() })),
                },
              ]}
              {...pieParams}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ------------ TIPO GESTION TABLE --------------------- */}
      <Grid
        container
        spacing={2}
        size={5}
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
          <Box py={1}>
            {/* <pre>{JSON.stringify(impuestos, null, 2)}</pre> */}
            <TablaEditableComponent
              encabezados={[
                { id: "impuesto", name: "impuesto", field: "impuesto", label: "IMPUESTO", editable: false, filtrar: true },
                { id: "gtq", name: "gtq", field: "gtq", label: "Q", editable: false, filtrar: true },
                { id: "usd", name: "usd", field: "usd", label: "$", editable: false, filtrar: true },
              ]}
              data={Object.entries(impuestos).map(([key, impuestos]) => ({
                impuesto: key.toUpperCase(),
                gtq: impuestos["GTQ"].toFixed(2),
                usd: impuestos["USD"].toFixed(2),
              }))}
              idKey="pais"
              rowKey="pais"
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
          </Box>
        </Grid>
      </Grid>

      {/* ------------ HONORARIOS TITULO --------------------- */}
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
          <Typography fontSize="1.7rem" fontWeight="bold" align="center" py={1}>
            HONORARIOS FACTURADOS
          </Typography>
        </Grid>
      </Grid>

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
          px: 2.5,
          py: 1,
        }}
      >
        <Grid item size={10}>
          <Typography fontSize="1.2rem">QUETZALES</Typography>
          <Typography fontSize="2.75rem">{honorarios["gtq"].toFixed(2)}</Typography>
        </Grid>
        <Grid item size={2}>
          <Typography fontSize="2.75rem">Q</Typography>
        </Grid>
      </Grid>

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
          px: 2.5,
          py: 1,
        }}
      >
        <Grid item size={10}>
          <Typography fontSize="1.2rem">DOLARES</Typography>
          <Typography fontSize="2.75rem">{honorarios["usd"].toFixed(2)}</Typography>
        </Grid>
        <Grid item size={2}>
          <Typography fontSize="2.75rem">$</Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};
