import * as api from "@/shared/api/client";
import type { AppStoreActions, StoreSlice } from "@/stores/types";

type NotesSlice = Pick<
  AppStoreActions,
  "loadNotes" | "addNote" | "editNote" | "removeNote"
>;

export const createNotesSlice: StoreSlice<NotesSlice> = (set, get) => ({
  loadNotes: async () => {
    try {
      const notes = await api.fetchNotes();
      set({ notes });
    } catch (err) {
      console.error(err);
    }
  },

  addNote: async (input) => {
    try {
      const note = await api.createNote(input);
      set({ notes: [note, ...get().notes] });
      return note;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  editNote: async (id, input) => {
    try {
      const updated = await api.updateNote(id, input);
      set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) });
    } catch (err) {
      console.error(err);
    }
  },

  removeNote: async (id) => {
    try {
      await api.deleteNote(id);
      set({ notes: get().notes.filter((n) => n.id !== id) });
    } catch (err) {
      console.error(err);
    }
  },
});
