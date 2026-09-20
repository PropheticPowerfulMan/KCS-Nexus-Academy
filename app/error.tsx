'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className='academy-error-state'>
      <section>
        <strong>Protection anti-écran vide</strong>
        <h1>La page Academy n’a pas pu être affichée.</h1>
        <p>Les données restent intactes. Relancez uniquement cette vue sécurisée.</p>
        <button type='button' onClick={reset}>Réessayer en toute sécurité</button>
      </section>
    </main>
  );
}
