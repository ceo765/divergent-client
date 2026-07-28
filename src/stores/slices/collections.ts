import * as api from "@/shared/api/client";
import type { AppStoreActions, StoreSlice } from "@/stores/types";

type CollectionsSlice = Pick<
  AppStoreActions,
  "loadCollections" | "addCollectionItem" | "editCollectionItem" | "removeCollectionItem" | "sendCollectionToGoal"
>;

export const createCollectionsSlice: StoreSlice<CollectionsSlice> = (set, get) => ({
  loadCollections: async () => {
    try {
      const items = await api.fetchCollections();
      set({ collections: items });
    } catch (err) {
      console.error(err);
    }
  },

  addCollectionItem: async (input) => {
    try {
      const item = await api.createCollectionItem(input);
      set({ collections: [item, ...get().collections] });
      return item;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  editCollectionItem: async (id, input) => {
    try {
      const updated = await api.updateCollectionItem(id, input);
      set({ collections: get().collections.map((c) => (c.id === id ? updated : c)) });
    } catch (err) {
      console.error(err);
    }
  },

  removeCollectionItem: async (id) => {
    try {
      await api.deleteCollectionItem(id);
      set({ collections: get().collections.filter((c) => c.id !== id) });
    } catch (err) {
      console.error(err);
    }
  },

  sendCollectionToGoal: async (id, goalId) => {
    try {
      const updated = await api.collectionToGoal(id, goalId);
      set({ collections: get().collections.map((c) => (c.id === id ? updated : c)) });
      await get().refreshAppData();
    } catch (err) {
      console.error(err);
    }
  },
});
