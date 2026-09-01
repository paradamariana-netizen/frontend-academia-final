import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authRepository } from "../repositories/authRepository";

type Level = "Iniciación" | "Intermedio" | "Avanzado";

type Dancer = {
  id: number;
  name: string;
  initials: string;
  level: Level;
  attendance: number;
  score: number;
  color: string;
};

const initialDancers: Dancer[] = [
  { id: 1, name: "Valentina Rojas", initials: "VR", level: "Avanzado", attendance: 96, score: 9.4, color: "violet" },
  { id: 2, name: "Sofía Martínez", initials: "SM", level: "Intermedio", attendance: 92, score: 8.8, color: "rose" },
  { id: 3, name: "Camila Fernández", initials: "CF", level: "Avanzado", attendance: 89, score: 8.7, color: "orange" },
  { id: 4, name: "Isabella Torres", initials: "IT", level: "Iniciación", attendance: 98, score: 9.1, color: "blue" },
  { id: 5, name: "Martina Silva", initials: "MS", level: "Intermedio", attendance: 94, score: 8.9, color: "green" },
];

function HomePage() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("Resumen");
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");
  const user = authRepository.getCurrentUser();
  const [dancers, setDancers] = useState(initialDancers);
  const [selectedLevel, setSelectedLevel] = useState<"Todos" | Level>("Todos");
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedDancer, setSelectedDancer] = useState<Dancer | null>(null);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState<Level>("Iniciación");

  const visibleDancers = useMemo(
    () => dancers.filter((dancer) => selectedLevel === "Todos" || dancer.level === selectedLevel),
    [dancers, selectedLevel],
  );

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  const addDancer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    setDancers((current) => [{ id: Date.now(), name, initials, level: newLevel, attendance: 100, score: 0, color: "violet" }, ...current]);
    setNewName("");
    setNewLevel("Iniciación");
    setIsRegistering(false);
  };

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>Studio <strong>Allegra</strong></span></div>
        <p className="sidebar-label">PANEL DEL INSTRUCTOR</p>
        <nav className="side-nav" aria-label="Navegación principal">
          <a className="active" href="#inicio"><span>⌂</span> Inicio</a>
          <a href="#bailarinas"><span>♙</span> Bailarinas</a>
          <a href="#niveles"><span>◫</span> Niveles</a>
          <a href="#evaluaciones"><span>◔</span> Evaluaciones</a>
        </nav>
        <div className="sidebar-footer">
          <div className="instructor-avatar">{user?.name?.[0] ?? "I"}</div>
          <div><strong>{user?.name ?? "Instructor"}</strong><small>Instructor/a</small></div>
          <button className="logout" type="button" onClick={handleLogout} aria-label="Cerrar sesión">↪</button>
        </div>
      </aside>

      <section className="dashboard-content" id="inicio">
        <header className="topbar">
          <div><p className="eyebrow">LUNES, 1 DE SEPTIEMBRE</p><h1>¡Buenos días, {user?.name?.split(" ")[0] ?? "Instructor"}! <span>✦</span></h1><p className="subtitle">Aquí tienes un resumen de tus grupos y bailarinas.</p></div>
          <button className="notification" type="button" aria-label="Notificaciones">♢<b>3</b></button>
        </header>

        <section className="stat-grid" aria-label="Resumen de bailarinas">
          <article className="stat-card purple"><div><p>Total bailarinas</p><strong>{dancers.length}</strong><small><i>↗</i> 2 nuevas este mes</small></div><span className="stat-icon">♙</span></article>
          <article className="stat-card coral"><div><p>Niveles activos</p><strong>3</strong><small>Iniciación · Intermedio · Avanzado</small></div><span className="stat-icon">◫</span></article>
          <article className="stat-card yellow"><div><p>Asistencia promedio</p><strong>{Math.round(dancers.reduce((sum, dancer) => sum + dancer.attendance, 0) / dancers.length)}<em>%</em></strong><small><i>↗</i> 4% respecto al mes anterior</small></div><span className="stat-icon">✓</span></article>
        </section>

        <section className="level-section" id="niveles">
          <div className="section-heading"><div><p className="eyebrow">ORGANIZACIÓN</p><h2>Niveles de danza</h2></div><button type="button" className="text-button" onClick={() => setSelectedLevel("Todos")}>Ver todos <span>→</span></button></div>
          <div className="levels-grid">
            {(["Iniciación", "Intermedio", "Avanzado"] as Level[]).map((level, index) => {
              const count = dancers.filter((dancer) => dancer.level === level).length;
              return <button type="button" className={`level-card level-${index + 1} ${selectedLevel === level ? "selected" : ""}`} onClick={() => setSelectedLevel(level)} key={level}><span className="level-number">0{index + 1}</span><div><h3>{level}</h3><p>{count} bailarinas</p></div><span className="arrow">→</span></button>;
            })}
          </div>
        </section>

        <section className="dancers-section" id="bailarinas">
          <div className="section-heading"><div><p className="eyebrow">GESTIÓN</p><h2>Mis bailarinas</h2></div><button type="button" className="primary-button" onClick={() => setIsRegistering(true)}><span>＋</span> Registrar bailarina</button></div>
          <div className="dancer-toolbar"><div className="filters">{(["Todos", "Iniciación", "Intermedio", "Avanzado"] as const).map((level) => <button type="button" key={level} onClick={() => setSelectedLevel(level)} className={selectedLevel === level ? "filter active-filter" : "filter"}>{level}</button>)}</div><label className="search"><span>⌕</span><input placeholder="Buscar bailarina..." aria-label="Buscar bailarina" /></label></div>
          <div className="table-wrap"><table><thead><tr><th>BAILARINA</th><th>NIVEL</th><th>ASISTENCIA</th><th>RENDIMIENTO</th><th></th></tr></thead><tbody>{visibleDancers.map((dancer) => <tr key={dancer.id}><td><div className="dancer-name"><span className={`avatar ${dancer.color}`}>{dancer.initials}</span><strong>{dancer.name}</strong></div></td><td><span className={`level-badge ${dancer.level.toLowerCase().replace("ó", "o")}`}>{dancer.level}</span></td><td><div className="attendance"><div><span style={{ width: `${dancer.attendance}%` }} /></div><b>{dancer.attendance}%</b></div></td><td><span className="score">★ {dancer.score || "—"}</span></td><td><button className="evaluate" type="button" onClick={() => setSelectedDancer(dancer)}>Evaluar <span>→</span></button></td></tr>)}</tbody></table></div>
        </section>
      </section>

      {isRegistering && <div className="modal-backdrop"><form className="modal" onSubmit={addDancer}><button type="button" className="modal-close" onClick={() => setIsRegistering(false)}>×</button><p className="eyebrow">NUEVA INSCRIPCIÓN</p><h2>Registrar bailarina</h2><label>Nombre completo<input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Ej. Lucía Gómez" autoFocus /></label><label>Nivel<select value={newLevel} onChange={(event) => setNewLevel(event.target.value as Level)}><option>Iniciación</option><option>Intermedio</option><option>Avanzado</option></select></label><button className="primary-button" type="submit">Registrar bailarina</button></form></div>}
      {selectedDancer && <div className="modal-backdrop"><div className="modal evaluation"><button type="button" className="modal-close" onClick={() => setSelectedDancer(null)}>×</button><p className="eyebrow">EVALUACIÓN DE RENDIMIENTO</p><h2>{selectedDancer.name}</h2><div className="evaluation-score"><span>★</span><strong>{selectedDancer.score || "Sin calificar"}</strong><small>/ 10</small></div><p>Asistencia actual: <strong>{selectedDancer.attendance}%</strong></p><button className="primary-button" type="button" onClick={() => setSelectedDancer(null)}>Guardar evaluación</button></div></div>}
    </main>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (section: Section) => void }) {
  return <>
    <section className="stats-grid">
      <article className="stat-card"><span className="stat-icon peach">♧</span><div><p>Total bailarinas</p><strong>86</strong><small className="positive">↑ 12% <em>vs. mes anterior</em></small></div></article>
      <article className="stat-card"><span className="stat-icon purple">♙</span><div><p>Instructores activos</p><strong>12</strong><small className="positive">↑ 2 <em>este mes</em></small></div></article>
      <article className="stat-card"><span className="stat-icon beige">◇</span><div><p>Niveles disponibles</p><strong>6</strong><small><em>Desde inicial a avanzado</em></small></div></article>
      <article className="stat-card"><span className="stat-icon yellow">▣</span><div><p>Clases esta semana</p><strong>24</strong><small><em>4 clases hoy</em></small></div></article>
    </section>
    <section className="dashboard-grid">
      <article className="panel schedule-panel"><div className="panel-title"><div><h2>Clases de hoy</h2><p>Lunes, 14 de octubre</p></div><button className="text-button" onClick={() => onNavigate("Clases")}>Ver calendario →</button></div>
        <div className="schedule-list">{upcomingClasses.map((item) => <div className="class-row" key={item.time}><time>{item.time}</time><span className={`class-dot ${item.color}`} /><div><strong>{item.title}</strong><p>{item.detail}</p></div><button className="more-button">•••</button></div>)}</div>
      </article>
      <article className="panel activity-panel"><div className="panel-title"><div><h2>Actividad reciente</h2><p>Últimos movimientos</p></div></div>
        <div className="activity"><p><span className="activity-avatar coral">CR</span><span><strong>Camila Rojas</strong> actualizó la clase<br /><small>Ballet inicial · Hace 18 min</small></span></p><p><span className="activity-avatar lavender">LP</span><span><strong>Lucía Pérez</strong> fue asignada a nivel<br /><small>Intermedio · Hace 1 hora</small></span></p><p><span className="activity-avatar yellow">NF</span><span><strong>Nuevo nivel creado</strong><br /><small>Pre-ballet · Ayer</small></span></p></div>
      </article>
    </section>
    <section className="quick-section"><div><h2>Accesos rápidos</h2><p>Gestiona tu academia con un solo clic.</p></div><div className="quick-actions"><button onClick={() => onNavigate("Instructores")}><b className="peach">+</b>Nuevo instructor</button><button onClick={() => onNavigate("Niveles")}><b className="purple">+</b>Crear nivel</button><button onClick={() => onNavigate("Clases")}><b className="yellow">+</b>Crear clase</button></div></section>
  </>;
}

