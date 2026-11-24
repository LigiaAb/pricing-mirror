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
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useSelector } from "react-redux";
import BandaAlertaComponent from "../../../components/Alertas/BandaAlertaComponent";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";
import { CODS_ESTADOS } from "../../../constants/estados";

const TablaEntidadContactos = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, tipo, entidad_id } = props;
  const { estados = [], tipos = [], paises = [], empresas = [], centrosCosto = [] } = catalogos;
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  let { json } = useSelector((slice) => slice.auth);
  // Encabezados
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaAEditar, setFilaAEditar] = useState(null);
  const [listaAProcesar, setListaAProcesar] = useState(lista || []);
  const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false, agregar: false };
  const { permisosArray } = useObtenerOpcionesAcciones();
  useEffect(() => {
    // console.log({ lista });
    setListaAProcesar(lista);
  }, [lista]);
  const centroDeCostoPrincipal = useMemo(() => {
    let empresasDeUsuario = empresas.find((i) => i.cod_empresa === json.configuracion.puesto_default.cod_emp);
    let centrosCostoDeUsuario = centrosCosto.find((i) => i.cod_cc === json.configuracion.puesto_default.cod_cc);
    return [empresasDeUsuario, centrosCostoDeUsuario];
  }, [json, empresas, centrosCosto]);
  const objetoBase = useMemo(
    () => ({
      entidadcontacto_id: 0,
      codigo_entidad: "",
      entidad_nombre: "",
      entidad_id: 0,
      cod_emp: centroDeCostoPrincipal[0]?.cod_empresa,
      cod_cc: centroDeCostoPrincipal[1]?.cod_cc,
      nombre_emp: centroDeCostoPrincipal[0]?.nombre_emp,
      nombre_cc: centroDeCostoPrincipal[1]?.nombre_cc,
      entidadcontacto_nombre: "",
      entidadcontacto_email: "",
      entidadcontacto_telefono: "",
      cod_tipo: 0,
      tipo_descripcion: "",
      cod_estado: 1,
      estado_desc: "",

      empresa: centroDeCostoPrincipal[0],
      centroCosto: centroDeCostoPrincipal[1],
      tipo: [],
    }),
    [centroDeCostoPrincipal],
  );
  const encabezados = [
    // { field: "codigo_entidad", headerName:  "Código", editable: false, type: "text" },
    { field: "entidadcontacto_id", headerName: "Código", editable: false, type: "text" },
    { field: "entidadcontacto_nombre", headerName: "Nombre", editable: true, type: "text" },
    { field: "entidadcontacto_email", headerName: "Email", editable: true, type: "email" },
    { field: "entidadcontacto_telefono", headerName: "Telefono", editable: true, type: "number" },
    // {
    //   field: "empresa",
    //   headerName: "Empresa",
    //   editable: false,
    //   type: "singleSelect",
    //   valueOptions: centroDeCostoPrincipal[0] ? [centroDeCostoPrincipal[0]] : [],
    //   labelOption: "nombre_emp",
    //   valueOption: "cod_empresa",
    // },
    // {
    //   field: "centroCosto",
    //   headerName: "Centro de Costo",
    //   editable: false,
    //   type: "singleSelect",
    //   valueOptions: centroDeCostoPrincipal[1] ? [centroDeCostoPrincipal[1]] : [],
    //   labelOption: "nombre_cc",
    //   valueOption: "cod_cc",
    // },
    {
      field: "tipo",
      headerName: "Tipo",
      editable: true,
      // varificarSiEsEditable: ({ row }) => !row.tipo || !row.entidadcontacto_id,
      type: "singleSelect",
      valueOptions: tipos.map((i) => ({ cod_tipo: i.cod_tipo, tipo_descripcion: i.nom_tipo })),
      labelOption: "tipo_descripcion",
      valueOption: "cod_tipo",
      multiple: true,
    },
    { field: "estado", headerName: "Estado", editable: false, type: "boolean" },
    /* valueOptions:  tipos, labelOption: "nom_tipo", valueOption: "cod_tipo" */
  ];

  const generarFila = (row) => {
    return {
      ...row,
      entidadcontacto_nombre: row.entidadcontacto_nombre,
      entidadcontacto_email: row.entidadcontacto_email,
      entidadcontacto_telefono: row.entidadcontacto_telefono,
      cod_tipo: row.tipo?.cod_tipo,
      nom_tipo: row.tipo?.nom_tipo,
      cod_emp: row.empresa?.cod_emp,
      nombre_emp: row.empresa?.nombre_emp,
      cod_cc: row.centroCosto?.cod_cc,
      nombre_cc: row.centroCosto?.nombre_cc,
    };
  };
  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Contactos");

    return {
      ...permisosBase,
      agregar: !centroDeCostoPrincipal[0] || !centroDeCostoPrincipal[0] ? false : item?.acciones.some((i) => i.cod_accion === 3),
      ver: item?.acciones.some((i) => i.cod_accion === 1),
      editar: item?.acciones.some((i) => i.cod_accion === 2),
      guardar: item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: item?.acciones.some((i) => i.cod_accion === 5),

      add: !centroDeCostoPrincipal[0] || !centroDeCostoPrincipal[0] ? false : item?.acciones.some((i) => i.cod_accion === 3),
      // view: item?.acciones.some((i) => i.cod_accion === 1),
      edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      delete: item?.acciones.some((i) => i.cod_accion === 5),
    };
  };
  const datos = useMemo(() => {
    return listaAProcesar
      .map((i) => ({ ...i, data_entidad_contacto_tipo: JSON.parse(i.data_entidad_contacto_tipo) }))
      .map((i) => ({
        ...i,
        tipo: Array.isArray(i.data_entidad_contacto_tipo)
          ? i.data_entidad_contacto_tipo[0]
            ? { cod_tipo: i.data_entidad_contacto_tipo[0].COD_TIPO, tipo_descripcion: i.data_entidad_contacto_tipo[0].TIPO_DESCRIPCION }
            : null
          : null,
        empresa: i.cod_emp && i.nombre_emp ? { cod_emp: i.cod_emp, nombre_emp: i.nombre_emp } : null,
        centroCosto: i.cod_cc && i.nombre_cc ? { cod_cc: i.cod_cc, nombre_cc: i.nombre_cc } : null,
        estado: i.cod_estado === 1,
      }))
      .filter((i) => i.cod_estado === 1 && i.cod_emp === centroDeCostoPrincipal[0]?.cod_empresa && i.cod_cc === centroDeCostoPrincipal[1]?.cod_cc);
  }, [centroDeCostoPrincipal, listaAProcesar]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Ir a la vista de EntidadContactos en modo vista
  // const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  // Ir a la vista de EntidadContactos en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  const eliminarFila = useCallback(
    async (row = {}) => {
      const { entidadcontacto_email, entidadcontacto_telefono, cod_estado, entidadcontacto_nombre, tipo, entidadcontacto_id } = row;
      await Promise.all(
        tipo.map((t) =>
          api.post("api/appweb/actualizar-entidad-contacto", {
            cod_emp: centroDeCostoPrincipal[0]?.cod_empresa,
            cod_cc: centroDeCostoPrincipal[1]?.cod_cc,
            entidad_id: Number(entidad_id),
            entidadcontacto_id,
            cod_estado: 5,
            entidadcontacto_nombre,
            lista_cod_tipo: [t.cod_tipo],
            // cod_tipo: 0,
            entidadcontacto_email,
            entidadcontacto_telefono: `${entidadcontacto_telefono}`,
          }),
        ),
      ).then((i) => reConsultar());
    },
    [centroDeCostoPrincipal, entidad_id, reConsultar],
  );

  const agregar = useCallback(
    async (row) => {
      const { entidadcontacto_email, entidadcontacto_telefono, cod_estado, entidadcontacto_nombre, tipo } = row;
      await Promise.all(
        tipo.map((r) => {
          const { cod_tipo, nom_tipo, tipo_tabla, cod_estado, estado_desc, tipo_descripcion } = row;
          return api.post("api/appweb/insertar-entidad-contacto", {
            cod_emp: centroDeCostoPrincipal[0]?.cod_empresa,
            cod_cc: centroDeCostoPrincipal[1]?.cod_cc,
            entidad_id: Number(entidad_id),
            cod_estado: `${cod_estado}`,
            entidadcontacto_nombre,
            lista_cod_tipo: [r.cod_tipo],
            entidadcontacto_email,
            entidadcontacto_telefono: `${entidadcontacto_telefono}`,
          });
        }),
      ).then((i) => reConsultar());
    },
    [entidad_id, reConsultar, centroDeCostoPrincipal],
  );
  const guardar = useCallback(
    async (row) => {
      const { entidadcontacto_email, entidadcontacto_telefono, cod_estado, entidadcontacto_nombre, tipo: tipoDeContacto, entidadcontacto_id } = row;
      await Promise.all(
        tipoDeContacto.map((t) =>
          api.post("api/appweb/actualizar-entidad-contacto", {
            cod_emp: centroDeCostoPrincipal[0]?.cod_empresa,
            cod_cc: centroDeCostoPrincipal[1]?.cod_cc,
            entidad_id: Number(entidad_id),
            entidadcontacto_id,
            cod_estado: `${cod_estado}`,
            entidadcontacto_nombre,
            // cod_tipo: 0,
            lista_cod_tipo: [t.cod_tipo],
            entidadcontacto_email,
            entidadcontacto_telefono: `${entidadcontacto_telefono}`,
          }),
        ),
      ).then((i) => reConsultar());
    },
    [entidad_id, reConsultar, centroDeCostoPrincipal],
  );

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <BandaAlertaComponent tipo="warning" content="Los contactos mostrados son de la empresa y centro de costo seleccionados." />
      <TablaEditableComponent
        encabezados={encabezados}
        data={datos}
        idKey="entidadcontacto_id"
        onRowUpdated={(id, row) => guardar(generarFila({ ...row, tipo: row.data_entidad_contacto_tipo }))}
        onRowAdded={(id, row) => agregar(generarFila(row))}
        onRowDeleted={(id, row) => guardar(generarFila({ ...row, tipo: row.data_entidad_contacto_tipo, cod_estado: CODS_ESTADOS.INACTIVO }))}
        objetoBase={objetoBase}
        textoAlertaEliminacion={(id, row) => {
          return (
            <>
              ¿Esta seguro que desea eliminar el contacto <b>{row?.entidadcontacto_nombre || ""}</b>?
            </>
          );
        }}
        camposRequeridosParaGuardar={{ tipo: "Tipo", entidadcontacto_nombre: "Nombre", entidadcontacto_telefono: "Telefono" }}
        acciones={obtenerAccionesSegunPermisos() /* { ver: false, editar: true, eliminar: true, guardar: true } */}
      />

      <Grid container>
        {/* <pre>
          {JSON.stringify(
            tipos.map((i) => ({ cod_tipo: i.cod_tipo, tipo_descripcion: i.nom_tipo })),
            null,
            2
          )}
        </pre> */}
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
        {/* <pre>
          {JSON.stringify(
            tipos.map((i) => ({ ...i, tipo_descripcion: i.nom_tipo })),
            null,
            2
          )}
        </pre> */}
        {/* <pre>{JSON.stringify(json, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(centroDeCostoPrincipal, null, 2)}</pre> */}
        {/* <pre>
            {JSON.stringify({ objetoBase, cod_empresa: centroDeCostoPrincipal[0]?.cod_empresa, cod_cc: centroDeCostoPrincipal[1]?.cod_cc }, null, 2)}
          </pre> */}
        {/* <pre>{JSON.stringify({ data: json.configuracion.puesto_default, empresas }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ data: json.configuracion.puesto_default, centroDeCostoPrincipal }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(listaAProcesar, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(lista, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};
TablaEntidadContactos.propTypes = {
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
export default TablaEntidadContactos;
