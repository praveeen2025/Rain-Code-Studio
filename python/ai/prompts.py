"""SnapDev AI - Phase 6 Developer Prompt Builders.

Generates focused, context-bounded prompts for developer assistance:
- Code Explanation
- Bug & Error Analysis
- Code Improvement Suggestions
- Code Review
- Unit Test Generation
- Documentation Generation
- Code Change & Patch Generation
"""

from typing import List, Optional
try:
    from rag.models import RetrievalResult
    from .schemas import CodeContextInput
except ImportError:
    from python.rag.models import RetrievalResult
    from python.ai.schemas import CodeContextInput


def format_context_blocks(chunks: List[RetrievalResult], max_chars: int = 3500) -> str:
    """Format retrieved RAG chunks into concise markdown blocks."""
    if not chunks:
        return "*No relevant surrounding code chunks retrieved.*"

    blocks = []
    current_len = 0
    for i, c in enumerate(chunks):
        header = f"[FILE: {c.relativePath} | LINES: {c.startLine}-{c.endLine}{' | SYMBOL: ' + c.symbolName if c.symbolName else ''}]"
        snippet = f"{header}\n```{c.language}\n{c.content.strip()}\n```"
        if current_len + len(snippet) > max_chars and blocks:
            break
        blocks.append(snippet)
        current_len += len(snippet)

    return "\n\n".join(blocks)


def build_explanation_prompt(ctx: CodeContextInput, chunks: List[RetrievalResult]) -> str:
    """Prompt for explaining code structure, flow, and dependencies."""
    context_str = format_context_blocks(chunks)
    target_info = f"File: {ctx.relativePath or ctx.filePath or 'Unknown'}"
    if ctx.symbolName:
        target_info += f"\nSymbol: {ctx.symbolName}"
    if ctx.startLine and ctx.endLine:
        target_info += f"\nLines: {ctx.startLine}-{ctx.endLine}"

    selected_code_block = f"```\n{ctx.selectedCode.strip()}\n```" if ctx.selectedCode else "*(Full file context)*"

    return f"""You are Rain Code Studio, an expert on-device developer copilot running locally on a Snapdragon PC.
Your task is to explain the selected code clearly and accurately.

CRITICAL INSTRUCTIONS:
1. Base your explanation strictly on the provided code and retrieved project context.
2. Do NOT invent functions, behaviors, or dependencies not evidenced in the code.
3. Structure your response with:
   - Summary: What this code does in 1-2 clear sentences.
   - Purpose: Why it exists and the technical problem it solves.
   - Key Components: Main functions, classes, and logic blocks.
   - Flow: Step-by-step lifecycle / execution path.
   - Dependencies: Internal project imports and external packages used.
   - Important Symbols: Key functions, interfaces, or classes.
   - Assumptions: Constraints, preconditions, or invariants.

TARGET CODE:
{target_info}
{selected_code_block}

USER QUESTION / FOCUS:
{ctx.query or 'Explain the purpose, architecture, and behavior of this code.'}

RETRIEVED PROJECT CONTEXT:
{context_str}

Please generate the structured explanation now:"""


def build_bug_analysis_prompt(ctx: CodeContextInput, chunks: List[RetrievalResult]) -> str:
    """Prompt for identifying, analyzing, and explaining bugs or error traces."""
    context_str = format_context_blocks(chunks)
    target_info = f"File: {ctx.relativePath or ctx.filePath or 'Unknown'}"
    if ctx.symbolName:
        target_info += f" | Symbol: {ctx.symbolName}"

    error_section = ""
    if ctx.errorMessage:
        error_section += f"\nERROR MESSAGE:\n{ctx.errorMessage}"
    if ctx.stackTrace:
        error_section += f"\nSTACK TRACE:\n{ctx.stackTrace}"

    selected_code_block = f"```\n{ctx.selectedCode.strip()}\n```" if ctx.selectedCode else "*(No snippet selected)*"

    return f"""You are Rain Code Studio, an on-device code auditor and debugging copilot.
Your task is to analyze the bug, unexpected behavior, or error stack trace in the user's project.

SAFETY AND PRIVACY RULES:
1. Do NOT attempt to execute or reproduce code.
2. Ground your hypothesis solely on the static code evidence and stack trace provided.
3. Clearly separate facts from hypotheses.

TARGET CONTEXT:
{target_info}
{error_section}

RELEVANT CODE:
{selected_code_block}

USER INQUIRY:
{ctx.query or 'Identify the root cause of this error and suggest a fix.'}

RETRIEVED SURROUNDING CONTEXT:
{context_str}

Respond with:
- Summary: Concise statement of the bug.
- Severity: critical | high | medium | low | informational
- Confidence: 0.0 to 1.0
- Likely Cause: Root cause explanation referencing exact variables, logic flaws, or boundary conditions.
- Evidence: Exact line numbers or code constructs causing the failure.
- Affected Files & Symbols: Where the bug manifests.
- Suggested Fix: Step-by-step guidance on resolving the issue.
- Proposed Code: The exact corrected code block."""


