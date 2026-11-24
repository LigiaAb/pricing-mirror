import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api";
import { encryptId } from "../../../api/encryptDecrypt";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";
import { useFetchCentrosCosto, useFetchMonedas } from "@/hooks/Fetch/useFetchCatalog";
const TablaEntidadConfiguracion = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => { }, tipo, entidad_id } = props;
  const { configuraciones = [], tipos = [], paises = [], empresas = [], centrosCosto = [], monedas = [], cencos = [] } = catalogos;
  const { permisosArray } = useObtenerOpcionesAcciones();
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  // Encabezados
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [listaAProcesar, setListaAProcesar] = useState(lista || []);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  // const cencos = useFetchCentrosCosto();
  // const moneda = useFetchMonedas();

  // console.log("cencos", cencos)
  // console.log("centoros de costo", centrosCosto)
  // console.log("moneda", moneda.data)

  const permisosBase = { view: false, edit: false, delete: false, save: false };
  useEffect(() => {
    setListaAProcesar(lista);
  }, [lista]);

  const encabezados = [
    { field: "entidadconfiguracion_id", headerName: "Código", editable: false, type: "text" },
    {
      field: "configuracion",
      headerName: "Configuración",
      editable: true,
      type: "singleSelect",
      valueOptions: configuraciones,
      labelOption: "configuracion_descripcion",
      valueOption: "configuracion_id",
    },
    {
      field: "pais",
      headerName: "Pais",
      editable: true,
      type: "singleSelect",
      valueOptions: paises,
      labelOption: "nombre_pais",
      valueOption: "cod_pais",
    },
    // { field: "porcentaje_exencion", headerName: "% Exencion ", type:"text", editable: (row) => row?.configuracion?.configuracion_id === 13},
    { field: "porcentaje_retencion", headerName: "Porcentaje", type: "text", editable: (row) => [12, 13].includes(row?.configuracion?.configuracion_id) },
    { field: "cencos_id", headerName: "Centro Costo", type: "singleSelect", valueOptions: cencos, labelOption: "nombre_cc", valueOption: "cod_cc", editable: (row) => row?.configuracion?.configuracion_id === 14 },
    { field: "moneda_id", headerName: "Moneda", type: "singleSelect", valueOptions: monedas, labelOption: "nom_moneda", valueOption: "cod_moneda", editable: (row) => row?.configuracion?.configuracion_id === 14 },
    { field: "entidadconfiguracion_valor", headerName: "Valor", editable: true, type: "text" },
    { field: "entidadconfiguracion_fecha_inicial", headerName: "Fecha Registro", editable: false, type: "date" },
    { field: "estado", headerName: "Estado", editable: false, type: "boolean" },
    /* valueOptions: tipos, labelOption: "nom_tipo", valueOption: "cod_tipo" */
  ];

  const verificarSiEsEditable = (c, d) => {
    if (!c.editable) return false;
    if (typeof c.editable === "function") return c.editable(d, d[rowIdentifier], c);
    return c.editable
  }

  const datos = useMemo(() => {
    return listaAProcesar.map((i) => ({
      ...i,
      configuracion: i.configuracion_id || i.configuracion_descripcion ? { configuracion_id: i.configuracion_id, configuracion_descripcion: i.configuracion_descripcion } : null,
      // tipo: i.cod_tipo || i.tipo_descripcion ? { cod_tipo: i.cod_tipo, tipo_descripcion: i.tipo_descripcion } : null,
      pais: i.cod_pais || i.nombre_pais ? { cod_pais: i.cod_pais, nombre_pais: i.nombre_pais } : null,
      estado: i.cod_estado === 1,
      moneda_id: i.moneda_id
        ? monedas.find((m) => m.cod_moneda === i.moneda_id) ?? null
        : null,
      cencos_id: i.cencos_id
        ? cencos.find((c) => c.cod_cc === i.cencos_id) ?? null
        : null
    }));
  }, [listaAProcesar]);
  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Nombres");
    return {
      ...permisosBase,
      add: item?.acciones.some((i) => i.cod_accion === 3),
      // view: item?.acciones.some((i) => i.cod_accion === 1),
      edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      delete: true, // : item?.acciones.some((i) => i.cod_accion === 5),
    };
  };
  const objetoBase = useMemo(
    () => ({
      entidadconfiguracion_id: 0,
      entidad_id: 0,
      entidad_nombre: "",
      configuracion_id: 0,
      configuracion_descripcion: "",
      entidadconfiguracion_fecha_inicial: null,
      entidadconfiguracion_valor: "",
      cod_estado: 1,
      estado_desc: "",
      cod_pais: 0,
      nombre_pais: "",
      configuracion: null,
      pais: null,
      // porcentaje_exencion: null,
      porcentaje_retencion: null,
      moneda_id: 0,
      cencos_id: 0
    }),
    []
  );
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  // Ir a la vista de entidadConfiguracion en modo editar
  const agregar = useCallback(async (row) => {

    await api.post
      ("api/appweb/insertar-entidad-configuracion", { ...row, entidad_id })
      .then(
        async (i) => {
          if (row.configuracion_id === 14) {
            await api.get("/api/appweb/procesar-monedafel-oracle", { params: { entidad_id } })
          }
          reConsultar()
        }
      )
  }, [entidad_id, reConsultar]);

  const eliminarFila = useCallback(async (row) => {
    if(row.configuracion_id === 14){

      await Promise.all([
        api.post("/api/appweb/eliminar-monedafel-oracle",{
          entidad_id: row.entidad_id,
          entidadconfiguracion_id: row.entidadconfiguracion_id
         }),
        api.post("/api/appweb/eliminar-entidad-configuracion", {entidad_id, ...row})

      ]).then(() => {
            reConsultar();
        }).catch((error) => {
            console.error("Error en Promise.all:", error);
        });
    }else{
      await api.post("/api/appweb/eliminar-entidad-configuracion", { entidad_id, ...row })
        .then(() => reConsultar());
    }
    
  },[entidad_id, reConsultar]);


  const guardar = useCallback(async (row) => await api.post("api/appweb/actualizar-entidad-configuracion", { entidad_id, ...row }).then((i) => reConsultar()), [entidad_id, reConsultar]);
  // Ir a la vista de EntidadNombres en modo vista
  const verAFila = (fila) => {
    return fila && obtenerFilaSeleccionada(fila?.content);
  };

  const formatearFila = (row) => ({
    ...row,
    configuracion_id: row.configuracion?.configuracion_id,
    configuracion_descripcion: row.configuracion?.configuracion_descripcion,
    cod_pais: row.pais?.cod_pais,
    nombre_pais: row.pais?.nombre_pais,
    // porcentaje_exencion: row.porcentaje_exencion,
    porcentaje_retencion: row.porcentaje_retencion,
    moneda_id: row.moneda_id?.cod_moneda ?? null,
    cencos_id: row.cencos_id?.cod_cc ?? null
  });

  const onInputTabla = useCallback(({ field, value, row }) => {
    if (field === "configuracion") {
      const configId = value?.configuracion_id;
      return {
        row: {
          ...row,
          configuracion: value,
          // porcentaje_exencion: configId === 12 ? (row.porcentaje_exencion ?? 0) : 0,
          porcentaje_retencion: [12, 13].includes(configId) ? (row.porcentaje_retencion ?? 0) : 0
        }
      };
    }
  }, [])

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        encabezados={encabezados}
        data={datos}
        idKey="entidadconfiguracion_id"
        onRowAdded={(id, row) => agregar(formatearFila(row))}
        onRowUpdated={(id, row) => guardar(formatearFila(row))}
        onRowDeleted={(id, row) => eliminarFila(formatearFila(row))}
        objetoBase={objetoBase}
        onInput={onInputTabla}
        textoAlertaEliminacion={(id) => {
          let l = lista.find((i) => i.entidadconfiguracion_id === id);
          return (
            <>
              ¿Esta seguro que desea eliminar el registro <b>{l?.entidadnombre_nombre || ""}</b>?
            </>
          );
        }}
        filaSeleccionada={obtenerFilaSeleccionada} // BOTON DE OJO
        acciones={obtenerAccionesSegunPermisos() /* { ver: false, editar: true, eliminar: true, guardar: true } */}
        // textoAlertaEliminacion={"¿Esta seguro que desea eliminar el registro?"}
        camposRequeridos={{ pais: "Pais", configuracion: "Configuración", entidadconfiguracion_valor: "Valor" }}
      />
      <ActionAlertComponent
        aceptar={() => {
          eliminarFila(filaSeleccionada);
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="error"
        handleClose={() => { }}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
      <Grid container>
        {/* <pre>{JSON.stringify(lista, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(listaAProcesar, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(configuraciones, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};
TablaEntidadConfiguracion.propTypes = {
  tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,

  obtenerFilaSeleccionada: PropTypes.func,
};
export default TablaEntidadConfiguracion;
