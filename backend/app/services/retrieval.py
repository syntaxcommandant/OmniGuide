import math
import re
from dataclasses import dataclass
from typing import List, Optional, Set
from sqlalchemy.orm import Session
from app.models.guideline import GuidelineClause, GuidelineDocument


@dataclass
class RetrievedClause:
    clause_id: str
    clause_identifier: str
    clause_text: str
    document_name: str
    page_number: Optional[int]
    relevance_score: float
    retrieval_method: str  # "keyword_lexical" or "semantic_embedding"


STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
    "did", "do", "does", "doing", "don't", "down", "during", "each", "few", "for",
    "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers",
    "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is",
    "it", "its", "itself", "let's", "me", "more", "most", "my", "myself", "no",
    "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should",
    "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through",
    "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "were",
    "what", "when", "where", "which", "while", "who", "whom", "why", "with",
    "won't", "would", "you", "your", "yours", "yourself", "yourselves"
}


def tokenize(text: str) -> List[str]:
    """Extracts alphanumeric words in lowercase, skipping common stop words."""
    tokens = re.findall(r'[a-zA-Z0-9#\+]+', text.lower())
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]


class GuidelineRetriever:
    """
    Retrieves the most relevant guideline clauses for a submitted marketing copy.
    Implements a fast, reliable lexical/BM25 token-weighted baseline, clearly labeled as 'keyword_lexical'.
    """

    def retrieve_relevant_clauses(
        self,
        db: Session,
        query_text: str,
        top_k: int = 5,
        min_score: float = 0.05
    ) -> List[RetrievedClause]:
        """
        Retrieves top_k relevant guideline clauses for query_text.
        """
        # Fetch all clauses with parent document metadata
        clauses = (
            db.query(GuidelineClause, GuidelineDocument.title)
            .join(GuidelineDocument, GuidelineClause.document_id == GuidelineDocument.id)
            .all()
        )

        if not clauses:
            return []

        query_tokens = tokenize(query_text)
        if not query_tokens:
            # Fallback: return first top_k
            return [
                RetrievedClause(
                    clause_id=c.GuidelineClause.id,
                    clause_identifier=c.GuidelineClause.clause_identifier,
                    clause_text=c.GuidelineClause.clause_text,
                    document_name=c.title,
                    page_number=c.GuidelineClause.page_number,
                    relevance_score=1.0,
                    retrieval_method="keyword_lexical"
                )
                for c in clauses[:top_k]
            ]

        # Calculate BM25-style document frequency and match scores
        N = len(clauses)
        doc_freq = {}
        for c in clauses:
            clause_tokens = set(tokenize(c.GuidelineClause.clause_text))
            for t in set(query_tokens):
                if t in clause_tokens:
                    doc_freq[t] = doc_freq.get(t, 0) + 1

        scored_results: List[RetrievedClause] = []

        # High priority governance keywords that signal important rule mappings
        trigger_keywords = {
            "#1": ["superlative", "ranking", "number one", "#1", "first"],
            "fastest": ["speed", "fastest", "performance", "benchmark", "latency"],
            "best": ["superlative", "best", "quality", "unmatched"],
            "guarantee": ["guarantee", "warranty", "sla", "commitment"],
            "cheap": ["pricing", "cost", "cheap", "affordable", "tone"]
        }

        bonus_tokens = set()
        for q_word in query_tokens:
            for trigger, expansions in trigger_keywords.items():
                if trigger in q_word:
                    bonus_tokens.update(expansions)

        for c in clauses:
            clause_obj = c.GuidelineClause
            doc_title = c.title
            clause_tokens = tokenize(clause_obj.clause_text)
            
            if not clause_tokens:
                continue

            score = 0.0
            doc_len = len(clause_tokens)
            avg_len = 35.0  # approximate average clause length

            # BM25 parameters
            k1 = 1.5
            b = 0.75

            token_counts = {}
            for t in clause_tokens:
                token_counts[t] = token_counts.get(t, 0) + 1

            for t in query_tokens:
                if t in token_counts:
                    tf = token_counts[t]
                    df = doc_freq.get(t, 1)
                    idf = math.log((N - df + 0.5) / (df + 0.5) + 1.0)
                    tf_norm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc_len / avg_len)))
                    score += idf * tf_norm

            # Extra weight for bonus expanded governance signals
            for bt in bonus_tokens:
                if bt in token_counts:
                    score += 1.5

            if score > min_score:
                scored_results.append(RetrievedClause(
                    clause_id=clause_obj.id,
                    clause_identifier=clause_obj.clause_identifier,
                    clause_text=clause_obj.clause_text,
                    document_name=doc_title,
                    page_number=clause_obj.page_number,
                    relevance_score=round(score, 3),
                    retrieval_method="keyword_lexical"
                ))

        # Sort by relevance score descending
        scored_results.sort(key=lambda x: x.relevance_score, reverse=True)

        # If zero matches found (e.g. completely novel terminology), return top 3 default clauses
        if not scored_results:
            return [
                RetrievedClause(
                    clause_id=c.GuidelineClause.id,
                    clause_identifier=c.GuidelineClause.clause_identifier,
                    clause_text=c.GuidelineClause.clause_text,
                    document_name=c.title,
                    page_number=c.GuidelineClause.page_number,
                    relevance_score=0.1,
                    retrieval_method="keyword_lexical"
                )
                for c in clauses[:top_k]
            ]

        return scored_results[:top_k]


guideline_retriever = GuidelineRetriever()
