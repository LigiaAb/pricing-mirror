// update comment
import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api";
import { decryptId, encryptId } from "@/api/encryptDecrypt";
import { useDispatch, useSelector } from "react-redux";
import { useFetchEmpleados } from "@/hooks/Fetch/useFetchConfiguracion";
import { 
  useFetchEmpresas,
  useFetchCentrosCosto,
  useFetchTipos,
  useFetchEstados
 } from "@/hooks/Fetch/useFetchCatalog";
import { useFetchAllEntidadesSimple } from "@/hooks/Fetch/useFetchEntidades";
import { GraficasEmbarques } from "@/views/Actividades/GraficasEmbarques";
import { apagarCarga, encenderCarga } from "@/store/slices/status/statusSlice";
import TabComponent from "@/components/Tabs/TabComponent";


const VistaAsignacionCTS = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               PARAMETROS DE URL                              #
   * # ---------------------------------------------------------------------------- #
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = decryptId(encryptedId);
  
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                 USE NAVIGATE                                 #
   * # ---------------------------------------------------------------------------- #
   * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
   */
  const navigate = useNavigate();
  const usuario = useSelector((state) => state.auth);
  const { cod_usuario, puesto_default } = useSelector((state) => state.auth);
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  const [item, setItem] = useState(null);
  const [updateData, setUpdateData] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [entidades, setEntidades] = useState([]);
  const dispatch = useDispatch();

  const estados = useFetchEstados();
  const tipos = useFetchTipos();
  const empresas = useFetchEmpresas();
  const cencos = useFetchCentrosCosto();
  const empleados = useFetchEmpleados();

  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */

  /* -------------------------------------------------------------------------- */
  /* Obtener los datos del crud */
  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-asignacion-entidad", { params: { cod_asignacion: id } })
          .then(({ data }) => {
            console.log(data.data[0]);
            setItem(data.data[0]);
          })
          .catch((e) => console.error(e));
  }, [id, updateData]);
  
  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];
    let tipos_entidades = ["CLIENTE"];

    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidad", { params: { tipo_entidad: tipos_entidades[tipo], datosxpagina: 100 } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }
    setEntidades(lista_entidades);
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([
      obtenerDatos(),
      obtenerEntidades(),
    ]).then(() => dispatch(apagarCarga()));
  }, [id, obtenerDatos, obtenerEntidades, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Button color="primary" onClick={() => navigate(`/crm/clientes/asignacion`)}>
        <Icon className="c-derecha-arriba-izquierda" sx={{ mr: 1 }} />
        Regresar a la lista
      </Button>
      <Box sx={{my: 2}}>
        <Typography variant="h4">{
          id == "new" 
            ? "SOLICITAR ASIGNACIÓN" 
            : `${item?.cod_estado == 5 ? "SOLICITUD DE " : ""}ASIGNACIÓN: ${item?.nombre_cliente || ""} - ${item?.nom_empleado.toUpperCase() || ""} ${item?.apellido_emp.toUpperCase() || ""} - ${item?.nom_tipo|| ""}`
          }</Typography>
      </Box>
      <Box sx={{ mt: 1}} display={id == "new"  ? "box" : "none"}>
        {/* <FormularioEntidadAsignacion id={id} asignacion={item} 
          setUpdateData={setUpdateData}
          catalogos={{ 
            empresas: empresas.data || [], 
            cencos: cencos.data || [], 
            empleados: empleados.data || [], 
            tipos: tipos.data || [], 
            estados: estados.data || [], 
            entidades,
          }} 
          
        /> */}
      </Box>

      <Box sx={{mt: 2}} display={id == "new"  ? "none" : "box"}>
      <TabComponent
        tabInicial={0}
        opciones={[
          {
            id: 0,
            label: "Informacion",
            icono: "c-reportes",
            disabled: false,
            content: <Box sx={{ mt: 1}}>
              {/* <FormularioEntidadAsignacion id={id} asignacion={item} 
                setUpdateData={setUpdateData}
                catalogos={{ 
                  empresas: empresas.data || [], 
                  cencos: cencos.data || [], 
                  empleados: empleados.data || [], 
                  tipos: tipos.data || [], 
                  estados: estados.data || [], 
                  entidades,
                }} 
              /> */}
            </Box>
          },
          {
            id: 2,
            label: "Reporte",
            icono: "c-reportes",
            disabled: false,
            content: <Box sx={{ m: 1, mt: 2 }}>
              {
                  !!item && item.cod_estado == 1 && 
                  <GraficasEmbarques 
                      cardAsignacion={true}
                      cliente={{
                        entidad_nombre: item.nombre_cliente,
                        tipo: item.tipo_entidad,
                        industria: item.industria,
                        entidad_id: item.cod_entidad
                      }} 
                      usuario={{
                        cod_usuario: item.cod_usuario,
                        nombre: `${item.nom_empleado || ""} ${item.apellido_emp || ""}`,
                        tipo_asesor: item.nom_tipo
                      }}
                      cod_empresa={currentEmpresa.cod_empresa} cod_cenco={currentCentroCosto.cod_cc} 
                      // cod_empresa={1} cod_cenco={16} usuario={{cod_usuario: 52, nombre: "TEST"}}
                  />
              }
              {
                  (!item || item.cod_estado != 1) && 
                  <Typography sx={{px: 2, py: 1}} fontSize={18}>
                    No hay información que mostrar
                  </Typography>
              }
              
            </Box>
          },
        ]}
      />
      </Box>

      {/* Nombre del elemento */}
      
    </Box>
  );
};

export default VistaAsignacionCTS;
