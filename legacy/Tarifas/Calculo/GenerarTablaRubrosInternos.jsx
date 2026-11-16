import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Checkbox, Divider, Grid, Icon, IconButton, List, ListItem, ListItemText, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import TooltipComponent from "../../../components/TooltipComponent/TooltipComponent";
import { useFetchMonedas } from "../../../hooks/Fetch/useFetchCatalog";
import { useSelector } from "react-redux";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../constants/clasifacionesTarifas";
import SelectComponent from "../../../components/Formulario/SelectComponent";
import { ControlledCarruselComponent } from "../../../components/CarruselComponent/ControlledCarruselComponent";

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
        {d?.entidad_nombre}
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
    <Grid container width="100%" direction="row" justifyContent="space-between">
      <Grid key={d.moneda_venta} container color={`black.${theme?.opositeMode}`} width="100%" direction="row" justifyContent="space-between" wrap="nowrap">
        <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16, mr: 1 }}>
          {d.moneda_venta?.simbolo_moneda}
        </Typography>
        <Typography color={`${total ? "black" : "primary"}.${theme?.opositeMode}`} variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }}>
          {d.venta.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </Typography>
      </Grid>
    </Grid>
  );
};
const GenerarCeldaCosto = ({ theme, d, total }) => {
  return (
    <Grid container width="100%" direction="row" justifyContent="space-between">
      <Grid key={d.moneda_venta} container color={`black.${theme?.opositeMode}`} width="100%" direction="row" justifyContent="space-between" wrap="nowrap">
        <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16, mr: 1 }}>
          {d.moneda_venta?.simbolo_moneda}
        </Typography>
        <Typography color={`${total ? "black" : "primary"}.${theme?.opositeMode}`} variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }}>
          {d.venta.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
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

const GenerarTablaRubrosInternos = (props) => {
  const { datos = [], selecciones = [], seleccionesId = [], seleccionesEliminadas = [], rubros = [], grupos = [], seleccionarTarifa = () => { } } = props;

  const monedas = useFetchMonedas({ ES_OPERATIVA: true });
  const [checked, setChecked] = useState({});
  const theme = useSelector((state) => state.theme);
  const [index, setIndex] = useState(0);

  const gruposProcesados = useMemo(() => {
    const listaGeneradoa = new Map(),
      lista = [];

    [{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(grupos || [])]?.forEach((i) =>
      listaGeneradoa.set(i.cod_grupo_rubro, { grupo_nombre: i.nombre || " ", cod_grupo: i.cod_grupo_rubro, rubros: [] })
    );

    if (Array.isArray(datos))
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

  // const [listaRubrosSeleccionados, setListaRubrosSeleccionados] = useState([]);

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
      return (
        listaRubrosSeleccionados.some((t) => t.cod_servicio === item.cod_servicio) ||
        selecciones.some((t) => t.cod_servicio === item.cod_servicio) ||
        seleccionesId.some((t) => t.cod_servicio === item.cod_servicio)
      );
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
    };

    gruposProcesados.forEach(({ grupo_nombre, cod_grupo, ...gp }) => {
      gp.rubros.forEach(({ cod_rubro, nombre_rubro, ...gpr }) => {
        datos
          .map((i) => ({
            ...i,
            servicios: i.servicios.map((s) => ({
              ...s,
              servicio: REL_TIPOS_CLASIFICACION_TARIFAS.find((r) => r.value === s.servicio_clasificacion && s.cod_tipo_transporte === r.cod_tipo_padre)?.label || "",
            })),
          }))
          ?.filter((i) => i.servicios.some((s) => s.servicio === "DUE AGENT"))
          ?.filter((d) => d.cod_rubro === cod_rubro)
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

    const listaRubrosSeleccionados = data.filter((d) => selecciones.some((s) => s.cod_servicio === d.cod_servicio) || seleccionesId.some((s) => s.cod_servicio === d.cod_servicio));

    return (
      data
        // .filter((obj) => obj.s.servicio_interno)
        .map((obj) => ({
          checked: !!checked[obj.r.cod_rubro],
          ...obj,
          s: {
            ...obj.s,
            seleccionable: esSeleccionable({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
            seleccionado: estaSeleccionado({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
          },
          cod_servicio: obj.s?.cod_servicio,
          servicio: obj.s?.nombre,
          nombre: `${obj.g.grupo_nombre}`.trim() || `${obj.r.nombre_rubro}`.trim(),
          label: (
            <Grid container direction="row" wrap="nowrap" width="100%" columnSpacing={1}>
              <Grid size="auto">
                <Typography
                  borderRadius={10}
                  p={0}
                  m={0}
                  className={listaRubrosSeleccionados?.some((l) => l.cod_servicio === obj.s?.cod_servicio) && "c-circulo-cheque"}
                  // color={"white"}
                  color={listaRubrosSeleccionados?.some((l) => l.cod_servicio === obj.s?.cod_servicio) ? "success.main" : "white"}
                />
              </Grid>
              <Grid color="primary.main" fontWeight="bold">
                {obj.s?.nombre}
              </Grid>
              <Grid size="grow"></Grid>
              <Grid color="primary.main">{obj.e.entidad_nombre}</Grid>
              {/* <Grid>
                        <GenerarCeldaValor theme={theme} d={s.metodo} total />
                      </Grid> */}
              <Grid>
                <GenerarCeldaCosto theme={theme} d={obj.s.metodo} total />
              </Grid>
            </Grid>
          ),
        }))
    );
  }, [datos, gruposProcesados, selecciones, monedas, seleccionesId, checked]);

  const listaRubrosSeleccionados = useMemo(() => {
    if (!datos_.length) return [];

    const seleccionados = new Set([...seleccionesId.map((s) => s.cod_servicio), ...selecciones.map((s) => s.cod_servicio)]);

    const eliminados = new Set(seleccionesEliminadas.map((e) => e.cod_servicio));

    return datos_.filter((d) => seleccionados.has(d.cod_servicio) && !eliminados.has(d.cod_servicio));
  }, [datos_, seleccionesId, selecciones, seleccionesEliminadas]);

  // useEffect(() => {
  //   if (!datos_.length) return;
  //   if (!seleccionesId.length) return;

  //   const seleccionados = datos_.filter((d) => seleccionesId.some((s) => s.cod_servicio === d.cod_servicio));

  //   setListaRubrosSeleccionados(seleccionados);
  // }, [datos_, seleccionesId]);
  const onSelect = useCallback(() => {
    const elemento = datos_[index];

    const existe = listaRubrosSeleccionados.some((l) => l.cod_servicio === elemento.cod_servicio);

    const vieneDeBD = seleccionesId.some((s) => s.cod_servicio === elemento.cod_servicio);

    const elementoFormateado = { ...elemento, ...elemento.g, ...elemento.r, ...elemento.e, ...elemento.s, nombre: elemento.nombre, label: undefined };

    seleccionarTarifa(elementoFormateado, { vieneDeBD });
  }, [datos_, index, listaRubrosSeleccionados, seleccionesId, seleccionarTarifa]);

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
              DUE AGENT
            </Typography>
          </Divider>
          <Typography color={"text"} variant={"overline"}>
            Seleccione los servicios de{" "}
            <Typography component="b" variant="b" color="primary">
              DUE AGENT
            </Typography>{" "}
            para agregarlos a la cotización
          </Typography>
        </Box>

        <Grid container size={12} pt={2}>
          <Grid size={"grow"}>
            <SelectComponent
              input={{
                tipo: "select",
                id: "servicio",
                options: datos_,
                labelOption: "servicio",
                valueOption: "cod_servicio",
                renderOption: "label",
                val: datos_[index],
                multiple: false,
              }}
              onInput={(val) => {
                // setProveedorSeleccionado(val);
                const ind = datos_.findIndex((p) => p.cod_servicio === val?.cod_servicio);
                setIndex(ind >= 0 ? ind : 0);
                // limpiarTarifasSeleccionadas();
              }}
            />
          </Grid>
          <Grid size={"auto"}>
            <Button onClick={onSelect}>{listaRubrosSeleccionados?.some((l) => l.cod_servicio === datos_[index].cod_servicio) ? "Quitar de Calculo" : "Agregar a Calculo"}</Button>
          </Grid>
        </Grid>
        {proveedores
          .filter((p) => datos_.filter((d) => d.e.cod === p.entidad_id).length > 0)
          .map((i) => {
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
                      {listaRubrosSeleccionados
                        .filter((d) => !d.s.porcentaje)
                        .map(({ g, r, e, s, completo, ...d }) => {
                          const item = { ...g, ...r, ...e, ...s, ...s.metodo, completo, d, label: undefined };
                          const elementoFormateado = { ...item, ...item.g, ...item.r, ...item.e, ...item.s, nombre: item.nombre, label: undefined, d: { ...item.d, label: undefined } };
                          console.log("elementoFormateado", elementoFormateado);
                          const vieneDeBD = seleccionesId.some((s) => s.cod_servicio === elementoFormateado.cod_servicio);
                          if (item.cod_moneda_venta === 2) totales.d.venta += Number(item.venta || 0);
                          if (item.cod_moneda_venta === 1) totales.q.venta += Number(item.venta || 0);

                          return (
                            <TableRow key={`${r.cod_rubro}_1`} hover>
                              <TableCell width="1%" p={0} m={0} sx={{ "&.MuiTableCell-root": { p: 0, justifyContent: "center", alignContent: "center", textAlign: "center" } }}>
                                <IconButton
                                  sx={{ bgcolor: "error.main", borderRadius: 100, p: 0.5, "&:hover": { bgcolor: "error.200" } }}
                                  onClick={() => seleccionarTarifa(elementoFormateado, { vieneDeBD })}
                                >
                                  <Icon className="c-x1" color="background" sx={{ fontSize: 10 }} />
                                </IconButton>
                              </TableCell>

                              {/* <TableCell><pre>{JSON.stringify(item, null, 2)}</pre></TableCell> */}
                              <TableCell width="50%">{item.cod_servicio === 0 ? <GenerarCeldaVaciaNombre d={item} /> : <GenerarCeldaNombre theme={theme} d={item} />}</TableCell>
                              <TableCell>
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
                              <TableCell width="2%">{item.detalles.length > 0 ? <GenerarCeldaDetalle theme={theme} d={item} /> : <GenerarCeldaVaciaDetalle theme={theme} />}</TableCell>
                            </TableRow>
                          );
                        })}
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
                            {totales.d.venta > 0 && <GenerarCeldaCosto theme={theme} d={totales.d} total />}
                            {totales.q.venta > 0 && <GenerarCeldaCosto theme={theme} d={totales.q} total />}
                          </Grid>
                        </TableCell>
                        <TableCell width="1%"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            );
          })}
        <Grid container direction="row">
          {/* <pre>{JSON.stringify(seleccionesId, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(selecciones, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(seleccionesEliminadas, null, 2)}</pre> */}
        </Grid>
      </Grid>
    </>
  );
};

GenerarCeldaNombre.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
// GenerarCeldaRubro.propTypes = { theme: PropTypes.object, d: PropTypes.object };
// GenerarCeldaProceedor.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaValor.propTypes = { theme: PropTypes.object, d: PropTypes.object, total: PropTypes.bool };
GenerarCeldaCosto.propTypes = { theme: PropTypes.object, d: PropTypes.object, total: PropTypes.bool };

GenerarCeldaNombre.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarCeldaPorcentajeNombre.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaNombre.propTypes = { d: PropTypes.object };
GenerarCeldaErrorDuplicidiad.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaValor.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaDetalle.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaAlertaVacio.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaDetalle.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };

GenerarTablaRubrosInternos.propTypes = {
  seleccionarTarifa: PropTypes.func,

  datos: PropTypes.array,
  selecciones: PropTypes.array,
  seleccionesId: PropTypes.array,
  seleccionesEliminadas: PropTypes.array,
  grupos: PropTypes.array,
  rubros: PropTypes.array,
};

export default GenerarTablaRubrosInternos;
