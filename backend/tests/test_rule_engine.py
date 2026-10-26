from app.services.rule_engine import rule_engine


def test_detect_unsupported_superlative_number_one():
    text = "India's #1 fastest tool for Indian teams."
    findings = rule_engine.run_checks(text)

    categories = [f.category for f in findings]
    excerpts = [f.original_excerpt for f in findings]

    assert "unsupported_superlative" in categories
    assert any("#1" in e for e in excerpts)
    assert any("fastest" in e for e in excerpts)


def test_detect_banned_terms():
    text = "Our cheap software is a silver bullet for your marketing workflow."
    findings = rule_engine.run_checks(text)

    excerpts = [f.original_excerpt.lower() for f in findings]
    assert "cheap" in excerpts
    assert "silver bullet" in excerpts


def test_approved_facts_matching():
    approved_facts = [
        "NovaForge benchmark latency is 42ms for enterprise workloads, certified by TechAudit Labs Jan 2026."
    ]

    # Test approved metric: 42ms should NOT be flagged as missing_approved_source
    text_with_approved = "Delivering verified 42ms latency for fast workflows."
    findings_approved = rule_engine.run_checks(text_with_approved, approved_facts=approved_facts)
    missing_sources = [f for f in findings_approved if f.category == "missing_approved_source"]
    assert len(missing_sources) == 0

    # Test unapproved metric: 99.9% should be flagged
    text_with_unapproved = "Achieving 99.9% error reduction overnight."
    findings_unapproved = rule_engine.run_checks(text_with_unapproved, approved_facts=approved_facts)
    missing_sources_unapp = [f for f in findings_unapproved if f.category == "missing_approved_source"]
    assert len(missing_sources_unapp) > 0
    assert "99.9%" in missing_sources_unapp[0].original_excerpt
