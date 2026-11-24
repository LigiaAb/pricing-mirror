import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useLocation } from "react-router-dom";

const FormularioCompletoTest = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    Test, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
  } = props;
  const location = useLocation();

  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    test1: "",
    test2: "",
    test3: null,
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
      { id: "test1", label: "test1", tipo: "text", val: valores["test1"], readonly: location.pathname.includes("view") },
      { id: "test2", label: "test2", tipo: "text", val: valores["test2"], readonly: location.pathname.includes("view") },
      { id: "test3", label: "test3", tipo: "date", val: valores["test3"], readonly: location.pathname.includes("view") },
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

  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    //
    setValores((val) => ({ ...val, ...Test }));
    //
  }, []);

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

FormularioCompletoTest.propTypes = {
  // ELEMENTO
  Test: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),

  // EVENTOS
  reConsultar: PropTypes.func,
};

export default FormularioCompletoTest;
