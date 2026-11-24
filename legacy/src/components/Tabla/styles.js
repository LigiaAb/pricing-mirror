import { styled, TablePagination, tablePaginationClasses as classes } from "@mui/material";

const styleTablePagination = {
  [`&.${classes.root}`]: {
    minHeight: 0,
    m: 0,
    p: 0,

    [`& .${classes.toolbar}`]: {
      minHeight: 0,
      m: 0,
      p: 0,

      [`& *`]: { my: 0.2, py: 0 },

      [`& ${classes.displayedRows}`]: { p: 0, m: 0, fontSize: 12 },

      //   [`& .${classes.select}`]: { m: 0, mr: 1, p: 0 },
      [`& .${classes.input}`]: { m: 0, mr: 1, p: 0 },
      [`& .${classes.select}`]: {
        fontSize: 12,
        lineHeight: 1,
        borderRadius: 0,
        minHeight: "auto",
        margin: 0,

        [`& .${classes.menuItem}`]: {
          m: 0,
          p: 0,
        },
      },

      //   [`& .${classes.select}`]: { m: 0, p: 0,  },
      [`& .${classes.selectLabel}`]: { m: 0, p: 0 },
      [`& .${classes.selectIcon}`]: { m: 0, mr: 0.1, p: 0 },

      [`& .${classes.actions} *`]: { m: 0, mr: 0.1, p: 0 },
    },
  },
  [`& .${classes.menuItem}`]: { m: 0, p: 0 },
  "& .MuiList-root": {
    my: 0,
    py: 0,
    "&.MuiMenu-List": {
      fontSize: 12,
      lineHeight: 1,
      borderRadius: 0,
      minHeight: "auto",
      paddingRight: 0.5,
      margin: 0,
      marginY: 0,
      paddingY: 0,
      // [`& .MuiMenuItem-root`]: {
      //   fontSize: 12,
      //   lineHeight: 1,
      //   borderRadius: 0,
      //   minHeight: "auto",
      //   paddingRight: 0.5,
      //   margin: 0,
      //   marginY: 0,
      //   paddingY: 0,
      // },
    },
  },
};
export default styleTablePagination;
