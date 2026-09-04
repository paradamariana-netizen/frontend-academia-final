import { storageService } from "../services/storageService";
import type { Dancer, NewDancer } from "../types/dancer";

const DANCERS_KEY = "app_dancers";
const colors: Dancer["color"][] = ["violet", "rose", "orange", "blue", "green"];

const initialDancers: Dancer[] = [
  { id: "dancer-1", name: "Valentina Rojas", initials: "VR", level: "Avanzado", attendance: 96, score: 9.4, color: "violet" },
  { id: "dancer-2", name: "Sofía Martínez", initials: "SM", level: "Intermedio", attendance: 92, score: 8.8, color: "rose" },
  { id: "dancer-3", name: "Camila Fernández", initials: "CF", level: "Avanzado", attendance: 89, score: 8.7, color: "orange" },
  { id: "dancer-4", name: "Isabella Torres", initials: "IT", level: "Iniciación", attendance: 98, score: 9.1, color: "blue" },
  { id: "dancer-5", name: "Martina Silva", initials: "MS", level: "Intermedio", attendance: 94, score: 8.9, color: "green" },
];

const getDancers = () => storageService.get<Dancer[]>(DANCERS_KEY) ?? initialDancers;
const initialsFromName = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export const dancerRepository = {
  getDancers: () => getDancers(),

  addDancer(dancer: NewDancer): Dancer {
    const dancers = getDancers();
    const created: Dancer = {
      id: `dancer-${Date.now()}`,
      name: dancer.name,
      initials: initialsFromName(dancer.name),
      level: dancer.level,
      attendance: 0,
      score: 0,
      color: colors[dancers.length % colors.length],
    };
    storageService.set(DANCERS_KEY, [...dancers, created]);
    return created;
  },

  updateScore(id: string, score: number): void {
    storageService.set(DANCERS_KEY, getDancers().map((dancer) => dancer.id === id ? { ...dancer, score } : dancer));
  },
};
