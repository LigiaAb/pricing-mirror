import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Checkbox, Divider, FormControlLabel, Grid, Icon, Stack, Typography } from "@mui/material";
import AcordeonComponent2 from "../../../../components/AcordeonComponent/AcordeonComponent2";
import CalculadoraDeCantidadYMedidas from "../../../../components/Tarifas/CalculoTarifasSinPlantillas/CalculadoraDeCantidadYMedidas";
import useCatalogosCotizacion from "../hooks/useCatalogosCotizacion";
import TablaGestionCabeceraCotizacion from "./components/TablaGestionCabeceraCotizacion/TablaGestionCabeceraCotizacion";
import { useFetchCotizacionPlantilla, useFetchCotizacionPlantillaRubros } from "../../../../hooks/Fetch/useFetchTarifas";
import { useSelector } from "react-redux";
import LoaderComponent from "../../../../components/Loader/LoaderComponent";
import useObtenerOpcionesAcciones from "../../../../hooks/useObtenerOpcionesAcciones";
import { CODS_ESTADOS } from "../../../../constants/estados";
import TabComponent from "../../../../components/Tabs/TabComponent";
import { api } from "../../../../api";
import { useParams } from "react-router-dom";
import { decryptId } from "../../../../api/encryptDecrypt";
import { GenerarCeldaNombre } from "@/pages/Tarifas/Calculo/RenderizadosDePartes";
import TooltipComponent from "@/components/TooltipComponent/TooltipComponent";
import { esDueAgent } from "@/constants/clasifacionesTarifas";
import FormularioCotizacion from "../../Cotizaciones/FormularioCotizacion/FormularioCotizacion";

function filtrarPorObjeto(data = [], filtros) {
  return data.filter((item) =>
    Object.entries(filtros).some(([key, value]) => {
      // 🔹 Regla 1: ignorar null o undefined
      if (value === null || value === undefined) return true;

      // 🔹 Regla 2: si el campo no existe en el item → ignorar
      if (!(key in item)) return true;

      // campos especificos de lista
      if (key === "cod_estado") return true;
      if (key === "cod_tipo_pago") {
        if (value === 131) return true;
        if (item[key] === 131) return true;
      }

      // 🔹 Validación normal
      return item[key] === value;
    }),
  );
}

const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

const gruposDeFiltro = ["carga"];
const camposDeFiltro = ["fecha", "descripcion", "contacto", "tipoCarga", "clasificacionCarga", "tipoPuntoEnlaceOrigen", "tipoPuntoEnlaceDestino", "descripcion"];
const camposFiltroConsulta = ["cod_empresa", "cod_cc", "entidad_id", "cod_pais_origen", "cod_puntoenlace_origen", "cod_pais_destino", "cod_puntoenlace_destino", "cod_tipo_pago"];
const camposEdicionNormal = ["cliente", "empresa", "centroCosto", "cliente", "contacto"];
const camposEdicionConfirmado = [
  "cliente",
  "empresa",
  "centroCosto",
  "contacto",
  "tipoTransporte",
  "tipoServicio",
  "tipoCarga",
  "clasificacionCarga",
  "incoterm",
  "tipoPago",
  "paisOrigen",
  "tipoPuntoEnlaceOrigen",
  "puntoEnlaceOrigen",
  "paisDestino",
  "tipoPuntoEnlaceDestino",
  "puntoEnlaceDestino",
  "descripcion",
];
const camposDeFormulario = ["fecha", "empresa", "centroCosto", "estacion"];

