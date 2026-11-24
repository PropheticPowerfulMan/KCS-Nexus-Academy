"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  LibraryBig,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Moon,
  PanelLeftClose,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import type {
  AcademyContext,
  AcademyIdentity,
  PlannerContext,
  PlannerPlan,
} from "@/lib/academy-auth";
import { AcademyLibrary } from "./academy-library";
import { NexusReturnLink } from "./nexus-return-link";
type Lang = "en" | "fr";
type Tab =
  | "overview"
  | "courses"
  | "assignments"
  | "planner"
  | "calendar"
  | "library"
  | "settings";
const nexus = "https://kinshasachristianschool.org",
  days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  frenchDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const text = (fr: string, en: string, l: Lang) => (l === "fr" ? fr : en);
const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function usePreferences() {
  const [lang, setLang] = useState<Lang>("en"),
    [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      setLang(localStorage.getItem("academy-language") === "fr" ? "fr" : "en");
      setDark(localStorage.getItem("academy-theme") === "dark");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("academy-language", lang);
      localStorage.setItem("academy-theme", dark ? "dark" : "light");
    } catch {}
  }, [lang, dark]);
  return { lang, setLang, dark, setDark };
}
function Empty({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="ac-empty">
      <Layers3 size={28} />
      <h3>{title}</h3>
      {detail && <p>{detail}</p>}
    </div>
  );
}
function DateText({ date, lang }: { date: string; lang: Lang }) {
  const d = new Date(date);
  return (
    <>
      {Number.isNaN(d.getTime())
        ? "—"
        : d.toLocaleDateString(lang === "fr" ? "fr-CD" : "en-GB", {
            timeZone: "Africa/Kinshasa",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
    </>
  );
}
function Install({ lang }: { lang: Lang }) {
  const [prompt, setPrompt] = useState<
    | (Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      })
    | null
  >(null);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setIos(
      !window.matchMedia("(display-mode: standalone)").matches &&
        !(navigator as Navigator & { standalone?: boolean }).standalone &&
        (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
          (/Macintosh/i.test(navigator.userAgent) &&
            navigator.maxTouchPoints > 1)),
    );
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as typeof prompt);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  return prompt ? (
    <button
      className="ac-button ac-quiet"
      onClick={async () => {
        await prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
      }}
    >
      <ArrowDownToLine size={16} />
      {text("Installer Academy", "Install Academy", lang)}
    </button>
  ) : ios ? (
    <details className="ac-ios-install">
      <summary>{text("Installer Academy", "Install Academy", lang)}</summary>
      <p>
        {text(
          "Dans Safari, ouvrez Partager, puis choisissez « Sur l’écran d’accueil ».",
          "In Safari, open Share, then choose Add to Home Screen.",
          lang,
        )}
      </p>
    </details>
  ) : null;
}
export function AcademyWorkspace({
  identity,
  initialContext,
}: {
  identity: AcademyIdentity;
  initialContext: AcademyContext | null;
}) {
  const [menuQuery, setMenuQuery] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const { lang, setLang, dark, setDark } = usePreferences(),
    [tab, setTab] = useState<Tab>("overview"),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [context, setContext] = useState(initialContext),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [courseId, setCourseId] = useState(""),
    [gradeFilter, setGradeFilter] = useState(""),
    [page, setPage] = useState(1),
    [day, setDay] = useState(() =>
      ((day: string) => (days.includes(day) ? day : "Monday"))(
        new Date().toLocaleDateString("en-US", {
          timeZone: "Africa/Kinshasa",
          weekday: "long",
        }),
      ),
    ),
    [planner, setPlanner] = useState<PlannerContext | null>(null),
    [plannerBusy, setPlannerBusy] = useState(false),
    [plannerError, setPlannerError] = useState(false),
    [opening, setOpening] = useState(false),
    [selectedPlan, setSelectedPlan] = useState<PlannerPlan | null>(null),
    [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const requestVersion = useRef(0),
    modalRef = useRef<HTMLDialogElement>(null),
    courseRef = useRef<HTMLDialogElement>(null),
    refreshLock = useRef(false),
    scope = useRef({
      year: initialContext?.academicYear || "",
      semester: initialContext?.semester || 1,
    });
  const student = identity.role === "STUDENT",
    admin = ["ADMIN", "SUPER_ADMIN"].includes(identity.role),
    L = (fr: string, en: string) => text(fr, en, lang);
  const courses = context?.courses || [],
    allAssignments = courses.flatMap((c) =>
      c.assignments.map((a) => ({
        ...a,
        courseId: c.id,
        courseName: c.name,
        grade: c.grade,
      })),
    ),
    learnerIds = new Set(
      courses.flatMap((c) => (c.learners || []).map((s) => s.id)),
    );
  const today = new Date().toLocaleDateString("en-US", {
      timeZone: "Africa/Kinshasa",
      weekday: "long",
    }),
    schedule = context?.dailySchedule || [],
    todaySchedule = schedule.filter((s) => s.day === today);
  const filteredCourses = courses.filter(
      (c) =>
        (!gradeFilter || c.grade === gradeFilter) &&
        normalize([c.name, c.grade, c.code, c.teacherName].join(" ")).includes(
          normalize(query),
        ),
    ),
    assignments = allAssignments.filter(
      (a) =>
        (!courseId || a.courseId === courseId) &&
        normalize(a.title + " " + a.courseName + " " + a.grade).includes(
          normalize(query),
        ),
    );
  const nav = [
    {
      id: "overview",
      label: L("Vue d’ensemble", "Overview"),
      icon: LayoutDashboard,
    },
    {
      id: "courses",
      label: student
        ? L("Mes cours", "My courses")
        : L("Mes classes", "My classes"),
      icon: GraduationCap,
    },
    {
      id: "assignments",
      label: L("Devoirs et évaluations", "Assignments"),
      icon: ClipboardCheck,
    },
    ...(!student
      ? [{ id: "planner", label: "Eduplanner", icon: BookOpen }]
      : []),
    {
      id: "calendar",
      label: L("Emploi du temps", "Timetable"),
      icon: CalendarDays,
    },
    { id: "library", label: L("Bibliothèque", "Library"), icon: LibraryBig },
    { id: "settings", label: L("Préférences", "Preferences"), icon: Settings2 },
  ];
  const nexusPath = (part: string) =>
    nexus +
    (admin
      ? "/admin/" +
        (part === "assignments" || part === "courses"
          ? "teacher-reports"
          : part === "messages"
            ? "communications"
            : part)
      : student
        ? "/portal/student/" + part
        : "/portal/teacher/" + part);
  async function refresh(
    year = scope.current.year,
    semester = scope.current.semester,
  ) {
    const version = ++requestVersion.current;
    setBusy(true);
    setError("");
    scope.current = { year, semester };
    try {
      const r = await fetch(
        "/api/context?year=" +
          encodeURIComponent(year) +
          "&semester=" +
          semester,
        { cache: "no-store", signal: AbortSignal.timeout(25000) },
      );
      if (r.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!r.ok) throw new Error();
      const body = await r.json();
      if (version === requestVersion.current) {
        setContext(body.data);
        scope.current = {
          year: body.data.academicYear || year,
          semester: body.data.semester || semester,
        };
      }
    } catch {
      if (version === requestVersion.current)
        setError(
          L(
            "Connexion interrompue. La dernière vue reste affichée ; actualisez avant de vous fier à ces données.",
            "Connection interrupted. The last view remains visible; refresh before relying on these records.",
          ),
        );
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }
  async function loadPlanner() {
    setPlannerBusy(true);
    setPlannerError(false);
    try {
      const r = await fetch("/api/eduplanner", {
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) throw new Error();
      setPlanner(await r.json());
    } catch {
      setPlannerError(true);
    } finally {
      setPlannerBusy(false);
    }
  }
  async function openPlanner() {
    setOpening(true);
    setError("");
    try {
      const r = await fetch("/api/eduplanner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) throw new Error();
      const b = await r.json();
      window.location.assign(b.url);
    } catch {
      setError(
        L(
          "Eduplanner est temporairement indisponible. Aucun compte ni document n’a été modifié.",
          "Eduplanner is temporarily unavailable. No account or document has been changed.",
        ),
      );
      setOpening(false);
    }
  }
  useEffect(() => {
    if (!initialContext) void refresh();
    const onFocus = () => {
      if (!document.hidden && !refreshLock.current) {
        refreshLock.current = true;
        void refresh().finally(() => {
          refreshLock.current = false;
        });
      }
    };
    const timer = window.setInterval(onFocus, 120000);
    window.addEventListener("online", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", onFocus);
    };
  }, []);
  useEffect(() => {
    if (tab === "planner" && !planner && !plannerBusy) void loadPlanner();
  }, [tab]);
  useEffect(() => {
    setQuery("");
    setCourseId("");
    setGradeFilter("");
    setPage(1);
  }, [tab]);
  useEffect(() => {
    setPage(1);
  }, [query, gradeFilter, context?.academicYear, context?.semester]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  useEffect(() => {
    if (selectedPlan) modalRef.current?.showModal();
  }, [selectedPlan]);
  useEffect(() => {
    if (selectedCourse) courseRef.current?.showModal();
  }, [selectedCourse]);
  const title = nav.find((n) => n.id === tab)?.label || "Academy",
    available = Boolean(context),
    sync = context?.syncedAt;
  return (
    <div
      data-academy-ready={ready || undefined}
      className={
        "ac-app" + (dark ? " ac-dark" : "") + (collapsed ? " ac-collapsed" : "")
      }
    >
      {mobile && (
        <button
          className="ac-scrim"
          aria-label={L("Fermer le menu", "Close menu")}
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={"ac-sidebar" + (mobile ? " ac-open" : "")}
        aria-label={L("Navigation principale", "Main navigation")}
      >
        <a className="ac-brand" href="/">
          <img src="/kcs.jpg" alt="KCS" />
          <span>
            <b>ACADEMY</b>
            <small>KCS ORBIT ECOSYSTEM</small>
          </span>
        </a>
        <div className="ac-role">
          <span className="ac-dot" />
          <span>
            {student
              ? L("Espace élève", "Student workspace")
              : admin
                ? L("Direction académique", "Academic leadership")
                : L("Espace enseignant", "Teacher workspace")}
          </span>
        </div>
        <div className="ac-menu-finder">
          <div className="ac-menu-caption"><span>{L("Votre espace", "Your workspace")}</span><span>{nav.length}</span></div>
          <label className="ac-menu-search"><Search size={16}/><input type="search" value={menuQuery} onChange={e => setMenuQuery(e.target.value)} placeholder={L("Trouver une rubrique…", "Find a section…")} aria-label={L("Rechercher dans le menu", "Search menu")} autoComplete="off"/>{menuQuery && <button className="ac-menu-clear" aria-label={L("Effacer la recherche", "Clear search")} onClick={() => setMenuQuery("")}><X size={14}/></button>}</label>
        </div>
        <nav>
          {nav.filter(n => normalize(n.label).includes(normalize(menuQuery))).map((n) => (
            <button
              key={n.id}
              title={n.label}
              aria-label={n.label}
              disabled={!ready}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => {
                setMobile(false);
                setMenuQuery("");
                setTab(n.id as Tab);
              }}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "assignments" &&
                available &&
                allAssignments.length > 0 && <i>{allAssignments.length}</i>}
            </button>
          ))}
        </nav>
        <div className="ac-sidebar-bottom">
          <NexusReturnLink language={lang} role={identity.role} />
          <button
            className="ac-collapse"
            aria-label={collapsed ? L("Agrandir le menu", "Expand menu") : L("Réduire le menu", "Collapse menu")}
            title={collapsed ? L("Agrandir le menu", "Expand menu") : L("Réduire le menu", "Collapse menu")}
            onClick={() => { setMenuQuery(""); setCollapsed(!collapsed); }}
          >
            <PanelLeftClose size={17} />
            <span>{collapsed ? L("Agrandir le menu", "Expand menu") : L("Réduire le menu", "Collapse menu")}</span>
          </button>
          <form
            action="/api/auth/logout"
            method="post"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch("/api/auth/logout", {
                  method: "POST",
                  signal: AbortSignal.timeout(12000),
                });
                if (!response.ok) throw new Error();
                window.location.replace("/login");
              } catch {
                setError(
                  L(
                    "Déconnexion impossible pour le moment. Réessayez lorsque la connexion revient.",
                    "Unable to sign out right now. Retry when your connection is restored.",
                  ),
                );
              }
            }}
          >
            <button type="submit">
              <LogOut size={17} />
              <span>{L("Déconnexion", "Sign out")}</span>
            </button>
          </form>
        </div>
      </aside>
      <div className="ac-stage">
        <header className="ac-topbar">
          <div className="ac-breadcrumb">
            <button
              className="ac-icon ac-menu"
              disabled={!ready}
              aria-busy={!ready}
              onClick={() => setMobile((value) => !value)}
              aria-label={L("Afficher le menu", "Show menu")}
            >
              {ready ? <Menu /> : <LoaderCircle className="ac-spin" />}
            </button>
            <span>
              Academy <ChevronRight size={13} />
              <b>{title}</b>
            </span>
          </div>
          <div className="ac-top-actions">
            <button
              className="ac-icon"
              aria-label={L("Changer de langue", "Change language")}
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
            >
              {lang === "en" ? "FR" : "EN"}
            </button>
            <button
              className="ac-icon"
              aria-label={L("Changer de thème", "Change theme")}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="ac-avatar">
              {context?.dashboardAvatar ? (
                <img
                  src={
                    context.dashboardAvatar.startsWith("/")
                      ? nexus + context.dashboardAvatar
                      : context.dashboardAvatar
                  }
                  alt=""
                />
              ) : (
                (context?.displayName || identity.displayName || "K").charAt(0)
              )}
            </span>
          </div>
        </header>
        <main className="ac-main">
          <section className="ac-page-heading">
            <div>
              <p className="ac-eyebrow">
                {L(
                  "APPRENDRE · ENSEIGNER · PROGRESSER",
                  "LEARN · TEACH · GROW",
                )}
              </p>
              <h1>
                {tab === "overview"
                  ? L("Bienvenue, ", "Welcome, ") +
                    (context?.displayName || identity.displayName || "KCS")
                  : title}
              </h1>
              <p>
                {L(
                  "Votre école, vos cours et vos outils dans un même espace.",
                  "Your school, your courses and your tools in one workspace.",
                )}
              </p>
            </div>
            <button
              className="ac-button ac-quiet"
              disabled={busy}
              onClick={() => void refresh()}
            >
              <RefreshCw size={16} className={busy ? "ac-spin" : ""} />
              {L("Actualiser", "Refresh")}
            </button>
          </section>
          <section
            className="ac-scope"
            aria-label={L("Période scolaire", "Academic period")}
          >
            <label>
              {L("Année scolaire", "Academic year")}
              <select
                value={context?.academicYear || ""}
                disabled={busy || !context?.calendars?.length}
                onChange={(e) =>
                  void refresh(e.target.value, context?.semester || 1)
                }
              >
                {!context?.calendars?.length && (
                  <option value="">
                    {L("Calendrier indisponible", "Calendar unavailable")}
                  </option>
                )}
                {context?.calendars?.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              {L("Semestre", "Semester")}
              <select
                value={context?.semester || 1}
                disabled={busy || !available}
                onChange={(e) =>
                  void refresh(context?.academicYear, Number(e.target.value))
                }
              >
                <option value={1}>{L("Semestre 1", "Semester 1")}</option>
                <option value={2}>{L("Semestre 2", "Semester 2")}</option>
              </select>
            </label>
            <div className="ac-source">
              <ShieldCheck size={17} />
              <span>
                {L("Registres officiels Nexus", "Official Nexus records")}
                <small>
                  {sync ? (
                    <>
                      <DateText date={sync} lang={lang} /> ·{" "}
                      {new Date(sync).toLocaleTimeString(lang, {
                        timeZone: "Africa/Kinshasa",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      KIN
                    </>
                  ) : (
                    L(
                      "En attente de synchronisation",
                      "Awaiting synchronization",
                    )
                  )}
                </small>
              </span>
            </div>
          </section>
          {error && (
            <div className="ac-alert" role="alert">
              {error}
            </div>
          )}
          {!available && (
            <div className="ac-alert" role="status">
              {L(
                "Les données officielles ne sont pas disponibles. Aucun chiffre de démonstration n’est affiché.",
                "Official records are unavailable. No demonstration figures are displayed.",
              )}
            </div>
          )}
          {tab === "overview" && (
            <>
              <section className="ac-hero">
                <div>
                  <span className="ac-pill">KCS NEXUS ACADEMY</span>
                  <h2>
                    {student
                      ? L(
                          "Votre apprentissage commence ici.",
                          "Your learning starts here.",
                        )
                      : L(
                          "Plus de clarté. Plus de temps pour enseigner.",
                          "More clarity. More time to teach.",
                        )}
                  </h2>
                  <p>
                    {L(
                      "Retrouvez vos classes, les travaux à suivre et le calendrier publié par l’école.",
                      "Find your classes, the work that needs attention and the school’s published timetable.",
                    )}
                  </p>
                  <button
                    className="ac-button"
                    onClick={() => setTab("courses")}
                  >
                    {L("Explorer mes cours", "Explore my courses")}
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="ac-hero-mark" aria-hidden="true">
                  <BookOpen size={94} />
                  <span>KN / A</span>
                </div>
              </section>
              <section className="ac-metrics">
                {[
                  {
                    label: L("Cours officiels", "Official courses"),
                    value: available ? courses.length : "—",
                    icon: GraduationCap,
                    detail: L(
                      "Selon la période sélectionnée",
                      "For the selected period",
                    ),
                  },
                  {
                    label: admin
                      ? L("Élèves actifs", "Active learners")
                      : student
                        ? L("Devoirs publiés", "Published assignments")
                        : L("Élèves inscrits", "Enrolled learners"),
                    value: available
                      ? admin
                        ? (context?.population?.students ?? "—")
                        : student
                          ? allAssignments.length
                          : learnerIds.size
                      : "—",
                    icon: Users,
                    detail: student
                      ? L("Dans mes cours", "In my courses")
                      : L("Personnes distinctes", "Unique people"),
                  },
                  {
                    label: L("Cours aujourd’hui", "Classes today"),
                    value: available ? todaySchedule.length : "—",
                    icon: CalendarDays,
                    detail: L(
                      "Horaire officiel · Kinshasa",
                      "Official timetable · Kinshasa",
                    ),
                  },
                  {
                    label: L("À consulter dans Nexus", "To review in Nexus"),
                    value: available
                      ? (context?.communications?.unreadMessages || 0) +
                        (context?.communications?.unreadNotifications || 0)
                      : "—",
                    icon: Mail,
                    detail: L(
                      "Messages et notifications non lus",
                      "Unread messages and notifications",
                    ),
                  },
                ].map((m) => (
                  <article key={m.label} className="ac-metric">
                    <m.icon size={20} />
                    <p>{m.label}</p>
                    <strong>{m.value}</strong>
                    <small>{m.detail}</small>
                  </article>
                ))}
              </section>
              <div className="ac-two-columns">
                <section className="ac-panel">
                  <div className="ac-section-title">
                    <div>
                      <p className="ac-eyebrow">
                        {L("VOTRE JOURNÉE", "YOUR DAY")}
                      </p>
                      <h2>
                        {L("L’essentiel, sans détour", "What matters today")}
                      </h2>
                    </div>
                    <button
                      className="ac-link"
                      onClick={() => setTab("calendar")}
                    >
                      {L("Horaire complet", "Full timetable")}
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {todaySchedule.length ? (
                    todaySchedule
                      .slice()
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((s) => (
                        <div className="ac-agenda" key={s.id}>
                          <time>
                            {s.startTime}
                            <small>{s.endTime}</small>
                          </time>
                          <div>
                            <b>{s.course.name}</b>
                            <p>
                              {[s.grade, s.classGroup, s.room]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <Empty
                      title={L(
                        "Aucun cours planifié aujourd’hui",
                        "No classes scheduled today",
                      )}
                      detail={L(
                        "Consultez l’horaire de la semaine.",
                        "Check the weekly timetable.",
                      )}
                    />
                  )}
                </section>
                <section className="ac-connect-panel">
                  <div className="ac-connect-icon">
                    <Layers3 size={27} />
                  </div>
                  <p className="ac-eyebrow">KCS ORBIT ECOSYSTEM</p>
                  <h2>
                    {L(
                      "Les bons outils, ensemble.",
                      "The right tools, together.",
                    )}
                  </h2>
                  <p>
                    {student
                      ? L(
                          "Vos devoirs et vos échanges restent liés à votre dossier Nexus.",
                          "Your assignments and conversations stay linked to your Nexus account.",
                        )
                      : L(
                          "Préparez vos leçons dans Eduplanner, puis retrouvez vos plans synchronisés ici.",
                          "Prepare lessons in Eduplanner, then find your synchronized plans here.",
                        )}
                  </p>
                  {!student && (
                    <button
                      className="ac-button"
                      disabled={opening}
                      onClick={() => void openPlanner()}
                    >
                      {opening ? (
                        <LoaderCircle className="ac-spin" size={16} />
                      ) : (
                        <BookOpen size={16} />
                      )}{" "}
                      {L("Ouvrir Eduplanner", "Open Eduplanner")}
                      <ArrowUpRight size={16} />
                    </button>
                  )}
                  <a className="ac-link" href={nexusPath("assignments")}>
                    {L("Devoirs dans Nexus AI", "Assignments in Nexus AI")}
                    <ArrowUpRight size={15} />
                  </a>
                  <a className="ac-link" href={nexusPath("messages")}>
                    {L("Ma messagerie Nexus", "My Nexus messages")}
                    <ArrowUpRight size={15} />
                  </a>
                </section>
              </div>
            </>
          )}
          {(tab === "courses" ||
            tab === "assignments" ||
            tab === "planner") && (
            <div className="ac-toolbar">
              <label className="ac-search">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={L(
                    "Rechercher un cours, une classe, un titre…",
                    "Search a course, class or title…",
                  )}
                />
              </label>
              {tab === "courses" && (
                <select
                  aria-label={L("Filtrer par classe", "Filter by class")}
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                >
                  <option value="">
                    {L("Toutes mes classes", "All my classes")}
                  </option>
                  {[...new Set(courses.map((c) => c.grade))]
                    .sort((a, b) =>
                      a.localeCompare(b, undefined, { numeric: true }),
                    )
                    .map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                </select>
              )}
              {tab === "assignments" && (
                <select
                  aria-label={L("Filtrer par cours", "Filter by course")}
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">
                    {L("Tous mes cours", "All my courses")}
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.grade}
                    </option>
                  ))}
                </select>
              )}
              {tab === "planner" && (
                <button
                  className="ac-button"
                  disabled={opening}
                  onClick={() => void openPlanner()}
                >
                  <BookOpen size={16} />
                  {L("Ouvrir Eduplanner", "Open Eduplanner")}
                  <ArrowUpRight size={16} />
                </button>
              )}
            </div>
          )}
          {tab === "courses" && (
            <>
              <section className="ac-course-grid">
                {filteredCourses
                  .slice((page - 1) * 12, page * 12)
                  .map((c, i) => (
                    <article className="ac-course-card" key={c.id}>
                      <div className="ac-course-top">
                        <span className={"ac-course-glyph ac-tone-" + (i % 4)}>
                          <BookOpen size={26} />
                        </span>
                        <span className="ac-pill">{c.grade}</span>
                      </div>
                      <small>{c.code}</small>
                      <h2>{c.name}</h2>
                      <p className="ac-course-description">
                        {c.description ||
                          L(
                            "Cours officiel enregistré dans Nexus.",
                            "Official course registered in Nexus.",
                          )}
                      </p>
                      <div className="ac-course-facts">
                        <span>
                          <Users size={15} />
                          {c.enrolledStudents ?? 0} {L("élèves", "learners")}
                        </span>
                        <span>
                          <ClipboardCheck size={15} />
                          {c.assignments.length} {L("devoirs", "assignments")}
                        </span>
                      </div>
                      <p className="ac-teacher-name">{c.teacherName}</p>
                      <button
                        className="ac-link"
                        onClick={() => setSelectedCourse(c.id)}
                      >
                        {L("Voir le cours", "View course")}
                        <ArrowUpRight size={16} />
                      </button>
                    </article>
                  ))}
                {!filteredCourses.length && (
                  <Empty
                    title={L("Aucun cours trouvé", "No courses found")}
                    detail={L(
                      "Essayez une autre recherche ou période. Les inscriptions sont gérées dans Nexus.",
                      "Try another search or period. Enrollments are managed in Nexus.",
                    )}
                  />
                )}
              </section>
              {filteredCourses.length > 12 && (
                <div className="ac-pagination">
                  <span>
                    {(page - 1) * 12 + 1}–
                    {Math.min(page * 12, filteredCourses.length)} /{" "}
                    {filteredCourses.length}
                  </span>
                  <button
                    className="ac-button ac-quiet"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    {L("Précédent", "Previous")}
                  </button>
                  <button
                    className="ac-button ac-quiet"
                    disabled={page * 12 >= filteredCourses.length}
                    onClick={() => setPage(page + 1)}
                  >
                    {L("Suivant", "Next")}
                  </button>
                </div>
              )}
            </>
          )}
          {tab === "assignments" && (
            <section className="ac-panel">
              <div className="ac-section-title">
                <h2>
                  {L(
                    "Travaux publiés dans Nexus",
                    "Assignments published in Nexus",
                  )}
                </h2>
                <a
                  className="ac-button ac-quiet"
                  href={nexusPath("assignments")}
                >
                  {student
                    ? L("Résoudre mes devoirs", "Work on my assignments")
                    : L("Gérer les évaluations", "Manage assignments")}
                  <ArrowUpRight size={15} />
                </a>
              </div>
              <div className="ac-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{L("Devoir / cours", "Assignment / course")}</th>
                      <th>{L("Échéance", "Due date")}</th>
                      <th>{L("Barème", "Maximum")}</th>
                      <th>{L("Suivi", "Progress")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <b>{a.title}</b>
                          <small>
                            {a.courseName} · {a.grade}
                          </small>
                        </td>
                        <td>
                          <DateText date={a.dueDate} lang={lang} />
                        </td>
                        <td>{a.maxScore}</td>
                        <td>
                          {student ? (
                            <span className="ac-pill">
                              {a.submittedAt
                                ? L("Rendu", "Submitted")
                                : L("À rendre", "To submit")}
                            </span>
                          ) : (
                            <>
                              <b>{a.submitted || 0}</b>{" "}
                              {L("rendus", "submitted")}
                              <small>
                                {a.pendingReview || 0}{" "}
                                {L("à vérifier", "awaiting review")}
                              </small>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!assignments.length && (
                <Empty
                  title={L(
                    "Aucun devoir pour cette sélection",
                    "No assignments for this selection",
                  )}
                />
              )}
            </section>
          )}
          {tab === "planner" && (
            <>
              <section className="ac-info-line">
                <ShieldCheck size={17} />
                <p>
                  {L(
                    "Lecture de vos plans personnels dans le stockage Eduplanner. Vos brouillons restent privés.",
                    "Read your own plans from Eduplanner cloud storage. Your drafts remain private.",
                  )}
                </p>
                <button
                  className="ac-link"
                  disabled={plannerBusy}
                  onClick={() => void loadPlanner()}
                >
                  <RefreshCw
                    className={plannerBusy ? "ac-spin" : ""}
                    size={15}
                  />
                  {L("Actualiser", "Refresh")}
                </button>
              </section>
              {plannerError && (
                <div className="ac-alert" role="alert">
                  {L(
                    "Les plans Eduplanner sont indisponibles. Réessayez, ou ouvrez Eduplanner. Aucun plan de démonstration ne remplace vos données.",
                    "Eduplanner plans are unavailable. Retry or open Eduplanner. No demo plan replaces your records.",
                  )}
                </div>
              )}
              {plannerBusy && (
                <p className="ac-loading">
                  <LoaderCircle className="ac-spin" size={20} />
                  {L(
                    "Lecture sécurisée des plans…",
                    "Reading your plans securely…",
                  )}
                </p>
              )}
              {planner?.state === "not-linked" && (
                <Empty
                  title={L(
                    "Reliez votre espace Eduplanner",
                    "Connect your Eduplanner workspace",
                  )}
                  detail={L(
                    "Ouvrez Eduplanner avec le bouton ci-dessus une première fois pour relier votre compte institutionnel.",
                    "Open Eduplanner using the button above once to link your institutional account.",
                  )}
                />
              )}
              <section className="ac-course-grid">
                {planner?.plans
                  .filter((v) =>
                    normalize(
                      [v.title, v.subject, v.grade, v.schoolYear].join(" "),
                    ).includes(normalize(query)),
                  )
                  .map((v) => (
                    <article className="ac-course-card" key={v.id}>
                      <div className="ac-course-top">
                        <span className="ac-course-glyph">
                          <FileText size={24} />
                        </span>
                        <span className="ac-pill">
                          {(
                            {
                              draft: L("Brouillon", "Draft"),
                              submitted: L("Soumis", "Submitted"),
                              approved: L("Approuvé", "Approved"),
                              published: L("Publié", "Published"),
                              "under-review": L("En révision", "Under review"),
                              "final-approved": L("Validé", "Final approved"),
                              "revision-requested": L(
                                "À réviser",
                                "Revision requested",
                              ),
                              rejected: L("Refusé", "Rejected"),
                              archived: L("Archivé", "Archived"),
                            } as Record<string, string>
                          )[v.status] || v.status}
                        </span>
                      </div>
                      <small>
                        {v.subject} · {v.grade}
                      </small>
                      <h2>{v.title || v.lessonNumber}</h2>
                      <p>
                        {v.schoolYear} · {v.semester} · {v.quarter}
                      </p>
                      <p>
                        <DateText date={v.date || v.updatedAt} lang={lang} />
                      </p>
                      <button
                        className="ac-link"
                        onClick={() => setSelectedPlan(v)}
                      >
                        {L("Lire les objectifs", "Read objectives")}
                        <ArrowUpRight size={16} />
                      </button>
                    </article>
                  ))}
              </section>
              {planner?.state === "connected" && !planner.plans.length && (
                <Empty
                  title={L("Aucun plan synchronisé", "No synchronized plans")}
                  detail={L(
                    "Les plans enregistrés uniquement hors connexion apparaîtront après leur synchronisation dans Eduplanner.",
                    "Plans saved only offline will appear after they synchronize in Eduplanner.",
                  )}
                />
              )}
            </>
          )}
          {tab === "calendar" && (
            <section className="ac-panel">
              <div className="ac-section-title">
                <h2>{L("Votre semaine de cours", "Your teaching week")}</h2>
                <span className="ac-pill">
                  {L(
                    "Horaire publié par l’école",
                    "Published school timetable",
                  )}
                </span>
              </div>
              <div className="ac-day-tabs">
                {days.map((v, i) => (
                  <button
                    key={v}
                    className={day === v ? "active" : ""}
                    aria-pressed={day === v}
                    onClick={() => setDay(v)}
                  >
                    {lang === "fr" ? frenchDays[i] : v}
                  </button>
                ))}
              </div>
              {schedule
                .filter((s) => s.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((s) => (
                  <div className="ac-agenda" key={s.id}>
                    <time>
                      {s.startTime}
                      <small>{s.endTime}</small>
                    </time>
                    <div>
                      <b>{s.course.name}</b>
                      <p>
                        {[s.grade, s.classGroup, s.room, s.teacher]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              {!schedule.some((s) => s.day === day) && (
                <Empty
                  title={L(
                    "Aucun créneau publié pour ce jour",
                    "No timetable slots published for this day",
                  )}
                />
              )}
              <p className="ac-footnote">
                {L(
                  "Les horaires suivent le calendrier central et l’heure de Kinshasa.",
                  "Timetables follow the central calendar and Kinshasa time.",
                )}
              </p>
            </section>
          )}
          {tab === "library" && <AcademyLibrary lang={lang} />}
          {tab === "settings" && (
            <section className="ac-panel ac-preferences">
              <h2>{L("Votre espace personnel", "Your personal workspace")}</h2>
              <p>
                {L(
                  "La photo de votre dashboard Nexus est reprise ici. Le portrait officiel et les mots de passe des autres applications restent indépendants.",
                  "Your Nexus dashboard photo is shown here. The official registry portrait and other applications’ passwords remain independent.",
                )}
              </p>
              <div className="ac-settings-row">
                <span>
                  {L("Identité institutionnelle", "Institutional identity")}
                </span>
                <b>{context?.displayName || identity.displayName}</b>
              </div>
              <div className="ac-settings-row">
                <span>Orbit ID</span>
                <b>{identity.orbitId}</b>
              </div>
              <div className="ac-settings-row">
                <span>{L("Langue", "Language")}</span>
                <button
                  className="ac-button ac-quiet"
                  onClick={() => setLang(lang === "fr" ? "en" : "fr")}
                >
                  {lang === "fr" ? "Français → English" : "English → Français"}
                </button>
              </div>
              <div className="ac-settings-row">
                <span>{L("Apparence", "Appearance")}</span>
                <button
                  className="ac-button ac-quiet"
                  onClick={() => setDark(!dark)}
                >
                  {dark
                    ? L("Activer le mode clair", "Use light mode")
                    : L("Activer le mode sombre", "Use dark mode")}
                </button>
              </div>
              <a
                className="ac-button"
                href={nexus + "/application-access?app=KCS_ACADEMY"}
              >
                <LockKeyhole size={16} />
                {L(
                  "Gérer mon mot de passe Academy",
                  "Manage my Academy password",
                )}
                <ArrowUpRight size={16} />
              </a>
            </section>
          )}
          <footer className="ac-footer">
            <Install lang={lang} />
            <span>Kinshasa Christian School · Academy</span>
            <span>
              KCS Orbit ·{" "}
              {L(
                "Des données réelles, un parcours uni.",
                "Real records. One connected journey.",
              )}
            </span>
          </footer>
          <dialog
            ref={modalRef}
            className="ac-dialog"
            onClose={() => setSelectedPlan(null)}
          >
            {selectedPlan && (
              <>
                <div className="ac-section-title">
                  <span className="ac-pill">EDUPLANNER</span>
                  <button
                    className="ac-icon"
                    onClick={() => modalRef.current?.close()}
                    aria-label={L("Fermer", "Close")}
                  >
                    <X />
                  </button>
                </div>
                <h2>{selectedPlan.title}</h2>
                <p>
                  {selectedPlan.subject} · {selectedPlan.grade} ·{" "}
                  {selectedPlan.schoolYear}
                </p>
                <h3>
                  {L("Objectifs enregistrés", "Saved learning objectives")}
                </h3>
                {selectedPlan.objectives.length ? (
                  <ul>
                    {selectedPlan.objectives.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    {L(
                      "Aucun objectif enregistré dans ce plan.",
                      "No objectives have been saved in this plan.",
                    )}
                  </p>
                )}
                <button
                  className="ac-button"
                  onClick={() => void openPlanner()}
                  disabled={opening}
                >
                  {L("Continuer dans Eduplanner", "Continue in Eduplanner")}
                  <ArrowUpRight size={16} />
                </button>
              </>
            )}
          </dialog>
          <dialog
            ref={courseRef}
            className="ac-dialog"
            onClose={() => setSelectedCourse(null)}
          >
            {courses
              .filter((c) => c.id === selectedCourse)
              .map((c) => (
                <div key={c.id}>
                  <div className="ac-section-title">
                    <span className="ac-pill">{c.grade}</span>
                    <button
                      className="ac-icon"
                      onClick={() => courseRef.current?.close()}
                      aria-label={L("Fermer", "Close")}
                    >
                      <X />
                    </button>
                  </div>
                  <h2>{c.name}</h2>
                  <p>{c.description}</p>
                  <p>{c.teacherName}</p>
                  {!student && (
                    <>
                      <h3>
                        {L(
                          "Élèves officiellement inscrits",
                          "Officially enrolled learners",
                        )}{" "}
                        · {c.learners?.length || 0}
                      </h3>
                      <div className="ac-roster">
                        {c.learners?.map((s) => (
                          <p key={s.id}>
                            <Users size={14} />
                            <b>{s.name}</b>
                            <small>
                              {s.grade} · {s.section}
                            </small>
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                  <a
                    className="ac-button"
                    href={nexusPath(student ? "assignments" : "courses")}
                  >
                    {L("Continuer dans Nexus", "Continue in Nexus")}
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              ))}
          </dialog>
        </main>
      </div>
    </div>
  );
}
export function AcademySignIn() {
  const { lang, setLang, dark, setDark } = usePreferences(),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const L = (fr: string, en: string) => text(fr, en, lang);
  useEffect(() => {
    setError(new URLSearchParams(location.search).has("error"));
  }, []);
  return (
    <main className={"ac-login" + (dark ? " ac-dark" : "")}>
      <header>
        <a className="ac-brand" href={nexus}>
          <img src="/kcs.jpg" alt="KCS" />
          <span>
            <b>ACADEMY</b>
            <small>KCS ORBIT ECOSYSTEM</small>
          </span>
        </a>
        <div>
          <button
            className="ac-icon"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
          <button
            className="ac-icon"
            aria-label={L("Changer de thème", "Change theme")}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun /> : <Moon />}
          </button>
        </div>
      </header>
      <section className="ac-login-layout">
        <div className="ac-login-story">
          <span className="ac-pill">KINSHASA CHRISTIAN SCHOOL</span>
          <h1>
            {L("Un nouvel espace pour apprendre.", "A new space to learn.")}
          </h1>
          <p>
            {L(
              "Vos cours, vos leçons et toute l’école. Connectés.",
              "Your courses, your lessons and your school. Connected.",
            )}
          </p>
          <div className="ac-login-diagram">
            <BookOpen size={62} />
            <span>ACADEMY</span>
            <i />
            <b>
              Nexus AI <span>↔</span> Eduplanner
            </b>
          </div>
        </div>
        <form
          className="ac-login-form"
          action="/api/auth/institutional-login"
          method="post"
          onSubmit={() => setBusy(true)}
        >
          <span className="ac-course-glyph">
            <ShieldCheck size={26} />
          </span>
          <p className="ac-eyebrow">
            {L("ACCÈS INSTITUTIONNEL", "INSTITUTIONAL ACCESS")}
          </p>
          <h2>{L("Heureux de vous revoir.", "Welcome back.")}</h2>
          <p>
            {L(
              "Utilisez votre identité Orbit et votre mot de passe Academy.",
              "Use your Orbit identity and Academy password.",
            )}
          </p>
          {error && (
            <div role="alert" className="ac-alert">
              {L(
                "Connexion impossible. Vérifiez vos identifiants ou réessayez.",
                "Sign in failed. Check your credentials or retry.",
              )}
            </div>
          )}
          <label>
            {L("E-mail ou code d’accès", "Email or access code")}
            <div className="ac-field">
              <Mail size={17} />
              <input
                name="identifier"
                autoComplete="username"
                required
                placeholder={L(
                  "Votre identifiant institutionnel",
                  "Your institutional identifier",
                )}
              />
            </div>
          </label>
          <label>
            {L("Mot de passe Academy", "Academy password")}
            <div className="ac-field">
              <LockKeyhole size={17} />
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder={L("Votre mot de passe", "Your password")}
              />
              <button
                className="ac-icon"
                type="button"
                aria-label={
                  show
                    ? L("Masquer le mot de passe", "Hide password")
                    : L("Afficher le mot de passe", "Show password")
                }
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <details>
            <summary>
              {L("Code de sécurité (si activé)", "Security code (if enabled)")}
            </summary>
            <input
              name="twoFactorCode"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </details>
          <button className="ac-button" type="submit" disabled={busy}>
            {busy ? (
              <LoaderCircle className="ac-spin" size={18} />
            ) : (
              <LockKeyhole size={18} />
            )}{" "}
            {L("Entrer dans Academy", "Enter Academy")}
            <ArrowUpRight size={18} />
          </button>
          <a className="ac-recovery-link" href={nexus + "/application-access?app=KCS_ACADEMY"}>
            <LockKeyhole size={19} aria-hidden="true"/><span><strong>{L("Mot de passe Academy", "Academy password")}</strong><small>{L("Modifier ou récupérer mon accès", "Change or recover my access")}</small></span><ArrowUpRight size={17} aria-hidden="true"/>
          </a>
          <a className="ac-link" href={nexus + "/login"}>
            <ArrowLeft size={15} />
            {L("Retour à Nexus AI", "Back to Nexus AI")}
          </a>
        </form>
      </section>
      <Install lang={lang} />
    </main>
  );
}
