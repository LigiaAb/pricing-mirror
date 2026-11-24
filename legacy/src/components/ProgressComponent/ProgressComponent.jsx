import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box, CircularProgress, LinearProgress } from "@mui/material";

const ProgressComponent = (props) => {
  const { duration, color = "primary", tipo = "linear" } = props;
  const [progress, setProgress] = useState(duration);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    // Inicializar el intervalo para disminuir el progreso
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(id); // Limpiar el intervalo cuando se llegue a 0
          return 0;
        }
        return prev - 10; // Disminuir el progreso por 1000 (1 segundo en milisegundos)
      });
    }, 10);

    // Guardar el id del intervalo para limpiar después
    setIntervalId(id);

    // Limpiar el intervalo al desmontar el componente
    return () => {
      clearInterval(id);
    };
  }, [duration]);
  return (
    <Box sx={{ width: "100%" }}>
      {tipo === "linear" ? (
        <LinearProgress variant="determinate" color={color} value={Math.max(0, (progress / duration) * 100)} sx={{ height: 6 }} />
      ) : (
        <CircularProgress variant="determinate" color={color} value={Math.max(0, (progress / duration) * 100)} sx={{ height: 6 }} />
      )}
    </Box>
  );
};

ProgressComponent.propTypes = { duration: PropTypes.number, color: PropTypes.string, tipo: PropTypes.arrayOf(["linear", "circulo"]) };

export default ProgressComponent;
