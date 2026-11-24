import { Box, Drawer, Button, TextField } from "@mui/material"
import { useState, useEffect, useMemo, useCallback } from "react";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";

const FormularioRack = ({
  open = false,
  anchor = 'right',
  initialData = {},
  onClose,
  onSave,
  almacenes
}) => {
  // Estado del formulario
  const [formData, setFormData] = useState(initialData);
    const [key, setKey] = useState(0);

 
  

  // Sincronizar con initialData cuando cambia
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };
  
  const [valores, setValores] =useState({
    select_almacen: null,
    text_bodega: "",
    number_rack:0,
    number_tramo:0,
    number_nivel:0,
    number_espacio:0

  })

  const inputs =useMemo(()=>{ 
    const {select_almacen,text_bodega, number_rack, number_tramo, number_nivel, number_espacio} = valores
    return [
    {
      tipo: 'select',
      id: 'select_almacen',
      label: 'almacen',
      val:select_almacen,
      options: almacenes.map(i=>({value:i.ALMACEN_ID,label:i.ALMACEN_NOM})),
      size: 12
    },
    {
      tipo: 'text',
      id: 'text_bodega',
      label: 'Bodega',
      val: text_bodega,
      size: 12,
      max:2
    },
    {
      tipo: 'number',
      id: 'number_rack',
      label: 'Rack',
      val:number_rack,
      size: 12,
      max:99
    },
    {
      tipo: 'number',
      id: 'number_tramo',
      label: 'Tramo',
      val: number_tramo,
      size: 12,
      max:99
    },
    {
      tipo:'number',
      id:'number_nivel',
      label:'Nivel',
      val: number_nivel,
      size:12,
      max:99
    },
    {
      tipo:'number',
      id:'number_espacio',
      label:'Espacio',
      val: number_espacio,
      size:12,
      max:1,
      maxvalue:9
    }
    
  ]},[almacenes, valores])


   const onInput = useCallback(({ id, val }) => {
      setValores((v) => ({ ...v, [id]: val }));
    }, []);

    const agregar = useCallback(async()=>{
       await onSave(valores)
    },[valores])

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 500,
          maxWidth: '80vw',
          boxSizing: 'border-box',
          ...(anchor === 'left' || anchor === 'right') && {
            top: '20%',
            transform: 'translateY(-50%)',
            height: 'auto',
          },
          ...(anchor === 'top' || anchor === 'bottom') && {
            left: '50%',
            transform: 'translateX(-40%)',
          },
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <h2>{initialData.id ? 'Editar rack' : 'Nuevo rack'}</h2>
        <FormularioComponent
          inputs={inputs}
          onInput={onInput}
          botones={{
            agregar: {
              visible:true,
              onClick:()=>agregar()
            }
          }}
        />

      </Box>
    </Drawer>
  )
}

export default FormularioRack;