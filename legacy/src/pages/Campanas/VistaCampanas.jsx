import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { FormularioActividades } from "../../views/Actividades/FormularioActividades";
// import { VistaActividadCreada } from "./VistaActividadCreada";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { actividades } from "../../database_dummy/actividades";
// import { oportunidades } from "../../database_dummy/oportunidades";
import { FormularioOportunidad } from "../../views/Oportunidades/FormularioOportunidad";
import { NotFoundPage } from "../../layouts/404";
import { VistaCampanaCreada } from "./VistaCampanaCreada";
import { FormularioCampanas } from "../../views/Campanas/FormularioCampanas";

export const VistaCampanas = () => {
  let { encryptedId } = useParams();
  let id = decryptId(encryptedId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [readOnlyInput, setReadOnlyInput] = useState(false);
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [tipos, setTipos] = useState();
  const [empresas, setEmpresas] = useState();
  const [cencos, setCencos] = useState();
  const [entidades, setEntidades] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [oportunidad, setOportunidad] = useState(null);

  // const [newActividad, setNewActividad] = useState(true);
  const [updateData, setUpdateData] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("../");
    }
  }, [id]);

  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerPais = useCallback(async () => {
    await api
      .get("api/appweb/listapaises")
      .then(({ data }) => setPaises(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCiudad = useCallback(async () => {
    await api
      .get("api/appweb/lista-ciudad")
      .then(({ data }) => setCiudades(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerIndustria = useCallback(async () => {
    await api
      .get("api/appweb/lista-industria")
      .then(({ data }) => setIndustrias(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCencos = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCencos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpleados = useCallback(async () => {
    await api
      .get("api/appweb/listaemp-usu-puesto")
      .then(({ data }) => setEmpleados(data.data))
      .catch((e) => console.error(e));
  }, []);

  const obtenerCampana = useCallback(async () => {
    if (id == "new") return;
    if (!id) return;
    await api
      .get("api/appweb/lista-campanas", { params: { cod_campana: id } })
      .then(({ data }) => setData(data.data[0]))
      .catch((e) => console.error(e));
  }, [id]);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerCampana(), obtenerEmpleados(), obtenerCencos(), obtenerEmpresas(), obtenerEstados(), obtenerTipos(), obtenerPais(), obtenerCiudad(), obtenerIndustria()]).then(() =>
      dispatch(apagarCarga())
    );
  }, [id, obtenerCampana, obtenerEmpleados, obtenerCencos, obtenerEmpresas, obtenerEstados, obtenerPais, obtenerCiudad, obtenerIndustria, obtenerTipos, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const editProperties = (arr, newProperties) => {
    return arr.map((item) => {
      return {
        ...item,
      };
    });
  };

  return (
    <Box sx={{ px: 2, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate("../")}>
        <Icon className=" c-izquierda-doble" sx={{ mr: 1 }} />
        Regresar a la lista
      </Button>
      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow" sx={{ mt: 2 }}>
          {data ? (
            <Box display="flex" flexWrap="wrap" justifyContent="space-between">
              <Typography variant="h4">{data.asunto}</Typography>
              <Typography variant="h4">
                <b style={{ color: "#1E4F5C" }}>Campaña de Ventas</b>
              </Typography>
            </Box>
          ) : (
            <Typography variant="h4">NUEVA CAMPAÑA DE VENTAS</Typography>
          )}
        </Grid>
      </Grid>

      {id ? (
        id == "new" ? (
          <Box sx={{ p: 1, m: 0 }}>
            <FormularioCampanas
              dataGet={null}
              readOnlyInput={false}
              updateData={updateData}
              setUpdateData={setUpdateData}
              catalogos={{ entidades, empresas, estados, paises, ciudades, industrias, tipos, cencos, empleados }}
            />
          </Box>
        ) : (
          <>
            {/* <VistaOportunidadCreada
            dataGet={data}
            updateData={updateData}
            setUpdateData={setUpdateData}
            catalogos={{ entidades, empresas, estados, paises, ciudades, industrias, tipos, cencos, empleados }}
          /> */}
            <VistaCampanaCreada
              dataGet={data}
              updateData={updateData}
              setUpdateData={setUpdateData}
              catalogos={{ entidades, empresas, estados, paises, ciudades, industrias, tipos, cencos, empleados }}
            />
          </>
        )
      ) : (
        <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};
