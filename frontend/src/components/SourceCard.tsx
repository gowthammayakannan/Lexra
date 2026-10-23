
interface Source { label: string; file: string; page: number; excerpt: string }
interface Props { sources: Source[] }

export default function SourceCard({ sources }: Props) {
  if (!sources?.length) return null
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold px-1">Sources</p>
      {sources.map((s, i) => (
        <div key={i} className="group bg-white/3 border border-white/6 rounded-xl p-3 hover:bg-white/5 hover:border-violet-500/20 transition-all">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{s.label}</span>
            <span className="text-[10px] text-white/30 truncate">{s.file}</span>
            <span className="text-[10px] text-white/20 ml-auto shrink-0">p.{s.page}</span>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{s.excerpt}</p>
        </div>
      ))}
    </div>
  )
}

