"""
NZ工作流助手 - 处理器模块
包含WebSocket消息处理、文件操作和静态文件服务
"""

from .file_operations import register_file_operations_endpoints
from .static_handler import register_static_endpoints

__all__ = [
    'register_file_operations_endpoints', 
    'register_static_endpoints'
]
