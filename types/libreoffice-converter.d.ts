declare module '@matbee/libreoffice-converter/browser' {
  export class WorkerBrowserConverter {
    constructor(options: {
      sofficeJs: string
      sofficeWasm: string
      sofficeData: string
      sofficeWorkerJs: string
      browserWorkerJs: string
      verbose?: boolean
      onProgress?: (info: { phase: string; percent: number; message: string }) => void
      onReady?: () => void
      onError?: (error: Error) => void
    })
    initialize(): Promise<void>
    convert(
      data: Uint8Array,
      options: { outputFormat: string; inputFormat: string },
      filename: string
    ): Promise<{ data: ArrayBuffer; mimeType: string }>
  }
}
