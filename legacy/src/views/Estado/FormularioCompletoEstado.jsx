import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoEstado = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    estado, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { tipos = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_estado: 0,
    estado_desc: "",
    cod_tipo: null,
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
    const { cod_estado, estado_desc, cod_tipo } = valores;
    return [
      { id: "cod_estado", label: "Código", tipo: "text", val: cod_estado, readonly: true },
      { id: "estado_desc", label: "Descripción", tipo: "text", val: estado_desc },
      { id: "cod_tipo", label: "Tipo", options: tipos, labelOption: "nom_tipo", valueOption: "cod_tipo", tipo: "select", val: cod_tipo },
    ];
  }, [valores, tipos]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado, estado_desc, cod_tipo } = valores;
    await api
      .post("api/appweb/insertarestado", { cod_estado, estado_desc, cod_tipo: cod_tipo.cod_tipo })
      .then(({ data }) => navigate(`/configuracion/crud/estado/${encryptId(data.data.cod_estado)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado, estado_desc, cod_tipo } = valores;
    api.post("api/appweb/actualizarestado", { cod_estado, estado_desc, cod_tipo: cod_tipo.cod_tipo });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    const { cod_estado = 0, estado_desc = "", cod_tipo } = estado;
    const tipo = cod_tipo ? tipos.find((t) => cod_tipo === t.cod_tipo) : null;
    setValores({ cod_estado, estado_desc, cod_tipo: tipo });
    setKey((v) => v + 1);
  }, [estado, tipos]);
  useEffect(() => {}, []);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        inputs={inputs}
        key={key}
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
FormularioCompletoEstado.propTypes = {
  // ELEMENTO
  estado: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoEstado;
