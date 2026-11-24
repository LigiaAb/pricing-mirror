import PropTypes from "prop-types";
import { useState } from "react";
import TablaCorrelativos from "../../../components/TablaCorrelativos";
import DetallesCorrelativos from "../../../components/detallesCorrelativos";
import { Box } from "@mui/material";

const PoolTabla = ({ acciones = {}, ocultarColumnas = [] }) => {
	const [selectedCorrelativo, setSelectedCorrelativo] = useState(null);
	const [openDialog, setOpenDialog] = useState(false);

	const handleView = (row) => {
		setSelectedCorrelativo(row);
		setOpenDialog(true);
	};

	const handleClose = () => {
		setSelectedCorrelativo(null);
		setOpenDialog(false);
	};

	const mergedAcciones = { ver: true, ...acciones };
	const mergedOcultar = [...(ocultarColumnas || []), "correlativoTabla"];
	return (
		<Box sx={{ p: 1 }}>
			<TablaCorrelativos acciones={mergedAcciones} ocultarColumnas={mergedOcultar} tipoFilter={"MCP_POOL"} onView={handleView} />
			<DetallesCorrelativos
				open={openDialog}
				correlativoId={selectedCorrelativo?.correlativoId}
				titulo={`Números de Guía - ${selectedCorrelativo?.correlativoCodigo || ""}`}
				onClose={handleClose}
			/>
		</Box>
	);
};

export default PoolTabla;

PoolTabla.propTypes = {
	acciones: PropTypes.object,
	ocultarColumnas: PropTypes.arrayOf(PropTypes.string),
};
