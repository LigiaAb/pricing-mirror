import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useFetchAllEntidades, useFetchAllEntidadesSimple } from "../../../../hooks/Fetch/useFetchEntidades";
import { Box } from "@mui/material";
import FormularioComponent from "../../../../components/Formulario/FormularioComponent";
import { api } from "../../../../api";
import TablaDetallesComponent from "../../../../components/Tabla/TablaDetallesComponent";
import { useFetchCentrosCosto, useFetchEmpresas } from "../../../../hooks/Fetch/useFetchCatalog";
import LoaderComponent from "../../../../components/Loader/LoaderComponent";
import moment from "moment";
import { useObtenerPermisosDeMenuActual } from "../../../../hooks/useObtenerOpcionesAcciones";
import { useSelector } from "react-redux";

const SeguimientoDeCliente = ({ mostrar_filtro = true, entidad_default = null, height = 300, cod_entidad_default = null }) => {
  const entidades = useFetchAllEntidadesSimple(["clientes"], { cod_estado: 1, tipo_entidad: "CLIENTE" }, {}, ["CLIENTE"]);
  const centrosCosto = useFetchCentrosCosto({ cod_estado: 1 });
  const empresas = useFetchEmpresas({ cod_estado: 1 });
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);

  const permisosDePantallaActual = useObtenerPermisosDeMenuActual();
  const permisoPaisCC = useMemo(
    () => Object.values((Object.values(permisosDePantallaActual) || []).find((i) => i.nom_cat === "Reportes")?.opciones || {}).some((o) => o.acciones["11"]) || false,
    [permisosDePantallaActual],
  );

  const [seguimientos, setSeguimientos] = useState([]);
  const [entidadConsultada, setEntidadConsultada] = useState(null);
  const [listaIsLoading, setListaIsLoading] = useState(true);

  const [valores, setValores] = useState({ entidad_id: null, centro_costo: currentCentroCosto, empresa: currentEmpresa });

  useEffect(() => {
    console.log(seguimientos.filter((i) => `${i.nombre_cenco}`.toUpperCase().includes("IMP")));
  }, [seguimientos]);

  const seguimientosFormateados = useMemo(
    () =>
      seguimientos
        .map((item, ind) => ({
          id: ind + "_" + (item.cod_actividad || item.cod_seguimiento) + "_" + item.fecha_programada,
          ...item,
          fecha: moment(item.fecha_programada).format("DD-MM-YYYY HH:mm"),
          nombre_usuario: (item.nombre_usuario || "").toUpperCase(),
          // json: JSON.stringify(item, null, 2),
        }))
        .filter((i) => (mostrar_filtro ? (valores.empresa ? (i.cod_empresa ? i.cod_empresa === valores.empresa.value : valores.empresa.label === i.nombre_empresa) : true) : true))
        .filter((i) => (mostrar_filtro ? (valores.centro_costo ? i.cod_cenco === valores.centro_costo.value : true) : true))
        .sort(function (a, b) {
          return moment.utc(b.fecha_programada).diff(moment.utc(a.fecha_programada));
        }),
    [mostrar_filtro, seguimientos, valores],
  );

  const isLoading = useMemo(() => listaIsLoading || centrosCosto.isLoading || entidades.isLoading, [listaIsLoading, centrosCosto.isLoading, entidades.isLoading]);

  const centrosCostoFiltrados = useMemo(() => centrosCosto.data?.filter((i) => i.cod_empresa_cc === valores.empresa?.value) || [], [centrosCosto, valores]);

  const inputs = useMemo(
    () => [
      {
        id: "empresa",
        label: "Empresa",
        tipo: "select",
        options: empresas.data || [],
        val: valores.empresa,
        visible: permisoPaisCC,
      },
      {
        id: "centro_costo",
        label: "Centro de Costo",
        tipo: "select",
        options: centrosCostoFiltrados,
        val: valores.centro_costo,
        readonly: !valores.empresa,
        visible: permisoPaisCC,
      },
      {
        id: "entidad_id",
        label: "Cliente",
        tipo: "select",
        options: entidades.data?.data || [],
        labelOption: "entidad_nombre",
        valueOption: "entidad_id",
        requerido: true,
        val: valores.entidad_id,
        size: "12",
      },
    ],
    [entidades.data, centrosCostoFiltrados, empresas.data, valores, permisoPaisCC],
  );

  const consultarSeguimientos = useCallback(async () => {
    if (valores.entidad_id) {
      setEntidadConsultada(valores.entidad_id);
      setListaIsLoading(true);
      await api.get(`api/appweb/historial-actividades?entidad_id=${valores.entidad_id?.entidad_id}`).then(({ data }) => {
        setSeguimientos(data.data);
        setListaIsLoading(false);
      });
    } else {
      setSeguimientos([]);
      setEntidadConsultada(null);
      setListaIsLoading(false);
    }
  }, [valores.entidad_id]);

  useEffect(() => {
    consultarSeguimientos();
  }, [consultarSeguimientos]);
  useEffect(() => {
    setValores((v) => {
      return {
        ...v,
        entidad_id: entidad_default ? entidad_default : v.entidad_id,
        empresa: empresas.data?.find((i) => i.value === currentEmpresa?.cod_empresa) || null,
        centro_costo: centrosCosto.data?.find((i) => i.value === currentCentroCosto?.cod_cc) || null,
      };
    });
  }, [centrosCosto.data, empresas.data, entidad_default, currentEmpresa, currentCentroCosto]);

  useEffect(() => {
    setListaIsLoading(true);
    if (entidad_default) {
      setValores((v) => ({ ...v, entidad_id: entidad_default }));
    }
    if (cod_entidad_default) {
      const entidad_id = (entidades.data?.data || []).find((i) => i.entidad_id === cod_entidad_default) || null;
      console.log(entidad_id);
      setValores((v) => ({ ...v, entidad_id }));
    } else {
      setSeguimientos([]);
      setEntidadConsultada(null);
      setListaIsLoading(false);
    }
  }, [entidad_default, cod_entidad_default, entidades.data]);

  return (
    <Box sx={{ p: 0, m: 0 }}>
      {mostrar_filtro && (
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            if (id === "entidad_id") setListaIsLoading(true);
            if (id === "empresa") setValores((v) => ({ ...v, [id]: val, centro_costo: null }));
            setValores((v) => ({ ...v, [id]: val }));
          }}
          botones={{ agregar: { visible: false } }}
        />
      )}
      {/* <pre>{JSON.stringify({ permisoPaisCC }, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(seguimientosFormateados[0], null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(Object.values((Object.values(permisosDePantallaActual) || []).find((i) => i.nom_cat === "Reportes")?.opciones || {}).some((o) => o.acciones["11"]) || false, null, 2)}</pre> */}
      {isLoading ? (
        <LoaderComponent open={true} sx={{ position: "unset" }} texto="OBTENIENDO CLIENTES PARA SEGUIMIENTOS" />
      ) : (
        <TablaDetallesComponent
          key={JSON.stringify(valores)}
          titulo={entidadConsultada?.entidad_nombre ? `Seguimientos de ${entidadConsultada?.entidad_nombre}` : "Selecciona un cliente"}
          data={seguimientosFormateados}
          // usarPaginacion
          mostrar_id={false}
          height={height}
          columnas={[
            { label: "JSON", id: "json", column: "json", color: "accent.main", sx: { whiteSpace: "nowrap" } },
            { label: "Departamento", id: "nombre_cenco", column: "nombre_cenco", color: "accent.main", sx: { whiteSpace: "nowrap" } },
            { label: "Seguimiento", id: "nom_tipo", column: "nom_tipo", color: "primary.main", sx: { whiteSpace: "nowrap" } },
            { label: "Responsable", id: "nombre_usuario", column: "nombre_usuario", sx: { whiteSpace: "nowrap" } },
            { label: "Fecha", id: "fecha", column: "fecha", sx: { whiteSpace: "nowrap" } },
            { label: "Descripcion", id: "descripcion", column: "descripcion" },
            { label: "Resultado", id: "resultado", column: "resultado" },
          ]}
          id={(item) => (item.cod_actividad || item.cod_seguimiento) + "_" + item.fecha_programada + "_" + item.descripcion}
        />
      )}
      {/* <pre>{JSON.stringify(seguimientosFormateados, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(inputs, null, 2)}</pre> */}
    </Box>
  );
};

SeguimientoDeCliente.propTypes = {
  mostrar_filtro: PropTypes.bool,
  entidad_default: PropTypes.object,
  cod_entidad_default: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default SeguimientoDeCliente;
