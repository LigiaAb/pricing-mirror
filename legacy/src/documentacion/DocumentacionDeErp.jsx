import { Grid, Box, Paper, Typography, Card, CardContent, Button } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useSelector } from "react-redux";

const DocumentacionDeErp = () => {
  const navigate = useNavigate();

  const { opositeMode } = useSelector((state) => state.theme);

  const [lista, setLista] = useState([]);

  const obtenerTipos = useCallback(() => {
    api.get("/api/appweb/lista-tipo-documentacion").then(({ data }) => setLista(data.data));
  }, []);

  useEffect(() => {
    obtenerTipos();
  }, [obtenerTipos]);

  return (
    <Box sx={{ m: 0, p: 0, overflowY: "auto", maxHeight: "calc(100vh - 107px)" }}>
      <Grid container sx={{ width: "100%", height: { xs: "fit-content", sm: "fit-content" } }} justifyContent={"center"}>
        <Grid size={12} sx={{ pb: 0.5 }}>
          <Grid container>
            <Grid size={{ pb: 0.5 }}>
              <Typography variant="h6">DOCUMENTACIÓN</Typography>
            </Grid>
            <Grid size="grow"></Grid>
          </Grid>
        </Grid>
        {lista.map((item) => (
          <Grid key={JSON.stringify(item.cod_tip_docu)} size={{ xs: 12, md: 6, lg: 4, xl: 3 }} sx={{ px: 1, mb: 1 }}>
            <Button
              variant="outlined"
              sx={{
                color: `primary.${opositeMode}`,
                borderColor: `primary.${opositeMode}`,
                p: 3,
                mb: 0,
                borderRadius: 2,
                width: "100%",
                "&.Mui-": { cursor: "not-allowed" },
              }}
              onClick={() => navigate(`/documentacion/${item.cod_tip_docu}`)}
            >
              <Typography variant="h6" sx={{}}>
                {item.desc_tip_docu}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DocumentacionDeErp;
