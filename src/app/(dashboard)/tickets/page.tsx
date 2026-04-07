"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketDetail } from "@/components/tickets/TicketDetail";
import { useNewTicket } from "@/context/NewTicketContext";

export default function TicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { open: openNewTicket } = useNewTicket();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Talep Yönetimi
          </h1>
          <p className="mt-0.5 md:mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tüm destek taleplerini yönetin ve takip edin
          </p>
        </div>
        <Button className="gap-1.5 md:gap-2 shrink-0" onClick={openNewTicket}>
          <PlusCircle size={16} />
          <span className="hidden sm:inline">Yeni Talep</span>
          <span className="sm:hidden">Yeni</span>
        </Button>
      </div>

      <TicketList onTicketClick={(id) => setSelectedTicketId(id)} />

      {/* Ticket Detay Modal */}
      <Modal
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        size="2xl"
      >
        {selectedTicketId && (
          <TicketDetail
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        )}
      </Modal>
    </div>
  );
}
