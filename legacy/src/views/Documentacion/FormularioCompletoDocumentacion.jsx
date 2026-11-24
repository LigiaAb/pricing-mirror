import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";

const FormularioCompletoDocumentacion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    documentacion, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [], tipoDocumentacion = [] } = catalogos;

  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    documentacion: "",
    documentacion2: "",
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
    const { cod_det_tip_docu, det_desc_docu, cod_tip_docu } = valores;
    return [
      { id: "cod_det_tip_docu", label: "codigo", tipo: "number", val: cod_det_tip_docu, readonly: true, visible: false },
      { id: "det_desc_docu", label: "Nombre", tipo: "text", val: det_desc_docu },
      {
        id: "cod_tip_docu",
        label: "Tipo de documentacion",
        tipo: "select",
        val: cod_tip_docu,
        options: tipoDocumentacion,
        valueOption: "cod_tip_docu",
        labelOption: "desc_tip_docu",
      },
    ];
  }, [valores, tipoDocumentacion]);

  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado, cod_tip_docu } = valores;
    await api
      .post("api/appweb/insertar-det-tipo-documentacion", {
        ...valores,
        cod_estado: cod_estado,
        cod_tip_docu: cod_tip_docu.cod_tip_docu,
        det_docu_json: "[]",
      })
      .then(({ data }) => navigate(`/configuracion/crud/documentacion/${encryptId(data.data.cod_tip_docu)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado, cod_tip_docu } = valores;
    api.post("api/appweb/actualizar-det-tipo-documentacion", {
      ...valores,
      cod_estado: cod_estado,
      cod_tip_docu: cod_tip_docu.cod_tip_docu,
      det_docu_json: documentacion.det_docu_json === "{}" ? "[]" : documentacion.det_docu_json,
    });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);

  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_det_tip_docu, det_desc_docu, cod_tip_docu } = documentacion;

      console.log(documentacion);

      let tipo = tipoDocumentacion.find((i) => i.cod_tip_docu === cod_tip_docu);

      return {
        cod_det_tip_docu: cod_det_tip_docu,
        det_desc_docu: det_desc_docu,
        cod_tip_docu: tipo || null,
      };
    });
    setKey((i) => i + 1);
  }, [estados, documentacion, tipoDocumentacion]);

  return (
    <Box sx={{ p: 1, m: 0 }} key={key}>
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

FormularioCompletoDocumentacion.propTypes = {
  // ELEMENTO
  documentacion: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),

  // EVENTOS
  reConsultar: PropTypes.func,

  //CATALOGOS
  catalogos: PropTypes.object,
};

export default FormularioCompletoDocumentacion;
