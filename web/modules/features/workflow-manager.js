/**
 * NZ工作流管理器 - 工作流管理模块
 * 
 * 功能：
 * - 目录浏览和加载
 * - 工作流文件加载
 * - 工作流格式验证和修复
 * - 路径历史管理
 * - 目录内容显示
 * 
 * 第五阶段模块化完成
 */

class WorkflowManager {
  constructor(pluginName, configManager) {
    this.pluginName = pluginName;
    this.config = configManager;
    
    console.log(`[${this.pluginName}] 工作流管理器模块已初始化`);
  }

  // ====== 目录加载功能 ======
  
  /**
   * 加载目录（会更新历史记录）
   * @param {string} path - 目录路径
   */
  loadDirectory(path = "") {
    console.log(`[${this.pluginName}] 加载目录: ${path}`);
    
    try {
      // 如果没有提供路径，使用默认目录
      if (!path && this.config.getDefaultDirectory()) {
        path = this.config.getDefaultDirectory();
        console.log(`[${this.pluginName}] 使用默认目录: ${path}`);
      }
      
      // 如果仍然没有路径，显示提示信息
      if (!path) {
        console.log(`[${this.pluginName}] 没有设置目录，显示提示信息`);
        this.displayNoDirectoryMessage();
        return;
      }
      
      // 更新当前路径和历史记录（只有在用户主动导航时才更新历史）
      if (path !== this.config.getCurrentPath() && this.config.getCurrentPath()) {
        this.config.addToPathHistory(this.config.getCurrentPath());
        console.log(`[${this.pluginName}] 路径历史记录已更新: [${this.config.getPathHistory().join(' -> ')}]`);
      }
      this.config.setCurrentPath(path);
      
      // 更新路径显示
      this.updatePathDisplay(path);
      
      // 更新返回按钮状态
      this.updateBackButtonState();
      
      // 显示加载状态
      this.showLoadingState();
      
      // 开始加载目录内容
      this.loadDirectoryContent(path)
        .then(data => {
          console.log(`[${this.pluginName}] 目录加载成功: ${data.directories?.length || 0}个文件夹, ${data.files?.length || 0}个文件`);
          this.displayDirectoryContent(data);
        })
        .catch(error => {
          console.error(`[${this.pluginName}] 目录加载失败:`, error);
          this.displayError('无法加载目录，请检查路径或ComfyUI服务状态');
        });
        
    } catch (error) {
      console.error(`[${this.pluginName}] 目录加载失败:`, error);
      this.displayError(`请先设置默认目录`);
    }
  }
  
  /**
   * 加载目录（不更新历史记录）
   * @param {string} path - 目录路径
   */
  loadDirectoryWithoutHistory(path = "") {
    console.log(`[${this.pluginName}] 加载目录（不更新历史）: ${path}`);
    
    try {
      // 如果没有提供路径，使用默认目录
      if (!path && this.config.getDefaultDirectory()) {
        path = this.config.getDefaultDirectory();
        console.log(`[${this.pluginName}] 使用默认目录: ${path}`);
      }
      
      // 如果仍然没有路径，显示提示信息
      if (!path) {
        console.log(`[${this.pluginName}] 没有设置目录，显示提示信息`);
        this.displayNoDirectoryMessage();
        return;
      }
      
      // 仅更新当前路径，不修改历史记录
      this.config.setCurrentPath(path);
      console.log(`[${this.pluginName}] 当前路径已更新为: ${path}`);
      
      // 更新路径显示
      this.updatePathDisplay(path);
      
      // 更新返回按钮状态
      this.updateBackButtonState();
      
      // 显示加载状态
      this.showLoadingState();
      
      // 开始加载目录内容
      this.loadDirectoryContent(path)
        .then(data => {
          console.log(`[${this.pluginName}] 目录加载成功: ${data.directories?.length || 0}个文件夹, ${data.files?.length || 0}个文件`);
          this.displayDirectoryContent(data);
        })
        .catch(error => {
          console.error(`[${this.pluginName}] 目录加载失败:`, error);
          this.displayError('无法加载目录，请检查路径或ComfyUI服务状态');
        });
        
    } catch (error) {
      console.error(`[${this.pluginName}] 目录加载失败:`, error);
      this.displayError(`请先设置默认目录`);
    }
  }

