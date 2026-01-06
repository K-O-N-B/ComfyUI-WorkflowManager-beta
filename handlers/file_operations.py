"""
NZ工作流助手 - 文件操作处理器模块
处理文件系统相关的HTTP请求
"""

import os
import json
import shutil
import mimetypes
from datetime import datetime
from aiohttp import web
from ..core.logger import get_logger
from ..core.constants import SUPPORTED_WORKFLOW_EXTENSIONS, HTTP_ENDPOINTS
from ..utils.validation import validate_path, validate_filename
from ..utils.file_utils import get_file_info, get_directory_listing


# 获取logger实例
logger = get_logger()


async def handle_local_files(request):
    """处理本地文件系统访问请求"""
    try:
        path = request.query.get('path', '')
        action = request.query.get('action', 'list_directory')
        
        if not path:
            return web.json_response({
                "error": "路径参数缺失",
                "type": "error"
            })
        
        logger.info(f"本地文件访问请求: {action} - {path}")
        
        if not os.path.exists(path):
            return web.json_response({
                "error": f"路径不存在: {path}",
                "type": "error"
            })
        
        # 根据操作类型处理
        if action == 'load_workflow':
            return await _handle_load_workflow_http(path)
        else:
            return await _handle_list_directory_http(path)
            
    except Exception as e:
        logger.error(f"本地文件访问失败: {str(e)}")
        return web.json_response({
            "error": f"访问失败: {str(e)}",
            "type": "error"
        })


async def _handle_load_workflow_http(path):
    """处理加载工作流文件的HTTP请求"""
    try:
        if not os.path.isfile(path):
            return web.json_response({
                "error": f"路径不是文件: {path}",
                "type": "error"
            })
        
        if not any(path.lower().endswith(ext) for ext in SUPPORTED_WORKFLOW_EXTENSIONS):
            return web.json_response({
                "error": "只支持JSON格式的工作流文件",
                "type": "error"
            })
        
        with open(path, 'r', encoding='utf-8') as f:
            workflow_data = f.read()
        
        result = {
            "path": path,
            "data": workflow_data,
            "type": "workflow_loaded"
        }
        
        logger.info(f"工作流文件读取成功: {path}")
        return web.json_response(result)
        
    except Exception as read_error:
        logger.error(f"读取工作流文件失败: {str(read_error)}")
        return web.json_response({
            "error": f"读取文件失败: {str(read_error)}",
            "type": "error"
        })


async def _handle_list_directory_http(path):
    """处理列出目录内容的HTTP请求"""
    try:
        if not os.path.isdir(path):
            return web.json_response({
                "error": f"路径不是目录: {path}",
                "type": "error"
            })
        
        # 使用工具函数获取目录列表
        result = get_directory_listing(path)
        
        if result is None:
            return web.json_response({
                "error": f"无法读取目录: {path}",
                "type": "error"
            })
        
        logger.info(f"目录内容: {len(result['directories'])}个目录, {len(result['files'])}个JSON文件")
        return web.json_response(result)
        
    except Exception as e:
        logger.error(f"列出目录失败: {str(e)}")
        return web.json_response({
            "error": f"列出目录失败: {str(e)}",
            "type": "error"
        })


