"use client";

import { PlusCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { TicketList } from "@/components/tickets/TicketList";
import { useNewTicket } from "@/context/NewTicketContext";
import { useTicketDetail } from "@/context/TicketDetailContext";

export default function TicketsPage() {
  const { open: openNewTicket } = useNewTicket();
  const { openTicket } = useTicketDetail();
  const { data: session } = useSession();
  const canCreate = session?.user?.role !== "SupportTeam";

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
        {canCreate && (
          <Button className="gap-1.5 md:gap-2 shrink-0" onClick={openNewTicket}>
            <PlusCircle size={16} />
            <span className="hidden sm:inline">Yeni Talep</span>
            <span className="sm:hidden">Yeni</span>
          </Button>
        )}
      </div>

      <TicketList onTicketClick={openTicket} />
    </div>
  );
}
