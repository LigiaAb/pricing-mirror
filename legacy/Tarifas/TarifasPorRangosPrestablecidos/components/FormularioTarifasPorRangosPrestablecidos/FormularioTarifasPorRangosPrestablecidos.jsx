import { useState, useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import FormularioTarifa from '../../../../../pages/Tarifas/CreacionTarifa/components/FormularioTarifa/FormularioTarifa';	
import FormularioComponent from '../../../../../components/Formulario/FormularioComponent';
import useInputsFormularioTarifasPorRangosPrestablecidos from './hooks/useInputsFormularioTarifasPorRangosPrestablecidos';
import useCatalogosTarifasPorRangosPrestablecidos from './hooks/useCatalogosTarifasPorRangosPrestablecidos';


const selectsConValoresLimpios = {
    paisOrigen: null,
	tipoPuntoEnlaceOrigen: null,
	puntoEnlaceOrigen: null,
	paisDestino: null,
	tipoPuntoEnlaceDestino: null,
	puntoEnlaceDestino: null,
};


const  FormularioTarifasPorRangosPrestablecidos = ({
	hideLabels = false,
	usarAccionesPrestablecidas = true,
    defaultValues,
    isItCreating = true,
	readonly = false,
	inputsToHide = [],
	onSubmit = () => {},
	catalogos = {},
}, ref) => {
	const formularioRutasRef = useRef(null);
	const formularioFiltroTarifasRef = useRef(null);
	const { isLoading: isLoadingCatalogos,  paises = [], tiposPuntoEnlace, puntosEnlace } = useCatalogosTarifasPorRangosPrestablecidos(catalogos);

	const valoresIniciales = useMemo(() => {
		return  {...selectsConValoresLimpios} ;
	}, []);

	const [valores, setValores] = useState(valoresIniciales);
	const valoresFormTarifaRef = useRef({});


	useEffect(() => {
		if (defaultValues) {
			setValores({
				...defaultValues,
				...selectsConValoresLimpios
			});
		} else {
			setValores(valoresIniciales);
		}
	}, [defaultValues, valoresIniciales]);


	const  valoresConFormatoDeFormulario = {
		...valores,
	};


	const handleSubmit = async () => {
		const formularioRutasValido = formularioRutasRef?.current?.validar();
		const formularioFiltroTarifasValido = formularioFiltroTarifasRef?.current?.validar();
		const formularioCompletoValido = formularioRutasValido && formularioFiltroTarifasValido;
		if (!formularioCompletoValido) return;

		await formularioFiltroTarifasRef?.current.submit();
		const valoresTarifa = valoresFormTarifaRef.current;
		const valoresFormulariosCombiandos = {
			...valoresTarifa,
			...valores
		};
	
		if (!usarAccionesPrestablecidas) return onSubmit(valoresFormulariosCombiandos);
	};


    useImperativeHandle(ref, () => ({
        submit: handleSubmit,
    }));

	
	const inputs = useInputsFormularioTarifasPorRangosPrestablecidos({
		valores: valoresConFormatoDeFormulario,
		opciones: {
			paises,
			tiposPuntoEnlace,
			puntosEnlace
		},
		hideLabels,
		inputsToHide
	});


	const handleInputChange = ({ id, val }) => {
        setValores(prev => {
            const nuevoValor = { ...prev, [id]: val };

			switch (id) {
				case 'paisOrigen':
					nuevoValor.cod_pais_origen = val?.value;
					nuevoValor.tipoPuntoEnlaceOrigen = nuevoValor.cod_tipo_puntoenlace_origen = null;
					nuevoValor.puntoEnlaceOrigen = nuevoValor.cod_puntoenlace_origen = null;
                    break;
				case 'tipoPuntoEnlaceOrigen':
					nuevoValor.cod_tipo_puntoenlace_origen = val?.value;
					nuevoValor.puntoEnlaceOrigen = nuevoValor.cod_puntoenlace_origen = null;
					break;
				case 'puntoEnlaceOrigen':
					nuevoValor.cod_puntoenlace_origen = val?.value;
					break;	
				case 'paisDestino':
					nuevoValor.cod_pais_destino = val?.value;
					nuevoValor.tipoPuntoEnlaceDestino = nuevoValor.cod_tipo_puntoenlace_destino = null;
					nuevoValor.puntoEnlaceDestino = nuevoValor.cod_puntoenlace_destino = null;
					break;
				case 'tipoPuntoEnlaceDestino':
					nuevoValor.cod_tipo_puntoenlace_destino = val?.value;
					nuevoValor.puntoEnlaceDestino = nuevoValor.cod_puntoenlace_destino = null;
					break;
				case 'puntoEnlaceDestino':
					nuevoValor.cod_puntoenlace_destino = val?.value;
					break;
				default:
					break;
			}

            return nuevoValor;
        });
    };
	

	return (
		<Box>
			<FormularioComponent
				ref={formularioRutasRef}
				inputs={inputs}
				onInput={handleInputChange}
				botones={
					{
						agregar: { visible: false },
						editar: { visible: false }
					}
				}
				isLoading={isLoadingCatalogos}
			/>

			<FormularioTarifa
				ref={formularioFiltroTarifasRef}
				usarAccionesPrestablecidas={false}
				isItCreating={false}
				inputsToHide={['rubro', 'proveedor', 'nombre', 'siglas', ...inputsToHide]}
				hideLabels={hideLabels}
				onSubmit={(valores) => { valoresFormTarifaRef.current = valores; }}
			/>
		</Box>
	);
};


const ForwardedFormularioTarifasPorRangosPrestablecidos = forwardRef(FormularioTarifasPorRangosPrestablecidos);


FormularioTarifasPorRangosPrestablecidos.propTypes = {
	hideLabels: PropTypes.bool,
	defaultValues: PropTypes.object,
	isItCreating: PropTypes.bool,
	usarAccionesPrestablecidas: PropTypes.bool,
	readonly: PropTypes.bool,
	inputsToHide: PropTypes.arrayOf(PropTypes.string),
	onSubmit: PropTypes.func,
	catalogos: PropTypes.array
};


export default ForwardedFormularioTarifasPorRangosPrestablecidos;
