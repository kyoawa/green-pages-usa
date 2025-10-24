"use client"

import React from 'react'


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
          <a href="/contact" className="text-gray-300 hover:text-white">CONTACT</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">About Green Pages USA</h1>
          
          {/* Image Viewer - All 4 Pages Stacked */}
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <img
              src="/about/Green Pages Landscape Media Kit_Page_1.png"
              alt="About Green Pages USA - Page 1"
              className="w-full h-auto"
            />
            <div className="border-t border-gray-700 my-1"></div>
            <img
              src="/about/Green Pages Landscape Media Kit_Page_2.png"
              alt="About Green Pages USA - Page 2"
              className="w-full h-auto"
            />
            <div className="border-t border-gray-700 my-1"></div>
            <img
              src="/about/Green Pages Landscape Media Kit_Page_3.png"
              alt="About Green Pages USA - Page 3"
              className="w-full h-auto"
            />
            <div className="border-t border-gray-700 my-1"></div>
            <img
              src="/about/Green Pages Landscape Media Kit_Page_4.png"
              alt="About Green Pages USA - Page 4"
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
