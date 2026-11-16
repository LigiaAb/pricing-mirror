import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid, Icon, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import GenerarFicha from "./GenerarFicha";
import TextComponent from "../../../components/Formulario/TextComponent";
import { useForm } from "../../../hooks/useForm";
import { useSelector } from "react-redux";
import lightScroll from "../../../style/scrollStyle";
import TooltipComponent from "../../../components/TooltipComponent/TooltipComponent";
import { useFetchMonedas, useFetchTipos } from "../../../hooks/Fetch/useFetchCatalog";
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

const GenerarCeldaHeaderG = ({ grupo }) => {
  return (
    <TableCell sx={{ m: 0 }} colSpan={grupo.rubros.length}>
      <Box sx={{ m: 0 }}>{grupo.grupo_nombre}</Box>
    </TableCell>
  );
};

const GenerarCeldaHeaderR = ({ selecciones, seleccionesId, datos, rubro, limpiarRubro }) => {
  return (
    <TableCell sx={{ m: 0 }}>
      <Stack sx={{ m: 0 }} width="100%" direction="row" gap={0} alignContent="center" alignItems="center">
        {[...selecciones, ...seleccionesId].filter((i) => i.cod_rubro === rubro.cod_rubro && !i.servicio_interno).length > 0 ? (
          <TooltipComponent
            titulo={
              <Typography textAlign="center">
                Limpiar selección
                <br /> del Rubro
              </Typography>
            }
            borderColor="primary.main"
            bgcolor="white.main_80"
            fontSize={14}
            content={
              <IconButton sx={{ bgcolor: "error.main", borderRadius: 100, p: 0.5, "&:hover": { bgcolor: "error.200" } }} onClick={() => limpiarRubro(rubro.cod_rubro)}>
                <Icon className="c-x1" color="background" sx={{ fontSize: 10 }} />
              </IconButton>
            }
          />
        ) : null}
        {[...selecciones, ...seleccionesId].filter((i) => i.cod_rubro === rubro.cod_rubro && i.servicio_interno).length > 0 ? (
          <TooltipComponent
            titulo={
              <Typography textAlign="center">
                Rubro seleccionado en
                <br /> Rubros Internos
              </Typography>
            }
            borderColor="primary.main"
            bgcolor="white.main_80"
            fontSize={14}
            content={
              <IconButton sx={{ bgcolor: "error.main", borderRadius: 100, p: 0.5, "&:hover": { bgcolor: "error.main" }, cursor: "auto" }}>
                <Icon className="c-cancelar" color="background" sx={{ fontSize: 10 }} />
              </IconButton>
            }
          />
        ) : null}

        {datos.filter((d) => d.r.cod === rubro.cod_rubro).length === 0 && (
          <TooltipComponent
            titulo={
              <Typography textAlign="center">
                No hay ninguna <br />
                Tarifa para el rubro
              </Typography>
            }
            borderColor="error.main"
            bgcolor="white.main_80"
            fontSize={14}
            content={
              <Box
                alignItems="center"
                alignContent="center"
                alignSelf="center"
                alignText="center"
                sx={{ border: "white 1px solid", bgcolor: "warning.400", fontSize: 12, maxWidth: 20, minWidth: 20, maxHeight: 20, minHeight: 20, borderRadius: 100 }}
              >
                <Icon className="c-alerta" color="black" sx={{ fontSize: "inherit", m: "auto" }} />
              </Box>
            }
          />
        )}
        <Typography width="100%" sx={{ mx: "auto", p: 0 }}>
          {rubro.nombre_rubro}
          {/* {JSON.stringify(r)} */}
        </Typography>
      </Stack>
    </TableCell>
  );
};

const GenerarCeldaProveedor = ({ selecciones, seleccionesId, proveedor, limpiarProveedor }) => {
  return (
    <TableCell width="1%">
      <Typography
        sx={{
          fontSize: "inherit",
          textOverflow: "ellipsis",
          overflow: "visible",
          whiteSpace: "normal",
          overflowWrap: "break-word",
          wordBreak: "auto-phrase",
          hyphens: "auto",
        }}
      >
        <Stack width="100%" direction="row" gap={0} alignContent="center" alignItems="center">
          {[...selecciones, ...seleccionesId].filter((i) => i.entidad_id === proveedor.entidad_id).length > 0 ? (
            <TooltipComponent
              titulo={
                <Typography textAlign="center">
                  Limpiar selección
                  <br /> del Proveedor
                </Typography>
              }
              borderColor="primary.main"
              bgcolor="white.main_80"
              fontSize={14}
              content={
                <IconButton
                  sx={{
                    bgcolor: "error.main",
                    borderRadius: 100,
                    p: 0.5,
                    "&:hover": { bgcolor: "error.200" },
                  }}
                  onClick={() => limpiarProveedor(proveedor.entidad_id)}
                >
                  <Icon className="c-x1" color="background" sx={{ fontSize: 10 }} />
                </IconButton>
              }
            />
          ) : null}
          <Typography width="100%">{proveedor.entidad_nombre}</Typography>
        </Stack>
      </Typography>
    </TableCell>
  );
};

