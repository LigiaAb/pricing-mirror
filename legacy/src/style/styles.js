import colors from "../theme/colors";
export const styles = (styles) => {
  const { fontSize = 14 } = styles;

  return {
    transition: "flex .5s ease-in-out, flex .5s ease-in-out, margin .5s ease-in-out, width .5s ease-in-out, border-radius .5s ease-in-out;",

    "*": {
      fontSize,
      lineHeight: 1.1,
    },

    b: { fontSize: "inherit" },

    "&.scroll_hidden": {
      overflow: "hidden",
      "&:hover": {
        overflow: "overlay",
        scrollbarGutter: "15px",
        "::-webkit-scrollbar": { height: "10px !important", width: "10px !important", zIndex: 10000 },
        "::-webkit-scrollbar-track": { backgroundColor: "rgb(0, 0, 0, 0.2)" },
        "::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
        "&:hover::-webkit-scrollbar-thumb": { backgroundColor: "rgb(104, 104, 104, 0.6)" },
        "::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
      },
    },
    "&.scroll": {
      overflow: "overlay",
      scrollbarGutter: "15px",
      "::-webkit-scrollbar": { height: "10px !important", width: "10px !important", zIndex: 10000 },
      "::-webkit-scrollbar-track": { backgroundColor: "rgb(0, 0, 0, 0.2)" },
      "::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
      "&:hover::-webkit-scrollbar-thumb": { backgroundColor: "rgb(104, 104, 104, 0.6)" },
      "::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
    },

    "& .MuiTypography-root": {
      "&.MuiTypography-h6, &.MuiTypography-h5, &.MuiTypography-h4, &.MuiTypography-h3, &.MuiTypography-h2, &.MuiTypography-h1": {
        fontWeight: "bolder",
        margin: 0,
        padding: 0,
        lineHeight: 1,
      },
      "&.MuiTypography-span": {
        fontSize: "inherit",
      },
      "&.MuiTypography-pre": { fontSize: "inherit", fontFamily: "Consolas, 'Courier New', monospace", color: colors["grey"]["600"] },
      "&.MuiTypography-code": { fontSize: "inherit", fontFamily: "Consolas, 'Courier New', monospace", color: colors["grey"]["600"] },
    },

    "&.MuiSelect-standard": {
      fontSize: 14,
      lineHeight: 1,
      borderRadius: 0,
      minHeight: "auto",
      paddingRight: 0.5,
      margin: 0,
    },

    "& .MuiMenuItem-root": {
      fontSize: 14,
      lineHeight: 1,
      borderRadius: 0,
      minHeight: "auto",
      paddingRight: 0.5,
      margin: 0,
    },

    // code: { fontFamily: "Consolas, 'Courier New', monospace", color: colors["red"]["900"], fontSize: "inherit" },
    // "& .MuiTypography-code": { fontFamily: "'Courier New', monospace", color: "deepOrange.900" },
  };
};

export default styles;
