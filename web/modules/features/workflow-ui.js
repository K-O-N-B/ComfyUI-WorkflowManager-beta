/**
 * NZ工作流管理器 - UI显示模块
 * 
 * 功能：
 * - 目录内容显示
 * - 文件元素创建
 * - UI状态管理
 * - 路径显示更新
 * 
 * 第五阶段模块化完成
 */

class WorkflowUI {
  constructor(pluginName) {
    this.pluginName = pluginName;
    
    console.log(`[${this.pluginName}] 工作流UI模块已初始化`);
  }

  // ====== UI和显示功能 ======

  /**
   * 显示目录内容 - 完整功能版本
   * @param {Object} data - 目录数据
   */
  displayDirectoryContent(data) {
    console.log(`[${this.pluginName}] 显示目录内容:`, data);
    
    // 🛡️ 零停机降级策略：如果关键依赖不可用，立即降级到原始代码
    if (!window.multiSelectManager || !window.contextMenuManager || !window.ensureFileItemBorder) {
      console.log(`[${this.pluginName}] 关键依赖不可用，降级到原始代码`);
      if (window.nzOriginalDisplayDirectoryContent) {
        return window.nzOriginalDisplayDirectoryContent(data);
      }
      console.error(`[${this.pluginName}] 原始代码备份不可用，功能受限`);
      return this._displayDirectoryContentBasic(data);
    }
    
    const contentElement = document.getElementById('nz-content');
    if (!contentElement) {
      console.error(`[${this.pluginName}] 找不到内容元素`);
      return;
    }
    
    const fileGrid = contentElement.querySelector('#nz-file-grid');
    if (!fileGrid) {
      console.error(`[${this.pluginName}] 找不到文件网格元素`);
      return;
    }
    
    // 清空现有内容
    fileGrid.innerHTML = '';
    
    let totalItems = 0;
    
    // 显示文件夹 - 完整功能版本
    if (data.directories && data.directories.length > 0) {
      console.log(`[${this.pluginName}] 显示 ${data.directories.length} 个文件夹`);
      data.directories.forEach(dirInfo => {
        const dirElement = this.createDirectoryElementFull(dirInfo, data);
        fileGrid.appendChild(dirElement);
        totalItems++;
      });
    }
    
    // 显示文件 - 完整功能版本
    if (data.files && data.files.length > 0) {
      console.log(`[${this.pluginName}] 显示 ${data.files.length} 个JSON工作流文件`);
      data.files.forEach(fileInfo => {
        const fileElement = this.createFileElementFull(fileInfo, data);
        fileGrid.appendChild(fileElement);
        totalItems++;
      });
    }
    
    console.log(`[${this.pluginName}] 目录内容显示完成，共 ${totalItems} 个项目`);
    
    // 强制修复所有布局（延迟执行避免阻塞）
    setTimeout(() => {
      this.fixAllItemLayouts(fileGrid);
    }, 100);
  }

