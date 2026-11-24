import PropTypes from "prop-types";

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
  "select",
  "radio",
  "checkbox",
  "select",
];

export const inputPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
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
});
