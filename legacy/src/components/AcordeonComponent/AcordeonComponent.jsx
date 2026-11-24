import React from "react";
import PropTypes from "prop-types";
import { Accordion, AccordionDetails, AccordionSummary, Button, Grid, Icon, Typography } from "@mui/material";

const defaultStyleModify = {
  marginY: "0px !important",
  padding: "0px !important",
  minHeight: "auto !important",
  border: "none",
  fontSize: "1rem",
  boxShadow: "none",
};

const defaultPropiedades = {
  bgcolor: "primary.main",
  titulo: {
    color: "white.main",
  },
};

const AcordeonComponent = (props) => {
  const { expandido = true, expandir, propiedades = defaultPropiedades, titulo: tituloComponent, cuerpo } = props;
  const { bgcolor, titulo, borderRadius = 1 } = propiedades;

  return (
    <Accordion expanded={expandido} onChange={expandir} xs={"auto"} direction={"column"} sx={{ ...defaultStyleModify }}>
      <AccordionSummary
        m={0}
        p={0}
        xs={"auto"}
        sx={{
          ".MuiAccordionSummary-content": { ...defaultStyleModify },
          ".MuiAccordionSummary-gutters": { ...defaultStyleModify },
          ".MuiAccordionSummary-contentGutters": { ...defaultStyleModify },
          ".MuiAccordionSummary-expandIconWrapper": { mx: 1 },
          "&.Mui-expanded": { ...defaultStyleModify },
          ...defaultStyleModify,
          bgcolor: bgcolor,
          // color: titulo?.color,
          p: 0,
          m: 0,
          borderRadius: borderRadius,
          ...propiedades,
          ...titulo,
        }}
        onClick={expandir}
      >
        {tituloComponent}
      </AccordionSummary>
      <AccordionDetails>{cuerpo}</AccordionDetails>
    </Accordion>
  );
};

AcordeonComponent.propTypes = {
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

export default AcordeonComponent;
