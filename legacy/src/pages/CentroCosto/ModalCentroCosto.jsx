import React, { useState } from "react";
import { Box, Button, Grid } from "@mui/material";
import { Modal } from "../../components/Modal/Modal";
import TablaCentroCosto from "../../views/CentroCosto/TablaCentroCosto";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { FormularioResumenCentroCosto } from "../../views/CentroCosto/FormularioResumenCentroCosto";

export const ModalCentroCosto = (props) => {
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
      <DialogComponent openDialog={openModal} handleClose={toggleModal} titulo={"Centro de costos"}>
        <Grid container columns={{ xs: 4, md: 10 }} columnSpacing={3}>
          <Grid size={{ xs: 4, md: 6 }}>
            <TablaCentroCosto dataApi={data} modalResume={modalResume} />
          </Grid>
          <Grid size={{ xs: 4, md: 4 }}>
            <FormularioResumenCentroCosto />
          </Grid>
        </Grid>
      </DialogComponent>
    </Box>
  );
};