  /**
   * 加载目录内容（通信层）
   * @param {string} path - 目录路径
   * @returns {Promise} 目录数据
   */
  async loadDirectoryContent(path) {
    console.log(`[${this.pluginName}] 开始加载目录内容: ${path}`);
    
    try {
      // 优先使用HTTP端点
      const data = await this.loadDirectoryUsingHTTP(path);
      return data;
    } catch (httpError) {
      console.log(`[${this.pluginName}] HTTP失败，尝试WebSocket备用方案...`);
      
      // 检查是否是连接错误（服务器未运行）
      const isConnectionError = httpError.message.includes('Failed to fetch') || 
                               httpError.message.includes('NetworkError') ||
                               httpError.message.includes('HTTP 404') ||
                               httpError.message.includes('HTTP 500');
      
      if (isConnectionError) {
        throw new Error('无法连接到ComfyUI服务器，请确保ComfyUI正在运行');
      }
      
      try {
        // HTTP失败后尝试WebSocket
        const data = await this.loadDirectoryUsingWebSocket(path);
        console.log(`[${this.pluginName}] WebSocket目录读取成功`);
        return data;
      } catch (wsError) {
        console.error(`[${this.pluginName}] 所有通信方案均失败 - HTTP: ${httpError.message}, WebSocket: ${wsError.message}`);
        
        // 检查WebSocket错误类型
        const wsConnectionError = wsError.message.includes('WebSocket') || 
                                 wsError.message.includes('连接') ||
                                 wsError.message.includes('timeout');
        
        if (wsConnectionError) {
          throw new Error('无法连接到ComfyUI服务器，请确保ComfyUI正在运行');
        } else {
          throw new Error('无法访问目录，请检查路径是否正确');
        }
      }
    }
  }

