import PropTypes from 'prop-types';
import { Box, Paper, Typography, Chip, Divider, Stack, Alert } from '@mui/material';
import { useMemo } from 'react';

const DEFAULT_PAD_LENGTH = 6;

const toSafeNumber = (v) => {
	if (v === null || v === undefined || v === '') return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
};

const calcCount = ({ inicio, fin, salto }) => {
	if (inicio == null || fin == null || salto == null || salto <= 0) return null;
	if (fin < inicio) return null;
	return Math.floor((fin - inicio) / salto) + 1;
};

const RangeDisplay = ({ startLabel, endLabel, isSingle }) => {
	if (isSingle) {
		return (
			<Chip size="medium" variant="filled" label={startLabel} sx={{ fontWeight: 600 }} />
		);
	}

	return (
		<Stack direction="row" spacing={2.5} alignItems="center">
			<Chip size="medium" variant="filled" label={startLabel} sx={{ fontWeight: 600, mr: 0 }} />
			<Typography variant="h6" color="text.secondary" sx={{ mx: 1.5 }}>→</Typography>
			<Chip size="medium" variant="filled" label={endLabel} sx={{ fontWeight: 600 }} />
		</Stack>
	);
};

RangeDisplay.propTypes = { startLabel: PropTypes.string.isRequired, endLabel: PropTypes.string, isSingle: PropTypes.bool.isRequired };

const CountBadge = ({ count, salto, isLarge = false }) => {
	let label = String(count) + ' guía' + (count === 1 ? '' : 's');
	if (salto && salto !== 1) label += ' • Salto: ' + String(salto);

	if (isLarge) {
		return (
			<Box sx={{ textAlign: 'center' }}>
				<Typography variant="h5" sx={{ fontWeight: 700 }}>{count}</Typography>
				<Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
					Número de saltos{salto ? `: ${salto}` : ''}
				</Typography>
			</Box>
		);
	}

	return <Chip size="small" label={label} sx={{ fontWeight: 600, fontSize: '0.75rem' }} />;
};

CountBadge.propTypes = { count: PropTypes.number.isRequired, salto: PropTypes.number, isLarge: PropTypes.bool };

const PreviewCorrelativos = ({ serie, correlativoInicial, correlativoFinal, cantidadSaltos, numeroGuia, padLength = DEFAULT_PAD_LENGTH, title = 'Vista Previa de Correlativos', sx = {} }) => {
	const computedState = useMemo(() => {
		const inicio = toSafeNumber(correlativoInicial);
		const fin = toSafeNumber(correlativoFinal);
		const salto = toSafeNumber(cantidadSaltos) ?? 1;
		const serieLimpia = String(serie ?? '').trim();
		const numeroGuiaLimpio = String(numeroGuia ?? '').trim();

		const hasInputs = Boolean(serieLimpia) || (inicio !== null && inicio !== undefined) || (fin !== null && fin !== undefined);
		const invalidRange = (inicio !== null && inicio !== undefined) && (fin !== null && fin !== undefined) && fin < inicio;
		const completeRange = Boolean(serieLimpia) && (inicio !== null && inicio !== undefined) && (fin !== null && fin !== undefined);

		const rawStartInput = correlativoInicial ?? inicio;
		const rawEndInput = correlativoFinal ?? fin;
		let startLabel = null;
		let endLabel = null;
		if (completeRange) {
			const startRawString = String(rawStartInput ?? '').trim();
			const endRawString = String(rawEndInput ?? '').trim();
			if (serieLimpia) {
				startLabel = `${serieLimpia}-${startRawString}`;
				endLabel = `${serieLimpia}-${endRawString}`;
			} else {
				startLabel = startRawString;
				endLabel = endRawString;
			}
		}

		let previewGuia = null;
		if (numeroGuiaLimpio) {
			previewGuia = serieLimpia ? `${serieLimpia}-${numeroGuiaLimpio}` : numeroGuiaLimpio;
		}
		const showPreviewGuia = Boolean(previewGuia && !completeRange);

		const isSingle = completeRange && inicio === fin;
		const count = completeRange ? calcCount({ inicio, fin, salto }) : null;
		const showCount = typeof count === 'number' && count >= 1;

		return { inicio, fin, salto, serieLimpia, hasInputs, invalidRange, completeRange, startLabel, endLabel, previewGuia, showPreviewGuia, isSingle, count, showCount };
	}, [correlativoInicial, correlativoFinal, cantidadSaltos, serie, numeroGuia]);

	return (
		<Paper elevation={0} sx={{ mt: 2, mb: 2, p: 2.5, borderRadius: 2, ...sx }}>
			<Stack direction='row' alignItems='center' justifyContent='space-between' spacing={1} mb={2}>
				<Typography variant='subtitle1' sx={{ fontWeight: 700, color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.primary.light : 'primary.main'), display: 'flex', alignItems: 'center', gap: 1 }}>
					<Box component='span' sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.main) }} />
					{title}
				</Typography>
			</Stack>
			<Divider sx={{ mb: 2 }} />

			{computedState.invalidRange && <Alert severity='error' sx={{ mb: 0 }}>El correlativo final debe ser mayor o igual que el inicial.</Alert>}
		{!computedState.invalidRange && !computedState.completeRange && !computedState.showPreviewGuia && <Alert severity='info' sx={{ mb: 0 }}>Ingrese <strong>Serie</strong>, <strong>Correlativo Inicial</strong> y <strong>Correlativo Final</strong> para ver la previsualización completa.</Alert>}
		{computedState.showPreviewGuia && (
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
				<Chip
					label={computedState.previewGuia}
					color='secondary'
					variant='outlined'
					sx={{ fontWeight: 700, fontSize: '0.9rem' }}
				/>
			</Box>
		)}

			{computedState.completeRange && (
				<Box sx={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
						<Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'text.secondary' }}>Cantidad de Correlativos:</Typography>
						<CountBadge count={computedState.count ?? 0} salto={computedState.salto} isLarge />
					</Box>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
						<Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'text.secondary' }}>Correlativos:</Typography>
						<RangeDisplay startLabel={computedState.startLabel} endLabel={computedState.endLabel} isSingle={computedState.isSingle} />
					</Box>
				</Box>
			)}
		</Paper>
	);
};

PreviewCorrelativos.propTypes = {
	serie: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	correlativoInicial: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	correlativoFinal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	cantidadSaltos: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	numeroGuia: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	padLength: PropTypes.number,
	title: PropTypes.string,
	sx: PropTypes.object,
};

export default PreviewCorrelativos;
