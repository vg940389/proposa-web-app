import type { SectionBlock } from '../../types/proposal'
import { RichTextBlock } from './blocks/RichTextBlock'
import { CoverBlock } from './blocks/CoverBlock'
import { PricingTableBlock } from './blocks/PricingTableBlock'
import { SignatureBlock } from './blocks/SignatureBlock'
import { useProposalEditor } from '../../contexts/ProposalEditorContext'

interface BlockRendererProps {
  block: SectionBlock
  readOnly?: boolean
}

export function BlockRenderer({ block, readOnly = false }: BlockRendererProps) {
  const { dispatch } = useProposalEditor()

  const handleChange = (data: any) => {
    if (readOnly) return
    dispatch({ type: 'UPDATE_BLOCK', payload: { id: block.id, data } })
  }

  switch (block.type) {
    case 'rich_text':
      return <RichTextBlock data={block.data} onChange={handleChange} readOnly={readOnly} />
    case 'cover':
      return <CoverBlock data={block.data} onChange={handleChange} readOnly={readOnly} />
    case 'pricing_table':
      return <PricingTableBlock data={block.data} onChange={handleChange} readOnly={readOnly} />
    case 'signature_block':
      return <SignatureBlock data={block.data} onChange={handleChange} readOnly={readOnly} />
    default:
      return (
        <div className="p-4 bg-gray-100 text-gray-500 rounded text-sm italic">
          Unsupported block type: {block.type}
        </div>
      )
  }
}
