import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/Modal/Modal";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const TablaEstados = (props) => {
  const { dataApi, openModal, setOpenModal, setData, modalResume, viewBtn } = props;
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deletedItem, setDeletedItem] = useState(false);
  const [headesRender, setHeadersRender] = useState([
    {
      name: "COD_ESTADO",
      label: "Código",
      campo: "cod_estado",
    },
    {
      name: "ESTADO_DESC",
      label: "Estados",
      campo: "estado_desc",
    },
  ]);

  const handleModal = (record) => {
    toggleModal();
    setDeletedItem(record);
  };

  useEffect(() => {
    if (modalResume) {
      setHeadersRender([
        {
          name: "ESTADO_DESC",
          label: "Estados",
          campo: "estado_desc",
        },
      ]);
    }
  }, []);

  const toggleModal = () => {
    setOpenModal(!openModal);
  };

  const handleDelete = () => {
    if (confirmDelete.eliminar === "ELIMINAR") {
      const renderData = dataApi
        .map((item) => {
          if (item.COD_ESTADO === deletedItem.content.COD_ESTADO) {
            return {
              ...item,
              deleted: true,
            };
          }
          return item;
        })
        .filter((item) => {
          return item.deleted === false;
        });
      setData(renderData);
      setOpenModal(!openModal);
    }
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {dataApi && (
        <TablaComponent
          titulo=""
          id="cod_estado"
          encabezado={headesRender}
          datos={dataApi}
          // onFilaSeleccionada={(fila) => console.log("select", fila)}
          select={false}
          eventosDeTabla={{
            add: (fila) => console.log("add", fila),
            view: (fila) => {
              if (fila) navigate(`view/${fila?.content.cod_estado}`);
            },
            go: (fila) => console.log("go", fila),
            copy: (fila) => console.log("copy", fila),
            paste: (fila) => console.log("paste", fila),
            auth: (fila) => console.log("auth", fila),
            edit: (fila) => {
              if (fila) navigate(`edit/${fila?.content.cod_estado}`);
            },
            excel: (fila) => console.log("excel", fila),
            pdf: (fila) => console.log("pdf", fila),
            download: (fila) => console.log("download", fila),
            delete: (fila) => handleModal(fila),
          }}
          botones={
            viewBtn && {
              nuevo: { label: "nuevo", onClick: () => navigate("new"), color: "primary" },
            }
          }
        />
      )}{" "}
      {openModal && (
        <Box sx={{ p: 1, m: 0 }}>
          <Modal open={openModal} onClose={toggleModal} style={{ maxWith: "700px" }}>
            <Grid container columns={{ xs: 4 }} columnSpacing={3}>
              <Grid size={4}>
                <p>¿Estas seguro que quieres eliminar este registro?</p>
                <p>Para confirmar escriba ELIMINAR</p>
              </Grid>
              <Grid size={4}>
                <FormularioComponent
                  inputs={[{ id: "eliminar", label: "ELIMINAR", tipo: "text", val: "" }]}
                  onInput={({ id, val }) => {
                    setConfirmDelete((inp) => ({ ...inp, [id]: val }));
                  }}
                  botones={{
                    agregar: { visible: false, onClick: null },
                    cancelar: { visible: false, onClick: null },
                    guardar: { visible: true, onClick: handleDelete },
                    filtrar: { visible: false, onClick: null },
                  }}
                  unaColumna
                />
              </Grid>
            </Grid>
          </Modal>
        </Box>
      )}
    </Box>
  );
};
