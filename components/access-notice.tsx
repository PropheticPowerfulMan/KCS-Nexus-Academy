"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
export function AccessNotice({ retry }: { retry?: () => void }) {
  const [fr, setFr] = useState(false),
    [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      setFr(localStorage.getItem("academy-language") === "fr");
      setDark(localStorage.getItem("academy-theme") === "dark");
    } catch {}
  }, []);
  return (
    <main className={"ac-login" + (dark ? " ac-dark" : "")}>
      <header>
        <a className="ac-brand" href="https://kinshasachristianschool.org">
          <img src="/kcs.jpg" alt="KCS" />
          <span>
            <b>ACADEMY</b>
            <small>KCS ORBIT ECOSYSTEM</small>
          </span>
        </a>
        <button className="ac-icon" onClick={() => setFr(!fr)}>
          {fr ? "EN" : "FR"}
        </button>
      </header>
      <section className="ac-access-card">
        <span className="ac-course-glyph">
          <ShieldCheck size={28} />
        </span>
        <p className="ac-eyebrow">KCS NEXUS ACADEMY</p>
        <h1>
          {retry
            ? fr
              ? "Votre espace est momentanément indisponible."
              : "Your workspace is temporarily unavailable."
            : fr
              ? "Un espace réservé aux comptes autorisés."
              : "A workspace for authorized school accounts."}
        </h1>
        <p>
          {retry
            ? fr
              ? "Réessayez lorsque la connexion est rétablie. Aucune donnée n’a été remplacée par des exemples."
              : "Retry when your connection is restored. No records have been replaced with examples."
            : fr
              ? "Connectez-vous avec votre compte institutionnel élève, enseignant ou administrateur. Contactez l’école si vous avez besoin d’aide."
              : "Sign in with your institutional student, teacher or administrator account. Contact the school if you need help."}
        </p>
        {retry ? (
          <button className="ac-button" onClick={retry}>
            <RefreshCw size={17} />
            {fr ? "Réessayer" : "Retry"}
          </button>
        ) : (
          <a className="ac-button" href="/login">
            {fr ? "Se connecter" : "Sign in"}
          </a>
        )}
        <a className="ac-link" href="https://kinshasachristianschool.org">
          <ArrowLeft size={16} />
          {fr ? "Retour à Nexus AI" : "Back to Nexus AI"}
        </a>
      </section>
    </main>
  );
}
