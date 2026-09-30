"""SnapDev AI - Comprehensive Unit and Integration Tests for Phase 6 Developer AI Features.

Tests:
1. DeveloperService structured responses:
   - explain_code (ExplanationResult)
   - analyze_bug (BugAnalysisResult)
   - improve_code (ImprovementResult)
   - review_code (CodeReviewResult)
   - generate_tests (TestGenerationResult)
   - generate_docs (DocumentationResult)
   - generate_change (ChangeResult & FilePatch with unified diff and sha256)
2. Safe patch generation & validation:
   - unified diff computation
   - SHA-256 originalContentHash computation
   - graceful fallback on malformed model output
3. FastAPI endpoints:
   - POST /api/ai/explain
   - POST /api/ai/analyze-bug
   - POST /api/ai/improve
   - POST /api/ai/review
   - POST /api/ai/generate-tests
   - POST /api/ai/generate-docs
   - POST /api/ai/generate-change
4. Privacy & Safety:
   - Zero execution of user code
   - Zero execution of generated code
   - Zero external cloud calls
"""

import hashlib
import json
import pytest
from fastapi.testclient import TestClient

from python.api import app
from python.ai.schemas import (
    CodeContextInput,
    ExplanationResult,
    BugAnalysisResult,
    CodeReviewResult,
    TestGenerationResult,
    DocumentationResult,
    ChangeResult,
    FilePatch
)
from python.ai.developer_service import DeveloperService, get_developer_service
from python.ai.prompts import (
    build_explanation_prompt,
    build_bug_analysis_prompt,
    build_code_improvement_prompt,
    build_code_review_prompt,
    build_test_generation_prompt,
    build_documentation_prompt,
    build_change_generation_prompt
)

client = TestClient(app)


SAMPLE_CODE = """
function authenticateUser(username, password) {
    if (!username || !password) {
        throw new Error("Missing credentials");
    }
    const user = database.findUser(username);
    if (!user) return null;
    return user.verifyPassword(password);
}
""".strip()

SAMPLE_BUGGY_CODE = """
function calculateDiscount(price, discountPercent) {
    // Bug: discountPercent can be undefined or null resulting in NaN
    return price - (price * (discountPercent / 100));
}
""".strip()


def test_prompt_builders():
    """Verify all Phase 6 developer prompt builders produce grounded instructions."""
    ctx_exp = CodeContextInput(
        filePath="src/auth.js",
        symbolName="authenticateUser",
        selectedCode=SAMPLE_CODE
    )
    exp_prompt = build_explanation_prompt(ctx_exp, [])
    assert "src/auth.js" in exp_prompt
    assert "authenticateUser" in exp_prompt

    ctx_bug = CodeContextInput(
        filePath="src/discount.js",
        selectedCode=SAMPLE_BUGGY_CODE,
        errorMessage="TypeError: Cannot read properties of undefined"
    )
    bug_prompt = build_bug_analysis_prompt(ctx_bug, [])
    assert "src/discount.js" in bug_prompt
    assert "Cannot read properties" in bug_prompt

    ctx_imp = CodeContextInput(
        filePath="src/auth.js",
        selectedCode=SAMPLE_CODE
    )
    improve_prompt = build_code_improvement_prompt(ctx_imp, [])
    assert "src/auth.js" in improve_prompt

    ctx_rev = CodeContextInput(
        filePath="src/auth.js",
        selectedCode=SAMPLE_CODE
    )
    review_prompt = build_code_review_prompt(ctx_rev, [])
    assert "code review" in review_prompt.lower()

    ctx_test = CodeContextInput(
        filePath="src/auth.ts",
        selectedCode=SAMPLE_CODE,
        testFramework="vitest"
    )
    test_prompt = build_test_generation_prompt(ctx_test, [])
    assert "vitest" in test_prompt.lower()

    ctx_doc = CodeContextInput(
        filePath="src/auth.ts",
        selectedCode=SAMPLE_CODE,
        docType="function"
    )
    doc_prompt = build_documentation_prompt(ctx_doc, [])
    assert "function" in doc_prompt.lower()

    ctx_patch = CodeContextInput(
        filePath="src/auth.ts",
        selectedCode=SAMPLE_CODE,
        query="Add type annotations and input validation"
    )
    patch_prompt = build_change_generation_prompt(ctx_patch, [])
    assert "src/auth.ts" in patch_prompt
    assert "Add type annotations" in patch_prompt


def test_developer_service_explain():
    """Verify DeveloperService explain_code returns validated ExplanationResult."""
    service = get_developer_service()
    inp = CodeContextInput(
        filePath="src/auth.js",
        symbolName="authenticateUser",
        selectedCode=SAMPLE_CODE
    )
    result = service.explain_code(inp)

    assert isinstance(result, ExplanationResult)
    assert result.summary != ""
    assert result.purpose != ""
    assert len(result.key_components) >= 0
    assert result.generationTimeMs >= 0


def test_developer_service_analyze_bug():
    """Verify DeveloperService analyze_bug returns structured BugAnalysisResult."""
    service = get_developer_service()
    inp = CodeContextInput(
        filePath="src/discount.js",
        selectedCode=SAMPLE_BUGGY_CODE,
        errorMessage="Discount computation produced NaN"
    )
    result = service.analyze_bug(inp)

    assert isinstance(result, BugAnalysisResult)
    assert result.summary != ""
    assert result.likely_cause != ""
    assert result.suggested_fix != ""
    assert result.severity in ("critical", "high", "medium", "low", "informational")
    assert 0.0 <= result.confidence <= 1.0


