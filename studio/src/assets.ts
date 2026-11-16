export function studioAsset(file: string) {
  return new URL(file, import.meta.url).href
}
