import { Box, Typography, Button, Icon } from "@mui/material";
import PropTypes from "prop-types";
import TarjetaCoordinacion from "../components/tarjetaCoordinacion";
import TabComponent from "../../../components/Tabs/TabComponent";
import { useState } from "react";
import ATDRegistro from "./registros/Atx/atd";
import ATARegistro from "./registros/Atx/ata";
import DocumentosRegistro from "./registros/Documentos/DocumentosReg";

const DetallesLibroActa = ({ coordinacion, onVolver }) => {
  const [tabSeleccionada, setTabSeleccionada] = useState(1);
  
  if (!coordinacion) return null;

  return (
    <Box>
      <Box mb={2} display="flex" alignItems="center">
        <Button
          variant="outlined"
          onClick={onVolver}
          startIcon={
            <Icon
              className="c-derecha-abajo-izquierda"
              sx={{
                fontSize: 18,
                color: (theme) => (theme.palette.mode === "dark" ? theme.palette.common.white : undefined),
              }}
            />
          }
          sx={(theme) => ({
            p: 1,
            mr: 2,
            textTransform: "none",
            color: theme.palette.mode === "dark" ? theme.palette.common.white : undefined,
            borderColor: theme.palette.mode === "dark" ? theme.palette.common.white : undefined,
            '&:hover': {
              borderColor: theme.palette.mode === "dark" ? theme.palette.common.white : undefined,
              backgroundColor: theme.palette.mode === "dark" ? 'rgba(255,255,255,0.04)' : undefined,
            },
          })}
        >
          Regresar
        </Button>
        <Typography variant="h6">Cod File: {coordinacion?.cod_file}</Typography>
      </Box>

      <TarjetaCoordinacion coordinacion={coordinacion} />

      <TabComponent
        opciones={[
          {
            id: 1,
            label: "Documentos",
            content: <DocumentosRegistro coordinacion={coordinacion} />,
            icono: "c-documentos",
          },
          {
            id: 2,
            label: "ATD - Salida",
            content: <ATDRegistro coordinacion={coordinacion} />,
            icono: "c-calendario-siguiente",
          },
          {
            id: 3,
            label: "ATA - Llegada",
            content: <ATARegistro coordinacion={coordinacion} />,
            icono: "c-calendario-actividad",
          },
        ]}
        tabInicial={tabSeleccionada}
        onCambiarTab={(val) => setTabSeleccionada(val)}
      />
    </Box>
  );
};

DetallesLibroActa.propTypes = {
  coordinacion: PropTypes.object,
  onVolver: PropTypes.func,
};

export default DetallesLibroActa;
