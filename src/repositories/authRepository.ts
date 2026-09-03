import initialUsers from "../data/users.json";
import { storageService } from "../services/storageService";
import type { LoginCredentials, User, UserRecord } from "../types/auth";

const SESSION_KEY = "app_session";
const USERS_KEY = "app_users";

const getUsers = (): UserRecord[] => storageService.get<UserRecord[]>(USERS_KEY) ?? (initialUsers as UserRecord[]);
const toUser = ({ id, name, carnet, role }: UserRecord): User => ({ id, name, carnet, role });
const saveUsers = (users: UserRecord[]) => storageService.set(USERS_KEY, users);

export const authRepository = {
  login(credentials: LoginCredentials): User | null {
    const foundUser = getUsers().find(
      (user) => user.carnet === credentials.carnet && user.password === credentials.password && user.role === credentials.role,
    );

    if (!foundUser) return null;

    const sessionUser = toUser(foundUser);
    storageService.set<User>(SESSION_KEY, sessionUser);
    return sessionUser;
  },

  getInstructors(): User[] {
    return getUsers().filter((user) => user.role === "INSTRUCTOR").map(toUser);
  },

  addInstructor(instructor: Omit<UserRecord, "id" | "role">): User | null {
    const users = getUsers();
    if (users.some((user) => user.carnet === instructor.carnet)) return null;

    const created: UserRecord = { ...instructor, id: `instructor-${Date.now()}`, role: "INSTRUCTOR" };
    saveUsers([...users, created]);
    return toUser(created);
  },

  removeInstructor(id: string): void {
    saveUsers(getUsers().filter((user) => user.id !== id || user.role !== "INSTRUCTOR"));
  },

  logout(): void { storageService.remove(SESSION_KEY); },
  getCurrentUser(): User | null { return storageService.get<User>(SESSION_KEY); },
  isAuthenticated(): boolean { return this.getCurrentUser() !== null; },
};
