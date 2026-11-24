import { api } from "../../../api";

export const dataRequest = () => {
    return async (dispatch) => {
        dispatch({type : 'GET_REQUEST'});
        try {
            const response = await api.get("/api/appweb/listacentrocosto");
            dispatch({type:'GET_REQUEST_SUCCESS', payload: response})
        } catch (error) {
            dispatch({type: 'GET_REQUEST_FAILURE', error: error})
        }
    }
}