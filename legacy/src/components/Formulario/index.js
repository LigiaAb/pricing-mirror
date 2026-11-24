import PropTypes from "prop-types";
import lightScroll from "../../style/scrollStyle";
import { colors } from "../../theme/colors";

export const inputTypes = [
  "text",
  "archivo",
  "textarea",
  "texteditor",
  "password",
  "email",
  "number",
  "moneda",
  "date",
  "datetime",
  "select",
  "selectQuery",
  "radio",
  "checkbox",
  "toggle",
  "modalselect",
  "subtitulo",
  "titulo",
  "comentario",
  "separador",
  "quetzales",
  "dolares",
  "icono",
];

export const inputPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tipo: PropTypes.oneOf(inputTypes),
  label: PropTypes.string,
  placeholder: PropTypes.string,
  val: PropTypes.any,
  readonly: PropTypes.bool,
  requerido: PropTypes.bool,
  error: PropTypes.bool,
  errorMessge: PropTypes.string,
  valueOption: PropTypes.string,
  labelOption: PropTypes.string,
  onBuscar: PropTypes.func,
  onCrear: PropTypes.func,
  icono: PropTypes.string,
  color: PropTypes.string,
  acceptedFiles: PropTypes.string,
  pegar: PropTypes.bool,
});

export const groupPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  icono: PropTypes.string,
  mostrarTitulo: PropTypes.bool,
  error: PropTypes.bool,
  errorMessge: PropTypes.string,
  color: PropTypes.string,
  bgcolor: PropTypes.string,
  titleSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  border: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

export const styleGenerar = (input) => ({
  p: 0,
  m: 0,
  height: "100%",
  bgcolor: "transparent",
  // mt: "10px !important"    ,
  // "& .MuiFormControl-root": { mt: 1 },
  "& .MuiButtonBase-root": { p: 0, pl: 0.4, m: 0 },
  // "& .MuiInputBase-adornedEnd": { px: "4px !important" },
  // "& textarea:first-child": {
  //   height: "auto",
  //   ...lightScroll,
  //   overflow: "auto !important",
  // },
  "& .MuiTiptap-RichTextContent-root": { p: 1, m: 0, "& .tiptap": { ...lightScroll, maxHeight: input.maxHeight ? input.maxHeight : "200px" } },
  "&.MuiAutocomplete-root": {
    "& .MuiFormControl-root": {
      p: 0,
      m: 0,
      mt: 0,
      "& .MuiAutocomplete-endAdornment": {
        pr: 0.8,
      },
      "& .MuiInputBase-root": {
        p: 0,
        m: 0,
        input: { p: 1 },
      },
    },
    "& .Mui-disabled": { color: "text.main", WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
    "& .Mui-disabled .MuiBox-root ": { color: "text.main", WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
  },
  "& .MuiInputBase-input": { p: 1, m: 0 },
  "&.MuiInputBase-root": { p: 0, m: 0 },
  "& .Mui-readOnly": { WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
  "&.Mui-readOnly": { WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
  "& .Mui-readOnly .endAdornment ": { WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
  "&.Mui-readOnly .endAdornment ": { WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
  // ...(input.tipo === "select" && { "& .MuiInputBase-adornedEnd": { px: "5px !important" } }),
  backdropFilter: input.resaltar ? "blur(10px)" : undefined,
  borderRadius: 1,
  "&.MuiFormControl-root": {
    p: 0,
    m: 0,
    mt: 0,
    "& .MuiInputBase-root": { p: 0, m: 0 },
  },
  "& .MuiAutocomplete-inputRoot": {
    width: "100%",
  },
  "& .MuiAutocomplete-input": {
    flexGrow: 1,
  },
});
