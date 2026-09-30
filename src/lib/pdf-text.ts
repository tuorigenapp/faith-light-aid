/** Extrae el texto de un PDF en el navegador (para el Cerebro ORÍGEN). */
export async function extractPdfText(file: File, onProgress?: (page: number, total: number) => void) {
  const pdfjs = await import("pdfjs-dist");
  // El worker viaja con el paquete; Vite lo resuelve como URL.
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) parts.push(text);
    onProgress?.(i, doc.numPages);
  }
  await doc.cleanup();
  return parts.join("\n\n");
}
