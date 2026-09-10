"use client";

import Image from "next/image";
import {
  BarChart3, Bell, BookOpen, Bot, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardCheck, FileCheck2, GraduationCap, Home, Languages, Library,
  LogOut, Menu, MessageCircle, Moon, Search, Settings, ShieldCheck, Sparkles,
  Sun, Target, TrendingUp, Users, X
} from "lucide-react";
import { useMemo, useState } from "react";
import { AcademyCourses, AcademySchedule, DigitalLibrary, InstallApp } from "./dashboard";
import type { AcademyContext } from "@/lib/academy-auth";

type Identity = { userId: string; orbitId: string; organizationId: string; role: string; displayName?: string };
type Icon = typeof Home;
type Item = { key: string; en: string; fr: string; icon: Icon; badge?: string };

const adminNav: Item[] = [
  { key:"overview", en:"Executive overview", fr:"Vue exécutive", icon:Home },
  { key:"curriculum", en:"Curriculum & standards", fr:"Programmes et standards", icon:Target, badge:"12" },
  { key:"courses", en:"Course catalog", fr:"Catalogue des cours", icon:BookOpen },
  { key:"calendar", en:"Daily timetable", fr:"Horaire quotidien", icon:CalendarDays },
  { key:"operations", en:"Academic operations", fr:"Opérations académiques", icon:ClipboardCheck, badge:"8" },
  { key:"faculty", en:"Faculty readiness", fr:"Suivi des enseignants", icon:Users },
  { key:"learners", en:"Learner success", fr:"Réussite des élèves", icon:GraduationCap },
  { key:"analytics", en:"Analytics & evidence", fr:"Analyses et preuves", icon:BarChart3 },
  { key:"library", en:"Digital library", fr:"Bibliothèque numérique", icon:Library },
  { key:"governance", en:"Quality & governance", fr:"Qualité et gouvernance", icon:ShieldCheck },
  { key:"ai", en:"Academy Intelligence", fr:"Intelligence Academy", icon:Sparkles }
];

const studentNav: Item[] = [
  { key:"overview", en:"My learning", fr:"Mon apprentissage", icon:Home },
  { key:"courses", en:"My courses", fr:"Mes cours", icon:BookOpen, badge:"7" },
  { key:"assignments", en:"Assignments", fr:"Devoirs", icon:FileCheck2, badge:"4" },
  { key:"assessments", en:"Assessments", fr:"Évaluations", icon:ClipboardCheck },
  { key:"progress", en:"My progress", fr:"Ma progression", icon:TrendingUp },
  { key:"library", en:"Digital library", fr:"Bibliothèque numérique", icon:Library },
  { key:"calendar", en:"Calendar", fr:"Calendrier", icon:CalendarDays },
  { key:"messages", en:"Messages", fr:"Messages", icon:MessageCircle, badge:"2" },
  { key:"ai", en:"Study coach AI", fr:"Coach détude IA", icon:Bot }
];

