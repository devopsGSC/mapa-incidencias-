import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { PublicUser, Role } from "../types";

/**
 * Capa de acceso a datos de usuarios/roles. Mismo patrón que
 * sitesRepository.ts: users.seed.json (trackeado) es el punto de partida;
 * users.json (gitignored) es el estado real, editado desde el panel
 * /admin/sites (sección "Usuarios"). No hay base de datos propia para esto
 * — la de MySQL es de solo lectura y de osTicket, no nuestra.
 */
const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const SEED_PATH = path.join(DATA_DIR, "users.seed.json");
const PASSWORD_HASH_COST = 12; // mismo costo que scripts/hashPassword.ts

interface StoredUser {
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  resetToken: string | null;
  resetTokenExpiry: number | null; // epoch ms
}

interface UsersFile {
  users: StoredUser[];
}

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function readUsersFile(filePath: string): UsersFile {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as UsersFile;
  // Compatibilidad con usuarios creados antes de estos campos (email,
  // resetToken/resetTokenExpiry) — nunca deben quedar undefined en memoria.
  for (const user of parsed.users) {
    if (user.email === undefined) user.email = "";
    if (user.resetToken === undefined) user.resetToken = null;
    if (user.resetTokenExpiry === undefined) user.resetTokenExpiry = null;
  }
  return parsed;
}

function ensureUsersFileExists(): void {
  if (fs.existsSync(USERS_PATH)) return;
  console.log(
    `[usersRepository] users.json no existe todavía, lo creo a partir del seed (${SEED_PATH}).`
  );
  fs.copyFileSync(SEED_PATH, USERS_PATH);
}

function writeUsersFile(users: StoredUser[]): void {
  fs.writeFileSync(USERS_PATH, JSON.stringify({ users }, null, 2) + "\n", "utf-8");
}

function toPublicUser(stored: StoredUser): PublicUser {
  return { username: stored.username, email: stored.email, role: stored.role };
}

export type CreateUserResult = { ok: true; user: PublicUser } | { ok: false; error: "duplicate" };

export type ResetPasswordWithTokenResult = "ok" | "invalid" | "expired";

export interface UsersRepository {
  findAll(): PublicUser[];
  findByUsername(username: string): StoredUser | undefined;
  findByEmail(email: string): StoredUser | undefined;
  create(input: { username: string; email: string; password: string; role: Role }): Promise<CreateUserResult>;
  setRole(username: string, role: Role): PublicUser | undefined;
  resetPassword(username: string, newPassword: string): Promise<boolean>;
  setResetToken(username: string, token: string, expiresAt: number): void;
  resetPasswordWithToken(token: string, newPassword: string): Promise<ResetPasswordWithTokenResult>;
  remove(username: string): boolean;
  countAdmins(): number;
}

class JsonUsersRepository implements UsersRepository {
  private users: StoredUser[];

  constructor() {
    ensureUsersFileExists();
    this.users = readUsersFile(USERS_PATH).users;
  }

  findAll(): PublicUser[] {
    return this.users.map(toPublicUser);
  }

  findByUsername(username: string): StoredUser | undefined {
    const target = normalizeUsername(username);
    return this.users.find((u) => normalizeUsername(u.username) === target);
  }

  findByEmail(email: string): StoredUser | undefined {
    const target = normalizeEmail(email);
    return this.users.find((u) => normalizeEmail(u.email) === target);
  }

  async create(input: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<CreateUserResult> {
    const target = normalizeUsername(input.username);
    if (this.users.some((u) => normalizeUsername(u.username) === target)) {
      return { ok: false, error: "duplicate" };
    }
    const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_COST);
    const stored: StoredUser = {
      username: input.username.trim(),
      email: input.email.trim(),
      passwordHash,
      role: input.role,
      resetToken: null,
      resetTokenExpiry: null,
    };
    this.users.push(stored);
    writeUsersFile(this.users);
    return { ok: true, user: toPublicUser(stored) };
  }

  setRole(username: string, role: Role): PublicUser | undefined {
    const user = this.findByUsername(username);
    if (!user) return undefined;
    user.role = role;
    writeUsersFile(this.users);
    return toPublicUser(user);
  }

  async resetPassword(username: string, newPassword: string): Promise<boolean> {
    const user = this.findByUsername(username);
    if (!user) return false;
    user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_COST);
    writeUsersFile(this.users);
    return true;
  }

  setResetToken(username: string, token: string, expiresAt: number): void {
    const user = this.findByUsername(username);
    if (!user) return;
    user.resetToken = token;
    user.resetTokenExpiry = expiresAt;
    writeUsersFile(this.users);
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<ResetPasswordWithTokenResult> {
    const user = this.users.find((u) => u.resetToken === token);
    if (!user) return "invalid";
    if (!user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) return "expired";

    user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_COST);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    writeUsersFile(this.users);
    return "ok";
  }

  remove(username: string): boolean {
    const target = normalizeUsername(username);
    const index = this.users.findIndex((u) => normalizeUsername(u.username) === target);
    if (index < 0) return false;
    this.users.splice(index, 1);
    writeUsersFile(this.users);
    return true;
  }

  countAdmins(): number {
    return this.users.filter((u) => u.role === "admin").length;
  }
}

export const usersRepository: UsersRepository = new JsonUsersRepository();
