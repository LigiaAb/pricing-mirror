import EditableDataGridComponent from "../../../../../components/Tabla/EditableDataGridComponent";
import useColumnasGestionMetodosTarifa from "./hooks/useColumnasGestionMetodos";

const TablaGestionMetodosTarifa = () => {
    const columnasGestionMetodosTarifa = useColumnasGestionMetodosTarifa();

    return (
        <EditableDataGridComponent
            idKey='tarifa_id'
            encabezados={columnasGestionMetodosTarifa}
            datos={[]}
        />
    );
};

export default TablaGestionMetodosTarifa;