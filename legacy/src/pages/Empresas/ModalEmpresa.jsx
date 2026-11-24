import React, { useState } from "react";
import { Box, Button, Grid } from "@mui/material";
import { TablaEmpresa } from "../../views/Empresa/TablaEmpresa";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { FormularioResumenEmpresas } from "../../views/Empresa/FormularioResumenEmpresas";

export const ModalEmpresa = (props) => {
  const { setUpdateData, updateData, data, idCountry } = props;
  const [openModal, setOpenModal] = useState(false);
  const [modalResume, setModalResume] = useState(false);

  const handleModal = (e) => {
    e.preventDefault();
    toggleModal();
  };
  const toggleModal = () => {
    setOpenModal(!openModal);
    setModalResume(true);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Button onClick={handleModal}>Click</Button>
      <DialogComponent openDialog={openModal} handleClose={toggleModal} titulo={"Empresas"}>
        <Grid container columns={{ xs: 4, md: 10 }} columnSpacing={3}>
          <Grid size={{ xs: 4, md: 6 }}>
            <TablaEmpresa dataApi={data} modalResume={modalResume} />
          </Grid>
          <Grid size={{ xs: 4, md: 4 }}>
            <FormularioResumenEmpresas idCountry={idCountry} setUpdateData={setUpdateData} updateData={updateData} />
          </Grid>
        </Grid>
      </DialogComponent>
    </Box>
  );
};
