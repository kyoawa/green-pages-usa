"use client"

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import type { UploadField, UploadSchema } from '@/lib/types'

interface DynamicUploadFormProps {
  schema: UploadSchema
  onSubmit: (data: FormData) => Promise<void>
  initialData?: { [fieldName: string]: any }
  buttonText?: string
  isSubmitting?: boolean
}

export default function DynamicUploadForm({
  schema,
  onSubmit,
  initialData = {},
  buttonText = "SUBMIT",
  isSubmitting = false
}: DynamicUploadFormProps) {
  // Initialize formData with default empty strings for all fields
  const initializeFormData = () => {
    const defaultData: { [key: string]: any } = {}
    const safeInitialData = initialData || {}
    schema.fields.forEach(field => {
      if (field.fieldType !== 'image' && field.fieldType !== 'file') {
        defaultData[field.fieldName] = safeInitialData[field.fieldName] || ''
      }
    })
    return defaultData
  }

  const [formData, setFormData] = useState<{ [key: string]: any }>(initializeFormData())
  const [files, setFiles] = useState<{ [key: string]: File | File[] | null }>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleTextChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleFileChange = (field: UploadField, selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setFiles(prev => ({ ...prev, [field.fieldName]: null }))
      return
    }

    // Validate file types
    if (field.acceptedFormats && field.acceptedFormats.length > 0) {
      const invalidFiles = Array.from(selectedFiles).filter(file => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        return !field.acceptedFormats!.some(format => format.toLowerCase() === ext)
      })

      if (invalidFiles.length > 0) {
        setErrors(prev => ({
          ...prev,
          [field.fieldName]: `Invalid file type. Accepted: ${field.acceptedFormats!.join(', ')}`
        }))
        return
      }
    }

    // Handle multi-file uploads
    if (field.maxFiles && field.maxFiles > 1) {
      const fileArray = Array.from(selectedFiles).slice(0, field.maxFiles)
      setFiles(prev => ({ ...prev, [field.fieldName]: fileArray }))
    } else {
      setFiles(prev => ({ ...prev, [field.fieldName]: selectedFiles[0] }))
    }

    if (errors[field.fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field.fieldName]
        return newErrors
      })
    }
  }

  const removeFile = (fieldName: string, fileIndex?: number) => {
    setFiles(prev => {
      const current = prev[fieldName]
      if (Array.isArray(current) && fileIndex !== undefined) {
        const newFiles = current.filter((_, i) => i !== fileIndex)
        return { ...prev, [fieldName]: newFiles.length > 0 ? newFiles : null }
      }
      return { ...prev, [fieldName]: null }
    })
  }

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    schema.fields.forEach(field => {
      if (field.required) {
        if (field.fieldType === 'image' || field.fieldType === 'file') {
          const hasExistingFile = initialData?.fileUrls?.[field.fieldName]
          const hasNewFile = files[field.fieldName]
          if (!hasExistingFile && !hasNewFile) {
            newErrors[field.fieldName] = `${field.label} is required`
          }
        } else {
          if (!formData[field.fieldName] || formData[field.fieldName].trim() === '') {
            newErrors[field.fieldName] = `${field.label} is required`
          }
        }
      }

      // Validate max length
      if (field.maxLength && formData[field.fieldName]?.length > field.maxLength) {
        newErrors[field.fieldName] = `${field.label} must be ${field.maxLength} characters or less`
      }

      // Validate email format
      if (field.fieldType === 'email' && formData[field.fieldName]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData[field.fieldName])) {
          newErrors[field.fieldName] = 'Invalid email format'
        }
      }

      // Validate URL format
      if (field.fieldType === 'url' && formData[field.fieldName]) {
        try {
          new URL(formData[field.fieldName])
        } catch {
          newErrors[field.fieldName] = 'Invalid URL format'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const submitFormData = new FormData()

    // Add all text fields
    schema.fields.forEach(field => {
      if (field.fieldType !== 'image' && field.fieldType !== 'file') {
        submitFormData.append(field.fieldName, formData[field.fieldName] || '')
      }
    })

    // Add all files
    Object.entries(files).forEach(([fieldName, fileData]) => {
      if (fileData) {
        if (Array.isArray(fileData)) {
          fileData.forEach((file, index) => {
            submitFormData.append(`${fieldName}_${index}`, file)
          })
          submitFormData.append(`${fieldName}_count`, fileData.length.toString())
        } else {
          submitFormData.append(fieldName, fileData)
        }
      }
    })

    await onSubmit(submitFormData)
  }

  const renderField = (field: UploadField) => {
    const hasError = !!errors[field.fieldName]
    const errorClass = hasError ? 'border-red-500' : 'border-green-500'

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-green-400 font-semibold mb-2">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-gray-400 text-sm mb-2">{field.helpText}</p>
            )}
            <input
              type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : field.fieldType === 'url' ? 'url' : 'text'}
              value={formData[field.fieldName] || ''}
              onChange={(e) => handleTextChange(field.fieldName, e.target.value)}
              placeholder={field.placeholder || field.label}
              maxLength={field.maxLength}
              className={`w-full p-3 bg-gray-800 text-white placeholder-gray-500 border-2 ${errorClass} rounded-md focus:outline-none focus:border-green-400`}
            />
            {field.maxLength && (
              <p className="text-gray-500 text-xs mt-1">
                {(formData[field.fieldName]?.length || 0)} / {field.maxLength}
              </p>
            )}
            {hasError && <p className="text-red-400 text-sm mt-1">{errors[field.fieldName]}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-green-400 font-semibold mb-2">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-gray-400 text-sm mb-2">{field.helpText}</p>
            )}
            <textarea
              value={formData[field.fieldName] || ''}
              onChange={(e) => handleTextChange(field.fieldName, e.target.value)}
              placeholder={field.placeholder || field.label}
              maxLength={field.maxLength}
              rows={4}
              className={`w-full p-3 bg-gray-800 text-white placeholder-gray-500 border-2 ${errorClass} rounded-md focus:outline-none focus:border-green-400`}
            />
            {field.maxLength && (
              <p className="text-gray-500 text-xs mt-1">
                {(formData[field.fieldName]?.length || 0)} / {field.maxLength}
              </p>
            )}
            {hasError && <p className="text-red-400 text-sm mt-1">{errors[field.fieldName]}</p>}
          </div>
        )

      case 'image':
      case 'file':
        const currentFiles = files[field.fieldName]
        const existingFileUrl = initialData?.fileUrls?.[field.fieldName]
        const isMultiple = field.maxFiles && field.maxFiles > 1

        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-green-400 font-semibold mb-2">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-gray-400 text-sm mb-2">{field.helpText}</p>
            )}
            {field.acceptedFormats && (
              <p className="text-gray-500 text-xs mb-2">
                Accepted formats: {field.acceptedFormats.join(', ')}
              </p>
            )}

            {/* File input */}
            <div className={`border-2 border-dashed ${errorClass} rounded-md p-4`}>
              <input
                type="file"
                id={field.fieldName}
                onChange={(e) => handleFileChange(field, e.target.files)}
                accept={field.acceptedFormats?.join(',')}
                multiple={isMultiple}
                className="hidden"
              />
              <label
                htmlFor={field.fieldName}
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-green-400 mb-2" />
                <span className="text-white text-sm">
                  Click to upload {isMultiple ? 'files' : 'file'}
                </span>
                {isMultiple && field.maxFiles && (
                  <span className="text-gray-400 text-xs mt-1">
                    (Max {field.maxFiles} files)
                  </span>
                )}
              </label>
            </div>

            {/* Show existing file */}
            {existingFileUrl && !currentFiles && (
              <div className="mt-2 p-2 bg-gray-800 rounded-md flex items-center justify-between">
                <span className="text-gray-300 text-sm">
                  {field.fieldType === 'image' ? '📷' : '📄'} Current file
                </span>
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 text-sm hover:underline"
                >
                  View
                </a>
              </div>
            )}

            {/* Show selected files */}
            {currentFiles && (
              <div className="mt-2 space-y-2">
                {Array.isArray(currentFiles) ? (
                  currentFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-800 p-2 rounded-md"
                    >
                      <span className="text-white text-sm truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(field.fieldName, index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                    <span className="text-white text-sm truncate">{currentFiles.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(field.fieldName)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {hasError && <p className="text-red-400 text-sm mt-2">{errors[field.fieldName]}</p>}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.fields.map(field => renderField(field))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'SUBMITTING...' : buttonText}
      </button>
    </form>
  )
}
