import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoIdentificacion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    identificacion, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [], paises = [], tipos = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_identificacion: 0,
    nom_identificacion: "",
    cod_tipo: null,
    tipo_publico: false,
    identificacion_documentacion: null,
    identificacion_valor: false,
    identificacion_obligatorio: false,
    cod_pais: null,
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
    const { cod_identificacion, nom_identificacion, cod_tipo, tipo_publico, identificacion_documentacion, identificacion_valor, identificacion_obligatorio, cod_pais, estado_id } = valores;
    return [
      { id: "cod_identificacion", label: "Código", tipo: "number", val: cod_identificacion, readonly: true },
      { id: "nom_identificacion", label: "Nombre", tipo: "text", val: nom_identificacion, readonly: false },
      {
        id: "cod_tipo",
        label: "Tipo",
        tipo: "select",
        options: tipos?.filter((i) => i.tipo_tabla === "ENTIDAD"),
        labelOption: "nom_tipo",
        valueOption: "cod_tipo",
        val: cod_tipo,
        readonly: false,
      },
      {
        id: "cod_pais",
        label: "Pais",
        tipo: "select",
        options: paises,
        labelOption: "nombre_pais",
        valueOption: "cod_pais",
        val: cod_pais,
        readonly: false,
      },
      {
        id: "tipo_publico",
        label: "Público",
        tipo: "radio",
        options: [
          { label: "Si", value: "S" },
          { label: "No", value: "N" },
        ],
        val: tipo_publico,
        readonly: false,
      },
      {
        id: "identificacion_valor",
        label: "Utiliza Valores",
        tipo: "radio",
        options: [
          { label: "Si", value: "S" },
          { label: "No", value: "N" },
        ],
        val: identificacion_valor,
        readonly: false,
      },
      {
        id: "identificacion_documentacion",
        label: "Utiliza Escaner de Documentos",
        tipo: "radio",
        options: [
          { label: "Si", value: "S" },
          { label: "No", value: "N" },
        ],
        val: identificacion_documentacion,
        readonly: false,
      },
      {
        id: "identificacion_obligatorio",
        label: "Es obligatorio",
        tipo: "radio",
        options: [
          { label: "Si", value: "S" },
          { label: "No", value: "N" },
        ],
        val: identificacion_obligatorio,
        readonly: false,
      },
      {
        id: "estado_id",
        label: "estado",
        tipo: "select",
        val: estado_id,
        readonly: true,
        options: estados.map((i) => ({ ...i, label: i.estado_desc, value: i.estado_id })),
      },
    ];
  }, [valores, tipos, paises, estados]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { estado_id, cod_pais, cod_tipo } = valores;
    await api
      .post("api/appweb/insertar-identificacion", {
        ...valores,
        estado_id: undefined,
        cod_estado: estado_id?.value || null,
        cod_pais: cod_pais?.cod_pais || null,
        cod_tipo: cod_tipo?.cod_tipo || null,
      })
      .then(({ data }) => navigate(`/configuracion/crud/identificacion/${encryptId(data.data.cod_identificacion)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { estado_id, cod_pais, cod_tipo } = valores;
    api.post("api/appweb/actualizar-identificacion", {
      ...valores,
      estado_id: undefined,
      cod_estado: estado_id?.value || null,
      cod_pais: cod_pais?.cod_pais || null,
      cod_tipo: cod_tipo?.cod_tipo || null,
    });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_identificacion, nom_identificacion, cod_tipo, tipo_publico, identificacion_documentacion, identificacion_valor, identificacion_obligatorio, cod_pais, estado_id } = identificacion;
      const estado = estados.find((i) => i.cod_estado === estado_id);
      const pais = paises.find((i) => i.cod_pais === cod_pais);
      const tipo = tipos.find((i) => i.cod_tipo === cod_tipo);
      return {
        ...identificacion,
        estado_id: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
        cod_pais: pais ? { ...pais } : null,
        cod_tipo: tipo ? { ...tipo } : null,
      };
    });
    setKey((i) => i + 1);
  }, [estados, identificacion, paises, tipos]);
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
      {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
    </Box>
  );
};
FormularioCompletoIdentificacion.propTypes = {
  // ELEMENTO
  identificacion: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoIdentificacion;
