"""Tests for Phase 12.1 Project Intelligence Endpoints.

Validates that all metrics come from actual project state,
unmeasured dynamic coverage is explicitly reported as 'Not measured',
and knowledge notes persist locally in SQLite.
"""

import pytest
from fastapi.testclient import TestClient

from python.api import app


@pytest.fixture
def client():
    return TestClient(app)


def test_intelligence_health_endpoint(client):
    """Verify Project Health indicators are truthful and test coverage is Not measured."""
    response = client.get("/api/intelligence/health?project_id=test-project")
    assert response.status_code == 200
    data = response.json()

    assert data["projectId"] == "test-project"
    assert "timestamp" in data
    assert "codeQuality" in data
    assert "totalFiles" in data["codeQuality"]
    assert "parseStatus" in data["codeQuality"]

    # Strict requirement: dynamic coverage must be 'Not measured'
    assert data["testCoverage"]["status"] == "Not measured"
    assert "Not measured" in data["testCoverage"]["explanation"]
    assert "detectedTestSourceFiles" in data["testCoverage"]

    # RAG & AI readiness indicators
    assert "ragHealth" in data
    assert "aiReadiness" in data


def test_intelligence_smart_search_endpoint(client):
    """Verify smart project search returns structured results with reasoning."""
    payload = {
        "query": "Where is the database connection created?",
        "projectId": "test-project",
        "limit": 5
    }
    response = client.post("/api/intelligence/smart-search", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["query"] == payload["query"]
    assert "timestamp" in data
    assert "totalMatches" in data
    assert isinstance(data["items"], list)


def test_intelligence_refactor_plan_endpoint(client):
    """Verify refactoring planner produces planning-only steps without executing."""
    payload = {
        "targetFile": "src/main/database/sqlite-manager.ts",
        "goal": "Decompose connection pooling and schema migrations",
        "projectId": "test-project"
    }
    response = client.post("/api/intelligence/refactor-plan", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["target"] == payload["targetFile"]
    assert data["goal"] == payload["goal"]
    assert len(data["proposedSteps"]) > 0
    assert "planningOnlyNotice" in data
    assert "guidance only" in data["planningOnlyNotice"].lower()


def test_intelligence_knowledge_crud(client):
    """Verify local project knowledge notes support create, query, and delete in SQLite."""
    # 1. Create Note
    note_payload = {
        "projectId": "test-project-intelligence",
        "title": "Architecture Decision Record: Local SQLite Persistence",
        "category": "architecture",
        "content": "All symbol indexing and project intelligence stores data locally in SQLite.",
        "tags": ["sqlite", "architecture", "local"],
        "includeInRag": True
    }
    create_resp = client.post("/api/intelligence/knowledge", json=note_payload)
    assert create_resp.status_code == 200
    note = create_resp.json()
    assert note["id"].startswith("pk_")
    assert note["title"] == note_payload["title"]
    assert note["category"] == "architecture"

    # 2. Get Notes
    get_resp = client.get(f"/api/intelligence/knowledge?project_id=test-project-intelligence")
    assert get_resp.status_code == 200
    notes = get_resp.json()
    assert any(n["id"] == note["id"] for n in notes)

    # 3. Delete Note
    del_resp = client.delete(f"/api/intelligence/knowledge/{note['id']}")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # 4. Confirm Deletion
    get_again = client.get(f"/api/intelligence/knowledge?project_id=test-project-intelligence")
    assert not any(n["id"] == note["id"] for n in get_again.json())
