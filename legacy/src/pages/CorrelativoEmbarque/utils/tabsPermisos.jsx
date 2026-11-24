import { useEffect } from "react";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";

const TabsPermisos = () => {
    const { permisosArray = [], catalogoArray = [], permisosObj = {}, catalogoObj = {} } = useObtenerOpcionesAcciones();

    useEffect(() => {
        if (!permisosArray || permisosArray.length === 0) {
            console.info("[tabsPermisos] No hay opciones disponibles para la categoría actual.");
        } else {
            console.log("Acción:", permisosArray)
        }
    }, [permisosArray, catalogoArray, permisosObj, catalogoObj]);

    return null;
};

export default TabsPermisos;
