import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { api } from "../../api";
import { Box, Grid, Icon, Typography } from "@mui/material";
import TransferListsComponent from "../../components/Lists/TransferListsComponent";
import BandaAlertaComponent from "../../components/Alertas/BandaAlertaComponent";

const OpcionAccion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const { id, opcion } = props;
  const dispatch = useDispatch();

  /**
   * USE STATE
   * Lista de States
   */
  const [key, setKey] = useState(0);
  const [opcionesAcciones, setOpcionesAcciones] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [rolCategoriaOpcionAccion, setRolCategoriaOpcionAccion] = useState([]);
  // ASIGNACION DE ACCIONES
  const [accionesAsignadas, setAccionesAsignadas] = useState([]);
  const [accionesNoAsignadas, setAccionesNoAsignadas] = useState([]);

  /**
   * CONSULTA DE DATOS
   * Consulta a base
   */
  const obtenerOpcionAccion = useCallback(async () => {
    await api.get("api/appweb/lista-opcion-accion", { params: { cod_opcion: id } }).then(({ data }) => setOpcionesAcciones(data.data));
  }, [id]);
  const obtenerAcciones = useCallback(async () => {
    await api.get("api/appweb/lista-accion").then(({ data }) => setAcciones(data.data));
  }, []);
  const obtenerRolCategoriaOpcionAccion = useCallback(async () => {
    await api.get("api/appweb/lista-rol-menu-cat-opc-acc", { params: { cod_opcion: id } }).then(({ data }) => setRolCategoriaOpcionAccion(data.data));
  }, [id]);

  const guardarAsingacion = async (left, right) => {
    const asignadaos = right.filter((a) => !opcionesAcciones.some((oa) => oa.cod_accion === a.cod_accion));
    const noAsignadaos = opcionesAcciones.filter((a) => !right.some((oa) => oa.cod_accion === a.cod_accion));

    const cod_opcion = Number(id);
    const cod_categoria = opcion.cod_categoria;

    await Promise.all(noAsignadaos.map((i) => api.post("api/appweb/eliminar-opcion-accion", { cod_accion: i.cod_accion, cod_opcion, cod_categoria }).catch((e) => console.log(e))));

    await Promise.all(asignadaos.map((i) => api.post("api/appweb/insertar-opcion-accion", { cod_estado: 1, cod_accion: i.cod_accion, cod_opcion, cod_categoria }).catch((e) => console.log(e))));

    await obtenerOpcionAccion(); // Consulta de todos los puestos
  };

  useEffect(() => {
    const asignadaos = acciones.filter((a) => opcionesAcciones.some((oa) => oa.cod_accion === a.cod_accion));
    const noAsignadaos = acciones.filter((a) => !opcionesAcciones.some((oa) => oa.cod_accion === a.cod_accion));

    // rolCategoriaOpcionAccion
    setAccionesAsignadas(
      asignadaos.map((accion) => ({
        ...accion,
        readonly: !!rolCategoriaOpcionAccion.some((rcoa) => rcoa.cod_accion === accion.cod_accion),
        render: (
          <Grid key={accion.cod_accion} container direction="row">
            <Grid my="auto" mx={1} size="auto">
              <Icon fontSize="1em" className={accion.ico_accion} sx={{ width: "fit-content" }} />
            </Grid>
            <Grid my="auto" size="grow">
              <Typography>{accion.nom_accion}</Typography>
            </Grid>
          </Grid>
        ),
      }))
    );
    setAccionesNoAsignadas(
      noAsignadaos.map((accion) => ({
        ...accion,
        readonly: !!rolCategoriaOpcionAccion.some((rcoa) => rcoa.cod_accion === accion.cod_accion),
        render: (
          <Grid key={accion.cod_accion} container direction="row">
            <Grid my="auto" mx={1} size="auto">
              <Icon fontSize="1em" className={accion.ico_accion} sx={{ width: "fit-content" }} />
            </Grid>
            <Grid my="auto" size="grow">
              <Typography>{accion.nom_accion}</Typography>
            </Grid>
          </Grid>
        ),
      }))
    );

    setKey((prevKey) => prevKey + 1); // Actualiza la clave después de asignar
  }, [opcionesAcciones, acciones, rolCategoriaOpcionAccion]);
  useEffect(() => {
    const hacerConsultas = async () => {
      dispatch(encenderCarga());
      await obtenerOpcionAccion(); // Consulta de todos los puestos
      await obtenerAcciones(); // Consulta de todos los puestos
      await obtenerRolCategoriaOpcionAccion(); // Consulta de todos los puestos
      dispatch(apagarCarga());
    };

    hacerConsultas();
  }, [id, dispatch, obtenerOpcionAccion, obtenerAcciones, obtenerRolCategoriaOpcionAccion]);

  return (
    <Box sx={{ m: 0, p: 0 }} key={key} width="100%">
      <Grid container width="100%">
        <Grid size={12}>
          <BandaAlertaComponent tipo="warning">Solo se pueden desasignar las acciones que no han sido asignadas a ningun rol</BandaAlertaComponent>
        </Grid>
        <Grid size={12}>
          <TransferListsComponent
            listaPrincipal={accionesNoAsignadas}
            listaSecundaria={accionesAsignadas}
            tituloListaPrincipal="Acciones no asignadas"
            tituloListaSecundaria="Acciones asignadas"
            objectLabel="render"
            objectValue="cod_accion"
            guardarListas={guardarAsingacion}
            permitirPasarTodos
          />
        </Grid>
      </Grid>
      <Grid container width="100%">
        {/* <Grid> <pre>{JSON.stringify({ opcionesAcciones }, null, 2)}</pre> </Grid> */}
        {/* <Grid> <pre>{JSON.stringify({ acciones }, null, 2)}</pre> </Grid> */}
        {/* <Grid> <pre>{JSON.stringify({ accionesAsignadas }, null, 2)}</pre> </Grid> */}
        {/* <Grid> <pre>{JSON.stringify({ accionesNoAsignadas }, null, 2)}</pre> </Grid> */}
        {/* <Grid> <pre>{JSON.stringify({ opcion }, null, 2)}</pre> </Grid> */}
        {/* <Grid> <pre>{JSON.stringify({ rolCategoriaOpcionAccion }, null, 2)}</pre> </Grid> */}
      </Grid>
    </Box>
  );
};

OpcionAccion.propTypes = {
  id: PropTypes.number,

  opcion: PropTypes.object,
};

export default OpcionAccion;
