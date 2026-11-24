import { useState,  useEffect, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../api';
import FormularioComponent from '../Formulario/FormularioComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};


const selectsLimpios = {
    estado: null
};


const formatRubroToApiSubmissionFormat = (rubro) => {
    const rubroConFormato = {
        ...rubro,
        cod_estado: rubro.estado?.value
    }
    return rubroConFormato;
};


const FormularioRubro = ({
    defaultValues,
    isItCreating = true,
    readonly = false,
    onRubroCreado = () => {},
    onRubroEditado = () => {},
    catalogos
}) => {
    const { permisosArray } = useObtenerOpcionesAcciones();

    const opcion = permisosArray.find(o => o.nom_opcion === 'Información');
    const puedeEditar = opcion?.acciones?.some(a => a.nom_accion === 'Editar') && (isItCreating || !readonly);


    const valoresIniciales = useMemo(() => {
        const estado = catalogos.estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        return {
            nombre: '',
            siglas: '',
            ...selectsLimpios,
            estado
        };
    }, [catalogos.estados]);
    

    const [valores, setValores] = useState({
        nombre: '',
        siglas: '',
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


    const formatRubroToFormFormat = useCallback(rubro => {
        const rubroConFormato = {
            ...rubro,
            estado: rubro.estado || catalogos.estados.find(e => e.cod_estado === rubro.cod_estado)
        }
        return rubroConFormato;
    }, [catalogos.estados]);


    const valoresConFormatoDeFormulario = formatRubroToFormFormat(valores);


    const handleInputChange = ({ id, val}) => {
        setValores(prev => {
            const nuevoValor = { ...prev, [id]: val };
            return nuevoValor;
        });
    };


    const handleSubmit = async () => {
        let baseApiURL = isItCreating ? '/api/appweb/insertar-rubros' : '/api/appweb/actualizar-rubros';
        const reqBody = formatRubroToApiSubmissionFormat(valores);

        if (reqBody.cod_estado === CODS_ESTADOS.INACTIVO) {
            if (!reqBody.fecha_final) reqBody.fecha_final = new Date();
        } else {
            reqBody.fecha_final = null;
        }

        let response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;

        const cod_rubro = +response.data.data.cod_rubro;

        baseApiURL = '/api/appweb/lista-rubros';
        response = await api.get(baseApiURL, { params: { cod_rubro } });
        const rubro = response.data.data[0];
        const nuevosValores = formatRubroToFormFormat(rubro);
        setValores(nuevosValores)

        if (isItCreating) {
            onRubroCreado(rubro);
        } else {
            onRubroEditado(rubro);
        }
    };


    const inputs = [
        {
            tipo: 'text',
            label: 'Nombre del Rubro',
            id: 'nombre',
            val: valoresConFormatoDeFormulario.nombre,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'datetime',
            label: 'Fecha Inicial',
            id: 'fecha_inicio',
            val: valoresConFormatoDeFormulario.fecha_inicio ? new Date(valoresConFormatoDeFormulario.fecha_inicio) : new Date(),
            requerido: false,
            readonly: true
        },
        {
            tipo: 'datetime',
            label: 'Fecha Final',
            id: 'fecha_final',
            val: valoresConFormatoDeFormulario.fecha_final ? new Date(valoresConFormatoDeFormulario.fecha_final) : null,
            requerido: false,
            readonly:  true
        },
        {
            tipo: 'select',
            label: 'Estado',
            id: 'estado',
            options: catalogos.estados,
            val: valoresConFormatoDeFormulario.estado,
            requerido: true,
            readonly: isItCreating
        },
    ];


    return (
        <Box display='flex' flexDirection='column'>
            <FormularioComponent
                titulo='Rubro'
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


FormularioRubro.propTypes = {
    defaultValues: PropTypes.object,
    isItCreating: PropTypes.bool,
    readonly: PropTypes.bool,
    onRubroCreado: PropTypes.func,
    onRubroEditado: PropTypes.func,
    catalogos: PropTypes.object,
};


export default FormularioRubro;