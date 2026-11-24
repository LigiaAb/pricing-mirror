import React, { useState } from "react";
import { Box, Button, Grid } from "@mui/material";
import { Modal } from "../../components/Modal/Modal";
import { TablaPaises } from "../../views/Paises/TablaPaises";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { FormularioResumenPaises } from "../../views/Paises/FormularioResumenPaises";

export const ModalPaises = (props) => {
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
      <DialogComponent openDialog={openModal} handleClose={toggleModal} titulo={"Paises"}>
        <Grid container columns={{ xs: 4, md: 10 }} columnSpacing={3}>
          <Grid size={{ xs: 4, md: 6 }}>
            <TablaPaises dataApi={data} modalResume={modalResume} />
          </Grid>
          <Grid size={{ xs: 4, md: 4 }}>
            <FormularioResumenPaises />
          </Grid>
        </Grid>
      </DialogComponent>
    </Box>
  );
};
