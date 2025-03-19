import Editor, { EditorProps, Monaco } from '@monaco-editor/react';
import { editor, Range } from 'monaco-editor';
import { useEffect, useRef } from 'react';

interface MonacoEditorProps extends Omit<EditorProps, 'onChange'> {
  value: string;
  height?: string | number;
  readOnly?: boolean;
  language?: string;
  onChange?: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
  highlightLines?: {
    startLine: number;
    endLine: number;
  } | null;
}

export function MonacoEditor({ 
  value, 
  height = '400px', 
  readOnly = false, 
  language = 'typescript', 
  onChange,
  highlightLines,
  ...props 
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorWillMount = (monaco: Monaco) => {
    // Define the pastels-on-dark theme
    monaco.editor.defineTheme('clouds-midnight', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '555555', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'A1A1FF' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'FFB0B0' },
        { token: 'type', foreground: 'FFD2A7' },
        { token: 'class', foreground: 'FF8080' },
        { token: 'function', foreground: 'F1B55F' },
        { token: 'variable', foreground: 'FB9A4B' },
        { token: 'operator', foreground: 'FFFFFF' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#DADADA',
        'editor.lineHighlightBackground': '#f3b01c30',
        'editor.selectionBackground': '#73597E80',
        'editor.inactiveSelectionBackground': '#73597E40',
        "editor.fontFamily": "monospace",
      }
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  };
  

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Initial highlight if needed
    if (highlightLines) {
      highlightEditorLines(editor, highlightLines.startLine, highlightLines.endLine);
    }
  };

  // Update highlights when they change
  useEffect(() => {
    if (editorRef.current && highlightLines) {
      highlightEditorLines(
        editorRef.current,
        highlightLines.startLine,
        highlightLines.endLine
      );
      
      // Scroll to the highlighted lines
      editorRef.current.revealLineInCenter(highlightLines.startLine);
    }
  }, [highlightLines]);

  const highlightEditorLines = (
    editor: editor.IStandaloneCodeEditor,
    startLine: number,
    endLine: number
  ) => {
    // Remove any existing decorations
    editor.deltaDecorations([], []);
    
    // Add new decoration for the range
    editor.deltaDecorations([], [
      {
        range: new Range(startLine, 1, endLine, 1),
        options: {
          isWholeLine: true,
          className: 'convex-panel-highlighted-line',
          linesDecorationsClassName: 'convex-panel-highlighted-line-margin'
        }
      }
    ]);
  };

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      theme="clouds-midnight"
      value={value}
      options={{
        readOnly,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: 'monospace',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
        },
        automaticLayout: true,
        folding: true,
        foldingHighlight: true,
        showFoldingControls: 'always',
        bracketPairColorization: {
          enabled: true,
        },
      }}
      className='convex-panel-monaco-editor'
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      onChange={(value, event) => {
        if (onChange && event) {
          onChange(value, event);
        }
      }}
      {...props}
    />
  );
} 