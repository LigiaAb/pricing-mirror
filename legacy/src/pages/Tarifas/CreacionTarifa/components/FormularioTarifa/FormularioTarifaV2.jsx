import React, { useMemo, useCallback, useState } from "react";
import PropTypes from "prop-types";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import { useSelector } from "react-redux";
import useCatalogosCotizacion from "@/views/Tarifas/Cotizaciones/hooks/useCatalogosCotizacion";
import { Box, Divider, Grid, Typography } from "@mui/material";
import TabComponent from "@/components/Tabs/TabComponent";
import LoaderComponent from "@/components/Loader/LoaderComponent";
import FormularioCalculoRango from "@/views/Tarifas/Calculo/FormularioCalculoRango";
import FormularioCalculoCostoVenta from "@/views/Tarifas/Calculo/FormularioCalculoCostoVenta";
import FormularioCalculoEquipo from "@/views/Tarifas/Calculo/FormularioCalculoEquipo";
import FormularioCalculoPorcentaje from "@/views/Tarifas/Calculo/FormularioCalculoPorcentaje";
import FormularioCompletoEntidadMetodo from "@/views/Tarifas/Metodo/FormularioCompletoEntidadMetodo";
import FormularioCompletoRutaMetodo from "@/views/Tarifas/Metodo/FormularioCompletoRutaMetodo";
import FormularioCompletoDetalleMetodo from "@/views/Tarifas/Metodo/FormularioCompletoDetalleMetodo";
import FormularioCompletoCommoditiesMetodo from "@/views/Tarifas/Metodo/FormularioCompletoCommoditiesMetodo";
import useTarifaFormulario, { CATALOGOS_AGREGAR_TODOS, DEFATULT_TODOS_VALUE } from "@/pages/Tarifas/CreacionTarifa/components/FormularioTarifa/hooks/useInputsTarifaV2";
import MetodoEntidad from "@/views/Tarifas/MetodoV2/MetodoEntidad";
import MetodoPais from "@/views/Tarifas/MetodoV2/MetodoPais";
import MetodoScale from "@/views/Tarifas/MetodoV2/MetodoScale";
import { convertClasificacionServicio } from "@/constants/clasifacionesTarifas";
import FormularioCalculoCobertura from "@/views/Tarifas/Calculo/FormularioCalculoCobertura";
import { api } from "@/api";
import moment from "moment";
import DialogComponent from "@/components/Dialog/DialogComponent";
import { HelperInfoTarifa } from "@/pages/Tarifas/Calculo/RenderizadosDePartes";
import FormularioCalculoRangoV2 from "@/views/Tarifas/Calculo/FormularioCalculoRangoV2";

const camposScale = [
  "empresa",
  "centroCosto",
  "fechaModificacion",
  "fechaModificacion",
  "estado",
  "tipoServicio",
  "categoriaTransporte",
  "tipoCarga",
  "clasificacionCarga",
  "incoterm",
  "tipoPago",
  "tipoAplicacion",
  "servicioInterno",
  "metodoCalculo",
  "aplicaOrigenesDestinos",
  "aplicaCommodities",
  "aplicaTodosCientes",
  "tipoTarifa",
];

