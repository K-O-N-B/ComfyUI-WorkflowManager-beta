"""
NZ工作流助手 v3.4.0 - 主入口文件
模块化架构 - 核心逻辑已拆分到 core/, handlers/, utils/ 模块
项目重新整理版本 - 优化目录结构，提升可维护性
"""

import os
import asyncio
import threading
import time
import json
from server import PromptServer

# 必须首先声明 WEB_DIRECTORY
WEB_DIRECTORY = "web"

# 导入核心模块
from .core import setup_logger, get_logger, NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
from .handlers import register_file_operations_endpoints, register_static_endpoints

# 设置日志
logger = setup_logger()

# WebSocket消息处理器（直接在__init__.py中定义以避免导入问题）
def handle_websocket_message(message_data, client_id=None):
    """处理来自前端的WebSocket消息"""
    try:
        if message_data.get("type") == "nz_workflow_manager":
            action = message_data.get("action")
            path = message_data.get("path", "")
            workflow_data = message_data.get("workflow_data", "{}")
            
            logger.info(f"收到WebSocket消息: {action} - {path}")
            
            if action == "list_directory":
                # 创建临时节点实例来执行操作
                from .core.nodes import NZWorkflowManagerNode
                node = NZWorkflowManagerNode()
                result = node.list_directory(path)
                
                # 返回WebSocket响应格式
                response = {
                    "type": "nz_workflow_manager_response",
                    "action": action,
                    "result": json.loads(result[0]) if result and result[0] else None
                }
                
                return response
            elif action == "load_workflow":
                # 创建临时节点实例来执行文件读取操作
                from .core.nodes import NZWorkflowManagerNode
                node = NZWorkflowManagerNode()
                result = node.load_workflow(path)
                
                # 返回WebSocket响应格式
                response = {
                    "type": "nz_workflow_manager_response", 
                    "action": action,
                    "result": json.loads(result[0]) if result and result[0] else None
                }
                
                return response
            elif action == "save_workflow":
                # 保存工作流操作
                file_path = message_data.get("file_path", "")
                workflow_data = message_data.get("workflow_data", "")
                
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
                        import json
                        content = json.dumps(workflow_data, indent=2, ensure_ascii=False)
                    
                    # 写入文件
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    
                    logger.info(f"工作流保存成功: {file_path} ({len(content)} 字符)")
                    
                    return {
                        "type": "nz_workflow_manager_response",
                        "action": action,
                        "result": {
                            "success": True, 
                            "file_path": file_path,
                            "size": len(content)
                        }
                    }
                    
                except Exception as e:
                    logger.error(f"保存工作流失败: {str(e)}")
                    return {
                        "type": "nz_workflow_manager_response",
                        "action": action,
                        "result": {"success": False, "error": str(e)}
                    }
            elif action == "move_file":
                # 移动文件操作
                source_path = message_data.get("source_path", "")
                target_path = message_data.get("target_path", "")
                new_filename = message_data.get("new_filename", "")
                
                try:
                    import shutil
                    from .utils.validation import validate_path
                    
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
                        logger.info(f"WebSocket: 使用新文件名进行移动: {new_filename}")
                    else:
                        file_name = os.path.basename(source_path)
                    
                    # 构建完整的目标文件路径
                    full_target_path = os.path.join(target_path, file_name)
                    
                    # 移动文件（覆盖已存在的文件）
                    shutil.move(source_path, full_target_path)
                    logger.info(f"WebSocket: 成功移动文件: {source_path} -> {full_target_path}")
                    
                    return {
                        "type": "nz_workflow_manager_response",
                        "action": action,
                        "result": {
                            "success": True, 
                            "source": source_path,
                            "target": full_target_path
                        }
                    }
                    
                except Exception as e:
                    logger.error(f"WebSocket: 移动文件失败: {str(e)}")
                    return {
                        "type": "nz_workflow_manager_response",
                        "action": action,
                        "result": {"success": False, "error": str(e)}
                    }
            elif action == "copy_file":
                # 复制文件操作
                source_path = message_data.get("source_path", "")
                target_path = message_data.get("target_path", "")
                new_name = message_data.get("new_name", "")
                
                try:
                    import shutil
                    from .utils.validation import validate_path, validate_filename
                    
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
                    logger.info(f"WebSocket: 成功复制文件: {source_path} -> {full_target_path}")
                    
                    return {
                        "type": "nz_workflow_manager_response",
                        "action": action,
                        "result": {
                            "success": True, 
                            "source": source_path,
                            "target": full_target_path
                        }
                    }
                    
                except Exception as e:
                    logger.error(f"WebSocket: 复制文件失败: {str(e)}")
                    return {
                        "type": "nz_workflow_manager_response",
                        "action": action,
                        "result": {"success": False, "error": str(e)}
                    }
            else:
                return {
                    "type": "nz_workflow_manager_response",
                    "action": action,
                    "error": f"不支持的操作: {action}"
                }
                
    except Exception as e:
        logger.error(f"处理WebSocket消息失败: {str(e)}")
        return {
            "type": "nz_workflow_manager_response",
            "action": message_data.get("action", "unknown"),
            "error": f"处理失败: {str(e)}"
        }

