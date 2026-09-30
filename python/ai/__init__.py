"""SnapDev AI - Local AI Model Subsystem.

Phase 5: Real Local AI Model Integration for On-Device Copilot.
"""

from .chat_service import AIChatService, get_chat_service
from .developer_service import DeveloperService, get_developer_service
from .hardware import detect_hardware_info
from .manager import ModelManager, get_model_manager
from .models import (
    AIHardwareInfo,
    AIStatusResponse,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    LoadModelRequest,
    ModelInfo,
    SourceReference,
    StreamChunk,
    AIExecutionCapabilityReport,
    RAGPerformanceReport,
    ModelPerformanceProfile,
    LocalBenchmarkRunResponse,
)
from .prompt_builder import PromptBuilder
from .provider import AIProvider, DeterministicTestAIProvider, LocalAIProvider, OllamaProvider
from .qualcomm_hub import QualcommAIHubService, get_qualcomm_hub_service
from .schemas import (
    BugAnalysisResult,
    ChangeResult,
    CodeContextInput,
    CodeReviewFinding,
    CodeReviewResult,
    DocumentationResult,
    ExplanationResult,
    FilePatch,
    ImprovementResult,
    TestCaseItem,
    TestGenerationResult,
    CommitMessageRequest,
    CommitMessageSuggestion,
    ExplainCommitRequest,
    CommitAnalysis,
)

__all__ = [
    "AIChatService",
    "AIHardwareInfo",
    "AIProvider",
    "AIStatusResponse",
    "BugAnalysisResult",
    "ChangeResult",
    "ChatMessage",
    "ChatRequest",
    "ChatResponse",
    "CodeContextInput",
    "CodeReviewFinding",
    "CodeReviewResult",
    "DeterministicTestAIProvider",
    "DeveloperService",
    "DocumentationResult",
    "ExplanationResult",
    "FilePatch",
    "ImprovementResult",
    "LoadModelRequest",
    "LocalAIProvider",
    "OllamaProvider",
    "ModelInfo",
    "ModelManager",
    "PromptBuilder",
    "SourceReference",
    "StreamChunk",
    "TestCaseItem",
    "TestGenerationResult",
    "CommitMessageRequest",
    "CommitMessageSuggestion",
    "ExplainCommitRequest",
    "CommitAnalysis",
    "AIExecutionCapabilityReport",
    "RAGPerformanceReport",
    "ModelPerformanceProfile",
    "LocalBenchmarkRunResponse",
    "QualcommAIHubService",
    "detect_hardware_info",
    "get_chat_service",
    "get_developer_service",
    "get_model_manager",
    "get_qualcomm_hub_service",
]