  /**
   * 创建目录元素 - 完整功能版本
   * @param {Object} dirInfo - 目录信息
   * @param {Object} data - 完整数据对象
   * @returns {HTMLElement} 目录元素
   */
  createDirectoryElementFull(dirInfo, data) {
    const dirName = typeof dirInfo === 'string' ? dirInfo : dirInfo.name;
    const dirDate = typeof dirInfo === 'object' ? dirInfo.date : '--/--/--';
    
    const dirItem = document.createElement('div');
    dirItem.className = 'nz-file-item folder';
    dirItem.innerHTML = `
      <div class="nz-file-item-thumbnail nz-folder-thumbnail size-medium">
        <div class="nz-thumbnail-icon">📁</div>
      </div>
      <div class="nz-file-item-content">
        <div class="nz-file-item-name">${this.escapeHtml(dirName)}</div>
        <div class="nz-file-item-comment" style="display: none;">注释预留位置</div>
        <div class="nz-file-item-date">${dirDate}</div>
      </div>
    `;
    
    // 添加数据属性
    dirItem.setAttribute('data-filename', dirName);
    dirItem.setAttribute('data-filepath', dirName);
    
    // 强制确保文件夹边框显示
    if (window.ensureFileItemBorder) {
      window.ensureFileItemBorder(dirItem, true);
    }
    
    // 设置数据属性用于多选
    const directoryPath = data.path ? `${data.path}\\${dirName}` : dirName;
    dirItem.dataset.filePath = directoryPath;
    
    // 添加完整的点击事件处理
    dirItem.addEventListener('click', (e) => {
      if (window.nzIsDragging) {
        console.log(`[${this.pluginName}] 拖拽状态，跳过目录点击事件`);
        return;
      }
      
      const handled = window.multiSelectManager.handleItemClick(
        dirItem, directoryPath, dirName, 'directory', e
      );
      
      if (!handled) {
        console.log(`[${this.pluginName}] 点击文件夹: ${dirName}, 新路径: ${directoryPath}`);
        if (window.loadDirectory) {
          window.loadDirectory(directoryPath);
        }
      }
    });
    
    // 添加右键菜单支持
    dirItem.addEventListener('contextmenu', (e) => {
      if (window.nzIsDragging) {
        console.log(`[${this.pluginName}] 拖拽状态，跳过右键菜单`);
        e.preventDefault();
        return;
      }
      
      if (window.contextMenuManager) {
        window.contextMenuManager.showDirectoryContextMenu(e, directoryPath, dirName);
      }
    });
    
    // 添加完整拖拽支持（使用模块化版本）
    if (window.dragDropManager) {
      window.dragDropManager.addDragSupportToDirectory(dirItem, dirName, directoryPath);
    } else {
      this.addDragSupportToDirectory(dirItem, dirName, directoryPath);
    }
    
    return dirItem;
  }

  /**
   * 创建文件元素 - 完整功能版本
   * @param {Object} fileInfo - 文件信息
   * @param {Object} data - 完整数据对象
   * @returns {HTMLElement} 文件元素
   */
  createFileElementFull(fileInfo, data) {
    const fileName = typeof fileInfo === 'string' ? fileInfo : fileInfo.name;
    const fileDate = typeof fileInfo === 'object' ? fileInfo.date : '--/--/--';
    
    const fileItem = document.createElement('div');
    fileItem.className = 'nz-file-item';
    
    // 设置文件路径
    const filePath = data.path ? `${data.path}\\${fileName}` : fileName;
    
    // 获取备注信息
    const note = window.workflowNotesManager ? window.workflowNotesManager.getNote(filePath) : null;
    const hasNote = !!note;
    
    // JSON工作流文件固定图标
    const fileIcon = '📄';
    
    // 备注预览
    const notePreview = note?.description ? 
      `<div class="nz-file-note-title">${note.description.substring(0, 30)}${note.description.length > 30 ? '...' : ''}</div>` : '';
    
    // 优先级样式类
    const priorityClass = note?.priority ? `nz-priority-${note.priority}` : '';
    
    // 智能标签显示逻辑
    const tags = note?.tags || [];
    const maxVisibleTags = 3;
    const visibleTags = tags.slice(0, maxVisibleTags);
    const hasMoreTags = tags.length > maxVisibleTags;
    const moreCount = tags.length - maxVisibleTags;
    
    let tagsHtml = '';
    if (visibleTags.length > 0) {
      tagsHtml = visibleTags.map(tag => `<span class="nz-tag">${tag}</span>`).join('');
      if (hasMoreTags) {
        tagsHtml += `<span class="nz-tag overflow-indicator" title="还有${moreCount}个标签: ${tags.slice(maxVisibleTags).join(', ')}">+${moreCount}</span>`;
      }
    }
    
    // 新的缩略图布局结构
    fileItem.innerHTML = `
      <div class="nz-file-item-thumbnail size-medium">
        <div class="nz-thumbnail-icon ${priorityClass}">${fileIcon}</div>
      </div>
      <div class="nz-file-item-content">
        <div class="nz-file-item-name ${priorityClass}" title="${fileName}">${this.escapeHtml(fileName)}</div>
        ${notePreview}
        <div class="nz-file-item-date">${fileDate}</div>
      </div>
    `;
    
    // 添加数据属性
    fileItem.setAttribute('data-filename', fileName);
    fileItem.setAttribute('data-filepath', filePath);
    fileItem.dataset.filePath = filePath;
    
    // 立即应用自定义图标（如果存在）
    const hasCustomIcon = window.CustomIconManager ? 
      window.CustomIconManager.applyCustomIconToFileItem(fileItem, filePath) : false;
    
    // 应用布局修复
    requestAnimationFrame(() => {
      if (!hasCustomIcon && window.ensureCorrectLayout) {
        window.ensureCorrectLayout(fileItem);
      }
    });
    
    // 添加完整的点击事件处理
    fileItem.addEventListener('click', (e) => {
      if (window.nzIsDragging) {
        console.log(`[${this.pluginName}] 拖拽状态，跳过点击事件`);
        return;
      }
      
      const handled = window.multiSelectManager.handleItemClick(
        fileItem, filePath, fileName, 'file', e
      );
      
      if (!handled) {
        console.log(`[${this.pluginName}] 点击文件: ${fileName}`);
        if (window.loadWorkflow) {
          window.loadWorkflow(filePath);
        }
      }
    });
    
    // 添加右键菜单支持
    fileItem.addEventListener('contextmenu', (e) => {
      if (window.nzIsDragging) {
        console.log(`[${this.pluginName}] 拖拽状态，跳过右键菜单`);
        e.preventDefault();
        return;
      }
      
      if (window.contextMenuManager) {
        window.contextMenuManager.showFileContextMenu(e, filePath, fileName);
      }
    });
    
    // 添加完整拖拽支持（使用模块化版本）
    if (window.dragDropManager) {
      window.dragDropManager.addDragSupportToFile(fileItem, fileName, filePath);
    } else {
      this.addDragSupportToFile(fileItem, fileName, filePath);
    }
    
    return fileItem;
  }

