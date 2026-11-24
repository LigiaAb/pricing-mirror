import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoCentroCosto = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    centro_costo, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
    reConsultar,
  } = props;
  const { empresas = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_cc: 0,
    nombre_cc: "",
    cod_empresa_cc: null,
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
    const { cod_cc, cod_empresa_cc, nombre_cc } = valores;
    return [
      { id: "cod_cc", label: "Código", tipo: "text", val: cod_cc, readonly: true },
      { id: "nombre_cc", label: "Nombre", tipo: "text", val: nombre_cc },
      {
        id: "cod_empresa_cc",
        label: "Empresa",
        tipo: "select",
        val: cod_empresa_cc,
        options: empresas.map((i) => ({ ...i, label: i.nombre_emp, value: i.cod_empresa })),
      },
    ];
  }, [valores, empresas]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_empresa_cc } = valores;
    await api
      .post("api/appweb/insertarcentrocosto", { ...valores, cod_empresa: cod_empresa_cc.value, nombre_emp: undefined, cod_empresa_cc: undefined })
      .then(({ data }) => navigate(`/crud/centro_costo/${encryptId(data.data.cod_cc)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(async () => {
    const { cod_empresa_cc } = valores;
    reConsultar();
    await api.post("api/appweb/actualizarcentrocosto", {
      ...valores,
      cod_empresa: cod_empresa_cc.value,
      nombre_emp: undefined,
      cod_empresa_cc: undefined,
    });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_empresa_cc } = centro_costo;
      const empresa = empresas.find((i) => i.cod_empresa === cod_empresa_cc);
      return {
        ...centro_costo,
        cod_empresa_cc: empresa ? { ...empresa, label: empresa.nombre_emp, value: empresa.cod_empresa } : null,
      };
    });
    setKey((i) => i + 1);
  }, [empresas, centro_costo]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: agregar },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "new", onClick: guardar },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
    </Box>
  );
};
FormularioCompletoCentroCosto.propTypes = {
  // ELEMENTO
  centro_costo: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoCentroCosto;
