import { fontFamily } from "@mui/system";
import colors, { coloresChart } from "./colors";

export const lightTheme = {
  typography: {
    fontSize: 14,
    code: { fontSize: "inherit", fontFamily: "Consolas, 'Courier New', monospace" },
    pre: { fontSize: "inherit", fontFamily: "Consolas, 'Courier New', monospace" },
    fontFamily: "Arial, san-serif",
  },
  components: {
    MuiCssBaseline: {},
  },
  palette: {
    mode: "light",
    ...colors,
  },
  chart: { colors: coloresChart },

  "@global": {
    "&.MuiMenuItem-root": { m: 0, p: 0 },
    root: { fontSize: "14 !important" },

    "& .MuiFormControl-root": {
      p: 0,
      m: 0,
      "& .MuiFormLabel-root": {
        textTransform: "uppercase",
      },
      "& .MuiInputBase-root": {
        "& .MuiInputBase-root": {
          fontSize: "1rem",
          padding: "2px 4px",
          maxHeight: "20px",
          height: "auto",
        },
        "& .MuiInputLabel-root": {
          fontSize: "1rem",
          transform: "translate(14px, 10px) scale(1)",
        },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            padding: "2px",
          },
        },
        "& .MuiInputLabel-shrink": {
          transform: "translate(20px, -4px) scale(0.75) !important",
          textTransform: "uppercase",
        },
        "& input": { p: 0, lineHeight: 1, m: 0 },
        "& .MuiSelect-select": { padding: "2px 8px" },
      },
      "& .MuiFormHelperText-root": { p: 0, m: 0 },
    },
  },
};
