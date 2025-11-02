"use client"

import { useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import { UserMenu } from '@/components/UserMenu'
import { CartButton } from '@/components/CartButton'

// Green Pages Montana 2025 Magazine - 28 pages
const magazinePages = [
  { id: 1, image: '/magazine/cover.jpg', title: 'Cover' },
  { id: 2, image: '/magazine/page-1.jpg', title: 'Page 1' },
  { id: 3, image: '/magazine/page-2.jpg', title: 'Page 2' },
  { id: 4, image: '/magazine/page-3.jpg', title: 'Page 3' },
  { id: 5, image: '/magazine/page-4.jpg', title: 'Page 4' },
  { id: 6, image: '/magazine/page-5.jpg', title: 'Page 5' },
  { id: 7, image: '/magazine/page-6.jpg', title: 'Page 6' },
  { id: 8, image: '/magazine/page-7.jpg', title: 'Page 7' },
  { id: 9, image: '/magazine/page-8.jpg', title: 'Page 8' },
  { id: 10, image: '/magazine/page-9.jpg', title: 'Page 9' },
  { id: 11, image: '/magazine/page-10.jpg', title: 'Page 10' },
  { id: 12, image: '/magazine/page-11.jpg', title: 'Page 11' },
  { id: 13, image: '/magazine/page-12.jpg', title: 'Page 12' },
  { id: 14, image: '/magazine/page-13.jpg', title: 'Page 13' },
  { id: 15, image: '/magazine/page-14.jpg', title: 'Page 14' },
  { id: 16, image: '/magazine/page-15.jpg', title: 'Page 15' },
  { id: 17, image: '/magazine/page-16.jpg', title: 'Page 16' },
  { id: 18, image: '/magazine/page-17.jpg', title: 'Page 17' },
  { id: 19, image: '/magazine/page-18.jpg', title: 'Page 18' },
  { id: 20, image: '/magazine/page-19.jpg', title: 'Page 19' },
  { id: 21, image: '/magazine/page-20.jpg', title: 'Page 20' },
  { id: 22, image: '/magazine/page-21.jpg', title: 'Page 21' },
  { id: 23, image: '/magazine/page-22.jpg', title: 'Page 22' },
  { id: 24, image: '/magazine/page-23.jpg', title: 'Page 23' },
  { id: 25, image: '/magazine/page-24.jpg', title: 'Page 24' },
  { id: 26, image: '/magazine/page-25.jpg', title: 'Page 25' },
  { id: 27, image: '/magazine/page-26.jpg', title: 'Page 26' },
  { id: 28, image: '/magazine/back-cover.jpg', title: 'Back Cover' },
]

const Page = ({ pageNumber, image }: { pageNumber: number; image: string }) => {
  return (
    <div className="relative w-full h-full bg-white shadow-2xl">
      <img
        src={image}
        alt={`Page ${pageNumber}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback if image doesn't exist
          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"%3E%3Crect fill="%23f0f0f0" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3EPage ' + pageNumber + '%3C/text%3E%3C/svg%3E'
        }}
      />
      <div className="absolute bottom-4 right-4 text-gray-600 text-sm">
        {pageNumber}
      </div>
    </div>
  )
}

export default function MagazinePage() {
  const book = useRef<any>()
  const [currentPage, setCurrentPage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const totalPages = magazinePages.length

  const nextPage = () => {
    if (book.current) {
      book.current.pageFlip().flipNext()
    }
  }

  const prevPage = () => {
    if (book.current) {
      book.current.pageFlip().flipPrev()
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
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
          <a href="/about" className="text-gray-300 hover:text-white">ABOUT</a>
          <a href="/magazine" className="text-gray-300 hover:text-white">MAGAZINE</a>
          <a href="/contact" className="text-gray-300 hover:text-white">CONTACT</a>
        </nav>
        <div className="flex items-center gap-3">
          <CartButton />
          <UserMenu />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4 tracking-wider text-green-400">
            DIGITAL MAGAZINE
          </h1>
          <p className="text-gray-400 text-lg">
            Swipe or click to turn pages • Pinch to zoom
          </p>
        </div>

        {/* Magazine Container */}
        <div className="flex justify-center items-center mb-8">
          <div className="relative">
            {/* The FlipBook */}
            <HTMLFlipBook
              ref={book}
              width={500}
              height={700}
              size="stretch"
              minWidth={315}
              maxWidth={1200}
              minHeight={400}
              maxHeight={1600}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              onFlip={(e: any) => setCurrentPage(e.data)}
              className="shadow-2xl"
              style={{}}
              startPage={0}
              drawShadow={true}
              flippingTime={1000}
              usePortrait={false}
              startZIndex={0}
              autoSize={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
            >
              {magazinePages.map((page, index) => (
                <div key={page.id} className="page">
                  <Page pageNumber={index + 1} image={page.image} />
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages - 1}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-full transition-colors ml-4"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Thumbnail Navigation */}
        <div className="flex justify-center gap-2 overflow-x-auto pb-4">
          {magazinePages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => {
                if (book.current) {
                  book.current.pageFlip().flip(index)
                }
              }}
              className={`flex-shrink-0 relative ${
                currentPage === index
                  ? 'ring-4 ring-green-400'
                  : 'ring-1 ring-gray-600 hover:ring-gray-400'
              } rounded overflow-hidden transition-all`}
            >
              <img
                src={page.image}
                alt={page.title}
                className="w-16 h-24 object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96"%3E%3Crect fill="%23333" width="64" height="96"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3E' + (index + 1) + '%3C/text%3E%3C/svg%3E'
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-1">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
