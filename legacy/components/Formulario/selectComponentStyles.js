export const placeholder = (input) => `${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}`.toUpperCase();
export const style = (input) => ({
  "& button.MuiButtonBase-root": {
    visibility: "visible",
  },
  "& .MuiAutocomplete-endAdornment": {
    "& .MuiButtonBase-root": {
      color: input.color || "black",
    },
  },
  "& .Mui-readOnly": {
    "& .MuiAutocomplete-popupIndicator *": {
      opacity: 0.26,
    },
    "& .Mui-readOnly": { color: "rgba(0, 0, 0, 1)" },
    "& .Mui-readOnly .endAdornment ": { color: "rgba(0, 0, 0, 1)" },
    "& .Mui-readOnly .MuiBox-root ": { color: "rgba(0, 0, 0, 1) !important" },
  },
  "& .MuiInputBase-root": {
    // fontSize: "12px", // Reducir aún más el tamaño del texto
    pt: "2.5px !important", // Minimizar el padding del input
    pr: "12px !important", // Minimizar el padding del input
    pb: "0px !important", // Minimizar el padding del input
    pl: "0px !important", // Minimizar el padding del input
    minHeight: "24px", // Reducir la altura mínima del input
    height: "auto", // Reducir la altura mínima del input
    "& .MuiInputBase-root": {
      // fontSize: "12px", // Reducir aún más el tamaño del texto
      py: "0px !important", // Minimizar el padding del input
      minHeight: "24px", // Reducir la altura mínima del input
      height: "auto", // Reducir la altura mínima del input
    },
    "& .MuiInputBase-input": {
      p: 0,
    },
    "& .MuiIconButton-root": {
      p: "auto",
      color: input.color || "black",
      //   minWidth: 0,
    },
    "& .MuiButtonBase-root": {
      color: "text !important",
    },
  },
  "& .MuiInputLabel-root": {
    // fontSize: "1rem", // Reducir el tamaño de la etiqueta
    transform: "translate(10px, 6px) scale(1) !important",
    "& fieldset": { padding: "2px" },
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(5px, -10px) scale(1) !important",
    textTransform: "uppercase",
  },
  "& input": {
    // padding: "2px 4px", // Reducir el padding interno del input
    // width: 10,
    "&::placeholder": { opacity: 0.5 },
    lineHeight: 1,
    bgcolor: "transparent",
    pr: "5px !important",
    paddingLeft: "10px !important",
  },
  "& .MuiFormHelperText-root": {
    marginTop: "0px", // Reducir el margen superior del texto de ayuda
    padding: 0, // Minimizar el padding del input
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      padding: "0px", // Eliminar padding adicional en el contenedor
    },
  },
});
