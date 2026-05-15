---
name: pdf
description: Read PDF files using poppler (pdftoppm) when the built-in Read tool fails on Windows.
trigger: when the user asks to read, view, or extract content from a PDF file
---

# Read PDF with Poppler

The built-in `Read` tool for PDFs requires `pdftoppm` on PATH. On this Windows machine it is not on PATH, so use the prebuilt poppler binaries downloaded to `/tmp`.

## Step 1 — Ensure poppler binaries are available

Check if the binaries exist. If not, download them:

```bash
# Check
ls /tmp/poppler-win/poppler-24.08.0/Library/bin/pdftoppm.exe 2>/dev/null

# Download if missing
curl -L -o /tmp/poppler.zip "https://github.com/oschwartz10612/poppler-windows/releases/download/v24.08.0-0/Release-24.08.0-0.zip" && \
cd /tmp && unzip -o poppler.zip -d poppler-win
```

## Step 2 — Render pages to PNG

Use `pdftoppm` to render specific pages as images. Always set PATH first:

```bash
export PATH="/tmp/poppler-win/poppler-24.08.0/Library/bin:$PATH"

# Render a single page (e.g. page 42)
pdftoppm -f 42 -l 42 -png -r 200 "/path/to/file.pdf" /tmp/pdf_page42

# Render a range (e.g. pages 10-12)
pdftoppm -f 10 -l 12 -png -r 200 "/path/to/file.pdf" /tmp/pdf_pages
```

Flags:
- `-f` / `-l`: first and last page numbers
- `-png`: output format
- `-r 200`: resolution in DPI (200 is a good balance of quality and size)

## Step 3 — Read the rendered images

The output filenames include zero-padded page numbers. Convert to Windows paths before reading:

```bash
# Find the actual output filenames
ls /tmp/pdf_page42*

# Get Windows path
cygpath -w /tmp/pdf_page42-042.png
```

Then use the `Read` tool with the Windows path (e.g. `C:\Users\albet\AppData\Local\Temp\pdf_page42-042.png`).

## Notes

- The `/tmp` directory maps to `C:\Users\albet\AppData\Local\Temp\` on this machine.
- Output filenames are `<prefix>-<zero-padded-page>.png` (e.g. `pdf_page42-042.png`).
- For large PDFs, render only the pages the user needs — don't render the entire document.
- If the user asks for text extraction instead of visual reading, use `pdftotext` from the same poppler bin directory.
