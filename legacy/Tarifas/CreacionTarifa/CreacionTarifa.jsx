import React from "react";
import PropTypes from "prop-types";
import AcordeonComponent2 from "@/components/AcordeonComponent/AcordeonComponent2";
import { Box, Grid, Icon, Typography } from "@mui/material";
import FormularioTarifaV2 from "./components/FormularioTarifa/FormularioTarifaV2";
import TablaEditableComponent from "@/components/Tabla/TablaEditableComponent";
import { useFetchServicios } from "@/hooks/Fetch/useFetchTarifas";
import useCatalogosCotizacion from "@/views/Tarifas/Cotizaciones/hooks/useCatalogosCotizacion";
import {
  buildReadonlyFieldsFromPayload,
  buildTarifaFieldRules,
  CATALOGOS_AGREGAR_TODOS,
  DEFATULT_TODOS_VALUE,
  mapServicioConCatalogos,
} from "@/pages/Tarifas/CreacionTarifa/components/FormularioTarifa/hooks/useInputsTarifaV2";
import { api } from "@/api";
import { CODS_ESTADOS } from "@/constants/estados";
import generarExcel from "@/utils/GeneradorExcel/_generador_excel_v2";
import moment from "moment";
import BandaAlertaComponent from "@/components/Alertas/BandaAlertaComponent";

const gruposDeFiltro = ["alcance", "vigencia"];

const camposDeFiltro = [
  "nombre",
  "siglas",
  "obligatorio",
  "incoterm",
  "metodoCalculo",
  "aplicaOrigenesDestinos",
  "aplicaCommodities",
  "tipoTarifa",
  "fechaInicio",
  "fechaFin",
  "fechaCreacion",
  "fechaModificacion",
  "usuario",
];

