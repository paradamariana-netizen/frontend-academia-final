
export type DanceLevel = "Iniciación" | "Intermedio" | "Avanzado";

export interface Dancer {
  id: string;
  name: string;
  initials: string;
  age: number;
  level: DanceLevel;
  attendance: number;
  score: number;
  color: "violet" | "rose" | "orange" | "blue" | "green";
}

export interface NewDancer {
  name: string;
  age: number;
  level: DanceLevel;
}

