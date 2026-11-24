import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Grid, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../../api";
import { useDispatch, useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { decryptId, encryptId } from "../../../api/encryptDecrypt";
import PropTypes from "prop-types";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import TablaEntidadAsignacion from "../../../views/Entidad/EntidadAsignacion/TablaEntidadAsignacion";
import TabComponent from "../../../components/Tabs/TabComponent";
import VistaNuevaAsignacion from "./VistaNuevaAsignacion";
import TransferListsComponent from "../../../components/Lists/TransferListsComponent";
import VistaTrasladoAsignacion from "./VistaTrasladoAsignacion";
import VistaMisAsignaciones from "./VistaMisAsignaciones";
// import TablaEntidadAsignacion from "../../../views/Entidad/EntidadAsignacion/TablaEntidadAsignacion";

const ListaEntidadAsignacion = (props) => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const { tipoStr } = props;
  const dispatch = useDispatch();

  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [updateData, setUpdateData] = useState(0);
  const { currentCategoria } = useSelector((slice) => slice.menu);
  const { json } = useSelector((slice) => slice.auth);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const navigate = useNavigate();
  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(() => datos.map((i) => ({ ...i, empleado: `${i.nom_empleado} ${i.apellido_emp}` })), [datos, estados /*, valores */]);
  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  // const inputs = useMemo(
  //   () => [
  //     { tipo: "text"  , id: "filtro1"  , val: valores["filtro1"  ] },
  //     { tipo: "text"  , id: "filtro2"  , var: valores["filtro2"  ] },
  //   ],
  //   [valores]
  // );
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */

  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-asignacion-entidad")
      .then(({ data }) => {
        setDatos(data.data);
      })
      .catch((e) => console.error(e));
  }, [updateData]);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerDatos()]).then(() => dispatch(apagarCarga()));
    // if (!encryptedTipo) navigate(encryptId(codTipo));
  }, [obtenerDatos, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Box sx={{ pb: 1 }}>
        <Typography variant="h4">Asignación de Clientes</Typography>
      </Box>

      <TabComponent
        tabInicial={catalogoArray?.filter((o) => o.nivel_opcion === "E")[0]?.cod_opcion || null}
        opciones={[
          {
            id: 99,
            label: "Mis Asignaciones",
            icono: "c-reportes",
            disabled: false,
            content: <VistaMisAsignaciones/>
          },

          ...(catalogoArray
            .filter((o) => o.nivel_opcion === "E")
            .map((o) => ({
              id: o.cod_opcion,
              label: o.nom_opcion,
              icono: o.ico_opcion,
              disabled: !permisosArray.find((pa) => pa.cod_opcion === o.cod_opcion),
              content:
                o.nom_opcion === "Lista" ? (
                  <TablaEntidadAsignacion lista={lista} updateData={updateData} setUpdateData={setUpdateData} />
                ) : o.nom_opcion === "Asignación Masiva" ? (
                  <VistaNuevaAsignacion updateData={updateData} setUpdateData={setUpdateData} />
                ) : o.nom_opcion === "Traslado" ? (
                  <VistaTrasladoAsignacion updateData={updateData} setUpdateData={setUpdateData} />
                ) : null,
            })) || []),

        ]}
      />

      <Grid container></Grid>
    </Box>
  );
};
ListaEntidadAsignacion.propTypes = {
  // ELEMENTO
  tipoStr: PropTypes.string,
};
export default ListaEntidadAsignacion;
