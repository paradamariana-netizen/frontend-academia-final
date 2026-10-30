import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authRepository } from "../repositories/authRepository";
import { dancerRepository } from "../repositories/dancerRepository";
import { paymentRepository } from "../repositories/paymentRepository";
import type { Dancer, DanceGroup } from "../types/dancer";
import type { PaymentRecord } from "../types/payment";

function AdminPage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const [dancers, setDancers] = useState<Dancer[]>(() => dancerRepository.getDancers());
  const [instructors, setInstructors] = useState(() => authRepository.getInstructors());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => paymentRepository.getPayments());
  const [search, setSearch] = useState("");
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [showDancerForm, setShowDancerForm] = useState(false);
  const [instructorName, setInstructorName] = useState("");
  const [instructorCarnet, setInstructorCarnet] = useState("");
  const [instructorPassword, setInstructorPassword] = useState("");
  const [instructorError, setInstructorError] = useState("");
  const [dancerName, setDancerName] = useState("");
  const [dancerAge, setDancerAge] = useState("");
  const [dancerLevel, setDancerLevel] = useState<"Iniciación" | "Intermedio" | "Avanzado">("Iniciación");
  const [newDancerGroup, setNewDancerGroup] = useState<DanceGroup | "">("");

  const groups: DanceGroup[] = ["Infantil", "Pre-juvenil", "Juvenil", "Mayores"];

  const addInstructor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = authRepository.addInstructor({
      name: instructorName.trim(),
      carnet: instructorCarnet.trim(),
      password: instructorPassword,
    });
    if (!created) {
      setInstructorError("Ese carnet ya está registrado.");
      return;
    }
    setInstructors(authRepository.getInstructors());
    setInstructorName("");
    setInstructorCarnet("");
    setInstructorPassword("");
    setInstructorError("");
    setShowInstructorForm(false);
  };

  const addDancer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const age = Number(dancerAge);
    if (!Number.isInteger(age) || age < 5 || age > 35) {
      window.alert("La edad debe estar entre 5 y 35 años.");
      return;
    }
    dancerRepository.addDancer({
      name: dancerName.trim(),
      age,
      level: dancerLevel,
      ...(newDancerGroup ? { groupId: newDancerGroup } : {}),
    });
    setDancers(dancerRepository.getDancers());
    setDancerName("");
    setDancerAge("");
    setDancerLevel("Iniciación");
    setNewDancerGroup("");
    setShowDancerForm(false);
  };

  const removeDancer = (dancer: Dancer) => {
    const confirmed = window.confirm(
      `¿Eliminar a ${dancer.name}? También se quitarán sus asistencias, evaluaciones y mensualidades. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    if (dancerRepository.deleteDancer(dancer.id)) {
      setDancers(dancerRepository.getDancers());
      setPayments(paymentRepository.getPayments());
    }
  };

  const removeInstructor = (instructorId: string, instructorName: string) => {
    const confirmed = window.confirm(
      `¿Eliminar al instructor/a ${instructorName}? Ya no podrá iniciar sesión en el sistema.`
    );
    if (!confirmed) return;
    authRepository.removeInstructor(instructorId);
    setInstructors(authRepository.getInstructors());
  };

  const assignDancerGroup = (dancerId: string, groupId: DanceGroup | "") => {
    dancerRepository.updateGroup(dancerId, groupId);
    setDancers(dancerRepository.getDancers());
  };

  const assignGroup = (instructorId: string, groupId: DanceGroup | "") => {
    const success = authRepository.updateInstructorGroup(instructorId, groupId);
    if (!success) {
      window.alert("Ese grupo ya tiene un instructor asignado. Cada grupo debe tener un solo responsable.");
      setInstructors(authRepository.getInstructors());
      return;
    }
    setInstructors(authRepository.getInstructors());
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const logout = () => {
    authRepository.logout();
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login", { replace: true });
  };

  const visibleDancers = useMemo(
    () => dancers.filter((dancer) => dancer.name.toLowerCase().includes(search.trim().toLowerCase())),
    [dancers, search]
  );

  const paid = payments.filter((payment) => payment.status === "PAGADO");
  const pending = payments.filter((payment) => payment.status === "PENDIENTE");
  const collected = paid.reduce((sum, payment) => sum + payment.amount, 0);

  const registerPayment = (payment: PaymentRecord) => {
    if (!window.confirm(`¿Registrar el pago de ${payment.dancerName}?`)) return;
    if (paymentRepository.registerPayment(payment.id)) {
      setPayments(paymentRepository.getPayments());
    }
  };

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">B</span>
          <span>Academia de Danza <strong>Bailarte</strong></span>
        </div>
        <p className="sidebar-label">PANEL DEL ADMINISTRADOR</p>
        <nav className="side-nav" aria-label="Navegación del administrador">
          <a href="#inicio"><span>⌂</span> Inicio</a>
          <a href="#estudiantes"><span>♙</span> Estudiantes</a>
          <a href="#instructores"><span>◒</span> Instructores</a>
          <a href="#mensualidades"><span>Bs</span> Mensualidades</a>
        </nav>
        <div className="sidebar-footer">
          <div className="instructor-avatar">{user.name[0] ?? "A"}</div>
          <div>
            <strong>{user.name}</strong>
            <small>Administrador/a</small>
          </div>
          <button className="logout" type="button" onClick={logout} aria-label="Cerrar sesión">↪</button>
        </div>
      </aside>

      <section className="dashboard-content" id="inicio">
        <header className="topbar">
          <div>
            <p className="eyebrow">ADMINISTRACIÓN GENERAL</p>
            <h1>Panel de administración <span>✦</span></h1>
            <p className="subtitle">Control general de estudiantes, instructores y mensualidades de Bailarte.</p>
          </div>
        </header>

        <section className="stat-grid admin-stats">
          <article className="stat-card purple"><div><p>Estudiantes activos</p><strong>{dancers.length}</strong><small>Registrados en la academia</small></div><span className="stat-icon">♙</span></article>
          <article className="stat-card coral"><div><p>Instructores</p><strong>{instructors.length}</strong><small>Con acceso al sistema</small></div><span className="stat-icon">◒</span></article>
          <article className="stat-card yellow"><div><p>Pagado este mes</p><strong>Bs. {collected.toFixed(0)}</strong><small>{paid.length} mensualidades pagadas</small></div><span className="stat-icon">Bs</span></article>
          <article className="stat-card purple"><div><p>Pagos pendientes</p><strong>{pending.length}</strong><small>Requieren seguimiento</small></div><span className="stat-icon">!</span></article>
        </section>

        <section className="dancers-section" id="mensualidades">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CONTROL FINANCIERO</p>
              <h2>Mensualidades</h2>
              <p className="subtitle">Consulta quién pagó y registra los pagos del mes actual.</p>
            </div>
          </div>

          <div className="filters" style={{ marginBottom: 18 }}>
            <span className="filter active-filter">Mes actual</span>
            <span className="filter">Pagados: {paid.length}</span>
            <span className="filter">Pendientes: {pending.length}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>ESTUDIANTE</th><th>NIVEL</th><th>MES</th><th>MONTO</th><th>ESTADO</th><th>FECHA</th><th></th></tr></thead>
              <tbody>
                {payments.map((payment) => {
                  const dancer = dancers.find((item) => item.id === payment.dancerId);
                  return (
                    <tr key={payment.id}>
                      <td><strong>{payment.dancerName}</strong></td>
                      <td>{dancer?.level ?? "—"}</td>
                      <td>{new Date(`${payment.month}-02T12:00:00`).toLocaleDateString("es-BO", { month: "long", year: "numeric" })}</td>
                      <td>Bs. {payment.amount.toFixed(0)}</td>
                      <td><span className={`level-badge ${payment.status === "PAGADO" ? "intermedio" : "avanzado"}`}>{payment.status}</span></td>
                      <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("es-BO") : "—"}</td>
                      <td>{payment.status === "PENDIENTE" ? <button type="button" className="evaluate" onClick={() => registerPayment(payment)}>Registrar pago →</button> : <span>✓ Registrado</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dancers-section" id="estudiantes">
          <div className="section-heading">
            <div><p className="eyebrow">REGISTRO GENERAL</p><h2>Estudiantes</h2></div>
            <button type="button" className="primary-button" onClick={() => setShowDancerForm(true)}>＋ Añadir estudiante</button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar estudiante..." aria-label="Buscar estudiante" style={{ width: "100%", maxWidth: 400, padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10 }} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ESTUDIANTE</th><th>EDAD</th><th>GRUPO ASIGNADO</th><th>NIVEL</th><th>ASISTENCIA</th><th>RENDIMIENTO</th><th>ACCIÓN</th></tr></thead>
              <tbody>
                {visibleDancers.map((dancer) => (
                  <tr key={dancer.id}>
                    <td><div className="dancer-name"><span className={`avatar ${dancer.color}`}>{dancer.initials}</span><strong>{dancer.name}</strong></div></td>
                    <td>{dancer.age}</td><td><select aria-label={`Grupo de ${dancer.name}`} value={dancer.groupId ?? ""} onChange={(event) => assignDancerGroup(dancer.id, event.target.value as DanceGroup | "")} style={{ padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb" }}><option value="">Sin asignar</option>{groups.map((group) => <option key={group} value={group}>{group}</option>)}</select></td><td>{dancer.level}</td><td>{dancer.attendance}%</td><td>★ {dancer.score || "—"}</td><td><button type="button" className="evaluate" onClick={() => removeDancer(dancer)}>Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dancers-section" id="instructores">
          <div className="section-heading">
            <div><p className="eyebrow">EQUIPO DOCENTE</p><h2>Instructores</h2></div>
            <button type="button" className="primary-button" onClick={() => setShowInstructorForm(true)}>＋ Añadir instructor</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>INSTRUCTOR</th><th>CARNET</th><th>ROL</th><th>GRUPO ASIGNADO</th><th>ACCIÓN</th></tr></thead>
              <tbody>{instructors.map((instructor) => <tr key={instructor.id}><td><strong>{instructor.name}</strong></td><td>{instructor.carnet}</td><td>Instructor/a</td><td><select aria-label={`Grupo de ${instructor.name}`} value={instructor.groupId ?? ""} onChange={(event) => assignGroup(instructor.id, event.target.value as DanceGroup | "")} style={{ padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb" }}><option value="">Sin asignar</option>{groups.map((group) => <option key={group} value={group}>{group}</option>)}</select></td><td><button type="button" className="evaluate" onClick={() => removeInstructor(instructor.id, instructor.name)}>Eliminar</button></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </section>

      {showInstructorForm && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={addInstructor}>
            <button type="button" className="modal-close" onClick={() => { setShowInstructorForm(false); setInstructorError(""); }}>×</button>
            <p className="eyebrow">NUEVO ACCESO</p>
            <h2>Añadir instructor</h2>
            <label>Nombre completo<input value={instructorName} onChange={(event) => setInstructorName(event.target.value)} required placeholder="Nombre del instructor" /></label>
            <label>Carnet de identidad<input value={instructorCarnet} onChange={(event) => setInstructorCarnet(event.target.value)} required placeholder="Número de carnet" /></label>
            <label>Contraseña temporal<input type="password" value={instructorPassword} onChange={(event) => setInstructorPassword(event.target.value)} minLength={6} required placeholder="Mínimo 6 caracteres" /></label>
            {instructorError && <p className="form-error" role="alert">{instructorError}</p>}
            <button className="primary-button" type="submit">Crear instructor</button>
          </form>
        </div>
      )}

      {showDancerForm && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={addDancer}>
            <button type="button" className="modal-close" onClick={() => setShowDancerForm(false)}>×</button>
            <p className="eyebrow">NUEVO REGISTRO</p>
            <h2>Añadir estudiante</h2>
            <label>Nombre completo<input value={dancerName} onChange={(event) => setDancerName(event.target.value)} required placeholder="Nombre de la bailarina" /></label>
            <label>Edad<input type="number" min="5" max="35" value={dancerAge} onChange={(event) => setDancerAge(event.target.value)} required /></label>
            <label>Grupo asignado<select value={newDancerGroup} onChange={(event) => setNewDancerGroup(event.target.value as DanceGroup | "")}><option value="">Sin asignar</option>{groups.map((group) => <option key={group} value={group}>{group}</option>)}</select></label>
            <label>Nivel<select value={dancerLevel} onChange={(event) => setDancerLevel(event.target.value as typeof dancerLevel)}><option>Iniciación</option><option>Intermedio</option><option>Avanzado</option></select></label>
            <button className="primary-button" type="submit">Guardar estudiante</button>
          </form>
        </div>
      )}
    </main>
  );
}

export default AdminPage;