async def handle_file_operations(request):
    """处理文件操作HTTP请求"""
    try:
        # 支持GET和POST请求
        if request.method == 'POST':
            # 处理POST请求（支持表单数据）
            if request.content_type.startswith('multipart/form-data'):
                data = await request.post()
                action = data.get('action', '')
            else:
                # 处理JSON数据
                data = await request.json()
                action = data.get('action', '')
        else:
            # 处理GET请求
            data = request.query
            action = request.query.get('action', '')
        
        logger.info(f"收到文件操作请求: {action} (方法: {request.method})")
        
        # 根据操作类型分发处理
        if action == 'list_directory':
            path = data.get('path', '') if hasattr(data, 'get') else data.get('path', '')
            logger.info(f"处理目录列表请求: {path}")
            return await _handle_list_directory_http(path)
        elif action == 'create_directory':
            return await _handle_create_directory_http(data)
        elif action == 'delete_file':
            return await _handle_delete_file_http(data)
        elif action == 'delete_directory':
            return await _handle_delete_directory_http(data)
        elif action == 'path_exists':
            return await _handle_path_exists_http(data)
        elif action == 'copy_file':
            return await _handle_copy_file_http(data)
        elif action == 'copy_directory':
            return await _handle_copy_directory_http(data)
        elif action == 'move_file':
            return await _handle_move_file_http(data)
        elif action == 'move_directory':
            return await _handle_move_directory_http(data)
        elif action == 'rename':
            return await _handle_rename_http(data)
        elif action == 'check_file_exists':
            return await _handle_check_file_exists_http(data)
        elif action == 'check_directory_exists':
            return await _handle_check_directory_exists_http(data)
        elif action == 'save_workflow':
            return await _handle_save_workflow_http(data)
        else:
            return web.json_response({
                "error": f"不支持的操作: {action}",
                "action": action
            })
            
    except Exception as e:
        logger.error(f"文件操作请求处理失败: {str(e)}")
        return web.json_response({
            "error": f"处理失败: {str(e)}"
        })


