
import { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import FormularioComponent from '../../../../../../components/Formulario/FormularioComponent';
import useInputsFormularioFiltroPlantillas from './hooks/useInputsFormularioFiltroPlantillas.jsx';
import { useSelector } from 'react-redux';


const selectsLimpios = {
    empresa: null,
    centroCosto: null
};


const formatFiltrosToApiSubmissionFormat = (filtros) => {
    const filtorsConFormato = {
        cod_empresa: filtros.empresa?.value,
        cod_cc: filtros.centroCosto?.value,
    };

    delete filtorsConFormato.empresa;
    delete filtorsConFormato.centroCosto;
    return filtorsConFormato;
};


const FormularioFiltroPlantillas = ({
    defaultValues,
    catalogos,
    onSubmit = () => {}
}) => {
	const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);

	const valoresIniciales = useMemo(() => {
        const empresa = { ...currentEmpresa, label: currentEmpresa?.nombre , value: currentEmpresa?.cod_empresa };
        delete empresa.centrosCosto;
        const centroCosto = { ...currentCentroCosto, label: currentCentroCosto?.nombre, value: currentCentroCosto?.cod_cc };
        delete centroCosto.modulos;
		return {
			...selectsLimpios,
            cod_empresa: currentEmpresa?.cod_empresa || null,
			empresa,
            cod_cc: currentCentroCosto?.cod_cc || null,
			centroCosto
		};
	}, [currentEmpresa, currentCentroCosto]);


	const [valores, setValores] = useState(valoresIniciales);

    useEffect(() => {
        if (defaultValues) {
            setValores({
                ...valoresIniciales,
                ...defaultValues,
            });
        } else {
            setValores(valoresIniciales);
        }
    }, [defaultValues, valoresIniciales]);


    const valoresConFormatoDeFormulario = {
        ...valores,
        empresa: catalogos.empresas.find(e => e.cod_empresa === valores.cod_empresa),
        centroCosto: catalogos.centrosCostos.find(cc => cc.cod_cc === valores.cod_cc),
    };


    const inputsFiltroPlantillas = useInputsFormularioFiltroPlantillas({
        valores: valoresConFormatoDeFormulario,
        opciones: {
            empresas: catalogos.empresas,
            centrosCostos: catalogos.centrosCostos,
        }
    });


    const handleSubmit = () => {
        onSubmit(formatFiltrosToApiSubmissionFormat(valores));
    };


    const handleInputChange = ({ id, val }) => {
        setValores(prev => {
            const nuevoValor = { ...prev, [id]: val };
            
            switch (id) {
                case 'empresa':
                    nuevoValor.cod_empresa = val?.value;
                    if (!val) nuevoValor.empresa = nuevoValor.cod_empresa = null;
                    nuevoValor.centroCosto = nuevoValor.cod_cc = null;
                    break;
                case 'centroCosto':
                    nuevoValor.cod_cc = val?.value;
                    if (!val) nuevoValor.centroCosto = nuevoValor.cod_cc = null;
                    break;
            }

            return nuevoValor;
        });
    };


	return (
		<>
            <FormularioComponent
                inputs={inputsFiltroPlantillas}
                onInput={handleInputChange}
                botones={{
                    agregar: { visible: false },
                    filtrar: { visible: true, onClick: handleSubmit },
                }}
            />
		</>
	);
};


FormularioFiltroPlantillas.propTypes = {
	defaultValues: PropTypes.object,
	inputsToHide: PropTypes.arrayOf(PropTypes.string),
	catalogos: PropTypes.object.isRequired,
	onSubmit: PropTypes.func
};


export default FormularioFiltroPlantillas;
