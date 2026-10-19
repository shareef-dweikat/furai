import { create } from 'zustand'

interface SpaceDesignState {
  svgUrl: string | null
  fileName: string | null
  setSvgFile: (file: File) => void
}

export const useSpaceDesignStore = create<SpaceDesignState>((set, get) => ({
  svgUrl: null,
  fileName: null,
  setSvgFile: (file) => {
    const previous = get().svgUrl
    if (previous) URL.revokeObjectURL(previous)
    set({
      svgUrl: URL.createObjectURL(file),
      fileName: file.name,
    })
  },
}))
