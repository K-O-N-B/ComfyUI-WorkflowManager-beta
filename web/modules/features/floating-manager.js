// modules/features/floating-manager.js
// 浮动工作流管理器模块
// 第七阶段模块化：浮动管理器和工作流状态管理

"use strict";

// ====== 工作流状态类 ======
class WorkflowState {
  constructor(filePath, data, timestamp = Date.now()) {
    this.filePath = filePath;
    this.fileName = this.extractFileName(filePath);
    this.data = data;
    this.timestamp = timestamp;
    this.isModified = false;
    this.lastSaved = timestamp;
    this.id = `workflow_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  extractFileName(filePath) {
    if (!filePath) return 'Unknown';
    return filePath.split(/[\\/]/).pop() || 'Unknown';
  }
  
  getDisplayName() {
    return this.fileName.replace(/\.[^/.]+$/, ""); // 移除扩展名
  }
  
  getDirectory() {
    if (!this.filePath) return '';
    const parts = this.filePath.split(/[\\/]/);
    return parts.slice(0, -1).join('\\');
  }
}

// ====== 浮动工作流管理器主类 ======
class FloatingWorkflowManager {
  constructor(pluginName, dependencies = {}) {
    this.pluginName = pluginName || 'NZ_WorkflowManager';
    this.currentWorkflow = null;
    this.isVisible = false;
    this.isCollapsed = false;
    this.element = null;
    this.isInitializing = false;
    this.pendingWorkflow = null;
    
    // 依赖注入 - 避免直接使用全局变量
    this.config = dependencies.config;
    this.workflowNotesManager = dependencies.workflowNotesManager;
    this.uiManager = dependencies.uiManager;
    this.WorkflowNoteEditor = dependencies.WorkflowNoteEditor;
    
    // 立即初始化，而不是延迟
    this.initializeImmediately();
  }
  
  // 立即初始化方法
  initializeImmediately() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM已经准备好，立即初始化
      this.initialize();
    }
  }
  
  // 初始化方法
  initialize() {
    try {
      console.log(`[${this.pluginName}] 开始初始化浮动管理器`);
      this.isInitializing = true;
      
      // 检查是否已有DOM元素，如果有则先清理
      if (this.element) {
        console.log(`[${this.pluginName}] 发现已存在的DOM元素，先清理`);
        this.cleanup();
      }
      
      this.createFloatingManager();
      
      this.isInitializing = false;
      console.log(`[${this.pluginName}] 浮动工作流助手初始化完成`);
    } catch (error) {
      this.isInitializing = false;
      console.error(`[${this.pluginName}] 浮动管理器初始化失败:`, error);
    }
  }
  
  // 清理DOM元素
  cleanup() {
    try {
      if (this.element && this.element.parentNode) {
        console.log(`[${this.pluginName}] 清理浮动管理器DOM元素`);
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
      this.isVisible = false;
      this.isCollapsed = false;
    } catch (error) {
      console.error(`[${this.pluginName}] 清理DOM元素失败:`, error);
    }
  }
  
  // 确保样式已添加（使用UI管理器的样式）
  ensureStyles() {
    // 检查是否已有样式
    if (document.querySelector('#nz-floating-manager-styles')) {
      return;
    }
    
    // 使用UI管理器的样式添加功能
    if (this.uiManager && typeof this.uiManager.addManagerStyles === 'function') {
      console.log(`[${this.pluginName}] 通过UI管理器添加浮动管理器样式`);
      this.uiManager.addManagerStyles();
    } else {
      // 备用方案：调用全局样式添加函数
      if (typeof addManagerStyles === 'function') {
        console.log(`[${this.pluginName}] 通过全局函数添加浮动管理器样式`);
        addManagerStyles();
      }
    }
  }

  // 创建浮动管理器UI
  createFloatingManager() {
    // 确保样式已添加
    this.ensureStyles();
    
    this.element = document.createElement('div');
    this.element.className = 'nz-floating-manager';
    this.element.innerHTML = this.getFloatingManagerHTML();
    
    // 添加到页面
    document.body.appendChild(this.element);
    
    // 绑定事件
    this.bindEvents();
    
    // 应用当前主题
    this.applyCurrentTheme();
    
    // 检查并显示浮动警告
    this.checkAndShowFloatingWarning();
    
    // 初始隐藏 (设置为隐藏状态，不需要动画)
    this.element.style.display = 'none';
    this.isVisible = false;
  }
  
  // 获取浮动管理器HTML模板
  getFloatingManagerHTML() {
    return `
      <div class="nz-floating-header">
        <div class="nz-floating-title">
          <i class="pi pi-file"></i>
          <span class="nz-title-text">浮动框</span>
        </div>
        <div class="nz-floating-controls">
          <button class="nz-floating-btn nz-collapse-btn" title="折叠/展开">
            <i class="pi pi-chevron-up"></i>
          </button>
          <button class="nz-floating-btn nz-close-btn" title="关闭">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
      
      <!-- 浮动管理器警告提示 -->
      <div class="nz-floating-warning" id="nz-floating-warning" style="display: none;">
        <div class="nz-floating-warning-content">
          <span class="nz-floating-warning-text">在使用本插件时不要用任何官方工作流管理功能。</span>
          <button class="nz-floating-warning-close" title="关闭">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
      
      <!-- 折叠时的紧凑布局 -->
      <div class="nz-collapsed-layout" style="display: none;">
        <span class="nz-collapsed-filename">工作流名称</span>
        <div class="nz-collapsed-actions">
          <button class="nz-collapsed-btn nz-collapsed-save-btn" disabled title="保存到原文件">
            <i class="pi pi-save"></i>
          </button>
          <button class="nz-collapsed-btn nz-collapsed-saveas-btn" disabled title="另存为...">
            <i class="pi pi-download"></i>
          </button>
        </div>
        <div class="nz-collapsed-controls">
          <button class="nz-floating-btn nz-collapse-btn" title="展开">
            <i class="pi pi-chevron-down"></i>
          </button>
          <button class="nz-floating-btn nz-close-btn" title="关闭">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
      
      <div class="nz-floating-content">
        <div class="nz-current-workflow">
          <div class="nz-no-workflow">
            <i class="pi pi-file-o"></i>
            <span>未加载工作流</span>
          </div>
          
          <div class="nz-workflow-info" style="display: none;">
            <div class="nz-workflow-name">
              <div class="nz-workflow-name-left">
                <i class="pi pi-file"></i>
                <span class="nz-name-text">文件名</span>
                <span class="nz-modified-indicator" title="已修改">●</span>
              </div>
              <button class="nz-add-note-btn" title="增加备注">
                <i class="pi pi-plus"></i>
                <span>增加备注</span>
              </button>
            </div>
            <div class="nz-workflow-path">
              <i class="pi pi-folder"></i>
              <span class="nz-path-text">文件路径</span>
            </div>
            
            <!-- 备注信息区域 -->
            <div class="nz-workflow-notes" style="display: none;">
              <div class="nz-note-content-row">
                <div class="nz-note-description-text">备注描述内容</div>
                <button class="nz-note-edit-btn" title="编辑备注">✏️</button>
              </div>
              <div class="nz-note-tags-container">
                <!-- 动态生成的标签 -->
              </div>
              <div class="nz-note-meta">
                <span class="nz-note-category-text">分类</span>
                <span class="nz-note-priority-text">优先级</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="nz-workflow-actions">
          <button class="nz-action-btn nz-save-btn" disabled title="保存到原文件">
            <i class="pi pi-save"></i>
            <span>保存到原文件</span>
          </button>
          <button class="nz-action-btn nz-saveas-btn" disabled title="另存为...">
            <i class="pi pi-download"></i>
            <span>另存为…</span>
          </button>
        </div>
      </div>
    `;
  }
  
  // 绑定事件
  bindEvents() {
    // 折叠/展开按钮 (头部和折叠布局中都有)
    const collapseBtns = this.element.querySelectorAll('.nz-collapse-btn');
    collapseBtns.forEach(btn => {
      btn.addEventListener('click', () => this.toggleCollapse());
    });
    
    // 浮动警告关闭按钮
    const warningCloseBtn = this.element.querySelector('.nz-floating-warning-close');
    if (warningCloseBtn) {
      warningCloseBtn.addEventListener('click', () => this.hideFloatingWarning());
    }
    
    // 关闭按钮 (头部和折叠布局中都有)
    const closeBtns = this.element.querySelectorAll('.nz-close-btn');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.hide());
    });
    
    // 保存到原文件 (内容区域和折叠布局中都有)
    const saveBtn = this.element.querySelector('.nz-save-btn');
    const collapsedSaveBtn = this.element.querySelector('.nz-collapsed-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveToOriginal());
    if (collapsedSaveBtn) collapsedSaveBtn.addEventListener('click', () => this.saveToOriginal());
    
    // 另存为 (内容区域和折叠布局中都有)
    const saveAsBtn = this.element.querySelector('.nz-saveas-btn');
    const collapsedSaveAsBtn = this.element.querySelector('.nz-collapsed-saveas-btn');
    if (saveAsBtn) saveAsBtn.addEventListener('click', () => this.saveAs());
    if (collapsedSaveAsBtn) collapsedSaveAsBtn.addEventListener('click', () => this.saveAs());
    
    // 拖拽功能
    this.makeDraggable();
    this.setupNoteEditButton();
    this.setupAddNoteButton();
    
    // 初始化时更新备注显示状态
    setTimeout(() => {
      console.log(`[${this.pluginName}] 浮动管理器：延迟调用备注显示更新`);
      this.updateWorkflowNoteDisplay();
    }, 100);
  }
  
  // 设置备注编辑按钮事件
  setupNoteEditButton() {
    const editBtn = this.element.querySelector('.nz-note-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (this.currentWorkflow && this.currentWorkflow.filePath) {
          const existingNote = this.workflowNotesManager ? 
            this.workflowNotesManager.getNote(this.currentWorkflow.filePath) : null;
          
          if (this.WorkflowNoteEditor && typeof this.WorkflowNoteEditor.openEditor === 'function') {
            this.WorkflowNoteEditor.openEditor(this.currentWorkflow.filePath, existingNote);
          } else if (window.WorkflowNoteEditor) {
            window.WorkflowNoteEditor.openEditor(this.currentWorkflow.filePath, existingNote);
          }
        }
      });
    }
  }
  
  // 设置"增加备注"按钮事件
  setupAddNoteButton() {
    const addNoteBtn = this.element.querySelector('.nz-add-note-btn');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        if (this.currentWorkflow && this.currentWorkflow.filePath) {
          console.log(`[${this.pluginName}] 浮动管理器：点击增加备注按钮`);
          
          if (this.WorkflowNoteEditor && typeof this.WorkflowNoteEditor.openEditor === 'function') {
            this.WorkflowNoteEditor.openEditor(this.currentWorkflow.filePath, null);
          } else if (window.WorkflowNoteEditor) {
            window.WorkflowNoteEditor.openEditor(this.currentWorkflow.filePath, null);
          }
        }
      });
    }
  }
  
  // 加载工作流
  loadWorkflow(filePath, workflowData) {
    console.log(`[${this.pluginName}] 浮动管理器：加载工作流 ${filePath}`);
    
    try {
      // 如果元素还没有创建，先保存工作流信息，并等待初始化完成
      if (!this.element) {
        console.log(`[${this.pluginName}] 浮动管理器UI未准备好，保存工作流信息并等待初始化`);
        this.pendingWorkflow = { filePath, workflowData };
        
        // 如果初始化还没开始，立即开始初始化
        if (!this.isInitializing) {
          console.log(`[${this.pluginName}] 立即启动初始化流程`);
          this.isInitializing = true;
          this.initialize();
        }
        
        // 等待初始化完成后重试
        this.waitForInitialization().then(() => {
          if (this.pendingWorkflow && this.pendingWorkflow.filePath === filePath) {
            console.log(`[${this.pluginName}] 初始化完成，重新加载工作流`);
            const pendingData = this.pendingWorkflow;
            this.pendingWorkflow = null;
            this.loadWorkflow(pendingData.filePath, pendingData.workflowData);
          }
        });
        return;
      }
      
      // 创建工作流状态
      this.currentWorkflow = new WorkflowState(filePath, workflowData);
      
      // 更新UI
      this.updateCurrentWorkflowDisplay();
      
      // 显示管理器
      this.show();
      
      console.log(`[${this.pluginName}] 浮动管理器：工作流加载完成`);
      
    } catch (error) {
      console.error(`[${this.pluginName}] 浮动管理器：加载工作流失败`, error);
    }
  }
  
  // 等待初始化完成
  waitForInitialization() {
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (this.element && !this.isInitializing) {
          console.log(`[${this.pluginName}] 浮动管理器初始化检查：已完成`);
          resolve();
        } else {
          console.log(`[${this.pluginName}] 浮动管理器初始化检查：未完成，继续等待`);
          setTimeout(checkInitialized, 50);
        }
      };
      checkInitialized();
    });
  }
  
  // 更新当前工作流显示
  updateCurrentWorkflowDisplay() {
    if (!this.element) return; // 安全检查
    
    const noWorkflowDiv = this.element.querySelector('.nz-no-workflow');
    const workflowInfoDiv = this.element.querySelector('.nz-workflow-info');
    
    if (this.currentWorkflow) {
      // 隐藏"未加载"提示，显示工作流信息
      noWorkflowDiv.style.display = 'none';
      workflowInfoDiv.style.display = 'block';
      
      // 更新文件名
      const nameSpan = this.element.querySelector('.nz-name-text');
      if (nameSpan) nameSpan.textContent = this.currentWorkflow.getDisplayName();
      
      // 更新路径
      const pathSpan = this.element.querySelector('.nz-path-text');
      if (pathSpan) pathSpan.textContent = this.currentWorkflow.getDirectory();
      
      // 更新备注信息
      this.updateWorkflowNoteDisplay();
      
      // 启用操作按钮
      const saveBtn = this.element.querySelector('.nz-save-btn');
      const saveAsBtn = this.element.querySelector('.nz-saveas-btn');
      if (saveBtn) saveBtn.disabled = false;
      if (saveAsBtn) saveAsBtn.disabled = false;
      
      // 更新修改状态指示器
      this.updateModifiedIndicator();
      
    } else {
      // 显示"未加载"提示，隐藏工作流信息
      noWorkflowDiv.style.display = 'block';
      workflowInfoDiv.style.display = 'none';
      
      // 禁用操作按钮
      const saveBtn = this.element.querySelector('.nz-save-btn');
      const saveAsBtn = this.element.querySelector('.nz-saveas-btn');
      if (saveBtn) saveBtn.disabled = true;
      if (saveAsBtn) saveAsBtn.disabled = true;
    }
  }
  
  // 更新修改状态指示器
  updateModifiedIndicator() {
    if (!this.element) return; // 安全检查
    
    const indicator = this.element.querySelector('.nz-modified-indicator');
    if (indicator) {
      if (this.currentWorkflow && this.currentWorkflow.isModified) {
        indicator.style.display = 'inline';
        indicator.style.color = '#ff9999';
      } else {
        indicator.style.display = 'none';
      }
    }
  }
  
  // 更新工作流备注显示
  updateWorkflowNoteDisplay() {
    console.log(`[${this.pluginName}] 浮动管理器：开始更新备注显示`);
    
    if (!this.element || !this.currentWorkflow) {
      console.log(`[${this.pluginName}] 浮动管理器：缺少必要元素，跳过备注更新`);
      return;
    }
    
    const notesDiv = this.element.querySelector('.nz-workflow-notes');
    const addNoteBtn = this.element.querySelector('.nz-add-note-btn');
    const filePath = this.currentWorkflow.filePath;
    
    // 获取备注数据
    const note = this.workflowNotesManager ? 
      this.workflowNotesManager.getNote(filePath) : 
      (window.workflowNotesManager ? window.workflowNotesManager.getNote(filePath) : null);
    
    if (note) {
      // 有备注：显示备注区域，隐藏"增加备注"按钮
      if (notesDiv) notesDiv.style.display = 'block';
      if (addNoteBtn) addNoteBtn.style.cssText = 'display: none !important;';
      
      // 更新描述
      const descriptionDiv = this.element.querySelector('.nz-note-description-text');
      if (descriptionDiv && note.description) {
        descriptionDiv.textContent = note.description;
        descriptionDiv.style.display = 'block';
      }
      
      // 更新标签
      const tagsContainer = this.element.querySelector('.nz-note-tags-container');
      if (tagsContainer && note.tags && note.tags.length > 0) {
        tagsContainer.innerHTML = note.tags.map(tag => 
          `<span class="nz-tag">${tag}</span>`
        ).join('');
        tagsContainer.style.display = 'flex';
      }
      
      // 更新分类和优先级
      const categorySpan = this.element.querySelector('.nz-note-category-text');
      const prioritySpan = this.element.querySelector('.nz-note-priority-text');
      
      if (categorySpan && prioritySpan && (note.category || note.priority)) {
        categorySpan.textContent = note.category ? `📁 ${note.category}` : '';
        prioritySpan.textContent = note.priority ? this.getPriorityText(note.priority) : '';
        prioritySpan.className = `nz-note-priority-text ${note.priority ? 'nz-priority-' + note.priority : ''}`;
        categorySpan.parentElement.style.display = 'flex';
      }
      
    } else {
      // 没有备注：隐藏备注区域，显示"增加备注"按钮
      if (notesDiv) notesDiv.style.display = 'none';
      if (addNoteBtn) {
        addNoteBtn.style.display = 'inline-flex';
        addNoteBtn.style.visibility = 'visible';
        addNoteBtn.style.opacity = '1';
      }
    }
  }
  
  // 获取优先级文本
  getPriorityText(priority) {
    const priorityMap = {
      'high': '⭐ 重要',
      'normal': '📄 普通', 
      'low': '📝 不常用'
    };
    return priorityMap[priority] || priority;
  }
  
  // ✅ 修复：保存到原文件 - 使用正确的API参数
  async saveToOriginal() {
    if (!this.currentWorkflow) {
      console.warn(`[${this.pluginName}] 没有当前工作流，无法保存`);
      return;
    }
    
    console.log(`[${this.pluginName}] 开始保存到原文件: ${this.currentWorkflow.filePath}`);
    
    try {
      this.setSaveButtonsLoading(true);
      
      // 获取当前ComfyUI工作流数据
      if (typeof app === 'undefined' || !app.graph || !app.graph.serialize) {
        throw new Error('ComfyUI应用未就绪或缺少序列化功能');
      }
      
      const workflowData = app.graph.serialize();
      const jsonData = JSON.stringify(workflowData, null, 2);
      
      // ✅ 修复：使用正确的API参数名称
      const response = await fetch('/file_operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_workflow',
          file_path: this.currentWorkflow.filePath,  // ✅ 正确参数名
          workflow_data: jsonData                    // ✅ 正确参数名
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`[${this.pluginName}] 保存成功: ${this.currentWorkflow.filePath}`);
          
          // 显示成功通知
          this.showNotification('工作流保存成功', 'success');
          
          // 清除修改标记
          this.currentWorkflow.isModified = false;
          this.currentWorkflow.lastSaved = Date.now();
          this.updateModifiedIndicator();
          
        } else {
          throw new Error(result.error || '保存失败');
        }
      } else {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`[${this.pluginName}] 保存失败:`, error);
      this.showNotification(`保存失败: ${error.message}`, 'error');
    } finally {
      this.setSaveButtonsLoading(false);
    }
  }
  
  // ✅ 修复：另存为 - 添加文件名输入弹窗
  async saveAs() {
    if (!this.currentWorkflow) {
      console.warn(`[${this.pluginName}] 没有当前工作流，无法另存为`);
      return;
    }
    
    // 获取原始文件名（不含路径和扩展名）
    const originalPath = this.currentWorkflow.filePath;
    const fileName = originalPath.split(/[/\\]/).pop();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // 生成默认新文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const defaultName = `${nameWithoutExt}_副本_${timestamp}`;
    
    // 显示输入弹窗
    const newFileName = await this.showSaveAsDialog(defaultName);
    if (!newFileName) {
      console.log(`[${this.pluginName}] 用户取消了另存为操作`);
      return; // 用户取消
    }
    
    console.log(`[${this.pluginName}] 开始另存为: ${originalPath} -> ${newFileName}`);
    
    try {
      this.setSaveButtonsLoading(true);
      
      // 获取当前ComfyUI工作流数据
      if (typeof app === 'undefined' || !app.graph || !app.graph.serialize) {
        throw new Error('ComfyUI应用未就绪或缺少序列化功能');
      }
      
      const workflowData = app.graph.serialize();
      const jsonData = JSON.stringify(workflowData, null, 2);
      
      // 构建新文件路径
      const originalDir = originalPath.substring(0, originalPath.lastIndexOf(/[/\\]/));
      const newPath = `${originalDir}/${newFileName}.json`;
      
      // ✅ 修复：使用正确的API参数名称
      const response = await fetch('/file_operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_workflow',
          file_path: newPath,          // ✅ 正确参数名
          workflow_data: jsonData      // ✅ 正确参数名
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`[${this.pluginName}] 另存为成功: ${newPath}`);
          
          // 显示成功通知
          this.showNotification(`已另存为: ${newFileName}.json`, 'success');
          
        } else {
          throw new Error(result.error || '另存为失败');
        }
      } else {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`[${this.pluginName}] 另存为失败:`, error);
      this.showNotification(`另存为失败: ${error.message}`, 'error');
    } finally {
      this.setSaveButtonsLoading(false);
    }
  }
  
  // 显示另存为文件名输入弹窗
  showSaveAsDialog(defaultName) {
    return new Promise((resolve) => {
      // 创建弹窗HTML
      const dialogHTML = `
        <div class="nz-saveas-overlay" id="nz-saveas-overlay">
          <div class="nz-saveas-dialog">
            <div class="nz-saveas-header">
              <h3>另存为</h3>
              <button class="nz-saveas-close" id="nz-saveas-close">×</button>
            </div>
            <div class="nz-saveas-body">
              <label for="nz-saveas-input">文件名：</label>
              <input type="text" id="nz-saveas-input" value="${defaultName}" placeholder="请输入文件名">
              <small>文件将保存在当前目录下，扩展名会自动添加</small>
            </div>
            <div class="nz-saveas-footer">
              <button class="nz-saveas-cancel" id="nz-saveas-cancel">取消</button>
              <button class="nz-saveas-confirm" id="nz-saveas-confirm">确定</button>
            </div>
          </div>
        </div>
      `;
      
      // 添加弹窗样式（如果还没有）
      this.ensureSaveAsDialogStyles();
      
      // 添加弹窗到页面
      const overlay = document.createElement('div');
      overlay.innerHTML = dialogHTML;
      document.body.appendChild(overlay.firstElementChild);
      
      const dialog = document.getElementById('nz-saveas-overlay');
      const input = document.getElementById('nz-saveas-input');
      const confirmBtn = document.getElementById('nz-saveas-confirm');
      const cancelBtn = document.getElementById('nz-saveas-cancel');
      const closeBtn = document.getElementById('nz-saveas-close');
      
      // 聚焦并选中输入框文本
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);
      
      // 确定按钮事件
      const handleConfirm = () => {
        const fileName = input.value.trim();
        if (fileName) {
          cleanup();
          resolve(fileName);
        } else {
          input.style.borderColor = '#e74c3c';
          input.placeholder = '文件名不能为空';
        }
      };
      
      // 取消按钮事件
      const handleCancel = () => {
        cleanup();
        resolve(null);
      };
      
      // 清理函数
      const cleanup = () => {
        if (dialog && dialog.parentNode) {
          dialog.parentNode.removeChild(dialog);
        }
      };
      
      // 绑定事件
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      closeBtn.addEventListener('click', handleCancel);
      
      // 回车确定，ESC取消
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
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          handleCancel();
        }
      });
    });
  }
  
  // 确保另存为弹窗样式存在
  ensureSaveAsDialogStyles() {
    if (document.querySelector('#nz-saveas-dialog-styles')) {
      return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'nz-saveas-dialog-styles';
    styles.textContent = `
      .nz-saveas-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
      }
      