const adminModules: Record<string,{eyebrow:string;title:string;description:string;stats:string[][];actions:string[]}> = {
  curriculum:{eyebrow:"ACADEMIC ARCHITECTURE",title:"Curriculum & standards",description:"Map KCS learning outcomes, BJU resources, national requirements, and Christian worldview outcomes in one governed framework.",stats:[["Standards mapped","86%","Across 15 grade levels"],["Coverage gaps","14","Require department review"],["Reviews due","8","Before next teaching cycle"]],actions:["Open standards map","Review curriculum gaps","Compare grade progression"]},
  courses:{eyebrow:"LEARNING CATALOG",title:"Course catalog",description:"Govern every course, syllabus, prerequisite, learning sequence, and approved resource from one academic source of truth.",stats:[["Active courses","48","Current academic year"],["Syllabi approved","41","7 awaiting validation"],["Resource sets","126","KCS-approved materials"]],actions:["Create course","Review syllabus","Manage prerequisites"]},
  operations:{eyebrow:"ACADEMIC OPERATIONS",title:"Teaching and assessment operations",description:"Coordinate lesson readiness, assessment windows, moderation, grading completion, and intervention follow-up.",stats:[["Lessons ready","92%","For the next 7 days"],["Grading on time","88%","Across all departments"],["Open interventions","19","6 high priority"]],actions:["Open readiness board","Moderate assessments","Review intervention plans"]},
  faculty:{eyebrow:"INSTRUCTIONAL EXCELLENCE",title:"Faculty readiness",description:"Give instructional leaders evidence to coach teachers, share best practice, and protect teaching quality.",stats:[["Teachers active","27","Across all departments"],["Coaching cycles","11","Currently active"],["Shared practices","34","Approved exemplars"]],actions:["View teacher workspaces","Plan observation","Share exemplar"]},
  learners:{eyebrow:"WHOLE-LEARNER SUCCESS",title:"Learner success",description:"Understand mastery, engagement, attendance, and support needs without replacing professional human judgment.",stats:[["Learners monitored","245","K3 to Grade 12"],["On track","81%","Current learning cycle"],["Support plans","23","Owned and time-bound"]],actions:["Open mastery map","Review support cohort","Create success plan"]},
  analytics:{eyebrow:"EVIDENCE CENTER",title:"Analytics & evidence",description:"Move from numbers to verifiable evidence, trends, causes, and accountable academic decisions.",stats:[["Evidence signals","36","Updated this week"],["Growth trend","+7.4%","Across priority standards"],["Reports ready","9","For leadership review"]],actions:["Build leadership report","Compare cohorts","Inspect evidence trail"]},
  library:{eyebrow:"KCS KNOWLEDGE COMMONS",title:"Digital library governance",description:"Curate safe, licensed, grade-appropriate books and resources with clear ownership and offline availability.",stats:[["Approved resources","126","Books, media, and guides"],["Offline-ready","74","Optimized for low bandwidth"],["Awaiting review","12","Rights and quality checks"]],actions:["Browse library","Approve resources","Manage collections"]},
  governance:{eyebrow:"TRUST & QUALITY",title:"Quality and governance",description:"Maintain approval trails, publishing controls, role boundaries, academic integrity, and responsible AI standards.",stats:[["Controls healthy","96%","Last governance review"],["Pending approvals","8","Named owners assigned"],["Audit events","184","Traceable this month"]],actions:["Review approvals","Open audit trail","Manage academic policies"]},
  ai:{eyebrow:"KCS ACADEMY INTELLIGENCE",title:"Decision intelligence for school leaders",description:"Ask evidence-grounded questions, simulate academic scenarios, and create reviewable action plans.",stats:[["Insights ready","7","Human review required"],["Scenarios","4","No official data changed"],["Action plans","11","With owners and deadlines"]],actions:["Ask Academy AI","Explore scenario","Generate briefing"]}
};

const studentModules: Record<string,{eyebrow:string;title:string;description:string;stats:string[][];actions:string[]}> = {
  courses:{eyebrow:"MY COURSES",title:"Everything I am learning",description:"Open lessons, learning goals, teacher resources, and the next step for every course.",stats:[["Active courses","7","Current term"],["Lessons completed","38","6 this week"],["Next class","Mathematics","Today · 10:10"]],actions:["Continue mathematics","Open course map","View learning goals"]},
  assignments:{eyebrow:"MY WORK",title:"Assignments",description:"See what is due, understand the success criteria, submit work, and follow teacher feedback.",stats:[["Due soon","4","Next seven days"],["Submitted","18","This term"],["Feedback ready","3","Open and review"]],actions:["Open next assignment","Review feedback","Plan my week"]},
  assessments:{eyebrow:"CHECK MY LEARNING",title:"Assessments",description:"Prepare with clarity, complete assigned assessments, and understand results by skill.",stats:[["Upcoming","2","This month"],["Completed","9","Current term"],["Mastery checks","14","Low-stakes practice"]],actions:["Prepare for quiz","View assessment calendar","Practice a skill"]},
  progress:{eyebrow:"MY GROWTH",title:"Progress I can understand",description:"See strengths, skills to improve, teacher evidence, and the next actions in my learning plan.",stats:[["Overall mastery","78%","+6% this term"],["Strong skills","12","Across current courses"],["Focus skills","3","Practice plan available"]],actions:["Open mastery map","View my growth story","Start focus practice"]},
  library:{eyebrow:"KCS DIGITAL LIBRARY",title:"Read, research, and discover",description:"Find KCS-approved books and learning resources, including material available offline.",stats:[["Saved books","6","In my collection"],["Reading goal","72%","Monthly target"],["Offline books","4","Ready on this device"]],actions:["Browse the library","Continue reading","Open saved collection"]},
  calendar:{eyebrow:"MY SCHEDULE",title:"Calendar",description:"Keep classes, deadlines, assessments, and school events in one clear learning calendar.",stats:[["Today","5","Classes and activities"],["This week","4","Deadlines"],["Next event","Chapel","Tomorrow · 08:00"]],actions:["Open full calendar","Plan study time","Review deadlines"]},
  messages:{eyebrow:"SAFE COMMUNICATION",title:"Messages",description:"Receive class updates, teacher feedback, and school announcements in the right context.",stats:[["Unread","2","Teacher and school"],["Class threads","5","Current courses"],["Announcements","3","This week"]],actions:["Read new messages","Open class threads","View announcements"]},
  ai:{eyebrow:"STUDY COACH AI",title:"Learn with guidance, not shortcuts",description:"Ask for explanations, practice questions, study plans, and feedback while protecting academic integrity.",stats:[["Study plan","Ready","Based on my focus skills"],["Practice streak","5 days","Personal best: 9"],["Integrity mode","Active","Answers teach the process"]],actions:["Explain a concept","Build a study plan","Practice without answers"]}
};

