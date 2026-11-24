export const placeholder = (input) => `${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}`.toUpperCase();
export const style = (input) => ({
  "&.MuiFormControl-root": { mt: 10 },
  "& label": { display: "none !important" },
  "& .MuiFormLabel-root": { textTransform: "uppercase" },
  "& .MuiTextField-root": { borderBottom: "0px" },
  "& .MuiInputBase-root": {
    "& .MuiInputBase-root": { fontSize: "1rem", padding: "2px 4px", maxHeight: "20px", height: "auto" },
    "& .MuiInputLabel-root": { fontSize: "1rem", transform: "translate(14px, 10px) scale(1)" },
    "& .MuiOutlinedInput-root": { "& fieldset": { padding: "2px" }, "&.Mui-focused fieldset": {} },
    "& .MuiInputLabel-shrink": { transform: "translate(20px, -4px) scale(0.75)", textTransform: "uppercase" },
    "& input": { padding: 0.5, "&::placeholder": { opacity: 0.5 }, lineHeight: 1 },
    "& .MuiSelect-select": { padding: "2px 4px" },
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
  "&.MuiFormControl-root": { mt: "0px !important" },
  "& .MuiFormLabel-root": {
    display: "none !important",
    textTransform: "uppercase",
    "&.MuiInputLabel-root": { transform: input.tipo === "select" ? "translate(10px, 6px) scale(1)" : "translate(10px, 0px) scale(1) !important" },
    "&.MuiInputLabel-shrink": { transform: input.tipo === "select" ? "translate(5px, -15px) scale(1)" : "translate(5px, -14px) scale(1) !important" },
  },
  "& .MuiTextField-root": { borderBottom: "0px" },
  "& .MuiInputBase-root-MuiFilledInput-root": {
    bgcolor: "transparent !important",
    "&.Mui-focused": { bgcolor: "transparent !important" },
  },
  "& .MuiInputBase-root": {
    // "&::before": { borderBottom: "none !important" },
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
        : { fontSize: "1rem", padding: "0px" }),
    },
    "& .MuiOutlinedInput-root": { "& fieldset": { padding: "2px" }, "&.Mui-focused fieldset": {} },
    "& .MuiInputLabel-shrink": { textTransform: "uppercase" },
    "& input": { padding: "0.5px", "&::placeholder": { opacity: 0.5 }, lineHeight: 1, bgcolor: "transparent" },
    "&.MuiFilledInput-root": {
      bgcolor: "transparent !important",
      "&.Mui-focused": { bgcolor: "transparent !important" },
    },
    "& .MuiSelect-select": { padding: "2px 8px" },
    p: input.tipo === "textarea" || input.tipo === "texteditor" || input.tipo === "date" || input.tipo === "text" ? 0 : undefined,
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
    borderBottom: "none",
  },
});

export const styleStandard = (input) => ({
  "&.MuiFormControl-root": {
    mt: 10,
    maxHeight: "20px",
    height: "auto",
    margin: 0,
    p: 0,
    "& .MuiInputBase-root": { mt: 0, border: "0px !important" },
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
