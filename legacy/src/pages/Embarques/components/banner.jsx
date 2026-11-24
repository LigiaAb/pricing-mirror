import PropTypes from "prop-types";
import { Alert, AlertTitle, Box } from "@mui/material";

const BannerInformativo = ({
  titulo,
  mensaje,
  severidad = "info",
  acciones = null,
  ocultar = false,
  sx = {},
}) => {
  if (ocultar || (!titulo && !mensaje)) return null;

  return (
    <Alert
      severity={severidad}
      sx={{
        width: "100%",
        mb: 2,
        alignItems: "flex-start",
        ...sx,
      }}
      action={acciones}
    >
      {titulo && <AlertTitle>{titulo}</AlertTitle>}
      {Array.isArray(mensaje) ? (
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {mensaje.map((item) => (
            <Box component="li" key={item}>{item}</Box>
          ))}
        </Box>
      ) : mensaje}
    </Alert>
  );
};

BannerInformativo.propTypes = {
  titulo: PropTypes.string,
  mensaje: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.node,
  ]),
  severidad: PropTypes.oneOf(["error", "info", "success", "warning"]),
  acciones: PropTypes.node,
  ocultar: PropTypes.bool,
  sx: PropTypes.object,
};

export default BannerInformativo;