function ModuleView({module,language,onAction}:{module:{eyebrow:string;title:string;description:string;stats:string[][];actions:string[]};language:"en"|"fr";onAction:(v:string)=>void}) {
  return <section className="role-module">
    <div className="role-module-head"><small>{module.eyebrow}</small><h1>{module.title}</h1><p>{module.description}</p></div>
    <div className="role-stat-grid">{module.stats.map(([label,value,note])=><article key={label}><small>{label}</small><b>{value}</b><p>{note}</p><span><TrendingUp/></span></article>)}</div>
    <div className="role-workbench"><div><small>{language==="en"?"PURPOSEFUL ACTIONS":"ACTIONS UTILES"}</small><h2>{language==="en"?"Move from insight to accountable action":"Passer de lanalyse à une action responsable"}</h2><p>{language==="en"?"Every action remains reviewable, role-scoped, and connected to academic evidence.":"Chaque action reste vérifiable, limitée au rôle et reliée aux preuves académiques."}</p></div><div>{module.actions.map(action=><button key={action} onClick={()=>onAction(action)}>{action}<ChevronRight/></button>)}</div></div>
  </section>;
}

export function RoleDashboard({identity,context}:{identity:Identity;context?:AcademyContext|null}) {
  const admin=["ADMIN","SUPER_ADMIN"].includes(identity.role);
  const nav=admin?adminNav:studentNav;
  const modules=admin?adminModules:studentModules;
  const [active,setActive]=useState("overview");
  const [language,setLanguage]=useState<"en"|"fr">("en");
  const [dark,setDark]=useState(false);
  const [menu,setMenu]=useState(false);
  const [query,setQuery]=useState("");
  const [toast,setToast]=useState("");
  const t=(en:string,fr:string)=>language==="en"?en:fr;
  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),2300)};
  const visible=useMemo(()=>nav.filter(x=>(language==="en"?x.en:x.fr).toLowerCase().includes(query.toLowerCase())),[nav,query,language]);
  const name=identity.displayName || (admin?t("KCS Administrator","Administrateur KCS"):t("KCS Learner","Élève KCS"));
  const current=nav.find(x=>x.key===active)??nav[0];
  const liveCourses=context?.courses??[];
  const liveAssignments=liveCourses.reduce((sum,course)=>sum+course.assignments.length,0);
  const population=context?.population;

  const overview=admin?<section className="role-overview">
    <div className="role-hero admin-hero"><div><small>KCS ACADEMY · LEADERSHIP COMMAND CENTER</small><h1>{t("Lead learning with clarity.","Piloter lapprentissage avec clarté.")}</h1><p>{t("A governed view of curriculum quality, teaching readiness, learner growth, and the actions that move KCS forward.","Une vue gouvernée de la qualité des programmes, de la préparation pédagogique, de la progression et des actions qui font avancer KCS.")}</p></div><button onClick={()=>setActive("analytics")}><BarChart3/>{t("Open evidence center","Ouvrir le centre de preuves")}</button></div>
    <div className="role-kpis">{[[String(population?.students??0),t("Learners","Élèves"),t("Official institutional profiles","Profils institutionnels officiels")],[String(population?.parents??0),t("Parents","Parents"),t("Across the KCS ecosystem","Dans tout ecosysteme KCS")],[String(population?.teachers??0),t("Teachers","Enseignants"),t("Active Nexus profiles","Profils Nexus actifs")],[String(population?.courses??0),t("Official courses","Cours officiels"),t("Created in KCS Nexus","Créés dans KCS Nexus")]].map(x=><article key={x[1]}><small>{x[1]}</small><b>{x[0]}</b><p>{x[2]}</p></article>)}</div>
    <div className="role-columns"><article><header><div><small>ACADEMIC PULSE</small><h2>{t("What needs leadership attention","Ce qui demande lattention de la direction")}</h2></div><button onClick={()=>setActive("analytics")}>{t("View all","Tout voir")}</button></header>{[["Grade 8 science standards","74% coverage","curriculum"],["Assessment moderation","8 reviews due","operations"],["Grade 11 mathematics","+9% mastery growth","learners"]].map(x=><button key={x[0]} onClick={()=>setActive(x[2])}><span><CheckCircle2/></span><p><b>{x[0]}</b><small>{x[1]}</small></p><ChevronRight/></button>)}</article><aside><small>KCS ACADEMY INTELLIGENCE</small><h2>{t("From school data to human decisions","Des données scolaires aux décisions humaines")}</h2><p>{t("Evidence is explained, decisions remain human, and every action has an owner.","Les preuves sont expliquées, les décisions restent humaines et chaque action a un responsable.")}</p><button onClick={()=>setActive("ai")}><Sparkles/>{t("Open intelligence","Ouvrir lintelligence")}</button></aside></div>
  </section>:<section className="role-overview">
    <div className="role-hero student-hero"><div><small>KCS ACADEMY · MY LEARNING JOURNEY</small><h1>{t("Learn deeply. Grow faithfully.","Apprendre en profondeur. Grandir avec fidélité.")}</h1><p>{t("Your courses, deadlines, progress, reading, and next best learning step  together in one calm workspace.","Tes cours, échéances, progrès, lectures et prochaine étape  réunis dans un espace clair.")}</p></div><button onClick={()=>setActive("courses")}><BookOpen/>{t("Continue learning","Continuer à apprendre")}</button></div>
    <div className="role-kpis">{[[String(liveCourses.length),t("Active courses","Cours actifs"),t("Official Nexus enrollments","Inscriptions officielles Nexus")],[String(liveAssignments),t("Assignments","Devoirs"),t("From assigned courses","Cours attribués")],[context?.profile?.grade??"—",t("Grade","Classe"),context?.profile?.section??""],[context?.profile?.studentNumber??"—",t("Student number","Matricule"),t("Verified identity","Identité vérifiée")]].map(x=><article key={x[1]}><small>{x[1]}</small><b>{x[0]}</b><p>{x[2]}</p></article>)}</div>
    <div className="role-columns"><article><header><div><small>TODAY</small><h2>{t("My next learning steps","Mes prochaines étapes")}</h2></div><button onClick={()=>setActive("calendar")}>{t("Calendar","Calendrier")}</button></header>{[["Mathematics","Continue quadratic equations","courses"],["English","Submit reading reflection","assignments"],["Biology","Prepare cells mastery check","assessments"]].map(x=><button key={x[0]} onClick={()=>setActive(x[2])}><span><CheckCircle2/></span><p><b>{x[0]}</b><small>{x[1]}</small></p><ChevronRight/></button>)}</article><aside><small>STUDY COACH AI</small><h2>{t("Understand the process, not just the answer","Comprendre la démarche, pas seulement la réponse")}</h2><p>{t("Get explanations, practice, and a study plan designed around your focus skills.","Obtiens des explications, des exercices et un plan adapté à tes compétences prioritaires.")}</p><button onClick={()=>setActive("ai")}><Bot/>{t("Open study coach","Ouvrir le coach")}</button></aside></div>
  </section>;

  return <div className={dark?"role-app role-dark":"role-app"}>
    <aside className={menu?"role-side open":"role-side"}>
      <div className="role-brand"><Image src="/kcs.jpg" width={42} height={42} alt="KCS"/><div><b>KCS NEXUS</b><small>ACADEMY</small></div><button onClick={()=>setMenu(false)}><X/></button></div>
      <div className="role-identity"><span>{admin?<ShieldCheck/>:<GraduationCap/>}</span><p><small>{admin?t("Administration","Administration"):t("Student workspace","Espace élève")}</small><b>{name}</b></p></div>
      <label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Find a workspace...","Trouver un espace...")}/></label>
      <nav>{visible.map(item=><button key={item.key} className={active===item.key?"active":""} onClick={()=>{setActive(item.key);setMenu(false)}}><item.icon/><span>{language==="en"?item.en:item.fr}</span>{item.badge&&<em>{item.badge}</em>}</button>)}</nav>
      <footer><button onClick={()=>show(t("Settings opened","Paramètres ouverts"))}><Settings/>{t("Settings","Paramètres")}</button><small>EXCELLENCE · INTEGRITY · SERVICE</small></footer>
    </aside>
    <main className="role-main">
      <header><button className="role-menu" onClick={()=>setMenu(true)}><Menu/></button><div><small>{admin?t("ADMINISTRATION","ADMINISTRATION"):t("STUDENT","ÉLÈVE")}</small><b>{language==="en"?current.en:current.fr}</b></div><div className="role-head-actions"><button onClick={()=>setLanguage(language==="en"?"fr":"en")}><Languages/><b>{language.toUpperCase()}</b></button><button onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</button><button onClick={()=>show(t("No critical notification","Aucune notification critique"))}><Bell/></button><form action="/api/auth/logout" method="post"><button aria-label="Logout"><LogOut/></button></form></div></header>
      <div className="role-content">{active==="overview"?overview:active==="library"?<DigitalLibrary note={show} language={language}/>:active==="calendar"?<AcademySchedule context={context} language={language}/>:active==="courses"&&!admin?<AcademyCourses context={context} language={language}/>:<ModuleView module={modules[active]} language={language} onAction={show}/>}</div>
    </main>
    <InstallApp language={language}/>{toast&&<div className="role-toast"><CheckCircle2/>{toast}</div>}
  </div>;
}
