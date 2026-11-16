import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
import FormularioCotizacion from "../FormularioCotizacion/FormularioCotizacion";
import AcordeonComponent2 from "../../../../components/AcordeonComponent/AcordeonComponent2";
import CalculadoraDeCantidadYMedidas from "../../../../components/Tarifas/CalculoTarifasSinPlantillas/CalculadoraDeCantidadYMedidas";
import useCatalogosCotizacion from "../hooks/useCatalogosCotizacion";
import TablaGestionCabeceraCotizacion from "./components/TablaGestionCabeceraCotizacion/TablaGestionCabeceraCotizacion";
import { useFetchCotizaciones } from "../../../../hooks/Fetch/useFetchTarifas";
import { useSelector } from "react-redux";
import LoaderComponent from "../../../../components/Loader/LoaderComponent";
import useObtenerOpcionesAcciones from "../../../../hooks/useObtenerOpcionesAcciones";
import { CODS_ESTADOS } from "../../../../constants/estados";
import { NonFullScreenPageMode } from "pdf-lib";
import TabComponent from "../../../../components/Tabs/TabComponent";
import { api } from "../../../../api";
import GridVersionesDetalles from "./components/GridVersionesDetalles/GridVersionesDetalles";
import { useParams } from "react-router-dom";
import { decryptId } from "../../../../api/encryptDecrypt";
import BandaAlertaComponent from "@/components/Alertas/BandaAlertaComponent";

const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

const gruposDeFiltro = ["carga"];
const camposDeFiltro = ["contacto", "tipoCarga", "clasificacionCarga", "tipoPuntoEnlaceOrigen", "tipoPuntoEnlaceDestino", "descripcion", "carrier"];
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
];
const camposDeFormulario = ["empresa", "centroCosto", "descripcion", "carrier"];

