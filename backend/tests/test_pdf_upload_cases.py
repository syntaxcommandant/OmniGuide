import io
import fitz
import pytest
from app.core.config import settings


def _create_sample_pdf(title: str, body_text: str) -> bytes:
    """Helper to generate a real, valid, searchable in-memory PDF using PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), f"{title}\n\n{body_text}", fontsize=11)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def test_valid_pdf_upload_and_clause_extraction(client):
    """
    Test 1: Valid PDF upload, extraction, and clause storage.
    """
    sample_text = """
    Section 1.1 Superlative Restrictions
    All marketing communications must avoid unqualified superlative claims such as #1 or best.

    Section 1.2 Metric Evidence Requirements
    Any numerical claim citing percentage growth or speed improvements must have audited backing.
    """
    pdf_bytes = _create_sample_pdf("Enterprise Brand Guidelines 2026", sample_text)
    file_obj = io.BytesIO(pdf_bytes)

    response = client.post(
        "/api/guidelines/upload",
        data={"title": "Enterprise Brand Guidelines 2026"},
        files={"file": ("guidelines.pdf", file_obj, "application/pdf")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Enterprise Brand Guidelines 2026"
    assert data["clause_count"] >= 2

    # Verify clauses are accessible via detail endpoint
    doc_id = data["id"]
    detail_res = client.get(f"/api/guidelines/{doc_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert len(detail_data["clauses"]) >= 2
    assert any("SEC-1.1" in c["clause_identifier"] or "1.1" in c["clause_identifier"] for c in detail_data["clauses"])


def test_scanned_or_empty_pdf_rejection(client):
    """
    Test 2: Scanned/rasterized PDF with no extractable text triggers ScannedPDFError (HTTP 422).
    """
    # Create empty PDF with 1 blank page (no text)
    doc = fitz.open()
    doc.new_page()
    blank_bytes = doc.write()
    doc.close()

    file_obj = io.BytesIO(blank_bytes)
    response = client.post(
        "/api/guidelines/upload",
        data={"title": "Scanned Document Test"},
        files={"file": ("scanned.pdf", file_obj, "application/pdf")}
    )
    assert response.status_code == 422
    err = response.json()
    assert "Scanned or image-only PDF detected" in err["detail"]


def test_invalid_file_type_rejection(client):
    """
    Test 3: Non-PDF file types (.txt, .docx, .png) are rejected with HTTP 400.
    """
    txt_file = io.BytesIO(b"Brand policy text that is not a PDF")
    response = client.post(
        "/api/guidelines/upload",
        data={"title": "Text File Test"},
        files={"file": ("policy.txt", txt_file, "text/plain")}
    )
    assert response.status_code == 400
    err = response.json()
    assert "Unsupported file format" in err["detail"]


def test_oversized_file_rejection(client):
    """
    Test 4: Files exceeding the configured UPLOAD_MAX_SIZE_MB limit (15MB) are rejected with HTTP 400.
    """
    # Create a dummy payload larger than 15MB
    limit_bytes = (settings.UPLOAD_MAX_SIZE_MB + 1) * 1024 * 1024
    oversized_data = b"%PDF-1.4 " + (b"0" * (limit_bytes - 10))
    file_obj = io.BytesIO(oversized_data)

    response = client.post(
        "/api/guidelines/upload",
        data={"title": "Oversized File Test"},
        files={"file": ("huge.pdf", file_obj, "application/pdf")}
    )
    assert response.status_code == 400
    err = response.json()
    assert "exceeds the maximum permitted limit" in err["detail"]
