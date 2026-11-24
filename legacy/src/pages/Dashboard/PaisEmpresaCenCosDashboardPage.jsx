import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Grid, Step, StepButton, StepLabel, Stepper, Typography } from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import FONDO3 from "../../assets/FONDO2.jpg";
import { useObtenerCentrosCostoPorEmpresaActual, useObtenerEmpresasPorPaisActual, useObtenerPaises } from "../../hooks/useObtenerPermisos";
import { setCurrentCentroCosto, setCurrentEmpresa, setCurrentPais } from "../../store/slices/menu/menuSlice";
import { useDispatch, useSelector } from "react-redux";
import { describe } from "vitest";
import lightScroll from "../../style/scrollStyle";
import { generarTrasision } from "../../utils/generarTransision";
import { setDashboardAccessGranted } from "../../store/slices/auth/authSlice";
const steps = ["Pais", "Empresa", "Centro de Costo", "Acciones"];
const stepsProps = {
  Pais: {
    icon: "c-mundo",
    descripcion: "Selecciona el país al que deseas acceder para ver su información relevante y realizar acciones específicas.",
  },
  Empresa: {
    icon: "c-empresa",
    descripcion: "Selecciona la empresa dentro del país elegido para acceder a su información y funcionalidades específicas.",
  },
  "Centro de Costo": {
    icon: "c-bodega",
    descripcion: "Elige el centro de costo dentro de la empresa seleccionada para acceder a su información y funcionalidades específicas.",
  },
  Acciones: {
    icon: "c-lista-checkbox",
    descripcion: "Elige la acción que deseas realizar en el centro de costo seleccionado.",
  },
};
const acciones = [
  { cod_accion: 1, nombre_accion: "Solicitar un Trámite", icono: "c-documento" },
  { cod_accion: 2, nombre_accion: "Consultar información", icono: "c-informacion" },
  { cod_accion: 3, nombre_accion: "Configurar cuentas", icono: "c-configuracion" },
];

const ColorlStepIcon = (props) => {
  const { active, completed, className, icon } = props;

  const color = active ? "black.main" : completed ? "white.main" : "grey.200";
  const bgcolor = active ? "white.main" : completed ? "#0B2967" : "grey.700";

  const icons = {
    1: <Typography fontSize={20} borderRadius={10} px={1} py={0.5} bgcolor={bgcolor} color={color} className={stepsProps["Pais"]?.icon} />,
    2: <Typography fontSize={20} borderRadius={10} px={1} py={0.5} bgcolor={bgcolor} color={color} className={stepsProps["Empresa"]?.icon} />,
    3: <Typography fontSize={20} borderRadius={10} px={1} py={0.5} bgcolor={bgcolor} color={color} className={stepsProps["Centro de Costo"]?.icon} />,
    4: <Typography fontSize={20} borderRadius={10} px={1} py={0.5} bgcolor={bgcolor} color={color} className={stepsProps["Acciones"]?.icon} />,
  };

  return icons[String(props.icon)];
};

const ColorStepLabel = (props) => {
  const { children, className, ownerState } = props;
  const { active, completed, disabled } = ownerState;

  const color = active ? "text.main" : completed ? "#0B2967" : "grey.700";

  return (
    <Typography fontSize="1.3vw" fontWeight={100} className={className} color={color}>
      {children}
    </Typography>
  );
};

