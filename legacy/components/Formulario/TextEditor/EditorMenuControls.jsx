import PropTypes from "prop-types";
import { Grid, useTheme } from "@mui/material";
import {
  MenuButtonAddTable,
  MenuButtonBlockquote,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonCode,
  MenuButtonCodeBlock,
  MenuButtonEditLink,
  MenuButtonHighlightColor,
  MenuButtonHorizontalRule,
  MenuButtonImageUpload,
  MenuButtonIndent,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonRedo,
  MenuButtonRemoveFormatting,
  MenuButtonStrikethrough,
  MenuButtonSubscript,
  MenuButtonSuperscript,
  MenuButtonTaskList,
  MenuButtonTextColor,
  MenuButtonUnderline,
  MenuButtonUndo,
  MenuButtonUnindent,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectFontFamily,
  MenuSelectFontSize,
  MenuSelectHeading,
  MenuSelectTextAlign,
  isTouchDevice,
} from "mui-tiptap";
import { inputPropTypes } from "..";
import { useSelector } from "react-redux";

export default function EditorMenuControls({ input }) {
  const theme = useTheme();
  const { movil } = useSelector((state) => state.screen);

  return (
    <MenuControlsContainer>
      <Grid container direction="row" justifyContent={"space-around"}>
        {input.useFonts === true && (
          <>
            <MenuSelectFontFamily
              options={[
                { label: "Comic Sans", value: "Comic Sans MS, Comic Sans" },
                { label: "Cursive", value: "cursive" },
                { label: "Monospace", value: "monospace" },
                { label: "Serif", value: "serif" },
              ]}
            />

            <MenuDivider />
          </>
        )}

        {input.useTipo !== false && (
          <>
            <MenuSelectHeading />

            <MenuDivider />
          </>
        )}

        {input.useFontSize !== false && (
          <>
            <MenuSelectFontSize />

            <MenuDivider />
          </>
        )}

        {input.useTextEdition !== false && (
          <>
            <MenuButtonBold />

            <MenuButtonItalic />

            <MenuButtonUnderline />

            <MenuButtonStrikethrough />

            <MenuButtonSubscript />

            <MenuButtonSuperscript />

            <MenuDivider />
          </>
        )}
        {input.useColor !== false && (
          <>
            <MenuButtonTextColor
              defaultTextColor={theme.palette.text.primary}
              swatchColors={[
                { value: "#000000", label: "Black" },
                { value: "#ffffff", label: "White" },
                { value: "#888888", label: "Grey" },
                { value: "#ff0000", label: "Red" },
                { value: "#ff9900", label: "Orange" },
                { value: "#ffff00", label: "Yellow" },
                { value: "#00d000", label: "Green" },
                { value: "#0000ff", label: "Blue" },
              ]}
            />

            <MenuButtonHighlightColor
              swatchColors={[
                { value: "#595959", label: "Dark grey" },
                { value: "#dddddd", label: "Light grey" },
                { value: "#ffa6a6", label: "Light red" },
                { value: "#ffd699", label: "Light orange" },
                // Plain yellow matches the browser default `mark` like when using Cmd+Shift+H
                { value: "#ffff00", label: "Yellow" },
                { value: "#99cc99", label: "Light green" },
                { value: "#90c6ff", label: "Light blue" },
                { value: "#8085e9", label: "Light purple" },
              ]}
            />

            <MenuDivider />
          </>
        )}

        {input.useLinks !== false && (
          <>
            <MenuButtonEditLink />

            <MenuDivider />
          </>
        )}

        {input.useAlign !== false && (
          <>
            <MenuSelectTextAlign />

            <MenuDivider />
          </>
        )}

        {input.useLists !== false && (
          <>
            <MenuButtonOrderedList />

            <MenuButtonBulletedList />

            <MenuButtonTaskList />

            {/* On touch devices, we'll show indent/unindent buttons, since they're
      unlikely to have a keyboard that will allow for using Tab/Shift+Tab. These
      buttons probably aren't necessary for keyboard users and would add extra
      clutter. */}
            {movil && (
              <>
                <MenuButtonIndent />

                <MenuButtonUnindent />
              </>
            )}

            <MenuDivider />
          </>
        )}

        {input.useMension !== false && (
          <>
            <MenuButtonBlockquote />

            <MenuDivider />
          </>
        )}

        {input.useCodigo !== false && (
          <>
            <MenuButtonCode />

            <MenuButtonCodeBlock />

            <MenuDivider />
          </>
        )}
        {/* 
      <MenuButtonImageUpload
        onUploadFiles={(files) =>
          // For the sake of a demo, we don't have a server to upload the files
          // to, so we'll instead convert each one to a local "temporary" object
          // URL. This will not persist properly in a production setting. You
          // should instead upload the image files to your server, or perhaps
          // convert the images to bas64 if you would like to encode the image
          // data directly into the editor content, though that can make the
          // editor content very large.
          files.map((file) => ({
            src: URL.createObjectURL(file),
            alt: file.name,
          }))
        }
      /> 
      
      <MenuDivider />
      */}

        {input.useDivisores !== false && (
          <>
            <MenuButtonHorizontalRule />

            <MenuButtonAddTable />

            <MenuDivider />
          </>
        )}

        <MenuButtonRemoveFormatting />

        <MenuButtonUndo />

        <MenuButtonRedo />
      </Grid>
    </MenuControlsContainer>
  );
}

EditorMenuControls.propTypes = { input: inputPropTypes.isRequired };
