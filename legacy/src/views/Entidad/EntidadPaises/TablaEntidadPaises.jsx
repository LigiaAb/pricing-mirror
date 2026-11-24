import React, { useCallback, useMemo, useState } from "react";
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
import { CODS_ESTADOS } from "../../../constants/estados";

const TablaEntidadPaises = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, tipo, entidad_id } = props;
  const { estados = [], empresas = [], paises = [] } = catalogos;
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  // Encabezados
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [listaAProcesar, setListaAProcesar] = useState(lista || []);
  const { permisosArray } = useObtenerOpcionesAcciones();
  const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };
  const datos = useMemo(() => {
    return lista.map((i) => ({
      ...i,
      pais: paises.find((p) => i?.cod_pais === p.cod_pais),
      estado: [11, 12, 14, 16].includes(i?.cod_estado),
      // accionesDeTabla: { auth: [CODS_ESTADOS.ACTIVO].includes(i?.cod_estado) },
    }));
  }, [lista, paises]);
  const encabezados = useMemo(
    () => [
      // { field: "entidadpais_id", headerName: "Código", editable: false, type: "text" },
      {
        field: "pais",
        headerName: "Pais",
        editable: true,
        type: "select",
        valueOptions: paises.filter((p) => empresas.some((e) => p.cod_pais === e.pais_emp) && !datos.some((d) => d.cod_pais === p.cod_pais)),
        labelOption: "nombre_pais",
        valueOption: "cod_pais",
      },
      // { field: "estado_desc", headerName: "Estado", editable: false, type: "text" },
    ],
    [empresas, datos, paises]
  );
  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Nombres");
    return {
      ...permisosBase,
      agregar: paises.filter((p) => empresas.some((e) => p.cod_pais === e.pais_emp) && !datos.some((d) => d.cod_pais === p.cod_pais)).length == 0, // item?.acciones.some((i) => i.cod_accion === 3),
      ver: item?.acciones.some((i) => i.cod_accion === 1),
      editar: item?.acciones.some((i) => i.cod_accion === 2),
      guardar: item?.acciones.some((i) => i.cod_accion === 2),

      add: paises.filter((p) => empresas.some((e) => p.cod_pais === e.pais_emp) && !datos.some((d) => d.cod_pais === p.cod_pais)).length > 0, // item?.acciones.some((i) => i.cod_accion === 3),
      view: item?.acciones.some((i) => i.cod_accion === 1),
      // edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      // eliminar: item?.acciones.some((i) => i.cod_accion === 5),
    };
  };
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */

  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  const eliminarFila = useCallback(
    async (row) => {
      const { entidadpais_id, cod_estado, cod_pais } = row;
      if (entidadpais_id) api.post("/api/appweb/actualizar-entidad-paises", { entidad_id, cod_estado: 11, entidadpais_id, cod_pais }).then((i) => reConsultar());
    },
    [entidad_id, reConsultar]
  );
  const guardar = useCallback(
    (row) => {
      const { cod_pais, cod_estado, entidadpais_id } = row;
      if (!!cod_pais && !!cod_estado) api.post("api/appweb/actualizar-entidad-paises", { cod_estado: 11, entidad_id: Number(entidad_id), entidadpais_id, cod_pais }).then((i) => reConsultar());
    },
    [entidad_id, reConsultar]
  );
  const agregar = useCallback(
    async (row) => {
      const { cod_pais, cod_estado } = row;
      if (cod_pais) await api.post("api/appweb/insertar-entidad-paises", { cod_estado: 11, entidad_id: Number(entidad_id), cod_pais }).then((i) => reConsultar());
    },
    [entidad_id, reConsultar]
  );
  const onInput = ({ field, id, value }) => {
    // console.log({ field, id, value });
    setFilaSeleccionada((val) => ({ ...val, row: { ...val.row, [field]: value } }));
  };

  const darFormato = (row) => ({
    ...row,
    cod_pais: row.pais?.cod_pais,
    nombre_pais: row.pais?.nombre_pais,
    cod_estado: row.estado ? 11 : 2,
  });

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        encabezados={encabezados}
        data={datos}
        idKey="entidadpais_id"
        accionesTooltip={{ auth: "Reactivar Pais" }}
        onRowAdded={(id, row) => agregar(darFormato(row))}
        onDeleteRow={(row) => {
          setListaAProcesar((lista) => lista.filter((i) => i.entidadpais_id !== row.id));
          if (lista.some((i) => i.entidadpais_id === row.id)) eliminarFila(row.row);
        }}
        // onInput={onInput}
        onRowView={(id, row) => {
          console.log(row);
          obtenerFilaSeleccionada(row);
        }}
        onRowSave={async (row) => {
          console.log(row);
          setListaAProcesar((lista) =>
            lista.map((i) =>
              i.entidadpais_id !== row.id
                ? i
                : {
                    ...row.row,
                    cod_pais: row.row.pais?.cod_pais,
                    nombre_pais: row.row.pais?.nombre_pais,
                    cod_estado: row.estado ? 11 : 2,
                  }
            )
          );
          console.log(lista.some((i) => i.entidadpais_id === row.id));
          if (lista.some((i) => i.entidadpais_id === row.id)) {
            await guardar({
              ...row.row,
              cod_pais: row.row.pais?.cod_pais,
              nombre_pais: row.row.pais?.nombre_pais,
              cod_estado: 11,
            });
          } else {
            await agregar({
              ...row.row,
              cod_pais: row.row.pais?.cod_pais,
              nombre_pais: row.row.pais?.nombre_pais,
              cod_estado: row.estado ? 11 : 2,
            });
          }
        }}
        columnasAExtender={[0]}
        // columnaAExtender={2}
        objetoBase={{
          entidadpais_id: 0,
          cod_pais: 0,
          nombre_pais: "",
          entidad_id,
          entidad_nombre: "",
          entidad_clasificacion: "",
          cod_estado: 1,
          estado_desc: "Activo",
          pais: null,
          estado: true,
        }}
        camposRequeridosParaGuardar={{ pais: "Pais" }}
        textoAlertaEliminacion={(id) => {
          let l = lista.find((i) => i.entidadpais_id === id);
          return (
            <>
              ¿Esta seguro que desea eliminar el registro <b>{l?.entidadnombre_nombre || ""}</b>?
            </>
          );
        }}
        acciones={obtenerAccionesSegunPermisos() /* { ver: false, editar: true, eliminar: true, guardar: true } */}
        filaSeleccionada={obtenerFilaSeleccionada} // BOTON DE OJO
        // textoAlertaEliminacion={"¿Esta seguro que desea eliminar el registro?"}
        // camposRequeridosParaGuardar={{ cod_tipo: "Tipo", entidaddireccion_direccion: "Dirección" }}
      />
      <Grid container>
        {/* <pre>
          {JSON.stringify(
            paises.filter((p) => empresas.some((e) => p.cod_pais === e.pais_emp) && !datos.some((d) => d.cod_pais === p.cod_pais)),
            null,
            2
          )}
        </pre> */}
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(encabezados, null, 2)}</pre> */}
        {/* <pre>
          {JSON.stringify(
            empresas.filter((obj, index, self) => index === self.findIndex((t) => t.pais_emp === obj.pais_emp)).map((i) => ({ ...paises.find((p) => p.cod_pais === i.pais_emp) })),
            null,
            2
          )}
        </pre> */}
      </Grid>
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
TablaEntidadPaises.propTypes = {
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
export default TablaEntidadPaises;
