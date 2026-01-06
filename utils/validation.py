"""
NZ工作流助手 - 数据验证工具模块
提供路径验证、文件名验证等功能
"""

import os
from ..core.constants import INVALID_FILENAME_CHARS


def validate_path(path):
    """验证路径是否有效且安全"""
    if not path or not isinstance(path, str):
        return False
    
    # 检查路径是否为空或只包含空格
    if not path.strip():
        return False
    
    try:
        # 规范化路径
        normalized_path = os.path.normpath(path)
        
        # 检查是否包含危险的路径遍历字符
        if '..' in normalized_path:
            return False
        
        # 检查是否包含非法字符（Windows特有）
        # 注意：冒号(:)在Windows盘符中是合法的，需要特殊处理
        illegal_chars = ['<', '>', '"', '|', '?', '*']
        
        # 对于Windows系统，允许盘符中的冒号（如 C:, D: 等）
        import platform
        if platform.system() == 'Windows':
            # 检查是否是合法的Windows路径格式
            if len(path) >= 2 and path[1] == ':' and path[0].isalpha():
                # 这是合法的盘符格式，检查冒号后面的部分
                path_to_check = path[2:]  # 跳过盘符部分 (如 "D:")
            else:
                path_to_check = path
        else:
            # 非Windows系统，冒号也是非法字符
            illegal_chars.append(':')
            path_to_check = path
        
        # 检查非法字符
        if any(char in path_to_check for char in illegal_chars):
            return False
        
        return True
        
    except Exception:
        return False


def validate_filename(filename):
    """验证文件名是否有效"""
    if not filename or not isinstance(filename, str):
        return False
    
    # 检查文件名是否为空或只包含空格
    if not filename.strip():
        return False
    
    # 检查是否包含非法字符
    if any(char in filename for char in INVALID_FILENAME_CHARS):
        return False
    
    # 检查是否为保留名称（Windows）
    reserved_names = [
        'CON', 'PRN', 'AUX', 'NUL',
        'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
        'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ]
    
    if filename.upper() in reserved_names:
        return False
    
    # 检查文件名长度
    if len(filename) > 255:
        return False
    
    return True


def sanitize_filename(filename):
    """清理文件名，移除或替换非法字符"""
    if not filename:
        return ""
    
    # 替换非法字符为下划线
    sanitized = filename
    for char in INVALID_FILENAME_CHARS:
        sanitized = sanitized.replace(char, '_')
    
    # 移除首尾空格
    sanitized = sanitized.strip()
    
    # 确保不是保留名称
    reserved_names = [
        'CON', 'PRN', 'AUX', 'NUL',
        'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
        'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ]
    
    if sanitized.upper() in reserved_names:
        sanitized = f"_{sanitized}"
    
    # 限制长度
    if len(sanitized) > 255:
        sanitized = sanitized[:255]
    
    return sanitized


def is_safe_path(path, base_path):
    """检查路径是否在指定的基础路径内（防止路径遍历攻击）"""
    try:
        # 规范化路径
        abs_path = os.path.abspath(path)
        abs_base = os.path.abspath(base_path)
        
        # 检查是否在基础路径内
        return abs_path.startswith(abs_base)
        
    except Exception:
        return False
