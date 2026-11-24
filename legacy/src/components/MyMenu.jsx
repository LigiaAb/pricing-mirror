import PropTypes from "prop-types";
import { Icon, IconButton, Menu, MenuItem, Accordion, AccordionSummary, AccordionDetails, Button, Grid, Link, Typography, Tooltip, Divider, Box } from "@mui/material";
import React from "react";

// ESTLOS
import SCROLL_STILE from "../style/scrollStyle";

const defaultStyleModify = {
  marginY: "0px !important",
  padding: "0px !important",
  minHeight: "auto !important",
  bgcolor: "transparent",
  border: "none",
  fontSize: "1rem",
  boxShadow: "none",
};
const propiedadId = "id";
const propiedadTooltip = "tooltip";
const propiedadIcono = "icon";
const propiedadTexto = "title";
const propiedadHijos = "children";
const propiedadRuta = "url";
const propiedadColor = "color";
const propiedadBackgroundColor = "bg";
const propiedadSize = "size";
const propiedadClickFunction = "onClick";
const propiedadDescripcion = "descripcion";

/**
 
 [
            {
              id: 1,
              title: "Test",
              icon: "c-user",
              children: [
                {
                  id: 2,
                  title: "Test",
                  to: "/",
                  icon: "c-home",
                  children: [
                    { id: 11, title: "Test", to: "/", icon: "c-home" },
                    {
                      id: 12,
                      title: "Test",
                      to: "/",
                      icon: "c-home",
                      children: [
                        { id: 9, title: "Test", to: "/", icon: "c-home" },
                        { id: 10, title: "Test", to: "/", icon: "c-home" },
                        {
                          id: 11,
                          title: "Test",
                          to: "/",
                          icon: "c-home",
                          children: [
                            { id: 7, title: "Test", to: "/", icon: "c-home" },
                            { id: 8, title: "Test", to: "/", icon: "c-home" },
                          ],
                        },
                      ],
                    },
                  ],
                },
                { id: 12, title: "Test", to: "/", icon: "c-home" },
                { id: 13, title: "Test", to: "/", icon: "c-home" },
                { id: 14, title: "Test", to: "/", icon: "c-home" },
              ],
            },
            { id: 3, title: "Test", to: "/", icon: "c-home" },
            {
              id: 5,
              title: "Test",
              to: "/",
              icon: "c-home",
              children: [
                {
                  id: 6,
                  title: "Test",
                  to: "/",
                  icon: "c-home",
                  children: [{ id: 4, title: "Test", to: "/", icon: "c-home", children: [{ id: 15, title: "Test", to: "/", icon: "c-home" }] }],
                },
              ],
            },
          ]
 
 */

let IconDeMenu = ({ menu, styles }) => {
  let estilo = {
    fontSize: menu[propiedadSize] || 10,
    lineHeight: 1.2,
    ...defaultStyleModify,
    py: 0,
    my: 0,
    pr: menu[propiedadTexto] ? 1 : 0,
    ...styles,
  };

  return !menu[propiedadIcono] || menu[propiedadIcono] == "null" ? (
    <Icon color={menu[propiedadColor] || "white"} size={1} sx={estilo} className="c-arrow-right" />
  ) : menu[propiedadIcono].startsWith("c-") ? (
    <Icon color={menu[propiedadColor] || "white"} size={1} sx={estilo} className={menu[propiedadIcono]} />
  ) : menu[propiedadIcono].startsWith("cropa-") ? (
    <Icon color={menu[propiedadColor] || "white"} size={1} sx={estilo} className="c-arrow-right" />
  ) : (
    <Icon color={menu[propiedadColor] || "white"} size={1} sx={estilo} className="material-symbols-outlined">
      {menu[propiedadIcono]}
    </Icon>
  );
};

