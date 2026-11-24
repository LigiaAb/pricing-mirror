import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { Modal } from "../../components/Modal/Modal";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom";

export const TablaEmpresa = (props) => {
  const { dataApi, modalResume, viewBtn } = props;
  const [registros, setRegistros] = useState([]);
  const [deletedItem, setDeletedItem] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [headesRender, setHeadersRender] = useState([
    {
      name: "NOMBRE_EMP",
      label: "Empresa",
      campo: "nombre_emp",
    },
    {
      name: "NIT_EMP",
      label: "Nit",
      campo: "nit_emp",
    },
    {
      name: "DIRECCION_EMP",
      label: "Dirección",
      campo: "direccion_emp",
    },
    {
      name: "PAIS_NAME",
      label: "País",
      campo: "pais_name",
    },
  ]);

  const navigate = useNavigate();

  const handleModal = (record) => {
    toggleModal();
    setDeletedItem(record);
  };

  const toggleModal = () => {
    setOpenModal(!openModal);
  };

  useEffect(() => {
    if (modalResume) {
      setHeadersRender([
        {
          name: "NOMBRE_EMP",
          label: "Empresa",
          campo: "nombre_emp",
        },
      ]);
    }
  }, []);

  const handleDelete = () => {
    if (confirmDelete.eliminar === "ELIMINAR") {
      const renderData = registros
        .map((item) => {
          if (item.cod_empresa === deletedItem.content.cod_empresa) {
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
      setRegistros(renderData);
      setOpenModal(!openModal);
    }
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {dataApi && (
        <TablaComponent
          titulo=""
          id="cod_empresa"
          encabezado={headesRender}
          datos={dataApi}
          // onFilaSeleccionada={(fila) => console.log("select", fila)}
          select={false}
          eventosDeTabla={{
            add: (fila) => console.log("add", fila),
            view: (fila) => {
              if (fila) navigate(`view/${fila?.content.cod_empresa}/${fila?.content.pais_emp}`);
            },
            go: (fila) => console.log("go", fila),
            copy: (fila) => console.log("copy", fila),
            paste: (fila) => console.log("paste", fila),
            auth: (fila) => console.log("auth", fila),
            edit: (fila) => {
              if (fila) navigate(`edit/${fila?.content.cod_empresa}/${fila?.content.pais_emp}`);
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
      )}
      {openModal && (
        <Box sx={{ p: 1, m: 0 }}>
          <Modal open={openModal} onClose={toggleModal}>
            <Grid container columns={{ xs: 4, md: 10 }} columnSpacing={3}>
              <Grid size={{ xs: 4, md: 6 }}>
                <p>¿Estas seguro que quieres eliminar este registro?</p>
                <p>Para confirmar escriba ELIMINAR</p>
              </Grid>
              <Grid size={{ xs: 4, md: 4 }}>
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
                />
              </Grid>
            </Grid>
          </Modal>
        </Box>
      )}
    </Box>
  );
};
