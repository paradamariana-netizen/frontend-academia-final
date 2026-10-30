export type UserRole = "ADMIN" | "INSTRUCTOR";

export interface User {
  id: string;
  name: string;
  carnet: string;
  role: UserRole;
  groupId?: string;
}

export interface UserRecord extends User {
  password: string;
}

export interface LoginCredentials {
  carnet: string;
  password: string;
  role: UserRole;
}
