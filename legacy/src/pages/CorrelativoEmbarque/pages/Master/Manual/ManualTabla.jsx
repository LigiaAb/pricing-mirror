import PropTypes from "prop-types";
import { useState } from "react";
import TablaCorrelativos from "../../../components/TablaCorrelativos";
import DetallesCorrelativos from "../../../components/detallesCorrelativos";

const ManualTabla = ({ correlativos, isLoading = false, onEdit = () => { }, onDelete = () => { }, onAgregar = () => { } }) => {
  const [selectedCorrelativo, setSelectedCorrelativo] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleView = (row) => {
    setSelectedCorrelativo(row);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedCorrelativo(null);
  };

  return (
    <>
      <TablaCorrelativos
        datos={correlativos}
        isLoading={isLoading}
        onView={handleView}
        onDelete={onDelete}
        onAgregar={onAgregar}
        tipoFilter={["MAWB", "MBL", "MCP"]}
        acciones={{ ver: true, editar: false, eliminar: false }}
        ocultarColumnas={["correlativoInicial", "correlativoActual", "correlativoFinal", "cantidadSalto", "correlativoTabla"]}
        filtrarInicialNull={true}
      />

      <DetallesCorrelativos
        open={openDialog}
        correlativoId={selectedCorrelativo?.correlativoId}
        titulo={`Números de Guía - ${selectedCorrelativo?.correlativoCodigo || ""}`}
        onClose={handleClose}
      />
    </>
  );
};

ManualTabla.propTypes = {
  correlativos: PropTypes.array,
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAgregar: PropTypes.func,
};

export default ManualTabla;
