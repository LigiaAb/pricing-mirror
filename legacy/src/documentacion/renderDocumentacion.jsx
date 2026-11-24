import { Box, Divider, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneLight, atomOneDarkReasonable } from "react-syntax-highlighter/dist/esm/styles/hljs";
import style from "./qaDocHeader";

const renderItem = (item = []) => {
  let themeMode = localStorage.getItem("theme") || "light";
  let opositeMode = themeMode === "light" ? "dark" : "light";
  const estiloDeTexto = {
    fontSize: "inherit",
    tetAlign: "justify",
    letterSpacing: 0,
    lineHeight: 1,
    p: 1,
  };

  if (Array.isArray(item))
    return (
      <Grid container size={12} width="100%">
        {item.map((i, ind) => {
          return (
            <Grid width="100%" id={i.id} key={JSON.stringify({ i, ind })}>
              {renderItem(i)}
            </Grid>
          );
        })}
      </Grid>
    );
  else if (typeof item === "string") return <Typography variant={item.variant || "span"} component={item.component || "span"} sx={{ ...estiloDeTexto }} dangerouslySetInnerHTML={{ __html: item }} />;
  else
    switch (item.tipo) {
      // Si el tipo es 'texto'
      case "html":
        return (
          <iframe
            width="100%"
            style={{ height: "80vh", border: "none" }}
            srcDoc={`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>QA Framework</title><script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js"></script>
${style}</head><body>${item.texto}</body>`}
          />
        );

      // Si el tipo es 'texto'
      case "texto":
      case "text":
        return (
          <>
            <Box
              sx={{
                display: "block",
                scrollMarginTop: 80,
                visibility: "hidden",
              }}
              id={item.id}
            ></Box>
            <Typography
              variant={item.variant || "p"}
              component={item.component || "p"}
              sx={{ ...estiloDeTexto }}
              color={themeMode === "dark" && item.color.includes("black") ? "text" : item.color ? item.color : "text"}
              textAlign="justify"
              dangerouslySetInnerHTML={{
                __html: item.texto.replace(/\n/gm, "<br/>"),
              }}
            />
          </>
        );

      // Si el tipo es 'tabla'
      case "tabla":
        return (
          <>
            <Box
              sx={{
                display: "block",
                scrollMarginTop: 80,
                visibility: "hidden",
                width: "100%",
              }}
              id={item.id}
            ></Box>
            <Table sx={{ m: 0, p: 0 }} variant="plain">
              <TableHead sx={{ m: 0, p: 0 }}>
                <TableRow
                  sx={{
                    m: 0,
                    p: 0,
                    "&:hover>td": { bgcolor: `primary.${opositeMode}_5` },
                    borderBottomColor: "grey.300",
                    borderBottomWidth: 1,
                    borderBottomStyle: "solid",
                  }}
                >
                  {item.encabezado?.map((header, index) => (
                    <TableCell
                      sx={{
                        m: 0,
                        p: 0,
                        border: 0,
                        width: header.width || `fit-content`,
                        maxWidth: "300px",
                        borderLeftColor: "grey.300",
                        borderLeftWidth: 1,
                        borderLeftStyle: "solid",
                      }}
                      key={index}
                    >
                      {renderItem(typeof header === "string" ? { texto: header, tipo: "titulo", variant: "h6" } : header)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody sx={{ m: 0, p: 0 }}>
                {item.datos?.map((dato, index) => (
                  <TableRow
                    sx={{
                      m: 0,
                      p: 0,
                      "&:hover>td": { bgcolor: `primary.${opositeMode}_5` },
                      borderBottomColor: "grey.300",
                      borderBottomWidth: 1,
                      borderBottomStyle: "solid",
                    }}
                    key={index}
                  >
                    {dato?.map((subDato, subIndex) => (
                      <TableCell
                        sx={{
                          m: 0,
                          p: 0,
                          border: 0,
                          width: dato.width || `fit-content`,
                          maxWidth: "300px",
                          borderLeftColor: "grey.300",
                          borderLeftWidth: subIndex === 0 ? 0 : 1,
                          borderLeftStyle: "solid",
                        }}
                        key={subIndex}
                      >
                        {renderItem(subDato)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        );

      // Si el tipo es 'detalle'
      case "detalle":
        return (
          <>
            <Box
              sx={{
                display: "block",
                scrollMarginTop: 80,
                visibility: "hidden",
                width: "100%",
              }}
              id={item.id}
            ></Box>
            <Table sx={{ m: 0, p: 0, borderCollapse: "collapse" }}>
              <TableBody sx={{ m: 0, p: 0 }}>
                {item.datos?.map((dato, ind) => {
                  return (
                    <TableRow
                      sx={{
                        m: 0,
                        p: 0,
                        "&:hover>td": { bgcolor: `primary.${opositeMode}_5` },
                        borderTopColor: "grey.300",
                        borderTopWidth: 1,
                        borderTopStyle: "solid",
                      }}
                      key={ind}
                    >
                      <TableCell
                        sx={{
                          m: 0,
                          p: 0,
                          border: 0,
                          width: dato.width || `fit-content`,
                          maxWidth: "100px",
                        }}
                      >
                        {renderItem(dato.label)}
                      </TableCell>
                      <TableCell
                        sx={{
                          border: 0,
                          m: 0,
                          p: 0,
                          width: dato.width || `fit-content`,
                          maxWidth: "300px",
                          borderLeftColor: "grey.400",
                          borderLeftWidth: 1,
                          borderLeftStyle: "solid",
                          borderBottom: "0px solid transparent",
                        }}
                      >
                        {renderItem(dato.dato)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        );

      // Si el tipo es 'titulo'
      case "titulo":
        return (
          <>
            <Box
              sx={{
                display: "block",
                scrollMarginTop: 80,
                visibility: "hidden",
              }}
              id={item.id}
            ></Box>
            <Typography
              variant={item.variant || "b"}
              component={item.component || "b"}
              color={item.color ? item.color : `primary.${opositeMode}`}
              sx={{ ...estiloDeTexto, fontSize: 17, mr: "5px !important" }}
            >
              {renderItem(item.texto)}
            </Typography>
          </>
        );

      // Si el tipo es 'subtitulo'
      case "subtitulo":
        return (
          <>
            <Box
              sx={{
                display: "block",
                scrollMarginTop: 80,
                visibility: "hidden",
              }}
              id={item.id}
            ></Box>
            <Typography
              variant={item.variant || "b"}
              component={item.component || "b"}
              color={item.color ? item.color : `primary.${opositeMode}`}
              sx={{ ...estiloDeTexto, fontSize: 15, mr: "5px !important" }}
            >
              {renderItem(item.texto)}
            </Typography>
          </>
        );

      // Si el tipo es 'hr'
      case "hr":
        return (
          <>
            <Box
              sx={{
                display: "block",
                scrollMarginTop: 80,
                visibility: "hidden",
              }}
              id={item.id}
            ></Box>
            <Divider textAlign="left" sx={{ my: 2 }}>
              {item.texto &&
                renderItem({
                  ...item,
                  texto: item.texto,
                  tipo: "titulo",
                  variant: item.variant || "b",
                })}
            </Divider>
          </>
        );

      // Si el tipo es 'hr'
      case "codigo":
      case "code":
        return (
          <>
            <Box
              sx={{
                display: "block",
                scrollMarginTop: 80,
                visibility: "hidden",
              }}
              id={item.id}
            ></Box>
            <Typography component="span">
              <SyntaxHighlighter
                language={item.lang || "json"}
                style={localStorage.getItem("theme") === "dark" ? atomOneDarkReasonable : atomOneLight}
                customStyle={{ fontSize: 10, padding: 3, margin: 5 }}
              >
                {item.texto}
              </SyntaxHighlighter>
            </Typography>
          </>
        );

      // Si el tipo es 'imagen'
      case "imagen":
        return (
          <>
            <Box
              sx={{
                display: "block",
                scrollMarginTop: 80,
                visibility: "hidden",
              }}
              id={item.id}
            ></Box>
            <img src={item.imagen} alt="Vista previa" style={{ maxWidth: "100%", height: "auto" }} />
          </>
        );

      default:
        return ""; // Puedes manejar otros tipos o devolver null si no se reconoce el tipo.
    }
};

export default renderItem;
