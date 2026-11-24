export const lightScroll = {
  overflow: "overlay",
  "&:hover": { overflow: "overlay" },
  "::-webkit-scrollbar": { height: "10px !important", width: "10px !important", zIndex: 9000 },
  "::-webkit-scrollbar-track": { backgroundColor: "transparent" },
  "::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
  "&:hover::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0, 0, 0, 0.5)" },
  "::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
};
export const darkScroll = {
  overflow: "overlay",
  "&:hover": { overflow: "overlay" },
  "::-webkit-scrollbar": { height: "10px !important", width: "10px !important", zIndex: 9000 },
  "::-webkit-scrollbar-track": { backgroundColor: "transparent" },
  "::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
  "&:hover::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255, 255, 255, 0.5)" },
  "::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
};
export const scrollType = (type, color = "rgba(0, 0, 0, 0.3)") => ({
  [type]: "overlay",
  "&:hover": { [type]: "overlay" },
  "::-webkit-scrollbar": { height: "10px !important", width: "10px !important" },
  "::-webkit-scrollbar-track": { backgroundColor: "rgb(0, 0, 0, 0.2)", zIndex: 9000 },
  "::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
  "&:hover::-webkit-scrollbar-thumb": { backgroundColor: color },
  "::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
});
export default lightScroll;
