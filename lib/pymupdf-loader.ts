/**
 * PyMuPDF WASM Loader
 * Loads PyMuPDF from CDN for high-fidelity PDF operations
 */

const PYMUPDF_CDN = 'https://cdn.jsdelivr.net/npm/@bentopdf/pymupdf-wasm@0.11.16/';
const GS_CDN = 'https://cdn.jsdelivr.net/npm/@bentopdf/gs-wasm/assets/';

let cachedPyMuPDF: any = null;
let loadPromise: Promise<any> | null = null;

export async function loadPyMuPDF(): Promise<any> {
  if (cachedPyMuPDF) return cachedPyMuPDF;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const wrapperUrl = `${PYMUPDF_CDN}dist/index.js`;
      const module = await import(/* webpackIgnore: true */ wrapperUrl);

      if (typeof module.PyMuPDF !== 'function') {
        throw new Error('PyMuPDF module did not export expected PyMuPDF class.');
      }

      cachedPyMuPDF = new module.PyMuPDF({
        assetPath: `${PYMUPDF_CDN}assets/`,
        ghostscriptUrl: GS_CDN,
      });

      await cachedPyMuPDF.load();
      console.log('[PyMuPDF] Successfully loaded from CDN');
      return cachedPyMuPDF;
    } catch (error: any) {
      loadPromise = null;
      throw new Error(`Failed to load PyMuPDF from CDN: ${error.message}`);
    }
  })();

  return loadPromise;
}

export function clearPyMuPDFCache(): void {
  cachedPyMuPDF = null;
  loadPromise = null;
}
