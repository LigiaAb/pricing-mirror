import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import MenuComponent from "../components/Menu/MenuComponent";

import { useSelector, shallowEqual } from "react-redux";

// ESTLOS
import SCROLL_STILE from "/src/style/scrollStyle";
import TabComponent from "../components/Tabs/TabComponent";
import FormularioComponent from "../components/Formulario/FormularioComponent";

export const PaginaVaciaPage = () => {
  const { notificaciones } = useSelector((state) => state.notificacion, shallowEqual);
  const { menus, currentMenu } = useSelector((state) => state.menu, shallowEqual);
  return (
    <Box sx={{ m: 0, p: 0, minHeight: "-webkit-fill-available" }}>
      <Typography variant="h6">EMPRESA</Typography>
      <TabComponent
        opciones={[
          {
            id: 1,
            label: "opcion 1 (INFO DE PAGINA)",
            borderColor: "blue.main",
            bgcolor: "blue.main",
            content: (
              <Box>
                <FormularioComponent
                  inputs={[
                    { id: "test1", label: "test1", tipo: "text", val: "test" },
                    { id: "test2", label: "test2", tipo: "text", val: "" },
                    { id: "test3", label: "test3", tipo: "date", val: "" },
                  ]}
                />
              </Box>
            ),
          },
          { id: 2, label: "opcion 2 (CONTABILIDAD)" },
          { id: 3, label: "opcion 3 (IMPORTACIONES)" },
          { id: 4, label: "opcion 4 (FACTURACIÓN)" },
          { id: 5, label: "opcion 5" },
          { id: 6, label: "opcion 6" },
          { id: 7, label: "opcion 7" },
          { id: 8, label: "opcion 8" },
          { id: 9, label: "opcion 9" },
        ]}
      />
    </Box>
  );
  // <MenuComponent
  //   direction="row"
  //   backgroundColor="white.main"
  //   borderColor="primary.main"
  //   borderWidth={0.1}
  //   menus={currentMenu.menus}
  //   props={{ maxWidth: "calc(100vw - 100px)", ...SCROLL_STILE, overflowX: "auto", overflowY: "none" }}
  // />
};
