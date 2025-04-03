"use client";

import SearchBar from "@/components/SearchBar";
import React, { useState, useEffect } from "react";
import DocCard from "@/components/DocCard";

import { useNotes } from "@/contexts/NotesContext"; // hook for NotesContext
import type { Note } from "@/types"; // type for Note



const HomePage = () => {

  const { notes, loading, error, searchNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");

  // Handler for Search Input
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await searchNotes(query);
  };


  return (
    <div className="flex flex-col items-center w-full h-screen">

      <div className="mt-16">
      <SearchBar onSearch={handleSearch} query={searchQuery} />
        {/* <SearchBar/> */}
      </div>

      {loading ? (
        <div className='mt-12'>Loading notes...</div>
      ) : error ? (
        <div className='mt-12 text-red-500'>Error: {error.message}</div>
      ) : notes.length === 0 ? (
        <div className='mt-12'>No notes found. Create your first note!</div>
      ) : (
        <div className='grid grid-cols-4 gap-x-8 gap-y-8 mt-12'>
          {notes.map((note) => (
            <DocCard
              key={note.id}
              title={note.title}
              content={note.content}
              noteId={note.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default HomePage;
