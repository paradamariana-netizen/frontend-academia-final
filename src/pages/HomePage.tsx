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

export default HomePage;