const GestionPlantilla = (props) => {
  // ─────────────────────────────
  // Debug
  // ─────────────────────────────
  // console.log("GestionPlantilla renderizado");

  // ─────────────────────────────
  // URL
  // ─────────────────────────────
  let { encryptedId } = useParams();

  // ─────────────────────────────
  // Props
  // ─────────────────────────────
  // const { isCreationOnlyMode } = props;

  // ─────────────────────────────
  // Redux
  // ─────────────────────────────
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);

  // ─────────────────────────────
  // Catálogos
  // ─────────────────────────────
  const { isLoading, isLoadingContactos, fetchOptionsClientes, obtenerContactosDeEntidad, catalogos } = useCatalogosCotizacion();
  const permisosArray = useObtenerOpcionesAcciones();
  const fetchPlantillaes = useFetchCotizacionPlantilla();
  const fetchPlantillaesRubros = useFetchCotizacionPlantillaRubros();

  // ─────────────────────────────
  // Estados
  // ─────────────────────────────
  const [filtroPlantillaes, setFiltroPlantillaes] = useState({
    cod_empresa: currentEmpresa?.cod_empresa,
    cod_cc: currentCentroCosto?.cod_cc,
  });

  const [reconsultar, setReconsultar] = useState(false);

  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [versionSeleccionada, setVersionSeleccionada] = useState(null);
  const [open, setOpen] = useState(false);
  const [isNewPlantilla, setIsNewPlantilla] = useState(false);
  const [clearForm, setClearForm] = useState(false);
  const [listaPlantillaes, setListaPlantillaes] = useState([]);
  const [valoresSoloCodigos, setValoresSoloCodigos] = useState({});
  const [dueAgentSelect, setDueAgentSelect] = useState({});

  const [isAcordeonFiltroPlantillaesExpanded, setIsAcordeonFiltroPlantillaesExpanded] = useState(false);

  const obtenerAccionesSegunPermisos = useMemo(() => {
    let item = permisosArray["catalogoArray"][0]?.acciones || [];
    return item.reduce((acc, val) => ({ ...acc, [val.cod_accion]: val }), {});
  }, [permisosArray]);

  const [tabActual, setTabActual] = useState(0);

  const rubrosDueAgent = useMemo(
    () => (fetchPlantillaesRubros?.data || []).filter((r) => r.cod_tarifaplantilla === plantillaSeleccionada?.cod_tarifaplantilla),
    [fetchPlantillaesRubros?.data, plantillaSeleccionada],
  );

  // ─────────────────────────────
  // Derivados
  // ─────────────────────────────

  const serviciosProcessados = useMemo(() => catalogos?.servicios?.filter((s) => esDueAgent(s)).map((i) => ({ ...i, key: `${i.cod_servicio}|${i.cod_rubro}` })) ?? [], [catalogos.servicios]);

  const validarSiRubroEsObligatorioYSoloTieneUnServicio = useCallback(
    (cod_rubro) => {
      const serviciosDelRubro = serviciosProcessados.filter((s) => s.cod_rubro === cod_rubro);
      if (serviciosDelRubro.length !== 1) return false;
      const servicio = serviciosDelRubro[0];
      const esObligatorio = serviciosDelRubro.find((r) => r.cod_rubro === cod_rubro)?.obligatorio;
      return esObligatorio;
    },
    [serviciosProcessados],
  );

  useEffect(() => {
    setDueAgentSelect(() => {
      const items = {};

      // base: servicios disponibles
      serviciosProcessados.forEach((s) => {
        if (items[s.key] !== undefined) return;

        items[s.key] = validarSiRubroEsObligatorioYSoloTieneUnServicio(s.cod_rubro);
      });

      // plantilla: rubros ya asignados deben venir seleccionados
      if (plantillaSeleccionada) {
        (fetchPlantillaesRubros?.data || [])
          .filter((i) => i.cod_tarifaplantilla === plantillaSeleccionada?.cod_tarifaplantilla)
          .forEach((s) => {
            items[s.key] = true;
          });
      }

      return items;
    });
  }, [serviciosProcessados, fetchPlantillaesRubros?.data, plantillaSeleccionada, validarSiRubroEsObligatorioYSoloTieneUnServicio]);

  const isRubroSeleccionado = useCallback(
    (cod_rubro) =>
      Object.entries(dueAgentSelect).some(([key, value]) => {
        const [servicioId, rubroId] = key.split("|");
        return value && parseInt(rubroId) === cod_rubro;
      }),
    [dueAgentSelect],
  );

  const getRubroNombreByCod = useCallback(
    (cod_rubro) => {
      const rubro = catalogos.rubros.find((r) => r.cod_rubro === cod_rubro);
      return rubro ? rubro.nombre : cod_rubro;
    },
    [catalogos.rubros],
  );
  // ─────────────────────────────
  // Handlers
  // ─────────────────────────────
  const handleFiltradoPlantillaes = useCallback((values) => {
    const nuevo = camposFiltroConsulta.reduce((acc, val) => (values[val] ? { ...acc, [val]: values[val] } : acc), {});

    setFiltroPlantillaes((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(nuevo)) return prev;
      return nuevo;
    });
  }, []);

  const toggleAcordeon = (p, exp) => {
    p.preventDefault();
    if (exp === undefined) return;
    setIsAcordeonFiltroPlantillaesExpanded(exp);
  };

  const handleSelectRow = useCallback((id, row) => {
    setIsNewPlantilla(false);
    setPlantillaSeleccionada(row);
  }, []);

  const handleClean = useCallback(() => {
    setIsNewPlantilla(false);
    setClearForm(true);
    setPlantillaSeleccionada(null);
  }, []);

  const handleNew = useCallback(() => {
    setIsNewPlantilla(true);
    setClearForm(true);
    setPlantillaSeleccionada({ ...filtroPlantillaes });
  }, [filtroPlantillaes]);

  const handleClickInsert = useCallback(async (plantilla) => {
    await api.post("api/appweb/insertar-tarifa-plantilla", plantilla).then(({ data }) => {
      console.log("Cotización insertada con éxito", data.data);
      setPlantillaSeleccionada({ ...plantilla, value: data.data.cod_tarifaplantilla, cod_tarifaplantilla: data.data.cod_tarifaplantilla });
    });
    setReconsultar(true);
    setIsNewPlantilla(false);
  }, []);

  const handleClickSave = useCallback(async (plantilla) => {
    setPlantillaSeleccionada(plantilla);
    await api.post("api/appweb/actualizar-tarifa-plantilla", { ...plantilla, cod_estado: plantilla.cod_estado || CODS_ESTADOS.ACTIVO });
    setReconsultar(true);
  }, []);

  const handleClickSaveRubros = useCallback(
    async (plantilla) => {
      if (!plantilla?.cod_tarifaplantilla) return;

      const rubrosActuales = rubrosDueAgent;

      const aEliminar = [];
      const aInsertar = [];

      Object.entries(dueAgentSelect).forEach(([key, value]) => {
        const [servicioId, rubroId] = key.split("|");

        const cod_servicio = Number(servicioId);
        const cod_rubro = Number(rubroId);

        const existeEnPlantilla = rubrosActuales.find((r) => r.cod_servicio === cod_servicio && r.cod_rubro === cod_rubro);

        // 🔹 insertar
        if (value && !existeEnPlantilla) {
          aInsertar.push({
            cod_tarifaplantilla: plantilla.cod_tarifaplantilla,
            cod_rubro,
            cod_servicio,
            obligatorio: false,
            cod_estado: 1,
          });
        }

        // 🔹 eliminar
        if (!value && existeEnPlantilla) {
          aEliminar.push({
            cod_plantillarubro: existeEnPlantilla.cod_plantillarubro,
            cod_tarifaplantilla: plantilla.cod_tarifaplantilla,
            cod_rubro,
            cod_servicio,
            obligatorio: false,
            cod_estado: 1,
          });
        }
      });

      await Promise.all([
        ...aInsertar.filter((i) => i.cod_rubro && i.cod_servicio).map((item) => api.post("api/appweb/insertar-plantilla-rubro", item)),
        ...aEliminar.filter((i) => i.cod_rubro && i.cod_servicio).map((item) => api.post("api/appweb/eliminar-plantilla-rubro", item)),
      ]);

      fetchPlantillaesRubros.refetch();

      setReconsultar(true);
    },
    [dueAgentSelect, fetchPlantillaesRubros?.data],
  );

  const obtenerPlantillaDesdeURL = useCallback(async () => {
    // 1️⃣ si no viene por URL, no hacemos nada
    if (!encryptedId) return;

    // 2️⃣ si la consulta aún no terminó, esperamos
    if (!listaPlantillaes.length) return;

    // 3️⃣ buscamos en LA lista final
    const idCabecera = decryptId(encryptedId);

    const plantilla = (fetchPlantillaes.data || []).find((c) => c.cod_tarifaplantilla === Number(idCabecera));

    console.log("Cotización seleccionada:", decryptId(encryptedId), "-", plantilla, "-", listaPlantillaes);

    // 4️⃣ si no existe, no hacemos nada
    if (!plantilla) return;

    // 5️⃣ seleccionamos
    await setPlantillaSeleccionada(plantilla);

    // (opcional) disparar dependencias

    console.log("Cotización seleccionada desde URL:", plantilla);

    handleSelectRow(idCabecera, plantilla);
  }, [encryptedId, handleSelectRow, listaPlantillaes, fetchPlantillaes.data]);

  useEffect(() => {
    obtenerPlantillaDesdeURL();
  }, [encryptedId, listaPlantillaes, obtenerPlantillaDesdeURL]);

  // const filtroProcesado = useMemo(() => {
  //   // camposFiltroConsulta
  //   return camposFiltroConsulta.reduce((campo, acc) => {
  //     if (filtroPlantillaes[campo]) return { ...acc, [campo]: filtroPlantillaes[campo] };
  //   }, {});
  // }, [filtroPlantillaes]);

  // ─────────────────────────────
  // Render
  // ─────────────────────────────

  return (
    <Box py={2}>
      <Grid sx={{ boxShadow: isAcordeonFiltroPlantillaesExpanded ? "2.5px 10px 10px rgba(0,0,0,0.2)" : undefined, mb: 2 }}>
        <AcordeonComponent2
          expandido={isAcordeonFiltroPlantillaesExpanded}
          expandir={toggleAcordeon}
          propiedades={{
            bgcolorAcordeon: "transparent",
            bgcolor: "primary.main",
            titulo: { color: "white.main" },
            borderRadius: 1.5,
          }}
          titulo={
            <Box display="flex" justifyContent="space-between" p={0.8} width="100%">
              <Typography variant="h6">Filtros de Tarifarios de cliente</Typography>
              <Icon className={isAcordeonFiltroPlantillaesExpanded ? "c-arriba-simple" : "c-abajo-simple"} />
            </Box>
          }
          cuerpo={
            <Box display="flex" flexDirection="column" px={1}>
              <FormularioCotizacion
                inputsReadOnly={[]}
                inputsToHide={camposDeFiltro}
                groupsToHide={gruposDeFiltro}
                tipoFormulario="filtro"
                handleFiltrar={handleFiltradoPlantillaes}
                isLoading={isLoading}
              />
            </Box>
          }
        />
      </Grid>

      <Grid mb={2}>
        <TablaGestionCabeceraCotizacion
          reconsultar={reconsultar}
          setReconsultar={setReconsultar}
          handleClean={handleClean}
          handleNew={handleNew}
          filtros={filtroPlantillaes}
          isLoading={isLoading}
          handleSelectRow={handleSelectRow}
          setListaPlantillaes={setListaPlantillaes}
        />
      </Grid>

      {plantillaSeleccionada && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Información",
              content: (
                <>
                  <Grid container>
                    <Grid container size={"grow"} columnSpacing={3} direction="row" pl={2}>
                      <Grid size={`auto`}>
                        <Typography sx={{ fontSize: 20 }}>
                          Tarifa de cliente {isNewPlantilla ? "NUEVA" : plantillaSeleccionada?.value} {}
                        </Typography>
                      </Grid>
                      <FormularioCotizacion
                        // inputsReadOnly={["fecha", ...(!isNewPlantilla ? (plantillaSeleccionada.cod_estado === CODS_ESTADOS.CONFIRMADO ? camposEdicionConfirmado : camposEdicionNormal) : [])]}
                        clearForm={clearForm}
                        setClearForm={setClearForm}
                        tipoFormulario={isNewPlantilla ? "ingreso" : "edicion"}
                        defaultValues={plantillaSeleccionada}
                        handleInsertar={handleClickInsert}
                        handleActualizar={handleClickSave}
                        inputsToHide={camposDeFormulario}
                        setValoresSoloCodigos={setValoresSoloCodigos}
                      />
                    </Grid>
                    {/* <pre>{JSON.stringify(plantillaSeleccionada, null, 2)}</pre> */}
                  </Grid>
                </>
              ),
            },
            ...(isNewPlantilla || !plantillaSeleccionada
              ? []
              : [
                  {
                    id: 2,
                    label: "Rubros Due Agent",
                    content: (
                      <Grid container p={2}>
                        <Grid
                          size="auto"
                          container
                          p={2}
                          sx={{
                            border: "1px solid",
                            borderColor: "gray.100",
                            boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                            borderRadius: 2,
                            position: "relative",
                          }}
                        >
                          <Stack container direction="column" size={"auto"} bgcolor="#104f9c" spacing={2} justifyContent="center" alignItems="center" borderRadius={1.2} py={2} my={1}>
                            <Grid size={"auto"}>
                              <Typography sx={{ writingMode: "vertical-rl", rotate: "180deg", color: "white.main", fontSize: 20, letterSpacing: 3 }}>DUE AGENT</Typography>
                            </Grid>
                            <Grid size={"grow"} bgcolor="#fff" justifyContent="center" alignItems="center" mx={0} px={0.2} />
                          </Stack>
                          <Grid p={2}>
                            <Grid px={0}>
                              <Divider
                                color={"primary.main"}
                                textAlign="left"
                                p={0}
                                m={0}
                                sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
                              >
                                <Typography color={"text"}>Rubros Due Agent</Typography>
                              </Divider>
                              <Typography color={"text"} variant={"overline"}>
                                Seleccione los rubros Due Agent para este cliente.
                                <Typography component="b" variant="b" color="primary">
                                  RUTAS
                                </Typography>
                                .
                                <br />
                                <Typography variant="caption">Los rubros obligatorios son seleccionados automáticamente.</Typography>
                              </Typography>
                            </Grid>
                            <Grid size="auto" p={2} sx={{ maxHeight: "30vh", overflowY: "auto" }}>
                              {serviciosProcessados.length
                                ? serviciosProcessados.map((s) => {
                                    const esObligatorioYRubroUnico = validarSiRubroEsObligatorioYSoloTieneUnServicio(s.cod_rubro);

                                    return (
                                      <Grid
                                        width="100%"
                                        onClick={() =>
                                          esObligatorioYRubroUnico
                                            ? null
                                            : isRubroSeleccionado(s.cod_rubro) && !dueAgentSelect[s.key]
                                              ? null
                                              : setDueAgentSelect((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
                                        }
                                        key={s.cod_servicio}
                                        container
                                        alignItems="center"
                                        columnSpacing={1}
                                        wrap="nowrap"
                                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "primary.main_5" } }}
                                      >
                                        {!esObligatorioYRubroUnico && (
                                          <Checkbox disabled={isRubroSeleccionado(s.cod_rubro) && !dueAgentSelect[s.key]} key={`checkbox-${dueAgentSelect[s.key]}`} checked={dueAgentSelect[s.key]} />
                                        )}
                                        <Grid container width="100%" alignItems="center" columnSpacing={1} wrap="nowrap">
                                          <GenerarCeldaNombre textAlign="left" nombre={`${s?.siglas && `[${s?.siglas}] `}`} nombre_proveedor={" "} />
                                          <GenerarCeldaNombre textAlign="left" nombre={`${s?.nombre && ` ${s?.nombre}`}`} nombre_proveedor={getRubroNombreByCod(s.cod_rubro)} />
                                        </Grid>
                                      </Grid>
                                    );
                                  })
                                : null}
                            </Grid>
                          </Grid>
                        </Grid>
                        <Grid
                          size="grow"
                          container
                          p={2}
                          sx={{
                            border: "1px solid",
                            borderColor: "gray.100",
                            boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                            borderRadius: 2,
                            position: "relative",
                          }}
                        >
                          <Stack container direction="column" size={"auto"} bgcolor="#104f9c" spacing={2} justifyContent="center" alignItems="center" borderRadius={1.2} py={2} my={1}>
                            <Grid size={"auto"}>
                              <Typography sx={{ writingMode: "vertical-rl", rotate: "180deg", color: "white.main", fontSize: 20, letterSpacing: 3 }}>RUBROS SELECCIONADOS</Typography>
                            </Grid>
                          </Stack>
                          <Grid p={2} size="grow">
                            <Grid px={0}>
                              <Divider
                                color={"primary.main"}
                                textAlign="left"
                                p={0}
                                m={0}
                                sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
                              >
                                <Typography color={"text"}>Rubros Due Agent</Typography>
                              </Divider>
                              <Typography color={"text"} variant={"overline"}>
                                <Typography variant="caption">Los rubros obligatorios no pueden ser eliminados</Typography>
                              </Typography>
                            </Grid>
                            <Grid px={0} size="grow">
                              <Grid width="100%" p={2} sx={{ maxHeight: "30vh", overflowY: "auto" }} rowSpacing={2}>
                                {Object.entries(dueAgentSelect).map(([key, value]) => {
                                  if (!value) return null;
                                  const [servicioId, rubroId] = key.split("|");
                                  const servicio = catalogos.servicios.find((s) => s.cod_servicio === Number(servicioId) && s.cod_rubro === Number(rubroId));
                                  if (!servicio) return null;
                                  const esObligatorioYRubroUnico = validarSiRubroEsObligatorioYSoloTieneUnServicio(Number(rubroId));
                                  return (
                                    <Grid key={key} container direction="row" columnSpacing={1} wrap="nowrap" sx={{ "&:hover": { bgcolor: "primary.main_5" } }}>
                                      {!esObligatorioYRubroUnico && (
                                        <TooltipComponent titulo={"Quitar de la lista"} borderColor="error.main">
                                          <Grid size="auto" p={0} my="auto" sx={{ "&:hover": { cursor: "pointer", bgcolor: "black.main_20" }, borderRadius: 2, height: "auto", textAlign: "center" }}>
                                            <Typography
                                              onClick={() => setDueAgentSelect((prev) => ({ ...prev, [key]: !prev[key] }))}
                                              className="c-cancelar"
                                              color="error.main"
                                              fontWeight="bold"
                                              sx={{ px: 0.5 }}
                                            />
                                          </Grid>
                                        </TooltipComponent>
                                      )}
                                      <Grid key={key} width="100%" container direction="row" alignItems="center" columnSpacing={1} wrap="nowrap">
                                        <GenerarCeldaNombre textAlign="left" nombre={`${servicio?.siglas && `[${servicio?.siglas}] `}`} nombre_proveedor={" "} />
                                        <GenerarCeldaNombre textAlign="left" nombre={`${servicio?.nombre && ` ${servicio?.nombre}`}`} nombre_proveedor={getRubroNombreByCod(servicio.cod_rubro)} />
                                      </Grid>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                        <Grid mt={2} size="auto" width="100%" textAlign="right">
                          <Button {...{ variant: "contained" }} onClick={() => handleClickSaveRubros(plantillaSeleccionada)}>
                            Guardar rubros
                          </Button>
                        </Grid>
                      </Grid>
                    ),
                  },
                ]),
          ]}
        />
      )}

      {/* <Button onClick={() => setOpen(true)}>Abrir Calculadora</Button> */}
      {/* <CalculadoraDeCantidadYMedidas agregar={() => {}} open={open} setOpen={setOpen} /> */}
      <LoaderComponent open={isLoading} texto="Cargando..." />
    </Box>
  );
};

export default GestionPlantilla;
