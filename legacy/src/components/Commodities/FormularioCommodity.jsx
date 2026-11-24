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

const formatCommodityToApiSubmissionFormat = (commodity) => {
    const commodityConFormato = {
        ...commodity,
        cod_estado: commodity.estado?.value
    }
    return commodityConFormato;
};


const FormularioCommodity = ({
    defaultValues,
    isItCreating = true,
    readonly = false,
    onCommodityCreado = () => {},
    onCommodityEditado = () => {},
    catalogos
}) => {
    const { permisosArray } = useObtenerOpcionesAcciones();

    const opcion = permisosArray.find(o => o.nom_opcion === 'Información');
    const puedeEditar = opcion?.acciones?.some(a => a.nom_accion === 'Editar') && (isItCreating || !readonly);


    const valoresIniciales = useMemo(() => {
        const estado = catalogos.estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        return {
            nombre: '',
            descripcion: '',
            ...selectsLimpios,
            estado
        };
    }, [catalogos.estados]);
    

    const [valores, setValores] = useState({
        nombre: '',
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


    const formatCommodityToFormFormat = useCallback(commodity => {
        const commodityConFormato = {
            ...commodity,
            estado: commodity.estado || catalogos.estados.find(e => e.cod_estado === commodity.cod_estado)
        }
        return commodityConFormato;
    }, [catalogos.estados]);


    const valoresConFormatoDeFormulario = formatCommodityToFormFormat(valores);


    const handleInputChange = ({ id, val}) => {
        setValores(prev => {
            const nuevoValor = { ...prev, [id]: val };
            return nuevoValor;
        });
    };


    const handleSubmit = async () => {
        let baseApiURL = isItCreating ? '/api/appweb/insertar-commodity' : '/api/appweb/actualizar-commodity';
        const reqBody = formatCommodityToApiSubmissionFormat(valores);

        if (reqBody.cod_estado === CODS_ESTADOS.INACTIVO) {
            if (!reqBody.fecha_final) reqBody.fecha_final = new Date();
        } else {
            reqBody.fecha_final = null;
        }

        let response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;

        const cod_commodity = +response.data.data.cod_commodity;

        baseApiURL = '/api/appweb/lista-commodities';
        response = await api.get(baseApiURL, { params: { cod_commodity } });
        const commodity = response.data.data[0];
        const nuevosValores = formatCommodityToFormFormat(commodity);
        setValores(nuevosValores)

        if (isItCreating) {
            onCommodityCreado(commodity);
        } else {
            onCommodityEditado(commodity);
        }
    };


    const inputs = [
        {
            tipo: 'text',
            label: 'Nombre del commodity',
            id: 'nombre',
            val: valoresConFormatoDeFormulario.nombre,
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
                titulo='Commodity'
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


FormularioCommodity.propTypes = {
    defaultValues: PropTypes.object,
    isItCreating: PropTypes.bool,
    readonly: PropTypes.bool,
    onCommodityCreado: PropTypes.func,
    onCommodityEditado: PropTypes.func,
    catalogos: PropTypes.object,
};


export default FormularioCommodity;