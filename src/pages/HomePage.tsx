
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authRepository } from "../repositories/authRepository";
import { dancerRepository } from "../repositories/dancerRepository";
import type { User } from "../types/auth";
import type { DanceLevel, Dancer } from "../types/dancer";
import type {
  DancerEvaluation,
  PracticalCriteria,
} from "../repositories/dancerRepository";

type Level = DanceLevel;
type AgeCategory = "Infantil" | "Pre-juvenil" | "Juvenil" | "Mayores";

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
    navigate("/login", { replace: true });
  };

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>
            Studio <strong>Allegra</strong>
          </span>
        </div>

        <p className="sidebar-label">
          PANEL DEL {isAdmin ? "ADMINISTRADOR" : "INSTRUCTOR"}
        </p>

        <nav className="side-nav" aria-label="Navegación principal">
          <a className="active" href="#inicio">
            <span>⌂</span> Inicio
          </a>

          <a href={isAdmin ? "#instructores" : "#bailarinas"}>
            <span>{isAdmin ? "◒" : "♙"}</span>{" "}
            {isAdmin ? "Instructores" : "Bailarinas"}
          </a>

          {!isAdmin && (
            <>
              <a href="#niveles">
                <span>◫</span> Niveles
              </a>
              <a href="#evaluaciones">
                <span>◔</span> Evaluaciones
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

  const [selectedLevel, setSelectedLevel] =
    useState<"Todos" | Level>("Todos");

  const [selectedAgeCategory, setSelectedAgeCategory] =
    useState<"Todas" | AgeCategory>("Todas");

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

        return matchesLevel && matchesAge;
      }),
    [dancers, selectedLevel, selectedAgeCategory]
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
      window.alert("Todos los criterios prácticos deben estar entre 1 y 5.");
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

    const saved = dancerRepository.saveEvaluation({
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

    setDancers((current) =>
      current.map((dancer) =>
        dancer.id === selectedDancer.id
          ? { ...dancer, score: overallScore }
          : dancer
      )
    );

    setEvaluationHistory((current) => [saved, ...current]);
    setSelectedDancer(null);

    window.alert(
      approved
        ? `Evaluación aprobada. ${selectedDancer.level === "Avanzado" ? "La bailarina ya está en el nivel máximo." : `El instructor puede confirmar su ascenso a ${recommendedLevel}.`}`
        : "Evaluación guardada. La bailarina necesita mejorar antes de avanzar de nivel."
    );
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
              Califica el progreso de tus bailarinas y consulta sus grupos.
            </p>
          </div>
        </header>

        <section className="stat-grid">
          <article className="stat-card purple">
            <div>
              <p>Total bailarinas</p>
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
                      bailarinas
                    </p>
                  </div>
                  <span className="arrow">→</span>
                </button>
              )
            )}
          </div>
        </section>

        <section className="dancers-section" id="bailarinas">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SEGUIMIENTO</p>
              <h2>Mis bailarinas</h2>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsAddingDancer(true)}
            >
              <span>＋</span> Añadir bailarina
            </button>
          </div>

          <div className="dancer-toolbar">
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
                  <th>BAILARINA</th>
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
                    <th>BAILARINA</th>
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

            <p className="eyebrow">NUEVA BAILARINA</p>
            <h2>Añadir bailarina</h2>

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
              Guardar bailarina
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
              Añade, consulta o retira el acceso de instructores de Studio
              Allegra.
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
