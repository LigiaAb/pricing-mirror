import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { Box, Grid, Stack, Typography, Icon, Table, TableBody, TableRow, TableCell, Checkbox, Pagination, Button } from "@mui/material";
import { useSelector } from "react-redux";
import { api } from "../../../api";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import FormularioFiltroTrarifas from "../../../pages/Tarifas/CreacionTarifa/components/FormularioFiltroTarifas/FormularioFiltroTrarifas";
import FormularioTarifa from "../../../pages/Tarifas/CreacionTarifa/components/FormularioTarifa/FormularioTarifa";
import TransferListRubros from "./components/TransferListRubros/TransferListRubros";
import GenerarFiltrosCriterios from "../../../pages/Tarifas/Calculo/GenerarFiltrosCriterios";
import GenerarTablaCalculo from "../../../pages/Tarifas/Calculo/GenerarTablaCalculo";
import GenerarTablaTotal from "../../../pages/Tarifas/Calculo/GenerarTablaTotal";
import LoaderComponent from "../../Loader/LoaderComponent";
import generarPDF from "../../../pages/Tarifas/Calculo/_generarPdfCotizacion";
import ActionAlertComponent from "../../Dialog/ActionAlertComponent";
import GenerarTablaTotalCalculado from "../../../pages/Tarifas/Calculo/GenerarTablaTotalCalculado";
import DialogComponent from "../../Dialog/DialogComponent";
import CreacionTarifa from "../../../pages/Tarifas/CreacionTarifa/CreacionTarifa";
import moment from "moment";
import useFetchersCatalogosTarifa from "../../../pages/Tarifas/CreacionTarifa/hooks/useFetchersCatalogosTarifa";

