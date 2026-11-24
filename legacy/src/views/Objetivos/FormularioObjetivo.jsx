import { useState, useCallback, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { CODS_ESTADOS } from "../../constants/estados";

const formatObjetivoToApiSubmissionFormat = (objetivo) => {
  return {
    ...objetivo,
    cod_tipo_actividad: objetivo.tipoActividad.value,
    cod_emp: objetivo.empresa.value,
    cod_cc: objetivo.centroCosto.value,
    cod_estado: objetivo.estado.value,
    cod_tipo_asignacion: objetivo.tipoAsignacion.value,
    cod_periodicidad: objetivo.periodicidad.value,
  };
};

const FormularioObjetivo = ({ isEditing = false, defaultValues }) => {
  const navigate = useNavigate();
  const isCreating = !defaultValues && isEditing;
  const [valores, setValores] = useState(() => {
    if (defaultValues)
      return {
        ...defaultValues,
        fecha_inicial: new Date(defaultValues.fecha_inicial),
        fecha_final: new Date(defaultValues.fecha_final),
      };

    return {
      descripcion: "",
      cantidad: null,
      tipoActividad: null,
      empresa: null,
      centroCosto: null,
      estado: { label: "Activo", value: 1 },
      tipoAsignacion: null,
      periodicidad: null,
      evaluar_creador: false,
      fecha_inicial: new Date(),
      fecha_final: new Date(),
    };
  });

  const [isOpenAlertErrores, setIsOpenAlertErrores] = useState(false);
  const [errores, setErrores] = useState([]);

  const [tiposActividades, setTiposActividades] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCostos, setCentrosCostos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodicidades, setPeriodicidades] = useState([]);
  const [tiposAsignacion, setTiposAsignacion] = useState([]);

  const optionsTiposActividades = tiposActividades
    .filter(
      (ta) =>
        ta.cod_emp === valores.empresa?.value &&
        ta.cod_cc === valores.centroCosto?.value &&
        ta.cod_estado === CODS_ESTADOS.ACTIVO,
    )
    .map((a) => ({ label: a.nom_tipo_actividad, value: a.cod_tipo_actividad }));
  const optionsEmpresas = empresas.map((e) => ({
    label: e.nombre_emp,
    value: e.cod_empresa,
  }));
  const optionsCentrosCostos = centrosCostos
    .filter((cc) => cc.cod_empresa_cc === valores.empresa?.value)
    .map((cc) => ({ label: cc.nombre_cc, value: cc.cod_cc }));
  const optionsEstados = estados.map((e) => ({
    label: e.estado_desc,
    value: e.cod_estado,
  }));
  const optionsPeriodicidades = periodicidades.map((p) => ({
    ...p,
    label: p.descripcion,
    value: p.cod_periodicidad,
  }));
  const optionsTiposAsignacion = tiposAsignacion.map((ta) => ({
    label: ta.nom_tipo,
    value: ta.cod_tipo,
  }));

  const obtenerTiposActividad = useCallback(async () => {
    const baseApiURL = "/api/appweb/lista-configuracion-actividad";
    const response = await api.get(baseApiURL);
    const tiposActividad = response.data.data;
    setTiposActividades(tiposActividad);
  }, []);

  const obtenerEmpresas = useCallback(async () => {
    const baseApiURL = "/api/appweb/listaempresas";
    const response = await api.get(baseApiURL);
    const empresas = response.data.data;
    setEmpresas(empresas);
  }, []);

  const obtenerCentrosCostos = useCallback(async () => {
    const baseApiURL = "/api/appweb/listacentrocosto";
    const response = await api.get(baseApiURL);
    const centrosCostos = response.data.data;
    setCentrosCostos(centrosCostos);
  }, []);

  const obtenerPeriodicidades = useCallback(async () => {
    const baseApiURL = "/api/appweb/lista-periodicidad";
    const response = await api.get(baseApiURL, { params: { cod_estado: 1 } });
    const periodicidades = response.data.data;
    setPeriodicidades(periodicidades);
  }, []);

  const obtenerTiposAsignacion = useCallback(async () => {
    const baseApiURL = "/api/appweb/lista-tipo";
    const response = await api.get(baseApiURL, {
      params: { tipo_tabla: "ASIGNACION_ENTIDAD" },
    });
    const tiposAsignacion = response.data.data;
    setTiposAsignacion(tiposAsignacion);
  }, []);

  const obtenerEstados = useCallback(async () => {
    const baseApiURL = "/api/appweb/listaestados";
    const response = await api.get(baseApiURL);
    const estados = response.data.data;
    setEstados(estados);
  }, []);

  useEffect(() => {
    Promise.all([
      obtenerTiposActividad(),
      obtenerEmpresas(),
      obtenerCentrosCostos(),
      obtenerPeriodicidades(),
      obtenerTiposAsignacion(),
      obtenerEstados(),
    ]).then(() => {});
  }, [
    obtenerTiposActividad,
    obtenerEmpresas,
    obtenerCentrosCostos,
    obtenerPeriodicidades,
    obtenerTiposAsignacion,
    obtenerEstados,
  ]);

  const inputs = [
    {
      tipo: "datetime",
      label: "Fecha Inicial",
      id: "fecha_inicial",
      val: valores.fecha_inicial,
      requerido: true,
      readonly: !isEditing,
    },
    {
      tipo: "datetime",
      label: "Fecha Final",
      id: "fecha_final",
      val: valores.fecha_final,
      requerido: true,
      readonly: !isEditing,
    },
    {
      tipo: "select",
      label: "Empresa",
      id: "empresa",
      options: optionsEmpresas,
      val: valores.empresa,
      requerido: true,
      readonly: !isEditing,
    },
    {
      tipo: "select",
      label: "Centro de Costo",
      id: "centroCosto",
      options: optionsCentrosCostos,
      val: valores.centroCosto,
      requerido: true,
      readonly: !isEditing || !valores.empresa,
    },
    {
      tipo: "text",
      label: "Descripción",
      id: "descripcion",
      val: valores.descripcion,
      requerido: true,
      readonly: !isEditing,
    },
    {
      tipo: "select",
      label: "Tipo de Actividad",
      id: "tipoActividad",
      options: optionsTiposActividades,
      val: valores.tipoActividad,
      requerido: true,
      readonly: !isEditing || !valores.centroCosto,
    },
    {
      tipo: "number",
      label: "Cantidad",
      id: "cantidad",
      val: valores.cantidad,
      requerido: true,
      readonly: !isEditing,
    },
    {
      tipo: "select",
      label: "Periodicidad",
      id: "periodicidad",
      options: optionsPeriodicidades,
      val: valores.periodicidad,
      requerido: true,
      readonly: !isEditing,
    },
    {
      tipo: "toggle",
      label: "Aplicar a Creador de actividad?",
      id: "evaluar_creador",
      val: valores.evaluar_creador,
      requerido: true,
      readonly: !isEditing,
    },
    {
      tipo: "select",
      label: "Tipo de Asignación",
      id: "tipoAsignacion",
      options: optionsTiposAsignacion,
      val: valores.tipoAsignacion,
      requerido: true,
      readonly: !isEditing,
    },
    {
      tipo: "select",
      label: "Estado",
      id: "estado",
      options: optionsEstados,
      val: valores.estado,
      requerido: true,
      readonly: !isEditing || isCreating,
      visible: !isCreating,
    },
  ];

  const handleInputChange = ({ id, val }) => {
    setValores((prev) => {
      const newValues = { ...prev, [id]: val };

      if (id === "empresa") {
        newValues.centroCosto = null;
        newValues.tipoActividad = null;
      }
      if (id === "centroCosto") {
        newValues.tipoActividad = null;
      }

      return newValues;
    });
  };

  const handleSubmitObjetivo = async () => {
    const errores = [];

    const ID_ESTADO_INACTIVO = 2;
    if (valores.cod_estado === ID_ESTADO_INACTIVO) {
      errores.push(
        "El estado del objetivo debe estar activo para poder ser editado.",
      );
      setErrores(errores);
      return setIsOpenAlertErrores(true);
    }

    if (!valores.fecha_inicial) {
      errores.push("Ingrese la fecha inicial.");
      setErrores(errores);
      return setIsOpenAlertErrores(true);
    }

    const fechaFinalMinima = new Date(valores.fecha_inicial);
    const daysToAdd = valores.periodicidad.no_dias;
    fechaFinalMinima.setDate(fechaFinalMinima.getDate() + daysToAdd);
    if (valores.fecha_final < fechaFinalMinima) {
      errores.push(
        "La fecha final debe ser mayor o igual a la fecha inicial más los días de la periodicidad.",
      );
    }

    if (errores.length) {
      setErrores(errores);
      return setIsOpenAlertErrores(true);
    }

    const baseApiURL = isCreating
      ? "/api/appweb/insertar-objetivos"
      : "/api/appweb/actualizar-objetivos";
    const reqBody = formatObjetivoToApiSubmissionFormat(valores);
    const response = await api.post(baseApiURL, reqBody);
    if (!response.data.data.success) return;
    const cod_objetivo = parseInt(response.data.data.cod_objetivo);
    if (isCreating) return navigate(-1, { replace: true });
  };

  return (
    <Box display="flex" flexDirection="column">
      <Typography variant="h4">
        {isCreating
          ? "Crear Objetivo"
          : isEditing
            ? `Editar Objetivo Cod. ${valores.cod_objetivo}`
            : `Ver Objetivo Cod. ${valores.cod_objetivo}`}
      </Typography>

      <FormularioComponent
        titulo="Objetivo"
        inputs={inputs}
        onInput={handleInputChange}
        botones={{
          agregar: { visible: isCreating, onClick: handleSubmitObjetivo },
          editar: {
            visible: !isCreating && isEditing,
            onClick: handleSubmitObjetivo,
          },
        }}
      />

      <ActionAlertComponent
        openDialog={isOpenAlertErrores}
        titulo="Error"
        tipo="error"
        activarAceptar={true}
        activarCanecelar={false}
        aceptar={() => setIsOpenAlertErrores(false)}
      >
        <Box display="flex" flexDirection="column">
          {errores.map((error) => (
            <Typography key={error} variant="body1">
              - {error}
            </Typography>
          ))}
        </Box>
      </ActionAlertComponent>
    </Box>
  );
};

FormularioObjetivo.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  defaultValues: PropTypes.object,
};

export default FormularioObjetivo;
