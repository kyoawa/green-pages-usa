"use client"

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ThankYouPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl lg:text-6xl font-bold mb-4 text-green-400">
            THANK YOU!
          </h1>
          <p className="text-xl lg:text-2xl text-gray-300 mb-6">
            Your submission has been received
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="text-left space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold flex-shrink-0 mt-1">
                1
              </div>
              <p>
                <strong className="text-white">Review:</strong> Our team will review your submission to ensure it meets our quality standards.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold flex-shrink-0 mt-1">
                2
              </div>
              <p>
                <strong className="text-white">Processing:</strong> Your listing will be processed and prepared for publication.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold flex-shrink-0 mt-1">
                3
              </div>
              <p>
                <strong className="text-white">Publication:</strong> Your ad will appear in the next edition of our directory.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/30 to-gray-900/30 border border-green-700 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-400">
            You will receive a confirmation email shortly with your order details.
            If you have any questions, please contact our support team.
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-8 rounded-full transition-colors text-lg"
        >
          RETURN TO HOME
        </button>
      </div>
    </div>
  )
}
