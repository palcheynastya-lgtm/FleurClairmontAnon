import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger.js";

const DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data"
);
const PHRASES_PATH      = path.join(DIR, "phrases.json");
const STATS_PATH        = path.join(DIR, "stats.json");
const MOD_PATH          = path.join(DIR, "moderation.json");
const SPECIAL_USERS_PATH = path.join(DIR, "special_users.json");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
    }
  } catch (err) {
    logger.warn({ err, filePath }, "Could not read JSON file, using fallback");
  }
  return fallback;
}

function writeJson(filePath: string, data: unknown): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    logger.error({ err, filePath }, "Could not write JSON file");
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Default phrases ──────────────────────────────────────────────────────────

export interface PhrasesData {
  randomPhrases: string[];
  gossips:       string[];
  secrets:       string[];
}

export type Category = "randomPhrases" | "gossips" | "secrets";

const DEFAULTS: PhrasesData = {
  randomPhrases: [
    "Я не злая. Я просто честная.",
    "Если ты думаешь, что я ошибаюсь — ты просто не понял.",
    "Люди боятся того, чего не понимают. И меня.",
    "Молчание — это тоже ответ. Иногда самый громкий.",
    "Я не держу обиды. Я просто помню всё.",
    "Иногда лучше быть одной, чем в плохой компании.",
    "Если хочешь знать правду — спроси меня. Но будь готов её услышать.",
    "Я не прошу прощения за то, что думаю.",
  ],
  gossips: [
    "Говорят, кто-то в этом городе знает больше, чем говорит...",
    "Слышала, что прошлой ночью кое-кто бродил там, где не должен был.",
    "Интересно, почему у некоторых людей вечно такой виноватый вид...",
    "Поговаривают, что у одного человека два телефона. Зачем бы это?",
    "Не моё дело, но вчера видели, как двое очень долго разговаривали у кафе...",
    "Мне сказали по секрету, но раз уж мы тут... кто-то завидует тебе больше, чем ты думаешь.",
  ],
  secrets: [
    "Я иногда разговариваю сама с собой. Это лучшая беседа, что у меня бывает.",
    "Иногда я знаю ответ, но молчу — просто чтобы посмотреть, что будет.",
    "У меня есть список людей, которым я никогда не прощу. Он небольшой, но точный.",
    "Иногда я делаю вид, что не вижу человека. Не потому что не заметила — а потому что не хочу.",
    "Я запоминаю всё, что мне говорят. Абсолютно всё.",
  ],
};

let _phrases: PhrasesData = readJson(PHRASES_PATH, DEFAULTS);
if (!fs.existsSync(PHRASES_PATH)) writeJson(PHRASES_PATH, _phrases);

export function getData(): PhrasesData { return _phrases; }

export function addPhrase(category: Category, text: string): string[] {
  _phrases[category].push(text);
  writeJson(PHRASES_PATH, _phrases);
  return _phrases[category];
}

export function deletePhrase(category: Category, index: number): string | null {
  if (index < 0 || index >= _phrases[category].length) return null;
  const [removed] = _phrases[category].splice(index, 1);
  writeJson(PHRASES_PATH, _phrases);
  return removed;
}

export function listPhrases(category: Category): string[] {
  return _phrases[category];
}

export function clearCategory(category: Category): void {
  _phrases[category] = [];
  writeJson(PHRASES_PATH, _phrases);
}

// ─── Special users ────────────────────────────────────────────────────────────

export type UserCategory = "phrases" | "gossips" | "secrets";

export interface SpecialUserData {
  username: string; // without @
  phrases:  string[];
  gossips:  string[];
  secrets:  string[];
}

type SpecialUsersStore = Record<string, SpecialUserData>;

let _specialUsers: SpecialUsersStore = readJson<SpecialUsersStore>(
  SPECIAL_USERS_PATH,
  { RolandForts: { username: "RolandForts", phrases: [], gossips: [], secrets: [] } }
);
if (!fs.existsSync(SPECIAL_USERS_PATH)) writeJson(SPECIAL_USERS_PATH, _specialUsers);

function saveSpecialUsers(): void {
  writeJson(SPECIAL_USERS_PATH, _specialUsers);
}

export function getSpecialUsers(): SpecialUsersStore {
  return _specialUsers;
}

export function getSpecialUser(username: string): SpecialUserData | null {
  return _specialUsers[username] ?? null;
}

