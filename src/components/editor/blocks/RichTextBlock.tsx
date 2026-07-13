import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { useEffect } from 'react'

interface RichTextBlockProps {
  data: any
  onChange: (data: any) => void
  readOnly?: boolean
}

export function RichTextBlock({ data, onChange, readOnly = false }: RichTextBlockProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Write something or type "/" for commands...',
      }),
    ],
    content: data.body || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange({ body: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && data.body !== editor.getHTML()) {
      // Need to handle external updates if needed
    }
  }, [data.body, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {!readOnly && (
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <span className="font-bold px-2">B</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <span className="italic px-2">I</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded ${editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <span className="underline px-2">U</span>
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <span className="font-bold px-2">H2</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <span className="font-bold px-2">H3</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <span className="px-2">&bull; List</span>
          </button>
        </div>
      )}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
