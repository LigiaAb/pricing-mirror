import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Grid,
  Icon,
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
import BandaAlertaComponent from "../../../components/Alertas/BandaAlertaComponent";

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
const estiloCeldaInicial = { left: 0, position: "sticky", bgcolor: "background.main", zIndex: 1 };
const estiloCeldaHeader = { top: 0, position: "sticky", bgcolor: "background.main", zIndex: 1 };

const GenerarCeldaNombre = ({ theme, r, d }) => {
  return (
    <Stack direction="column" color={`primary.${theme.opositeMode}`} mt={1} width="100%">
      <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {r.nombre}
      </Typography>
      <Typography variant="body" sx={{ textAlign: "right", fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {d?.entidad_nombre}
      </Typography>
    </Stack>
  );
};
const GenerarCeldaVaciaNombre = ({ r }) => {
  return (
    <Stack direction="column" color="error.main" mt={1} width="100%">
      <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {r.nombre}
      </Typography>
      <Typography variant="body" sx={{ textAlign: "right", fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        No se selecciono ninguna tarifa para el rubro
      </Typography>
    </Stack>
  );
};
const GenerarCeldaValor = ({ theme, d, total }) => {
  return (
    <Grid container width="100%" direction="column" justifyContent="space-between">
      <Grid key={d.cod_moneda_venta} container color={`black.${theme.opositeMode}`} width="100%" direction="row" justifyContent="space-between">
        <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16 }}>
          {d.moneda_venta?.simbolo_moneda}
        </Typography>
        <Typography color={`${total ? "black" : "primary"}.${theme.opositeMode}`} variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }}>
          {d.venta.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </Typography>
      </Grid>
    </Grid>
  );
};
const GenerarCeldaVaciaValor = ({ theme }) => {
  return (
    <Grid container width="100%" direction="row" justifyContent="space-between">
      <Typography variant="body" fontWeight="600" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16 }} color="error.main">
        -
      </Typography>
      <Typography variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }} color="error.main">
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

