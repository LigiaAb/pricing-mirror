import React, { useState } from "react";
import { Box, Button, Grid } from "@mui/material";
import { Modal } from "../../components/Modal/Modal";
import { TablaEstados } from "../../views/Estados/TablaEstados";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { FormularioResumenEstados } from "../../views/Estados/FormularioResumenEstados";

export const ModalEstados = (props) => {
  const [openModal, setOpenModal] = useState(false);
  const [modalResume, setModalResume] = useState(false);
  const { data } = props;

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
      <DialogComponent openDialog={openModal} handleClose={toggleModal} titulo={"Estados"}>
        <Grid container columns={{ xs: 4, md: 10 }} columnSpacing={3}>
          <Grid size={{ xs: 4, md: 6 }}>
            <TablaEstados dataApi={data} modalResume={modalResume} />
          </Grid>
          <Grid size={{ xs: 4, md: 4 }}>
            <FormularioResumenEstados />
          </Grid>
        </Grid>
      </DialogComponent>
    </Box>
  );
};
