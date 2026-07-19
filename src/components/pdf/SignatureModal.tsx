import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PenTool, Type, Eraser, Sparkles } from 'lucide-react'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (signatureData: string) => void
  defaultName?: string
}

const CURSIVE_FONTS = [
  { name: 'Satisfy', family: "'Satisfy', cursive" },
  { name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { name: 'Alex Brush', family: "'Alex Brush', cursive" },
  { name: 'Brush Script', family: "'Brush Script MT', cursive, sans-serif" }
]

export function SignatureModal({ isOpen, onClose, onSave, defaultName = '' }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName] = useState(defaultName)
  const [selectedFont, setSelectedFont] = useState(CURSIVE_FONTS[0])
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  // Dynamically load cursive fonts from Google Fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Great+Vibes&family=Satisfy&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === 'draw' && isOpen && canvasRef.current) {
      const canvas = canvasRef.current
      // Support high-DPI displays
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const context = canvas.getContext('2d')
      if (context) {
        context.scale(2, 2)
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.strokeStyle = '#1e1b4b' // Dark Indigo ink
        context.lineWidth = 2.5
        contextRef.current = context
      }
    }
  }, [activeTab, isOpen])

  // Clear Canvas
  const clearCanvas = () => {
    if (canvasRef.current && contextRef.current) {
      const canvas = canvasRef.current
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // Pointer Event Handlers for Canvas Drawing (pen, touch, mouse)
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!contextRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    contextRef.current.beginPath()
    contextRef.current.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    contextRef.current.lineTo(x, y)
    contextRef.current.stroke()
  }

  const stopDrawing = () => {
    if (!contextRef.current) return
    contextRef.current.closePath()
    setIsDrawing(false)
  }

  const handleApply = () => {
    if (activeTab === 'draw') {
      if (!canvasRef.current) return
      // Check if canvas is empty before saving
      const canvas = canvasRef.current
      const isCanvasBlank = () => {
        const blank = document.createElement('canvas')
        blank.width = canvas.width
        blank.height = canvas.height
        return canvas.toDataURL() === blank.toDataURL()
      }
      if (isCanvasBlank()) {
        alert('Please draw a signature first.')
        return
      }
      const dataUrl = canvas.toDataURL('image/png')
      onSave(dataUrl)
    } else {
      if (!typedName.trim()) {
        alert('Please type your name first.')
        return
      }
      // Encode font name inside typed signature string
      onSave(`typed-signature:${typedName}:${selectedFont.name}`)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl glass border border-slate-200/60 dark:border-slate-800/60 shadow-2xl p-6 rounded-3xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
            Create Your Signature
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose to draw a signature or type it with a cursive brush style.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selectors */}
        <div className="flex bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-md shadow-slate-200/50 dark:shadow-none'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PenTool className="w-4 h-4" /> Draw Signature
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'type'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-md shadow-slate-200/50 dark:shadow-none'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Type className="w-4 h-4" /> Type Signature
          </button>
        </div>

        {/* Draw Canvas Tab */}
        {activeTab === 'draw' && (
          <div className="space-y-4">
            <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/20 shadow-inner h-60">
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none"
              />
              <button
                onClick={clearCanvas}
                className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-red-500 bg-white/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Draw on the canvas using stylus, finger, or mouse pointer.
            </p>
          </div>
        )}

        {/* Type Signature Tab */}
        {activeTab === 'type' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-violet-500/30 h-10 text-sm"
              />
            </div>

            {/* Font Picker */}
            <div className="grid grid-cols-4 gap-2">
              {CURSIVE_FONTS.map((font) => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(font)}
                  className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200 truncate ${
                    selectedFont.name === font.name
                      ? 'bg-violet-50 border-violet-500 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400'
                      : 'border-slate-200 dark:border-slate-800 hover:border-violet-500/50'
                  }`}
                >
                  {font.name}
                </button>
              ))}
            </div>

            {/* Live Cursive Preview */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-950/20 shadow-inner min-h-[140px] flex items-center justify-center">
              {typedName ? (
                <div
                  className="text-4xl text-slate-800 dark:text-slate-100 tracking-wider transition-all"
                  style={{ fontFamily: selectedFont.family }}
                >
                  {typedName}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Type your name to preview signature</p>
              )}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
          >
            Apply Signature
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
