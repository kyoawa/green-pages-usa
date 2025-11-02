"use client"

import React from 'react'
import { CartButton } from '@/components/CartButton'
import { UserMenu } from '@/components/UserMenu'


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <a href="/">
            <img
              src="/logo.svg"
              alt="Green Pages"
              className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </a>
        </div>
        <nav className="flex space-x-8">
          <a href="/about" className="text-white font-semibold">ABOUT</a>
          <a href="/magazine" className="text-gray-300 hover:text-white">MAGAZINE</a>
          <a href="/contact" className="text-gray-300 hover:text-white">CONTACT</a>
        </nav>
        <div className="flex items-center gap-3">
          <CartButton />
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">About Green Pages USA</h1>
          
          {/* Image Viewer */}
          <div className="overflow-hidden">
            <img
              src="/about/Green Pages Website Media Kit.jpg"
              alt="About Green Pages USA"
              className="w-full h-auto"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 p-6 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-sm text-gray-400">
            © Green Pages USA 2025
          </div>
        </div>
      </footer>
    </div>
  )
}
