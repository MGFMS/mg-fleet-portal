// Consistent page header. Shows "Title" or "Title - SUFFIX" with optional
// right-side action buttons.
export default function PageHeader({ title, suffix, children }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <h1 className="text-2xl font-semibold text-gray-800">
        {title}
        {suffix && (
          <>
            {' - '}
            <span className="text-gray-800">{suffix}</span>
          </>
        )}
      </h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
