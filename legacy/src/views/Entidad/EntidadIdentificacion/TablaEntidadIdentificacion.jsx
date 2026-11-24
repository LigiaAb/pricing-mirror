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
import { useCreateEntidadIdentificaciones, useUpdateEntidadIdentificaciones } from "../../../hooks/Fetch/useFetchEntidades";
import { useSelector } from "react-redux";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";
import { id } from "date-fns/locale";

const TablaEntidadIdentificacion = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, tipo, entidad_id } = props;
  const { estados = [], identificaciones = [], listaTiposSV = {} } = catalogos;
  const navigate = useNavigate();
  const crearIdentificacion = useCreateEntidadIdentificaciones();
  const editarIdentificacion = useUpdateEntidadIdentificaciones();
  const { currentPais } = useSelector((state) => state.menu);

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
  const permisosBase = {
    ver: false,
    editar: false,
    eliminar: false,
    guardar: false,
  };
  const { permisosArray } = useObtenerOpcionesAcciones();
  const identificaciones_filtradas = useMemo(() => identificaciones.filter((i) => !i.cod_pais || i.cod_pais === currentPais?.cod_pais), [identificaciones, currentPais]);
  const encabezados = useMemo(
    () => [
      {
        field: "entidadidentificacion_id",
        headerName: "Código",
        editable: false,
        type: "text",
      },
      // { field: "nom_identificacion", headerName: "Nombre", editable: true, type: "text" },
      {
        field: "identificacion",
        headerName: "Identificacion",
        editable: true,
        type: "singleSelect",
        valueOptions: identificaciones_filtradas.filter((i) => Number(i.cod_tipo) === Number(tipo)),
        labelOption: "nom_identificacion",
        valueOption: "cod_identificacion",
      },
      {
        field: "entidadidentificacio_numero_tipo",
        headerName: "Identificacion",
        editable: (row) => [40, 41, 42].includes(Number(row?.identificacion?.cod_identificacion)),
        visible: identificaciones_filtradas.filter((i_f) => [40, 41, 42].includes(Number(i_f.cod_identificacion))).length > 0,
        type: "singleSelect",
        valueOptions: (params) => {
          if (params) return listaTiposSV[params.identificacion?.cod_identificacion] || [];
          else if (filaSeleccionada) return listaTiposSV[filaSeleccionada?.identificacion?.cod_identificacion] || [];
          return [];
        },
        labelOption: "descripcion",
        valueOption: "cod_tipo",
      },
      {
        field: "entidadidentificacio_numero",
        minWidth: 120,
        headerName: "Valor",
        editable: (row, id) => {
          if (row?.identificacion?.identificacion_valor === "S") {
            return true;
          } else [40, 41, 42].includes(Number(filaSeleccionada?.row?.identificacion?.cod_identificacion));
        },
        type: "text",
      },
      {
        field: "entidadidentificacion_ruta",
        headerName: "Archivo",
        minWidth: 120,
        editable: (row, id) => {
          if (row?.identificacion?.identificacion_documentacion === "S") {
            if (row.isNew) return true;
            return !row.entidadidentificacion_ruta || row.entidadidentificacion_ruta === "";
          } else return false;
        },
        multiline: true,
        type: "archivo",
        acceptedFiles: ["image/jpeg", "image/png", "application/pdf"],
      },
      {
        field: "entidadidentificacion_fecha_inicio",
        headerName: "Fecha de inicio",
        setMax: () => {
          return filaSeleccionada?.row?.entidadidentificacion_fecha_fin || undefined;
        },
        varificarSiEsEditable: ({ row, field }) => row?.isNew,
        editable: true,
        type: "date",
      },
      {
        field: "entidadidentificacion_fecha_fin",
        headerName: "Fecha final",
        setMin: () => {
          return filaSeleccionada?.row?.entidadidentificacion_fecha_inicio || undefined;
        },
        varificarSiEsEditable: ({ row, field }) => row?.isNew,
        editable: true,
        type: "date",
      },
      {
        field: "estado",
        headerName: "Estado",
        editable: false,
        type: "boolean",
      },
    ],
    [filaSeleccionada, identificaciones_filtradas, lista]
  );
  const datos = useMemo(() => {
    return listaAProcesar.map((i) => ({
      ...i,
      estado: i.cod_estado === 1,
      identificacion: identificaciones.find((id) => id.cod_identificacion === i.cod_identificacion) || null,
      accionesDeTabla: {
        download: !!i.entidadidentificacion_ruta,
      },
    }));
  }, [listaAProcesar, identificaciones]);
  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Identificaciones");
    return {
      ...permisosBase,
      add: item?.acciones.some((i) => i.cod_accion === 3),
      view: false, // item?.acciones.some((i) => i.cod_accion === 1),
      edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      delete: item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
      // print: true,

      agregar: item?.acciones.some((i) => i.cod_accion === 3),
      ver: false, // item?.acciones.some((i) => i.cod_accion === 1),
      editar: item?.acciones.some((i) => i.cod_accion === 2),
      guardar: item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
    };
  };
  const objetoBase = useMemo(
    () => ({
      entidadidentificacion_id: 0,
      codigo_entidad: "",
      entidad_id: 0,
      entidad_nombre: "",
      cod_identificacion: 0,
      nom_identificacion: "",
      entidadidentificacio_numero: "",
      cod_estado: 1,
      estado_desc: "",
      entidadidentificacion_fecha_inicio: null,
      entidadidentificacion_fecha_fin: null,
      entidadidentificacion_ruta: null,
      estado: null,
      identificacion: null,
      isNew: true,
    }),
    []
  );

  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  // const eliminarFila = useCallback(
  //   async (row) => {
  //     const { entidadidentificacion_id } = row;
  //     if (entidadidentificacion_id)
  //       api.post("/api/appweb/eliminar-entidad-direccion", { entidad_id, entidadidentificacion_id }).then((i) => reConsultar());
  //   },
  //   [entidad_id, reConsultar]
  // );

  const armarFormData = useCallback(
    async (valores) => {
      if (valores.entidadidentificacion_ruta) {
        if (typeof valores.entidadidentificacion_ruta === "string") {
          return valores;
        } else {
          const formData = new FormData();

          formData.append("archivo", valores["entidadidentificacion_ruta"]);
          formData.append("tipo_documento", "entidad");
          formData.append("cod_tipo", Number(tipo));
          formData.append("entidad_id", Number(entidad_id));

          let ruta = await api.post("/api/appweb/guardar-archivo", formData).then(({ data }) => data.data.ruta_archivo);

          return { ...valores, entidadidentificacion_ruta: ruta };
        }
      } else {
        return valores;
      }
    },
    [tipo, entidad_id]
  );

  const eliminarFila = useCallback(
    async (row) => {
      const { entidadidentificacion_id, cod_identificacion, entidadidentificacio_numero_tipo, entidadidentificacio_numero } = row;
      await api
        .post(
          "api/appweb/eliminar-entidad-identificacion",
          await armarFormData({
            entidad_id: Number(entidad_id),
            entidadidentificacion_id,
            // cod_identificacion,
            // entidadidentificacio_numero: entidadidentificacio_numero_tipo ? entidadidentificacio_numero_tipo.cod_tipo : entidadidentificacio_numero,
            // cod_estado: 4,
          })
        )
        .then((i) => reConsultar());
    },
    [entidad_id, reConsultar, armarFormData]
  );
  const guardar = useCallback(
    async (row) => {
      const {
        entidadidentificacion_id,
        cod_identificacion,
        entidadidentificacio_numero_tipo,
        entidadidentificacio_numero,
        entidadidentificacion_fecha_inicio,
        entidadidentificacion_fecha_fin,
        entidadidentificacion_ruta,
      } = row;
      await api
        .post(
          "api/appweb/actualizar-entidad-identificacion",
          await armarFormData({
            entidad_id: Number(entidad_id),
            entidadidentificacion_id,
            cod_identificacion,
            entidadidentificacio_numero: entidadidentificacio_numero_tipo ? entidadidentificacio_numero_tipo.cod_tipo : entidadidentificacio_numero,
            cod_estado: 1,
            entidadidentificacion_fecha_inicio,
            entidadidentificacion_fecha_fin,
            entidadidentificacion_ruta,
          })
        )
        .then((i) => reConsultar());
    },
    [entidad_id, reConsultar, armarFormData]
  );
  const agregar = useCallback(
    async (row) => {
      const {
        cod_identificacion,
        entidadidentificacio_numero_tipo,
        entidadidentificacio_numero,
        cod_estado,
        entidadidentificacion_fecha_inicio,
        entidadidentificacion_fecha_fin,
        entidadidentificacion_ruta,
      } = row;
      await api
        .post(
          "api/appweb/insertar-entidad-identificacion",
          await armarFormData({
            entidad_id: Number(entidad_id),
            cod_identificacion,
            entidadidentificacio_numero: entidadidentificacio_numero_tipo ? entidadidentificacio_numero_tipo.cod_tipo : entidadidentificacio_numero,
            cod_estado,
            entidadidentificacion_fecha_inicio,
            entidadidentificacion_fecha_fin,
            entidadidentificacion_ruta,
          })
        )
        .then((i) => reConsultar());
    },
    [entidad_id, reConsultar, armarFormData]
  );

  const onInput = (row) => {
    const { field, id, value } = row;

    if (field === "identificacion") {
      setFilaSeleccionada((val) => ({
        ...val,
        row: {
          ...val.row,
          cod_identificacion: value ? value.cod_identificacion : null,
          identificacion: value,
        },
      }));
      setListaAProcesar((lista) =>
        lista.map((row) =>
          row.id !== id
            ? row
            : {
                ...row,
                cod_identificacion: value ? value.cod_identificacion : null,
                identificacion: value,
              }
        )
      );
    }
  };

  useEffect(() => {
    setListaAProcesar(lista);
  }, [lista]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        idKey="entidadidentificacion_id"
        encabezados={encabezados}
        data={datos}
        objetoBase={objetoBase}
        acciones={obtenerAccionesSegunPermisos() /* { ver: false, editar: true, eliminar: true, guardar: true } */}
        onRowUpdated={async (id, row) => {
          await guardar({ ...row, cod_identificacion: row?.identificacion?.cod_identificacion, nom_identificacion: row?.identificacion?.nom_identificacion });
        }}
        onRowAdded={async (id, row) => {
          await agregar({ ...row, cod_identificacion: row?.identificacion?.cod_identificacion, nom_identificacion: row?.identificacion?.nom_identificacion });
        }}
        onRowDeleted={async (id, row) => {
          await eliminarFila(row);
        }}
        onRowDownload={async (id, row) => {
          const response = await api.post("/api/appweb/recuperar-archivo", { ruta_archivo: row.entidadidentificacion_ruta }, { responseType: "blob" });

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;

          // Extraer el nombre del archivo de la ruta
          const nombreArchivo = row.entidadidentificacion_ruta.split("/").pop();
          link.setAttribute("download", nombreArchivo);

          document.body.appendChild(link);
          link.click();
          link.remove();
        }}
        onInput={({ field, value, row, id }) => {
          let row_ = { ...row };

          if (field === "identificacion") {
            row_ = { ...row_, entidadidentificacio_numero_tipo: objetoBase.entidadidentificacio_numero_tipo };
          }

          console.log(row, row_);

          return {
            row: {
              ...row_,
              [field]: value,
            },
          };
        }}
        camposRequeridosParaGuardar={{
          identificacion: "Identificación",
          ...([40, 41, 42].includes(Number(filaSeleccionada?.row?.identificacion?.cod_identificacion)) ? { entidadidentificacio_numero_tipo: "Tipo" } : {}),
          ...(![40, 41, 42].includes(Number(filaSeleccionada?.row?.identificacion?.cod_identificacion)) && filaSeleccionada?.row?.identificacion?.identificacion_valor === "S"
            ? { entidadidentificacio_numero: "Valor" }
            : {}),
          // ...(filaSeleccionada?.row?.identificacion?.identificacion_documentacion === "S" ? { entidadidentificacion_ruta: "Archivo" } : {}),
        }}
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
      <Grid container>
        {/* <pre>
          {JSON.stringify(
            filaSeleccionada
              ? {
                  identificacion: "Identificación",
                  ...(filaSeleccionada?.row?.identificacion?.identificacion_valor === "S" ? { entidadidentificacio_numero: "Valor" } : {}),
                  // ...(filaSeleccionada?.row?.identificacion?.identificacion_documentacion === "S" ? { entidadidentificacion_ruta: "Archivo" } : {}),
                }
              : { cod_tipo: "Tipo", entidaddireccion_direccion: "Dirección" }
          )}
        </pre> */}
        {/* <pre>{JSON.stringify(identificaciones, null, 2)}</pre> */}

        {/* <pre>
          {JSON.stringify(
            identificaciones_filtradas.filter((i) => Number(i.cod_tipo) === Number(tipo)),
            null,
            2
          )}
        </pre> */}
        {/* <pre>{JSON.stringify(identificaciones_filtradas, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(permisosBase, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(encabezados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ identificacion_valor: filaSeleccionada?.row?.identificacion?.identificacion_valor === "S" }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ identificacion_documentacion: filaSeleccionada?.row?.identificacion?.identificacion_documentacion === "S" }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(filaSeleccionada?.row?.isNew, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(lista, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(listaTiposSV, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(currentPais, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(identificaciones, null, 2)}</pre> */}
        {/* <pre>
          {JSON.stringify(
            identificaciones.filter((i) => Number(i.cod_tipo) === Number(tipo)),
            null,
            2
          )}
        </pre> */}
      </Grid>
    </Box>
  );
};
TablaEntidadIdentificacion.propTypes = {
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
export default TablaEntidadIdentificacion;
