import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import TablaGastosCoordinacion from "@/components/bpm/tablas/tablaGastosCoordinacion";
import TablaGastosCriterio from "@/components/bpm/tablas/tablaGastosCriterio";
import { useCoordinacionData } from "@/hooks/Bpm";
import BannerInformativo from "../banner";

const GastosSection = ({ embarqueId = null, onValidityChange = null, onLoadingChange = null, mostrarAgregarServicio = true }) => {
  const { data: embarqueData = null, isLoading: isLoadingEmbarqueData } = useCoordinacionData(embarqueId);
  const currentCentroCosto = useSelector((state) => state.menu.currentCentroCosto);
  const shouldShowTablaGastosCriterio =
    currentCentroCosto?.nombre_cc?.toString()?.toUpperCase() === "INFORMATICA";

  const [isLoadingTablaGastos, setIsLoadingTablaGastos] = useState(true);
  const [isLoadingTablaCriterio, setIsLoadingTablaCriterio] = useState(shouldShowTablaGastosCriterio);

  useEffect(() => {
    if (typeof onValidityChange === "function") {
      onValidityChange(Boolean(embarqueId));
    }
  }, [embarqueId, onValidityChange]);

  useEffect(() => {
    onLoadingChange?.(
      !embarqueId ||
      isLoadingEmbarqueData ||
      isLoadingTablaGastos ||
      (shouldShowTablaGastosCriterio && isLoadingTablaCriterio),
    );
  }, [
    embarqueId,
    isLoadingEmbarqueData,
    isLoadingTablaGastos,
    isLoadingTablaCriterio,
    shouldShowTablaGastosCriterio,
    onLoadingChange,
  ]);

  return (
    <Box sx={{ p: 1, width: "100%", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <BannerInformativo
        ocultar={Boolean(embarqueId)}
        severidad="warning"
        titulo="Faltan datos del embarque"
        mensaje="No hay identificador de embarque para cargar gastos."
      />
      <Box sx={{ width: "100%", minWidth: 0, display: "flex", justifyContent: "center" }}>
        <TablaGastosCoordinacion
          embarqueId={embarqueId}
          embarqueData={embarqueData}
          onLoadingChange={setIsLoadingTablaGastos}
          mostrarAgregarServicio={mostrarAgregarServicio}
        />
      </Box>
      {shouldShowTablaGastosCriterio && (
        <Box sx={{ width: "100%", minWidth: 0, display: "flex", justifyContent: "center" }}>
          <TablaGastosCriterio embarqueId={embarqueId} onLoadingChange={setIsLoadingTablaCriterio} />
        </Box>
      )}
    </Box>
  );
};

GastosSection.propTypes = {
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onValidityChange: PropTypes.func,
  onLoadingChange: PropTypes.func,
  mostrarAgregarServicio: PropTypes.bool,
};

export default GastosSection;