  /**
   * 更新路径显示
   * @param {string} path - 路径
   */
  updatePathDisplay(path) {
    const pathDisplay = document.getElementById('nz-current-path');
    if (pathDisplay) {
      pathDisplay.textContent = path;
    }
  }

  /**
   * 更新返回按钮状态
   * @param {Array} pathHistory - 路径历史
   */
  updateBackButtonState(pathHistory = []) {
    // 修复：使用正确的按钮ID 'nz-back-btn'
    const backButton = document.getElementById('nz-back-btn');
    if (backButton) {
      // 委托给UI管理器的更完善的逻辑
      if (window.nzWorkflowManager && window.nzWorkflowManager.uiManager && 
          window.nzWorkflowManager.uiManager.updateBackButtonState) {
        console.log(`[${this.pluginName}] 委托按钮状态更新给UI管理器`);
        window.nzWorkflowManager.uiManager.updateBackButtonState();
      } else {
        // 回退方案：简单的历史记录检查
        const hasHistory = pathHistory.length > 0;
        backButton.disabled = !hasHistory;
        backButton.style.opacity = hasHistory ? '1' : '0.5';
        console.log(`[${this.pluginName}] 使用回退方案更新按钮状态: ${hasHistory ? '可用' : '禁用'}`);
      }
    }
  }

  /**
   * 显示加载状态
   */
  showLoadingState() {
    const contentElement = document.getElementById('nz-content');
    if (contentElement) {
      const loadingOverlay = contentElement.querySelector('.loading-overlay');
      const fileGrid = contentElement.querySelector('.file-grid');
      const emptyState = contentElement.querySelector('.empty-state');
      
      if (loadingOverlay) loadingOverlay.style.display = 'block';
      if (fileGrid) fileGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'none';
    }
  }

