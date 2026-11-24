import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../../api";
const FormularioCompletoEntidadNombres = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    entidadNombres, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [], paises = [], ciudades = [], industrias = [], monedas = [], tipos = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    entidadnombre_id: "",
    entidadnombre_nombre: "",
    cod_tipo: null,
    estado_id: null,
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
    const { entidadnombre_id, entidadnombre_nombre, cod_tipo, estado_id } = valores;
    return [
      { id: "entidadnombre_id", label: "Código", tipo: "text", val: entidadnombre_id, readonly: true },
      // { id: "codigo_entidad", label: "Código de entidad", tipo: "text", val: codigo_entidad, readonly: true },
      { id: "entidadnombre_nombre", label: "nombre", tipo: "text", val: entidadnombre_nombre, readonly: false },
      {
        id: "cod_tipo",
        label: "tipo",
        tipo: "select",
        val: cod_tipo,
        options: tipos.filter((i) => i.tipo_tabla === "NOMBRES").map((i) => ({ ...i, label: i.nom_tipo, value: i.cod_tipo })),
        readonly: false,
      },
      // { id: "entidadnombre_id", label: "entidadnombres", tipo: "text", val: entidadnombre_id, readonly: true },
      {
        id: "estado_id",
        label: "estado",
        tipo: "select",
        val: estado_id,
        options: estados.map((i) => ({ ...i, label: i.estado_desc, value: i.cod_estado })),
        readonly: true,
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
    const { cod_estado } = valores;
    await api
      .post("api/appweb/", { ...valores, cod_estado: cod_estado.value })
      .then(({ data }) => navigate(`/crud/entidadNombres/${encryptId(data.data.entidadnombre_id)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado } = valores;
    api.post("api/appweb/", { ...valores, cod_estado: cod_estado.value });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { entidadnombre_id, codigo_entidad, entidadnombre_nombre, estado_id, cod_tipo, fecha_reg } = entidadNombres;
      const estado = estados.find((i) => i.cod_estado === estado_id);
      const tipo = tipos.find((i) => i.cod_tipo === cod_tipo);
      return {
        entidadnombre_id,
        entidadnombre_nombre,
        codigo_entidad,
        cod_tipo: tipo ? { ...tipo, label: tipo.nom_tipo, value: tipo.cod_tipo } : null,
        estado_id: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      };
    });
    setKey((i) => i + 1);
  }, [estados, entidadNombres, tipos]);
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
FormularioCompletoEntidadNombres.propTypes = {
  // ELEMENTO
  entidadNombres: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoEntidadNombres;
