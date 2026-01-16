// web/modules/features/workflow-note-editor.js
"use strict";

/**
 * 工作流备注编辑器模块
 * 负责工作流备注的编辑界面和交互逻辑
 * 
 * 功能包括：
 * - 备注编辑对话框的创建和管理
 * - 标签管理功能
 * - 分类管理功能  
 * - 表单验证和数据保存
 * - 与其他模块的集成
 */
export class WorkflowNoteEditor {
  constructor(config, workflowNotesManager, uiManager) {
    this.config = config;
    this.workflowNotesManager = workflowNotesManager;
    this.uiManager = uiManager;
    this.pluginName = config.PLUGIN_NAME;
    
    console.log(`[${this.pluginName}] 工作流备注编辑器模块已初始化`);
  }

  /**
   * 打开备注编辑器对话框
   * @param {string} filePath - 工作流文件路径
   * @param {Object} existingNote - 现有备注数据
   */
  async openEditor(filePath, existingNote = null) {
    // 创建覆盖层
    const overlay = document.createElement('div');
    overlay.className = 'nz-dialog-overlay';
    overlay.style.zIndex = '10005';
    
    // 创建编辑器对话框
    const dialog = document.createElement('div');
    dialog.className = 'nz-dialog nz-note-editor';
    
    // 标题
    const title = document.createElement('div');
    title.className = 'nz-dialog-title';
    title.innerHTML = `<i class="pi pi-comment"></i> ${existingNote ? '编辑' : '添加'}工作流备注`;
    
    // 表单内容
    const form = document.createElement('div');
    form.innerHTML = `
      <div class="nz-form-group">
        <label>描述：</label>
        <textarea id="note-description" placeholder="详细描述这个工作流的功能、用途和使用场景..." maxlength="500">${existingNote?.description || ''}</textarea>
      </div>
      
      <div class="nz-form-group">
        <label>标签：</label>
        <div class="nz-tag-input">
          <input type="text" id="note-tag-input" placeholder="按回车添加标签...">
          <div class="nz-tag-list" id="note-tag-list">
            <!-- 动态生成的标签 -->
          </div>
        </div>
      </div>
      
      <div class="nz-form-row">
        <div class="nz-form-group">
          <label>分类：</label>
          <div class="nz-category-container">
            <input type="text" id="note-category" list="category-datalist" placeholder="选择或输入新分类..." value="${existingNote?.category || ''}" maxlength="20">
            <datalist id="category-datalist"></datalist>
            <button type="button" id="manage-categories-btn" class="nz-manage-btn" title="管理分类">⚙️</button>
          </div>
        </div>
        
        <div class="nz-form-group">
          <label>优先级：</label>
          <select id="note-priority">
            <option value="normal">普通</option>
            <option value="high">重要</option>
            <option value="low">不常用</option>
          </select>
        </div>
      </div>
    `;
    
    // 按钮
    const buttons = document.createElement('div');
    buttons.className = 'nz-dialog-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'nz-dialog-button';
    cancelBtn.innerHTML = '<i class="pi pi-times"></i> 取消';
    cancelBtn.onclick = () => overlay.remove();
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'nz-dialog-button primary';
    saveBtn.innerHTML = '<i class="pi pi-check"></i> 保存';
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(saveBtn);
    
    // 组装对话框
    dialog.appendChild(title);
    dialog.appendChild(form);
    dialog.appendChild(buttons);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 初始化表单数据
    if (existingNote) {
      document.getElementById('note-category').value = existingNote.category || '';
      document.getElementById('note-priority').value = existingNote.priority || 'normal';
      
      // 初始化标签
      if (existingNote.tags) {
        existingNote.tags.forEach(tag => this.addTag(tag));
      }
    }
    
    // 设置事件监听器
    this.setupEventListeners(overlay, filePath, saveBtn);
    
    // 聚焦到描述输入框
    setTimeout(() => {
      document.getElementById('note-description').focus();
    }, 100);
  }
  
