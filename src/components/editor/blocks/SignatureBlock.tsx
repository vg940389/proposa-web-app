interface SignatureBlockProps {
  data: any
  onChange: (data: any) => void
  readOnly?: boolean
}

export function SignatureBlock({ data, onChange, readOnly = false }: SignatureBlockProps) {
  return (
    <div className="border border-slate-200 rounded-xl p-6 bg-white">
      <div className="flex justify-between items-end">
        <div className="w-64 border-b-2 border-slate-300 pb-2">
          <p className="text-sm text-slate-400 italic">Signature will appear here</p>
        </div>
        <div className="w-48 border-b-2 border-slate-300 pb-2">
          <p className="text-sm text-slate-400 italic text-center">Date</p>
        </div>
      </div>
      <div className="mt-4">
        {readOnly ? (
          <p className="font-medium text-slate-900">{data.label || 'Signer Name'}</p>
        ) : (
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => onChange({ ...data, label: e.target.value })}
            placeholder="Signer Name / Title"
            className="border-none focus:ring-0 p-0 text-sm font-medium text-slate-900 w-full"
          />
        )}
      </div>
    </div>
  )
}
