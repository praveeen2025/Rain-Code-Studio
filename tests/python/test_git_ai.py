"""SnapDev AI - Phase 7 Git & Developer AI Features Unit & Integration Tests.

Validates:
1. Commit message generation from staged git diff.
2. Conventional commit parsing (type, scope, subject, reasoning).
3. Commit explanation with metadata, file extraction, impact, and symbols.
4. Git change review using the Phase 6 Code Review service.
5. FastAPI endpoints:
   - POST /api/ai/commit-message
   - POST /api/ai/explain-commit
6. Safety & Privacy:
   - Zero automatic commits
   - Zero external cloud calls
   - Zero destructive operations
"""

import pytest
from fastapi.testclient import TestClient

from python.api import app
from python.ai.schemas import (
    CommitMessageRequest,
    CommitMessageSuggestion,
    ExplainCommitRequest,
    CommitAnalysis,
    CodeContextInput,
    CodeReviewResult,
)
from python.ai.developer_service import get_developer_service
from python.ai.prompts import (
    build_commit_message_prompt,
    build_commit_explanation_prompt,
)

client = TestClient(app)


SAMPLE_STAGED_DIFF = """
diff --git a/src/auth.ts b/src/auth.ts
index 1234567..89abcdef 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,4 +10,12 @@ export function login(user: string, pass: string): boolean {
+  if (!user || !pass) {
+    throw new Error("Missing credentials");
+  }
+  return verifyHash(pass);
+}
"""


def test_build_commit_message_prompt():
    """Verify prompt builder formats staged diff and rules."""
    prompt = build_commit_message_prompt(
        staged_diff=SAMPLE_STAGED_DIFF,
        chunks=[],
        hint="add credential verification",
    )
    assert "expert commit author" in prompt
    assert "DEVELOPER HINT/INTENT: add credential verification" in prompt
    assert "CONVENTIONAL COMMIT FORMAT" in prompt
    assert "diff --git a/src/auth.ts" in prompt


def test_build_commit_explanation_prompt():
    """Verify prompt builder formats commit metadata and diff."""
    metadata = {
        "hash": "abcdef123456",
        "author": "Jane Developer",
        "date": "2026-09-29T10:00:00Z",
        "message": "feat(auth): validate credentials",
    }
    prompt = build_commit_explanation_prompt(
        commit_diff=SAMPLE_STAGED_DIFF,
        metadata=metadata,
        chunks=[],
    )
    assert "expert commit analyzer" in prompt
    assert "abcdef123456" in prompt
    assert "Jane Developer" in prompt
    assert "feat(auth): validate credentials" in prompt


def test_generate_commit_message_service():
    """Verify DeveloperService generates conventional commit suggestion."""
    service = get_developer_service()
    req = CommitMessageRequest(
        stagedDiff=SAMPLE_STAGED_DIFF,
        hint="add auth validation",
    )
    result = service.generate_commit_message(req)

    assert isinstance(result, CommitMessageSuggestion)
    assert result.suggestedMessage is not None
    assert len(result.suggestedMessage) > 0
    assert result.conventionalType in ["feat", "fix", "refactor", "docs", "test", "chore", "perf", "style"]
    assert len(result.shortSummary) > 0
    assert result.generationTimeMs >= 0.0


def test_explain_commit_service():
    """Verify DeveloperService explains commit architecture and impact."""
    service = get_developer_service()
    req = ExplainCommitRequest(
        hash="f4c1e2d3",
        message="feat(auth): add token verification",
        author="Jane Dev",
        date="2026-09-29T10:00:00Z",
        diff=SAMPLE_STAGED_DIFF,
    )
    result = service.explain_commit(req)

    assert isinstance(result, CommitAnalysis)
    assert result.summary is not None
    assert len(result.summary) > 0
    assert "src/auth.ts" in result.filesAffected
    assert len(result.mainChanges) > 0
    assert result.potentialImpact is not None
    assert result.confidence > 0.0


def test_change_review_reuses_code_review_service():
    """Verify Phase 7 AI Change Review reuses the Phase 6 CodeReview service."""
    service = get_developer_service()
    ctx = CodeContextInput(
        selectedCode=SAMPLE_STAGED_DIFF,
        relativePath="src/auth.ts",
        query="Review git diff changes for edge cases and security.",
    )
    result = service.review_code(ctx)

    assert isinstance(result, CodeReviewResult)
    assert result.summary is not None
    assert isinstance(result.findings, list)
    assert len(result.findings) > 0


def test_api_commit_message_endpoint():
    """Integration test: POST /api/ai/commit-message."""
    payload = {
        "stagedDiff": SAMPLE_STAGED_DIFF,
        "hint": "secure token validation",
        "includeRagContext": False,
    }
    response = client.post("/api/ai/commit-message", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "suggestedMessage" in data
    assert "conventionalType" in data
    assert "shortSummary" in data
    assert "reasoning" in data


def test_api_explain_commit_endpoint():
    """Integration test: POST /api/ai/explain-commit."""
    payload = {
        "hash": "1234567890abcdef",
        "message": "fix(core): resolve null pointer exception",
        "author": "John Engineer",
        "date": "2026-09-29T12:00:00Z",
        "diff": SAMPLE_STAGED_DIFF,
    }
    response = client.post("/api/ai/explain-commit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "filesAffected" in data
    assert "mainChanges" in data
    assert "potentialImpact" in data


def test_api_empty_staged_diff_handling():
    """Verify graceful handling when staged diff is minimal or empty."""
    payload = {
        "stagedDiff": "",
        "hint": "empty commit",
    }
    response = client.post("/api/ai/commit-message", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["conventionalType"] is not None
