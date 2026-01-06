// web/modules/features/notes-system.js
"use strict";

/**
 * 工作流备注系统模块
 * 负责管理工作流文件的备注数据，包括创建、读取、更新、删除等操作
 * 
 * 功能包括：
 * - 备注数据持久化存储
 * - 备注CRUD操作
 * - 标签和分类管理
 * - 与浮动管理器的集成
 */
export class WorkflowNotesManager {
  constructor(config) {
    this.config = config;
    this.pluginName = config.PLUGIN_NAME;
    
    console.log(`[${this.pluginName}] 工作流备注系统模块已初始化`);
  }
  
  /**
   * 从本地存储加载备注数据
   */
  loadNotes() {
    try {
      const saved = localStorage.getItem(this.config.getNotesStorageKey());
      if (saved) {
        const notes = JSON.parse(saved);
        this.config.setWorkflowNotes(notes);
        console.log(`[${this.pluginName}] 工作流备注已加载`);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] 加载工作流备注失败:`, error);
      this.config.setWorkflowNotes({});
    }
  }

  /**
   * 将备注数据保存到本地存储
   */
  saveNotes() {
    try {
      const notes = this.config.getWorkflowNotes();
      localStorage.setItem(this.config.getNotesStorageKey(), JSON.stringify(notes));
      console.log(`[${this.pluginName}] 工作流备注已保存`);
    } catch (error) {
      console.error(`[${this.pluginName}] 保存工作流备注失败:`, error);
    }
  }

  /**
   * 获取指定文件的备注
   * @param {string} filePath - 文件路径
   * @returns {Object|null} 备注对象或null
   */
  getNote(filePath) {
    const notes = this.config.getWorkflowNotes();
    return notes[filePath] || null;
  }

  /**
   * 检查指定文件是否有备注
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否有备注
   */
  hasNote(filePath) {
    const notes = this.config.getWorkflowNotes();
    return !!notes[filePath];
  }

  /**
   * 保存或更新文件备注
   * @param {string} filePath - 文件路径
   * @param {Object} noteData - 备注数据
   */
  saveNote(filePath, noteData) {
    const now = new Date().toLocaleDateString('zh-CN');
    const notes = this.config.getWorkflowNotes();
    notes[filePath] = {
      ...noteData,
      createTime: notes[filePath]?.createTime || now,
      updateTime: now
    };
    this.config.setWorkflowNotes(notes);
    this.saveNotes();
    
    // 更新浮动管理器显示
    this._updateFloatingManagerDisplay(filePath);
  }

  /**
   * 删除指定文件的备注
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否成功删除
   */
  deleteNote(filePath) {
    const notes = this.config.getWorkflowNotes();
    if (notes[filePath]) {
      delete notes[filePath];
      this.config.setWorkflowNotes(notes);
      this.saveNotes();
      
      // 更新浮动管理器显示
      this._updateFloatingManagerDisplay(filePath);
      
      return true;
    }
    return false;
  }

  /**
   * 获取所有备注数据
   * @returns {Object} 所有备注的副本
   */
  getAllNotes() {
    return { ...this.config.getWorkflowNotes() };
  }

  /**
   * 根据标签筛选备注
   * @param {string} tag - 标签名
   * @returns {Object} 包含指定标签的备注
   */
  getNotesWithTag(tag) {
    const result = {};
    const notes = this.config.getWorkflowNotes();
    for (const [filePath, note] of Object.entries(notes)) {
      if (note.tags && note.tags.includes(tag)) {
        result[filePath] = note;
      }
    }
    return result;
  }

  /**
   * 根据分类筛选备注
   * @param {string} category - 分类名
   * @returns {Object} 指定分类的备注
   */
  getNotesWithCategory(category) {
    const result = {};
    const notes = this.config.getWorkflowNotes();
    for (const [filePath, note] of Object.entries(notes)) {
      if (note.category === category) {
        result[filePath] = note;
      }
    }
    return result;
  }

  /**
   * 获取所有使用过的标签
   * @returns {string[]} 排序后的标签数组
   */
  getAllTags() {
    const tags = new Set();
    const notes = this.config.getWorkflowNotes();
    for (const note of Object.values(notes)) {
      if (note.tags) {
        note.tags.forEach(tag => tags.add(tag));
      }
    }
    return Array.from(tags).sort();
  }

  /**
   * 获取所有使用过的分类
   * @returns {string[]} 排序后的分类数组
   */
  getAllCategories() {
    const categories = new Set();
    const notes = this.config.getWorkflowNotes();
    for (const note of Object.values(notes)) {
      if (note.category) {
        categories.add(note.category);
      }
    }
    return Array.from(categories).sort();
  }

  /**
   * 私有方法：更新浮动管理器显示
   * @param {string} filePath - 文件路径
   * @private
   */
  _updateFloatingManagerDisplay(filePath) {
    const floatingManager = window.floatingWorkflowManager;
    if (floatingManager && floatingManager.currentWorkflow && 
        floatingManager.currentWorkflow.filePath === filePath) {
      floatingManager.updateWorkflowNoteDisplay();
    }
  }
}
