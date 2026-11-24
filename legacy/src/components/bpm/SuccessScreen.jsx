import PropTypes from "prop-types";
import { Box, Button, Card, CardContent, Icon, Typography, useTheme } from "@mui/material";

/**
 * Pantalla de éxitofull-page para el flujo CTS.
 *
 * Se muestra cuando el backend responde `cod_mensaje: 1002` con el mensaje
 * "La gestión ya culminó de manera satisfactoria..." (la coordinación/formulario
 * ya fue completado). Como ese código está reutilizado para token vencido, el
 * caller debe suprimir el modal global de "Sesión finalizada" antes de montar
 * esta pantalla.
 *
 * Reemplaza el contenido del `[id]/page.jsx` (no es un modal) para que el
 * asesor vea un cierre limpio en vez del formulario vacío o del modal de guía
 * asignada incorrecta.
 */
const SuccessScreen = ({
  titulo = "Formulario Registrado con éxito",
  mensaje = "La gestión ya culminó de manera satisfactoria.",
  volverTexto = "Volver al listado",
  onVolver,
}) => {
  const theme = useTheme();
  const esExito = Boolean(titulo && /éxito|culmin/i.test(titulo + mensaje));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: { xs: "60vh", md: "70vh" },
        width: "100%",
        p: { xs: 1, md: 2 },
      }}
    >
      <Card
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            height: 8,
            width: "100%",
            bgcolor: esExito ? "success.main" : "primary.main",
          }}
        />
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 2,
            py: { xs: 4, md: 6 },
            px: { xs: 2, md: 4 },
          }}
        >
          <Box
            sx={{
              width: { xs: 88, md: 112 },
              height: { xs: 88, md: 112 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: esExito ? "success.main" : "primary.main",
              color: "common.white",
              boxShadow: 3,
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: `2px solid ${esExito ? theme.palette.success.main : theme.palette.primary.main}`,
                opacity: 0.25,
              },
              animation: "success-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              "@keyframes success-pop": {
                "0%": { transform: "scale(0.4)", opacity: 0 },
                "100%": { transform: "scale(1)", opacity: 1 },
              },
            }}
          >
            <Icon
              className="c-cuadrado-cheque"
              sx={{ fontSize: { xs: 48, md: 64 }, m: 0, p: 0 }}
            />
          </Box>

          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 700, mt: 1, color: "text.primary" }}
          >
            {titulo}
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 420, lineHeight: 1.6 }}
          >
            {mensaje}
          </Typography>

          {onVolver && (
            <Button
              variant="contained"
              color={esExito ? "success" : "primary"}
              size="large"
              onClick={onVolver}
              sx={{ mt: 1, minWidth: 200, textTransform: "none" }}
            >
              {volverTexto}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

SuccessScreen.propTypes = {
  titulo: PropTypes.string,
  mensaje: PropTypes.string,
  volverTexto: PropTypes.string,
  onVolver: PropTypes.func,
};

export default SuccessScreen;
