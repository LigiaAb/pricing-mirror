import React, { useCallback, useEffect, useState, useMemo } from "react";
import FormularioCompletoTipo from "../../views/Tipo/FormularioCompletoTipo";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalTipo from "./ModalTipo";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import  FormularioTemperamento from "../../views/Temperamento/FormularioTemperamento";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
const VistaTemperamento = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               PARAMETROS DE URL                              #
   * # ---------------------------------------------------------------------------- #
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = useMemo(()=>decryptId(encryptedId),[encryptedId]);
  //let id = decryptId(encryptedId);
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                 USE NAVIGATE                                 #
   * # ---------------------------------------------------------------------------- #
   * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
   */
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  const [item, setItem] = useState({});
  const [estados, setEstados] = useState([]);
  const dispatch = useDispatch();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-temperamento", { params: { cod_temperamento: id } })
          .then(({ data }) => setItem(data.data[0]))
          .catch((e) => console.error(e));
  }, [id]);

  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await 
    api.get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch ((e) => console.error(e));
  },[])


  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(),obtenerDatos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerEstados,obtenerDatos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  // const inputs = useMemo(
  //   () => [
  //     {
  //       tipo: "number",
  //       id: "temperamento_id",
  //       val: item?.temperamento_id || "",
  //       label: "Id",
  //       readonly: id === "new",
  //     },
  //     {
  //       tipo: "text",
  //       id: "temperamento_descripcion",
  //       val: item?.temperamento_descripcion || "",
  //       label: "Descripción",
  //       readonly: false,
  //     },
  //     {
  //       tipo: "select",
  //       id: "cod_estado",
  //       val: item?.cod_estado || { value: 1, label: "ACTIVO" },
  //       label: "Estado",
  //       options: estados.map((i) => ({ label: i.estado_desc, value: i.cod_estado })),
  //     }
  //   ],
  //   [item,estados]
  // );

  // const handleSubmitUpdate = async () => {
  //   try {
  //     const response = await api.post("/api/appweb/actualizar-temperamento", {
  //       temperamento_id: item?.temperamento_id,
  //       tratamiento_descripcion: item?.temperamento_descripcion,
  //     });
  //     if (response.data.data.mensaje === "Tratamiento  actualizado correctamente") {
  //       navigate(0);
  //     } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error al actualizar registro");
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleSubmitCreate = async () => {
  //   try {
  //     const response = await api.post("/api/appweb/insertar-temperamento", {
  //       temperamento_id: item?.temperamento_id,
  //       temperamento_descripcion: item?.temperamento_descripcion,
  //       cod_estado: 1,
  //     });
  //     if (response.data.data.mensaje === "Tratamiento  actualizado correctamente") {
  //     } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate(`/configuracion/crud/temperamento`)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h4">Temperamento {id}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion de componente",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioTemperamento id={id} temperamento={item} catalogos ={{estados}} />
              </Box>
            ),
          },
        ]}
      />
    </Box>
  );
};
export default VistaTemperamento;
