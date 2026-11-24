import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, IconButton, Tabs, Tab } from "@mui/material";
import TablaCoordinaciones from "../../../../components/Bpm/tablas/tablaCoordinaciones";
import { encryptId } from "../../../../api/encryptDecrypt";
import ActionAlertComponent from "../../../../components/Dialog/ActionAlertComponent";
import { useCoordinaciones, recuperarFilaCartaInstruccionesPrivado, extraerFilaCartaInstrucciones } from "../../../../hooks/Bpm";
import { useQueries } from "@tanstack/react-query";
import { CACHE_DYNAMIC } from "../../../../hooks/Bpm/utils";

const COD_MODULO = 12;
const COD_CC = 16;
const COD_EMPRESA = 1;

const Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [guiaAsignada, setGuiaAsignada] = useState(location.state?.guiaAsignada || null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseGuiaAsignada = () => {
    setGuiaAsignada(null);
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handleVerCoordinacion = (row) => {
    const data = row?.content || row || {};
    const embarque_id =
      data?.id ||
      data?.embarqueId ||
      data?.embarque_id ||
      data?.EMBARQUE_ID ||
      null;

    if (embarque_id) {
      const encoded = encryptId(embarque_id);
      navigate(`/embarques/embarques/cts/${encoded}`);
    } else {
      console.warn("handleVerCoordinacion: no se encontro id en la row", data);
    }
  };

  const { data: coordinaciones = [] } = useCoordinaciones({ cod_empresa: 1, cod_cc: 16 });

  const itemsConEstado75 = useMemo(() => {
    if (!Array.isArray(coordinaciones)) return [];
    return coordinaciones.filter((c) => {
      if (!c) return false;
      const idFromRecord =
        c.estadoId ?? c.estado_id ?? c.ESTADO_ID ??
        (c.estado && (c.estado.id ?? c.estado.estado_id ?? c.estado.cod_estado)) ??
        null;
      return idFromRecord !== null && Number(idFromRecord) === 75;
    });
  }, [coordinaciones]);

  const cartaQueries = useQueries({
    queries: itemsConEstado75
      .filter((item) => item.cotizacionCabeceraId != null)
      .map((item) => ({
        queryKey: ["carta-instrucciones-pendientes", item.cotizacionCabeceraId],
        queryFn: async () => {
          const response = await recuperarFilaCartaInstruccionesPrivado({
            cod_cotizacion_cabecera: Number(item.cotizacionCabeceraId),
            cod_modulo: COD_MODULO,
            cod_cc: COD_CC,
            cod_empresa: COD_EMPRESA,
          });
          const fila = extraerFilaCartaInstrucciones(response);
          return fila?.cod_estado ?? fila?.COD_ESTADO ?? null;
        },
        enabled: item.cotizacionCabeceraId != null,
        ...CACHE_DYNAMIC,
      })),
  });

  const codEstadoMap = useMemo(() => {
    const map = {};
    const itemsConCarta = itemsConEstado75.filter((item) => item.cotizacionCabeceraId != null);
    itemsConCarta.forEach((item, i) => {
      if (item?.embarqueId != null && cartaQueries[i]?.isSuccess) {
        map[item.embarqueId] = cartaQueries[i].data;
      }
    });
    return map;
  }, [itemsConEstado75, cartaQueries]);

  const cartasLoaded = cartaQueries.every((q) => q.isFetched);

  const filterFn = useMemo(() => {
    if (!cartasLoaded) return undefined;
    return (row) => {
      const id = row?.embarqueId ?? row?.id ?? null;
      const codEstado = codEstadoMap[id];
      if (tabValue === 1) {
        return Number(codEstado) === 1;
      }
      return Number(codEstado) !== 1;
    };
  }, [tabValue, codEstadoMap, cartasLoaded]);

  return (
    <Box
      sx={{
        p: { xs: 1, md: 2 },
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "relative",
      }}
    >
      <Box mt={2}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Gestion CTS
          </Typography>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Completas" />
            <Tab label="Incompletas" />
          </Tabs>
        </Box>
        <TablaCoordinaciones
          filasPorPagina={15}
          useSeach={true}
          usePagination={true}
          estadoFilter={[75]}
          onView={handleVerCoordinacion}
          hideColumns={[
            "correlativoGuia",
            "correlativoGuiaMaster",
            "entidadShipperNombre",
            "entidadConsignatarioNombre",
            "puntoEnlaceOrigen",
            "puntoEnlaceDestino",
            "tipoCarga",
            "incoterm",
            "repeso",
            "observaciones",
            "servicio",
            "estado",
            "empresa",
            "centroCosto",
          ]}
          filterFn={filterFn}
        />
      </Box>
      {guiaAsignada && (
        <ActionAlertComponent
          openDialog={Boolean(guiaAsignada)}
          tipo="success"
          content={
            guiaAsignada.guia ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1, fontSize: "1.875rem" }}>
                  Guia asignada con exito.
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mt: 1, fontSize: "1.875rem", display: "flex", alignItems: "center" }}
                >
                  Guía: {guiaAsignada.guia}
                  <IconButton
                    size="medium"
                    sx={{ ml: 1 }}
                    onClick={() => navigator.clipboard.writeText(guiaAsignada.guia)}
                    title="Copiar"
                  >
                    <Typography className="c-copiar" sx={{ fontSize: "1.875rem" }} />
                  </IconButton>
                </Typography>
              </>
            ) : (
              <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1, fontSize: "1.875rem" }}>
                Coordinación creada con éxito.
              </Typography>
            )
          }
          onConfirm={handleCloseGuiaAsignada}
          textoConfirmar="Cerrar"
          width="400px"
        />
      )}
    </Box>
  );
};

export default Page;
