// web/modules/core/config.js
"use strict";

/**
 * 核心配置模块
 * 负责管理插件的基础配置、常量和全局状态
 * 
 * 功能包括：
 * - 插件基本信息常量
 * - Path工具函数
 * - 全局状态管理
 * - 默认目录管理
 */
export class Config {
  constructor() {
    // ====== 插件基本信息 ======
    this.PLUGIN_NAME = "NZWorkflowManager";
    this.PLUGIN_VERSION = "3.4.0";
    this.isRegistered = false;
    
    // ====== Path工具函数 ======
    this.path = {
      basename: (pathStr) => {
        return pathStr.split(/[/\\]/).pop();
      },
      join: (...paths) => {
        return paths.join('/').replace(/\/+/g, '/');
      },
      dirname: (pathStr) => {
        const parts = pathStr.split(/[/\\]/);
        parts.pop();
        return parts.join('/') || '/';
      },
      extname: (pathStr) => {
        const match = pathStr.match(/\.[^/.]+$/);
        return match ? match[0] : '';
      }
    };
    
    // ====== 全局状态管理 ======
    this.state = {
      defaultDirectory: "",
      currentPath: "",
      pathHistory: [],
      selectedItems: new Set(),
      lastSelectedItem: null,
      selectionMode: false
    };
    
    // ====== 工作流备注管理 ======
    this.notes = {
      workflowNotes: {},
      NOTES_STORAGE_KEY: 'nz_workflow_notes'
    };
    
    console.log(`[${this.PLUGIN_NAME}] 核心配置模块已初始化 v${this.PLUGIN_VERSION}`);
  }
  
  /**
   * 初始化默认目录
   * 从localStorage加载保存的默认目录设置
   */
  initializeDefaultDirectory() {
    try {
      // 从localStorage加载默认目录
      const savedDir = localStorage.getItem('nz_default_directory');
      if (savedDir) {
        this.state.defaultDirectory = savedDir;
        this.state.currentPath = savedDir;
        console.log(`[${this.PLUGIN_NAME}] 已加载默认目录: ${this.state.defaultDirectory}`);
      } else {
        console.log(`[${this.PLUGIN_NAME}] 未找到默认目录设置`);
      }
    } catch (error) {
      console.error(`[${this.PLUGIN_NAME}] 加载默认目录失败:`, error);
    }
  }
  
  /**
   * 获取当前路径
   */
  getCurrentPath() {
    return this.state.currentPath;
  }
  
  /**
   * 设置当前路径
   */
  setCurrentPath(path) {
    this.state.currentPath = path;
  }
  
  /**
   * 获取默认目录
   */
  getDefaultDirectory() {
    return this.state.defaultDirectory;
  }
  
  /**
   * 设置默认目录
   */
  setDefaultDirectory(dir) {
    this.state.defaultDirectory = dir;
    // 同时保存到localStorage
    try {
      localStorage.setItem('nz_default_directory', dir);
      console.log(`[${this.PLUGIN_NAME}] 默认目录已保存: ${dir}`);
    } catch (error) {
      console.error(`[${this.PLUGIN_NAME}] 保存默认目录失败:`, error);
    }
  }
  
  /**
   * 获取选中的项目
   */
  getSelectedItems() {
    return this.state.selectedItems;
  }
  
  /**
   * 设置选中的项目
   */
  setSelectedItems(items) {
    this.state.selectedItems = items;
  }
  
  /**
   * 获取路径历史
   */
  getPathHistory() {
    return this.state.pathHistory;
  }
  
  /**
   * 添加路径到历史记录
   */
  addToPathHistory(path) {
    if (this.state.pathHistory[this.state.pathHistory.length - 1] !== path) {
      this.state.pathHistory.push(path);
    }
  }
  
  /**
   * 从路径历史记录中弹出最后一个路径
   */
  popFromPathHistory() {
    return this.state.pathHistory.pop();
  }
  
  /**
   * 获取路径历史记录长度
   */
  getPathHistoryLength() {
    return this.state.pathHistory.length;
  }
  
  /**
   * 获取工作流备注
   */
  getWorkflowNotes() {
    return this.notes.workflowNotes;
  }
  
  /**
   * 设置工作流备注
   */
  setWorkflowNotes(notes) {
    this.notes.workflowNotes = notes;
  }
  
  /**
   * 获取备注存储键
   */
  getNotesStorageKey() {
    return this.notes.NOTES_STORAGE_KEY;
  }
  
  /**
   * 获取插件信息
   */
  getPluginInfo() {
    return {
      name: this.PLUGIN_NAME,
      version: this.PLUGIN_VERSION,
      isRegistered: this.isRegistered
    };
  }
  
  /**
   * 设置注册状态
   */
  setRegistered(status) {
    this.isRegistered = status;
  }
  
  /**
   * 创建全局协调接口
   * 为了让其他模块能够访问配置功能
   */
  createGlobalInterface(externalFunctions = {}) {
    window.nzWorkflowManager = {
      // 状态管理
      getCurrentPath: () => this.getCurrentPath(),
      setCurrentPath: (path) => this.setCurrentPath(path),
      getDefaultDirectory: () => this.getDefaultDirectory(),
      setDefaultDirectory: (dir) => this.setDefaultDirectory(dir),
      
      // 外部功能接口（由主文件提供）
      ...externalFunctions,
      
      // 插件信息
      pluginName: this.PLUGIN_NAME,
      version: this.PLUGIN_VERSION,
      
      // 配置模块引用
      config: this
    };
    
    console.log(`[${this.PLUGIN_NAME}] 全局协调接口已创建`);
  }
}