const FormularioTarifaV2 = (props) => {
  const {
    tipoFormulario,
    defaultValues,
    catalogos,
    inputsReadOnly = [],
    inputsToHide = [],
    groupsToHide = [],
    isLoading: isLoadingFormulario = false,
    setReconsultar = () => {},
    reconsultar = false,
    handleFiltrar = () => {},
    handleInsertar = () => {},
    handleActualizar = () => {},
    handleCopiar = () => {},
  } = props;

  const { movil: isMovil } = useSelector((state) => state.screen);

  const [tab, setTab] = useState(1);

  const [abrirCopiar, setAbrirCopiar] = useState(false);
  const [valoresCopiar, setValoresCopiar] = useState({
    cod_servicio: null,
    cod_metodo: null,
    fecha_inicial: null,
    fecha_final: null,
  });

  const configuracionCatalogos = useMemo(
    () => ({
      agregarTodos: {
        default: DEFATULT_TODOS_VALUE,
        catalogos: CATALOGOS_AGREGAR_TODOS,
      },
    }),
    [],
  );

  const { isLoading: isLoadingCatalogos, fetchOptionsProveedores, catalogos: catalogosProcesados, obtenerProveedorById } = useCatalogosCotizacion(configuracionCatalogos);

  const isLoading = useMemo(() => !!isLoadingCatalogos || !!isLoadingFormulario, [isLoadingCatalogos, isLoadingFormulario]);

  // const vencida = useMemo(() => moment().isAfter(defaultValues?.fecha_final), [defaultValues?.fecha_final]);

  const obtenerMetodoCalculo = useCallback(
    async (url, cod_metodo) => {
      if (cod_metodo)
        return await api
          .get(url, { params: { cod_estado: 1, cod_metodo: cod_metodo } })
          .then(({ data }) => {
            return data.data.length > 0;
          })
          .catch((e) => false);
      else return false;
    },

    [],
  );

  const [validarSiTieneMetodoDeCalculo, setValidarSiTieneMetodoDeCalculo] = useState(false);

  React.useEffect(() => {
    let activo = true;

    const validar = async () => {
      const codTipo = defaultValues?.cod_tipo;
      const codMetodo = defaultValues?.cod_metodo;

      if (!codMetodo) {
        setValidarSiTieneMetodoDeCalculo(false);
        return;
      }

      let resultado = true;

      switch (codTipo) {
        case 101:
          resultado = await obtenerMetodoCalculo("api/appweb/lista-tarifa-rango", codMetodo);
          break;

        case 102:
          resultado = await obtenerMetodoCalculo("api/appweb/lista-tarifa-costoventa", codMetodo);
          break;

        case 103:
          resultado = await obtenerMetodoCalculo("api/appweb/lista-tarifa-equipo", codMetodo);
          break;

        case 148:
          resultado = await obtenerMetodoCalculo("api/appweb/lista-tarifa-porcentaje", codMetodo);
          break;

        case 363:
          resultado = await obtenerMetodoCalculo("api/appweb/lista-tarifa-cobertura", codMetodo);
          break;

        case 342:
          resultado = await obtenerMetodoCalculo("api/appweb/lista-tarifa-scalling", codMetodo);
          break;

        default:
          resultado = false;
          break;
      }

      if (activo) {
        setValidarSiTieneMetodoDeCalculo(resultado);
      }
    };

    validar();

    return () => {
      activo = false;
    };
  }, [obtenerMetodoCalculo, defaultValues?.cod_tipo, defaultValues?.cod_metodo, reconsultar]);

  const {
    valores: valoresInner,
    data,
    onInput,
    payloadServicio,
    payloadMetodo,
    valoresSoloCodigos,
    filtrarValoresPorPayload,
  } = useTarifaFormulario({
    tipoFormulario,
    defaultValues: { ...defaultValues, clasificacion: convertClasificacionServicio(defaultValues?.clasificacion) },
    catalogosProcesados,
    fetchOptionsProveedores,
    isLoading,
    inputsReadOnly,
    inputsReadOnlyScale: camposScale,
    inputsToHide,
    groupsToHide,
    defaultTodosValue: DEFATULT_TODOS_VALUE,
    obtenerProveedorById,
    validarSiTieneMetodoDeCalculo,
  });

  const [valores, setValores] = React.useState(valoresInner);

  React.useEffect(() => setValores((old) => (JSON.stringify(old) !== JSON.stringify(valoresInner) ? valoresInner : old)), [valoresInner]);

  const esScale = useMemo(() => valores?.cod_rubro === 134, [valores]);

  const tabs = useMemo(
    () => [
      { id: 1, label: "Información", icono: "c-abecedario" },
      ...(valores?.cod_servicio
        ? [
            {
              id: 2,
              icono: "c-calcular",
              label: defaultValues?.metodoCalculo_nombre ?? "Metodo no seleccionado",
              // readonly: esScale,
            },
            {
              id: 3,
              label: "Clientes",
              icono: "c-usuario",
              descripcion: valores?.tipoTarifa?.value === 98 ? "Aplicados" : "No Aplicados",
              readonly: esScale,
            },
            {
              id: 4,
              label: "Continentes - Paises",
              icono: "c-buscar-mapa",
              descripcion: valores?.aplicaOrigenesDestinos ? "No Aplicados" : "Aplicados",
              readonly: esScale,
            },
            { id: 5, label: "Detalles", icono: "c-lista" },
            { id: 6, label: "Commodities", icono: "c-documento", descripcion: valores?.aplicaCommodities ? "No Aplicados" : "Aplicados", readonly: valores?.cod_rubro === 134 },
            // { id: 7, label: "Rutas", icono: "c-mapa-ubicacion", readonly: true, tooltip: "En desarrollo" },
          ]
        : []),
    ],
    [defaultValues?.metodoCalculo_nombre, esScale, valores?.aplicaCommodities, valores?.aplicaOrigenesDestinos, valores?.cod_rubro, valores?.cod_servicio, valores?.tipoTarifa?.value],
  );

  const renderizarMetodoDeCalculo = useCallback(
    (item) => {
      switch (item) {
        case 101:
          return <FormularioCalculoRangoV2 readonly={validarSiTieneMetodoDeCalculo} onTarifaCreada={() => setReconsultar(true)} servicio={valores} metodo={valores} />;
        case 102:
          return <FormularioCalculoCostoVenta readonly={validarSiTieneMetodoDeCalculo} onTarifaCreada={() => setReconsultar(true)} servicio={valores} metodo={valores} />;
        case 103:
          return <FormularioCalculoEquipo readonly={validarSiTieneMetodoDeCalculo} onTarifaCreada={() => setReconsultar(true)} servicio={valores} metodo={valores} />;
        case 148:
          return <FormularioCalculoPorcentaje readonly={validarSiTieneMetodoDeCalculo} onTarifaCreada={() => setReconsultar(true)} servicio={valores} metodo={valores} />;
        case 363:
          return <FormularioCalculoCobertura readonly={validarSiTieneMetodoDeCalculo} onTarifaCreada={() => setReconsultar(true)} servicio={valores} metodo={valores} />;
        case 342:
          return (
            <Box sx={{ p: 1, m: 0 }}>
              <MetodoScale metodo={valores} />
            </Box>
          );
        default:
          return <></>;
      }
    },
    [validarSiTieneMetodoDeCalculo, valores, setReconsultar],
  );

  const onSubmitFormulario = useCallback(async () => {
    if (tipoFormulario === "filtro") {
      handleFiltrar(valoresSoloCodigos("servicio"));
    } else if (tipoFormulario === "ingreso") {
      handleInsertar(valoresSoloCodigos(), filtrarValoresPorPayload);
    } else {
      handleActualizar(valoresSoloCodigos(), filtrarValoresPorPayload);
    }

    setReconsultar(true);
  }, [tipoFormulario, handleFiltrar, handleInsertar, handleActualizar, valoresSoloCodigos, setReconsultar, filtrarValoresPorPayload]);

  React.useEffect(() => {
    if (!defaultValues) return;

    setValoresCopiar((v) => ({
      ...v,
      cod_metodo: defaultValues?.cod_metodo ?? null,
      cod_servicio: defaultValues?.cod_servicio ?? null,
      fecha_inicial: moment(defaultValues?.fecha_final).add(1, "d").toDate(),
      fecha_final: null,
    }));
  }, [defaultValues, defaultValues?.cod_metodo, defaultValues?.cod_servicio, defaultValues?.fecha_final]);

  return (
    <Grid container>
      {tipoFormulario !== "filtro" && (
        <Grid size={isMovil ? 12 : "auto"}>
          <TabComponent tabInicial={1} tabSeleccionado={setTab} direccion="column" opciones={tabs} />
        </Grid>
      )}

      <Grid size={tipoFormulario === "filtro" ? 12 : isMovil ? 12 : "grow"}>
        {tab === 1 || tipoFormulario === "filtro" ? (
          <FormularioComponent
            key={defaultValues?.fecha_final}
            titulo="Tarifa"
            data={data}
            onInput={onInput}
            metodo={valores}
            botones={
              tipoFormulario !== "lectura"
                ? {
                    copiar: {
                      visible: defaultValues?.fecha_final !== null && defaultValues?.fecha_final !== undefined,
                      icono: "c-copiar",
                      onClick: () => setAbrirCopiar(true),
                      variant: "contained",
                      texto: "Copiar",
                    },
                    agregar: {
                      visible: tipoFormulario === "ingreso",
                      onClick: onSubmitFormulario,
                      variant: "contained",
                    },
                    guardar: {
                      visible: tipoFormulario === "edicion",
                      onClick: onSubmitFormulario,
                      variant: "contained",
                    },
                    filtrar: {
                      visible: tipoFormulario === "filtro",
                      icono: "c-lupa",
                      onClick: onSubmitFormulario,
                      variant: "contained",
                    },
                  }
                : { agregar: { visible: false } }
            }
          />
        ) : tab === 2 ? (
          renderizarMetodoDeCalculo(defaultValues?.cod_tipo)
        ) : tab === 3 ? (
          <Box sx={{ py: 1, px: 4, m: 0 }}>
            <MetodoEntidad key={reconsultar} metodo={valores} />
            {/* <FormularioCompletoEntidadMetodo metodo={valores} /> */}
          </Box>
        ) : tab === 4 ? (
          <Box sx={{ p: 1, m: 0 }}>
            <MetodoPais metodo={valores} />
            {/* <FormularioCompletoRutaMetodo metodo={valores} /> */}
          </Box>
        ) : tab === 5 ? (
          <Box sx={{ p: 1, m: 0 }}>
            <FormularioCompletoDetalleMetodo metodo={valores} />
          </Box>
        ) : tab === 6 ? (
          <Box sx={{ p: 1, m: 0 }}>
            <FormularioCompletoCommoditiesMetodo metodo={valores} catalogos={{ commodities: [], estados: [] }} />
          </Box>
        ) : tab === 7 ? (
          <Box sx={{ p: 1, m: 0 }}>
            <MetodoScale metodo={valores} />
            {/* <FormularioCompletoCommoditiesMetodo metodo={valores} catalogos={{ commodities: [], estados: [] }} /> */}
          </Box>
        ) : null}
      </Grid>

      <Grid container width="100%">
        <Grid>
          {/* <pre>{JSON.stringify({ ...defaultValues, clasificacion: convertClasificacionServicio(defaultValues?.clasificacion) },
          null, 2)}</pre> */}
        </Grid>
        <Grid>{/* <pre>{JSON.stringify(payloadServicio, null, 2)}</pre> */}</Grid>
        <Grid>{/* <pre>{JSON.stringify(payloadMetodo, null, 2)}</pre> */}</Grid>
        <Grid>{/* <pre>{JSON.stringify({ reconsultar }, null, 2)}</pre> */}</Grid>
        <Grid>{/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}</Grid>
        <Grid>{/* <pre>{JSON.stringify(defaultValues, null, 2)}</pre> */}</Grid>
        <Grid>{/* <pre>{JSON.stringify({ validarSiTieneMetodoDeCalculo }, null, 2)}</pre> */}</Grid>
        <Grid>{/* <pre>{JSON.stringify(valoresCopiar, null, 2)}</pre> */}</Grid>
      </Grid>

      <DialogComponent setOpen={setAbrirCopiar} open={abrirCopiar} titulo="Copiar Tarifa" width="50%">
        <Grid width="100%" mx="auto" my="auto" container gap={1}>
          <Grid
            width="47%"
            mx="auto"
            sx={{
              border: "1px solid",
              borderColor: "gray.100",
              boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Divider
              color={"primary.main"}
              textAlign="left"
              p={0}
              m={0}
              sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
            >
              <Typography color={"text"}>Tarifa a Copiar:</Typography>
            </Divider>
            <HelperInfoTarifa tarifa={{ ...defaultValues, servicio: defaultValues, metodo: defaultValues }} />
          </Grid>
          <Grid width="47%" mx="auto" container>
            <Grid width="100%" mx="auto" container>
              <Grid my="auto">
                <Typography color={"text"} variant={"overline"} lineHeight={2}>
                  Para realizar la copia de la tarifa favor de ingresar la{" "}
                  <Typography component="span" variant="span" color="primary">
                    fecha de inicio
                  </Typography>{" "}
                  de la nueva tarifa.
                </Typography>
                <br />
                <Typography color={"text"} variant={"overline"} lineHeight={2}>
                  La fecha debe ser despues de la{" "}
                  <Typography component="span" variant="span" color="primary">
                    fecha de vencimiento
                  </Typography>{" "}
                  de la tarifa actual{" "}
                  <Typography component="span" variant="span" sx={{ borderColor: "primary.main", borderWidth: 1, borderStyle: "solid", px: 0.5, py: 0.5, borderRadius: 1 }}>
                    {moment(defaultValues?.fecha_final).format("DD/MM/YYYY")}
                  </Typography>
                  .
                </Typography>
              </Grid>
              <Grid my="auto">
                <Grid
                  width="100%"
                  mx="auto"
                  sx={{
                    border: "1px solid",
                    borderColor: "gray.100",
                    boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                    borderRadius: 2,
                    p: 1,
                  }}
                >
                  <FormularioComponent
                    data={{
                      inputs: [
                        {
                          tipo: "datetime",
                          name: "fecha_inicial",
                          label: "Fecha de inicio de nueva tarifa",
                          id: "fecha_inicial",
                          val: valoresCopiar?.fecha_inicial,
                          min: moment(defaultValues?.fecha_final).add(1, "d").toDate(),
                          requerido: true,
                          size: 12,
                        },
                        {
                          tipo: "datetime",
                          name: "fecha_final",
                          label: "Fecha de vencimiento de nueva tarifa",
                          id: "fecha_final",
                          val: valoresCopiar?.fecha_final,
                          size: 12,
                        },
                      ],
                    }}
                    onInput={({ id, val }) => setValoresCopiar((v) => ({ ...v, [id]: val }))}
                    botones={{
                      agregar: { visible: false },
                      copiar: { visible: true, icono: "c-copiar", onClick: () => handleCopiar(valoresCopiar), variant: "contained", texto: "Copiar" },
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {/* <pre>{JSON.stringify(valoresCopiar, null, 2)}</pre> */}
      </DialogComponent>

      <LoaderComponent open={isLoading} />
    </Grid>
  );
};

FormularioTarifaV2.propTypes = {
  tipoFormulario: PropTypes.oneOf(["filtro", "ingreso", "lectura", "edicion"]).isRequired,
  isLoading: PropTypes.bool,
  catalogos: PropTypes.object,
  defaultValues: PropTypes.object,
  handleFiltrar: PropTypes.func,
  handleInsertar: PropTypes.func,
  handleActualizar: PropTypes.func,
  handleCopiar: PropTypes.func,
  inputsToHide: PropTypes.array,
  groupsToHide: PropTypes.array,
  inputsNoObligatorios: PropTypes.array,
  submitButtonLabel: PropTypes.string,
  reconsultar: PropTypes.bool,
  setReconsultar: PropTypes.func,
  onSubmit: PropTypes.func,
  inputsReadOnly: PropTypes.array,
};

export default FormularioTarifaV2;
