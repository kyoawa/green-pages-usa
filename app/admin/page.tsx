"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const initializeData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/init-data', { method: 'POST' })
      const data = await response.json()
      setMessage(JSON.stringify(data, null, 2))
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <Button onClick={initializeData} disabled={loading}>
        {loading ? "Initializing..." : "Initialize Sample Data"}
      </Button>
      {message && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
          {message}
        </pre>
      )}
    </div>
  )
}