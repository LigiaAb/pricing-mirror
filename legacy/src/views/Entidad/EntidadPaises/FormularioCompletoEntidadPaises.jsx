import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoEntidadPaises = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    paises, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    entidadpaises1: "",
    paises2: "",
    cod_estado: null,
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
    const { cod_entidadpaises, cod_estado } = valores;
    return [
      { id: "cod_entidadpaises", label: "entidadpaises", tipo: "text", val: cod_entidadpaises, readonly: true },
      { id: "cod_estado", label: "cod_estado", tipo: "text", val: cod_estado, options: estados.map((i) => ({ ...i, label: i.estado_desc, value: i.cod_estado })) },
    ];
  }, [valores, estados]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado } = valores;
    await api.post("api/appweb/", { ...valores, cod_estado: cod_estado.value }).then(({ data }) => navigate(`/crud/paises/${encryptId(data.data.cod_paises)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado } = valores;
    api.post("api/appweb/", {  ...valores, cod_estado: cod_estado.value });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_rol, rol_desc, cod_estado, fecha_reg } = paises;
      const estado = estados.find((i) => i.cod_estado === cod_estado);
      return {
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      };
    });
    setKey((i) => i + 1);
  }, [estados, paises]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
    </Box>
  );
};
FormularioCompletoEntidadPaises.propTypes = {
  // ELEMENTO
  paises: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoEntidadPaises;
