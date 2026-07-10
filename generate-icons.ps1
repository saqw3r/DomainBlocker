# PowerShell script to generate No Pass icons using ImageMagick
# Install ImageMagick from: https://imagemagick.org/script/download.php#windows

$iconSizes = @(16, 32, 48, 128)
$outputDir = "assets/icons"

# Ensure output directory exists
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

foreach ($size in $iconSizes) {
    $radius = [int]($size * 0.4)
    $stroke = [Math]::Max(2, [int]($size * 0.06))
    $fontSize = [int]($size * 0.5)
    
    # Create SVG for the icon
    $svg = @"<svg xmlns="http://www.w3.org/2000/svg" width="$size" height="$size">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#1a0000"/>
      <stop offset="100%" style="stop-color:#0a0000"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="$size" height="$size" fill="url(#bg)"/>
  
  <!-- Octagon border with glow -->
  <polygon points="$([int]($size*0.3)),0 $([int]($size*0.7)),0 $size,$([int]($size*0.3)) $size,$([int]($size*0.7)) $([int]($size*0.7)),$size $([int]($size*0.3)),$size 0,$([int]($size*0.7)) 0,$([int]($size*0.3))"
           fill="#1a0000"
           stroke="#ff0040"
           stroke-width="$stroke"
           filter="url(#glow)"/>
  
  <!-- X mark -->
  <line x1="$([int]($size*0.3))" y1="$([int]($size*0.3))" x2="$([int]($size*0.7))" y2="$([int]($size*0.7))"
        stroke="#ff0040"
        stroke-width="$([int]($size*0.08))"
        stroke-linecap="round"
        filter="url(#glow)"/>
  <line x1="$([int]($size*0.7))" y1="$([int]($size*0.3))" x2="$([int]($size*0.3))" y2="$([int]($size*0.7))"
        stroke="#ff0040"
        stroke-width="$([int]($size*0.08))"
        stroke-linecap="round"
        filter="url(#glow)"/>
</svg>
"@

    $svgPath = "$env:TEMP\icon$size.svg"
    $svg | Out-File -FilePath $svgPath -Encoding UTF8
    
    $outputPath = "$outputDir\icon$size.png"
    
    # Convert SVG to PNG using ImageMagick
    try {
        magick convert -background none $svgPath $outputPath
        Write-Host "✅ Created icon$size.png ($size x $size)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create icon$size.png. Make sure ImageMagick is installed." -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

Write-Host "`n🎨 All icons generated!" -ForegroundColor Cyan
