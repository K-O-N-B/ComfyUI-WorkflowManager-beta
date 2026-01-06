/**
 * NZ工作流管理器 - 交互系统模块
 * 
 * 功能范围:
 * - 右键上下文菜单系统
 * - 对话框管理器
 * - 冲突处理对话框
 * - 多选管理器
 * 
 * 第六阶段模块化 - 零停机重构
 * 创建时间: 2025年1月2日
 */

// ====== 目录历史记录管理器 ======
class DirectoryHistory {
  constructor() {
    this.storageKey = 'nz_directory_history';
    this.maxHistorySize = 10; // 最多保存10个历史目录
  }
  
  // 获取历史目录列表
  getHistory() {
    try {
      const history = localStorage.getItem(this.storageKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('读取目录历史失败:', error);
      return [];
    }
  }
  
  // 添加目录到历史记录
  addDirectory(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') return;
    
    try {
      let history = this.getHistory();
      
      // 移除已存在的相同路径
      history = history.filter(item => item.path !== dirPath);
      
      // 添加到开头
      const dirName = dirPath.split('\\').pop() || dirPath.split('/').pop() || dirPath;
      history.unshift({
        path: dirPath,
        name: dirName,
        timestamp: Date.now()
      });
      
      // 限制历史记录数量
      if (history.length > this.maxHistorySize) {
        history = history.slice(0, this.maxHistorySize);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('保存目录历史失败:', error);
    }
  }
  
  // 清除历史记录
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('清除目录历史失败:', error);
    }
  }
  
  // 获取格式化的历史目录列表（用于菜单显示）
  getFormattedHistory() {
    const history = this.getHistory();
    return history.map(item => ({
      name: `🕒 ${item.name}`,
      path: item.path,
      isHistory: true
    }));
  }
}

// ====== 右键上下文菜单系统 (v3.0.0新增) ======

// 上下文菜单管理器
class ContextMenuManager {
  constructor() {
    this.currentMenu = null;
    this.directoryCache = new Map(); // 缓存目录列表
    this.fileOperationsAPI = null; // 将在初始化时设置
    this.communicationAPI = null; // 模块化的通信API
    this.config = null; // 配置对象，将在初始化时设置
    this.directoryHistory = new DirectoryHistory(); // 目录历史管理器
    this.setupGlobalListeners();
  }
  
