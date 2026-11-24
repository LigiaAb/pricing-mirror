import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import FormularioComponent from "../../../../../../components/Formulario/FormularioComponent";

const AtFecha = ({
	headerHint,
	showHeader,
	fechaSeleccionada,
	comentarios,
	onInput,
	onGuardar,
}) => (
	<Box mb={2}>
		{showHeader && (
			<Box mb={2}>
				<Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
					{headerHint}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					No hay fechas registradas aún
				</Typography>
			</Box>
		)}
		<FormularioComponent
			inputs={[
				{
					id: "fecha",
					tipo: "datetime",
					label: "Fecha",
					val: fechaSeleccionada,
					requerido: true,
					size: 12,
				},
				{
					id: "comentarios",
					tipo: "textarea",
					label: "Comentarios",
					val: comentarios,
					requerido: false,
					size: 12,
				},
			]}
			onInput={onInput}
			botones={{
				agregar: { visible: false },
				cancelar: { visible: false },
				filtrar: { visible: false },
				guardar: { visible: true, onClick: onGuardar },
			}}
		/>
	</Box>
);

AtFecha.propTypes = {
	headerHint: PropTypes.string.isRequired,
	showHeader: PropTypes.bool,
	fechaSeleccionada: PropTypes.oneOfType([
		PropTypes.instanceOf(Date),
		PropTypes.string,
	]),
	comentarios: PropTypes.string,
	onInput: PropTypes.func.isRequired,
	onGuardar: PropTypes.func.isRequired,
};

AtFecha.defaultProps = {
	showHeader: false,
	fechaSeleccionada: null,
	comentarios: "",
};

export default AtFecha;
