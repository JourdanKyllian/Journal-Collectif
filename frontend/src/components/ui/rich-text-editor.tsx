"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Underline, Heading2, ImageIcon, Link as LinkIcon, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Composant d'édition de texte riche basé sur Tiptap.
 * Gère le formatage du texte, les listes, les liens et l'upload d'images via l'API.
 *
 * @param {RichTextEditorProps} props - Les propriétés du composant.
 * @returns {JSX.Element | null} L'interface utilisateur de l'éditeur de texte.
 */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[250px] p-4 font-montserrat",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg, image/png, image/webp";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetchApi<{ url: string }>("/v1/upload/image", {
          method: "POST",
          body: formData,
        });

        if (response?.url) {
          const fullUrl = process.env.NODE_ENV === "production" ? response.url : `http://localhost:4000${response.url}`;
          editor.chain().focus().setImage({ src: fullUrl }).run();
        }
      } catch (error) {
        console.error("Échec de l'upload de l'image:", error);
        alert("L'upload de l'image a échoué. Veuillez vérifier le format et la taille.");
      }
    };

    input.click();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien :", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border border-champagne/40 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-or/30 focus-within:border-or transition-all bg-blanc">
      <div className="bg-champagne/15 px-3 py-2 border-b border-champagne/30 flex gap-1.5 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 rounded-lg border border-transparent ${editor.isActive("bold") ? "bg-or/20 border-or/40 text-noir" : "bg-blanc text-noir hover:bg-or/10"}`}
          aria-label="Mettre en gras"
        >
          <Bold size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 rounded-lg border border-transparent ${editor.isActive("italic") ? "bg-or/20 border-or/40 text-noir" : "bg-blanc text-noir hover:bg-or/10"}`}
          aria-label="Mettre en italique"
        >
          <Italic size={14} />
        </Button>

        <span className="w-px bg-champagne/30 mx-1 shrink-0"></span>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 rounded-lg border border-transparent ${editor.isActive("heading", { level: 2 }) ? "bg-or/20 border-or/40 text-noir" : "bg-blanc text-noir hover:bg-or/10"}`}
          aria-label="Titre principal"
        >
          <Heading2 size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 rounded-lg border border-transparent ${editor.isActive("bulletList") ? "bg-or/20 border-or/40 text-noir" : "bg-blanc text-noir hover:bg-or/10"}`}
          aria-label="Liste à puces"
        >
          <List size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 rounded-lg border border-transparent ${editor.isActive("orderedList") ? "bg-or/20 border-or/40 text-noir" : "bg-blanc text-noir hover:bg-or/10"}`}
          aria-label="Liste numérotée"
        >
          <ListOrdered size={14} />
        </Button>

        <span className="w-px bg-champagne/30 mx-1 shrink-0"></span>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={setLink}
          className={`h-8 w-8 rounded-lg border border-transparent ${editor.isActive("link") ? "bg-or/20 border-or/40 text-noir" : "bg-blanc text-noir hover:bg-or/10"}`}
          aria-label="Insérer un lien"
        >
          <LinkIcon size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={addImage}
          className="h-8 w-8 bg-blanc border-transparent text-noir hover:bg-or/10 rounded-lg"
          aria-label="Insérer une image"
        >
          <ImageIcon size={14} />
        </Button>
      </div>

      <div className="prose-wrapper min-h-62.5 cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