  /**
   * 设置编辑器事件监听器
   * @param {HTMLElement} overlay - 覆盖层元素
   * @param {string} filePath - 文件路径
   * @param {HTMLElement} saveBtn - 保存按钮
   */
  setupEventListeners(overlay, filePath, saveBtn) {
    const tagInput = document.getElementById('note-tag-input');
    
    // 初始化分类列表
    this.initializeCategoryList();
    
    // 分类管理按钮事件
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    if (manageCategoriesBtn) {
      console.log('找到分类管理按钮，绑定事件...');
      manageCategoriesBtn.addEventListener('click', () => {
        console.log('分类管理按钮被点击！');
        try {
          this.showCategoryManager();
        } catch (error) {
          console.error('显示分类管理器时出错:', error);
        }
      });
    } else {
      console.error('未找到分类管理按钮元素 #manage-categories-btn');
    }
    
    // 标签输入事件
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && tagInput.value.trim()) {
        e.preventDefault();
        this.addTag(tagInput.value.trim());
        tagInput.value = '';
      }
    });
    
    // 保存按钮事件
    saveBtn.onclick = () => {
      this.saveNote(filePath, overlay);
    };
    
    // ESC键关闭
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // 点击覆盖层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
  
  /**
   * 添加标签
   * @param {string} tagText - 标签文本
   */
  addTag(tagText) {
    const tagList = document.getElementById('note-tag-list');
    const existingTags = Array.from(tagList.children).map(tag => tag.textContent.replace('×', '').trim());
    
    // 检查标签是否已存在
    if (existingTags.includes(tagText)) {
      this.uiManager.showNotification('标签已存在', 'warning');
      return;
    }
    
    // 创建标签元素
    const tag = document.createElement('span');
    tag.className = 'nz-tag';
    tag.innerHTML = `${tagText} <span class="remove-tag">×</span>`;
    
    // 删除标签事件
    tag.querySelector('.remove-tag').onclick = () => {
      tag.remove();
    };
    
    tagList.appendChild(tag);
  }
  
  /**
   * 保存备注数据
   * @param {string} filePath - 文件路径
   * @param {HTMLElement} overlay - 覆盖层元素
   */
  saveNote(filePath, overlay) {
    const description = document.getElementById('note-description').value.trim();
    const category = document.getElementById('note-category').value;
    const priority = document.getElementById('note-priority').value;
    
    // 获取标签
    const tagList = document.getElementById('note-tag-list');
    const tags = Array.from(tagList.children).map(tag => 
      tag.textContent.replace('×', '').trim()
    ).filter(tag => tag);
    
    // 验证必填字段
    if (!description) {
      this.uiManager.showNotification('请填写描述', 'warning');
      return;
    }
    
    // 保存备注数据
    const noteData = {
      description,
      tags,
      category,
      priority
    };
    
    this.workflowNotesManager.saveNote(filePath, noteData);
    
    // 刷新文件显示
    this.refreshFileDisplay();
    
    // 更新浮动管理器显示
    const floatingManager = window.floatingWorkflowManager;
    if (floatingManager && floatingManager.currentWorkflow && 
        floatingManager.currentWorkflow.filePath === filePath) {
      floatingManager.updateWorkflowNoteDisplay();
    }
    
    // 关闭对话框
    overlay.remove();
    
    this.uiManager.showNotification('备注保存成功', 'success');
  }
  
  /**
   * 刷新文件显示
   */
  refreshFileDisplay() {
    // 刷新当前文件列表以显示新的备注信息
    const fileGrid = document.getElementById('nz-file-grid');
    if (fileGrid) {
      // 重新加载当前目录
      // TODO: Stage8_CLEANUP - 这个函数调用需要在模块化完成后改为模块调用
      if (typeof loadDirectory === 'function' && this.config.getCurrentPath) {
        loadDirectory(this.config.getCurrentPath());
      }
    }
  }
  
  /**
   * 初始化分类列表
   */
  initializeCategoryList() {
    const datalist = document.getElementById('category-datalist');
    if (!datalist) return;
    
    // TODO: Stage8_CLEANUP - WorkflowCategoriesManager 需要模块化
    if (typeof WorkflowCategoriesManager !== 'undefined') {
      const categories = WorkflowCategoriesManager.getCategories();
      
      datalist.innerHTML = '';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        datalist.appendChild(option);
      });
    }
  }
  
  /**
   * 显示分类管理器
   */
  showCategoryManager() {
    console.log('showCategoryManager 方法被调用');
    // 创建分类管理对话框
    const overlay = document.createElement('div');
    overlay.className = 'nz-dialog-overlay';
    overlay.style.zIndex = '10006';
    
    const dialog = document.createElement('div');
    dialog.className = 'nz-dialog category-manager-dialog';
    dialog.style.maxWidth = '500px';
    dialog.style.minWidth = '400px';
    
    const title = document.createElement('h3');
    title.className = 'nz-dialog-title';
    title.innerHTML = '<i class="pi pi-cog"></i> 管理分类';
    title.style.textAlign = 'left';
    title.style.marginBottom = '20px';
    dialog.appendChild(title);
    
    const content = document.createElement('div');
    content.className = 'category-manager-content';
    content.style.padding = '10px 0';
    
    // TODO: Stage8_CLEANUP - WorkflowCategoriesManager 需要模块化
    const categories = (typeof WorkflowCategoriesManager !== 'undefined') ? 
      WorkflowCategoriesManager.getCategories() : [];
    
    content.innerHTML = `
      <div class="category-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px; border: 1px solid var(--border-color, #333); border-radius: 6px; padding: 10px;">
        ${categories.map(cat => `
          <div class="category-item" data-category="${cat}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin: 4px 0; background: var(--card-bg, rgba(255,255,255,0.05)); border-radius: 4px; border: 1px solid var(--border-color, #333);">
            <span class="category-name" style="color: var(--text-color, #fff); font-size: 14px;">${cat}</span>
            <div class="category-actions" style="display: flex; gap: 8px;">
              <button class="edit-category-btn" title="编辑" style="background: transparent; border: none; color: var(--text-color, #fff); cursor: pointer; padding: 4px; border-radius: 3px; font-size: 12px;">✏️</button>
              <button class="delete-category-btn" title="删除" style="background: transparent; border: none; color: #ff6b6b; cursor: pointer; padding: 4px; border-radius: 3px; font-size: 12px;">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="add-category-section" style="display: flex; gap: 10px; align-items: center;">
        <input type="text" id="new-category-input" placeholder="添加新分类..." maxlength="20" style="flex: 1; padding: 10px 12px; border: 1px solid var(--border-color, #333); border-radius: 4px; background: var(--comfy-input-bg, rgba(40,50,70,0.8)); color: var(--input-text, #e0f0ff); font-size: 14px;">
        <button id="add-category-btn" style="padding: 10px 16px; background: var(--accent-color, #007acc); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">添加</button>
      </div>
    `;
    
    dialog.appendChild(content);
    
    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.className = 'nz-dialog-buttons';
    buttonArea.style.display = 'flex';
    buttonArea.style.justifyContent = 'flex-end';
    buttonArea.style.gap = '10px';
    buttonArea.style.marginTop = '20px';
    buttonArea.innerHTML = `
      <button type="button" id="category-done-btn" class="nz-btn nz-btn-primary" style="padding: 10px 20px; background: var(--accent-color, #007acc); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">完成</button>
    `;
    dialog.appendChild(buttonArea);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 点击覆盖层关闭对话框
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    
    // 设置事件监听器
    this.setupCategoryManagerEvents(overlay);
    
    // 聚焦到输入框
    setTimeout(() => {
      const input = document.getElementById('new-category-input');
      if (input) input.focus();
    }, 100);
  }
  
  /**
   * 设置分类管理器事件监听器
   * @param {HTMLElement} overlay - 覆盖层元素
   */
  setupCategoryManagerEvents(overlay) {
    const addBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category-input');
    const doneBtn = document.getElementById('category-done-btn');
    
    // 添加分类
    const addCategory = () => {
      const name = newCategoryInput.value.trim();
      if (!name) return;
      
      // TODO: Stage8_CLEANUP - WorkflowCategoriesManager 需要模块化
      if (typeof WorkflowCategoriesManager !== 'undefined') {
        if (WorkflowCategoriesManager.addCategory(name)) {
          this.refreshCategoryList();
          newCategoryInput.value = '';
          this.uiManager.showNotification('分类添加成功', 'success');
        } else {
          this.uiManager.showNotification('分类已存在或添加失败', 'warning');
        }
      }
    };
    
    addBtn.addEventListener('click', addCategory);
    newCategoryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCategory();
      }
    });
    
    // 删除分类
    overlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-category-btn')) {
        const categoryItem = e.target.closest('.category-item');
        const categoryName = categoryItem.dataset.category;
        
        if (confirm(`确定要删除分类"${categoryName}"吗？`)) {
          // TODO: Stage8_CLEANUP - WorkflowCategoriesManager 需要模块化
          if (typeof WorkflowCategoriesManager !== 'undefined') {
            if (WorkflowCategoriesManager.removeCategory(categoryName)) {
              this.refreshCategoryList();
              this.uiManager.showNotification('分类删除成功', 'success');
            } else {
              this.uiManager.showNotification('删除失败', 'error');
            }
          }
        }
      }
      
      // 编辑分类
      if (e.target.classList.contains('edit-category-btn')) {
        const categoryItem = e.target.closest('.category-item');
        const categoryName = categoryItem.dataset.category;
        const nameSpan = categoryItem.querySelector('.category-name');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = categoryName;
        input.className = 'category-edit-input';
        input.maxLength = 20;
        
        nameSpan.style.display = 'none';
        categoryItem.insertBefore(input, nameSpan.nextSibling);
        input.focus();
        input.select();
        
        const saveEdit = () => {
          const newName = input.value.trim();
          if (newName && newName !== categoryName) {
            // TODO: Stage8_CLEANUP - WorkflowCategoriesManager 需要模块化
            if (typeof WorkflowCategoriesManager !== 'undefined') {
              if (WorkflowCategoriesManager.renameCategory(categoryName, newName)) {
                this.refreshCategoryList();
                this.uiManager.showNotification('分类重命名成功', 'success');
              } else {
                this.uiManager.showNotification('重命名失败，分类名可能已存在', 'warning');
                nameSpan.style.display = '';
                input.remove();
              }
            }
          } else {
            nameSpan.style.display = '';
            input.remove();
          }
        };
        
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
          } else if (e.key === 'Escape') {
            nameSpan.style.display = '';
            input.remove();
          }
        });
        
        input.addEventListener('blur', saveEdit);
      }
    });
    
    // 完成按钮
    doneBtn.addEventListener('click', () => {
      // 更新主对话框中的分类列表
      this.initializeCategoryList();
      overlay.remove();
    });
    
    // ESC关闭
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        // 更新主对话框中的分类列表
        this.initializeCategoryList();
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // 点击覆盖层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.initializeCategoryList();
        overlay.remove();
      }
    });
  }
  
  /**
   * 刷新分类列表显示
   */
  refreshCategoryList() {
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) return;
    
    // TODO: Stage8_CLEANUP - WorkflowCategoriesManager 需要模块化
    if (typeof WorkflowCategoriesManager !== 'undefined') {
      const categories = WorkflowCategoriesManager.getCategories();
      categoryList.innerHTML = categories.map(cat => `
        <div class="category-item" data-category="${cat}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin: 4px 0; background: var(--card-bg, rgba(255,255,255,0.05)); border-radius: 4px; border: 1px solid var(--border-color, #333);">
          <span class="category-name" style="color: var(--text-color, #fff); font-size: 14px;">${cat}</span>
          <div class="category-actions" style="display: flex; gap: 8px;">
            <button class="edit-category-btn" title="编辑" style="background: transparent; border: none; color: var(--text-color, #fff); cursor: pointer; padding: 4px; border-radius: 3px; font-size: 12px;">✏️</button>
            <button class="delete-category-btn" title="删除" style="background: transparent; border: none; color: #ff6b6b; cursor: pointer; padding: 4px; border-radius: 3px; font-size: 12px;">🗑️</button>
          </div>
        </div>
      `).join('');
    }
  }

  /**
   * 删除工作流备注
   * @param {string} filePath - 文件路径
   */
  deleteWorkflowNote(filePath) {
    // TODO: Stage8_CLEANUP - 这里依赖的window.dialogManager需要明确
    const dialogManager = window.dialogManager || window.nzDialogManager;
    if (!dialogManager) {
      console.error('DialogManager未找到');
      return;
    }

    dialogManager.showConfirm(
      '删除备注',
      '确定要删除这个工作流的备注吗？此操作不可撤销。'
    ).then(confirmed => {
      if (confirmed) {
        if (this.workflowNotesManager.deleteNote(filePath)) {
          this.refreshFileDisplay();
          
          // 更新浮动管理器显示
          const floatingManager = window.floatingWorkflowManager;
          if (floatingManager && floatingManager.currentWorkflow && 
              floatingManager.currentWorkflow.filePath === filePath) {
            floatingManager.updateWorkflowNoteDisplay();
          }
          
          this.uiManager.showNotification('备注已删除', 'success');
        } else {
          this.uiManager.showNotification('删除失败，备注不存在', 'error');
        }
      }
    });
  }
}

/**
 * 全局函数包装器 - 提供向后兼容性
 * TODO: Stage8_CLEANUP - 在模块化完成后这些全局函数可以被移除
 */

// 存储模块实例的全局变量
let workflowNoteEditorInstance = null;

/**
 * 设置模块实例
 * @param {WorkflowNoteEditor} instance - 模块实例
 */
export function setWorkflowNoteEditorInstance(instance) {
  workflowNoteEditorInstance = instance;
  
  // 为了向后兼容，将一些方法设置为全局可用
  window.openNoteEditor = (filePath) => {
    if (workflowNoteEditorInstance && workflowNoteEditorInstance.workflowNotesManager) {
      const existingNote = workflowNoteEditorInstance.workflowNotesManager.getNote(filePath);
      workflowNoteEditorInstance.openEditor(filePath, existingNote);
    }
  };
  
  window.deleteWorkflowNote = (filePath) => {
    if (workflowNoteEditorInstance) {
      workflowNoteEditorInstance.deleteWorkflowNote(filePath);
    }
  };
  
  // 设置为全局可用（向后兼容）
  window.WorkflowNoteEditor = {
    openEditor: (filePath, existingNote) => {
      if (workflowNoteEditorInstance) {
        workflowNoteEditorInstance.openEditor(filePath, existingNote);
      }
    },
    refreshFileDisplay: () => {
      if (workflowNoteEditorInstance) {
        workflowNoteEditorInstance.refreshFileDisplay();
      }
    }
  };
}
