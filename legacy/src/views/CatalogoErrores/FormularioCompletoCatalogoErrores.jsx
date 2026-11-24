import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useLocation } from "react-router-dom";
const FormularioCompletoCatalogoErrores = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    catalogo_errores, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
  } = props;
  const location = useLocation();
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    catalogoerrores1: "",
    catalogoerrores2: "",
    catalogoerrores3: null,
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
      { id: "catalogoerrores1", label: "catalogoerrores1", tipo: "text", val: valores["catalogoerrores1"], readonly: location.pathname.includes("view") },
      { id: "catalogoerrores2", label: "catalogoerrores2", tipo: "text", val: valores["catalogoerrores2"], readonly: location.pathname.includes("view") },
      { id: "catalogoerrores3", label: "catalogoerrores3", tipo: "date", val: valores["catalogoerrores3"], readonly: location.pathname.includes("view") },
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
    </Box>
  );
};
FormularioCompletoCatalogoErrores.propTypes = {
  // ELEMENTO
  catalogo_errores: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default FormularioCompletoCatalogoErrores;
