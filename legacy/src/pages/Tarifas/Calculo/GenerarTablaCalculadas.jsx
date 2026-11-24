import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Divider,
  Grid,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import GenerarFicha from "./GenerarFicha";
import TextComponent from "../../../components/Formulario/TextComponent";
import { useForm } from "../../../hooks/useForm";
import { useSelector } from "react-redux";
import lightScroll from "../../../style/scrollStyle";
import TooltipComponent from "../../../components/TooltipComponent/TooltipComponent";
import { useFetchMonedas, useFetchTipos } from "../../../hooks/Fetch/useFetchCatalog";
import { ControlledCarruselComponent } from "../../../components/CarruselComponent/ControlledCarruselComponent";
import SelectComponent from "../../../components/Formulario/SelectComponent";
import GenerarTablaTotal from "./GenerarTablaTotal";
// import { colors } from "../../../theme/colors";

const generarBorde = (color = "primary.main", width = "1px", side = "all") => {
  switch (side) {
    case "left":
      return { borderLeftColor: color, borderLeftWidth: width, borderLeftStyle: "solid" };
    case "right":
      return { borderRightColor: color, borderRightWidth: width, borderRightStyle: "solid" };
    case "top":
      return { borderTopColor: color, borderTopWidth: width, borderTopStyle: "solid" };
    case "bottom":
      return { borderBottomColor: color, borderBottomWidth: width, borderBottomStyle: "solid" };

    default:
      return { borderColor: color, borderWidth: width, borderStyle: "solid" };
  }
};
const GenerarCeldaNombre = ({ theme, d }) => {
  return (
    <Stack direction="column" color={d.obligatorio ? `primary.${theme.opositeMode}` : "info.main"} mt={1} width="100%">
      <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {d.nombre}
      </Typography>
      <Typography variant="body" sx={{ textAlign: "right", fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {d?.nombre_proveedor}
      </Typography>
    </Stack>
  );
};
const GenerarCeldaAlertaVacio = ({ d }) => {
  return (
    <Grid container color={"error.main"} mt={0} width="100%" alignItems="center">
      <Grid size="grow">
        <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
          {d?.nombre_rubro}
        </Typography>
        <Grid size="grow">
          <Typography variant="h5" sx={{ fontWeight: "lighter !important", textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
            No se encontraron Servicios de este proveedor para este rubro
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};
const GenerarCeldaErrorDuplicidiad = ({ d }) => {
  return (
    <Grid container color={"error.main"} mt={0} width="100%" alignItems="center">
      <Grid size="grow">
        <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
          {d[0].r?.nombre_rubro}
        </Typography>
        <Grid size="grow">
          <Typography variant="h5" sx={{ fontWeight: "lighter !important", textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
            Se encontro Duplicidad en los Servicios del Rubro
          </Typography>
        </Grid>
      </Grid>
      <Grid size="auto" m={0} p={0}>
        <TooltipComponent
          titulo={
            <Typography>
              Los Sercvicios Duplicados son: <br />
              <List>
                {d.map((i, ind) => (
                  <ListItem sx={{ m: 0, p: 0, mt: ind !== 0 ? i.mt : undefined }} key={`ind`}>
                    <ListItemText sx={{ m: 0, p: 0 }}>
                      <Stack textAlign="left">
                        <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 12 }}>
                          {i.s.nombre}
                        </Typography>
                      </Stack>
                    </ListItemText>
                  </ListItem>
                ))}
              </List>
            </Typography>
          }
        >
          <Typography m={0} mx={1} p={0} className="c-informacion" />
        </TooltipComponent>
      </Grid>
    </Grid>
  );
};
const GenerarCeldaVaciaNombre = ({ d }) => {
  return (
    <Stack direction="column" color={d.obligatorio ? "error.main" : "red.main"} mt={1} width="100%">
      <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {d.nombre}
      </Typography>
      <Typography variant="body" sx={{ textAlign: "right", fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        No se selecciono ninguna tarifa para el rubro
      </Typography>
    </Stack>
  );
};
const GenerarCeldaPorcentajeNombre = ({ theme, d }) => {
  return (
    <Stack direction="column" color={d.obligatorio ? `primary.${theme.opositeMode}` : "info.main"} mt={1} width="100%">
      <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {d.nombre}
      </Typography>
      <Typography variant="body" sx={{ textAlign: "right", fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {d?.entidad_nombre}
      </Typography>
    </Stack>
  );
};
const GenerarCeldaValor = ({ theme, d, total }) => {
  return (
    <Grid container width="100%" direction="column" justifyContent="space-between">
      <Grid key={d.moneda_venta} container color={`black.${theme?.opositeMode}`} width="100%" direction="row" justifyContent="space-between" wrap="nowrap">
        <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16, mr: 1 }}>
          {d.moneda_venta?.simbolo_moneda}
        </Typography>
        <Typography color={`${total ? "black" : "primary"}.${theme?.opositeMode}`} variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }}>
          {(d.venta || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </Typography>
      </Grid>
    </Grid>
  );
};

const GenerarCeldaVaciaValor = ({ theme, d }) => {
  return (
    <Grid container width="100%" direction="row" justifyContent="space-between" wrap="nowrap">
      <Typography variant="body" fontWeight="600" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16 }} color={d.obligatorio ? "error.main" : "red.main"}>
        -
      </Typography>
      <Typography variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }} color={d.obligatorio ? "error.main" : "red.main"}>
        {(0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </Typography>
    </Grid>
  );
};

const GenerarCeldaDetalle = ({ theme, d }) => {
  return (
    <List sx={{ m: 0, p: 0 }}>
      {d.detalles?.map((i, ind) => (
        <ListItem sx={{ m: 0, p: 0, mt: ind !== 0 ? i.mt : undefined }} key={`${i.tarifadetalle_id}-${ind}`}>
          <ListItemText sx={{ m: 0, p: 0 }}>
            <Stack color={`${i.color || "primary"}.${theme.opositeMode}`} textAlign="right">
              <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 10 }}>
                {i.tipo_desc}
              </Typography>
              <Typography variant="body" fontWeight="600" sx={{ fontSize: "inherit", m: 0, p: 0 }}>
                {i.tarifadetalle_descripcion || i.tarifadetalle_valor}
              </Typography>
            </Stack>
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
};
const GenerarCeldaVaciaDetalle = ({ theme }) => {
  return (
    <List sx={{ m: 0, p: 0 }}>
      <ListItem sx={{ m: 0, p: 0 }}>
        <ListItemText sx={{ m: 0, p: 0 }}>
          <Stack color={`${"primary"}.${theme.opositeMode}`} textAlign="right">
            <Typography variant="body" fontWeight="600" sx={{ textAlign: "right", width: "100%", m: 0, p: 0, fontSize: 20 }} color="error.main">
              -
            </Typography>
          </Stack>
        </ListItemText>
      </ListItem>
    </List>
  );
};

const GenerarTablaCalculadas = (props) => {
  const {
    grupos = [],
    gruposCompletos = [],
    selecciones = [],
    seleccionesId = [],
    rubros = [],
    // proveedores = [],
    datos = [],
    seleccionarTarifa = () => {},
    limpiarTarifasSeleccionadas = () => {},
    limpiarRubro = () => {},
    limpiarProveedor = () => {},
    handleCrearTarifa = () => {},
    cotizacionSeleccionada = {},
    keyVal = 0,

    listaProveedores = [],

    indexDeCalculo = 0,
    setIndexDeCalculo = () => {},
    proveedorSeleccionado = null,
    setProveedorSeleccionado = () => {},
    setReconsultarCalculo = () => {},
  } = props;

  const screenSize = useSelector((state) => state.screen);
  const theme = useSelector((state) => state.theme);
  const monedas = useFetchMonedas();
  const tipos = useFetchTipos();

  // const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const index = useMemo(() => indexDeCalculo, [indexDeCalculo]);
  const setIndex = useCallback((i) => setIndexDeCalculo(i), [setIndexDeCalculo]);

  const gruposProcesados = useMemo(() => {
    const listaGeneradoa = new Map(),
      lista = [];

    [{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(grupos || [])]?.forEach((i) =>
      listaGeneradoa.set(i.cod_grupo_rubro, { grupo_nombre: i.nombre || " ", cod_grupo: i.cod_grupo_rubro, rubros: [] })
    );

    if (Array.isArray(datos))
      rubros
        .filter((r) => datos?.find((s) => r.cod_rubro === s.cod_rubro)?.servicios.length > 0)
        .forEach((r) => {
          [{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(grupos || [])]?.forEach((lg) => {
            if (lg.rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) {
              if (!listaGeneradoa.get(lg.cod_grupo_rubro).rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) listaGeneradoa.get(lg.cod_grupo_rubro).rubros.push({ ...r, completo: false });
            } else {
              if (![{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(grupos || [])].some((lg) => lg.rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)))
                if (!listaGeneradoa.get(0).rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) listaGeneradoa.get(0).rubros.push({ ...r, completo: false });
            }
          });
        });

    listaGeneradoa.forEach((val, key) => lista.push(val));

    // console.log({ lista: [{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(grupos || [])] });

    return lista.filter((lg) => lg.rubros.length > 0);
  }, [grupos, rubros, datos]);

  const proveedores = useMemo(() => {
    const proveedores = [];

    if (!Array.isArray(datos)) return [];
    (datos || [])?.forEach((item) =>
      item.servicios?.length > 0
        ? item.servicios
            ?.filter((i) => !i.servicio_interno)
            .map((s) => (proveedores.some((p) => p.entidad_id === s.entidad_id) ? null : proveedores.push({ entidad_id: s.entidad_id, entidad_nombre: s.entidad_nombre })))
        : item.valor && item.costo
          ? proveedores.some((p) => p.entidad_id === 0)
            ? null
            : proveedores.unshift({ entidad_nombre: "VALOR POR DEFECTO", entidad_id: 0 })
          : null
    );
    return proveedores;
  }, [datos]);

  const datos_ = useMemo(() => {
    let data = [];

    const estaSeleccionado = (item) => {
      return selecciones.some((t) => t.cod_servicio === item.cod_servicio) || seleccionesId.some((t) => t.cod_servicio === item.cod_servicio);
    };

    const esSeleccionable = (item) => {
      if (estaSeleccionado(item)) return true;
      if (selecciones.length === 0 && seleccionesId.length === 0) return true;

      const rubroSeleccionado = selecciones.some((t) => t.cod_rubro === item.cod_rubro) || seleccionesId.some((t) => t.cod_rubro === item.cod_rubro);

      const grupo = gruposProcesados.find((g) => g.rubros.some((r) => r.cod_rubro === item.cod_rubro));

      if (!grupo || grupo.cod_grupo === 0) {
        return !rubroSeleccionado;
      }

      const grupoSeleccionado = selecciones.some((t) => t.cod_grupo === grupo.cod_grupo);
      const mismaEntidadEnGrupo = selecciones.some((t) => t.cod_grupo === grupo.cod_grupo && t.entidad_id === item.entidad_id);

      // Lógica de selección basada en grupo
      if (grupoSeleccionado) {
        // Si el grupo está seleccionado, solo permitir selección si es la misma entidad
        // y el rubro específico no está seleccionado
        if (mismaEntidadEnGrupo) {
          return !rubroSeleccionado;
        }
        // Si es diferente entidad, no es seleccionable
        return false;
      }

      return !rubroSeleccionado;

      // const perteneceAGrupoSeleccionado = selecciones.find((g) => g.cod_grupo === item.cod_grupo);
      // const tieneEntidadEnGrupoSeleccionado = selecciones.find((g) => g.entidad_id === item.entidad_id && g.cod_grupo === item.cod_grupo);

      // const perteneceAGrupoCompleto = item.completo;
      // const grupoSeleccioadoCompleto = selecciones.some((g) => g.cod_grupo === item.cod_grupo && g.completo);

      // // console.log(item.cod_servicio);
      // // console.log({ item, grupo, perteneceAGrupoCompleto, tieneEntidadEnGrupoSeleccionado, perteneceAGrupoSeleccionado });
      // if (!grupo) return true;

      // if (grupo.cod_grupo !== 0) {
      //   if (grupoSeleccioadoCompleto) {
      //     if (perteneceAGrupoSeleccionado) {
      //       if (tieneEntidadEnGrupoSeleccionado) {
      //         if (!rubroSeleccionado) return true;
      //         else return false;
      //       } else return false;
      //     }
      //   } else {
      //     if (perteneceAGrupoCompleto) {
      //       if (perteneceAGrupoSeleccionado) {
      //         if (tieneEntidadEnGrupoSeleccionado) return true;
      //         else return false;
      //       }
      //     }
      //   }
      // }
      // if (!rubroSeleccionado) return true;

      // // if (!grupoSeleccioadoCompleto && grupo && perteneceAGrupoCompleto) return false;

      // // if (grupoSeleccioadoCompleto && grupo && !perteneceAGrupoCompleto) return false;

      // // if (!rubroSeleccionado) return true;

      // return false;
    };

    gruposProcesados.forEach(({ grupo_nombre, cod_grupo, ...gp }) => {
      gp.rubros.forEach(({ cod_rubro, nombre_rubro, ...gpr }) => {
        datos
          .filter((d) => d.cod_rubro === cod_rubro)
          .forEach(({ servicios, ...d }) => {
            servicios.forEach(({ entidad_id, entidad_nombre, cod_servicio, ...s }) => {
              let obj = {
                g: { cod: cod_grupo, cod_grupo, grupo_nombre },
                r: { cod: cod_rubro, cod_rubro, nombre_rubro },
                e: { cod: entidad_id, entidad_id, entidad_nombre },
                s: {
                  cod: cod_servicio,
                  cod_servicio,
                  ...s,
                  metodo: s.metodo
                    ? {
                        ...s.metodo,
                        moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === s.metodo?.cod_moneda_venta),
                        moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === s.metodo?.cod_moneda_costo),
                      }
                    : undefined,
                  porcentaje: s.porcentaje
                    ? {
                        ...s.porcentaje,
                        moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === s.porcentaje?.cod_moneda_venta),
                        moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === s.porcentaje?.cod_moneda_costo),
                      }
                    : undefined,
                },
              };

              data.push({ ...obj, s: { ...obj.s, completo: false } });
            });
          });
      });
    });

    data = data.map((obj) => {
      if (obj.g.cod === 0) return { ...obj, s: { ...obj.s, completo: false } };

      const { rubros } = gruposProcesados.find((gp) => gp.cod_grupo === obj.g.cod);

      let verificacion = [];

      rubros.forEach((r) => (data.some((d) => d.e.cod === obj.e.cod && r.cod_rubro === d.r.cod) ? verificacion.push(true) : verificacion.push(false)));

      const completo = !verificacion.some((i) => !i);

      return { ...obj, s: { ...obj.s, completo } };
    });

    return data
      .filter((obj) => !obj.s.servicio_interno)
      .map((obj) => ({
        ...obj,
        s: {
          ...obj.s,
          cod_tipo_pago: tipos?.data?.find((t) => t.value === cotizacionSeleccionada?.cod_tipo_pago),
          seleccionable: esSeleccionable({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
          seleccionado: estaSeleccionado({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
        },
        nombre: `${obj.g.grupo_nombre}`.trim() || `${obj.r.nombre_rubro}`.trim(),
      }));
  }, [datos, gruposProcesados, selecciones, monedas, seleccionesId, cotizacionSeleccionada, tipos?.data]);

  const estiloBorde = {
    borderWidth: 2,
    borderColor: `primary.${theme.opositeMode}`,
    borderBottomStyle: "solid",
    p: 0.5,
  };
  const tableFormRef = useRef(null);

  const cellStyles = useMemo(() => {
    return {
      stickycell: !["sm", "xs"].includes(screenSize.name) ? { position: "sticky", left: 0, zIndex: 3 } : {},
      stickyfooter: !["sm", "xs"].includes(screenSize.name) ? { position: "sticky", bottom: 0, zIndex: 2 } : {},
      stickyhead: !["sm", "xs"].includes(screenSize.name) ? { position: "sticky", left: 0, zIndex: 5 } : {},
    };
  }, []);

  const containerMaxHeight = useMemo(() => {
    if (!tableFormRef.current) return null;

    // console.log(tableFormRef.current.style);

    return tableFormRef.current.clientHeight;
  }, [tableFormRef]);

  const { filtroProveedor, onInputChange } = useForm({
    filtroProveedor: "",
  });

  const proveedoresFiltrados = useMemo(() => proveedores.filter((p) => p.entidad_nombre.toUpperCase().includes(filtroProveedor.toUpperCase())), [proveedores, filtroProveedor]);

  const calcularCantidadRubros = useCallback(
    (g, r, e, cant = 0) => {
      return datos_.filter((d) => d.g.cod === g.cod_grupo && d.r.cod === r.cod_rubro && d.e.cod === e.entidad_id).length > cant;
    },
    [datos_]
  );
  const verificarSiEsCommpleto = useCallback(
    (g, r, e) => {
      return gruposCompletos.find((gc) => gc.entidad_id === e.entidad_id && g.cod_grupo === gc.cod_grupo && r.cod_rubro === gc.cod_rubro)?.completo;
    },
    [gruposCompletos]
  );

  const hayError = useMemo(() => {
    let a = false;
    listaProveedores
      .filter((i, ind) => ind === index)
      .map((i) =>
        gruposProcesados.map((g) =>
          g.rubros.map((r) => {
            const lista = datos_.filter((d) => !d.s.porcentaje).filter((d) => d.g.cod === g.cod_grupo && d.r.cod === r.cod_rubro && d.e.cod === i.entidad_id);

            a = a || lista.length > 1;
          })
        )
      );
    console.log(a);
    return a;
  }, [datos_, gruposProcesados, index, listaProveedores]);

  const onSelect = (ev) => {
    ev.preventDefault();
    let a = false;
    listaProveedores
      .filter((i, ind) => ind === index)
      .map((i) =>
        gruposProcesados.map((g) =>
          g.rubros.map((r) => {
            const lista = datos_.filter((d) => !d.s.porcentaje).filter((d) => d.g.cod === g.cod_grupo && d.r.cod === r.cod_rubro && d.e.cod === i.entidad_id);
            if (lista.length === 1) {
              lista.map(({ g, r, e, s, completo, ...d }) => seleccionarTarifa({ ...g, ...r, ...e, ...s, nombre: d.nombre }));
            }
          })
        )
      );
    console.log(a);
    return a;
  };

  const propiedadesSelect = useMemo(
    () => ({
      color: "primary",
      id: "proveedor",
      label: "Vizualiza un proveedor",
      options: listaProveedores,
      labelOption: "entidad_nombre",
      valueOption: "entidad_id",
      val: proveedorSeleccionado,
      size: 12,
    }),
    [listaProveedores, proveedorSeleccionado]
  );

  return (
    <>
      <Grid container sx={{ p: 0.5, pt: 2, px: 2, borderWidth: 1, backdropFilter: "blur(10px)", borderColor: `primary.${theme.opositeMode}`, borderStyle: "solid", borderRadius: 1, mt: 1 }}>
        <Box px={0} width="100%">
          <Divider
            color={"primary.main"}
            textAlign="left"
            p={0}
            m={0}
            sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
          >
            <Typography color={"text"} variant={"h6"}>
              DUE CARRIER
            </Typography>
          </Divider>
          <Typography color={"text"} variant={"overline"}>
            Seleccione los servicios del{" "}
            <Typography component="b" variant="b" color="primary">
              CARRIER
            </Typography>{" "}
            para aplicar a la cotización
          </Typography>
        </Box>

        <Grid container size={12} pt={2}>
          <Grid size={"grow"}>
            <SelectComponent
              input={propiedadesSelect}
              onInput={(val) => {
                setProveedorSeleccionado(val);
                const ind = listaProveedores.findIndex((p) => p.entidad_id === val?.entidad_id);
                setIndex(ind >= 0 ? ind : 0);
                limpiarTarifasSeleccionadas();
              }}
            />
          </Grid>
          <Grid size={"auto"}>
            <Button onClick={onSelect} disabled={hayError}>
              Seleccionar
            </Button>
            <Button onClick={() => setReconsultarCalculo((i) => i + 1)} disabled={hayError}>
              Recalcular Flete
            </Button>
          </Grid>
        </Grid>
        <Grid size={12}>
          <ControlledCarruselComponent
            showDots={false}
            currentIndex={index}
            onChangeIndex={(val) => {
              setIndex(val);
              setProveedorSeleccionado(listaProveedores[val]);
              limpiarTarifasSeleccionadas();
            }}
            itemsPerPage={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
          >
            {listaProveedores.length === 0 ? (
              <>No se encontro ningun CARRIER para estos datos</>
            ) : (
              listaProveedores.map((i) => {
                const totales = {
                  d: {
                    cod_moneda_venta: 2,
                    moneda_venta: monedas.data?.find((i) => i.cod_moneda === 2), // lineas.map((i) => i.d).filter((i) => i)[0]?.moneda_venta,
                    venta: 0,
                  },
                  q: {
                    cod_moneda_venta: 1,
                    moneda_venta: monedas.data?.find((i) => i.cod_moneda === 1), // lineas.map((i) => i.d).filter((i) => i)[0]?.moneda_venta,
                    venta: 0,
                  },
                };
                return (
                  <>
                    <TableContainer>
                      <Table size="small" sx={{}}>
                        <TableBody>
                          {gruposProcesados.map((g) =>
                            g.rubros.map((r) => {
                              const datos_procesados = datos_.filter((d) => !d.s.porcentaje).filter((d) => d.g.cod === g.cod_grupo && d.r.cod === r.cod_rubro && d.e.cod === i.entidad_id);
                              if (datos_procesados.length == 0) return <></>;

                              return (
                                <>
                                  <TableRow key={`${r.cod_rubro}_1`} hover>
                                    <TableCell>{g.grupo_nombre}</TableCell>
                                    {/* <TableCell>{r.nombre_rubro}</TableCell> */}
                                    {datos_procesados.length > 1 ? (
                                      <TableCell colSpan={3}>
                                        <GenerarCeldaErrorDuplicidiad d={datos_procesados} />
                                      </TableCell>
                                    ) : datos_procesados.length == 0 ? (
                                      <TableCell colSpan={3}>
                                        <GenerarCeldaAlertaVacio d={r} />
                                      </TableCell>
                                    ) : (
                                      datos_
                                        .filter((d) => !d.s.porcentaje)
                                        .filter((d) => d.g.cod === g.cod_grupo && d.r.cod === r.cod_rubro && d.e.cod === i.entidad_id)
                                        .map(({ g, r, e, s, completo, ...d }) => {
                                          const item = { ...g, ...r, ...e, ...s, ...s.metodo, completo, d };

                                          if (item.cod_moneda_venta === 2) totales.d.venta += Number(item.venta || 0);
                                          if (item.cod_moneda_venta === 1) totales.q.venta += Number(item.venta || 0);

                                          return (
                                            <>
                                              {/* <TableCell><pre>{JSON.stringify(item, null, 2)}</pre></TableCell> */}
                                              <TableCell>{item.cod_servicio === 0 ? <GenerarCeldaVaciaNombre d={item} /> : <GenerarCeldaNombre theme={theme} d={item} />}</TableCell>
                                              <TableCell width="1%">
                                                <Grid container direction="column" textAlign="right">
                                                  {item.d ? (
                                                    item.cod_servicio === 0 ? (
                                                      <GenerarCeldaVaciaValor d={item} />
                                                    ) : item.d.venta === 0 ? (
                                                      <GenerarCeldaVaciaValor d={r} />
                                                    ) : (
                                                      <GenerarCeldaValor theme={theme} total={false} d={item} />
                                                    )
                                                  ) : null}
                                                  {item.q ? (
                                                    item.cod_servicio === 0 ? null : item.q.venta === 0 ? (
                                                      <GenerarCeldaVaciaValor d={item} />
                                                    ) : (
                                                      <GenerarCeldaValor theme={theme} total={false} d={item} />
                                                    )
                                                  ) : null}
                                                </Grid>
                                              </TableCell>
                                              <TableCell width="1%">{item.detalles.length > 0 ? <GenerarCeldaDetalle theme={theme} d={item} /> : <GenerarCeldaVaciaDetalle theme={theme} />}</TableCell>
                                            </>
                                          );
                                        })
                                    )}
                                  </TableRow>
                                </>
                              );
                            })
                          )}
                          <TableRow key={`total_1`} hover sx={{ ...generarBorde("primary.main", 4, "top") }}>
                            <TableCell></TableCell>
                            <TableCell>
                              <GenerarCeldaNombre
                                theme={theme}
                                d={{
                                  obligatorio: false,
                                  nombre: "Total",
                                  nombre_proveedor: "",
                                }}
                              />
                            </TableCell>
                            <TableCell width="1%">
                              <Grid container direction="column" textAlign="right">
                                {totales.d.venta > 0 && <GenerarCeldaValor theme={theme} d={totales.d} total />}
                                {totales.q.venta > 0 && <GenerarCeldaValor theme={theme} d={totales.q} total />}
                              </Grid>
                            </TableCell>
                            <TableCell width="1%"></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                );
              })
            )}
          </ControlledCarruselComponent>
        </Grid>
      </Grid>
    </>
  );
};

GenerarCeldaNombre.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarCeldaPorcentajeNombre.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaNombre.propTypes = { d: PropTypes.object };
GenerarCeldaValor.propTypes = { theme: PropTypes.object, d: PropTypes.object, total: PropTypes.bool };
GenerarCeldaErrorDuplicidiad.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaValor.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaDetalle.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaAlertaVacio.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaDetalle.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarTablaCalculadas.propTypes = {
  rubros: PropTypes.array,
  grupos: PropTypes.array,
  proveedores: PropTypes.array,
  datos: PropTypes.array,
  selecciones: PropTypes.array,
  gruposCompletos: PropTypes.array,
  seleccionesId: PropTypes.array,

  keyVal: PropTypes.number,
  cotizacionSeleccionada: PropTypes.object,

  handleCrearTarifa: PropTypes.func,
  seleccionarTarifa: PropTypes.func,
  limpiarRubro: PropTypes.func,
  limpiarProveedor: PropTypes.func,
  limpiarTarifasSeleccionadas: PropTypes.func,

  indexDeCalculo: PropTypes.bool,
  setIndexDeCalculo: PropTypes.func,

  listaProveedores: PropTypes.array,

  proveedorSeleccionado: PropTypes.object,
  setProveedorSeleccionado: PropTypes.func,
  setReconsultarCalculo: PropTypes.func,
};

export default GenerarTablaCalculadas;
