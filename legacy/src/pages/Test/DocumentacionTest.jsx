// import { Box, Button, Grid } from "@mui/material";


// const DocumentacionTest = (props) => {
//   return (
//     <Box width="100%" maxHeight="85vh" overflow="auto">
       
//     </Box>
//   );
// };

// DocumentacionTest.propTypes = {};

// export default DocumentacionTest;

import React, { useCallback, useEffect, useState, useRef  } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { markdownTables, insertEmptyMarkdownTable } from "codemirror-markdown-tables"
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { keymap } from "@codemirror/view";
import { Box, Button, Grid, Typography } from "@mui/material";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkToc from 'remark-toc'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from "rehype-slug";
import rehypeAttr from "rehype-attr";
import remarkHeadingId from "remark-heading-id";
import "./DocumentacionTest.css";

// const DocumentacionTest = (props) => {

//   const [value, setValue] = React.useState("console.log('hello world!');");
//   const onChange = React.useCallback((val, viewUpdate) => {
//     console.log('val:', val);
//     setValue(val);
//   }, []);
//   return <CodeMirror value={value} height="200px" extensions={[javascript({ jsx: true })]} onChange={onChange} />;
// }

const DocumentacionTest = (props) => {
  const { guardar, datos, viewOnly = false } = props;
  const [value, setValue] = useState(datos);
  const [notificacion, setNotificacion] = useState("");

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const isSyncing = useRef(false);

  const syncScroll = (source, target) => {
    const s = source.current;
    const t = target.current;

    const percent =
      s.scrollTop / (s.scrollHeight - s.clientHeight);

    t.scrollTop = percent * (t.scrollHeight - t.clientHeight);
  };

  const onChange = useCallback((val, viewUpdate) => {
      setValue(val);
  }, []);

  const onSave = () => {
    guardar(value)
    .then(() => setNotificacion("Guardado"))
  }
  
  const saveKeymap = keymap.of([
    {
      key: "Mod-s",
      preventDefault: true,
      run: async () => {
        guardar(value)
        .then(() => setNotificacion("Guardado"))
        return true; 
      },
    },
    {
      key: "Alt-Mod-t",
      run: insertEmptyMarkdownTable(),
    }
  ]);

  useEffect(() => {
    setNotificacion("")
  }, [value]);



  return (
    <Box width="100%"  sx={{ px: 2, m: 0 }}>
      <Grid container size="grow" sx={{ mb: 2, mt: 1 }}>
        <Grid item size={12} display={viewOnly ? "none": "flex"} justifyContent="flex-end" alignContent="center">
          <Box alignContent="center" justifyContent="center" flex={1}>
            <Typography variant="p" color="text.300" mr={3} >
              *Insertar Tabla (Ctrl + Alt + T)
            </Typography>
          </Box>
          <Box alignContent="center" justifyContent="center">
            <Typography variant="p" color="text.300" mr={3} >
              {notificacion}
            </Typography>
          </Box>
          <Button
            variant="contained"
            sx={{
              display: "flex",
              flexDirection: "row",
              textTransform: "none",
              px: 1,
              textAlign: "center",
            }}
            onClick={onSave}
          >
            <Typography variant="p" color="background.main" fontSize={16} fontWeight="bold">
              Guardar (Ctrl + S)
            </Typography>
          </Button>
        </Grid>
      </Grid>
      <Grid container width="100%" spacing={3}>
        <Grid 
          ref={leftRef}   
          size={6} 
          display={viewOnly ? "none": "box"} 
          sx={{boder: 1, overflowY: "auto"}} 
          maxHeight="80vh" 
          onScroll={() => syncScroll(leftRef, rightRef)}
        >
          <CodeMirror minHeight="85vh" value={value} onChange={onChange} placeholder={"Escribe algo..."}
            extensions={[markdown({ base: markdownLanguage, codeLanguages: languages }), saveKeymap, markdownTables(), EditorView.lineWrapping]} 
          />
        </Grid>
        <Grid 
          ref={rightRef}
          size={viewOnly ? 12 : 6} 
          sx={{boder: 1, overflowY: "auto"}}  
          maxWidth="100%" 
          maxHeight="80vh"  
          onScroll={() => syncScroll(rightRef, leftRef)}
        >
          <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkToc, remarkHeadingId]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight, rehypeSlug, rehypeAttr]}
              >
                {value}
              </ReactMarkdown>
          </div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentacionTest;