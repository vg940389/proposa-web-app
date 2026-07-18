import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicProposal } from '../hooks/usePublicProposal'
import { BlockRenderer } from '../components/editor/BlockRenderer'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'

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
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Proposal not found</h1>
          <p className="text-gray-500">
            This document may have been removed or the link is invalid.
          </p>
        </div>
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
          <div key={block.id} className="shadow-sm rounded-xl overflow-hidden">
            <BlockRenderer block={block} readOnly={true} />
          </div>
        ))}

        {/* Signing Area */}
        {(proposal.status === 'draft' || proposal.status === 'sent' || proposal.status === 'viewed') ? (
          <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden mt-12">
            <div className="bg-indigo-50 border-b border-indigo-100 px-8 py-6">
              <h2 className="text-2xl font-bold text-indigo-900">Sign Proposal</h2>
              <p className="text-indigo-700 mt-1">Review the document above and sign below to accept.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                   <p className="text-gray-400 italic">Type your name above to generate a signature</p>
                 )}
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSign}
                  disabled={isSigning || !signerName || !signerEmail}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  {isSigning ? 'Signing...' : 'Accept and Sign'}
                </Button>
              </div>
            </div>
          </div>
        ) : proposal.status === 'signed' ? (
          <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden mt-12">
            <div className="bg-indigo-50 border-b border-indigo-100 px-8 py-6">
              <h2 className="text-2xl font-bold text-indigo-900">Proposal Signed</h2>
              <p className="text-indigo-700 mt-1">Thank you for accepting the proposal. Please proceed to payment.</p>
            </div>
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <Button
                onClick={handlePayment}
                disabled={isPaying}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {isPaying ? 'Processing...' : 'Make Payment'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-8 text-center mt-12">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">Proposal Paid!</h2>
            <p className="text-green-700">
              This document has been successfully signed and paid. Thank you!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
