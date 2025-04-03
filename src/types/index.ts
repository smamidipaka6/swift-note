export interface Note {
  id?: number; // Optional because it's auto-generated when a note is created
  title: string;
  content: string;
  createdAt: number; // Timestamp in milliseconds
  updatedAt: number; // Timestamp in milliseconds
  tags?: string[]; // Optional array of tags
}

// We'll use this for partial updates
export type NoteUpdate = Partial<Omit<Note, "id" | "createdAt">> & {
  updatedAt: number;
};

