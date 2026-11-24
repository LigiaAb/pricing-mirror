import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Avatar, Box, Grid, Icon, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import TabComponent from "../../components/Tabs/TabComponent";
import FormularioCompletoEmpleado from "../../views/Empleado/FormularioCompletoEmpleado";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";

const CustomTree = ({ item }) => {
  return (
    <TreeItem itemId={item.id} label={item.label}>
      {item.children?.map((i) => (
        <CustomTree item={i} key={i.id} />
      ))}
    </TreeItem>
  );
};

const PerfilPage = () => {
  const informacionDeUsuario = useSelector((state) => state.auth);
  const { catalogo_menus } = useSelector((state) => state.menu);
  const [expandedItems, setExpandedItems] = useState([]);
  const handleExpandedItemsChange = (event, itemIds) => {
    setExpandedItems(itemIds);
  };

  let data = useMemo(() => {
    let ids = [];
    let data = (catalogo_menus?.paises || []).map((pais) => {
      ids.push(`pais_${pais.cod_pais}`);

      return {
        ...pais,
        id: `pais_${pais.cod_pais}`,
        label: <Typography color={informacionDeUsuario.json.permisos.paises[pais.cod_pais] ? "primary" : "black"}>{pais.nombre_pais}</Typography>,
        children: pais.empresas.map((empresa) => {
          ids.push(`pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}`);
          return {
            ...empresa,
            id: `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}`,
            label: <Typography color={informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`] ? "primary" : "black"}>{empresa.nombre_emp}</Typography>,
            children: empresa.centrosCosto.map((centroCosto) => {
              ids.push(`pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}`);
              return {
                id: `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}`,
                label: (
                  <Typography color={informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`].centrosCosto[centroCosto.cod_cc] ? "primary" : "black"}>
                    {centroCosto.nombre_cc}
                  </Typography>
                ),
                children: centroCosto.modulos.map((modulo) => {
                  ids.push(`pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}`);
                  return {
                    id: `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}`,
                    label: (
                      <Typography
                        color={
                          informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`].centrosCosto[`${centroCosto.cod_cc}`].modulos[`${modulo.cod_modulo}`]
                            ? "primary"
                            : "black"
                        }
                      >
                        <Typography mr={0.8} component="span" className={modulo.ico_modulo} />
                        {modulo.nom_modulo}
                      </Typography>
                    ),
                    children: modulo.menus.map((menu) => {
                      ids.push(`pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}_menu_${menu.cod_menu}`);
                      return {
                        id: `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}_menu_${menu.cod_menu}`,
                        label: (
                          <Typography
                            color={
                              informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`].centrosCosto[`${centroCosto.cod_cc}`].modulos[`${modulo.cod_modulo}`].menus[
                                `${menu.cod_menu}`
                              ]
                                ? "primary"
                                : "black"
                            }
                          >
                            <Typography mr={0.8} component="span" className={menu.ico_menu} />
                            {menu.nom_menu}
                          </Typography>
                        ),
                        children: menu.categorias.map((categoria) => {
                          ids.push(
                            `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}_menu_${menu.cod_menu}_categoria_${categoria.cod_categoria}`
                          );
                          return {
                            id: `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}_menu_${menu.cod_menu}_categoria_${categoria.cod_categoria}`,
                            label: (
                              <Typography
                                color={
                                  informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`].centrosCosto[`${centroCosto.cod_cc}`].modulos[`${modulo.cod_modulo}`]
                                    .menus[`${menu.cod_menu}`]?.categorias[`${categoria.cod_categoria}`]
                                    ? "primary"
                                    : "black"
                                }
                              >
                                <Typography mr={0.8} component="span" className={categoria.ico_cat} />
                                {categoria.nom_cat}
                              </Typography>
                            ),
                            children: categoria.opciones.map((opcion) => {
                              ids.push(
                                `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}_menu_${menu.cod_menu}_categoria_${categoria.cod_categoria}_opciones_${opcion.cod_opcion}`
                              );
                              return {
                                id: `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}_menu_${menu.cod_menu}_categoria_${categoria.cod_categoria}_opciones_${opcion.cod_opcion}`,
                                label: (
                                  <Typography
                                    color={
                                      informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`].centrosCosto[`${centroCosto.cod_cc}`].modulos[`${modulo.cod_modulo}`]
                                        .menus[`${menu.cod_menu}`]?.categorias[`${categoria.cod_categoria}`]?.opciones[`${opcion.cod_opcion}`]
                                        ? "primary"
                                        : "black"
                                    }
                                  >
                                    <Typography mr={0.8} component="span" className={opcion.ico_opcion} />
                                    {opcion.nom_opcion}
                                  </Typography>
                                ),
                                children: [
                                  {
                                    id: `pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}_menu_${menu.cod_menu}_categoria_${categoria.cod_categoria}_opciones_${opcion.cod_opcion}_acciones`,
                                    label: opcion.acciones.map((i) => (
                                      <Typography
                                        key={`pais_${pais.cod_pais}_empresa_${empresa.cod_empresa}_centroCosto_${centroCosto.cod_cc}_modulo_${modulo.cod_modulo}_menu_${menu.cod_menu}_categoria_${categoria.cod_categoria}_opciones_${opcion.cod_opcion}_acciones_${i.cod_accion}`}
                                        color={
                                          informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`].centrosCosto[`${centroCosto.cod_cc}`].modulos[
                                            `${modulo.cod_modulo}`
                                          ].menus[`${menu.cod_menu}`]?.categorias[`${categoria.cod_categoria}`]?.opciones[`${opcion.cod_opcion}`]?.acciones[i.cod_accion]
                                            ? "primary"
                                            : "black"
                                        }
                                      >
                                        <Typography mr={0.8} component="span" className={i.ico_accion} />
                                        {i.nom_accion}
                                      </Typography>
                                    )),
                                  },
                                ],
                                opciones: undefined,
                              };
                            }),
                            categorias: undefined,
                          };
                        }),
                        menus: undefined,
                      };
                    }),
                  };
                }),
                modulos: undefined,
              };
            }),
            centrosCosto: undefined,
          };
        }),
        empresas: undefined,
      };
    });
    setExpandedItems(ids);
    return data;
  }, [catalogo_menus, informacionDeUsuario]);
  return (
    <Box sx={{ m: 0, p: 0, minHeight: "-webkit-fill-available", maxWidth: { xs: "90vw", md: "50vw" }, maxHeight: { xs: "60vh" } }}>
      <Grid container direction="column">
        <Grid size={{ mb: 2 }}>
          <Typography variant="h6">Perfil de Empleado [ {`${informacionDeUsuario.nombre}`} ]</Typography>
        </Grid>
        <Grid style={{ overflowY: "auto", height: "100%" }}>
          <TabComponent
            opciones={[
              {
                id: 1 /* "Información del Empleado" */,
                label: "Información del Empleado",
                content: (
                  <Grid>
                    <Grid>
                      <FormularioCompletoEmpleado empleado={informacionDeUsuario.empleado} catalogos={{ estados: [] }} id={informacionDeUsuario.empleado.cod_empleado} readonly />
                    </Grid>
                    <Grid>{/* <pre>{JSON.stringify({ ...informacionDeUsuario, permisos: undefined }, null, 2)}</pre> */}</Grid>
                  </Grid>
                ),
                /* content: <pre>{JSON.stringify(informacionDeUsuario, null, 2)}</pre> */
              },
              {
                id: 2,
                label: "Descriptor de Puesto",
                content: (
                  <Grid container>
                    <SimpleTreeView expandedItems={expandedItems} onExpandedItemsChange={handleExpandedItemsChange} sx={{ "& .MuiTreeItem-content": { p: 0, m: 0 } }}>
                      {data.map((item) => (
                        <CustomTree item={item} key={item.id} />
                      ))}
                      {/* {catalogo_menus.paises.map((pais) => (
                        <TreeItem
                          key={pais.cod_pais}
                          itemId={`pais_${pais.cod_pais}`}
                          label={
                            <Typography color={informacionDeUsuario.json.permisos.paises[pais.cod_pais] ? "primary" : "black"}>
                              {pais.nombre_pais}
                            </Typography>
                          }
                        >
                          {pais.empresas.map((empresa) => (
                            <TreeItem
                              key={empresa.cod_empresa}
                              itemId={`empresa_${empresa.cod_empresa}`}
                              label={
                                <Typography
                                  color={
                                    informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`] ? "primary" : "black"
                                  }
                                >
                                  {empresa.nombre_emp}
                                </Typography>
                              }
                            >
                              {empresa.centrosCosto.map((centroCosto) => (
                                <TreeItem
                                  key={centroCosto.cod_cc}
                                  itemId={`centroCosto_${centroCosto.cod_cc}`}
                                  label={
                                    <Typography
                                      color={
                                        informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`].centrosCosto[
                                          centroCosto.cod_cc
                                        ]
                                          ? "primary"
                                          : "black"
                                      }
                                    >
                                      {centroCosto.nombre_cc}
                                    </Typography>
                                  }
                                >
                                  {centroCosto.modulos.map((modulo) => (
                                    <TreeItem
                                      key={modulo.cod_modulo}
                                      itemId={`modulo_${modulo.cod_modulo}`}
                                      label={
                                        <Typography
                                          color={
                                            informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`].centrosCosto[
                                              `${centroCosto.cod_cc}`
                                            ].modulos[`${modulo.cod_modulo}`]
                                              ? "primary"
                                              : "black"
                                          }
                                        >
                                          <Typography mr={0.8} component="span" className={modulo.ico_modulo} />
                                          {modulo.nom_modulo}
                                        </Typography>
                                      }
                                    >
                                      {modulo.menus.map((menu) => (
                                        <TreeItem
                                          key={menu.cod_menu}
                                          itemId={`menu_${menu.cod_menu}`}
                                          label={
                                            <Typography
                                              color={
                                                informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`]
                                                  .centrosCosto[`${centroCosto.cod_cc}`].modulos[`${modulo.cod_modulo}`].menus[`${menu.cod_menu}`]
                                                  ? "primary"
                                                  : "black"
                                              }
                                            >
                                              <Typography mr={0.8} component="span" className={menu.ico_menu} />
                                              {menu.nom_menu}
                                            </Typography>
                                          }
                                        >
                                          <Grid container size={12} mb={0.5} ml={2}>
                                            {menu.categorias.map((categoria) => (
                                              <Grid size={12} width="100%" key={categoria.cod_categoria}>
                                                <Typography
                                                  color={
                                                    informacionDeUsuario.json.permisos.paises[pais.cod_pais].empresas[`${empresa.cod_empresa}`]
                                                      .centrosCosto[`${centroCosto.cod_cc}`].modulos[`${modulo.cod_modulo}`].menus[`${menu.cod_menu}`]
                                                      .categorias[`${categoria.cod_categoria}`]
                                                      ? "primary"
                                                      : "black"
                                                  }
                                                >
                                                  <Typography mr={0.8} component="span" className={categoria.ico_cat} />
                                                  {categoria.nom_cat}
                                                </Typography>
                                              </Grid>
                                            ))}
                                          </Grid>
                                        </TreeItem>
                                      ))}
                                    </TreeItem>
                                  ))}
                                </TreeItem>
                              ))}
                            </TreeItem>
                          ))}
                        </TreeItem>
                      ))} */}
                    </SimpleTreeView>
                    {/* <pre>{JSON.stringify(informacionDeUsuario.json.permisos.paises, null, 2) || ""}</pre> */}
                  </Grid>
                ),
                /* "< El Usuario no posee Puestos Asignados >"  */
              },
              // { id: 3 /* "Permisos Especiales" */, label: "Permisos Especiales", content: "Permisos Especiales" },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
CustomTree.propTypes = {
  item: PropTypes.object,
};

export default PerfilPage;
