interface CoverBlockProps {
  data: any
  onChange: (data: any) => void
  readOnly?: boolean
}

export function CoverBlock({ data, onChange, readOnly = false }: CoverBlockProps) {
  return (
    <div className="relative bg-slate-900 text-white p-12 overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 opacity-80" />
      <div className="relative z-10 space-y-4">
        {readOnly ? (
          <>
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 rounded-full border border-indigo-500/20">
              {data.label || 'Proposal'}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {data.title || 'Untitled'}
            </h1>
            <p className="text-lg text-slate-300">
              {data.subtitle || ''}
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              value={data.label || ''} 
              onChange={(e) => onChange({ ...data, label: e.target.value })}
              placeholder="e.g. Service Proposal"
              className="bg-indigo-500/30 text-indigo-100 rounded-full border border-indigo-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider w-48 outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="Main Title"
              className="text-4xl md:text-5xl font-bold tracking-tight bg-transparent border-b border-white/20 outline-none focus:border-white w-full"
            />
            <input
              type="text"
              value={data.subtitle || ''}
              onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
              placeholder="Subtitle / Prepared for..."
              className="text-lg text-slate-300 bg-transparent border-b border-white/20 outline-none focus:border-white w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
