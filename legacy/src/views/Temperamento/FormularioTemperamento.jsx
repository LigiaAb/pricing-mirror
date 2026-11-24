import { de } from "date-fns/locale";
import react, { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { api } from "../../api";
import { Box, Grid, CircularProgress } from "@mui/material";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encenderCarga } from "../../store/slices/status/statusSlice";
import { encryptId } from "../../api/encryptDecrypt";

const FormularioTemperamento = (props) => {
  const { temperamento, id, catalogos } = props;
  const { estados = [] } = catalogos;

  const [valores, setValores] = useState({
    cod_temperamento: 0,
    temperamento_descripcion: "",
    cod_estado: null,
  });

  const navigate = useNavigate();
  const [key, setKey] = useState(0);

  //filtrar y mapear los estados para el select
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
    const { cod_temperamento, temperamento_id, temperamento_descripcion, cod_estado } = valores;

    return [
      {
        id: "cod_temperamento",
        //  id : "temperamento_id",
        label: "Id",
        tipo: "number",
        val: cod_temperamento,
        readonly: true,
      },
      {
        id: "temperamento_descripcion",
        label: "Descripción",
        tipo: "text",
        val: temperamento_descripcion,
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
    await api.post("/api/appweb/insertar-temperamento", { ...valores, cod_estado: cod_estado.value }).then(({ data }) => navigate(`../${encryptId(data.data.cod_temperamento)}`));
  }, [navigate, valores]);

  //actualizar un registro
  const guardar = useCallback(async () => {
    const { cod_estado } = valores;
    await api.post("/api/appweb/actualizar-temperamento", { ...valores, cod_estado: cod_estado.value });
    console.log("Registro actualizado", { ...valores, cod_estado: cod_estado.value });
  }, [valores]);

  //ESTABLECER ESTADO INICIAL
  useEffect(() => {
    encenderCarga(true);
    if (temperamento && estados.length > 0) {
      const { cod_temperamento, temperamento_id, temperamento_descripcion, cod_estado } = temperamento;
      const estado = estados.find((i) => i.cod_estado === cod_estado);

      setValores({
        cod_temperamento: cod_temperamento || 0,
        // temperamento_id: temperamento_id || 0,
        temperamento_descripcion: temperamento_descripcion || "",
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      });
      encenderCarga(false);
    } else {
      console.log("No hay temperamento o estados", { temperamento, estados });
    }
  }, [estados, temperamento]);

  useEffect(() => {
    setKey((i) => i + 1);
  }, [valores]);

  return (
    <Box sx={{ p: 1, m: 0 }} key={id}>
      {temperamento && estados.length > 0 ? (
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

FormularioTemperamento.propTypes = {
  // ELEMENTO
  temperamento: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};

export default FormularioTemperamento;