const GenerarTablaTotalCalculado = (props) => {
  const { gruposCompletos = [], grupos = [], rubros = [], proveedores = [], datos = [], seleccionarTarifa = () => {}, agregarCalculoALista = () => {}, keyVal = 0, permiteAgrupacion = false } = props;

  const screenSize = useSelector((state) => state.screen);
  const theme = useSelector((state) => state.theme);
  const [gruposProcesados, setGruposProcesados] = useState({});
  const [backgroundColorByClass, setBackgroundColorByClass] = useState({});

  const tableFormRef = useRef(null);

  const stickycell = useMemo(() => {
    return !["sm", "xs"].includes(screenSize.name) ? { position: "sticky", left: 0, zIndex: 2 } : {};
  }, [screenSize]);

  const containerMaxHeight = useMemo(() => {
    if (!tableFormRef.current) return null;

    return tableFormRef.current.parentElement.clientHeight;
  }, [tableFormRef]);

  const { filtroProveedor, onInputChange } = useForm({
    filtroProveedor: "",
  });

  // const gruposGenerados = useMemo(() => {}, []);

  useEffect(() => {
    setGruposProcesados(() => {
      const obj = {};
      grupos.forEach((g) => {
        rubros
          .filter((r) => g.rubros.some((gr) => gr.cod_rubro === r.cod_rubro))
          .forEach((i, ind) => {
            obj[`group_${i.cod_rubro}`] = {
              value: g?.cod_grupo !== 0 ? g?.cod_grupo : i.cod_rubro,
              rubro: i.cod_rubro,
              name: `group_${i.cod_rubro}`,
              grupo: g?.cod_grupo !== 0 ? g?.grupo_nombre : i.nombre,
              editable: true,
            };
          });
      });
      return obj;
    });
  }, [grupos, rubros]);

  const gruposGenerados = useMemo(() => {
    let datosP = [];
    grupos
      .reduce((list, acc, ind) => {
        if (acc.cod_grupo == 0) {
          list.set(acc.cod_grupo, acc);
        } else {
          if (!list.has(acc.cod_grupo)) list.set(acc.cod_grupo, { ...acc, rubros: [] });
          const d = datos.filter((d) => d.cod_grupo === acc.cod_grupo);

          let mismma_entidad = d.every((d_) => d_.completo);

          if (mismma_entidad)
            list.get(acc.cod_grupo).rubros.push({
              cod_rubro: acc.cod_grupo,
              nombre: acc.grupo_nombre,
              obligatorio: true,
              cod_estado: 1,
              completo: false,
            });
          else list.get(acc.cod_grupo).rubros = acc.rubros;

          // list.push(acc);
        }
        return list;
      }, new Map())
      .forEach((val, key) => {
        datosP.push(val);
      });
    return datosP;
  }, [grupos, datos]);
  const datosGenerados = useMemo(() => {
    return datos;
  }, [datos]);

  useEffect(() => {
    setBackgroundColorByClass(
      gruposGenerados.reduce((obj, acc) => {
        acc.rubros.map((r) => (obj[`row-${r.cod_rubro}`] = "accent.main_10"));
        return obj;
      }, {}),
    );
  }, [gruposGenerados]);

  return (
    <Box>
      <Box sx={{ p: 0.5, borderWidth: 1, borderColor: `primary.${theme.opositeMode}`, borderStyle: "solid", borderRadius: 1, mt: 1 }}>
        <TableContainer>
          <Table size="small" sx={{}}>
            <TableBody>
              {gruposGenerados.map((g) =>
                g.rubros.map((r, indR) => {
                  const d = datosGenerados.find((d) => d.cod_rubro === r.cod_rubro);

                  return (
                    <>
                      <TableRow class={`row-${r.cod_rubro}`} key={`${g.cod_grupo}-${r.cod_rubro}`}>
                        <TableCell sx={{ bgcolor: `row-${r.cod_rubro}` }} rowSpan={d ? d?.valor.length + 1 : 2}>
                          {d ? <GenerarCeldaNombre d={d} r={r} theme={theme} /> : <GenerarCeldaVaciaNombre d={d} r={r} theme={theme} />}
                        </TableCell>
                      </TableRow>

                      {d ? (
                        d.valor.map((v) => (
                          <TableRow class={`row-${r.cod_rubro}`} key={`${g.cod_grupo}-${r.cod_rubro}-${v.key}`}>
                            <TableCell sx={{ bgcolor: `row-${r.cod_rubro}` }}>
                              <GenerarCeldaValor d={v} r={r} theme={theme} />
                            </TableCell>
                            <TableCell sx={{ bgcolor: `row-${r.cod_rubro}` }}>
                              <GenerarCeldaDetalle d={v} r={r} theme={theme} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow class={`row-${r.cod_rubro}`} key={`${g.cod_grupo}-${r.cod_rubro}-${0}`}>
                          <TableCell sx={{ bgcolor: `row-${r.cod_rubro}` }}>
                            <GenerarCeldaVaciaValor d={d} r={r} theme={theme} />
                          </TableCell>
                          <TableCell sx={{ bgcolor: `row-${r.cod_rubro}` }}>
                            <GenerarCeldaVaciaDetalle d={d} r={r} theme={theme} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                }),
              )}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ ...generarBorde("primary.main", 4, "top") }}>
                <TableCell rowSpan={2}>
                  <GenerarCeldaNombre theme={theme} d={{ rubro_nombre: "", entidad_nombre: "" }} r={{ nombre: "Total" }} />
                </TableCell>
                <TableCell>
                  <GenerarCeldaValor
                    theme={theme}
                    d={{
                      moneda_venta: { cod_moneda: 1, nom_moneda: "Quetzales", cod_pais: 1002, simbolo_moneda: "GTQ", cod_serv_banco: "0", es_operativa: true },
                      venta: datosGenerados.reduce((tot, { valor }) => {
                        valor.forEach((v) => {
                          if (v.cod_moneda_venta === 1) tot += v.venta;
                        });

                        return tot;
                      }, 0),
                    }}
                    total
                  />
                </TableCell>
                <TableCell>&nbsp;</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <GenerarCeldaValor
                    theme={theme}
                    d={{
                      moneda_venta: { cod_moneda: 2, nom_moneda: "Dólares de EE.UU.", cod_pais: 1001, simbolo_moneda: "USD", cod_serv_banco: "2", es_operativa: true },
                      venta: datosGenerados.reduce((tot, { valor }) => {
                        valor.forEach((v) => {
                          if (v.cod_moneda_venta === 2) tot += v.venta;
                        });

                        return tot;
                      }, 0),
                    }}
                    total
                  />
                </TableCell>
                <TableCell>&nbsp;</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        <Grid container>
          {/* <pre>{JSON.stringify(grupos, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ gruposGenerados }, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ datosGenerados }, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ datos }, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(gruposCompletos, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(theme, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ gruposProcesados }, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ gruposProcesados, rubrosPostAgrupacion }, null, 2)}</pre> */}
        </Grid>
      </Box>
    </Box>
  );
};

GenerarCeldaNombre.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaNombre.propTypes = { r: PropTypes.object };
GenerarCeldaValor.propTypes = { theme: PropTypes.object, d: PropTypes.object, total: PropTypes.bool };
GenerarCeldaVaciaValor.propTypes = { theme: PropTypes.object };
GenerarCeldaDetalle.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaDetalle.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarTablaTotalCalculado.propTypes = {
  grupos: PropTypes.array,
  gruposCompletos: PropTypes.array,
  rubros: PropTypes.array,
  proveedores: PropTypes.array,
  datos: PropTypes.array,
  selecciones: PropTypes.array,

  keyVal: PropTypes.number,

  permiteAgrupacion: PropTypes.bool,

  seleccionarTarifa: PropTypes.func,
  agregarCalculoALista: PropTypes.func,
};

export default GenerarTablaTotalCalculado;
