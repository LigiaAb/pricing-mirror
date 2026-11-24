import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoModulo = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    modulo, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [] } = catalogos;
  const location = useLocation();
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_modulo: 0,
    nom_modulo: "",
    ico_modulo: "",
    modulo_ruta: "",
    cod_estado: null,
  });
  const [key, setKey] = useState(0);
  const navigate = useNavigate();
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const { cod_modulo, nom_modulo, ico_modulo, cod_estado, modulo_ruta } = valores;
    return [
      { id: "cod_modulo", label: "Código", tipo: "text", val: cod_modulo, readonly: true },
      { id: "nom_modulo", label: "Nombre", tipo: "text", val: nom_modulo },
      { id: "ico_modulo", label: "Ícono", tipo: "icono", val: ico_modulo },
      { id: "modulo_ruta", label: "Ruta", tipo: "text", val: modulo_ruta },
      {
        id: "cod_estado",
        label: "Estado",
        tipo: "select",
        val: cod_estado,
        options: estados.map((i) => ({ ...i, value: i.cod_estado, label: i.estado_desc })),
      },
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
    console.log("agregar");
    const { cod_modulo, nom_modulo, ico_modulo, cod_estado, modulo_ruta } = valores;
    await api
      .post("api/appweb/insertarmodulo", { cod_modulo, nom_modulo, ico_modulo, modulo_ruta, cod_estado: cod_estado.value })
      .then(({ data }) => navigate(`/configuracion/accesos/modulo/${encryptId(data.data.cod_modulo)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_modulo, nom_modulo, ico_modulo, cod_estado, modulo_ruta } = valores;
    api.post("api/appweb/actualizarmodulo", { cod_modulo, nom_modulo, ico_modulo, modulo_ruta, cod_estado: cod_estado.value });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_modulo, nom_modulo, ico_modulo, cod_estado, modulo_ruta } = modulo;

      const estado = estados.find((i) => i.cod_estado === cod_estado);
      return {
        cod_modulo: cod_modulo || 0,
        nom_modulo: nom_modulo || "",
        ico_modulo: ico_modulo || "",
        modulo_ruta: modulo_ruta || "",
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      };
    });
    setKey((i) => i + 1);
  }, [estados, modulo]);

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
FormularioCompletoModulo.propTypes = {
  // ELEMENTO
  modulo: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoModulo;
