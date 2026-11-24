export const placeholder = (input) => `${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}`.toUpperCase();
export const style = (input) => ({
  "& .MuiFormLabel-root": {
    textTransform: "uppercase",
  },
  "& .MuiInputBase-root": {
    "& .MuiInputBase-root": {
      fontSize: "1rem", // Reduce el tamaño del texto
      padding: "2px 4px", // Reduce el padding del input
      maxHeight: "20px", // Asegura que la altura sea menor
      //   height: "10px", // Asegura que la altura sea menor
      //   lineHeight: 1, // Asegura que la altura sea menor
    },
    "& .MuiInputLabel-root": {
      fontSize: "1rem", // Reduce el tamaño de la etiqueta
      transform: "translate(14px, 10px) scale(1)", // Ajusta la posición de la etiqueta
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        padding: "2px", // Ajusta el padding del contenedor
      },
      "&.Mui-focused fieldset": {
        borderColor: "gray", // Opcional: Cambia el color del borde cuando está enfocado
      },
    },
    "& .MuiInputLabel-shrink": {
      transform: "translate(14px, -4px) scale(0.75)", // Ajusta la posición de la etiqueta al estar en modo shrink
      textTransform: "uppercase",
    },
    "& input": {
      padding: 0.5, // Padding interno del input
      "&::placeholder": {
        opacity: 1,
        color: "grey.500",
      },
      lineHeight: 1, // Asegura que la altura sea menor
    },
    "& .MuiSelect-select": {
      padding: "2px 4px", // Padding interno del input
    },
  },
  "& .MuiFormHelperText-root": {
    p: 0,
    m: 0,
  },
  "& .MuiSelect-select span::before": {
    content: `"${placeholder(input)}"`,
    fontSize: 12,
    m: 0,
    p: 0,
    lineHeight: 0.75,
    color: "grey.500",
  },
});
