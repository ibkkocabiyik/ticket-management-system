"use client";

import { Modal } from "@/components/ui/Modal";
import { TicketForm } from "@/components/tickets/TicketForm";
import { useNewTicket } from "@/context/NewTicketContext";

export function NewTicketModalWrapper() {
  const { isOpen, close, setLastCreatedId } = useNewTicket();

  return (
    <Modal isOpen={isOpen} onClose={close} title="Yeni Talep Oluştur" size="lg">
      <TicketForm
        onSuccess={(id) => {
          setLastCreatedId(id);
          close();
        }}
        onCancel={close}
      />
    </Modal>
  );
}
