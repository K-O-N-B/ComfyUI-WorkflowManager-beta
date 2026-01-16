"""
NZ工作流助手 - 日志配置模块
提供统一的日志配置和管理
"""

import logging
import os

# 全局logger实例
_logger = None

def setup_logger():
    """设置日志配置"""
    global _logger
    
    if _logger is not None:
        return _logger
    
    _logger = logging.getLogger("NZ工作流助手（内测版）")
    _logger.setLevel(logging.INFO)
    
    # 避免重复添加handler
    if not _logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s [NZ] %(levelname)s: %(message)s')
        handler.setFormatter(formatter)
        _logger.addHandler(handler)
    
    _logger.info("========== NZ 插件启动 ==========")
    
    # 获取插件路径信息
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web_dir = os.path.join(current_dir, "web")
    
    _logger.info("插件路径: %s", current_dir)
    _logger.info("WEB目录: %s", web_dir)
    
    # 检查并创建WEB目录
    if not os.path.exists(web_dir):
        _logger.error("WEB目录不存在，尝试创建")
        try:
            os.makedirs(web_dir)
            _logger.warning("已创建WEB目录")
        except Exception as e:
            _logger.error("创建目录失败: %s", str(e))
    
    return _logger


def get_logger():
    """获取logger实例"""
    global _logger
    if _logger is None:
        return setup_logger()
    return _logger
