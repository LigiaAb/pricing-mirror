import { useState, useCallback, useEffect } from "react";
import { api } from "../../api";
import TablaRubros from "../../components/Rubros/TablaRubros";
import { useDispatch } from "react-redux";
import { encenderCarga, apagarCarga } from "../../store/slices/status/statusSlice";

const ListaRubros = () => {
    const dispatch = useDispatch();

    const [catalogos, setCatalogos] = useState({
        estados: []
    });

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        let estados = response.data.data;
        estados = estados.map(e => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
        return estados;
    }, []);

    useEffect(() => {
        const obtenerDatosIniciales = async () => {
            dispatch(encenderCarga());
            try {
                const [estados] = await Promise.all([
                    obtenerEstados(),
                ]);
                setCatalogos({ estados });
            } catch (error) {
                console.error(error);
            } finally {
                dispatch(apagarCarga());
            }
        };

        obtenerDatosIniciales();
    }, [dispatch, obtenerEstados]);

    
    return (
        <TablaRubros
            catalogos={catalogos}
        />
    );
};


export default ListaRubros;