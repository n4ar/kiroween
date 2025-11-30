/**
 * Image processor interface
 */
export interface IImageProcessor {
  compress(imageUri: string, quality: number): Promise<string>;
  autoCrop(imageUri: string): Promise<{ uri: string; cropped: boolean }>;
  resize(
    imageUri: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<string>;
}