const CalculoTarifasSinPlantillas = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme);
  const informacionDeUsuario = useSelector((state) => state.auth);
  const [catalogos, setCatalogos] = useState({
    empresas: [],
    centrosCostos: [],
    tiposTransporte: [],
    tiposServicio: [],
    tiposCarga: [],
    clasificacionesCarga: [],
    incoterms: [],
    tiposPago: [],
    estados: [],
    rubros: [],
  });

  const {
    obtenerRubros,
    obtenerProveedores,
    obtenerEmpresas,
    obtenerCentrosCostos,
    obtenerTiposTransporte,
    obtenerTiposServicio,
    obtenerTiposAplicacion,
    obtenerTiposCalculo,
    obtenerTiposCarga,
    obtenerClasificacionesCarga,
    obtenerIncoterms,
    obtenerTiposPago,
    obtenerEstados,
    obtenerTiposMetodo,
    obtenerCommodities,
  } = useFetchersCatalogosTarifa();

  const formularioFiltroTarifasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaadingCriterios, setIsLoaadingCriterios] = useState(false);
  const [tarifasFiltradas, setTarifasFiltradas] = useState([]);
  const [rubrosSeleccionables, setRubrosSeleccionables] = useState([]);

  const [page, setPage] = useState(1);
  const [reconsultarPlantilla, setReconsultarPlantilla] = useState(0);
  const [reconsultarCalculo, setReconsultarCalculo] = useState(0);
  const [calculando, setCalculando] = useState(false);
  const [data_criterios, setData_criterios] = useState([]);
  const [data_calculo, setData_calculo] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState([]);
  const [listaTarifasSeleccionadas, setListaTarifasSeleccionadas] = useState([]);
  const [nuevoCalculo, setNuevoCalculo] = useState(0);
  const [key, setKey] = useState(0);
  const [rubros, setRubros] = useState([]);
  const [listaGrupos, setListaGrupos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState(null);
  const [isOpenDialogCreacionTarifa, setIsOpenDialogCreacionTarifa] = useState(false);
  const [MostrarErrorAlAgregarTarifaSeleccionada, setMostrarErrorAlAgregarTarifaSeleccionada] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [alertaAccion, setAlertaAccion] = useState({
    visible: false,
    text: "",
    tipo: "alert",
    onAceptar: () => {},
    aceptar: false,
    onCancelar: () => {},
    cancelar: false,
  });

  const consultarMmonedas = useCallback(async () => {
    await api.get("/api/appweb/lista-moneda", { params: { es_operativa: true } }).then(({ data }) => setMonedas(data.data));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      dispatch(encenderCarga());

      try {
        const [
          empresas,
          centrosCostos,
          rubros,
          proveedores,
          tiposTransporte,
          tiposServicio,
          tiposAplicacion,
          tiposCalculo,
          tiposCarga,
          clasificacionesCarga,
          tiposPago,
          incoterms,
          estados,
          tiposMetodo,
          commodities,
        ] = await Promise.all([
          obtenerEmpresas(),
          obtenerCentrosCostos(),
          obtenerRubros(),
          obtenerProveedores(),

          obtenerTiposTransporte(),
          obtenerTiposServicio(),
          obtenerTiposAplicacion(),
          obtenerTiposCalculo(),
          obtenerTiposCarga(),
          obtenerClasificacionesCarga(),
          obtenerTiposPago(),

          obtenerIncoterms(),
          obtenerEstados(),
          obtenerTiposMetodo(),
          obtenerCommodities(),
        ]);

        setCatalogos({
          empresas,
          centrosCostos,
          rubros,
          proveedores,
          incoterms,
          estados,
          tiposServicio: tiposServicio,
          tiposTransporte: tiposTransporte,
          tiposAplicacion: tiposAplicacion,
          tiposCalculo: tiposCalculo,
          tiposTarifa: tiposTransporte,
          tiposMetodo: tiposMetodo,
          tiposCarga: tiposCarga,
          clasificacionesCarga: clasificacionesCarga,
          tiposPago: tiposPago,
        });
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setIsLoading(false);
        dispatch(apagarCarga());
      }
    };

    fetchData();
  }, [dispatch, obtenerRubros]);

  const limpiarProveedoresTarifasSeleccionadas = useCallback(
    (item) => {
      if (tarifaSeleccionada.some((t) => t.entidad_id === item)) setTarifaSeleccionada((v) => v.filter((t) => t.entidad_id !== item));

      setKey((v) => v + 1);
    },
    [tarifaSeleccionada]
  );

  const limpiarRubrosTarifasSeleccionadas = useCallback(
    (item) => {
      if (tarifaSeleccionada.some((t) => t.cod_rubro === item)) setTarifaSeleccionada((v) => v.filter((t) => t.cod_rubro !== item));

      setKey((v) => v + 1);
    },
    [tarifaSeleccionada]
  );

  const rubrosProcesados = useMemo(() => {
    const rubros_procesados = [];

    rubros?.map((r) => {
      if (listaGrupos.filter((lg) => lg.rubros.some((gr) => gr.cod_rubro === r.cod_rubro)).length > 0) rubros_procesados.push(r);
    });

    return rubros_procesados;
  }, [rubros, listaGrupos]);

  const gruposProcesados = useMemo(() => {
    const listaGeneradoa = new Map(),
      lista = [];

    listaGrupos.forEach((i) => listaGeneradoa.set(i.cod_grupo_rubro, { grupo_nombre: i.nombre || " ", cod_grupo: i.cod_grupo_rubro, rubros: [] }));

    rubros.forEach((r) => {
      listaGrupos.forEach((lg) => {
        if (lg.rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) {
          if (!listaGeneradoa.get(lg.cod_grupo_rubro).rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) listaGeneradoa.get(lg.cod_grupo_rubro).rubros.push({ ...r, completo: false });
        } else {
          if (!listaGrupos.some((lg) => lg.rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)))
            if (!listaGeneradoa.get(0).rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) listaGeneradoa.get(0).rubros.push({ ...r, completo: false });
        }
      });
    });

    listaGeneradoa.forEach((val, key) => lista.push(val));

    return lista.filter((lg) => lg.rubros.length > 0);
  }, [rubros, listaGrupos]);

  const proveedores = useMemo(() => {
    const proveedores = [];

    data_calculo?.forEach((item) =>
      item.servicios?.length > 0
        ? item.servicios?.map((s) => (proveedores.some((p) => p.entidad_id === s.entidad_id) ? null : proveedores.push({ entidad_id: s.entidad_id, entidad_nombre: s.entidad_nombre })))
        : item.valor && item.costo
          ? proveedores.some((p) => p.entidad_id === 0)
            ? null
            : proveedores.unshift({ entidad_nombre: "VALOR POR DEFECTO", entidad_id: 0 })
          : null
    );
    return proveedores;
  }, [data_calculo]);

  const manejarTarifasSeleccionadas = useCallback(
    (item) => {
      if (tarifaSeleccionada.some((t) => t.cod_servicio === item.cod_servicio)) setTarifaSeleccionada((v) => v.filter((t) => t.cod_servicio !== item.cod_servicio));
      else if (!tarifaSeleccionada.some((t) => t.cod_rubro === item.cod_rubro)) setTarifaSeleccionada((v) => [...v, item]);

      setKey((v) => v + 1);
    },
    [tarifaSeleccionada]
  );

  const datos = useMemo(() => {
    let datos = [];

    const estaSeleccionado = (item) => {
      return tarifaSeleccionada.some((t) => t.entidad_id === item.entidad_id && t.cod_rubro === item.cod_rubro && t.cod_servicio === item.cod_servicio);
    };

    const esSeleccionable = (item) => {
      if (estaSeleccionado(item)) return true;
      if (tarifaSeleccionada.length === 0) return true;

      const rubroSeleccionado = tarifaSeleccionada.some((t) => t.cod_rubro === item.cod_rubro);

      if (!rubroSeleccionado) return true;

      return false;
    };

    rubros.forEach(({ cod_rubro, nombre: rubro_nombre, ...gpr }) => {
      data_calculo
        .filter((d) => d.cod_rubro === cod_rubro && d.obligatorio)
        .forEach(({ servicios, ...d }) => {
          servicios.forEach(({ entidad_id, entidad_nombre, cod_servicio, ...s }) => {
            let obj = {
              g: { cod: 0, cod_grupo: 0, grupo_nombre: "" },
              r: { cod: cod_rubro, cod_rubro, rubro_nombre },
              e: { cod: entidad_id, entidad_id, entidad_nombre },
              s: {
                cod: cod_servicio,
                cod_servicio,
                completo: false,
                ...s,
                metodo: {
                  ...s.metodo,
                  moneda_venta: monedas.find((m) => m.cod_moneda === s.metodo.cod_moneda_venta) || {},
                  moneda_costo: monedas.find((m) => m.cod_moneda === s.metodo.cod_moneda_costo) || {},
                },
              },
            };

            datos.push({ ...obj, s: { ...obj.s, completo: false } });
          });
        });
    });

    return datos.map((obj) => ({
      ...obj,
      s: {
        ...obj.s,
        seleccionable: esSeleccionable({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
        seleccionado: estaSeleccionado({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
      },
    }));
  }, [data_calculo, gruposProcesados, tarifaSeleccionada, monedas]);

  const gruposCompletos = useMemo(() => {
    let d = [];

    datos.forEach((i) => {
      if (i.g.cod === 0) {
        d.push({ ...i.e, ...i.r, ...i.g, completo: false });
        return;
      }
      const { rubros, cod_rubro } = gruposProcesados.find((gp) => gp.cod_grupo === i.g.cod);

      if (rubros.length === 1) if (!d.some((data) => data.entidad_id === i.e.cod && d.cod_rubro === i.r.cod && d.cod_grupo === i.g.cod)) d.push({ ...i.e, ...i.r, ...i.g, completo: true });

      let verificacion = [];

      rubros.forEach((r) => (datos.some((d) => d.e.cod === i.e.cod && r.cod_rubro === d.r.cod) ? verificacion.push(true) : verificacion.push(false)));

      if (!d.some((data) => data.entidad_id === i.e.cod && d.cod_rubro === i.r.cod && d.cod_grupo === i.g.cod)) d.push({ ...i.e, ...i.r, ...i.g, completo: !verificacion.some((i) => !i) });
    });
    return d;
  }, [datos, gruposProcesados]);

  const handleFiltradoInicialTarifas = async (filtros) => {
    const filtrosConValor = Object.fromEntries(Object.entries(filtros).filter(([_, value]) => !!value));

    let baseApiURL = "/api/appweb/lista-servicios";
    const response = await api.get(baseApiURL, { params: filtrosConValor });
    const tarifas = response.data.data;
    setTarifasFiltradas(tarifas);

    const idsRubrosTarifasFiltradas = [...new Set(tarifas.map((t) => t.cod_rubro))];
    const rubrosSeleccionables = [];
    idsRubrosTarifasFiltradas.forEach((cod_rubro) => {
      const rubro = catalogos.rubros.find((r) => r.cod_rubro === cod_rubro);
      if (rubro) rubrosSeleccionables.push(rubro);
    });
    setRubrosSeleccionables(rubrosSeleccionables);

    baseApiURL = "/api/appweb/recupera-datos-grupos";
    const gruposRubros = (await await api.get(baseApiURL, { params: { cod_estado: 1, ...filtrosConValor } }).then(({ data }) => data.data)) || [];
    setListaGrupos([{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(gruposRubros || [])]);

    const filtrosConFormatoCalculoTarifas = {
      empresa: catalogos.empresas.find((e) => e.cod_empresa === filtrosConValor.cod_empresa) || null,
      centro_costo: catalogos.centrosCostos.find((cc) => cc.cod_cc === filtrosConValor.cod_cc) || null,
      tipo_transporte: catalogos.tiposTransporte.find((tt) => tt.cod_tipo_transporte === filtrosConValor.cod_tipo_transporte) || null,
      tipo_servicio: catalogos.tiposServicio.find((ts) => ts.cod_tipo_servicio === filtrosConValor.cod_tipo_servicio) || null,
      tipo_carga: catalogos.tiposCarga.find((tc) => tc.cod_tipo_carga === filtrosConValor.cod_tipo_carga) || null,
      clasificacion_carga: catalogos.clasificacionesCarga.find((cc) => cc.cod_clasificacion_carga === filtrosConValor.cod_clasificacion_carga) || null,
      incoterm: catalogos.incoterms.find((i) => i.incoterm_id === filtrosConValor.incoterm_id) || null,
      tipo_pago: catalogos.tiposPago.find((tp) => tp.cod_tipo_pago === filtrosConValor.cod_tipo_pago) || null,
    };

    setFiltros(filtrosConFormatoCalculoTarifas);

    setData_criterios((prev) => ({
      ...prev,
      filtros,
    }));
  };

  const handleRubrosGuardados = async (rubros) => {
    setIsLoaadingCriterios(true);
    setRubros(rubros);
    const tarifas = tarifasFiltradas.filter((t) => rubros.some((r) => r.cod_rubro === t.cod_rubro));

    const baseApiURL = "/api/appweb/lista-plantilla-criterio";
    const promesasCriterios = tarifas.map((tarifa) => {
      return api.get(baseApiURL, { params: { cod_tarifa: tarifa.cod_tarifa } }).then((resp) => resp.data.data);
    });

    const respuestasCriterios = await Promise.all(promesasCriterios);
    const criteriosUnificados = respuestasCriterios.flat();
    const criteriosUnicos = Array.from(
      criteriosUnificados
        .reduce((map, criterio) => {
          if (!map.has(criterio.campo)) {
            map.set(criterio.campo, criterio);
          }
          return map;
        }, new Map())
        .values()
    );
    setData_criterios((prev) => ({
      ...prev,
      criterios: criteriosUnicos,
      entidad_id: undefined,
      rubros,
    }));
    setIsLoaadingCriterios(false);
  };

  const handleTarifaCreada = useCallback((tarifa) => {
    setReconsultarPlantilla((v) => v + 1);
    // setReconsultarCalculo((v) => v + 1);
    setIsOpenDialogCreacionTarifa(false);
  }, []);

  if (isLoading) return <LoaderComponent texto="Cargando..." open={true} />;

  return (
    <Box display={"flex"} flexDirection="column" gap={2} padding={2}>
      {/* <FormularioFiltroTrarifas
				onSubmit={handleFiltradoInicialTarifas}
				catalogos={catalogos}
			/> */}

      <Box display="flex" flexDirection="column" gap={1}>
        <FormularioTarifa
          ref={formularioFiltroTarifasRef}
          isItCreating={false}
          hideLabels={true}
          inputsToHide={["rubro", "servicio_interno", "incoterm", "nombre", "siglas"]}
          inputsNoObligatorios={["tipoAplicacion", "tipoCalculo", "tipoCarga"]}
          usarAccionesPrestablecidas={false}
          submitButtonLabel="filtrar"
          onSubmit={handleFiltradoInicialTarifas}
          catalogos={catalogos}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const inputsValidos = formularioFiltroTarifasRef.current?.validar();
            if (inputsValidos) formularioFiltroTarifasRef.current?.submit();
          }}
          sx={{ width: "fit-content", ml: "auto" }}
        >
          Filtrar
        </Button>
      </Box>

      <TransferListRubros rubrosSeleccionables={rubrosSeleccionables} onRubrosGuardados={handleRubrosGuardados} catalogos={catalogos} />

      {isLoaadingCriterios ? (
        <LoaderComponent sx={{ position: "block" }} texto="Cargando criterios..." open={true} />
      ) : (
        data_criterios?.criterios?.length > 0 && (
          <Grid width={"100%"}>
            <GenerarFiltrosCriterios
              reconsultarCalculo={reconsultarCalculo}
              plantilla={data_criterios}
              setCalculando={setCalculando}
              retornarCalculos={(d) => {
                setData_calculo(d.data);
                setFiltros((v) => ({ ...v, ...d.valores }));
                setTarifaSeleccionada([]);
                setListaTarifasSeleccionadas([]);
                setNuevoCalculo((v) => v + 1);
                setCalculando(false);
              }}
              sinPlantilla={true}
            />
          </Grid>
        )
      )}

      {/* <pre key={JSON.stringify(grupos, null, 2)}>{JSON.stringify(grupos, null, 2)}</pre> */}
      {calculando ? (
        <LoaderComponent sx={{ position: "block" }} texto="Estamos calculando las tarifas " open={true} />
      ) : (
        <>
          {data_calculo?.length > 0 ? (
            <Grid width="100%">
              <Grid
                width="100%"
                color={`primary.${theme.opositeMode}`}
                sx={{
                  p: 0,
                  borderWidth: 3,
                  borderBottomStyle: "solid",
                  borderColor: `primary.${theme.opositeMode}`,
                }}
              >
                <Stack direction="row">
                  <Typography variant="h5" sx={{ m: 0, p: 0, mr: 10 }}>
                    <Icon sx={{ fontSize: "inherit" }} className="c-kanban" /> CÁLCULO
                  </Typography>
                  <Typography
                    variant="span"
                    color="text"
                    sx={{
                      m: 0,
                      mt: "auto !important",
                      ml: "10px !important",
                      p: 0,
                    }}
                  >
                    Seleccione los rubros segun el proveedor en la siguiente tabla
                  </Typography>
                </Stack>
              </Grid>
              <GenerarTablaCalculo
                selecciones={tarifaSeleccionada}
                limpiarProveedor={(entidad_id) => limpiarProveedoresTarifasSeleccionadas(entidad_id)}
                limpiarRubro={(cod_rubro) => limpiarRubrosTarifasSeleccionadas(cod_rubro)}
                rubros={rubrosProcesados}
                grupos={gruposProcesados}
                proveedores={proveedores}
                gruposCompletos={gruposCompletos}
                datos={datos}
                seleccionarTarifa={manejarTarifasSeleccionadas}
                handleCrearTarifa={(rubro) => {
                  setRubroSeleccionado(rubro);
                  setIsOpenDialogCreacionTarifa(true);
                }}
                keyVal={`${key}_${nuevoCalculo}`}
              />
            </Grid>
          ) : (
            <Grid textAlign="center" width="100%">
              <Typography fontWeight="bold">No se pudo realizar el calculo</Typography>
            </Grid>
          )}
          {data_calculo?.length > 0 ? (
            <Grid
              width="100%"
              color={`primary.${theme.opositeMode}`}
              sx={{
                p: 0,
                mt: 2,
                mb: 1,
                borderWidth: 3,
                borderBottomStyle: "solid",
                borderColor: `primary.${theme.opositeMode}`,
              }}
            >
              <Stack direction="row">
                <Typography variant="h5" sx={{ m: 0, p: 0, mr: 10 }}>
                  <Icon sx={{ fontSize: "inherit" }} className="c-kanban" /> Rubros Opcionales
                </Typography>
                <Typography
                  variant="span"
                  color="text"
                  sx={{
                    m: 0,
                    mt: "auto !important",
                    ml: "10px !important",
                    p: 0,
                  }}
                >
                  Seleccione los rubros Opcionales de la empresa a aplicar en el calculo
                </Typography>
              </Stack>
            </Grid>
          ) : (
            <></>
          )}
          <Grid container direction="column" width="100%">
            <Table size={"small"}>
              <TableBody>
                {
                  /* [
								{ nombre: "rubro 1", key: 1, valor: 200 },
								{ nombre: "rubro 2", key: 2, valor: 20 },
								{ nombre: "rubro 3", key: 3, valor: 100 },
								{ nombre: "rubro 4", key: 4, valor: 130 },
							] */ data_calculo
                    .filter((i) => !i.obligatorio)
                    .map((i) => (
                      <TableRow key={i.cod_rubro}>
                        <Checkbox size={"sm"} sx={{ m: 0, p: 0 }} />
                        <TableCell></TableCell>
                        <TableCell>{i.nombre_rubro}</TableCell>
                        <TableCell>USD</TableCell>
                        <TableCell sx={{ textAlign: "right" }}>{i.venta}</TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
            <Pagination sx={{ mx: "auto", width: "fit-content" }} variant="outlined" shape="rounded" count={listaTarifasSeleccionadas.length} page={page} onChange={(ev, val) => setPage(val)} />
          </Grid>
          {rubros?.length > 0 && (
            <Grid width="100%" mt={3}>
              <Grid width="100%">
                <GenerarTablaTotal
                  agregarCalculoALista={(data) => {
                    if (data.every((d) => d.valor.length > 0)) {
                      setAlertaAccion((v) => ({
                        ...v,
                        visible: true,
                        aceptar: true,
                        cancelar: true,
                        onAceptar: () => {
                          const a = [...data];
                          setListaTarifasSeleccionadas((l) => [...l, a]);
                          setTarifaSeleccionada([]);
                        },
                        onCancelar: () => {},
                        text: (
                          <>
                            Esta por agregar el calculo actual a la lista de Calculos, esto borrara la seleccion actual.
                            <br /> ¿Desea continuar?
                          </>
                        ),
                      }));
                    } else setMostrarErrorAlAgregarTarifaSeleccionada(true);
                  }}
                  grupos={gruposProcesados}
                  gruposCompletos={gruposCompletos}
                  permiteAgrupacion
                  rubros={rubros}
                  datos={tarifaSeleccionada}
                />
              </Grid>
            </Grid>
          )}
          {/* {tarifaSeleccionada.length > 0 && (
					)} */}
          {listaTarifasSeleccionadas.length > 0 && (
            <Grid width="100%" mt={3}>
              <Grid
                width="100%"
                color={`primary.${theme.opositeMode}`}
                sx={{
                  p: 0,
                  borderWidth: 0,
                  borderBottomStyle: "solid",
                  borderColor: `primary.${theme.opositeMode}`,
                }}
              >
                <Grid container direction="row">
                  <Grid>
                    <Typography variant="h5" sx={{ m: 0, p: 0, mr: 10 }}>
                      <Icon sx={{ fontSize: "inherit" }} className="c-calcular" /> Total de cada Calculo
                    </Typography>
                  </Grid>
                  <Grid size="grow"></Grid>
                  <Grid>
                    <Stack direction="row" alignItems="start" width="fit-content" gap={1}>
                      <Button
                        onClick={() => {
                          setAlertaAccion((v) => ({
                            ...v,
                            visible: true,
                            text: (
                              <>
                                Esta por eliminar el calculo, esta accion no es reversible.
                                <br /> ¿Desea continuar?
                              </>
                            ),
                            onAceptar: () => {
                              setListaTarifasSeleccionadas((lista) => lista.filter((i, ind) => page - 1 !== ind));
                              setPage((p) => (p == 1 ? 1 : p - 1));
                            },
                            aceptar: true,
                            onCancelar: () => {},
                            cancelar: true,
                          }));
                        }}
                        color="error"
                        variant="contained"
                        size="small"
                      >
                        <Icon className="c-eliminar" sx={{ fontSize: "inherit", mr: 1 }} /> Quitar calculoo de la lista
                      </Button>
                      <Button
                        onClick={() => {
                          setAlertaAccion((v) => ({
                            ...v,
                            visible: true,
                            text: (
                              <>
                                Al editar el calculo seleccionado se borrara la seleccion actual.
                                <br /> ¿Desea continuar?
                              </>
                            ),
                            onAceptar: () => {
                              setTarifaSeleccionada(listaTarifasSeleccionadas[page - 1]);
                              setPage((p) => (p == 1 ? 1 : p - 1));
                              setListaTarifasSeleccionadas((lista) => lista.filter((i, ind) => page - 1 !== ind));
                            },
                            aceptar: true,
                            onCancelar: () => {},
                            cancelar: true,
                          }));
                        }}
                        sx={{ bgcolor: "accent.main", color: "white.main" }}
                        color="accent"
                        variant="contained"
                        size="small"
                      >
                        <Icon className="c-lapiz" sx={{ fontSize: "inherit", mr: 1 }} /> Editar calculo
                      </Button>
                      <Button
                        onClick={() => {
                          const titulo = `Calculo generado [ formato provicional ]`;
                          setPdfUrl(
                            generarPDF({
                              descargar: true,
                              propiedades: {
                                title: `${titulo} - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.pdf`,
                                subject: titulo,
                                author: "ERP-web",
                                creator: "ERP-web",
                              },
                              titulo: `${titulo}`,
                              horizontal: false,
                              bottom: true,
                              header: {
                                "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
                                "Tipo de Transporte": filtros.tipo_transporte?.label || "",
                                "Tipo de Servicio": filtros.tipo_servicio?.label || "",
                              },
                              agente: { cod_usuario: informacionDeUsuario.cod_usuario, usuario: informacionDeUsuario.usuario, nombre: informacionDeUsuario.nombre },
                              datos: listaTarifasSeleccionadas,
                            })
                          );
                        }}
                        sx={{ bgcolor: "pdf.main", color: "white.main" }}
                        color="accent"
                        variant="contained"
                        size="small"
                      >
                        <Icon className="c-pdf" sx={{ fontSize: "inherit", mr: 1 }} /> Generar
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Grid>
              <Grid width="100%" alignItems="center" mt={1}>
                <Pagination sx={{ mx: "auto", width: "fit-content" }} variant="outlined" shape="rounded" count={listaTarifasSeleccionadas.length} page={page} onChange={(ev, val) => setPage(val)} />
              </Grid>
              <Grid width="100%">
                <Stack direction="row" alignItems="start" width="100%" gap={1}>
                  <Box width="100%">
                    <GenerarTablaTotalCalculado grupos={gruposProcesados} rubros={rubros} datos={listaTarifasSeleccionadas[page - 1]} />
                  </Box>
                </Stack>
              </Grid>
              <Grid width="100%" alignItems="center" mt={1}>
                <Pagination sx={{ mx: "auto", width: "fit-content" }} variant="outlined" shape="rounded" count={listaTarifasSeleccionadas.length} page={page} onChange={(ev, val) => setPage(val)} />
              </Grid>
            </Grid>
          )}
          <ActionAlertComponent
            tipo={alertaAccion.tipo}
            openDialog={alertaAccion.visible}
            cancelar={() => {
              alertaAccion.onCancelar();
              setAlertaAccion((v) => ({ ...v, visible: false }));
            }}
            aceptar={() => {
              alertaAccion.onAceptar();
              setAlertaAccion((v) => ({ ...v, visible: false }));
            }}
            handleClose={() => setAlertaAccion((v) => ({ ...v, visible: false }))}
            content={alertaAccion.text}
            activarAceptar={alertaAccion.aceptar}
            activarCanecelar={alertaAccion.cancelar}
          />
          <ActionAlertComponent
            tipo="error"
            openDialog={MostrarErrorAlAgregarTarifaSeleccionada}
            cancelar={() => setMostrarErrorAlAgregarTarifaSeleccionada(false)}
            aceptar={() => setMostrarErrorAlAgregarTarifaSeleccionada(false)}
            handleClose={() => setMostrarErrorAlAgregarTarifaSeleccionada(false)}
            activarAceptar={true}
            activarCanecelar={false}
            content={"Existe uno o mas rubros no seleccionados"}
          />
          {/* <pre>{JSON.stringify(gruposCompletos, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(data_calculo, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(tarifaSeleccionada, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(listaTarifasSeleccionadas, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(data_criterios, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(rubros, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(listaGrupos, null, 2)}</pre> */}
          {/* <pre>
					{JSON.stringify(
						grupos.reduce((acc, { cod_grupo_rubro, nombre, rubros, ...grupo }) => {
						rubros.map(({ cod_rubro, nombre_rubro }) => {
							if (!acc.some((a) => a.cod_rubro === cod_rubro)) acc.push({ cod_grupo_rubro, nombre, cod_rubro, nombre_rubro });
						});
						return acc;
						}, []),
						null,
						2
					)}
					</pre> */}
          {/* <pre>{JSON.stringify(grupos, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(filtros, null, 2)}</pre> */}
        </>
      )}
      {/* <>{pdfUrl !== "" && <iframe key={pdfUrl} src={pdfUrl + "#toolbar=0&navpanes=0&scrollbar=0"} width="100%" height="500px" />}</> */}
      <DialogComponent titulo="Agregar Tarifa" openDialog={isOpenDialogCreacionTarifa} handleClose={() => setIsOpenDialogCreacionTarifa(false)} width={"90%"} height={"90%"}>
        <CreacionTarifa
          isCreationOnlyMode={true}
          defaultValues={{
            ...data_criterios,
            entidad_id: undefined,
            cod_rubro: rubroSeleccionado?.cod_rubro || null,
          }}
          onTarifaCreada={handleTarifaCreada}
        />
      </DialogComponent>
    </Box>
  );
};

export default CalculoTarifasSinPlantillas;
