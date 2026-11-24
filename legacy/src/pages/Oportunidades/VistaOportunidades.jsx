import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { FormularioActividades } from "../../views/Actividades/FormularioActividades";
// import { VistaActividadCreada } from "./VistaActividadCreada";
import { VistaActividadCreada } from "../Actividades/VistaActividadCreada";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { actividades } from "../../database_dummy/actividades";
// import { oportunidades } from "../../database_dummy/oportunidades";
import { VistaOportunidadCreada } from "./VistaOportunidadCreada";
import { FormularioOportunidad } from "../../views/Oportunidades/FormularioOportunidad";
import { NotFoundPage } from "../../layouts/404";

export const VistaOportunidades = (props) => {
  const { newActividad = true } = props;

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
  const [tratamientos, setTratamientos] = useState([]);
  const [temperamentos, setTemperamentos] = useState([]);

  // const [newActividad, setNewActividad] = useState(true);
  const [updateData, setUpdateData] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("../");
    }
  }, [id]);

  // function wait(delay){
  //   return new Promise((resolve) => setTimeout(resolve, delay));
  // }

  // function fetchRetry(url, delay, tries, fetchOptions = {}) {
  //     function onError(err){
  //         triesLeft = tries - 1;
  //         if(!triesLeft){
  //             throw err;
  //         }
  //         return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
  //     }
  //     return fetch(url,fetchOptions).catch(onError);
  // }

  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];
    let tipos_entidades = [];

    await api
      .get("api/appweb/lista-tipo", { params: { tipo_tabla: "ENTIDAD" } })
      .then(({ data }) => {
        tipos_entidades = tipos_entidades.concat(data.data);
      })
      .catch((e) => console.error(e));

    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidad", { params: { tipo_entidad: tipos_entidades[tipo].nom_tipo, datosxpagina: 100 } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }

    setEntidades(editProperties(lista_entidades, { view: true, add: false, go: false, excel: false, pdf: false, download: false }));
  }, []);
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
  const obtenerTratamientos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tratamiento")
      .then(({ data }) => setTratamientos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTemperamentos = useCallback(async () => {
    await api
      .get("api/appweb/lista-temperamento")
      .then(({ data }) => setTemperamentos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerOportundidad = useCallback(async () => {
    if (id == "new") return;
    if (!id) return;
    await api
      .get("api/appweb/lista-oportunidades", { params: { cod_oportunidad: id } })
      .then(({ data }) => {
        setData(data.data[0]);
      })
      .catch((e) => console.error(e));
  }, [id, updateData]);

  const obtenerContactos = useCallback(async () => {
    if (id == "new") return;
    if (!id) return;
    await api
      .get("api/appweb/lista-contactos-oportunidad", { params: { cod_oportunidad: id } })
      .then(({ data }) => {
        if (Array.isArray(data.data)) {
          setContactos(
            data.data.map((contacto) => ({
              ...contacto,
              tipos_string: contacto.data_entidad_contacto_tipo ? [...new Set(JSON.parse(contacto.data_entidad_contacto_tipo).map((item) => item.TIPO_DESCRIPCION))].join(", ") : "",
            }))
          );
        }
      })
      .catch((e) => console.error(e));
  }, [updateData]);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([
      obtenerTratamientos(),
      obtenerTemperamentos(),
      obtenerContactos(),
      obtenerOportundidad(),
      obtenerEmpleados(),
      obtenerCencos(),
      obtenerEntidades(),
      obtenerEmpresas(),
      obtenerEstados(),
      obtenerTipos(),
      obtenerPais(),
      obtenerCiudad(),
      obtenerIndustria(),
    ]).then(() => dispatch(apagarCarga()));
  }, [
    obtenerTratamientos,
    obtenerTemperamentos,
    obtenerContactos,
    obtenerOportundidad,
    obtenerEntidades,
    obtenerEmpleados,
    obtenerCencos,
    obtenerEmpresas,
    obtenerEstados,
    obtenerPais,
    obtenerCiudad,
    obtenerIndustria,
    obtenerTipos,
    dispatch,
  ]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas, id]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch, id]);

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
            <>
              <Typography variant="h5" textAlign={"right"}>
                Fecha de creación: {new Date(data.fecha_inicio).toLocaleDateString()}
              </Typography>
              <Grid container>
                <Grid size={{ xs: 12, sm: 10 }}>
                  <Typography variant="h4">{data.nombre_cliente}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: "grow" }} sx={{ my: "auto", textAlign: { md: "right" } }}>
                  <Typography variant="h4">
                    <b style={{ color: "#1E4F5C" }}>{data.tipo_desc === "PROYECTO" ? "Proyecto" : "Licitación"}</b>
                  </Typography>
                </Grid>
              </Grid>
            </>
          ) : (
            <Typography variant="h4">NUEVA OPORTUNIDAD</Typography>
          )}
        </Grid>
      </Grid>

      {
        // id ?
        id == "new" ? (
          <Box sx={{ p: 1, m: 0 }}>
            <FormularioOportunidad
              dataGet={null}
              readOnlyInput={false}
              updateData={updateData}
              setUpdateData={setUpdateData}
              catalogos={{ tratamientos, temperamentos, contactos, entidades, empresas, estados, paises, ciudades, industrias, tipos, cencos, empleados }}
            />
          </Box>
        ) : (
          <>
            <VistaOportunidadCreada
              dataGet={data}
              updateData={updateData}
              setUpdateData={setUpdateData}
              catalogos={{ tratamientos, temperamentos, contactos, entidades, empresas, estados, paises, ciudades, industrias, tipos, cencos, empleados }}
            />
          </>
        )
        // :
        // <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
        //   <CircularProgress />
        // </Box>
      }
    </Box>
  );
};