  // 设置全局监听器
  setupGlobalListeners() {
    // 点击其他地方关闭菜单
    document.addEventListener('click', (e) => {
      if (this.currentMenu && !this.currentMenu.contains(e.target)) {
        this.hideMenu();
      }
    });
    
    // ESC键关闭菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentMenu) {
        this.hideMenu();
      }
    });
    
    // 滚动时关闭菜单
    document.addEventListener('scroll', () => {
      if (this.currentMenu) {
        this.hideMenu();
      }
    });
  }
  
  // 清理缓存的方法
  clearDirectoryCache(path = null) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    if (path) {
      // 清理特定路径的缓存
      this.directoryCache.delete(path);
      // 也清理可能包含这个路径的父目录缓存
      for (const [cachedPath] of this.directoryCache) {
        if (cachedPath.includes(path) || path.includes(cachedPath)) {
          this.directoryCache.delete(cachedPath);
        }
      }
      console.log(`[${pluginName}] 已清理路径相关缓存: ${path}`);
    } else {
      // 清理所有缓存
      this.directoryCache.clear();
      console.log(`[${pluginName}] 已清理所有目录缓存`);
    }
  }

  // 获取目录列表（用于子菜单）
  async getDirectoryList(rootPath = null) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    // 获取基础路径，优先级：传入参数 > 当前路径 > 默认目录 > 配置的路径
    let basePath = rootPath;
    if (!basePath) {
      basePath = window.currentPath || 
                 window.defaultDirectory || 
                 (window.config ? window.config.getCurrentPath() : '') ||
                 (window.nzWorkflowManager && window.nzWorkflowManager.config ? window.nzWorkflowManager.config.getDefaultDirectory() : '');
    }
    
    // 确保basePath不为空
    if (!basePath || basePath.trim() === '') {
      console.warn(`[${pluginName}] 基础路径为空，使用根目录和历史目录`);
      return this.addSpecialDirectories([]);
    }
    
    console.log(`[${pluginName}] 获取目录列表，基础路径: ${basePath}`);
    
    // 检查缓存
    if (this.directoryCache.has(basePath)) {
      const cached = this.directoryCache.get(basePath);
      // 缓存2分钟（缩短缓存时间，减少不一致风险）
      if (Date.now() - cached.timestamp < 2 * 60 * 1000) {
        console.log(`[${pluginName}] 使用缓存的目录列表`);
        return this.addSpecialDirectories(cached.directories);
      }
    }
    
    try {
      // 使用现有的目录加载逻辑
      const result = await this.loadDirectoriesForMenu(basePath);
      
      // 缓存结果
      this.directoryCache.set(basePath, {
        directories: result,
        timestamp: Date.now()
      });
      
      return this.addSpecialDirectories(result);
    } catch (error) {
      console.error(`[${pluginName}] 获取目录列表失败:`, error);
      return this.addSpecialDirectories([]);
    }
  }
  
  // 添加特殊目录（根目录和历史目录）
  addSpecialDirectories(directories) {
    const specialDirectories = [];
    
    // 添加根目录
    const defaultDir = window.defaultDirectory || (window.config ? window.config.getDefaultDirectory() : '');
    if (defaultDir) {
      specialDirectories.push({
        name: '🏠 根目录',
        path: defaultDir,
        isRoot: true
      });
    }
    
    // 添加历史目录
    const historyDirectories = this.directoryHistory.getFormattedHistory();
    specialDirectories.push(...historyDirectories);
    
    // 如果有特殊目录，添加分隔符
    if (specialDirectories.length > 0 && directories.length > 0) {
      specialDirectories.push({ separator: true });
    }
    
    // 合并所有目录
    return [...specialDirectories, ...directories];
  }
  
  // 记录目录访问历史
  recordDirectoryVisit(dirPath) {
    if (dirPath && typeof dirPath === 'string') {
      this.directoryHistory.addDirectory(dirPath);
      console.log(`[${window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器'}] 记录目录访问: ${dirPath}`);
    }
  }
  
  // 为菜单加载目录（简化版本的loadDirectory）
  async loadDirectoriesForMenu(dirPath) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 🔍 加载目录菜单: ${dirPath}`);
    try {
      // 使用正确的/file_operations端点
      const response = await fetch(`${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(dirPath)}`);
      console.log(`[${pluginName}] 📡 HTTP请求状态: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[${pluginName}] 📋 服务器返回数据:`, data);
        
        // 处理不同的数据格式
        let directories = [];
        
        if (data.success && data.directories) {
          // HTTP端点成功响应格式
          directories = data.directories;
        } else if (data.directories) {
          // 直接的目录列表格式
          directories = data.directories;
        } else if (data.type === "directory_listing" && data.directories) {
          // WebSocket响应格式
          directories = data.directories;
        }
        
        // 确保directories是数组，并转换为对象格式
        if (Array.isArray(directories)) {
          console.log(`[${pluginName}] 📁 解析目录数组:`, directories);
          const processedDirs = directories.map(dir => {
            // 处理字符串格式的目录名
            const dirName = typeof dir === 'string' ? dir : (dir.name || dir);
            return {
              name: dirName,
              path: dirPath ? `${dirPath}\\${dirName}` : dirName
            };
          });
          console.log(`[${pluginName}] ✅ 处理后的目录列表:`, processedDirs);
          return processedDirs;
        } else {
          console.warn(`[${pluginName}] ⚠️ directories不是数组:`, directories);
        }
      }
    } catch (error) {
      console.log(`[${pluginName}] HTTP端点失败，尝试WebSocket`);
    }
    
    // 如果HTTP失败，返回常用目录
    return [
      { name: '🏠 根目录', path: window.defaultDirectory || '' }
    ];
  }
  
  // 显示文件右键菜单
  async showFileContextMenu(event, filePath, fileName) {
    event.preventDefault();
    
    // 获取目录列表用于子菜单
    const directories = await this.getDirectoryList();
    
    // 检查是否有备注
    const hasNote = window.workflowNotesManager ? window.workflowNotesManager.hasNote(filePath) : false;
    
    const menuItems = [
      { 
        label: '📄 加载工作流', 
        action: () => {
          this.hideMenu();
          if (window.loadWorkflow) {
            window.loadWorkflow(filePath);
          }
        }
      },
      { separator: true },
      {
        label: '📝 管理备注',
        submenu: [
          {
            label: hasNote ? '✏️ 编辑备注' : '📝 添加备注',
            action: () => {
              this.hideMenu();
              if (window.nzWorkflowManager && window.nzWorkflowManager.openNoteEditor) {
                window.nzWorkflowManager.openNoteEditor(filePath);
              }
            }
          },
          ...(hasNote ? [
            {
              label: '🗑️ 删除备注',
              action: () => {
                this.hideMenu();
                if (window.nzWorkflowManager && window.nzWorkflowManager.deleteWorkflowNote) {
                  window.nzWorkflowManager.deleteWorkflowNote(filePath);
                }
              },
              className: 'danger'
            }
          ] : [])
        ]
      },
      { separator: true },
      {
        label: '🎨 自定义图标',
        submenu: [
          {
            label: '🖼️ 设置图标',
            action: () => {
              this.hideMenu();
              // 确保CustomIconManager可用
              const iconManager = (window.nzWorkflowManager && window.nzWorkflowManager.ensureCustomIconManager) 
                ? window.nzWorkflowManager.ensureCustomIconManager()
                : (window.nzWorkflowManager && window.nzWorkflowManager.CustomIconManager)
                  ? window.nzWorkflowManager.CustomIconManager
                  : window.CustomIconManager;
                  
              if (iconManager && iconManager.showIconSelectorDialog) {
                iconManager.showIconSelectorDialog(filePath, fileName);
              } else {
                console.warn('[NZWorkflowManager] CustomIconManager未找到，设置图标功能不可用');
                if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
                  window.nzWorkflowManager.showNotification('设置图标功能暂不可用', 'warning');
                }
              }
            }
          },
          {
            label: '🔄 重置为默认',
            action: () => {
              this.hideMenu();
              // 确保CustomIconManager可用
              const iconManager = (window.nzWorkflowManager && window.nzWorkflowManager.ensureCustomIconManager) 
                ? window.nzWorkflowManager.ensureCustomIconManager()
                : (window.nzWorkflowManager && window.nzWorkflowManager.CustomIconManager)
                  ? window.nzWorkflowManager.CustomIconManager
                  : window.CustomIconManager;
                  
              if (iconManager && iconManager.removeCustomIcon) {
                iconManager.removeCustomIcon(filePath);
                if (window.nzWorkflowManager) {
                  window.nzWorkflowManager.showNotification(`已重置 ${fileName} 的图标`, 'success');
                }
                // 刷新当前目录
                const currentPath = this.config?.getCurrentPath?.() || window.nzWorkflowManager?.config?.getCurrentPath?.();
                if (currentPath) {
                  console.log(`[NZWorkflowManager] 图标重置成功，刷新目录: ${currentPath}`);
                  if (typeof window.loadDirectory === 'function') {
                    window.loadDirectory(currentPath);
                  } else if (typeof loadDirectory === 'function') {
                    loadDirectory(currentPath);
                  }
                }
              }
            }
          }
        ]
      },
      { separator: true },
      { 
        label: '✏️ 重命名文件', 
        action: () => {
          this.hideMenu();
          this.renameFile(filePath, fileName);
        }
      },
      { 
        label: '📋 复制工作流副本', 
        action: () => {
          this.hideMenu();
          this.copyWorkflow(filePath, fileName);
        }
      },
      { 
        label: '🚀 移动到',
        submenu: [
          {
            label: '📁 选择其他目录...',
            action: () => {
              this.moveItem(filePath, fileName, 'file');
            }
          },
          { separator: true },
          ...directories.slice(0, 8).map(dir => ({
            label: `📁 ${dir.name}`,
            action: () => {
              this.hideMenu();
              this.moveItemToPath(filePath, fileName, dir.path);
            }
          }))
        ]
      },
      { 
        label: '📁 复制到',
        submenu: [
          {
            label: '📁 选择其他目录...',
            action: () => {
              this.hideMenu();
              this.copyItem(filePath, fileName, 'file');
            }
          },
          { separator: true },
          ...directories.slice(0, 8).map(dir => ({
            label: `📁 ${dir.name}`,
            action: () => {
              this.hideMenu();
              this.copyItemToPath(filePath, fileName, dir.path);
            }
          }))
        ]
      },
      { separator: true },
      { 
        label: '🗑️ 删除工作流', 
        action: () => {
          this.hideMenu();
          this.deleteItem(filePath, fileName, 'file');
        },
        className: 'danger'
      }
    ];
    
    this.showMenu(event, menuItems);
  }
  
  // 显示目录右键菜单
  async showDirectoryContextMenu(event, dirPath, dirName) {
    event.preventDefault();
    
    // 获取目录列表用于子菜单
    const directories = await this.getDirectoryList();
    
    const menuItems = [
      { 
        label: '📂 打开目录', 
        action: () => {
          this.hideMenu();
          if (window.loadDirectory) {
            window.loadDirectory(dirPath);
          }
        }
      },
      { separator: true },
      { 
        label: '✏️ 重命名目录', 
        action: () => {
          this.hideMenu();
          this.renameDirectory(dirPath, dirName);
        }
      },
      { separator: true },
      { 
        label: '📁 新建文件夹', 
        action: () => {
          this.hideMenu();
          if (window.createNewFolder) {
            window.createNewFolder(dirPath);
          }
        }
      },
      { separator: true },
      { 
        label: '🚀 移动到',
        submenu: [
          {
            label: '📁 选择其他目录...',
            action: () => {
              this.moveItem(dirPath, dirName, 'directory');
            }
          },
          { separator: true },
          ...directories.filter(dir => dir.path !== dirPath).slice(0, 8).map(dir => ({
            label: `📁 ${dir.name}`,
            action: () => {
              this.hideMenu();
              this.moveItemToPath(dirPath, dirName, dir.path);
            }
          }))
        ]
      },
      { 
        label: '📁 复制到',
        submenu: [
          {
            label: '📁 选择其他目录...',
            action: () => {
              this.hideMenu();
              this.copyItem(dirPath, dirName, 'directory');
            }
          },
          { separator: true },
          ...directories.filter(dir => dir.path !== dirPath).slice(0, 8).map(dir => ({
            label: `📁 ${dir.name}`,
            action: () => {
              this.hideMenu();
              this.copyItemToPath(dirPath, dirName, dir.path);
            }
          }))
        ]
      },
      { separator: true },
      { 
        label: '🗑️ 删除目录', 
        action: () => {
          this.hideMenu();
          this.deleteItem(dirPath, dirName, 'directory');
        },
        className: 'danger'
      }
    ];
    
    this.showMenu(event, menuItems);
  }
  
  // 显示空白区域右键菜单
  showEmptyAreaContextMenu(event, currentPath) {
    event.preventDefault();
    
    const menuItems = [
      { 
        label: '🔄 刷新', 
        action: () => {
          this.hideMenu();
          // 安全获取当前路径和刷新函数
          const config = this.config || window.config || window.nzWorkflowManager?.config;
          const pathToRefresh = config?.getCurrentPath?.() || currentPath;
          
          if (pathToRefresh && typeof window.loadDirectory === 'function') {
            console.log(`[${config?.PLUGIN_NAME || 'NZWorkflowManager'}] 刷新目录: ${pathToRefresh}`);
            window.loadDirectory(pathToRefresh);
          } else if (pathToRefresh && typeof loadDirectory === 'function') {
            console.log(`[${config?.PLUGIN_NAME || 'NZWorkflowManager'}] 刷新目录: ${pathToRefresh}`);
            loadDirectory(pathToRefresh);
          } else {
            console.warn(`[${config?.PLUGIN_NAME || 'NZWorkflowManager'}] 无法刷新目录，loadDirectory函数或当前路径不可用`);
          }
        }
      },
      { separator: true },
      { 
        label: '📁 新建文件夹', 
        action: () => {
          this.hideMenu();
          // 安全获取当前路径
          const config = this.config || window.config || window.nzWorkflowManager?.config;
          const pathForNewFolder = config?.getCurrentPath?.() || currentPath;
          
          if (pathForNewFolder) {
            this.createDirectory(pathForNewFolder);
          } else {
            console.warn(`[${config?.PLUGIN_NAME || 'NZWorkflowManager'}] 无法创建文件夹，当前路径不可用`);
          }
        }
      }
    ];
    
    this.showMenu(event, menuItems);
  }

  // 创建目录方法
  async createDirectory(parentPath) {
    const directoryName = await window.dialogManager.showInputDialog(
      '新建文件夹', 
      '请输入文件夹名称',
      '新建文件夹'
    );
    
    if (directoryName && directoryName.trim()) {
      try {
        // 检查 fileOperationsAPI 是否可用
        if (!this.fileOperationsAPI) {
          // 尝试从全局获取
          this.fileOperationsAPI = window.fileOperationsAPI;
        }
        
        if (!this.fileOperationsAPI) {
          throw new Error('文件操作API不可用，请稍后重试');
        }
        
        window.nzWorkflowManager.showNotification('正在创建文件夹...', 'info');
        const result = await this.fileOperationsAPI.createDirectory(parentPath, directoryName.trim());
        
        if (result && result.success) {
          window.nzWorkflowManager.showNotification('文件夹创建成功', 'success');
          // 刷新当前目录
          if (window.loadDirectory && this.config) {
            window.loadDirectory(this.config.getCurrentPath());
          }
        } else {
          window.nzWorkflowManager.showNotification(`创建失败: ${result?.error || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error(`[NZWorkflowManager] 创建目录失败:`, error);
        window.nzWorkflowManager.showNotification(`创建失败: ${error.message}`, 'error');
      }
    }
  }

  // 简化的路径验证方法
  async validateAndRecoverPath(dirPath, currentName) {
    try {
      console.log(`[NZ工作流管理器] 开始路径验证: ${dirPath} (目录名: ${currentName})`);
      
      // 彻底标准化路径分隔符：先处理双反斜杠，再处理正斜杠
      const normalizedPath = dirPath.replace(/\\\\/g, '\\').replace(/\//g, '\\');
      
      // 注意：原子性重命名不再需要预验证
      // 直接返回标准化路径，让原子性操作处理验证和恢复
      console.log(`[NZ工作流管理器] 返回标准化路径用于原子性操作: ${normalizedPath}`);
      return normalizedPath;
      
    } catch (error) {
      console.error(`[NZ工作流管理器] 路径验证失败:`, error);
      return null;
    }
  }

  // 重命名目录方法
  async renameDirectory(dirPath, currentName) {
    try {
      // 首先强制刷新UI路径属性，确保获取最新的状态
      if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
        window.nzWorkflowManager.refreshAllPathAttributes();
      }
      
      // 智能路径验证和恢复
      let validDirPath = await this.validateAndRecoverPath(dirPath, currentName);
      if (!validDirPath) {
        window.nzWorkflowManager.showNotification(`重命名失败: 找不到目录 "${currentName}"`, 'error');
        return;
      }
      
      console.log(`[NZ工作流管理器] 使用验证后的路径: ${validDirPath}`);

      const newName = await window.dialogManager.showInputDialog(
        '重命名目录', 
        '请输入新的目录名称：',
        currentName
      );
      
      if (newName && newName.trim() && newName.trim() !== currentName) {
        // 🔥 关键修复：在重命名前清理所有相关缓存，确保获取最新状态
        console.log(`[NZ工作流管理器] 🗑️ 重命名前清理缓存以确保状态同步`);
        this.clearDirectoryCache(); // 清理所有缓存确保获取最新状态
        
        // 检查 communicationAPI 是否可用
        if (!this.communicationAPI) {
          this.communicationAPI = window.communicationAPI;
        }
        
        if (!this.communicationAPI && !this.fileOperationsAPI) {
          // 尝试从全局获取
          this.fileOperationsAPI = window.fileOperationsAPI;
        }
        
        if (!this.communicationAPI && !this.fileOperationsAPI) {
          throw new Error('文件操作API不可用，请稍后重试');
        }
        
        // 显示进度提示
        this.showProgressIndicator('重命名', currentName);
        window.nzWorkflowManager.showNotification('正在重命名目录...', 'info');
        
        // 构建新路径
        const parentPath = validDirPath.substring(0, validDirPath.lastIndexOf('\\'));
        const newPath = parentPath + '\\' + newName.trim();
        
        let result;
        // 优先使用communicationAPI的重命名功能
        if (this.communicationAPI && this.communicationAPI.renameDirectory) {
          result = await this.communicationAPI.renameDirectory(validDirPath, newName.trim());
        } else if (this.communicationAPI && this.communicationAPI.moveDirectory) {
          // 使用移动作为重命名的替代方案 - 传递userChoice='replace'避免冲突检测
          result = await this.communicationAPI.moveDirectory(validDirPath, parentPath, newName.trim(), 'replace');
        } else if (this.fileOperationsAPI && this.fileOperationsAPI.renameDirectory) {
          result = await this.fileOperationsAPI.renameDirectory(validDirPath, newName.trim());
        } else if (this.fileOperationsAPI && this.fileOperationsAPI.moveDirectory) {
          // 使用移动作为重命名的替代方案
          result = await this.fileOperationsAPI.moveDirectory(validDirPath, newPath);
        } else {
          throw new Error('没有可用的重命名或移动API');
        }
        
        if (result && result.success) {
          this.hideProgressIndicator();
          window.nzWorkflowManager.showNotification(`目录重命名成功: ${currentName} → ${newName.trim()}`, 'success');
          
          // 清理与该路径相关的所有缓存
          this.clearDirectoryCache(validDirPath);
          this.clearDirectoryCache(newPath);
          this.clearDirectoryCache(); // 清理所有缓存确保同步
          
          // 刷新当前目录并更新路径信息
          if (window.loadDirectory && this.config) {
            window.loadDirectory(this.config.getCurrentPath());
            
            // 延迟刷新路径属性，确保重命名后的路径信息正确
            setTimeout(() => {
              if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
                window.nzWorkflowManager.refreshAllPathAttributes();
              }
            }, 500);
          }
        } else {
          this.hideProgressIndicator();
          window.nzWorkflowManager.showNotification(`重命名失败: ${result?.error || '未知错误'}`, 'error');
        }
      } else if (newName && newName.trim() === currentName) {
        window.nzWorkflowManager.showNotification('目录名称未更改', 'info');
      }
    } catch (error) {
      this.hideProgressIndicator();
      console.error(`[${this.pluginName}] 重命名目录失败:`, error);
      window.nzWorkflowManager.showNotification(`重命名失败: ${error.message}`, 'error');
    }
  }

  // 重命名文件方法
  async renameFile(filePath, currentName) {
    try {
      // 首先强制刷新UI路径属性，确保获取最新的状态
      if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
        window.nzWorkflowManager.refreshAllPathAttributes();
      }
      
      // 智能路径验证和恢复
      let validFilePath = await this.validateAndRecoverPath(filePath, currentName);
      if (!validFilePath) {
        window.nzWorkflowManager.showNotification(`重命名失败: 找不到文件 "${currentName}"`, 'error');
        return;
      }
      
      console.log(`[NZ工作流管理器] 使用验证后的路径: ${validFilePath}`);

      // 获取文件的扩展名
      const lastDotIndex = currentName.lastIndexOf('.');
      const fileNameWithoutExt = lastDotIndex > 0 ? currentName.substring(0, lastDotIndex) : currentName;
      const fileExtension = lastDotIndex > 0 ? currentName.substring(lastDotIndex) : '';

      const newName = await window.dialogManager.showInputDialog(
        '重命名文件', 
        '请输入新的文件名称（不含扩展名）：',
        fileNameWithoutExt
      );
      
      if (newName && newName.trim() && newName.trim() !== fileNameWithoutExt) {
        // 🔥 关键修复：在重命名前清理所有相关缓存，确保获取最新状态
        console.log(`[NZ工作流管理器] 🗑️ 文件重命名前清理缓存以确保状态同步`);
        this.clearDirectoryCache(); // 清理所有缓存确保获取最新状态
        
        // 验证文件名是否有效
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(newName.trim())) {
          window.nzWorkflowManager.showNotification('文件名不能包含以下字符: < > : " / \\ | ? *', 'error');
          return;
        }
        
        // 显示进度提示
        this.showProgressIndicator('重命名', currentName);
        window.nzWorkflowManager.showNotification('正在重命名文件...', 'info');
        
        // 构建新的完整文件名（含扩展名）
        const newFullName = newName.trim() + fileExtension;
        
        // 计算目标路径
        const parentPath = validFilePath.substring(0, validFilePath.lastIndexOf('\\'));
        const targetPath = parentPath + '\\' + newFullName;
        
        let result;
        // 优先使用communicationAPI的moveFile功能实现重命名
        if (this.communicationAPI && this.communicationAPI.moveFile) {
          // 传递userChoice='replace'避免冲突检测，并指定新文件名
          const choice = { action: 'rename', newName: newName.trim() };
          result = await this.communicationAPI.moveFile(validFilePath, parentPath, choice);
        } else if (this.fileOperationsAPI && this.fileOperationsAPI.renameFile) {
          result = await this.fileOperationsAPI.renameFile(validFilePath, newFullName);
        } else if (this.fileOperationsAPI && this.fileOperationsAPI.moveFile) {
          // 使用移动作为重命名的替代方案
          result = await this.fileOperationsAPI.moveFile(validFilePath, targetPath);
        } else {
          throw new Error('没有可用的重命名或移动API');
        }
        
        if (result && result.success) {
          this.hideProgressIndicator();
          window.nzWorkflowManager.showNotification(`文件重命名成功: ${currentName} → ${newFullName}`, 'success');
          
          // 清理与该路径相关的所有缓存
          this.clearDirectoryCache(validFilePath);
          this.clearDirectoryCache(targetPath);
          this.clearDirectoryCache(); // 清理所有缓存确保同步
          
          // 刷新当前目录并更新路径信息
          if (window.loadDirectory && this.config) {
            window.loadDirectory(this.config.getCurrentPath());
            
            // 延迟刷新路径属性，确保重命名后的路径信息正确
            setTimeout(() => {
              if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
                window.nzWorkflowManager.refreshAllPathAttributes();
              }
            }, 500);
          }
        } else {
          this.hideProgressIndicator();
          window.nzWorkflowManager.showNotification(`重命名失败: ${result?.error || '未知错误'}`, 'error');
        }
      } else if (newName && newName.trim() === fileNameWithoutExt) {
        window.nzWorkflowManager.showNotification('文件名称未更改', 'info');
      }
    } catch (error) {
      this.hideProgressIndicator();
      console.error(`[${this.pluginName}] 重命名文件失败:`, error);
      window.nzWorkflowManager.showNotification(`重命名失败: ${error.message}`, 'error');
    }
  }

  // 移动项目方法
  async moveItem(itemPath, itemName, itemType) {
    const targetPath = await this.showDirectorySelector('选择移动目标目录', '请选择要移动到的目录：');
    if (targetPath) {
      this.moveItemToPath(itemPath, itemName, targetPath);
    }
  }

  // 复制项目方法  
  async copyItem(itemPath, itemName, itemType) {
    const targetPath = await this.showDirectorySelector('选择复制目标目录', '请选择要复制到的目录：');
    if (targetPath) {
      this.copyItemToPath(itemPath, itemName, targetPath);
    }
  }

  // 检查路径是否为目录
  async isDirectoryPath(path) {
    try {
      // 优先使用模块化的通信API获取准确的路径信息
      if (this.communicationAPI && this.communicationAPI.getPathInfo) {
        const pathInfo = await this.communicationAPI.getPathInfo(path);
        if (pathInfo.exists) {
          return pathInfo.isDirectory;
        }
        
        // 如果路径不存在，使用扩展名进行启发式判断
        return !/\.[^/.]+$/.test(path);
      }
      
      // 降级：使用旧的pathExists方法配合扩展名检查
      if (this.communicationAPI && this.communicationAPI.pathExists) {
        // 简单的启发式检查：没有扩展名的路径通常是目录
        return !/\.[^/.]+$/.test(path);
      }
      
      // 最后降级：使用文件操作API
      if (this.fileOperationsAPI && this.fileOperationsAPI.pathExists) {
        try {
          const exists = await this.fileOperationsAPI.pathExists(path);
          if (!exists) {
            // 路径不存在，使用启发式判断
            return !/\.[^/.]+$/.test(path);
          }
          
          // 路径存在但不知道类型，使用启发式判断
          return !/\.[^/.]+$/.test(path);
        } catch (error) {
          console.warn(`[${this.pluginName || 'ContextMenuManager'}] pathExists检查失败:`, error);
          return !/\.[^/.]+$/.test(path);
        }
      }
      
      // 最终降级：纯启发式检查
      return !/\.[^/.]+$/.test(path);
    } catch (error) {
      console.error(`[${this.pluginName || 'ContextMenuManager'}] isDirectoryPath检查失败:`, error);
      // 默认使用启发式方法：没有扩展名的路径通常是目录
      return !/\.[^/.]+$/.test(path);
    }
  }

  // 移动到指定路径
  async moveItemToPath(itemPath, itemName, targetPath) {
    try {
      // 防重复操作检查
      const operationKey = `move_${itemPath}_${targetPath}`;
      if (window.nzWorkflowManager && 
          window.nzWorkflowManager.interactionSystem && 
          window.nzWorkflowManager.interactionSystem.operationInProgress.has(operationKey)) {
        console.log(`[NZ工作流管理器] 跳过重复的移动操作: ${itemName}`);
        return { success: false, error: '操作正在进行中' };
      }
      
      // 标记操作开始
      if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
        window.nzWorkflowManager.interactionSystem.operationInProgress.add(operationKey);
      }
      
      // 显示进度提示
      this.showProgressIndicator('移动', itemName);
      window.nzWorkflowManager.showNotification('正在移动...', 'info');
      
      // 首先检查源路径是否存在
      try {
        let pathExists = false;
        if (this.communicationAPI && this.communicationAPI.pathExists) {
          pathExists = await this.communicationAPI.pathExists(itemPath);
        } else if (window.fileOperationsAPI && window.fileOperationsAPI.pathExists) {
          pathExists = await window.fileOperationsAPI.pathExists(itemPath);
        }
        
        if (!pathExists) {
          console.warn(`[${this.pluginName}] 源路径不存在，可能已被移动: ${itemPath}`);
          window.nzWorkflowManager.showNotification('文件或目录已被移动或不存在', 'warning');
          // 刷新当前目录以同步UI状态
          if (window.loadDirectory && this.config) {
            window.loadDirectory(this.config.getCurrentPath());
          }
          return { success: false, error: '源路径不存在' };
        }
      } catch (pathCheckError) {
        console.warn(`[${this.pluginName}] 无法检查源路径存在性，继续移动操作:`, pathCheckError);
      }
      
      // 检查路径类型并调用相应API - 优先使用模块化communicationAPI
      let result;
      try {
        const isDirectory = await this.isDirectoryPath(itemPath);
        
        // 优先使用模块化的communicationAPI
        if (this.communicationAPI) {
          if (isDirectory) {
            result = await this.communicationAPI.moveDirectory(itemPath, targetPath);
          } else {
            result = await this.communicationAPI.moveFile(itemPath, targetPath);
          }
        } else if (window.fileOperationsAPI) {
          // 降级到全局fileOperationsAPI
          if (isDirectory) {
            result = await window.fileOperationsAPI.moveDirectory(itemPath, targetPath);
          } else {
            result = await window.fileOperationsAPI.moveFile(itemPath, targetPath);
          }
        } else {
          throw new Error('没有可用的文件操作API');
        }
      } catch (error) {
        console.error(`[${this.pluginName}] 移动操作失败:`, error);
        // 最后的降级尝试：默认使用moveFile
        if (this.communicationAPI) {
          result = await this.communicationAPI.moveFile(itemPath, targetPath);
        } else if (window.fileOperationsAPI) {
          result = await window.fileOperationsAPI.moveFile(itemPath, targetPath);
        } else {
          throw new Error('所有API都不可用');
        }
      }
      
      if (result && result.success) {
        this.hideProgressIndicator();
        window.nzWorkflowManager.showNotification(`成功移动到 ${targetPath}`, 'success');
        if (window.loadDirectory && this.config) {
          window.loadDirectory(this.config.getCurrentPath());
        }
      } else {
        this.hideProgressIndicator();
        // 检查是否是用户取消操作
        if (result && result.error && (result.error.includes('用户已取消操作') || 
                                     result.error.includes('用户选择取消') ||
                                     result.error.includes('用户选择skip') ||
                                     result.error.includes('用户选择cancel'))) {
          console.log(`[NZWorkflowManager] 用户取消了移动操作`);
          // 立即清除进度通知
          if (window.nzWorkflowManager && window.nzWorkflowManager.uiManager && 
              typeof window.nzWorkflowManager.uiManager.clearAllNotifications === 'function') {
            window.nzWorkflowManager.uiManager.clearAllNotifications();
          }
          window.nzWorkflowManager.showNotification('移动已取消', 'info');
          return;
        }
        window.nzWorkflowManager.showNotification(`移动失败: ${result?.error || '未知错误'}`, 'error');
      }
    } catch (error) {
      this.hideProgressIndicator();
      console.error(`[NZWorkflowManager] 移动失败:`, error);
      window.nzWorkflowManager.showNotification(`移动失败: ${error.message}`, 'error');
    } finally {
      // 清理操作标记
      const operationKey = `move_${itemPath}_${targetPath}`;
      if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
        window.nzWorkflowManager.interactionSystem.operationInProgress.delete(operationKey);
      }
    }
  }

  // 复制到指定路径
  async copyItemToPath(itemPath, itemName, targetPath) {
    try {
      // 显示进度提示
      this.showProgressIndicator('复制', itemName);
      window.nzWorkflowManager.showNotification('正在复制...', 'info');
      
      // 检查源路径是文件还是目录
      const isDirectory = await this.isDirectoryPath(itemPath);
      let result;
      
      // 优先使用模块化的通信API
      if (this.communicationAPI) {
        if (isDirectory) {
          result = await this.communicationAPI.copyDirectory(itemPath, targetPath);
        } else {
          result = await this.communicationAPI.copyFile(itemPath, targetPath);
        }
      } else if (this.fileOperationsAPI) {
        // 降级到文件操作API
        if (isDirectory) {
          result = await this.fileOperationsAPI.copyDirectory(itemPath, targetPath);
        } else {
          result = await this.fileOperationsAPI.copyFile(itemPath, targetPath);
        }
      } else {
        throw new Error('没有可用的文件操作API');
      }
      
      if (result && result.success) {
        this.hideProgressIndicator();
        const itemType = isDirectory ? '目录' : '文件';
        window.nzWorkflowManager.showNotification(`成功复制${itemType}到 ${targetPath}`, 'success');
        if (window.loadDirectory && this.config) {
          window.loadDirectory(this.config.getCurrentPath());
        }
      } else {
        this.hideProgressIndicator();
        // 检查是否是用户取消操作
        if (result && result.error && (result.error.includes('用户已取消操作') || 
                                     result.error.includes('用户选择取消') ||
                                     result.error.includes('用户选择skip') ||
                                     result.error.includes('用户选择cancel'))) {
          console.log(`[NZWorkflowManager] 用户取消了复制操作`);
          // 立即清除进度通知
          if (window.nzWorkflowManager && window.nzWorkflowManager.uiManager && 
              typeof window.nzWorkflowManager.uiManager.clearAllNotifications === 'function') {
            window.nzWorkflowManager.uiManager.clearAllNotifications();
          }
          window.nzWorkflowManager.showNotification('复制已取消', 'info');
          return;
        }
        window.nzWorkflowManager.showNotification(`复制失败: ${result?.error || '未知错误'}`, 'error');
      }
    } catch (error) {
      this.hideProgressIndicator();
      console.error(`[NZWorkflowManager] 复制失败:`, error);
      window.nzWorkflowManager.showNotification(`复制失败: ${error.message}`, 'error');
    }
  }

  // 目录选择器
  async showDirectorySelector(title, message) {
    // 使用树状目录选择器
    if (window.nzWorkflowManager && window.nzWorkflowManager.dialogManager && window.nzWorkflowManager.dialogManager.showDirectoryTreeChooser) {
      return new Promise((resolve) => {
        window.nzWorkflowManager.dialogManager.showDirectoryTreeChooser((selectedPath) => {
          resolve(selectedPath);
        });
      });
    } else {
      // 降级到输入对话框
      return await window.dialogManager.showInputDialog(title, message, '');
    }
  }
  
  // 显示菜单
  showMenu(event, items) {
    // 如果已有菜单，先关闭
    if (this.currentMenu) {
      this.hideMenu();
    }
    
    const menu = document.createElement('div');
    menu.className = 'nz-context-menu';
    
    items.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = 'nz-context-menu-separator';
        menu.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = `nz-context-menu-item ${item.className || ''}`;
        menuItem.innerHTML = item.label;
        
        if (item.submenu) {
          menuItem.classList.add('has-submenu');
          menuItem.innerHTML += ' <span class="submenu-arrow">▶</span>';
          
          // 创建子菜单
          const submenu = document.createElement('div');
          submenu.className = 'nz-context-submenu';
          console.log('创建子菜单，初始className:', submenu.className);
          
          item.submenu.forEach(subItem => {
            if (subItem.separator) {
              const separator = document.createElement('div');
              separator.className = 'nz-context-menu-separator';
              submenu.appendChild(separator);
            } else {
              const subMenuItem = document.createElement('div');
              subMenuItem.className = 'nz-context-submenu-item';
              subMenuItem.textContent = subItem.label;
              
              subMenuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                if (subItem.action) subItem.action();
                this.hideMenu();
              });
              
              submenu.appendChild(subMenuItem);
            }
          });
          
          menuItem.appendChild(submenu);
          
          // 简化实现：使用CSS hover机制，无需JavaScript事件
        } else {
          menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.action) item.action();
          });
        }
        
        menu.appendChild(menuItem);
      }
    });
    
    // 添加样式
    this.addContextMenuStyles();
    
    // 定位菜单
    document.body.appendChild(menu);
    this.positionMenu(menu, event);
    
    this.currentMenu = menu;
    
    // 阻止默认右键菜单
    event.preventDefault();
    return false;
  }
  
  // 定位菜单
  positionMenu(menu, event) {
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = event.clientX;
    let y = event.clientY;
    
    // 防止菜单超出视口
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }
    
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }
    
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }
  
  // 移除复杂的定位方法，使用CSS相对定位
  
  // 隐藏菜单
  hideMenu() {
    if (this.currentMenu) {
      document.body.removeChild(this.currentMenu);
      this.currentMenu = null;
    }
  }
  
  // 复制工作流
  async copyWorkflow(filePath, fileName) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    // 生成副本名称
    const fileExt = fileName.split('.').pop();
    const baseName = fileName.replace(`.${fileExt}`, '');
    const copyName = `${baseName}_副本.${fileExt}`;
    
    const newName = await window.dialogManager.showInputDialog(
      '复制工作流副本',
      '请输入副本名称：',
      copyName
    );
    
    if (newName && newName !== fileName) {
      try {
        if (window.nzWorkflowManager) {
          window.nzWorkflowManager.showNotification('正在创建副本...', 'info');
        }
        
        // 获取当前目录路径
        const currentDir = filePath.substring(0, filePath.lastIndexOf('\\'));
        const targetPath = `${currentDir}\\${newName}`;
        
        let result = null;
        
        // 优先使用模块化的通信API
        if (this.communicationAPI) {
          result = await this.communicationAPI.copyFile(filePath, currentDir, newName);
        } else if (window.fileOperationsAPI) {
          result = await window.fileOperationsAPI.copyFile(filePath, currentDir, newName);
        } else {
          throw new Error('没有可用的文件操作API');
        }
        
        if (result && result.success) {
          if (window.nzWorkflowManager) {
            window.nzWorkflowManager.showNotification(`成功创建副本: ${newName}`, 'success');
          }
          if (window.loadDirectory && window.config) {
            window.loadDirectory(this.config.getCurrentPath()); // 刷新当前目录
          }
        } else {
          if (window.nzWorkflowManager) {
            window.nzWorkflowManager.showNotification(`创建副本失败: ${result?.error || '未知错误'}`, 'error');
          }
        }
      } catch (error) {
        console.error(`[${pluginName}] 创建副本失败:`, error);
        
        // 提供更友好的错误消息和恢复建议
        let errorMessage = '创建副本失败';
        let suggestion = '';
        
        if (error.message.includes('WebSocket不可用')) {
          errorMessage += '：WebSocket连接不可用';
          suggestion = '请检查ComfyUI服务状态，或稍后重试';
        } else if (error.message.includes('HTTP请求失败')) {
          errorMessage += '：服务器响应错误';
          suggestion = '请检查ComfyUI服务状态';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage += '：无法连接到服务器';
          suggestion = '请确认ComfyUI正在运行并重试';
        } else if (error.message.includes('already exists')) {
          errorMessage += '：文件已存在';
          suggestion = '请选择不同的文件名';
        } else if (error.message.includes('目标目录不存在')) {
          errorMessage += '：目标目录不存在';
          suggestion = '请确认目录路径正确';
        } else {
          errorMessage += `：${error.message}`;
        }
        
        if (suggestion) {
          errorMessage += ` (${suggestion})`;
        }
        
        if (window.nzWorkflowManager) {
          window.nzWorkflowManager.showNotification(errorMessage, 'error');
        }
      }
    }
  }
  
  
  // 删除项目
  async deleteItem(itemPath, itemName, itemType) {
    // 显示确认对话框
    if (window.dialogManager) {
      const typeText = itemType === 'directory' ? '目录' : '文件';
      const confirmed = await window.dialogManager.showConfirm(
        `确认删除${typeText}`,
        `确定要删除${typeText} "${itemName}" 吗？此操作不可撤销。`
      );
      
      if (!confirmed) return;
    }
    
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    try {
      // 使用FileOperationsAPI删除文件/目录
      let result = null;
      
      // 优先使用模块化的通信API
      if (this.communicationAPI) {
        if (itemType === 'directory') {
          result = await this.communicationAPI.deleteDirectory(itemPath);
        } else {
          result = await this.communicationAPI.deleteFile(itemPath);
        }
      } else if (window.fileOperationsAPI) {
        if (itemType === 'directory') {
          result = await window.fileOperationsAPI.deleteDirectory(itemPath);
        } else {
          result = await window.fileOperationsAPI.deleteFile(itemPath);
        }
      } else {
        throw new Error('没有可用的文件操作API');
      }
        
      if (result.success) {
        if (window.nzWorkflowManager) {
          const typeText = itemType === 'directory' ? '目录' : '文件';
          window.nzWorkflowManager.showNotification(`已删除${typeText}: ${itemName}`, 'success');
        }
        
        // 刷新当前目录 - 多种方式确保刷新成功
        console.log(`[${pluginName}] 删除成功，开始刷新目录...`);
        
        // 方式1：使用模块化配置
        if (this.config && typeof window.loadDirectory === 'function') {
          const currentDir = this.config.getCurrentPath();
          console.log(`[${pluginName}] 使用模块化配置刷新: ${currentDir}`);
          if (currentDir) {
            window.loadDirectory(currentDir);
          }
        }
        // 方式2：使用全局配置
        else if (window.config && typeof window.loadDirectory === 'function') {
          const currentDir = window.config.getCurrentPath();
          console.log(`[${pluginName}] 使用全局配置刷新: ${currentDir}`);
          if (currentDir) {
            window.loadDirectory(currentDir);
          }
        }
        // 方式3：使用全局 loadDirectory 函数
        else if (typeof loadDirectory === 'function' && window.config) {
          const currentDir = window.config.getCurrentPath();
          console.log(`[${pluginName}] 使用全局函数刷新: ${currentDir}`);
          if (currentDir) {
            loadDirectory(currentDir);
          }
        }
        // 方式4：强制刷新整个侧边栏
        else if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
          console.log(`[${pluginName}] 使用强制刷新`);
          window.nzWorkflowManager.refreshAllPathAttributes();
        } else {
          console.warn(`[${pluginName}] 无法找到可用的目录刷新方法`);
        }
      } else {
        throw new Error(result.error || '删除失败');
      }
    } catch (error) {
      console.error(`[${pluginName}] 删除项目失败:`, error);
      if (window.nzWorkflowManager) {
        window.nzWorkflowManager.showNotification(`删除失败: ${error.message}`, 'error');
      }
    }
  }
  
  // 添加上下文菜单样式
  addContextMenuStyles() {
    const existingStyle = document.getElementById('nz-context-menu-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'nz-context-menu-styles';
    style.textContent = `
      .nz-context-menu {
        position: fixed;
        background: var(--bg-color, #2a2a2a);
        border: 1px solid var(--border-color, #444);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        min-width: 180px;
        padding: 4px 0;
        font-size: 13px;
        color: var(--text-color, #ffffff);
      }
      
      .nz-context-menu-item {
        padding: 8px 16px;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .nz-context-menu-item:hover {
        background: var(--hover-color, #404040);
      }
      
      .nz-context-menu-item.danger {
        color: #ff6b6b;
      }
      
      .nz-context-menu-item.danger:hover {
        background: rgba(255, 107, 107, 0.1);
      }
      
      .nz-context-menu-separator {
        height: 1px;
        background: var(--border-color, #444);
        margin: 4px 0;
      }
      
      .nz-context-menu-item.has-submenu .submenu-arrow {
        margin-left: 8px;
        font-size: 10px;
        opacity: 0.7;
      }
      
      .nz-context-menu-item.has-submenu::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 20px;
        background: transparent;
        pointer-events: none;
      }
      
      .nz-context-submenu {
        position: absolute;
        left: 100%;
        top: -6px;
        background: var(--comfy-menu-bg, rgba(25, 30, 40, 0.98));
        border: 1px solid var(--border-color, rgba(100, 120, 180, 0.3));
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        padding: 6px 0;
        min-width: 160px;
        z-index: 10002;
        font-size: 12px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: none;
        margin-left: 5px;
      }
      
      /* 简单的hover显示机制 */
      .nz-context-menu-item:hover .nz-context-submenu {
        display: block;
      }
      
      .nz-context-submenu-item {
        display: block;
        width: 100%;
        padding: 8px 14px;
        cursor: pointer;
        color: var(--fg-color, #e0f0ff);
        font-size: 12px;
        border: none;
        background: none;
        text-align: left;
        transition: background-color 0.15s ease;
        border-radius: 0;
      }
      
      .nz-context-submenu-item:hover {
        background: rgba(100, 120, 180, 0.2);
      }
      
      .nz-context-submenu-item:active {
        background: rgba(100, 120, 180, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  // ====== 进度提示功能 ======
  
  // 显示进度提示
  showProgressIndicator(action, itemName) {
    // 移除现有的进度提示
    this.hideProgressIndicator();
    
    const progressContainer = document.createElement('div');
    progressContainer.id = 'nz-progress-indicator';
    progressContainer.className = 'nz-progress-indicator';
    
    progressContainer.innerHTML = `
      <div class="nz-progress-content">
        <div class="nz-progress-spinner">
          <div class="nz-spinner"></div>
        </div>
        <div class="nz-progress-text">
          <div class="nz-progress-action">${action}中...</div>
          <div class="nz-progress-item">${itemName}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(progressContainer);
    
    // 添加进度提示样式
    this.addProgressIndicatorStyles();
    
    // 添加动画效果
    setTimeout(() => {
      progressContainer.classList.add('visible');
    }, 10);
  }
  
  // 隐藏进度提示
  hideProgressIndicator() {
    const progressContainer = document.getElementById('nz-progress-indicator');
    if (progressContainer) {
      progressContainer.classList.remove('visible');
      setTimeout(() => {
        if (progressContainer.parentNode) {
          progressContainer.parentNode.removeChild(progressContainer);
        }
      }, 300);
    }
  }
  
  // 添加进度提示样式
  addProgressIndicatorStyles() {
    const existingStyle = document.getElementById('nz-progress-indicator-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'nz-progress-indicator-styles';
    style.textContent = `
      .nz-progress-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        padding: 20px 30px;
        z-index: 10001;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        opacity: 0;
        transition: opacity 0.3s ease;
        min-width: 250px;
        text-align: center;
      }
      
      .nz-progress-indicator.visible {
        opacity: 1;
      }
      
      .nz-progress-content {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .nz-progress-spinner {
        flex-shrink: 0;
      }
      
      .nz-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top: 3px solid #6bb6ff;
        border-radius: 50%;
        animation: nz-spin 1s linear infinite;
      }
      
      @keyframes nz-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .nz-progress-text {
        text-align: left;
        flex: 1;
      }
      
      .nz-progress-action {
        font-size: 14px;
        font-weight: 600;
        color: #6bb6ff;
        margin-bottom: 4px;
      }
      
      .nz-progress-item {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        word-break: break-all;
        max-width: 200px;
      }
    `;
    document.head.appendChild(style);
  }
}

// ====== 对话框管理器 ======

// 对话框管理器
class DialogManager {
  constructor() {
    this.currentDialog = null;
  }
  
  // 显示输入对话框
  async showInput(title, message, defaultValue = '', placeholder = '') {
    return new Promise((resolve) => {
      this.closeCurrentDialog();
      
      const overlay = document.createElement('div');
      overlay.className = 'nz-dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'nz-dialog';
      
      dialog.innerHTML = `
        <div class="nz-dialog-header">
          <h3>${title}</h3>
          <button class="nz-dialog-close" type="button">✕</button>
        </div>
        <div class="nz-dialog-content">
          <p>${message}</p>
          <input type="text" class="nz-dialog-input" value="${defaultValue}" placeholder="${placeholder}" />
        </div>
        <div class="nz-dialog-footer">
          <button class="nz-dialog-button nz-dialog-cancel">取消</button>
          <button class="nz-dialog-button nz-dialog-confirm">确定</button>
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      const input = dialog.querySelector('.nz-dialog-input');
      const confirmBtn = dialog.querySelector('.nz-dialog-confirm');
      const cancelBtn = dialog.querySelector('.nz-dialog-cancel');
      const closeBtn = dialog.querySelector('.nz-dialog-close');
      
      // 聚焦输入框并选中文本
      setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
      
      const cleanup = () => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
        this.currentDialog = null;
      };
      
      const handleConfirm = () => {
        const value = input.value.trim();
        cleanup();
        resolve(value);
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(null);
      };
      
      // 事件监听
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      closeBtn.addEventListener('click', handleCancel);
      
      // 回车确认
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        }
      });
      
      // 点击遮罩关闭
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleCancel();
        }
      });
      
      this.currentDialog = overlay;
      this.addDialogStyles();
    });
  }
  
  // 显示确认对话框
  async showConfirm(title, message) {
    return new Promise((resolve) => {
      this.closeCurrentDialog();
      
      const overlay = document.createElement('div');
      overlay.className = 'nz-dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'nz-dialog';
      
      dialog.innerHTML = `
        <div class="nz-dialog-header">
          <h3>${title}</h3>
          <button class="nz-dialog-close" type="button">✕</button>
        </div>
        <div class="nz-dialog-content">
          <p>${message}</p>
        </div>
        <div class="nz-dialog-footer">
          <button class="nz-dialog-button nz-dialog-cancel">取消</button>
          <button class="nz-dialog-button nz-dialog-confirm">确定</button>
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      const confirmBtn = dialog.querySelector('.nz-dialog-confirm');
      const cancelBtn = dialog.querySelector('.nz-dialog-cancel');
      const closeBtn = dialog.querySelector('.nz-dialog-close');
      
      const cleanup = () => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
        this.currentDialog = null;
      };
      
      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(false);
      };
      
      // 事件监听
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      closeBtn.addEventListener('click', handleCancel);
      
      // 键盘事件
      document.addEventListener('keydown', function keyHandler(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.removeEventListener('keydown', keyHandler);
          handleConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          document.removeEventListener('keydown', keyHandler);
          handleCancel();
        }
      });
      
      // 点击遮罩关闭
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleCancel();
        }
      });
      
      this.currentDialog = overlay;
      this.addDialogStyles();
    });
  }
  
  // 显示信息对话框
  async showAlert(title, message) {
    return new Promise((resolve) => {
      this.closeCurrentDialog();
      
      const overlay = document.createElement('div');
      overlay.className = 'nz-dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'nz-dialog';
      
      dialog.innerHTML = `
        <div class="nz-dialog-header">
          <h3>${title}</h3>
          <button class="nz-dialog-close" type="button">✕</button>
        </div>
        <div class="nz-dialog-content">
          <p>${message}</p>
        </div>
        <div class="nz-dialog-footer">
          <button class="nz-dialog-button nz-dialog-confirm">确定</button>
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      const confirmBtn = dialog.querySelector('.nz-dialog-confirm');
      const closeBtn = dialog.querySelector('.nz-dialog-close');
      
      const cleanup = () => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
        this.currentDialog = null;
      };
      
      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };
      
      // 事件监听
      confirmBtn.addEventListener('click', handleConfirm);
      closeBtn.addEventListener('click', handleConfirm);
      
      // 键盘事件
      document.addEventListener('keydown', function keyHandler(e) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          document.removeEventListener('keydown', keyHandler);
          handleConfirm();
        }
      });
      
      // 点击遮罩关闭
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleConfirm();
        }
      });
      
      this.currentDialog = overlay;
      this.addDialogStyles();
    });
  }
  
  // 显示确认对话框
  showConfirmDialog(title, message, dangerAction = false) {
    return new Promise((resolve) => {
      this.closeCurrentDialog(); // 先隐藏现有对话框
      
      const overlay = document.createElement('div');
      overlay.className = 'nz-dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'nz-dialog';
      
      const titleEl = document.createElement('div');
      titleEl.className = 'nz-dialog-title';
      titleEl.textContent = title;
      
      const messageEl = document.createElement('div');
      messageEl.className = 'nz-dialog-message';
      messageEl.textContent = message;
      
      const buttons = document.createElement('div');
      buttons.className = 'nz-dialog-buttons';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'nz-dialog-button';
      cancelBtn.textContent = '取消';
      cancelBtn.onclick = () => {
        this.closeCurrentDialog();
        resolve(false);
      };
      
      const confirmBtn = document.createElement('button');
      confirmBtn.className = `nz-dialog-button ${dangerAction ? 'danger' : 'primary'}`;
      confirmBtn.textContent = '确定';
      confirmBtn.onclick = () => {
        this.closeCurrentDialog();
        resolve(true);
      };
      
      // ESC键取消
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          document.removeEventListener('keydown', escHandler);
          cancelBtn.click();
        }
      };
      document.addEventListener('keydown', escHandler);
      
      buttons.appendChild(cancelBtn);
      buttons.appendChild(confirmBtn);
      
      dialog.appendChild(titleEl);
      dialog.appendChild(messageEl);
      dialog.appendChild(buttons);
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      // 点击遮罩关闭
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.removeEventListener('keydown', escHandler);
          cancelBtn.click();
        }
      });
      
      this.currentDialog = overlay;
      this.addDialogStyles();
    });
  }
  
  // 显示输入对话框
  showInputDialog(title, placeholder, defaultValue = '') {
    return new Promise((resolve) => {
      this.closeCurrentDialog(); // 先隐藏现有对话框
      
      const overlay = document.createElement('div');
      overlay.className = 'nz-dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'nz-dialog';
      
      const titleEl = document.createElement('div');
      titleEl.className = 'nz-dialog-title';
      titleEl.textContent = title;
      
      const input = document.createElement('input');
      input.className = 'nz-dialog-input';
      input.type = 'text';
      input.placeholder = placeholder;
      input.value = defaultValue;
      
      const buttons = document.createElement('div');
      buttons.className = 'nz-dialog-buttons';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'nz-dialog-button';
      cancelBtn.textContent = '取消';
      cancelBtn.onclick = () => {
        this.closeCurrentDialog();
        resolve(null);
      };
      
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'nz-dialog-button primary';
      confirmBtn.textContent = '确定';
      confirmBtn.onclick = () => {
        const value = input.value.trim();
        this.closeCurrentDialog();
        resolve(value);
      };
      
      // Enter键确认，ESC键取消
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmBtn.click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelBtn.click();
        }
      });
      
      buttons.appendChild(cancelBtn);
      buttons.appendChild(confirmBtn);
      
      dialog.appendChild(titleEl);
      dialog.appendChild(input);
      dialog.appendChild(buttons);
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      // 聚焦输入框并选中文本
      setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
      
      // 点击遮罩关闭
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cancelBtn.click();
        }
      });
      
      this.currentDialog = overlay;
      this.addDialogStyles();
    });
  }
  
  // 显示消息对话框
  showMessage(title, message, type = 'info') {
    return new Promise((resolve) => {
      this.closeCurrentDialog();
      
      const overlay = document.createElement('div');
      overlay.className = 'nz-dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = `nz-dialog nz-message-dialog ${type}`;
      
      const titleEl = document.createElement('div');
      titleEl.className = 'nz-dialog-title';
      titleEl.textContent = title;
      
      const messageEl = document.createElement('div');
      messageEl.className = 'nz-dialog-message';
      messageEl.textContent = message;
      
      const buttons = document.createElement('div');
      buttons.className = 'nz-dialog-buttons';
      
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'nz-dialog-button primary';
      confirmBtn.textContent = '确定';
      confirmBtn.onclick = () => {
        this.closeCurrentDialog();
        resolve(true);
      };
      
      buttons.appendChild(confirmBtn);
      dialog.appendChild(titleEl);
      dialog.appendChild(messageEl);
      dialog.appendChild(buttons);
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      this.currentDialog = overlay;
      this.addDialogStyles();
      
      // 聚焦按钮
      setTimeout(() => confirmBtn.focus(), 100);
      
      // Enter键或ESC键关闭
      const handleKeydown = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          confirmBtn.click();
          document.removeEventListener('keydown', handleKeydown);
        }
      };
      document.addEventListener('keydown', handleKeydown);
      
      // 点击遮罩关闭
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          confirmBtn.click();
        }
      });
    });
  }
  
  // 显示目录选择器（简化版本）
  showDirectoryChooser(title, message) {
    return new Promise((resolve) => {
      this.closeCurrentDialog();
      
      // 目前使用简化的输入框实现
      // TODO: 未来可能需要完整的目录树选择器
      this.showInputDialog(
        title || '选择目录',
        message || '请输入目录路径',
        ''
      ).then(resolve);
    });
  }
  
  // 别名方法，保持向后兼容
  showConfirm(title, message, dangerAction = false) {
    return this.showConfirmDialog(title, message, dangerAction);
  }
  
  showInput(title, placeholder, defaultValue = '') {
    return this.showInputDialog(title, placeholder, defaultValue);
  }
  
  // 关闭当前对话框
  closeCurrentDialog() {
    if (this.currentDialog) {
      if (this.currentDialog.parentNode) {
        document.body.removeChild(this.currentDialog);
      }
      this.currentDialog = null;
    }
  }
  
  // 添加对话框样式
  addDialogStyles() {
    const existingStyle = document.getElementById('nz-dialog-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'nz-dialog-styles';
    style.textContent = `
      .nz-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 10020;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .nz-dialog {
        background: var(--bg-color, #2a2a2a);
        border: 1px solid var(--border-color, #444);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        min-width: 320px;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
      }
      
      .nz-dialog-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color, #444);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--header-bg, #333);
      }
      
      .nz-dialog-header h3 {
        margin: 0;
        color: var(--text-color, #ffffff);
        font-size: 16px;
        font-weight: 600;
      }
      
      .nz-dialog-close {
        background: none;
        border: none;
        color: var(--text-color, #ffffff);
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        opacity: 0.7;
      }
      
      .nz-dialog-close:hover {
        opacity: 1;
      }
      
      .nz-dialog-content {
        padding: 20px;
        color: var(--text-color, #ffffff);
      }
      
      .nz-dialog-content p {
        margin: 0 0 16px 0;
        line-height: 1.5;
      }
      
      .nz-dialog-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border-color, #444);
        border-radius: 4px;
        background: var(--input-bg, #333);
        color: var(--text-color, #ffffff);
        font-size: 14px;
        box-sizing: border-box;
      }
      
      .nz-dialog-input:focus {
        outline: none;
        border-color: var(--primary-color, #007acc);
      }
      
      .nz-dialog-footer {
        padding: 16px 20px;
        border-top: 1px solid var(--border-color, #444);
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        background: var(--footer-bg, #2a2a2a);
      }
      
      .nz-dialog-button {
        padding: 8px 16px;
        border: 1px solid var(--border-color, #444);
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        min-width: 80px;
      }
      
      .nz-dialog-cancel {
        background: var(--bg-color, #2a2a2a);
        color: var(--text-color, #ffffff);
      }
      
      .nz-dialog-cancel:hover {
        background: var(--hover-color, #404040);
      }
      
      .nz-dialog-confirm {
        background: var(--primary-color, #007acc);
        color: white;
        border-color: var(--primary-color, #007acc);
      }
      
      .nz-dialog-confirm:hover {
        background: var(--primary-hover, #005a9e);
        border-color: var(--primary-hover, #005a9e);
      }
    `;
    document.head.appendChild(style);
  }

  // 显示目录树选择器
  showDirectoryTreeChooser(callback) {
    console.log(`[NZ工作流管理器] 显示目录树选择器`);
    
    // 创建目录树选择器对话框
    const treeOverlay = document.createElement('div');
    treeOverlay.className = 'nz-dialog-overlay';
    
    const treeDialog = document.createElement('div');
    treeDialog.className = 'nz-dialog nz-directory-tree-chooser';
    treeDialog.style.width = '500px';
    treeDialog.style.maxHeight = '600px';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'nz-dialog-title';
    titleEl.textContent = '选择目标目录';
    
    const treeContainer = document.createElement('div');
    treeContainer.className = 'nz-directory-tree-container';
    treeContainer.style.maxHeight = '400px';
    treeContainer.style.overflowY = 'auto';
    treeContainer.style.border = '1px solid #444';
    treeContainer.style.borderRadius = '4px';
    treeContainer.style.padding = '10px';
    treeContainer.style.marginBottom = '15px';
    
    // 获取默认目录作为根目录
    const defaultDir = localStorage.getItem('nz_default_directory') || '';
    if (!defaultDir) {
      window.nzWorkflowManager.showNotification('请先设置默认目录', 'warning');
      return;
    }
    
    let selectedPath = defaultDir; // 默认选择根目录
    
    // 加载目录树
    this.loadDirectoryTree(treeContainer, defaultDir, (path) => {
      console.log(`[NZ工作流管理器] 🔍 目录树项被点击: ${path}`);
      selectedPath = path;
      
      // 更新选中状态
      treeContainer.querySelectorAll('.nz-tree-item').forEach(item => {
        item.classList.remove('selected');
        item.style.backgroundColor = 'transparent';
        item.style.color = '';
      });
      
      // 查找并高亮选中的项
      let selectedItem = null;
      treeContainer.querySelectorAll('.nz-tree-item').forEach(item => {
        if (item.dataset.path === path) {
          selectedItem = item;
        }
      });
      
      if (selectedItem) {
        selectedItem.classList.add('selected');
        selectedItem.style.backgroundColor = '#4a9eff';
        selectedItem.style.color = 'white';
        console.log(`[NZ工作流管理器] ✅ 选中状态已应用`);
      }
    });
    
    const buttons = document.createElement('div');
    buttons.className = 'nz-dialog-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'nz-dialog-button';
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => {
      treeOverlay.remove();
    };
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'nz-dialog-button primary';
    confirmBtn.textContent = '确定';
    confirmBtn.onclick = () => {
      treeOverlay.remove();
      if (callback) {
        callback(selectedPath);
      }
    };
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    
    treeDialog.appendChild(titleEl);
    treeDialog.appendChild(treeContainer);
    treeDialog.appendChild(buttons);
    
    treeOverlay.appendChild(treeDialog);
    document.body.appendChild(treeOverlay);
    
    // 点击遮罩关闭
    treeOverlay.addEventListener('click', (e) => {
      if (e.target === treeOverlay) {
        treeOverlay.remove();
      }
    });
  }
  
  // 加载目录树
  async loadDirectoryTree(container, rootPath, onSelect) {
    try {
      console.log(`[NZ工作流管理器] 加载目录树: ${rootPath}`);
      
      // 显示加载状态
      container.innerHTML = '<div style="text-align: center; padding: 20px;">加载中...</div>';
      
      // 获取目录内容
      const response = await fetch(`${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(rootPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // 清空容器
      container.innerHTML = '';
      
      // 添加根目录项
      const rootItem = this.createTreeItem(rootPath, '📁 ' + (rootPath.split('\\').pop() || rootPath.split('/').pop() || '根目录'), true, onSelect);
      container.appendChild(rootItem);
      
      // 递归加载子目录
      if (data.directories && data.directories.length > 0) {
        const subContainer = document.createElement('div');
        subContainer.style.marginLeft = '20px';
        await this.loadSubDirectories(subContainer, data.directories, rootPath, onSelect);
        container.appendChild(subContainer);
      }
      
    } catch (error) {
      console.error(`[NZ工作流管理器] 加载目录树失败:`, error);
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6b6b;">加载失败</div>';
    }
  }
  
  // 递归加载子目录
  async loadSubDirectories(container, directories, parentPath, onSelect) {
    for (const dir of directories) {
      // 处理新的对象格式和旧的字符串格式
      const dirName = typeof dir === 'string' ? dir : dir.name;
      const fullPath = parentPath ? `${parentPath}\\${dirName}` : dirName;
      const dirItem = this.createTreeItem(fullPath, '📁 ' + dirName, false, onSelect);
      container.appendChild(dirItem);
      
      // 尝试加载这个目录的子目录（只加载一层）
      try {
        const response = await fetch(`${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(fullPath)}`);
        
        if (response.ok) {
          const subData = await response.json();
          if (subData.directories && subData.directories.length > 0) {
            const subContainer = document.createElement('div');
            subContainer.style.marginLeft = '20px';
            subContainer.style.display = 'none'; // 默认折叠
            
            // 创建子目录项
            subData.directories.forEach(subDir => {
              const subDirName = typeof subDir === 'string' ? subDir : subDir.name;
              const subFullPath = `${fullPath}\\${subDirName}`;
              const subDirItem = this.createTreeItem(subFullPath, '📁 ' + subDirName, false, onSelect);
              subContainer.appendChild(subDirItem);
            });
            
            // 添加展开/折叠功能
            const toggleIcon = document.createElement('span');
            toggleIcon.textContent = '▶';
            toggleIcon.style.cursor = 'pointer';
            toggleIcon.style.marginRight = '5px';
            toggleIcon.style.fontSize = '12px';
            
            toggleIcon.onclick = (e) => {
              e.stopPropagation();
              if (subContainer.style.display === 'none') {
                subContainer.style.display = 'block';
                toggleIcon.textContent = '▼';
              } else {
                subContainer.style.display = 'none';
                toggleIcon.textContent = '▶';
              }
            };
            
            dirItem.insertBefore(toggleIcon, dirItem.firstChild);
            container.appendChild(subContainer);
          }
        }
      } catch (error) {
        console.warn(`[NZ工作流管理器] 加载子目录失败: ${fullPath}`, error);
      }
    }
  }
  
  // 创建树项
  createTreeItem(path, displayName, isRoot, onSelect) {
    const item = document.createElement('div');
    item.className = 'nz-tree-item';
    item.dataset.path = path;
    item.textContent = displayName;
    item.style.cursor = 'pointer';
    item.style.padding = '5px 8px';
    item.style.borderRadius = '3px';
    item.style.marginBottom = '2px';
    item.style.userSelect = 'none';
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onSelect) {
        onSelect(path);
      }
    });
    
    item.addEventListener('mouseenter', () => {
      if (!item.classList.contains('selected')) {
        item.style.backgroundColor = 'rgba(100, 120, 180, 0.1)';
      }
    });
    
    item.addEventListener('mouseleave', () => {
      if (!item.classList.contains('selected')) {
        item.style.backgroundColor = 'transparent';
      }
    });
    
    return item;
  }
}

// ====== 冲突处理对话框管理器 (v3.2.1新增) ======

// 冲突处理对话框管理器
class ConflictResolutionDialogManager {
  constructor() {
    this.currentDialog = null;
    this.resolvePromise = null;
    this.isProcessing = false; // 防止重复点击
    
    // 存储当前冲突信息，用于详细处理
    this.currentConflictInfo = {
      sourceName: '',
      targetPath: '',
      isDirectory: false
    };
  }

  // 显示操作结果汇总对话框
  showOperationSummaryDialog(results, summary) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 显示操作结果汇总对话框`);
    
    // 如果已有对话框，先关闭
    if (this.currentDialog) {
      this.closeDialog();
    }
    
    // 创建对话框结构
    const overlay = document.createElement('div');
    overlay.className = 'conflict-dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'conflict-dialog';
    dialog.style.maxWidth = '600px';
    dialog.style.maxHeight = '70vh';
    dialog.style.overflow = 'auto';
    
    // 构建结果列表HTML
    const resultItems = results.map(result => {
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'skipped' ? '⏭️' : '❌';
      const statusText = result.status === 'success' ? '成功' : 
                        result.status === 'skipped' ? '跳过' : '失败';
      const actionText = result.action === 'replace' ? '覆盖' :
                        result.action === 'rename' ? `重命名为 ${result.newName}` :
                        result.action === 'skip' ? '跳过' : result.action;
      
      return `
        <div class="result-item" style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
          <span style="margin-right: 8px; font-size: 16px;">${statusIcon}</span>
          <div style="flex: 1;">
            <div style="font-weight: bold;">${result.fileName}</div>
            <div style="font-size: 12px; color: #666;">操作: ${actionText}</div>
            ${result.error ? `<div style="font-size: 12px; color: #e74c3c;">错误: ${result.error}</div>` : ''}
          </div>
          <span style="font-size: 12px; color: ${result.status === 'success' ? '#27ae60' : result.status === 'skipped' ? '#f39c12' : '#e74c3c'};">${statusText}</span>
        </div>
      `;
    }).join('');
    
    dialog.innerHTML = `
      <div class="conflict-dialog-header">
        <h3>📊 操作结果汇总</h3>
      </div>
      <div class="conflict-dialog-content">
        <div class="summary-stats" style="display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${summary.success}</div>
            <div style="font-size: 12px; color: #666;">成功</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${summary.skipped}</div>
            <div style="font-size: 12px; color: #666;">跳过</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${summary.errors}</div>
            <div style="font-size: 12px; color: #666;">错误</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #3498db;">${summary.total}</div>
            <div style="font-size: 12px; color: #666;">总计</div>
          </div>
        </div>
        
        <div class="results-list" style="max-height: 300px; overflow-y: auto;">
          ${resultItems}
        </div>
      </div>
      <div class="conflict-dialog-actions" style="justify-content: center;">
        <button class="conflict-btn conflict-btn-primary" id="summary-dialog-ok-btn">
          ✅ 确定
        </button>
      </div>
    `;
    
    // 应用主题样式
    this.applyDialogTheme(dialog);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    this.currentDialog = overlay;
    
    // 添加确定按钮事件监听器
    const okButton = dialog.querySelector('#summary-dialog-ok-btn');
    if (okButton) {
      okButton.addEventListener('click', () => {
        console.log(`[${pluginName}] 结果对话框确定按钮被点击，准备关闭对话框`);
        this.closeDialog();
        
        // 关闭对话框后刷新当前目录
        console.log(`[${pluginName}] 结果对话框关闭后，开始刷新目录...`);
        this.refreshCurrentDirectory();
      });
    }
    
    // 添加点击遮罩关闭功能
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        console.log(`[${pluginName}] 点击遮罩关闭结果对话框`);
        this.closeDialog();
        this.refreshCurrentDirectory();
      }
    });
    
    console.log(`[${pluginName}] 操作结果汇总对话框已显示`);
  }

  // 刷新当前目录
  refreshCurrentDirectory() {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 开始刷新当前目录...`);
    
    // 方式1：使用模块化配置
    if (this.config && typeof window.loadDirectory === 'function') {
      const currentDir = this.config.getCurrentPath();
      console.log(`[${pluginName}] 使用模块化配置刷新: ${currentDir}`);
      if (currentDir) {
        window.loadDirectory(currentDir);
        return;
      }
    }
    
    // 方式2：使用全局配置
    if (window.config && typeof window.loadDirectory === 'function') {
      const currentDir = window.config.getCurrentPath();
      console.log(`[${pluginName}] 使用全局配置刷新: ${currentDir}`);
      if (currentDir) {
        window.loadDirectory(currentDir);
        return;
      }
    }
    
    // 方式3：使用全局 loadDirectory 函数
    if (typeof loadDirectory === 'function' && window.config) {
      const currentDir = window.config.getCurrentPath();
      console.log(`[${pluginName}] 使用全局函数刷新: ${currentDir}`);
      if (currentDir) {
        loadDirectory(currentDir);
        return;
      }
    }
    
    // 方式4：强制刷新整个侧边栏
    if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
      console.log(`[${pluginName}] 使用强制刷新`);
      window.nzWorkflowManager.refreshAllPathAttributes();
      return;
    }
    
    console.warn(`[${pluginName}] 无法找到可用的目录刷新方法`);
  }

  // 显示冲突解决对话框
  async showConflictDialog(sourceName, targetPath, isDirectory = false) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] ========== showConflictDialog 被调用 ==========`);
    console.log(`[${pluginName}] sourceName: ${sourceName}`);
    console.log(`[${pluginName}] targetPath: ${targetPath}`);
    console.log(`[${pluginName}] isDirectory: ${isDirectory}`);
    
    // 存储当前冲突信息
    this.currentConflictInfo = {
      sourceName,
      targetPath,
      isDirectory
    };
    
    // 如果已有对话框，先关闭
    if (this.currentDialog) {
      console.log(`[${pluginName}] 关闭现有对话框`);
      this.closeDialog();
    }
    
    // 重置处理状态
    this.isProcessing = false;
    console.log(`[${pluginName}] 重置 isProcessing = false`);

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      console.log(`[${pluginName}] Promise 创建完成`);
      
      // 创建对话框结构
      const overlay = document.createElement('div');
      overlay.className = 'conflict-dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'conflict-dialog';
      
      const itemType = isDirectory ? '目录' : '文件';
      
      dialog.innerHTML = `
        <div class="conflict-dialog-header">
          <h3>⚠️ ${itemType}名称冲突</h3>
        </div>
        <div class="conflict-dialog-content">
          <p>目标位置已存在同名${itemType}：</p>
          <div class="conflict-item-info">
            <strong>${sourceName}</strong>
          </div>
          <p>请选择处理方式：</p>
          <div class="conflict-batch-options" style="margin: 10px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">
            <label style="display: flex; align-items: center; font-size: 12px; color: #666;">
              <input type="checkbox" id="apply-to-all-conflicts" style="margin-right: 5px;">
              <span>将此选择应用到所有后续冲突</span>
            </label>
          </div>
        </div>
        <div class="conflict-dialog-actions">
          <button class="conflict-btn conflict-btn-cancel" data-action="cancel">
            ❌ 取消全部操作
          </button>
          <button class="conflict-btn conflict-btn-skip" data-action="skip">
            ⏭️ 跳过此${itemType}
          </button>
          <button class="conflict-btn conflict-btn-rename" data-action="rename">
            📝 重命名${itemType}
          </button>
          <button class="conflict-btn conflict-btn-replace" data-action="replace">
            🔄 替换现有${itemType}
          </button>
          ${isDirectory ? `
          <button class="conflict-btn conflict-btn-detailed" data-action="detailed" style="background: #4CAF50; border-color: #4CAF50;">
            🎯 对目录内文件单独处理
          </button>
          ` : ''}
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      this.currentDialog = overlay;
      
      // 添加样式
      this.addConflictDialogStyles();
      
      // 绑定事件处理器
      this.setupEventHandlers(dialog);
      
      console.log(`[${pluginName}] 冲突对话框已显示`);
    });
  }
  
  // 设置事件处理器
  setupEventHandlers(dialog) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    const buttons = dialog.querySelectorAll('.conflict-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 防止重复点击
        if (this.isProcessing) {
          console.log(`[${pluginName}] 正在处理中，忽略重复点击`);
          return;
        }
        
        this.isProcessing = true;
        console.log(`[${pluginName}] 设置 isProcessing = true`);
        
        const action = button.dataset.action;
        console.log(`[${pluginName}] 用户选择操作: ${action}`);
        
        // 禁用所有按钮
        buttons.forEach(btn => {
          btn.disabled = true;
          btn.style.opacity = '0.6';
        });
        
        try {
          let result;
          let shouldCloseDialog = true; // 🔥 新增标志，控制是否关闭对话框
          
          // 检查是否选中了"应用到所有"选项
          const applyToAll = dialog.querySelector('#apply-to-all-conflicts')?.checked || false;
          
          switch (action) {
            case 'cancel':
              console.log(`[${pluginName}] 执行取消操作`);
              // 立即清除所有进度通知
              if (window.nzWorkflowManager && window.nzWorkflowManager.uiManager && 
                  typeof window.nzWorkflowManager.uiManager.clearAllNotifications === 'function') {
                window.nzWorkflowManager.uiManager.clearAllNotifications();
              }
              result = { action: 'cancel', applyToAll };
              break;
              
            case 'skip':
              console.log(`[${pluginName}] 执行跳过操作`);
              result = { action: 'skip', applyToAll };
              break;
              
            case 'rename':
              console.log(`[${pluginName}] 执行重命名操作`);
              result = await this.handleRename();
              if (result) {
                // 🔥 关键修复：如果用户取消重命名，重新显示冲突对话框而不是结束流程
                if (result.action === 'return_to_conflict') {
                  console.log(`[${pluginName}] 重命名被取消，重新显示冲突对话框`);
                  
                  // 🎯 新增：清除所有进度通知
                  if (window.nzWorkflowManager && window.nzWorkflowManager.uiManager && 
                      typeof window.nzWorkflowManager.uiManager.clearAllNotifications === 'function') {
                    window.nzWorkflowManager.uiManager.clearAllNotifications();
                    console.log(`[${pluginName}] 重命名取消时已清除所有通知`);
                  }
                  
                  // 重置处理状态并重新启用按钮
                  this.isProcessing = false;
                  buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                  });
                  shouldCloseDialog = false; // 🔥 关键修复：不关闭对话框
                  return; // 不关闭对话框，让用户重新选择
                }
                result.applyToAll = applyToAll;
              }
              break;
              
            case 'replace':
              console.log(`[${pluginName}] 执行替换操作`);
              result = { action: 'replace', applyToAll };
              break;
              
            case 'detailed':
              console.log(`[${pluginName}] 执行文件级别详细处理`);
              result = await this.handleDetailedConflict();
              if (result) {
                // 🔥 关键修复：如果用户取消详细处理，重新显示冲突对话框而不是结束流程
                if (result.action === 'return_to_conflict') {
                  console.log(`[${pluginName}] 详细处理被取消，重新显示冲突对话框`);
                  
                  // 🎯 新增：清除所有进度通知
                  if (window.nzWorkflowManager && window.nzWorkflowManager.uiManager && 
                      typeof window.nzWorkflowManager.uiManager.clearAllNotifications === 'function') {
                    window.nzWorkflowManager.uiManager.clearAllNotifications();
                    console.log(`[${pluginName}] 详细处理取消时已清除所有通知`);
                  }
                  
                  // 重置处理状态并重新启用按钮
                  this.isProcessing = false;
                  buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                  });
                  shouldCloseDialog = false; // 🔥 关键修复：不关闭对话框
                  return; // 不关闭对话框，让用户重新选择
                }
                result.applyToAll = applyToAll;
              }
              break;
              
            default:
              console.warn(`[${pluginName}] 未知操作: ${action}`);
              result = { action: 'cancel', applyToAll };
          }
          
          console.log(`[${pluginName}] 操作结果:`, result);
          
          // 🔥 修复：只有在应该关闭对话框时才关闭
          if (shouldCloseDialog) {
            // 关闭对话框并返回结果
            this.closeDialog();
            if (this.resolvePromise) {
              console.log(`[${pluginName}] 调用 resolve，传递结果:`, result);
              this.resolvePromise(result);
              this.resolvePromise = null;
            }
          }
          
        } catch (error) {
          console.error(`[${pluginName}] 处理冲突操作时发生错误:`, error);
          
          // 重新启用按钮
          buttons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
          });
          
          this.isProcessing = false;
          console.log(`[${pluginName}] 错误后重置 isProcessing = false`);
          
          if (window.nzWorkflowManager) {
            window.nzWorkflowManager.showNotification(`处理失败: ${error.message}`, 'error');
          }
        }
      });
    });
    
    // ESC键取消
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // 点击遮罩取消（但要避免事件冒泡）
    this.currentDialog.addEventListener('click', (e) => {
      if (e.target === this.currentDialog) {
        this.handleCancel();
      }
    });
  }
  
  // 处理重命名
  async handleRename() {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 开始处理重命名`);
    
    // 显示重命名输入框
    if (window.dialogManager) {
      const newName = await window.dialogManager.showInput(
        '重命名',
        '请输入新的名称：',
        '',
        '新名称'
      );
      
      if (newName) {
        console.log(`[${pluginName}] 用户输入新名称: ${newName}`);
        return { action: 'rename', newName: newName };
      } else {
        console.log(`[${pluginName}] 用户取消重命名，返回冲突对话框`);
        return { action: 'return_to_conflict' }; // 🔥 关键修复：取消重命名应返回冲突对话框，而不是结束流程
      }
    } else {
      console.error(`[${pluginName}] DialogManager 未找到`);
      return { action: 'cancel' };
    }
  }
  
  // 处理文件级别详细冲突
  async handleDetailedConflict() {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 开始文件级别详细冲突处理`);
    
    const { sourceName, targetPath, isDirectory } = this.currentConflictInfo;
    
    if (!isDirectory) {
      console.warn(`[${pluginName}] 详细处理仅适用于目录冲突`);
      return { action: 'cancel' };
    }
    
    try {
      // 获取当前工作目录并构建完整的源路径
      const currentDirectory = window.nzWorkflowManager?.currentDirectory || 
                               window.config?.DEFAULT_DIRECTORY || 
                               'D:\\共享网盘-Zero\\001.MJ-temp\\TEST用工作流';
      
      // 如果sourceName是相对路径，构建完整路径
      let sourceFullPath;
      if (!sourceName.includes('\\') || !sourceName.includes(':')) {
        sourceFullPath = `${currentDirectory}\\${sourceName}`;
      } else {
        sourceFullPath = sourceName;
      }
      
      console.log(`[${pluginName}] 源目录（完整路径）: ${sourceFullPath}`);
      const conflictFiles = await this.getConflictFiles(sourceFullPath, targetPath);
      
      if (!conflictFiles || conflictFiles.length === 0) {
        console.log(`[${pluginName}] 没有发现冲突文件`);
        return { action: 'replace' }; // 如果没有冲突，直接替换
      }
      
      // 显示文件级别选择对话框
      const fileOperations = await this.showFileSelectionDialog(conflictFiles);
      
      if (fileOperations) {
        // 构建完整的目标目录路径（包含源目录名）
        const fullTargetPath = `${targetPath}\\${sourceName}`;
        console.log(`[${pluginName}] 源目录（完整路径）: ${sourceFullPath}`);
        console.log(`[${pluginName}] 目标目录（完整路径）: ${fullTargetPath}`);
        
        return {
          action: 'detailed',
          fileOperations: fileOperations,
          sourcePath: sourceFullPath,
          targetPath: fullTargetPath
        };
      } else {
        console.log(`[${pluginName}] 用户取消详细处理，返回冲突对话框`);
        return { action: 'return_to_conflict' }; // 🔥 关键修复：取消详细处理应返回冲突对话框，而不是结束流程
      }
    } catch (error) {
      console.error(`[${pluginName}] 详细冲突处理失败:`, error);
      return { action: 'cancel' };
    }
  }
  
  // 获取冲突文件列表
  async getConflictFiles(sourcePath, targetPath) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 获取冲突文件列表: ${sourcePath} -> ${targetPath}`);
    
    try {
      // 获取通信API实例 - 尝试多种方式
      let communicationAPI = null;
      
      // 方式1: 直接从全局获取
      if (window.communicationAPI) {
        communicationAPI = window.communicationAPI;
        console.log(`[${pluginName}] 从window.communicationAPI获取到CommunicationAPI`);
      }
      // 方式2: 从nzWorkflowManager命名空间获取
      else if (window.nzWorkflowManager && window.nzWorkflowManager.communicationAPI) {
        communicationAPI = window.nzWorkflowManager.communicationAPI;
        console.log(`[${pluginName}] 从window.nzWorkflowManager.communicationAPI获取到CommunicationAPI`);
      }
      // 方式3: 从模块化系统获取
      else if (window.nzModules && window.nzModules.communicationAPI) {
        communicationAPI = window.nzModules.communicationAPI;
        console.log(`[${pluginName}] 从window.nzModules.communicationAPI获取到CommunicationAPI`);
      }
      // 方式4: 从交互系统实例获取
      else if (this.communicationAPI) {
        communicationAPI = this.communicationAPI;
        console.log(`[${pluginName}] 从this.communicationAPI获取到CommunicationAPI`);
      }
      
      if (communicationAPI && typeof communicationAPI.listFiles === 'function') {
        console.log(`[${pluginName}] 使用CommunicationAPI获取文件列表`);
        
        // 构建完整路径 - 修复路径构建逻辑
        let sourceFullPath;
        let targetFullPath;
        
        // 获取当前工作目录（从全局状态或配置中获取）
        const currentDirectory = window.nzWorkflowManager?.currentDirectory || 
                               window.config?.DEFAULT_DIRECTORY || 
                               'D:\\共享网盘-Zero\\001.MJ-temp\\TEST用工作流';
        
        // 如果sourcePath是相对路径，构建完整路径
        if (!sourcePath.includes('\\') || !sourcePath.includes(':')) {
          sourceFullPath = `${currentDirectory}\\${sourcePath}`;
        } else {
          sourceFullPath = sourcePath;
        }
        
        // 构建目标路径（目标目录 + 源文件夹名称）
        const sourceName = sourcePath.split('\\').pop();
        targetFullPath = `${targetPath}\\${sourceName}`;
        
        console.log(`[${pluginName}] 源目录（完整路径）: ${sourceFullPath}`);
        console.log(`[${pluginName}] 目标目录（完整路径）: ${targetFullPath}`);
        
        const sourceFiles = await communicationAPI.listFiles(sourceFullPath);
        const targetFiles = await communicationAPI.listFiles(targetFullPath);
        
        console.log(`[${pluginName}] 源文件列表:`, sourceFiles);
        console.log(`[${pluginName}] 目标文件列表:`, targetFiles);
        
        // 找出冲突的文件（在两个目录中都存在的文件）
        const conflicts = [];
        
        if (sourceFiles && Array.isArray(sourceFiles) && targetFiles && Array.isArray(targetFiles)) {
          sourceFiles.forEach(sourceFile => {
            const conflictFile = targetFiles.find(targetFile => targetFile.name === sourceFile.name);
            if (conflictFile) {
              conflicts.push({
                name: sourceFile.name,
                sourceFile: sourceFile,
                targetFile: conflictFile
              });
            }
          });
        }
        
        console.log(`[${pluginName}] 发现 ${conflicts.length} 个冲突文件:`, conflicts);
        return conflicts;
      } else {
        console.error(`[${pluginName}] CommunicationAPI 未找到或listFiles方法不存在`);
        console.log(`[${pluginName}] 调试信息:`);
        console.log(`[${pluginName}]   window.communicationAPI:`, window.communicationAPI);
        console.log(`[${pluginName}]   window.nzWorkflowManager:`, window.nzWorkflowManager);
        console.log(`[${pluginName}]   window.nzModules:`, window.nzModules);
        console.log(`[${pluginName}]   this.communicationAPI:`, this.communicationAPI);
        console.log(`[${pluginName}]   communicationAPI变量:`, communicationAPI);
        
        if (communicationAPI) {
          console.log(`[${pluginName}]   communicationAPI.listFiles类型:`, typeof communicationAPI.listFiles);
          console.log(`[${pluginName}]   communicationAPI的所有方法:`, Object.getOwnPropertyNames(communicationAPI));
        }
        return [];
      }
    } catch (error) {
      console.error(`[${pluginName}] 获取冲突文件列表失败:`, error);
      return [];
    }
  }
  
  // 显示文件选择对话框
  async showFileSelectionDialog(conflictFiles) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 显示文件选择对话框，${conflictFiles.length} 个冲突文件`);
    
    return new Promise((resolve) => {
      // 🔥 关键修复：隐藏当前对话框而不是关闭，以便取消时可以返回
      if (this.currentDialog) {
        this.currentDialog.style.display = 'none';
      }
      
      const overlay = document.createElement('div');
      overlay.className = 'conflict-dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'conflict-dialog detailed-conflict-dialog';
      
      // 生成文件列表HTML
      const fileListHTML = conflictFiles.map((file, index) => `
        <div class="conflict-file-item" data-index="${index}">
          <div class="conflict-file-header">
            <span class="conflict-file-name">📄 ${file.name}</span>
          </div>
          <div class="conflict-file-actions">
            <label class="conflict-file-action">
              <input type="radio" name="action_${index}" value="skip" checked>
              <span>⏭️ 跳过</span>
            </label>
            <label class="conflict-file-action">
              <input type="radio" name="action_${index}" value="overwrite">
              <span>🔄 覆盖</span>
            </label>
            <label class="conflict-file-action">
              <input type="radio" name="action_${index}" value="rename">
              <span>📝 重命名</span>
            </label>
            <input type="text" class="conflict-file-rename-input" placeholder="输入新文件名（无需扩展名）" style="display: none;">
          </div>
        </div>
      `).join('');
      
      dialog.innerHTML = `
        <div class="conflict-dialog-header">
          <h3>🎯 文件级别冲突处理</h3>
        </div>
        <div class="conflict-dialog-content">
          <p>发现 <strong>${conflictFiles.length}</strong> 个冲突文件，请为每个文件选择处理方式：</p>
          <div class="conflict-files-container">
            ${fileListHTML}
          </div>
          <div class="conflict-batch-actions">
            <button class="batch-action-btn" data-action="skip">全部跳过</button>
            <button class="batch-action-btn" data-action="overwrite">全部覆盖</button>
          </div>
        </div>
        <div class="conflict-dialog-actions">
          <button class="conflict-btn conflict-btn-cancel" data-action="cancel">❌ 取消</button>
          <button class="conflict-btn conflict-btn-confirm" data-action="confirm">✅ 确定执行</button>
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      this.currentDialog = overlay;
      
      // 添加详细对话框样式
      this.addDetailedConflictDialogStyles();
      
      // 设置事件处理器 - 传递overlay参数
      this.setupDetailedDialogEventHandlers(dialog, conflictFiles, resolve, overlay);
      
      console.log(`[${pluginName}] 文件选择对话框已显示`);
    });
  }
  
  // 设置详细对话框事件处理器
  setupDetailedDialogEventHandlers(dialog, conflictFiles, resolve, overlay) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    // 处理重命名选项的显示/隐藏
    const renameRadios = dialog.querySelectorAll('input[value="rename"]');
    renameRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const fileItem = e.target.closest('.conflict-file-item');
        const renameInput = fileItem.querySelector('.conflict-file-rename-input');
        if (e.target.checked) {
          renameInput.style.display = 'block';
          renameInput.focus();
        }
      });
    });
    
    // 处理其他选项的隐藏重命名输入框
    const otherRadios = dialog.querySelectorAll('input[value="skip"], input[value="overwrite"]');
    otherRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const fileItem = e.target.closest('.conflict-file-item');
        const renameInput = fileItem.querySelector('.conflict-file-rename-input');
        if (e.target.checked) {
          renameInput.style.display = 'none';
          renameInput.value = '';
        }
      });
    });
    
    // 批量操作按钮
    const batchButtons = dialog.querySelectorAll('.batch-action-btn');
    batchButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const radios = dialog.querySelectorAll(`input[value="${action}"]`);
        radios.forEach(radio => {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        });
      });
    });
    
    // 主要按钮处理
    const cancelBtn = dialog.querySelector('[data-action="cancel"]');
    const confirmBtn = dialog.querySelector('[data-action="confirm"]');
    
    cancelBtn.addEventListener('click', () => {
      console.log(`[${pluginName}] 用户取消文件级别处理`);
      
      // 🔥 关键修复：移除文件选择对话框，恢复冲突对话框显示
      overlay.remove();
      
      // 查找被隐藏的冲突对话框并重新显示
      const hiddenConflictDialog = document.querySelector('.conflict-dialog-overlay[style*="display: none"]');
      if (hiddenConflictDialog) {
        hiddenConflictDialog.style.display = 'flex'; // 使用flex保持正确的居中布局
        this.currentDialog = hiddenConflictDialog; // 重新设置当前对话框
        console.log(`[${pluginName}] 已恢复冲突对话框显示`);
      }
      
      resolve(null); // 返回null表示用户取消，调用者会处理return_to_conflict逻辑
    });
    
    confirmBtn.addEventListener('click', () => {
      // 收集每个文件的操作选择
      const fileOperations = [];
      
      conflictFiles.forEach((file, index) => {
        const selectedRadio = dialog.querySelector(`input[name="action_${index}"]:checked`);
        const action = selectedRadio.value;
        
        const operation = {
          fileName: file.name,
          action: action
        };
        
        if (action === 'rename') {
          const renameInput = dialog.querySelector(`[data-index="${index}"] .conflict-file-rename-input`);
          const newName = renameInput.value.trim();
          if (!newName) {
            alert(`请为文件 "${file.name}" 输入新的文件名`);
            return;
          }
          operation.newName = newName;
        }
        
        fileOperations.push(operation);
      });
      
      console.log(`[${pluginName}] 收集到文件操作:`, fileOperations);
      
      // 🔥 关键修复：移除文件选择对话框，保持冲突对话框关闭（正常完成流程）
      overlay.remove();
      // 注意：这里不恢复冲突对话框显示，因为操作已完成，应该关闭所有对话框
      // 找到被隐藏的冲突对话框并移除
      const hiddenConflictDialog = document.querySelector('.conflict-dialog-overlay[style*="display: none"]');
      if (hiddenConflictDialog) {
        hiddenConflictDialog.remove();
      }
      this.currentDialog = null;
      resolve(fileOperations);
    });
  }
  
  // 应用对话框主题样式
  applyDialogTheme(dialog) {
    try {
      const isLightTheme = this.detectLightTheme();
      
      // 根据主题设置颜色
      const colors = isLightTheme ? {
        background: '#ffffff',
        text: '#333333', 
        border: '#dee2e6'
      } : {
        background: '#353535',
        text: '#ffffff',
        border: '#555555'
      };
      
      // 应用样式到对话框
      if (dialog) {
        dialog.style.background = colors.background;
        dialog.style.color = colors.text;
        dialog.style.borderColor = colors.border;
        
        // 应用到子元素
        const elements = dialog.querySelectorAll('h3, p, div, span');
        elements.forEach(el => {
          el.style.color = colors.text;
        });
      }
    } catch (error) {
      console.warn('[NZWorkflowManager] 应用对话框主题失败:', error);
    }
  }

  // 检测是否为明亮主题
  detectLightTheme() {
    try {
      const computedStyle = getComputedStyle(document.documentElement);
      const bgColor = computedStyle.getPropertyValue('--comfy-menu-bg').trim();
      
      if (bgColor) {
        // 计算亮度
        const rgb = this.hexToRgb(bgColor);
        if (rgb) {
          const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
          return brightness > 128;
        }
      }
      
      // 检查body背景色作为备用
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      if (bodyBg) {
        const match = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const brightness = (parseInt(match[1]) * 299 + parseInt(match[2]) * 587 + parseInt(match[3]) * 114) / 1000;
          return brightness > 128;
        }
      }
      
      return false; // 默认为暗色主题
    } catch (error) {
      console.warn('[NZWorkflowManager] 主题检测失败:', error);
      return false;
    }
  }
  
  // 将十六进制颜色转换为RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // 添加详细冲突对话框样式
  addDetailedConflictDialogStyles() {
    const existingStyle = document.getElementById('nz-detailed-conflict-dialog-styles');
    if (existingStyle) return;
    
    // 检测当前主题
    const isLightTheme = this.detectLightTheme();
    console.log(`[NZWorkflowManager] 对话框样式检测到主题: ${isLightTheme ? 'light' : 'dark'}`);
    
    // 根据主题设置颜色
    const colors = isLightTheme ? {
      background: '#ffffff',
      text: '#333333', 
      inputBg: '#f8f9fa',
      border: '#dee2e6',
      menuBg: '#f5f5f5'
    } : {
      background: '#353535',
      text: '#ffffff',
      inputBg: '#2a2a2a', 
      border: '#555555',
      menuBg: '#353535'
    };
    
    const style = document.createElement('style');
    style.id = 'nz-detailed-conflict-dialog-styles';
    style.textContent = `
      .detailed-conflict-dialog {
        max-width: 600px;
        max-height: 80vh;
        width: 90vw;
        background: ${colors.background} !important;
        color: ${colors.text} !important;
        border: 1px solid ${colors.border} !important;
      }
      
      .detailed-conflict-dialog h3 {
        color: ${colors.text} !important;
        margin: 0 0 15px 0;
      }
      
      .detailed-conflict-dialog p {
        color: ${colors.text} !important;
        margin: 10px 0;
      }
      
      .detailed-conflict-dialog strong {
        color: ${colors.text} !important;
      }
      
      .conflict-files-container {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid ${colors.border};
        border-radius: 4px;
        padding: 10px;
        margin: 15px 0;
        background: ${colors.inputBg};
      }
      
      .conflict-file-item {
        border: 1px solid ${colors.border};
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 10px;
        background: ${colors.inputBg};
      }
      
      .conflict-file-item:last-child {
        margin-bottom: 0;
      }
      
      .conflict-file-header {
        margin-bottom: 8px;
      }
      
      .conflict-file-name {
        font-weight: bold;
        color: ${colors.text} !important;
      }
      
      .conflict-file-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        align-items: center;
      }
      
      .conflict-file-action {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 14px;
      }
      
      .conflict-file-action input[type="radio"] {
        margin-right: 5px;
        accent-color: ${colors.text};
      }
      
      .conflict-file-action span {
        color: ${colors.text} !important;
        font-weight: 500;
      }
      
      .conflict-file-rename-input {
        flex: 1;
        min-width: 150px;
        padding: 4px 8px;
        border: 1px solid ${colors.border};
        border-radius: 3px;
        font-size: 13px;
        background: ${colors.inputBg} !important;
        color: ${colors.text} !important;
      }
      
      .conflict-batch-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin: 15px 0;
        padding: 10px;
        background: ${colors.inputBg};
        border-radius: 4px;
        border: 1px solid ${colors.border};
      }
      
      .batch-action-btn {
        padding: 6px 12px;
        border: 1px solid ${colors.border};
        border-radius: 3px;
        background: ${colors.menuBg} !important;
        color: ${colors.text} !important;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .batch-action-btn:hover {
        background: ${colors.inputBg} !important;
        border-color: ${colors.text};
      }
      
      .batch-action-btn:active {
        background: #ddd;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // 处理键盘事件
  handleKeyDown(e) {
    if (e.key === 'Escape' && this.currentDialog) {
      this.handleCancel();
    }
  }
  
  // 处理取消
  handleCancel() {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 处理取消操作`);
    
    if (this.isProcessing) {
      console.log(`[${pluginName}] 正在处理中，忽略取消`);
      return;
    }
    
    this.closeDialog();
    if (this.resolvePromise) {
      console.log(`[${pluginName}] 取消操作，返回 cancel`);
      this.resolvePromise({ action: 'cancel' });
      this.resolvePromise = null;
    }
  }
  
  // 关闭对话框
  closeDialog() {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 关闭冲突对话框`);
    
    if (this.currentDialog) {
      // 移除键盘事件监听器
      document.removeEventListener('keydown', this.handleKeyDown.bind(this));
      
      // 移除对话框
      if (this.currentDialog.parentNode) {
        document.body.removeChild(this.currentDialog);
      }
      this.currentDialog = null;
    }
    
    // 重置状态
    this.isProcessing = false;
    console.log(`[${pluginName}] 重置 isProcessing = false`);
  }
  
  // 添加冲突对话框样式
  addConflictDialogStyles() {
    const existingStyle = document.getElementById('nz-conflict-dialog-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'nz-conflict-dialog-styles';
    style.textContent = `
      .conflict-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10010;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .conflict-dialog {
        background: var(--bg-color, #2a2a2a);
        border: 2px solid #ff9800;
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
        min-width: 400px;
        max-width: 500px;
        overflow: hidden;
        animation: conflictDialogShow 0.3s ease-out;
      }
      
      @keyframes conflictDialogShow {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      .conflict-dialog-header {
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
        padding: 16px 20px;
        text-align: center;
      }
      
      .conflict-dialog-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .conflict-dialog-content {
        padding: 24px 20px;
        color: var(--text-color, #ffffff);
      }
      
      .conflict-dialog-content p {
        margin: 0 0 12px 0;
        line-height: 1.5;
      }
      
      .conflict-item-info {
        background: var(--hover-color, #404040);
        border: 1px solid var(--border-color, #444);
        border-radius: 6px;
        padding: 12px;
        margin: 12px 0;
        font-family: monospace;
        word-break: break-all;
      }
      
      .conflict-dialog-actions {
        padding: 16px 20px;
        border-top: 1px solid var(--border-color, #444);
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .conflict-btn {
        padding: 10px 16px;
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        min-width: 120px;
        transition: all 0.2s ease;
      }
      
      .conflict-btn:disabled {
        cursor: not-allowed;
        opacity: 0.6 !important;
      }
      
      .conflict-btn-cancel {
        background: #666;
        color: white;
        border-color: #666;
      }
      
      .conflict-btn-cancel:hover:not(:disabled) {
        background: #777;
        border-color: #777;
        transform: translateY(-1px);
      }
      
      .conflict-btn-rename {
        background: #2196f3;
        color: white;
        border-color: #2196f3;
      }
      
      .conflict-btn-rename:hover:not(:disabled) {
        background: #1976d2;
        border-color: #1976d2;
        transform: translateY(-1px);
      }
      
      .conflict-btn-replace {
        background: #ff5722;
        color: white;
        border-color: #ff5722;
      }
      
      .conflict-btn-replace:hover:not(:disabled) {
        background: #d84315;
        border-color: #d84315;
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
  }
}

// ====== 多选管理器 ======
class MultiSelectManager {
  constructor(contextMenuManager = null) {
    this.selectedItems = new Set();
    this.lastSelectedItem = null;
    this.isShiftPressed = false;
    this.isCtrlPressed = false;
    this.multiSelectMode = false; // 新增：多选模式状态
    this.pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    this.contextMenuManager = contextMenuManager; // 引用ContextMenuManager实例
    
    // 监听键盘事件
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') this.isShiftPressed = true;
      if (e.key === 'Control' || e.key === 'Meta') this.isCtrlPressed = true;
      
      // ESC键取消选择
      if (e.key === 'Escape') {
        this.clearSelection();
      }
      
      // Delete键批量删除
      if (e.key === 'Delete' && this.selectedItems.size > 0) {
        this.showBatchDeleteDialog();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') this.isShiftPressed = false;
      if (e.key === 'Control' || e.key === 'Meta') this.isCtrlPressed = false;
    });
  }
  
  // 处理项目点击
  handleItemClick(itemElement, filePath, fileName, itemType, event) {
    event.stopPropagation();
    
    const itemId = `${itemType}:${filePath}`;
    
    // 如果处于多选模式，直接切换选择状态
    if (this.multiSelectMode) {
      this.toggleSelection(itemElement, itemId, filePath, fileName, itemType);
      return true; // 表示处理了选择
    }
    
    // 检查修饰键
    if (this.isCtrlPressed) {
      // Ctrl+点击：切换选择状态
      this.toggleSelection(itemElement, itemId, filePath, fileName, itemType);
      return true; // 表示处理了选择
    } else if (this.isShiftPressed && this.lastSelectedItem) {
      // Shift+点击：范围选择
      this.selectRange(this.lastSelectedItem, itemElement, itemId, filePath, fileName, itemType);
      return true; // 表示处理了选择
    } else if (this.selectedItems.has(itemId)) {
      // 点击已选中的项目，保持选择状态
      return true; // 表示处理了选择
    }
    
    return false; // 未处理选择，允许正常点击行为
  }
  
  // 切换选择状态
  toggleSelection(itemElement, itemId, filePath, fileName, itemType) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    if (this.selectedItems.has(itemId)) {
      this.removeFromSelection(itemId);
      console.log(`[${pluginName}] 取消选择: ${fileName}`);
    } else {
      this.addToSelection(itemElement, filePath, fileName, itemType);
      console.log(`[${pluginName}] 添加选择: ${fileName}`);
    }
    
    this.updateSelectionDisplay();
    this.updateMultiSelectButtonState();
    // 更新批量操作栏状态
    this.updateBatchOperationsBar();
  }
  
  // 添加到选择
  addToSelection(itemElement, filePath, fileName, itemType) {
    const itemId = `${itemType}:${filePath}`;
    
    // 避免重复添加
    if (this.selectedItems.has(itemId)) {
      return;
    }
    
    const selectionData = {
      element: itemElement,
      filePath: filePath,
      fileName: fileName,
      itemType: itemType,
      id: itemId
    };
    
    this.selectedItems.add(itemId);
    this.selectedItems[itemId] = selectionData; // 存储详细信息
    this.lastSelectedItem = itemElement;
    
    // 添加视觉选择效果
    itemElement.classList.add('nz-selected');
  }
  
  // 从选择中移除
  removeFromSelection(itemId) {
    if (this.selectedItems.has(itemId)) {
      const selectionData = this.selectedItems[itemId];
      if (selectionData && selectionData.element) {
        selectionData.element.classList.remove('nz-selected');
      }
      
      this.selectedItems.delete(itemId);
      delete this.selectedItems[itemId];
    }
  }
  
  // 范围选择
  selectRange(startElement, endElement, endItemId, endFilePath, endFileName, endItemType) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    // 获取所有可选择的项目
    const selectableItems = Array.from(document.querySelectorAll('.file-item, .directory-item'));
    
    const startIndex = selectableItems.indexOf(startElement);
    const endIndex = selectableItems.indexOf(endElement);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    // 选择范围内的所有项目
    for (let i = minIndex; i <= maxIndex; i++) {
      const element = selectableItems[i];
      const filePath = element.dataset.filePath;
      const fileName = element.dataset.fileName || element.textContent.trim();
      const itemType = element.classList.contains('directory-item') ? 'directory' : 'file';
      
      if (filePath) {
        this.addToSelection(element, filePath, fileName, itemType);
      }
    }
    
    console.log(`[${pluginName}] 范围选择: ${maxIndex - minIndex + 1} 个项目`);
    this.updateSelectionDisplay();
    this.updateMultiSelectButtonState();
  }
  
  // 清除所有选择
  clearSelection() {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    // 移除视觉效果
    this.selectedItems.forEach((_, itemId) => {
      const selectionData = this.selectedItems[itemId];
      if (selectionData && selectionData.element) {
        selectionData.element.classList.remove('nz-selected');
      }
    });
    
    this.selectedItems.clear();
    this.lastSelectedItem = null;
    
    console.log(`[${pluginName}] 清除所有选择`);
    this.updateSelectionDisplay();
    this.updateMultiSelectButtonState();
    // 更新批量操作栏状态（包括禁用清除按钮）
    this.updateBatchOperationsBar();
  }
  
  // 获取选中的项目信息
  getSelectedItems() {
    const items = [];
    this.selectedItems.forEach((_, itemId) => {
      const selectionData = this.selectedItems[itemId];
      if (selectionData) {
        items.push({
          filePath: selectionData.filePath,
          fileName: selectionData.fileName,
          itemType: selectionData.itemType,
          id: selectionData.id
        });
      }
    });
    return items;
  }
  
  // 获取选中的文件路径
  getSelectedPaths() {
    const paths = [];
    this.selectedItems.forEach((_, itemId) => {
      const selectionData = this.selectedItems[itemId];
      if (selectionData) {
        paths.push(selectionData.filePath);
      }
    });
    return paths;
  }
  
  // 获取选中的文件名
  getSelectedNames() {
    const names = [];
    this.selectedItems.forEach((_, itemId) => {
      const selectionData = this.selectedItems[itemId];
      if (selectionData) {
        names.push(selectionData.fileName);
      }
    });
    return names;
  }
  
  // 更新选择显示
  updateSelectionDisplay() {
    const selectedCount = this.selectedItems.size;
    const statusElement = document.querySelector('.nz-selection-status');
    
    if (statusElement) {
      if (selectedCount > 0) {
        statusElement.textContent = `已选择 ${selectedCount} 个项目`;
        statusElement.style.display = 'block';
      } else {
        statusElement.style.display = 'none';
      }
    }
  }
  
  // 更新多选按钮状态
  updateMultiSelectButtonState() {
    const multiSelectBtn = document.querySelector('.multi-select-toggle');
    const selectedCount = this.selectedItems.size;
    
    if (multiSelectBtn) {
      if (this.multiSelectMode) {
        multiSelectBtn.classList.add('active');
        multiSelectBtn.innerHTML = `🔲 多选模式 (${selectedCount})`;
      } else {
        multiSelectBtn.classList.remove('active');
        multiSelectBtn.innerHTML = selectedCount > 0 ? `✅ 已选择 (${selectedCount})` : '☐ 多选模式';
      }
    }
  }
  
  // 设置多选模式
  setMultiSelectMode(enabled) {
    this.multiSelectMode = enabled;
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 多选模式: ${enabled ? '开启' : '关闭'}`);
    
    // 更新UI状态
    const multiSelectBtn = document.getElementById('nz-multi-select-btn');
    if (multiSelectBtn) {
      if (enabled) {
        multiSelectBtn.classList.add('nz-multi-select-toggle', 'active');
        multiSelectBtn.title = '退出多选模式';
        // 显示多选提示
        if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
          window.nzWorkflowManager.showNotification('多选模式已开启，点击文件/目录进行选择', 'info');
        }
        // 立即显示批量操作栏
        this.showBatchOperationsBar();
      } else {
        multiSelectBtn.classList.remove('active');
        multiSelectBtn.title = '多选模式';
        // 退出多选模式时清除所有选择并隐藏批量操作栏
        this.clearSelectionInternal();
        this.hideBatchOperationsBar();
      }
    }
  }
  
  // 切换多选模式
  toggleMultiSelectMode() {
    this.setMultiSelectMode(!this.multiSelectMode);
    this.updateMultiSelectButtonState();
  }
  
  // 检查是否处于多选模式
  isMultiSelectMode() {
    return this.multiSelectMode;
  }
  
  // 内部清除选择方法，不触发UI更新
  clearSelectionInternal() {
    // 移除所有选中元素的高亮
    this.selectedItems.forEach((itemId) => {
      const selectionData = this.selectedItems[itemId];
      if (selectionData && selectionData.element) {
        selectionData.element.classList.remove('nz-selected');
      }
      // 清理对象属性
      delete this.selectedItems[itemId];
    });
    
    // 清空Set
    this.selectedItems.clear();
    this.lastSelectedItem = null;
  }
  
  // 显示批量操作栏
  showBatchOperationsBar() {
    // 移除现有的批量操作栏
    this.hideBatchOperationsBar();
    
    // 查找工具栏位置（路径显示区域）
    const pathDisplay = document.querySelector('.nz-path-display');
    if (!pathDisplay) return;
    
    // 创建批量操作栏
    const batchBar = document.createElement('div');
    batchBar.className = 'nz-batch-operations nz-batch-toolbar';
    batchBar.innerHTML = `
      <div class="nz-batch-info">
        <span class="nz-batch-count">多选模式已开启 ${this.selectedItems.size > 0 ? `(已选择 ${this.selectedItems.size} 个项目)` : ''}</span>
        <button class="nz-batch-btn nz-batch-exit" title="退出多选模式">
          <i class="pi pi-sign-out"></i><span class="btn-text">退出</span>
        </button>
        <button class="nz-batch-btn nz-batch-clear" title="清除选择" ${this.selectedItems.size === 0 ? 'disabled' : ''}>
          <i class="pi pi-times"></i><span class="btn-text">清除</span>
        </button>
      </div>
      <div class="nz-batch-actions">
        <button class="nz-batch-btn nz-batch-move" title="移动到..." ${this.selectedItems.size === 0 ? 'disabled' : ''}>
          <i class="pi pi-arrow-right"></i><span class="btn-text">移动</span>
        </button>
        <button class="nz-batch-btn nz-batch-copy" title="复制到..." ${this.selectedItems.size === 0 ? 'disabled' : ''}>
          <i class="pi pi-copy"></i><span class="btn-text">复制</span>
        </button>
        <button class="nz-batch-btn nz-batch-delete danger" title="批量删除" ${this.selectedItems.size === 0 ? 'disabled' : ''}>
          <i class="pi pi-trash"></i><span class="btn-text">删除</span>
        </button>
      </div>
    `;
    
    // 将批量操作栏插入到路径栏后面
    pathDisplay.parentNode.insertBefore(batchBar, pathDisplay.nextSibling);
    
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    // 绑定批量操作事件
    batchBar.querySelector('.nz-batch-exit').addEventListener('click', () => {
      console.log(`[${pluginName}] 退出多选模式按钮点击`);
      this.setMultiSelectMode(false);
    });
    
    batchBar.querySelector('.nz-batch-clear').addEventListener('click', () => {
      if (this.selectedItems.size > 0) {
        console.log(`[${pluginName}] 清除选择按钮点击`);
        this.clearSelection();
        // clearSelection() 会自动调用 updateBatchOperationsBar() 来更新状态
      }
    });
    
    batchBar.querySelector('.nz-batch-move').addEventListener('click', () => {
      if (this.selectedItems.size > 0) {
        this.showBatchMoveDialog();
      }
    });
    
    batchBar.querySelector('.nz-batch-copy').addEventListener('click', () => {
      if (this.selectedItems.size > 0) {
        this.showBatchCopyDialog();
      }
    });
    
    batchBar.querySelector('.nz-batch-delete').addEventListener('click', () => {
      if (this.selectedItems.size > 0) {
        this.showBatchDeleteDialog();
      }
    });
  }
  
  // 隐藏批量操作栏
  hideBatchOperationsBar() {
    const existingBatchBar = document.querySelector('.nz-batch-operations');
    if (existingBatchBar) {
      existingBatchBar.remove();
    }
  }
  
  // 更新批量操作栏状态（当选择项发生变化时调用）
  updateBatchOperationsBar() {
    if (this.multiSelectMode) {
      this.showBatchOperationsBar();
    }
  }
  
  // 获取选中的项目列表（正确版本）
  getSelectedItems() {
    const items = [];
    this.selectedItems.forEach((_, itemId) => {
      const selectionData = this.selectedItems[itemId];
      if (selectionData) {
        items.push({
          filePath: selectionData.filePath,
          fileName: selectionData.fileName,
          itemType: selectionData.itemType,
          id: itemId
        });
      }
    });
    return items;
  }
  
  // 显示批量移动对话框（使用右键菜单相同的树状目录选择）
  async showBatchMoveDialog() {
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length === 0) return;
    
    try {
      // 获取目录列表（使用与右键菜单相同的方法）
      const directories = await this.getDirectoryList();
      console.log(`[${this.pluginName}] 📁 获取到的目录列表 (批量移动):`, directories);
      
      // 如果没有目录或目录为空，直接显示目录树选择器
      if (!directories || directories.length === 0) {
        this.showDirectoryTreeSelector(selectedItems, 'move');
        return;
      }
      
      // 创建与右键菜单相同的树状菜单
      const menuItems = [
        {
          label: '📁 选择其他目录...',
          action: () => {
            this.showDirectoryTreeSelector(selectedItems, 'move');
          }
        },
        { separator: true },
        ...directories.slice(0, 8).map(dir => ({
          label: `📁 ${dir.name}`,
          action: () => {
            const selectedPaths = selectedItems.map(item => item.filePath);
            this.performBatchMove(selectedPaths, dir.path);
          }
        }))
      ];
      
      // 显示目录选择菜单
      this.showDirectorySelectionMenu(menuItems, `选择移动目标目录 (${selectedItems.length} 个项目)`);
    } catch (error) {
      console.error(`[${this.pluginName}] 显示批量移动对话框失败:`, error);
      // 降级到简单对话框
      if (window.dialogManager) {
        const targetPath = await window.dialogManager.showDirectoryChooser(
          '选择目标目录',
          '请选择要移动到的目标目录：'
        );
        
        if (targetPath) {
          const selectedPaths = selectedItems.map(item => item.filePath);
          await this.performBatchMove(selectedPaths, targetPath);
        }
      }
    }
  }
  
  // 显示批量复制对话框（使用右键菜单相同的树状目录选择）
  async showBatchCopyDialog() {
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length === 0) return;
    
    try {
      // 获取目录列表（使用与右键菜单相同的方法）
      const directories = await this.getDirectoryList();
      console.log(`[${this.pluginName}] 📁 获取到的目录列表 (批量复制):`, directories);
      
      // 如果没有目录或目录为空，直接显示目录树选择器
      if (!directories || directories.length === 0) {
        this.showDirectoryTreeSelector(selectedItems, 'copy');
        return;
      }
      
      // 创建与右键菜单相同的树状菜单
      const menuItems = [
        {
          label: '📁 选择其他目录...',
          action: () => {
            this.showDirectoryTreeSelector(selectedItems, 'copy');
          }
        },
        { separator: true },
        ...directories.slice(0, 8).map(dir => ({
          label: `📁 ${dir.name}`,
          action: () => {
            const selectedPaths = selectedItems.map(item => item.filePath);
            this.performBatchCopy(selectedPaths, dir.path);
          }
        }))
      ];
      
      // 显示目录选择菜单
      this.showDirectorySelectionMenu(menuItems, `选择复制目标目录 (${selectedItems.length} 个项目)`);
    } catch (error) {
      console.error(`[${this.pluginName}] 显示批量复制对话框失败:`, error);
      // 降级到简单对话框
      if (window.dialogManager) {
        const targetPath = await window.dialogManager.showDirectoryChooser(
          '选择目标目录',
          '请选择要复制到的目标目录：'
        );
        
        if (targetPath) {
          const selectedPaths = selectedItems.map(item => item.filePath);
          await this.performBatchCopy(selectedPaths, targetPath);
        }
      }
    }
  }

  // 显示目录树选择器（用于批量操作中的"选择其他目录"）
  async showDirectoryTreeSelector(selectedItems, operation) {
    try {
      if (window.nzWorkflowManager && window.nzWorkflowManager.dialogManager && window.nzWorkflowManager.dialogManager.showDirectoryTreeChooser) {
        window.nzWorkflowManager.dialogManager.showDirectoryTreeChooser((selectedPath) => {
          if (selectedPath) {
            const selectedPaths = selectedItems.map(item => item.filePath);
            if (operation === 'move') {
              this.performBatchMove(selectedPaths, selectedPath);
            } else if (operation === 'copy') {
              this.performBatchCopy(selectedPaths, selectedPath);
            }
          }
        });
      } else {
        // 降级到简单输入对话框
        const targetPath = await this.showDirectorySelector(`选择${operation === 'move' ? '移动' : '复制'}目标目录`, `请选择要${operation === 'move' ? '移动到' : '复制到'}的目录：`);
        if (targetPath) {
          const selectedPaths = selectedItems.map(item => item.filePath);
          if (operation === 'move') {
            this.performBatchMove(selectedPaths, targetPath);
          } else if (operation === 'copy') {
            this.performBatchCopy(selectedPaths, targetPath);
          }
        }
      }
    } catch (error) {
      console.error(`[${this.pluginName}] 显示目录树选择器失败:`, error);
      window.nzWorkflowManager.showNotification(`操作失败: ${error.message}`, 'error');
    }
  }


  // 显示目录选择菜单（用于批量操作）
  showDirectorySelectionMenu(menuItems, title) {
    // 创建菜单容器
    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'nz-dialog-overlay';
    menuOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10020;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const menuContainer = document.createElement('div');
    menuContainer.className = 'nz-directory-selection-menu';
    menuContainer.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      min-width: 300px;
      max-width: 500px;
      max-height: 60vh;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #e5e5e5;
      font-weight: 600;
      font-size: 16px;
      color: #333;
    `;
    header.textContent = title;

    const menuList = document.createElement('div');
    menuList.style.cssText = 'padding: 8px 0;';

    menuItems.forEach((item, index) => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.style.cssText = `
          height: 1px;
          background: #e5e5e5;
          margin: 4px 0;
        `;
        menuList.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'nz-menu-item';
        menuItem.style.cssText = `
          padding: 12px 20px;
          cursor: pointer;
          transition: background-color 0.2s;
          color: #333;
          font-size: 14px;
        `;
        menuItem.textContent = item.label;

        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.backgroundColor = '#f5f5f5';
        });

        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.backgroundColor = '';
        });

        menuItem.addEventListener('click', () => {
          document.body.removeChild(menuOverlay);
          if (item.action) {
            item.action();
          }
        });

        menuList.appendChild(menuItem);
      }
    });

    const closeButton = document.createElement('div');
    closeButton.style.cssText = `
      padding: 12px 20px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
      cursor: pointer;
      color: #666;
      font-size: 14px;
    `;
    closeButton.textContent = '取消';

    closeButton.addEventListener('click', () => {
      document.body.removeChild(menuOverlay);
    });

    menuContainer.appendChild(header);
    menuContainer.appendChild(menuList);
    menuContainer.appendChild(closeButton);
    menuOverlay.appendChild(menuContainer);

    // 点击背景关闭
    menuOverlay.addEventListener('click', (e) => {
      if (e.target === menuOverlay) {
        document.body.removeChild(menuOverlay);
      }
    });

    document.body.appendChild(menuOverlay);
  }

  // 显示批量删除对话框
  async showBatchDeleteDialog() {
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length === 0) return;
    
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    // 统计文件和目录数量
    const fileCount = selectedItems.filter(item => item.itemType === 'file').length;
    const dirCount = selectedItems.filter(item => item.itemType === 'directory').length;
    
    let message = `确定要删除这 ${selectedItems.length} 个项目吗？\n\n`;
    if (fileCount > 0) message += `文件: ${fileCount} 个\n`;
    if (dirCount > 0) message += `目录: ${dirCount} 个\n`;
    message += `\n此操作不可撤销。`;
    
    if (window.dialogManager) {
      const confirmed = await window.dialogManager.showConfirm('批量删除确认', message);
      
      if (confirmed) {
        await this.performBatchDelete(selectedItems);
      }
    }
  }
  
  // 执行批量移动
  async performBatchMove(sourcePaths, targetPath) {
    try {
      const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
      
      // 优先使用 workflowManager 的统一方法，带确认对话框
      if (window.workflowManager && window.workflowManager.performMultiDragMove) {
        await window.workflowManager.performMultiDragMove(sourcePaths, targetPath, false); // false = 显示确认对话框
        return;
      }
      
      // 降级到自定义实现
      if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
        window.nzWorkflowManager.showNotification(`正在移动 ${sourcePaths.length} 个项目...`, 'info');
      }
      
      let successCount = 0;
      let failCount = 0;
      let cancelCount = 0;
      
      for (const sourcePath of sourcePaths) {
        try {
          let result = null;
          
          // 检查是文件还是目录
          const isDirectory = await this.contextMenuManager.isDirectoryPath(sourcePath);
          
          // 优先使用模块化的通信API
          if (this.communicationAPI) {
            if (isDirectory) {
              result = await this.communicationAPI.moveDirectory(sourcePath, targetPath);
            } else {
              result = await this.communicationAPI.moveFile(sourcePath, targetPath);
            }
          } else if (window.fileOperationsAPI) {
            if (isDirectory) {
              result = await window.fileOperationsAPI.moveDirectory(sourcePath, targetPath);
            } else {
              result = await window.fileOperationsAPI.moveFile(sourcePath, targetPath);
            }
          } else {
            failCount++;
            console.error(`[${pluginName}] 没有可用的文件操作API`);
            continue;
          }
          
          if (result && result.success) {
            successCount++;
          } else {
            // 检查是否是用户取消操作
            if (result && result.error && result.error.includes('用户取消操作')) {
              cancelCount++;
              console.log(`[${pluginName}] 用户取消移动: ${sourcePath}`);
              // 用户取消操作时，停止后续移动
              break;
            } else {
              failCount++;
            }
          }
        } catch (error) {
          failCount++;
          console.error(`[${pluginName}] 移动${await this.contextMenuManager.isDirectoryPath(sourcePath) ? '目录' : '文件'}失败: ${sourcePath}`, error);
        }
      }
      
      // 显示结果
      if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
        if (cancelCount > 0) {
          window.nzWorkflowManager.showNotification(`批量移动已取消`, 'info');
        } else if (failCount === 0) {
          window.nzWorkflowManager.showNotification(`成功移动 ${successCount} 个项目`, 'success');
        } else {
          window.nzWorkflowManager.showNotification(`移动完成：成功 ${successCount} 个，失败 ${failCount} 个`, 'warning');
        }
      }
      
      // 清除选择并刷新，但保持多选模式
      this.clearSelection();
      
      // 强制刷新目标目录显示
      try {
        const config = this.config || window.config || window.nzWorkflowManager?.config;
        if (config && window.loadDirectory) {
          // 刷新目标目录而不是当前目录
          console.log(`[${pluginName}] 批量移动后刷新目标目录: ${targetPath}`);
          window.loadDirectory(targetPath);
        } else if (window.workflowManager && window.workflowManager.loadDirectory) {
          // 降级方案：使用工作流管理器的loadDirectory方法，刷新目标目录
          console.log(`[${pluginName}] 使用workflowManager刷新目标目录: ${targetPath}`);
          window.workflowManager.loadDirectory(targetPath);
        } else {
          console.warn(`[${pluginName}] 无法刷新目录：缺少必要的刷新方法或配置`);
        }
      } catch (error) {
        console.error(`[${pluginName}] 批量移动后刷新失败:`, error);
      }
      
      // 确保多选按钮状态正确
      setTimeout(() => {
        if (this.isMultiSelectMode()) {
          this.updateMultiSelectButtonState();
        }
      }, 100);
    } catch (error) {
      const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
      console.error(`[${pluginName}] 批量移动失败:`, error);
      if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
        window.nzWorkflowManager.showNotification(`批量移动失败: ${error.message}`, 'error');
      }
    }
  }
  
  // 执行批量复制
  async performBatchCopy(sourcePaths, targetPath) {
    try {
      const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
      
      if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
        window.nzWorkflowManager.showNotification(`正在复制 ${sourcePaths.length} 个项目...`, 'info');
      }
      
      let successCount = 0;
      let failCount = 0;
      let cancelCount = 0;
      
      for (const sourcePath of sourcePaths) {
        try {
          let result = null;
          
          // 检查是文件还是目录
          const isDirectory = await this.contextMenuManager.isDirectoryPath(sourcePath);
          
          // 优先使用模块化的通信API
          if (this.communicationAPI) {
            if (isDirectory) {
              result = await this.communicationAPI.copyDirectory(sourcePath, targetPath);
            } else {
              result = await this.communicationAPI.copyFile(sourcePath, targetPath);
            }
          } else if (window.fileOperationsAPI) {
            if (isDirectory) {
              result = await window.fileOperationsAPI.copyDirectory(sourcePath, targetPath);
            } else {
              result = await window.fileOperationsAPI.copyFile(sourcePath, targetPath);
            }
          } else {
            failCount++;
            console.error(`[${pluginName}] 没有可用的文件操作API`);
            continue;
          }
          
          if (result && result.success) {
            successCount++;
          } else {
            // 检查是否是用户取消操作
            if (result && result.error && result.error.includes('用户取消操作')) {
              cancelCount++;
              console.log(`[${pluginName}] 用户取消复制: ${sourcePath}`);
              // 用户取消操作时，停止后续复制
              break;
            } else {
              failCount++;
            }
          }
        } catch (error) {
          failCount++;
          console.error(`[${pluginName}] 复制${await this.contextMenuManager.isDirectoryPath(sourcePath) ? '目录' : '文件'}失败: ${sourcePath}`, error);
        }
      }
      
      // 显示结果
      if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
        if (cancelCount > 0) {
          window.nzWorkflowManager.showNotification(`批量复制已取消`, 'info');
        } else if (failCount === 0) {
          window.nzWorkflowManager.showNotification(`成功复制 ${successCount} 个项目`, 'success');
        } else {
          window.nzWorkflowManager.showNotification(`复制完成：成功 ${successCount} 个，失败 ${failCount} 个`, 'warning');
        }
      }
      
      // 清除选择，但保持多选模式
      this.clearSelection();
      
      // 确保多选按钮状态正确
      setTimeout(() => {
        if (this.isMultiSelectMode()) {
          this.updateMultiSelectButtonState();
        }
      }, 100);
    } catch (error) {
      const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
      console.error(`[${pluginName}] 批量复制失败:`, error);
      if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
        window.nzWorkflowManager.showNotification(`批量复制失败: ${error.message}`, 'error');
      }
    }
  }

  // 执行批量删除
  async performBatchDelete(items) {
    const pluginName = window.config ? window.config.PLUGIN_NAME : 'NZ工作流管理器';
    
    let successCount = 0;
    let failCount = 0;
    
    for (const item of items) {
      try {
        let result = null;
        
        // 检查是文件还是目录
        const isDirectory = await this.contextMenuManager.isDirectoryPath(item.filePath);
        
        // 优先使用模块化的通信API
        if (this.communicationAPI) {
          if (isDirectory) {
            result = await this.communicationAPI.deleteDirectory(item.filePath);
          } else {
            result = await this.communicationAPI.deleteFile(item.filePath);
          }
        } else if (window.fileOperationsAPI) {
          if (isDirectory) {
            result = await window.fileOperationsAPI.deleteDirectory(item.filePath);
          } else {
            result = await window.fileOperationsAPI.deleteFile(item.filePath);
          }
        } else {
          failCount++;
          console.error(`[${pluginName}] 没有可用的文件操作API`);
          continue;
        }
          
        if (result.success) {
          successCount++;
          console.log(`[${pluginName}] 删除成功: ${item.fileName}`);
        } else {
          failCount++;
          console.error(`[${pluginName}] 删除失败: ${item.fileName || item.filePath || 'unknown'}`, result.error);
        }
      } catch (error) {
        failCount++;
        console.error(`[${pluginName}] 删除失败: ${item.fileName || item.filePath || 'unknown'}`, error);
      }
    }
    
    // 显示结果通知
    if (window.nzWorkflowManager) {
      if (failCount === 0) {
        window.nzWorkflowManager.showNotification(`批量删除完成：成功删除 ${successCount} 个项目`, 'success');
      } else {
        window.nzWorkflowManager.showNotification(`批量删除完成：成功 ${successCount} 个，失败 ${failCount} 个`, 'warning');
      }
    }
    
    // 清除选择并刷新目录
    this.clearSelection();
    
    // 强制刷新当前目录显示
    try {
      const config = this.config || window.config || window.nzWorkflowManager?.config;
      if (config && window.loadDirectory) {
        const currentDir = config.getCurrentPath();
        console.log(`[${pluginName}] 批量删除后刷新目录: ${currentDir}`);
        window.loadDirectory(currentDir);
      } else if (window.workflowManager && window.workflowManager.loadDirectory) {
        // 降级方案：使用工作流管理器的loadDirectory方法
        const currentDir = config ? config.getCurrentPath() : window.defaultDirectory;
        if (currentDir) {
          console.log(`[${pluginName}] 使用workflowManager刷新目录: ${currentDir}`);
          window.workflowManager.loadDirectory(currentDir);
        }
      } else {
        console.warn(`[${pluginName}] 无法刷新目录：缺少必要的刷新方法或配置`);
      }
    } catch (error) {
      console.error(`[${pluginName}] 批量删除后刷新失败:`, error);
    }
    
    // 确保多选按钮状态正确
    setTimeout(() => {
      if (this.isMultiSelectMode()) {
        this.updateMultiSelectButtonState();
      }
    }, 100);
  }
  
  // 添加多选相关样式
  addMultiSelectStyles() {
    const existingStyle = document.getElementById('nz-multiselect-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'nz-multiselect-styles';
    style.textContent = `
      .nz-selected {
        background: rgba(0, 122, 204, 0.3) !important;
        border: 2px solid #007acc !important;
        box-shadow: 0 0 8px rgba(0, 122, 204, 0.4) !important;
      }
      
      .nz-selection-status {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color, #007acc);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .multi-select-toggle {
        background: var(--bg-color, #2a2a2a);
        border: 1px solid var(--border-color, #444);
        color: var(--text-color, #ffffff);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 8px;
        transition: all 0.2s ease;
      }
      
      .multi-select-toggle:hover {
        background: var(--hover-color, #404040);
        border-color: var(--primary-color, #007acc);
      }
      
      .multi-select-toggle.active {
        background: var(--primary-color, #007acc);
        border-color: var(--primary-color, #007acc);
        color: white;
      }
    `;
    document.head.appendChild(style);
  }

  // 获取目录列表（委托给交互系统的方法）
  async getDirectoryList(rootPath = null) {
    try {
      // 尝试通过全局交互系统访问
      if (window.interactionSystem && window.interactionSystem.getDirectoryList) {
        return await window.interactionSystem.getDirectoryList(rootPath);
      }
      
      // 降级到直接调用loadDirectoriesForMenu方法
      if (window.interactionSystem && window.interactionSystem.loadDirectoriesForMenu) {
        const basePath = rootPath || window.defaultDirectory || (window.config ? window.config.getCurrentPath() : '');
        return await window.interactionSystem.loadDirectoriesForMenu(basePath);
      }
      
      // 最后降级：直接HTTP请求
      const basePath = rootPath || window.defaultDirectory || (window.config ? window.config.getCurrentPath() : '');
      const response = await fetch(`${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(basePath)}`);
      
      if (response.ok) {
        const data = await response.json();
        let directories = [];
        
        if (data.success && data.directories) {
          directories = data.directories;
        } else if (data.directories) {
          directories = data.directories;
        } else if (data.type === "directory_listing" && data.directories) {
          directories = data.directories;
        }
        
        if (Array.isArray(directories)) {
          return directories.map(dir => {
            const dirName = typeof dir === 'string' ? dir : (dir.name || dir);
            return {
              name: dirName,
              path: basePath ? `${basePath}\\${dirName}` : dirName
            };
          });
        }
      }
      
      console.warn(`[${this.pluginName}] 无法获取目录列表，返回空数组`);
      return [];
    } catch (error) {
      console.error(`[${this.pluginName}] 获取目录列表失败:`, error);
      return [];
    }
  }
}

// ====== 拖拽管理器 ======

class DragDropManager {
  constructor(config = null, pluginName = null, contextMenuManager = null) {
    this.config = config || window.config;
    this.pluginName = pluginName || (this.config ? this.config.PLUGIN_NAME : 'NZ工作流管理器');
    this.isDragging = false;
    this.globalDragOverHandler = null;
    this.globalDropHandler = null;
    this.globalDragLeaveHandler = null;
    this.contextMenuManager = contextMenuManager; // 添加对ContextMenuManager的引用
  }

  // ====== 全局拖拽处理器 ======
  setupGlobalDragHandler() {
    console.log(`[${this.pluginName}] 设置全局拖拽接收处理器`);
    
    // 移除可能存在的旧监听器
    document.removeEventListener('dragover', this.globalDragOverHandler);
    document.removeEventListener('drop', this.globalDropHandler);
    document.removeEventListener('dragleave', this.globalDragLeaveHandler);
    
    // 创建拖拽处理器函数
    this.globalDragOverHandler = (e) => {
      // 检查是否包含我们的自定义数据
      if (e.dataTransfer.types.includes('application/x-nz-workflow')) {
        e.preventDefault(); // 允许拖拽
        e.dataTransfer.dropEffect = 'copy';
        
        // 检查是否拖拽到了插件界面内 (黄色框区域)
        const pluginElement = e.target.closest('.nz-manager, .nz-workflow-manager, .nz-floating-manager, .nz-file-item, .folder-item, .nz-file-browser');
        if (pluginElement) {
          // 在插件界面内不显示高亮
          return;
        }
        
        // 检查是否拖拽到了ComfyUI画布区域，如果是则高亮显示 (红色框区域)
        const canvasElement = e.target.closest('#graph, .comfy-canvas, .comfy-graph, canvas, #graphcanvas') ||
                             e.target.querySelector('canvas') ||
                             (e.target.tagName === 'CANVAS');
        
        if (canvasElement) {
          canvasElement.style.outline = '3px solid #4a90e2';
          canvasElement.style.outlineOffset = '2px';
          return;
        }
        
        // 如果不在插件区域，其他区域也显示高亮（表示可以放置）
        if (!pluginElement) {
          // 找到最近的可能的ComfyUI容器元素
          const comfyContainer = document.querySelector('#graph, .comfy-canvas, .comfy-graph, canvas, #graphcanvas') ||
                                document.querySelector('body');
          if (comfyContainer && comfyContainer !== document.body) {
            comfyContainer.style.outline = '3px solid #4a90e2';
            comfyContainer.style.outlineOffset = '2px';
          }
        }
      }
    };
    
    this.globalDropHandler = (e) => {
      // 检查是否包含我们的自定义数据
      if (e.dataTransfer.types.includes('application/x-nz-workflow')) {
        // 移除所有高亮效果
        document.querySelectorAll('#graph, .comfy-canvas, .comfy-graph, canvas').forEach(el => {
          el.style.outline = '';
          el.style.outlineOffset = '';
        });
        
        console.log(`[${this.pluginName}] 拖拽放置检测 - 目标元素:`, e.target);
        console.log(`[${this.pluginName}] 拖拽放置检测 - 目标元素类名:`, e.target.className);
        console.log(`[${this.pluginName}] 拖拽放置检测 - 目标元素ID:`, e.target.id);
        console.log(`[${this.pluginName}] 拖拽放置检测 - 目标元素标签:`, e.target.tagName);
        
        // 🎯 优先检查拖拽到上级目录的特殊情况
        const pathDragOverlay = e.target.closest('#nz-path-drag-overlay, .nz-path-drag-overlay');
        const pathDisplay = e.target.closest('#nz-path-display, .nz-path-display');
        
        if (pathDragOverlay || pathDisplay) {
          console.log(`[${this.pluginName}] 拖拽到路径栏区域，处理移动到上级目录`);
          e.preventDefault(); // 阻止默认处理
          
          // 获取拖拽的文件信息
          const draggedFilePath = e.dataTransfer.getData('application/x-nz-workflow');
          const fileName = e.dataTransfer.getData('text/plain');
          
          if (draggedFilePath && window.nzIsDragging) {
            // 获取上级目录路径
            const currentPath = this.config.getCurrentPath();
            const defaultDir = this.config.getDefaultDirectory();
            
            // 计算上级目录路径
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'));
            
            // 检查是否可以移动到上级目录（不能超出默认目录范围）
            if (parentPath && parentPath.length >= defaultDir.length && parentPath.startsWith(defaultDir)) {
              console.log(`[${this.pluginName}] 执行拖拽移动到上级目录: ${draggedFilePath} -> ${parentPath}`);
              
              // 检查是否是多选拖拽
              const isMultiSelect = window.multiSelectManager && window.multiSelectManager.isMultiSelectMode();
              const selectedItems = isMultiSelect ? window.multiSelectManager.getSelectedItems() : [];
              const isDraggedFileSelected = selectedItems.some(item => item.filePath === draggedFilePath);
              
              if (isMultiSelect && isDraggedFileSelected) {
                // 多选拖拽：移动所有选中的文件到上级目录
                console.log(`[${this.pluginName}] 多选拖拽到上级目录: ${selectedItems.length} 个文件`);
                const selectedPaths = selectedItems.map(item => item.filePath);
                // 使用模块化的工作流管理器方法
                if (window.workflowManager && window.workflowManager.performMultiDragMove) {
                  window.workflowManager.performMultiDragMove(selectedPaths, parentPath);
                } else if (typeof window.performMultiDragMove === 'function') {
                  window.performMultiDragMove(selectedPaths, parentPath);
                } else if (typeof performMultiDragMove === 'function') {
                  performMultiDragMove(selectedPaths, parentPath);
                } else {
                  console.error(`[${this.pluginName}] performMultiDragMove 函数不可用`);
                }
              } else {
                // 单选拖拽：移动单个文件/目录到上级目录
                console.log(`[${this.pluginName}] 单选拖拽到上级目录: ${fileName}`);
                // 检测是否为目录并使用对应的移动方法
                if (this.contextMenuManager && this.contextMenuManager.moveItemToPath) {
                  // 保存this上下文引用，避免在回调中丢失
                  const self = this;
                  this.contextMenuManager.moveItemToPath(draggedFilePath, fileName, parentPath).then((result) => {
                    // 移动成功后立即刷新并清理状态
                    if (window.loadDirectory && self.config) {
                      const currentPath = self.config.getCurrentPath();
                      window.loadDirectory(currentPath);
                      
                      // 清除可能过期的拖拽路径引用，防止后续操作使用过期路径
                      self.draggedFilePath = null;
                      if (self.selectedFiles && typeof self.selectedFiles.clear === 'function') {
                        self.selectedFiles.clear();
                      }
                      
                      // 延迟刷新DOM元素的路径属性，确保UI同步
                      setTimeout(() => {
                        if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
                          window.nzWorkflowManager.refreshAllPathAttributes();
                        }
                      }, 300);
                    }
                  }).catch((error) => {
                    console.error(`[${self.pluginName}] 拖拽移动失败:`, error);
                    window.nzWorkflowManager.showNotification('移动失败: ' + error.message, 'error');
                  });
                } else {
                  console.error(`[${this.pluginName}] ContextMenuManager 或 moveItemToPath 方法不可用`);
                  window.nzWorkflowManager.showNotification('移动功能不可用', 'error');
                }
              }
            } else {
              console.log(`[${this.pluginName}] 无法移动到上级目录或超出范围限制`);
              window.nzWorkflowManager.showNotification('无法移动到上级目录', 'warning');
            }
          }
          
          // 隐藏拖拽覆盖层
          if (window.hidePathBarDragOverlay) {
            window.hidePathBarDragOverlay();
          }
          
          // 清除拖拽状态
          setTimeout(() => {
            window.nzIsDragging = false;
            console.log(`[${this.pluginName}] 拖拽到上级目录完成后状态已清除`);
          }, 100);
          
          return; // 处理完成，不继续执行后面的逻辑
        } else {
          // 检查是否拖拽到了我们的插件界面内 (黄色框区域)
          const pluginElement = e.target.closest('.nz-manager, .nz-workflow-manager, .nz-floating-manager');
          if (pluginElement) {
            console.log(`[${this.pluginName}] 拖拽到插件界面内（黄色框），跳过全局处理器`);
            return; // 在插件界面内不打开JSON文件
          }
          
          // 检查是否拖拽到了文件项或目录项（插件内部元素）
          const fileElement = e.target.closest('.nz-file-item, .folder-item, .nz-file-browser');
          if (fileElement) {
            console.log(`[${this.pluginName}] 拖拽到文件管理区域（黄色框），跳过全局处理器`);
            return; // 让文件管理器的处理器处理
          }
        }
        
        // 更广泛地检查ComfyUI画布区域 (红色框区域)
        const canvasElement = e.target.closest('#graph, .comfy-canvas, .comfy-graph, canvas, #graphcanvas') ||
                             e.target.querySelector('canvas') ||
                             (e.target.tagName === 'CANVAS');
        
        if (canvasElement) {
          console.log(`[${this.pluginName}] 拖拽到ComfyUI画布（红色框），加载工作流`);
          e.preventDefault(); // 阻止默认处理
          
          const filePath = e.dataTransfer.getData('application/x-nz-workflow');
          const fileName = e.dataTransfer.getData('text/plain');
          
          console.log(`[${this.pluginName}] 检测到工作流拖拽放置到ComfyUI画布:`, { fileName, filePath });
          
          // 拖拽到画布时加载工作流
          this.simulateWorkflowDragWithFile(filePath);
          return;
        }
        
        // 检查是否拖拽到了ComfyUI的主要区域（红色框内的任何位置）
        // 排除插件界面后，其他区域都认为是ComfyUI区域
        const bodyElement = e.target === document.body || e.target === document.documentElement;
        const isInPluginArea = e.target.closest('.nz-manager, .nz-workflow-manager, .nz-floating-manager, .nz-file-item, .folder-item, .nz-file-browser');
        
        if (!isInPluginArea && !bodyElement) {
          console.log(`[${this.pluginName}] 拖拽到ComfyUI区域（红色框），加载工作流`);
          e.preventDefault(); // 阻止默认处理
          
          const filePath = e.dataTransfer.getData('application/x-nz-workflow');
          const fileName = e.dataTransfer.getData('text/plain');
          
          console.log(`[${this.pluginName}] 检测到工作流拖拽放置到ComfyUI区域:`, { fileName, filePath });
          
          // 拖拽到ComfyUI区域时加载工作流
          this.simulateWorkflowDragWithFile(filePath);
          return;
        }
        
        // 其他情况（如拖拽到浏览器其他区域）不处理
        console.log(`[${this.pluginName}] 拖拽到未知区域或页面边缘，不处理`);
      }
    };
    
    // 添加拖拽离开事件处理，移除高亮效果
    this.globalDragLeaveHandler = (e) => {
      // 检查是否真正离开了ComfyUI画布区域
      const canvasElement = e.target.closest('#graph, .comfy-canvas, .comfy-graph');
      if (canvasElement && !canvasElement.contains(e.relatedTarget)) {
        canvasElement.style.outline = '';
        canvasElement.style.outlineOffset = '';
      }
    };
    
    // 监听整个document的拖拽事件
    document.addEventListener('dragover', this.globalDragOverHandler, false);
    document.addEventListener('drop', this.globalDropHandler, false);
    document.addEventListener('dragleave', this.globalDragLeaveHandler, false);
    
    console.log(`[${this.pluginName}] 全局拖拽处理器设置完成`);
  }

  // ====== 路径栏拖拽支持 ======
  setupPathBarDragSupport(currentPath) {
    console.log(`[${this.pluginName}] 设置路径栏拖拽支持，当前路径: ${currentPath}`);
    
    const pathDisplay = document.getElementById('nz-path-display');
    
    if (!pathDisplay) {
      console.error(`[${this.pluginName}] 找不到路径栏元素`);
      return;
    }
    
    // 设置路径栏的拖拽接收支持
    pathDisplay.addEventListener('dragover', (e) => {
      e.preventDefault();
      // 检查是否是我们的工作流文件拖拽
      if (e.dataTransfer.types.includes('application/x-nz-workflow')) {
        e.dataTransfer.dropEffect = 'move';
        pathDisplay.classList.add('drag-over');
      }
    });
    
    pathDisplay.addEventListener('dragleave', (e) => {
      // 只有在真正离开元素时才移除样式
      if (!pathDisplay.contains(e.relatedTarget)) {
        pathDisplay.classList.remove('drag-over');
      }
    });
    
    pathDisplay.addEventListener('drop', (e) => {
      e.preventDefault();
      pathDisplay.classList.remove('drag-over');
      
      const draggedFilePath = e.dataTransfer.getData('application/x-nz-workflow');
      
      if (draggedFilePath && this.config.getCurrentPath()) {
        // 获取上级目录路径，但限制在默认目录范围内
        const parentPath = this.getParentDirectoryWithLimit(this.config.getCurrentPath());
        
        if (parentPath && parentPath !== draggedFilePath) {
          // 检查是否有多个选中的文件
          const selectedItems = window.multiSelectManager.getSelectedItems();
          const isMultiSelect = selectedItems.length > 1;
          
          // 确保拖拽的文件在选中列表中
          const isDraggedFileSelected = selectedItems.some(item => item.filePath === draggedFilePath);
          
          if (isMultiSelect && isDraggedFileSelected) {
            // 多选拖拽：移动所有选中的文件到上级目录
            console.log(`[${this.pluginName}] 多选拖拽到上级目录: ${selectedItems.length} 个文件 -> ${parentPath}`);
            const selectedPaths = selectedItems.map(item => item.filePath);
            // 使用模块化的工作流管理器方法
            // 优先使用模块化的工作流管理器
            if (window.workflowManager && window.workflowManager.performMultiDragMove) {
              window.workflowManager.performMultiDragMove(selectedPaths, parentPath);
            } else if (typeof window.performMultiDragMove === 'function') {
              window.performMultiDragMove(selectedPaths, parentPath);
            } else if (typeof performMultiDragMove === 'function') {
              performMultiDragMove(selectedPaths, parentPath);
            } else {
              console.error(`[${this.pluginName}] performMultiDragMove 函数不可用`);
            }
          } else {
            // 单选拖拽：移动单个文件/目录到上级目录
            console.log(`[${this.pluginName}] 拖拽文件到上级目录: ${draggedFilePath} -> ${parentPath}`);
            // 使用统一的移动方法，会自动检测文件类型
            const fileName = draggedFilePath.split('\\').pop();
            if (this.contextMenuManager && this.contextMenuManager.moveItemToPath) {
              this.contextMenuManager.moveItemToPath(draggedFilePath, fileName, parentPath).then(() => {
                // 移动成功后刷新当前目录显示
                if (window.loadDirectory && this.config) {
                  window.loadDirectory(this.config.getCurrentPath());
                }
              });
            } else {
              console.error(`[${this.pluginName}] ContextMenuManager 或 moveItemToPath 方法不可用`);
              window.nzWorkflowManager.showNotification('移动功能不可用', 'error');
            }
          }
        } else {
          console.log(`[${this.pluginName}] 无法移动到上级目录或路径相同`);
          window.nzWorkflowManager.showNotification('无法移动到上级目录', 'warning');
        }
      }
      
      // 拖拽完成后清除拖拽状态
      setTimeout(() => {
        window.nzIsDragging = false;
        console.log(`[${this.pluginName}] 路径栏拖拽完成后状态已清除: ${window.nzIsDragging}`);
        // 确保多选按钮状态正确
        if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
          window.multiSelectManager.updateMultiSelectButtonState();
        }
      }, 100);
    });
  }

  // ====== 改进的工作流拖拽模拟 ======
  simulateWorkflowDragWithFile(filePath) {
    console.log(`[${this.pluginName}] 工作流拖拽：直接加载模式: ${filePath}`);
    
    // 直接使用点击加载的成功逻辑，不模拟拖拽事件
    window.loadWorkflowFile(filePath)
      .then(workflowData => {
        try {
          // 使用与点击加载完全相同的逻辑
          const workflow = JSON.parse(workflowData);
          console.log(`[${this.pluginName}] 拖拽：工作流数据解析成功，原始格式:`, workflow);
          
          // 直接加载到ComfyUI，使用原始格式
          console.log(`[${this.pluginName}] 拖拽：尝试加载工作流到ComfyUI`);
          window.app.loadGraphData(workflow); // 使用原始工作流，不使用修复版本
          console.log(`[${this.pluginName}] 拖拽：工作流加载成功`);
          
          // 通知浮动管理器工作流已加载
          window.initializeFloatingManager().loadWorkflow(filePath, workflowData);
          
          window.nzWorkflowManager.showNotification('工作流拖拽加载成功', 'success');
          
        } catch (parseError) {
          console.error(`[${this.pluginName}] 拖拽：JSON解析或加载失败:`, parseError);
          
          // 如果加载失败，尝试使用修复版本
          try {
            console.log(`[${this.pluginName}] 拖拽：尝试使用修复版本加载`);
            const workflow = JSON.parse(workflowData);
            const fixedWorkflow = window.validateAndFixWorkflow(workflow);
            window.app.loadGraphData(fixedWorkflow);
            
            // 通知浮动管理器工作流已加载
            window.initializeFloatingManager().loadWorkflow(filePath, workflowData);
            
            window.nzWorkflowManager.showNotification('工作流拖拽加载成功（已修复格式）', 'success');
          } catch (secondError) {
            console.error(`[${this.pluginName}] 拖拽：修复版本也加载失败:`, secondError);
            window.nzWorkflowManager.showNotification('工作流文件格式错误，无法加载', 'error');
          }
        }
      })
      .catch(error => {
        console.error(`[${this.pluginName}] 拖拽：无法读取工作流文件:`, error);
        window.nzWorkflowManager.showNotification('无法读取工作流文件', 'error');
      });
  }

  // ====== 为目录添加拖拽接收支持 ======
  addDragSupportToDirectory(dirItem, dirName, directoryPath) {
    // 添加拖拽接收支持
    dirItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      // 检查是否是我们的工作流文件拖拽
      if (e.dataTransfer.types.includes('application/x-nz-workflow')) {
        e.dataTransfer.dropEffect = 'move';
        dirItem.classList.add('drag-over');
      }
    });
    
    dirItem.addEventListener('dragleave', (e) => {
      // 只有在真正离开元素时才移除样式
      if (!dirItem.contains(e.relatedTarget)) {
        dirItem.classList.remove('drag-over');
      }
    });
    
    dirItem.addEventListener('drop', (e) => {
      e.preventDefault();
      dirItem.classList.remove('drag-over');
      
      const draggedFilePath = e.dataTransfer.getData('application/x-nz-workflow');
      const targetDirPath = directoryPath;
      
      if (draggedFilePath && targetDirPath && draggedFilePath !== targetDirPath) {
        // 检查是否有多个选中的文件
        const selectedItems = window.multiSelectManager.getSelectedItems();
        const isMultiSelect = selectedItems.length > 1;
        
        // 确保拖拽的文件在选中列表中（如果不在则验证是否应该是多选）
        const isDraggedFileSelected = selectedItems.some(item => item.filePath === draggedFilePath);
        
        if (isMultiSelect && isDraggedFileSelected) {
          // 多选拖拽：移动所有选中的文件
          console.log(`[${this.pluginName}] 多选拖拽移动: ${selectedItems.length} 个文件 -> ${targetDirPath}`);
          const selectedPaths = selectedItems.map(item => item.filePath);
          // 使用模块化的工作流管理器方法
          if (window.workflowManager && window.workflowManager.performMultiDragMove) {
            window.workflowManager.performMultiDragMove(selectedPaths, targetDirPath);
          } else if (typeof window.performMultiDragMove === 'function') {
            window.performMultiDragMove(selectedPaths, targetDirPath);
          } else if (typeof performMultiDragMove === 'function') {
            performMultiDragMove(selectedPaths, targetDirPath);
          } else {
            console.error(`[${this.pluginName}] performMultiDragMove 函数不可用`);
          }
        } else {
          // 单选拖拽：移动单个文件
          console.log(`[${this.pluginName}] 拖拽文件移动: ${draggedFilePath} -> ${targetDirPath}`);
          // 调用全局定义的拖拽移动函数，并在完成后刷新路径
          if (typeof window.performDragMove === 'function') {
            const result = window.performDragMove(draggedFilePath, targetDirPath);
            if (result && typeof result.then === 'function') {
              result.then(() => {
                // 移动完成后刷新路径信息，确保UI同步
                setTimeout(() => {
                  if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
                    window.nzWorkflowManager.refreshAllPathAttributes();
                  }
                }, 300);
              }).catch((error) => {
                console.error(`[${this.pluginName}] 拖拽移动失败:`, error);
              });
            }
          } else if (typeof performDragMove === 'function') {
            performDragMove(draggedFilePath, targetDirPath);
            // 延迟刷新路径信息
            setTimeout(() => {
              if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
                window.nzWorkflowManager.refreshAllPathAttributes();
              }
            }, 500);
          } else {
            console.error(`[${this.pluginName}] performDragMove 函数不可用`);
          }
        }
      }
      
      // 拖拽完成后清除拖拽状态
      setTimeout(() => {
        window.nzIsDragging = false;
        console.log(`[${this.pluginName}] 目录拖拽完成后状态已清除: ${window.nzIsDragging}`);
        // 确保多选按钮状态正确
        if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
          window.multiSelectManager.updateMultiSelectButtonState();
        }
      }, 100);
    });
  }

  // ====== 为文件添加完整拖拽支持 ======
  addDragSupportToFile(fileItem, fileName, filePath) {
    fileItem.draggable = true;
    
    fileItem.addEventListener('dragstart', (e) => {
      console.log(`[${this.pluginName}] 开始拖拽文件: ${filePath}`);
      
      // 设置拖拽数据
      e.dataTransfer.setData('text/plain', fileName);
      e.dataTransfer.setData('application/x-nz-workflow', filePath);
      e.dataTransfer.setData('application/x-nz-filename', fileName);
      e.dataTransfer.effectAllowed = 'copyMove';
      
      // 设置拖拽样式
      fileItem.classList.add('dragging');
      
      // 设置全局拖拽状态
      window.nzIsDragging = true;
      
      // 显示拖拽到上级目录的目标区域
      if (window.showDragToParentTarget) {
        window.showDragToParentTarget();
      }
    });
    
    fileItem.addEventListener('dragend', (e) => {
      fileItem.classList.remove('dragging');
      
      // 隐藏拖拽目标区域
      if (window.hideDragToParentTarget) {
        window.hideDragToParentTarget();
      }
      
      // 延迟清除拖拽状态
      setTimeout(() => {
        window.nzIsDragging = false;
        if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
          window.multiSelectManager.updateMultiSelectButtonState();
        }
      }, 200);
    });
  }

  // ====== 工具方法：获取上级目录路径（带限制） ======
  getParentDirectoryWithLimit(currentPath) {
    if (!currentPath || currentPath === '') {
      return null;
    }
    
    const defaultDir = this.config.getDefaultDirectory();
    
    // 计算上级目录路径
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'));
    
    // 检查是否超出默认目录范围
    if (parentPath && parentPath.length >= defaultDir.length && parentPath.startsWith(defaultDir)) {
      return parentPath;
    }
    
    return null; // 超出范围或无效
  }

  // ====== 清理拖拽监听器 ======
  cleanup() {
    if (this.globalDragOverHandler) {
      document.removeEventListener('dragover', this.globalDragOverHandler);
    }
    if (this.globalDropHandler) {
      document.removeEventListener('drop', this.globalDropHandler);
    }
    if (this.globalDragLeaveHandler) {
      document.removeEventListener('dragleave', this.globalDragLeaveHandler);
    }
    
    console.log(`[${this.pluginName}] 拖拽管理器已清理`);
  }
}

// ====== 模块导出 ======

// 创建交互系统管理器实例
const interactionSystem = {
  contextMenuManager: null,
  dialogManager: null,
  conflictResolutionDialogManager: null,
  multiSelectManager: null,
  dragDropManager: null,
  
  // 防重复操作标记
  operationInProgress: new Set(),
  
  // 初始化交互系统
  initialize(config = null) {
    const configInstance = config || window.config;
    const pluginName = configInstance ? configInstance.PLUGIN_NAME : 'NZ工作流管理器';
    console.log(`[${pluginName}] 交互系统模块已初始化`);
    
    // 创建管理器实例，传入配置
    this.contextMenuManager = new ContextMenuManager();
    this.contextMenuManager.config = configInstance; // 设置配置
    
    // 延迟绑定 fileOperationsAPI，确保它已经初始化
    if (window.fileOperationsAPI) {
      this.contextMenuManager.fileOperationsAPI = window.fileOperationsAPI;
    } else {
      // 如果还未初始化，设置一个延迟绑定
      setTimeout(() => {
        if (window.fileOperationsAPI) {
          this.contextMenuManager.fileOperationsAPI = window.fileOperationsAPI;
          console.log(`[${pluginName}] fileOperationsAPI 延迟绑定成功`);
        } else {
          console.error(`[${pluginName}] fileOperationsAPI 仍未初始化`);
        }
      }, 100);
    }
    
    // 设置模块化的通信API
    if (window.CommunicationAPI) {
      this.contextMenuManager.communicationAPI = new window.CommunicationAPI(pluginName);
      console.log(`[${pluginName}] 模块化CommunicationAPI已绑定`);
    } else {
      // 延迟绑定模块化API
      setTimeout(() => {
        if (window.CommunicationAPI) {
          this.contextMenuManager.communicationAPI = new window.CommunicationAPI(pluginName);
          console.log(`[${pluginName}] 模块化CommunicationAPI延迟绑定成功`);
        } else {
          console.warn(`[${pluginName}] 模块化CommunicationAPI不可用，将使用主文件API`);
        }
      }, 100);
    }
    this.dialogManager = new DialogManager();
    this.conflictResolutionDialogManager = new ConflictResolutionDialogManager();
    this.multiSelectManager = new MultiSelectManager(this.contextMenuManager);
    this.multiSelectManager.config = configInstance; // 设置配置
    this.dragDropManager = new DragDropManager(configInstance, null, this.contextMenuManager);
    
    // 添加样式
    this.multiSelectManager.addMultiSelectStyles();
    
    // Stage6-TODO: 在第七阶段清理时，移除这些全局暴露
    // 临时保持全局兼容性
    window.contextMenuManager = this.contextMenuManager;
    window.dialogManager = this.dialogManager;
    window.conflictResolutionDialogManager = this.conflictResolutionDialogManager;
    window.multiSelectManager = this.multiSelectManager;
    window.dragDropManager = this.dragDropManager;
    
    return true;
  },
  
  // 获取管理器实例
  getContextMenuManager() {
    return this.contextMenuManager;
  },
  
  getDirectoryHistory() {
    return this.contextMenuManager ? this.contextMenuManager.directoryHistory : null;
  },
  
  getDialogManager() {
    return this.dialogManager;
  },
  
  getConflictResolutionDialogManager() {
    return this.conflictResolutionDialogManager;
  },
  
  getMultiSelectManager() {
    return this.multiSelectManager;
  },
  
  getDragDropManager() {
    return this.dragDropManager;
  },

  /**
   * 刷新所有DOM元素的路径属性，确保移动操作后路径信息同步
   */
  refreshAllPathAttributes() {
    try {
      // 刷新所有文件项的data-path属性
      const fileItems = document.querySelectorAll('.nz-file-item');
      fileItems.forEach(item => {
        const nameElement = item.querySelector('.nz-file-item-name');
        if (nameElement) {
          const fileName = nameElement.textContent.trim();
          if (this.config && this.config.getCurrentPath) {
            // 检查是否有已存储的移动信息
            const movedPath = item.getAttribute('data-moved-to');
            let fullPath;
            
            if (movedPath) {
              // 如果文件已被移动，使用移动后的路径
              fullPath = movedPath;
              console.log(`[${this.pluginName}] 使用移动后路径: ${fileName} -> ${fullPath}`);
              // 清除临时移动标记
              item.removeAttribute('data-moved-to');
            } else {
              // 正常情况，使用当前路径构建
              const currentPath = this.config.getCurrentPath();
              fullPath = currentPath + (currentPath.endsWith('\\') ? '' : '\\') + fileName;
            }
            
            item.setAttribute('data-path', fullPath);
            console.log(`[${this.pluginName}] 已更新路径属性: ${fileName} -> ${fullPath}`);
          }
        }
      });
      
      // 清除任何残留的拖拽状态
      this.clearDragState();
      
      console.log(`[${this.pluginName}] 已刷新 ${fileItems.length} 个文件项的路径属性`);
    } catch (error) {
      console.error(`[${this.pluginName}] 刷新路径属性时出错:`, error);
    }
  },

  /**
   * 智能路径搜索 - 在目录树中搜索指定名称的目录
   * @param {string} targetName - 要搜索的目录名
   * @param {string} basePath - 搜索的基础路径
   * @returns {Promise<string|null>} 找到的路径或null
   */
  async smartPathSearch(targetName, basePath) {
    try {
      if (!this.communicationAPI || !this.communicationAPI.listDirectory) {
        return null;
      }

      console.log(`[${this.pluginName}] 开始智能搜索: ${targetName} in ${basePath}`);

      // 搜索当前目录及其子目录
      const searchQueue = [basePath];
      const searched = new Set();
      let maxDepth = 3; // 限制搜索深度防止无限递归

      while (searchQueue.length > 0 && maxDepth > 0) {
        const currentPath = searchQueue.shift();
        
        if (searched.has(currentPath)) {
          continue;
        }
        searched.add(currentPath);

        try {
          const dirData = await this.communicationAPI.listDirectory(currentPath);
          
          if (dirData && dirData.directories) {
            for (const dir of dirData.directories) {
              if (dir.name === targetName) {
                const foundPath = currentPath + (currentPath.endsWith('\\') ? '' : '\\') + dir.name;
                console.log(`[${this.pluginName}] 智能搜索成功找到: ${foundPath}`);
                return foundPath;
              }
              
              // 将子目录加入搜索队列
              if (maxDepth > 1) {
                const subPath = currentPath + (currentPath.endsWith('\\') ? '' : '\\') + dir.name;
                searchQueue.push(subPath);
              }
            }
          }
        } catch (error) {
          console.warn(`[${this.pluginName}] 搜索路径失败: ${currentPath}`, error);
        }

        maxDepth--;
      }

      console.log(`[${this.pluginName}] 智能搜索未找到目标: ${targetName}`);
      return null;
    } catch (error) {
      console.error(`[${this.pluginName}] 智能搜索异常:`, error);
      return null;
    }
  },

  /**
   * 清除拖拽状态，防止过期路径引用
   */
  clearDragState() {
    if (this.dragDropManager) {
      this.dragDropManager.draggedFilePath = null;
      if (this.dragDropManager.selectedFiles && typeof this.dragDropManager.selectedFiles.clear === 'function') {
        this.dragDropManager.selectedFiles.clear();
      }
    }
    
    // 清除拖拽相关的视觉状态
    const draggedElements = document.querySelectorAll('.dragging, .drag-preview');
    draggedElements.forEach(el => {
      el.classList.remove('dragging', 'drag-preview');
    });
  }
};

// 导出交互系统
export { interactionSystem };
export default interactionSystem;

/**
 * Stage6-TODO 清理计划：
 * 
 * 1. 第七阶段清理项目：
 *    - 移除全局 window.contextMenuManager 等暴露
 *    - 优化模块间通信机制
 *    - 统一事件处理系统
 * 
 * 2. 依赖关系优化：
 *    - 通过构造函数注入依赖，而非全局访问
 *    - 建立标准的模块通信接口
 *    - 减少对全局变量的直接访问
 * 
 * 3. 功能增强计划：
 *    - 添加键盘快捷键支持
 *    - 优化拖拽体验
 *    - 增强多选功能
 */
