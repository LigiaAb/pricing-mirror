import { useEffect, useState, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { api } from "../../../../api";
import PropTypes from "prop-types";
import EditableDataGridComponent from "../../../../components/Tabla/EditableDataGridComponent";
import useObtenerOpcionesAcciones from "../../../../hooks/useObtenerOpcionesAcciones";
import LoaderComponent from "../../../../components/Loader/LoaderComponent";
import DialogComponent from "../../../../components/Dialog/DialogComponent";
import FormularioCompletoEntidad from "../../FormularioCompletoEntidad";
import { apagarCarga, encenderCarga } from "../../../../store/slices/status/statusSlice";
import useCatalogosGridRelacionesEntidad from "./hooks/useCatalogosGridRelacionesEntidad";
import { useDispatch } from "react-redux";
import { CODS_ESTADOS } from "../../../../constants/estados";
import { useFetchTipos } from "../../../../hooks/Fetch/useFetchCatalog";
import FormularioComponent from "../../../../components/Formulario/FormularioComponent";
import TablaEditableComponent from "../../../../components/Tabla/TablaEditableComponent";
import ActionAlertComponent from "../../../../components/Dialog/ActionAlertComponent";
import { decryptId } from "../../../../api/encryptDecrypt";
import { useParams } from "react-router-dom";
import BandaAlertaComponent from "../../../../components/Alertas/BandaAlertaComponent";

const mapFilaToSendToApiFormat = (fila, entidad_id, cod_tipo) => {
  const filaConFormato = {
    ...fila,
    entidad_id_1: entidad_id,
    entidad_id_2: fila.entidad?.entidad_id,
    cod_tipo: fila.tipoRelacionEntidad?.cod_tipo,
  };

  delete filaConFormato.entidad;
  delete filaConFormato.tipoRelacionEntidad;
  delete filaConFormato.estado;

  return filaConFormato;
};

const GridRelacionesEntidad = ({ entidad, catalogos = {} }) => {
  let { encryptedId, encryptedTipo } = useParams();
  const entidad_id = decryptId(encryptedId);
  let tipo = decryptId(encryptedTipo);
  const dispatch = useDispatch();
  const { permisosArray } = useObtenerOpcionesAcciones();
  const { tiposRelacionEntidad = [], estados = [] } = useCatalogosGridRelacionesEntidad(catalogos);

  const [listaAProcesar, setListaAProcesar] = useState([]);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [isOpenDialogCrearEntidad, setIsOpenDialogCrearEntidad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [valores, setValores] = useState({ cod_tipo: null, activos: true });
  const [datos, setDatos] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [mostrarAlertaDeActivacion, setMostrarAlertaDeActivacion] = useState(false);
  const [mostrarAlertaDeEliminacion, setMostrarAlertaDeEliminacion] = useState(false);

  const [entidadExterna, setEntidadExterna] = useState(null);

  const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Relacion");
    return {
      ...permisosBase,
      agregar: valores["cod_tipo"] && item?.acciones.some((i) => i.cod_accion === 3),
      editar: item?.acciones.some((i) => i.cod_accion === 2),
      guardar: item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: item?.acciones.some((i) => i.cod_accion === 5),

      add: valores["cod_tipo"] && item?.acciones.some((i) => i.cod_accion === 3),
      edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      delete: item?.acciones.some((i) => i.cod_accion === 5),
    };
  };

  const [catalogosEntidad, setCatalogosEntidad] = useState({
    estados: [],
    tipos: [],
    // entidad: [],
    // tipo_tabla: [],
    paises: [],
    ciudades: [],
    industrias: [],
    monedas: [],
  });

  const obtenerEstados = useCallback(async () => await api.get("api/appweb/listaestados").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, estados: data.data }))), []);
  const obtenerTipos = useCallback(async () => await api.get("api/appweb/lista-tipo").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, tipos: data.data }))), []);
  const obtenerTipoEntidad = useCallback(async () => await api.get("api/appweb/lista-tipo").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, tiposEntidad: data.data }))), []);
  const obtenerPaises = useCallback(async () => await api.get("api/appweb/listapaises").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, paises: data.data }))), []);
  const obtenerCiudades = useCallback(async () => await api.get("api/appweb/lista-ciudad").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, ciudades: data.data }))), []);
  const obtenerIndustrias = useCallback(async () => await api.get("api/appweb/lista-industria").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, industrias: data.data }))), []);
  const obtenerMonedas = useCallback(async () => await api.get("api/appweb/lista-moneda").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, monedas: data.data }))), []);
  const obtenerEmpresas = useCallback(async () => await api.get("api/appweb/listaempresas").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, empresas: data.data }))), []);

  const tipoEntidad = useFetchTipos({ tipo_tabla: "ENTIDAD" });

  const filasConFormatoUI = listaAProcesar.map((relacionEntidad) => {
    const entidad =
      relacionEntidad.entidad_id_1 === entidad_id
        ? {
            entidad_id: relacionEntidad.entidad_id_2,
            entidad_nombre: relacionEntidad.entidad_nombre_2,
          }
        : {
            entidad_id: relacionEntidad.entidad_id_1,
            entidad_nombre: relacionEntidad.entidad_nombre_1,
          };
    const tipoRelacionEntidad = tiposRelacionEntidad.find((tre) => tre.cod_tipo === relacionEntidad.cod_tipo);
    const isActive = relacionEntidad.cod_estado === CODS_ESTADOS.ACTIVO;
    return {
      ...relacionEntidad,
      entidad,
      tipoRelacionEntidad,
      isActive,
    };
  });

  const filtrarPorTipo = useCallback(
    (fila) => {
      if (!valores["cod_tipo"]) return true;
      if (Number(fila.entidad_id_1) === Number(entidad_id)) return fila?.cod_tipo_e2 === valores["cod_tipo"]?.value;
      if (Number(fila.entidad_id_2) === Number(entidad_id)) return fila?.cod_tipo_e1 === valores["cod_tipo"]?.value;
    },
    [entidad_id, valores]
  );

  const obtenerEntidadRelacionada = useCallback(
    (fila) => {
      if (Number(fila.entidad_id_1) === Number(entidad_id))
        return {
          entidad_id: fila.entidad_id_2,
          entidad_nombre: fila.entidad_nombre_2,
        };
      if (Number(fila.entidad_id_2) === Number(entidad_id))
        return {
          entidad_id: fila.entidad_id_1,
          entidad_nombre: fila.entidad_nombre_1,
        };
    },
    [entidad_id]
  );

  const obtenerTipoEntidadRelacionado = useCallback(
    (fila) => {
      if (Number(fila.entidad_id_1) === Number(entidad_id)) return fila.tipo_descripcion_e2;
      if (Number(fila.entidad_id_2) === Number(entidad_id)) return fila.tipo_descripcion_e1;
    },
    [entidad_id]
  );

  const filasFiltradas = useMemo(
    () =>
      filasConFormatoUI
        .filter(filtrarPorTipo)
        .filter((fila) => (valores["activos"] ? fila?.cod_estado === CODS_ESTADOS.ACTIVO : fila?.cod_estado === CODS_ESTADOS.INACTIVO))
        .map((i) => {
          return {
            ...i,
            tipo_descripcion_e: obtenerTipoEntidadRelacionado(i),
            accionesDeTabla: {
              auth: i.cod_estado === CODS_ESTADOS.INACTIVO,
              delete: i.cod_estado === CODS_ESTADOS.ACTIVO,
              edit: i.cod_estado === CODS_ESTADOS.ACTIVO,
            },
            entidad: obtenerEntidadRelacionada(i),
          };
        }),
    [filtrarPorTipo, filasConFormatoUI, valores]
  );

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        options: tipoEntidad.data,
        label: "Tipo de Entidad",
        id: "cod_tipo",
        val: valores["cod_tipo"],
      },
      {
        tipo: "toggle",
        label: "Mostrar solo activos",
        id: "activos",
        val: valores["activos"],
      },
    ],
    [tipoEntidad.data, valores]
  );

  const encabezados = useMemo(
    () => [
      {
        // type: "selectQuery",
        // headerName: "Entidad",
        // field: "entidad",
        // valueOptions: [],
        // labelOption: "entidad_nombre",
        // valueOption: "entidad_id",
        // url: "api/appweb/busqueda-entidad-x-criterio",
        // method: "GET",
        // queryField: "ref_busqueda",
        // params: { list_descripcion_tipo: [valores["cod_tipo"] ? valores["cod_tipo"]?.label : entidad.entidad_clasificacion], tipo_busqueda: "NOMBRE" },
        // onCrear: () => setIsOpenDialogCrearEntidad(true),
        // valorExterno: entidadExterna,
        // editable: true,

        type: "singleSelect",
        headerName: "Entidad",
        field: "entidad",
        valueOptions: entidades,
        labelOption: "entidad_nombre",
        valueOption: "entidad_id",
        editable: true,
      },
      // {
      //     //tipo entidad
      //     type: 'singleSelect',
      //     headerName: 'Tipo de Entidad',
      //     field: 'tipoEntidad',
      //     valueOptions: tipoEntidad,
      //     labelOption: 'nom_tipo',
      //     valueOption: 'cod_tipo',
      //     editable: true,
      // },
      {
        type: "text",
        headerName: "Tipo de Entidad",
        field: "tipo_descripcion_e",
        editable: false,
      },
      {
        type: "singleSelect",
        headerName: "Tipo de Relación",
        field: "tipoRelacionEntidad",
        valueOptions: tiposRelacionEntidad,
        labelOption: "nom_tipo",
        valueOption: "cod_tipo",
        editable: true,
      },
      {
        type: "date",
        headerName: "Fecha Inicial",
        field: "fecha_inicial",
        editable: true,
      },
      //   {
      //     type: "date",
      //     headerName: "Fecha Final",
      //     field: "fecha_final",
      //     editable: false,
      //   },
      {
        type: "checkbox",
        headerName: "Estado",
        field: "isActive",
        editable: false,
      },
    ],
    [entidades, tiposRelacionEntidad]
  );

  const obtenerRelacionesEntidad = useCallback(async () => {
    const baseApiURL = "/api/appweb/lista-entidad-relacion";
    const response = await api.get(baseApiURL, { params: { entidad_id: entidad_id } });
    let relacionesEntidad = response.data.data;
    relacionesEntidad = relacionesEntidad.map((re) => ({
      ...re,
      id: re.cod_entidadrelacion,
      isNew: false,
    }));
    setListaAProcesar(relacionesEntidad);
  }, [entidad_id]);

  useEffect(() => {
    dispatch(encenderCarga());
    Promise.all([
      obtenerRelacionesEntidad(),
      obtenerTipos(),
      // obtenerTipoEntidad(),
      obtenerPaises(),
      obtenerCiudades(),
      obtenerIndustrias(),
      obtenerMonedas(),
      obtenerEmpresas(),
    ]).then(() => {
      setIsLoading(false);
      dispatch(apagarCarga());
    });
  }, [obtenerRelacionesEntidad]);

  const handleEntidadCreada = async (optionEntidad) => {
    const baseApiURL = "api/appweb/recuperar-datos-entidad";
    const response = await api.post(baseApiURL, { cod_tipo: optionEntidad.cod_tipo, entidad_id: optionEntidad.entidad_id });
    let [proveedor] = response.data.data.data_entidad;
    // proveedor = keysToLowerCase(proveedor);
    setIsOpenDialogCrearEntidad(false);
    // setValores(prev => ({
    //     ...prev,
    //     proveedor: {
    //         ...proveedor,
    //         value: +proveedor.entidad_id,
    //         label: `${proveedor.codigo_entidad} - ${proveedor.entidad_nombre}`,
    //     }
    // }));
  };

  const agregarRelacionEntidad = useCallback(
    async (id, row) => {
      const apiBaseURL = "/api/appweb/insertar-entidad-relacion";
      const filaConFormato = mapFilaToSendToApiFormat(row, entidad_id);
      const reqBody = {
        ...filaConFormato,
        entidad_id,
      };
      const response = await api.post(apiBaseURL, reqBody).then(() => {
        obtenerRelacionesEntidad();
      });
      const cod_entidadrelacion = +response.data.data.cod_entidadrelacion;
      row.id = row.cod_entidadrelacion = cod_entidadrelacion;
      row.isNew = false;

      return {
        success: response.data.data.success,
        cod_entidadrelacion: +response.data.data.cod_entidadrelacion,
      };
    },
    [entidad_id]
  );

  const actualizarRelacionEntidad = useCallback(
    async (row) => {
      const apiBaseURL = "/api/appweb/actualizar-entidad-relacion";
      const filaConFormatoAPI = mapFilaToSendToApiFormat(row, entidad_id);

      if (filaConFormatoAPI.cod_estado === CODS_ESTADOS.INACTIVO) {
        if (!filaConFormatoAPI.fecha_final) filaConFormatoAPI.fecha_final = new Date();
      } else {
        filaConFormatoAPI.fecha_final = null;
      }

      const response = await api.post(apiBaseURL, filaConFormatoAPI).then(() => {
        obtenerRelacionesEntidad();
      });
      return {
        success: response.data.data.success,
        cod_entidadrelacion: +response.data.data.cod_entidadrelacion,
      };
    },
    [entidad_id]
  );

  const objetoBase = useMemo(() => {
    const estadoActivo = estados.find((e) => e.cod_estado === CODS_ESTADOS.ACTIVO);
    return { isNew: true, cod_tipo_e1: entidad.cod_tipo, cod_tipo_e2: valores[`cod_tipo`]?.value, cod_estado: CODS_ESTADOS.ACTIVO, estado: estadoActivo, entidad_id };
  }, [entidad, valores, estados, entidad_id]);

  const handleAgregarFila = (row) => {
    const nuevaFila = { ...row, isNew: true, cod_tipo_e1: entidad.cod_tipo, cod_tipo_e2: valores[`cod_tipo`]?.value, cod_estado: CODS_ESTADOS.ACTIVO, estado: estadoActivo, entidad_id };
    // setListaAProcesar((prev) => [...prev, nuevaFila]);
    setFilaSeleccionada(nuevaFila);
  };

  const handleDeleteRow = async (id, row) => {
    row.cod_estado = CODS_ESTADOS.INACTIVO;
    row.estado = estados.find((e) => e.cod_estado === CODS_ESTADOS.INACTIVO);
    const success = await actualizarRelacionEntidad(row);
  };

  const handleRowSave = async (tableRowTemporaryId, row) => {
    const isCreating = listaAProcesar.some((r) => r.id === tableRowTemporaryId && r.isNew);
    const fila = { ...row };
    let { success, cod_entidadrelacion } = isCreating ? await agregarRelacionEntidad(fila) : await actualizarRelacionEntidad(fila);
    if (success) {
      const baseApiURL = "/api/appweb/lista-entidad-relacion";
      const response = await api.get(baseApiURL, { params: { cod_entidadrelacion } });
      const [relacionEntidad] = response.data.data;
      relacionEntidad.id = cod_entidadrelacion;
      setListaAProcesar((prev) => prev.map((r) => (r.id === tableRowTemporaryId ? relacionEntidad : r)));
    } else {
      setListaAProcesar((prev) => prev.filter((r) => r.id !== tableRowTemporaryId));
    }
  };

  function removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter((item) => {
      const keyValue = item[key];
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  }

  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];

    if (!valores.cod_tipo) {
      setEntidades(lista_entidades);
      return;
    }

    let tipos_entidades = [valores.cod_tipo?.label];

    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidad", { params: { tipo_entidad: tipos_entidades[tipo] } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }

    setEntidades(removeDuplicates(lista_entidades, "entidad_id"));
  }, [valores]);

  const handleInputChange = ({ id, field, value }) => {
    const fila = listaAProcesar.find((r) => r.id === id);
    const nuevoValor = { ...fila, [field]: value };

    if (field === "isActive") nuevoValor.cod_estado = value ? CODS_ESTADOS.ACTIVO : CODS_ESTADOS.INACTIVO;

    return nuevoValor;
  };

  useEffect(() => {
    obtenerEntidades();
  }, [valores]);

  return (
    <>
      <FormularioComponent inputs={inputs} onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))} botones={{ agregar: { visible: false } }} />
      <TablaEditableComponent
        idKey="cod_entidadrelacion"
        titulo={
          <>
            <BandaAlertaComponent tipo="warning" content="Para poder agregar una nueva relacion debe seleccionar el tipo de entidad a la que desea relacionarse" />
          </>
        }
        encabezados={encabezados}
        data={filasFiltradas}
        objetoBase={objetoBase}
        // lista = {lista}
        // inputs = {inputs}
        onRowAdded={agregarRelacionEntidad}
        onRowUpdated={(id, row) => actualizarRelacionEntidad(row)}
        onRowAuth={(id, row) => {
          setMostrarAlertaDeActivacion(true);
          setFilaSeleccionada(row);
        }}
        onRowDeleted={(id, row) => {
          setMostrarAlertaDeEliminacion(true);
          setFilaSeleccionada(row);
        }}
        acciones={obtenerAccionesSegunPermisos()}
        onEdditRow={(data) => setFilaSeleccionada(data?.row || null)}
        // onInput={handleInputChange}
        camposRequeridosParaGuardar={{
          entidad: "Entidad",
          tipoRelacionEntidad: "Tipo de Relación",
        }}
      />

      {/* <EditableDataGridComponent
        idKey="cod_entidadrelacion"
        encabezados={encabezados}
        datos={filasFiltradas}
        // lista = {lista}
        // inputs = {inputs}
        onAddRow={handleAgregarFila}
        onRowSave={handleRowSave}
        onDeleteRow={handleDeleteRow}
        acciones={obtenerAccionesSegunPermisos()}
        onEdditRow={(data) => setFilaSeleccionada(data?.row || null)}
        onInput={handleInputChange}
        camposRequeridosParaGuardar={{
          entidad: "Entidad",
          tipoRelacionEntidad: "Tipo de Relación",
        }}
      /> */}

      <ActionAlertComponent
        content={
          <>
            Desea reactivar la relación con la entidad <b>{filaSeleccionada?.entidad?.entidad_nombre}</b>?
          </>
        }
        openDialog={mostrarAlertaDeActivacion}
        onCancel={() => {
          setMostrarAlertaDeActivacion(false);
        }}
        onConfirm={() => {
          actualizarRelacionEntidad({ ...filaSeleccionada, cod_estado: CODS_ESTADOS.ACTIVO });
          setMostrarAlertaDeActivacion(false);
        }}
        handleClose={() => setMostrarAlertaDeActivacion(false)}
        tipo="alert"
        textoConfirmar="Si, Reactivar"
      />
      <ActionAlertComponent
        content={
          <>
            Desea eliminar la relación con la entidad <b>{filaSeleccionada?.entidad?.entidad_nombre}</b>?
          </>
        }
        openDialog={mostrarAlertaDeEliminacion}
        onCancel={() => {
          setMostrarAlertaDeEliminacion(false);
        }}
        onConfirm={() => {
          actualizarRelacionEntidad({ ...filaSeleccionada, cod_estado: CODS_ESTADOS.INACTIVO });
          setMostrarAlertaDeEliminacion(false);
        }}
        handleClose={() => setMostrarAlertaDeEliminacion(false)}
        tipo="error"
      />

      <DialogComponent titulo={`Crear ${entidad.tipo_descripcion}`} openDialog={isOpenDialogCrearEntidad} handleClose={() => setIsOpenDialogCrearEntidad(false)} width="80vw">
        <FormularioCompletoEntidad id="new" tipo={entidad.cod_tipo} cliente={{}} catalogos={catalogosEntidad} onCreate={handleEntidadCreada} />
      </DialogComponent>

      <LoaderComponent open={isLoading} />

      {/* <pre>{JSON.stringify({ filasFiltradas }, null, 2)}</pre> */}
    </>
  );
};

GridRelacionesEntidad.propTypes = {
  entidad: PropTypes.object,
  catalogos: PropTypes.object,
};

export default GridRelacionesEntidad;
