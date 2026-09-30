"""SnapDev AI - Comprehensive Phase 4 RAG Test Suite.

Tests:
1. EmbeddingProvider & LocalEmbeddingProvider (deterministic, dimensions, cosine similarity)
2. VectorStore & FAISSVectorStore (add, update, delete, search, clear, save/load)
3. MetadataStore (allocation, mappings, search_symbols, search_files, delete_by_file_path)
4. ResultRanker (deterministic scoring formula, weighting, deduplication)
5. ContextBuilder (chunk limits, character limits, token estimation, subsumed chunk removal)
6. RAGService & HybridRetriever (index project, search hybrid/semantic/symbol/file)
7. Incremental vector indexing (file updates, vector additions, file deletion)
8. Edge cases (empty query, no-result query, empty project, corrupted index handling)
9. FastAPI RAG endpoints (/api/rag/index, /api/rag/search, /api/rag/context, /api/rag/status, /api/rag/file)
"""

import os
import shutil
import tempfile
import numpy as np
import pytest
from fastapi.testclient import TestClient

from python.api import app
from python.rag.context_builder import ContextBuilder
from python.rag.embedding import (
    DeterministicTestEmbeddingProvider,
    LocalEmbeddingProvider,
)
from python.rag.metadata_store import MetadataStore
from python.rag.models import (
    CodeChunk,
    ContextRequest,
    IndexProjectRequest,
    RetrievalResult,
    SearchRequest,
    SingleFileIndexRequest,
    VectorMetadata,
)
from python.rag.ranker import ResultRanker
from python.rag.retriever import HybridRetriever
from python.rag.service import RAGService
from python.rag.vector_store import FAISSVectorStore

client = TestClient(app)


# --------------------------------------------------
# 1. Embedding Provider Tests
# --------------------------------------------------

def test_local_embedding_provider_shape_and_norm():
    """Verify local embedding provider produces normalized unit vectors with configured dimension."""
    provider = LocalEmbeddingProvider(dimension=256)
    vec = provider.embed_text("function authenticate(user, token) { return true; }")
    assert vec.shape == (256,)
    norm = float(np.linalg.norm(vec))
    assert abs(norm - 1.0) < 1e-4


def test_local_embedding_provider_batch():
    """Verify batch embedding generation matches individual embedding."""
    provider = LocalEmbeddingProvider(dimension=128)
    texts = ["class AuthService", "function getUser()", "interface UserProfile"]
    matrix = provider.embed_batch(texts)
    assert matrix.shape == (3, 128)
    for i in range(3):
        single = provider.embed_text(texts[i])
        np.testing.assert_allclose(matrix[i], single, atol=1e-5)


def test_local_embedding_provider_semantic_similarity():
    """Verify related code terms yield higher dot product than unrelated terms."""
    provider = LocalEmbeddingProvider(dimension=384)
    v_auth = provider.embed_text("AuthService login authenticate token verify password")
    v_query = provider.embed_query("Where is user login authentication handled?")
    v_unrelated = provider.embed_query("Perform matrix fast Fourier transform on audio buffer")

    sim_related = float(np.dot(v_auth, v_query))
    sim_unrelated = float(np.dot(v_auth, v_unrelated))
    assert sim_related > sim_unrelated


def test_deterministic_test_embedding_provider():
    """Verify DeterministicTestEmbeddingProvider produces deterministic outputs."""
    p1 = DeterministicTestEmbeddingProvider(dimension=64)
    p2 = DeterministicTestEmbeddingProvider(dimension=64)
    t = "test code chunk"
    np.testing.assert_array_equal(p1.embed_text(t), p2.embed_text(t))


# --------------------------------------------------
# 2. Vector Store Tests
# --------------------------------------------------

def test_faiss_vector_store_operations():
    """Verify add, search, update, delete, clear in FAISSVectorStore."""
    store = FAISSVectorStore(dimension=64)
    assert store.size() == 0

    v1 = np.ones((1, 64), dtype=np.float32)
    v2 = np.ones((1, 64), dtype=np.float32) * -1.0
    store.add(np.vstack([v1, v2]), [10, 20])
    assert store.size() == 2

    ids, scores = store.search(v1, top_k=2)
    assert ids[0] == 10
    assert abs(scores[0] - 1.0) < 1e-3

    # Update
    v3 = np.zeros((1, 64), dtype=np.float32)
    v3[0, 0] = 1.0
    store.update(v3[0], 10)
    assert store.size() == 2

    # Delete
    deleted = store.delete([10])
    assert deleted >= 1
    assert store.size() == 1
    remaining_ids, _ = store.search(v1, top_k=5)
    assert 10 not in remaining_ids

    # Clear
    store.clear()
    assert store.size() == 0


