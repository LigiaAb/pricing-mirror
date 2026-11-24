import { useState, useCallback, useEffect } from "react";
import { api } from "../../api";
import Tablancoterms from "../../components/Incoterms/TablaIncoterms";
import { useDispatch } from "react-redux";
import { encenderCarga, apagarCarga } from "../../store/slices/status/statusSlice";


const ListaIncoterms = () => {
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
		<Tablancoterms
			catalogos={catalogos}
		/>
	);
};


export default ListaIncoterms;