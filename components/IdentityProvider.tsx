"use client";

import { createContext, useContext, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useIdentity } from "../hooks/useIdentity";
import Landing from "./Landing";
import Greeting from "./Greeting";

type Identity = ReturnType<typeof useIdentity>;

const IdentityContext = createContext<Identity | null>(null);

export function useIdentityContext(): Identity {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentityContext must be used within IdentityProvider");
  return ctx;
}

/**
 * Gates every route behind the name-only pseudo-login and shares one
 * identity instance across pages — without this, each page's own
 * useIdentity() call would go out of sync (e.g. "not you?" on one page
 * wouldn't be reflected on another until a full reload).
 */
export default function IdentityProvider({ children }: { children: ReactNode }) {
  const identity = useIdentity();

  if (!identity.name) {
    return <Landing onEnter={identity.setName} />;
  }

  return (
    <IdentityContext.Provider value={identity}>
      <AnimatePresence>
        {identity.justEntered && <Greeting name={identity.name} onDone={identity.acknowledgeGreeting} />}
      </AnimatePresence>
      {children}
    </IdentityContext.Provider>
  );
}
