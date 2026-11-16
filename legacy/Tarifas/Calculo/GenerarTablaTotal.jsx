import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Divider, Grid, List, ListItem, ListItemText, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from "@mui/material";
import ListaIncoterms from "../../Incoterms/ListaIncoterms";
import { useFetchMonedas } from "../../../hooks/Fetch/useFetchCatalog";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../constants/clasifacionesTarifas";
import { useSelector } from "react-redux";

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
      <Grid key={d.cod_moneda_venta} container color={`black.${theme?.opositeMode}`} width="100%" direction="row" justifyContent="space-between" wrap="nowrap">
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

const GenerarTablaTotal = (props) => {
  const {
    gruposCompletos = [],
    // monedas = [],
    grupos = [],
    rubros = [],
    // proveedores = [],
    datos = [],
    selecciones = [],
    seleccionesId = [],
    seleccionarTarifa = () => {},
    agregarCalculoALista = () => {},
    keyVal = 0,
    permiteAgrupacion = false,
    datosPorcentajes = [],

    guardarTarifas, // = () => {},
  } = props;

  const monedas = useFetchMonedas({ ES_OPERATIVA: true });
  const theme = useSelector((state) => state.theme);

  const [gruposNuevos, setGruposNuevos] = useState({});

  const gruposProcesados = grupos.filter((i) => i.cod_grupo_rubro === 0 || i.rubros.length > 0);

  const elementosFormateados = useMemo(() => {
    return datosPorcentajes.map(({ s, g, r, e }) => ({ ...g, ...r, ...e, ...s })).filter((i) => !i.porcentaje && seleccionesId.some((s) => s.cod_servicio === i.cod_servicio));
  }, [datosPorcentajes, seleccionesId, datos]);

  useEffect(() => {
    setGruposNuevos({});
  }, [seleccionesId]);

  const datosPorcentajeProcesados = useMemo(() => {
    const lista =
      datos.length == 0
        ? []
        : (datosPorcentajes || [])
            .filter((i) => datos[0]?.entidad_id === i.entidad_id)
            ?.filter((i) => i.s.porcentaje)
            .reduce((acc, d) => {
              const { r } = d;
              const gp = { ...r, ...d.s, ...d.e, ...d, nombre: `${d.g.grupo_nombre}`.trim() || `${d.r.nombre_rubro}`.trim() };
              const monedaVenta = monedas.data?.find((m) => m.cod_moneda === gp.porcentaje.cod_moneda_venta);
              const monedaCosto = monedas.data?.find((m) => m.cod_moneda === gp.porcentaje.cod_moneda_costo);

              const valorVentaTotal = datos.reduce((prev, d) => (d?.servicio_clasificacion === gp?.porcentaje?.cod_rubro ? prev + d.metodo?.venta : prev), 0);
              const valorCostoTotal = datos.reduce((prev, d) => (d?.servicio_clasificacion === gp?.porcentaje?.cod_rubro ? prev + d.metodo?.costo : prev), 0);

              const porcentajeVentaCalculado = valorVentaTotal * (gp?.porcentaje.porcentaje_venta / 100);
              const porcentajeCostoCalculado = valorCostoTotal * (gp?.porcentaje.porcentaje_costo / 100);

              const porcentajeCosto = gp.porcentaje.porcentaje_costo;
              const porcentajeVenta = gp.porcentaje.porcentaje_venta;

              const clasificacion = REL_TIPOS_CLASIFICACION_TARIFAS.find((i) => i.value === gp.servicio_clasificacion && gp.cod_tipo_transporte === i.cod_tipo_padre)?.label || "";

              const tieneD = gp.porcentaje.cod_moneda_costo === 2 || gp.porcentaje.cod_moneda_venta === 2;
              const tieneQ = gp.porcentaje.cod_moneda_costo === 1 || gp.porcentaje.cod_moneda_venta === 1;

              const detalles = [
                {
                  tarifadetalle_id: `${gp.cod_servicio}_d_01`,
                  tarifadetalle_descripcion: clasificacion,
                  tarifadetalle_valor: null,
                  tipo_id: `${gp.cod_servicio}_d_02`,
                  tipo_desc: "BASADO EN CLASIFICACIÓN DE CÁLCULO ",
                },
                {
                  tarifadetalle_id: `${gp.cod_servicio}_d_01`,
                  tarifadetalle_descripcion: `${porcentajeVenta}%`,
                  tarifadetalle_valor: null,
                  tipo_id: `${gp.cod_servicio}_d_02`,
                  tipo_desc: "PORCENTAJE APLICADO",
                },
                ...(gp.detalle || []),
              ];

              const moneda = {
                venta: porcentajeVentaCalculado,
                costo: porcentajeCostoCalculado,
                cod_moneda_costo: gp.porcentaje.cod_moneda_costo,
                cod_moneda_venta: gp.porcentaje.cod_moneda_venta,
                moneda_venta: monedaVenta,
                moneda_costo: monedaCosto,
              };

              const datosGrupo = {
                codigo: gruposNuevos[gp.cod_servicio] || null,
                grupo: "",
                nombre: gp.nombre,
                cod_proveedor: gp.entidad_id,
                nombre_proveedor: gp.entidad_nombre,
                cod_rubro: r.cod_rubro,
                cod_servicio: gp.cod_servicio,
                rubro: r.nombre_rubro,
                d: tieneD ? moneda : undefined,
                q: tieneQ ? moneda : undefined,
                detalles: [...detalles, ...gp.porcentaje.detalles],
                clasificacion: gp.servicio_clasificacion || null,
                cod_tipo_facturacion: null,
                cod_tipo_calculo: gp.cod_tipo_calculo,
                cod_metodo: gp.porcentaje.cod_metodo,
                rate_costo: gp.porcentaje.rate_costo || null,
                rate_venta: gp.porcentaje.rate_venta || null,
              };

              acc.push(datosGrupo);

              return acc;
            }, []);
    return lista;
  }, [datos, datosPorcentajes, monedas.data, gruposNuevos]);

  const itemsSeleccionados = useMemo(
    () =>
      datosPorcentajes
        .map((item) => {
          const nombre_rubro = item.s.porcentaje ? rubros.find((r) => r.cod_rubro === item.s.porcentaje.cod_rubro)?.nombre_rubro || "" : "";
          const porcentajeVenta = item.s.porcentaje ? item.s.porcentaje.porcentaje_venta : 0;

          return item.s.porcentaje
            ? {
                ...item,
                s: {
                  ...item.s,
                  porcentaje: {
                    nombre_rubro: rubros.find((r) => r.cod_rubro === item.s.porcentaje.cod_rubro)?.nombre_rubro || "",
                    ...item.s.porcentaje,
                    detalles: [
                      ...item.s.porcentaje.detalles,
                      {
                        tarifadetalle_id: `${item.s.cod_servicio}_d_01`,
                        tarifadetalle_descripcion: `${porcentajeVenta}%`,
                        tarifadetalle_valor: null,
                        tipo_id: `${item.s.cod_servicio}_d_02`,
                        tipo_desc: `PORCENTAJE APLICADO SOBRE ${nombre_rubro}`,
                      },
                    ],
                  },
                },
              }
            : item;
        })
        .filter(
          (i) =>
            datosPorcentajeProcesados.some((p) => p.cod_servicio === i.s.cod_servicio) || selecciones.some((s) => s.cod_servicio === i.s.cod) || seleccionesId.some((s) => s.cod_servicio === i.s.cod),
        ),
    [datosPorcentajes, rubros, datosPorcentajeProcesados, selecciones, seleccionesId],
  );

  const darFormatoAElemento = useCallback(
    (elemento, base) => {
      const tieneD = elemento.metodo?.cod_moneda_costo === 2 || elemento.metodo?.cod_moneda_venta === 2;
      const tieneQ = elemento.metodo?.cod_moneda_costo === 1 || elemento.metodo?.cod_moneda_venta === 1;

      const moneda = {
        venta: elemento.metodo?.venta,
        costo: elemento.metodo?.costo,
        cod_moneda_costo: elemento.metodo?.cod_moneda_costo,
        cod_moneda_venta: elemento.metodo?.cod_moneda_venta,
        moneda_venta: elemento.metodo?.moneda_venta,
        moneda_costo: elemento.metodo?.moneda_costo,
      };

      return {
        ...base,
        cod_detallerubro: seleccionesId.find((s) => s.cod_rubro === elemento.cod_rubro)?.cod_detallerubro ?? null,
        codigo: gruposNuevos[elemento.cod_servicio] || null,
        nombre: base.nombre === "" ? elemento.nombre_rubro : base.nombre,
        cod_proveedor: elemento.entidad_id,
        nombre_proveedor: elemento.entidad_nombre,
        cod_rubro: elemento.cod_rubro,
        cod_servicio: elemento.cod_servicio,
        rubro: elemento.nombre_rubro,
        q: tieneQ ? moneda : undefined,
        d: tieneD ? moneda : undefined,
        detalles: elemento.metodo?.detalles || [],
        obligatorio: elemento.obligatorio,
        clasificacion: elemento.servicio_clasificacion || null,
        cod_tipo_facturacion: null,
        cod_tipo_calculo: elemento.cod_tipo_calculo,
        cod_metodo: elemento.metodo.cod_metodo,
        rate_costo: elemento.metodo.rate_costo || null,
        rate_venta: elemento.metodo.rate_venta || null,
      };
    },
    [gruposNuevos, seleccionesId],
  );

  const datosProcesados = useMemo(() => {
    return (gruposProcesados || []).reduce((acc, gp) => {
      const datosGrupo = {
        codigo: null,
        grupo: gp.cod_grupo_rubro,
        nombre: gp.nombre,
        cod_proveedor: 0,
        nombre_proveedor: "",
        cod_rubro: 0,
        cod_servicio: 0,
        rubro: "",
        q: { venta: 0, costo: 0, cod_moneda_costo: 0, cod_moneda_venta: 0, moneda_venta: null, moneda_costo: null },
        d: { venta: 0, costo: 0, cod_moneda_costo: 0, cod_moneda_venta: 0, moneda_venta: null, moneda_costo: null },
        detalles: [],
        venta_grupo: 0,
        costo_grupo: 0,
      };

      const datosDeGrupo = [...elementosFormateados, ...datos]
        .reduce((acc, d) => {
          if (acc.some((i) => i.cod_servicio === d.cod_servicio)) return acc;
          acc.push(d);
          return acc;
        }, [])
        .filter((d) => d.cod_grupo === gp.cod_grupo_rubro);
      datosDeGrupo.forEach((d) => acc.push(darFormatoAElemento(d, datosGrupo)));

      return acc;
    }, []);
  }, [darFormatoAElemento, datos, elementosFormateados, gruposProcesados]);

  const lineas = useMemo(() => {
    const info = datosProcesados.reduce((acc, gp) => {
      // if (gp.grupo === 0) acc.push(gp);
      // else acc.push(gp);
      // return acc;

      if (`${gp.grupo}` in acc) {
        if (gp.grupo === 0) {
          acc[gp.grupo] = { ...acc[gp.grupo], [gp.cod_rubro]: gp };
        } else {
          const valorQ = acc[gp.grupo][0].q?.venta || 0;
          const costoQ = acc[gp.grupo][0].q?.costo || 0;
          const valorD = acc[gp.grupo][0].d?.venta || 0;
          const costoD = acc[gp.grupo][0].d?.costo || 0;
          acc[gp.grupo][0] = {
            ...acc[gp.grupo][0],
            q: {
              ...gp.q,
              ...acc[gp.grupo][0].q,
              venta: valorQ + (gp.q?.venta || 0),
              costo: costoQ + (gp.q?.costo || 0),
            },
            d: {
              ...gp.d,
              ...acc[gp.grupo][0].d,
              venta: valorD + (gp.d?.venta || 0),
              costo: costoD + (gp.d?.costo || 0),
            },
          };
        }
      } else {
        if (gp.grupo === 0) acc[gp.grupo] = { [gp.cod_rubro]: gp };
        else {
          acc[gp.grupo] = { 0: gp };
        }
      }
      return acc;
    }, {});
    return Object.values(info)
      .map((i) => Object.values(i))
      .flat();
  }, [datosProcesados]);

  const lineasProcesadas = useMemo(() => [...lineas, ...datosPorcentajeProcesados], [lineas, datosPorcentajeProcesados]);

  const handleAddServicioAGrupo = (servicio, valor) => {
    setGruposNuevos((gn) => {
      const nuevoValor = Number(valor);
      const codServicio = servicio.cod_servicio;

      // Si el valor es 0 o vacío, eliminar el elemento si existe
      if (!nuevoValor || nuevoValor === 0) {
        const nuevoEstado = { ...gn };
        delete nuevoEstado[codServicio];
        return nuevoEstado;
      }

      // Buscar si ya existe algún elemento con el mismo valor
      const elementosConMismoValor = Object.entries(gn).filter(([key, item]) => item.val === nuevoValor && key !== codServicio.toString());

      // Determinar si es el primer elemento con este valor
      const esPrimerElemento = elementosConMismoValor.length === 0;

      // Buscar label existente del grupo (tomar el primero que encuentre)
      const labelExistente = elementosConMismoValor.length > 0 ? elementosConMismoValor[0][1].lab : gn[codServicio]?.lab || "";

      // Si hay elementos con el mismo valor, actualizar sus labels también
      const nuevoEstado = { ...gn };

      // Actualizar el servicio actual
      nuevoEstado[codServicio] = {
        val: nuevoValor,
        lab: labelExistente,
        editable: esPrimerElemento,
      };

      // Actualizar todos los servicios con el mismo valor
      if (elementosConMismoValor.length > 0) {
        elementosConMismoValor.forEach(([key, item]) => {
          nuevoEstado[key] = {
            ...item,
            lab: labelExistente, // Sincronizar el label
            editable: false, // Ninguno de los otros es editable
          };
        });

        // Marcar el primer elemento del grupo como editable
        const primerElementoKey = elementosConMismoValor[0][0];
        nuevoEstado[primerElementoKey] = {
          ...nuevoEstado[primerElementoKey],
          editable: true,
        };
      }

      return nuevoEstado;
    });
  };

  // Función para actualizar el label y propagarlo a todo el grupo
  const handleChangeLabel = (servicio, nuevoLabel) => {
    setGruposNuevos((gn) => {
      if (!gn[servicio.cod_servicio]) return gn;

      const valorGrupo = gn[servicio.cod_servicio].val;
      const nuevoEstado = { ...gn };

      // Actualizar todos los servicios que tengan el mismo valor
      Object.keys(nuevoEstado).forEach((key) => {
        if (nuevoEstado[key].val === valorGrupo) {
          nuevoEstado[key] = {
            ...nuevoEstado[key],
            lab: nuevoLabel,
          };
        }
      });

      return nuevoEstado;
    });
  };

  const totales = useMemo(() => {
    return {
      d: {
        cod_moneda_venta: 2,
        moneda_venta: lineas.map((i) => i.d).filter((i) => i)[0]?.moneda_venta,
        venta: [...lineas.map((i) => i.d), ...datosPorcentajeProcesados.map((i) => i.d)].filter((i) => i).reduce((tot, d) => (tot += Number(d.venta || 0)), 0),
      },
      q: {
        cod_moneda_venta: 1,
        moneda_venta: lineas.map((i) => i.q).filter((i) => i)[0]?.moneda_venta,
        venta: [...lineas.map((i) => i.q), ...datosPorcentajeProcesados.map((i) => i.q)].filter((i) => i).reduce((tot, q) => (tot += Number(q.venta || 0)), 0),
      },
    };
  }, [lineas, datosPorcentajeProcesados]);

  // establecer grupos por defecto basaado en seleccionesid
  useEffect(() => {
    const listaNombres = seleccionesId
      .map((i) => i.gruporubro_nombre)
      .reduce((acc, val, ind) => {
        if (!acc.has(val)) acc.set(val, ind + 1);
        return acc;
      }, new Map());
    seleccionesId.forEach((seleccion, ind) => {
      const item = elementosFormateados.find((i) => i.cod_servicio === seleccion.cod_servicio);

      if (!item) return;
      const grupo = grupos.find((g) => g.rubros.some((r) => r.cod_rubro === item.cod_rubro));

      if (grupo) {
        if (seleccion.gruporubro_nombre !== grupo.nombre) {
          handleAddServicioAGrupo(item, listaNombres.get(seleccion.gruporubro_nombre));
          handleChangeLabel(item, seleccion.gruporubro_nombre);
        }
      } else if (seleccion.gruporubro_nombre !== item.nombre_rubro) {
        handleAddServicioAGrupo(item, listaNombres.get(seleccion.gruporubro_nombre));
        handleChangeLabel(item, seleccion.gruporubro_nombre);
        handleChangeLabel(item, seleccion.gruporubro_nombre);
      }
    });
  }, [grupos, elementosFormateados, seleccionesId]);

  const onTotalSubmit = useCallback(() => {
    guardarTarifas &&
      guardarTarifas(
        [...datosProcesados, ...datosPorcentajeProcesados]
          .map((elemento) => ({
            ...elemento,
            // detallerubro_json: JSON.stringify(itemsSeleccionados.find((i) => i.r.cod_rubro === elemento.cod_rubro && i.s.cod_servicio === elemento.cod_servicio)),
          }))
          .map((i) => {
            const nombreGrupo = i.codigo?.lab?.trim();

            if (!nombreGrupo) {
              return { ...i, codigo: null };
            }

            return i;
          })
          .map((i, ind, array) => {
            const venta_total = i.codigo
              ? array.filter((d) => d.codigo?.val === i.codigo.val).reduce((acc, d) => acc + ((d.d?.venta ? d.d?.venta : d.q?.venta) || 0), 0)
              : i.d?.venta
                ? i.d?.venta
                : i.q?.venta;
            const costo_total = i.codigo
              ? array.filter((d) => d.codigo?.val === i.codigo.val).reduce((acc, d) => acc + ((d.d?.costo ? d.d?.costo : d.q?.costo) || 0), 0)
              : i.d?.costo
                ? i.d?.costo
                : i.q?.costo;

            return { ...i, venta_grupo: venta_total, costo_grupo: costo_total };
          }),
        JSON.stringify(itemsSeleccionados),
        totales,
      );
  }, [datosPorcentajeProcesados, datosProcesados, guardarTarifas, itemsSeleccionados, totales]);

  return (
    <Grid
      container
      sx={{ p: 0.5, pt: 2, px: 2, borderWidth: 1, borderColor: `primary.${theme.opositeMode}`, backdropFilter: "blur(10px)", borderStyle: "solid", bgcolor: `primary.main_5`, borderRadius: 1, mt: 1 }}
    >
      <Box px={0} width="100%">
        <Divider
          color={"primary.main"}
          textAlign="left"
          p={0}
          m={0}
          sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
        >
          <Typography color={"text"} variant={"h6"}>
            TOTAL
          </Typography>
        </Divider>
      </Box>
      <TableContainer>
        <Table size="small" sx={{}}>
          <TableBody>
            {lineasProcesadas.map((i) => (
              <>
                <TableRow key={`${i.cod_rubro}_1`} hover>
                  <TableCell>
                    {gruposNuevos && i.cod_servicio ? (
                      <Stack direction="column" sx={{ my: "auto" }}>
                        <Typography sx={{ textWrap: "nowrap" }}>Grupo id: </Typography>
                        <TextField
                          slotProps={{
                            htmlInput: {
                              min: 0,
                            },
                          }}
                          onChange={(ev) => handleAddServicioAGrupo(i, ev.target.value)}
                          name={`${i.cod_servicio}_val`}
                          size="small"
                          sx={{ "& input": { py: 0.5, px: 1, m: "0px !important", minWidth: 50 } }}
                          value={gruposNuevos[i.cod_servicio]?.val || ""}
                          type="number"
                        />
                      </Stack>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {gruposNuevos && i.cod_servicio ? (
                      <Stack direction="column">
                        <Typography sx={{ textWrap: "nowrap" }}>Nombre: </Typography>
                        <TextField
                          onChange={(ev) => handleChangeLabel(i, ev.target.value)}
                          name={`${i.cod_servicio}_lab`}
                          size="small"
                          sx={{ "& input": { py: 0.5, px: 1, m: "0px !important", minWidth: 200 } }}
                          value={gruposNuevos[i.cod_servicio]?.lab || ""}
                          disabled={!gruposNuevos[i.cod_servicio] || !gruposNuevos[i.cod_servicio].editable}
                        />
                      </Stack>
                    ) : null}
                  </TableCell>
                  <TableCell>{i.cod_servicio === 0 ? <GenerarCeldaVaciaNombre d={i} /> : <GenerarCeldaNombre theme={theme} d={i} />}</TableCell>
                  <TableCell width="1%">
                    <Grid container direction="column" textAlign="right">
                      {i.d ? (
                        i.cod_servicio === 0 ? (
                          <GenerarCeldaVaciaValor d={i} />
                        ) : i.d.venta === 0 ? (
                          <GenerarCeldaVaciaValor d={i} />
                        ) : (
                          <GenerarCeldaValor theme={theme} total={false} d={i.d} />
                        )
                      ) : null}
                      {i.q ? i.cod_servicio === 0 ? null : i.q.venta === 0 ? <GenerarCeldaVaciaValor d={i} /> : <GenerarCeldaValor theme={theme} total={false} d={i.q} /> : null}
                    </Grid>
                  </TableCell>
                  <TableCell width="1%">{i.detalles.length > 0 ? <GenerarCeldaDetalle theme={theme} d={i} /> : <GenerarCeldaVaciaDetalle theme={theme} />}</TableCell>
                </TableRow>
              </>
            ))}
            <TableRow key={`total_1`} hover sx={{ ...generarBorde("primary.main", 4, "top") }}>
              <TableCell></TableCell>
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
                  {totales.d && <GenerarCeldaValor theme={theme} d={totales.d} total />}
                  {totales.q && <GenerarCeldaValor theme={theme} d={totales.q} total />}
                </Grid>
              </TableCell>
              <TableCell width="1%"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Grid container>
        <Grid size="grow"></Grid>
        {guardarTarifas && (
          <Grid size="auto">
            <Button variant="contained" onClick={onTotalSubmit}>
              Guardar
            </Button>
          </Grid>
        )}
      </Grid>
      <Grid container>
        {/* <pre>{JSON.stringify([...rubros], null, 2)}</pre> */}
        {/* <pre>{JSON.stringify([...lineas], null, 2)}</pre> */}
        {/* <pre>{JSON.stringify([...elementosFormateados, ...datos], null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ datosProcesados }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ datosPorcentajeProcesados }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ grupos }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(seleccionesId, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(lineasProcesadas, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ selecciones }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ itemsSeleccionados }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(itemsSeleccionados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify([...elementosFormateados, ...datos], null, 2)}</pre> */}
        {/* <pre>{JSON.stringify([...datosProcesados, ...datosPorcentajeProcesados], null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ seleccionesId }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ length1: seleccionesId.length, length: elementosFormateados.length, elementosFormateados }, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

GenerarCeldaNombre.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarCeldaPorcentajeNombre.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaNombre.propTypes = { d: PropTypes.object };
GenerarCeldaValor.propTypes = { theme: PropTypes.object, d: PropTypes.object, total: PropTypes.bool };
GenerarCeldaVaciaValor.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaDetalle.propTypes = { theme: PropTypes.object, d: PropTypes.object };
GenerarCeldaVaciaDetalle.propTypes = { theme: PropTypes.object, r: PropTypes.object, d: PropTypes.object };
GenerarTablaTotal.propTypes = {
  monedas: PropTypes.array,
  grupos: PropTypes.array,
  gruposCompletos: PropTypes.array,
  rubros: PropTypes.array,
  proveedores: PropTypes.array,
  datos: PropTypes.array,
  selecciones: PropTypes.array,
  seleccionesId: PropTypes.array,

  keyVal: PropTypes.number,

  permiteAgrupacion: PropTypes.bool,

  seleccionarTarifa: PropTypes.func,

  agregarCalculoALista: PropTypes.func,

  datosPorcentajes: PropTypes.array,

  guardarTarifas: PropTypes.func,
};

export default GenerarTablaTotal;
