
import { openDB, DBSchema } from 'idb';

// Define the database schema
interface NotesDB extends DBSchema {
    notes: {
        key: number;
        value: {
            id?: number;
            title: string;
            content: string;
            createdAt: number;
            updatedAt: number;
            tags?: string[];
        };
        indexes: {
            "by-title": string;
            "by-updatedAt": number;
        }
    }
}

// Database Name & Version
const DB_NAME = "notes-app-db";
const DB_VERSION = 1;


// Create/Initialize the database
export const initDB = async () => {
    
    const db = await openDB<NotesDB>(DB_NAME, DB_VERSION, {

        upgrade(db) {
            // Create the notes object store
            const notesStore = db.createObjectStore("notes", {
                keyPath: "id",
                autoIncrement: true,
            });

            // Create indexes for common queries
            notesStore.createIndex("by-title", "title");
            notesStore.createIndex("by-updatedAt", "updatedAt");

            console.log("Database Initialization Complete");
        },
    });

    return db;
};


// Export a Singleton Instance of the database
let dbPromise: ReturnType<typeof initDB> | null = null;

export const getDB = async () => {
    if (!dbPromise) {
        dbPromise = initDB();
    }

    return dbPromise;
}









