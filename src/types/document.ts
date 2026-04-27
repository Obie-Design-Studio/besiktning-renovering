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
}

export interface UploadDocumentState {
  error?: string
}
