"""
NZ工作流助手 - 文件工具模块
提供文件操作相关的工具函数
"""

import os
import mimetypes
from datetime import datetime
from ..core.constants import SUPPORTED_WORKFLOW_EXTENSIONS


def get_file_info(file_path):
    """获取文件信息"""
    try:
        if not os.path.exists(file_path):
            return None
        
        stat = os.stat(file_path)
        
        info = {
            'path': file_path,
            'name': os.path.basename(file_path),
            'size': stat.st_size,
            'modified': datetime.fromtimestamp(stat.st_mtime),
            'is_file': os.path.isfile(file_path),
            'is_directory': os.path.isdir(file_path)
        }
        
        if info['is_file']:
            # 获取MIME类型
            mime_type, _ = mimetypes.guess_type(file_path)
            info['mime_type'] = mime_type
            
            # 检查是否为支持的工作流文件
            info['is_workflow'] = any(file_path.lower().endswith(ext) for ext in SUPPORTED_WORKFLOW_EXTENSIONS)
        
        return info
        
    except Exception:
        return None


def get_directory_listing(directory_path, include_hidden=False):
    """获取目录内容列表"""
    try:
        if not os.path.exists(directory_path) or not os.path.isdir(directory_path):
            print(f"❌ 目录不存在或不是目录: {directory_path}")
            return None
        
        items = os.listdir(directory_path)
        print(f"🔍 扫描目录: {directory_path}")
        print(f"📁 发现 {len(items)} 个项目: {items}")
        
        directories = []
        files = []
        
        for item in items:
            # 跳过隐藏文件（除非明确要求包含）
            if not include_hidden and item.startswith('.'):
                continue
            
            item_path = os.path.join(directory_path, item)
            info = get_file_info(item_path)
            
            if info:
                if info['is_directory']:
                    directories.append({
                        "name": item,
                        "date": info['modified'].strftime("%m/%d/%y"),
                        "type": "directory"
                    })
                    print(f"📁 添加目录: {item}")
                elif info['is_file'] and info.get('is_workflow', False):
                    # 只显示JSON工作流文件
                    file_entry = {
                        "name": item,
                        "date": info['modified'].strftime("%m/%d/%y"),
                        "size": info['size'],
                        "type": "file",
                        "is_workflow": True
                    }
                    
                    files.append(file_entry)
                    print(f"📄 添加JSON工作流文件: {item}")
        
        # 按名称排序
        directories.sort(key=lambda x: x['name'].lower())
        files.sort(key=lambda x: x['name'].lower())
        
        result = {
            "path": directory_path,
            "directories": directories,
            "files": files,
            "type": "directory_listing"
        }
        
        print(f"✅ 返回结果: {len(directories)}个目录, {len(files)}个文件")
        return result
        
    except Exception as e:
        print(f"❌ 获取目录列表失败: {str(e)}")
        import traceback
        print(f"详细错误: {traceback.format_exc()}")
        return None


def ensure_directory_exists(directory_path):
    """确保目录存在，如果不存在则创建"""
    try:
        if not os.path.exists(directory_path):
            os.makedirs(directory_path, exist_ok=True)
        return True
    except Exception:
        return False


def get_safe_filename(filename, replacement_char='_'):
    """获取安全的文件名（移除或替换危险字符）"""
    if not filename:
        return ""
    
    # 定义危险字符
    dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
    
    # 替换危险字符
    safe_name = filename
    for char in dangerous_chars:
        safe_name = safe_name.replace(char, replacement_char)
    
    # 移除首尾空格和点
    safe_name = safe_name.strip('. ')
    
    # 确保不为空
    if not safe_name:
        safe_name = "unnamed"
    
    return safe_name


def format_file_size(size_bytes):
    """格式化文件大小为人类可读格式"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def is_text_file(file_path):
    """检查文件是否为文本文件"""
    try:
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type:
            return mime_type.startswith('text/') or mime_type in [
                'application/json',
                'application/xml',
                'application/javascript'
            ]
        
        # 如果无法确定MIME类型，尝试读取少量内容检查
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            return chunk.decode('utf-8', errors='ignore').isprintable()
            
    except Exception:
        return False
