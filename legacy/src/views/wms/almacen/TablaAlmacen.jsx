import { Box } from "@mui/material"
import TablaComponent from "../../../components/Tabla/TablaComponent"
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../../api/encryptDecrypt";
const TablaAlmacen =(props) =>{

  const navigate = useNavigate()
  const { lista, reConsultar, catalogos = {}, codTipo, permiteCrear = false, loading = false } = props;
  const encabezados = [
    {
        name:"ALMACEN_ID",
        label:'Almacen id',
        campo:'ALMACEN_ID',
        align:'center'
    },
    {
        name:"ALMACEN_NOM",
        label:'Nombre almacen',
        campo:'ALMACEN_NOM',
        align:'center'
    },
    {
        name:"ALMACEN_PREFIJO",
        label:'Prefijo almacén',
        campo:'ALMACEN_PREFIJO',
        align:'center'
    },
    {
        name:"PAIS_NOMBRE",
        label:' Pais',
        campo:'PAIS_NOMBRE',
        align:'center'
    },
    {
        name:"PAIS_CODIGO",
        label:'Pais codigo',
        campo:'PAIS_CODIGO',
        align:'center'
    }
  ]
    return (
        <Box sx={{p:1,m:0}}>
            <TablaComponent
            id="ALMACEN_ID"
            encabezado={encabezados}
            datos={lista}
            select={false}
            multipleSelect
            botones={{ nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary" } }}
            
            />
        </Box>
    )
}

export default TablaAlmacen