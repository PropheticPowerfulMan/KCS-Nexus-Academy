"use client";
import {useMemo,useState} from "react";
import {BookOpen,CalendarDays,ChevronDown,ChevronLeft,ChevronRight,ClipboardCheck,Search,ShieldCheck,Users} from "lucide-react";
import type {AcademyContext} from "@/lib/academy-auth";
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const pageSize=8;
export function AcademyCourses({context,language}:{context?:AcademyContext|null;language:"en"|"fr"}){
  const en=language==="en",courses=context?.courses??[];
  const [query,setQuery]=useState(""),[grade,setGrade]=useState(""),[page,setPage]=useState(0);
  const grades=useMemo(()=>Array.from(new Set(courses.map(c=>c.grade).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),[courses]);
  const filtered=useMemo(()=>{const tokens=normalize(query).split(/\s+/).filter(Boolean);return courses.filter(c=>(!grade||c.grade===grade)&&tokens.every(t=>normalize([c.name,c.code,c.grade,c.teacherName].join(" ")).includes(t)));},[courses,query,grade]);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),current=Math.min(page,pages-1);
  return <section className="academy-live-courses academy-classes" data-no-translate>
    <div className="module-head"><div><small>KCS NEXUS ACADEMY · {en?"TEACHING":"ENSEIGNEMENT"}</small><h1>{en?"My classes":"Mes classes"}</h1><p>{en?"Your assigned courses, learners and teaching schedule, synchronized with Nexus.":"Vos cours, élèves et horaires d’enseignement, synchronisés avec Nexus."}</p></div><span className="academy-count"><BookOpen size={16}/>{courses.length} {en?"courses":"cours"}</span></div>
    <div className="academy-class-tools">
      <label className="academy-class-search"><Search size={18}/><span className="sr-only">{en?"Search courses":"Rechercher les cours"}</span><input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder={en?"Search by subject, class or course code…":"Matière, classe ou code du cours…"} /></label>
      <label><span className="sr-only">{en?"Filter by class":"Filtrer par classe"}</span><select value={grade} onChange={e=>{setGrade(e.target.value);setPage(0);}}><option value="">{en?"All classes":"Toutes les classes"}</option>{grades.map(g=><option key={g}>{g}</option>)}</select></label>
      {(query||grade)&&<button className="academy-quiet" onClick={()=>{setQuery("");setGrade("");setPage(0);}}>{en?"Reset":"Réinitialiser"}</button>}
    </div>
    <p className="academy-result-count" role="status">{filtered.length} {en?"courses found":"cours trouvés"}</p>
    {!context?<div className="academy-data-state"><ShieldCheck/><h2>{en?"Institutional data unavailable":"Données institutionnelles indisponibles"}</h2><p>{en?"Reload to retry the connection to the official course registry.":"Rechargez pour réessayer la connexion au registre officiel des cours."}</p></div>:!filtered.length?<div className="academy-data-state"><BookOpen/><h2>{en?"No matching course":"Aucun cours correspondant"}</h2><p>{courses.length?(en?"Try another subject or class.":"Essayez une autre matière ou classe."):(en?"Courses assigned in Nexus appear here automatically.":"Les cours attribués dans Nexus apparaissent ici automatiquement.")}</p></div>:
    <div className="academy-course-grid">{filtered.slice(current*pageSize,(current+1)*pageSize).map(course=><article className="academy-course-card" key={course.id}>
      <div className="academy-course-card-head"><span className="academy-course-icon"><BookOpen size={22}/></span><div><small>{course.grade} {course.code&&"· "+course.code}</small><h2>{course.name}</h2></div></div>
      {course.description&&<p className="academy-course-description">{course.description}</p>}
      <div className="academy-course-facts"><span><Users/><b>{course.enrolledStudents??0}</b>{en?" learners":" élèves"}</span><span><ClipboardCheck/><b>{course.assignments?.length??0}</b>{en?" tasks":" devoirs"}</span><span><CalendarDays/><b>{course.schedules?.length??0}</b>{en?" sessions":" séances"}</span></div>
      {course.teacherName&&<p className="academy-course-teacher">{en?"Teacher":"Enseignant"} · <b>{course.teacherName}</b></p>}
      <details className="academy-course-details"><summary>{en?"Schedule and assignments":"Horaires et devoirs"}<ChevronDown size={16}/></summary>
        <h3>{en?"Teaching schedule":"Horaire du cours"}</h3>{course.schedules?.length?<ul>{course.schedules.map(slot=><li key={slot.id}><span>{slot.day}</span><b>{slot.startTime}–{slot.endTime}</b><span>{slot.room||"—"}</span></li>)}</ul>:<p>{en?"No published session for this course.":"Aucune séance publiée pour ce cours."}</p>}
        <h3>{en?"Assignments":"Devoirs"}</h3>{course.assignments?.length?<ul>{course.assignments.map(task=><li key={task.id}><span>{task.title}</span><b>{task.maxScore} {en?"points":"points"}</b></li>)}</ul>:<p>{en?"No assignment published yet.":"Aucun devoir publié pour le moment."}</p>}
      </details>
      <div className="academy-course-source"><ShieldCheck size={13}/>{en?"Official Nexus records":"Registre officiel Nexus"}</div>
    </article>)}</div>}
    {pages>1&&<nav className="academy-pagination" aria-label={en?"Course pages":"Pages des cours"}><button disabled={current===0} onClick={()=>setPage(current-1)} aria-label={en?"Previous page":"Page précédente"}><ChevronLeft size={17}/></button><span>{current+1} / {pages}</span><button disabled={current+1>=pages} onClick={()=>setPage(current+1)} aria-label={en?"Next page":"Page suivante"}><ChevronRight size={17}/></button></nav>}
  </section>;
}