/**
 * @param {Object} props
 * @param {boolean} props.isCreationOnlyMode
 * @returns {React.ReactNode}
 * @description
 * PROCESO
 * 1. OBTENER CATALOGOS
 * 2. OBTENER LISTA DE COTIZACIONES BASADO EN EMPRESA / CENTRO DE COSTO
 * 3.a SI EXISTE UNA COTIZACION SELECCIONADA CONSULTARLA
 * 4.b SI NO EXISTE UNA COTIZACION SELECCIONADA CREAR UNA NUEVA COTIZACION
 * 5. SI SE REALIZA UN CALCULO DEBEMOS GUARDARLO EN LA BASE DE DATOS
 *
 * RENDERIZADOS
 * 1. RENDERIZAR FORMULARIO DE COTIZACION EN FORMA DE FILTRO
 * 2. RENDERIZAR LISTA DE COTIZACIONES
 * 3. RENDERIZAR UN TAB COMPONENT QUE PERMITA SELECCIONAR EL FORMULARIO DE LA COTIZACION O LA LISTA DE CALCULOS REALIZADOS
 *    3.1 SI SELECCIONA EL TAB DE FORMULARIO SE DEBE RENDERIZAR EL FORMULARIO DE LA COTIZACION EN MODO INGRESO / EDICIO O LECTURA
 *    3.2 SI SELECCIONA EL TAB DE LISTA DE CALCULOS SE DEBE RENDERIZAR
 *      3.2.1 TABLA DE LISTA DE VERSIONES CALCULADAS
 *      3.2.2 FORMULARIO DE CRITERIOS
 *      3.2.3 LISTA DE LOS CALCULOS 'DUE CARRIER'
 *      3.2.4 LISTA DE CALCULOS 'DUE AGENT'
 *      3.2.5 LISTA DE RUBROS SELECCIONADOS
 *      3.2.6 BOTON DE GUARDAR CALCULO
 *
 * LOS DATOS A CONSULTAR SON:
 * 1. LISTA COTIZACIONES (URL: /api/appweb/lista-cotizacion-cabecera)
 * 2. COTIZACION SELECCIONADO (URL: /api/appweb/obtener-cotizacion-cabecera?cod_cotizacion_cabecera=COTIZACION_SELECCIONADA
 *   2.1 LISTA DE VERSIONES / DETALLES DE COTIZACION SELECCIONADA (URL: /api/appweb/lista-cotizacion-detalle?cod_cotizacion_cabecera=COTIZACION_SELECCIONADA)
 *   2.2 LISTA DE CRITERIOS RELACIONADOS CON LA VERSION SELECCIONADA DE COTIZACION SELECCIONADA (URL: /api/appweb/lista-cotizacion-detalle-criterio?cod_cotizaciondetalle=DETALLE_SELECCIONADO)
 *   2.3 LISTA DE RUBROS RELACIONADOS CON LA VERSION SELECCIONADA DE COTIZACION SELECCIONADA (URL: /api/appweb/lista-cotizacion-detalle-rubro?cod_cotizaciondetalle=DETALLE_SELECCIONADO)
 *   2.4 LISTA DE DIMENSIONES RELACIONADOS CON LA VERSION SELECCIONADA DE COTIZACION SELECCIONADA (URL: /api/appweb/lista-cotizacion-detalle-dimension?cod_cotizaciondetalle=DETALLE_SELECCIONADO)
 *
 *
 * LOS CATALOGOS A OBTENER SON:
 * 1. EMPRESAS (URL: /api/appweb/listaempresas)
 * 2. CENTROS DE COSTO (URL: /api/appweb/listacentrocosto)
 * 3.q CLIENTES (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=CLIENTE&cod_estado=1)
 *   3.a.1. CONTACTOS (URL SIMPLE: /api/appweb/lista-entidad-contacto?cod_tipo=3&entidad_id=CLIENTE)
 * 3.b PRE-CLIENTE (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=PRECLIENTE&cod_estado=1)
 *   3.b.1. CONTACTOS (URL SIMPLE: /api/appweb/lista-entidad-contacto?cod_tipo=3&entidad_id=PRECLIENTE)
 * 3.C PROVEEDORES (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=PROVEEDOR&cod_estado=1)
 * 4. TIPO DE TRANSPORTE (URL: /api/appweb/lista-tipo?tipo_tabla=TRANSPORTE)
 * 5. TIPO DE SERVICIO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=SERVICIO)
 * 6. TIPO DE CARGA (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=CARGA)
 * 7. CLASIFICACION DE CARGA (URL: /api/appweb/lista-clasificaciones-carga)
 * 8. INCOTERMS (URL: /api/appweb/lista-incoterms)
 * 9. TIPO DE PAGO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=PAGO)
 * 10. PAISES (URL: /api/appweb/listapaises)
 * 11. TIPO DE PUNTO DE ENLACE (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=PUNTO_ENLACE)
 * 12. PUNTO DE ENLACE (URL: /api/appweb/listapuntoenlace)
 * 13. MONEDAS (URL: /api/appweb/lista-moneda)
 * 14. CARRIERS (URL: /api/appweb/lista-carrier)
 * 15. TIPO DE SEGUIMIENTO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=SEGUIMIENTO)
 * 16. TIPO DE CALCULO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=CALCULO)
 * 17. CRITERIOS (URL: /api/appweb/lista-criterios)
 */

