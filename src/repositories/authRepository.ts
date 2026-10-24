
import initialUsers from "../data/users.json";
import { storageService } from "../services/storageService";
import type { LoginCredentials, User, UserRecord } from "../types/auth";

const SESSION_KEY = "app_session";
const USERS_KEY = "app_users";

const getUsers = (): UserRecord[] => {
  const savedUsers = storageService.get<UserRecord[]>(USERS_KEY);

  if (savedUsers === null || savedUsers === undefined) {
    const users = initialUsers as UserRecord[];
    storageService.set<UserRecord[]>(USERS_KEY, users);
    return users;
  }

  return savedUsers;
};

const toUser = ({ id, name, carnet, role }: UserRecord): User => ({
  id,
  name,
  carnet,
  role,
});

const saveUsers = (users: UserRecord[]) => {
  storageService.set<UserRecord[]>(USERS_KEY, users);
};

export const authRepository = {
  login(credentials: LoginCredentials): User | null {
    const carnet = credentials.carnet.trim();
    const password = credentials.password;
    const role = credentials.role;

    const foundUser = getUsers().find(
      (user) =>
        user.carnet.trim() === carnet &&
        user.password === password &&
        user.role === role,
    );

    if (!foundUser) {
      return null;
    }

    const sessionUser = toUser(foundUser);
    storageService.set<User>(SESSION_KEY, sessionUser);

    return sessionUser;
  },

  getInstructors(): User[] {
    return getUsers()
      .filter((user) => user.role === "INSTRUCTOR")
      .map(toUser);
  },

  addInstructor(instructor: Omit<UserRecord, "id" | "role">): User | null {
    const users = getUsers();
    const carnet = instructor.carnet.trim();

    if (users.some((user) => user.carnet.trim() === carnet)) {
      return null;
    }

    const created: UserRecord = {
      ...instructor,
      carnet,
      id: `instructor-${Date.now()}`,
      role: "INSTRUCTOR",
    };

    saveUsers([...users, created]);

    return toUser(created);
  },

  removeInstructor(id: string): void {
    saveUsers(
      getUsers().filter(
        (user) => user.id !== id || user.role !== "INSTRUCTOR",
      ),
    );
  },

  logout(): void {
    storageService.remove(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    return storageService.get<User>(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};
