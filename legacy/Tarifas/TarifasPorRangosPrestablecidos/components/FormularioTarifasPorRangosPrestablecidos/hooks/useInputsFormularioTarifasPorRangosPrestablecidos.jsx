import { fabClasses } from '@mui/material';
import { useMemo } from 'react';

const useInputsFormularioTarifasPorRangosPrestablecidos = ({
	valores,
	opciones,
    hideLabels = false,
    inputsToHide = []
}) => {
    const puntosEnlaceOrigenSeleccionables = opciones.puntosEnlace.filter(pe => pe.cod_pais === valores.paisOrigen?.cod_pais && pe.cod_tipo === valores.tipoPuntoEnlaceOrigen?.cod_tipo);
    const puntosEnlaceDestinoSeleccionables = opciones.puntosEnlace.filter(pe => pe.cod_pais === valores.paisDestino?.cod_pais && pe.cod_tipo === valores.tipoPuntoEnlaceDestino?.cod_tipo);

	const inputs = useMemo(() => [
		{
            tipo: 'titulo',
            val: 'Detalles de Ruta',
            variant: 'h6',
            visible: !hideLabels && (
                !inputsToHide.includes('paisOrigen') ||
                !inputsToHide.includes('tipoPuntoEnlaceOrigen') ||
                !inputsToHide.includes('puntoEnlaceOrigen') ||
                !inputsToHide.includes('paisDestino') ||
                !inputsToHide.includes('tipoPuntoEnlaceDestino') ||
                !inputsToHide.includes('puntoEnlaceDestino')
            )
        },
		{
            tipo: 'select',
            label: 'Pais de Origen',
            id:  'paisOrigen',
            options: opciones.paises,
            val: valores.paisOrigen,
            requerido: true,
            readonly: false,
            visible: true,
            size: 4
        },
		{
            tipo: 'select',
            label: 'Tipo de Origen',
            id:  'tipoPuntoEnlaceOrigen',
            options: opciones.tiposPuntoEnlace,
            val: valores.tipoPuntoEnlaceOrigen,
            requerido: false,
            readonly: !valores.paisOrigen,
            visible: true,
            size: 4
        },
        {
            tipo: 'select',
            label: 'Aduana/Puerto/Aeropuerto de Origen',
            id:  'puntoEnlaceOrigen',
            options: puntosEnlaceOrigenSeleccionables,
            val: valores.puntoEnlaceOrigen,
            requerido: !!valores.tipoPuntoEnlaceOrigen,
            readonly: !valores.tipoPuntoEnlaceOrigen,
            visible: true,
            size: 4
        },
    	{
            tipo: 'select',
            label: 'Pais de Destino',
            id:  'paisDestino',
            options: opciones.paises,
            val: valores.paisDestino,
            requerido: true,
            readonly: false,
            visible: true,
            size: 4
        },
		{
            tipo: 'select',
            label: 'Tipo de Destino',
            id:  'tipoPuntoEnlaceDestino',
            options: opciones.tiposPuntoEnlace,
            val: valores.tipoPuntoEnlaceDestino,
            requerido: false,
            readonly: !valores.paisDestino,
            visible: true,
            size: 4
        },
        {
            tipo: 'select',
            label: 'Aduana/Puerto/Aeropuerto de Destino',
            id:  'puntoEnlaceDestino',
            options: puntosEnlaceDestinoSeleccionables,
            val: valores.puntoEnlaceDestino,
            requerido: !!valores.tipoPuntoEnlaceDestino,
            readonly: !valores.tipoPuntoEnlaceDestino,
            visible: true,
            size: 4
        },
	], [valores, opciones]);

	return inputs;
};


export default useInputsFormularioTarifasPorRangosPrestablecidos;