def build_code_improvement_prompt(ctx: CodeContextInput, chunks: List[RetrievalResult]) -> str:
    """Prompt for generating actionable code improvements (performance, readability, type safety)."""
    context_str = format_context_blocks(chunks)
    selected_code = ctx.selectedCode or ""
    category = ctx.category or "maintainability"

    return f"""You are Rain Code Studio, an on-device code refactoring and optimization specialist.
Your task is to review the code and recommend concrete improvements in category: {category.upper()}.

CATEGORIES TO EVALUATE:
- Readability & Clean Code
- Maintainability & Modularity
- Performance & Memory Efficiency
- Type Safety & Null Handling
- Error Handling & Robustness
- Eliminating Redundancy

TARGET CODE ({ctx.relativePath or ctx.filePath or 'Selected Code'}):
```
{selected_code.strip()}
```

USER FOCUS:
{ctx.query or f'Suggest improvements for {category} without changing the external behavior.'}

SURROUNDING PROJECT CONTEXT:
{context_str}

Provide:
1. Technical Rationale: WHY the change is needed and what drawbacks the current code has.
2. Category: The primary improvement category.
3. Summary: 1-2 sentence overview of the refactoring.
4. Improved Implementation: The complete refactored code block ready to be reviewed."""


def build_code_review_prompt(ctx: CodeContextInput, chunks: List[RetrievalResult]) -> str:
    """Prompt for multi-dimensional code quality and security review."""
    context_str = format_context_blocks(chunks)
    code_block = ctx.selectedCode or ""

    return f"""You are Rain Code Studio, a senior code reviewer conducting a rigorous, privacy-first on-device code review.

REVIEW DIMENSIONS:
1. Correctness Risks (logic bugs, unhandled edge cases, null dereferences)
2. Maintainability (complexity, naming, cohesion)
3. Security Concerns (injection risks, insecure token handling, input validation)
4. Error Handling (caught exceptions, async rejections)
5. Type Safety (missing types, any abuse)
6. Performance Concerns (unnecessary allocations, quadratic loops)
7. Testing Gaps (untested logic branches)

CODE UNDER REVIEW ({ctx.relativePath or ctx.filePath or 'Selected Code'}):
```
{code_block.strip()}
```

ADDITIONAL CONTEXT FROM PROJECT:
{context_str}

Please generate:
- Summary: Overall health assessment.
- Quality Score: Rating from 1 to 100.
- Strengths: What the author did well.
- Findings: List of concrete issues. For each finding provide:
  - Severity: critical | warning | suggestion | info
  - Category: correctness | security | maintainability | performance | error_handling | type_safety
  - File and Line (if identifiable)
  - Explanation: Clear explanation of the flaw
  - Suggestion: Exact fix or recommendation"""


def build_test_generation_prompt(ctx: CodeContextInput, chunks: List[RetrievalResult]) -> str:
    """Prompt for generating complete unit tests matching the project's testing framework."""
    context_str = format_context_blocks(chunks)
    framework = ctx.testFramework or "Vitest"
    code_block = ctx.selectedCode or ""

    return f"""You are Rain Code Studio, a test automation engineer.
Generate comprehensive unit tests for the target code using framework: {framework}.

REQUIREMENTS:
1. Write clean, production-ready tests adhering to standard conventions of {framework}.
2. Cover:
   - Happy path / normal expected inputs
   - Edge cases (null, empty strings, zero, boundary values)
   - Error handling & exception cases
3. Include proper describe / test / it blocks and assertions.
4. Mock external dependencies if necessary.
5. Do NOT execute tests automatically; present complete code for developer review.

TARGET CODE TO TEST ({ctx.relativePath or ctx.filePath or 'Target File'}):
```
{code_block.strip()}
```

SURROUNDING PROJECT CONTEXT:
{context_str}

Respond with:
- Summary of test coverage.
- Individual Test Cases (Name, Type, Description).
- Complete Executable Test File Code."""


