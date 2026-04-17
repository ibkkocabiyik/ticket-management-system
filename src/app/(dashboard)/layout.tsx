import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { NewTicketProvider } from "@/context/NewTicketContext";
import { NewTicketModalWrapper } from "@/components/tickets/NewTicketModalWrapper";
import { TicketDetailProvider } from "@/context/TicketDetailContext";
import { GlobalTicketModal } from "@/components/tickets/GlobalTicketModal";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <NewTicketProvider>
      <TicketDetailProvider>
        <div className="flex h-screen w-full min-w-0 overflow-x-hidden bg-[#F0F2FF] dark:bg-[hsl(var(--background))]">
          {/* Sidebar — masaüstünde görünür, mobilde gizli */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            {/* Mobilde alt nav için padding-bottom */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 scrollbar-thin">
              {children}
            </main>
          </div>

          {/* Bottom Navigation — yalnızca mobil/tablet */}
          <BottomNav role={session.user.role} />
        </div>

        {/* Global Yeni Talep Modal */}
        <NewTicketModalWrapper />

        {/* Global Talep Detay Modal */}
        <GlobalTicketModal />

        {/* Klavye kısayolları (N: yeni talep) */}
        <KeyboardShortcuts />
      </TicketDetailProvider>
    </NewTicketProvider>
  );
}
