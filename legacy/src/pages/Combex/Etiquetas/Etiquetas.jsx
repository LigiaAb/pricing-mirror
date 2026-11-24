import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import TablaCoordinaciones from "../../../components/bpm/tablas/tablaCoordinaciones";
import DetallesEtiquetas from "./DetallesEtiquetas";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import { useCoordinacionCargas } from "../../../hooks/Bpm";

const Etiquetas = () => {
  const [coordinacionSeleccionada, setCoordinacionSeleccionada] =
    useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [mostrarNoCargas, setMostrarNoCargas] = useState(false);
  const [mensajeNoCargas, setMensajeNoCargas] = useState("");

  const { data: cargas = [], isLoading: cargasLoading } = useCoordinacionCargas(
    coordinacionSeleccionada?.embarqueId,
    { enabled: !!coordinacionSeleccionada?.embarqueId }
  );

  const handleView = (row) => {
    setCoordinacionSeleccionada(row);
    setMostrarDetalles(false);
    setMostrarNoCargas(false);
  };

  useEffect(() => {
    if (!coordinacionSeleccionada) return;

    if (cargasLoading) return;

    if (!Array.isArray(cargas) || cargas.length === 0) {
      setMensajeNoCargas("No se encontraron cargas asociadas a la coordinación seleccionada.");
      setMostrarNoCargas(true);
      setMostrarDetalles(false);
    } else {
      setMostrarNoCargas(false);
      setMostrarDetalles(true);
    }
  }, [coordinacionSeleccionada, cargas, cargasLoading]);

  const handleVolver = () => {
    setMostrarDetalles(false);
    setCoordinacionSeleccionada(null);
  };

  const handleCloseNoCargas = () => {
    setMostrarNoCargas(false);
    setCoordinacionSeleccionada(null);
  };

  return (
    <Box sx={{ width: "95%", mx: "auto", mt: 2 }}>
      <ActionAlertComponent
        openDialog={mostrarNoCargas}
        handleClose={handleCloseNoCargas}
        tipo="warning"
        content={mensajeNoCargas}
      />
      {mostrarDetalles ? (
        <DetallesEtiquetas
          coordinacion={coordinacionSeleccionada}
          onVolver={handleVolver}
        />
      ) : (
        <>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
            Etiquetas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Listado de coordinaciones.
          </Typography>
          <TablaCoordinaciones onView={handleView} estadoFilter={["ENVIO A COMBEX SIN ETIQUETAS"]} />
        </>
      )}
    </Box>
  );
};

export default Etiquetas;
