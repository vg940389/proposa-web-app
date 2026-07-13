import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SectionBlock } from '../types/proposal'
import { generateId } from './utils'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function generateProposal(prompt: string): Promise<Partial<{
  title: string
  customer_name: string
  sections: SectionBlock[]
}>> {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured in VITE_GEMINI_API_KEY.')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const systemPrompt = `
You are an expert B2B proposal generator.
Generate a JSON object for a business proposal based on the user's prompt.
The JSON must have the following structure:
{
  "title": "A catchy title for the proposal",
  "customer_name": "Inferred client name from prompt, or leave empty",
  "sections": [
    {
      "type": "cover",
      "data": { "label": "Proposal", "title": "Main Title", "subtitle": "Prepared for X" }
    },
    {
      "type": "rich_text",
      "data": { "body": "<h3>Executive Summary</h3><p>...</p>" }
    },
    {
      "type": "pricing_table",
      "data": { 
        "items": [
          { "description": "Item 1", "qty": 1, "unit_price": 1000 }
        ]
      }
    },
    {
      "type": "signature_block",
      "data": { "label": "Client Signature" }
    }
  ]
}

Available section types: "cover", "rich_text", "pricing_table", "signature_block".
You may include multiple rich_text or pricing_table blocks if needed.
Ensure the returned string is valid JSON and contains NO markdown formatting blocks like \`\`\`json. Just the raw JSON object.
`

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: `User Prompt: ${prompt}` }
  ])

  const text = result.response.text()
  
  try {
    // Strip markdown formatting if the model still returns it
    const cleanText = text.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(cleanText)
    
    // Inject generated IDs for blocks
    if (parsed.sections && Array.isArray(parsed.sections)) {
      parsed.sections = parsed.sections.map((sec: any, index: number) => ({
        ...sec,
        id: generateId(),
        order: index
      }))
    }
    
    return parsed
  } catch (err) {
    console.error('Failed to parse Gemini output:', text)
    throw new Error('Failed to generate valid proposal structure from AI.')
  }
}
