const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb")

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const TEMPLATES_TABLE = process.env.SCHEMA_TEMPLATES_TABLE_NAME || 'green-pages-schema-templates'

const templates = [
  {
    id: `template_fullpage_${Date.now()}`,
    name: "Full Page Ad",
    description: "Full page advertisement with basic info and file upload",
    schema: {
      schemaVersion: "1.0",
      fields: [
        {
          fieldName: "name",
          fieldType: "text",
          label: "Name",
          required: true,
          placeholder: "Your Name",
          helpText: ""
        },
        {
          fieldName: "dispensaryBrand",
          fieldType: "text",
          label: "Dispensary/Brand",
          required: true,
          placeholder: "Dispensary or Brand Name",
          helpText: ""
        },
        {
          fieldName: "adFile",
          fieldType: "file",
          label: "Ad File Upload",
          required: true,
          helpText: "Upload your full page ad file",
          acceptedFormats: [".pdf", ".ai", ".eps", ".psd", ".jpg", ".png"]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: `template_halfpage_${Date.now()}`,
    name: "1/2 Page Ad",
    description: "Half page advertisement with document (250 words max) and logo",
    schema: {
      schemaVersion: "1.0",
      fields: [
        {
          fieldName: "name",
          fieldType: "text",
          label: "Name",
          required: true,
          placeholder: "Your Name",
          helpText: ""
        },
        {
          fieldName: "dispensaryBrand",
          fieldType: "text",
          label: "Dispensary/Brand",
          required: true,
          placeholder: "Dispensary or Brand Name",
          helpText: ""
        },
        {
          fieldName: "documentFile",
          fieldType: "file",
          label: "Document Upload",
          required: true,
          helpText: "Word document - 250 words maximum",
          acceptedFormats: [".doc", ".docx", ".txt", ".pdf"]
        },
        {
          fieldName: "logoFile",
          fieldType: "file",
          label: "Logo Upload",
          required: true,
          helpText: "Vectors only (.EPS, .AI, .SVG, .PDF)",
          acceptedFormats: [".eps", ".ai", ".svg", ".pdf"]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: `template_quarterpage_${Date.now()}`,
    name: "1/4 Page Ad",
    description: "Quarter page advertisement with document (140 words max) and logo",
    schema: {
      schemaVersion: "1.0",
      fields: [
        {
          fieldName: "name",
          fieldType: "text",
          label: "Name",
          required: true,
          placeholder: "Your Name",
          helpText: ""
        },
        {
          fieldName: "dispensaryBrand",
          fieldType: "text",
          label: "Dispensary/Brand",
          required: true,
          placeholder: "Dispensary or Brand Name",
          helpText: ""
        },
        {
          fieldName: "documentFile",
          fieldType: "file",
          label: "Document Upload",
          required: true,
          helpText: "Word document - 140 words maximum",
          acceptedFormats: [".doc", ".docx", ".txt", ".pdf"]
        },
        {
          fieldName: "logoFile",
          fieldType: "file",
          label: "Logo Upload",
          required: true,
          helpText: "Vectors only (.EPS, .AI, .SVG, .PDF)",
          acceptedFormats: [".eps", ".ai", ".svg", ".pdf"]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: `template_bellyband_${Date.now()}`,
    name: "Belly Band",
    description: "Belly band advertisement with logo only",
    schema: {
      schemaVersion: "1.0",
      fields: [
        {
          fieldName: "name",
          fieldType: "text",
          label: "Name",
          required: true,
          placeholder: "Your Name",
          helpText: ""
        },
        {
          fieldName: "dispensaryBrand",
          fieldType: "text",
          label: "Dispensary/Brand",
          required: true,
          placeholder: "Dispensary or Brand Name",
          helpText: ""
        },
        {
          fieldName: "logoFile",
          fieldType: "file",
          label: "Logo Upload",
          required: true,
          helpText: "Vectors only (.EPS, .AI, .SVG, .PDF)",
          acceptedFormats: [".eps", ".ai", ".svg", ".pdf"]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: `template_backcover_${Date.now()}`,
    name: "Back Cover",
    description: "Back cover advertisement with basic info and file upload",
    schema: {
      schemaVersion: "1.0",
      fields: [
        {
          fieldName: "name",
          fieldType: "text",
          label: "Name",
          required: true,
          placeholder: "Your Name",
          helpText: ""
        },
        {
          fieldName: "dispensaryBrand",
          fieldType: "text",
          label: "Dispensary/Brand",
          required: true,
          placeholder: "Dispensary or Brand Name",
          helpText: ""
        },
        {
          fieldName: "adFile",
          fieldType: "file",
          label: "Ad File Upload",
          required: true,
          helpText: "Upload your back cover ad file",
          acceptedFormats: [".pdf", ".ai", ".eps", ".psd", ".jpg", ".png"]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: `template_singlelisting_${Date.now()}`,
    name: "Single Listing",
    description: "Single listing with document (100 words max) and logo",
    schema: {
      schemaVersion: "1.0",
      fields: [
        {
          fieldName: "name",
          fieldType: "text",
          label: "Name",
          required: true,
          placeholder: "Your Name",
          helpText: ""
        },
        {
          fieldName: "dispensaryBrand",
          fieldType: "text",
          label: "Dispensary/Brand",
          required: true,
          placeholder: "Dispensary or Brand Name",
          helpText: ""
        },
        {
          fieldName: "documentFile",
          fieldType: "file",
          label: "Document Upload",
          required: true,
          helpText: "Word document - 100 words maximum",
          acceptedFormats: [".doc", ".docx", ".txt", ".pdf"]
        },
        {
          fieldName: "logoFile",
          fieldType: "file",
          label: "Logo Upload",
          required: true,
          helpText: "Vectors only (.EPS, .AI, .SVG, .PDF)",
          acceptedFormats: [".eps", ".ai", ".svg", ".pdf"]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

async function seedTemplates() {
  console.log('🌱 Seeding schema templates...\n')

  for (const template of templates) {
    try {
      const command = new PutCommand({
        TableName: TEMPLATES_TABLE,
        Item: template
      })

      await docClient.send(command)
      console.log(`✅ Created template: ${template.name}`)
    } catch (error) {
      console.error(`❌ Failed to create template: ${template.name}`, error)
    }
  }

  console.log('\n✨ Template seeding complete!')
  console.log(`Total templates created: ${templates.length}`)
}

seedTemplates()
