"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTicketComments, useCreateComment } from "@/hooks/useTicket";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import type { Comment } from "@/types";
import { MessageSquare, Send } from "lucide-react";
import { FileInput } from "@/components/ui/FileInput";
import { AttachmentList } from "./AttachmentList";

const roleLabels: Record<string, string> = {
  Admin: "Admin",
  SupportTeam: "Destek Ekibi",
  EndUser: "Kullanıcı",
};

interface CommentItemProps {
  comment: Comment;
}

function CommentItem({ comment }: CommentItemProps) {
  const formattedDate = new Date(comment.createdAt).toLocaleDateString("tr-TR", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const roleColors: Record<string, string> = {
    Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    SupportTeam: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    EndUser: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
  };

  const isHtml = comment.content.trim().startsWith("<");

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          {comment.author.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {comment.author.name}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              roleColors[comment.author.role] ?? roleColors.EndUser
            }`}
          >
            {roleLabels[comment.author.role] ?? comment.author.role}
          </span>
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
          {isHtml ? (
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          ) : (
            <p className="whitespace-pre-wrap">{comment.content}</p>
          )}
          <AttachmentList attachments={comment.attachments ?? []} />
        </div>
      </div>
    </div>
  );
}

interface CommentSectionProps {
  ticketId: string;
}

export function CommentSection({ ticketId }: CommentSectionProps) {
  const { data: session } = useSession();
  const { data: comments, isLoading } = useTicketComments(ticketId);
  const { mutateAsync: createComment } = useCreateComment(ticketId);
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stripped = content.replace(/<[^>]*>/g, "").trim();
    if (!stripped) {
      setContentError("Yorum boş olamaz");
      return;
    }
    setContentError(null);
    setIsSubmitting(true);
    try {
      await createComment({ content, files: files.length > 0 ? files : undefined });
      setContent("");
      setFiles([]);
    } catch (error) {
      setContentError(error instanceof Error ? error.message : "Yorum gönderilemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare size={18} className="text-gray-500" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Yorumlar ({(comments as Comment[] | undefined)?.length ?? 0})
        </h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {(comments as Comment[] | undefined)?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Henüz yorum yok. İlk yorumu siz yapın!
              </p>
            </div>
          ) : (
            (comments as Comment[]).map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>
      )}

      {session && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <RichTextEditor
                value={content}
                onChange={(html) => {
                  setContent(html);
                  if (contentError) setContentError(null);
                }}
                placeholder="Yorum ekleyin..."
                maxLength={2000}
                error={contentError ?? undefined}
                minHeight="80px"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <FileInput files={files} onChange={setFiles} />
                <Button type="submit" size="sm" isLoading={isSubmitting} className="gap-2 ml-auto">
                  <Send size={14} />
                  Yorum Gönder
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
