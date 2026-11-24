import React, { useEffect, useState, useMemo } from "react";
import { Box, Typography, Grid, Button, Icon, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useSelector } from "react-redux";

export const CardContacto = (props) => {
  const { themeMode } = useSelector((state) => state.theme);
  const { contacto, onClick, agregar = false } = props;
  const [tipos, setTipos] = useState([]);

  useEffect(() => {
    if (contacto?.data_entidad_contacto_tipo) {
      const tipo_contacto = JSON.parse(contacto?.data_entidad_contacto_tipo);
      setTipos(tipo_contacto?.map((tipo) => tipo.TIPO_DESCRIPCION));
      // console.log(tipo_contacto)
    }
  }, [contacto]);

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
    ...theme.applyStyles("dark", {
      backgroundColor: "#1A2027",
    }),
  }));

  return !agregar ? (
    <Grid item onClick={onClick} height="-webkit-fill-available" width="-webkit-fill-available">
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyItems: "center",
          px: 1,
          py: 0.5,
          bgcolor: themeMode === "dark" ? "background.50" : "background.900",
          borderRadius: 2,
          borderColor: themeMode === "dark" ? "background.100" : "background.700",
          borderWidth: 1,
          boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
        }}
      >
        <Grid container size={"grow"}>
          <Grid
            item
            size={{ xs: 12, sm: 3 }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyItems: "center",
            }}
          >
            <Box
              item
              size={{ xs: 12, md: 3 }}
              sx={{
                display: "flex",
                alignContent: "center",
                justifyContent: "center",
                width: "100%",
                mt: 1,
                px: 2,
              }}
            >
              <Typography className={tipos.length > 0 ? (tipos[0] == "INFORMATIVO" ? "c-chat" : "c-asignacion") : "c-usuario"} sx={{ fontSize: 50 }} />
            </Box>
          </Grid>
          <Grid item size={{ xs: 12, sm: 8 }} sx={{ pr: { xs: 0, md: 1.5 }, pl: { xs: 1.5, md: 1.5 }, py: 1, justifyItems: "left" }}>
            <Typography fontSize="1.5rem" fontWeight="bold">
              {contacto?.entidadcontacto_nombre}
            </Typography>
            {/* <Typography>
                            <b>Empresa:</b>  {contacto.nombre_emp}
                        </Typography>
                        <Typography>
                            <b>Centro de costo:</b> {contacto.nombre_cc}
                        </Typography> */}
            <Typography>
              <b> Email:</b> {contacto?.entidadcontacto_email}
            </Typography>
            <Typography>
              <b>Telefono:</b> {contacto?.entidadcontacto_telefono}
            </Typography>
            {tipos?.length > 0 ? (
              <Typography>
                <b>Tipo:</b> {tipos?.join(" | ")}
              </Typography>
            ) : null}
            <Typography sx={{ color: contacto?.cod_estado === 1 ? "green.main" : "error.main" }}>
              <b> {contacto?.estado_desc} </b>
            </Typography>
            {/* color: d === "estado_desc" ? (i["cod_estado"] === 1 ? "green.main" : "error.main") : undefined, */}
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  ) : (
    <Grid
      onClick={onClick}
      sx={{
        px: 2,
        flex: "1 0 auto",
        whiteSpace: "pre",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyItems: "center",
          borderRadius: 100,
          height: "100%",
        }}
      >
        <Icon className="c-suma" sx={{ fontSize: 40 }} />
      </Box>
    </Grid>
  );
};