def test_faiss_vector_store_save_and_load(tmp_path):
    """Verify FAISS vector index persists and reloads accurately."""
    store = FAISSVectorStore(dimension=32)
    v = np.random.randn(3, 32).astype(np.float32)
    store.add(v, [1, 2, 3])

    index_path = str(tmp_path / "test.index")
    store.save(index_path)
    assert os.path.exists(index_path)

    loaded_store = FAISSVectorStore(dimension=32)
    loaded_store.load(index_path)
    assert loaded_store.size() == 3

    # Corrupted load handling
    bad_path = str(tmp_path / "bad.index")
    with open(bad_path, "w") as f:
        f.write("corrupt index data")
    with pytest.raises(RuntimeError):
        loaded_store.load(bad_path)


# --------------------------------------------------
# 3. Metadata Store Tests
# --------------------------------------------------

def test_metadata_store_allocation_and_search():
    """Verify allocation, symbol search, file search, and file deletion."""
    mstore = MetadataStore(project_id="test_proj")
    chunks = [
        CodeChunk(
            id="c_login",
            projectId="test_proj",
            fileId="f1",
            filePath="src/services/auth-service.ts",
            relativePath="src/services/auth-service.ts",
            language="typescript",
            symbolName="AuthService.login",
            symbolKind="method",
            startLine=10,
            endLine=25,
            content="async login() {}",
            fileHash="hash123",
        ),
        CodeChunk(
            id="c_user",
            projectId="test_proj",
            fileId="f2",
            filePath="src/models/user.ts",
            relativePath="src/models/user.ts",
            language="typescript",
            symbolName="User",
            symbolKind="interface",
            startLine=1,
            endLine=15,
            content="export interface User {}",
            fileHash="hash456",
        ),
    ]

    vids, to_embed, metas = mstore.allocate_metadata(chunks)
    assert len(vids) == 2
    assert mstore.total_vectors == 2
    assert mstore.is_file_unchanged("src/services/auth-service.ts", "hash123")
    assert not mstore.is_file_unchanged("src/services/auth-service.ts", "differentHash")

    # Symbol search
    sym_matches = mstore.search_symbols("login")
    assert len(sym_matches) > 0
    assert sym_matches[0][0].symbolName == "AuthService.login"

    # File search
    file_matches = mstore.search_files("auth-service")
    assert len(file_matches) > 0
    assert "auth-service" in file_matches[0][0].filePath

    # Delete by file path
    deleted_ids = mstore.delete_by_file_path("src/services/auth-service.ts")
    assert len(deleted_ids) == 1
    assert mstore.total_vectors == 1


# --------------------------------------------------
# 4. Result Ranker & Deterministic Scoring Tests
# --------------------------------------------------

def test_result_ranker_composite_score():
    """Verify deterministic scoring formula combines signals predictably."""
    meta1 = VectorMetadata(
        vectorId=1,
        chunkId="c1",
        projectId="p1",
        fileId="f1",
        filePath="src/auth.ts",
        relativePath="src/auth.ts",
        symbolName="login",
        symbolKind="function",
        language="typescript",
        startLine=1,
        endLine=20,
        content="function login() {}",
    )
    meta2 = VectorMetadata(
        vectorId=2,
        chunkId="c2",
        projectId="p1",
        fileId="f2",
        filePath="src/math.ts",
        relativePath="src/math.ts",
        symbolName="add",
        symbolKind="function",
        language="typescript",
        startLine=1,
        endLine=10,
        content="function add() {}",
    )

    sem_candidates = [(meta1, 0.8), (meta2, 0.2)]
    sym_candidates = [(meta1, 1.0, "Exact symbol match")]
    file_candidates = [(meta1, 0.75, "Filename match")]

    results = ResultRanker.rank_hybrid(
        semantic_candidates=sem_candidates,
        symbol_candidates=sym_candidates,
        file_candidates=file_candidates,
        limit=5,
    )

    assert len(results) == 2
    # Result 1 has semantic + symbol + file signals -> should score significantly higher than Result 2
    assert results[0].chunkId == "c1"
    assert results[0].similarityScore > results[1].similarityScore
    assert "Exact symbol match" in results[0].retrievalSources


