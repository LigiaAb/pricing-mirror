import React, { useEffect } from "react";
import { Box, Card, CardContent, Typography, Grid, Button, Stack, Icon } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";

const DashboardPublicForms = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirigir automáticamente al formulario instructivo si hay parámetro cli_inf
  useEffect(() => {
    const cliInf = searchParams.get('cli_inf');
    if (cliInf) {
      // Preservar todos los parámetros de la URL al redirigir
      const params = new URLSearchParams(searchParams);
      navigate(`/public/formulario-instructivo?${params.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const formulariosDisponibles = [
    {
      id: "formulario-instructivo",
      titulo: "Formulario Instructivo",
      descripcion: "Complete el formulario de instrucción de embarque para iniciar su solicitud",
      icono: "c-documentacion",
      ruta: "/public/formulario-instructivo",
      color: "primary",
    },
    // Aquí se pueden agregar más formularios públicos en el futuro
    // Ejemplo:
    // {
    //   id: "formulario-seguimiento",
    //   titulo: "Seguimiento de Envío",
    //   descripcion: "Consulte el estado de su envío",
    //   icono: "c-buscar",
    //   ruta: "/public/seguimiento",
    //   color: "secondary",
    // },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Formularios Públicos
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Seleccione el formulario que desea completar. Estos formularios están disponibles para acceso público.
      </Typography>

      <Grid container spacing={3}>
        {formulariosDisponibles.map((formulario) => (
          <Grid item xs={12} sm={6} md={4} key={formulario.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
                cursor: "pointer",
              }}
              onClick={() => navigate(formulario.ruta)}
            >
              <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Stack spacing={2} sx={{ height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
                    <Icon
                      className={formulario.icono}
                      sx={{
                        fontSize: "4rem",
                        color: `${formulario.color}.main`,
                      }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: "center" }}>
                    {formulario.titulo}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", flexGrow: 1 }}>
                    {formulario.descripcion}
                  </Typography>

                  <Button
                    variant="contained"
                    color={formulario.color}
                    fullWidth
                    sx={{ mt: "auto" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(formulario.ruta);
                    }}
                  >
                    Acceder al Formulario
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {formulariosDisponibles.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No hay formularios públicos disponibles en este momento.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DashboardPublicForms;
