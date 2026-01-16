/**
 * NZ工作流管理器 - 通信API模块
 * 
 * 功能：
 * - WebSocket通信管理
 * - HTTP API封装
 * - 文件操作API
 * - 错误处理机制
 * 
 * 第五阶段模块化完成
 */

class CommunicationAPI {
  constructor(pluginName) {
    this.pluginName = pluginName;
    
    // WebSocket连接状态缓存
    this._wsConnectionCache = {
      lastCheckTime: 0,
      isAvailable: false,
      checkInterval: 2000 // 2秒内不重复检查
    };
    
    console.log(`[${this.pluginName}] 通信API模块已初始化`);
  }

  // ====== 错误处理 ======
  
  /**
   * 处理文件操作错误
   * @param {string} operation - 操作名称
   * @param {Error} error - 错误对象
   */
  handleFileOperationError(operation, error) {
    let userMessage = `${operation}失败`;
    
    if (error.message.includes('WebSocket不可用')) {
      userMessage += '：WebSocket连接不可用，请检查ComfyUI服务状态';
    } else if (error.message.includes('HTTP请求失败')) {
      userMessage += '：服务器响应错误，请检查ComfyUI服务状态';
    } else if (error.message.includes('Failed to fetch')) {
      userMessage += '：无法连接到服务器，请检查ComfyUI是否正在运行';
    } else {
      userMessage += `：${error.message}`;
    }
    
    // 显示用户友好的错误消息
    if (window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
      window.nzWorkflowManager.showNotification(userMessage, 'error');
    } else {
      console.error(`[${this.pluginName}] ${userMessage}`);
    }
  }

  // ====== WebSocket通信 ======
  
  /**
   * 发送WebSocket消息的通用方法
   * @param {Object} message - 要发送的消息
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise} 响应数据
   */
  async sendWebSocketMessage(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      // 快速缓存检查：如果最近检查过且不可用，直接跳到HTTP
      const now = Date.now();
      if (now - this._wsConnectionCache.lastCheckTime < this._wsConnectionCache.checkInterval && 
          !this._wsConnectionCache.isAvailable) {
        reject(new Error('WebSocket最近检查不可用，使用缓存结果'));
        return;
      }
      
      // 改进的WebSocket可用性检查 - 检查多种可能的socket位置
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
      
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        const status = socket ? `readyState=${socket.readyState}` : 'socket不存在';
        console.log(`[${this.pluginName}] WebSocket连接检查失败: ${status}, 立即使用HTTP备用方案`);
        
        // 更新缓存状态
        this._wsConnectionCache.lastCheckTime = now;
        this._wsConnectionCache.isAvailable = false;
        
        reject(new Error(`WebSocket不可用 (${status})`));
        return;
      }
      
      // 额外检查：如果socket在发送过程中断开连接，立即失败
      if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
        console.log(`[${this.pluginName}] WebSocket连接正在关闭或已关闭，立即使用HTTP备用方案`);
        
        // 更新缓存状态
        this._wsConnectionCache.lastCheckTime = now;
        this._wsConnectionCache.isAvailable = false;
        