  /**
   * 显示无目录消息
   */
  displayNoDirectoryMessage() {
    const contentElement = document.getElementById('nz-content');
    if (contentElement) {
      const loadingOverlay = contentElement.querySelector('.loading-overlay');
      const fileGrid = contentElement.querySelector('.file-grid');
      const emptyState = contentElement.querySelector('.empty-state');
      
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (fileGrid) fileGrid.style.display = 'none';
      if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
          <div class="empty-icon">⚙️</div>
          <div class="empty-text">请先设置默认目录</div>
          <div class="empty-subtext">在设置中配置您的工作流文件目录</div>
        `;
      }
    }
  }

  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   */
  displayError(message) {
    console.error(`[${this.pluginName}] 错误: ${message}`);
    
    // 显示用户友好的错误消息
    if (window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
      window.nzWorkflowManager.showNotification(message, 'error');
    } else {
      // 如果没有通知系统，更新UI显示错误
      const contentElement = document.getElementById('nz-content');
      if (contentElement) {
        const loadingOverlay = contentElement.querySelector('.loading-overlay');
        const fileGrid = contentElement.querySelector('.file-grid');
        const emptyState = contentElement.querySelector('.empty-state');
        
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (fileGrid) fileGrid.style.display = 'none';
        if (emptyState) {
          emptyState.style.display = 'block';
          emptyState.innerHTML = `
            <div class="empty-icon">❌</div>
            <div class="empty-text">出现错误</div>
            <div class="empty-subtext">${this.escapeHtml(message)}</div>
          `;
        }
      }
    }
  }

  /**
   * 显示成功消息
   * @param {string} message - 成功消息
   */
  displaySuccess(message) {
    console.log(`[${this.pluginName}] 成功: ${message}`);
    
    if (window.nzWorkflowManager && typeof window.nzWorkflowManager.showNotification === 'function') {
      window.nzWorkflowManager.showNotification(message, 'success');
    } else {
      console.log(`[${this.pluginName}] ${message}`);
    }
  }

  // ====== 完整功能支持方法 ======

  /**
   * 基本显示功能 - 在依赖不可用时使用
   * @param {Object} data - 目录数据
   */
  _displayDirectoryContentBasic(data) {
    console.log(`[${this.pluginName}] 使用基本显示功能`);
    
    const contentElement = document.getElementById('nz-content');
    if (!contentElement) return;
    
    const fileGrid = contentElement.querySelector('.file-grid') || contentElement.querySelector('#nz-file-grid');
    if (!fileGrid) return;
    
    fileGrid.innerHTML = '';
    
    // 简化的目录显示
    if (data.directories) {
      data.directories.forEach(dir => {
        const dirElement = this.createDirectoryElement(dir);
        fileGrid.appendChild(dirElement);
      });
    }
    
    // 简化的文件显示
    if (data.files) {
      data.files.forEach(file => {
        const fileElement = this.createFileElement(file);
        fileGrid.appendChild(fileElement);
      });
    }
  }

  /**
   * 为目录添加完整拖拽支持
   * @param {HTMLElement} dirItem - 目录元素
   * @param {string} dirName - 目录名称
   * @param {string} directoryPath - 目录路径
   */
  addDragSupportToDirectory(dirItem, dirName, directoryPath) {
    dirItem.draggable = true;
    
    dirItem.addEventListener('dragstart', (e) => {
      console.log(`[${this.pluginName}] 开始拖拽目录: ${directoryPath}`);
      
      // 设置拖拽数据
      e.dataTransfer.setData('text/plain', dirName);
      e.dataTransfer.setData('application/x-nz-workflow', directoryPath);
      e.dataTransfer.setData('application/x-nz-filename', dirName);
      e.dataTransfer.effectAllowed = 'copyMove';
      
      // 设置拖拽样式
      dirItem.classList.add('dragging');
      
      // 设置全局拖拽状态
      window.nzIsDragging = true;
      
      // 显示拖拽到上级目录的目标区域
      if (window.showDragToParentTarget) {
        window.showDragToParentTarget();
      }
    });
    
    dirItem.addEventListener('dragend', (e) => {
      dirItem.classList.remove('dragging');
      
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
    
    // 添加拖拽接收支持
    dirItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer.types.includes('application/x-nz-workflow')) {
        e.dataTransfer.dropEffect = 'move';
        dirItem.classList.add('drag-over');
      }
    });
    
    dirItem.addEventListener('dragleave', (e) => {
      if (!dirItem.contains(e.relatedTarget)) {
        dirItem.classList.remove('drag-over');
      }
    });
    
    dirItem.addEventListener('drop', (e) => {
      e.preventDefault();
      dirItem.classList.remove('drag-over');
      
      const draggedFilePath = e.dataTransfer.getData('application/x-nz-workflow');
      if (draggedFilePath && window.handleFileDrop) {
        window.handleFileDrop(draggedFilePath, directoryPath);
      }
    });
  }

  /**
   * 为文件添加完整拖拽支持
   * @param {HTMLElement} fileItem - 文件元素
   * @param {string} fileName - 文件名称
   * @param {string} filePath - 文件路径
   */
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

  /**
   * 修复所有项目布局
   * @param {HTMLElement} fileGrid - 文件网格元素
   */
  fixAllItemLayouts(fileGrid) {
    const items = fileGrid.querySelectorAll('.nz-file-item');
    let fixedCount = 0;
    let skippedCount = 0;
    
    items.forEach(item => {
      const hasCustomIcon = item.querySelector('.custom-icon-container');
      if (!hasCustomIcon) {
        if (window.ensureCorrectLayout) {
          window.ensureCorrectLayout(item);
        }
        if (window.ensureFileItemBorder) {
          window.ensureFileItemBorder(item, true);
        }
        fixedCount++;
      } else {
        skippedCount++;
      }
    });
    
    console.log(`[${this.pluginName}] 目录显示完成，强制修复所有布局...`);
    console.log(`[${this.pluginName}] 已修复 ${fixedCount}/${items.length} 个文件项的布局（跳过 ${skippedCount} 个自定义图标项）`);
  }

  // ====== 工具方法 ======

  /**
   * HTML转义
   * @param {string} text - 要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 创建空状态显示
   * @param {string} icon - 图标
   * @param {string} title - 标题
   * @param {string} subtitle - 副标题
   */
  createEmptyState(icon, title, subtitle) {
    return `
      <div class="empty-icon">${icon}</div>
      <div class="empty-text">${title}</div>
      <div class="empty-subtext">${subtitle}</div>
    `;
  }

  /**
   * 更新文件计数显示
   * @param {number} fileCount - 文件数量
   * @param {number} dirCount - 目录数量
   */
  updateFileCount(fileCount, dirCount) {
    const countElement = document.getElementById('nz-file-count');
    if (countElement) {
      const totalCount = fileCount + dirCount;
      if (totalCount === 0) {
        countElement.textContent = '空目录';
      } else {
        const parts = [];
        if (dirCount > 0) parts.push(`${dirCount}个目录`);
        if (fileCount > 0) parts.push(`${fileCount}个文件`);
        countElement.textContent = parts.join(', ');
      }
    }
  }

  /**
   * 设置加载进度
   * @param {number} progress - 进度百分比 (0-100)
   * @param {string} message - 进度消息
   */
  setLoadingProgress(progress, message) {
    const loadingOverlay = document.querySelector('#nz-content .loading-overlay');
    if (loadingOverlay) {
      let progressBar = loadingOverlay.querySelector('.progress-bar');
      let progressText = loadingOverlay.querySelector('.progress-text');
      
      if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = '<div class="progress-fill"></div>';
        loadingOverlay.appendChild(progressBar);
      }
      
      if (!progressText) {
        progressText = document.createElement('div');
        progressText.className = 'progress-text';
        loadingOverlay.appendChild(progressText);
      }
      
      const progressFill = progressBar.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
      
      if (progressText) {
        progressText.textContent = message || `加载中... ${progress}%`;
      }
    }
  }

  /**
   * 清除加载进度
   */
  clearLoadingProgress() {
    const loadingOverlay = document.querySelector('#nz-content .loading-overlay');
    if (loadingOverlay) {
      const progressBar = loadingOverlay.querySelector('.progress-bar');
      const progressText = loadingOverlay.querySelector('.progress-text');
      
      if (progressBar) progressBar.remove();
      if (progressText) progressText.remove();
    }
  }
}

// 导出模块
export { WorkflowUI };
