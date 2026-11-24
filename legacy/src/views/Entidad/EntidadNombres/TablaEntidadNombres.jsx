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
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";

const TablaEntidadNombres = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, tipo, entidad_id } = props;
  const { estados = [], tipos = [], paises = [], empresas = [] } = catalogos;
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
  const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };
  const { permisosArray } = useObtenerOpcionesAcciones();
  useEffect(() => {
    setListaAProcesar(lista);
  }, [lista]);

  const encabezados = [
    { field: "entidadnombre_id", headerName: "Código", editable: false, type: "text" },
    { field: "entidadnombre_nombre", headerName: "Nombre", editable: true, type: "text" },
    {
      field: "pais",
      headerName: "Pais",
      editable: true,
      type: "singleSelect",
      valueOptions: empresas
        ?.reduce((acc, obj) => {
          if (!acc.some((item) => item.pais_emp === obj.pais_emp)) acc.push(obj);
          return acc;
        }, [])
        .map((i) => ({ ...paises.find((e) => e.cod_pais === i.pais_emp) })),
      labelOption: "nombre_pais",
      valueOption: "cod_pais",
    },
    {
      field: "tipo",
      headerName: "Tipo",
      editable: (f) => {
        console.log(f);
        return f.entidadnombre_id === null ? true : f.tipo === null;
      },
      type: "singleSelect",
      valueOptions: tipos.map((i) => ({ ...i, tipo_descripcion: i.nom_tipo })),
      labelOption: "tipo_descripcion",
      valueOption: "cod_tipo",
    },
    {
      field: "estado",
      headerName: "Estado",
      editable: false,
      type: "boolean" /* valueOptions: tipos, labelOption: "nom_tipo", valueOption: "cod_tipo" */,
    },
  ];
  const obtenerAccionesSegunPermisos = useCallback(() => {
    let item = permisosArray.find((i) => i.nom_opcion === "Nombres");
    return {
      ...permisosBase,
      add: item?.acciones.some((i) => i.cod_accion === 3),
      // view: item?.acciones.some((i) => i.cod_accion === 1),
      edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      delete: item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
    };
  }, [permisosArray, permisosBase]);
  const datos = useMemo(() => {
    return listaAProcesar.map((i) => ({
      ...i,
      tipo: i.cod_tipo || i.tipo_descripcion ? { cod_tipo: i.cod_tipo, tipo_descripcion: i.tipo_descripcion } : null,
      pais: i.cod_pais || i.nombre_pais ? { cod_pais: i.cod_pais, nombre_pais: i.nombre_pais } : null,
      estado: i.cod_estado === 1,
    }));
  }, [listaAProcesar]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = useCallback(
    async (row) => {
      console.log("Eliminando fila: ", row);
      const { entidadnombre_id } = row;
      api.post("/api/appweb/eliminar-entidad-nombres", { entidad_id, entidadnombre_id }).then((i) => reConsultar());
    },
    [entidad_id, reConsultar]
  );

  const agregar = useCallback(
    async (row) => {
      const { cod_pais, cod_estado, entidadnombre_nombre, cod_tipo } = row;
      await api.post("api/appweb/insertar-entidad-nombres", { entidad_id, cod_pais, cod_estado, entidadnombre_nombre, cod_tipo }).then((i) => reConsultar());
    },
    [entidad_id, reConsultar]
  );

  const guardar = useCallback(
    (row) => {
      const { cod_pais, cod_estado, entidadnombre_nombre, cod_tipo, entidadnombre_id } = row;
      api
        .post("api/appweb/actualizar-entidad-nombres", {
          entidad_id,
          entidadnombre_id,
          cod_pais,
          cod_estado,
          entidadnombre_nombre,
          cod_tipo,
        })
        .then((i) => reConsultar());
    },
    [entidad_id, reConsultar]
  );
  // Ir a la vista de EntidadNombres en modo vista
  const verAFila = (fila) => {
    return fila && obtenerFilaSeleccionada(fila?.content);
  };
  // Ir a la vista de EntidadNombres en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        encabezados={encabezados}
        data={datos}
        alwaysSave
        idKey="entidadnombre_id"
        onRowAdded={async (id, row) => {
          await agregar({
            ...row,
            entidad_nombre: row.entidad_nombre,
            cod_tipo: row.tipo?.cod_tipo,
            tipo_descripcion: row.tipo?.tipo_descripcion,
            cod_pais: row.pais?.cod_pais,
            nombre_pais: row.pais?.nombre_pais,
          });
        }}
        onRowDeleted={(id, row) => {
          setListaAProcesar((lista) => lista.filter((i) => i.entidadnombre_id !== row.id));
          if (lista.some((i) => i.entidadnombre_id === id)) eliminarFila(row);
        }}
        // editarEnTabla={false}
        // onInput={(input) => console.log({ input })}
        onRowEdit={(id, row) => setFilaSeleccionada(row)}
        onRowUpdated={async (id, row) => {
          setListaAProcesar((lista) =>
            lista.map((i) =>
              i.entidadnombre_id !== row.id
                ? i
                : {
                    ...row,
                    cod_tipo: row.tipo?.cod_tipo,
                    tipo_descripcion: row.tipo?.tipo_descripcion,
                    cod_pais: row.pais?.cod_pais,
                    nombre_pais: row.pais?.nombre_pais,
                  }
            )
          );
          await guardar({
            ...row,
            entidad_nombre: row.entidad_nombre,
            cod_tipo: row.tipo?.cod_tipo,
            tipo_descripcion: row.tipo?.tipo_descripcion,
            cod_pais: row.pais?.cod_pais,
            nombre_pais: row.pais?.nombre_pais,
          });
        }}
        columnasAExtender={[1, 2]}
        objetoBase={{
          entidadnombre_id: 0,
          codigo_entidad: "",
          entidad_nombre: "",
          entidad_id: 0,
          entidadnombre_nombre: "",
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
        camposRequeridosParaGuardar={{
          entidadnombre_nombre: "Nombre",
          pais: "Pais",
          tipo: "Tipo",
        }}
        textoAlertaEliminacion={(id) => {
          let l = lista.find((i) => i.entidadnombre_id === id);
          return (
            <>
              ¿Esta seguro que desea eliminar el registro <b>{l?.entidadnombre_nombre || ""}</b>?
            </>
          );
        }}
        filaSeleccionada={obtenerFilaSeleccionada} // BOTON DE OJO
        acciones={obtenerAccionesSegunPermisos() /* { ver: false, editar: true, eliminar: true, guardar: true } */}
        // textoAlertaEliminacion={"¿Esta seguro que desea eliminar el registro?"}
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
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};
TablaEntidadNombres.propTypes = {
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
export default TablaEntidadNombres;
