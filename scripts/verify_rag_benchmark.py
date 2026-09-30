"""SnapDev AI - Actual Local RAG Performance Benchmark.

Indexes actual demo-project source code, runs realistic queries, and prints exact measurements.
"""

import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from python.rag.service import RAGService
from python.rag.models import CodeChunk
from python.rag.embedding import LocalEmbeddingProvider

def run_benchmark():
    provider = LocalEmbeddingProvider(dimension=384)
    service = RAGService(embedding_provider=provider, indexes_base_dir="indexes")

    demo_dir = os.path.abspath("demo-project/src")
    chunks = []
    for root, dirs, files in os.walk(demo_dir):
        for f in files:
            if f.endswith(".ts") or f.endswith(".py"):
                fpath = os.path.join(root, f)
                relpath = os.path.relpath(fpath, demo_dir).replace("\\", "/")
                with open(fpath, "r", encoding="utf-8") as src:
                    content = src.read()
                lines = content.split("\n")
                chunks.append(CodeChunk(
                    id=f"demo_{relpath}",
                    projectId="demo-snapdev",
                    fileId=f"f_{relpath}",
                    filePath=fpath,
                    relativePath=f"src/{relpath}",
                    language="typescript" if f.endswith(".ts") else "python",
                    symbolName=f.replace(".ts", "").replace(".py", ""),
                    symbolKind="module",
                    startLine=1,
                    endLine=len(lines),
                    content=content
                ))

    print(f"Loaded {len(chunks)} real source files from demo-project/src")
    
    t0 = time.time()
    res = service.index_project("demo-snapdev", demo_dir, chunks)
    index_time = round((time.time() - t0) * 1000, 2)
    print(f"Indexing completed: {res['vectors_count']} vectors in {res['indexing_time_ms']}ms (embedding: {res['embedding_time_ms']}ms)")

    queries = [
        "Where is authentication handled?",
        "Where is the user database accessed?",
        "Which function validates the token?",
        "Show the API route responsible for login."
    ]

    print("\n" + "=" * 60)
    print("REAL RETRIEVAL BENCHMARKS ON DEMO PROJECT")
    print("=" * 60)
    
    for q in queries:
        t_start = time.time()
        results, search_lat = service.search("demo-snapdev", q, mode="hybrid", limit=3)
        pkg = service.build_context("demo-snapdev", q, mode="hybrid")
        total_lat = round((time.time() - t_start) * 1000, 2)

        print(f"\nQuery: '{q}'")
        print(f"  Search Latency: {search_lat}ms | Context Building Latency: {pkg.generationTimeMs}ms | Total: {total_lat}ms")
        print("  Top Retrieved Chunks:")
        for r in results:
            print(f"    - {r.relativePath} | Score: {r.similarityScore} | Sources: {', '.join(r.retrievalSources)}")
        print(f"  AI-Ready Context: {pkg.totalChunks} chunks | {pkg.totalCharacters} chars | ~{pkg.estimatedTokens} tokens")

    st = service.get_status("demo-snapdev")
    print("\n" + "=" * 60)
    print("LOCAL RAG INDEX STATUS & STORAGE METRICS")
    print("=" * 60)
    print(f"Status: {st.status}")
    print(f"Total Vectors: {st.totalVectors}")
    print(f"Total Files: {st.totalFiles}")
    print(f"Embedding Model: {st.embeddingModel}")
    print(f"Embedding Dimension: {st.embeddingDimension}")
    print(f"Embedding Device: {st.embeddingDevice}")
    print(f"Index Size on Disk: {st.indexSizeBytes} bytes")

if __name__ == "__main__":
    run_benchmark()
