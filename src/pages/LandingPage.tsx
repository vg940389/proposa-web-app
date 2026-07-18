import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Send, CreditCard } from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <FileText className="w-6 h-6" />
            ProposalApp
          </div>
          <div className="flex items-center gap-4">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" className="text-gray-600 hover:text-primary">Sign In</Button>
            </Link>
            <Link to={ROUTES.SIGNUP}>
              <Button className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl">
          Create, Send, and Get Paid for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Proposals</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
          The all-in-one platform for modern professionals to build stunning proposals, collect e-signatures, and receive payments seamlessly.
        </p>
        <div className="flex items-center gap-4">
          <Link to={ROUTES.SIGNUP}>
            <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg">
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full mt-24">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Beautiful Editor</h3>
            <p className="text-muted-foreground">Build structured proposals with rich text, pricing tables, and dynamic content blocks.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <Send className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Client E-Signatures</h3>
            <p className="text-muted-foreground">Send trackable public links. Clients can review and legally sign with just a few clicks.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <CreditCard className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Payments</h3>
            <p className="text-muted-foreground">Integrated directly with Razorpay to collect invoice payments immediately after signing.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
