"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, ArrowLeft, Download, Upload, Copy } from 'lucide-react'
import type { UploadField, UploadSchema, FieldType, SchemaTemplate } from '@/lib/types'

interface PageProps {
  params: {
    state: string
    adType: string
  }
}

export default function SchemaEditorPage({ params }: PageProps) {
  const router = useRouter()
  const { state, adType } = params

  const [schema, setSchema] = useState<UploadSchema>({
    schemaVersion: '1.0',
    fields: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adInfo, setAdInfo] = useState<any>(null)
  const [templates, setTemplates] = useState<SchemaTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')

  useEffect(() => {
    fetchAdAndSchema()
    fetchTemplates()
  }, [state, adType])

  const fetchAdAndSchema = async () => {
    try {
      // Fetch ad details - encode ID to handle the # character
      const adId = `${state}#${adType}`
      const response = await fetch(`/api/admin/ads/${encodeURIComponent(adId)}`)
      if (response.ok) {
        const ad = await response.json()
        setAdInfo(ad)

        if (ad.uploadSchema) {
          setSchema(ad.uploadSchema)
        }
      }
    } catch (error) {
      console.error('Error fetching ad schema:', error)
    } finally {
      setLoading(false)
    }
  }

  const addField = () => {
    const newField: UploadField = {
      fieldName: `field_${Date.now()}`,
      fieldType: 'text',
      label: 'New Field',
      required: false,
      placeholder: '',
      helpText: ''
    }

    setSchema(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const updateField = (index: number, updates: Partial<UploadField>) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) =>
        i === index ? { ...field, ...updates } : field
      )
    }))
  }

  const removeField = (index: number) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === schema.fields.length - 1)
    ) {
      return
    }

    const newFields = [...schema.fields]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]

    setSchema(prev => ({ ...prev, fields: newFields }))
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/schema-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const saveSchema = async () => {
    setSaving(true)
    try {
      const adId = `${state}#${adType}`
      const response = await fetch(`/api/admin/ads/${encodeURIComponent(adId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadSchema: schema })
      })

      if (response.ok) {
        alert('Schema saved successfully!')
        router.push('/admin/ads')
      } else {
        alert('Failed to save schema')
      }
    } catch (error) {
      console.error('Error saving schema:', error)
      alert('Error saving schema')
    } finally {
      setSaving(false)
    }
  }

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    try {
      const response = await fetch('/api/admin/schema-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          schema
        })
      })

      if (response.ok) {
        alert('Template saved successfully!')
        setShowSaveTemplateModal(false)
        setTemplateName('')
        setTemplateDescription('')
        fetchTemplates()
      } else {
        alert('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error saving template')
    }
  }

  const loadTemplate = (template: SchemaTemplate) => {
    if (confirm(`Load template "${template.name}"? This will replace your current schema.`)) {
      setSchema(template.schema)
      setShowTemplateModal(false)
    }
  }

  const bulkApplySchema = () => {
    router.push(`/admin/ads/bulk-apply?templateSchema=${encodeURIComponent(JSON.stringify(schema))}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/admin/ads')}
              className="flex items-center text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ads
            </button>
            <h1 className="text-4xl font-bold tracking-wider">
              UPLOAD SCHEMA EDITOR
            </h1>
            <p className="text-gray-400 mt-2">
              {adInfo?.title} • {state.toUpperCase()} • {adType}
            </p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              LOAD TEMPLATE
            </button>
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-full transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              SAVE AS TEMPLATE
            </button>
            <button
              onClick={bulkApplySchema}
              className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full transition-colors"
            >
              <Copy className="h-5 w-5 mr-2" />
              APPLY TO MULTIPLE
            </button>
            <button
              onClick={addField}
              className="flex items-center bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-full transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              ADD FIELD
            </button>
            <button
              onClick={saveSchema}
              disabled={saving}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'SAVING...' : 'SAVE SCHEMA'}
            </button>
          </div>
        </div>

        {/* Schema Fields */}
        <div className="space-y-4">
          {schema.fields.length === 0 ? (
            <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-12 text-center">
              <p className="text-gray-400 text-lg mb-4">
                No upload fields defined yet
              </p>
              <button
                onClick={addField}
                className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-8 rounded-full"
              >
                Add Your First Field
              </button>
            </div>
          ) : (
            schema.fields.map((field, index) => (
              <div
                key={index}
                className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Field Name */}
                  <div>
                    <label className="block text-green-400 font-semibold mb-2">
                      Field Name (internal)
                    </label>
                    <input
                      type="text"
                      value={field.fieldName}
                      onChange={(e) => updateField(index, { fieldName: e.target.value })}
                      className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Label */}
                  <div>
                    <label className="block text-green-400 font-semibold mb-2">
                      Label (shown to user)
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Field Type */}
                  <div>
                    <label className="block text-green-400 font-semibold mb-2">
                      Field Type
                    </label>
                    <select
                      value={field.fieldType}
                      onChange={(e) => updateField(index, { fieldType: e.target.value as FieldType })}
                      className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Text Area</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="url">URL</option>
                      <option value="image">Image</option>
                      <option value="file">File</option>
                    </select>
                  </div>

                  {/* Required */}
                  <div>
                    <label className="block text-green-400 font-semibold mb-2">
                      Required
                    </label>
                    <label className="flex items-center cursor-pointer p-3 bg-gray-800 border-2 border-gray-600 rounded-md">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="w-5 h-5 text-green-500 bg-green-600 border-green-500 rounded focus:ring-green-500 mr-3"
                      />
                      <span className="text-white">
                        {field.required ? 'Yes' : 'No'}
                      </span>
                    </label>
                  </div>

                  {/* Placeholder */}
                  <div>
                    <label className="block text-green-400 font-semibold mb-2">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Help Text */}
                  <div>
                    <label className="block text-green-400 font-semibold mb-2">
                      Help Text
                    </label>
                    <input
                      type="text"
                      value={field.helpText || ''}
                      onChange={(e) => updateField(index, { helpText: e.target.value })}
                      className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Max Length (for text fields) */}
                  {(field.fieldType === 'text' || field.fieldType === 'textarea') && (
                    <div>
                      <label className="block text-green-400 font-semibold mb-2">
                        Max Length
                      </label>
                      <input
                        type="number"
                        value={field.maxLength || ''}
                        onChange={(e) => updateField(index, { maxLength: parseInt(e.target.value) || undefined })}
                        className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                      />
                    </div>
                  )}

                  {/* Accepted Formats (for files/images) */}
                  {(field.fieldType === 'image' || field.fieldType === 'file') && (
                    <div>
                      <label className="block text-green-400 font-semibold mb-2">
                        Accepted Formats (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={field.acceptedFormats?.join(', ') || ''}
                        onChange={(e) =>
                          updateField(index, {
                            acceptedFormats: e.target.value.split(',').map(f => f.trim()).filter(Boolean)
                          })
                        }
                        placeholder=".jpg, .png, .pdf"
                        className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                      />
                    </div>
                  )}

                  {/* Max Files (for multi-file uploads) */}
                  {(field.fieldType === 'image' || field.fieldType === 'file') && (
                    <div>
                      <label className="block text-green-400 font-semibold mb-2">
                        Max Files (leave blank for 1)
                      </label>
                      <input
                        type="number"
                        value={field.maxFiles || ''}
                        onChange={(e) => updateField(index, { maxFiles: parseInt(e.target.value) || undefined })}
                        className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                      />
                    </div>
                  )}
                </div>

                {/* Field Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↑ Move Up
                  </button>
                  <button
                    onClick={() => moveField(index, 'down')}
                    disabled={index === schema.fields.length - 1}
                    className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓ Move Down
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => removeField(index)}
                    className="flex items-center text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Field
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preview */}
        {schema.fields.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">PREVIEW</h2>
            <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 mb-4">
                This is how the upload form will appear to users:
              </p>
              <div className="space-y-4">
                {schema.fields.map((field, index) => (
                  <div key={index} className="border-2 border-gray-600 rounded-md p-4">
                    <div className="font-semibold text-green-400">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </div>
                    {field.helpText && (
                      <div className="text-gray-400 text-sm mt-1">{field.helpText}</div>
                    )}
                    <div className="mt-2 text-gray-500 text-sm">
                      Type: {field.fieldType}
                      {field.maxLength && ` • Max length: ${field.maxLength}`}
                      {field.acceptedFormats && ` • Formats: ${field.acceptedFormats.join(', ')}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Load Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Load Template</h2>
              {templates.length === 0 ? (
                <p className="text-gray-400">No templates saved yet</p>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <div key={template.id} className="bg-gray-800 border border-gray-700 p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white">{template.name}</h3>
                          <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                          <p className="text-gray-500 text-xs mt-2">{template.schema.fields.length} fields</p>
                        </div>
                        <button
                          onClick={() => loadTemplate(template)}
                          className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-full transition-colors"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowTemplateModal(false)}
                className="mt-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Save As Template Modal */}
        {showSaveTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Save as Template</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Full Business Listing"
                    className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Description</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="What is this template for?"
                    rows={3}
                    className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveAsTemplate}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-6 rounded-full"
                >
                  Save Template
                </button>
                <button
                  onClick={() => {
                    setShowSaveTemplateModal(false)
                    setTemplateName('')
                    setTemplateDescription('')
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
