"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { NotesService } from "../services/db/notesService";
import type { Note, NoteUpdate } from "../types";

// Define the shape of our context state and methods
interface NotesContextType {
  // State
  notes: Note[];
  loading: boolean;
  error: Error | null;

  // Methods (CRUD Operations
  createNote: (note: Omit<Note, "id">) => Promise<Note>;
  updateNote: (
    id: number,
    updates: Omit<NoteUpdate, "updatedAt">
  ) => Promise<Note | null>;
  deleteNote: (id: number) => Promise<boolean>;
  refreshNotes: () => Promise<void>;
  searchNotes: (query: string) => Promise<void>;

  // Selected Note state for editing
  selectedNote: Note | null;
  setSelectedNote: (note: Note | null) => void;
}

// Create the Context with a Default Value
const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Provider Component Props
interface NotesProviderProps {
  children: ReactNode;
}

/*
 Provider Component - Wraps around the app and makes Notes context available
 to any child component that calls the useNotes hook
*/
export function NotesProvider({ children }: NotesProviderProps) {
  // State for Notes data
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Selected Note for editing
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Load notes when the component mounts
  useEffect(() => {
    // Define an async function to load the notes
    const loadNotes = async () => {
      try {
        setLoading(true);
        // Use our NotesService to get all notes, sorted by updatedAt
        const allNotes = await NotesService.getAllNotes();
        setNotes(allNotes);
        setError(null);
      } catch (err) {
        console.error("Error loading notes:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    // Call the loadNotes function
    loadNotes();
  }, []); // Empty dependency array means this runs once on mount

  /**
   * Refresh the notes list from the database
   */
  const refreshNotes = async () => {
    try {
      setLoading(true);
      const allNotes = await NotesService.getAllNotes();
      setNotes(allNotes);
      setError(null);
    } catch (err) {
      console.error("Error to refresh Notes: ", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search notes by title
   */
  const searchNotes = async (query: string) => {
    try {
      setLoading(true);

      if (!query.trim()) {
        // If query is empty, load all notes
        await refreshNotes();
        return;
      }

      const searchResults = await NotesService.searchNotesbyTitle(query);
      setNotes(searchResults);
      setError(null);
    } catch (err) {
      console.error("Failed to search notes:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new Note and refresh the Notes list
   */
  const createNote = async (note: Omit<Note, "id">) => {
    try {
      const newNote = await NotesService.createNote(note);

      // Optimistically update the UI without a full refresh
      setNotes((prevNotes) => [newNote, ...prevNotes]);
      return newNote;
    } catch (err) {
      console.log("Failed to create a new Note: ", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  /**
   * Update an existing Note and refresh the Notes list
   */
  const updateNote = async (
    id: number,
    updates: Omit<NoteUpdate, "updatedAt">
  ) => {
    try {
      const updatedNote = await NotesService.updateNote(id, updates);

      if (updatedNote) {
        // Optimistically update the UI without a full refresh
        setNotes((prevNotes) =>
          prevNotes.map((note) => (note.id === id ? updatedNote : note))
        );

        // Update selected Note if it's the one being edited
        if (selectedNote && selectedNote.id == id) {
          setSelectedNote(updatedNote);
        }
      }

      return updatedNote;
    } catch (err) {
      console.log("Failed to update the Note: ", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  /**
   * Delete a Note and refresh the Notes list
   */
  const deleteNote = async (id: number) => {
    try {
      const success = await NotesService.deleteNote(id);

      if (success) {
        // Optimistically update the UI without a full refresh
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

        // Clear selected Note if it's the one being deleted
        if (selectedNote && selectedNote.id === id) {
          setSelectedNote(null);
        }
      }

      return success;
    } catch (err) {
      console.log("Failed to delete the Note: ", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  // Create the value object that will be provided to consumers
  const value = {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes,
    searchNotes,
    selectedNote,
    setSelectedNote,
  };

  // Provide the Context Value to the children components
  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}

/**
 * Custom Hook that lets any component access the Notes Context
 */
export function useNotes() {
  const context = useContext(NotesContext);

  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }

  return context;
}
