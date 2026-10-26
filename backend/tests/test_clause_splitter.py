from app.services.clause_splitter import split_text_into_clauses


def test_split_numbered_sections():
    raw_text = """
    Section 1.1 Superlative Claims
    Never claim #1 or first place without audited third-party proof.

    Section 1.2 Speed Claims
    Avoid absolute speed claims like fastest without technical benchmarks.
    """
    clauses = split_text_into_clauses(raw_text, default_page_number=1)
    assert len(clauses) >= 2
    identifiers = [c.clause_identifier for c in clauses]
    assert any("1.1" in i for i in identifiers)
    assert any("1.2" in i for i in identifiers)
    assert clauses[0].page_number == 1


def test_split_bullet_points():
    bullet_text = """
    - Terminology: Always refer to the platform as AI-assisted.
    - Warranties: Never promise 100% risk-free outcomes.
    - Trademarks: The NovaForge logo must maintain clear space.
    """
    clauses = split_text_into_clauses(bullet_text, default_page_number=2)
    assert len(clauses) == 3
    assert all(c.clause_identifier.startswith("RULE-") for c in clauses)
    assert clauses[0].page_number == 2