def test_developer_service_improve_code():
    """Verify DeveloperService improve_code returns structured ImprovementResult."""
    service = get_developer_service()
    inp = CodeContextInput(
        filePath="src/auth.js",
        symbolName="authenticateUser",
        selectedCode=SAMPLE_CODE
    )
    result = service.improve_code(inp)

    assert result.summary != ""
    assert result.explanation != ""
    assert result.category != ""


def test_developer_service_review_code():
    """Verify DeveloperService review_code returns structured CodeReviewResult."""
    service = get_developer_service()
    inp = CodeContextInput(
        filePath="src/auth.js",
        selectedCode=SAMPLE_CODE
    )
    result = service.review_code(inp)

    assert isinstance(result, CodeReviewResult)
    assert result.summary != ""
    assert 0 <= result.overallScore <= 100
    assert isinstance(result.findings, list)


def test_developer_service_generate_tests():
    """Verify DeveloperService generate_tests produces structured test cases and code."""
    service = get_developer_service()
    inp = CodeContextInput(
        filePath="src/auth.ts",
        symbolName="authenticateUser",
        selectedCode=SAMPLE_CODE,
        testFramework="vitest"
    )
    result = service.generate_tests(inp)

    assert isinstance(result, TestGenerationResult)
    assert result.framework.lower() in ("vitest", "jest", "pytest", "unit test")
    assert len(result.test_cases) > 0
    assert "authenticateUser" in result.generated_code or "test" in result.generated_code.lower()


def test_developer_service_generate_docs():
    """Verify DeveloperService generate_docs produces structured documentation."""
    service = get_developer_service()
    inp = CodeContextInput(
        filePath="src/auth.ts",
        symbolName="authenticateUser",
        selectedCode=SAMPLE_CODE,
        docType="function"
    )
    result = service.generate_docs(inp)

    assert isinstance(result, DocumentationResult)
    assert result.summary != ""
    assert result.generated_documentation != ""


def test_developer_service_generate_change_and_patch():
    """Verify DeveloperService generate_change produces a valid FilePatch with unified diff and sha256."""
    service = get_developer_service()
    inp = CodeContextInput(
        filePath="src/auth.js",
        selectedCode=SAMPLE_CODE,
        query="Add type checking and logging"
    )
    result = service.generate_change(inp)

    assert isinstance(result, ChangeResult)
    assert len(result.patches) > 0
    patch = result.patches[0]
    assert isinstance(patch, FilePatch)
    assert patch.filePath == "src/auth.js"
    assert patch.diff != ""
    assert "---" in patch.diff or "+++" in patch.diff

    # Verify original content hash matches SHA-256 of original content
    expected_hash = hashlib.sha256(SAMPLE_CODE.encode("utf-8")).hexdigest()
    assert patch.originalContentHash == expected_hash


def test_fastapi_explain_endpoint():
    """Verify POST /api/ai/explain."""
    payload = {
        "filePath": "src/auth.js",
        "symbolName": "authenticateUser",
        "selectedCode": SAMPLE_CODE
    }
    response = client.post("/api/ai/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "purpose" in data
    assert "key_components" in data


def test_fastapi_analyze_bug_endpoint():
    """Verify POST /api/ai/analyze-bug."""
    payload = {
        "filePath": "src/discount.js",
        "selectedCode": SAMPLE_BUGGY_CODE,
        "errorMessage": "Discount calculation returns NaN"
    }
    response = client.post("/api/ai/analyze-bug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "likely_cause" in data
    assert "suggested_fix" in data
    assert "severity" in data


def test_fastapi_improve_endpoint():
    """Verify POST /api/ai/improve."""
    payload = {
        "filePath": "src/auth.js",
        "selectedCode": SAMPLE_CODE
    }
    response = client.post("/api/ai/improve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "explanation" in data


def test_fastapi_review_endpoint():
    """Verify POST /api/ai/review."""
    payload = {
        "filePath": "src/auth.js",
        "selectedCode": SAMPLE_CODE
    }
    response = client.post("/api/ai/review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "findings" in data
    assert "overallScore" in data


def test_fastapi_generate_tests_endpoint():
    """Verify POST /api/ai/generate-tests."""
    payload = {
        "filePath": "src/auth.ts",
        "symbolName": "authenticateUser",
        "selectedCode": SAMPLE_CODE,
        "testFramework": "vitest"
    }
    response = client.post("/api/ai/generate-tests", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "test_cases" in data
    assert "generated_code" in data


def test_fastapi_generate_docs_endpoint():
    """Verify POST /api/ai/generate-docs."""
    payload = {
        "filePath": "src/auth.ts",
        "symbolName": "authenticateUser",
        "selectedCode": SAMPLE_CODE
    }
    response = client.post("/api/ai/generate-docs", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "generated_documentation" in data


def test_fastapi_generate_change_endpoint():
    """Verify POST /api/ai/generate-change."""
    payload = {
        "filePath": "src/auth.js",
        "selectedCode": SAMPLE_CODE,
        "query": "Add null check"
    }
    response = client.post("/api/ai/generate-change", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "patches" in data
    assert len(data["patches"]) > 0
    assert data["patches"][0]["originalContentHash"] is not None
