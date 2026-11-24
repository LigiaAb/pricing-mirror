import PropTypes from "prop-types";
import { Box, Typography, Grid, Icon } from "@mui/material";
const background = "#104f9c";

const CodigosColorComponent = ({ cod_tipo, color = "primary.main", text = "", cantidad = 0, icon = "c-circulo", activo = true, onClick }) => {
  const borderColor = activo ? background : "#999";

  return (
    <Grid
      container
      direction="row"
      onClick={() => onClick({ cod_tipo, label: text, borderColor, borderWidth: 2, borderStyle: "solid", color, activo })}
      sx={{
        borderColor,
        borderWidth: 2,
        borderStyle: "solid",
        borderRadius: 2.5,
        p: 1,
        cursor: "pointer",
        position: "relative",
        backdropFilter: activo ? "blur(40px)" : "none",
        WebkitBackdropFilter: activo ? "blur(40px)" : "none",
        bgcolor: activo ? "#104f9c10" : "transparent",
        boxShadow: activo ? "0px 2px 2px #104f9c40" : "none",
      }}
    >
      {activo && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            borderTop: `14px solid ${background}`,
            borderRight: "14px solid transparent",
            borderTopLeftRadius: 6,
          }}
        />
      )}
      <Grid size={2}>
        <Typography className={icon} sx={{ fontSize: 18, mr: 0.5, color: color }} />
      </Grid>
      <Grid container direction="column" size="grow" alignItems="right" sx={{ textAlign: "right" }}>
        <Grid fontSize={8}>{text}</Grid>
        <Grid>{cantidad}</Grid>
      </Grid>
    </Grid>
  );
};

CodigosColorComponent.propTypes = {
  color: PropTypes.string,
  text: PropTypes.string,
  cantidad: PropTypes.number,
  icon: PropTypes.string,
  activo: PropTypes.bool,
  onClick: PropTypes.func,
};

export default CodigosColorComponent;