const GenerarTablaCalculo = (props) => {
  const {
    grupos = [],
    gruposCompletos = [],
    selecciones = [],
    seleccionesId = [],
    rubros = [],
    // proveedores = [],
    datos = [],
    seleccionarTarifa = () => {},
    limpiarRubro = () => {},
    limpiarProveedor = () => {},
    handleCrearTarifa = () => {},
    cotizacionSeleccionada = {},
    keyVal = 0,
  } = props;

  const screenSize = useSelector((state) => state.screen);
  const theme = useSelector((state) => state.theme);
  const monedas = useFetchMonedas();
  const tipos = useFetchTipos();

  const gruposProcesados = useMemo(() => {
    const listaGeneradoa = new Map(),
      lista = [];

    [{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(grupos || [])]?.forEach((i) =>
      listaGeneradoa.set(i.cod_grupo_rubro, { grupo_nombre: i.nombre || " ", cod_grupo: i.cod_grupo_rubro, rubros: [] })
    );

    rubros
      .filter((r) => datos.find((s) => r.cod_rubro === s.cod_rubro)?.servicios.length > 0)
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

  return (
    <Box
      height={"auto"}
      className="scroll"
      // maxHeight={"70vh"}
      minHeight={"1vh"}
      ref={tableFormRef}
      sx={{
        p: 0.5,
        borderWidth: 1,
        borderColor: `primary.${theme.opositeMode}`,
        borderStyle: "solid",
        borderRadius: 2,
        mt: 1,
        overflow: "atuo",
      }}
    >
      <TableContainer
        sx={{
          height: "100%",
          maxHeight: "69vh",
          ...lightScroll,
          overflow: "auto",
        }}
      >
        <Table
          stickyHeader
          size="small"
          aria-label="dense table"
          sx={{
            borderCollapse: "collapse",
            borderSpacing: 0,
            width: "100%",
            maxWidth: "100%",
            "& tbody tr": {
              "& td": { ...generarBorde("primary.main_40", 2, "bottom") },
              "& td.rubro-0,& th": { ...generarBorde("primary.main_80", 2, "left") },
              "& td:nth-child(odd)": { bgcolor: "primary.main_0" },
              "& td:nth-child(even)": { bgcolor: "primary.main_5" },
              "& td:first-of-type": {
                ...generarBorde("primary.main_80", 2, "right"),
                ...generarBorde("primary.main_80", 2, "bottom"),
                bgcolor: "background.main",
                maxWidth: 150,
                ...cellStyles.stickycell,
                color: `primary.${theme.opositeMode}`,
                textAlign: "center",
                transform: "scale(0.9999999)",
              },
            },
            "& thead tr": {
              "& td,& th": {
                color: "white !important",
                textAlign: "center",
                textTransform: "uppercase",
                bgcolor: "primary.main",
                ...generarBorde("primary.main", 2, "bottom"),
              },
              "& th": { transform: "scale(0.9999999)" },
              "& th:first-of-type": { "&*": {}, maxWidth: 100, ...cellStyles.stickyhead },
            },
            "& tfoot tr": {
              "& td": { bgcolor: "primary.main" },
              "& td:nth-child(odd)": { bgcolor: "background.main" },
              "& td:nth-child(even)": { bgcolor: "background.main" },
            },
            "& tfoot": {
              "& td": { transform: "scale(0.9999999)" },
              "& tr td": { bgcolor: "background.main", borderTopColor: `primary.${theme.opositeMode}`, borderTopRight: "3px solid gray", borderTopWidth: 3, ...cellStyles.stickyfooter },
              "& td:first-of-type": {
                ...generarBorde("primary.main_80", 2, "right"),
                ...cellStyles.stickyhead,
              },
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ m: 0 }}>
                <Box sx={{ m: 0 }}>&nbsp;</Box>
              </TableCell>
              {gruposProcesados.map((g) => (
                <GenerarCeldaHeaderG key={g.cod_grupo} grupo={g} />
              ))}
            </TableRow>
            <TableRow sx={{ "& th": { top: 25 } }}>
              <TableCell sx={{ m: 0 }}>&nbsp;</TableCell>
              {gruposProcesados.map((g) =>
                g.rubros.map((r) => <GenerarCeldaHeaderR limpiarRubro={limpiarRubro} selecciones={selecciones} seleccionesId={seleccionesId} datos={datos_} key={r.cod_rubro} rubro={r} />)
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {proveedores.map((i) => {
              return (
                <TableRow key={i.entidad_id}>
                  <GenerarCeldaProveedor limpiarProveedor={limpiarProveedor} proveedor={i} selecciones={selecciones} seleccionesId={seleccionesId} />
                  {gruposProcesados.map((g, indg) =>
                    g.rubros.map((r, ind) => (
                      <TableCell
                        className={`rubro-${ind} grupo-${indg}`}
                        key={r.cod_rubro}
                        sx={{
                          ...(!verificarSiEsCommpleto(g, r, i) && calcularCantidadRubros(g, r, i, 0) && g.cod_grupo !== 0
                            ? { ...generarBorde("primary.main_80", 2, ind === 0 ? "right" : "left") }
                            : { ...(calcularCantidadRubros(g, r, i, 1) && verificarSiEsCommpleto(g, r, i) ? { "&": { bgcolor: `${theme.colors["primary"]["main_5"]} !important` } } : {}) }),
                        }}
                      >
                        {datos_
                          .filter((d) => !d.s.porcentaje)
                          .filter((d) => d.g.cod === g.cod_grupo && d.r.cod === r.cod_rubro && d.e.cod === i.entidad_id)
                          .map(({ g, r, e, s, completo, ...d }) => (
                            <GenerarFicha seleccionarTarifa={seleccionarTarifa} key={`${g.cod}-${r.cod}-${e.cod}-${s.cod}`} item={{ ...g, ...r, ...e, ...s, nombre: d.nombre }} />
                          ))}
                      </TableCell>
                    ))
                  )}
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>&nbsp;</TableCell>
              {gruposProcesados.map((g) =>
                g.rubros.map((r) => (
                  <TableCell key={r.cod_rubro}>
                    <Button
                      onClick={() => handleCrearTarifa(r)}
                      fullWidth
                      size="small"
                      sx={{
                        borderRadius: 1.5,
                        borderWidth: 1,
                        borderColor: `primary.${theme.opositeMode}`,
                        bgcolor: `primary.${theme.opositeMode}`,
                        color: "background.main",
                        borderStyle: "solid",
                        m: 0,
                      }}
                    >
                      <Stack alignItemsm="center" direction="row" gap={1} sx={{ fontSize: 12 }}>
                        <Icon className="c-suma" sx={{ fontSize: "inherit" }} />
                        <Typography variant="span" sx={{ fontSize: "inherit", textWrap: "nowrap" }}>
                          Agregar Tarifa
                        </Typography>
                      </Stack>
                    </Button>
                  </TableCell>
                ))
              )}
            </TableRow>
          </TableFooter>
        </Table>
        <Grid container>
          {/* <pre>{JSON.stringify({ gruposProcesados }, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ grupos }, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ rubros }, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(gruposCompletos, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(datos_, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(selecciones, null, 2)}</pre> */}
        </Grid>
      </TableContainer>
      {/* <pre>{JSON.stringify({ seleccionesId }, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(grupos, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(grupos, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(cotizacionSeleccionada, null, 2)}</pre> */}
    </Box>
  );
};

GenerarCeldaHeaderG.propTypes = { grupo: PropTypes.array };
GenerarCeldaHeaderR.propTypes = {
  rubro: PropTypes.array,
  selecciones: PropTypes.array,
  seleccionesId: PropTypes.array,
  datos: PropTypes.array,
  limpiarRubro: PropTypes.func,
};
GenerarCeldaProveedor.propTypes = {
  proveedor: PropTypes.object,
  selecciones: PropTypes.array,
  seleccionesId: PropTypes.array,
  limpiarProveedor: PropTypes.func,
};
GenerarTablaCalculo.propTypes = {
  rubros: PropTypes.array,
  grupos: PropTypes.array,
  proveedores: PropTypes.array,
  datos: PropTypes.array,
  selecciones: PropTypes.array,
  gruposCompletos: PropTypes.array,
  seleccionesId: PropTypes.func,

  keyVal: PropTypes.number,
  cotizacionSeleccionada: PropTypes.object,

  handleCrearTarifa: PropTypes.func,
  seleccionarTarifa: PropTypes.func,
  limpiarRubro: PropTypes.func,
  limpiarProveedor: PropTypes.func,
};

export default GenerarTablaCalculo;
