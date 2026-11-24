export const menuItemBackgroundStyles = (color = "transparent") => ({ bgcolor: color });

const general = {
  ...menuItemBackgroundStyles(),
  marginY: 0,
  marginX: 0,
  marginRight: 0,
  paddingY: 0,
  paddingX: 0,
  lineHeight: 1,
  minHeight: "auto",
  boxShadow: "none",
  borderRadius: 0,
};

export const menuItemBorderStyles = (color = "transparent", width = 0) => ({
  ...general,
  ...(width > 0 ? { borderStyle: "solid", borderColor: color, borderWidth: width, "&:hover": { borderWidth: `${width}` } } : {}),
});
export const menuButtonStyles = () => ({ ...general, p: 0, m: 0, ...menuItemBorderStyles("white", 0.1) });

export const menuTextStyles = () => ({ ...general, m: 0, py: 0.5, px: 0 });

export const menuIconStyles = () => ({ ...general, p: 0, my: 0.1, mt: 0, mx: 0.1, fontSize: 11 });
