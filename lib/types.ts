// Upload Schema Types
export type FieldType = 'text' | 'textarea' | 'image' | 'file' | 'url' | 'phone' | 'email'

export interface UploadField {
  fieldName: string           // e.g., "brandName", "logoUrl"
  fieldType: FieldType
  label: string              // Display label: "Brand Name"
  required: boolean
  placeholder?: string
  helpText?: string
  maxLength?: number         // For text fields
  acceptedFormats?: string[] // For files: ['.jpg', '.png', '.svg']
  maxFiles?: number          // For multi-file uploads
}

export interface UploadSchema {
  schemaVersion: string      // e.g., "1.0"
  fields: UploadField[]
}

// Schema Templates (for reusable schemas)
export interface SchemaTemplate {
  id: string                 // Unique template ID
  name: string               // e.g., "Full Business Listing"
  description: string        // What this template is for
  schema: UploadSchema
  createdAt: string
  updatedAt: string
  createdBy?: string         // Admin user ID
}

// Ad Type with Schema
export interface AdTypeWithSchema {
  state: string
  adType: string
  title: string
  price: number
  available: number
  uploadSchema?: UploadSchema  // Optional for backward compatibility
}

// Submission Data (schemaless - stores any field)
export interface SubmissionData {
  id: string
  orderId: string
  itemId: string
  slotNumber: number
  adType: string
  adTitle: string
  state: string

  // Customer info
  customerEmail: string
  customerName: string
  customerPhone: string

  // Dynamic fields based on schema
  fieldData: { [fieldName: string]: any }

  // File URLs in S3
  fileUrls: { [fieldName: string]: string | string[] }

  // Metadata
  submittedAt: string
  lastEditedAt?: string
  status: 'pending' | 'approved' | 'published'
}
