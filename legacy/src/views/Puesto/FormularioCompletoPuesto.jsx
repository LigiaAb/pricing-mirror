import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useLocation } from "react-router-dom";
import moment from "moment/moment";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import { useNavigate } from "react-router-dom/dist";
const FormularioCompletoPuesto = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    puesto, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    // estados = [],
    catalogos,
    actualizarItem,
  } = props;
  const { estados = [], empresas = [], centrosCosto = [], tiposAsignacion = [] } = catalogos;
  const location = useLocation();
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_puesto: 0,
    puesto_desc: "",
    cod_emp: null,
    cod_cc: null,
    cod_estado: { value: 1, label: "ACTIVO" },
    fecha_reg: null,
    ruta_inicial: "",
    cod_tipo_asignacion: null,
  });
  const [key, setKey] = useState(0);
  const navigate = useNavigate();

  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const { cod_puesto, puesto_desc, cod_emp, cod_cc, cod_estado, fecha_reg, cod_tipo_asignacion, ruta_inicial } = valores;
    return [
      { id: "cod_puesto", label: "Código", tipo: "number", val: cod_puesto, readonly: true, visible: !location.pathname.includes("new") },
      { id: "puesto_desc", label: "Descripción", tipo: "text", val: puesto_desc, readonly: location.pathname.includes("view") },
      {
        id: "cod_emp",
        label: "Empresa",
        tipo: "select",
        val: cod_emp,
        options: empresas.map((i) => ({ ...i, value: i.cod_empresa, label: i.nombre_emp })),
        readonly: location.pathname.includes("view"),
      },
      {
        id: "cod_cc",
        label: "Centro de Costo",
        tipo: "select",
        val: cod_cc,
        options: centrosCosto.filter((i) => i.cod_empresa_cc === cod_emp?.cod_empresa).map((i) => ({ ...i, value: i.cod_cc, label: i.nombre_cc })),
        readonly: location.pathname.includes("view"),
      },
      {
        id: "cod_tipo_asignacion",
        label: "Tipo de Asignacion",
        tipo: "select",
        val: cod_tipo_asignacion,
        options: tiposAsignacion.map((i) => ({ ...i, value: i.cod_tipo, label: i.nom_tipo })),
        readonly: location.pathname.includes("view"),
      },
      {
        id: "cod_estado",
        label: "Estado",
        tipo: "select",
        val: cod_estado,
        options: estados.map((i) => ({ ...i, value: i.cod_estado, label: i.estado_desc })),
        readonly: location.pathname.includes("view"),
      },
      { id: "ruta_inicial", label: "Ruta Inicial", tipo: "text", val: ruta_inicial, readonly: false },
    ];
  }, [valores, location.pathname, empresas, centrosCosto, tiposAsignacion, estados]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_puesto, puesto_desc, cod_emp, cod_cc, cod_estado, ruta_inicial, cod_tipo_asignacion, fecha_reg } = valores;
    await api
      .post("api/appweb/insertar-puesto", { cod_puesto, puesto_desc, cod_emp: cod_emp.value, cod_cc: cod_cc.value, cod_estado: cod_estado.value, cod_tipo_asignacion: cod_tipo_asignacion?.value })
      .then(({ data }) => navigate(`../${encryptId(data.data.cod_puesto)}`));
    await api
      .post("api/appweb/actualizar-json-puesto", {
        cod_puesto,
        json_puesto: JSON.stringify({ ruta_inicial, ...JSON.parse(puesto.json_puesto), configuracion: undefined }),
      })
      .then(() => {});
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(async () => {
    const { cod_puesto, puesto_desc, cod_emp, cod_cc, cod_estado, ruta_inicial, cod_tipo_asignacion, fecha_reg } = valores;
    await api
      .post("api/appweb/actualizar-puesto", { cod_puesto, puesto_desc, cod_emp: cod_emp.value, cod_cc: cod_cc.value, cod_estado: cod_estado.value, cod_tipo_asignacion: cod_tipo_asignacion?.value })
      .then(() => {});
    await api
      .post("api/appweb/actualizar-json-puesto", {
        cod_puesto,
        json_puesto: JSON.stringify({ ruta_inicial, tipo_asignacion: cod_tipo_asignacion, ...JSON.parse(puesto.json_puesto), configuracion: undefined }),
      })
      .then(() => {});
  }, [valores]);
  const filtrar = useCallback(() => {}, []);

  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const empresa = empresas.find((i) => i.cod_empresa === puesto.cod_emp);
      const centroCosto = centrosCosto.find((i) => i.cod_cc === puesto.cod_cc);
      const estado = estados.find((i) => i.cod_estado === puesto.cod_estado);
      const tipo_asignacion = tiposAsignacion.find((i) => i.cod_tipo === puesto.cod_tipo_asignacion);
      const ruta_inicial = JSON.parse(puesto?.json_puesto || "{}")?.ruta_inicial;
      return {
        ruta_inicial,
        cod_puesto: puesto.cod_puesto || 0,
        puesto_desc: puesto.puesto_desc || "",
        cod_emp: empresa ? { ...empresa, label: empresa?.nombre_emp, value: empresa?.cod_empresa } : null,
        cod_cc: centroCosto ? { ...centroCosto, label: centroCosto?.nombre_cc, value: centroCosto?.cod_cc } : null,
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
        cod_tipo_asignacion: tipo_asignacion ? { ...tipo_asignacion, label: tipo_asignacion.nom_tipo, value: tipo_asignacion.cod_tipo } : null,
        // fecha_reg: puesto.fecha_ultimo_cambio_json ? moment(puesto.fecha_ultimo_cambio_json) : moment(),
      };
    });
    setKey((i) => i + 1);
  }, [puesto, empresas, centrosCosto, tiposAsignacion, estados]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: () => cancelar() },
          guardar: { visible: id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: null },
        }}
      />
    </Box>
  );
};
FormularioCompletoPuesto.propTypes = {
  // ELEMENTO
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  puesto: PropTypes.object,

  // EVENTOS
  reConsultar: PropTypes.func,
  actualizarItem: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),

  catalogos: PropTypes.object,
};
export default FormularioCompletoPuesto;