const PaisEmpresaCenCosDashboardPage = (props) => {
  const { grantAccess } = props;
  const dispatch = useDispatch();
  const paisesAutorizados = useObtenerPaises();
  const empresasAutorizadas = useObtenerEmpresasPorPaisActual();
  const centrosCostoAutorizados = useObtenerCentrosCostoPorEmpresaActual();
  const [currentStep, setCurrentStep] = useState(0);
  const [seleccionados, setSeleccionados] = useState({ pais: null, empresa: null, centroCosto: null });
  const [accionesSeleccionadas, setAccionesSeleccionadas] = useState({});

  const { currentCentroCosto, currentEmpresa, currentPais } = useSelector((state) => state.menu);

  useEffect(() => {
    setAccionesSeleccionadas(acciones.reduce((acc, accion) => ({ ...acc, [accion.cod_accion]: false }), {}));
  }, []);

  const catalogo = useMemo(() => {
    if (currentStep === 0) return paisesAutorizados;
    if (currentStep === 1) return empresasAutorizadas;
    if (currentStep === 2) return centrosCostoAutorizados;
    return [];
  }, [currentStep, paisesAutorizados, empresasAutorizadas, centrosCostoAutorizados]);
  const label = useCallback((item) => {
    if (item === 0) return "nombre_pais";
    if (item === 1) return "nombre_emp";
    if (item === 2) return "nombre_cc";
    return "";
  }, []);
  const catalogo_key = useCallback((item) => {
    if (item === 0) return "cod_pais";
    if (item === 1) return "cod_empresa";
    if (item === 2) return "cod_cc";
    return "";
  }, []);

  const funcionSeleccion = useCallback(
    (item) => {
      if (currentStep === 0) {
        setCurrentStep(1);
        setSeleccionados((prev) => ({ ...prev, pais: item }));
        dispatch(setCurrentPais(item));
        dispatch(setCurrentEmpresa(null));
        dispatch(setCurrentCentroCosto(null));
        return;
      } else if (currentStep === 1) {
        setCurrentStep(2);
        setSeleccionados((prev) => ({ ...prev, empresa: item }));
        dispatch(setCurrentEmpresa(item));
        dispatch(setCurrentCentroCosto(null));
        return;
      } else if (currentStep === 2) {
        setCurrentStep(3);
        setSeleccionados((prev) => ({ ...prev, centroCosto: item }));
        dispatch(setCurrentCentroCosto(item));
        return;
      }
    },
    [currentStep, dispatch],
  );

  const handleRegresar = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const RenderizarCard = ({ item, currentStepSelected = currentStep, onClick = true, readonly = false }) => {
    return (
      <Grid
        my="auto"
        key={item?.[catalogo_key(currentStepSelected)]}
        borderRadius={5}
        textAlign="center"
        sx={{
          maxWidth: "15vw",
          minWidth: "15vw",
          bgcolor: readonly ? "grey.main_20" : "background.main_20",
          border: readonly ? "" : "solid #104f9c69",
          borderWidth: 3,
          display: "block",
          position: "relative",
          overflow: "hidden",
          transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "0.1" }]),
          "& .contenido": {
            width: "100%",
            mx: "auto",
            transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "0.1" }]),
          },
          "& .checked": {
            width: "20%",
            position: "absolute",
            display: "none",
            top: 0,
            left: 0,
            transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "0.1" }]),
          },

          "&:hover": onClick && {
            borderWidth: 5,
            cursor: "pointer",
            borderColor: "#063166",
            "& .checked": { display: "block" },
            bgcolor: "background.400_20",
            boxShadow: "0px 0px 10px #00010161",
            // color: "white.main",
          },
        }}
        onClick={() => onClick && funcionSeleccion(item)}
        container
        direction="row"
      >
        <Grid my="auto" width="100%" py={1} justifyItems="center" justifySelf="center" className="contenido">
          {currentStepSelected === 0 && (
            <Typography
              width="5vh"
              height="5vh"
              mx="auto"
              sx={{ backgroundImage: `url(/banderas/${item?.[catalogo_key(currentStepSelected)]}.svg)`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
            />
          )}
          <Typography fontSize="3vh">{item?.[label(currentStepSelected)]}</Typography>
        </Grid>
      </Grid>
    );
  };

  const GenerarCardAccion = useCallback(
    ({ item = {}, onClick }) => {
      return (
        <Grid
          size={12}
          container
          my="auto"
          borderRadius={2}
          sx={{
            borderWidth: 2,
            position: "relative",
            overflow: "hidden",
            transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "0.1" }]),
            // boxShadow: "0px 0px 5px #104f9ca2",
            bgcolor: "background.main_20",
          }}
        >
          <ToggleButton
            value={item.cod_accion}
            sx={{ width: "100%", height: "100%", p: 0, m: 0, py: 1, color: "#000", "&.Mui-selected": { color: "#104f9c" } }}
            color="primary"
            selected={accionesSeleccionadas[item.cod_accion]}
            onChange={() => setAccionesSeleccionadas((prev) => ({ ...prev, [item.cod_accion]: !prev[item.cod_accion] }))}
          >
            <Grid container direction="row" width="100%">
              <Grid size={2} my="auto" textAlign="center">
                <Typography fontSize="2vh" className={item.icono} />
              </Grid>
              <Grid size="grow" my="auto" textAlign="left">
                <Typography fontSize="2vh">{item.nombre_accion}</Typography>
              </Grid>
              {accionesSeleccionadas[item.cod_accion] && (
                <Grid size={2} my="auto" textAlign="center">
                  <Typography fontSize="2vh" className="c-circulo-cheque" />
                </Grid>
              )}
            </Grid>
          </ToggleButton>
        </Grid>
      );
    },
    [accionesSeleccionadas],
  );

  const onStepClick = useCallback(
    (label) => {
      const step = steps.indexOf(label);
      const pais = null;
      const empresa = null;
      const centroCosto = null;

      if (currentStep === step) return;
      if (step > currentStep) return;

      if (step === 0) {
        dispatch(setCurrentPais(pais));
        dispatch(setCurrentEmpresa(empresa));
        dispatch(setCurrentCentroCosto(centroCosto));
        setSeleccionados((prev) => ({ ...prev, pais, empresa, centroCosto }));
      } else if (step === 1) {
        dispatch(setCurrentEmpresa(empresa));
        dispatch(setCurrentCentroCosto(centroCosto));
        setSeleccionados((prev) => ({ ...prev, empresa, centroCosto }));
      } else if (step === 2) {
        dispatch(setCurrentCentroCosto(centroCosto));
        setSeleccionados((prev) => ({ ...prev, centroCosto }));
      } else if (step === 3) return;
      setCurrentStep(step);
    },
    [currentStep, dispatch],
  );

  const confirmLoginCredentials = () => {
    dispatch(setDashboardAccessGranted(true));
    sessionStorage.setItem("dashboardAccessGranted", "true");
    grantAccess(true);
  };

  useEffect(() => {
    console.log("currentPais: ", currentPais);
    console.log("currentEmpresa: ", currentEmpresa);
    console.log("currentCentroCosto: ", currentCentroCosto);

    if (currentPais && currentEmpresa && currentCentroCosto) {
      setSeleccionados((prev) => ({ ...prev, pais: currentPais, empresa: currentEmpresa, centroCosto: currentCentroCosto }));
      setCurrentStep(3);
    } else if (currentPais && currentEmpresa) {
      setSeleccionados((prev) => ({ ...prev, pais: currentPais, empresa: currentEmpresa }));
      setCurrentStep(2);
    } else if (currentPais) {
      setSeleccionados((prev) => ({ ...prev, pais: currentPais }));
      setCurrentStep(1);
    }
  }, []);

  return (
    <Grid
      container
      direction="row"
      rowSpacing={1}
      py={8}
      px={5}
      columnSpacing={1}
      width="100%"
      id="PaisDashboardPage"
      sx={{
        minWidth: "100vw",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <Grid
        container
        direction="column"
        rowSpacing={1}
        columnSpacing={1}
        width="100%"
        id="PaisDashboardPage"
        sx={{
          backgroundImage: `url(${FONDO3})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
      />
      <Grid size="grow" />
      <Grid
        size={6}
        borderRadius={2}
        height="70vh"
        sx={{
          bgcolor: "background.main_50",
          borderRadius: 5,
          transition: "flex .5s ease-in-out,  margin .5s ease-in-out, width .5s ease-in-out, border-radius .5s ease-in-out;",
          boxShadow: "0px 0px 30px #104f9c",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          pb: 6,
          pt: 2,
          px: 2,
          // "& div": { border: "1px solid #104f9c !important" },
        }}
        container
        columns={12}
      >
        <Grid size={12} height="20%" container direction="row" justifyContent="space-around" alignItems="center" px={3}>
          <Grid size="grow">
            <Stepper alternativeLabel activeStep={currentStep}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepButton onClick={() => onStepClick(label)} sx={{ borderRadius: 3 }}>
                    <StepLabel slots={{ stepIcon: ColorlStepIcon, label: ColorStepLabel }}>{label}</StepLabel>
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          </Grid>
          {/* <Grid size="auto">
            <Button variant="outlined" color="primary" onClick={handleRegresar} disabled={currentStep === 0}>
              <Typography className="c-derecha-abajo-izquierda" mr={1} />
              Regresar
            </Button>
          </Grid> */}
        </Grid>
        <Grid
          size={!seleccionados.pais ? 0 : 4}
          height="80%"
          // height={!seleccionados.pais ? 0 : "20%"}
          // size={12}
          container
          direction="row"
          rowSpacing={5}
          alignContent="center"
          // justifyContent="space-evenly"
          // alignItems="center"
          // width="100%"
          sx={{
            transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "0.5" }]),
          }}
        >
          <Grid
            // size="auto"
            sx={{
              // height: seleccionados.pais ? undefined : 0,
              width: seleccionados.pais ? undefined : 0,
              opacity: seleccionados.pais ? 1 : 0,
              transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "1" }]),
            }}
          >
            <RenderizarCard item={seleccionados.pais} currentStepSelected={0} onClick={false} readonly={true} />
          </Grid>
          <Grid
            // size="auto"
            sx={{
              // height: seleccionados.empresa ? undefined : 0,
              width: seleccionados.empresa ? undefined : 0,
              opacity: seleccionados.empresa ? 1 : 0,
              transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "1" }]),
            }}
          >
            <RenderizarCard item={seleccionados.empresa} currentStepSelected={1} onClick={false} readonly={true} />
          </Grid>
          <Grid
            // size="auto"
            sx={{
              // height: seleccionados.centroCosto ? undefined : 0,
              width: seleccionados.centroCosto ? undefined : 0,
              opacity: seleccionados.centroCosto ? 1 : 0,
              transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "1" }]),
            }}
          >
            <RenderizarCard item={seleccionados.centroCosto} currentStepSelected={2} onClick={false} readonly={true} />
          </Grid>
        </Grid>
        <Grid
          // height="60%"
          // size={12}
          // height={currentStep === 3 ? "25vh" : "80%"}
          size={"grow"}
          container
          direction="column"
          sx={{
            transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "0.5" }]),
          }}
        >
          {currentStep !== 3 ? (
            <Grid
              container
              size="grow"
              direction="row"
              px={3}
              justifyContent="space-evenly"
              spacing={2}
              sx={{ overflow: "auto", transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "0.5" }]) }}
              zIndex={3}
            >
              {(catalogo || []).map((item) => (
                <RenderizarCard key={item.id} item={item} />
              ))}
            </Grid>
          ) : (
            <Grid
              container
              size="grow"
              direction="row"
              px={3}
              justifyContent="space-evenly"
              spacing={2}
              sx={{ overflow: "auto", transition: generarTrasision([{ propiedad: "all", tipo: "", tiempo: "0.5" }]) }}
              zIndex={3}
            >
              {/* <Grid container direction="column" p={3} sx={{ bgcolor: "white.main_10", borderRadius: 5 }} my="auto" bgcolor="white.main_50">
                <Grid px={3}>¿Que deseas hacer hoy?</Grid>
                <Grid container direction="row" rowSpacing={0} p={2} sx={{ overflowY: "auto", maxHeight: "25vh", ...lightScroll }} justifyContent="space-evenly">
                  {acciones.map((item) => (
                    <GenerarCardAccion item={item} key={item.cod_accion} onClick={() => {}} />
                  ))}
                </Grid>
              </Grid> */}
            </Grid>
          )}
          {currentStep === 3 && (
            <Grid size={12} width="100%" textAlign="right" pb={2}>
              <Button variant="outlined" onClick={confirmLoginCredentials}>
                Continuar
                <Typography className="c-izquierda-arriba-derecha" ml={1} />
              </Button>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid size="grow" />
    </Grid>
  );
};

PaisEmpresaCenCosDashboardPage.propTypes = {
  grantAccess: PropTypes.func,
};

export default PaisEmpresaCenCosDashboardPage;
