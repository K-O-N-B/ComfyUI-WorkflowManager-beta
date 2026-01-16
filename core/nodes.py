"""
NZ工作流助手 - ComfyUI节点定义模块
包含所有的ComfyUI节点类定义
"""

import os
import json
from datetime import datetime
from .logger import get_logger
from .constants import NODE_CATEGORY, SUPPORTED_WORKFLOW_EXTENSIONS


# 获取logger实例
logger = get_logger()


class NZWorkflowManagerNode:
    """工作流管理器节点 - 提供文件系统操作功能"""
    
    CATEGORY = NODE_CATEGORY
    RETURN_TYPES = ("STRING",)
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "action": (["list_directory", "load_workflow", "save_workflow"], {"default": "list_directory"}),
                "path": ("STRING", {"default": "", "multiline": False}),
                "workflow_data": ("STRING", {"default": "{}", "multiline": True})
            }
        }
    
    FUNCTION = "run"
    
    def run(self, action, path, workflow_data):
        """执行节点操作"""
        try:
            if action == "list_directory":
                return self.list_directory(path)
            elif action == "load_workflow":
                return self.load_workflow(path)
            elif action == "save_workflow":
                return self.save_workflow(path, workflow_data)
            else:
                return (f"未知操作: {action}",)
        except Exception as e:
            logger.error(f"操作失败: {str(e)}")
            return (f"操作失败: {str(e)}",)
    
    def list_directory(self, path):
        """列出目录内容"""
        try:
            if not path:
                path = os.getcwd()
            
            if not os.path.exists(path):
                return (f"目录不存在: {path}",)
            
            if not os.path.isdir(path):
                return (f"路径不是目录: {path}",)
            
            items = os.listdir(path)
            directories = []
            files = []
            
            for item in items:
                item_path = os.path.join(path, item)
                try:
                    # 获取文件/目录的修改时间
                    mtime = os.path.getmtime(item_path)
                    # 格式化为简单的日期格式 (MM/DD/YY)
                    date_str = datetime.fromtimestamp(mtime).strftime("%m/%d/%y")
                except:
                    date_str = "--/--/--"
                
                if os.path.isdir(item_path):
                    directories.append({
                        "name": item,
                        "date": date_str
                    })
                elif any(item.lower().endswith(ext) for ext in SUPPORTED_WORKFLOW_EXTENSIONS):
                    files.append({
                        "name": item,
                        "date": date_str
                    })
            
            # 按名称排序
            directories.sort(key=lambda x: x['name'])
            files.sort(key=lambda x: x['name'])
            
            result = {
                "path": path,
                "directories": directories,
                "files": files,
                "type": "directory_listing"
            }
            
            return (json.dumps(result, ensure_ascii=False),)
            
        except Exception as e:
            logger.error(f"列出目录失败: {str(e)}")
            return (f"列出目录失败: {str(e)}",)
    
    def load_workflow(self, path):
        """加载工作流文件"""
        try:
            if not path:
                return ("请提供工作流文件路径",)
            
            if not os.path.exists(path):
                return (f"文件不存在: {path}",)
            
            if not any(path.lower().endswith(ext) for ext in SUPPORTED_WORKFLOW_EXTENSIONS):
                return ("只支持JSON格式的工作流文件",)
            
            with open(path, 'r', encoding='utf-8') as f:
                workflow_data = f.read()
            
            result = {
                "path": path,
                "data": workflow_data,
                "type": "workflow_loaded"
            }
            
            return (json.dumps(result, ensure_ascii=False),)
            
        except Exception as e:
            logger.error(f"加载工作流失败: {str(e)}")
            return (f"加载工作流失败: {str(e)}",)
    
    def save_workflow(self, path, workflow_data):
        """保存工作流文件"""
        try:
            if not path:
                return ("请提供保存路径",)
            
            if not path.lower().endswith('.json'):
                path += '.json'
            
            # 确保目录存在
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            
            # 验证JSON格式
            try:
                json.loads(workflow_data)
            except json.JSONDecodeError:
                return ("工作流数据不是有效的JSON格式",)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(workflow_data)
            
            result = {
                "path": path,
                "message": "工作流保存成功",
                "type": "workflow_saved"
            }
            
            return (json.dumps(result, ensure_ascii=False),)
            
        except Exception as e:
            logger.error(f"保存工作流失败: {str(e)}")
            return (f"保存工作流失败: {str(e)}",)


class NZBaseNode:
    """基础节点 - 确保插件注册成功"""
    
    CATEGORY = NODE_CATEGORY
    RETURN_TYPES = ("STRING",)
    
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {}}
    
    FUNCTION = "run"
    
    def run(self):
        return ("⭐ NZ插件已激活",)


# 节点映射配置
NODE_CLASS_MAPPINGS = {
    "NZ_Base": NZBaseNode,
    "NZ_Workflow_Manager": NZWorkflowManagerNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "NZ_Base": "⭐ NZ工作流助手（内测版）",
    "NZ_Workflow_Manager": "📁 NZ工作流助手（内测版）"
}
