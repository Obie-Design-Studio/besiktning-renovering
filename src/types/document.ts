export type FileSource = 'upload' | 'link'

export type UploaderName = 'Tobias' | 'Palmens byggservice'

export interface DocumentUpload {
  id: string
  document_item_slug: string
  file_url: string
  file_name: string
  file_source: FileSource
  upload_title: string
  upload_description: string
  uploader_name: UploaderName
  uploaded_at: string
  /** AI-suggested slug when the document appears to be filed under the wrong section. Null = no suggestion. */
  suggested_slug?: string | null
}

export interface UploadDocumentState {
  error?: string
}
