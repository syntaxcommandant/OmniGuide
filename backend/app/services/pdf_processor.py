import io
import logging
from dataclasses import dataclass
from typing import List
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


class ScannedPDFError(ValueError):
    """Raised when a PDF contains no extractable text (e.g. scanned image)."""
    pass


class InvalidPDFError(ValueError):
    """Raised when the uploaded file is corrupt or not a valid PDF."""
    pass


@dataclass
class PDFPageContent:
    page_number: int
    text: str


@dataclass
class PDFExtractionResult:
    filename: str
    total_pages: int
    full_text: str
    pages: List[PDFPageContent]


def extract_text_from_pdf_bytes(pdf_bytes: bytes, filename: str = "document.pdf") -> PDFExtractionResult:
    """
    Extracts text from PDF bytes page-by-page using PyMuPDF.
    Detects scanned/image-only PDFs and raises ScannedPDFError.
    """
    if not pdf_bytes or len(pdf_bytes) < 10:
        raise InvalidPDFError("The uploaded file is empty or corrupted.")

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        logger.error(f"Failed to parse PDF bytes: {e}")
        raise InvalidPDFError(f"Invalid PDF document format: {str(e)}")

    pages: List[PDFPageContent] = []
    total_char_count = 0

    try:
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_text = page.get_text("text").strip()
            total_char_count += len(page_text)
            pages.append(PDFPageContent(
                page_number=page_idx + 1,
                text=page_text
            ))
    finally:
        doc.close()

    # If document has pages but zero or negligible text extracted, it's a scanned/rasterized PDF
    if len(pages) > 0 and total_char_count < 15:
        raise ScannedPDFError(
            "Scanned or image-only PDF detected. The document contains no extractable text. "
            "OCR is not currently supported; please upload a digital PDF with searchable text "
            "or paste guidelines manually."
        )

    full_text = "\n\n".join(f"[Page {p.page_number}]\n{p.text}" for p in pages if p.text)
    
    return PDFExtractionResult(
        filename=filename,
        total_pages=len(pages),
        full_text=full_text,
        pages=pages
    )
