import { useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaCorrelativos from "../../components/TablaCorrelativos";
import DetallesCorrelativos from "../../components/detallesCorrelativos";

const Informacion = ({ correlativos, isLoading = false }) => {
  const [selectedCorrelativo, setSelectedCorrelativo] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleView = (row) => {
    setSelectedCorrelativo(row);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCorrelativo(null);
  };

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      <TablaCorrelativos
        datos={Array.isArray(correlativos) ? correlativos : undefined}
        isLoading={isLoading}
        titulo="Correlativos para Master"
        tipoFilter="MAWB"
        acciones={{ agregar: false, eliminar: false, ver: true }}
        ocultarColumnas={["replicarAnual", "correlativoTabla"]}
        onView={handleView}
      />

      <DetallesCorrelativos
        open={openDialog}
        correlativoId={selectedCorrelativo?.correlativoId}
        onClose={handleCloseDialog}
      />
    </Box>
  );
};

Informacion.propTypes = {
  correlativos: PropTypes.array,
  isLoading: PropTypes.bool,
};

export default Informacion;
