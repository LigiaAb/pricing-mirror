export const placeholder = (input) => `${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}`.toUpperCase();
export const style = (input) => ({
  "&.MuiFormControl-root": { mt: 10 },
  "& .MuiFormLabel-root": { textTransform: "uppercase" },
  "& .MuiInputBase-root": {
    "& .MuiInputBase-root": { fontSize: "1rem", padding: "2px 4px", maxHeight: "20px", height: "auto" },
    "& .MuiInputLabel-root": { fontSize: "1rem", transform: "translate(14px, 10px) scale(1)" },
    "& .MuiOutlinedInput-root": { "& fieldset": { padding: "2px" }, "&.Mui-focused fieldset": {} },
    "& .MuiInputLabel-shrink": { transform: "translate(20px, -4px) scale(0.75)", textTransform: "uppercase" },
    "& input": { padding: 0.5, "&::placeholder": { opacity: 0.5 }, lineHeight: 1 },
    "& .MuiSelect-select": { padding: "2px 4px" },
    "& .Mui-disabled input": { color: "text.main", WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
  },
  "& .MuiFormHelperText-root": { p: 0, m: 0 },
  "& .MuiSelect-select span::before": {
    content: `"${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}"`,
    fontSize: 12,
    m: 0,
    p: 0,
    lineHeight: 0.75,
  },
});

export const styleFilled = (input) => ({
  mt: input.tipo === "radio" ? 0 : 1.8,
  "& .MuiFormLabel-root": {
    textTransform: "uppercase",
    "&.MuiInputLabel-root": { transform: input.tipo === "select" ? "translate(10px, 6px) scale(1)" : "translate(10px, 0px) scale(1) !important" },
    "&.MuiInputLabel-shrink": { transform: input.tipo === "select" ? "translate(5px, -15px) scale(1)" : "translate(5px, -14px) scale(1) !important" },
  },
  "& .Mui-disabled input": { color: "text.main", WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
  "& .MuiInputBase-root": {
    "& .Mui-disabled input": { color: "text.main", WebkitTextFillColor: "rgba(0, 0, 0, 1)" },
    "& .MuiInputBase-input": {
      ...(input.tipo === "textarea" || input.tipo === "texteditor"
        ? {
            fontSize: "1rem",
            padding: "0px 10px 3px 10px",
            height: "fit-content",
            minHeight: "20px",
            maxHeight: input.height || 100,
            overflow: "auto !important",
            resize: "vertical",
          }
        : { fontSize: "1rem", padding: "2px 10px", maxHeight: "25px", height: "25px" }),
    },
    "& .MuiOutlinedInput-root": { "& fieldset": { padding: "2px" }, "&.Mui-focused fieldset": {}, "&.Mui-disabled": { color: "text.main", WebkitTextFillColor: "rgba(0, 0, 0, 1) !important" } },
    "& .MuiInputLabel-shrink": { textTransform: "uppercase" },
    "& input": { padding: "0.5px", "&::placeholder": { opacity: 0.5 }, lineHeight: 1, bgcolor: "transparent" },
    "&.MuiFilledInput-root": { bgcolor: "transparent" },
    "& .MuiSelect-select": { padding: "2px 8px" },
    p: input.tipo === "textarea" || input.tipo === "texteditor" || input.tipo === "date" ? 0 : undefined,
    pr: input.tipo === "date" ? 0.5 : undefined,
    mt: input.tipo === "textarea" || input.tipo === "texteditor" ? 0.8 : undefined,
  },
  "& .MuiFormHelperText-root": { p: 0, m: 0 },
  "& .MuiSelect-select span::before": {
    content: `"${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}"`,
    fontSize: 12,
    m: 0,
    p: 0,
    lineHeight: 0.75,
  },
});

export const styleStandard = (input) => ({
  "&.MuiFormControl-root": {
    mt: 10,
    maxHeight: "20px",
    height: "auto",
    margin: 0,
    p: 0,
    "& .MuiInputBase-root": { mt: 0 },
    "& .MuiInputLabel-root": { fontSize: "1rem", transform: "translate(10px, 3px) scale(1)" },
    "& .MuiInputLabel-shrink": { transform: "translate(10px, -15px) scale(1)", textTransform: "uppercase" },
  },
  "& .MuiFormLabel-root": { textTransform: "uppercase" },
  "& .MuiInputBase-root": {
    "& .MuiInputBase-input": { fontSize: "1rem", padding: "2px 4px", maxHeight: "20px", height: "auto" },
    "& input": { padding: "0.5px", "&::placeholder": { opacity: 0.5 }, lineHeight: 1 },
  },
  "& .MuiFormHelperText-root": { p: 0, m: 0 },
  "& .MuiSelect-select span::before": {
    content: `"${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}"`,
    fontSize: 12,
    m: 0,
    p: 0,
    lineHeight: 0.75,
  },
});
