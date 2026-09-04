export type DanceLevel = "Iniciación" | "Intermedio" | "Avanzado";

export interface Dancer {
  id: string;
  name: string;
  initials: string;
  level: DanceLevel;
  attendance: number;
  score: number;
  color: "violet" | "rose" | "orange" | "blue" | "green";
}

export interface NewDancer {
  name: string;
  level: DanceLevel;
}
