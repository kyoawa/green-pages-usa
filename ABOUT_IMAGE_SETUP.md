# About Page - Image Setup Instructions

## ✅ What Changed

The About page now displays an **image** instead of a PDF iframe for better reliability and performance.

## 📋 Setup Steps

### Option 1: Convert PDF to Image (Recommended)

**On Mac (using Preview):**
1. Open your PDF in Preview
2. Go to File → Export
3. Format: PNG
4. Resolution: 300 DPI or higher for best quality
5. Save as: `about.png`
6. Copy to your project:
   ```bash
   cp /path/to/about.png /Users/kylea/green-pages-usa/public/about.png
   ```

**On Mac (using Command Line - ImageMagick):**
```bash
# Install ImageMagick if you don't have it
brew install imagemagick

# Convert PDF to high-quality PNG
convert -density 300 your-pdf.pdf -quality 90 about.png

# If multi-page PDF, it will create about-0.png, about-1.png, etc.
# Move the files to your public directory
mv about*.png /Users/kylea/green-pages-usa/public/
```

**Online Tools (if you prefer):**
- https://www.pdf2png.com/
- https://cloudconvert.com/pdf-to-png
- https://smallpdf.com/pdf-to-jpg

### Option 2: Use Multiple Images for Multi-Page PDFs

If your PDF has multiple pages, you can display them all:

**Update `/app/about/page.tsx`:**

```typescript
<div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 space-y-4 p-4">
  <img src="/about-page-1.png" alt="About Green Pages USA - Page 1" className="w-full h-auto" />
  <img src="/about-page-2.png" alt="About Green Pages USA - Page 2" className="w-full h-auto" />
  <img src="/about-page-3.png" alt="About Green Pages USA - Page 3" className="w-full h-auto" />
</div>
```

### Option 3: Create a Long Scrollable Image

If you have multiple pages, you can combine them into one long image:

```bash
# Using ImageMagick to combine multiple pages vertically
convert about-*.png -append about-combined.png
```

## 📁 Required File

Place your image file here:
```
/Users/kylea/green-pages-usa/public/about.png
```

## 🎨 Image Recommendations

- **Format:** PNG (best quality) or JPG (smaller file size)
- **Resolution:** 300 DPI minimum for text clarity
- **Width:** 2400px or larger for high-resolution displays
- **Optimization:** Use TinyPNG.com to reduce file size without losing quality

## 🔧 Optional: Keep PDF Download Link

The page still includes a download link for the PDF version. To enable this:

1. Keep your original PDF in `/public/about.pdf`
2. Users can view the image on the page
3. Users can download the PDF if they want the full document

To remove the PDF download link, delete lines 30-36 in `/app/about/page.tsx`.

## ✅ Testing

1. Place `about.png` in `/public/`
2. Run `npm run dev`
3. Visit http://localhost:3000/about
4. Image should display without any home page showing inside

## 🚀 Deploy

```bash
git add .
git commit -m "Update About page to use image instead of PDF iframe"
git push origin main
```

---

**Benefits of Using an Image:**
- ✅ No browser compatibility issues
- ✅ Faster loading
- ✅ Better mobile experience
- ✅ No iframe security concerns
- ✅ Works on all devices
- ✅ Easier to implement and maintain
