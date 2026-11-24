import PropTypes from "prop-types";
import { Lock, LockOpen, TextFields } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { LinkBubbleMenu, MenuButton, RichTextEditor, RichTextReadOnly, TableBubbleMenu, insertImages } from "mui-tiptap";
import EditorMenuControls from "./EditorMenuControls";
import useExtensions from "./useExtensions";
import { inputPropTypes, styleGenerar } from "..";

function fileListToImageFiles(fileList) {
  // You may want to use a package like attr-accept
  // (https://www.npmjs.com/package/attr-accept) to restrict to certain file
  // types.
  return Array.from(fileList).filter((file) => {
    const mimeType = (file.type || "").toLowerCase();
    return mimeType.startsWith("image/");
  });
}

const TextEditorComponent = ({ input, onInput }) => {
  const extensions = useExtensions({
    placeholder: "",
  });
  const rteRef = useRef(null);
  const [isEditable, setIsEditable] = useState(true);
  const [showMenuBar, setShowMenuBar] = useState(true);

  const handleNewImageFiles = useCallback((files, insertPosition) => {
    if (!rteRef.current?.editor) {
      return;
    }

    // For the sake of a demo, we don't have a server to upload the files to,
    // so we'll instead convert each one to a local "temporary" object URL.
    // This will not persist properly in a production setting. You should
    // instead upload the image files to your server, or perhaps convert the
    // images to bas64 if you would like to encode the image data directly
    // into the editor content, though that can make the editor content very
    // large. You will probably want to use the same upload function here as
    // for the MenuButtonImageUpload `onUploadFiles` prop.
    const attributesForImageFiles = files.map((file) => ({
      src: URL.createObjectURL(file),
      alt: file.name,
    }));

    insertImages({
      images: attributesForImageFiles,
      editor: rteRef.current.editor,
      position: insertPosition,
    });
  }, []);

  // Allow for dropping images into the editor
  const handleDrop = useCallback(
    (view, event, _slice, _moved) => {
      if (!(event instanceof DragEvent) || !event.dataTransfer) {
        return false;
      }

      const imageFiles = fileListToImageFiles(event.dataTransfer.files);
      if (imageFiles.length > 0) {
        const insertPosition = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;

        handleNewImageFiles(imageFiles, insertPosition);

        // Return true to treat the event as handled. We call preventDefault
        // ourselves for good measure.
        event.preventDefault();
        return true;
      }

      return false;
    },
    [handleNewImageFiles]
  );

  // Allow for pasting images
  const handlePaste = useCallback(
    (_view, event, _slice) => {
      if (!event.clipboardData) {
        return false;
      }

      const pastedImageFiles = fileListToImageFiles(event.clipboardData.files);
      if (pastedImageFiles.length > 0) {
        handleNewImageFiles(pastedImageFiles);
        // Return true to mark the paste event as handled. This can for
        // instance prevent redundant copies of the same image showing up,
        // like if you right-click and copy an image from within the editor
        // (in which case it will be added to the clipboard both as a file and
        // as HTML, which Tiptap would otherwise separately parse.)
        return true;
      }

      // We return false here to allow the standard paste-handler to run.
      return false;
    },
    [handleNewImageFiles]
  );

  return (
    <>
      <RichTextEditor
        ref={rteRef}
        extensions={extensions}
        content={input.val}
        editable={isEditable}
        renderControls={() => <EditorMenuControls input={input} />}
        RichTextFieldProps={{ variant: "outlined", MenuBarProps: { hide: !showMenuBar } }}
        sx={{
          ...styleGenerar(input),
          "& .ProseMirror": {
            "& h1, & h2, & h3, & h4, & h5, & h6": {
              scrollMarginTop: showMenuBar ? 50 : 0,
            },
          },
        }}
        onUpdate={({ editor }) => {
          const html = editor.getHTML();
          onInput?.(html);
        }}
      >
        {() => (
          <>
            <LinkBubbleMenu />
            <TableBubbleMenu />
          </>
        )}
      </RichTextEditor>
    </>
  );
};

TextEditorComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
  id: PropTypes.string,

  sx: PropTypes.object,
};

export default TextEditorComponent;
