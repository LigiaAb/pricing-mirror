import React, { useEffect } from 'react'
import TablaComponent from '@/components/Tabla/TablaComponent'
import { useNavigate } from 'react-router-dom'
import { encryptId } from '@/api/encryptDecrypt'
import usePasesalida from './hooks/usePasesalida'
 const TablaSalidaPase = () => {
  const navigate = useNavigate()
  const {pasesSalidas, obtenerPasesSalidas, generarPDF} = usePasesalida()


  useEffect(()=>{
    obtenerPasesSalidas()
  },[])

  
  const encabezado = [
    {
      name:'ps_id',
      label:'Correlativo de Pase', 
      campo:'ps_id',
      align:'center'
    },
    {
      name:'ps_id',
      label:'Entidad', 
      campo:'entidad_nombre',
      align:'center'
    },
    {
      name:'placa',
      label:'Placa',
      campo:'placa',
      align:'center'
    },
    {
      name:'solicitudes',
      label:'Solicitudes',
      campo:'solicitudes',
      align:'center'
    },
    {
      name:'almacen',
      label:'Almacén',
      campo:'almacen_nom',
      align:'center'
    },
  ]

  return (
    <>
    <TablaComponent
    key={'ps_id'}
    titulo={"Pases de Salida"}
    datos={pasesSalidas}
    encabezado={encabezado}
    botones={{
        agregar:{
          label:'Nuevo',
          onClick: ()=> navigate(`${encryptId('new')}`)
        }
    }}
    eventosDeTabla={{
        pdf:(row)=>{
            generarPDF(row.content)
        },
        delete:(row)=>{
            console.log("Eliminar", row)
        }
    }}    

    />
    </>
  )
}

export default TablaSalidaPase