# 注册WebSocket消息处理器到PromptServer
def register_websocket_handler():
    """注册WebSocket消息处理器"""
    try:
        # 获取PromptServer实例
        if hasattr(PromptServer, 'instance') and PromptServer.instance:
            prompt_server = PromptServer.instance
            logger.info("已获取PromptServer实例")
            
            # 注册消息处理器
            if hasattr(prompt_server, 'add_message_handler'):
                prompt_server.add_message_handler("nz_workflow_manager", handle_websocket_message)
                logger.info("WebSocket消息处理器注册成功")
            else:
                logger.warning("PromptServer不支持add_message_handler")
                
        else:
            logger.warning("无法获取PromptServer实例，将延迟注册")
            # 延迟注册WebSocket处理器
            import threading
            import time
            
            def delayed_websocket_register():
                time.sleep(3)  # 等待3秒
                try:
                    if hasattr(PromptServer, 'instance') and PromptServer.instance:
                        prompt_server = PromptServer.instance
                        if hasattr(prompt_server, 'add_message_handler'):
                            prompt_server.add_message_handler("nz_workflow_manager", handle_websocket_message)
                            logger.info("延迟注册 - WebSocket消息处理器注册成功")
                        else:
                            logger.warning("延迟注册 - PromptServer不支持add_message_handler")
                    else:
                        logger.error("延迟注册 - 仍无法获取PromptServer实例")
                except Exception as e:
                    logger.error(f"延迟注册WebSocket处理器失败: {str(e)}")
            
            threading.Thread(target=delayed_websocket_register, daemon=True).start()
            
    except Exception as e:
        logger.error(f"注册WebSocket处理器失败: {str(e)}")


def register_http_endpoints():
    """注册HTTP端点"""
    try:
        from aiohttp import web
        
        # 获取PromptServer实例
        prompt_server = None
        if hasattr(PromptServer, 'instance'):
            prompt_server = PromptServer.instance
            logger.info(f"已获取PromptServer实例: {prompt_server}")
        
        if prompt_server and hasattr(prompt_server, 'app'):
            app = prompt_server.app
            logger.info(f"已获取PromptServer应用实例: {app}")
            
            # 注册文件操作端点
            try:
                register_file_operations_endpoints(app)
                logger.info("文件操作端点注册完成")
            except Exception as e:
                logger.error(f"文件操作端点注册失败: {str(e)}")
            
            # 注册静态文件服务端点
            try:
                register_static_endpoints(app)
                logger.info("静态文件端点注册完成")
            except Exception as e:
                logger.error(f"静态文件端点注册失败: {str(e)}")
            
            logger.info("所有HTTP端点注册流程完成")
        else:
            logger.warning("无法获取PromptServer应用实例，启动延迟注册")
            # 延迟注册
            def delayed_register():
                time.sleep(3)  # 等待3秒
                try:
                    if hasattr(PromptServer, 'instance') and PromptServer.instance:
                        app = PromptServer.instance.app
                        logger.info(f"延迟注册 - 已获取应用实例: {app}")
                        
                        # 延迟注册文件操作端点
                        try:
                            register_file_operations_endpoints(app)
                            logger.info("延迟注册 - 文件操作端点注册完成")
                        except Exception as e:
                            logger.error(f"延迟注册 - 文件操作端点注册失败: {str(e)}")
                        
                        # 延迟注册静态文件服务端点
                        try:
                            register_static_endpoints(app)
                            logger.info("延迟注册 - 静态文件端点注册完成")
                        except Exception as e:
                            logger.error(f"延迟注册 - 静态文件端点注册失败: {str(e)}")
                        
                        logger.info("延迟注册所有HTTP端点流程完成")
                    else:
                        logger.error("延迟注册失败 - 仍无法获取PromptServer实例")
                except Exception as e:
                    logger.error(f"延迟注册失败: {str(e)}")
            
            threading.Thread(target=delayed_register, daemon=True).start()
            
    except Exception as e:
        logger.error(f"注册HTTP端点失败: {str(e)}")
        logger.info("将使用其他方法访问文件系统")


# 执行注册
try:
    register_websocket_handler()
    register_http_endpoints()
except Exception as e:
    logger.error(f"插件初始化失败: {str(e)}")

# 导出所需的变量
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']
