import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoConfiguracion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    configuracion, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [], tipos = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    configuracion_id: 0,
    configuracion_descripcion: "",
    cod_tipo: null,
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
    const { configuracion_descripcion, configuracion_id, cod_tipo, cod_estado } = valores;
    return [
      { id: "configuracion_id", label: "Código", tipo: "text", val: configuracion_id, readonly: true },
      { id: "configuracion_descripcion", label: "Descripción", tipo: "text", val: configuracion_descripcion, readonly: false },
      {
        id: "cod_tipo",
        label: "tipo",
        tipo: "select",
        val: cod_tipo,
        labelOption: "nom_tipo",
        valueOption: "cod_tipo",
        options: tipos,
      },
      {
        id: "cod_estado",
        label: "estado",
        tipo: "select",
        val: cod_estado,
        labelOption: "estado_desc",
        valueOption: "cod_estado",
        options: estados,
      },
    ];
  }, [valores, tipos, estados]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado, cod_tipo } = valores;
    await api
      .post("api/appweb/insertar-configuracion", { ...valores, cod_tipo: cod_tipo.cod_tipo, cod_estado: cod_estado.cod_estado })
      .then(({ data }) => navigate(`/crud/configuracion/${encryptId(data.data.cod_configuracion)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado, cod_tipo } = valores;
    api.post("api/appweb/actualizar-configuracion", { ...valores, cod_tipo: cod_tipo.cod_tipo, cod_estado: cod_estado.cod_estado });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { configuracion_id, configuracion_descripcion, cod_estado, cod_tipo } = configuracion;
      const estado = estados.find((i) => i.cod_estado === cod_estado);
      const tipo = tipos.find((i) => i.cod_tipo === cod_tipo);
      return { configuracion_id, configuracion_descripcion, cod_estado: estado || { cod_estado: 1, estado_desc: "ACTIVO" }, cod_tipo: tipo || null };
    });
    setKey((i) => i + 1);
  }, [estados, configuracion]);
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
FormularioCompletoConfiguracion.propTypes = {
  // ELEMENTO
  configuracion: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoConfiguracion;
