import { Box, Button, Grid, Icon, List, ListItem, ListItemText, ListSubheader, TextField, Typography } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import lista from "./componentes/listaComponentes";
import { useMemo } from "react";
import MenuComponent from "../components/MenuComponent/MenuComponent";
import { useForm } from "../hooks/useForm";
import { api } from "../api";
import { useSelector } from "react-redux";

const ListaComponentesDocumentacion = () => {
  const navigate = useNavigate();
  const { filtro, onInputChange } = useForm({ filtro: "" });
  const [lista, setLista] = useState([]);
  const [data, setData] = useState({});
  let { id } = useParams();
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  const listaOrdenada = useMemo(
    () =>
      (lista || [])
        .sort((a, b) => {
          const aIndex = "abcdefghijklmnopqrstuvwxyz".indexOf(a.det_desc_docu[0].toLowerCase());
          const bIndex = "abcdefghijklmnopqrstuvwxyz".indexOf(b.det_desc_docu[0].toLowerCase());

          return aIndex - bIndex;
        })
        .filter((i) => i.label.toUpperCase().includes(filtro.toUpperCase())),
    [filtro, lista]
  );

  const letras = [...new Set(listaOrdenada.map((i) => i.det_desc_docu[0].toUpperCase()))];

  const obtenerDatosDeTipo = useCallback(() => {
    api.get("/api/appweb/lista-tipo-documentacion", { params: { cod_tip_docu: id } }).then(({ data }) => setData(data?.data[0] || []));
  }, [id]);
  const obtenerTipos = useCallback(() => {
    api
      .get("/api/appweb/lista-det-tipo-documentacion", { params: { cod_tip_docu: id } })
      .then(({ data }) => setLista(data?.data.map((i) => ({ ...i, id: i.cod_det_tip_docu, label: i.det_desc_docu, to: `${i.cod_det_tip_docu}` })) || []));
  }, [id]);

  useEffect(() => {
    Promise.all([obtenerTipos(), obtenerDatosDeTipo()]);
  }, [obtenerTipos, obtenerDatosDeTipo]);

  return (
    <Box sx={{ p: 1, m: 0, flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 107px)" }} id="ListaComponentesDocumentacion">
      <Grid container direction="column">
        <Grid>
          <Button sx={{ color: `primary.${opositeMode}` }} onClick={() => navigate("/documentacion")}>
            <Icon className="c-derecha-arriba-izquierda" />
            Regresar a la lista
          </Button>
        </Grid>
        <Grid size={{ my: 1 }}>
          <Grid container direction="row">
            <Grid size={{ my: 1 }}>
              <Typography variant="h6">{data?.desc_tip_docu}</Typography>
            </Grid>
            <Grid size="grow"></Grid>
            <Grid size={12} sm sx={{ my: 1 }}>
              <TextField label="Busca una Documentación" variant="outlined" size="small" type="text" color="secondary" fullWidth name="filtro" value={filtro} onChange={onInputChange} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container sx={{}} width="100%">
        {letras.map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }} key={i} sx={{ px: 1 }}>
            <List subheader={<li />}>
              <ListSubheader
                sx={{
                  m: 0,
                  p: 0.5,
                  lineHeight: 1.1,
                  height: "auto",
                  borderColor: `primary.${opositeMode}`,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderRadius: 2,
                  color: `primary.${opositeMode}`,
                }}
              >
                <Typography variant="h6">{i}</Typography>
              </ListSubheader>
              <ListItem item sx={{ m: 0, p: 0, py: 1, px: 2, lineHeight: 1.1, height: "auto" }}>
                <List sx={{ m: 0, p: 0, lineHeight: 1.1, height: "auto" }}>
                  <ListItem sx={{ m: 0, p: 0, lineHeight: 1.1, height: "auto" }}>
                    <MenuComponent
                      propiedades={{ id: "id", texto: "label", ruta: "to" }}
                      menus={listaOrdenada.map((i) => ({ ...i, color: `text`, iconColor: `primary.${opositeMode}` })).filter((item) => item.det_desc_docu[0].toUpperCase() === i)}
                      direction="column"
                      backgroundColor="transparent"
                    />
                  </ListItem>
                </List>
              </ListItem>
            </List>
          </Grid>
        ))}
      </Grid>
      {/* <pre>{JSON.stringify(listaOrdenada, null, 2)}</pre> */}
    </Box>
  );
};

export default ListaComponentesDocumentacion;
