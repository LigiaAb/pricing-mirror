import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoOpcion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    opcion, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [], categorias = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_opcion: 0,
    nom_opcion: "",
    ruta_opcion: "",
    ico_opcion: "",
    fecha_reg: null,
    cod_estado: null,
    cod_categoria: null,
    nivel_opcion: "I",
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
    const { cod_opcion, nom_opcion, ruta_opcion, ico_opcion, cod_categoria, fecha_reg, cod_estado } = valores;
    return [
      { id: "cod_opcion", label: "código", tipo: "number", val: cod_opcion, readonly: true },
      { id: "nom_opcion", label: "nombre", tipo: "text", val: nom_opcion, readonly: false },
      { id: "ruta_opcion", label: "ruta", tipo: "text", val: ruta_opcion, readonly: false },
      { id: "ico_opcion", label: "icono", tipo: "icono", val: ico_opcion, readonly: false },
      {
        id: "cod_categoria",
        label: "categoría",
        tipo: "select",
        val: cod_categoria,
        options: categorias.map((i) => ({ ...i, label: i.nom_cat, value: i.cod_categoria })),
        readonly: false,
      },
      { id: "fecha_reg", label: "fecha", tipo: "date", val: fecha_reg, readonly: true },
      {
        id: "cod_estado",
        label: "estado",
        tipo: "select",
        val: cod_estado,
        options: estados.map((i) => ({ ...i, label: i.estado_desc, value: i.cod_estado })),
      },
      {
        id: "nivel_opcion",
        label: "REQUIERE CAMBIO DE CONTRASEÑA",
        tipo: "radio",
        options: [
          { value: "E", label: "Externo (Visible al entrar a la categoria)" },
          { value: "I", label: "Interno (Visible al entrar en un registro)" },
        ],
        val: valores["nivel_opcion"],
      },
    ];
  }, [valores, estados, categorias]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado, cod_categoria } = valores;
    await api
      .post("api/appweb/insertar-opcion", { ...valores, cod_categoria: cod_categoria.value, cod_estado: cod_estado.value })
      .then(({ data }) => navigate(`/configuracion/accesos/opcion/${encryptId(data.data.cod_opcion)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado, cod_categoria, nivel_opcion } = valores;
    api.post("api/appweb/actualizar-opcion", { ...valores, cod_categoria: cod_categoria.value, cod_estado: cod_estado.value });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_opcion, nom_opcion, ruta_opcion, cod_categoria, ico_opcion, fecha_reg, cod_estado, nivel_opcion } = opcion;
      const estado = estados.find((i) => i.cod_estado === cod_estado);
      const categoria = categorias.find((i) => i.cod_categoria === cod_categoria);
      return {
        cod_opcion: cod_opcion || 0,
        nom_opcion: nom_opcion || "",
        ruta_opcion: ruta_opcion || "",
        ico_opcion: ico_opcion || "",
        nivel_opcion: nivel_opcion || "I",
        fecha_reg: fecha_reg ? new Date(fecha_reg) : null,
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
        cod_categoria: categoria ? { ...categoria, label: categoria.nom_cat, value: categoria.cod_categoria } : null,
      };
    });
    setKey((i) => i + 1);
  }, [estados, categorias, opcion]);

  useEffect(() => {}, [valores]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
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

FormularioCompletoOpcion.propTypes = {
  // ELEMENTO
  opcion: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoOpcion;
