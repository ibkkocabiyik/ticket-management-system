"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading2,
  Undo,
  Redo,
  Minus,
} from "lucide-react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  className?: string;
  minHeight?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded p-1.5 text-sm transition-colors disabled:opacity-40 ${
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Buraya yazın...",
  maxLength,
  error,
  className = "",
  minHeight = "120px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : []),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  const charCount = maxLength ? editor.storage.characterCount?.characters?.() ?? 0 : null;

  return (
    <div className={`overflow-hidden rounded-lg border transition-colors ${error ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"} ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800/50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Kalın"
        >
          <Bold size={14} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="İtalik"
        >
          <Italic size={14} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Başlık"
        >
          <Heading2 size={14} />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Madde listesi"
        >
          <List size={14} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numaralı liste"
        >
          <ListOrdered size={14} />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Kod"
        >
          <Code size={14} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Yatay çizgi"
        >
          <Minus size={14} />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri al"
        >
          <Undo size={14} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Yeniden yap"
        >
          <Redo size={14} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        style={{ minHeight }}
      />

      {/* Footer: char count */}
      {maxLength && charCount !== null && (
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800/50">
          <span className={`text-xs ${charCount >= maxLength ? "text-red-500" : "text-gray-400"}`}>
            {charCount}/{maxLength}
          </span>
        </div>
      )}

      {error && (
        <p className="px-3 pb-2 pt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
