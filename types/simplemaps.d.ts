declare global {
  interface Window {
    simplemaps_usmap: {
      load: (config: any) => void
      click_action: (id: string) => void
    }
    simplemaps_usmap_mapdata: {
      state_specific: Record<string, any>
    }
  }
}

export {}
