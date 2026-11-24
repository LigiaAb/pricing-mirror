import PropTypes from "prop-types";
import { Box, DialogTitle, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const DialogTitleWithClose = ({ title, subtitle, onClose }) => (
    <DialogTitle sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
            <Typography variant="h6">{title}</Typography>
            {subtitle ? (
                <Typography variant="body2" color="text.secondary">
                    {subtitle}
                </Typography>
            ) : null}
        </Box>
        <IconButton onClick={onClose} size="small">
            <CloseIcon />
        </IconButton>
    </DialogTitle>
);

DialogTitleWithClose.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    onClose: PropTypes.func.isRequired,
};

export const DisplayValue = ({ value }) => (
    <Box
        sx={{
            width: "100%",
            minHeight: 40,
            px: 1,
            py: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            backgroundColor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
        }}
    >
        <Typography variant="body2" sx={{ width: "100%" }}>
            {value ?? ""}
        </Typography>
    </Box>
);

DisplayValue.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};