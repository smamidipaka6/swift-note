
// CRUD Operations Wrapper for IndexedDB

import { getDB } from "./index";
import type {Note, NoteUpdate} from "../../types";


/**
 * Notes Service - provides CRUD operations for notes using IndexedDB
 */
export const NotesService = {

    /**
     * Create a new Note
     * @param note - the Note to create (without an id)
     * @returns - the created Note with the auto-assigned id
     */
    async createNote(note: Omit<Note, "id">): Promise<Note> {

        const db = await getDB();
        const timestamp = Date.now();

        // Ensure timestamps are set
        const noteToCreate: Omit<Note, "id"> = {
            ...note,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        // Add this Note to the database and get the auto-generated id
        const id = await db.add("notes", noteToCreate);

        // Return the full created note with the id
        return {
            ...noteToCreate,
            id,
        };
    },


    /**
     * Update an existing Note
     * @param id - the Note id
     * @param updates - the fields to update on the Note
     * @returns - the updated Note or null if the Note does not exist
     */
    async updateNote(id: number, updates: Omit<NoteUpdate, "updatedAt">): Promise<Note | null> {

        const db = await getDB();

        // Start a transaction for consistency
        const tx = db.transaction("notes", "readwrite");
        const store = tx.objectStore("notes");

        // Get the current note based on the id
        const existingNote = await store.get(id);
        if (!existingNote) {
            await tx.done;
            console.log("This Note does not exist!!")
            return null;
        }

        // Apply the Updates to the existingNote
        const updatedNote = {
            ...existingNote,
            ...updates,
            updatedAt: Date.now(), // make sure to update the timestamp
        };

        // Save the changes
        await store.put(updatedNote);
        await tx.done; // close session

        return updatedNote;
    },

    /**
     * Delete a Note by its id
     * @param id - the Note id
     * @returns - True if the Note was deleted, False if it did not exist
     */
    async deleteNote(id: number): Promise<boolean> {

        const db = await getDB();

        // Check if the Note exists
        const currentNote = await db.get("notes", id);
        if (!currentNote) {
            console.log("This Note does not exist!!")
            return false;
        }

        // Delete the Note
        await db.delete("notes", id);
        return true;
    },


    /**
     * Get a Note using its id
     * @param id - the Note id
     * @returns - the Note with the given id OR undefined if not found
     */
    async getNoteById(id: number): Promise<Note | undefined> {

        const db = await getDB();
        return db.get("notes", id);
    },

    /**
     * Get ALL Notes, optionally sorted by updatedAt
     * @param limit - optional limit on number of notes to return
     * @param sortByUpdated - optional flag whether to sort by updatedAt, newest first (defaults to true)
     * @returns - Array of all available Notes given the optional filters
     */
    async getAllNotes(limit?: number, sortByUpdated: boolean = true): Promise<Note[]> {

        const db = await getDB();

        if (sortByUpdated) {
            // Use the updatedAt index for sorting
            const notes = await db.getAllFromIndex(
                "notes",
                "by-updatedAt",
                IDBKeyRange.lowerBound(0),
                limit,
            );

            return notes.reverse();  // Reverse to get the newest first
        }

        // No sorting, just return all notes up to the limit if provided
        return db.getAll("notes", undefined, limit);
    },
    

    /**
     * Search Notes by title
     * @param query - the search query
     * @param limit - optional limit on number of Notes to return
     * @returns - array of matching Notes
     */
    async searchNotesbyTitle(query: string, limit?: number): Promise<Note[]> {

        const db = await getDB();
        const notes = await db.getAllFromIndex(
            "notes",
            "by-title"
        );

        // Filter notes that include the query string in the title (case-insensitive)
        const filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase())
        );

        // Return the filtered notes, limited by the optional limit
        return limit ? filteredNotes.slice(0, limit) : filteredNotes;
    },

};
    

    


