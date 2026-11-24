import { useState } from "react";
import PropTypes from "prop-types";
import DialogComponent from "@/components/Dialog/DialogComponent";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";

const CalculadoraCargas = ({ open = false, onClose = () => {}, onApply = () => {}, initialValues = {} }) => {
	const [values, setValues] = useState({
		cantidad: initialValues.cantidad ?? 1,
		volumenTotal: initialValues.volumenTotal ?? 0,
		pesoTotal: initialValues.pesoTotal ?? 0,
		largo: initialValues.largo ?? "",
		alto: initialValues.alto ?? "",
		ancho: initialValues.ancho ?? "",
	});

	const [errors, setErrors] = useState({});

	const handleChange = (field) => (e) => {
		const val = e.target.value;
		setValues((prev) => ({ ...prev, [field]: val }));
		setErrors((prev) => ({ ...prev, [field]: null }));
	};

	const calcular = () => {
		const largo = Number(values.largo) || 0;
		const alto = Number(values.alto) || 0;
		const ancho = Number(values.ancho) || 0;
		const cantidad = Number(values.cantidad) || 1;

		if (largo <= 0 || alto <= 0 || ancho <= 0) {
			setErrors({
				largo: !largo ? "Requerido" : null,
				alto: !alto ? "Requerido" : null,
				ancho: !ancho ? "Requerido" : null,
			});
			return;
		}

		const volumenUnitario = (largo * alto * ancho) / 6000;
		const volumen = Number((volumenUnitario * cantidad).toFixed(3));

		setValues((prev) => ({
			...prev,
			volumenTotal: volumen,
		}));
	};

	const handleApply = () => {
		const largo = Number(values.largo) || 0;
		const alto = Number(values.alto) || 0;
		const ancho = Number(values.ancho) || 0;
		const cantidad = Number(values.cantidad) || 1;

		let volumenTotal = Number(values.volumenTotal);
		if (largo > 0 && alto > 0 && ancho > 0) {
			const volumenUnitario = (largo * alto * ancho) / 6000;
			volumenTotal = Number((volumenUnitario * cantidad).toFixed(3));
		}

		onApply({
			pesoTotal: Number(values.pesoTotal) || 0,
			volumenTotal,
			cantidad,
			largo: values.largo ? Number(values.largo) : undefined,
			alto: values.alto ? Number(values.alto) : undefined,
			ancho: values.ancho ? Number(values.ancho) : undefined,
		});
	};

	return (
		<DialogComponent
			open={open}
			onClose={onClose}
			title="Calculadora de Cargas"
			maxWidth="sm"
			fullWidth
		>
			<Box sx={{ p: 2 }}>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Typography variant="subtitle2" color="text.secondary">
							Dimensiones (cm)
						</Typography>
					</Grid>
					<Grid item xs={4}>
						<TextField
							label="Largo"
							value={values.largo}
							onChange={handleChange("largo")}
							error={!!errors.largo}
							helperText={errors.largo}
							fullWidth
							size="small"
						/>
					</Grid>
					<Grid item xs={4}>
						<TextField
							label="Alto"
							value={values.alto}
							onChange={handleChange("alto")}
							error={!!errors.alto}
							helperText={errors.alto}
							fullWidth
							size="small"
						/>
					</Grid>
					<Grid item xs={4}>
						<TextField
							label="Ancho"
							value={values.ancho}
							onChange={handleChange("ancho")}
							error={!!errors.ancho}
							helperText={errors.ancho}
							fullWidth
							size="small"
						/>
					</Grid>
					<Grid item xs={6}>
						<TextField
							label="Cantidad"
							type="number"
							value={values.cantidad}
							onChange={handleChange("cantidad")}
							fullWidth
							size="small"
						/>
					</Grid>
					<Grid item xs={6}>
						<Button variant="outlined" onClick={calcular} fullWidth sx={{ height: "56px" }}>
							Calcular Volumen
						</Button>
					</Grid>
					<Grid item xs={6}>
						<TextField
							label="Volumen (kg)"
							type="number"
							value={values.volumenTotal}
							onChange={handleChange("volumenTotal")}
							fullWidth
							size="small"
						/>
					</Grid>
					<Grid item xs={6}>
						<TextField
							label="Peso (kg)"
							type="number"
							value={values.pesoTotal}
							onChange={handleChange("pesoTotal")}
							fullWidth
							size="small"
						/>
					</Grid>
				</Grid>
				<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
					<Button variant="outlined" onClick={onClose}>
						Cancelar
					</Button>
					<Button variant="contained" onClick={handleApply}>
						Aplicar
					</Button>
				</Box>
			</Box>
		</DialogComponent>
	);
};

CalculadoraCargas.propTypes = {
	open: PropTypes.bool,
	onClose: PropTypes.func,
	onApply: PropTypes.func,
	initialValues: PropTypes.object,
};

export default CalculadoraCargas;