function ManagementView({ section, onCreate }: { section: Section; onCreate: () => void }) {
  const data = section === "Instructores" ? instructors : section === "Niveles" ? [{ name: "Pre-ballet", specialty: "4 a 6 años", classes: 14, initials: "PB", color: "yellow" }, { name: "Inicial", specialty: "Fundamentos de danza", classes: 22, initials: "IN", color: "coral" }, { name: "Intermedio", specialty: "Técnica y expresión", classes: 19, initials: "IM", color: "lavender" }] : section === "Clases" ? upcomingClasses.map((item) => ({ name: item.title, specialty: item.detail, classes: "Lunes", initials: item.time, color: item.color })) : [{ name: "Lucía Pérez", specialty: "Nivel intermedio", classes: "Activa", initials: "LP", color: "coral" }, { name: "Sofía Martínez", specialty: "Nivel inicial", classes: "Activa", initials: "SM", color: "lavender" }, { name: "Antonia Silva", specialty: "Nivel avanzado", classes: "Activa", initials: "AS", color: "yellow" }];
  return <section className="panel management"><div className="toolbar"><input aria-label="Buscar" placeholder={`Buscar ${section.toLowerCase()}...`} /><button className="filter-button">⌘ Filtrar</button></div><div className="management-list">{data.map((item) => <div className="management-row" key={item.name}><span className={`avatar ${item.color}`}>{item.initials}</span><div><h3>{item.name}</h3><p>{item.specialty}</p></div><span className="row-meta">{typeof item.classes === "number" ? `${item.classes} clases` : item.classes}</span><button className="more-button">•••</button></div>)}</div><button className="empty-add" onClick={onCreate}>+ {section === "Bailarinas" ? "Agregar bailarina" : section === "Niveles" ? "Crear un nuevo nivel" : section === "Clases" ? "Crear una nueva clase" : "Agregar un nuevo instructor"}</button></section>;
}

function CreateModal({ section, onClose, onSave }: { section: Section; onClose: () => void; onSave: (message: string) => void }) {
  const label = section === "Niveles" ? "nivel" : section === "Clases" ? "clase" : "instructor";
  return <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={(e) => { e.preventDefault(); onSave(`El ${label} se creó correctamente.`); }}><button className="close" type="button" onClick={onClose}>×</button><p className="eyebrow">NUEVO REGISTRO</p><h2>Crear {label}</h2><label>Nombre<input required placeholder={`Nombre del ${label}`} /></label>{section === "Clases" && <><label>Instructor<select defaultValue=""><option value="" disabled>Selecciona un instructor</option>{instructors.map((instructor) => <option key={instructor.name}>{instructor.name}</option>)}</select></label><label>Bailarinas<input placeholder="Selecciona bailarinas" /></label></>} {section === "Niveles" && <label>Descripción<input placeholder="Ej. De 7 a 9 años" /></label>}<button className="primary-button" type="submit">Crear {label}</button></form></div>;
}

export default HomePage;
