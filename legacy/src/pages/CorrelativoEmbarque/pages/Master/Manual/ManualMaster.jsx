import { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import TabComponent from "../../../../../components/Tabs/TabComponent";
import ManualCrear from "./ManualCrear";
import ManualTabla from "./ManualTabla";

const ManualMaster = ({
  correlativos,
  isLoading = false,
  onEdit = () => { },
  onDelete = () => { },
  onAgregar = () => { },
}) => {

  const opciones = useMemo(() => [
    {
      id: "informacion",
      label: "Información",
      icono: "c-informacion",
      content: (
        <ManualTabla
          correlativos={correlativos}
          isLoading={isLoading}
          onEdit={onEdit}
          onDelete={onDelete}
          onAgregar={onAgregar}
        />
      ),
    },
    {
      id: "nuevo",
      label: "Nuevo",
      icono: "c-suma",
      content: <ManualCrear />,
    },
  ], [correlativos, isLoading, onEdit, onDelete, onAgregar]);

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="h5" color="text.primary" gutterBottom sx={{ textAlign: "center" }}>
        Correlativos Masters Manuales
      </Typography>
      <Box sx={{ width: "100%" }}>
        <TabComponent opciones={opciones} tabInicial={"informacion"} titulo="Pool de guías" mostrarTitulo={true} />
      </Box>
    </Box>
  );
};

ManualMaster.propTypes = {
  correlativos: PropTypes.array,
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAgregar: PropTypes.func,
};

export default ManualMaster;