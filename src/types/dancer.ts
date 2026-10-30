
export type DanceLevel = "Iniciación" | "Intermedio" | "Avanzado";

export type DanceGroup = "Infantil" | "Pre-juvenil" | "Juvenil" | "Mayores";

export interface Dancer {
  id: string;
  name: string;
  initials: string;
  age: number;
  groupId?: DanceGroup;
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

