import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton, Icon, Tooltip } from "@mui/material";
import { MyMenu } from "./MyMenu";

export const ChangeThemeButton = () => {
  const dispatch = useDispatch();

  // <Tooltip title={theme === "dark" ? "Cambiar a tema Claro" : "Cambiar a tema Oscuro"}>
  return (
    <MyMenu
      propiedades={{ clickFunction: "onClick", icono: "icon", id: "id", texto: "label", tooltip: "tooltip", ruta: "to" }}
      direction="row"
      backgroundColor="transparent"
      menus={[
        {
          id: "tickets",
          iconColor: "white.main",
          onClick: () => {
            /* dispatch(setLightTheme()) : dispatch(setDarkTheme()) */
          },
          icon: "c-sol",
          color: "white",
          tooltip: "Cambiar a tema Oscuro",
        },
      ]}
    />
  );
  /* <IconButton
        onClick={() => (theme === "dark" ? dispatch(setLightTheme()) : dispatch(setDarkTheme()))}
        color={theme === "dark" ? "secondary" : "white"}
      >
        <Icon fontWeight="bolder" className={theme === "dark" ? "c-sun11" : "c-moon11"} />
      </IconButton>
    </Tooltip> */
};

export default ChangeThemeButton;
