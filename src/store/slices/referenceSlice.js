export const createReferenceSlice = (set) => ({
  selectedReferencePaths: [],
  rootReferencePath: "",
  referencePaths: [], // New state to store paths from server

  setRootReferencePath: (path) => set({ rootReferencePath: path }),
  setSelectedReferencePaths: (paths) => set({ selectedReferencePaths: paths }),
  setReferencePaths: (paths) => set({ referencePaths: paths }), // New action to update referencePaths
});