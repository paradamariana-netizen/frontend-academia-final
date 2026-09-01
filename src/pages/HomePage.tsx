import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authRepository } from "../repositories/authRepository";

type Section = "Resumen" | "Instructores" | "Bailarinas" | "Niveles" | "Clases";

const instructors = [
  { name: "Camila Rojas", specialty: "Ballet clásico", classes: 4, initials: "CR", color: "coral" },
  { name: "Valentina Soto", specialty: "Danza contemporánea", classes: 3, initials: "VS", color: "lavender" },
  { name: "Isidora Fuentes", specialty: "Jazz & urbano", classes: 5, initials: "IF", color: "yellow" },
];

const upcomingClasses = [
  { time: "16:00", title: "Ballet inicial", detail: "Sala 1 · Camila Rojas", color: "coral" },
  { time: "17:30", title: "Contemporáneo intermedio", detail: "Sala 2 · Valentina Soto", color: "lavender" },
  { time: "19:00", title: "Jazz juvenil", detail: "Sala 1 · Isidora Fuentes", color: "yellow" },
];

const icons: Record<string, string> = {
  Resumen: "⌂", Instructores: "♙", Bailarinas: "♧", Niveles: "◇", Clases: "▣",
};

function HomePage() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("Resumen");
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");
  const user = authRepository.getCurrentUser();

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  const openCreate = () => {
    setNotice("");
    setShowModal(true);
  };

  const createLabel = section === "Niveles" ? "Crear nivel" : section === "Clases" ? "Crear clase" : "Agregar instructor";
  const title = section === "Resumen" ? "¡Buenos días, Administradora!" : section;

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={() => setSection("Resumen")}>
          <span className="brand-mark">d</span><span>danza<span>viva</span></span>
        </a>
        <p className="sidebar-label">ADMINISTRACIÓN</p>
        <nav aria-label="Navegación principal">
          {(Object.keys(icons) as Section[]).map((item) => (
            <button key={item} className={`nav-link ${section === item ? "active" : ""}`} onClick={() => setSection(item)}>
              <span className="nav-icon">{icons[item]}</span>{item}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-link"><span className="nav-icon">⚙</span>Configuración</button>
          <button className="profile" onClick={handleLogout} title="Cerrar sesión">
            <span className="avatar small">AR</span><span><strong>{user?.name ?? "Administradora"}</strong><small>Administradora</small></span><b>⌄</b>
          </button>
        </div>
      </aside>

      <main className="dashboard" id="inicio">
        <header className="topbar">
          <div className="mobile-brand">danzaviva</div>
          <div className="top-actions"><button aria-label="Notificaciones" className="icon-button">♢<i /></button><span className="avatar small">AR</span></div>
        </header>
        <section className="content">
          <div className="page-heading">
            <div><p className="eyebrow">{section === "Resumen" ? "LUNES, 14 DE OCTUBRE" : "ADMINISTRACIÓN"}</p><h1>{title}</h1><p className="subtitle">{section === "Resumen" ? "Aquí tienes un vistazo de lo que ocurre hoy en la academia." : `Gestiona los ${section.toLowerCase()} de la academia.`}</p></div>
            {section !== "Resumen" && <button className="primary-button" onClick={openCreate}>+ {createLabel}</button>}
          </div>

          {notice && <div className="notice">{notice}</div>}
          {section === "Resumen" ? <Dashboard onNavigate={setSection} /> : <ManagementView section={section} onCreate={openCreate} />}
        </section>
      </main>

      {showModal && <CreateModal section={section} onClose={() => setShowModal(false)} onSave={(message) => { setShowModal(false); setNotice(message); }} />}
    </div>
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
