import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useLocation } from "react-router-dom";
const FormularioCompletoPuestoRol = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    puestoRol, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
  } = props;
  const location = useLocation();
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    puestorol1: "",
    puestorol2: "",
    puestorol3: null,
  });
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(
    () => [
      { id: "puestorol1", label: "puestorol1", tipo: "text", val: valores["puestorol1"], readonly: location.pathname.includes("view") },
      { id: "puestorol2", label: "puestorol2", tipo: "text", val: valores["puestorol2"], readonly: location.pathname.includes("view") },
      { id: "puestorol3", label: "puestorol3", tipo: "date", val: valores["puestorol3"], readonly: location.pathname.includes("view") },
    ],
    [valores, location.pathname]
  );
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => (v[id] = val));
  }, []);
  const agregar = useCallback(() => {}, []);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {}, []);
  const filtrar = useCallback(() => {}, []);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: true, onClick: agregar },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: false, onClick: guardar },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
      <pre>{JSON.stringify(puestoRol, null, 2)}</pre>
    </Box>
  );
};
FormularioCompletoPuestoRol.propTypes = {
  // ELEMENTO
  puestoRol: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default FormularioCompletoPuestoRol;
