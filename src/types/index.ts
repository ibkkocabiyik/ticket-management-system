export type Role = "Admin" | "SupportTeam" | "EndUser";
export type Status = "Open" | "InProgress" | "Waiting" | "Resolved" | "Closed";
export type Priority = "Low" | "Normal" | "High" | "Urgent";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  phone?: string | null;
  company?: string | null;
  image?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface Attachment {
  id: string;
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  ticketId?: string | null;
  commentId?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: Pick<User, "id" | "name" | "email" | "role">;
  ticketId: string;
  attachments?: Attachment[];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creator: Pick<User, "id" | "name" | "email">;
  assigneeId?: string | null;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  categoryId: string;
  category: Category;
  comments?: Comment[];
  attachments?: Attachment[];
  _count?: {
    comments: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TicketFilters {
  status?: Status;
  priority?: Priority;
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "priority" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  waiting: number;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  userId: string;
  user: Pick<User, "id" | "name" | "role">;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface TicketTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  ticketId: string | null;
  transferRequestId: string | null;
  type: "ticket_created" | "comment_added" | "status_changed" | "ticket_assigned" | "transfer_request" | "transfer_approved" | "transfer_rejected";
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TransferRequest {
  id: string;
  ticketId: string;
  fromUserId: string;
  fromUser: Pick<User, "id" | "name">;
  toUserId: string;
  toUser: Pick<User, "id" | "name">;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }

  interface User {
    role: Role;
  }
}

// JWT type extension is handled in lib/auth.ts via NextAuth callbacks
