import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicProposal } from '../hooks/usePublicProposal'
import { BlockRenderer } from '../components/editor/BlockRenderer'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from '../lib/supabase'
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  PenTool,
  Calendar,
  Type,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { SignatureModal } from '../components/pdf/SignatureModal'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

declare global {
  interface Window {
    Razorpay: any
  }
}

const CURSIVE_FONTS = [
  { name: 'Satisfy', family: "'Satisfy', cursive" },
  { name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { name: 'Alex Brush', family: "'Alex Brush', cursive" },
  { name: 'Brush Script', family: "'Brush Script MT', cursive, sans-serif" }
]

export function PublicProposalPage() {
  const { token } = useParams<{ token: string }>()
  const { proposal, loading, error, setProposal } = usePublicProposal(token)

  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  // PDF Viewer states
  const [numPages, setNumPages] = useState<number | null>(null)
  const [scale, setScale] = useState(1.0)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [activeSignatureFieldId, setActiveSignatureFieldId] = useState<string | null>(null)
  const [activeInputId, setActiveInputId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Load Razorpay script & Google Fonts
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    const fontLink = document.createElement('link')
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Great+Vibes&family=Satisfy&display=swap'
    fontLink.rel = 'stylesheet'
    document.head.appendChild(fontLink)

    return () => {
      document.body.removeChild(script)
      document.head.removeChild(fontLink)
    }
  }, [])

  // Auto-resize PDF to match container width
  useEffect(() => {
    if (proposal?.document_type !== 'pdf' || !containerRef.current) return

    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.getBoundingClientRect().width
      // Perfect sizing responsive scaling (Targeting standard 612pt width document)
      const calculatedScale = Math.min(1.2, Math.max(0.4, (containerWidth - 32) / 620))
      setScale(calculatedScale)
    }

    updateScale()
    // Give it a tiny delay to ensure layout rendering finishes
    const timer = setTimeout(updateScale, 200)

    window.addEventListener('resize', updateScale)
    return () => {
      window.removeEventListener('resize', updateScale)
      clearTimeout(timer)
    }
  }, [proposal, numPages])

  // Initialize field values when proposal is loaded
  useEffect(() => {
    if (proposal?.pdf_fields) {
      const initialValues: Record<string, string> = {}
      proposal.pdf_fields.forEach((f: any) => {
        if (f.value) {
          initialValues[f.id] = f.value
        }
      })
      setFieldValues(initialValues)
    }
  }, [proposal])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-muted-foreground">Loading secure workspace...</p>
        </div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <Card className="max-w-md w-full border-red-100 dark:border-red-950/50 shadow-2xl glass">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Proposal not found</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This document may have been removed, expired, or the sharing link is invalid. Please contact the sender.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = proposal.status === 'signed' || proposal.status === 'paid'

  // Validation
  const getRequiredFieldsCount = () => {
    return (proposal.pdf_fields || []).filter((f) => f.required).length
  }

  const getFilledRequiredFieldsCount = () => {
    return (proposal.pdf_fields || []).filter((f) => f.required && fieldValues[f.id]).length
  }

  const allRequiredFilled = () => {
    return (proposal.pdf_fields || []).every((f) => !f.required || fieldValues[f.id])
  }

  const handleSignFieldClick = (fieldId: string) => {
    if (isCompleted) return

    if (!signerName.trim() || !signerEmail.trim()) {
      alert('Please fill out your Name and Email in the top panel before signing the document.')
      // Scroll to top panel
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setActiveSignatureFieldId(fieldId)
    setIsSignatureModalOpen(true)
  }

  const handleSaveSignature = (signatureData: string) => {
    if (!activeSignatureFieldId) return
    setFieldValues((prev) => ({ ...prev, [activeSignatureFieldId]: signatureData }))
    setActiveSignatureFieldId(null)
  }

  const handleDateFieldClick = (fieldId: string) => {
    if (isCompleted) return
    // Auto-fill today's date formatted MM/DD/YYYY
    const today = new Date()
    const formatted = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`
    setFieldValues((prev) => ({ ...prev, [fieldId]: formatted }))
  }

  const handleSign = async () => {
    if (!signerName.trim() || !signerEmail.trim()) {
      alert('Please provide your name and email.')
      return
    }

    if (proposal.document_type === 'pdf' && !allRequiredFilled()) {
      alert('Please fill in all required fields marked with * on the document.')
      return
    }

    setIsSigning(true)

    try {
      const anySupabase = supabase as any

      // Find primary signature data (e.g. base64 image or typed signature string)
      let primarySignature = 'typed-signature:' + signerName
      if (proposal.document_type === 'pdf') {
        const firstSigField = (proposal.pdf_fields || []).find((f) => f.type === 'signature')
        if (firstSigField && fieldValues[firstSigField.id]) {
          primarySignature = fieldValues[firstSigField.id]
        }
      }

      // 1. Insert signature record
      const { error: sigError } = await anySupabase
        .from('signatures')
        .insert({
          proposal_id: proposal.id,
          signer_role: 'customer',
          signer_name: signerName,
          signer_email: signerEmail,
          signature_data: primarySignature,
        })

      if (sigError) throw sigError

      // 2. Save filled fields to proposal
      if (proposal.document_type === 'pdf') {
        const updatedPdfFields = (proposal.pdf_fields || []).map((f) => ({
          ...f,
          value: fieldValues[f.id] || '',
        }))

        const { error: propError } = await anySupabase
          .from('proposals')
          .update({
            pdf_fields: updatedPdfFields,
          })
          .eq('id', proposal.id)

        if (propError) throw propError
      }

      alert('Proposal signed successfully!')
      setProposal({ ...proposal, status: 'signed' })
    } catch (err) {
      console.error(err)
      alert('Failed to sign proposal.')
    } finally {
      setIsSigning(false)
    }
  }

  const handlePayment = async () => {
    setIsPaying(true)
    try {
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Are you online?')
      }

      // 1. Create order on the server
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        { body: { proposalId: proposal.id } }
      )
      if (orderError) throw orderError
      if (!orderData?.orderId) throw new Error('No order ID returned')

      // 2. Open Razorpay checkout modal
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: proposal.title || 'Proposal Payment',
          description: `Payment for ${proposal.title}`,
          order_id: orderData.orderId,
          prefill: { email: proposal.customer_email ?? '' },
          handler: async (response: {
            razorpay_payment_id: string
            razorpay_order_id: string
            razorpay_signature: string
          }) => {
            try {
              // 3. Verify payment on server
              const { error: verifyError } = await supabase.functions.invoke(
                'verify-razorpay-payment',
                {
                  body: {
                    proposalId: proposal.id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  },
                }
              )
              if (verifyError) throw verifyError
              setProposal({ ...proposal, status: 'paid' })
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
        }
        new window.Razorpay(options).open()
      })
    } catch (err: any) {
      if (err.message !== 'Payment cancelled') {
        console.error('Payment error:', err)
        alert(`Failed to initiate payment: ${err.message || 'Unknown error'}`)
      }
    } finally {
      setIsPaying(false)
    }
  }

  // Helper to render signature inside field
  const renderFieldSignature = (val: string) => {
    if (val.startsWith('data:image/')) {
      return <img src={val} className="max-h-full max-w-full object-contain mx-auto" alt="Signature" />
    }
    if (val.startsWith('typed-signature:')) {
      const parts = val.split(':')
      const name = parts[1] || ''
      const fontName = parts[2] || 'Satisfy'
      const font = CURSIVE_FONTS.find((f) => f.name === fontName) || CURSIVE_FONTS[0]
      return (
        <span
          className="text-lg md:text-xl font-medium tracking-wide text-indigo-900 truncate"
          style={{ fontFamily: font.family }}
        >
          {name}
        </span>
      )
    }
    return <span className="text-xs truncate">{val}</span>
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Proposal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-100/10">
          <div>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-50 dark:bg-violet-950/30 px-3 py-1 rounded-full border border-violet-100 dark:border-violet-900/50">
              {proposal.document_type === 'pdf' ? 'PDF Contract' : 'Interactive Proposal'}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
              {proposal.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prepared for <span className="font-semibold text-slate-800 dark:text-slate-200">{proposal.customer_name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-sm font-bold shadow-md shadow-emerald-500/5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Document Signed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-4 py-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-sm font-bold shadow-md shadow-amber-500/5 animate-pulse">
                <PenTool className="w-4 h-4 shrink-0" />
                <span>Review & Sign</span>
              </div>
            )}
          </div>
        </div>

        {/* Recipient Details & Progress Bar (If PDF and not completed) */}
        {proposal.document_type === 'pdf' && !isCompleted && (
          <Card className="glass border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden animate-[fadeIn_0.4s_ease-out]">
            <CardHeader className="bg-gradient-to-r from-violet-50/50 via-indigo-50/20 to-transparent dark:from-violet-950/10 dark:via-indigo-950/5 dark:to-transparent border-b border-slate-100 dark:border-slate-900 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <PenTool className="w-5 h-5 text-violet-600" />
                Complete Signer Information
              </CardTitle>
              <CardDescription className="text-xs">
                Provide your details to unlock and fill interactive fields.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Full Name</Label>
                  <Input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Jane Doe"
                    className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-violet-500/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Email Address</Label>
                  <Input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-violet-500/30"
                  />
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground uppercase tracking-wider">Signing Progress</span>
                  <span className="text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-2.5 py-1 rounded-lg">
                    {getFilledRequiredFieldsCount()} of {getRequiredFieldsCount()} Required Fields Completed
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden shadow-inner border border-slate-200/20">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${getRequiredFieldsCount() > 0 ? (getFilledRequiredFieldsCount() / getRequiredFieldsCount()) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Workspace */}
        {proposal.document_type === 'pdf' ? (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur px-5 py-3.5 rounded-2xl shadow-xl shadow-slate-100/10">
              <div className="flex items-center gap-2.5">
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
                  onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable PDF Pages container */}
            <div
              ref={containerRef}
              className="flex flex-col items-center bg-slate-100/40 dark:bg-slate-950/40 rounded-3xl p-4 md:p-8 border border-slate-200/30 dark:border-slate-800/30 shadow-inner overflow-x-auto min-h-[500px]"
            >
              <Document
                file={proposal.document_url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-muted-foreground">Rendering secure document layers...</p>
                  </div>
                }
              >
                {numPages &&
                  Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNumber) => (
                    <div
                      key={pageNumber}
                      className="relative mb-10 shadow-2xl rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white"
                      style={{ transformOrigin: 'top center' }}
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="block"
                      />

                      {/* Fields Overlay */}
                      {(proposal.pdf_fields || [])
                        .filter((f) => f.pageNumber === pageNumber)
                        .map((field) => {
                          const value = fieldValues[field.id]
                          const isRequiredUnfilled = field.required && !value

                          return (
                            <div
                              key={field.id}
                              data-testid={`placed-field-${field.id}`}
                              onClick={() => {
                                if (isCompleted) return
                                if (field.type === 'signature') {
                                  handleSignFieldClick(field.id)
                                } else if (field.type === 'date') {
                                  handleDateFieldClick(field.id)
                                } else if (field.type === 'text') {
                                  setActiveInputId(field.id)
                                }
                              }}
                              className={`absolute group flex items-center justify-center border transition-all duration-300 rounded-xl select-none text-center p-1.5 overflow-hidden ${
                                isCompleted
                                  ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 cursor-default'
                                  : isRequiredUnfilled
                                  ? 'bg-rose-50/60 hover:bg-rose-50 border-rose-300 hover:border-rose-500 cursor-pointer shadow-lg shadow-rose-500/5 ring-2 ring-rose-500/10 hover:scale-105 active:scale-95'
                                  : value
                                  ? 'bg-emerald-50/40 hover:bg-emerald-50/60 border-emerald-300 hover:border-emerald-500 cursor-pointer shadow-lg shadow-emerald-500/5 hover:scale-105 active:scale-95'
                                  : 'bg-violet-50/50 hover:bg-violet-100/80 border-violet-200 hover:border-violet-400 cursor-pointer shadow-lg shadow-violet-500/5 hover:scale-105 active:scale-95'
                              }`}
                              style={{
                                left: `${field.x}%`,
                                top: `${field.y}%`,
                                width: `${field.width * scale}px`,
                                height: `${field.height * scale}px`,
                                zIndex: activeInputId === field.id ? 100 : 10,
                              }}
                            >
                              {/* Filled value displays */}
                              {value ? (
                                <div className="w-full h-full flex items-center justify-center relative">
                                  {field.type === 'signature' && renderFieldSignature(value)}
                                  {field.type === 'date' && (
                                    <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-wider">
                                      {value}
                                    </span>
                                  )}
                                  {field.type === 'text' && activeInputId !== field.id && (
                                    <span className="text-xs md:text-sm font-medium text-slate-800 dark:text-slate-100 truncate px-1 w-full">
                                      {value}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                /* Unfilled values UI placeholders */
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                                  {field.type === 'signature' && (
                                    <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                                      <PenTool className="w-4 h-4" />
                                      <span>Sign{field.required && <span className="text-red-500">*</span>}</span>
                                    </div>
                                  )}
                                  {field.type === 'date' && (
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                      <Calendar className="w-4 h-4" />
                                      <span>Date{field.required && <span className="text-red-500">*</span>}</span>
                                    </div>
                                  )}
                                  {field.type === 'text' && activeInputId !== field.id && (
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                      <Type className="w-4 h-4" />
                                      <span>Text{field.required && <span className="text-red-500">*</span>}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Interactive Inline Text Input overlay */}
                              {field.type === 'text' && activeInputId === field.id && !isCompleted && (
                                <input
                                  type="text"
                                  value={fieldValues[field.id] || ''}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                                  }
                                  onBlur={() => setActiveInputId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setActiveInputId(null)
                                  }}
                                  autoFocus
                                  className="absolute inset-0 w-full h-full border border-violet-500 focus:outline-none px-2 text-xs font-semibold text-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                />
                              )}
                            </div>
                          )
                        })}

                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800">
                        Page {pageNumber} of {numPages}
                      </div>
                    </div>
                  ))}
              </Document>
            </div>
          </div>
        ) : (
          /* Classic Interactive Block Builder Rendering */
          <div className="space-y-6">
            {proposal.sections &&
              proposal.sections.map((block) => (
                <Card key={block.id} className="shadow-md rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-900">
                  <CardContent className="p-0">
                    <BlockRenderer block={block} readOnly={true} />
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Global Signing & Payment Panel */}
        {(!isCompleted) ? (
          /* Show Block signing panel OR PDF action submission bar */
          proposal.document_type !== 'pdf' ? (
            /* Classic Block signing card */
            <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-2xl glass rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-b border-slate-100 dark:border-slate-900 p-6">
                <CardTitle className="text-xl font-bold text-violet-600 dark:text-violet-400 flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  Sign Proposal
                </CardTitle>
                <CardDescription className="text-xs">
                  Review the document details above and sign to accept the proposal terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                    <Input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Jane Doe"
                      className="rounded-xl focus-visible:ring-violet-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                    <Input
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="rounded-xl focus-visible:ring-violet-500/30"
                    />
                  </div>
                </div>
                <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 bg-slate-50 dark:bg-slate-950/20 shadow-inner flex flex-col items-center justify-center min-h-[140px]">
                  {signerName ? (
                    <div
                      className="text-4xl text-slate-800 dark:text-slate-100 tracking-wider"
                      style={{ fontFamily: "'Brush Script MT', cursive" }}
                    >
                      {signerName}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Type your name above to generate a signature</p>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSign}
                    disabled={isSigning || !signerName.trim() || !signerEmail.trim()}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-violet-500/20 font-bold px-6 py-2.5 h-11"
                  >
                    {isSigning ? 'Signing...' : 'Accept and Sign'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* PDF Submit bar */
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-[slideUp_0.4s_ease-out]">
              <div>
                <h3 className="text-sm font-bold text-foreground">Complete and Sign Document</h3>
                <p className="text-xs text-muted-foreground">
                  Ensure all fields marked with <span className="text-red-500 font-bold">*</span> are filled.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSign}
                  disabled={isSigning || !signerName.trim() || !signerEmail.trim() || !allRequiredFilled()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl px-8 h-11 shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 transition-transform"
                >
                  {isSigning ? (
                    'Signing Document...'
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Submit Signatures</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )
        ) : proposal.status === 'signed' ? (
          /* Payment Step */
          <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-2xl glass rounded-3xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
            <CardHeader className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-b border-slate-100 dark:border-slate-900 p-6">
              <CardTitle className="text-xl font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Proposal Signed Successfully!
              </CardTitle>
              <CardDescription className="text-xs">
                The document is now signed and locked. Please complete the deposit/payment to activate the project.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-600 rounded-full flex items-center justify-center mx-auto shadow-inner hover:scale-105 transition-transform duration-300">
                <CreditCard className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <span className="text-2xl md:text-3xl font-extrabold text-foreground">
                  {proposal.currency === 'INR' ? '₹' : '$'}
                  {(proposal.total_amount || 0).toLocaleString()}
                </span>
                <p className="text-xs text-muted-foreground font-semibold">Payment Amount Due</p>
              </div>
              <Button
                onClick={handlePayment}
                disabled={isPaying}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-md px-10 py-3 h-12 font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-transform"
              >
                {isPaying ? 'Processing Payment...' : 'Proceed to Payment'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Already Paid state */
          <Card className="border-emerald-200/50 dark:border-emerald-950/50 shadow-2xl bg-emerald-50/30 dark:bg-emerald-950/15 rounded-3xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
            <CardContent className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Proposal Completed & Paid!</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                Thank you. This proposal has been successfully signed, verified, and paid. A receipt and copy of the agreement have been archived.
              </p>
              <div className="pt-2 flex justify-center gap-2 text-xs font-bold text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secured and encrypted transaction</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Signature Draw/Type Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false)
          setActiveSignatureFieldId(null)
        }}
        onSave={handleSaveSignature}
        defaultName={signerName}
      />
    </div>
  )
}
