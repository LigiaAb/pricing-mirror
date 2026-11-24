import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import FormularioCorrelativos from "../../../components/FormularioCorrelativos";

const PoolCrear = ({ onSuccess = () => { }, onCancel = () => { } }) => {
	return (
		<Box sx={{ p: 1 }}>
			<Typography variant="subtitle1" sx={{ mb: 1 }}>
				Crear Pool de Masters
			</Typography>
			<FormularioCorrelativos
				onSuccess={() => onSuccess()}
				onCancel={() => onCancel()}
				defaultValues={{
					tipo: { value: "TERRESTRE", label: "Terrestre" },
					aplicaReplicaAnual: false,
				}}
				readonlyFields={["tipo"]}
				refTipoSecuencia="MCP_POOL"
				showFields={{
					correlativo_inicial: false,
					correlativo_final: false,
					cantidad_saltos: false,
					aplicaReplicaAnual: false,
				}}
				hideCancel={true}
				showPreview={false}
				enableListaGuias={true}
			/>

			<Box sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}>

				<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
					Ingrese los números de Guías:
				</Typography>
				<Typography variant="body2" color="text.secondary" component="ol" sx={{ pl: 2, m: 0, "& li": { mb: 0.5 } }}>
					<li>Ingrese cada número de guía y presione Enter o +</li>
					<li>Use el botón Limpiar para eliminar todas las guías</li>
					<li>Haga clic en Guardar para crear el pool.</li>
				</Typography>
			</Box>
		</Box>
	);
};

PoolCrear.propTypes = {
	onSuccess: PropTypes.func,
	onCancel: PropTypes.func,
};

export default PoolCrear;
