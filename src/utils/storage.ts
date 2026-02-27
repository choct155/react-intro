import { Todo } from '../types';

const TODOS_KEY = 'vtodo:todos';
const AUTH_KEY = 'vtodo:auth';

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(TODOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface StoredAuth {
  credentialId: string | null;
  hasRegistered: boolean;
}

export function saveAuth(state: StoredAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function loadAuth(): StoredAuth {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : { credentialId: null, hasRegistered: false };
  } catch {
    return { credentialId: null, hasRegistered: false };
  }
}
