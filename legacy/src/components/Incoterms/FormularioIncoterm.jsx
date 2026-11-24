import { useState,  useEffect, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../api';
import FormularioComponent from '../Formulario/FormularioComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import { CODS_ESTADOS } from '../../constants/estados';


const selectsLimpios = {
    estado: null
};

const formatIncotermToApiSubmissionFormat = (rubro) => {
    const rubroConFormato = {
        ...rubro,
        cod_estado: rubro.estado?.value
    }
    return rubroConFormato;
};


const FormularioIconterm = ({
    defaultValues,
    isItCreating = true,
    readonly = false,
    onIncotermCreado = () => {},
    onIncotermEditado = () => {},
    catalogos
}) => {
    const { permisosArray } = useObtenerOpcionesAcciones();

    const opcion = permisosArray.find(o => o.nom_opcion === 'Información');
    const puedeEditar = opcion?.acciones?.some(a => a.nom_accion === 'Editar') && (isItCreating || !readonly);


    const valoresIniciales = useMemo(() => {
        const estado = catalogos.estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        return {
            codigo: '',
            nombre: '',
            nombre_eng: '',
            descripcion: '',
            ...selectsLimpios,
            estado
        };
    }, [catalogos.estados]);


    const [valores, setValores] = useState({
            codigo: '',
            nombre: '',
            nombre_eng: '',
            descripcion: '',
        ...selectsLimpios
    });

    useEffect(() => {
        if (defaultValues) {
            const estado = catalogos.estados.find(e => e.cod_estado === defaultValues.cod_estado);
            return setValores({
                ...defaultValues,
                estado
            });
        }
        
        setValores(valoresIniciales);
    }, [defaultValues, valoresIniciales, catalogos.estados]);


    const formatIncotermToFormFormat = useCallback(incoterm => {
        const incotermConFormato = {
            ...incoterm,
            estado: incoterm.estado || catalogos.estados.find(e => e.cod_estado === incoterm.cod_estado)
        }
        return incotermConFormato;
    }, [catalogos.estados]);

    const valoresConFormatoDeFormulario = formatIncotermToFormFormat(valores);

    
    const handleInputChange = ({ id, val}) => {
        setValores(prev => {
            const nuevoValor = { ...prev, [id]: val };
            return nuevoValor;
        });
    };


    const handleSubmit = async () => {
        let baseApiURL = isItCreating ? '/api/appweb/insertar-incoterm' : '/api/appweb/actualizar-incoterm';
        const reqBody = formatIncotermToApiSubmissionFormat(valores);

        if (reqBody.cod_estado === CODS_ESTADOS.INACTIVO) {
            if (!reqBody.fecha_final) reqBody.fecha_final = new Date();
        } else {
            reqBody.fecha_final = null;
        }

        let response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;

        const incoterm_id = +response.data.data.incoterm_id;

        baseApiURL = '/api/appweb/lista-incoterm';
        response = await api.get(baseApiURL, { params: { incoterm_id } });
        const incoterm = response.data.data[0];
        const nuevosValores = formatIncotermToFormFormat(incoterm);
        setValores(nuevosValores)

        if (isItCreating) {
            onIncotermCreado(incoterm);
        } else {
            onIncotermEditado(incoterm);
        }
    };

    const inputs = [
        {
            tipo: 'text',
            label: 'Codigo',
            id: 'codigo',
            val: valoresConFormatoDeFormulario.codigo,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'text',
            label: 'Nombre',
            id: 'nombre',
            val: valoresConFormatoDeFormulario.nombre,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'text',
            label: 'Nombre en Inglés',
            id: 'nombre_eng',
            val: valoresConFormatoDeFormulario.nombre_eng,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'text',
            label: 'Descripción',
            id: 'descripcion',
            val: valoresConFormatoDeFormulario.descripcion,
            requerido: true,
            readonly: !puedeEditar
        },
    ];


    return (
        <Box display='flex' flexDirection='column'>
            <FormularioComponent
                titulo='Incoterm'
                inputs={inputs}
                onInput={handleInputChange}
                botones={{
                    agregar: { visible: isItCreating, onClick: handleSubmit },
                    editar: { visible: !isItCreating && !readonly, onClick: handleSubmit }
                }}
            />
        </Box>
    );
};


FormularioIconterm.propTypes = {
	defaultValues: PropTypes.object,
	isItCreating: PropTypes.bool,   
	readonly: PropTypes.bool,
	onIncotermCreado: PropTypes.func,
	onIncotermEditado: PropTypes.func,
	catalogos: PropTypes.object,
};



export default FormularioIconterm;