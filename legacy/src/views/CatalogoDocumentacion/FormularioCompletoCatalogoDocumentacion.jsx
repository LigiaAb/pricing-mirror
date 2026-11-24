import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
const FormularioCompletoCatalogoDocumentacion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    catalogo_documentacion, // Elemento del formulario basado en la base de datos
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
    cod_tip_docu: 0,
    desc_tip_docu: "",
    cod_estado: null,
  });
  const navigate = useNavigate();
  const [key, setKey] = useState(0);
  const [cargando, setCargando] = useState(true);
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const { cod_tip_docu, desc_tip_docu, cod_estado } = valores;
    return [
      { id: "cod_tip_docu", label: "codigo", tipo: "number", val: cod_tip_docu, readonly: true },
      { id: "desc_tip_docu", label: "Nombre", tipo: "text", val: desc_tip_docu },
      { id: "cod_estado", label: "Estado", tipo: "select", val: cod_estado, options: estados ? estados.map((i) => ({ ...i, value: i.cod_estado, label: i.estado_desc })) : [] },
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
    await api.post("api/appweb/insertar-tipo-documentacion", { ...valores, cod_estado: cod_estado.value }).then(({ data }) => navigate(`../${encryptId(data.data.cod_tip_docu)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado } = valores;
    api.post("api/appweb/actualizar-tipo-documentacion", { ...valores, cod_estado: cod_estado.value });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    encenderCarga(true);
    if (catalogo_documentacion && estados.length > 0) {
      const { cod_tip_docu, desc_tip_docu, cod_estado } = catalogo_documentacion;
      const estado = estados.find((i) => i.cod_estado === cod_estado);

      setValores({
        cod_tip_docu: cod_tip_docu || 0,
        desc_tip_docu: desc_tip_docu || "",
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      });

      encenderCarga(false);
    } else {
      console.log("Datos insuficientes para establecer el estado", { catalogo_documentacion, estados });
    }
  }, [estados, catalogo_documentacion]);

  useEffect(() => {
    setKey((i) => i + 1);
  }, [valores]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {catalogo_documentacion && estados.length > 0 ? (
        <FormularioComponent
          kye={key}
          inputs={inputs}
          onInput={onInput}
          botones={{
            agregar: { visible: id === "new", onClick: () => agregar() },
            cancelar: { visible: false, onClick: cancelar },
            guardar: { visible: id !== "new", onclick: () => guardar() },
            filtrar: { visible: false, onClick: filtrar },
          }}
        />
      ) : (
        <Grid container justifyContent="center" width="100%" direction="row">
          <Grid size="auto" sx={{ mr: 1 }}>
            Cargando...
          </Grid>
          <Grid size="auto">
            <CircularProgress size="1rem" />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
FormularioCompletoCatalogoDocumentacion.propTypes = {
  // ELEMENTO
  catalogo_documentacion: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoCatalogoDocumentacion;
