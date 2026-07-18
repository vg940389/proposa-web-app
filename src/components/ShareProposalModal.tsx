import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, Mail, ExternalLink } from "lucide-react"
import { supabase } from '../lib/supabase'

interface ShareProposalModalProps {
  isOpen: boolean
  onClose: () => void
  proposalId: string
  publicToken: string
  customerEmail: string
  onSent: () => void
}

export function ShareProposalModal({ isOpen, onClose, proposalId, publicToken, customerEmail, onSent }: ShareProposalModalProps) {
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  
  const publicUrl = `${window.location.origin}/p/${publicToken}`

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      // Update status to 'sent'
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'sent' })
        .eq('id', proposalId)

      if (error) throw error

      // Simulate sending email for now, since we don't have an email backend set up
      // Or we can just use mailto
      window.location.href = `mailto:${customerEmail}?subject=Your Proposal&body=Please review and sign your proposal here: ${publicUrl}`
      
      onSent()
      onClose()
    } catch (err) {
      console.error(err)
      alert("Failed to update proposal status")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Proposal</DialogTitle>
          <DialogDescription>
            Send this proposal to your client or copy the link.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Public Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={publicUrl} className="font-mono text-sm" />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Send via Email</Label>
            <div className="flex gap-2">
              <Input readOnly value={customerEmail || 'No client email set'} />
              <Button 
                onClick={handleSend} 
                disabled={sending || !customerEmail}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
            {!customerEmail && (
              <p className="text-xs text-muted-foreground mt-1">
                Add a client email in the editor details to send directly.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
