import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api";
import { encryptId } from "../../../api/encryptDecrypt";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import { useSelector } from "react-redux";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";
const TablaEntidadDirecciones = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, tipo, entidad_id } = props;
  const { estados = [], tipos = [], paises = [], empresas = [], centrosCosto = [], departamentos = [], municipios = [] } = catalogos;
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
  const [listaDepartamentos, setListaDepartamentos] = useState([]);
  const [listaMunicipios, setListaMunicipios] = useState([]);

  const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };
  const { permisosArray } = useObtenerOpcionesAcciones();
  const { json } = useSelector((state) => state.auth);
  useEffect(() => {
    setListaAProcesar(lista);
  }, [lista]);

  const encabezados = useMemo(
    () => [
      { field: "entidaddireccion_id", headerName: "Código", editable: false, type: "text" },
      { field: "entidaddireccion_direccion", headerName: "Dirección", editable: true, type: "text" },
      { field: "entidaddireccion_zona", min: 0, headerName: "Zona", editable: true, type: "number" },
      { field: "entidaddireccion_km", min: 0, headerName: "KM", editable: true, type: "number" },
      { field: "pais", headerName: "Pais", editable: true, type: "singleSelect", valueOptions: paises, labelOption: "nombre_pais", valueOption: "cod_pais" },
      {
        field: "departamento",
        headerName: "Departamento",
        type: "singleSelect",
        editable: (row) => (row.pais ? true : false),
        varificarSiEsEditable: ({ id, field, row }) => !!row?.pais,
        valueOptions: listaDepartamentos,
        labelOption: "nombre_depto",
        valueOption: "cod_depto",
      },
      {
        field: "municipio",
        headerName: "Municipio",
        editable: (row) => (row.departamento ? true : false),
        type: "singleSelect",
        varificarSiEsEditable: ({ id, field, row }) => !!row?.departamento,
        valueOptions: listaMunicipios,
        labelOption: "nombre_muni",
        valueOption: "cod_muni",
      },
      {
        field: "tipo",
        headerName: "Tipo",
        // editable: (fila) => (fila ? fila.tipo === null : true),
        type: "singleSelect",
        valueOptions: tipos.map((i) => ({ ...i, tipo_descripcion: i.nom_tipo })),
        labelOption: "tipo_descripcion",
        valueOption: "cod_tipo",
        editable: (row) => row.entidaddireccion_id === 0,
      },
      { field: "estado", headerName: "Estado", editable: false, type: "boolean" },
    ],
    [paises, tipos, listaDepartamentos, listaMunicipios]
  );
  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Nombres");
    return {
      ...permisosBase,
      agregar: item?.acciones.some((i) => i.cod_accion === 3),
      ver: item?.acciones.some((i) => i.cod_accion === 1),
      editar: item?.acciones.some((i) => i.cod_accion === 2),
      guardar: item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: item?.acciones.some((i) => i.cod_accion === 5),

      add: item?.acciones.some((i) => i.cod_accion === 3),
      // view: item?.acciones.some((i) => i.cod_accion === 1),
      edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      delete: item?.acciones.some((i) => i.cod_accion === 5),
    };
  };
  const datos = useMemo(() => {
    return listaAProcesar.map((i) => ({
      ...i,
      tipo: i.cod_tipo && i.tipo_descripcion ? { cod_tipo: i.cod_tipo, tipo_descripcion: i.tipo_descripcion } : null,
      pais: i.cod_pais && i.nombre_pais ? { cod_pais: i.cod_pais, nombre_pais: i.nombre_pais } : null,
      departamento: i.cod_depto && i.nombre_depto ? { cod_depto: i.cod_depto, nombre_depto: i.nombre_depto } : null,
      municipio: i.cod_muni && i.nombre_muni ? { cod_muni: i.cod_muni, nombre_muni: i.nombre_muni } : null,
      estado: i.cod_estado === 1,
    }));
  }, [listaAProcesar]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  // const eliminarFila = useCallback(
  //   async (row) => {
  //     const { entidaddireccion_id } = row;
  //     if (entidaddireccion_id) api.post("/api/appweb/eliminar-entidad-direccion", { entidad_id, entidaddireccion_id }).then((i) => reConsultar());
  //   },
  //   [entidad_id, reConsultar]
  // );

  const eliminarFila = useCallback(
    async (id, row) => {
      const { cod_muni, cod_depto, cod_pais, cod_estado, entidaddireccion_direccion, entidaddireccion_zona, entidaddireccion_km, cod_tipo, entidaddireccion_id } = row;
      api
        .post("api/appweb/actualizar-entidad-direccion", {
          entidaddireccion_id,
          entidad_id: Number(entidad_id),
          cod_muni,
          cod_depto,
          cod_pais,
          cod_estado: 2,
          entidaddireccion_direccion,
          entidaddireccion_zona: `${entidaddireccion_zona || ""}`,
          entidaddireccion_km: entidaddireccion_km ? `${entidaddireccion_km}` : null,
          cod_tipo,
        })
        .then((i) => reConsultar());
    },
    [entidad_id, reConsultar]
  );
  const agregar = useCallback(
    async (row) => {
      await api.post("api/appweb/insertar-entidad-direccion", row).then((i) => reConsultar());
    },
    [reConsultar]
  );

  const guardar = useCallback(
    (row) => {
      api.post("api/appweb/actualizar-entidad-direccion", row).then((i) => reConsultar());
    },
    [reConsultar]
  );
  // Ir a la vista de EntidadNombres en modo vista
  const verAFila = (fila) => {
    return fila && obtenerFilaSeleccionada(fila?.content);
  };

  const darFormato = (row) => ({
    ...row,
    entidad_id,
    cod_tipo: row.tipo?.cod_tipo,
    cod_pais: row.pais?.cod_pais,
    cod_depto: row.departamento?.cod_depto,
    cod_muni: row.municipio?.cod_muni,
    estado: undefined,
    tipo: undefined,
    pais: undefined,
  });

  const onInput = useCallback(
    ({ field, value, row, id, isNew }) => {
      // console.log({ field, id, value, filaSeleccionada });

      if (field === "pais") {
        setListaDepartamentos(departamentos.filter((i) => i.cod_pais === value?.cod_pais));
        return { row: { ...row, pais: value, departamento: null, municipio: null } };
      }
      if (field === "departamento") {
        setListaMunicipios(municipios.filter((i) => i.cod_depto === value?.cod_depto));
        return { row: { ...row, [field]: value } };
      }
      if (field === "municipio") {
        return { row: { ...row, [field]: value } };
      }
    },
    [municipios, departamentos]
  );

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        encabezados={encabezados}
        data={datos}
        idKey="entidaddireccion_id"
        onRowAdded={(id, row) => agregar(darFormato(row))}
        onRowUpdated={(id, row) => guardar(darFormato(row))}
        onRowDeleted={eliminarFila}
        onInput={onInput}
        objetoBase={{
          entidaddireccion_id: 0,
          codigo_entidad: "",
          entidad_nombre: "",
          entidad_id: 0,
          entidaddireccion_direccion: "",
          entidaddireccion_zona: 0,
          entidaddireccion_km: 0,
          cod_tipo: 0,
          tipo_descripcion: "",
          cod_estado: 1,
          estado_desc: "",
          cod_pais: 0,
          nombre_pais: "",
          estado: null,
          tipo: null,
          pais: null,
        }}
        textoAlertaEliminacion={(id, row) => {
          return (
            <>
              ¿Esta seguro que desea eliminar el registro <b>{row?.entidaddireccion_direccion || ""}</b>?
            </>
          );
        }}
        acciones={obtenerAccionesSegunPermisos() /* { ver: false, editar: true, eliminar: true, guardar: true } */}
        // textoAlertaEliminacion={"¿Esta seguro que desea eliminar el registro?"}
        camposRequeridosParaGuardar={{ tipo: "Tipo", entidaddireccion_direccion: "Dirección", pais: "País" }}
      />

      {/* <pre>{JSON.stringify(obtenerAccionesSegunPermisos())}</pre> */}
      {/* <pre>
        {JSON.stringify(
          permisosArray.find((i) => i.cod_opcion === 71),
          null,
          2
        )}
      </pre> */}
      {/* <Grid container>
        <Grid size={6}>
          <pre>{JSON.stringify(datos, null, 2)}</pre>
        </Grid>
        <Grid size={6}>
          <pre>{JSON.stringify(listaAProcesar, null, 2)}</pre>
        </Grid>
      </Grid> */}
      {/* <pre>{JSON.stringify(tipos, null, 2)}</pre> */}
      {/* <pre>
        {JSON.stringify(
          empresas
            .filter((obj, index, self) => index === self.findIndex((t) => t.pais_emp === obj.pais_emp))
            .map((i) => ({ ...paises.find((p) => p.cod_pais === i.pais_emp) })),
          null,
          2
        )}
      </pre> */}
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
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
      <Grid container>
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(departamentos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(filaSeleccionada, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tipos, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};
TablaEntidadDirecciones.propTypes = {
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
export default TablaEntidadDirecciones;
