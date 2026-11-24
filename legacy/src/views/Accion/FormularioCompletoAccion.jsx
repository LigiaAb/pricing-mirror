import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoAccion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    accion, // Elemento del formulario basado en la base de datos
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
    cod_accion: "",
    nom_accion: "",
    ico_accion: "",
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
    const { cod_accion, nom_accion, ico_accion } = valores;
    return [
      {
        id: "cod_accion",
        label: "Código",
        tipo: "number",
        val: cod_accion,
        readonly: true,
      },
      {
        id: "nom_accion",
        label: "Nombre",
        tipo: "text",
        val: nom_accion,
        readonly: false,
      },
      {
        id: "ico_accion",
        label: "Ícono",
        tipo: "text",
        val: ico_accion,
        readonly: false,
      },
    ];
  }, [valores]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado } = valores;
    await api
      .post("api/appweb/insertar-accion", { ...valores })
      .then(({ data }) =>
        navigate(
          `/configuracion/accesos/accion/${encryptId(data.data.cod_accion)}`
        )
      );
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado } = valores;
    api.post("api/appweb/actualizar-accion", { ...valores });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_accion, nom_accion, ico_accion } = accion;
      return {
        cod_accion: cod_accion || "",
        nom_accion: nom_accion || "",
        ico_accion: ico_accion || "",
      };
    });
  }, [estados, accion]);
  useEffect(() => {
    setKey((i) => i + 1);
  }, [valores]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
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
FormularioCompletoAccion.propTypes = {
  // ELEMENTO
  accion: PropTypes.object,
  id: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.object,
    PropTypes.string,
  ]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoAccion;
