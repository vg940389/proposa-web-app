import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { generateId } from '../lib/utils'
import type { ProposalRow, SectionBlock, SectionType } from '../types/proposal'

interface EditorState {
  proposal: Partial<ProposalRow>
  isSaving: boolean
  hasUnsavedChanges: boolean
}

type EditorAction =
  | { type: 'SET_PROPOSAL'; payload: Partial<ProposalRow> }
  | { type: 'UPDATE_METADATA'; payload: Partial<ProposalRow> }
  | { type: 'ADD_BLOCK'; payload: { type: SectionType; data: any; index?: number } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; data: any } }
  | { type: 'REMOVE_BLOCK'; payload: string }
  | { type: 'REORDER_BLOCKS'; payload: { startIndex: number; endIndex: number } }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SAVED' }

const initialState: EditorState = {
  proposal: {
    title: '',
    customer_name: '',
    customer_email: '',
    status: 'draft',
    sections: [],
    document_type: 'block',
    document_url: null,
    pdf_fields: [],
  },
  isSaving: false,
  hasUnsavedChanges: false,
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_PROPOSAL':
      return {
        ...state,
        proposal: action.payload,
        hasUnsavedChanges: false,
      }
    case 'UPDATE_METADATA':
      return {
        ...state,
        proposal: { ...state.proposal, ...action.payload },
        hasUnsavedChanges: true,
      }
    case 'ADD_BLOCK': {
      const newBlock: SectionBlock = {
        id: generateId(),
        type: action.payload.type,
        order: state.proposal.sections ? state.proposal.sections.length : 0,
        data: action.payload.data,
      }
      
      const sections = [...(state.proposal.sections || [])]
      if (typeof action.payload.index === 'number') {
        sections.splice(action.payload.index, 0, newBlock)
      } else {
        sections.push(newBlock)
      }
      
      // Update order
      sections.forEach((s, idx) => (s.order = idx))

      return {
        ...state,
        proposal: { ...state.proposal, sections },
        hasUnsavedChanges: true,
      }
    }
    case 'UPDATE_BLOCK': {
      const sections = (state.proposal.sections || []).map((block) =>
        block.id === action.payload.id ? { ...block, data: action.payload.data } : block
      )
      return {
        ...state,
        proposal: { ...state.proposal, sections },
        hasUnsavedChanges: true,
      }
    }
    case 'REMOVE_BLOCK': {
      const sections = (state.proposal.sections || []).filter(
        (block) => block.id !== action.payload
      )
      sections.forEach((s, idx) => (s.order = idx))
      return {
        ...state,
        proposal: { ...state.proposal, sections },
        hasUnsavedChanges: true,
      }
    }
    case 'REORDER_BLOCKS': {
      const sections = [...(state.proposal.sections || [])]
      const [removed] = sections.splice(action.payload.startIndex, 1)
      sections.splice(action.payload.endIndex, 0, removed)
      sections.forEach((s, idx) => (s.order = idx))
      
      return {
        ...state,
        proposal: { ...state.proposal, sections },
        hasUnsavedChanges: true,
      }
    }
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }
    case 'SAVED':
      return { ...state, isSaving: false, hasUnsavedChanges: false }
    default:
      return state
  }
}

interface ProposalEditorContextType extends EditorState {
  dispatch: React.Dispatch<EditorAction>
}

const ProposalEditorContext = createContext<ProposalEditorContextType | null>(null)

export function ProposalEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState)

  return (
    <ProposalEditorContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ProposalEditorContext.Provider>
  )
}

export function useProposalEditor() {
  const context = useContext(ProposalEditorContext)
  if (!context) {
    throw new Error('useProposalEditor must be used within a ProposalEditorProvider')
  }
  return context
}
