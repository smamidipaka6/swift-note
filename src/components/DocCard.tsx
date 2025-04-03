"use client";


import React from "react";
import { useNotes } from "@/contexts/NotesContext";
import { NotesService } from "../services/db/notesService";

interface DocCardProps {
  title: string;
  content: string;
  noteId?: number;
}

const DocCard = ({ title, content, noteId }: DocCardProps) => {
  
  const { setSelectedNote, deleteNote } = useNotes();

  // Function to handle clicking on a card (for editing)
  const handleCardClick = async () => {
    if (noteId) {
      // Fetch the full note and set it as selected
      const note = await NotesService.getNoteById(noteId);
      if (note) {
        setSelectedNote(note);
        // In a real app, you would navigate to an edit page or open a modal here
      }
    }
  };

  // Function to handle deleting a note
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering

    if (
      noteId &&
      window.confirm("Are you sure you want to delete this note?")
    ) {
      await deleteNote(noteId);
    }
  };

  return (
    <div className="bg-background p-4 border-foreground/10 shadow-sm hover:shadow-md hover:border-foreground/25 transition-all duration-300 ease-in-out h-48 w-64 group">
      <div className="flex justify-between items-start">
        <h2 className="text-lg text-card-foreground font-semibold mb-2 truncate flex-grow">
          {title}
        </h2>
        {noteId && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
            aria-label="Delete note"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
      <p className="text-foreground/60 group-hover:text-card-foreground transition-colors line-clamp-5">
        {content}
      </p>
      {/* <div className="border-b-2 border-foreground/10 mt-3"></div> */}
    </div>
  );
};

export default DocCard;
