import React, { useState, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";


export const TablaResultados = (props) => {
  const { actividadPadre, datos=[], newBtn = false, onDelete, setUpdateData, updateData } = props;
  const [open, setOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  
  const [lista, setLista] = useState([])

  const [headesRender, setHeadersRender] = useState([
    { name: "unique_key", label: "No.", campo: "unique_key", },
    { name: "nom_tipo", label: "Tipo", campo: "nom_tipo", },
    { name: "descripcion", label: "Descripción", campo: "descripcion", },
    { name: "referencia", label: "Referencia", campo: "referencia"},
    { name: "fecha_programada", label: "Fecha Programada", campo: "fecha_programada", },
    { name: "creado", label: "¿Guardado?", campo: "creado", },
  ]);

  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: false,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false)
  },[lista])

  const dataAddProperty = (arrData) => {
    const data = arrData.map((item, i) => {
      return {
        ...item,
        unique_key: i+1,
        accionesDeTabla: {
          ...accionesDeTabla,
          delete: item.cod_actividad == 0 ? true : false,
          view: (item.cod_actividad && item.cod_actividad != 0) ? true : false,
        },
        fecha_programada: item.fecha_programada ? new Date(item.fecha_programada).toLocaleString() : "",
        creado: item.cod_actividad == 0 ? "No" : "Si",
        deleted: false,
      };
    });
    return data;
  };

  return (
    <Box sx={{ p: 0, m: 0 }}>

      <TablaComponent
        titulo="Resultados"
        id="unique_key"
        encabezado={headesRender}
        datos={dataAddProperty(datos)}
        select={false}
        eventosDeTabla={{
          add: (fila) => console.log("add", fila),
          view: (fila) => {
            if (fila) {
              navigate(`../${encryptId(fila?.content.cod_actividad)}`)
              navigate(0)
            };
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => console.log("edit", fila),
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => onDelete(fila.content),
        }}
        botones={
          newBtn && {
            nuevo: { label: "agregar", color: "primary", 
              onClick: () => {
                setOpen(true)
                setSelectedRow(null)
              }
            },
          }
        }
      />
    </Box>
  );
};
