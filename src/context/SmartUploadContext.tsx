'use client'

import { createContext, useContext } from 'react'

type ProcessFilesFn = (files: File[], preselectedSlug?: string) => void

interface SmartUploadContextValue {
  processFiles: ProcessFilesFn
}

const SmartUploadContext = createContext<SmartUploadContextValue>({
  processFiles: () => {},
})

// Module-level handler — SmartUpload registers itself here when it mounts.
// Safe because exactly one SmartUpload exists per page.
let _handler: ProcessFilesFn = () => {}

/** SmartUpload calls this on mount to wire up its processFiles implementation. */
export function registerUploadHandler(fn: ProcessFilesFn) {
  _handler = fn
  return () => {
    _handler = () => {}
  }
}

export function SmartUploadProvider({ children }: { children: React.ReactNode }) {
  return (
    <SmartUploadContext.Provider
      value={{ processFiles: (files, slug) => _handler(files, slug) }}
    >
      {children}
    </SmartUploadContext.Provider>
  )
}

export function useSmartUpload() {
  return useContext(SmartUploadContext)
}