        reject(new Error('WebSocket连接已断开'));
        return;
      }
      
      // WebSocket连接可用，更新缓存
      this._wsConnectionCache.lastCheckTime = now;
      this._wsConnectionCache.isAvailable = true;
      
      let resultReceived = false;
      const originalHandler = socket.onmessage;
      
      const timeoutId = setTimeout(() => {
        if (!resultReceived) {
          resultReceived = true;
          socket.onmessage = originalHandler;
          
          // 超时时更新缓存状态，标记为不可用
          this._wsConnectionCache.lastCheckTime = Date.now();
          this._wsConnectionCache.isAvailable = false;
          
          reject(new Error('WebSocket请求超时'));
        }
      }, timeout);
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'nz_workflow_manager_response' && data.action === message.action) {
            if (!resultReceived) {
              resultReceived = true;
              clearTimeout(timeoutId);
              socket.onmessage = originalHandler;
              resolve(data.result);
            }
          } else if (originalHandler) {
            originalHandler(event);
          }
        } catch (error) {
          if (originalHandler) {
            originalHandler(event);
          }
        }
      };
      
      socket.send(JSON.stringify(message));
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

  // ====== 目录操作 ======
  
  /**
   * 创建目录
   * @param {string} parentPath - 父目录路径
   * @param {string} directoryName - 目录名称
   * @returns {Promise} 操作结果
   */
  async createDirectory(parentPath, directoryName) {
    const message = {
      type: 'nz_workflow_manager',
      action: 'create_directory',
      parent_path: parentPath,
      directory_name: directoryName
    };
    
    try {
      return await this.sendWebSocketMessage(message);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket创建目录失败，尝试HTTP方式:`, error);
      return await this.createDirectoryHTTP(parentPath, directoryName);
    }
  }
  
  /**
   * HTTP方式创建目录
   * @param {string} parentPath - 父目录路径
   * @param {string} directoryName - 目录名称
   * @returns {Promise} 操作结果
   */
  async createDirectoryHTTP(parentPath, directoryName) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=create_directory&parent_path=${encodeURIComponent(parentPath)}&directory_name=${encodeURIComponent(directoryName)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP创建目录失败:`, error);
      throw error;
    }
  }

  /**
   * 删除目录
   * @param {string} directoryPath - 目录路径
   * @returns {Promise} 操作结果
   */
  async deleteDirectory(directoryPath) {
    const message = {
      type: 'nz_workflow_manager',
      action: 'delete_directory',
      directory_path: directoryPath
    };
    
    try {
      return await this.sendWebSocketMessage(message);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket删除目录失败，尝试HTTP方式:`, error);
      return await this.deleteDirectoryHTTP(directoryPath);
    }
  }
  
  /**
   * HTTP方式删除目录
   * @param {string} directoryPath - 目录路径
   * @returns {Promise} 操作结果
   */
  async deleteDirectoryHTTP(directoryPath) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=delete_directory&directory_path=${encodeURIComponent(directoryPath)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP删除目录失败:`, error);
      throw error;
    }
  }

  // ====== 文件操作 ======
  
  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   * @returns {Promise} 操作结果
   */
  async deleteFile(filePath) {
    const message = {
      type: 'nz_workflow_manager',
      action: 'delete_file',
      file_path: filePath
    };
    
    try {
      return await this.sendWebSocketMessage(message);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket删除文件失败，尝试HTTP方式:`, error);
      return await this.deleteFileHTTP(filePath);
    }
  }
  
  /**
   * HTTP方式删除文件
   * @param {string} filePath - 文件路径
   * @returns {Promise} 操作结果
   */
  async deleteFileHTTP(filePath) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=delete_file&file_path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP删除文件失败:`, error);
      throw error;
    }
  }

  /**
   * 重命名文件/目录
   * @param {string} oldPath - 原路径
   * @param {string} newName - 新名称
   * @returns {Promise} 操作结果
   */
  async rename(oldPath, newName) {
    const message = {
      type: 'nz_workflow_manager',
      action: 'rename',
      old_path: oldPath,
      new_name: newName
    };
    
    try {
      return await this.sendWebSocketMessage(message);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket重命名失败，尝试HTTP方式:`, error);
      return await this.renameHTTP(oldPath, newName);
    }
  }
  
  /**
   * HTTP方式重命名
   * @param {string} oldPath - 原路径
   * @param {string} newName - 新名称
   * @returns {Promise} 操作结果
   */
  async renameHTTP(oldPath, newName) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=rename&old_path=${encodeURIComponent(oldPath)}&new_name=${encodeURIComponent(newName)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP重命名失败:`, error);
      throw error;
    }
  }

  /**
   * 移动文件
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   * @param {string} userChoice - 用户选择（可选）
   * @returns {Promise} 操作结果
   */
  async moveFile(sourcePath, targetPath, userChoice = null) {
    let resolvedChoice = userChoice; // 将变量声明移到try外部
    
    try {
      
      // 如果没有传入用户选择，检查目标位置是否存在同名文件
      if (!resolvedChoice) {
        // 这里需要依赖配置管理器的path工具
        // 临时使用简单的路径处理
        const targetFileName = sourcePath.split(/[/\\]/).pop();
        const fullTargetPath = `${targetPath}\\${targetFileName}`;
        
        if (await this.pathExists(fullTargetPath)) {
          // 显示冲突解决对话框
          if (window.conflictDialogManager) {
            resolvedChoice = await window.conflictDialogManager.showConflictDialog(
              targetFileName, 
              targetPath, 
              false // 不是目录
            );
            
            if (resolvedChoice === 'cancel') {
              return { success: false, error: '用户取消操作' };
            }
            
                    if (resolvedChoice === 'copy') {
          // 移动操作不支持建立副本，改为复制操作
          if (window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
            window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
          }
          return await this.copyFile(sourcePath, targetPath, null, resolvedChoice);
        }
        
        if (resolvedChoice && resolvedChoice.action === 'rename') {
          // 真正的移动+重命名：移动到用户指定的新名称
          const sourceExt = sourcePath.split('.').pop();
          const newFileName = resolvedChoice.newName + '.' + sourceExt;
          
          console.log(`[${this.pluginName}] 执行移动+重命名: ${sourcePath} -> ${newFileName}`);
          
          const message = {
            type: 'nz_workflow_manager',
            action: 'move_file',
            source_path: sourcePath,
            target_path: targetPath,
            new_filename: newFileName  // 传递新文件名给后端
          };
          
          const result = await this.sendWebSocketMessage(message, 1500);
          if (result.success) {
            result.conflictResult = resolvedChoice;
            if (window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
              window.nzWorkflowManager.showNotification(`文件已移动并重命名为: ${newFileName}`, 'success');
            }
          }
          return result;
        }
            // choice === 'overwrite' 时继续使用原名称
          }
        }
      }
      
      const message = {
        type: 'nz_workflow_manager',
        action: 'move_file',
        source_path: sourcePath,
        target_path: targetPath
      };
      
      // 文件移动操作使用较短的超时时间，快速转到HTTP备用方案
      return await this.sendWebSocketMessage(message, 1500);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket移动文件失败，尝试HTTP:`, error);
      // 传递用户选择给HTTP备用方案
      try {
        return await this.moveFileHTTP(sourcePath, targetPath, resolvedChoice);
      } catch (httpError) {
        console.error(`[${this.pluginName}] HTTP移动文件也失败:`, httpError);
        return { success: false, error: `移动失败: ${httpError.message}` };
      }
    }
  }
  
  /**
   * HTTP方式移动文件
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   * @param {string} userChoice - 用户选择（可选）
   * @returns {Promise} 操作结果
   */
  async moveFileHTTP(sourcePath, targetPath, userChoice = null) {
    let resolvedChoice = userChoice; // 将变量声明移到try外部
    
    try {
      
      // 如果没有传入用户选择，才进行冲突检查
      if (!resolvedChoice) {
        // 检查目标位置是否存在同名文件
        const targetFileName = sourcePath.split(/[/\\]/).pop();
        const fullTargetPath = `${targetPath}\\${targetFileName}`;
        
        if (await this.pathExistsHTTP(fullTargetPath)) {
          // 显示冲突解决对话框
          if (window.conflictDialogManager) {
            resolvedChoice = await window.conflictDialogManager.showConflictDialog(
              targetFileName, 
              targetPath, 
              false // 不是目录
            );
            
            if (resolvedChoice === 'cancel') {
              return { success: false, error: '用户取消操作' };
            }
            
            if (resolvedChoice === 'copy') {
              // 移动操作不支持建立副本，改为复制操作
              if (window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
                window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
              }
              return await this.copyFileHTTP(sourcePath, targetPath, null, resolvedChoice);
            }
            
            if (resolvedChoice && resolvedChoice.action === 'rename') {
              // 真正的移动+重命名：移动到用户指定的新名称
              const sourceExt = sourcePath.split('.').pop();
              const newFileName = resolvedChoice.newName + '.' + sourceExt;
              
              console.log(`[${this.pluginName}] HTTP主要方案执行移动+重命名: ${sourcePath} -> ${newFileName}`);
              
              let url = `${window.location.origin}/file_operations?action=move_file&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}&new_filename=${encodeURIComponent(newFileName)}`;
              
              const response = await fetch(url);
              if (response.ok) {
                const result = await response.json();
                if (result.success && window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
                  window.nzWorkflowManager.showNotification(`文件已移动并重命名为: ${newFileName}`, 'success');
                }
                return result;
              } else {
                throw new Error(`HTTP请求失败: ${response.status}`);
              }
            }
            // choice === 'overwrite' 时继续使用原名称
          }
        }
      } else {
        console.log(`[${this.pluginName}] HTTP移动备用方案使用已有用户选择: ${resolvedChoice}`);
        if (resolvedChoice === 'copy') {
          // 移动操作不支持建立副本，改为复制操作
          if (window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
            window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
          }
          return await this.copyFileHTTP(sourcePath, targetPath, null, resolvedChoice);
        }
        
        if (resolvedChoice && resolvedChoice.action === 'rename') {
          // 真正的移动+重命名：移动到用户指定的新名称
          const sourceExt = sourcePath.split('.').pop();
          const newFileName = resolvedChoice.newName + '.' + sourceExt;
          
          console.log(`[${this.pluginName}] HTTP执行移动+重命名: ${sourcePath} -> ${newFileName}`);
          
          let url = `${window.location.origin}/file_operations?action=move_file&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}&new_filename=${encodeURIComponent(newFileName)}`;
          
          const response = await fetch(url);
          if (response.ok) {
            const result = await response.json();
            if (result.success && window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
              window.nzWorkflowManager.showNotification(`文件已移动并重命名为: ${newFileName}`, 'success');
            }
            return result;
          } else {
            throw new Error(`HTTP请求失败: ${response.status}`);
          }
        }
      }
      
      let url = `${window.location.origin}/file_operations?action=move_file&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
      
      // 如果用户选择了覆盖，传递overwrite参数
      if (resolvedChoice === 'overwrite' || (resolvedChoice && resolvedChoice.action === 'replace')) {
        url += `&overwrite=true`;
        console.log(`[${this.pluginName}] HTTP移动请求包含覆盖参数: ${url}`);
      }
      
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP移动文件失败:`, error);
      throw error;
    }
  }

  /**
   * 复制文件
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   * @param {string} newFileName - 新文件名（可选）
   * @param {string} userChoice - 用户选择（可选）
   * @returns {Promise} 操作结果
   */
  async copyFile(sourcePath, targetPath, newFileName = null, userChoice = null) {
    let resolvedChoice = userChoice;
    let finalNewName = newFileName;
    
    try {
      // 如果没有传入用户选择，检查目标位置是否存在同名文件
      if (!resolvedChoice) {
        const targetFileName = sourcePath.split(/[/\\]/).pop();
        const fullTargetPath = `${targetPath}\\${targetFileName}`;
        
        if (await this.pathExists(fullTargetPath)) {
          // 显示冲突解决对话框
          if (window.conflictDialogManager) {
            resolvedChoice = await window.conflictDialogManager.showConflictDialog(
              targetFileName, 
              targetPath, 
              false // 不是目录
            );
            
            if (resolvedChoice === 'cancel') {
              return { success: false, error: '用户取消操作' };
            }
          }
        }
      }
      
      // 处理用户选择
      if (resolvedChoice && resolvedChoice.action) {
        if (resolvedChoice.action === 'skip' || resolvedChoice.action === 'cancel') {
          console.log(`[${this.pluginName}] 用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}，取消复制操作`);
          return { success: false, error: `用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}操作` };
        } else if (resolvedChoice.action === 'rename' && resolvedChoice.newName) {
          const sourceExt = sourcePath.split('.').pop();
          finalNewName = resolvedChoice.newName + '.' + sourceExt;
          console.log(`[${this.pluginName}] 使用用户自定义名称: ${finalNewName}`);
        }
      }
      
      const message = {
        type: 'nz_workflow_manager',
        action: 'copy_file',
        source_path: sourcePath,
        target_path: targetPath,
        new_name: finalNewName
      };
      
      return await this.sendWebSocketMessage(message, 8000);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket复制文件失败，尝试HTTP:`, error);
      try {
        return await this.copyFileHTTP(sourcePath, targetPath, finalNewName, resolvedChoice);
      } catch (httpError) {
        console.error(`[${this.pluginName}] HTTP复制文件也失败:`, httpError);
        return { success: false, error: `复制失败: ${httpError.message}` };
      }
    }
  }
  
  /**
   * 直接复制文件（不进行冲突检测）
   * @param {string} sourcePath - 源文件路径
   * @param {string} targetPath - 目标目录路径
   * @param {string} newName - 新文件名（可选）
   * @returns {Promise} 操作结果
   */
  async copyFileDirectly(sourcePath, targetPath, newName = null) {
    const finalNewName = newName || sourcePath.split(/[/\\]/).pop();
    
    try {
      const message = {
        type: 'nz_workflow_manager',
        action: 'copy_file',
        source_path: sourcePath,
        target_path: targetPath,
        new_name: finalNewName
      };
      
      console.log(`[${this.pluginName}] 直接复制文件（跳过冲突检测）: ${sourcePath} -> ${targetPath}\\${finalNewName}`);
      return await this.sendWebSocketMessage(message, 8000);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket直接复制文件失败，尝试HTTP:`, error);
      try {
        // 直接使用HTTP复制，跳过冲突检查
        let url = `${window.location.origin}/file_operations?action=copy_file&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
        if (finalNewName) {
          url += `&new_name=${encodeURIComponent(finalNewName)}`;
        }
        
        const response = await fetch(url, { method: 'GET' });
        const result = await response.json();
        
        if (result.success) {
          console.log(`[${this.pluginName}] HTTP直接复制文件成功`);
          return { success: true, message: result.message };
        } else {
          console.error(`[${this.pluginName}] HTTP直接复制文件失败:`, result.error);
          return { success: false, error: result.error };
        }
      } catch (httpError) {
        console.error(`[${this.pluginName}] HTTP直接复制文件也失败:`, httpError);
        return { success: false, error: `复制失败: ${httpError.message}` };
      }
    }
  }
  
  /**
   * 复制目录
   * @param {string} sourcePath - 源目录路径
   * @param {string} targetPath - 目标路径
   * @param {string} newDirName - 新目录名（可选）
   * @param {string} userChoice - 用户选择（可选）
   * @returns {Promise} 操作结果
   */
  async copyDirectory(sourcePath, targetPath, newDirName = null, userChoice = null) {
    let resolvedChoice = userChoice;
    let finalNewName = newDirName;
    
    try {
      // 如果没有传入用户选择，检查目标位置是否存在同名目录
      if (!resolvedChoice) {
        const targetDirName = sourcePath.split(/[/\\]/).pop();
        const fullTargetPath = `${targetPath}\\${targetDirName}`;
        
        if (await this.pathExists(fullTargetPath)) {
          // 显示冲突解决对话框
          if (window.conflictDialogManager) {
            resolvedChoice = await window.conflictDialogManager.showConflictDialog(
              targetDirName, 
              targetPath, 
              true // 是目录
            );
            
            if (resolvedChoice === 'cancel') {
              return { success: false, error: '用户取消操作' };
            }
          }
        }
      }
      
      // 处理用户选择
      if (resolvedChoice && resolvedChoice.action) {
        if (resolvedChoice.action === 'skip' || resolvedChoice.action === 'cancel') {
          console.log(`[${this.pluginName}] 用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}，取消复制操作`);
          return { success: false, error: `用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}操作` };
        } else if (resolvedChoice.action === 'rename' && resolvedChoice.newName) {
          finalNewName = resolvedChoice.newName;
          console.log(`[${this.pluginName}] 使用用户自定义目录名: ${finalNewName}`);
        } else if (resolvedChoice.action === 'detailed' && resolvedChoice.fileOperations) {
          console.log(`[${this.pluginName}] 执行文件级别详细操作`);
          const detailedResult = await this.processDetailedFileOperations(
            resolvedChoice.sourcePath,
            resolvedChoice.targetPath,
            resolvedChoice.fileOperations
          );
          
          // 显示操作结果汇总对话框
          const interactionSystem = window.nzWorkflowManager?.interactionSystem || window.interactionSystem;
          if (interactionSystem && detailedResult.results && detailedResult.summary) {
            console.log(`[${this.pluginName}] 准备显示操作结果汇总对话框`);
            setTimeout(() => {
              const conflictManager = interactionSystem.getConflictResolutionDialogManager();
              if (conflictManager && conflictManager.showOperationSummaryDialog) {
                console.log(`[${this.pluginName}] 显示操作结果汇总对话框`);
                conflictManager.showOperationSummaryDialog(detailedResult.results, detailedResult.summary);
              } else {
                console.log(`[${this.pluginName}] 冲突管理器不可用: conflictManager=${!!conflictManager}`);
              }
            }, 500); // 延迟500ms显示，确保通知消息先显示
          } else {
            console.log(`[${this.pluginName}] 无法显示结果汇总: interactionSystem=${!!interactionSystem}, results=${!!detailedResult.results}, summary=${!!detailedResult.summary}`);
          }
          
          return detailedResult;
        }
      }
      
      const message = {
        type: 'nz_workflow_manager',
        action: 'copy_directory',
        source_path: sourcePath,
        target_path: targetPath,
        new_name: finalNewName
      };
      
      return await this.sendWebSocketMessage(message, 5000);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket复制目录失败，尝试HTTP:`, error);
      try {
        return await this.copyDirectoryHTTP(sourcePath, targetPath, finalNewName, resolvedChoice);
      } catch (httpError) {
        console.error(`[${this.pluginName}] HTTP复制目录也失败:`, httpError);
        return { success: false, error: `复制目录失败: ${httpError.message}` };
      }
    }
  }
  
  /**
   * HTTP方式复制目录
   * @param {string} sourcePath - 源目录路径
   * @param {string} targetPath - 目标路径
   * @param {string} newDirName - 新目录名（可选）
   * @param {string} userChoice - 用户选择（可选）
   * @returns {Promise} 操作结果
   */
  async copyDirectoryHTTP(sourcePath, targetPath, newDirName = null, userChoice = null) {
    let resolvedChoice = userChoice;
    let finalNewName = newDirName;
    
    try {
      // 如果没有传入用户选择，检查目标位置是否存在同名目录
      if (!resolvedChoice) {
        const targetDirName = sourcePath.split(/[/\\]/).pop();
        const fullTargetPath = `${targetPath}\\${targetDirName}`;
        
        if (await this.pathExistsHTTP(fullTargetPath)) {
          // 显示冲突解决对话框
          if (window.conflictDialogManager) {
            resolvedChoice = await window.conflictDialogManager.showConflictDialog(
              targetDirName, 
              targetPath, 
              true // 是目录
            );
            
            if (resolvedChoice === 'cancel') {
              return { success: false, error: '用户取消操作' };
            }
          }
        }
      } else {
        console.log(`[${this.pluginName}] HTTP复制目录使用已有用户选择:`, resolvedChoice);
      }
      
      // 处理用户选择
      if (resolvedChoice && resolvedChoice.action) {
        if (resolvedChoice.action === 'skip' || resolvedChoice.action === 'cancel') {
          console.log(`[${this.pluginName}] 用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}，取消HTTP复制目录操作`);
          return { success: false, error: `用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}操作` };
        } else if (resolvedChoice.action === 'rename' && resolvedChoice.newName) {
          finalNewName = resolvedChoice.newName;
          console.log(`[${this.pluginName}] HTTP使用用户自定义目录名称: ${finalNewName}`);
        } else if (resolvedChoice.action === 'detailed' && resolvedChoice.fileOperations) {
          console.log(`[${this.pluginName}] HTTP执行文件级别详细操作`);
          const detailedResult = await this.processDetailedFileOperations(
            resolvedChoice.sourcePath,
            resolvedChoice.targetPath,
            resolvedChoice.fileOperations
          );
          
          // 显示操作结果汇总对话框
          const interactionSystem = window.nzWorkflowManager?.interactionSystem || window.interactionSystem;
          if (interactionSystem && detailedResult.results && detailedResult.summary) {
            console.log(`[${this.pluginName}] 准备显示操作结果汇总对话框`);
            setTimeout(() => {
              const conflictManager = interactionSystem.getConflictResolutionDialogManager();
              if (conflictManager && conflictManager.showOperationSummaryDialog) {
                console.log(`[${this.pluginName}] 显示操作结果汇总对话框`);
                conflictManager.showOperationSummaryDialog(detailedResult.results, detailedResult.summary);
              } else {
                console.log(`[${this.pluginName}] 冲突管理器不可用: conflictManager=${!!conflictManager}`);
              }
            }, 500); // 延迟500ms显示，确保通知消息先显示
          } else {
            console.log(`[${this.pluginName}] 无法显示结果汇总: interactionSystem=${!!interactionSystem}, results=${!!detailedResult.results}, summary=${!!detailedResult.summary}`);
          }
          
          return detailedResult;
        }
      }
      
      let url = `${window.location.origin}/file_operations?action=copy_directory&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
      if (finalNewName) {
        url += `&new_name=${encodeURIComponent(finalNewName)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`[${this.pluginName}] HTTP复制目录成功: ${sourcePath} -> ${result.target}`);
        return { success: true, source: sourcePath, target: result.target };
      } else {
        throw new Error(result.error || '复制目录失败');
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP复制目录失败:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 重命名目录（在同一位置）- 原子性操作版本
   * @param {string} dirPath - 目录路径
   * @param {string} newName - 新名称
   * @returns {Promise} 操作结果
   */
  async renameDirectory(dirPath, newName) {
    try {
      console.log(`[${this.pluginName}] 开始原子性重命名目录: ${dirPath} -> ${newName}`);
      
      // 标准化路径分隔符
      const normalizedPath = dirPath.replace(/\//g, '\\');
      const trimmedNewName = newName.trim();
      
      // 直接执行原子性重命名操作，不进行预验证
      return await this.atomicRenameDirectory(normalizedPath, trimmedNewName);
      
    } catch (error) {
      console.error(`[${this.pluginName}] 重命名目录失败:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 原子性重命名目录操作 - 简化版
   * @param {string} sourcePath - 源路径
   * @param {string} newName - 新名称
   * @returns {Promise} 操作结果
   */
  async atomicRenameDirectory(sourcePath, newName) {
    try {
      console.log(`[${this.pluginName}] 重命名目录: ${sourcePath} -> ${newName}`);
      
      // 标准化路径
      const normalizedSourcePath = sourcePath.replace(/\\\\/g, '\\').replace(/\//g, '\\');
      const parentPath = normalizedSourcePath.substring(0, normalizedSourcePath.lastIndexOf('\\'));
      const targetPath = parentPath + '\\' + newName;
      
      // 直接尝试重命名API
      const result = await this.atomicRenameHTTP(normalizedSourcePath, targetPath);
      if (result.success) {
        console.log(`[${this.pluginName}] 重命名成功: ${normalizedSourcePath} -> ${targetPath}`);
        return result;
      } else {
        throw new Error(result.error || '重命名失败');
      }
      
    } catch (error) {
      console.error(`[${this.pluginName}] 重命名失败:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 专用HTTP重命名操作
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   * @returns {Promise} 操作结果
   */
  async atomicRenameHTTP(sourcePath, targetPath) {
    const url = `${window.location.origin}/file_operations?action=rename&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
    
    console.log(`[${this.pluginName}] HTTP原子性重命名请求: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[${this.pluginName}] HTTP重命名响应:`, data);
    
    if (data.success) {
      return { success: true, data };
    } else {
      throw new Error(data.error || '重命名操作失败');
    }
  }

  /**
   * 使用移动操作的原子性重命名
   * @param {string} sourcePath - 源路径
   * @param {string} parentPath - 父目录路径
   * @param {string} newName - 新名称
   * @returns {Promise} 操作结果
   */
  async atomicMoveForRename(sourcePath, parentPath, newName) {
    console.log(`[${this.pluginName}] 使用原子性移动操作重命名: ${sourcePath} -> ${newName}`);
    
    const url = `${window.location.origin}/file_operations?action=move_directory&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(parentPath)}&new_name=${encodeURIComponent(newName)}&operation_type=rename`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[${this.pluginName}] 原子性移动重命名响应:`, data);
    
    if (data.success) {
      return { success: true, data };
    } else {
      throw new Error(data.error || '移动重命名操作失败');
    }
  }

  /**
   * 智能路径恢复用于重命名
   * @param {string} sourcePath - 原始路径
   * @param {string} newName - 新名称
   * @returns {Promise<string|null>} 恢复的路径或null
   */
  async recoverPathForRename(sourcePath, newName) {
    try {
      console.log(`[${this.pluginName}] 启动重命名路径恢复: ${sourcePath}`);
      
      const dirName = sourcePath.split(/[/\\]/).pop();
      // 多种方式获取当前路径
      const currentPath = (this.config && this.config.getCurrentPath) 
        ? this.config.getCurrentPath()
        : (window.nzWorkflowManager && window.nzWorkflowManager.getCurrentPath)
          ? window.nzWorkflowManager.getCurrentPath()
          : window.nzCurrentPath || '';
      
      console.log(`[${this.pluginName}] 路径恢复调试: config=${!!this.config}, getCurrentPath=${!!(this.config?.getCurrentPath)}, nzWorkflowManager=${!!window.nzWorkflowManager}, currentPath=${currentPath}`);
      
      if (!currentPath) {
        console.log(`[${this.pluginName}] 无法获取当前路径进行恢复`);
        return null;
      }
      
      const standardizedCurrentPath = currentPath.replace(/\//g, '\\');
      
      // 方法1: 当前目录直接重构
      const reconstructedPath = standardizedCurrentPath + (standardizedCurrentPath.endsWith('\\') ? '' : '\\') + dirName;
      if (await this.pathExistsHTTP(reconstructedPath)) {
        console.log(`[${this.pluginName}] 路径重构成功: ${reconstructedPath}`);
        return reconstructedPath;
      }
      
      // 方法2: 简单目录搜索（仅一层）
      try {
        const response = await fetch(`${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(standardizedCurrentPath)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.directories && Array.isArray(data.directories)) {
            for (const dir of data.directories) {
              if (dir.name === dirName) {
                const foundPath = standardizedCurrentPath + (standardizedCurrentPath.endsWith('\\') ? '' : '\\') + dir.name;
                console.log(`[${this.pluginName}] 目录搜索成功: ${foundPath}`);
                return foundPath;
              }
            }
          }
        }
      } catch (error) {
        console.warn(`[${this.pluginName}] 目录搜索失败:`, error);
      }
      
      console.log(`[${this.pluginName}] 路径恢复失败，强制刷新目录状态`);
      
      // 当路径恢复失败时，强制刷新目录来同步状态
      try {
        if (window.loadDirectory) {
          console.log(`[${this.pluginName}] 执行强制目录刷新: ${standardizedCurrentPath}`);
          window.loadDirectory(standardizedCurrentPath);
          
          // 清理相关缓存
          if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem && window.nzWorkflowManager.interactionSystem.clearDirectoryCache) {
            window.nzWorkflowManager.interactionSystem.clearDirectoryCache();
            console.log(`[${this.pluginName}] 已清理目录缓存`);
          }
        }
      } catch (refreshError) {
        console.warn(`[${this.pluginName}] 强制刷新失败:`, refreshError);
      }
      
      return null;
      
    } catch (error) {
      console.error(`[${this.pluginName}] 路径恢复错误:`, error);
      return null;
    }
  }


  /**
   * 移动目录
   * @param {string} sourcePath - 源目录路径
   * @param {string} targetPath - 目标路径
   * @param {string} newDirName - 新目录名（可选）
   * @param {string} userChoice - 用户选择（可选）
   * @returns {Promise} 操作结果
   */
  async moveDirectory(sourcePath, targetPath, newDirName = null, userChoice = null) {
    let resolvedChoice = userChoice;
    let finalNewName = newDirName;
    let validatedSourcePath = sourcePath; // 记录验证后的源路径
    
    try {
      // 首先验证源路径是否存在
      if (!await this.pathExists(sourcePath)) {
        console.error(`[${this.pluginName}] 源路径不存在: ${sourcePath}`);
        // 尝试从当前目录重新构建路径
        const dirName = sourcePath.split(/[/\\]/).pop();
        const currentPath = window.nzCurrentPath || targetPath;
        const pathSeparator = currentPath.includes('\\') ? '\\' : '/';
        const reconstructedPath = currentPath + (currentPath.endsWith(pathSeparator) ? '' : pathSeparator) + dirName;
        
        if (await this.pathExists(reconstructedPath)) {
          console.log(`[${this.pluginName}] 使用重构路径: ${reconstructedPath}`);
          validatedSourcePath = reconstructedPath; // 更新验证后的路径
        } else {
          return { success: false, error: `源目录不存在: ${sourcePath}` };
        }
      }
      
      // 如果没有传入用户选择，检查目标位置是否存在同名目录
      if (!resolvedChoice) {
        const targetDirName = validatedSourcePath.split(/[/\\]/).pop(); // 使用验证后的路径
        const pathSeparator = targetPath.includes('\\') ? '\\' : '/';
        const fullTargetPath = targetPath + (targetPath.endsWith(pathSeparator) ? '' : pathSeparator) + targetDirName;
        
        if (await this.pathExists(fullTargetPath)) {
          // 显示冲突解决对话框
          if (window.conflictDialogManager) {
            resolvedChoice = await window.conflictDialogManager.showConflictDialog(
              targetDirName, 
              targetPath, 
              true // 是目录
            );
            
            if (resolvedChoice === 'cancel') {
              return { success: false, error: '用户取消操作' };
            }
          }
        }
      }
      
      // 处理用户选择
      if (resolvedChoice && resolvedChoice.action) {
        if (resolvedChoice.action === 'skip' || resolvedChoice.action === 'cancel') {
          console.log(`[${this.pluginName}] 用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}，取消移动操作`);
          // 立即清除进度通知
          if (window.nzWorkflowManager && window.nzWorkflowManager.uiManager && 
              typeof window.nzWorkflowManager.uiManager.clearAllNotifications === 'function') {
            window.nzWorkflowManager.uiManager.clearAllNotifications();
          }
          return { success: false, error: `用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}操作` };
        } else if (resolvedChoice.action === 'rename' && resolvedChoice.newName) {
          finalNewName = resolvedChoice.newName;
          console.log(`[${this.pluginName}] 使用用户自定义目录名: ${finalNewName}`);
        }
      }
      
      const message = {
        type: 'nz_workflow_manager',
        action: 'move_directory',
        source_path: validatedSourcePath, // 使用验证后的路径
        target_path: targetPath,
        new_name: finalNewName
      };
      
      return await this.sendWebSocketMessage(message, 5000);
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket移动目录失败，尝试HTTP:`, error);
      try {
        return await this.moveDirectoryHTTP(validatedSourcePath, targetPath, finalNewName, resolvedChoice); // 使用验证后的路径
      } catch (httpError) {
        console.error(`[${this.pluginName}] HTTP移动目录也失败:`, httpError);
        return { success: false, error: `移动目录失败: ${httpError.message}` };
      }
    }
  }
  
  /**
   * HTTP方式移动目录
   * @param {string} sourcePath - 源目录路径
   * @param {string} targetPath - 目标路径
   * @param {string} newDirName - 新目录名（可选）
   * @param {string} userChoice - 用户选择（可选）
   * @returns {Promise} 操作结果
   */
  async moveDirectoryHTTP(sourcePath, targetPath, newDirName = null, userChoice = null) {
    try {
      // 首先验证源路径是否存在
      if (!await this.pathExistsHTTP(sourcePath)) {
        console.error(`[${this.pluginName}] HTTP: 源路径不存在: ${sourcePath}`);
        // 尝试从当前目录重新构建路径
        const dirName = sourcePath.split(/[/\\]/).pop();
        const currentPath = window.nzCurrentPath || targetPath;
        const pathSeparator = currentPath.includes('\\') ? '\\' : '/';
        const reconstructedPath = currentPath + (currentPath.endsWith(pathSeparator) ? '' : pathSeparator) + dirName;
        
        if (await this.pathExistsHTTP(reconstructedPath)) {
          console.log(`[${this.pluginName}] HTTP: 使用重构路径: ${reconstructedPath}`);
          sourcePath = reconstructedPath;
        } else {
          return { success: false, error: `源目录不存在: ${sourcePath}` };
        }
      }
      
      let resolvedChoice = userChoice;
      let finalNewName = newDirName;
      
      // 如果没有传入用户选择，检查目标位置是否存在同名目录
      if (!resolvedChoice) {
        const targetDirName = sourcePath.split(/[/\\]/).pop();
        const pathSeparator = targetPath.includes('\\') ? '\\' : '/';
        const fullTargetPath = targetPath + (targetPath.endsWith(pathSeparator) ? '' : pathSeparator) + targetDirName;
        
        if (await this.pathExistsHTTP(fullTargetPath)) {
          // 显示冲突解决对话框
          if (window.conflictDialogManager) {
            resolvedChoice = await window.conflictDialogManager.showConflictDialog(
              targetDirName, 
              targetPath, 
              true // 是目录
            );
            
            if (resolvedChoice === 'cancel') {
              return { success: false, error: '用户取消操作' };
            }
          }
        }
      }
      
      // 处理用户选择
      if (resolvedChoice && resolvedChoice.action) {
        if (resolvedChoice.action === 'skip' || resolvedChoice.action === 'cancel') {
          console.log(`[${this.pluginName}] 用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}，取消移动操作`);
          // 立即清除进度通知
          if (window.nzWorkflowManager && window.nzWorkflowManager.uiManager && 
              typeof window.nzWorkflowManager.uiManager.clearAllNotifications === 'function') {
            window.nzWorkflowManager.uiManager.clearAllNotifications();
          }
          return { success: false, error: `用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}操作` };
        } else if (resolvedChoice.action === 'rename' && resolvedChoice.newName) {
          finalNewName = resolvedChoice.newName;
          console.log(`[${this.pluginName}] 使用用户自定义目录名: ${finalNewName}`);
        }
      }
      
      let url = `${window.location.origin}/file_operations?action=move_directory&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
      if (finalNewName) {
        url += `&new_name=${encodeURIComponent(finalNewName)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`[${this.pluginName}] HTTP移动目录成功: ${sourcePath} -> ${result.target}`);
        return { success: true, source: sourcePath, target: result.target };
      } else {
        throw new Error(result.error || '移动目录失败');
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP移动目录失败:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * HTTP方式复制文件
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   * @param {string} newFileName - 新文件名（可选）
   * @param {string} userChoice - 用户选择（可选）
   * @returns {Promise} 操作结果
   */
  async copyFileHTTP(sourcePath, targetPath, newFileName = null, userChoice = null) {
    try {
      let resolvedChoice = userChoice;
      let finalNewName = newFileName;
      
      // 如果没有传入用户选择，才进行冲突检查
      if (!resolvedChoice) {
        // 检查目标位置是否存在同名文件
        const targetFileName = sourcePath.split(/[/\\]/).pop();
        const fullTargetPath = `${targetPath}\\${targetFileName}`;
        
        if (await this.pathExistsHTTP(fullTargetPath)) {
          // 显示冲突解决对话框
          if (window.conflictDialogManager) {
            resolvedChoice = await window.conflictDialogManager.showConflictDialog(
              targetFileName, 
              targetPath, 
              false // 不是目录
            );
            
            if (resolvedChoice === 'cancel') {
              return { success: false, error: '用户取消操作' };
            }
          }
        }
      } else {
        console.log(`[${this.pluginName}] HTTP复制备用方案使用已有用户选择:`, resolvedChoice);
      }
      
      // 处理用户选择
      if (resolvedChoice && resolvedChoice.action) {
        if (resolvedChoice.action === 'skip' || resolvedChoice.action === 'cancel') {
          console.log(`[${this.pluginName}] 用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}，取消HTTP复制操作`);
          return { success: false, error: `用户选择${resolvedChoice.action === 'skip' ? '跳过' : '取消'}操作` };
        } else if (resolvedChoice.action === 'rename' && resolvedChoice.newName) {
          const sourceExt = sourcePath.split('.').pop();
          finalNewName = resolvedChoice.newName + '.' + sourceExt;
          console.log(`[${this.pluginName}] HTTP使用用户自定义名称: ${finalNewName}`);
        }
      }
      
      let url = `${window.location.origin}/file_operations?action=copy_file&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
      
      if (finalNewName) {
        url += `&new_name=${encodeURIComponent(finalNewName)}`;
      }
      
      if (userChoice === 'overwrite' || (resolvedChoice && resolvedChoice.action === 'replace')) {
        url += `&overwrite=true`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.success && resolvedChoice && resolvedChoice.action === 'rename' && resolvedChoice.newName) {
          if (window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
            window.nzWorkflowManager.showNotification(`文件已复制并重命名为: ${finalNewName}`, 'success');
          }
        }
        return result;
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP复制文件失败:`, error);
      throw error;
    }
  }

  // ====== 路径检查 ======
  
  /**
   * 检查路径是否存在
   * @param {string} path - 路径
   * @returns {Promise<boolean>} 是否存在
   */
  async pathExists(path) {
    try {
      return await this.pathExistsHTTP(path);
    } catch (error) {
      console.error(`[${this.pluginName}] 路径存在性检查失败:`, error);
      return false;
    }
  }
  
  /**
   * HTTP方式检查路径是否存在
   * @param {string} path - 路径
   * @returns {Promise<boolean>} 是否存在
   */
  async pathExistsHTTP(path) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=path_exists&path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const data = await response.json();
        return data.exists === true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP路径存在性检查失败:`, error);
      return false;
    }
  }

  /**
   * 检查路径类型信息
   * @param {string} path - 路径
   * @returns {Promise<Object>} 路径信息对象
   */
  async getPathInfo(path) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=path_exists&path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const data = await response.json();
        return {
          exists: data.exists === true,
          isDirectory: data.is_directory === true,
          isFile: data.is_file === true
        };
      } else {
        return { exists: false, isDirectory: false, isFile: false };
      }
    } catch (error) {
      console.error(`[${this.pluginName}] 获取路径信息失败:`, error);
      return { exists: false, isDirectory: false, isFile: false };
    }
  }

  // ====== 通用HTTP请求 ======
  
  /**
   * 通用HTTP GET请求
   * @param {string} endpoint - API端点
   * @param {Object} params - 查询参数
   * @returns {Promise} 响应数据
   */
  async httpGet(endpoint, params = {}) {
    try {
      const url = new URL(`${window.location.origin}${endpoint}`);
      
      // 添加查询参数
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
      
      const response = await fetch(url.toString());
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP GET请求失败:`, error);
      throw error;
    }
  }
  
  /**
   * 通用HTTP POST请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   * @returns {Promise} 响应数据
   */
  async httpPost(endpoint, data = {}) {
    try {
      const response = await fetch(`${window.location.origin}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP POST请求失败:`, error);
      throw error;
    }
  }

  // ====== 连接状态管理 ======
  
  /**
   * 检查ComfyUI连接状态
   * @returns {Promise<Object>} 连接状态信息
   */
  async checkConnectionStatus() {
    const status = {
      websocket: false,
      http: false,
      comfyui: false
    };
    
    try {
      // 检查WebSocket连接
      const socket = this.getAvailableWebSocket();
      status.websocket = socket !== null;
      
      // 检查HTTP连接
      try {
        const response = await fetch(`${window.location.origin}/system_stats`, { 
          method: 'GET',
          timeout: 3000 
        });
        status.http = response.ok;
      } catch (httpError) {
        status.http = false;
      }
      
      // 检查ComfyUI应用状态
      status.comfyui = typeof app !== 'undefined' && app !== null;
      
    } catch (error) {
      console.error(`[${this.pluginName}] 连接状态检查失败:`, error);
    }
    
    return status;
  }
  
  /**
   * 获取连接状态描述
   * @returns {Promise<string>} 状态描述
   */
  async getConnectionStatusDescription() {
    const status = await this.checkConnectionStatus();
    
    if (status.websocket && status.http && status.comfyui) {
      return '所有连接正常';
    } else if (status.http && status.comfyui) {
      return 'HTTP连接正常，WebSocket不可用';
    } else if (status.comfyui) {
      return 'ComfyUI应用可用，网络连接异常';
    } else {
      return 'ComfyUI服务不可用';
    }
  }
  
  /**
   * 获取目录文件列表
   * @param {string} directoryPath - 目录路径
   * @returns {Promise<Array>} 文件列表
   */
  async listFiles(directoryPath) {
    console.log(`[${this.pluginName}] 获取目录文件列表: ${directoryPath}`);
    
    try {
      // 尝试WebSocket方式
      const message = {
        type: 'nz_workflow_manager',
        action: 'list_directory',
        path: directoryPath
      };
      
      const result = await this.sendWebSocketMessage(message, 5000);
      // 返回文件列表（只返回文件，不包括目录）
      return result.files || [];
    } catch (error) {
      console.error(`[${this.pluginName}] WebSocket获取文件列表失败，尝试HTTP:`, error);
      return await this.listFilesHTTP(directoryPath);
    }
  }
  
  /**
   * HTTP方式获取目录文件列表
   * @param {string} directoryPath - 目录路径
   * @returns {Promise<Array>} 文件列表
   */
  async listFilesHTTP(directoryPath) {
    try {
      // 使用现有的list_directory端点
      const url = `${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(directoryPath)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`[${this.pluginName}] HTTP获取目录内容:`, result);
      
      // 返回文件列表（只返回文件，不包括目录）
      return result.files || [];
    } catch (error) {
      console.error(`[${this.pluginName}] HTTP获取文件列表失败:`, error);
      return []; // 返回空数组而不是抛出错误
    }
  }
  
  /**
   * 处理详细的文件操作
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   * @param {Array} fileOperations - 文件操作列表
   * @returns {Promise} 操作结果
   */
  async processDetailedFileOperations(sourcePath, targetPath, fileOperations) {
    console.log(`[${this.pluginName}] 开始处理详细文件操作`, { sourcePath, targetPath, fileOperations });
    
    const results = [];
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const operation of fileOperations) {
      const { fileName, action, newName } = operation;
      // 使用反斜杠作为路径分隔符，与Windows系统保持一致
      const sourceFilePath = `${sourcePath}\\${fileName}`;
      let targetFilePath = `${targetPath}\\${fileName}`;
      
      try {
        switch (action) {
          case 'skip':
            console.log(`[${this.pluginName}] 跳过文件: ${fileName}`);
            results.push({ fileName, action: 'skip', status: 'skipped' });
            skipCount++;
            break;
            
          case 'overwrite':
            console.log(`[${this.pluginName}] 覆盖文件: ${fileName}`);
            const overwriteResult = await this.copyFile(sourceFilePath, targetPath, fileName, { action: 'replace' });
            results.push({ fileName, action: 'overwrite', status: overwriteResult.success ? 'success' : 'error', error: overwriteResult.error });
            if (overwriteResult.success) {
              successCount++;
            } else {
              errorCount++;
            }
            break;
            
          case 'rename':
            if (!newName) {
              throw new Error(`重命名操作缺少新文件名: ${fileName}`);
            }
            console.log(`[${this.pluginName}] 重命名文件: ${fileName} -> ${newName}`);
            // 构建重命名后的完整文件名（包含扩展名）
            const sourceExt = fileName.split('.').pop();
            const fullNewName = newName.includes('.') ? newName : `${newName}.${sourceExt}`;
            console.log(`[${this.pluginName}] 重命名目标文件名: ${fullNewName}`);
            // 直接执行重命名，不触发冲突检测
            const renameResult = await this.copyFileDirectly(sourceFilePath, targetPath, fullNewName);
            
            if (renameResult.success) {
              // 复制成功后，删除原文件以完成重命名操作
              console.log(`[${this.pluginName}] 重命名复制成功，删除原文件: ${sourceFilePath}`);
              try {
                const deleteResult = await this.deleteFile(sourceFilePath);
                if (deleteResult.success) {
                  console.log(`[${this.pluginName}] 重命名操作完成: ${fileName} -> ${fullNewName}`);
                  results.push({ fileName, action: 'rename', newName: fullNewName, status: 'success' });
                  successCount++;
                } else {
                  console.warn(`[${this.pluginName}] 重命名后删除原文件失败: ${deleteResult.error}`);
                  results.push({ fileName, action: 'rename', newName: fullNewName, status: 'partial', error: '复制成功但删除原文件失败' });
                  successCount++;
                }
              } catch (deleteError) {
                console.error(`[${this.pluginName}] 删除原文件时发生错误:`, deleteError);
                results.push({ fileName, action: 'rename', newName: fullNewName, status: 'partial', error: '复制成功但删除原文件失败' });
                successCount++;
              }
            } else {
              results.push({ fileName, action: 'rename', newName: fullNewName, status: 'error', error: renameResult.error });
              errorCount++;
            }
            break;
            
          default:
            console.warn(`[${this.pluginName}] 未知的文件操作: ${action}`);
            results.push({ fileName, action, status: 'error', error: '未知操作' });
            errorCount++;
        }
      } catch (error) {
        console.error(`[${this.pluginName}] 处理文件 ${fileName} 时出错:`, error);
        results.push({ fileName, action, status: 'error', error: error.message });
        errorCount++;
      }
    }
    
    const summary = {
      total: fileOperations.length,
      success: successCount,
      skipped: skipCount,
      errors: errorCount
    };
    
    console.log(`[${this.pluginName}] 详细文件操作完成`, summary);
    
    // 收集错误信息用于显示
    const errorMessages = results
      .filter(r => r.status === 'error' && r.error)
      .map(r => `${r.fileName}: ${r.error}`)
      .slice(0, 3); // 只显示前3个错误
    
    const errorSummary = errorMessages.length > 0 
      ? errorMessages.join('; ')
      : (errorCount > 0 ? '存在未知错误' : '');
    
    return {
      success: errorCount === 0,
      results,
      summary,
      message: `处理完成: ${successCount}个成功, ${skipCount}个跳过, ${errorCount}个错误`,
      error: errorCount > 0 ? errorSummary : null
    };
  }
}

// 导出模块
export { CommunicationAPI };