/** Returns false if user already exists */
export function addSpecialUser(username: string): boolean {
  const key = username.replace(/^@/, "");
  if (_specialUsers[key]) return false;
  _specialUsers[key] = { username: key, phrases: [], gossips: [], secrets: [] };
  saveSpecialUsers();
  return true;
}

export function removeSpecialUser(username: string): boolean {
  const key = username.replace(/^@/, "");
  if (!_specialUsers[key]) return false;
  delete _specialUsers[key];
  saveSpecialUsers();
  return true;
}

export function addSpecialPhrase(username: string, cat: UserCategory, text: string): string[] | null {
  const user = _specialUsers[username];
  if (!user) return null;
  user[cat].push(text);
  saveSpecialUsers();
  return user[cat];
}

export function deleteSpecialPhrase(username: string, cat: UserCategory, index: number): string | null {
  const user = _specialUsers[username];
  if (!user || index < 0 || index >= user[cat].length) return null;
  const [removed] = user[cat].splice(index, 1);
  saveSpecialUsers();
  return removed;
}

export function clearSpecialPhrases(username: string, cat: UserCategory): boolean {
  const user = _specialUsers[username];
  if (!user) return false;
  user[cat] = [];
  saveSpecialUsers();
  return true;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface LogEntry { time: string; text: string; }

interface StatsData {
  total: number;
  dailyCounts: Record<string, number>;
  messageLog: Record<string, LogEntry[]>;
  ownerChatId: number | null;
}

let _stats: StatsData = readJson<StatsData>(STATS_PATH, {
  total: 0, dailyCounts: {}, messageLog: {}, ownerChatId: null,
});

function saveStats(): void { writeJson(STATS_PATH, _stats); }

export function setOwnerChatId(id: number): void {
  if (_stats.ownerChatId !== id) { _stats.ownerChatId = id; saveStats(); }
}
export function getOwnerChatId(): number | null { return _stats.ownerChatId; }

export function recordMessage(text: string): void {
  const day = todayKey();
  _stats.total += 1;
  _stats.dailyCounts[day] = (_stats.dailyCounts[day] ?? 0) + 1;
  if (!_stats.messageLog[day]) _stats.messageLog[day] = [];
  const time = new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow",
  });
  _stats.messageLog[day].push({ time, text });
  saveStats();
}

export function getStats(): { total: number; today: number; yesterday: number } {
  const today = todayKey();
  const yDate = new Date(); yDate.setDate(yDate.getDate() - 1);
  const yesterday = yDate.toISOString().slice(0, 10);
  return { total: _stats.total, today: _stats.dailyCounts[today] ?? 0, yesterday: _stats.dailyCounts[yesterday] ?? 0 };
}
export function getTodayLog(): LogEntry[] { return _stats.messageLog[todayKey()] ?? []; }
export function clearStats(): void {
  _stats.total = 0; _stats.dailyCounts = {}; _stats.messageLog = {}; saveStats();
}

// ─── Moderation ───────────────────────────────────────────────────────────────

interface ModerationData {
  warnings: Record<number, number>;
  blocked:  number[];
}

let _mod: ModerationData = readJson<ModerationData>(MOD_PATH, { warnings: {}, blocked: [] });
function saveMod(): void { writeJson(MOD_PATH, _mod); }

export const MAX_WARNINGS = 3;

export function isBlocked(chatId: number): boolean { return _mod.blocked.includes(chatId); }

export function blockUser(chatId: number): void {
  if (!_mod.blocked.includes(chatId)) { _mod.blocked.push(chatId); saveMod(); }
}
export function unblockUser(chatId: number): boolean {
  const idx = _mod.blocked.indexOf(chatId);
  if (idx === -1) return false;
  _mod.blocked.splice(idx, 1); saveMod(); return true;
}
export function getBlockedList(): number[] { return [..._mod.blocked]; }

export function warnUser(chatId: number): number {
  const next = (_mod.warnings[chatId] ?? 0) + 1;
  _mod.warnings[chatId] = next;
  if (next >= MAX_WARNINGS) blockUser(chatId);
  saveMod(); return next;
}
export function unwarnUser(chatId: number): number | null {
  const current = _mod.warnings[chatId] ?? 0;
  if (current === 0) return null;
  const next = current - 1;
  if (next === 0) delete _mod.warnings[chatId]; else _mod.warnings[chatId] = next;
  saveMod(); return next;
}
export function getWarnings(chatId: number): number { return _mod.warnings[chatId] ?? 0; }
export function clearWarnings(chatId: number): void { delete _mod.warnings[chatId]; saveMod(); }