  /**
   * 使用HTTP端点读取目录
   * @param {string} dirPath - 目录路径
   * @returns {Promise} 目录数据
   */
  loadDirectoryUsingHTTP(dirPath) {
    return new Promise((resolve, reject) => {
      console.log(`[${this.pluginName}] 使用HTTP端点读取目录: ${dirPath}`);
      
      // 使用正确的/file_operations端点
      const localFileUrl = `${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(dirPath)}`;
      console.log(`[${this.pluginName}] HTTP请求URL: ${localFileUrl}`);
      
      fetch(localFileUrl)
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        })
        .then(data => {
          console.log(`[${this.pluginName}] HTTP响应数据:`, data);
          
          if (data.error) {
            reject(new Error(data.error));
            return;
          }
          
          if (data.type === "directory_listing") {
            resolve(data);
          } else {
            reject(new Error('HTTP端点返回数据格式错误'));
          }
        })
        .catch(error => {
          console.error(`[${this.pluginName}] HTTP读取失败:`, error);
          reject(error);
        });
    });
  }

  /**
   * 使用WebSocket读取目录
   * @param {string} dirPath - 目录路径
   * @returns {Promise} 目录数据
   */
  loadDirectoryUsingWebSocket(dirPath) {
    return new Promise((resolve, reject) => {
      console.log(`[${this.pluginName}] 使用WebSocket读取目录: ${dirPath}`);
      
      try {
        // 检查WebSocket是否可用
        const socket = this.getAvailableWebSocket();
        if (!socket) {
          reject(new Error('WebSocket不可用'));
          return;
        }
        
        console.log(`[${this.pluginName}] 使用ComfyUI WebSocket发送目录读取消息`);
        
        // 创建WebSocket消息
        const message = {
          type: "nz_workflow_manager",
          action: "list_directory",
          path: dirPath
        };
        
        // 设置响应监听器
        const messageHandler = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log(`[${this.pluginName}] WebSocket响应:`, response);
            
            if (response.type === "nz_workflow_manager" && response.action === "list_directory") {
              socket.removeEventListener('message', messageHandler);
              
              if (response.error) {
                reject(new Error(response.error));
              } else {
                // 转换为标准格式
                const standardFormat = {
                  type: "directory_listing",
                  directories: response.directories || [],
                  files: response.files || []
                };
                resolve(standardFormat);
              }
            }
          } catch (error) {
            socket.removeEventListener('message', messageHandler);
            reject(new Error(`WebSocket响应解析失败: ${error.message}`));
          }
        };
        
        socket.addEventListener('message', messageHandler);
        
        // 发送WebSocket消息
        socket.send(JSON.stringify(message));
        console.log(`[${this.pluginName}] WebSocket消息已发送:`, message);
        
        // 设置超时
        setTimeout(() => {
          socket.removeEventListener('message', messageHandler);
          reject(new Error('WebSocket响应超时'));
        }, 5000);
        
      } catch (error) {
        reject(new Error(`WebSocket请求失败: ${error.message}`));
      }
    });
  }

  /**
   * 获取可用的WebSocket连接
   * @returns {WebSocket|null} WebSocket对象或null
   */
  getAvailableWebSocket() {
    let socket = null;
    
    // 尝试多种方式获取WebSocket连接
    if (app && app.socket) {
      socket = app.socket;
    } else if (app && app.api && app.api.socket) {
      socket = app.api.socket;
    } else if (window.api && window.api.socket) {
      socket = window.api.socket;
    } else if (typeof api !== 'undefined' && api.socket) {
      socket = api.socket;
    }
    
    return socket && socket.readyState === WebSocket.OPEN ? socket : null;
  }

  // ====== UI和显示功能 ======

  /**
   * 显示目录内容
   * @param {Object} data - 目录数据
   */
  displayDirectoryContent(data) {
    // 委托给工作流UI模块
    if (window.nzWorkflowManager && window.nzWorkflowManager.workflowUI) {
      window.nzWorkflowManager.workflowUI.displayDirectoryContent(data);
    } else {
      console.error(`[${this.pluginName}] 工作流UI模块不可用`);
    }
  }

  /**
   * 更新路径显示
   * @param {string} path - 路径
   */
  updatePathDisplay(path) {
    // 委托给工作流UI模块
    if (window.nzWorkflowManager && window.nzWorkflowManager.workflowUI) {
      window.nzWorkflowManager.workflowUI.updatePathDisplay(path);
    }
  }

  /**
   * 更新返回按钮状态
   */
  updateBackButtonState() {
    // 委托给工作流UI模块
    if (window.nzWorkflowManager && window.nzWorkflowManager.workflowUI) {
      window.nzWorkflowManager.workflowUI.updateBackButtonState(this.config.getPathHistory());
    }
  }

  /**
   * 显示加载状态
   */
  showLoadingState() {
    // 委托给工作流UI模块
    if (window.nzWorkflowManager && window.nzWorkflowManager.workflowUI) {
      window.nzWorkflowManager.workflowUI.showLoadingState();
    }
  }

  /**
   * 显示无目录消息
   */
  displayNoDirectoryMessage() {
    // 委托给工作流UI模块
    if (window.nzWorkflowManager && window.nzWorkflowManager.workflowUI) {
      window.nzWorkflowManager.workflowUI.displayNoDirectoryMessage();
    }
  }

  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   */
  displayError(message) {
    // 委托给工作流UI模块
    if (window.nzWorkflowManager && window.nzWorkflowManager.workflowUI) {
      window.nzWorkflowManager.workflowUI.displayError(message);
    } else {
      console.error(`[${this.pluginName}] 错误: ${message}`);
    }
  }

  /**
   * 显示成功消息
   * @param {string} message - 成功消息
   */
  displaySuccess(message) {
    // 委托给工作流UI模块
    if (window.nzWorkflowManager && window.nzWorkflowManager.workflowUI) {
      window.nzWorkflowManager.workflowUI.displaySuccess(message);
    } else {
      console.log(`[${this.pluginName}] 成功: ${message}`);
    }
  }

  // ====== 导航功能 ======

  /**
   * 返回上一级目录
   */
  goBack() {
    const history = this.config.getPathHistory();
    if (history.length > 0) {
      const previousPath = history.pop();
      this.config.setPathHistory(history);
      this.loadDirectoryWithoutHistory(previousPath);
      console.log(`[${this.pluginName}] 返回到: ${previousPath}`);
    }
  }

  /**
   * 刷新当前目录
   */
  refreshCurrentDirectory() {
    const currentPath = this.config.getCurrentPath();
    if (currentPath) {
      this.loadDirectoryWithoutHistory(currentPath);
      console.log(`[${this.pluginName}] 刷新目录: ${currentPath}`);
    }
  }

  // ====== 文件拖拽移动功能 ======
  
  /**
   * 执行单个文件/目录的拖拽移动
   * @param {string} sourcePath - 源文件或目录路径
   * @param {string} targetPath - 目标目录路径
   */
  async performDragMove(sourcePath, targetPath) {
    try {
      // 获取文件/目录名
      const itemName = sourcePath.split('\\').pop();
      
      // 检查源路径是文件还是目录
      let isDirectory = false;
      try {
        // 优先使用交互系统的isDirectoryPath方法
        if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem && window.nzWorkflowManager.interactionSystem.contextMenuManager) {
          isDirectory = await window.nzWorkflowManager.interactionSystem.contextMenuManager.isDirectoryPath(sourcePath);
        } else if (window.contextMenuManager && window.contextMenuManager.isDirectoryPath) {
          // 降级到全局contextMenuManager
          isDirectory = await window.contextMenuManager.isDirectoryPath(sourcePath);
        } else {
          // 最后降级到简单的扩展名检查
          isDirectory = !/\.[^/.]+$/.test(sourcePath);
          console.warn(`[${this.pluginName}] 使用启发式方法检查路径类型: ${sourcePath} -> ${isDirectory ? '目录' : '文件'}`);
        }
      } catch (error) {
        console.error(`[${this.pluginName}] 检查路径类型失败，使用启发式方法:`, error);
        isDirectory = !/\.[^/.]+$/.test(sourcePath);
      }
      
      // 显示确认对话框
      const itemType = isDirectory ? '目录' : '文件';
      const confirmed = await window.dialogManager.showConfirmDialog(
        `确认移动${itemType}`,
        `确定要将 ${itemType} "${itemName}" 移动到目标目录吗？`,
        false
      );
      
      if (!confirmed) {
        // 用户取消操作，确保UI状态正确更新
        if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
          setTimeout(() => {
            window.multiSelectManager.updateMultiSelectButtonState();
          }, 100);
        }
        return;
      }
      
      window.nzWorkflowManager.showNotification(`正在移动${itemType}...`, 'info');
      
      // 根据路径类型调用相应的API - 优先使用模块化communicationAPI
      let result;
      
      // 优先使用模块化的communicationAPI
      if (window.nzWorkflowManager && window.nzWorkflowManager.communicationAPI) {
        if (isDirectory) {
          result = await window.nzWorkflowManager.communicationAPI.moveDirectory(sourcePath, targetPath);
        } else {
          result = await window.nzWorkflowManager.communicationAPI.moveFile(sourcePath, targetPath);
        }
      } else if (window.fileOperationsAPI) {
        // 降级到全局fileOperationsAPI
        if (isDirectory) {
          result = await window.fileOperationsAPI.moveDirectory(sourcePath, targetPath);
        } else {
          result = await window.fileOperationsAPI.moveFile(sourcePath, targetPath);
        }
      } else {
        throw new Error('没有可用的文件操作API');
      }
      
      if (result && result.success) {
        window.nzWorkflowManager.showNotification(`成功移动 ${itemType} "${itemName}" 到目标目录`, 'success');
        // 刷新当前目录显示
        this.loadDirectory(this.config.getCurrentPath());
        
        // 移动完成后刷新路径属性，确保DOM元素的右键菜单使用正确路径
        setTimeout(() => {
          if (window.nzWorkflowManager && window.nzWorkflowManager.refreshAllPathAttributes) {
            window.nzWorkflowManager.refreshAllPathAttributes();
          }
        }, 300);
        
        // 确保多选按钮状态正确
        setTimeout(() => {
          if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
            window.multiSelectManager.updateMultiSelectButtonState();
          }
        }, 100);
      } else {
        window.nzWorkflowManager.showNotification(`移动失败: ${result?.error || '未知错误'}`, 'error');
        
        // 确保多选按钮状态正确
        setTimeout(() => {
          if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
            window.multiSelectManager.updateMultiSelectButtonState();
          }
        }, 100);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] 拖拽移动失败:`, error);
      
      // 提供更友好的错误消息
      let errorMessage = '移动失败';
      if (error.message.includes('WebSocket不可用')) {
        errorMessage += '：连接问题，请检查ComfyUI服务状态';
      } else if (error.message.includes('HTTP请求失败')) {
        errorMessage += '：服务器错误，请稍后重试';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage += '：无法连接到服务器';
      } else {
        errorMessage += `：${error.message}`;
      }
      
      window.nzWorkflowManager.showNotification(errorMessage, 'error');
      
      // 确保多选按钮状态正确
      setTimeout(() => {
        if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
          window.multiSelectManager.updateMultiSelectButtonState();
        }
      }, 100);
    }
  }

  /**
   * 执行多个文件的拖拽移动
   * @param {string[]} sourcePaths - 源文件路径数组
   * @param {string} targetPath - 目标目录路径
   * @param {boolean} skipConfirmation - 是否跳过确认对话框（拖拽操作默认跳过）
   */
  async performMultiDragMove(sourcePaths, targetPath, skipConfirmation = true) {
    try {
      // 验证和过滤有效的源路径
      const validSourcePaths = sourcePaths.filter(path => path && typeof path === 'string' && path.trim() !== '');
      
      if (validSourcePaths.length === 0) {
        console.warn(`[${this.pluginName}] 没有有效的源路径可移动`);
        return;
      }
      
      if (validSourcePaths.length !== sourcePaths.length) {
        console.warn(`[${this.pluginName}] 过滤掉 ${sourcePaths.length - validSourcePaths.length} 个无效路径`);
      }
      
      // 获取项目名列表（可能包含文件和目录）
      const itemNames = validSourcePaths.map(filePath => filePath.split('\\').pop());
      const itemNamesText = itemNames.join('", "');
      
      // 只有在非拖拽操作时才显示确认对话框
      if (!skipConfirmation) {
        const confirmed = await window.dialogManager.showConfirmDialog(
          '确认移动多个项目',
          `确定要将以下 ${validSourcePaths.length} 个项目移动到目标目录吗？\n\n"${itemNamesText}"`,
          false
        );
        
        if (!confirmed) {
          // 用户取消操作，确保UI状态正确更新
          if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
            setTimeout(() => {
              window.multiSelectManager.updateMultiSelectButtonState();
            }, 100);
          }
          return;
        }
      }
      
      window.nzWorkflowManager.showNotification(`正在移动 ${validSourcePaths.length} 个项目...`, 'info');
      
      let successCount = 0;
      let failCount = 0;
      const errors = [];
      
      // 逐个移动项目（文件或目录）
      for (const sourcePath of validSourcePaths) {
        try {
          // 检查源路径是文件还是目录
          let isDirectory = false;
          try {
            // 优先使用交互系统的isDirectoryPath方法
            if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem && window.nzWorkflowManager.interactionSystem.contextMenuManager) {
              isDirectory = await window.nzWorkflowManager.interactionSystem.contextMenuManager.isDirectoryPath(sourcePath);
            } else if (window.contextMenuManager && window.contextMenuManager.isDirectoryPath) {
              // 降级到全局contextMenuManager
              isDirectory = await window.contextMenuManager.isDirectoryPath(sourcePath);
            } else {
              // 最后降级到简单的扩展名检查
              isDirectory = !/\.[^/.]+$/.test(sourcePath);
            }
          } catch (error) {
            console.error(`[${this.pluginName}] 检查路径类型失败，使用启发式方法:`, error);
            isDirectory = !/\.[^/.]+$/.test(sourcePath);
          }
          
          // 根据路径类型调用相应的API - 优先使用模块化communicationAPI
          let result;
          
          // 优先使用模块化的communicationAPI
          if (window.nzWorkflowManager && window.nzWorkflowManager.communicationAPI) {
            if (isDirectory) {
              result = await window.nzWorkflowManager.communicationAPI.moveDirectory(sourcePath, targetPath);
            } else {
              result = await window.nzWorkflowManager.communicationAPI.moveFile(sourcePath, targetPath);
            }
          } else if (window.fileOperationsAPI) {
            // 降级到全局fileOperationsAPI
            if (isDirectory) {
              result = await window.fileOperationsAPI.moveDirectory(sourcePath, targetPath);
            } else {
              result = await window.fileOperationsAPI.moveFile(sourcePath, targetPath);
            }
          } else {
            throw new Error('没有可用的文件操作API');
          }
          
          if (result && result.success) {
            successCount++;
          } else {
            failCount++;
            errors.push(`${sourcePath.split('\\').pop()}: ${result?.error || '未知错误'}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`${sourcePath.split('\\').pop()}: ${error.message}`);
        }
      }
      
      // 显示结果
      if (failCount === 0) {
        window.nzWorkflowManager.showNotification(`成功移动所有 ${successCount} 个项目到目标目录`, 'success');
      } else {
        window.nzWorkflowManager.showNotification(`移动完成: ${successCount} 个成功, ${failCount} 个失败`, 'warning');
        console.error(`[${this.pluginName}] 部分项目移动失败:`, errors);
      }
      
      // 清除多选状态，但保持多选模式
      window.multiSelectManager.clearSelection();
      
      // 刷新当前目录显示
      this.loadDirectory(this.config.getCurrentPath());
      
      // 确保多选按钮状态正确（在拖拽完成后强制更新）
      setTimeout(() => {
        if (window.multiSelectManager && window.multiSelectManager.isMultiSelectMode()) {
          window.multiSelectManager.updateMultiSelectButtonState();
        }
      }, 200);
    } catch (error) {
      console.error(`[${this.pluginName}] 多选拖拽移动失败:`, error);
      window.nzWorkflowManager.showNotification(`批量移动失败: ${error.message}`, 'error');
    }
  }
}

// 导出模块
export { WorkflowManager };