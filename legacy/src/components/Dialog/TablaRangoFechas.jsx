import React, { useState, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";

export const TablaRangoFechas = (props) => {
  const { datos = [], tabla, setUpdateData, updateData } = props;

  const [open, setOpen] = useState(false);
  const [newForm, setNewForm] = useState(false);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [valores, setValores] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [listaRes, setListaRes] = useState([]);
  const [lista, setLista] = useState(datos || []);

  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: false,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: true,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  });

  useEffect(() => {
    setOpen(false);
  }, [lista]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo={tabla.titulo}
        id={tabla.id}
        encabezado={tabla.headers}
        datos={datos}
        select={false}
        eventosDeTabla={{
          add: (fila) => console.log("add", fila),
          view: (fila) => {
            setOpen(true);
            setSelectedRow(fila.content);
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),

          edit: (fila) => {
            setOpen(true);
            setSelectedRow(fila.content);
          },
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => console.log("delete", fila),
        }}
        botones={
          false && {
            nuevo: {
              label: "agregar",
              color: "primary",
              onClick: () => {
                setOpen(true);
                setSelectedRow(null);
              },
            },
          }
        }
      />
    </Box>
  );
};
