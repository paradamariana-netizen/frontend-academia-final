
import { storageService } from "../services/storageService";
import type { Dancer, NewDancer, DanceLevel } from "../types/dancer";

const DANCERS_KEY = "app_dancers";
const EVALUATIONS_KEY = "app_dancer_evaluations";

const colors: Dancer["color"][] = [
  "violet",
  "rose",
  "orange",
  "blue",
  "green",
];

export interface PracticalCriteria {
  technique: number;
  rhythm: number;
  coordination: number;
  expression: number;
  posture: number;
  discipline: number;
}

export interface DancerEvaluation {
  id: string;
  dancerId: string;
  dancerName: string;
  date: string;
  instructorName: string;
  writtenScore: number;
  practicalCriteria: PracticalCriteria;
  practicalScore: number;
  overallScore: number;
  feedback: string;
  approved: boolean;
  previousLevel: DanceLevel;
  recommendedLevel: DanceLevel;
  promoted: boolean;
}

const initialDancers: Dancer[] = [
  {
    id: "dancer-1",
    name: "Valentina Rojas",
    initials: "VR",
    age: 18,
    level: "Avanzado",
    attendance: 96,
    score: 9.4,
    color: "violet",
  },
  {
    id: "dancer-2",
    name: "Sofía Martínez",
    initials: "SM",
    age: 17,
    level: "Intermedio",
    attendance: 92,
    score: 8.8,
    color: "rose",
  },
  {
    id: "dancer-3",
    name: "Camila Fernández",
    initials: "CF",
    age: 19,
    level: "Avanzado",
    attendance: 89,
    score: 8.7,
    color: "orange",
  },
  {
    id: "dancer-4",
    name: "Isabella Torres",
    initials: "IT",
    age: 16,
    level: "Iniciación",
    attendance: 98,
    score: 9.1,
    color: "blue",
  },
  {
    id: "dancer-5",
    name: "Martina Silva",
    initials: "MS",
    age: 18,
    level: "Intermedio",
    attendance: 94,
    score: 8.9,
    color: "green",
  },
];

const getDancers = (): Dancer[] =>
  storageService.get<Dancer[]>(DANCERS_KEY) ?? initialDancers;

const getEvaluations = (): DancerEvaluation[] =>
  storageService.get<DancerEvaluation[]>(EVALUATIONS_KEY) ?? [];

const initialsFromName = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export const dancerRepository = {
  getDancers,

  getEvaluations,
  
  deleteDancer(id: string): boolean {
    const dancers = getDancers();
    const dancerExists = dancers.some((dancer) => dancer.id === id);

    if (!dancerExists) {
      return false;
    }

    // Eliminar la estudiante de la lista.
    storageService.set<Dancer[]>(
      DANCERS_KEY,
      dancers.filter((dancer) => dancer.id !== id)
    );

    // Eliminar las evaluaciones asociadas a esa estudiante.
    storageService.set<DancerEvaluation[]>(
      EVALUATIONS_KEY,
      getEvaluations().filter(
        (evaluation) => evaluation.dancerId !== id
      )
    );

    return true;
  },


  updateGroup(id: string, groupId: string): boolean {
    const dancers = getDancers();
    if (!dancers.some((dancer) => dancer.id === id)) return false;
    storageService.set<Dancer[]>(DANCERS_KEY, dancers.map((dancer) =>
      dancer.id === id ? { ...dancer, groupId: groupId || undefined } : dancer
    ));
    return true;
  },

  getEvaluationsByDancer(dancerId: string): DancerEvaluation[] {
    return getEvaluations()
      .filter((evaluation) => evaluation.dancerId === dancerId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  addDancer(dancer: NewDancer): Dancer {
    const dancers = getDancers();

    const created: Dancer = {
      id: `dancer-${Date.now()}`,
      name: dancer.name,
      initials: initialsFromName(dancer.name),
      age: dancer.age,
      groupId: dancer.groupId,
      level: dancer.level,
      attendance: 0,
      score: 0,
      color: colors[dancers.length % colors.length],
    };

    storageService.set<Dancer[]>(DANCERS_KEY, [
      ...dancers,
      created,
    ]);

    return created;
  },

  updateScore(id: string, score: number): void {
    storageService.set<Dancer[]>(
      DANCERS_KEY,
      getDancers().map((dancer) =>
        dancer.id === id
          ? { ...dancer, score }
          : dancer
      )
    );
  },

  updateLevel(id: string, level: DanceLevel): void {
    storageService.set<Dancer[]>(
      DANCERS_KEY,
      getDancers().map((dancer) =>
        dancer.id === id
          ? { ...dancer, level }
          : dancer
      )
    );
  },

  /**
   * Actualiza el porcentaje de asistencia de una estudiante.
   * El porcentaje debe estar entre 0 y 100.
   */
  updateAttendance(id: string, attendance: number): void {
    const safeAttendance = Math.max(
      0,
      Math.min(100, Math.round(attendance))
    );

    storageService.set<Dancer[]>(
      DANCERS_KEY,
      getDancers().map((dancer) =>
        dancer.id === id
          ? { ...dancer, attendance: safeAttendance }
          : dancer
      )
    );
  },

  saveEvaluation(
    evaluation: Omit<DancerEvaluation, "id" | "date" | "promoted">
  ): DancerEvaluation {
    const savedEvaluation: DancerEvaluation = {
      ...evaluation,
      id: `evaluation-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      date: new Date().toISOString(),
      promoted: false,
    };

    storageService.set<DancerEvaluation[]>(EVALUATIONS_KEY, [
      ...getEvaluations(),
      savedEvaluation,
    ]);

    return savedEvaluation;
  },

  confirmPromotion(evaluationId: string): boolean {
    const evaluations = getEvaluations();

    const evaluation = evaluations.find(
      (item) => item.id === evaluationId
    );

    if (
      !evaluation ||
      !evaluation.approved ||
      evaluation.promoted
    ) {
      return false;
    }

    if (
      evaluation.previousLevel === evaluation.recommendedLevel
    ) {
      return false;
    }

    this.updateLevel(
      evaluation.dancerId,
      evaluation.recommendedLevel
    );

    storageService.set<DancerEvaluation[]>(
      EVALUATIONS_KEY,
      evaluations.map((item) =>
        item.id === evaluationId
          ? { ...item, promoted: true }
          : item
      )
    );

    return true;
  },
};
