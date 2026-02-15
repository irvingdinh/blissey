export interface Attachment {
  id: string;
  category: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath: string | null;
}
