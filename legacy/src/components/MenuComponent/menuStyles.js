export const menuItemBackgroundStyles = (color = "transparent") => ({ bgcolor: color });
import { scrollType as SCROLL_STILE } from "../../style/scrollStyle";

const general = {
  marginY: 0,
  marginX: 0,
  marginRight: 0,
  paddingY: 0,
  paddingX: 0,
  lineHeight: 1,
  minHeight: "auto",
  boxShadow: "none",
  borderRadius: 0,
  ...menuItemBackgroundStyles(),
};

//ESTILO APLICADO A ROOT DEL MENU
export const menuStyles = { ...general };

//ESTILO APLICADO A UN ITEM DEL MENU
export const menuItemStyles = { ...general, paddingX: 0, maxWidth: "auto", minWidth: "auto", "& .MuiPaper-root": { mx: 0 } };

//
export const menuItemBorderStyles = (color = "transparent", width = 0) => ({
  ...menuItemStyles,
  ...(width > 0 ? { borderStyle: "solid", borderColor: color, borderWidth: `${width}`, "&:hover": { borderWidth: `${width}` } } : {}),
});

//ESTILO APLICADO AL BOTON DENTRO DEL ITEM DEL MENU
export const menuButtonStyles = { width: "100%", justifyContent: "start", lineHeight: 1, my: 0, borderRadius: 0, maxWidth: 400 };

//ESTILO APLICADO AL BOTON DENTRO DEL ITEM DEL MENU
export const menuIconButtonStyles = { width: "100%", justifyContent: "start", lineHeight: 1, my: 0 };

//ESTILO APLICADO AL TEXTO DENTRO DEL BOTON DE UN ITEM DEL MENU
export const menuTextStyles = { ...general, paddingY: 0.3, paddingLeft: 0.3 };

//ESTILO APLICADO AL ICONO DE LA IZQUIERDA DEL BOTON DE UN ITEM DEL MENU
export const menuIconStyles = {
  ...general,
  "& .MuiAccordionSummary-expandIconWrapper": { m: 0, p: 0, pr: 1 },
  fontSize: 11,
  m: 0,
  p: 0,
  transition: "transform 0.3s ease",
  transform: "rotate(0deg)",
  width: "auto",
};

//ESTILO APLICADO AL ICONO DE EXPANSION DE LA DERECHA DE UN BOTON DE UN ITEM DEL MENU
export const menuIcon180Styles = { ...general, ...menuIconStyles, fontSize: 11, transition: "transform 0.3s ease", transform: "rotate(-180deg)" };

//ESTILO APLICADO AL BOTON DEDICADO A MOSTRAR / OCULTAR LA DESCRIPCION DEL ITEM
export const menuButtonDescripcionStyles = { ...general, marginX: 0.5, width: 16, height: 16 };

//ESTILO APLICADO AL ICONO PARA BRIR LA DESCRIPCION DEL ITEM
export const menuIconDescripcionStyles = {
  ...general,
  ...menuIconStyles,
  fontSize: 11,
  transition: "0.5s ease",
  transform: "rotate(0deg)",
  width: 16,
};

//ESTILO APLICADO AL ICONO PARA CERRAR LA DESCRIPCION DEL ITEM
export const menuIconDescripcionAbiertoStyles = {
  ...general,
  ...menuIconStyles,
  fontSize: 11,
  transition: "0.5s ease",
  transform: "rotate(-90deg)",
  width: 16,
};

//ESTILO APLICADO A LA DESCRIPCION DE UN ITEM DEL MENU
export const menuDescripcionStyles = {
  ...general,
  fontSize: 6,
  p: 0,
  m: 0,
  lineHeight: 1,
  ...general,
  ...menuIconStyles,
  transition: "0.5s ease",
  transform: "rotate(-90deg)",
  width: 16,
  textTransform: "none",
  maxWidth: 400,
  warp: "",
};

//ESTILO APLICADO AL POPUP DEL MENU EXPANDIBLE
export const menuPaperPropsStyles = {
  "& .MuiMenu-paper": {
    ...general,
    elevation: 0,
    m: 0,
    p: 0,
    mt: 0,
    transform: ".5s ease-in-out",
    width: "fit-content",
    maxWidth: "fit-content",
    minWidth: "fit-content",
    ...SCROLL_STILE("overflowY"),
  },
  "& .MuiList-root": { my: 0, py: 0, width: "fit-content", maxWidth: "fit-content", minWidth: "fit-content" },

  // "&.MuiPopover-root": { "& .MuiModal-backdrop": { bgcolor: "rgba(255,255,255,0.1)" } },
};

//ESTILO APLICADO AL CONTENEDOR DEL MENU EXPANDIBLE
export const menuExsionStyles = { ...general, minWidth: 100 };

//EXTILO APLICADO A UN ITEM DENTRO DEL CONTENEDOR DEL MENU EXPANDIBLE
export const menuExsionItemStyles = { ...general, ...menuItemStyles, minWidth: 100 };

export const menuAcordionStyles = {
  "&.Mui-expanded": { ...general, paddingX: "0px !important", "& .MuiCollapse-root": { ...general, my: 0 }, ml: 0 },
  ".Mui-expanded": { ...general, my: 0, width: "fit-content", maxWidth: "fit-content", minWidth: "fit-content" },
  "& .MuiCollapse-root": { ...general, my: 0, width: "fit-content", maxWidth: "fit-content", minWidth: "fit-content" },
  ...{ ...general, paddingX: "0px !important", ml: 0, width: "fit-content", maxWidth: "fit-content", minWidth: "fit-content" },
  "& button": { width: "fit-content", maxWidth: "fit-content", minWidth: "fit-content" },
  "& .MuiGrid-root": { width: "fit-content", maxWidth: "fit-content", minWidth: "fit-content" },
  width: "fit-content",
  maxWidth: "fit-content",
  minWidth: "fit-content",
};

export const menuAcordionSumaryStyles = {
  ".MuiAccordionSummary-content.Mui-expanded": { ...general, my: 0 },
  "&.MuiAccordionSummary-content.Mui-expanded": { ...general, my: 0 },
  ".MuiAccordionSummary-content": { ...general, my: 0 },
  "& .MuiAccordionSummary-content": { ...general, my: 0 },
  "&.MuiAccordionSummary-gutters": { ...general },
  ".MuiAccordionSummary-gutters": { ...general },
  "&.MuiAccordionSummary-contentGutters": { ...general },
  ".MuiAccordionSummary-expandIconWrapper": { mx: 0, pr: 1 },
  "&.MuiAccordionSummary-expandIconWrapper": { mx: 0, ...menuIconStyles, pr: 1 },
  "& .MuiAccordionSummary-expandIconWrapper": { mx: 0, ...menuIconStyles, pr: 1 },
  ".Mui-expanded": { ...general, "& .MuiAccordionSummary-expandIconWrapper": { mx: 1, ...menuIconStyles, pr: 1 }, my: 0, pr: 1 },
  ...general,
  width: "fit-content",
  maxWidth: "fit-content",
  minWidth: "fit-content",
  pr: 1,
};

export const menuAcordionDetailsStyles = {
  "&.MuiAccordion-region": { ...general, m: 0, p: 0 },
  ...{ ...general, m: 0, p: 0, maxWidth: 200 },
};
