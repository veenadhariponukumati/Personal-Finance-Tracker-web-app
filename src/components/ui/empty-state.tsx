export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="bg-white rounded-lg shadow p-10 text-center">
      <div className="text-4xl mb-4">📭</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action && (
        <a
          href={action.href}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  )
}