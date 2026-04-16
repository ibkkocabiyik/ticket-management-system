"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTicketComments, useCreateComment, useDeleteComment, useReplyComment } from "@/hooks/useTicket";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import type { Comment } from "@/types";
import { MessageSquare, Send, Trash2, Reply } from "lucide-react";
import { FileInput } from "@/components/ui/FileInput";
import { AttachmentList } from "./AttachmentList";
import Swal from "sweetalert2";

const roleLabels: Record<string, string> = {
  Admin: "Admin",
  SupportTeam: "Destek Ekibi",
  EndUser: "Kullanıcı",
};

const roleColors: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  SupportTeam: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EndUser: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
};

function getSwalTheme() {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return { background: isDark ? "#1f2937" : "#ffffff", color: isDark ? "#f9fafb" : "#111827" };
}

interface CommentItemProps {
  comment: Comment;
  isAdmin: boolean;
  onDeleteRequest: (id: string) => void;
  onReplyRequest: (id: string) => void;
  isNewest: boolean;
}

function CommentItem({ comment, isAdmin, onDeleteRequest, onReplyRequest, isNewest }: CommentItemProps) {
  const formattedDate = new Date(comment.createdAt).toLocaleDateString("tr-TR", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const isHtml = comment.content.trim().startsWith("<");

  return (
    <div className={isNewest ? "animate-comment-in" : ""}>
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {comment.author.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{comment.author.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[comment.author.role] ?? roleColors.EndUser}`}>
              {roleLabels[comment.author.role] ?? comment.author.role}
            </span>
            <span className="text-xs text-gray-400">{formattedDate}</span>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
            {isHtml ? (
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: comment.content }} />
            ) : (
              <p className="whitespace-pre-wrap">{comment.content}</p>
            )}
            <AttachmentList attachments={comment.attachments ?? []} />
          </div>
          {isAdmin && (
            <div className="mt-1.5 flex items-center gap-3">
              <button
                onClick={() => onReplyRequest(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <Reply size={12} /> Yanıtla
              </button>
              <button
                onClick={() => onDeleteRequest(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} /> Sil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isAdmin={isAdmin}
              onDeleteRequest={onDeleteRequest}
              onReplyRequest={onReplyRequest}
              isNewest={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentSectionProps {
  ticketId: string;
  readOnly?: boolean;
}

export function CommentSection({ ticketId, readOnly = false }: CommentSectionProps) {
  const { data: session } = useSession();
  const { data: comments, isLoading } = useTicketComments(ticketId);
  const { mutateAsync: createComment } = useCreateComment(ticketId);
  const { mutateAsync: deleteComment } = useDeleteComment(ticketId);
  const { mutateAsync: replyComment, isPending: isReplying } = useReplyComment(ticketId);

  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const newestCommentId = useRef<string | null>(null);

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyEditorKey, setReplyEditorKey] = useState(0);

  const isAdmin = session?.user?.role === "Admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stripped = content.replace(/<[^>]*>/g, "").trim();
    if (!stripped) { setContentError("Yorum boş olamaz"); return; }
    setContentError(null);
    setIsSubmitting(true);
    try {
      const comment = await createComment({ content, files: files.length > 0 ? files : undefined });
      newestCommentId.current = comment.id;
      setContent("");
      setFiles([]);
      setEditorKey((k) => k + 1);
    } catch (error) {
      setContentError(error instanceof Error ? error.message : "Yorum gönderilemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async (commentId: string) => {
    const result = await Swal.fire({
      title: "Yorumu Sil",
      text: "Bu yorum kalıcı olarak silinecek. Devam etmek istiyor musunuz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sil",
      cancelButtonText: "İptal",
      ...getSwalTheme(),
    });
    if (result.isConfirmed) {
      try {
        await deleteComment(commentId);
      } catch (err) {
        void Swal.fire({ title: "Hata", text: err instanceof Error ? err.message : "Yorum silinemedi", icon: "error", ...getSwalTheme() });
      }
    }
  };

  const handleReplySubmit = async () => {
    const stripped = replyContent.replace(/<[^>]*>/g, "").trim();
    if (!stripped) { setReplyError("Yanıt boş olamaz"); return; }
    try {
      await replyComment({
        content: replyContent,
        parentCommentId: replyToId!,
        files: replyFiles.length > 0 ? replyFiles : undefined,
      });
      setReplyToId(null);
      setReplyContent("");
      setReplyFiles([]);
      setReplyEditorKey((k) => k + 1);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Yanıt gönderilemedi");
    }
  };

  const commentList = comments as Comment[] | undefined;
  const totalCount = (commentList ?? []).reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare size={18} className="text-gray-500" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Yorumlar ({totalCount})
        </h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {(commentList?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">Henüz yorum yok. İlk yorumu siz yapın!</p>
            </div>
          ) : (
            commentList!.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  isAdmin={isAdmin}
                  onDeleteRequest={handleDeleteRequest}
                  onReplyRequest={(id) => { setReplyToId(id); setReplyContent(""); setReplyEditorKey((k) => k + 1); }}
                  isNewest={comment.id === newestCommentId.current}
                />
                {/* Inline reply editor */}
                {replyToId === comment.id && (
                  <div className="ml-11 mt-3">
                    <RichTextEditor
                      key={replyEditorKey}
                      value={replyContent}
                      onChange={(html) => { setReplyContent(html); if (replyError) setReplyError(null); }}
                      placeholder="Yanıtınızı yazın..."
                      maxLength={2000}
                      error={replyError ?? undefined}
                      minHeight="80px"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <FileInput files={replyFiles} onChange={setReplyFiles} />
                      <div className="ml-auto flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setReplyToId(null)}>İptal</Button>
                        <Button size="sm" isLoading={isReplying} onClick={() => void handleReplySubmit()} className="gap-1.5">
                          <Reply size={13} /> Yanıtla
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {session && !readOnly && (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <RichTextEditor
                key={editorKey}
                value={content}
                onChange={(html) => { setContent(html); if (contentError) setContentError(null); }}
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
