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
  $getRoot,
  LexicalEditor,
  COMMAND_PRIORITY_HIGH,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useEffect, useRef, useState } from "react";
import { NotesService } from "@/services/db/notesService";

// Constants for localStorage keys
const CURRENT_NOTE_ID_KEY = "swift-note-current-id";
const TAB_ID_KEY = "swift-note-tab-id";
const LAST_CLEANUP_KEY = "swift-note-last-cleanup";
const TAB_EXPIRY_DAYS = 7; // Number of days before a tab entry is considered stale

// const STRIKETHROUGH_SHORTCUT: LexicalCommand<KeyboardEvent> = createCommand();

// Helper function to check if save shortcut is being pressed
function isSaveShortcut(event: KeyboardEvent | React.KeyboardEvent): boolean {
  // Mac: Command+S, Windows/Linux: Ctrl+S
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
}

function ShortcutPlugin({
  handleSaveNote,
}: {
  handleSaveNote: () => Promise<void>;
}) {
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
      // Save shortcut (Cmd+S on Mac, Ctrl+S on Windows/Linux)
      if (isSaveShortcut(event)) {
        event.preventDefault(); // Prevent browser's save dialog
        handleSaveNote();
        return;
      }

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
  }, [editor, handleSaveNote]);

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
  handleSaveNote,
}: {
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  handleSaveNote: () => Promise<void>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleTitleKeyDown = (e: KeyboardEvent) => {
      // Handle Save shortcut in title field
      if (isSaveShortcut(e)) {
        e.preventDefault();
        handleSaveNote();
        return;
      }

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
  }, [editor, titleInputRef, handleSaveNote]);

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
        <ShortcutPlugin handleSaveNote={handleSaveNote} />
      </div>
    </div>
  );
}

// Helper function to clean up old tab entries in localStorage
function cleanupLocalStorage() {
  // Check if we've cleaned up recently (don't do this on every page load)
  const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
  const now = Date.now();

  // // Only clean up if it's been more than a day since the last cleanup
  // if (lastCleanup && now - parseInt(lastCleanup, 10) < 24 * 60 * 60 * 1000) {
  //   return;
  // }

  console.log("Running localStorage Cleanup (on component mount)");

  // Perform cleanup
  const tabPrefix = `${TAB_ID_KEY}-`;
  const expiryTime = now - TAB_EXPIRY_DAYS * 60 * 1000; // 24 * 60
  const itemsToRemove = [];

  // Identify stale tab entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(tabPrefix)) {
      // Extract the timestamp from the tab ID (the first part before the dash)
      const tabId = key.substring(tabPrefix.length);
      const timestampStr = tabId.split("-")[0];

      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        // If the tab ID was created before the expiry time, mark it for removal
        if (!isNaN(timestamp) && timestamp < expiryTime) {
          itemsToRemove.push(key);
        }
      }
    }
  }

  // Remove stale entries
  itemsToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Update the last cleanup timestamp
  localStorage.setItem(LAST_CLEANUP_KEY, now.toString());

  if (itemsToRemove.length > 0) {
    console.log(
      `Cleaned up ${itemsToRemove.length} stale tab entries from localStorage`
    );
  }
}

