import React from 'react'

export default function Modal({ open, title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg border p-5">
        <div className="text-lg font-semibold mb-2">{title}</div>
        {message && <div className="text-sm text-gray-700 mb-4">{message}</div>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
