import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicProposal } from '../hooks/usePublicProposal'
import { BlockRenderer } from '../components/editor/BlockRenderer'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle2, CreditCard, PenTool } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PublicProposalPage() {
  const { token } = useParams<{ token: string }>()
  const { proposal, loading, error, setProposal } = usePublicProposal(token)

  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full border-red-100 shadow-sm">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Proposal not found</h1>
            <p className="text-muted-foreground">
              This document may have been removed or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSign = async () => {
    if (!signerName.trim() || !signerEmail.trim()) {
      alert('Please provide your name and email to sign.')
      return
    }

    setIsSigning(true)

    try {
      const anySupabase = supabase as any
      // Insert signature
      const { error: sigError } = await anySupabase
        .from('signatures')
        .insert({
          proposal_id: proposal.id,
          signer_role: 'customer',
          signer_name: signerName,
          signer_email: signerEmail,
          signature_data: 'typed-signature:' + signerName,
        })

      if (sigError) throw sigError

      // The DB trigger `on_signature_created` will automatically update the proposal status to 'signed'

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Document Content */}
        {proposal.sections && proposal.sections.map((block) => (
          <Card key={block.id} className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <BlockRenderer block={block} readOnly={true} />
            </CardContent>
          </Card>
        ))}

        {/* Signing Area */}
        {(proposal.status === 'draft' || proposal.status === 'sent' || proposal.status === 'viewed') ? (
          <Card className="mt-12 border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-b border-primary/10">
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <PenTool className="w-6 h-6 text-primary" />
                Sign Proposal
              </CardTitle>
              <CardDescription className="text-primary/80 font-medium">
                Review the document above and sign below to accept.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center min-h-[150px]">
                 {signerName ? (
                   <div className="text-4xl font-serif text-gray-800 tracking-wider" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                     {signerName}
                   </div>
                 ) : (
                   <p className="text-muted-foreground italic">Type your name above to generate a signature</p>
                 )}
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSign}
                  disabled={isSigning || !signerName || !signerEmail}
                  className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-md"
                  size="lg"
                >
                  {isSigning ? 'Signing...' : 'Accept and Sign'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : proposal.status === 'signed' ? (
          <Card className="mt-12 border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-b border-primary/10">
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                Proposal Signed
              </CardTitle>
              <CardDescription className="text-primary/80 font-medium">
                Thank you for accepting the proposal. Please proceed to payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-blue-500/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CreditCard className="w-10 h-10" />
              </div>
              <Button
                onClick={handlePayment}
                disabled={isPaying}
                className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-md text-lg px-8"
                size="lg"
              >
                {isPaying ? 'Processing...' : 'Make Payment'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-12 border-green-200 shadow-sm bg-green-50/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Proposal Paid!</h2>
              <p className="text-green-700">
                This document has been successfully signed and paid. Thank you!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