export function Editor() {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [titleEnterPressed, setTitleEnterPressed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null);

  // Generate a unique tab ID, stored in sessionStorage to persist across refreshes but not across tabs
  const [tabId] = useState<string>(() => {
    // Try to get existing tab ID from sessionStorage
    const existingTabId = sessionStorage.getItem(TAB_ID_KEY);
    if (existingTabId) {
      return existingTabId;
    }

    // Generate new tab ID if none exists
    const newTabId =
      Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem(TAB_ID_KEY, newTabId);
    return newTabId;
  });

  const [keyboardShortcutActive, setKeyboardShortcutActive] = useState(false);

  // Reference to the Lexical editor instance
  const editorRef = useRef<LexicalEditor | null>(null);

  useEffect(() => {
    // Check if this is a page refresh or new tab
    // On first mount or refresh, check localStorage for the current note ID
    const storedTabNoteId = localStorage.getItem(`${TAB_ID_KEY}-${tabId}`);

    if (storedTabNoteId) {
      const id = parseInt(storedTabNoteId, 10);
      if (!isNaN(id) && id > 0) {
        loadExistingNote(id);
      }
    }

    // Focus the title input on mount
    titleInputRef.current?.focus();

    // Run cleanup on component mount
    cleanupLocalStorage();

    // Clean up on unmount
    return () => {
      // We don't need to clean up sessionStorage as it's bound to the tab
      // and will be automatically cleared when the tab is closed
    };
  }, [tabId]);

  // Update tab-specific note ID in localStorage when currentNoteId changes
  useEffect(() => {
    if (currentNoteId !== null) {
      // Store the current note ID specifically for this tab
      localStorage.setItem(`${TAB_ID_KEY}-${tabId}`, currentNoteId.toString());

      // Also update the global current note ID (for navigation purposes if needed)
      localStorage.setItem(CURRENT_NOTE_ID_KEY, currentNoteId.toString());
    }
  }, [currentNoteId, tabId]);

  // Load note data when editing an existing note
  const loadExistingNote = async (id: number) => {
    try {
      const note = await NotesService.getNoteById(id);
      if (note) {
        // Set the title
        if (titleInputRef.current) {
          titleInputRef.current.value = note.title;
        }

        // Set the content
        if (editorRef.current) {
          editorRef.current.update(() => {
            const root = $getRoot();
            root.clear();

            // Split the content by newlines and create paragraph nodes for each line
            const lines = note.content.split("\n");
            lines.forEach((line) => {
              if (line.trim() !== "") {
                const paragraph = $createParagraphNode();
                paragraph.append($createTextNode(line));
                root.append(paragraph);
              } else {
                // Add empty paragraph for blank lines
                root.append($createParagraphNode());
              }
            });

            // If there's no content, add an empty paragraph
            if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
              root.append($createParagraphNode());
            }
          });
        }

        // Store the current note ID
        setCurrentNoteId(id);
      }
    } catch (error) {
      console.error("Failed to load note:", error);
    }
  };

  // Reset save status after showing success/error message
  useEffect(() => {
    if (saveStatus === "saved" || saveStatus === "error") {
      const timer = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Effect to update document title when notes are loaded
  useEffect(() => {
    if (titleInputRef.current && titleInputRef.current.value) {
      // Get current title value
      const titleValue = titleInputRef.current.value;
      // Update document title (truncate if too long)
      document.title = titleValue
        ? `${
            titleValue.length > 50
              ? titleValue.substring(0, 50) + "..."
              : titleValue
          } - Swift Note`
        : "Swift Note";
    } else {
      // Reset to default if no title
      document.title = "Swift Note";
    }
  }, [currentNoteId]); // Re-run when note changes

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Save shortcut in title field
    if (isSaveShortcut(e)) {
      e.preventDefault();
      handleSaveNote();
      return;
    }

    if (e.key === "Enter") {
      setTitleEnterPressed(true);
      // The original event listener in EditorContent will handle focusing the editor
    }
  };

  // Update the title when input changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titleValue = e.target.value;
    // Update document title (truncate if too long)
    document.title = titleValue
      ? `${
          titleValue.length > 50
            ? titleValue.substring(0, 50) + "..."
            : titleValue
        } - Swift Note`
      : "Swift Note";
  };

  // Function to handle saving note to IndexedDB
  const handleSaveNote = async () => {
    try {
      // Show keyboard shortcut visual feedback
      setKeyboardShortcutActive(true);
      setTimeout(() => setKeyboardShortcutActive(false), 200);

      // Set status to saving
      setSaveStatus("saving");

      // Get the title from input
      const title = titleInputRef.current?.value || "Untitled Note";

      // Get content from editor
      let content = "";
      if (editorRef.current) {
        editorRef.current.update(() => {
          const root = $getRoot();
          content = root.getTextContent();
        });
      }

      let savedNote;

      // If currentNoteId exists, update the note
      if (currentNoteId) {
        savedNote = await NotesService.updateNote(currentNoteId, {
          title,
          content,
        });
      } else {
        // Otherwise create a new note
        savedNote = await NotesService.createNote({
          title,
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Store the new note ID
        if (savedNote && savedNote.id) {
          setCurrentNoteId(savedNote.id);
        }
      }

      // Show success status
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to save note:", error);
      setSaveStatus("error");
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
          onChange={handleTitleChange}
        />
      </div>

      {/* Main editor */}
      <LexicalComposer initialConfig={editorConfig}>
        <EditorContent
          titleInputRef={titleInputRef}
          handleSaveNote={handleSaveNote}
        />
        {/* Store editor reference */}
        <StoreEditorReference editorRef={editorRef} />
      </LexicalComposer>

      {/* Fixed position save status indicator */}
      {saveStatus !== "idle" && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-md bg-green-500/60 dark:bg-green-500/20 z-50 flex items-center justify-center">
          {saveStatus === "saving" && (
            <div className="flex items-center text-muted-foreground">
              <svg
                className="animate-spin mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="flex items-center text-green-800 dark:text-green-500">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Saved</span>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center text-red-500">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Error saving</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component to store editor reference
function StoreEditorReference({
  editorRef,
}: {
  editorRef: React.MutableRefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return null;
}
