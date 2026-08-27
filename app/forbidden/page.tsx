import Link from "next/link";
export default function ForbiddenPage() { return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",fontFamily:"sans-serif"}}><section style={{textAlign:"center"}}><h1>403</h1><p>Academy access is not enabled for this role.<br/>Academy est interdit pour ce role.</p><Link href="/login">Return / Retour</Link></section></main>; }
