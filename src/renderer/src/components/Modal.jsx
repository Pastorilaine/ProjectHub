/**
 * Generic modal wrapper with dark overlay.
 */
export default function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className={`w-full rounded-2xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        style={{ background: 'rgba(8,12,22,0.96)', border: '1px solid rgba(255,255,255,0.10)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-semibold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
