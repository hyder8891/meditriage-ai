#!/bin/bash
# Image Optimization Script for MediTriage AI
# Optimizes large images to reduce bundle size and improve page load times

echo "🖼️  Starting image optimization..."

# Create backup directory
mkdir -p client/public/images/backups

# Function to optimize PNG files
optimize_png() {
    local file="$1"
    local size_before=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    echo "Optimizing PNG: $file ($(numfmt --to=iec $size_before))"
    
    # Use pngquant for lossy compression (high quality)
    if command -v pngquant &> /dev/null; then
        pngquant --quality=65-80 --ext .png --force "$file"
    fi
    
    # Use optipng for lossless compression
    if command -v optipng &> /dev/null; then
        optipng -o2 "$file"
    fi
}

# Function to optimize JPEG files
optimize_jpeg() {
    local file="$1"
    local size_before=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    echo "Optimizing JPEG: $file ($(numfmt --to=iec $size_before))"
    
    # Use jpegoptim for JPEG optimization
    if command -v jpegoptim &> /dev/null; then
        jpegoptim --max=85 --strip-all "$file"
    elif command -v convert &> /dev/null; then
        # Fallback to ImageMagick
        convert "$file" -quality 85 -strip "$file"
    fi
}

# Install optimization tools if not present
if ! command -v jpegoptim &> /dev/null; then
    echo "Installing jpegoptim..."
    sudo apt-get update && sudo apt-get install -y jpegoptim
fi

if ! command -v optipng &> /dev/null; then
    echo "Installing optipng..."
    sudo apt-get install -y optipng
fi

# Optimize large images (>500KB)
echo ""
echo "Optimizing large JPEG files..."
find client/public -type f \( -name "*.jpg" -o -name "*.jpeg" \) -size +500k -exec bash -c 'optimize_jpeg "$0"' {} \;

echo ""
echo "Optimizing large PNG files..."
find client/public -type f -name "*.png" -size +500k -exec bash -c 'optimize_png "$0"' {} \;

echo ""
echo "✅ Image optimization complete!"
echo ""
echo "📊 Size comparison:"
du -sh client/public/images/ 2>/dev/null || echo "Images directory size check skipped"
