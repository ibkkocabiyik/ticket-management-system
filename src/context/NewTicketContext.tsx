"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface NewTicketContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  lastCreatedId: string | null;
  setLastCreatedId: (id: string | null) => void;
}

const NewTicketContext = createContext<NewTicketContextValue | null>(null);

export function NewTicketProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  return (
    <NewTicketContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        lastCreatedId,
        setLastCreatedId,
      }}
    >
      {children}
    </NewTicketContext.Provider>
  );
}

export function useNewTicket() {
  const ctx = useContext(NewTicketContext);
  if (!ctx) throw new Error("useNewTicket must be used inside NewTicketProvider");
  return ctx;
}
