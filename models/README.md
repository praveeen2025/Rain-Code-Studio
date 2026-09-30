# SnapDev AI Model Directory

This directory is reserved for local on-device AI model weights and artifacts.

## Phase 1 Notice
In **Phase 1 (Foundation)**, no AI models are downloaded, loaded, or executed.
SnapDev AI strictly avoids fake AI execution or mock benchmark claims.

## Future Architecture (Phase 5+)
In future phases, this directory will host:
- Quantized LLM models (INT4 / INT8) targeting Qualcomm Snapdragon X Elite NPU via the Qualcomm AI Engine Direct (QNN) SDK.
- ONNX Runtime Execution Provider for QNN (`QNNExecutionProvider`).
- Local embedding models for on-device semantic code search and RAG (Retrieval-Augmented Generation).
- Context vector caches.

All models will remain 100% on-device, preserving user privacy with zero cloud data transmission.
