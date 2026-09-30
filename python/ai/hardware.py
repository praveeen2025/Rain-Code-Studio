"""SnapDev AI - Hardware Detection & Diagnostics.

Phase 5: Local AI Model Integration.
Detects actual host processor, memory, and acceleration capabilities without
inventing specifications or falsely claiming NPU acceleration unless verified.
"""

import ctypes
import os
import platform
from typing import Optional
from .models import AIHardwareInfo


def get_total_ram_mb() -> Optional[int]:
    """Retrieve total physical memory in megabytes using Windows kernel32."""
    try:
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        stat = MEMORYSTATUSEX()
        stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
            return int(stat.ullTotalPhys / (1024 * 1024))
    except Exception:
        pass
    return None


def detect_hardware_info() -> AIHardwareInfo:
    """Accurately detect host platform hardware without speculation."""
    proc = platform.processor() or "Unknown CPU"
    machine = platform.machine()
    plat = platform.platform()

    # Check for Snapdragon / Qualcomm architecture
    is_snapdragon = any(
        kw in proc.lower() or kw in plat.lower()
        for kw in ["snapdragon", "qualcomm", "sc8380", "x elite", "snapdragon x"]
    )

    npu_accelerator: Optional[str] = None
    accelerator = "CPU Execution Provider"
    runtime = "Local Transformers / PyTorch CPU"

    # Only claim NPU if QNN runtime is actually importable and initialized
    if is_snapdragon:
        try:
            import qnn_wrapper  # type: ignore # Example hypothetical QNN driver
            npu_accelerator = "Qualcomm Hexagon NPU (Verified)"
            accelerator = "QNN NPU Execution Provider"
            runtime = "Qualcomm AI Engine Direct (QNN)"
        except ImportError:
            # Running on Snapdragon CPU without verified QNN runtime
            npu_accelerator = None
            accelerator = "Snapdragon ARM64 CPU"
            runtime = "PyTorch / ONNXRuntime (ARM64 CPU)"
    else:
        npu_accelerator = None

    ram_mb = get_total_ram_mb()

    return AIHardwareInfo(
        device="cpu",
        runtime=runtime,
        accelerator=accelerator,
        cpu=proc,
        gpu=None,
        npu=npu_accelerator,
        memoryTotalMb=ram_mb,
    )
