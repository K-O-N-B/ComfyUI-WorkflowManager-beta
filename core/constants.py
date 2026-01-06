"""
NZ工作流助手 - 常量定义模块
包含插件使用的所有常量和配置
"""

# ComfyUI相关常量
WEB_DIRECTORY = "web"

# 节点分类
NODE_CATEGORY = "NZ Workflow"

# 支持的文件扩展名
SUPPORTED_WORKFLOW_EXTENSIONS = ['.json']

# 文件操作相关常量
INVALID_FILENAME_CHARS = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']

# WebSocket消息类型
WEBSOCKET_MESSAGE_TYPE = "nz_workflow_manager"
WEBSOCKET_RESPONSE_TYPE = "nz_workflow_manager_response"

# HTTP端点路径
HTTP_ENDPOINTS = {
    'local_files': '/local_files',
    'file_operations': '/file_operations', 
    'static_files': '/nz_static'
}

# 默认路径配置
DEFAULT_PATHS = {
    'current_directory': '',  # 空字符串表示使用当前工作目录
}
