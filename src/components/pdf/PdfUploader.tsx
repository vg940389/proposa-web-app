import { useState, useCallback } from 'react'
import { uploadProposalPdf } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react'

interface PdfUploaderProps {
  onUploadSuccess: (url: string) => void
}

export function PdfUploader({ onUploadSuccess }: PdfUploaderProps) {
  const { user } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      if (!user) {
        // Mock upload for UI testing when not logged in
        setTimeout(() => {
          onUploadSuccess(URL.createObjectURL(file))
        }, 1000)
        return
      }

      const url = await uploadProposalPdf(file, user.id)
      onUploadSuccess(url)
    } catch (err: any) {
      console.error('Error uploading PDF:', err)
      setError(err?.message || 'Failed to upload PDF. Please try again.')
    } finally {
      if (user) {
        setIsUploading(false)
      } else {
        setTimeout(() => setIsUploading(false), 1000)
      }
    }
  }, [user, onUploadSuccess])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <Card className={`glass border-dashed-2 transition-all duration-300 rounded-3xl overflow-hidden ${
      isDragging
        ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/10 scale-[1.01] shadow-2xl shadow-indigo-500/10'
        : 'border-gray-200 hover:border-violet-400 hover:shadow-xl hover:shadow-indigo-500/5'
    }`}>
      <CardContent className="p-12">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px]"
          onClick={() => document.getElementById('pdf-file-input')?.click()}
        >
          <input
            id="pdf-file-input"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileInput}
            disabled={isUploading}
          />

          <div className={`p-6 rounded-2xl mb-6 transition-all duration-500 ${
            isDragging
              ? 'bg-violet-600 text-white rotate-6 scale-110'
              : 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 hover:scale-105'
          }`}>
            {isUploading ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : (
              <Upload className="w-10 h-10" />
            )}
          </div>

          <h3 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
            {isUploading ? 'Uploading your document...' : 'Upload your PDF'}
          </h3>

          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6 leading-relaxed">
            Drag and drop your PDF here, or click to browse. Max size 10MB.
          </p>

          {isUploading && (
            <div className="w-64 bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full w-2/3 rounded-full animate-[pulse_1.5s_infinite]"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl text-sm font-semibold max-w-md mt-4 border border-destructive/20 animate-[shake_0.5s_ease-in-out]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
