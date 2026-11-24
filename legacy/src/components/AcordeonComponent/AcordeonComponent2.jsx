import React from "react";
import PropTypes from "prop-types";
import { Accordion, AccordionDetails, AccordionSummary, Button, Grid, Icon, Typography } from "@mui/material";

const defaultStyleModify = (bg) => ({
  marginY: "0px !important",
  padding: "0px !important",
  minHeight: "auto !important",
  border: "none",
  fontSize: "1rem",
  boxShadow: "none",
  borderRadius: 2,

  "& .MuiCollapse-root": {
    bgcolor: bg,
  },
});

const defaultPropiedades = {
  bgcolor: "primary.main",
  titulo: {
    color: "white.main",
  },
  borderRadius: 2,
};

const AcordeonComponent2 = (props) => {
  const { expandido = true, expandir, propiedades = defaultPropiedades, titulo, cuerpo, children } = props;
  const { bgcolor, titulo: tituloPropiedades, borderRadius, bgcolorAcordeon } = propiedades;

  return (
    <Accordion expanded={expandido} onChange={expandir} xs={"auto"} direction={"column"} sx={{ ...defaultStyleModify(bgcolorAcordeon), mb: 1, bgcolor: bgcolorAcordeon }}>
      <AccordionSummary
        m={0}
        p={0}
        xs={"auto"}
        sx={{
          ".MuiAccordionSummary-content": { ...defaultStyleModify(bgcolorAcordeon) },
          ".MuiAccordionSummary-gutters": { ...defaultStyleModify(bgcolorAcordeon) },
          ".MuiAccordionSummary-contentGutters": {
            ...defaultStyleModify(bgcolorAcordeon),
          },
          ".MuiAccordionSummary-expandIconWrapper": { mx: 1 },
          "&.Mui-expanded": { ...defaultStyleModify(bgcolorAcordeon) },
          ...defaultStyleModify(bgcolorAcordeon),
          bgcolor: bgcolor,
          color: tituloPropiedades?.color,
          p: 0,
          m: 0,
          borderRadius: borderRadius,
        }}
        onClick={expandir}
      >
        {titulo}
      </AccordionSummary>
      <AccordionDetails
        sx={{
          borderRadius: 30,
          padding: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {cuerpo}
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

AcordeonComponent2.propTypes = {
  expandido: PropTypes.bool,
  expandir: PropTypes.func,
  titulo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  cuerpo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  propiedades: PropTypes.shape({
    bgcolor: PropTypes.string,
    titulo: PropTypes.shape({
      bgcolor: PropTypes.string,
      color: PropTypes.string,
    }),
  }),
};

export default AcordeonComponent2;
