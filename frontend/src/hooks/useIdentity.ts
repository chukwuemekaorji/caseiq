import { useCallback, useState } from "react";

const STORAGE_KEY = "caseiq:name";

function readStoredName(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useIdentity() {
  const [name, setNameState] = useState<string | null>(readStoredName);
  const [justEntered, setJustEntered] = useState(false);

  const setName = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // private browsing / storage disabled — name still works for this session
    }
    setNameState(trimmed);
    setJustEntered(true);
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setNameState(null);
  }, []);

  const acknowledgeGreeting = useCallback(() => setJustEntered(false), []);

  return { name, setName, clear, justEntered, acknowledgeGreeting };
}
