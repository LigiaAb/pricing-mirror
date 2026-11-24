
import { useState,  useEffect, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../../../api';
import FormularioComponent from '../../../../components/Formulario/FormularioComponent';
import TransferListRubrosAgrupacion from './components/TransferListRubrosAgrupacion';
import BandaAlertaComponent from '../../../../components/Alertas/BandaAlertaComponent';
import useObtenerOpcionesAcciones from '../../../../hooks/useObtenerOpcionesAcciones';
import { useSelector } from 'react-redux';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const selectsConValoresLimpios = {
    estado: null,
};

const formatAgrupacionRubrosToApiSubmissionFormat = (agrupacionRubros) => {
    const rubroConFormato = {
        ...agrupacionRubros,
        cod_estado: agrupacionRubros.estado?.value,
    }
    delete rubroConFormato.estado;
    return rubroConFormato;
};


const FormularioAgrupacionRubros = ({
    defaultValues,
    cod_tarifaplantilla,
    isItCreating = true,
    readonly = false,
    onAgrupacionRubrosCreada = () => {},
    onAgrupacionRubrosEditada = () => {},
    catalogos
}) => {
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { estados, rubros } = catalogos;

    const opcion = permisosArray.find(o => o.nom_opcion === 'Información');
    const puedeEditar = opcion?.acciones?.some(a => a.nom_accion === 'Editar') && (isItCreating || !readonly);

    const isItEditing = !isItCreating && !readonly;


    const valoresIniciales = useMemo(() => {
        const estado = estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        return {
            nombre: '',
            ...selectsConValoresLimpios,
            estado,
            cod_tarifaplantilla
        };
    }, [estados, cod_tarifaplantilla]);

    const [valores, setValores] = useState(valoresIniciales);

    useEffect(() => {
        if (defaultValues) {
            const estado = estados.find(e => e.cod_estado === defaultValues.cod_estado);
            setValores({
                nombre: '',
                ...defaultValues,
                ...selectsConValoresLimpios,
                estado
            });
        } else {
            setValores(valoresIniciales);
        }
    }, [defaultValues, valoresIniciales, estados]);

    
    const formatAgrupacionRubrosToFormFormat = useCallback(agrupacionRubros => {
        const estado = agrupacionRubros.estado || estados.find(e => e.cod_estado === agrupacionRubros.cod_estado);
        const agrupacionRubrosConFormato = {
            ...agrupacionRubros,
            estado
        };
        return agrupacionRubrosConFormato;
    }, [estados]);


    const valoresConFormatoDeFormulario = formatAgrupacionRubrosToFormFormat(valores);

    const inputs = [
        {
            tipo: 'text',
            label: 'Nombre',
            id: 'nombre',
            val: valoresConFormatoDeFormulario.nombre,
            size: isItCreating ? 12 : 6,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'select',
            label: 'Estado',
            id: 'estado',
            options: estados,
            val: valoresConFormatoDeFormulario.estado,
            requerido: true,
            readonly: true,
            visible: !isItCreating
        }
    ];


    const handleInputChange = ({ id, val}) => {
        setValores(prev => {
            const nuevoValor = { ...prev, [id]: val };
            return nuevoValor;
        });
    };


    const handleSubmit = async () => {
        let baseApiURL = isItCreating ? '/api/appweb/insertar-grupos-rubros' : '/api/appweb/actualizar-grupos-rubros';
        const reqBody = formatAgrupacionRubrosToApiSubmissionFormat(valores);
        if (reqBody.cod_estado === CODS_ESTADOS.INACTIVO) {
            if (!reqBody.fecha_final) reqBody.fecha_final = new Date();
        } else {
            reqBody.fecha_final = null;
        }

        let response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;

        const cod_grupo_rubro = +response.data.data.cod_grupo_rubro;

        baseApiURL = '/api/appweb/lista-grupos-rubros';
        response = await api.get(baseApiURL, { params: { cod_grupo_rubro } });
        const agrupacionRubros = response.data.data.find(g => g.cod_grupo_rubro === cod_grupo_rubro);
        const nuevosValores = formatAgrupacionRubrosToFormFormat(agrupacionRubros);
        setValores(nuevosValores)

        if (isItCreating) {
            onAgrupacionRubrosCreada(agrupacionRubros);
        } else {
            onAgrupacionRubrosEditada(agrupacionRubros);
        }
    };


    return (
        <Box display='flex' flexDirection='column' gap={1}>
            <FormularioComponent
                titulo='AgrupacionRubros'
                inputs={inputs}
                onInput={handleInputChange}
                botones={{
                    agregar: { visible: isItCreating, onClick: handleSubmit },
                    editar: { visible: isItEditing, onClick: handleSubmit }
                }}
            />

            {
                isItCreating &&
                <BandaAlertaComponent
                    tipo='warning'
                    icon='c-alerta'
                >
                    Debe ingresar los los datos del encabezado del grupo para poder gestionar sus rubros.
                </BandaAlertaComponent>
            }

            {
                valores.cod_estado === CODS_ESTADOS.INACTIVO &&
                <BandaAlertaComponent
                    tipo='warning'
                    icon='c-alerta'
                >
                    El grupo debe estar activo para poder gestionar sus rubros.
                </BandaAlertaComponent>
            }

            <TransferListRubrosAgrupacion
                cod_grupo_rubro={valores.cod_grupo_rubro}
                grupo={valores}
                catalogos={{
                    rubros
                }}
                readonly={isItCreating || !puedeEditar}
            />
        </Box>
    );
};


FormularioAgrupacionRubros.propTypes = {
    defaultValues: PropTypes.object,
    cod_tarifaplantilla: PropTypes.number,
    isItCreating: PropTypes.bool,
    readonly: PropTypes.bool,
    onAgrupacionRubrosCreada: PropTypes.func,
    onAgrupacionRubrosEditada: PropTypes.func,
    catalogos: PropTypes.object,
};


export default FormularioAgrupacionRubros;