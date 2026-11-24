import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import TablaCoordinaciones from "../../../components/bpm/tablas/tablaCoordinaciones";
import DetallesLibroActa from "./DetallesLibroActa";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import { useCoordinacionCargas } from "../../../hooks/Bpm";

const LibroActas = () => {
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
        <DetallesLibroActa
          coordinacion={coordinacionSeleccionada}
          onVolver={handleVolver}
        />
      ) : (
        <>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 500, color: 'text.primary' }}>
            Libro de Actas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Listado de coordinaciones. Use la acción Ver para abrir detalles y gestionar el libro de actas.
          </Typography>
          <TablaCoordinaciones onView={handleView} estadoFilter={["EN TRANSITO"]} />
        </>
      )}
    </Box>
  );
};

export default LibroActas;