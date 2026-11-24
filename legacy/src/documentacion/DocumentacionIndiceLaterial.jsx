import React from "react";
import PropTypes from "prop-types";
import { Drawer, Grid, Icon, IconButton, List, ListItem, ListItemText, Typography, Link } from "@mui/material";
import { useSelector } from "react-redux";

const DocumentacionIndiceLaterial = (props) => {
  const { lista } = props;

  const [state, setState] = React.useState(false);
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  const toggleDrawer = (open) => (event) => {
    setState(open);
  };

  const generarEnlace = (item) => {
    return (
      <>
        {/* {JSON.stringify(item.tipo)} */}
        {(["hr"].includes(item.tipo) && item.texto) || ["titulo", "subtitulo", "tabla", "detalle"].includes(item.tipo) ? (
          <Grid sx={{ my: 0.3 }} size={{ ml: item.tipo === "hr" || item.tipo === "titulo" ? 0 : item.tipo === "subtitulo" ? 2 : 0 }}>
            <Link href={`#${item.id}`} flexDirection="row" sx={{ "&.MuiLink-root": { textDecoration: "none" }, color: `primary.${opositeMode}` }}>
              <Grid container direction="row">
                <Grid size="auto">
                  {item.tipo === "hr" ? (
                    <Icon className="c-menos" sx={{ fontSize: 14 }} />
                  ) : item.tipo === "titulo" ? (
                    <Icon className="c-izquierda-arriba-derecha" sx={{ fontSize: 14 }} />
                  ) : item.tipo === "subtitulo" ? (
                    <Icon className="c-derecha" sx={{ fontSize: 14 }} />
                  ) : (
                    <Icon className="c-derecha" sx={{ fontSize: 14 }} />
                  )}
                </Grid>
                <Grid size={{ xs: "auto" }}>
                  <Typography
                    variant="p"
                    width="fit-content"
                    sx={{ fontSize: item.tipo === "hr" || item.tipo === "titulo" ? 16 : item.tipo === "subtitulo" ? 14 : 15, fontWeight: "bolder" }}
                    dangerouslySetInnerHTML={{ __html: item.tipo === "tabla" ? "Tabla" : item?.texto?.replace(/\n/gm, "<br/>") }}
                  />
                </Grid>
              </Grid>
            </Link>
            {["tabla"].includes(item.tipo) ? (
              item.datos.map((i, ind) => (
                <Grid container key={`${item.id}_${ind}`} sx={{ pl: 2 }}>
                  <Grid size={{ xs: "auto" }}>{i[0] ? generarEnlace(i[0]) : ""}</Grid>
                </Grid>
              ))
            ) : (
              <></>
            )}
          </Grid>
        ) : (
          <></>
        )}
      </>
    );
  };

  return (
    <>
      {/* <pre>{JSON.stringify(lista)}</pre> */}
      <IconButton
        onClick={toggleDrawer(true)}
        sx={{
          m: "auto",
          right: 20,
          top: 90,
          position: "absolute",
          bgcolor: `primary.${themeMode}`,
          color: "white.main",
          "&:hover": {
            bgcolor: "primary.500_80",
            cursor: "pointer",
          },
          borderWidth: 1,
          borderStyle: "solid",
          "&.MuiIconButton-root": { zIndex: 1200 },
        }}
      >
        <Icon className="c-menu" />
      </IconButton>
      <Drawer anchor={"right"} open={state} onClose={toggleDrawer(false)}>
        <Grid container direction="column" sx={{ px: 2, pt: 2 }}>
          <Grid>
            <Typography variant="h6">Lista de Titulos</Typography>
          </Grid>
          {generarEnlace({ tipo: "titulo", texto: "Inicio", id: "inicio" })}
          {lista.map((i) => (
            <Grid key={i.id}>{generarEnlace(i)}</Grid>
          ))}
        </Grid>
      </Drawer>
    </>
  );
};

DocumentacionIndiceLaterial.propTypes = {
  lista: PropTypes.array,
};

export default DocumentacionIndiceLaterial;
