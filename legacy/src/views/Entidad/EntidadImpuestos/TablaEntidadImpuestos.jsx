import { useEffect, useState, useCallback } from "react";
import { Box } from "@mui/material";
import { api } from "../../../api";
import PropTypes from "prop-types";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import useColumnsTablaEntidadImpuestos from "./useColumnsTablaEntidadImpuestos";
import LoaderComponent from "../../../components/Loader/LoaderComponent";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import { useDispatch } from "react-redux";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";

const mapFilaToSendToApiFormat = (fila) => {
  return {
    ...fila,
    impuestopais_id: fila.impuestoPais?.cod_impuesto_pais,
    cod_estado: fila.estado?.cod_estado,
  };
};

const TablaEntidadImpuestos = ({ entidad_id }) => {
  entidad_id = parseInt(entidad_id);
  const dispatch = useDispatch();
  const { permisosArray } = useObtenerOpcionesAcciones();

  const [listaAProcesar, setListaAProcesar] = useState([]);
  const [paises, setPaises] = useState([]);
  const [paisesEntidad, setPaisesEntidad] = useState([]);
  const [impuestosPorPais, setImpuestosPorPais] = useState([]);
  const [impuestosSeleccionables, setImpuestosSeleccionables] = useState([]);
  const [impuestoSeleccionado, setImpuestoSeleccionado] = useState(null);
  const [estados, setEstados] = useState([]);

  const [isLoadingImpuestosEntidad, setIsLoadingImpuestosEntidad] = useState(false);
  const [isLoadingEntidadPaises, setIsLoadingEntidadPaises] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filasConFormatoUI = listaAProcesar.map((fila) => {
    const impuestoPais = fila.impuestoPais || impuestosPorPais.find((ip) => ip.cod_impuesto_pais === fila.impuestopais_id);
    const pais = fila.pais || paises.find((p) => p.cod_pais === impuestoPais?.cod_pais);

    return {
      ...fila,
      pais,
      impuestoPais,
      porcentaje_impuesto: fila.isNew ? impuestoSeleccionado?.porcentaje_impuesto : fila.impuestoPais ? fila.impuestoPais.porcentaje_impuesto : impuestoPais?.porcentaje_impuesto,
      estado: fila.estado ? fila.estado : estados.find((e) => e.cod_estado === fila.cod_estado),
    };
  });

  const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Impuesto");
    return {
      ...permisosBase,
      add: item?.acciones.some((i) => i.cod_accion === 3),
      edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      delete: item?.acciones.some((i) => i.cod_accion === 5),
    };
  };

  const encabezados = useColumnsTablaEntidadImpuestos({
    paisesEntidad,
    impuestosSeleccionables,
    impuestosPorPais,
    estados,
  });

  const obtenerImpuestosEntidad = useCallback(async () => {
    setIsLoadingImpuestosEntidad(true);
    dispatch(encenderCarga());
    const apiBaseURL = "/api/appweb/lista-entidad-impuesto";
    const response = await api.get(apiBaseURL, { params: { entidad_id } });
    const { total_paginas } = response.data.data;
    let impuestos = response.data.data.data;
    let nopagina = 1;
    while (nopagina < total_paginas) {
      nopagina++;
      const response = await api.get(apiBaseURL, { params: { entidad_id, nopagina } });
      const impuestosEnPagina = response.data.data.data;
      impuestos = [...impuestos, impuestosEnPagina];
    }
    const impuestosConFormato = impuestos.map((i) => ({
      ...i,
      id: i.entidad_impuesto_id,
      isNew: false,
    }));
    setListaAProcesar(impuestosConFormato);
    setIsLoadingImpuestosEntidad(false);
  }, [entidad_id, dispatch]);

  const obtenerPaises = useCallback(async () => {
    const apiBaseURL = "/api/appweb/listapaises";
    const response = await api.get(apiBaseURL);
    const paises = response.data.data;
    setPaises(paises);
  }, []);

  const obtenerEntidadPaises = useCallback(async () => {
    setIsLoadingEntidadPaises(true);
    dispatch(encenderCarga());
    const apiBaseURL = "/api/appweb/lista-entidad-paises";
    const response = await api.get(apiBaseURL, { params: { entidad_id } });
    const { total_paginas } = response.data.data;
    let entidadPais = response.data.data.data;
    let nopagina = 1;
    while (nopagina < total_paginas) {
      nopagina++;
      const response = await api.get(apiBaseURL, { params: { entidad_id, nopagina } });
      const entidadPaisEnPagina = response.data.data.data;
      entidadPais = [...entidadPais, entidadPaisEnPagina];
    }
    setPaisesEntidad(entidadPais);
    setIsLoadingEntidadPaises(false);
  }, [entidad_id, dispatch]);

  const obtenerImpuestosPorPais = useCallback(async () => {
    const apiBaseURL = "/api/appweb/lista-impuesto-x-pais";
    const response = await api.get(apiBaseURL);
    const impuestosPorPais = response.data.data;
    setImpuestosPorPais(impuestosPorPais);
  }, []);

  const obtenerEstados = useCallback(async () => {
    const apiBaseURL = "/api/appweb/listaestados";
    const response = await api.get(apiBaseURL);
    const estados = response.data.data;
    setEstados(estados);
  }, []);

  useEffect(() => {
    Promise.all([obtenerImpuestosEntidad(), obtenerPaises(), obtenerEntidadPaises(), obtenerImpuestosPorPais(), obtenerEstados()]).then(() => {
      setIsLoading(false);
      dispatch(apagarCarga());
    });
  }, [obtenerImpuestosEntidad, obtenerPaises, obtenerEntidadPaises, obtenerImpuestosPorPais, obtenerEstados, dispatch]);

  useEffect(() => {
    setIsLoading(isLoadingImpuestosEntidad || isLoadingEntidadPaises);
  }, [isLoadingImpuestosEntidad, isLoadingEntidadPaises]);

  const agregarEntidadImpuesto = useCallback(
    async (id, row) => {
      const filaConFormato = mapFilaToSendToApiFormat(row);
      const apiBaseURL = "/api/appweb/insertar-entidad-impuesto";
      const reqBody = { entidad_id, ...filaConFormato, cod_estado: 1 };
      const response = await api.post(apiBaseURL, reqBody);
      const entidad_impuesto_id = parseInt(response.data.data.entidad_impuesto_id);
      row.entidad_impuesto_id = entidad_impuesto_id;
      row.id = entidad_impuesto_id;
      row.isNew = false;
      await obtenerImpuestosEntidad();
      return response.data.data.success;
    },
    [entidad_id, obtenerImpuestosEntidad]
  );

  const eliminarRegistroDb = useCallback(
    async (id, row) => {
      const apiBaseURL = "/api/appweb/eliminar-entidad-impuesto";
      const reqBody = { entidad_id, entidad_impuesto_id: row.entidad_impuesto_id };
      await api.post(apiBaseURL, reqBody);
      await obtenerImpuestosEntidad();
    },
    [entidad_id, obtenerImpuestosEntidad]
  );

  const acutalizarEntidadImpuesto = useCallback(
    async (id, row) => {
      const filaConFormato = mapFilaToSendToApiFormat(row);
      const apiBaseURL = "/api/appweb/actualizar-entidad-impuesto";
      const reqBody = { entidad_id, entidad_impuesto_id: row.entidad_impuesto_id, ...filaConFormato };
      const response = await api.post(apiBaseURL, reqBody);
      await obtenerImpuestosEntidad();
      return response.data.data.success;
    },
    [entidad_id, obtenerImpuestosEntidad]
  );

  const handleAgregarFila = (row) => {
    setListaAProcesar((prev) => [...prev, { ...row, isNew: true, aplica: true, cod_estado: 1 }]);
  };

  const handleBorrarFila = ({ row }) => {
    if (listaAProcesar.some((r) => r.id === row.id && !r.isNew)) eliminarRegistroDb(row);
    setListaAProcesar((prev) => prev.filter((r) => r.id !== row.id));
  };

  const handleRowSave = async ({ id: tableRowTemporaryId, row }) => {
    const isCreating = listaAProcesar.some((r) => r.id === tableRowTemporaryId && r.isNew);
    let success = isCreating ? await agregarEntidadImpuesto(row) : await acutalizarEntidadImpuesto(row);
    if (success) {
      setListaAProcesar((prev) => prev.map((r) => (r.id === tableRowTemporaryId ? row : r)));
    } else if (isCreating) {
      setListaAProcesar((prev) => prev.filter((r) => r.id !== tableRowTemporaryId));
    }
  };

  const hanldeChangeInput = ({ id, field, value }) => {
    if (field === "pais") setImpuestosSeleccionables(impuestosPorPais.filter((i) => i.cod_pais === value.cod_pais));
    if (field === "impuestoPais") setImpuestoSeleccionado(value);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        idKey="entidad_impuesto_id"
        encabezados={encabezados}
        data={filasConFormatoUI}
        onRowAdded={agregarEntidadImpuesto}
        onRowUpdated={acutalizarEntidadImpuesto}
        onRowDeleted={eliminarRegistroDb}
        onInput={hanldeChangeInput}
        acciones={obtenerAccionesSegunPermisos()}
        camposRequeridosParaGuardar={{
          impuestoPais: "Tipo de Impuesto",
        }}
        objetoBase={{
          aplica: true,
          cod_estado: 1,
        }}
      />

      <LoaderComponent open={isLoading} />
    </Box>
  );
};

TablaEntidadImpuestos.propTypes = {
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default TablaEntidadImpuestos;
