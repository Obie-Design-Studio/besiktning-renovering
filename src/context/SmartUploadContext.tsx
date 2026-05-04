'use client'

import { createContext, useContext } from 'react'

type ProcessFilesFn = (files: File[], preselectedSlug?: string) => void
type OpenPanelFn = (preselectedSlug?: string) => void

interface SmartUploadContextValue {
  processFiles: ProcessFilesFn
  openPanel: OpenPanelFn
}

const SmartUploadContext = createContext<SmartUploadContextValue>({
  processFiles: () => {},
  openPanel: () => {},
})

// Module-level handlers — SmartUpload registers itself here when it mounts.
// Safe because exactly one SmartUpload exists per page.
let _processFilesHandler: ProcessFilesFn = () => {}
let _openPanelHandler: OpenPanelFn = () => {}

/** SmartUpload calls this on mount to wire up its implementations. */
export function registerUploadHandler(
  processFiles: ProcessFilesFn,
  openPanel: OpenPanelFn,
) {
  _processFilesHandler = processFiles
  _openPanelHandler = openPanel
  return () => {
    _processFilesHandler = () => {}
    _openPanelHandler = () => {}
  }
}

export function SmartUploadProvider({ children }: { children: React.ReactNode }) {
  return (
    <SmartUploadContext.Provider
      value={{
        processFiles: (files, slug) => _processFilesHandler(files, slug),
        openPanel: (slug) => _openPanelHandler(slug),
      }}
    >
      {children}
    </SmartUploadContext.Provider>
  )
}

export function useSmartUpload() {
  return useContext(SmartUploadContext)
}