const CreacionTarifa = () => {
  const [abrirFiltroTarifas, setAbrirFiltroTarifas] = React.useState(false);
  const [filtros, setFiltros] = React.useState({});
  const [isNew, setIsNew] = React.useState(false);
  const [selectRow, setSelectRow] = React.useState(null);
  const [reconsultar, setReconsultar] = React.useState(false);
  const [mostrarVencidos, setMostrarVencidos] = React.useState(false);

  // const serviciosFetch = useFetchServicios({ cod_estado: CODS_ESTADOS.ACTIVO });

  const {
    isLoading: isLoadingCatalogos,
    fetchMetodoCalculoByServicio,
    catalogos,
    serviciosFetch,
    metodosFetch,
  } = useCatalogosCotizacion({
    agregarTodos: {
      default: DEFATULT_TODOS_VALUE,
      catalogos: CATALOGOS_AGREGAR_TODOS,
    },
  });

  const selectedKey = React.useMemo(
    () => `${selectRow?.cod_servicio ?? 0}_${selectRow?.cod_metodo ?? 0}_${selectRow?.fecha_final}`,
    [selectRow?.cod_servicio, selectRow?.cod_metodo, selectRow?.fecha_final],
  );

  const reglasCampos = React.useMemo(
    () =>
      buildTarifaFieldRules({
        catalogosProcesados: catalogos,
        currentEmpresa: null,
        currentCentroCosto: null,
      }),
    [catalogos],
  );

  const camposReadonlyDesdeFiltro = React.useMemo(() => buildReadonlyFieldsFromPayload({ filtros, reglasCampos }), [filtros, reglasCampos]);

  const aQuinceDias = React.useMemo(() => moment().isBetween(moment(selectRow?.fecha_final).subtract(15, "days"), moment(selectRow?.fecha_final), "day", "[]"), [selectRow?.fecha_final]);

  const agregarCatalogos = React.useCallback((item) => mapServicioConCatalogos({ item, catalogos }), [catalogos]);

  const filtrarSegunFiltros = React.useCallback(
    (i) => {
      // Object.entries(reglasCampos).forEach(() => {});

      if (i.cod_empresa) if (filtros?.cod_empresa && filtros.cod_empresa !== i.cod_empresa) return false;
      if (i.cod_cc) if (filtros?.cod_cc && filtros.cod_cc !== i.cod_cc) return false;
      if (i.cod_rubro) if (filtros?.cod_rubro && filtros.cod_rubro !== i.cod_rubro) return false;
      if (i.entidad_id) if (filtros?.entidad_id && filtros.entidad_id !== i.entidad_id) return false;
      if (i.cod_tipo_transporte) if (filtros?.cod_tipo_transporte && filtros.cod_tipo_transporte !== i.cod_tipo_transporte) return false;
      if (i.cod_tipo_servicio) if (filtros?.cod_tipo_servicio && filtros.cod_tipo_servicio !== i.cod_tipo_servicio) return false;
      if (i.clasificacion) if (filtros?.clasificacion && filtros.clasificacion !== i.clasificacion) return false;
      if (i.categoria_transporte) if (filtros?.categoria && filtros.categoria !== i.categoria_transporte) return false;
      if (i.cod_clasificacion_carga) if (filtros?.cod_clasificacion_carga && filtros.cod_clasificacion_carga !== i.cod_clasificacion_carga) return false;
      if (i.cod_tipo_carga) if (filtros?.cod_tipo_carga && filtros.cod_tipo_carga !== i.cod_tipo_carga) return false;
      if (i.cod_tipo_pago) if (filtros?.cod_tipo_pago && filtros.cod_tipo_pago !== 131) if (filtros.cod_tipo_pago !== i.cod_tipo_pago) return false;
      if (i.cod_tipo_aplicacion) if (filtros?.cod_tipo_aplicacion && filtros.cod_tipo_aplicacion !== i.cod_tipo_aplicacion) return false;
      if (i.cod_tipo_calculo) if (filtros?.cod_tipo_calculo && filtros.cod_tipo_calculo !== i.cod_tipo_calculo) return false;

      return true;
    },
    [filtros /* reglasCampos */],
  );

  const aplicarFiltrosDeTabla = React.useCallback(
    (item) => {
      const estaVencido = Boolean(item?.fecha_final) && moment(item.fecha_final).isBefore(moment(), "day");

      return mostrarVencidos ? estaVencido : !estaVencido;
    },
    [mostrarVencidos],
  );

  const servicios = React.useMemo(() => (serviciosFetch.data ?? []).map(agregarCatalogos), [serviciosFetch.data, agregarCatalogos]);

  const serviciosFiltrados = React.useMemo(() => (servicios ?? []).filter(filtrarSegunFiltros).filter(aplicarFiltrosDeTabla), [servicios, filtrarSegunFiltros, aplicarFiltrosDeTabla]);

  const handleAbrirFiltroTarifas = React.useCallback((p, val) => {
    p.preventDefault();
    if (val === undefined) return;
    setAbrirFiltroTarifas(val);
  }, []);

  const onRowSelect = React.useCallback(
    async (id, row) => {
      const metodo = await fetchMetodoCalculoByServicio(id);
      setSelectRow(agregarCatalogos({ ...row, ...metodo.data }));
      setIsNew(false);
    },
    [fetchMetodoCalculoByServicio, agregarCatalogos],
  );

  const refrescar = React.useCallback(() => {
    serviciosFetch.refetch();
    metodosFetch.refetch();
  }, [metodosFetch, serviciosFetch]);

  const onRowDeleted = React.useCallback(
    async (id, values) => {
      let baseApiURL = "/api/appweb/actualizar-servicio";
      let baseApiURLMetodo = "/api/appweb/actualizar-metodos";
      const cod_estado = CODS_ESTADOS.ANULADO;
      await Promise.all([api.post(baseApiURL, { ...values, cod_estado }), values.cod_metodo && api.post(baseApiURLMetodo, { ...values, cod_estado })]);
      refrescar();
    },
    [refrescar],
  );

  const handleFilter = React.useCallback(async (values) => {
    setFiltros(values);
    setSelectRow(null);
  }, []);

  const handleInsertar = React.useCallback(
    async (values, filtrarValoresPorPayload) => {
      let baseApiURL = "/api/appweb/insertar-servicio";
      let response = await api.post(baseApiURL, filtrarValoresPorPayload(values, "servicio"));
      if (!response.data.data.success) return;
      const cod_servicio = +response.data.data.cod_servicio;

      await api.post("api/appweb/insertar-metodos", { ...filtrarValoresPorPayload(values, "metodo"), cod_servicio }).then(() => {
        refrescar();

        onRowSelect(cod_servicio, { ...values, cod_servicio });
      });
    },
    [refrescar, onRowSelect],
  );

  const handleActualizar = React.useCallback(
    async (values, filtrarValoresPorPayload) => {
      const cod_servicio = +values.cod_servicio;
      let baseApiURL = "/api/appweb/actualizar-servicio";
      let baseApiURLMetodo = "/api/appweb/actualizar-metodos";
      await Promise.all([
        api.post(baseApiURL, filtrarValoresPorPayload(values, "servicio")),
        values.cod_metodo
          ? api.post(baseApiURLMetodo, filtrarValoresPorPayload(values, "metodo"))
          : api.post("api/appweb/insertar-metodos", { ...filtrarValoresPorPayload(values, "metodo"), cod_servicio }).then(() => refrescar()),
      ]);
      refrescar();

      setSelectRow({ ...values });
      setIsNew(false);
    },
    [refrescar],
  );

  const handleCopiar = React.useCallback(
    async (values) => {
      console.log(values);
      let baseApiURL = "/api/appweb/replicar-servicio";
      const payload = { ...values };
      const response = await api.post(baseApiURL, payload);
      const ids = response?.data?.data?.ids;
      const idServicio = ids?.SERVICIO;
      const idMetodo = ids?.METODO;
      refrescar();

      onRowSelect(idServicio, { ...selectRow, ...values, cod_servicio: idServicio, cod_metodo: idMetodo });
    },
    [refrescar, onRowSelect, selectRow],
  );

  React.useEffect(() => {
    if (!reconsultar) return;

    refrescar();
    onRowSelect(selectRow?.cod_servicio, selectRow);
    setReconsultar(false);
  }, [refrescar, reconsultar, onRowSelect, selectRow]);

  return (
    <div>
      <AcordeonComponent2
        expandido={abrirFiltroTarifas}
        expandir={handleAbrirFiltroTarifas}
        titulo={
          <Box display="flex" justifyContent="space-between" p={0.8} width="100%">
            <Typography variant="h6">Filtros de Tarifas</Typography>
            <Icon className={abrirFiltroTarifas ? "c-arriba-simple" : "c-abajo-simple"} />
          </Box>
        }
      >
        <Box display="flex" flexDirection="column" gap={1} bgcolor="primary.main_5" p={2} borderRadius={1}>
          <FormularioTarifaV2 tipoFormulario="filtro" handleFiltrar={handleFilter} inputsToHide={camposDeFiltro} groupsToHide={gruposDeFiltro} />
        </Box>
      </AcordeonComponent2>

      <TablaEditableComponent
        data={serviciosFiltrados ?? []}
        encabezados={[
          ...[
            { id: "cod_servicio", campo: "cod_servicio", label: "Servicio" },
            { id: "entidad_nombre", campo: "entidad_nombre", label: "Carrier" },
            { id: "nombre", campo: "nombre", label: "Nombre", formato: (val, row) => `${row.siglas} - ${val}` },
            { id: "rubro_nombre", campo: "rubro_nombre", label: "Rubro" },
            { id: "tipoServicio_nombre", campo: "tipoServicio_nombre", label: "Tipo de Servicio" },
            { id: "tipoAplicacion_nombre", campo: "tipoAplicacion_nombre", label: "Tipo de Aplicación" },
            // { id: "estado_nombre", campo: "estado_nombre", label: "Estado" },
            {
              id: "fecha_final",
              campo: "fecha_final",
              label: mostrarVencidos ? "Fecha de Vencimiento" : "Vencera el",
              formato: (val) => (val ? (moment(val).isValid() ? moment(val).format("DD/MM/YYYY") : "No ingresado") : "No ingresado"),
            },
          ],
        ]}
        title={`Tarifas ${mostrarVencidos ? "Vencidas" : "Activas"}`}
        rowKey="cod_servicio"
        acciones={{ view: true, delete: true }}
        onRowView={onRowSelect}
        onRowDeleted={onRowDeleted}
        botones={{
          nuevo: {
            id: "nuevo",
            label: "Nuevo",
            onClick: () => {
              setIsNew(true);
              setSelectRow({ ...filtros });
            },
          },
          refrescar: {
            id: "refrescar",
            label: "Refrescar",
            onClick: refrescar,
          },
          excel: {
            id: "generarExcel",
            label: "Excel",
            onClick: () => {
              generarExcel({
                descargar: true,
                propiedades: {
                  title: `Servicios - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_ss")}.xlsx`,
                  subject: "Reporte en excel",
                  author: "ERP-web",
                  creator: "ERP-web",
                },
                titulo: `Empleados por puesto`,
                horizontal: true,
                bottom: true,
                hojas: [
                  {
                    nombre: `Servicios`,
                    color: "006821",
                    header: {
                      "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
                    },
                    datos: (serviciosFiltrados ?? []).map((i) => ({
                      Código: i.cod_servicio,
                      Carrier: i.entidad_nombre,
                      Nombre: i.nombre,
                      Rubro: i.rubro_nombre,
                      "Tipo de Servicio": i.tipoServicio_nombre,
                      "Tipo de Aplicación": i.tipoAplicacion_nombre,
                      Estado: i.estado_nombre,
                    })),
                  },
                ],
              });
            },
          },
          mostrarVencidos: {
            id: "mostrarVencidos",
            label: mostrarVencidos ? "Mostrar activos" : "Mostrar vencidos",
            onClick: () => {
              setMostrarVencidos(!mostrarVencidos);
            },
            color: mostrarVencidos ? "success" : "error",
          },
        }}
      />

      {selectRow && (
        <Grid mt={3} key={selectedKey}>
          {aQuinceDias && <BandaAlertaComponent tipo="warning" content={`La tarifa vencerá el ${moment(selectRow?.fecha_final).format("DD/MM/YYYY")}`} />}
          <Grid
            container
            direction="row"
            size="auto"
            rowSpacing={2}
            sx={{ border: "1px solid", borderColor: "gray.100", boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)" }}
            justifyContent="left"
            alignItems="center"
            borderRadius={1.2}
            px={1}
            mb={2}
          >
            <Grid size="auto" px={2}>
              <Typography sx={{ fontSize: 20 }}>{selectRow?.cod_servicio ? `TARIFA ${selectRow?.cod_servicio || 0}` : "Nueva Tarifa"}</Typography>
            </Grid>

            <Grid size="grow" />

            <Grid size="auto" px={2}>
              <Typography variant="caption" sx={{ fontSize: 15, letterSpacing: 3 }}>
                Modo {isNew ? "insersión" : "edicion"}
              </Typography>
            </Grid>
          </Grid>

          <FormularioTarifaV2
            key={selectRow?.cod_servicio ?? "new"}
            tipoFormulario={isNew ? "ingreso" : "edicion"}
            defaultValues={selectRow}
            inputsReadOnly={camposReadonlyDesdeFiltro}
            handleInsertar={handleInsertar}
            handleActualizar={handleActualizar}
            handleCopiar={handleCopiar}
            setReconsultar={setReconsultar}
            reconsultar={reconsultar}
          />
        </Grid>
      )}

      {/* <pre>{JSON.stringify(selectRow, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(filtros, null, 2)}</pre> */}
    </div>
  );
};

CreacionTarifa.propTypes = {};

export default CreacionTarifa;
