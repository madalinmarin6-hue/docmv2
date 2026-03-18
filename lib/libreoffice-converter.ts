/**
 * LibreOffice WASM Converter Wrapper
 * Uses @matbee/libreoffice-converter for high-fidelity Word/Excel/PPT → PDF
 */

let converterInstance: any = null;
let initialized = false;
let initializing = false;

export interface LoadProgress {
  phase: 'loading' | 'initializing' | 'converting' | 'complete' | 'ready';
  percent: number;
  message: string;
}

export type ProgressCallback = (progress: LoadProgress) => void;

const LIBREOFFICE_PATH = '/libreoffice-wasm/';

export async function initializeConverter(onProgress?: ProgressCallback): Promise<void> {
  if (initialized) return;
  if (initializing) {
    while (initializing) await new Promise(r => setTimeout(r, 100));
    return;
  }
  initializing = true;

  try {
    onProgress?.({ phase: 'loading', percent: 0, message: 'Loading LibreOffice conversion engine...' });

    const { WorkerBrowserConverter } = await import('@matbee/libreoffice-converter/browser');

    converterInstance = new WorkerBrowserConverter({
      sofficeJs: `${LIBREOFFICE_PATH}soffice.js`,
      sofficeWasm: `${LIBREOFFICE_PATH}soffice.wasm.gz`,
      sofficeData: `${LIBREOFFICE_PATH}soffice.data.gz`,
      sofficeWorkerJs: `${LIBREOFFICE_PATH}soffice.worker.js`,
      browserWorkerJs: `${LIBREOFFICE_PATH}browser.worker.global.js`,
      verbose: false,
      onProgress: (info: { phase: string; percent: number; message: string }) => {
        if (onProgress && !initialized) {
          onProgress({
            phase: info.phase as LoadProgress['phase'],
            percent: info.percent,
            message: `Loading conversion engine (${Math.round(info.percent)}%)...`,
          });
        }
      },
      onReady: () => { console.log('[LibreOffice] Ready!'); },
      onError: (error: Error) => { console.error('[LibreOffice] Error:', error); },
    });

    await converterInstance.initialize();
    initialized = true;
    onProgress?.({ phase: 'ready', percent: 100, message: 'Conversion engine ready!' });
  } finally {
    initializing = false;
  }
}

export async function convertToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  await initializeConverter(onProgress);
  if (!converterInstance) throw new Error('Converter not initialized');

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  const result = await converterInstance.convert(uint8Array, {
    outputFormat: 'pdf',
    inputFormat: ext,
  }, file.name);

  const data = new Uint8Array(result.data);
  return new Blob([data], { type: result.mimeType });
}

export function isConverterReady(): boolean {
  return initialized && converterInstance !== null;
}
