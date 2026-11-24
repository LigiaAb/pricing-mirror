import { createSlice } from "@reduxjs/toolkit";
import { colors, coloresChart, opacidades, mainLightColors, mainDarkColors } from "../../../theme/colors";

const storedThemeRaw = localStorage.getItem("theme");
const storedTheme = storedThemeRaw === "dark" ? "dark" : "light";
if (storedThemeRaw !== storedTheme) {
  localStorage.setItem("theme", storedTheme);
}

const agregarColoresOpacidad = (colors = { ...mainLightColors, ...colors }) => {
  let opacidades_x_color = {};

  Object.keys(colors).map((c) => {
    opacidades_x_color[c] = colors[c];

    Object.keys(colors[c]).map((i) => {
      let obj = {};
      Object.keys(opacidades).map((o) => (obj[`${i}_${o}`] = colors[c][i] + opacidades[o]));

      opacidades_x_color[c] = { ...opacidades_x_color[c], ...obj };
    });
  });

  return opacidades_x_color;
};

const baseTheme = {
  typography: {
    fontSize: 14,
    code: {
      fontSize: "inherit",
      fontFamily: "Consolas, 'Courier New', monospace",
    },
    pre: {
      fontSize: "inherit",
      fontFamily: "Consolas, 'Courier New', monospace",
    },
    // fontFamily: "Consolas, Arial, san-serif",
    fontFamily: "Arial, san-serif",
  },
  components: {
    MuiCssBaseline: {},
    MuiFormControl: {
      styleOverrides: {
        root: {
          // "& .MuiInputLabel-root": { textTransform: "uppercase" },
          marginTop: "2px",
          marginBottom: "2px",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: {
          "& .MuiOutlinedInput-root": {
            paddingTop: "6px !important",
            paddingBottom: "6px !important",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem", // Tamaño de fuente reducido
        },
      },
    },
    // MuiFormControl: {
    //   styleOverrides: {
    //     root: {
    //       marginTop: "8px",
    //       marginBottom: "8px",
    //     },
    //   },
    // },
  },
  palette: {
    mode: storedTheme,
    ...agregarColoresOpacidad({
      ...colors,
      ...(storedTheme === "dark" ? mainDarkColors : mainLightColors),
    }),
  },
  chart: { colors: coloresChart },

  "@global": {
    "&.MuiMenuItem-root": { m: 0, p: 0 },
    root: { fontSize: "14 !important" },
    "& .MuiFormControl-root": {
      p: 0,
      m: 0,
      "& .MuiFormLabel-root": {
        // textTransform: "uppercase",
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
          // textTransform: "uppercase",
        },
        "& input": { p: 0, lineHeight: 1, m: 0 },
        "& .MuiSelect-select": { padding: "2px 8px" },
      },
      "& .MuiFormHelperText-root": { p: 0, m: 0 },
    },
  },
};

export const themeSlice = createSlice({
  name: "theme",
  initialState: {
    fontSize: Number(localStorage.getItem("fontSize") || 14),
    themeMode: storedTheme,
    opositeMode: storedTheme === "dark" ? "light" : "dark",
    theme: baseTheme,
    colors: {
      ...agregarColoresOpacidad({
        ...(storedTheme === "dark" ? mainDarkColors : mainLightColors),
        ...colors,
      }),
    },
    showLaterlText: localStorage.getItem("showLaterlText") === "true" ? true : false,
  },
  reducers: {
    setFontSize: (state, { payload }) => {
      const { fontSize } = payload;
      localStorage.setItem("fontSize", fontSize);
      state.fontSize = fontSize;
    },
    setDarkTheme: (state, { payload }) => {
      localStorage.setItem("theme", "dark");
      state.themeMode = "dark";
      state.opositeMode = "light";
      state.colors = {
        ...agregarColoresOpacidad({ ...mainDarkColors, ...colors }),
      };
      state.theme = {
        ...baseTheme,
        palette: {
          mode: "dark",
          ...agregarColoresOpacidad({ ...mainDarkColors, ...colors }),
        },
      };

      // window.dispatchEvent(new Event("themeChange"));
    },
    setLightTheme: (state, { payload }) => {
      localStorage.setItem("theme", "light");
      state.themeMode = "light";
      state.opositeMode = "main";
      state.colors = {
        ...agregarColoresOpacidad({ ...mainLightColors, ...colors }),
      };
      state.theme = {
        ...baseTheme,
        palette: {
          mode: "light",
          ...agregarColoresOpacidad({ ...mainLightColors, ...colors }),
        },
      };

      // window.dispatchEvent(new Event("themeChange"));
    },
    setShowLaterlText: (state, { payload }) => {
      const showLaterlText = payload;
      sessionStorage.setItem("showLaterlText", showLaterlText);
      state.showLaterlText = showLaterlText;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setFontSize, setDarkTheme, setLightTheme, setShowLaterlText } = themeSlice.actions;