def build_documentation_prompt(ctx: CodeContextInput, chunks: List[RetrievalResult]) -> str:
    """Prompt for generating professional docstrings, API reference, or README sections."""
    context_str = format_context_blocks(chunks)
    doc_type = ctx.docType or "function"
    code_block = ctx.selectedCode or ""

    return f"""You are Rain Code Studio, a technical documentation specialist.
Generate comprehensive {doc_type.upper()} documentation for the target code.

GUIDELINES:
- Follow standard documentation conventions for the language (e.g. JSDoc/TSDoc for TypeScript, Docstrings for Python).
- Detail:
  - Overview / Summary
  - Parameters (types, descriptions, defaults)
  - Return value (type and semantics)
  - Thrown exceptions / error conditions
  - Practical usage example
- Keep it concise, informative, and formatted in clean Markdown.

TARGET CODE ({ctx.relativePath or ctx.filePath or 'Selected Code'}):
```
{code_block.strip()}
```

SURROUNDING PROJECT CONTEXT:
{context_str}

Please generate the documentation now:"""


def build_change_generation_prompt(ctx: CodeContextInput, chunks: List[RetrievalResult]) -> str:
    """Prompt for generating a targeted code patch for a file."""
    context_str = format_context_blocks(chunks)
    instruction = ctx.query or getattr(ctx, 'instruction', None) or "Apply the requested code improvement."
    code_block = ctx.selectedCode or ""

    return f"""You are Rain Code Studio, an automated code transformation engine.
Your task is to produce the modified version of the target code according to the instruction.

INSTRUCTION:
{instruction}

TARGET FILE:
{ctx.relativePath or ctx.filePath or 'Target File'}

ORIGINAL CODE:
```
{code_block.strip()}
```

SURROUNDING PROJECT CONTEXT:
{context_str}

CRITICAL RULES:
1. Return ONLY the modified replacement code block.
2. Preserve all comments, indentation, and existing logic not explicitly altered.
3. Do NOT include markdown conversation preamble."""


# ==================================================
# PHASE 7: GIT PROMPTS
# ==================================================


def build_commit_message_prompt(
    staged_diff: str, chunks: List[RetrievalResult], hint: Optional[str] = None
) -> str:
    """Build prompt for AI Conventional Commit authoring."""
    context_str = format_context_blocks(chunks, max_chars=1500) if chunks else ""
    hint_str = f"\nDEVELOPER HINT/INTENT: {hint}" if hint else ""

    # Truncate staged diff if overly long to fit local context
    diff_snippet = staged_diff[:3500] if len(staged_diff) > 3500 else staged_diff

    return f"""You are Rain Code Studio, an expert commit author running locally on a Snapdragon PC.
Your task is to analyze the Git staged diff and generate a clear, semantic Conventional Commit message.

CONVENTIONAL COMMIT FORMAT:
<type>(<optional scope>): <imperative subject line>

[optional body describing why and what changed]

RULES:
1. Conventional types: feat, fix, refactor, docs, test, chore, perf, style.
2. Subject must be concise (max 72 chars), lowercase, imperative ("add" not "added").
3. Base your message strictly on the changes visible in the diff. Do NOT hallucinate features.
4. If there is a body, list concise bullet points explaining key architectural changes.
5. Provide reasoning explaining why the type and scope were chosen.{hint_str}

STAGED GIT DIFF:
```diff
{diff_snippet.strip()}
```

{context_str}

Generate the commit message and reasoning now:"""


def build_commit_explanation_prompt(
    commit_diff: str, metadata: dict, chunks: List[RetrievalResult]
) -> str:
    """Build prompt for AI commit inspection and explanation."""
    context_str = format_context_blocks(chunks, max_chars=1500) if chunks else ""
    diff_snippet = commit_diff[:3500] if len(commit_diff) > 3500 else commit_diff

    return f"""You are Rain Code Studio, an expert commit analyzer and code inspector.
Your task is to explain the intent, architecture, and impact of this Git commit.

COMMIT METADATA:
Hash: {metadata.get('hash', 'Unknown')}
Author: {metadata.get('author', 'Unknown')}
Date: {metadata.get('date', 'Unknown')}
Message: {metadata.get('message', 'No commit message')}

COMMIT DIFF:
```diff
{diff_snippet.strip()}
```

{context_str}

INSTRUCTIONS:
1. Provide an executive summary of what this commit achieves.
2. List the concrete changes made across files.
3. Analyze potential impact on downstream components, performance, or backwards compatibility.
4. Mention key functions, classes, or symbols affected.
5. Do NOT make unsupported assumptions; ground analysis strictly in the diff.

Generate the commit analysis now:"""

