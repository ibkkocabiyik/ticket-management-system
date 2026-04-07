import { TicketDetail } from "@/components/tickets/TicketDetail";

interface Props {
  params: { id: string };
}

export default function TicketDetailPage({ params }: Props) {
  return <TicketDetail ticketId={params.id} />;
}
