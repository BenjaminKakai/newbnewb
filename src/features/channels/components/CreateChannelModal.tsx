// features/channels/components/CreateChannelModal.tsx
'use client'

import React from 'react'
import { useChannelsStore } from '@/services/channelsStore'
import { X } from 'lucide-react'

const categories = [
  { value: 'Tech', label: '📱 Technology', color: 'bg-blue-500' },
  { value: 'Entertainment', label: '🎬 Entertainment', color: 'bg-purple-500' },
  { value: 'Education', label: '📚 Education', color: 'bg-green-500' },
  { value: 'Business', label: '💼 Business', color: 'bg-gray-500' },
  { value: 'Lifestyle', label: '🌟 Lifestyle', color: 'bg-pink-500' },
  { value: 'Gaming', label: '🎮 Gaming', color: 'bg-indigo-500' },
  { value: 'Sports', label: '⚽ Sports', color: 'bg-orange-500' },
  { value: 'Other', label: '📂 Other', color: 'bg-gray-400' },
]

export const CreateChannelModal: React.FC = () => {
  const {
    createForm,
    isLoading,
    setCreateForm,
    resetCreateForm,
    setShowCreateModal,
    createChannel,
  } = useChannelsStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createForm.name.trim() || !createForm.description.trim()) {
      // You might want to add a toast notification here
      alert('Please fill in all required fields')
      return
    }

    await createChannel(createForm)
  }

  const handleClose = () => {
    setShowCreateModal(false)
    resetCreateForm()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Auto-generate handle from name
  const handleNameChange = (name: string) => {
    setCreateForm({ name })
    
    // Auto-generate handle if it's empty or was auto-generated
    const autoHandle = '@' + name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    if (!createForm.handle || createForm.handle.startsWith('@' + createForm.name.toLowerCase())) {
      setCreateForm({ handle: autoHandle })
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Create New Channel</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Channel Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Name *
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome Channel"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isLoading}
                required
              />
            </div>

            {/* Channel Handle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Handle *
              </label>
              <input
                type="text"
                value={createForm.handle}
                onChange={(e) => setCreateForm({ handle: e.target.value })}
                placeholder="@awesome-channel"
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your channel's unique identifier
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ description: e.target.value })}
                placeholder="Tell people what your channel is about..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {createForm.description.length}/500 characters
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isLoading}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            {createForm.name && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    categories.find(c => c.value === createForm.category)?.color || 'bg-gray-500'
                  }`}>
                    {createForm.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{createForm.name}</p>
                    <p className="text-sm text-gray-500">{createForm.handle}</p>
                  </div>
                </div>
                {createForm.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {createForm.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              type="submit"
              disabled={!createForm.name.trim() || !createForm.description.trim() || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Channel'
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}