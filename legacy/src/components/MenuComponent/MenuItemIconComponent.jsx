import React from "react";
import PropTypes from "prop-types";
import { Icon } from "@mui/material";
import { menuIconStyles, menuIcon180Styles, menuIconDescripcionStyles, menuIconDescripcionAbiertoStyles } from "./menuStyles";

const MenuItemIconComponent = (props) => {
  const { color, icon, type = "icono", open = false, onClick } = props;

  return (
    <Icon
      className={
        type === "icono"
          ? icon
            ? `${icon}`.startsWith("c-") || `${icon}`.startsWith("cropa-")
              ? `${icon}`.startsWith("cropa-")
                ? `${icon}`.replace("cropa-", "c-")
                : icon
              : "material-symbols-outlined"
            : "c-radio-button"
          : type === "expandir"
            ? "c-simple-arriba"
            : type === "descripcion"
              ? "c-more-horizontal"
              : "c-arrow-right"
      }
      sx={{
        color: color,
        ...(type === "icono" ? menuIconStyles : type === "expandir" ? (open ? menuIcon180Styles : menuIconStyles) : open ? menuIconDescripcionAbiertoStyles : menuIconDescripcionStyles),
        fontSize: "2vh",
        ...(type === "expandir" ? { fontSize: 10, ml: "0.5em !important" } : {}),
        "& .MuiSelect-select span::before": { width: "auto", height: "auto" },
        height: "auto !important",
        width: "auto !important",
        lineHeight: "normal",
      }}
      onClick={onClick}
    >
      {!(`${icon}`.startsWith("c-") || `${icon}`.startsWith("cropa-")) && icon}
    </Icon>
  );
};

MenuItemIconComponent.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.string,
  type: PropTypes.oneOf(["icono", "expandir", "descripcion"]),
  open: PropTypes.bool,
  onClick: PropTypes.func,
};

export default MenuItemIconComponent;
