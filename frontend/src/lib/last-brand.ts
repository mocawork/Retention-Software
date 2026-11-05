/** Remembers the brand someone last opened, so "/" can take them straight back to it. */
const STORAGE_KEY = "ros.lastBrandId";

export function rememberBrand(brandId: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, brandId);
  } catch {
    // Storage blocked: "/" falls back to the first brand.
  }
}

export function lastBrandId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
