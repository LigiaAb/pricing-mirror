import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentCategoria } from "../../../../store/slices/menu/menuSlice";
import TablaCoordinaciones from "../../../../components/bpm/tablas/tablaCoordinaciones";
import { encryptId } from "../../../../api/encryptDecrypt";
import LoaderComponent from "../../../../components/Loader/LoaderComponent";

const estadosCTS = [1, 40];
const estadosConfirmadas = [70, 71, 72, 73, 66, 67];

const Page = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState("CTS");

  const estadoFilter = filterMode === "CTS" ? estadosCTS : estadosConfirmadas;

  const handleView = (row) => {
    const id = row?.id || row?.EMBARQUE_ID || row?.embarque_id;
    if (id) {
      setIsLoading(true);
      const encoded = encryptId(id);
      dispatch(setCurrentCategoria({ categoria: { ruta_cat: `/embarques/embarques/gestion-embarques/${encoded}`, cod_categoria: "detalle" } }));
      setTimeout(() => {
        navigate(`/embarques/embarques/gestion-embarques/${encoded}`);
      }, 3000);
    } else {
      console.error("No se pudo determinar el ID del registro:", row);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 1, md: 2 },
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "relative",
      }}
    >
      <LoaderComponent open={isLoading} />
      <Typography variant="h6" component="h1" sx={{ fontWeight: "bold" }}>
        Gestión de embarques
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        <Button
          variant={filterMode === "CTS" ? "contained" : "outlined"}
          color="primary"
          onClick={() => setFilterMode("CTS")}
        >
          CTS
        </Button>
        <Button
          variant={filterMode === "Confirmadas" ? "contained" : "outlined"}
          color="primary"
          onClick={() => setFilterMode("Confirmadas")}
        >
          Confirmadas
        </Button>
      </Box>

      <TablaCoordinaciones
        titulo="Embarques"
        filasPorPagina={15}
        useSeach={true}
        usePagination={true}
        onView={handleView}
        onClickFila={handleView}
        estadoFilter={estadoFilter}
        hideColumns={[
          "correlativoGuia",
          "correlativoGuiaMaster",
          "entidadShipperNombre",
          "entidadConsignatarioNombre",
          "puntoEnlaceOrigen",
          "puntoEnlaceDestino",
          "tipoCarga",
          "incoterm",
          "repeso",
          "observaciones",
        ]}
        onLoadingChange={setIsLoading}
      />
    </Box>
  );
};

export default Page;