const MenuItemContent = ({ menu, esPadre = false, open = false }) => {
  let estilo = { p: 0, m: 0, lineHeight: 1.2, textDecoration: "none" };
  return menu[propiedadTooltip] ? (
    <Tooltip title={menu[propiedadTooltip]}>
      <Grid container direction="row">
        {menu[propiedadIcono] && (
          <Grid size="auto" m={0} p={0} pr={0.5}>
            <IconDeMenu menu={menu} />
          </Grid>
        )}
        {(menu[propiedadTexto] || menu[propiedadDescripcion]) && (
          <Grid size="auto" m={0} p={0}>
            <Grid container direction="column">
              {menu[propiedadTexto] && (
                <Grid my={0}>
                  <Typography m={0} p={0} color={menu[propiedadColor] || "white"} sx={{ textWrap: "nowrap", ...estilo }} textAlign="left">
                    {menu[propiedadTexto]}
                  </Typography>
                </Grid>
              )}
              {!esPadre && menu[propiedadDescripcion] && (
                <Grid my={0}>
                  <Typography m={0} p={0} color={menu[propiedadColor] || "white"} sx={{ ...estilo }} textAlign="left" variant="caption">
                    {menu[propiedadDescripcion]}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        )}
        {esPadre && menu[propiedadHijos] ? (
          <Grid size="auto" m={0} p={0} pl={0.5}>
            <IconDeMenu menu={{ icon: open ? "c-simple-arriba" : "c-simple-abajo", [propiedadTexto]: " " }} styles={{ ml: 1 }} />
          </Grid>
        ) : (
          <></>
        )}
      </Grid>
    </Tooltip>
  ) : (
    <Grid container direction="row">
      {menu[propiedadIcono] && (
        <Grid size="auto" m={0} p={0} pr={0.5}>
          <IconDeMenu menu={menu} />
        </Grid>
      )}
      {(menu[propiedadTexto] || menu[propiedadDescripcion]) && (
        <Grid size="auto" m={0} p={0}>
          <Grid container direction="column" my={0}>
            {menu[propiedadTexto] && (
              <Grid m={0} p={0} sx={{ lineHeight: 0 }}>
                <Typography m={0} p={0} color={menu[propiedadColor] || "white"} sx={{ textWrap: "nowrap", ...estilo }} textAlign="left">
                  {menu[propiedadTexto]}
                </Typography>
              </Grid>
            )}
            {!esPadre && menu[propiedadDescripcion] && (
              <Grid m={0} p={0} sx={{ lineHeight: 0 }}>
                <Typography m={0} p={0} px={1} color={menu[propiedadColor] || "white"} sx={{ ...estilo }} textAlign="left" variant="caption">
                  {menu[propiedadDescripcion]}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Grid>
      )}
      {esPadre && menu[propiedadHijos] ? (
        <Grid size="auto" m={0} p={0} pl={0.5}>
          <IconDeMenu menu={{ icon: open ? "c-simple-arriba" : "c-simple-abajo", [propiedadTexto]: " " }} styles={{ ml: 1 }} />
        </Grid>
      ) : (
        <></>
      )}
    </Grid>
  );
};

const MenuMenuItem = ({ menu }) => {
  return (
    <MenuItem
      LinkComponent={<Button />}
      key={menu[propiedadId]}
      onClick={menu[propiedadClickFunction]}
      href={menu[propiedadRuta]}
      component={menu[propiedadRuta] && !menu[propiedadClickFunction] ? Link : menu[propiedadTexto] ? Button : IconButton}
      sx={{
        ...defaultStyleModify,
        p: 1,
        color: "white",
        backgroundColor: menu[propiedadBackgroundColor] || "transparent",
        paddingX: "0px !important",
        mx: 1,
        my: 0.5,
      }}
    >
      <MenuItemContent menu={menu} />
    </MenuItem>
  );
};

const MenuChildrenAcordionChildren = ({ menu }) => {
  return (
    <AccordionDetails sx={{ ".MuiAccordion-region": { ...defaultStyleModify }, ...defaultStyleModify, ml: 1, my: 0.5 }}>
      {menu[propiedadHijos] ? <MenuChildrenAcordion menu={menu} /> : <MenuMenuItem menu={menu} />}
    </AccordionDetails>
  );
};

const MenuChildrenAcordion = ({ menu }) => {
  return (
    <Accordion sx={{ "&.Mui-expanded": { ...defaultStyleModify, ml: 1 }, ...defaultStyleModify, paddingX: "0px !important", ml: 1 }}>
      <AccordionSummary
        expandIcon={<Icon className="c-simple-abajo" fontSize="5" sx={{ ...defaultStyleModify }} />}
        id="panel-header"
        aria-controls="panel-content"
        sx={{
          ".MuiAccordionSummary-content": { ...defaultStyleModify },
          ".MuiAccordionSummary-gutters": { ...defaultStyleModify },
          ".MuiAccordionSummary-contentGutters": { ...defaultStyleModify },
          ".MuiAccordionSummary-expandIconWrapper": { mx: 1 },
          "&.Mui-expanded": { ...defaultStyleModify },
          ...defaultStyleModify,
          my: 0.5,
        }}
      >
        <MenuItemContent menu={menu} />
      </AccordionSummary>
      {menu[propiedadHijos].map((m) => (
        <Grid container direction="column" key={m[propiedadId]}>
          <MenuChildrenAcordionChildren menu={m} />
        </Grid>
      ))}
    </Accordion>
  );
};

const MenuListItem = ({ anchorEl, open, handleClose, menus }) => {
  return (
    <Menu id="long-menu" anchorEl={anchorEl} open={open} onClose={handleClose} slotProps={{ ...SCROLL_STILE }}>
      {menus?.map((menu) =>
        menu[propiedadHijos] ? (
          <MenuChildrenAcordion key={`${menu[propiedadId]}${menu[propiedadTexto]}`} menu={menu} />
        ) : (
          <MenuMenuItem key={`${menu[propiedadId]}${menu[propiedadTexto]}`} menu={menu} />
        )
      )}
    </Menu>
  );
};

const MenuTopItem = ({ menu, props }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    event.preventDefault();
    if (menu[propiedadClickFunction]) menu?.onClick();

    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const styles = { my: 0, py: 0 };

  return (
    <Grid size="auto">
      <Grid size="auto">
        {menu[propiedadTexto] || menu[propiedadDescripcion] ? (
          <Button
            aria-label="more"
            id="long-button"
            aria-controls={open ? "long-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            color={menu[propiedadBackgroundColor] || "white"}
            onClick={menu[propiedadHijos] ? handleClick : menu[propiedadClickFunction]}
            href={menu[propiedadRuta]}
            component={Link}
            sx={{ ...styles, ...props }}
            variant={menu[propiedadBackgroundColor] ? "contained" : undefined}
          >
            {menu && <MenuItemContent open={open} esPadre={true} menu={menu} />}
            {/* {menu[propiedadHijos] && <IconDeMenu menu={{ icon: open ? "c-simple-arriba" : "c-simple-abajo" }} styles={{ ml: 1 }} />} */}
          </Button>
        ) : (
          <IconButton
            aria-label="more"
            id="long-button"
            aria-controls={open ? "long-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            color={menu[propiedadBackgroundColor] || "white"}
            onClick={menu[propiedadHijos] ? handleClick : menu[propiedadClickFunction]}
            href={menu[propiedadRuta]}
            component={Link}
            sx={{ ...styles, ...props }}
            variant={menu[propiedadBackgroundColor] ? "contained" : undefined}
          >
            {menu && <MenuItemContent open={open} esPadre={true} menu={menu} />}
            {/* {menu[propiedadHijos] && <IconDeMenu menu={{ icon: open ? "c-simple-arriba" : "c-simple-abajo" }} styles={{ ml: 1 }} />} */}
          </IconButton>
        )}
      </Grid>
      {menu[propiedadHijos] && (
        <Grid size={{ ...SCROLL_STILE }}>
          <MenuListItem anchorEl={anchorEl} open={open} handleClose={handleClose} menus={menu[propiedadHijos]} />
        </Grid>
      )}
    </Grid>
  );
};

export const MyMenu = ({ menus, direction = "row", props }) => {
  return (
    <Grid container className="scroll" direction={direction} sx={{ overflow: "auto", ...props }} flexWrap={"nowrap"} width="auto">
      {menus
        ?.sort((a, b) => a[propiedadTexto] - b[propiedadTexto])
        ?.map((menu) => (
          <MenuTopItem direction={direction} menu={menu} key={menu[propiedadId]} />
        ))}
    </Grid>
  );
};

IconDeMenu.propTypes = { menu: PropTypes.object.isRequired, styles: PropTypes.any };
MenuItemContent.propTypes = { menu: PropTypes.object.isRequired, esPadre: PropTypes.bool, open: PropTypes.bool, props: PropTypes.any };
MenuChildrenAcordionChildren.propTypes = { menu: PropTypes.object.isRequired, props: PropTypes.any };
MenuChildrenAcordion.propTypes = { menu: PropTypes.object.isRequired, props: PropTypes.any };
MenuMenuItem.propTypes = { menu: PropTypes.object.isRequired, props: PropTypes.any };
MenuListItem.propTypes = { anchorEl: PropTypes.any, open: PropTypes.bool, handleClose: PropTypes.func, menus: PropTypes.array.isRequired };
MenuTopItem.propTypes = { menu: PropTypes.object.isRequired, direction: PropTypes.string, props: PropTypes.any };
MyMenu.propTypes = { menus: PropTypes.array, direction: PropTypes.string, props: PropTypes.any };
