import re
from dataclasses import dataclass
from typing import List, Optional
from app.services.pdf_processor import PDFPageContent


@dataclass
class ExtractedClause:
    clause_identifier: str
    clause_text: str
    section_heading: Optional[str]
    page_number: Optional[int]


def split_text_into_clauses(text: str, default_page_number: Optional[int] = None, doc_prefix: str = "SEC") -> List[ExtractedClause]:
    """
    Parses raw text into distinct, identifiable clauses.
    Supports numbered sections (e.g., 1.1, Section 2, Rule 3, Clause A),
    bullet points, or semantic paragraphs.
    """
    if not text or not text.strip():
        return []

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    clauses: List[ExtractedClause] = []
    
    current_heading: Optional[str] = None
    clause_counter = 1
    
    # Pattern for explicit section numbers e.g. "Section 1.2", "Rule 4:", "1.1 General Claims", "SEC-03"
    section_pattern = re.compile(
        r'^(?:(?:Section|Sec\.?|Rule|Clause|Policy)\s+([A-Za-z0-9\.\-]+)|([0-9]+(?:\.[0-9]+)+|[0-9]+\.))\s*(.*)',
        re.IGNORECASE
    )

    buffer_lines: List[str] = []
    current_identifier: Optional[str] = None

    def flush_clause():
        nonlocal buffer_lines, current_identifier, clause_counter
        if not buffer_lines:
            return
        
        full_clause_content = " ".join(buffer_lines).strip()
        if len(full_clause_content) >= 15:  # filter noise
            if not current_identifier:
                identifier = f"{doc_prefix}-{clause_counter:02d}"
                clause_counter += 1
            else:
                identifier = current_identifier

            clauses.append(ExtractedClause(
                clause_identifier=identifier,
                clause_text=full_clause_content,
                section_heading=current_heading,
                page_number=default_page_number
            ))
        buffer_lines = []
        current_identifier = None

    for line in lines:
        match = section_pattern.match(line)
        if match:
            flush_clause()
            sec_num = match.group(1) or match.group(2)
            rest_of_line = match.group(3) or ""
            
            # Format clean identifier
            clean_sec = re.sub(r'[\.\:\s]+$', '', sec_num.strip())
            current_identifier = f"SEC-{clean_sec}" if not clean_sec.upper().startswith("SEC") else clean_sec.upper()
            
            if rest_of_line:
                if len(rest_of_line) < 40 and not rest_of_line.endswith("."):
                    current_heading = rest_of_line
                else:
                    buffer_lines.append(rest_of_line)
        elif line.startswith(("- ", "* ", "• ", "1. ", "2. ", "3. ", "4. ", "5. ")):
            flush_clause()
            # New bullet item
            bullet_text = re.sub(r'^[-*•\d\.]+\s*', '', line)
            current_identifier = f"RULE-{clause_counter:02d}"
            clause_counter += 1
            buffer_lines.append(bullet_text)
        elif len(line) < 50 and not line.endswith((".", ":", ";")) and not line.startswith('"'):
            # Likely a sub-heading or category
            flush_clause()
            current_heading = line
        else:
            buffer_lines.append(line)

    flush_clause()

    # Fallback: if no clauses were detected with patterns, split by double newlines or sentences
    if not clauses and text.strip():
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if len(p.strip()) >= 15]
        for i, para in enumerate(paragraphs, 1):
            clauses.append(ExtractedClause(
                clause_identifier=f"{doc_prefix}-{i:02d}",
                clause_text=para,
                section_heading=None,
                page_number=default_page_number
            ))

    return clauses


def extract_clauses_from_pdf_pages(pages: List[PDFPageContent]) -> List[ExtractedClause]:
    """
    Processes page-by-page PDF extraction results and creates clauses
    retaining their source page numbers.
    """
    all_clauses: List[ExtractedClause] = []
    clause_global_index = 1

    for page in pages:
        if not page.text.strip():
            continue
        page_clauses = split_text_into_clauses(
            text=page.text,
            default_page_number=page.page_number,
            doc_prefix="SEC"
        )
        for c in page_clauses:
            # Guarantee uniqueness across multiple pages
            if any(existing.clause_identifier == c.clause_identifier for existing in all_clauses):
                c.clause_identifier = f"{c.clause_identifier}-P{page.page_number}"
            all_clauses.append(c)
            clause_global_index += 1

    return all_clauses
