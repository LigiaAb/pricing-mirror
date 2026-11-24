import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Accordion, AccordionDetails, AccordionSummary, Grid, Icon, IconButton, Typography } from "@mui/material";

import { acordionDetailsStyles, acordionStyles, acordionSumaryStyles, backgroundStyles } from "./acordeonStyle";
import OVERFLOW_STYLES from "../../../style/scrollStyle";

const AcordionTipo = (props) => {
  const [open, setOpen] = useState(false);

  const { item, primero, ultimo, ejecutarAccion, children, guardar, mostrarBotones, style } = props;

  const elemento = useMemo(() => item, [item]);

  return (
    <Grid container direction="column" sx={style} size="grow">
      <Grid size="grow" sx={{ mb: 0.5, maxWidth: "100% !important" }}>
        <Accordion sx={{ ...acordionStyles, width: "100%" }} expanded={open}>
          <AccordionSummary size="grow" sx={{ ...acordionSumaryStyles }}>
            <Grid container direction="row" sx={{ width: "100% !important", p: 0 }}>
              <Grid size="grow" onClick={() => setOpen((i) => !i)}>
                <Typography variant="h6" sx={{ m: 1, padding: 0 }}>
                  <Typography component="span" variant="caption">
                    <Typography component="span" variant="pre" color="white.main" sx={{ "&.MuiTypography-root": { color: "white.main" } }}>
                      {elemento?.id}
                    </Typography>
                  </Typography>
                  {elemento?.tipo === "hr" ? "separador" : elemento?.tipo} {elemento?.guardado ? "" : "*"}
                </Typography>
              </Grid>
              <Grid size="auto" sx={{ px: 1 }}>
                <IconButton color="white" sx={{ color: "grey.300", m: 0, p: 0 }} onClick={() => ejecutarAccion("copiar", elemento)} size="small">
                  <Typography className="c-copiar" fontSize="small" />
                </IconButton>
              </Grid>
              <Grid size="auto" sx={{ px: 1 }}>
                <IconButton color="white" sx={{ color: "secondary.300", m: 0, p: 0 }} onClick={guardar} size="small">
                  <Typography className="c-guardar" fontSize="small" />
                </IconButton>
              </Grid>
              {mostrarBotones && (
                <Grid size="auto" sx={{ px: 1 }}>
                  <IconButton
                    color="white"
                    sx={{ "&.Mui-disabled": { color: "white.main_50", opacity: 1 }, m: 0, p: 0 }}
                    disabled={primero}
                    onClick={() => ejecutarAccion("subir", elemento)}
                    size="small"
                  >
                    <Typography className="c-arriba" fontSize="small" />
                  </IconButton>
                </Grid>
              )}
              {mostrarBotones && (
                <Grid size="auto" sx={{ px: 1 }}>
                  <IconButton color="red" sx={{ m: 0, p: 0 }} onClick={() => ejecutarAccion("cancelar", elemento)} size="small">
                    <Typography className="c-eliminar" fontSize="small" />
                  </IconButton>
                </Grid>
              )}
              {mostrarBotones && (
                <Grid size="auto" sx={{ px: 1 }}>
                  <IconButton
                    color="white"
                    sx={{ "&.Mui-disabled": { color: "white.main_50", opacity: 1 }, m: 0, p: 0 }}
                    disabled={ultimo}
                    onClick={() => ejecutarAccion("bajar", elemento)}
                    size="small"
                  >
                    <Typography className="c-abajo" fontSize="small" />
                  </IconButton>
                </Grid>
              )}
            </Grid>
          </AccordionSummary>
          <AccordionDetails sx={{ ...acordionDetailsStyles, ...OVERFLOW_STYLES, p: 1 }}>{children}</AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
};

AcordionTipo.propTypes = {
  style: PropTypes.object,

  item: PropTypes.object,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,

  mostrarBotones: PropTypes.bool,

  ejecutarAccion: PropTypes.func,
  guardar: PropTypes.func,

  children: PropTypes.node,
};

export default AcordionTipo;
