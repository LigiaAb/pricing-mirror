import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, CircularProgress, Divider, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import SelectComponent from "../../../components/Formulario/SelectComponent";
import { GenerarCeldaNombre, GenerarCeldaVaciaValor, GenerarCeldaValor } from "./RenderizadosDePartes";
import { useFetchPuntosEnlace } from "@/hooks/Fetch/useFetchTarifas";
import { ArrowDown, ArrowUp, CheckCircle, CircleOff } from "lucide-react";
import { useFetchTipos } from "@/hooks/Fetch/useFetchCatalog";
import { api } from "@/api";
import moment from "moment";

const tipoOrigenVsTipoTransporte = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
};
const backgroundGradient = "linear-gradient(180deg,rgb(250, 250, 250) 0%, rgb(231, 231, 231) 100%)";

const RUBRO_SCALE = 134;

const GenerarRubrosScalling = ({
  rubros = [],
  entidad,
  lectura = false,
  codMonedaPadre = null,
  calcularScalling,
  cotizacion = {},
  version = {},
  legs = [],
  monedas = [],
  setLegs = () => {},
  loading = false,
}) => {
  const puntosEnlaceFetch = useFetchPuntosEnlace();
  const tiposTransporteFetch = useFetchTipos({ cod_catalogo: "TRANSPORTE" });

  const tipoTransporte = useMemo(() => (tiposTransporteFetch.data || [])?.find((t) => t.value === cotizacion?.cod_tipo_transporte)?.label || "", [tiposTransporteFetch.data, cotizacion]);

  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [listaPuntos, setListaPuntos] = useState([]);
  const [listaPuntosOrdenados, setListaPuntosOrdenados] = useState([]);

  const [rutasDeRubro, setRutasDeRubro] = useState([]);

  const pOrigen = (puntosEnlaceFetch.data || []).find((p) => p.value === cotizacion?.cod_puntoenlace_origen);
  const pDestino = (puntosEnlaceFetch.data || []).find((p) => p.value === cotizacion?.cod_puntoenlace_destino);

  const puntosProcesados = useMemo(() => {
    return [...listaPuntosOrdenados].filter((i) => i);
  }, [listaPuntosOrdenados]);

  const moverPunto = useCallback((index, direccion) => {
    setListaPuntosOrdenados((prev) => {
      const nueva = [...prev];
      const nuevoIndex = direccion === "up" ? index - 1 : index + 1;

      // evitar salir de rango
      if (nuevoIndex < 0 || nuevoIndex >= nueva.length) return prev;

      // swap
      [nueva[index], nueva[nuevoIndex]] = [nueva[nuevoIndex], nueva[index]];

      return nueva;
    });
  }, []);

  const siglasDisponibles = useMemo(() => {
    return new Set((rutasDeRubro || []).map((r) => r.codigo).filter(Boolean));
  }, [rutasDeRubro]);

  const listaPuntosenlacePosibles = useMemo(
    () =>
      (puntosEnlaceFetch?.data ?? [])
        .filter((p) => p.tipo_descripcion === tipoOrigenVsTipoTransporte[tipoTransporte])
        .filter((p) => p.value !== cotizacion?.cod_puntoenlace_origen)
        .filter((p) => p.value !== cotizacion?.cod_puntoenlace_destino)
        .filter((p) => siglasDisponibles.has(p.codigo))
        .map((p) => {
          const enLista = listaPuntos.some((i) => i.value === p.value);

          return {
            ...p,
            render: (
              <Typography>
                {enLista ? <CheckCircle size={12} color="green" /> : null} {p.label}
              </Typography>
            ),
          };
        }),
    [puntosEnlaceFetch.data, cotizacion, tipoTransporte, listaPuntos, siglasDisponibles],
  );

  const handleAddDeletePunto = useCallback(
    (p) => {
      const punto = p ?? puntoSeleccionado;

      if (!punto) return;

      setListaPuntos((ant) => {
        const lista = ant.some((i) => i.value === punto?.value) ? ant.filter((i) => i.value !== punto?.value) : [...ant, punto];
        return lista;
      });
    },
    [puntoSeleccionado],
  );

  const rubrosProcesados = useMemo(() => {
    if (lectura)
      return rubros.reduce((acc, r) => {
        const rutas = legs;

        const data = (rutas || []).map((ruta) => {
          const puntoEnlace = (puntosEnlaceFetch.data || []).find((p) => (ruta.codigo ? p.codigo === ruta.codigo : p.cod_puntoenlace === ruta.cod_puntoenlace_origen));

          const cod_moneda_costo = r.metodo?.cod_moneda_costo ?? ruta.cod_moneda ?? 2;
          const cod_moneda_venta = r.metodo?.cod_moneda_venta ?? ruta.cod_moneda ?? 2;

          const obj = {
            ...r,
            ...ruta,
            sigla: puntoEnlace?.codigo,
            value: `${r.value}-${ruta.punto_enlace}`,
            metodo: {
              sigla: puntoEnlace?.codigo,
              ...r.metodo,
              ...ruta,
              venta: ruta.costo,
              cod_moneda_costo: r.metodo?.cod_moneda_costo ?? ruta.cod_moneda ?? 2,
              cod_moneda_venta: r.metodo?.cod_moneda_venta ?? ruta.cod_moneda ?? 2,
              moneda_costo: r.metodo?.moneda_costo ?? monedas?.find((m) => m.cod_moneda === cod_moneda_costo) ?? null,
              moneda_venta: r.metodo?.moneda_venta ?? monedas?.find((m) => m.cod_moneda === cod_moneda_venta) ?? null,
            },
          };

          return obj;
        });

        return [...acc, ...data];
      }, []);
    else
      return (rubros || []).reduce((acc, r) => {
        const rutas = r?.metodo?.rutas;

        const data = (rutas || []).map((ruta) => ({
          ...r,
          ...ruta,
          sigla: ruta.punto_enlace,
          value: `${r.value}-${ruta.punto_enlace}`,
          metodo: { sigla: ruta.punto_enlace, ...r.metodo, ...ruta, venta: ruta.costo, cod_moneda_costo: ruta.cod_moneda ?? 2, cod_moneda_venta: ruta.cod_moneda ?? 2 },
        }));

        return [...acc, ...data];
      }, []);
  }, [lectura, rubros, legs, puntosEnlaceFetch.data, monedas]);

  useEffect(() => {
    !lectura && calcularScalling({ lista_paises: [...listaPuntos].filter((i) => i).map((i) => i.codigo) });
  }, [lectura, listaPuntos, pOrigen, pDestino, calcularScalling]);

  useEffect(() => {
    setListaPuntosOrdenados((ordenActual) => {
      // Mantener el orden actual pero solo con los que aún existen
      const base = ordenActual.filter((p) => listaPuntos.some((i) => i.value === p.value));

      // Agregar los nuevos al final
      const nuevos = listaPuntos.filter((p) => !ordenActual.some((i) => i.value === p.value));

      return [...base, ...nuevos];
    });
  }, [listaPuntos]);

  const obtenerValorBySigla = useCallback(
    (siglas) => {
      const dato = rubrosProcesados.find((r) => r.sigla === siglas);
      const punto = (puntosEnlaceFetch.data || []).find((d) => d.codigo === siglas);
      return { ...punto, moneda: dato?.metodo?.moneda_venta || null, rate: dato?.metodo?.rate || 0, venta: dato?.metodo?.venta || 0 };
    },
    [puntosEnlaceFetch.data, rubrosProcesados],
  );

  const valorOrigen = useMemo(() => (puntosProcesados[0] ? obtenerValorBySigla(puntosProcesados[0].codigo) : {}), [obtenerValorBySigla, puntosProcesados]);
  const valorDestino = useMemo(
    () => (puntosProcesados[puntosProcesados.length - 1] ? obtenerValorBySigla(puntosProcesados[puntosProcesados.length - 1].codigo) : {}),
    [obtenerValorBySigla, puntosProcesados],
  );

  const sonLegsIguales = (a = [], b = []) => {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;

    return a.every((item, index) => {
      const next = b[index];
      if (!next) return false;

      return (
        item.cod_cotizaciondetalle === next.cod_cotizaciondetalle &&
        item.cod_tipo_transporte === next.cod_tipo_transporte &&
        item.cod_puntoenlace_origen === next.cod_puntoenlace_origen &&
        item.cod_puntoenlace_destino === next.cod_puntoenlace_destino &&
        item.orden === next.orden &&
        item.rate === next.rate &&
        item.costo === next.costo &&
        item.cod_estado === next.cod_estado
      );
    });
  };

  const sonPuntosIguales = (a = [], b = []) => {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;

    return a.every((item, index) => {
      const next = b[index];
      if (!next) return false;

      return item.value === next.value;
    });
  };

  useEffect(() => {
    if (lectura) return;

    if (listaPuntosOrdenados.length === 0) {
      setLegs((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const nuevosLegs = puntosProcesados
      .map((p, index) => {
        if (!puntosProcesados[index - 1]) return null;

        const pOrigen = obtenerValorBySigla(puntosProcesados[index - 1].codigo);
        const pDestino = obtenerValorBySigla(p.codigo);

        return {
          cod_cotizaciondetalle: version?.cod_cotizaciondetalle || null,
          cod_tipo_transporte: cotizacion?.cod_tipo_transporte || null,
          cod_puntoenlace_origen: pOrigen?.cod_puntoenlace || null,
          cod_puntoenlace_destino: pDestino?.cod_puntoenlace || null,
          orden: index,
          rate: pOrigen?.rate ?? 0,
          costo: pOrigen?.venta ?? 0,
          entidad_id: entidad?.entidad_id || null,
          cod_estado: 1,
        };
      })
      .filter(Boolean);

    setLegs((prev) => (sonLegsIguales(prev, nuevosLegs) ? prev : nuevosLegs));
  }, [lectura, entidad, listaPuntosOrdenados, setLegs, obtenerValorBySigla, puntosProcesados, cotizacion?.cod_tipo_transporte, version?.cod_cotizaciondetalle]);

  const obtenerRubros = useCallback(async () => {
    const lista = await api.get("/api/appweb/lista-servicios", { params: { entidad_id: entidad.entidad_id, cod_rubro: RUBRO_SCALE, cod_estado: 1 } }).then(({ data }) => data.data);

    const listaMetodos = (
      await Promise.all(
        lista.map((i) =>
          api.get("/api/appweb/lista-metodos", { params: { cod_servicio: i.cod_servicio, cod_estado: 1 } }).then(({ data }) =>
            data.data.filter((m) => {
              return !moment().isSameOrAfter(m.fecha_final);
            }),
          ),
        ),
      )
    ).flat();

    const listaRutas = (
      await Promise.all(listaMetodos.map((i) => api.get("/api/appweb/lista-tarifa-scalling", { params: { cod_metodo: i.cod_metodo, cod_estado: 1 } }).then(({ data }) => data.data)))
    ).flat();

    setRutasDeRubro(listaRutas);
  }, [entidad.entidad_id]);

  useEffect(() => {
    if (!lectura) return;

    const nuevaLista = (puntosEnlaceFetch?.data || []).filter((p) => legs.some((l) => l.cod_puntoenlace_origen === p.cod_puntoenlace)).slice(1);

    setListaPuntosOrdenados((prev) => (sonPuntosIguales(prev, nuevaLista) ? prev : nuevaLista));
  }, [lectura, puntosEnlaceFetch?.data, legs]);

  useEffect(() => {
    if (!entidad || lectura) return;

    obtenerRubros();
  }, [entidad, obtenerRubros]);

  const quitarRender = (i) => ({ ...i, render: undefined });

  return (
    <Grid container columnSpacing={2}>
      <Stack container direction="column" size={"auto"} bgcolor="#104f9c" spacing={2} justifyContent="center" alignItems="center" borderRadius={1.2} py={2} my={1}>
        <Grid size={"auto"}>
          <Typography sx={{ writingMode: "vertical-rl", rotate: "180deg", color: "white.main", fontSize: 20, letterSpacing: 3 }}>RUTAS</Typography>
        </Grid>
        <Grid size={"grow"} bgcolor="#fff" justifyContent="center" alignItems="center" mx={0} px={0.2} />
      </Stack>
      <Grid size="grow" px={0}>
        <Grid size="grow" px={0}>
          <Divider
            color={"primary.main"}
            textAlign="left"
            p={0}
            m={0}
            sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
          >
            <Typography color={"text"}>{entidad?.entidad_nombre || ""}</Typography>
          </Divider>
          <Typography color={"text"} variant={"overline"}>
            Seleccione las paradas del embarque esperadas y luego presione calcular para obtener el rubro de{" "}
            <Typography component="b" variant="b" color="primary">
              RUTAS
            </Typography>
          </Typography>
        </Grid>
        {!lectura && (
          <Grid container size={12} px={0}>
            <Grid size="grow" px={0}>
              <SelectComponent
                input={{
                  tipo: "select",
                  id: "Leg",
                  options: listaPuntosenlacePosibles,
                  labelOption: "label",
                  valueOption: "value",
                  renderOption: "render",
                  val: puntoSeleccionado,
                  multiple: false,
                }}
                onInput={setPuntoSeleccionado}
              />
            </Grid>

            <Grid size="auto" px={2}>
              <Button variant={!lectura ? "contained" : "outlined"} onClick={() => handleAddDeletePunto()}>
                {listaPuntos.some((s) => s.value === puntoSeleccionado?.value) ? "Quitar del calculo" : "Agregar a calculo"}
              </Button>
            </Grid>
          </Grid>
        )}
        <Grid size="grow" container px={0}>
          <TableContainer size={12} px={0}>
            <Table size="small" width="100%" dense>
              <TableBody dense>
                <TableRow dense hover>
                  <TableCell width="1%" />
                  <TableCell />
                  <TableCell />
                  <TableCell>{!lectura && <Typography textAlign="center">Ordenar</Typography>}</TableCell>
                </TableRow>
                {/* {puntosProcesados[0] && (
                  <TableRow dense hover sx={{ background: backgroundGradient }}>
                    <TableCell>
                      <GenerarCeldaNombre color="grey.main" textAlign="left" nombre={"Origen"} nombre_proveedor={"Bloqueado"} />
                    </TableCell>
                    <TableCell>
                      <GenerarCeldaNombre textAlign="left" nombre={puntosProcesados[0].label} nombre_proveedor={""} />
                    </TableCell>
                    <TableCell>
                      {valorOrigen.venta ? (
                        <GenerarCeldaValor moneda={valorOrigen.moneda?.SIMBOLO_MONEDA || ""} valor={valorOrigen.venta} />
                      ) : (
                        <GenerarCeldaNombre textAlign="left" nombre={""} nombre_proveedor={"No cuenta con valor"} />
                      )}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )} */}

                {puntosProcesados.map((punto, index) => {
                  const valorPunto = obtenerValorBySigla(punto.codigo);
                  return (
                    <TableRow key={punto.value} dense hover>
                      <TableCell sx={{ textWrap: "nowrap" }} width={"1%"}>
                        {!lectura && (
                          <Button size="small" onClick={() => handleAddDeletePunto(punto)}>
                            <CircleOff size={12} color={"red"} />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <GenerarCeldaNombre textAlign="left" nombre={punto.label} nombre_proveedor={""} />
                      </TableCell>
                      <TableCell>
                        {valorPunto.venta ? (
                          <GenerarCeldaValor moneda={valorPunto.moneda?.SIMBOLO_MONEDA || ""} valor={valorPunto.venta} />
                        ) : (
                          <GenerarCeldaNombre textAlign="left" nombre={""} nombre_proveedor={"No cuenta con valor"} />
                        )}
                      </TableCell>
                      {/* {valorPunto.venta === 0 ? (
                        <TableCell sx={{ textWrap: "nowrap" }}>
                          <CircularProgress size={12} />
                        </TableCell>
                      ) : ( */}
                      <TableCell sx={{ textWrap: "nowrap" }}>
                        {!lectura && (
                          <Button size="small" disabled={index === 0} onClick={() => moverPunto(index, "up")}>
                            <ArrowUp size={12} color={index === 0 ? "lightGrey" : "green"} />
                          </Button>
                        )}

                        {!lectura && (
                          <Button size="small" disabled={index === listaPuntosOrdenados.length - 1} onClick={() => moverPunto(index, "down")}>
                            <ArrowDown size={12} color={index === listaPuntosOrdenados.length - 1 ? "lightGrey" : "red"} />
                          </Button>
                        )}
                      </TableCell>
                      {/* )} */}
                    </TableRow>
                  );
                })}
                {/* {puntosProcesados[puntosProcesados.length - 1] && (
                  <TableRow dense hover sx={{ background: backgroundGradient }}>
                    <TableCell>
                      <GenerarCeldaNombre color="grey.main" textAlign="left" nombre={"Destino"} nombre_proveedor={"Bloqueado"} />
                    </TableCell>
                    <TableCell>
                      <GenerarCeldaNombre textAlign="left" nombre={puntosProcesados[puntosProcesados.length - 1].label} nombre_proveedor={""} />
                    </TableCell>
                    <TableCell>
                      {valorDestino.venta ? (
                        <GenerarCeldaValor moneda={valorDestino.moneda?.SIMBOLO_MONEDA || ""} valor={valorDestino.venta} />
                      ) : (
                        <GenerarCeldaNombre textAlign="left" nombre={""} nombre_proveedor={"No cuenta con valor"} />
                      )}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )} */}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        {/* <pre>{JSON.stringify(rubros, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

GenerarRubrosScalling.propTypes = {
  rubros: PropTypes.array.isRequired,
  entidad: PropTypes.object,
  lectura: PropTypes.bool,
  codMonedaPadre: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  calcularScalling: PropTypes.func.isRequired,
  cotizacion: PropTypes.object,
  legs: PropTypes.array,
  monedas: PropTypes.array,
  setLegs: PropTypes.func,
  version: PropTypes.object,
  loading: PropTypes.bool,
};

export default GenerarRubrosScalling;
