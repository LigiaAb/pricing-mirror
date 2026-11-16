import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";
import TablaEditableComponent from "../../../../../../components/Tabla/TablaEditableComponent";
import useColumnasGestionCotizaciones from "./hooks/useColumnasGestionCotizaciones";
import { useFetchCotizaciones, useFetchCotizacionPlantilla, useFetchCotizacionPlantillaRubros } from "../../../../../../hooks/Fetch/useFetchTarifas";
import useCatalogosCotizacion from "../../../../CotizacionesPlantillas/hooks/useCatalogosCotizacion";
import { CODS_ESTADOS } from "../../../../../../constants/estados";
import { api } from "../../../../../../api";

const TablaGestionCabeceraCotizacion = (props) => {
  const { filtros = {}, catalogos: catalogosTabla = {}, reconsultar = false } = props;
  const { handleSelectRow = () => {}, handleClean = () => {}, handleNew = () => {}, setReconsultar = () => {}, setListaCotizaciones = () => {} } = props;

  const [filtrosProcesados, setFiltrosProcesados] = useState(filtros);

  const columnasGestionCotizaciones = useColumnasGestionCotizaciones();
  const fetchPlantillaesRubros = useFetchCotizacionPlantillaRubros();
  const { isLoading: isLoadingCatalogos, isLoadingContactos, fetchOptionsClientes, obtenerContactosDeEntidad, catalogos } = useCatalogosCotizacion(catalogosTabla);

  const catalogosProcesados = useMemo(() => ({ ...catalogosTabla, ...catalogos }), [catalogos, catalogosTabla]);

  const [mostrarConfirmados, setMostrarConfirmados] = useState(false);

  const fetchCotizaciones = useFetchCotizacionPlantilla(filtrosProcesados);
  const cotizacionesFiltradas = useMemo(() => {
    return (fetchCotizaciones?.data || [])
      .filter((i) => i.cod_estado !== CODS_ESTADOS.RECHAZADO)
      .filter((i) => i.cod_estado !== 67)
      .filter((i) => i.cod_estado !== CODS_ESTADOS.FINALIZADO)
      .filter((i) => (mostrarConfirmados ? i.cod_estado === CODS_ESTADOS.CONFIRMADO : i.cod_estado !== CODS_ESTADOS.CONFIRMADO))
      .map((c) => {
        const entidad = catalogosProcesados.clientes?.find((cli) => cli.entidad_id === c.entidad_id)?.entidad_nombre || "";
        const carrier = catalogosProcesados.proveedores?.find((prov) => prov.entidad_id === c.carrier_id)?.entidad_nombre || "";
        const tipoTransporte = catalogosProcesados.tiposTransporte?.find((tt) => tt.value === c.cod_tipo_transporte)?.label || "";
        const tipoServicio = catalogosProcesados.tiposServicio?.find((ts) => ts.value === c.cod_tipo_servicio)?.label || "";
        const tipoCarga = catalogosProcesados.tiposCarga?.find((tc) => tc.value === c.cod_tipo_carga)?.label || "";
        const tipoPago = catalogosProcesados.tiposPago?.find((tp) => tp.value === c.cod_tipo_pago)?.label || "";
        const clasificacionCarga = catalogosProcesados.clasificacionesCarga?.find((cc) => cc.value === c.cod_clasificacion_carga)?.label || "";
        const estado = catalogosProcesados.estados?.find((e) => e.value === c.cod_estado)?.label || "";

        return {
          ...c,
          entidad,
          tipoTransporte,
          tipoServicio,
          tipoCarga,
          tipoPago,
          clasificacionCarga,
          estado,
          carrier,
          accionesDeTabla: {
            view: true,
            auth: false, // [CODS_ESTADOS.ACTIVO, CODS_ESTADOS.INGRESADO, CODS_ESTADOS.ACTIVO].includes(c.cod_estado),
          },
        };
      });
  }, [fetchCotizaciones?.data, catalogosProcesados]);

  const handleDeleteRow = useCallback(async (id, row) => {
    const baseApiURL = "/api/appweb/eliminar-tarifa-plantilla";
    const response = await api.post(baseApiURL, { cod_tarifaplantilla: id, cod_estado: CODS_ESTADOS.ANULADO });
    if (!response.data.data.success) return;
    fetchCotizaciones.refetch();
  }, []);
  // const handleConfirm = useCallback(async (id, row) => {
  //   const baseApiURL = "/api/appweb/confirmar-cotizacion-cabecera";
  //   const response = await api.post(baseApiURL, { cod_tarifaplantilla: id });
  //   if (!response.data.data.success) return;
  //   fetchCotizaciones.refetch();
  //   handleNew();
  // }, []);

  useEffect(() => {
    fetchCotizaciones.refetch();
  }, [filtrosProcesados]);

  useEffect(() => {
    setFiltrosProcesados({ ...filtros, cod_tipo_pago: filtros?.cod_tipo_pago === 131 ? undefined : filtros?.cod_tipo_pago }); // Si el filtro de tipo de pago es "Todos" (131), lo seteamos como undefined para que no aplique el filtro
  }, [filtros]);

  useEffect(() => {
    console.log("Reconsultando? ", reconsultar);
    if (reconsultar) {
      fetchCotizaciones.refetch();
      setReconsultar(false);
    }
  }, [reconsultar]);

  const firmaCotizaciones = useMemo(() => {
    // usa el id real si existe; en tu tabla rowKey="value" así que asumo value existe
    return cotizacionesFiltradas.map((c) => c.cod_tarifaplantilla).join("|");
  }, [cotizacionesFiltradas]);

  useEffect(() => {
    setListaCotizaciones(cotizacionesFiltradas);
  }, [cotizacionesFiltradas, firmaCotizaciones, setListaCotizaciones]); // 👈 NO metas cotizacionesFiltradas directo

  return (
    <Box>
      <TablaEditableComponent
        rowKey="cod_tarifaplantilla"
        data={cotizacionesFiltradas.sort((a, b) => a.cod_tarifaplantilla - b.cod_tarifaplantilla)}
        encabezados={columnasGestionCotizaciones}
        acciones={{ view: true, auth: true, delete: true }}
        botones={[
          { label: `Limpiar`, onClick: () => handleClean(), disabled: false },
          {
            label: `Refrescar`,
            onClick: () => {
              fetchPlantillaesRubros.refetch();
              fetchCotizaciones.refetch();
            },
            disabled: false,
          },
          // { label: `${mostrarConfirmados ? "Ocultar" : "Mostrar"} confirmados`, onClick: () => setMostrarConfirmados((v) => !v), disabled: false },
          { label: `Nuevo`, onClick: () => handleNew(), disabled: false },
        ]}
        eventosDeTabla={{
          view: handleSelectRow,
          delete: handleDeleteRow,
          // auth: handleConfirm,
        }}
      />
      <Grid>{/* <pre>{JSON.stringify(catalogosProcesados?.tiposServicio, null, 2)}</pre> */}</Grid>
    </Box>
  );
};

TablaGestionCabeceraCotizacion.propTypes = {
  filtros: PropTypes.object,
  catalogos: PropTypes.object,
  reconsultar: PropTypes.bool,
  setReconsultar: PropTypes.func,
  handleSelectRow: PropTypes.func,
  handleClean: PropTypes.func,
  handleNew: PropTypes.func,
  setListaCotizaciones: PropTypes.func,
};

export default TablaGestionCabeceraCotizacion;
