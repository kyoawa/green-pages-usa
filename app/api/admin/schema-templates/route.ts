import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import type { SchemaTemplate } from '@/lib/types'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
const docClient = DynamoDBDocumentClient.from(client)

const TEMPLATES_TABLE = process.env.SCHEMA_TEMPLATES_TABLE_NAME || 'green-pages-schema-templates'

// GET - List all templates
export async function GET(request: NextRequest) {
  try {
    const command = new ScanCommand({
      TableName: TEMPLATES_TABLE
    })

    const response = await docClient.send(command)

    return NextResponse.json({
      templates: response.Items || [],
      count: response.Items?.length || 0
    })
  } catch (error) {
    console.error('Error fetching schema templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schema templates' },
      { status: 500 }
    )
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, schema } = body

    if (!name || !schema) {
      return NextResponse.json(
        { error: 'Name and schema are required' },
        { status: 400 }
      )
    }

    const template: SchemaTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: description || '',
      schema,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const command = new PutCommand({
      TableName: TEMPLATES_TABLE,
      Item: template
    })

    await docClient.send(command)

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Error creating schema template:', error)
    return NextResponse.json(
      { error: 'Failed to create schema template' },
      { status: 500 }
    )
  }
}

// DELETE - Remove template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const command = new DeleteCommand({
      TableName: TEMPLATES_TABLE,
      Key: { id: templateId }
    })

    await docClient.send(command)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schema template:', error)
    return NextResponse.json(
      { error: 'Failed to delete schema template' },
      { status: 500 }
    )
  }
}
