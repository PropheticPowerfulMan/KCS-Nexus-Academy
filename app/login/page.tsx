export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"linear-gradient(145deg,#061426,#0b2b45)",color:"white",fontFamily:"Arial,sans-serif",padding:20}}>
    <section style={{width:"100%",maxWidth:430,padding:36,borderRadius:22,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.18)",boxShadow:"0 24px 80px rgba(0,0,0,.35)"}}>
      <p style={{color:"#38d6c2",fontWeight:800,letterSpacing:2,fontSize:12}}>KINSHASA CHRISTIAN SCHOOL</p>
      <h1 style={{fontSize:32,margin:"10px 0 6px"}}>KCS Nexus Academy</h1>
      <p style={{color:"#bfd0df",lineHeight:1.6}}>Connexion institutionnelle securisee<br/>Secure institutional sign-in</p>
      {error && <p style={{background:"#7f1d1d",padding:12,borderRadius:10}}>Identifiant ou mot de passe incorrect, ou acces non autorise.</p>}
      <form method="post" action="/api/auth/institutional-login" style={{display:"grid",gap:14,marginTop:24}}>
        <label style={{display:"grid",gap:7,fontWeight:700}}>Identifiant ou e-mail
          <input name="identifier" autoComplete="username" required style={{padding:14,borderRadius:10,border:"1px solid #567087",fontSize:16}} />
        </label>
        <label style={{display:"grid",gap:7,fontWeight:700}}>Mot de passe
          <input name="password" type="password" autoComplete="current-password" required style={{padding:14,borderRadius:10,border:"1px solid #567087",fontSize:16}} />
        </label>
        <button type="submit" style={{marginTop:8,padding:14,border:0,borderRadius:10,background:"#27c7b4",color:"#04151e",fontWeight:800,fontSize:16,cursor:"pointer"}}>Se connecter / Sign in</button>
      </form>
      <p style={{color:"#8fa8ba",fontSize:12,marginTop:22}}>Reserve aux enseignants et administrateurs KCS.</p>
    </section>
  </main>;
}
