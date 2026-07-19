import { useState, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  MouseSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { generateId } from '@/lib/utils'
import { useProposalEditor } from '@/contexts/ProposalEditorContext'
import type { PdfField, PdfFieldType } from '@/types/proposal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  FileText,
  PenTool,
  Calendar,
  Type,
  Trash2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  HelpCircle
} from 'lucide-react'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

interface PdfEditorProps {
  documentUrl: string
}

// 1. Draggable Sidebar Field Component
function SidebarField({ type, label, icon: Icon }: { type: PdfFieldType; label: string; icon: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `new-${type}`
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-violet-500 transition-all ${
        isDragging ? 'opacity-50 scale-95 border-violet-500 ring-2 ring-violet-500/20' : ''
      }`}
    >
      <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <span className="font-semibold text-sm text-foreground">{label}</span>
        <p className="text-xs text-muted-foreground mt-0.5">Drag onto PDF</p>
      </div>
    </div>
  )
}

// 2. Droppable PDF Page Component
function DroppablePage({
  pageNumber,
  scale,
  fields,
  selectedFieldId,
  onSelectField,
  onRemoveField
}: {
  pageNumber: number
  scale: number
  fields: PdfField[]
  selectedFieldId: string | null
  onSelectField: (id: string) => void
  onRemoveField: (id: string) => void
}) {
  const { setNodeRef } = useDroppable({
    id: `page-${pageNumber}`
  })

  return (
    <div
      id={`page-${pageNumber}`}
      ref={setNodeRef}
      className="relative shadow-2xl rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white"
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        className="block"
      />
      {/* Placed Fields Overlay */}
      {fields
        .filter((f) => f.pageNumber === pageNumber)
        .map((field) => (
          <PlacedField
            key={field.id}
            field={field}
            isSelected={selectedFieldId === field.id}
            onSelect={() => onSelectField(field.id)}
            onRemove={() => onRemoveField(field.id)}
          />
        ))}
    </div>
  )
}

// 3. Draggable Placed Field Component
function PlacedField({
  field,
  isSelected,
  onSelect,
  onRemove
}: {
  field: PdfField
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: field.id
  })

  // Display style based on coordinate percentage
  const style = {
    position: 'absolute' as const,
    left: `${field.x}%`,
    top: `${field.y}%`,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isSelected ? 40 : 30
  }

  const getIcon = () => {
    switch (field.type) {
      case 'signature':
        return <PenTool className="w-4 h-4" />
      case 'date':
        return <Calendar className="w-4 h-4" />
      case 'text':
        return <Type className="w-4 h-4" />
    }
  }

  return (
    <div
      ref={setNodeRef}
      data-testid={`placed-field-${field.id}`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={`group flex items-center justify-between gap-2 px-3 py-2 border rounded-xl shadow-lg cursor-grab active:cursor-grabbing select-none transition-all ${
        isSelected
          ? 'bg-violet-600 text-white border-violet-700 ring-4 ring-violet-500/20 shadow-violet-500/20'
          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 border-slate-200 dark:border-slate-800 hover:border-violet-500'
      }`}
      style={{
        ...style,
        width: `${field.width}px`,
        height: `${field.height}px`
      }}
    >
      <div className="flex items-center gap-2 overflow-hidden" {...listeners} {...attributes}>
        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-violet-500 text-white' : 'bg-violet-50 dark:bg-violet-950/40 text-violet-600'}`}>
          {getIcon()}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider truncate">
          {field.type}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className={`p-1 rounded-md transition-colors duration-200 opacity-0 group-hover:opacity-100 ${
          isSelected
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function PdfEditor({ documentUrl }: PdfEditorProps) {
  const { proposal, dispatch } = useProposalEditor()
  const [numPages, setNumPages] = useState<number | null>(null)
  const [scale, setScale] = useState(1.0)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Configure mouse sensor with activation constraint to distinguish click vs drag
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5
    }
  })
  const sensors = useSensors(mouseSensor)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const pageId = over.id as string
    const pageNumber = parseInt(pageId.split('-')[1])
    const pageElement = document.getElementById(pageId)

    if (!pageElement || !(event as any).rects?.translated) return

    const pageRect = pageElement.getBoundingClientRect()
    const draggedRect = (event as any).rects.translated

    // Calculate relative coordinates in percentages
    const x = ((draggedRect.left - pageRect.left) / pageRect.width) * 100
    const y = ((draggedRect.top - pageRect.top) / pageRect.height) * 100

    const boundedX = Math.max(0, Math.min(100 - (150 / pageRect.width) * 100, x))
    const boundedY = Math.max(0, Math.min(100 - (48 / pageRect.height) * 100, y))

    const pdfFields = [...(proposal.pdf_fields || [])]

    if (active.id.toString().startsWith('new-')) {
      const type = active.id.toString().replace('new-', '') as PdfFieldType
      const newField: PdfField = {
        id: generateId(),
        type,
        pageNumber,
        x: boundedX,
        y: boundedY,
        width: 150,
        height: 48,
        required: true
      }

      dispatch({
        type: 'UPDATE_METADATA',
        payload: { pdf_fields: [...pdfFields, newField] }
      })
      setSelectedFieldId(newField.id)
    } else {
      // Reposition existing field
      const updatedFields = pdfFields.map((f) => {
        if (f.id === active.id) {
          return {
            ...f,
            pageNumber,
            x: boundedX,
            y: boundedY
          }
        }
        return f
      })

      dispatch({
        type: 'UPDATE_METADATA',
        payload: { pdf_fields: updatedFields }
      })
    }
  }

  const removeField = (id: string) => {
    const pdfFields = (proposal.pdf_fields || []).filter((f) => f.id !== id)
    dispatch({
      type: 'UPDATE_METADATA',
      payload: { pdf_fields: pdfFields }
    })
    if (selectedFieldId === id) {
      setSelectedFieldId(null)
    }
  }

  const toggleFieldRequired = (id: string, required: boolean) => {
    const pdfFields = (proposal.pdf_fields || []).map((f) =>
      f.id === id ? { ...f, required } : f
    )
    dispatch({
      type: 'UPDATE_METADATA',
      payload: { pdf_fields: pdfFields }
    })
  }

  const selectedField = (proposal.pdf_fields || []).find(
    (f) => f.id === selectedFieldId
  )

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Form Fields */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Fields
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Drag signature, text, or date fields onto your document pages.
              </p>
              <div className="space-y-3">
                <SidebarField type="signature" label="Signature" icon={PenTool} />
                <SidebarField type="date" label="Date Signed" icon={Calendar} />
                <SidebarField type="text" label="Text Field" icon={Type} />
              </div>
            </div>

            {selectedField && (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 animate-[fadeIn_0.3s_ease-out]">
                <h3 className="text-sm font-bold text-foreground mb-4">Field Settings</h3>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Required</Label>
                    <button
                      onClick={() => toggleFieldRequired(selectedField.id, !selectedField.required)}
                      aria-label="Toggle required"
                      data-testid="toggle-required"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        selectedField.required ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          selectedField.required ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/50"
                    onClick={() => removeField(selectedField.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Field
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-900">
            <HelpCircle className="w-4 h-4 text-violet-500 shrink-0" />
            <span>Click placed fields to customize their required settings.</span>
          </div>
        </aside>

        {/* Center: Scrollable Canvas */}
        <div
          ref={containerRef}
          onClick={() => setSelectedFieldId(null)}
          className="flex-1 overflow-y-auto bg-slate-100/50 dark:bg-slate-950/50 p-12 flex justify-center"
        >
          <div className="space-y-8 max-w-4xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur px-5 py-3.5 rounded-2xl shadow-xl shadow-slate-100/10">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-violet-600" />
                <span className="text-sm font-bold text-foreground">
                  PDF Document ({numPages} {numPages === 1 ? 'Page' : 'Pages'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  data-testid="zoom-out"
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs font-bold text-muted-foreground w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  data-testid="zoom-in"
                  onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Document Pages Container */}
            <Document
              file={documentUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-semibold text-muted-foreground">Rendering PDF Pages...</p>
                </div>
              }
            >
              {numPages &&
                Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNumber) => (
                  <div key={pageNumber} className="relative mb-8">
                    <DroppablePage
                      pageNumber={pageNumber}
                      scale={scale}
                      fields={proposal.pdf_fields || []}
                      selectedFieldId={selectedFieldId}
                      onSelectField={setSelectedFieldId}
                      onRemoveField={removeField}
                    />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                      Page {pageNumber} of {numPages}
                    </div>
                  </div>
                ))}
            </Document>
          </div>
        </div>
      </div>
    </DndContext>
  )
}
