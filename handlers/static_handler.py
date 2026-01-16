"""
NZ工作流助手 - 静态文件服务处理器模块
处理静态文件服务请求
"""

import os
import mimetypes
from aiohttp import web
from ..core.logger import get_logger
from ..core.constants import HTTP_ENDPOINTS
from ..utils.validation import is_safe_path


# 获取logger实例
logger = get_logger()


async def handle_static_files(request):
    """处理静态文件服务请求 - 专门用于提供web目录下的静态文件"""
    try:
        # 获取请求的文件路径
        requested_path = request.match_info.get('filepath', '')
        
        # 构建完整的文件路径 - 限制在插件的web目录内
        plugin_web_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'web')
        file_path = os.path.join(plugin_web_dir, requested_path)
        
        # 安全检查：确保路径在web目录内
        if not is_safe_path(file_path, plugin_web_dir):
            logger.warning(f"静态文件访问被拒绝 - 路径超出范围: {requested_path}")
            return web.Response(status=403, text="Forbidden")
        
        # 检查文件是否存在
        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            logger.warning(f"静态文件不存在: {file_path}")
            return web.Response(status=404, text="File not found")
        
        # 确定MIME类型
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'
        
        # 读取并返回文件内容
        with open(file_path, 'rb') as f:
            content = f.read()
        
        logger.info(f"静态文件服务成功: {requested_path} ({len(content)} bytes, {mime_type})")
        
        return web.Response(
            body=content,
            content_type=mime_type,
            headers={
                'Cache-Control': 'public, max-age=3600',  # 缓存1小时
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        logger.error(f"静态文件服务失败: {str(e)}")
        return web.Response(status=500, text=f"Internal server error: {str(e)}")


def register_static_endpoints(app):
    """注册静态文件服务端点"""
    try:
        logger.info(f"开始注册静态文件端点，app实例: {app}")
        
        # 注册静态文件服务端点 - 使用通配符匹配任意路径
        static_route = HTTP_ENDPOINTS['static_files'] + '/{filepath:.*}'
        app.router.add_get(static_route, handle_static_files)
        logger.info(f"✅ 已注册静态文件服务端点: {static_route}")
        
        # 验证web目录是否存在
        plugin_web_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'web')
        if os.path.exists(plugin_web_dir):
            logger.info(f"✅ web目录存在: {plugin_web_dir}")
            # 列出web目录中的文件
            web_files = os.listdir(plugin_web_dir)
            logger.info(f"web目录文件: {web_files}")
        else:
            logger.warning(f"⚠️ web目录不存在: {plugin_web_dir}")
        
    except Exception as e:
        logger.error(f"❌ 注册静态文件端点失败: {str(e)}")
        import traceback
        logger.error(f"详细错误信息: {traceback.format_exc()}")
