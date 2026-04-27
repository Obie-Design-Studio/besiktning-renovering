import { createHash } from 'crypto'

/** Returns the SHA-256 hex digest of a File's raw bytes. */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return createHash('sha256').update(Buffer.from(buffer)).digest('hex')
}
