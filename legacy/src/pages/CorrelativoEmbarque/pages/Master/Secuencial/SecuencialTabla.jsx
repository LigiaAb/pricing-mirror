import PropTypes from "prop-types";
import { useState } from "react";
import TablaCorrelativos from "../../../components/TablaCorrelativos";
import DetallesCorrelativos from "../../../components/detallesCorrelativos";

const Informacion = ({ correlativos, isLoading = false, onEdit = () => { }, onDelete = () => { }, onAgregar = () => { } }) => {
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
  const correlativosFiltrados = Array.isArray(correlativos) && correlativos.length > 0
    ? correlativos.filter((c) => {
      const val = c?.correlativo_inicial ?? c?.correlativoInicial ?? c?.CORRELATIVO_INICIAL ?? c?.CORRELATIVOINICIAL;
      return val !== undefined && val !== null && val !== "";
    })
    : [];

  return (
    <>
      <TablaCorrelativos
        datos={Array.isArray(correlativos) ? correlativosFiltrados : undefined}
        titulo="Correlativos para Master"
        tipoFilter={["MAWB", "MBL", "MCP"]}
        acciones={{ agregar: false, ver: true, eliminar: false }}
        filtrarInicialNoNull={true}
        ocultarColumnas={["replicarAnual", "correlativoTabla"]}
        onView={handleView}
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

Informacion.propTypes = {
  correlativos: PropTypes.array,
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAgregar: PropTypes.func,
};

export default Informacion;