const GestionCotizacion = (props) => {
  // ─────────────────────────────
  // Debug
  // ─────────────────────────────
  // console.log("GestionCotizacion renderizado");

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
  const [isLoadingTabla, setIsLoadingTabla] = useState(false);
  const { isLoading: isLoadingCotizaciones, plantillasRubros, clearPlantillasRubrosCliente, obtenerPlantillaRubrosDeCliente } = useCatalogosCotizacion();
  const permisosArray = useObtenerOpcionesAcciones();
  const fetchCotizaciones = useFetchCotizaciones();

  const isLoading = React.useMemo(() => isLoadingCotizaciones || isLoadingTabla, [isLoadingCotizaciones, isLoadingTabla]);

  // ─────────────────────────────
  // Estados
  // ─────────────────────────────
  const [filtroCotizaciones, setFiltroCotizaciones] = useState({
    cod_empresa: currentEmpresa?.cod_empresa,
    cod_cc: currentCentroCosto?.cod_cc,
  });

  const [reconsultar, setReconsultar] = useState(false);

  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [versionSeleccionada, setVersionSeleccionada] = useState(null);
  const [open, setOpen] = useState(false);
  const [isNewCotizacion, setIsNewCotizacion] = useState(false);
  const [clearForm, setClearForm] = useState(false);
  const [esFormularioValido, setEsFormularioValido] = useState(false);
  const [listaCotizaciones, setListaCotizaciones] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);

  const [isAcordeonFiltroCotizacionesExpanded, setIsAcordeonFiltroCotizacionesExpanded] = useState(false);
  const [isAcordeonInformacionCotizacionesExpanded, setIsAcordeonInformacionCotizacionesExpanded] = useState(false);

  const obtenerAccionesSegunPermisos = useMemo(() => {
    let item = permisosArray["catalogoArray"][0]?.acciones || [];
    return item.reduce((acc, val) => ({ ...acc, [val.cod_accion]: val }), {});
  }, [permisosArray]);

  const [tabActual, setTabActual] = useState(0);

  // ─────────────────────────────
  // Derivados
  // ─────────────────────────────
  const formRef = useRef(null);

  // ─────────────────────────────
  // Derivados
  // ─────────────────────────────

  // ─────────────────────────────
  // Handlers
  // ─────────────────────────────
  const handleFiltradoCotizaciones = useCallback((values) => {
    const obj = {};

    Object.entries(values).map(([key, value]) => {
      if (!value) return;
      obj[key] = value;
    });

    setFiltroCotizaciones((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(obj)) return prev;
      return obj;
    });
  }, []);

  const toggleAcordeon = (p, exp) => {
    p.preventDefault();
    if (exp === undefined) return;
    setIsAcordeonFiltroCotizacionesExpanded(exp);
  };

  const toggleAcordeonInformacion = (p, exp) => {
    p.preventDefault();
    if (exp === undefined) return;
    setIsAcordeonInformacionCotizacionesExpanded(exp);
  };

  const handleSelectRow = useCallback(
    (id, row) => {
      setIsNewCotizacion(false);
      setPlantillaSeleccionada(null);
      clearPlantillasRubrosCliente();
      setCotizacionSeleccionada(row);
      setIsAcordeonInformacionCotizacionesExpanded(true);
    },
    [clearPlantillasRubrosCliente],
  );

  const handleClean = useCallback(() => {
    setIsNewCotizacion(false);
    setClearForm(true);
    setPlantillaSeleccionada(null);
    clearPlantillasRubrosCliente();
    setCotizacionSeleccionada(null);
    setTabActual(1);
  }, [clearPlantillasRubrosCliente]);

  const handleNew = useCallback(() => {
    setIsNewCotizacion(true);
    setClearForm(true);
    setPlantillaSeleccionada(null);
    clearPlantillasRubrosCliente();
    setCotizacionSeleccionada(filtroCotizaciones);
    setIsAcordeonInformacionCotizacionesExpanded(true);
    setTabActual(1);
  }, [filtroCotizaciones, clearPlantillasRubrosCliente]);

  const handleClickInsert = useCallback(async (cotizacion) => {
    await api.post("api/appweb/insertar-cotizacion-cabecera", { ...cotizacion, cod_estado: cotizacion.cod_estado ?? CODS_ESTADOS.ACTIVO }).then(({ data }) => {
      console.log("Cotización insertada con éxito", data.data);
      setCotizacionSeleccionada({ ...cotizacion, value: data.data.cod_cotizacion_cabecera, cod_cotizacion_cabecera: data.data.cod_cotizacion_cabecera });
    });
    setReconsultar(true);
    setIsNewCotizacion(false);
  }, []);

  const handleClickSave = useCallback(async (cotizacion) => {
    const cotizacionParaGuardar = {
      ...cotizacion,
      cod_estado: cotizacion.cod_estado || cotizacion.estado?.value || CODS_ESTADOS.ACTIVO,
    };

    await api.post("api/appweb/actualizar-cotizacion-cabecera", cotizacionParaGuardar);

    console.log("Cotización actualizada con éxito", cotizacionParaGuardar.entidadcontacto_id);

    setCotizacionSeleccionada((prev) => ({
      ...prev,
      ...cotizacionParaGuardar,

      // NUEVO: protege el contacto si el formulario lo mandó vacío por timing
      entidadcontacto_id: cotizacionParaGuardar.entidadcontacto_id ?? prev?.entidadcontacto_id,
    }));

    setReconsultar(true);
  }, []);

  const obtenerCotizacionDesdeURL = useCallback(async () => {
    // 1️⃣ si no viene por URL, no hacemos nada
    if (!encryptedId) return;

    // 2️⃣ si la consulta aún no terminó, esperamos
    if (!listaCotizaciones.length) return;

    // 3️⃣ buscamos en LA lista final
    const idCabecera = decryptId(encryptedId);

    const cotizacion = (fetchCotizaciones.data || []).find((c) => c.cod_cotizacion_cabecera === Number(idCabecera));

    console.log("Cotización seleccionada:", decryptId(encryptedId), "-", cotizacion, "-", listaCotizaciones);

    // 4️⃣ si no existe, no hacemos nada
    if (!cotizacion) return;

    // 5️⃣ seleccionamos
    await setCotizacionSeleccionada(cotizacion);

    // (opcional) disparar dependencias

    console.log("Cotización seleccionada desde URL:", cotizacion);

    handleSelectRow(idCabecera, cotizacion);
  }, [encryptedId, handleSelectRow, listaCotizaciones, fetchCotizaciones.data]);

  useEffect(() => {
    if (!cotizacionSeleccionada) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [cotizacionSeleccionada]);

  useEffect(() => {
    obtenerCotizacionDesdeURL();
  }, [encryptedId, listaCotizaciones, obtenerCotizacionDesdeURL]);

  useEffect(() => {
    if (plantillaSeleccionada) obtenerPlantillaRubrosDeCliente({ cod_tarifaplantilla: plantillaSeleccionada.value });
    else setPlantillaSeleccionada(null);
  }, [obtenerPlantillaRubrosDeCliente, plantillaSeleccionada]);

  // const filtroProcesado = useMemo(() => {
  //   // camposFiltroConsulta
  //   return camposFiltroConsulta.reduce((campo, acc) => {
  //     if (filtroCotizaciones[campo]) return { ...acc, [campo]: filtroCotizaciones[campo] };
  //   }, {});
  // }, [filtroCotizaciones]);

  // ─────────────────────────────
  // Render
  // ─────────────────────────────

  return (
    <Box py={2}>
      <Grid sx={{ boxShadow: isAcordeonFiltroCotizacionesExpanded ? "2.5px 10px 10px rgba(0,0,0,0.2)" : undefined, mb: 2 }}>
        <AcordeonComponent2
          expandido={isAcordeonFiltroCotizacionesExpanded}
          expandir={toggleAcordeon}
          propiedades={{
            bgcolorAcordeon: "transparent",
            bgcolor: "primary.main",
            titulo: { color: "white.main" },
            borderRadius: 1.5,
          }}
          titulo={
            <Box display="flex" justifyContent="space-between" p={0.8} width="100%">
              <Typography variant="h6">Filtros de Cotizaciones</Typography>
              <Icon className={isAcordeonFiltroCotizacionesExpanded ? "c-arriba-simple" : "c-abajo-simple"} />
            </Box>
          }
          cuerpo={
            <Box display="flex" flexDirection="column" px={1}>
              <FormularioCotizacion
                inputsReadOnly={[]}
                inputsToHide={camposDeFiltro}
                groupsToHide={gruposDeFiltro}
                tipoFormulario="filtro"
                handleFiltrar={handleFiltradoCotizaciones}
                isLoading={isLoading}
                noPlantilla
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
          filtros={filtroCotizaciones}
          isLoading={isLoading}
          handleSelectRow={handleSelectRow}
          setListaCotizaciones={setListaCotizaciones}
          setIsLoading={setIsLoadingTabla}
        />
      </Grid>

      {cotizacionSeleccionada && (
        <Grid container ref={formRef}>
          <Grid container size={"grow"} columnSpacing={3} direction="row" pl={2}>
            <Grid size={`auto`}>
              <Typography sx={{ fontSize: 20 }}>
                COTIZACION {isNewCotizacion ? "NUEVA" : cotizacionSeleccionada?.value} {}
              </Typography>
            </Grid>

            <AcordeonComponent2
              expandido={isAcordeonInformacionCotizacionesExpanded}
              expandir={toggleAcordeonInformacion}
              titulo={
                <Box display="flex" justifyContent="space-between" p={0.8} width="100%">
                  <Typography variant="h6">Informacion</Typography>
                  <Icon className={isAcordeonInformacionCotizacionesExpanded ? "c-arriba-simple" : "c-abajo-simple"} />
                </Box>
              }
              propiedades={{
                bgcolorAcordeon: "transparent",
                bgcolor: "primary.main",
                titulo: { color: "white.main" },
                borderRadius: 1.5,
              }}
              cuerpo={
                <FormularioCotizacion
                  inputsReadOnly={["fecha", ...(!isNewCotizacion ? (cotizacionSeleccionada.cod_estado === CODS_ESTADOS.CONFIRMADO ? camposEdicionConfirmado : camposEdicionNormal) : [])]}
                  clearForm={clearForm}
                  setClearForm={setClearForm}
                  tipoFormulario={cotizacionSeleccionada.cod_version_activa ? "lectura" : isNewCotizacion ? "ingreso" : "edicion"}
                  defaultValues={cotizacionSeleccionada}
                  handleInsertar={handleClickInsert}
                  handleActualizar={handleClickSave}
                  inputsToHide={camposDeFormulario}
                  setPlantillaSeleccionada={setPlantillaSeleccionada}
                  setEsValido={setEsFormularioValido}
                  noPlantilla
                />
              }
            />
            {!isNewCotizacion ? (
              <Box sx={{ position: "relative" }}>
                <GridVersionesDetalles
                  lectura={!isNewCotizacion}
                  cotizacion={cotizacionSeleccionada}
                  plantillaSeleccionada={plantillaSeleccionada}
                  plantillasRubros={plantillaSeleccionada ? plantillasRubros : []}
                />
                {!esFormularioValido && (
                  <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", bgcolor: "background.main_50", zIndex: 200 }}>
                    <Box sx={{ display: "flex", width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
                      <BandaAlertaComponent
                        tipo="warning"
                        icono={<Typography className="c-alerta" fontSize={40} />}
                        content={
                          <Box height="20vh" my="auto" sx={{ display: "flex", width: "100%", justifyContent: "center", alignItems: "center" }}>
                            <Box my="auto" fontSize={40}>
                              Para realizar el calculo, favor de completar el formulario de información.
                            </Box>
                          </Box>
                        }
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            ) : null}

            {[
              {
                id: 1,
                label: "informacion",
                content: <></>,
              },
              !isNewCotizacion
                ? {
                    id: 2,
                    label: "Calculo",
                    content: (
                      <GridVersionesDetalles
                        lectura={!isNewCotizacion}
                        cotizacion={cotizacionSeleccionada}
                        plantillaSeleccionada={plantillaSeleccionada}
                        plantillasRubros={plantillaSeleccionada ? plantillasRubros : []}
                      />
                    ),
                  }
                : undefined,
            ]
              .filter((i) => i)
              .find((i) => i.id === tabActual)?.content ?? null}
          </Grid>
          {/* <pre>{JSON.stringify(cotizacionSeleccionada, null, 2)}</pre> */}
        </Grid>
      )}

      {/* <pre>{JSON.stringify(filtroCotizaciones, null, 2)}</pre> */}
      {/* <Button onClick={() => setOpen(true)}>Abrir Calculadora</Button> */}
      <CalculadoraDeCantidadYMedidas agregar={() => {}} open={open} setOpen={setOpen} />
      <LoaderComponent open={isLoading} texto="Cargando" />
    </Box>
  );
};

export default GestionCotizacion;
