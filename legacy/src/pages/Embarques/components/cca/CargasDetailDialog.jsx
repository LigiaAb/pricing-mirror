import React from "react";
import PropTypes from "prop-types";
import { Dialog, DialogContent } from "@mui/material";
import CargasSection from "../secciones/cargas";
import { resolveEmbarqueId } from "./utils";
import { DialogTitleWithClose } from "./shared";

const CargasDetailDialog = ({ open, onClose, embarqueId = null }) => (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitleWithClose title="Detalle de Cargas" onClose={onClose} />
        <DialogContent dividers sx={{ p: 2 }}>
            <CargasSection
                embarqueId={embarqueId}
            />
        </DialogContent>
    </Dialog>
);

CargasDetailDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default CargasDetailDialog;