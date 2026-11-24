import React, { useEffect, useState, useMemo } from "react";
import TabComponent from "../../components/Tabs/TabComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import { FormularioCompletoEstados } from "../../views/Estados/FormularioCompletoEstados";
import { ModalEstados } from "./ModalEstados";

export const VistaEstados = () => {
  let { sta } = useParams();
  let location = useLocation();
  const [data, setData] = useState(null);
  const [updateData, setUpdateData] = useState(false);
  const [newState, setNewState] = useState(false);
  const [enableBtn, setEnableBtn] = useState(false);
  const [readOnlyInput, setReadOnlyInput] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/appweb/listaestados").then((res) => setData(res.data.data));
    if (location.pathname.includes("new")) {
      setNewState(true);
    } else {
      setNewState(false);
    }
    if (location.pathname.includes("edit")) {
      setEnableBtn(true);
    } else {
      setEnableBtn(false);
    }
    if (location.pathname.includes("view")) {
      setReadOnlyInput(true);
    } else {
      setReadOnlyInput(false);
    }
  }, [sta, updateData]);

  const searchItem = useMemo(() => {
    if (sta && data)
      return data.find((item) => {
        return item.COD_ESTADO == sta;
      });
  }, [data, updateData]);

  const blackPage = () => navigate("/configuracion/crud/estado");

  return data ? (
    <Box sx={{ p: 1, m: 0 }}>
      <Button color="primary" onClick={blackPage}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography variant="h6">{searchItem ? searchItem.ESTADO_DESC : "NUEVO ESTADO"}</Typography>
        </Grid>
      </Grid>
      {!newState && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Informacion del estado",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoEstados
                    readOnly={false}
                    dataGet={searchItem}
                    setUpdateData={setUpdateData}
                    updateData={updateData}
                    enableBtn={enableBtn}
                    readOnlyInput={readOnlyInput}
                    setEnableBtn={setEnableBtn}
                  />
                </Box>
              ),
            },
            {
              id: 2,
              label: "Modal",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <ModalEstados data={data} />
                </Box>
              ),
            },
          ]}
        />
      )}
      {newState && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Nuevo Estado",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoEstados readOnly={false} dataGet={searchItem} />
                </Box>
              ),
            },
          ]}
        />
      )}
    </Box>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
