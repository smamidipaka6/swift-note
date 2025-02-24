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
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useEffect, useRef } from "react";

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

      // Handle Tab and Shift+Tab for list indentation
      if (event.key === "Tab") {
        // Prevent default tab behavior immediately
        event.preventDefault();

        editor.update(() => {
          const selection = $getSelection();
          if (!selection || !$isRangeSelection(selection)) return;

          const node = selection.anchor.getNode();
          const parent = node.getParent();

          // Check if we're in a list structure by traversing up the tree
          let isInList = false;
          if (
            parent &&
            (parent.getType() === "listitem" || parent.getType() === "list")
          ) {
            isInList = true;
          }

          if (isInList) {
            if (event.shiftKey) {
              editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
            } else {
              editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
            }
          } else {
            // If not in a list, insert tab character for regular indentation
            selection.insertText("\t");
          }
        });
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
      nested: {
        listitem: "",
      },
      ol: "list-decimal list-outside ml-8",
      ul: "list-outside ml-8 [&>li]:text-lg [&>li>ul]:text-base [&>li:not(:has(ul))]:list-big-disc [&>li>ul>li:not(:has(ul))]:list-circle [&>li>ul>li>ul>li:not(:has(ul))]:list-square [&>li>ul>li>ul>li>ul>li]:list-triangle",
      listitem: "relative",
    },
  },
  nodes: [ListNode, ListItemNode],
};

function EditorContent({
  titleInputRef,
}: {
  titleInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleTitleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        document.activeElement === titleInputRef.current
      ) {
        e.preventDefault();
        editor.focus();
      }
    };

    // Add event listener to the title input
    titleInputRef.current?.addEventListener("keydown", handleTitleKeyDown);

    return () => {
      // Clean up event listener
      titleInputRef.current?.removeEventListener("keydown", handleTitleKeyDown);
    };
  }, [editor, titleInputRef]);

  return (
    <div className="rounded-lg bg-background flex-1 flex flex-col">
      <div className="font-sans font-medium text-lg leading-[loose] text-foreground relative flex-1 flex flex-col">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="leading-relaxed [&_p]:leading-relaxed [&_li]:leading-relaxed p-4 pl-8 flex-1 outline-none focus:outline-none [&_p]:block [&_p]:my-0 [&_p]:rounded [&_p]:relative [&_p]:transition-colors [&_li]:relative [&_li]:transition-colors [&_p:hover]:before:content-['→'] [&_li:not(:has(li:hover)):hover]:before:content-['→'] [&_p]:before:absolute [&_li]:before:absolute [&_p]:before:left-[-1.5rem] [&_li]:before:left-[-2.5rem] [&_p]:before:opacity-0 [&_li]:before:opacity-0 [&_p:hover]:before:opacity-50 [&_li:not(:has(li:hover)):hover]:before:opacity-50 [&_p]:before:transition-opacity [&_li]:before:transition-opacity [&_p]:before:text-muted-foreground [&_li]:before:text-muted-foreground [&[contenteditable]]:caret-foreground [&[contenteditable]]:relative [&[contenteditable]]:z-10" />
          }
          placeholder={
            <div className="absolute left-8 top-[18px] text-muted-foreground pointer-events-none leading-[normal]">
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
  );
}

export function Editor() {
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the title input on mount
    titleInputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Title input */}
      <div className="mt-14 rounded-lg bg-background dark:bg-background">
        <input
          ref={titleInputRef}
          type="text"
          placeholder="Enter title..."
          autoFocus
          className="w-full pt-12 px-8 text-4xl font-extrabold bg-transparent border-none outline-none focus:outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Main editor */}
      <LexicalComposer initialConfig={editorConfig}>
        <EditorContent titleInputRef={titleInputRef} />
      </LexicalComposer>
    </div>
  );
}
