import react, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import PropTypes from "prop-types";
import { Box, Grid, CircularProgress } from "@mui/material";
import { encenderCarga } from "../../store/slices/status/statusSlice";
import { api } from "../../api";
import { useFetchEstados, useFetchTipos } from "../../hooks/Fetch/useFetchCatalog";
import { encryptId } from "../../api/encryptDecrypt";

const FormularioEquipos = (props) => {
  const { equipos, id, catalogos } = props;
  // const { estados = []} = catalogos;

  const trasportes = useFetchTipos({ tipo_tabla: "TRANSPORTE" });
  const estados_prueba = useFetchEstados({ cod_tipo: 25 });

  const [valores, setValores] = useState({
    cod_equipo: 0,
    equipo_codigo: "",
    equipo_descripcion: "",
    equipo_tamanio: "",
    equipo_capacidad: 0,
    equipo_operativo: false,
    equipo_teu: 0,
    cod_estado: null,
    cod_tipo: null,
  });

  const navigate = useNavigate();
  const [key, setKey] = useState(0);

  const inputs = useMemo(() => {
    const { cod_equipo, equipo_codigo, equipo_descripcion, equipo_tamanio, equipo_capacidad, equipo_operativo, equipo_teu, cod_estado, cod_tipo } = valores;
    return [
      {
        id: "cod_equipo",
        label: "ID",
        tipo: "number",
        val: cod_equipo,
        readonly: true,
      },
      {
        id: "equipo_codigo",
        label: "Codigo Equipo",
        tipo: "text",
        val: equipo_codigo,
      },
      {
        id: "equipo_descripcion",
        label: "Descripcion",
        tipo: "text",
        val: equipo_descripcion,
      },
      {
        id: "equipo_tamanio",
        label: "Tamaño equipo",
        tipo: "number",
        val: equipo_tamanio,
      },
      {
        id: "equipo_capacidad",
        label: "Capacidad Equipo",
        tipo: "number",
        val: equipo_capacidad,
      },
      {
        id: "equipo_operativo",
        label: "Operativo",
        tipo: "toggle",
        // options: [
        //     {label: "Si", value: 1},
        //     {label: "No", value: 0},
        // ],
        val: equipo_operativo,
      },
      {
        id: "equipo_teu",
        label: "Teu",
        tipo: "number",
        val: equipo_teu,
      },
      {
        id: "cod_estado",
        label: "Estado",
        tipo: "select",
        readonly: false,
        val: cod_estado,
        options: estados_prueba.data,
      },
      {
        id: "cod_tipo",
        label: "Tipo",
        tipo: "select",
        readonly: false,
        val: cod_tipo,
        options: trasportes.data,
      },
    ];
  }, [valores, estados_prueba.data, trasportes.data]);

  //cambios de los inputs
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);

  //agregar un nuevo registro
  const agregar = useCallback(async () => {
    const { cod_estado, cod_tipo } = valores;
    await api.post("/api/appweb/insertar-equipo", { ...valores, cod_tipo: cod_tipo.value, cod_estado: cod_estado.value }).then(({ data }) => navigate(`../${encryptId(data.data.cod_equipo || "")}`));
  }, [navigate, valores]);

  const guardar = useCallback(async () => {
    const { cod_estado, cod_tipo } = valores;
    api.post("/api/appweb/actualizar-equipo", { ...valores, cod_estado: cod_estado.value, cod_tipo: cod_tipo.value });
  }, [valores]);

  //Establecer estado inicial
  useEffect(() => {
    encenderCarga(true);
    if (equipos && estados_prueba.data.length > 0) {
      const { cod_equipo, equipo_codigo, equipo_descripcion, equipo_tamanio, equipo_capacidad, equipo_operativo, equipo_teu, cod_estado, cod_tipo } = equipos;
      const estado = estados_prueba.data.find((i) => i.cod_estado === cod_estado) || { value: 1, label: "ACTIVO" };
      const tipo = trasportes.data.find((i) => i.cod_tipo === cod_tipo);

      setValores({
        cod_equipo: cod_equipo || 0,
        equipo_codigo: equipo_codigo || "",
        equipo_descripcion: equipo_descripcion || "",
        equipo_tamanio: equipo_tamanio || 0,
        equipo_capacidad: equipo_capacidad || 0,
        equipo_operativo: equipo_operativo || false,
        equipo_teu: equipo_teu || 0,
        //...equipos,
        cod_estado: estado,
        cod_tipo: tipo,
      });

      encenderCarga(false);
    } else {
      console.log("No hay equipo o estados", { equipos, estados_prueba: estados_prueba.data, trasportes: trasportes.data });
    }
  }, [estados_prueba.data, equipos, trasportes.data]);

  useEffect(() => {
    setKey((i) => i + 1);
  }, [valores]);

  return (
    // <div>HoLA Mundo</div>

    <Box sx={{ p: 1, m: 0 }} key={id}>
      {(id === "new" || equipos) && estados_prueba.data.length > 0 ? (
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

FormularioEquipos.propTypes = {
  // ELEMENTO
  equipos: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};

export default FormularioEquipos;
