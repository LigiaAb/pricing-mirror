import { useEffect, useState, useCallback } from "react";
import { Box } from "@mui/material";
import { api } from "../../../api";
import PropTypes from "prop-types";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import useColumnasTablaEntidades from "./useColumnasTablaCreditos";
import LoaderComponent from "../../../components/Loader/LoaderComponent";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import { useDispatch } from "react-redux";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";

const mapFilaToSendToApiFormat = (fila) => {
  return {
    ...fila,
    cod_moneda: fila.moneda.cod_moneda,
    cod_cc: fila.centroCosto.cod_cc,
    cod_emp: fila.empresa.cod_empresa,
    cod_tipo: fila.tipo.cod_tipo,
  };
};

const TablaEntidadCreditos = ({ entidad_id }) => {
  entidad_id = parseInt(entidad_id);
  const dispatch = useDispatch();
  const { permisosArray } = useObtenerOpcionesAcciones();

  const [listaAProcesar, setListaAProcesar] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [centrosCostos, setCentrosCostos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  // Convierte el formato de la API de los creditos a formato de UI
  const filasConFormatoUI = listaAProcesar.map((credito) => ({
    ...credito,
    moneda: credito.moneda ? credito.moneda : monedas.find((m) => m.cod_moneda === credito.cod_moneda),
    empresa: credito.empresa ? credito.empresa : empresas.find((e) => e.cod_empresa === credito.cod_emp),
    centroCosto: credito.centroCosto ? credito.centroCosto : centrosCostos.find((cc) => cc.cod_cc === credito.cod_cc),
    tipo: credito.tipo ? credito.tipo : tipos.find((t) => t.cod_tipo === credito.cod_tipo),
    estado: credito.estado ? credito.estado : estados.find((e) => e.cod_estado === credito.cod_estado),
  }));

  const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Crédito");
    return {
      ...permisosBase,
      add: item?.acciones.some((i) => i.cod_accion === 3),
      edit: item?.acciones.some((i) => i.cod_accion === 2),
      save: item?.acciones.some((i) => i.cod_accion === 2),
      delete: item?.acciones.some((i) => i.cod_accion === 5),
    };
  };

  const encabezados = useColumnasTablaEntidades({
    monedas,
    centrosCostos,
    empresas,
    tipos,
    empresaSeleccionada,
  });

  const obtenerCreditos = useCallback(async () => {
    const apiBaseURL = "/api/appweb/lista-entidad-credito";
    const response = await api.get(apiBaseURL, { params: { entidad_id } });
    const { total_paginas } = response.data.data;
    let creditos = response.data.data.data;
    let nopagina = 1;
    while (nopagina < total_paginas) {
      nopagina++;
      const response = await api.get(apiBaseURL, { params: { entidad_id, nopagina } });
      const creditosDePagina = response.data.data.data;
      creditos = [...creditos, creditosDePagina];
    }
    const creditosConFormato = creditos.map((credito) => ({
      ...credito,
      id: credito.entidadcredito_id,
      isNew: false,
    }));
    setListaAProcesar(creditosConFormato);
  }, [entidad_id]);

  const obtenerMonedas = useCallback(async () => {
    const apiBaseURL = "/api/appweb/lista-moneda";
    const response = await api.get(apiBaseURL, { params: { es_operativa: true } });
    const monedas = response.data.data;
    setMonedas(monedas);
  }, []);

  const obtenerEstados = useCallback(async () => {
    const apiBaseURL = "/api/appweb/listaestados";
    const response = await api.get(apiBaseURL);
    const estados = response.data.data;
    setEstados(estados);
  }, []);

  const obtenerCentrosCostos = useCallback(async () => {
    const apiBaseURL = "/api/appweb/listacentrocosto";
    const response = await api.get(apiBaseURL);
    const centrosCostos = response.data.data;
    setCentrosCostos(centrosCostos);
  }, []);

  const obtenerEmpresas = useCallback(async () => {
    const apiBaseURL = "/api/appweb/listaempresas";
    const response = await api.get(apiBaseURL);
    const empresas = response.data.data;
    setEmpresas(empresas);
  }, []);

  const obtenerTipos = useCallback(async () => {
    const apiBaseURL = "/api/appweb/lista-tipo";
    const response = await api.get(apiBaseURL);
    const tipos = response.data.data;
    setTipos(tipos);
  }, []);

  useEffect(() => {
    dispatch(encenderCarga());
    Promise.all([obtenerCreditos(), obtenerMonedas(), obtenerEstados(), obtenerCentrosCostos(), obtenerEmpresas(), obtenerTipos()]).then(() => {
      setIsLoading(false);
      dispatch(apagarCarga());
    });
  }, [obtenerCreditos, obtenerMonedas, obtenerEstados, obtenerCentrosCostos, obtenerEmpresas, obtenerTipos, dispatch]);

  const agregarEntidadCredito = useCallback(
    async (id, row) => {
      const filaConFormato = mapFilaToSendToApiFormat(row);
      const apiBaseURL = "/api/appweb/insertar-entidad-credito";
      const reqBody = { entidad_id, ...filaConFormato, cod_estado: 1 };
      const response = await api.post(apiBaseURL, reqBody);
      const entidadcredito_id = parseInt(response.data.data.entidadcredito_id);
      row.entidadcredito_id = entidadcredito_id;
      row.id = entidadcredito_id;
      row.isNew = false;
      await obtenerCreditos();
      return response.data.data.success;
    },
    [entidad_id, obtenerCreditos]
  );

  const eliminarEntidadCredito = useCallback(
    async (id, row) => {
      const apiBaseURL = "/api/appweb/eliminar-entidad-credito";
      const reqBody = { entidad_id, entidadcredito_id: row.entidadcredito_id };
      await api.post(apiBaseURL, reqBody);
      await obtenerCreditos();
    },
    [entidad_id, obtenerCreditos]
  );

  const actualizarEntidadCredito = useCallback(
    async (id, row) => {
      const filaConFormato = mapFilaToSendToApiFormat(row);
      const apiBaseURL = "/api/appweb/actualizar-entidad-credito";
      const reqBody = { entidad_id, entidadcredito_id: row.entidadcredito_id, ...filaConFormato };
      const response = await api.post(apiBaseURL, reqBody);
      await obtenerCreditos();
      return response.data.data.success;
    },
    [entidad_id, obtenerCreditos]
  );

  const handleAgregarFila = (id, row) => {
    setListaAProcesar((prev) => [...prev, { ...row, isNew: true, cod_estado: 1 }]);
  };

  const handleDeleteRow = (id, row) => {
    if (listaAProcesar.some((r) => r.id === row.id && !r.isNew)) eliminarEntidadCredito(row);
    setListaAProcesar((prev) => prev.filter((r) => r.id !== row.id));
  };

  const handleRowSave = async (tableRowTemporaryId, row) => {
    const isCreating = listaAProcesar.some((r) => r.id === tableRowTemporaryId && r.isNew);
    let success = isCreating ? await agregarEntidadCredito(row) : await actualizarEntidadCredito(row);
    if (success) {
      setListaAProcesar((prev) => prev.map((r) => (r.id === tableRowTemporaryId ? row : r)));
    } else {
      setListaAProcesar((prev) => prev.filter((r) => r.id !== tableRowTemporaryId));
    }
  };

  const handleChangeInput = ({ id, field, value }) => {
    if (field === "empresa") setEmpresaSeleccionada(value);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        idKey="entidadcredito_id"
        encabezados={encabezados}
        data={filasConFormatoUI}
        onRowAdded={agregarEntidadCredito}
        onRowUpdated={actualizarEntidadCredito}
        onRowDeleted={eliminarEntidadCredito}
        onInput={handleChangeInput}
        acciones={obtenerAccionesSegunPermisos()}
        camposRequeridosParaGuardar={{
          moneda: "Moneda",
          empresa: "Empresa",
          centroCosto: "Centro de Costo",
          entidadcredito_dias_credito: "Dias",
          tipo: "Tipo",
          entidadcredito_fecha_inicio: "Fecha de Inicio",
          entidadcredito_fecha_fin: "Fecha de Fin",
        }}
      />

      <LoaderComponent open={isLoading} />
    </Box>
  );
};

TablaEntidadCreditos.propTypes = {
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  creditos: PropTypes.array.isRequired,
  catalogos: PropTypes.object,
};

export default TablaEntidadCreditos;