# --------------------------------------------------
# 5. Context Builder & Boundaries Tests
# --------------------------------------------------

def test_context_builder_limits_and_deduplication():
    """Verify ContextBuilder respects max chunks, characters, and deduplicates subsumed lines."""
    builder = ContextBuilder(max_chunks=2, max_characters=1000)

    res1 = RetrievalResult(
        resultId="r1",
        chunkId="c1",
        filePath="src/auth.ts",
        relativePath="src/auth.ts",
        symbolName="login",
        symbolKind="function",
        language="typescript",
        startLine=10,
        endLine=30,
        content="function login() { return true; }",
        similarityScore=0.9,
    )
    # Overlapping duplicate
    res1_dup = RetrievalResult(
        resultId="r1_dup",
        chunkId="c1_dup",
        filePath="src/auth.ts",
        relativePath="src/auth.ts",
        symbolName="login_inner",
        symbolKind="function",
        language="typescript",
        startLine=12,
        endLine=28,
        content="return true;",
        similarityScore=0.7,
    )
    res2 = RetrievalResult(
        resultId="r2",
        chunkId="c2",
        filePath="src/user.ts",
        relativePath="src/user.ts",
        symbolName="getUser",
        symbolKind="function",
        language="typescript",
        startLine=1,
        endLine=15,
        content="function getUser() { return null; }",
        similarityScore=0.8,
    )
    res3 = RetrievalResult(
        resultId="r3",
        chunkId="c3",
        filePath="src/extra.ts",
        relativePath="src/extra.ts",
        symbolName="extra",
        symbolKind="function",
        language="typescript",
        startLine=1,
        endLine=15,
        content="function extra() {}",
        similarityScore=0.5,
    )

    pkg = builder.build_context(
        project_id="test_proj",
        query="login authentication",
        retrieved_results=[res1, res1_dup, res2, res3],
        mode="hybrid",
    )

    # Max chunks was 2; res1_dup was skipped due to subsumption; res1 and res2 chosen; res3 excluded by limit
    assert pkg.totalChunks == 2
    assert pkg.chunks[0].chunkId == "c1"
    assert pkg.chunks[1].chunkId == "c2"
    assert "RAIN CODE STUDIO - LOCAL CODE INTELLIGENCE CONTEXT" in pkg.formattedPromptContext
    assert pkg.estimatedTokens > 0


# --------------------------------------------------
# 6. RAG Service End-to-End & Incremental Update Tests
# --------------------------------------------------

