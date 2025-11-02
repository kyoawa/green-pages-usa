# Icon Setup for Green Pages USA

## Current Status

The site currently uses `app/icon.svg` for the favicon and app icon. This works in most browsers, but for optimal PWA (Progressive Web App) support and iOS "Add to Home Screen", you should also create PNG versions.

## Creating PNG Icons from SVG

You have the SVG logo at `app/icon.svg`. To create proper PNG icons:

### Option 1: Online Tools (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload `app/icon.svg`
3. Configure the icon for different platforms
4. Download the generated package
5. Extract the files to the `public/` folder

### Option 2: Using Figma/Design Software
1. Open `app/icon.svg` in Figma, Adobe Illustrator, or Sketch
2. Export as PNG with these sizes:
   - `icon-192.png` (192x192px)
   - `icon-512.png` (512x512px)
   - `apple-touch-icon.png` (180x180px)
   - `favicon.ico` (32x32px, can use https://favicon.io/favicon-converter/)
3. Place all files in the `public/` folder

### Option 3: Command Line (macOS)
If you have a PNG version of the logo:
```bash
# Install sharp-cli if needed
npm install -g sharp-cli

# Generate icons
sharp -i logo.png -o public/icon-192.png resize 192 192
sharp -i logo.png -o public/icon-512.png resize 512 512
sharp -i logo.png -o public/apple-touch-icon.png resize 180 180
```

## After Creating PNG Icons

Once you have the PNG files in the `public/` folder, update `public/manifest.json`:

```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

And uncomment the icon configuration in `app/layout.tsx` if needed.

## Files Needed for Full PWA Support

Place these in the `public/` folder:
- ✅ `icon.svg` - Already copied for fallback
- ⏳ `icon-192.png` - For Android/PWA
- ⏳ `icon-512.png` - For Android/PWA
- ⏳ `apple-touch-icon.png` - For iOS "Add to Home Screen"
- ⏳ `favicon.ico` - For browser tabs (optional, SVG works)

## Testing Web App Installation

### iOS (iPhone/iPad)
1. Open site in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. The app name and icon should appear correctly

### Android
1. Open site in Chrome
2. Tap the three dots menu
3. Tap "Add to Home screen"
4. OR Chrome will prompt automatically if PWA criteria are met

### Desktop (Chrome/Edge)
1. Look for install icon in address bar
2. Click to install as desktop app
