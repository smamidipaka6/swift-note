"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

const editorConfig = {
  namespace: "SwiftNoteEditor",
  onError: (error: Error) => console.error(error),
  theme: {
    // Theme configuration using Tailwind classes
    paragraph: "my-2",
    text: {
      bold: "font-bold",
      italic: "italic",
      underline: "underline",
      strikethrough: "line-through",
    },
  },
};

export function Editor() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Title input */}
      <div className="rounded-lg bg-background">
        <input
          type="text"
          placeholder="Enter title..."
          className="w-full pt-12 px-4 py-3 text-3xl font-bold bg-transparent border-none outline-none focus:outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Main editor */}
      <LexicalComposer initialConfig={editorConfig}>
        <div className="rounded-lg bg-background">
          <div className="font-sans font-medium text-lg text-foreground relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="p-4 min-h-[150px] outline-none focus:outline-none leading-[normal]" />
              }
              placeholder={
                <div className="absolute left-4 top-6 text-muted-foreground pointer-events-none leading-[normal]">
                  Start typing your note...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
