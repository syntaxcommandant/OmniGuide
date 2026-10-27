from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.redteam_dataset import REDTEAM_BENCHMARK_SUITE
from app.services.redteam_runner import redteam_runner

router = APIRouter(prefix="/redteam", tags=["redteam"])


@router.get("/cases", response_model=List[Dict[str, Any]])
def get_redteam_cases():
    """Returns the versioned suite of adversarial benchmark test cases."""
    return [c.model_dump() for c in REDTEAM_BENCHMARK_SUITE]


@router.post("/run", response_model=Dict[str, Any])
def run_redteam_evaluation(db: Session = Depends(get_db)):
    """
    Executes the versioned red-team stress-test evaluation suite.
    Calculates empirical Precision, Recall, F1 Score, and prompt-injection defense rate.
    """
    try:
        return redteam_runner.run_evaluation(db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Red-team evaluation failed: {str(e)}"
        )


@router.get("/report", response_class=PlainTextResponse)
def get_redteam_report(db: Session = Depends(get_db)):
    """Exports a structured markdown report of the red-team stress test."""
    try:
        eval_data = redteam_runner.run_evaluation(db=db)
        return redteam_runner.generate_report(eval_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate red-team report: {str(e)}"
        )


@router.get("/report/json", response_model=Dict[str, Any])
def get_redteam_report_json(db: Session = Depends(get_db)):
    """Exports a structured machine-readable JSON report of the red-team stress test."""
    try:
        eval_data = redteam_runner.run_evaluation(db=db)
        return redteam_runner.generate_json_report(eval_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate red-team JSON report: {str(e)}"
        )

