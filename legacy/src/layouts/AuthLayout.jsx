import { Box, Grid, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import FONDO3 from "../assets/FONDO1.jpg";
export const AuthLayout = () => {
  return (
    <Box sx={{ flex: 1, overflowY: "auto", backgroundRepeat: "no-repeat", backgroundSize: "cover" }} id="AuthLayout">
      <Grid
        container
        spacing={0}
        direction="row"
        alignItems="center"
        justifyContent="center"
        sx={{
          backgroundImage: `url(${FONDO3})`,
          minHeight: "100vh",
          minWidth: "100vw",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: { xs: 4, md: 1 },
        }}
      >
        <Grid
          width="100%"
          size={{ xs: 12, sm: 12, md: 3, xlg: 2 }}
          p={{ xs: 2, sm: 2, md: 5 }}
          sx={{
            borderRadius: 5,
            transition: "flex .5s ease-in-out,  margin .5s ease-in-out, width .5s ease-in-out, border-radius .5s ease-in-out;",
            bgcolor: "background.main_80",
            boxShadow: "0 10px 30px #061f3d",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          borderRight
          alignSelf="center"
          container
        >
          <Grid size={12}>
            <Typography variant="h2" textAlign="center" fontSize={{ xs: 60, sm: 70, md: "5vw" }} className="c-cropa-dsv" sx={{ fontWeight: "100 !important", color: "primary.main" }} />
          </Grid>
          <Grid size={12}>
            <Outlet />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

AuthLayout.propTypes = {};

export default AuthLayout;
