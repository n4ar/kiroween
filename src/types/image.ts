/**
 * Image processor interface
 */
export interface IImageProcessor {
  compress(imageUri: string, quality: number): Promise<string>;
  autoCrop(imageUri: string): Promise<string>;
  resize(
    imageUri: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<string>;
}
