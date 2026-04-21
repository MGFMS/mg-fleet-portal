export default function Placeholder({ title, description }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h1>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      <div className="bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-400">
        Coming in a later week.
      </div>
    </div>
  )
}
