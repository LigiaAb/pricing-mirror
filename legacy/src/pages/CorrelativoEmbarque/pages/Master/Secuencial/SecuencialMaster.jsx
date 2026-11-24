import { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import TabComponent from "../../../../../components/Tabs/TabComponent";
import Informacion from "./SecuencialTabla";
import Nuevo from "./SecuencialCrear";

const SecuencialMaster = ({
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
        <Informacion
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
      content: <Nuevo />,
    },
  ], [correlativos, isLoading, onEdit, onDelete, onAgregar]);

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="h5" color="text.primary" gutterBottom sx={{ textAlign: "center" }}>
        Correlativos Masters Secuenciales
      </Typography>
      <Box sx={{ width: "100%" }}>
        <TabComponent opciones={opciones} tabInicial="informacion" titulo="Correlativos" mostrarTitulo={false} />
      </Box>
    </Box>
  );
};

SecuencialMaster.propTypes = {
  correlativos: PropTypes.array,
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAgregar: PropTypes.func,
};

export default SecuencialMaster;
