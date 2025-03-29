import { create } from "zustand";

interface Realisation {
  idRealisation: string;
  title: string;
}

interface FilteredRealisationsState {
  filteredRealisations: Realisation[];
  setFilteredRealisations: (realisations: Realisation[]) => void;
}

export const useFilteredRealisationsStore = create<FilteredRealisationsState>(
  (set) => ({
    filteredRealisations: [],
    setFilteredRealisations: (realisations) =>
      set({ filteredRealisations: realisations }),
  })
);
