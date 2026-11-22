"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  Check,
  Download,
  Eye,
  LoaderCircle,
  Search,
  WifiOff,
  X,
} from "lucide-react";
const books = [
  {
    title: "A First Book in Algebra",
    author: "Wallace C. Boyden",
    file: "first-book-algebra.pdf",
  },
  {
    title: "A History of Mathematics",
    author: "Florian Cajori",
    file: "history-of-mathematics.pdf",
  },
  {
    title: "The Elements of Euclid",
    author: "Euclid · John Casey",
    file: "euclid-elements.pdf",
  },
  {
    title: "Le Tour du monde en 80 jours",
    author: "Jules Verne",
    file: "tour-du-monde.txt",
  },
];
export function AcademyLibrary({ lang }: { lang: "fr" | "en" }) {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<(typeof books)[number] | null>(null),
    [saved, setSaved] = useState<string[]>([]),
    [saving, setSaving] = useState(""),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    L = (fr: string, en: string) => (lang === "fr" ? fr : en);
  useEffect(() => {
    if ("caches" in window)
      caches
        .open("kcs-library-v1")
        .then((c) => c.keys())
        .then((keys) =>
          setSaved(
            keys.map((k) => new URL(k.url).pathname.split("/").pop() || ""),
          ),
        )
        .catch(() => {});
  }, []);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  async function save(file: string) {
    setSaving(file);
    setError("");
    try {
      if (!("caches" in window)) throw new Error();
      const cache = await caches.open("kcs-library-v1");
      await cache.add("/library/" + file);
      setSaved((v) => [...new Set([...v, file])]);
    } catch {
      setError(
        L(
          "Enregistrement hors connexion impossible. Réessayez avec une connexion stable.",
          "Unable to save offline. Retry with a stable connection.",
        ),
      );
    } finally {
      setSaving("");
    }
  }
  const shown = books.filter((b) =>
    (b.title + " " + b.author)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(
        query
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      ),
  );
  return (
    <section className="ac-panel">
      <div className="ac-section-title">
        <div>
          <h2>{L("Bibliothèque de référence", "Reference library")}</h2>
          <p>
            {L(
              "Ouvrages du domaine public. Ces ressources ne sont pas des données scolaires.",
              "Public-domain books. These reference resources are not school records.",
            )}
          </p>
        </div>
      </div>
      <label className="ac-search">
        <Search size={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L(
            "Rechercher un livre ou un auteur",
            "Search a book or author",
          )}
        />
      </label>
      {error && (
        <p className="ac-alert" role="alert">
          {error}
        </p>
      )}
      {shown.map((b) => (
        <article className="ac-library-row" key={b.file}>
          <BookOpen size={24} />
          <div>
            <h3>{b.title}</h3>
            <p>{b.author}</p>
          </div>
          <div className="ac-library-actions">
            <button
              className="ac-button ac-quiet"
              onClick={() => setSelected(b)}
            >
              <Eye size={15} />
              {L("Lire", "Read")}
            </button>
            <button
              className="ac-button ac-quiet"
              disabled={Boolean(saving) || saved.includes(b.file)}
              onClick={() => void save(b.file)}
            >
              {saving === b.file ? (
                <LoaderCircle className="ac-spin" size={15} />
              ) : saved.includes(b.file) ? (
                <Check size={15} />
              ) : (
                <WifiOff size={15} />
              )}{" "}
              {saved.includes(b.file)
                ? L("Disponible hors ligne", "Available offline")
                : L("Conserver hors ligne", "Save offline")}
            </button>
            <a
              className="ac-button ac-quiet"
              href={"/library/" + b.file}
              download
            >
              <ArrowDownToLine size={15} />
              {L("Télécharger", "Download")}
            </a>
          </div>
        </article>
      ))}
      {!shown.length && (
        <p className="ac-empty">
          {L("Aucun livre trouvé.", "No matching books.")}
        </p>
      )}
      <dialog
        ref={dialog}
        className="ac-dialog ac-book-reader"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <div className="ac-section-title">
              <div>
                <h2>{selected.title}</h2>
                <p>{selected.author}</p>
              </div>
              <button
                className="ac-icon"
                aria-label={L("Fermer", "Close")}
                onClick={() => dialog.current?.close()}
              >
                <X />
              </button>
            </div>
            <iframe title={selected.title} src={"/library/" + selected.file} />
            <p className="ac-footnote">
              {L(
                "Si votre appareil ne propose pas l’aperçu, téléchargez le livre pour l’ouvrir.",
                "If your device cannot preview this book, download it to open it.",
              )}
            </p>
            <a
              className="ac-button"
              href={"/library/" + selected.file}
              download
            >
              <Download size={16} />
              {L("Télécharger", "Download")}
            </a>
          </>
        )}
      </dialog>
    </section>
  );
}
