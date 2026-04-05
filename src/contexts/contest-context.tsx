'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ContestContextValue {
  contestId: string | null;
  contestName: string | null;
  setContest: (id: string, name: string) => void;
  clearContest: () => void;
}

const ContestContext = createContext<ContestContextValue | null>(null);

export function ContestProvider({ children }: { children: ReactNode }) {
  const [contestId, setContestId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hitch_contest_id') ?? null;
    }
    return null;
  });
  const [contestName, setContestName] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hitch_contest_name') ?? null;
    }
    return null;
  });

  function setContest(id: string, name: string) {
    setContestId(id);
    setContestName(name);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hitch_contest_id', id);
      sessionStorage.setItem('hitch_contest_name', name);
    }
  }

  function clearContest() {
    setContestId(null);
    setContestName(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hitch_contest_id');
      sessionStorage.removeItem('hitch_contest_name');
    }
  }

  return (
    <ContestContext.Provider value={{ contestId, contestName, setContest, clearContest }}>
      {children}
    </ContestContext.Provider>
  );
}

export function useContest() {
  const ctx = useContext(ContestContext);
  if (!ctx) throw new Error('useContest must be used within ContestProvider');
  return ctx;
}
