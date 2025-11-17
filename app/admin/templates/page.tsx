"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Eye, Plus } from 'lucide-react'
import type { SchemaTemplate } from '@/lib/types'

export default function TemplatesManagerPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<SchemaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<SchemaTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/schema-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/schema-templates?id=${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Template deleted successfully!')
        fetchTemplates()
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template')
    }
  }

  const handlePreview = (template: SchemaTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8 flex items-center justify-center">
        <p className="text-xl">Loading templates...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SCHEMA TEMPLATES</h1>
          <p className="text-green-300">
            Manage your reusable upload schema templates
          </p>
        </div>

        {/* Templates List */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No templates found</p>
            <p className="text-sm text-gray-500">
              Create templates from the schema editor to see them here
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 hover:border-green-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {template.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      {template.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {template.schema.fields.length} field{template.schema.fields.length !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      {template.updatedAt !== template.createdAt && (
                        <>
                          <span>•</span>
                          <span>
                            Updated: {new Date(template.updatedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handlePreview(template)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      title="Preview Fields"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-900/20 border-2 border-blue-500 rounded-lg">
          <h3 className="font-bold text-blue-400 mb-2">How to Use Templates</h3>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Go to any ad's schema editor to load and apply templates</li>
            <li>Templates can be edited by loading them in the schema editor, making changes, and saving</li>
            <li>Use "Apply to Multiple" to apply a template to many ads at once</li>
            <li>Pre-made templates are ready to use for common ad types</li>
          </ul>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {selectedTemplate.name}
                </h2>
                <p className="text-gray-400 text-sm">
                  {selectedTemplate.description}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-green-400">Fields:</h3>
              {selectedTemplate.schema.fields.map((field, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-4 rounded border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </span>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      {field.fieldType}
                    </span>
                  </div>
                  {field.placeholder && (
                    <p className="text-sm text-gray-400 mb-1">
                      Placeholder: {field.placeholder}
                    </p>
                  )}
                  {field.helpText && (
                    <p className="text-sm text-gray-400 mb-1">
                      Help: {field.helpText}
                    </p>
                  )}
                  {field.acceptedFormats && field.acceptedFormats.length > 0 && (
                    <p className="text-sm text-green-400">
                      Formats: {field.acceptedFormats.join(', ')}
                    </p>
                  )}
                  {field.maxLength && (
                    <p className="text-sm text-yellow-400">
                      Max length: {field.maxLength} characters
                    </p>
                  )}
                  {field.maxFiles && field.maxFiles > 1 && (
                    <p className="text-sm text-yellow-400">
                      Max files: {field.maxFiles}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
