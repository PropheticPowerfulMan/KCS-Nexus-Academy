"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, RefreshCw, ZoomIn } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
type Lang = "fr" | "en";
let engine: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | undefined;
export async function prepareBookReaderOffline() {
  engine ??= import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await engine;
  const worker = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  pdf.GlobalWorkerOptions.workerSrc = worker;
  if ("caches" in window) {
    const response = await fetch(worker, { cache: "force-cache" });
    if (!response.ok) throw new Error("Reader worker unavailable");
    await (await caches.open("kcs-library-reader-v1")).put(worker, response);
  }
  return pdf;
}
async function bookResponse(url: string, signal: AbortSignal) {
  try {
    if (url.startsWith("/library/") && "caches" in window) {
      try {
        const cached = await (await caches.open("kcs-library-v1")).match(url);
        if (cached) return cached;
      } catch { /* A public book can still load when browser storage is unavailable. */ }
    }
    const response = await fetch(url, { signal, credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Book unavailable");
    return response;
  } catch (error) {
    if (signal.aborted) throw error;
    const cached = url.startsWith("/library/") && "caches" in window ? await (await caches.open("kcs-library-v1")).match(url) : undefined;
    if (!cached) throw error;
    return cached;
  }
}
export function AcademyBookReader({ file, title, lang, format }: { file: string; title: string; lang: Lang; format?: "pdf" | "text" }) {
  const L = (fr: string, en: string) => lang === "fr" ? fr : en;
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null), [text, setText] = useState("");
  const [page, setPage] = useState(1), [zoom, setZoom] = useState(1), [width, setWidth] = useState(600);
  const [busy, setBusy] = useState(true), [rendering, setRendering] = useState(false), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null), viewport = useRef<HTMLDivElement>(null), task = useRef<RenderTask | null>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(180, element.clientWidth - 24)));
    observer.observe(element);
    setWidth(Math.max(180, element.clientWidth - 24));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    let loading: ReturnType<typeof import("pdfjs-dist").getDocument> | undefined;
    let disposed = false;
    setBusy(true); setFailed(false); setDocument(null); setText(""); setPage(1); setZoom(1);
    void (async () => {
      const response = await bookResponse(file.startsWith("/") ? file : "/library/" + file, abort.signal);
      if (format === "text" || file.endsWith(".txt")) {
        const value = await response.text();
        if (!disposed) setText(value);
      } else {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("Invalid book format");
        engine ??= import("pdfjs-dist/legacy/build/pdf.mjs");
        const pdf = await engine;
        pdf.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
        loading = pdf.getDocument({ data: bytes, useSystemFonts: true });
        const value = await loading.promise;
        if (!disposed) setDocument(value);
      }
    })().catch(() => { if (!disposed) setFailed(true); }).finally(() => { if (!disposed) setBusy(false); });
    return () => { disposed = true; abort.abort(); task.current?.cancel(); void loading?.destroy().catch(() => {}); };
  }, [file, format, retry]);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let disposed = false;
    setRendering(true);
    void (async () => {
      const sheet = await document.getPage(page);
      if (disposed || !canvas.current) return;
      const base = sheet.getViewport({ scale: 1 });
      const scale = Math.min(width, 1200) / base.width * zoom;
      const view = sheet.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(10000000 / (view.width * view.height)));
      const element = canvas.current, context = element.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      task.current?.cancel();
      element.width = Math.ceil(view.width * ratio); element.height = Math.ceil(view.height * ratio);
      element.style.width = view.width + "px"; element.style.height = view.height + "px";
      const current = sheet.render({ canvas: element, canvasContext: context, viewport: view, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
      task.current = current;
      await current.promise;
      if (!disposed) setFailed(false);
    })().catch(error => { if (!disposed && error?.name !== "RenderingCancelledException") setFailed(true); }).finally(() => { if (!disposed) setRendering(false); });
    return () => { disposed = true; task.current?.cancel(); };
  }, [document, page, zoom, width]);
  return <div className="ac-reader" aria-busy={busy || rendering}>
    {document && <div className="ac-reader-toolbar">
      <button className="ac-icon" aria-label={L("Page précédente", "Previous page")} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ArrowLeft size={17}/></button>
      <label>{L("Page", "Page")} <input aria-label={L("Numéro de page", "Page number")} type="number" min={1} max={document.numPages} value={page} onChange={event => { const n = Number(event.target.value); if (Number.isInteger(n) && n >= 1 && n <= document.numPages) setPage(n); }}/> <span>{L("sur", "of")} {document.numPages}</span></label>
      <button className="ac-icon" aria-label={L("Page suivante", "Next page")} disabled={page >= document.numPages} onClick={() => setPage(p => p + 1)}><ArrowRight size={17}/></button>
      <label className="ac-reader-zoom"><ZoomIn size={16}/><select aria-label={L("Zoom du livre", "Book zoom")} value={zoom} onChange={e => setZoom(Number(e.target.value))}><option value={1}>{L("Ajuster à la largeur", "Fit width")}</option><option value={1.25}>125 %</option><option value={1.5}>150 %</option><option value={2}>200 %</option></select></label>
      {rendering && <LoaderCircle className="ac-spin" size={16} aria-label={L("Affichage de la page", "Rendering page")}/>}
    </div>}
    {busy && <p className="ac-loading" role="status"><LoaderCircle className="ac-spin" size={19}/>{L("Ouverture du livre…", "Opening book…")}</p>}
    {failed && <div className="ac-alert" role="alert"><p>{L("Le livre ne peut pas être affiché pour le moment. Réessayez ou utilisez le téléchargement.", "This book cannot be displayed right now. Retry or use the download button.")}</p><button className="ac-button ac-quiet" onClick={() => setRetry(n => n + 1)}><RefreshCw size={16}/>{L("Réessayer", "Retry")}</button></div>}
    <div className="ac-reader-viewport" ref={viewport}>
      {document && <canvas ref={canvas} role="img" aria-label={title + " · " + L("page", "page") + " " + page} data-book-page={page}/>}
      {text && <pre className="ac-reader-text" aria-label={title}>{text}</pre>}
    </div>
  </div>;
}
