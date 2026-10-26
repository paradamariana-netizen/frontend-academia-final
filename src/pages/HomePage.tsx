
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authRepository } from "../repositories/authRepository";
import { dancerRepository } from "../repositories/dancerRepository";
import { storageService } from "../services/storageService";
import type { User } from "../types/auth";
import type { DanceLevel, Dancer } from "../types/dancer";
import type {
  DancerEvaluation,
  PracticalCriteria,
} from "../repositories/dancerRepository";

type Level = DanceLevel;
type AgeCategory = "Infantil" | "Pre-juvenil" | "Juvenil" | "Mayores";

type AttendanceStatus = "asistencia" | "permiso" | "ausencia";

interface AttendanceRecord {
  dancerId: string;
  date: string;
  status: AttendanceStatus;
}

const ATTENDANCE_KEY = "app_attendance";

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAttendanceRecords(): AttendanceRecord[] {
  return storageService.get<AttendanceRecord[]>(ATTENDANCE_KEY) ?? [];
}

const PRACTICAL_QUESTIONS: {
  key: keyof PracticalCriteria;
  label: string;
}[] = [
  { key: "technique", label: "Técnica y ejecución de movimientos" },
  { key: "rhythm", label: "Ritmo y musicalidad" },
  { key: "coordination", label: "Coordinación corporal" },
  { key: "expression", label: "Expresión artística" },
  { key: "posture", label: "Postura y equilibrio" },
  { key: "discipline", label: "Disciplina y preparación" },
];

const EMPTY_CRITERIA: PracticalCriteria = {
  technique: 3,
  rhythm: 3,
  coordination: 3,
  expression: 3,
  posture: 3,
  discipline: 3,
};

function getAgeCategory(age: number): AgeCategory | null {
  if (age >= 5 && age <= 9) return "Infantil";
  if (age >= 10 && age <= 14) return "Pre-juvenil";
  if (age >= 15 && age <= 18) return "Juvenil";
  if (age >= 19 && age <= 35) return "Mayores";
  return null;
}

function getNextLevel(level: Level): Level {
  if (level === "Iniciación") return "Intermedio";
  if (level === "Intermedio") return "Avanzado";
  return "Avanzado";
}

