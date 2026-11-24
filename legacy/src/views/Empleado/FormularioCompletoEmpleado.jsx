import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoEmpleado = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    empleado, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
    readonly = false,
  } = props;
  const { estados = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_empleado: 1,
    nom_empleado: "",
    apellido_emp: "",
    sexo_emp: "M",
    dpi_emp: "",
    empleado: "",
    cod_estado: { value: 1, label: "ACTIVO" },
  });
  const navigate = useNavigate();
  const [key, setKey] = useState(0);
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const { cod_empleado, cod_estado } = valores;
    return [
      { id: "cod_empleado", label: "codigo", tipo: "number", val: Number(valores["cod_empleado"]), readonly: true, visible: false },
      { id: "nom_empleado", label: "Nombre", tipo: "text", val: valores["nom_empleado"], readonly: readonly || location.pathname.includes("view") },
      { id: "apellido_emp", label: "Apellido", tipo: "text", val: valores["apellido_emp"], readonly: readonly || location.pathname.includes("view") },
      {
        id: "sexo_emp",
        label: "Sexo",
        tipo: "radio",
        val: valores["sexo_emp"],
        readonly: readonly || location.pathname.includes("view"),
        options: [
          { label: "Masculino", value: "M" },
          { label: "Femenino", value: "F" },
        ],
      },
      {
        id: "dpi_emp",
        label: "DPI",
        tipo: "text",
        val: valores["dpi_emp"],
        readonly: readonly || location.pathname.includes("view"),
        formato: /^[0-9]{4}\s?[0-9]{5}\s?[0-9]{4}$/,
        error: valores["dpi_emp"] === "" ? false : undefined,
        errorMessage: `El DPI debe contar de 13 digitos, hacen falta ${13 - (valores["dpi_emp"]?.length || 0)}`,
      },
      {
        id: "cod_estado",
        label: "Estado",
        tipo: "select",
        options: estados,
        val: valores["cod_estado"],
        readonly: readonly || location.pathname.includes("view") || location.pathname.includes("new"),
      },
    ];
  }, [valores, estados, readonly]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado } = valores;
    await api.post("api/appweb/insertar-empleado", { ...valores, cod_estado: cod_estado.value }).then(({ data }) => navigate(`../${encryptId(data.data.cod_empleado)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado } = valores;
    api.post("api/appweb/actualizar-empleado", { ...valores, cod_estado: cod_estado.value });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_rol, rol_desc, cod_estado, fecha_reg } = empleado;
      const estado = estados.find((i) => i.cod_estado === cod_estado);
      return {
        ...empleado,
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      };
    });
    setKey((i) => i + 1);
  }, [estados, empleado]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: !readonly || id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: readonly ? false : id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
    </Box>
  );
};
FormularioCompletoEmpleado.propTypes = {
  // ELEMENTO
  empleado: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,

  // SOLO VISTA
  readonly: PropTypes.bool,
};
export default FormularioCompletoEmpleado;
