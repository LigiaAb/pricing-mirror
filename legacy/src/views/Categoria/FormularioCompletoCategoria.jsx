import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoCategoria = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    categoria, // Elemento del formulario basado en la base de datos
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
    cod_categoria: 0,
    nom_cat: "",
    ico_cat: "",
    ruta_cat: "",
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
    const { cod_categoria, cod_estado, ico_cat, nom_cat, ruta_cat } = valores;
    return [
      { id: "cod_categoria", label: "Código", tipo: "number", val: cod_categoria, readonly: true },
      { id: "nom_cat", label: "Nombre", tipo: "text", val: nom_cat },
      { id: "ico_cat", label: "Ícono", tipo: "icono", val: ico_cat },
      { id: "ruta_cat", label: "Ruta", tipo: "text", val: ruta_cat },
      { id: "cod_estado", label: "Estado", tipo: "select", val: cod_estado, options: estados, readonly: true },
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
    await api
      .post("api/appweb/insertar-categoria", { ...valores, cod_estado: cod_estado.value })
      .then(({ data }) => navigate(`/configuracion/accesos/categoria/${encryptId(data.data.cod_categoria)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado } = valores;
    api.post("api/appweb/actualizar-categoria", { ...valores, cod_estado: cod_estado.value });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_estado, cod_categoria, nom_cat, ico_cat, ruta_cat } = categoria;
      const estado = estados.find((i) => i.cod_estado === cod_estado);
      return {
        cod_categoria: cod_categoria || 0,
        nom_cat: nom_cat || "",
        ico_cat: ico_cat || "",
        ruta_cat: ruta_cat || "",
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      };
    });
    setKey((i) => i + 1);
  }, [estados, categoria]);

  useEffect(() => {}, [valores]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "edit", onClick: () => guardar() },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
    </Box>
  );
};
FormularioCompletoCategoria.propTypes = {
  // ELEMENTO
  categoria: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoCategoria;