function navigateToSection(
  event: React.MouseEvent<HTMLAnchorElement>,
  sectionId: string,
) {
  event.preventDefault();
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${sectionId}`);
  }
}

function Layout({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  const logout = () => {
    authRepository.logout();
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login", { replace: true });
  };

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">B</span>
          <span>
            Academia de Danza <strong>Bailarte</strong>
          </span>
        </div>

        <p className="sidebar-label">
          PANEL DEL {isAdmin ? "ADMINISTRADOR" : "INSTRUCTOR"}
        </p>

        <nav className="side-nav" aria-label="Navegación principal">
          <a href="#inicio" onClick={(event) => navigateToSection(event, "inicio")}>
            <span>⌂</span> Inicio
          </a>

          <a
            href={isAdmin ? "#instructores" : "#estudiantes"}
            onClick={(event) => navigateToSection(event, isAdmin ? "instructores" : "estudiantes")}
          >
            <span>{isAdmin ? "◒" : "♙"}</span>{" "}
            {isAdmin ? "Instructores" : "Estudiantes"}
          </a>

          {!isAdmin && (
            <>
              <a href="#niveles" onClick={(event) => navigateToSection(event, "niveles")}>
                <span>◫</span> Niveles
              </a>
              <a href="#evaluaciones" onClick={(event) => navigateToSection(event, "evaluaciones")}>
                <span>◔</span> Evaluaciones
              </a>
              <a href="#asistencia" onClick={(event) => navigateToSection(event, "asistencia")}>
                <span>▦</span> Asistencia
              </a>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="instructor-avatar">{user?.name?.[0] ?? "U"}</div>
          <div>
            <strong>{user?.name ?? "Usuario"}</strong>
            <small>{isAdmin ? "Administrador/a" : "Instructor/a"}</small>
          </div>
          <button
            className="logout"
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
          >
            ↪
          </button>
        </div>
      </aside>

      {children}
    </main>
  );
}

function InstructorDashboard({ user }: { user: User | null }) {
  const [dancers, setDancers] = useState<Dancer[]>(() =>
    dancerRepository.getDancers()
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    () => getAttendanceRecords()
  );
  const [attendanceDancerId, setAttendanceDancerId] = useState("");
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>("asistencia");

  const saveAttendance = (dancerId: string, date: string) => {
    if (!dancerId) {
      window.alert("Selecciona un estudiante primero.");
      return;
    }

    const existing = attendanceRecords.find(
      (record) => record.dancerId === dancerId && record.date === date
    );

    const updated = existing?.status === attendanceStatus
      ? attendanceRecords.filter(
          (record) => !(record.dancerId === dancerId && record.date === date)
        )
      : [
          ...attendanceRecords.filter(
            (record) => !(record.dancerId === dancerId && record.date === date)
          ),
          { dancerId, date, status: attendanceStatus },
        ];

    storageService.set<AttendanceRecord[]>(ATTENDANCE_KEY, updated);
    setAttendanceRecords(updated);

    // Actualizar el porcentaje de asistencia del estudiante.
    const dancerRecords = updated.filter(
      (record) => record.dancerId === dancerId
    );

    const totalClasses = dancerRecords.filter(
      (record) => record.status === "asistencia" ||
                  record.status === "ausencia"
    ).length;

    const attendedClasses = dancerRecords.filter(
      (record) => record.status === "asistencia"
    ).length;

    const attendancePercentage =
      totalClasses > 0
        ? Math.round((attendedClasses / totalClasses) * 100)
        : 0;

    dancerRepository.updateAttendance(
      dancerId,
      attendancePercentage
    );

    setDancers(dancerRepository.getDancers());
  };

  const daysInMonth = new Date(
    attendanceMonth.getFullYear(), attendanceMonth.getMonth() + 1, 0
  ).getDate();
  const firstWeekday = new Date(
    attendanceMonth.getFullYear(), attendanceMonth.getMonth(), 1
  ).getDay();
  const attendanceDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const attendanceMonthPrefix = `${attendanceMonth.getFullYear()}-${String(
    attendanceMonth.getMonth() + 1
  ).padStart(2, "0")}`;
  const attendanceSummary = {
    asistencia: attendanceRecords.filter((record) => record.dancerId === attendanceDancerId && record.status === "asistencia" && record.date.startsWith(attendanceMonthPrefix)).length,
    permiso: attendanceRecords.filter((record) => record.dancerId === attendanceDancerId && record.status === "permiso" && record.date.startsWith(attendanceMonthPrefix)).length,
    ausencia: attendanceRecords.filter((record) => record.dancerId === attendanceDancerId && record.status === "ausencia" && record.date.startsWith(attendanceMonthPrefix)).length,
  };

  const [selectedLevel, setSelectedLevel] =
    useState<"Todos" | Level>("Todos");

  const [selectedAgeCategory, setSelectedAgeCategory] =
    useState<"Todas" | AgeCategory>("Todas");
  const [searchTerm, setSearchTerm] = useState("");  

  const [selectedDancer, setSelectedDancer] = useState<Dancer | null>(null);
  const [writtenScore, setWrittenScore] = useState("70");
  const [practicalCriteria, setPracticalCriteria] =
    useState<PracticalCriteria>({ ...EMPTY_CRITERIA });
  const [feedback, setFeedback] = useState("");

  const [evaluationHistory, setEvaluationHistory] =
    useState<DancerEvaluation[]>(() => dancerRepository.getEvaluations());

  const [isAddingDancer, setIsAddingDancer] = useState(false);
  const [dancerName, setDancerName] = useState("");
  const [dancerAge, setDancerAge] = useState("");
  const [dancerLevel, setDancerLevel] = useState<Level>("Iniciación");

  const visible = useMemo(
  () =>
    dancers.filter((dancer) => {
      const matchesLevel =
        selectedLevel === "Todos" || dancer.level === selectedLevel;

        const category = getAgeCategory(dancer.age);
        const matchesAge =
        selectedAgeCategory === "Todas" ||
        category === selectedAgeCategory;

        const matchesSearch = dancer.name
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());

        return matchesLevel && matchesAge && matchesSearch;
      }),
    [dancers, selectedLevel, selectedAgeCategory, searchTerm]
  );

  const openEvaluation = (dancer: Dancer) => {
    setSelectedDancer(dancer);
    setWrittenScore("70");
    setPracticalCriteria({ ...EMPTY_CRITERIA });
    setFeedback("");
  };


  const saveEvaluation = () => {
  if (!selectedDancer) return;

  const written = Number(writtenScore);

  if (
    writtenScore.trim() === "" ||
    !Number.isFinite(written) ||
    written < 0 ||
    written > 100
  ) {
    window.alert("Ingresa una nota escrita entre 0 y 100.");
    return;
  }

  const practicalValues = PRACTICAL_QUESTIONS.map(
    (question) => practicalCriteria[question.key]
  );

  if (
    practicalValues.some(
      (value) => !Number.isInteger(value) || value < 1 || value > 5
    )
  ) {
    window.alert(
      "Todos los criterios prácticos deben estar entre 1 y 5."
    );
    return;
  }

  const practicalAverage =
    practicalValues.reduce((sum, value) => sum + value, 0) /
    practicalValues.length;

  const overallScore = Number(
    ((written / 10 + practicalAverage * 2) / 2).toFixed(1)
  );

  const approved = written >= 70 && practicalAverage >= 4;

  const recommendedLevel = approved
    ? getNextLevel(selectedDancer.level)
    : selectedDancer.level;

  try {
    dancerRepository.saveEvaluation({
      dancerId: selectedDancer.id,
      dancerName: selectedDancer.name,
      instructorName: user?.name ?? "Instructor",
      writtenScore: written,
      practicalCriteria: { ...practicalCriteria },
      practicalScore: Number(practicalAverage.toFixed(2)),
      overallScore,
      feedback: feedback.trim(),
      approved,
      previousLevel: selectedDancer.level,
      recommendedLevel,
    });

    dancerRepository.updateScore(selectedDancer.id, overallScore);

    // Recargar los datos guardados para actualizar la pantalla.
    setDancers(dancerRepository.getDancers());
    setEvaluationHistory(dancerRepository.getEvaluations());

    // Cerrar el cuadro después de guardar.
    setSelectedDancer(null);
    setWrittenScore("70");
    setPracticalCriteria({ ...EMPTY_CRITERIA });
    setFeedback("");

    window.alert(
      `Evaluación registrada correctamente.\n\n` +
      `Estudiante: ${selectedDancer.name}\n` +
      `Examen escrito: ${written}/100\n` +
      `Promedio práctico: ${practicalAverage.toFixed(2)}/5\n` +
      `Rendimiento general: ${overallScore}/10\n` +
      `Resultado: ${approved ? "APROBADA" : "NO APROBADA"}\n` +
      `Nivel recomendado: ${recommendedLevel}`
    );
  } catch (error) {
    console.error("Error al guardar la evaluación:", error);
    window.alert(
      "No se pudo guardar la evaluación. Revisa la consola para ver el error."
    );
  }
};


  const addDancer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const age = Number(dancerAge);

    if (
      !dancerName.trim() ||
      dancerAge.trim() === "" ||
      !Number.isInteger(age) ||
      age < 5 ||
      age > 35
    ) {
      window.alert("Registra un nombre y una edad entre 5 y 35 años.");
      return;
    }

    const created = dancerRepository.addDancer({
      name: dancerName.trim(),
      age,
      level: dancerLevel,
    });

    setDancers((current) => [...current, created]);
    setDancerName("");
    setDancerAge("");
    setDancerLevel("Iniciación");
    setIsAddingDancer(false);
  };
  
  const deleteDancer = (dancer: Dancer) => {
    const confirmed = window.confirm(
      `¿Estás segura de que deseas eliminar a ${dancer.name}?\n\n` +
      "Esta acción eliminará también su historial de evaluaciones y no se puede deshacer."
    );

    if (!confirmed) return;

    const success = dancerRepository.deleteDancer(dancer.id);

    if (!success) {
      window.alert("No se pudo eliminar al estudiante.");
      return;
    }

    // Actualizar la lista de estudiantes.
    setDancers(dancerRepository.getDancers());

    // Actualizar el historial de evaluaciones.
    setEvaluationHistory(dancerRepository.getEvaluations());

    // Limpiar la selección si corresponde al estudiante eliminado.
    if (selectedDancer?.id === dancer.id) {
      setSelectedDancer(null);
    }

    // Limpiar la selección del calendario de asistencia.
    if (attendanceDancerId === dancer.id) {
      setAttendanceDancerId("");
    }

    // Eliminar sus registros de asistencia.
    const updatedAttendance = attendanceRecords.filter(
      (record) => record.dancerId !== dancer.id
    );

    storageService.set<AttendanceRecord[]>(
      ATTENDANCE_KEY,
      updatedAttendance
    );

    setAttendanceRecords(updatedAttendance);

    window.alert(`${dancer.name} fue eliminada correctamente.`);
  };


  const confirmPromotion = (evaluation: DancerEvaluation) => {
    const confirmed = window.confirm(
      `¿Confirmas el ascenso de ${evaluation.dancerName} a ${evaluation.recommendedLevel}?`
    );

    if (!confirmed) return;

    const success = dancerRepository.confirmPromotion(evaluation.id);

    if (success) {
      setDancers(dancerRepository.getDancers());
      setEvaluationHistory(dancerRepository.getEvaluations());
      window.alert("Ascenso de nivel registrado correctamente.");
    } else {
      window.alert("No se pudo confirmar el ascenso.");
    }
  };

  return (
    <Layout user={user}>
      <section className="dashboard-content" id="inicio">
        <header className="topbar">
          <div>
            <p className="eyebrow">PANEL DE EVALUACIÓN</p>
            <h1>
              ¡Buenos días, {user?.name?.split(" ")[0] ?? "Instructor"}!{" "}
              <span>✦</span>
            </h1>
            <p className="subtitle">
              Califica el progreso de tus estudiantes y consulta sus grupos.
            </p>
          </div>
        </header>

        <section className="stat-grid">
          <article className="stat-card purple">
            <div>
              <p>Total estudiantes</p>
              <strong>{dancers.length}</strong>
              <small>En tus grupos activos</small>
            </div>
            <span className="stat-icon">♙</span>
          </article>

          <article className="stat-card coral">
            <div>
              <p>Niveles activos</p>
              <strong>3</strong>
              <small>Iniciación · Intermedio · Avanzado</small>
            </div>
            <span className="stat-icon">◫</span>
          </article>

          <article className="stat-card yellow">
            <div>
              <p>Promedio de rendimiento</p>
              <strong>
                {dancers.length
                  ? (
                      dancers.reduce((sum, dancer) => sum + dancer.score, 0) /
                      dancers.length
                    ).toFixed(1)
                  : "0.0"}
                <em>/10</em>
              </strong>
              <small>Actualizado al evaluar</small>
            </div>
            <span className="stat-icon">★</span>
          </article>
        </section>

        <section className="level-section" id="niveles">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ORGANIZACIÓN</p>
              <h2>Niveles de danza</h2>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => setSelectedLevel("Todos")}
            >
              Ver todos <span>→</span>
            </button>
          </div>

          <div className="levels-grid">
            {(["Iniciación", "Intermedio", "Avanzado"] as Level[]).map(
              (level, index) => (
                <button
                  type="button"
                  className={`level-card level-${index + 1} ${
                    selectedLevel === level ? "selected" : ""
                  }`}
                  onClick={() => setSelectedLevel(level)}
                  key={level}
                >
                  <span className="level-number">0{index + 1}</span>
                  <div>
                    <h3>{level}</h3>
                    <p>
                      {
                        dancers.filter((dancer) => dancer.level === level)
                          .length
                      }{" "}
                      estudiantes
                    </p>
                  </div>
                  <span className="arrow">→</span>
                </button>
              )
            )}
          </div>
        </section>

        <section className="dancers-section" id="estudiantes">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SEGUIMIENTO</p>
              <h2>Mis estudiantes</h2>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsAddingDancer(true)}
            >
              <span>＋</span> Añadir estudiante
            </button>
          </div>

          <div className="dancer-toolbar">
            <div style={{ marginBottom: "16px" }}>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar estudiante por nombre..."
                aria-label="Buscar estudiante por nombre"
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div className="filters">
              {(["Todas", "Infantil", "Pre-juvenil", "Juvenil", "Mayores"] as const).map(
                (category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setSelectedAgeCategory(category)}
                    className={
                      selectedAgeCategory === category
                        ? "filter active-filter"
                        : "filter"
                    }
                  >
                    {category}
                  </button>
                )
              )}
            </div>

            <div className="filters">
              {(["Todos", "Iniciación", "Intermedio", "Avanzado"] as const).map(
                (level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={
                      selectedLevel === level
                        ? "filter active-filter"
                        : "filter"
                    }
                  >
                    {level}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>EDAD</th>
                  <th>CATEGORÍA</th>
                  <th>NIVEL</th>
                  <th>ASISTENCIA</th>
                  <th>RENDIMIENTO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((dancer) => (
                  <tr key={dancer.id}>
                    <td>
                      <div className="dancer-name">
                        <span className={`avatar ${dancer.color}`}>
                          {dancer.initials}
                        </span>
                        <strong>{dancer.name}</strong>
                      </div>
                    </td>
                    <td>{dancer.age}</td>
                    <td>{getAgeCategory(dancer.age) ?? "Sin categoría"}</td>
                    <td>
                      <span
                        className={`level-badge ${dancer.level
                          .toLowerCase()
                          .replace("ó", "o")}`}
                      >
                        {dancer.level}
                      </span>
                    </td>
                    <td>
                      <div className="attendance">
                        <div>
                          <span style={{ width: `${dancer.attendance}%` }} />
                        </div>
                        <b>{dancer.attendance}%</b>
                      </div>
                    </td>
                    <td>
                      <span className="score">
                        ★ {dancer.score || "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="evaluate"
                        type="button"
                        onClick={() => openEvaluation(dancer)}
                      >
                        Evaluar <span>→</span>
                      </button>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => deleteDancer(dancer)}
                      >
                        Eliminar
                      </button>
                    
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dancers-section" id="evaluaciones">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SEGUIMIENTO ACADÉMICO</p>
              <h2>Historial de evaluaciones</h2>
            </div>
          </div>

          {evaluationHistory.length === 0 ? (
            <p className="evaluation-help">
              Todavía no hay evaluaciones registradas.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>FECHA</th>
                    <th>ESCRITO</th>
                    <th>PRÁCTICO</th>
                    <th>RESULTADO</th>
                    <th>NIVEL</th>
                    <th>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluationHistory.map((evaluation) => (
                    <tr key={evaluation.id}>
                      <td>
                        <strong>{evaluation.dancerName}</strong>
                        <p>{evaluation.instructorName}</p>
                      </td>
                      <td>
                        {new Date(evaluation.date).toLocaleDateString()}
                      </td>
                      <td>{evaluation.writtenScore}/100</td>
                      <td>{evaluation.practicalScore}/5</td>
                      <td>
                        <strong>{evaluation.overallScore.toFixed(1)}/10</strong>
                      </td>
                      <td>
                        {evaluation.approved ? "Aprobada" : "No aprobada"}
                      </td>
                      <td>
                        {evaluation.promoted
                          ? evaluation.recommendedLevel
                          : evaluation.previousLevel}
                      </td>
                      <td>
                        {evaluation.approved &&
                        !evaluation.promoted &&
                        evaluation.previousLevel !==
                          evaluation.recommendedLevel ? (
                          <button
                            type="button"
                            className="evaluate"
                            onClick={() => confirmPromotion(evaluation)}
                          >
                            Confirmar ascenso →
                          </button>
                        ) : evaluation.promoted ? (
                          "Ascenso confirmado"
                        ) : evaluation.approved ? (
                          "Nivel máximo"
                        ) : (
                          "Debe mejorar"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dancers-section" id="asistencia">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CONTROL DIARIO</p>
              <h2>Asistencia de estudiantes</h2>
              <p className="subtitle">
                Selecciona un estudiante y marca el estado de cada fecha del calendario.
              </p>
            </div>
          </div>

          <label>
            Seleccionar estudiante
            <select
              value={attendanceDancerId}
              onChange={(event) => setAttendanceDancerId(event.target.value)}
            >
              <option value="">Selecciona un estudiante</option>
              {dancers.map((dancer) => (
                <option key={dancer.id} value={dancer.id}>{dancer.name}</option>
              ))}
            </select>
          </label>

          <div className="filters" style={{ margin: "20px 0", flexWrap: "wrap" }}>
            <button type="button" className={attendanceStatus === "asistencia" ? "filter active-filter" : "filter"} onClick={() => setAttendanceStatus("asistencia")}>🟢 Asistencia</button>
            <button type="button" className={attendanceStatus === "permiso" ? "filter active-filter" : "filter"} onClick={() => setAttendanceStatus("permiso")}>🟡 Permiso</button>
            <button type="button" className={attendanceStatus === "ausencia" ? "filter active-filter" : "filter"} onClick={() => setAttendanceStatus("ausencia")}>🔴 Ausencia</button>
          </div>

          <div className="section-heading" style={{ alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button type="button" className="text-button" onClick={() => setAttendanceMonth(new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth() - 1, 1))}>← Mes anterior</button>
            <h3 style={{ textTransform: "capitalize", margin: 0 }}>
              {attendanceMonth.toLocaleDateString("es-BO", { month: "long", year: "numeric" })}
            </h3>
            <button type="button" className="text-button" onClick={() => setAttendanceMonth(new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth() + 1, 1))}>Mes siguiente →</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px", marginTop: "16px" }}>
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <strong key={day} style={{ textAlign: "center", padding: "8px 0", fontSize: "12px" }}>{day}</strong>
            ))}
            {Array.from({ length: firstWeekday }, (_, index) => <div key={`empty-${index}`} />)}
            {attendanceDays.map((day) => {
              const date = getLocalDateKey(new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth(), day));
              const record = attendanceRecords.find((item) => item.dancerId === attendanceDancerId && item.date === date);
              const backgroundByStatus: Record<AttendanceStatus, string> = {
                asistencia: "#bbf7d0",
                permiso: "#fef08a",
                ausencia: "#fecaca",
              };
              const colorByStatus: Record<AttendanceStatus, string> = {
                asistencia: "#166534",
                permiso: "#854d0e",
                ausencia: "#991b1b",
              };
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!attendanceDancerId}
                  title={record ? `${day}: ${record.status}` : `Marcar el día ${day}`}
                  onClick={() => saveAttendance(attendanceDancerId, date)}
                  style={{ minHeight: "58px", padding: "4px", borderRadius: "10px", border: "1px solid #e5e7eb", background: record ? backgroundByStatus[record.status] : "#ffffff", color: record ? colorByStatus[record.status] : "#374151", cursor: attendanceDancerId ? "pointer" : "not-allowed", opacity: attendanceDancerId ? 1 : 0.5, fontWeight: 600, fontSize: "12px" }}
                >
                  {day}
                  {record && <span style={{ display: "block", fontSize: "9px", marginTop: "4px" }}>{record.status === "asistencia" ? "Asistió" : record.status === "permiso" ? "Permiso" : "Ausente"}</span>}
                </button>
              );
            })}
          </div>

          <div className="stat-grid" style={{ marginTop: "24px" }}>
            <article className="stat-card purple"><div><p>Asistencias</p><strong>{attendanceSummary.asistencia}</strong><small>Este mes</small></div></article>
            <article className="stat-card yellow"><div><p>Permisos</p><strong>{attendanceSummary.permiso}</strong><small>Este mes</small></div></article>
            <article className="stat-card coral"><div><p>Ausencias</p><strong>{attendanceSummary.ausencia}</strong><small>Este mes</small></div></article>
          </div>
          <p className="evaluation-help">
            Elige un estado y pulsa una fecha para guardarlo. Si vuelves a pulsar la misma fecha con el mismo estado, se elimina la marca.
          </p>
        </section>
      </section>

      {isAddingDancer && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={addDancer}>
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setIsAddingDancer(false);
                setDancerName("");
                setDancerAge("");
                setDancerLevel("Iniciación");
              }}
            >
              ×
            </button>

            <p className="eyebrow">NUEVO ESTUDIANTE</p>
            <h2>Añadir estudiante</h2>

            <label>
              Nombre completo
              <input
                value={dancerName}
                onChange={(event) => setDancerName(event.target.value)}
                placeholder="Ej. Ana Pérez"
                autoFocus
                required
              />
            </label>

            <label>
              Edad
              <input
                type="number"
                min="5"
                max="35"
                step="1"
                value={dancerAge}
                onChange={(event) => setDancerAge(event.target.value)}
                placeholder="Ej. 18"
                required
              />
            </label>

            <label>
              Nivel
              <select
                value={dancerLevel}
                onChange={(event) =>
                  setDancerLevel(event.target.value as Level)
                }
              >
                <option>Iniciación</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
              </select>
            </label>

            <p className="evaluation-help">
              La edad debe estar entre 5 y 35 años.
            </p>

            <button className="primary-button" type="submit">
              Guardar estudiante
            </button>
          </form>
        </div>
      )}

      {selectedDancer && (
        <div className="modal-backdrop">
          <form
            className="modal evaluation"
            onSubmit={(event) => {
              event.preventDefault();
              saveEvaluation();
            }}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedDancer(null)}
            >
              ×
            </button>

            <p className="eyebrow">EVALUACIÓN DE RENDIMIENTO</p>
            <h2>{selectedDancer.name}</h2>

            <p className="evaluation-help">
              Nivel actual: <strong>{selectedDancer.level}</strong>
            </p>

            <label>
              Examen escrito (0 a 100 puntos)
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={writtenScore}
                onChange={(event) => setWrittenScore(event.target.value)}
                required
              />
            </label>

            <h3>Examen práctico</h3>
            <p className="evaluation-help">
              Califica cada criterio del 1 al 5.
            </p>

            {PRACTICAL_QUESTIONS.map((question) => (
              <label key={question.key}>
                {question.label}
                <select
                  value={practicalCriteria[question.key]}
                  onChange={(event) =>
                    setPracticalCriteria((current) => ({
                      ...current,
                      [question.key]: Number(event.target.value),
                    }))
                  }
                >
                  <option value={1}>1 - Necesita mejorar</option>
                  <option value={2}>2 - En desarrollo</option>
                  <option value={3}>3 - Satisfactorio</option>
                  <option value={4}>4 - Muy bueno</option>
                  <option value={5}>5 - Excelente</option>
                </select>
              </label>
            ))}

            <label>
              Observaciones del instructor
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Fortalezas y aspectos que debe mejorar..."
              />
            </label>

            <p className="evaluation-help">
              Para aprobar se requiere un mínimo de 70/100 en el escrito y
              un promedio práctico de 4/5.
            </p>

            <button className="primary-button" type="submit">
              Guardar evaluación
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}

function AdminDashboard({ user }: { user: User | null }) {
  const [instructors, setInstructors] = useState(() =>
    authRepository.getInstructors()
  );
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [carnet, setCarnet] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const addInstructor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const created = authRepository.addInstructor({
      name: name.trim(),
      carnet: carnet.trim(),
      password,
    });

    if (!created) {
      setError("El carnet ya está registrado.");
      return;
    }

    setInstructors(authRepository.getInstructors());
    setName("");
    setCarnet("");
    setPassword("");
    setError("");
    setIsAdding(false);
  };

  const removeInstructor = (id: string) => {
    authRepository.removeInstructor(id);
    setInstructors(authRepository.getInstructors());
  };

  return (
    <Layout user={user}>
      <section className="dashboard-content" id="inicio">
        <header className="topbar">
          <div>
            <p className="eyebrow">ADMINISTRACIÓN</p>
            <h1>
              Gestión de instructores <span>✦</span>
            </h1>
            <p className="subtitle">
              Añade, consulta o retira el acceso de instructores de Academia de Danza Bailarte.
            </p>
          </div>
        </header>

        <section className="stat-grid admin-stats">
          <article className="stat-card purple">
            <div>
              <p>Instructores activos</p>
              <strong>{instructors.length}</strong>
              <small>Con acceso a la plataforma</small>
            </div>
            <span className="stat-icon">◒</span>
          </article>

          <article className="stat-card coral">
            <div>
              <p>Administradores</p>
              <strong>1</strong>
              <small>Gestión de la academia</small>
            </div>
            <span className="stat-icon">⌘</span>
          </article>
        </section>

        <section className="dancers-section" id="instructores">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EQUIPO DOCENTE</p>
              <h2>Instructores</h2>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsAdding(true)}
            >
              <span>＋</span> Añadir instructor
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>INSTRUCTOR</th>
                  <th>CARNET</th>
                  <th>ROL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((instructor) => (
                  <tr key={instructor.id}>
                    <td>
                      <div className="dancer-name">
                        <span className="avatar violet">
                          {instructor.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")}
                        </span>
                        <strong>{instructor.name}</strong>
                      </div>
                    </td>
                    <td>{instructor.carnet}</td>
                    <td>
                      <span className="level-badge iniciacion">
                        Instructor/a
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => removeInstructor(instructor.id)}
                      >
                        Quitar acceso
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {isAdding && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={addInstructor}>
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setIsAdding(false);
                setName("");
                setCarnet("");
                setPassword("");
                setError("");
              }}
            >
              ×
            </button>

            <p className="eyebrow">NUEVO ACCESO</p>
            <h2>Añadir instructor</h2>

            <label>
              Nombre completo
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Laura Pérez"
                autoFocus
                required
              />
            </label>

            <label>
              Carnet de identidad
              <input
                value={carnet}
                onChange={(event) => setCarnet(event.target.value)}
                placeholder="Ej. 1234567"
                required
              />
            </label>

            <label>
              Contraseña temporal
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button className="primary-button" type="submit">
              Crear instructor
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}

function HomePage() {
  const user = authRepository.getCurrentUser();

  return user?.role === "ADMIN" ? (
    <AdminDashboard user={user} />
  ) : (
    <InstructorDashboard user={user} />
  );
}

export default HomePage;
