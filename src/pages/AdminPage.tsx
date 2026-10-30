import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authRepository } from "../repositories/authRepository";
import { dancerRepository } from "../repositories/dancerRepository";
import { paymentRepository } from "../repositories/paymentRepository";
import type { User } from "../types/auth";
import type { Dancer } from "../types/dancer";
import type { PaymentRecord } from "../types/payment";

function getAgeCategory(age: number): string {
  if (age >= 5 && age <= 9) return "Infantil";
  if (age >= 10 && age <= 14) return "Pre-juvenil";
  if (age >= 15 && age <= 18) return "Juvenil";
  if (age >= 19 && age <= 35) return "Mayores";
  return "Sin categoría";
}

function AdminPage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const [dancers] = useState<Dancer[]>(() => dancerRepository.getDancers());
  const [instructors] = useState(() => authRepository.getInstructors());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => paymentRepository.getPayments());
  const [search, setSearch] = useState("");

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
          </div>
          <div style={{ marginBottom: 16 }}>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar estudiante..." aria-label="Buscar estudiante" style={{ width: "100%", maxWidth: 400, padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10 }} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ESTUDIANTE</th><th>EDAD</th><th>CATEGORÍA</th><th>NIVEL</th><th>ASISTENCIA</th><th>RENDIMIENTO</th></tr></thead>
              <tbody>
                {visibleDancers.map((dancer) => (
                  <tr key={dancer.id}>
                    <td><div className="dancer-name"><span className={`avatar ${dancer.color}`}>{dancer.initials}</span><strong>{dancer.name}</strong></div></td>
                    <td>{dancer.age}</td><td>{getAgeCategory(dancer.age)}</td><td>{dancer.level}</td><td>{dancer.attendance}%</td><td>★ {dancer.score || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dancers-section" id="instructores">
          <div className="section-heading"><div><p className="eyebrow">EQUIPO DOCENTE</p><h2>Instructores</h2></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>INSTRUCTOR</th><th>CARNET</th><th>ROL</th></tr></thead>
              <tbody>{instructors.map((instructor) => <tr key={instructor.id}><td><strong>{instructor.name}</strong></td><td>{instructor.carnet}</td><td>Instructor/a</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

export default AdminPage;
