import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { FormularioActividades } from "../../views/Actividades/FormularioActividades";
import { VistaActividadCreada } from "./VistaActividadCreada";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { actividades } from "../../database_dummy/actividades";
import { FormularioOportunidad } from "../../views/Oportunidades/FormularioOportunidad";
import { useFetchCentrosCosto, useFetchCiudades, useFetchConfiguracionActividad, useFetchEmpresas, useFetchEstados, useFetchIndustrias, useFetchMonedas, useFetchPaises, useFetchTemperamentos, useFetchTipos, useFetchTratamientos } from "../../hooks/Fetch/useFetchCatalog";
import { useFetchEmpleados } from "../../hooks/Fetch/useFetchConfiguracion";

export const VistaActividades = () => {
  let { encryptedId, encryptedIdActividad } = useParams();
  let id = encryptedIdActividad ? decryptId(encryptedIdActividad) : decryptId(encryptedId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [updateData, setUpdateData] = useState(0);
  const [readOnlyInput, setReadOnlyInput] = useState(false);

  const [entidades, setEntidades] = useState([]);

  const obtenerActividad = useCallback(async () => {
    if (id != "new") {
      await api
        .get("api/appweb/lista-actividades", { params: { cod_actividad: id } })
        .then(({ data }) => {
          setData(data.data[0]);
        })
        .catch((e) => console.error(e));

      await api
        .get("api/appweb/lista-contactos-actividades", { params: { cod_actividad: id } })
        .then(({ data }) => {
          setContactos(data.data);
        })
        .catch((e) => console.error(e));
    }
  }, [id]);

  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];
    let tipos_entidades = ["CLIENTE", "PRE-CLIENTE", "DSV"];

    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidad-simplificada", { params: { tipo_entidad: tipos_entidades[tipo], datosxpagina: 20000 } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }

    setEntidades(editProperties(lista_entidades, { view: true, add: false, go: false, excel: false, pdf: false, download: false }));
  }, []);


  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([
      obtenerActividad(),
      obtenerEntidades(),
    ]).then(() => dispatch(apagarCarga()));
  }, [
    obtenerActividad,
    obtenerEntidades,
    dispatch,
  ]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas, id]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch, id]);

  useEffect(() => {
    obtenerActividad();
  }, [updateData]);

  const editProperties = (arr, newProperties) => {
    return arr.map((item) => {
      return {
        ...item,
        accionesDeTabla: {
          ...item.accionesDeTabla,
          ...newProperties,
        },
      };
    });
  };

  return (
    <Grid container width="100%">
      <Grid size={12}>
        <Button color="primary" onClick={() => navigate("../")}>
          <Icon className=" c-izquierda-doble" sx={{ mr: 1 }} />
          Regresar
        </Button>
      </Grid>
      <Grid size={12}>
      {id == "new" || data?.cod_cliente === null ? (
        <Box sx={{ p: 1, m: 0 }}>
          <Grid container columns={{ xs: 4, md: 8 }}>
            <Grid size="grow" sx={{}}>
              <Typography m={0} p={0} variant="h4">
                {id === "new" ? "NUEVA ACTIVIDAD" : "Completemntar Información"}
              </Typography>
            </Grid>
          </Grid>
          <FormularioActividades
            dataGet={data}
            readOnlyInput={readOnlyInput}
            updateData={updateData}
            setUpdateData={setUpdateData}
            actualizacion={data?.cod_cliente === null && id !== "new"}
            catalogos={{ entidades, contactos }}
          />
        </Box>
      ) : (
        <VistaActividadCreada
          // id={id}
          dataGet={data}
          readOnlyInput={readOnlyInput}
          updateData={updateData}
          setUpdateData={setUpdateData}
          catalogos={{ entidades, contactos }}
        />
      )}
      </Grid>
    </Grid>
  );
};
