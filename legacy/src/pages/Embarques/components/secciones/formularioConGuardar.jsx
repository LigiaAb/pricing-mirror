import PropTypes from "prop-types";
import { Box, Button, Icon } from "@mui/material";

const FORMULARIO_MAX_WIDTH = { xs: "100%", md: 720 };

const FormularioConGuardar = ({ children, disabled, guardando, onGuardar, maxWidth = FORMULARIO_MAX_WIDTH, variant = "classic" }) => {
  if (variant === "modern") {
    return (
      <Box sx={{ width: "100%", maxWidth, mx: "auto" }}>
        {children}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Button
            variant="contained"
            size="medium"
            disabled={disabled || guardando}
            onClick={onGuardar}
            startIcon={<Icon className="c-guardar" sx={{ fontSize: "1rem !important", color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined) }} />}
            sx={{ borderRadius: 999, px: 3, fontWeight: 600, boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth,
        mx: "auto",
        "& > div > div:first-of-type": {
          pb: 8,
        },
      }}
    >
      {children}

      <Box sx={{ position: "absolute", right: 16, bottom: 24, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" size="small" disabled={disabled || guardando} onClick={onGuardar}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
    </Box>
  );
};

FormularioConGuardar.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  guardando: PropTypes.bool,
  onGuardar: PropTypes.func,
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
  variant: PropTypes.oneOf(["classic", "modern"]),
};

export default FormularioConGuardar;