      .nz-saveas-dialog {
        background: var(--comfy-menu-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        min-width: 400px;
        max-width: 500px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
      }
      
      .nz-saveas-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .nz-saveas-header h3 {
        margin: 0;
        color: var(--input-text);
        font-size: 16px;
      }
      
      .nz-saveas-close {
        background: none;
        border: none;
        font-size: 20px;
        color: var(--input-text);
        cursor: pointer;
        padding: 4px;
        line-height: 1;
      }
      
      .nz-saveas-close:hover {
        background: var(--comfy-input-bg);
        border-radius: 4px;
      }
      
      .nz-saveas-body {
        padding: 20px;
      }
      
      .nz-saveas-body label {
        display: block;
        margin-bottom: 8px;
        color: var(--input-text);
        font-weight: 500;
      }
      
      .nz-saveas-body input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--comfy-input-bg);
        color: var(--input-text);
        font-size: 14px;
        box-sizing: border-box;
      }
      
      .nz-saveas-body input:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
      }
      
      .nz-saveas-body small {
        display: block;
        margin-top: 8px;
        color: var(--descrip-text);
        font-size: 12px;
      }
      
      .nz-saveas-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 20px;
        border-top: 1px solid var(--border-color);
      }
      
      .nz-saveas-footer button {
        padding: 8px 16px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        min-width: 70px;
      }
      
      .nz-saveas-cancel {
        background: var(--comfy-menu-bg);
        color: var(--input-text);
      }
      
      .nz-saveas-cancel:hover {
        background: var(--comfy-input-bg);
      }
      
      .nz-saveas-confirm {
        background: #007acc;
        color: white;
        border-color: #007acc;
      }
      
      .nz-saveas-confirm:hover {
        background: #005a9e;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  // 设置保存按钮加载状态
  setSaveButtonsLoading(loading) {
    if (!this.element) return;
    
    const buttons = [
      this.element.querySelector('.nz-save-btn'),
      this.element.querySelector('.nz-saveas-btn'),
      this.element.querySelector('.nz-collapsed-save-btn'),
      this.element.querySelector('.nz-collapsed-saveas-btn')
    ].filter(btn => btn);
    
    buttons.forEach(btn => {
      if (loading) {
        btn.disabled = true;
        btn.classList.add('nz-loading');
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'pi pi-spin pi-spinner';
      } else {
        btn.disabled = false;
        btn.classList.remove('nz-loading');
        const span = btn.querySelector('span');
        const icon = btn.querySelector('i');
        if (span && span.textContent.includes('保存') && icon) {
          icon.className = 'pi pi-save';
        } else if (icon) {
          icon.className = 'pi pi-download';
        }
      }
    });
  }
  
  // 显示通知 (使用UI管理器或全局通知)
  showNotification(message, type) {
    if (this.uiManager && this.uiManager.showNotification) {
      this.uiManager.showNotification(message, type);
    } else if (window.nzWorkflowManager && window.nzWorkflowManager.showNotification) {
      window.nzWorkflowManager.showNotification(message, type);
    } else {
      console.log(`[${this.pluginName}] 通知: ${message} (${type})`);
    }
  }
  
  // 显示浮动管理器
  show() {
    if (!this.element) {
      console.warn(`[${this.pluginName}] 浮动管理器元素不存在，尝试重新初始化`);
      this.initialize();
      return;
    }
    
    this.element.style.display = 'block';
    this.isVisible = true;
    
    // 应用显示动画
    setTimeout(() => {
      if (this.element) {
        this.element.classList.add('show');
      }
    }, 10);
    
    // 显示警告（如果需要）
    this.checkAndShowFloatingWarning();
    
    console.log(`[${this.pluginName}] 浮动管理器已显示`);
  }
  
  // 隐藏浮动管理器
  hide() {
    if (!this.element) return;
    
    this.element.classList.remove('show');
    this.isVisible = false;
    
    // 延迟隐藏DOM元素
    setTimeout(() => {
      if (this.element && !this.isVisible) {
        this.element.style.display = 'none';
      }
    }, 300);
    
    console.log(`[${this.pluginName}] 浮动管理器已隐藏`);
  }
  
  // 切换折叠状态
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.element) {
      if (this.isCollapsed) {
        this.element.classList.add('collapsed');
        // 隐藏标题栏和内容区域
        this.element.querySelector('.nz-floating-header').style.display = 'none';
        this.element.querySelector('.nz-floating-content').style.display = 'none';
        this.element.querySelector('.nz-collapsed-layout').style.display = 'flex';
        this.updateCollapsedLayout();
      } else {
        this.element.classList.remove('collapsed');
        // 显示标题栏和内容区域
        this.element.querySelector('.nz-floating-header').style.display = 'flex';
        this.element.querySelector('.nz-floating-content').style.display = 'block';
        this.element.querySelector('.nz-collapsed-layout').style.display = 'none';
      }
      
      // 更新折叠按钮图标
      const collapseIcons = this.element.querySelectorAll('.nz-collapse-btn i');
      collapseIcons.forEach(icon => {
        icon.className = this.isCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up';
      });
    }
    
    console.log(`[${this.pluginName}] 浮动管理器${this.isCollapsed ? '已折叠' : '已展开'}`);
  }
  
  // 更新折叠布局信息
  updateCollapsedLayout() {
    if (!this.element || !this.currentWorkflow) return;
    
    const collapsedFilename = this.element.querySelector('.nz-collapsed-filename');
    if (collapsedFilename) {
      collapsedFilename.textContent = this.currentWorkflow.getDisplayName();
    }
    
    // 更新折叠状态下的按钮状态
    const collapsedSaveBtn = this.element.querySelector('.nz-collapsed-save-btn');
    const collapsedSaveAsBtn = this.element.querySelector('.nz-collapsed-saveas-btn');
    
    if (collapsedSaveBtn && collapsedSaveAsBtn) {
      const hasWorkflow = !!this.currentWorkflow;
      collapsedSaveBtn.disabled = !hasWorkflow;
      collapsedSaveAsBtn.disabled = !hasWorkflow;
    }
  }
  
  // 检查并显示浮动警告
  checkAndShowFloatingWarning() {
    const warningShown = localStorage.getItem('nz_floating_warning_shown');
    if (!warningShown && this.element) {
      const warning = this.element.querySelector('#nz-floating-warning');
      if (warning) {
        warning.style.display = 'block';
      }
    }
  }
  
  // 隐藏浮动警告
  hideFloatingWarning() {
    if (this.element) {
      const warning = this.element.querySelector('#nz-floating-warning');
      if (warning) {
        warning.style.display = 'none';
        localStorage.setItem('nz_floating_warning_shown', 'true');
      }
    }
  }
  
  // 应用当前主题
  applyCurrentTheme() {
    if (!this.element) return;
    
    // 获取当前主题
    const currentTheme = localStorage.getItem('nz_theme') || 
                        (typeof currentTheme !== 'undefined' ? currentTheme : 'dark');
    
    this.syncTheme(currentTheme);
  }
  
  // 同步主题
  syncTheme(theme) {
    if (!this.element) return;
    
    try {
      // 移除现有主题类
      this.element.classList.remove('nz-theme-light', 'nz-theme-dark');
      
      // 添加新主题类
      this.element.classList.add(`nz-theme-${theme}`);
      
      // 添加主题切换动画
      this.element.classList.add('nz-theme-transition');
      
      // 移除动画类
      setTimeout(() => {
        if (this.element) {
          this.element.classList.remove('nz-theme-transition');
        }
      }, 300);
      
      console.log(`[${this.pluginName}] 浮动管理器主题同步完成: ${theme}`);
    } catch (error) {
      console.error(`[${this.pluginName}] 浮动管理器主题同步失败:`, error);
    }
  }
  
  // 使元素可拖拽
  makeDraggable() {
    if (!this.element) return;
    
    const header = this.element.querySelector('.nz-floating-header');
    const collapsedFilename = this.element.querySelector('.nz-collapsed-filename');
    if (!header) return;
    
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    // 为header和折叠状态的文件名添加拖拽支持
    const addDragListener = (element) => {
      element.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return; // 忽略按钮点击
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        isDragging = true;
        element.style.cursor = 'grabbing';
      });
    };
    
    addDragListener(header);
    if (collapsedFilename) {
      addDragListener(collapsedFilename);
    }
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        this.element.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      header.style.cursor = 'grab';
      if (collapsedFilename) {
        collapsedFilename.style.cursor = 'grab';
      }
    });
    
    // 设置初始cursor
    header.style.cursor = 'grab';
    if (collapsedFilename) {
      collapsedFilename.style.cursor = 'grab';
    }
  }
  
  // 标记工作流已修改
  markAsModified() {
    if (!this.currentWorkflow) return;
    
    this.currentWorkflow.isModified = true;
    this.updateModifiedIndicator();
    
    console.log(`[${this.pluginName}] 工作流已标记为修改: ${this.currentWorkflow.filePath}`);
  }
  
  // 清除修改标记
  clearModified() {
    if (!this.currentWorkflow) return;
    
    this.currentWorkflow.isModified = false;
    this.currentWorkflow.lastSaved = Date.now();
    this.updateModifiedIndicator();
    
    console.log(`[${this.pluginName}] 工作流修改标记已清除: ${this.currentWorkflow.filePath}`);
  }
  
  // 获取当前工作流状态
  getCurrentWorkflowState() {
    return this.currentWorkflow;
  }
  
  // 清除当前工作流
  clearWorkflow() {
    this.currentWorkflow = null;
    this.updateCurrentWorkflowDisplay();
    console.log(`[${this.pluginName}] 浮动管理器工作流已清除`);
  }
  
  // 销毁浮动管理器
  destroy() {
    this.cleanup();
    console.log(`[${this.pluginName}] 浮动管理器已销毁`);
  }
}

// ====== 模块导出 ======
export { WorkflowState, FloatingWorkflowManager };