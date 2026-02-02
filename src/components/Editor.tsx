"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  HeadingNode,
  $createHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  TextNode,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useEffect, useRef, useState } from "react";

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

      // Numbered list shortcut (Cmd+Shift+9)
      if (event.metaKey && event.shiftKey && event.key === "9") {
        event.preventDefault();
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
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

// Text replacement patterns (add more here in the future)
const TEXT_REPLACEMENTS: Record<string, string> = {
  "->": "→",
  "<-": "←",
  "--": "—",
};

function TextReplacementPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register a transform that runs whenever a TextNode changes
    const removeTransform = editor.registerNodeTransform(TextNode, (node) => {
      const text = node.getTextContent();

      // Check each replacement pattern
      for (const [pattern, replacement] of Object.entries(TEXT_REPLACEMENTS)) {
        const index = text.indexOf(pattern);
        if (index !== -1) {
          // Calculate the new text with replacement
          const newText =
            text.slice(0, index) +
            replacement +
            text.slice(index + pattern.length);

          // Get current selection to preserve cursor position
          const selection = $getSelection();
          let cursorOffset: number | null = null;

          if ($isRangeSelection(selection)) {
            const anchor = selection.anchor;
            if (anchor.key === node.getKey()) {
              // Calculate where cursor should be after replacement
              // If cursor is after the pattern, adjust for the length difference
              if (anchor.offset > index + pattern.length) {
                // Cursor is after the replacement - adjust by length difference
                cursorOffset =
                  anchor.offset - (pattern.length - replacement.length);
              } else if (anchor.offset > index) {
                // Cursor is inside or right after the pattern - move to end of replacement
                cursorOffset = index + replacement.length;
              } else {
                // Cursor is before the pattern - keep same position
                cursorOffset = anchor.offset;
              }
            }
          }

          // Replace the text
          node.setTextContent(newText);

          // Restore cursor position
          if (cursorOffset !== null && $isRangeSelection(selection)) {
            const newSelection = $getSelection();
            if ($isRangeSelection(newSelection)) {
              newSelection.anchor.set(node.getKey(), cursorOffset, "text");
              newSelection.focus.set(node.getKey(), cursorOffset, "text");
            }
          }

          // Only process one replacement per transform to avoid issues
          break;
        }
      }
    });

    return () => {
      removeTransform();
    };
  }, [editor]);

  return null;
}

// Heading patterns: "# " -> h1, "## " -> h2, "### " -> h3
const HEADING_PATTERNS: { pattern: string; tag: HeadingTagType }[] = [
  { pattern: "### ", tag: "h3" },
  { pattern: "## ", tag: "h2" },
  { pattern: "# ", tag: "h1" },
];

function HeadingShortcutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Listen for text node transforms to detect heading patterns
    const removeTransform = editor.registerNodeTransform(TextNode, (node) => {
      const text = node.getTextContent();
      const parent = node.getParent();

      // Only process if we're in a paragraph (not already a heading or list)
      if (!parent || parent.getType() !== "paragraph") return;

      // Check each heading pattern (longer patterns first to avoid "# " matching "## ")
      for (const { pattern, tag } of HEADING_PATTERNS) {
        if (text.startsWith(pattern)) {
          // Get the text after the pattern
          const newText = text.slice(pattern.length);

          // Create a new heading node
          const headingNode = $createHeadingNode(tag);

          // Create a new text node with the content (without the # prefix)
          const textNode = new TextNode(newText);
          headingNode.append(textNode);

          // Replace the paragraph with the heading
          parent.replace(headingNode);

          // Set cursor to end of the text
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.anchor.set(textNode.getKey(), newText.length, "text");
            selection.focus.set(textNode.getKey(), newText.length, "text");
          }

          // Only process one pattern
          break;
        }
      }
    });

    return () => {
      removeTransform();
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
    heading: {
      h1: "text-3xl font-bold mt-6 mb-2",
      h2: "text-2xl font-bold mt-5 mb-2",
      h3: "text-xl font-semibold mt-4 mb-2",
    },
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
      ol: "list-outside ml-8 [&>li]:text-lg [&>li>ol]:text-base [&>li:not(:has(ol))]:list-decimal [&>li>ol>li:not(:has(ol))]:list-[lower-alpha] [&>li>ol>li>ol>li:not(:has(ol))]:list-[lower-roman] [&>li>ol>li>ol>li>ol>li:not(:has(ol))]:list-[upper-alpha] [&>li>ol>li>ol>li>ol>li>ol>li]:list-[upper-roman]",
      ul: "list-outside ml-8 [&>li]:text-lg [&>li>ul]:text-base [&>li:not(:has(ul))]:list-big-disc [&>li>ul>li:not(:has(ul))]:list-circle [&>li>ul>li>ul>li:not(:has(ul))]:list-square [&>li>ul>li>ul>li>ul>li]:list-triangle",
      listitem: "relative",
    },
  },
  nodes: [ListNode, ListItemNode, HeadingNode],
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
            <ContentEditable className="selection:bg-foreground selection:text-background leading-relaxed [&_p]:leading-relaxed [&_li]:leading-relaxed p-4 pl-8 flex-1 outline-none focus:outline-none [&_p]:block [&_p]:my-0 [&_p]:rounded [&_p]:relative [&_p]:transition-colors [&_li]:relative [&_li]:transition-colors [&_p:hover]:before:content-['→'] [&_li:not(:has(li:hover)):hover]:before:content-['→'] [&_p]:before:absolute [&_li]:before:absolute [&_p]:before:left-[-1.5rem] [&_li]:before:left-[-2.5rem] [&_p]:before:opacity-0 [&_li]:before:opacity-0 [&_p:hover]:before:opacity-50 [&_li:not(:has(li:hover)):hover]:before:opacity-50 [&_p]:before:transition-opacity [&_li]:before:transition-opacity [&_p]:before:text-muted-foreground [&_li]:before:text-muted-foreground [&[contenteditable]]:caret-foreground [&[contenteditable]]:relative [&[contenteditable]]:z-10" />
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
        <TextReplacementPlugin />
        <HeadingShortcutPlugin />
      </div>
    </div>
  );
}

export function Editor() {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [titleEnterPressed, setTitleEnterPressed] = useState(false);

  useEffect(() => {
    // Focus the title input on mount
    titleInputRef.current?.focus();
  }, []);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setTitleEnterPressed(true);
      // The original event listener in EditorContent will handle focusing the editor
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Title input */}
      <div className="mt-14 rounded-lg bg-background dark:bg-background">
        <input
          ref={titleInputRef}
          type="text"
          placeholder={titleEnterPressed ? "" : "Enter title..."}
          autoFocus
          className="selection:bg-foreground selection:text-background w-full pt-12 px-8 text-4xl font-extrabold bg-transparent border-none outline-none focus:outline-none text-foreground placeholder:text-muted-foreground"
          onKeyDown={handleTitleKeyDown}
        />
      </div>

      {/* Main editor */}
      <LexicalComposer initialConfig={editorConfig}>
        <EditorContent titleInputRef={titleInputRef} />
      </LexicalComposer>
    </div>
  );
}
