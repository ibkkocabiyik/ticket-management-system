"use client";

import { Modal } from "@/components/ui/Modal";
import { TicketDetail } from "@/components/tickets/TicketDetail";
import { useTicketDetail } from "@/context/TicketDetailContext";

export function GlobalTicketModal() {
  const { selectedTicketId, closeTicket } = useTicketDetail();

  return (
    <Modal isOpen={!!selectedTicketId} onClose={closeTicket} size="2xl">
      {selectedTicketId && (
        <TicketDetail ticketId={selectedTicketId} onClose={closeTicket} />
      )}
    </Modal>
  );
}
