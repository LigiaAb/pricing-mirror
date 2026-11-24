import { renderTimeViewClock } from "@mui/x-date-pickers";
import react, { useState, useEffect, useMemo, useCallback } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import { api } from "../../api";
import { useNavigate } from "react-router-dom/dist";
import { enc } from "crypto-js";
import { encenderCarga } from "../../store/slices/status/statusSlice";
import { encryptId } from "../../api/encryptDecrypt";

const FormularioTratamiento = (props) => {
  const {
    tratamiento, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
    //readOnlyInput = true
  } = props;
  const { estados = [] } = catalogos;

  const [valores, setValores] = useState({
    cod_tratamiento: 0,
    //tratamiento_id: 0,
    tratamiento_descripcion: "",
    cod_estado: null,
  });
  const navigate = useNavigate();
  const [key, setKey] = useState(0);

  const estados_ = useMemo(
    () =>
      estados
        ?.filter((i) => i.nom_tipo == "GLOBAL")
        .map((item) => ({
          ...item,
          label: item.estado_desc,
          value: item.cod_estado,
        })) || [],
    [estados]
  );

  const inputs = useMemo(() => {
    const { cod_tratamiento, tratamiento_id, tratamiento_descripcion, cod_estado } = valores;
    return [
      {
        id: "cod_tratamiento",
        label: "tratamiento id",
        tipo: "number",
        val: cod_tratamiento,
        readonly: true,
      },
      {
        id: "tratamiento_descripcion",
        label: "descripcion",
        tipo: "text",
        val: tratamiento_descripcion,
      },
      {
        id: "cod_estado",
        label: "Estado",
        tipo: "select",
        val: cod_estado,
        options: estados_,
      },
    ];
  }, [valores, estados_]);

  // Manejar los cambios en los inputs
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);

  //Agregar un nuevo registro
  const agregar = useCallback(async () => {
    const { cod_estado } = valores;
    await api.post("/api/appweb/insertar-tratamiento", { ...valores, cod_estado: cod_estado.value }).then(({ data }) => navigate(`../${encryptId(data.data.cod_tratamiento)}`));
  }, [navigate, valores]);

  const guardar = useCallback(() => {
    const { cod_estado } = valores;
    api.post("/api/appweb/actualizar-tratamiento", { ...valores, cod_estado: cod_estado.value });
  }, [valores]);

  //ESTABLECER ESTADO INICIAL
  useEffect(() => {
    encenderCarga(true);
    if (tratamiento && estados.length > 0) {
      const { cod_tratamiento, tratamiento_id, tratamiento_descripcion, cod_estado } = tratamiento;
      const estado = estados.find((i) => i.cod_estado === cod_estado);

      setValores({
        cod_tratamiento: cod_tratamiento || 0,
        //tratamiento_id: tratamiento_id || 0,
        tratamiento_descripcion: tratamiento_descripcion || "",
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      });

      encenderCarga(false);
    } else {
      console.log("No hay tratamiento o estados", { tratamiento, estados });
    }
  }, [estados, tratamiento]);

  useEffect(() => {
    setKey((i) => i + 1);
  }, [valores]);

  return (
    <Box sx={{ p: 1, m: 0 }} key={id}>
      {tratamiento && estados.length > 0 ? (
        <FormularioComponent
          inputs={inputs}
          onInput={onInput}
          botones={{
            agregar: { visible: id === "new", onClick: () => agregar() },
            guardar: { visible: id !== "new", onClick: () => guardar() },
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

FormularioTratamiento.propTypes = {
  // ELEMENTO
  tratamiento: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};

export default FormularioTratamiento;