async def _handle_create_directory_http(data):
    """处理创建目录的HTTP请求"""
    parent_path = data.get('parent_path', '')
    directory_name = data.get('directory_name', '')
    
    try:
        if not validate_path(parent_path):
            raise ValueError("父目录路径无效")
        
        if not validate_filename(directory_name):
            raise ValueError("目录名包含非法字符或为空")
        
        new_directory_path = os.path.join(parent_path, directory_name)
        
        # 检查目录是否已存在
        if os.path.exists(new_directory_path):
            raise ValueError("目录已存在")
        
        # 创建目录
        os.makedirs(new_directory_path)
        logger.info(f"HTTP: 成功创建目录: {new_directory_path}")
        
        return web.json_response({
            "success": True, 
            "path": new_directory_path
        })
        
    except Exception as e:
        logger.error(f"HTTP: 创建目录失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_delete_file_http(data):
    """处理删除文件的HTTP请求"""
    file_path = data.get('file_path', '')
    
    try:
        if not validate_path(file_path):
            raise ValueError("文件路径无效")
        
        if not os.path.exists(file_path):
            raise ValueError("文件不存在")
        
        if not os.path.isfile(file_path):
            raise ValueError("指定路径不是文件")
        
        os.remove(file_path)
        logger.info(f"HTTP: 成功删除文件: {file_path}")
        
        return web.json_response({
            "success": True, 
            "path": file_path
        })
        
    except Exception as e:
        logger.error(f"HTTP: 删除文件失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_delete_directory_http(data):
    """处理删除目录的HTTP请求"""
    directory_path = data.get('directory_path', '')
    
    try:
        if not validate_path(directory_path):
            raise ValueError("目录路径无效")
        
        if not os.path.exists(directory_path):
            raise ValueError("目录不存在")
        
        if not os.path.isdir(directory_path):
            raise ValueError("指定路径不是目录")
        
        shutil.rmtree(directory_path)
        logger.info(f"HTTP: 成功删除目录: {directory_path}")
        
        return web.json_response({
            "success": True, 
            "path": directory_path
        })
        
    except Exception as e:
        logger.error(f"HTTP: 删除目录失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_path_exists_http(data):
    """处理路径存在检查的HTTP请求"""
    path_to_check = data.get('path', '')
    
    try:
        if not path_to_check:
            raise ValueError("路径不能为空")
        
        exists = os.path.exists(path_to_check)
        is_directory = False
        is_file = False
        
        if exists:
            is_directory = os.path.isdir(path_to_check)
            is_file = os.path.isfile(path_to_check)
        
        return web.json_response({
            "success": True, 
            "exists": exists,
            "is_directory": is_directory,
            "is_file": is_file,
            "path": path_to_check
        })
        
    except Exception as e:
        logger.error(f"HTTP: 检查路径存在失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_copy_file_http(data):
    """处理复制文件的HTTP请求"""
    source_path = data.get('source_path', '')
    target_path = data.get('target_path', '')
    new_name = data.get('new_name', '')
    
    try:
        if not validate_path(source_path) or not validate_path(target_path):
            raise ValueError("源路径或目标路径无效")
        
        if not os.path.exists(source_path):
            raise ValueError("源文件不存在")
        
        if not os.path.isfile(source_path):
            raise ValueError("源路径不是文件")
        
        if not os.path.exists(target_path):
            raise ValueError("目标目录不存在")
        
        if not os.path.isdir(target_path):
            raise ValueError("目标路径不是目录")
        
        # 确定目标文件名
        if new_name:
            if not validate_filename(new_name):
                raise ValueError("新文件名包含非法字符")
            target_file_name = new_name
        else:
            target_file_name = os.path.basename(source_path)
        
        # 构建完整的目标文件路径
        full_target_path = os.path.join(target_path, target_file_name)
        
        # 复制文件（覆盖已存在的文件）
        shutil.copy2(source_path, full_target_path)
        logger.info(f"HTTP: 成功复制文件: {source_path} -> {full_target_path}")
        
        return web.json_response({
            "success": True, 
            "source": source_path,
            "target": full_target_path
        })
        
    except Exception as e:
        logger.error(f"HTTP: 复制文件失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_copy_directory_http(data):
    """处理复制目录的HTTP请求"""
    source_path = data.get('source_path', '')
    target_path = data.get('target_path', '')
    new_name = data.get('new_name', '')
    
    try:
        if not validate_path(source_path) or not validate_path(target_path):
            raise ValueError("源路径或目标路径无效")
        
        if not os.path.exists(source_path):
            raise ValueError("源目录不存在")
        
        if not os.path.isdir(source_path):
            raise ValueError("源路径不是目录")
        
        if not os.path.exists(target_path):
            raise ValueError("目标目录不存在")
        
        if not os.path.isdir(target_path):
            raise ValueError("目标路径不是目录")
        
        # 确定目标目录名
        if new_name:
            if not validate_filename(new_name):
                raise ValueError("新目录名包含非法字符")
            target_dir_name = new_name
        else:
            target_dir_name = os.path.basename(source_path)
        
        # 构建完整的目标目录路径
        full_target_path = os.path.join(target_path, target_dir_name)
        
        # 复制目录（覆盖已存在的目录）
        if os.path.exists(full_target_path):
            shutil.rmtree(full_target_path)
        shutil.copytree(source_path, full_target_path)
        logger.info(f"HTTP: 成功复制目录: {source_path} -> {full_target_path}")
        
        return web.json_response({
            "success": True, 
            "source": source_path,
            "target": full_target_path
        })
        
    except Exception as e:
        logger.error(f"HTTP: 复制目录失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_move_file_http(data):
    """处理移动文件的HTTP请求"""
    source_path = data.get('source_path', '')
    target_path = data.get('target_path', '')
    new_filename = data.get('new_filename', '')  # 支持重命名
    
    try:
        if not validate_path(source_path) or not validate_path(target_path):
            raise ValueError("源路径或目标路径无效")
        
        if not os.path.exists(source_path):
            raise ValueError("源文件不存在")
        
        if not os.path.isfile(source_path):
            raise ValueError("源路径不是文件")
        
        if not os.path.exists(target_path):
            raise ValueError("目标目录不存在")
        
        if not os.path.isdir(target_path):
            raise ValueError("目标路径不是目录")
        
        # 获取文件名 - 如果提供了新文件名则使用，否则使用原文件名
        if new_filename:
            file_name = new_filename
            logger.info(f"HTTP: 使用新文件名进行移动: {new_filename}")
        else:
            file_name = os.path.basename(source_path)
        
        # 构建完整的目标文件路径
        full_target_path = os.path.join(target_path, file_name)
        
        # 移动文件（覆盖已存在的文件）
        shutil.move(source_path, full_target_path)
        logger.info(f"HTTP: 成功移动文件: {source_path} -> {full_target_path}")
        
        return web.json_response({
            "success": True, 
            "source": source_path,
            "target": full_target_path
        })
        
    except Exception as e:
        logger.error(f"HTTP: 移动文件失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_move_directory_http(data):
    """处理移动目录的HTTP请求，支持重命名操作"""
    source_path = data.get('source_path', '')
    target_path = data.get('target_path', '')
    new_name = data.get('new_name', '')
    operation_type = data.get('operation_type', '')
    
    try:
        if not validate_path(source_path):
            raise ValueError("源路径无效")
        
        if not os.path.exists(source_path):
            raise ValueError("源目录不存在")
        
        if not os.path.isdir(source_path):
            raise ValueError("源路径不是目录")
        
        # 🔥 修复：支持重命名操作
        if operation_type == 'rename' and new_name:
            # 重命名操作：target_path是父目录，new_name是新名称
            if not validate_path(target_path):
                raise ValueError("目标父目录路径无效")
            
            if not os.path.exists(target_path):
                raise ValueError("目标父目录不存在")
            
            if not os.path.isdir(target_path):
                raise ValueError("目标父目录路径不是目录")
            
            if not validate_filename(new_name):
                raise ValueError("新名称包含非法字符或为空")
            
            # 构建完整的目标路径
            full_target_path = os.path.join(target_path, new_name)
            
            # 检查新名称是否已存在
            if os.path.exists(full_target_path):
                raise ValueError("目标名称已存在")
                
            # 执行重命名
            os.rename(source_path, full_target_path)
            logger.info(f"HTTP: 成功重命名目录: {source_path} -> {full_target_path}")
            
            return web.json_response({
                "success": True, 
                "source": source_path,
                "target": full_target_path,
                "operation": "rename"
            })
        else:
            # 普通移动操作
            if not validate_path(target_path):
                raise ValueError("目标目录路径无效")
            
            if not os.path.exists(target_path):
                raise ValueError("目标目录不存在")
            
            if not os.path.isdir(target_path):
                raise ValueError("目标路径不是目录")
            
            # 获取目录名
            dir_name = os.path.basename(source_path)
            
            # 构建完整的目标目录路径
            full_target_path = os.path.join(target_path, dir_name)
            
            # 移动目录（覆盖已存在的目录）
            if os.path.exists(full_target_path):
                shutil.rmtree(full_target_path)
            shutil.move(source_path, full_target_path)
            logger.info(f"HTTP: 成功移动目录: {source_path} -> {full_target_path}")
            
            return web.json_response({
                "success": True, 
                "source": source_path,
                "target": full_target_path,
                "operation": "move"
            })
        
    except Exception as e:
        logger.error(f"HTTP: 移动目录失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_rename_http(data):
    """处理重命名的HTTP请求"""
    # 统一参数处理：支持客户端的参数格式
    source_path = data.get('source_path', '') or data.get('old_path', '')
    target_path = data.get('target_path', '')
    new_name = data.get('new_name', '')
    
    try:
        if not source_path:
            raise ValueError("源路径参数缺失")
            
        if not validate_path(source_path):
            raise ValueError("原路径无效")
        
        if not os.path.exists(source_path):
            raise ValueError("原路径不存在")
        
        # 确定最终目标路径
        if target_path:
            final_target_path = target_path
            new_name = os.path.basename(target_path)
        elif new_name:
            parent_dir = os.path.dirname(source_path)
            final_target_path = os.path.join(parent_dir, new_name)
        else:
            raise ValueError("目标路径或新名称参数缺失")
        
        if not validate_filename(new_name):
            raise ValueError("新名称包含非法字符或为空")
        
        if os.path.exists(final_target_path):
            raise ValueError("目标名称已存在")
        
        # 执行重命名
        os.rename(source_path, final_target_path)
        logger.info(f"HTTP: 成功重命名: {source_path} -> {final_target_path}")
        
        return web.json_response({
            "success": True, 
            "source_path": source_path,
            "target_path": final_target_path
        })
        
    except Exception as e:
        logger.error(f"HTTP: 重命名失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


async def _handle_check_file_exists_http(data):
    """处理检查文件是否存在的HTTP请求"""
    file_path = data.get('path', '')
    
    try:
        if not file_path:
            raise ValueError("文件路径不能为空")
        
        exists = os.path.exists(file_path) and os.path.isfile(file_path)
        logger.info(f"HTTP: 检查文件存在性: {file_path} -> {exists}")
        
        return web.json_response({
            "exists": exists
        })
        
    except Exception as e:
        logger.error(f"HTTP: 检查文件存在性失败: {str(e)}")
        return web.json_response({
            "exists": False,
            "error": str(e)
        })


async def _handle_check_directory_exists_http(data):
    """处理检查目录是否存在的HTTP请求"""
    directory_path = data.get('path', '')
    
    try:
        if not directory_path:
            raise ValueError("目录路径不能为空")
        
        exists = os.path.exists(directory_path) and os.path.isdir(directory_path)
        logger.info(f"HTTP: 检查目录存在性: {directory_path} -> {exists}")
        
        return web.json_response({
            "exists": exists
        })
        
    except Exception as e:
        logger.error(f"HTTP: 检查目录存在性失败: {str(e)}")
        return web.json_response({
            "exists": False,
            "error": str(e)
        })


async def _handle_save_workflow_http(data):
    """处理保存工作流的HTTP请求"""
    file_path = data.get('file_path', '')
    workflow_data = data.get('workflow_data', '')
    
    try:
        if not file_path:
            raise ValueError("文件路径不能为空")
        
        if not workflow_data:
            raise ValueError("工作流数据不能为空")
        
        # 确保目录存在
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # 如果workflow_data是字符串，直接写入；如果是对象，序列化为JSON
        if isinstance(workflow_data, str):
            content = workflow_data
        else:
            content = json.dumps(workflow_data, indent=2, ensure_ascii=False)
        
        # 写入文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"HTTP: 工作流保存成功: {file_path} ({len(content)} 字符)")
        
        return web.json_response({
            "success": True, 
            "file_path": file_path,
            "size": len(content)
        })
        
    except Exception as e:
        logger.error(f"HTTP: 保存工作流失败: {str(e)}")
        return web.json_response({
            "success": False, 
            "error": str(e)
        })


def register_file_operations_endpoints(app):
    """注册文件操作相关的HTTP端点"""
    try:
        logger.info(f"开始注册文件操作端点，app实例: {app}")
        
        # 注册本地文件访问端点
        app.router.add_get(HTTP_ENDPOINTS['local_files'], handle_local_files)
        logger.info(f"✅ 已注册本地文件访问端点: {HTTP_ENDPOINTS['local_files']}")
        
        # 注册文件操作端点 (支持GET和POST)
        app.router.add_get(HTTP_ENDPOINTS['file_operations'], handle_file_operations)
        app.router.add_post(HTTP_ENDPOINTS['file_operations'], handle_file_operations)
        logger.info(f"✅ 已注册文件操作端点: {HTTP_ENDPOINTS['file_operations']}")
        
        # 输出所有注册的端点信息
        logger.info(f"文件操作端点注册完成。当前router有 {len(app.router._resources)} 个资源")
        
    except Exception as e:
        logger.error(f"❌ 注册文件操作端点失败: {str(e)}")
        import traceback
        logger.error(f"详细错误信息: {traceback.format_exc()}")
