"""SnapDev AI - Phase 6 Developer AI Data Schemas.

Defines Pydantic models for structured developer outputs:
- Code explanation
- Bug / error analysis
- Code improvement suggestions
- Code review findings
- Test generation
- Documentation generation
- Safe patch changes
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
try:
    from .models import SourceReference
except ImportError:
    from python.ai.models import SourceReference


class CodeContextInput(BaseModel):
    """Input payload for developer AI tasks."""
    projectId: Optional[str] = Field(default=None, description="Active project ID")
    filePath: Optional[str] = Field(default=None, description="Current or selected file path")
    relativePath: Optional[str] = Field(default=None, description="Project-relative file path")
    symbolName: Optional[str] = Field(default=None, description="Selected symbol (function, class, method)")
    selectedCode: Optional[str] = Field(default=None, description="Highlighted code snippet")
    startLine: Optional[int] = Field(default=None, description="Start line of selection")
    endLine: Optional[int] = Field(default=None, description="End line of selection")
    language: Optional[str] = Field(default=None, description="Source code language")
    query: Optional[str] = Field(default=None, description="User prompt or instruction")
    errorMessage: Optional[str] = Field(default=None, description="Error message or exception text")
    stackTrace: Optional[str] = Field(default=None, description="Stack trace for bug analysis")
    testFramework: Optional[str] = Field(default=None, description="Testing framework (vitest, jest, pytest)")
    docType: Optional[str] = Field(default="function", description="function | class | module | readme | api")
    category: Optional[str] = Field(default=None, description="Improvement category")
    includeRagContext: bool = Field(default=True, description="Whether to query RAG for surrounding context")
    maxRagChunks: int = Field(default=5, description="Maximum RAG context chunks")


class ExplanationResult(BaseModel):
    """Structured code explanation."""
    summary: str = Field(description="High-level overview of the code")
    purpose: str = Field(description="Core purpose and problem solved")
    key_components: List[str] = Field(default_factory=list, description="Primary functions, classes, and logic blocks")
    flow: List[str] = Field(default_factory=list, description="Step-by-step execution flow")
    dependencies: List[str] = Field(default_factory=list, description="Imported dependencies and external services")
    important_symbols: List[str] = Field(default_factory=list, description="Key symbols identified")
    assumptions: List[str] = Field(default_factory=list, description="Inferred assumptions or constraints")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved code sources")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")


class BugAnalysisResult(BaseModel):
    """Structured bug and error analysis."""
    summary: str = Field(description="Concise description of the identified issue")
    severity: str = Field(default="medium", description="critical | high | medium | low | informational")
    confidence: float = Field(default=0.85, description="Confidence score (0.0 to 1.0)")
    likely_cause: str = Field(description="Root cause hypothesis grounded in source code")
    affected_files: List[str] = Field(default_factory=list, description="Files involved in the bug")
    affected_symbols: List[str] = Field(default_factory=list, description="Symbols involved in the bug")
    evidence: List[str] = Field(default_factory=list, description="Specific lines or logic that substantiate the bug")
    suggested_fix: str = Field(description="Detailed explanation of how to fix the issue")
    suggested_code: Optional[str] = Field(default=None, description="Proposed replacement code snippet")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved code sources")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")


class CodeReviewFinding(BaseModel):
    """Single finding from an AI code review."""
    severity: str = Field(default="suggestion", description="critical | warning | suggestion | info")
    category: str = Field(default="maintainability", description="correctness | maintainability | security | performance | error_handling | type_safety | test_gap")
    file: str = Field(description="File containing the finding")
    line: Optional[int] = Field(default=None, description="Approximate line number")
    explanation: str = Field(description="Detailed explanation of the issue")
    suggestion: str = Field(description="Specific actionable suggestion for improvement")


class CodeReviewResult(BaseModel):
    """Structured code review result."""
    summary: str = Field(description="Overall review summary")
    overallScore: int = Field(default=85, description="Code quality rating (1-100)")
    findings: List[CodeReviewFinding] = Field(default_factory=list, description="List of identified issues and suggestions")
    strengths: List[str] = Field(default_factory=list, description="Positive aspects of the implementation")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved code sources")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")


class TestCaseItem(BaseModel):
    """Single generated test case."""
    name: str = Field(description="Test case function name")
    description: str = Field(description="What this test asserts")
    type: str = Field(default="unit", description="unit | edge_case | error_case | integration")
    code: str = Field(description="Test implementation code")


class TestGenerationResult(BaseModel):
    """Structured test generation result."""
    __test__ = False
    summary: str = Field(description="Summary of generated test coverage")
    framework: str = Field(default="vitest", description="Detected or targeted testing framework")
    test_cases: List[TestCaseItem] = Field(default_factory=list, description="Individual test cases")
    generated_code: str = Field(description="Complete test file implementation ready for review")
    assumptions: List[str] = Field(default_factory=list, description="Mocks or fixtures assumed")
    target_file: Optional[str] = Field(default=None, description="Suggested target test file path")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved code sources")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")


class DocumentationResult(BaseModel):
    """Structured documentation generation result."""
    summary: str = Field(description="Overview of documentation created")
    docType: str = Field(default="function", description="function | class | module | readme | api")
    generated_documentation: str = Field(description="Formatted markdown or docstring documentation")
    documented_symbols: List[str] = Field(default_factory=list, description="Symbols documented")
    assumptions: List[str] = Field(default_factory=list, description="Assumptions made")
    target_file: Optional[str] = Field(default=None, description="Associated source file")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved code sources")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")


class FilePatch(BaseModel):
    """Safe patch representation for reviewing and applying code modifications."""
    filePath: str = Field(description="Absolute path to file on disk")
    relativePath: str = Field(description="Project-relative path")
    originalContent: str = Field(description="Exact file content prior to change")
    originalContentHash: str = Field(description="SHA-256 hash of original file content for stale check")
    modifiedContent: str = Field(description="Complete updated file content after applying change")
    diff: str = Field(description="Unified diff format (+ / -)")
    explanation: str = Field(description="Reasoning behind this change")


class ChangeResult(BaseModel):
    """Structured code change result with safe diff preview."""
    summary: str = Field(description="Overview of proposed modifications")
    files_changed: List[str] = Field(default_factory=list, description="List of files with proposed modifications")
    patches: List[FilePatch] = Field(default_factory=list, description="List of validated file patches")
    warnings: List[str] = Field(default_factory=list, description="Safety or compatibility warnings")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved code sources")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")


class ImprovementResult(BaseModel):
    """Structured code improvement suggestions."""
    summary: str = Field(description="Overview of proposed improvements")
    category: str = Field(default="maintainability", description="readability | maintainability | performance | type_safety | error_handling | architecture")
    explanation: str = Field(description="Technical rationale for the improvement")
    suggested_code: str = Field(description="Improved code snippet")
    diff: Optional[str] = Field(default=None, description="Unified diff against original selection if available")
    patch: Optional[FilePatch] = Field(default=None, description="Full file patch ready for safe diff preview")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved code sources")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")


# ==================================================
# PHASE 7: GIT & DEVELOPER AI SCHEMAS
# ==================================================


class CommitMessageRequest(BaseModel):
    """Input payload for AI conventional commit message generation."""
    stagedDiff: str = Field(description="Unified git staged diff (+ / -)")
    hint: Optional[str] = Field(default=None, description="Optional developer intent or summary hint")
    projectId: Optional[str] = Field(default=None, description="Optional active project id for RAG")
    includeRagContext: bool = Field(default=False, description="Whether to ground in surrounding symbols")


class CommitMessageSuggestion(BaseModel):
    """Structured conventional commit message suggestion."""
    suggestedMessage: str = Field(description="Formatted conventional commit message ready for review")
    shortSummary: str = Field(description="One-line subject line (e.g. feat(auth): validate session token)")
    conventionalType: str = Field(default="feat", description="feat | fix | refactor | docs | test | chore | perf | style")
    scope: Optional[str] = Field(default=None, description="Module or component scope")
    reasoning: str = Field(description="Explanation of why this commit message matches the diff")
    warnings: List[str] = Field(default_factory=list, description="Warnings if changes span multiple disparate domains")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")


class ExplainCommitRequest(BaseModel):
    """Input payload for AI commit explanation."""
    hash: str = Field(description="Git commit hash")
    message: str = Field(description="Commit message")
    author: str = Field(default="Unknown", description="Commit author")
    date: str = Field(default="", description="Commit date")
    diff: str = Field(description="Commit diff from git show")
    projectId: Optional[str] = Field(default=None, description="Active project ID")
    includeRagContext: bool = Field(default=False, description="Whether to include project symbol context")


class CommitAnalysis(BaseModel):
    """Comprehensive structured analysis of a Git commit."""
    summary: str = Field(description="Executive summary of the commit changes")
    filesAffected: List[str] = Field(default_factory=list, description="List of modified file paths")
    mainChanges: List[str] = Field(default_factory=list, description="Key bullet points describing concrete changes")
    potentialImpact: str = Field(description="Potential impact on downstream modules, performance, or behavior")
    relatedSymbols: List[str] = Field(default_factory=list, description="Key functions, classes, or symbols affected")
    confidence: float = Field(default=0.9, description="Confidence score 0.0-1.0")
    generationTimeMs: float = Field(default=0.0, description="Generation latency in milliseconds")

