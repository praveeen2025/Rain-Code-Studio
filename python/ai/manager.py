"""SnapDev AI - Model Manager for Lifecycle & Concurrency Control.

Phase 5: Local AI Model Integration.
Coordinates model loading, unloading, state tracking, concurrency locks,
and request cancellation.
States: not_configured | loading | ready | generating | stopping | error | unloading.
"""

import threading
import time
from typing import Generator, List, Optional
try:
    from config import get_config
except ImportError:
    from python.config import get_config

from .models import AIStatusResponse, ModelInfo
from .provider import AIProvider, LocalAIProvider


class ModelManager:
    """Singleton model lifecycle coordinator ensuring safe local execution."""

    def __init__(self, provider: Optional[AIProvider] = None):
        cfg = get_config()
        self.provider = provider or LocalAIProvider()
        self._state: str = "not_configured"
        self._error_message: Optional[str] = None
        self._state_lock = threading.Lock()
        self._inference_lock = threading.Lock()
        self._current_cancel_event: Optional[threading.Event] = None
        self._active_generation_id: Optional[str] = None

        # Auto-initialize state based on provider
        if self.provider.is_loaded():
            self._state = "ready"
        else:
            self._state = "not_configured"

    @property
    def state(self) -> str:
        with self._state_lock:
            return self._state

    @property
    def error_message(self) -> Optional[str]:
        with self._state_lock:
            return self._error_message

    def get_status(self) -> AIStatusResponse:
        with self._state_lock:
            info = self.provider.get_model_info()
            return AIStatusResponse(
                status=self._state,
                modelInfo=info,
                activeGenerationId=self._active_generation_id,
                error=self._error_message,
            )

    def load_model(
        self,
        model_name: Optional[str] = None,
        model_path: Optional[str] = None,
        device: Optional[str] = None,
    ) -> bool:
        """Load configured model into memory with state transitions."""
        with self._state_lock:
            if self._state == "loading":
                print("[ModelManager] Model is already currently loading.")
                return False
            if self._state == "generating":
                print("[ModelManager] Cannot reload model while generating.")
                return False

            self._state = "loading"
            self._error_message = None

        try:
            # Reconfigure provider if custom params provided
            if model_name or model_path or device:
                self.provider = LocalAIProvider(
                    model_name=model_name,
                    model_path=model_path,
                    device=device,
                )

            success = self.provider.load_model()
            with self._state_lock:
                if success:
                    self._state = "ready"
                    self._error_message = None
                    return True
                else:
                    self._state = "error"
                    self._error_message = "Failed to initialize local model runtime"
                    return False
        except Exception as e:
            with self._state_lock:
                self._state = "error"
                self._error_message = str(e)
            print(f"[ModelManager] Load error: {e}")
            return False

    def load(self, model_name: Optional[str] = None, model_path: Optional[str] = None, device: Optional[str] = None) -> dict:
        """Alias for load_model returning dict status."""
        ok = self.load_model(model_name, model_path, device)
        return {"success": ok, "status": self.state, "error": self.error_message}

    def unload(self) -> dict:
        """Alias for unload_model returning dict status."""
        ok = self.unload_model()
        return {"success": ok, "status": self.state, "error": self.error_message}

    def unload_model(self) -> bool:
        """Unload model from memory safely."""
        with self._state_lock:
            if self._state == "generating":
                self.stop_generation()

            self._state = "unloading"

        try:
            self.provider.unload_model()
            with self._state_lock:
                self._state = "not_configured"
                self._error_message = None
            return True
        except Exception as e:
            with self._state_lock:
                self._state = "error"
                self._error_message = str(e)
            return False

    def generate(
        self,
        prompt: str,
        generation_id: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.2,
        stop_sequences: Optional[List[str]] = None,
    ) -> str:
        """Execute non-streaming generation under concurrency lock."""
        gen_id = generation_id or f"gen_{int(time.time()*1000)}"
        # Ensure model is ready
        if not self.provider.is_loaded():
            self.load_model()

        if not self._inference_lock.acquire(blocking=False):
            raise RuntimeError("Model is currently busy with another generation request.")

        cancel_event = threading.Event()
        with self._state_lock:
            self._state = "generating"
            self._active_generation_id = gen_id
            self._current_cancel_event = cancel_event

        try:
            result = self.provider.generate(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop_sequences=stop_sequences,
                cancel_event=cancel_event,
            )
            return result
        finally:
            with self._state_lock:
                self._state = "ready"
                self._active_generation_id = None
                self._current_cancel_event = None
            self._inference_lock.release()

    def generate_stream(
        self,
        prompt: str,
        generation_id: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.2,
        stop_sequences: Optional[List[str]] = None,
    ) -> Generator[str, None, None]:
        """Stream generated tokens progressively with cancellation support."""
        gen_id = generation_id or f"gen_{int(time.time()*1000)}"
        if not self.provider.is_loaded():
            self.load_model()

        if not self._inference_lock.acquire(blocking=False):
            raise RuntimeError("Model is currently busy with another generation request.")

        cancel_event = threading.Event()
        with self._state_lock:
            self._state = "generating"
            self._active_generation_id = gen_id
            self._current_cancel_event = cancel_event

        try:
            for token in self.provider.generate_stream(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop_sequences=stop_sequences,
                cancel_event=cancel_event,
            ):
                yield token
        finally:
            with self._state_lock:
                self._state = "ready"
                self._active_generation_id = None
                self._current_cancel_event = None
            self._inference_lock.release()

    def stop_generation(self) -> bool:
        """Cancel the currently active generation request."""
        with self._state_lock:
            if self._state != "generating" or not self._current_cancel_event:
                return False

            self._state = "stopping"
            self._current_cancel_event.set()
            print(f"[ModelManager] Sent stop signal to active generation: {self._active_generation_id}")
            return True


# Global Singleton instance
model_manager = ModelManager()


def get_model_manager() -> ModelManager:
    return model_manager
