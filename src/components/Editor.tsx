"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useEffect } from "react";

// const STRIKETHROUGH_SHORTCUT: LexicalCommand<KeyboardEvent> = createCommand();

function ShortcutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register command to handle Enter key in empty list items
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        const selection = $getSelection();
        if (!selection || !$isRangeSelection(selection)) return false;

        const node = selection.anchor.getNode();
        const parent = node.getParent();

        // Check if we're in a list item and it's empty
        if (
          parent?.getType() === "listitem" &&
          node.getTextContent().trim() === ""
        ) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );

    function handleKeyDown(event: KeyboardEvent) {
      // Strikethrough shortcut
      if (event.metaKey && event.shiftKey && event.key.toLowerCase() === "x") {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
      }

      // Bullet list shortcut (Cmd+Shift+8 or Cmd+*)
      if (event.metaKey && event.shiftKey && event.key === "8") {
        event.preventDefault();
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      }
    }

    // Add event listener to the window
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  return null;
}

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
    list: {
      ul: "list-disc list-inside",
      ol: "list-decimal list-inside",
    },
  },
  nodes: [ListNode, ListItemNode],
};

export function Editor() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Title input */}
      <div className="mt-14 rounded-lg bg-background">
        <input
          type="text"
          placeholder="Enter title..."
          className="w-full pt-12 px-8 text-4xl font-extrabold bg-transparent border-none outline-none focus:outline-none text-foreground/80 placeholder:text-muted-foreground"
        />
      </div>

      {/* Main editor */}
      <LexicalComposer initialConfig={editorConfig}>
        <div className="rounded-lg bg-background">
          <div className="font-sans font-medium text-md text-foreground/80 relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="p-4 pl-8 min-h-[150px] outline-none focus:outline-none leading-[normal] [&_p]:block [&_p]:py-1 [&_p]:my-1 [&_p]:rounded [&_p]:relative [&_p]:transition-colors [&_p:hover]:before:content-['→'] [&_p]:before:absolute [&_p]:before:left-[-1.5rem] [&_p]:before:opacity-0 [&_p:hover]:before:opacity-50 [&_p]:before:transition-opacity [&_p]:before:text-muted-foreground" />
              }
              placeholder={
                <div className="absolute left-8 top-6 text-muted-foreground pointer-events-none leading-[normal]">
                  Start typing your note...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <ShortcutPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
