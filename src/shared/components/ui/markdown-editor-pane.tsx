"use client";
// Panel CodeMirror separado: ~200KB que solo cargan las vistas de edición.
// Importar siempre vía next/dynamic (ver markdown.tsx), nunca estático.
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";

interface MarkdownEditorPaneProps {
  readonly value: string;
  readonly onChange: (val: string) => void;
  readonly onSave: () => void;
  readonly theme?: "light" | "dark";
}

export default function MarkdownEditorPane({
  value,
  onChange,
  onSave,
  theme = "light",
}: MarkdownEditorPaneProps) {
  const saveKeymap = keymap.of([
    {
      key: "Mod-s",
      preventDefault: true,
      run: () => {
        onSave();
        return true;
      },
    },
  ]);

  return (
    <CodeMirror
      value={value}
      minHeight="75vh"
      onChange={onChange}
      extensions={[markdown({ base: markdownLanguage, codeLanguages: languages }), saveKeymap]}
      placeholder="Escribe algo..."
      theme={theme}
    />
  );
}