def test_rag_service_full_workflow(tmp_path):
    """Verify full project indexing, searching, incremental file updates, and deletion."""
    test_dir = str(tmp_path / "rag_indexes")
    provider = LocalEmbeddingProvider(dimension=128)
    service = RAGService(embedding_provider=provider, indexes_base_dir=test_dir)

    chunks = [
        CodeChunk(
            id="c_auth",
            projectId="p_full",
            fileId="f_auth",
            filePath="src/services/auth-service.ts",
            relativePath="src/services/auth-service.ts",
            language="typescript",
            symbolName="AuthService.login",
            symbolKind="method",
            startLine=10,
            endLine=35,
            content="async login(email: string, passwordHash: string): Promise<Session> { return createSession(email); }",
            imports=["import { Session } from '../models/user'"],
        ),
        CodeChunk(
            id="c_db",
            projectId="p_full",
            fileId="f_db",
            filePath="src/database/user-repository.ts",
            relativePath="src/database/user-repository.ts",
            language="typescript",
            symbolName="UserRepository.getUserById",
            symbolKind="method",
            startLine=15,
            endLine=30,
            content="async getUserById(id: string): Promise<User | null> { return this.db.find(id); }",
        ),
    ]

    # 1. Index project
    res = service.index_project("p_full", str(tmp_path), chunks)
    assert res["success"] is True
    assert res["vectors_count"] == 2

    # 2. Search
    results, latency = service.search("p_full", "Where is authentication handled?", mode="hybrid")
    assert len(results) > 0
    assert results[0].symbolName == "AuthService.login"
    assert latency >= 0

    # 3. Build Context
    ctx = service.build_context("p_full", "Where is authentication handled?")
    assert ctx.totalChunks >= 1
    assert "AuthService.login" in ctx.formattedPromptContext

    # 4. Status
    status = service.get_status("p_full")
    assert status.status == "indexed"
    assert status.totalVectors == 2

    # 5. Incremental single-file update
    new_chunk = CodeChunk(
        id="c_auth_updated",
        projectId="p_full",
        fileId="f_auth",
        filePath="src/services/auth-service.ts",
        relativePath="src/services/auth-service.ts",
        language="typescript",
        symbolName="AuthService.loginWithToken",
        symbolKind="method",
        startLine=10,
        endLine=40,
        content="async loginWithToken(token: string): Promise<Session> { return verifyToken(token); }",
    )
    upd_res = service.update_file_chunks(
        "p_full", "src/services/auth-service.ts", "f_auth", [new_chunk]
    )
    assert upd_res["success"] is True
    assert upd_res["total_vectors"] == 2

    # 6. Delete file vectors
    del_res = service.delete_file("p_full", "src/database/user-repository.ts")
    assert del_res["success"] is True
    assert del_res["total_vectors"] == 1

    # 7. Clear project
    assert service.clear_project_index("p_full") is True
    assert service.get_status("p_full").totalVectors == 0


# --------------------------------------------------
# 7. Edge Cases Tests
# --------------------------------------------------

def test_rag_edge_cases(tmp_path):
    """Verify empty queries, empty projects, and no-result searches handled gracefully."""
    service = RAGService(indexes_base_dir=str(tmp_path))

    # Empty query
    results, _ = service.search("empty_proj", "   ")
    assert results == []

    # Empty project
    service.index_project("empty_proj", str(tmp_path), [])
    results, _ = service.search("empty_proj", "anything")
    assert results == []

    ctx = service.build_context("empty_proj", "anything")
    assert ctx.totalChunks == 0
    assert ctx.chunks == []


# --------------------------------------------------
# 8. FastAPI Endpoints Tests
# --------------------------------------------------

def test_fastapi_rag_endpoints():
    """Verify all FastAPI RAG endpoints work with proper Pydantic schemas."""
    proj_id = "test_api_proj"

    chunks = [
        {
            "id": "c_api_1",
            "projectId": proj_id,
            "fileId": "f1",
            "filePath": "src/api/auth.ts",
            "relativePath": "src/api/auth.ts",
            "language": "typescript",
            "symbolName": "loginRoute",
            "symbolKind": "function",
            "startLine": 1,
            "endLine": 20,
            "content": "export function loginRoute() { return { status: 200 }; }",
            "imports": [],
        }
    ]

    # Index
    r_index = client.post(
        "/api/rag/index",
        json={"projectId": proj_id, "projectPath": "D:/demo", "chunks": chunks},
    )
    assert r_index.status_code == 200
    assert r_index.json()["success"] is True

    # Search
    r_search = client.post(
        "/api/rag/search",
        json={"projectId": proj_id, "query": "login route", "mode": "hybrid", "limit": 5},
    )
    assert r_search.status_code == 200
    s_data = r_search.json()
    assert s_data["total_results"] > 0
    assert s_data["results"][0]["symbolName"] == "loginRoute"

    # Context
    r_ctx = client.post(
        "/api/rag/context",
        json={"projectId": proj_id, "query": "login route", "mode": "hybrid"},
    )
    assert r_ctx.status_code == 200
    c_data = r_ctx.json()
    assert c_data["totalChunks"] == 1
    assert "loginRoute" in c_data["formattedPromptContext"]

    # Status
    r_status = client.get(f"/api/rag/status?project_id={proj_id}")
    assert r_status.status_code == 200
    st_data = r_status.json()
    assert st_data["status"] == "indexed"
    assert st_data["totalVectors"] == 1

    # Cleanup
    r_del = client.delete(f"/api/rag/index?project_id={proj_id}")
    assert r_del.status_code == 200
