"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface TicketDetailContextValue {
  selectedTicketId: string | null;
  openTicket: (id: string) => void;
  closeTicket: () => void;
}

const TicketDetailContext = createContext<TicketDetailContextValue | null>(null);

export function TicketDetailProvider({ children }: { children: ReactNode }) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  return (
    <TicketDetailContext.Provider
      value={{
        selectedTicketId,
        openTicket: (id) => setSelectedTicketId(id),
        closeTicket: () => setSelectedTicketId(null),
      }}
    >
      {children}
    </TicketDetailContext.Provider>
  );
}

export function useTicketDetail() {
  const ctx = useContext(TicketDetailContext);
  if (!ctx) throw new Error("useTicketDetail must be used inside TicketDetailProvider");
  return ctx;
}
