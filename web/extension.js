// web/extension.js
"use strict";

// ====== ComfyUI扩展入口点 ======
// 注意：app对象在扩展加载时通过参数传入，不需要在此处导入

// ====== 模块导入 ======
import { SidebarRegistration } from './modules/core/sidebar-registration.js';
import { Config } from './modules/core/config.js';
import { ThemeSystem } from './modules/ui/theme-system.js';
import { UIManager } from './modules/ui/ui-manager.js';
import { WorkflowNotesManager } from './modules/features/notes-system.js';

// Stage5: 工作流管理模块
import { WorkflowManager } from './modules/features/workflow-manager.js';
import { WorkflowLoader } from './modules/features/workflow-loader.js';
import { WorkflowUI } from './modules/features/workflow-ui.js';
import { CommunicationAPI } from './modules/core/communication-api.js';

// Stage6: 交互系统模块
import interactionSystem from './modules/ui/interaction-system.js';

// Stage7: 浮动管理器模块
import { WorkflowState, FloatingWorkflowManager } from './modules/features/floating-manager.js';

// Stage8: 备注编辑器模块
import { WorkflowNoteEditor, setWorkflowNoteEditorInstance } from './modules/features/workflow-note-editor.js';

// Stage8: 自定义图标管理器模块
import { CustomIconManager, setCustomIconManagerInstance } from './modules/features/custom-icon-manager.js';

// Path模块已迁移到 modules/core/config.js
// 如需使用Path工具函数，请通过 config.path 访问

// ====== 常量定义 ======
const NOTES_STORAGE_KEY = 'nz_workflow_notes';

// ====== 全局变量 ======
// workflowNotes 已移至模块化配置管理
// currentPath 已移至模块化配置管理
// pathHistory 已移至模块化配置管理
let isThemeTransitioning = false;
let defaultDirectory = '';
let currentTheme = 'light';

// ====== 模块实例 ======
let config = null;
let themeSystem = null;
let uiManager = null;
let sidebarRegistration = null;
let workflowNotesManager = null;

// Stage5: 工作流模块实例
let workflowManager = null;
let workflowLoader = null;
let workflowUI = null;
let communicationAPI = null;

// Stage6: 交互系统模块实例
let interactionSystemInstance = null;

// Stage7: 浮动管理器模块实例
let floatingWorkflowManager = null;

// Stage8: 备注编辑器模块实例
let workflowNoteEditor = null;

// Stage8: 自定义图标管理器模块实例
let customIconManager = null;

// 全局工作流管理器协调接口已迁移到 modules/core/config.js
// 状态管理变量已迁移到 modules/core/config.js
// 主题管理变量已迁移到 modules/ui/theme-system.js
// 工作流备注管理变量已迁移到 modules/core/config.js

// 更新管理功能已移除 (v3.4.0) - 已备份到 privateserver-function/

// ====== 模块初始化 ======
function initializeModules(app) {
  try {
    // 1. 初始化配置模块
    if (!config) {
      config = new Config();
      console.log(`[${config.PLUGIN_NAME}] 配置模块已初始化`);
    }
    
    // 2. 初始化主题系统模块
    if (!themeSystem) {
      themeSystem = new ThemeSystem(config.PLUGIN_NAME);
      console.log(`[${config.PLUGIN_NAME}] 主题系统模块已初始化`);
    }
    
    // 3. 初始化UI管理器模块
    if (!uiManager) {
      uiManager = new UIManager(config.PLUGIN_NAME, config);
      console.log(`[${config.PLUGIN_NAME}] UI管理器模块已初始化`);
    }
    
    // 4. 初始化侧边栏注册模块
    if (!sidebarRegistration) {
      sidebarRegistration = new SidebarRegistration(config.PLUGIN_NAME, app);
      console.log(`[${config.PLUGIN_NAME}] 侧边栏注册模块已初始化`);
    }
    
    // 5. 初始化工作流备注系统模块
    if (!workflowNotesManager) {
      workflowNotesManager = new WorkflowNotesManager(config);
      console.log(`[${config.PLUGIN_NAME}] 工作流备注系统模块已初始化`);
    }
    
    // Stage5: 初始化工作流管理模块
    if (!communicationAPI) {
      communicationAPI = new CommunicationAPI(config.PLUGIN_NAME);
      console.log(`[${config.PLUGIN_NAME}] 通信API模块已初始化`);
    }
    
    if (!workflowLoader) {
      workflowLoader = new WorkflowLoader(config.PLUGIN_NAME);
      console.log(`[${config.PLUGIN_NAME}] 工作流加载器模块已初始化`);
    }
    
    if (!workflowUI) {
      workflowUI = new WorkflowUI(config.PLUGIN_NAME);
      console.log(`[${config.PLUGIN_NAME}] 工作流UI模块已初始化`);
    }
    
    if (!workflowManager) {
      workflowManager = new WorkflowManager(config.PLUGIN_NAME, config);
      console.log(`[${config.PLUGIN_NAME}] 工作流管理器模块已初始化`);
    }
    
    // Stage6: 初始化交互系统模块
    // 暴露CommunicationAPI类构造函数，确保交互系统可以访问
    window.CommunicationAPI = CommunicationAPI;
    console.log(`[${config.PLUGIN_NAME}] CommunicationAPI类已提前暴露到全局`);
    
    if (!interactionSystemInstance) {
      interactionSystemInstance = interactionSystem;
      interactionSystemInstance.initialize(config);
      console.log(`[${config.PLUGIN_NAME}] 交互系统模块已初始化`);
      
      // 暴露模块化的管理器实例，替换原有的老实例
      window.contextMenuManager = interactionSystemInstance.getContextMenuManager();
      window.dialogManager = interactionSystemInstance.getDialogManager();
      window.multiSelectManager = interactionSystemInstance.getMultiSelectManager();
      window.conflictDialogManager = interactionSystemInstance.getConflictResolutionDialogManager();
      window.dragDropManager = interactionSystemInstance.getDragDropManager();
      console.log(`[${config.PLUGIN_NAME}] 交互系统实例已暴露到全局`);
    }
    
    // Stage7: 初始化浮动管理器模块
    if (!floatingWorkflowManager) {
      floatingWorkflowManager = new FloatingWorkflowManager(config.PLUGIN_NAME, {
        config: config,
        workflowNotesManager: workflowNotesManager,
        uiManager: uiManager,
        WorkflowNoteEditor: window.WorkflowNoteEditor
      });
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器模块已初始化`);
      
      // 暴露到全局，保持兼容性
      window.floatingWorkflowManager = floatingWorkflowManager;
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器实例已暴露到全局`);
    }
    
    // 6. 创建全局协调接口
    // ✅ Stage4已完成：UI相关函数已模块化
    // ✅ Stage5已完成：工作流相关函数已模块化
    // TODO: Stage9_CLEANUP - 浮动管理器函数已模块化，待清理全局接口
    // 临时方案：通过全局接口暴露，保持功能可用性
    config.createGlobalInterface({
      // ✅ Stage5已完成：工作流目录加载已迁移到 modules/features/workflow-manager.js
      loadDirectory: (path) => workflowManager.loadDirectory(path),
      loadDirectoryWithoutHistory: (path) => workflowManager.loadDirectoryWithoutHistory(path),
      loadWorkflow: (filePath) => workflowLoader.loadWorkflow(filePath),
      loadWorkflowFile: (filePath) => workflowLoader.loadWorkflowFile(filePath),
      // ✅ Stage4已完成：UI事件监听器已迁移到 modules/ui/ui-manager.js
      initializeUIEventListeners: () => uiManager.initializeUIEventListeners(),
      // ✅ Stage7已完成：浮动管理器已迁移到 modules/features/floating-manager.js
      toggleFloatingManager: () => toggleFloatingManager(),
      // ✅ Stage5已完成：UI显示功能已迁移到工作流UI模块
      displayNoDirectoryMessage: () => workflowUI.displayNoDirectoryMessage(),
      updateBackButtonState: () => workflowUI.updateBackButtonState(config.getPathHistory()),
      displayError: (message) => workflowUI.displayError(message),
      displaySuccess: (message) => workflowUI.displaySuccess(message),
      // ✅ Stage4已完成：通知显示已迁移到 modules/ui/ui-manager.js
      showNotification: (message, type, duration) => uiManager.showNotification(message, type, duration),
      // ✅ Stage5已完成：路径相关功能
      getCurrentPath: () => config.getCurrentPath(),
      goBack: () => workflowManager.goBack(),
      refreshCurrentDirectory: () => workflowManager.refreshCurrentDirectory(),
      // ✅ Stage4已完成：交互系统模块化
      interactionSystem: interactionSystemInstance
    });
    
    // 7. 初始化各模块功能
    config.initializeDefaultDirectory();
    themeSystem.initializeDefaultSettings();
    themeSystem.initializeTheme();
    
    // 8. 初始化备注编辑器模块
    if (!workflowNoteEditor) {
      workflowNoteEditor = new WorkflowNoteEditor(config, workflowNotesManager, uiManager);
      setWorkflowNoteEditorInstance(workflowNoteEditor);
      console.log(`[${config.PLUGIN_NAME}] 备注编辑器模块已初始化`);
    }
    
    // 8.1 初始化自定义图标管理器模块
    if (!customIconManager) {
      customIconManager = new CustomIconManager(config, uiManager);
      setCustomIconManagerInstance(customIconManager);
      console.log(`[${config.PLUGIN_NAME}] 自定义图标管理器模块已初始化`);
    }
    
    // 9. 加载工作流备注
    workflowNotesManager.loadNotes();
    
    // 9. 设置全局模块访问对象（Stage5: 工作流模块间通信）
    window.nzWorkflowManager = window.nzWorkflowManager || {};
    window.nzWorkflowManager.config = config;
    window.nzWorkflowManager.workflowManager = workflowManager;
    window.nzWorkflowManager.workflowLoader = workflowLoader;
    window.nzWorkflowManager.dialogManager = window.dialogManager; // 确保模块化代码可以访问dialogManager
    window.nzWorkflowManager.workflowUI = workflowUI;
    window.nzWorkflowManager.communicationAPI = communicationAPI;
    window.nzWorkflowManager.uiManager = uiManager; // 暴露UI管理器
    
    // 直接暴露CommunicationAPI到全局，供交互系统使用
    window.communicationAPI = communicationAPI;
    console.log(`[${config.PLUGIN_NAME}] CommunicationAPI已暴露到全局: window.communicationAPI`);
    
    // Stage6: 暴露交互系统模块
    window.nzWorkflowManager.interactionSystem = interactionSystemInstance;
    window.nzWorkflowManager.showNotification = (message, type, duration) => uiManager.showNotification(message, type, duration);
    window.nzWorkflowManager.getCurrentPath = () => config.getCurrentPath();
    window.nzWorkflowManager.loadDirectory = (path) => workflowManager.loadDirectory(path);
    window.nzWorkflowManager.loadWorkflow = (filePath) => workflowLoader.loadWorkflow(filePath);
    
    // 暴露路径刷新方法，用于解决移动操作后的路径同步问题
    window.nzWorkflowManager.refreshAllPathAttributes = () => {
      if (interactionSystem && interactionSystem.refreshAllPathAttributes) {
        return interactionSystem.refreshAllPathAttributes.call(interactionSystem);
      }
    };
    window.nzWorkflowManager.clearDragState = () => {
      if (interactionSystem && interactionSystem.clearDragState) {
        return interactionSystem.clearDragState.call(interactionSystem);
      }
    };
    
    // 暴露其他管理器和功能函数
    window.nzWorkflowManager.workflowNotesManager = workflowNotesManager;
    // CustomIconManager 在下面类定义后进行暴露
    window.nzWorkflowManager.openNoteEditor = (filePath) => openNoteEditor(filePath);
    window.nzWorkflowManager.deleteWorkflowNote = (filePath) => deleteWorkflowNote(filePath);
    
    // 确保CustomIconManager正确暴露的延迟检查函数
    window.nzWorkflowManager.ensureCustomIconManager = () => {
      if (!window.nzWorkflowManager.CustomIconManager && window.CustomIconManager) {
        window.nzWorkflowManager.CustomIconManager = window.CustomIconManager;
        console.log('[NZWorkflowManager] CustomIconManager已延迟暴露');
      }
      return window.nzWorkflowManager.CustomIconManager;
    };
    
    // 10. 同步全局变量（临时过渡方案）
    // ✅ Stage4已完成：UI模块化完成
    // ✅ Stage5已完成：工作流管理模块化完成
    // TODO: Stage9_CLEANUP - 浮动管理器已模块化，待清理全局变量依赖
    // 当前方案：保持向后兼容，为代码清理阶段做准备
    defaultDirectory = config.getDefaultDirectory() || '';
    // currentPath 现在直接从配置获取，无需同步到全局变量
    currentTheme = themeSystem.getCurrentTheme() || 'light';
    
    console.log(`[${config.PLUGIN_NAME}] 所有模块初始化完成 v${config.PLUGIN_VERSION}`);
    
    return true;
          } catch (error) {
    console.error(`模块初始化失败:`, error);
    return false;
  }
}

// initializeDefaultDirectory() 函数已迁移到 modules/core/config.js
// 如需调用，请使用: config.initializeDefaultDirectory()

// detectBackgroundImagePath() 和 applyBackgroundImage() 函数已迁移到 modules/ui/theme-system.js
// 如需调用，请使用: themeSystem.detectBackgroundImagePath() 和 themeSystem.applyBackgroundImage()

// initializeTheme() 函数已迁移到 modules/ui/theme-system.js
// 如需调用，请使用: themeSystem.initializeTheme()

// initializeDefaultSettings() 函数已迁移到 modules/ui/theme-system.js
// 如需调用，请使用: themeSystem.initializeDefaultSettings()

// initializeWorkflowNotes() 函数已迁移到 modules/core/config.js
// 工作流备注相关功能已集成到配置模块中

// ====== 工作流备注管理函数 ======
class WorkflowCategoriesManager {
  static getStorageKey() {
    return 'nz_workflow_categories';
  }
  
  static getDefaultCategories() {
    return [
      '人像处理',
      '风景生成', 
      '图像修复',
      '动漫风格',
      '特效处理',
      '实验性'
    ];
  }
  
  static getCategories() {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const categories = JSON.parse(stored);
        return Array.isArray(categories) ? categories : this.getDefaultCategories();
      }
    } catch (e) {
      console.error('读取分类数据失败:', e);
    }
    return this.getDefaultCategories();
  }
  
  static saveCategories(categories) {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(categories));
      return true;
    } catch (e) {
      console.error('保存分类数据失败:', e);
      return false;
    }
  }
  
  static addCategory(name) {
    if (!name || name.trim() === '') return false;
    
    const categories = this.getCategories();
    const trimmedName = name.trim();
    
    if (categories.includes(trimmedName)) {
      return false; // 分类已存在
    }
    
    categories.push(trimmedName);
    return this.saveCategories(categories);
  }
  
  static removeCategory(name) {
    const categories = this.getCategories();
    const filtered = categories.filter(cat => cat !== name);
    return this.saveCategories(filtered);
  }
  
  static renameCategory(oldName, newName) {
    if (!newName || newName.trim() === '') return false;
    
    const categories = this.getCategories();
    const index = categories.indexOf(oldName);
    
    if (index === -1) return false;
    
    const trimmedNewName = newName.trim();
    if (categories.includes(trimmedNewName) && trimmedNewName !== oldName) {
      return false; // 新名称已存在
    }
    
    categories[index] = trimmedNewName;
    return this.saveCategories(categories);
  }
}

// WorkflowNotesManager 类已迁移到 modules/features/notes-system.js
// 如需调用，请使用: workflowNotesManager.methodName()

// ====== 检测ComfyUI主题 ======
let lastThemeDetectionTime = 0;
let lastDetectedTheme = null;

// detectComfyUITheme() 函数已迁移到 modules/ui/theme-system.js
// 如需调用，请使用: themeSystem.detectComfyUITheme()

// ====== 保存默认目录 ======
function saveDefaultDirectory(path) {
  try {
    defaultDirectory = path;
    config.setCurrentPath(path);
    localStorage.setItem('nz_default_directory', path);
    console.log(`[${config.PLUGIN_NAME}] 已保存默认目录: ${path}`);
    
    // 重新创建界面以更新UI
    const container = document.querySelector('.nz-manager').parentElement;
    if (container && uiManager) {
      // 使用UI管理器的模块化方法
      uiManager.createManagerInterface(container);
      uiManager.initializeUIEventListeners();
      
      // 加载新设置的目录
      setTimeout(() => {
        loadDirectory(path);
      }, 100);
    }
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 保存默认目录失败:`, error);
  }
}

// ====== 应用主题 ======
function applyTheme(theme) {
  if (isThemeTransitioning) {
    console.log(`[${config.PLUGIN_NAME}] 主题切换中，跳过重复操作`);
    return;
  }
  
  try {
    isThemeTransitioning = true;
    console.log(`[${config.PLUGIN_NAME}] 应用主题: ${theme}`);
    
    // 1. 应用主题到主界面管理器
    const manager = document.querySelector('.nz-manager');
    if (manager) {
      // 移除现有主题类
      manager.classList.remove('nz-theme-light', 'nz-theme-dark');
      // 添加新主题类
      manager.classList.add(`nz-theme-${theme}`);
      // 添加主题切换动画
      manager.classList.add('nz-theme-transition');
      
      // 移除动画类
      setTimeout(() => {
        if (manager) {
          manager.classList.remove('nz-theme-transition');
        }
      }, 300);
      
      console.log(`[${config.PLUGIN_NAME}] 主界面管理器主题应用完成: ${theme}`);
    }
    
    // 2. 应用主题到浮动管理器
    const floatingManager = document.querySelector('.nz-floating-manager');
    if (floatingManager) {
      // 移除现有主题类
      floatingManager.classList.remove('nz-theme-light', 'nz-theme-dark');
      // 添加新主题类
      floatingManager.classList.add(`nz-theme-${theme}`);
      // 添加主题切换动画
      floatingManager.classList.add('nz-theme-transition');
      
      // 移除动画类
      setTimeout(() => {
        if (floatingManager) {
          floatingManager.classList.remove('nz-theme-transition');
        }
      }, 300);
      
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器主题应用完成: ${theme}`);
    }
    

    
    // 4. 保存主题设置
    localStorage.setItem('nz_theme', theme);
    currentTheme = theme;
    
    // 5. 通知浮动管理器实例进行主题同步（如果存在）
    try {
      // ✅ Stage7: 使用模块化的浮动管理器实例
      if (floatingWorkflowManager && floatingWorkflowManager.syncTheme) {
        floatingWorkflowManager.syncTheme(theme);
      } else if (window.floatingWorkflowManager && window.floatingWorkflowManager.syncTheme) {
        window.floatingWorkflowManager.syncTheme(theme);
      }
    } catch (error) {
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器主题同步失败: ${error.message || '初始化顺序问题'}`);
    }
    
    // 重置状态
    setTimeout(() => {
      isThemeTransitioning = false;
    }, 300);
    
    console.log(`[${config.PLUGIN_NAME}] 主题应用完成: ${theme}`);
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 应用主题失败:`, error);
    isThemeTransitioning = false;
  }
}





// ====== 保存主题设置 ======
function saveTheme(theme) {
  try {
    localStorage.setItem('nz_theme', theme);
    console.log(`[${config.PLUGIN_NAME}] 主题设置已保存: ${theme}`);
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 保存主题设置失败:`, error);
  }
}

// ====== 设置主题变化监听器 ======
function setupThemeChangeListener() {
  try {
    // 1. 监听DOM变化（CSS变量、类名、样式等）
    const observer = new MutationObserver((mutations) => {
      let shouldCheckTheme = false;
      
      mutations.forEach((mutation) => {
        // 监听新添加的主题按钮
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 检查新添加的按钮是否为主题按钮
              const buttons = node.querySelectorAll ? node.querySelectorAll('button') : [];
              buttons.forEach(button => {
                if (isThemeButton(button)) {
                  addThemeButtonListener(button);
                }
              });
            }
          });
        }
        
        // 监听属性变化（style、class等）
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          const attributeName = mutation.attributeName;
          
          // 监听html/body的class和style变化
          if ((target === document.documentElement || target === document.body) && 
              (attributeName === 'class' || attributeName === 'style')) {
            shouldCheckTheme = true;
          }
        }
      });
      
      // 如果检测到可能的主题变化，延迟检查主题
      if (shouldCheckTheme) {
        clearTimeout(window.nzThemeCheckTimeout);
        window.nzThemeCheckTimeout = setTimeout(() => {
          const newTheme = themeSystem.detectComfyUITheme(true); // 强制检测
          if (newTheme && newTheme !== currentTheme) {
            console.log(`[${config.PLUGIN_NAME}] 通过DOM变化检测到主题变化: ${currentTheme} -> ${newTheme}`);
            applyTheme(newTheme);
          }
        }, 100); // 减少延迟到100ms
      }
    });
    
    // 观察DOM变化，包括属性变化
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'] // 只监听关键属性
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    // 2. 监听ComfyUI官方主题按钮点击
    setupComfyUIThemeButtonListener();
    
    // 3. 添加CSS变量变化监听器（使用轮询方式，但频率很低）
    setupCSSVariableMonitor();
    
    console.log(`[${config.PLUGIN_NAME}] 增强主题变化监听器已设置`);
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 设置主题变化监听器失败:`, error);
  }
}

// ====== 判断是否为主题按钮 ======
function isThemeButton(button) {
  const buttonText = button.textContent || button.innerText || '';
  const buttonTitle = button.title || '';
  const buttonClasses = button.className || '';
  
  // 检查按钮文本或标题中是否包含主题相关关键词
  const themeKeywords = ['深色', '浅色', 'Dark', 'Light', '主题', 'Theme', '🌙', '☀️'];
  
  return themeKeywords.some(keyword => 
    buttonText.includes(keyword) || 
    buttonTitle.includes(keyword) || 
    buttonClasses.includes(keyword.toLowerCase())
  );
}

// ====== 添加主题按钮监听器 ======
function addThemeButtonListener(button) {
  if (button.hasAttribute('data-nz-theme-listener')) {
    return; // 已经添加过监听器
  }
  
  button.setAttribute('data-nz-theme-listener', 'true');
  
  button.addEventListener('click', () => {
    console.log(`[${config.PLUGIN_NAME}] 检测到ComfyUI主题按钮点击`);
    
    // 减少延迟，立即强制检测主题变化
    clearTimeout(window.nzThemeButtonTimeout);
    window.nzThemeButtonTimeout = setTimeout(() => {
      const newTheme = themeSystem.detectComfyUITheme(true); // 强制检测
      if (newTheme && newTheme !== currentTheme) {
        console.log(`[${config.PLUGIN_NAME}] 主题按钮点击后检测到主题变化: ${currentTheme} -> ${newTheme}`);
        applyTheme(newTheme);
      }
    }, 100); // 减少延迟到100ms
  });
  
  console.log(`[${config.PLUGIN_NAME}] 已为主题按钮添加监听器:`, button);
}

// ====== CSS变量监听器 ======
let cssVariableMonitorInterval = null;
let lastCSSVariableValues = {};

function setupCSSVariableMonitor() {
  try {
    // 清除现有监听器
    if (cssVariableMonitorInterval) {
      clearInterval(cssVariableMonitorInterval);
    }
    
    // 初始化CSS变量值
    updateCSSVariableCache();
    
    // 设置低频率监听器（每5秒检查一次，进一步降低频率）
    cssVariableMonitorInterval = setInterval(() => {
      try {
        const hasChanged = checkCSSVariableChanges();
        if (hasChanged) {
          console.log(`[${config.PLUGIN_NAME}] 检测到CSS变量变化，触发主题检测`);
          const newTheme = themeSystem.detectComfyUITheme(true);
          if (newTheme && newTheme !== currentTheme) {
            console.log(`[${config.PLUGIN_NAME}] 通过CSS变量变化检测到主题变化: ${currentTheme} -> ${newTheme}`);
            applyTheme(newTheme);
          }
          updateCSSVariableCache(); // 更新缓存
        }
      } catch (error) {
        console.warn(`[${config.PLUGIN_NAME}] CSS变量监听器检查失败:`, error);
      }
    }, 5000); // 改为5秒检查一次，进一步降低频率
    
    console.log(`[${config.PLUGIN_NAME}] CSS变量监听器已启动`);
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 设置CSS变量监听器失败:`, error);
  }
}

function updateCSSVariableCache() {
  try {
    const computedStyle = getComputedStyle(document.documentElement);
    const themeVariables = ['--comfy-menu-bg', '--comfy-input-bg', '--bg-color'];
    
    lastCSSVariableValues = {};
    themeVariables.forEach(variable => {
      const value = computedStyle.getPropertyValue(variable).trim();
      if (value) {
        lastCSSVariableValues[variable] = value;
      }
    });
  } catch (error) {
    console.warn(`[${config.PLUGIN_NAME}] 更新CSS变量缓存失败:`, error);
  }
}

function checkCSSVariableChanges() {
  try {
    const computedStyle = getComputedStyle(document.documentElement);
    const themeVariables = ['--comfy-menu-bg', '--comfy-input-bg', '--bg-color'];
    
    for (const variable of themeVariables) {
      const currentValue = computedStyle.getPropertyValue(variable).trim();
      const lastValue = lastCSSVariableValues[variable];
      
      if (currentValue && currentValue !== lastValue) {
        return true; // 发现变化
      }
    }
    return false;
  } catch (error) {
    console.warn(`[${config.PLUGIN_NAME}] 检查CSS变量变化失败:`, error);
    return false;
  }
}

// 清理函数
function cleanupThemeMonitors() {
  if (cssVariableMonitorInterval) {
    clearInterval(cssVariableMonitorInterval);
    cssVariableMonitorInterval = null;
  }
  if (window.nzThemeCheckTimeout) {
    clearTimeout(window.nzThemeCheckTimeout);
  }
  if (window.nzThemeButtonTimeout) {
    clearTimeout(window.nzThemeButtonTimeout);
  }
}

// ====== 设置ComfyUI主题按钮监听器 ======
function setupComfyUIThemeButtonListener() {
  try {
    // 查找现有的主题按钮
    const allButtons = document.querySelectorAll('button');
    let themeButtonFound = false;
    
    allButtons.forEach(button => {
      if (isThemeButton(button)) {
        addThemeButtonListener(button);
        themeButtonFound = true;
      }
    });
    
    if (themeButtonFound) {
      console.log(`[${config.PLUGIN_NAME}] 已找到并监听ComfyUI主题按钮`);
    } else {
      console.log(`[${config.PLUGIN_NAME}] 暂未找到ComfyUI主题按钮，将在DOM变化时继续查找`);
    }
    
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 设置ComfyUI主题按钮监听器失败:`, error);
  }
}

// ====== CSS变量监听器已移除 ======
// 不再自动监听CSS变量变化，只在用户点击ComfyUI菜单中的主题按钮时触发主题检测
// 这样可以避免无用的轮询检测，减少性能消耗和控制台日志噪音







// ====== 侧边栏相关函数已迁移到模块 ======
// createWorkflowManagerTab() -> modules/core/sidebar-registration.js
// createTraditionalButton() -> modules/core/sidebar-registration.js
// createManagerInterface() -> modules/core/sidebar-registration.js

// createManagerInterface() 函数已迁移到 modules/core/sidebar-registration.js

// ====== 设置面板函数 ======
function showSettingsPanel() {
  const settingsPanel = document.getElementById('nz-settings-panel');
  const mainContent = document.getElementById('nz-content');
  
  if (settingsPanel && mainContent) {
    console.log(`[${config.PLUGIN_NAME}] 显示设置面板`);
    mainContent.style.display = 'none';
    settingsPanel.style.display = 'flex';
  }
}

function hideSettingsPanel() {
  const settingsPanel = document.getElementById('nz-settings-panel');
  const mainContent = document.getElementById('nz-content');
  
  if (settingsPanel && mainContent) {
    console.log(`[${config.PLUGIN_NAME}] 隐藏设置面板`);
    settingsPanel.style.display = 'none';
    mainContent.style.display = 'block';
  }
}

// ====== 添加管理器样式 ======
// addManagerStyles() 函数保留用于浮动管理器样式支持
// ✅ Stage4已完成：UI管理器已模块化，此函数将在Stage5一起处理
// TODO: Stage5 - 将此函数迁移到 modules/features/floating-manager.js
function addManagerStyles() {
  const style = document.createElement('style');
  style.id = 'nz-floating-manager-styles';
  style.textContent = `
    /* ====== NZ Workflow Manager Styles v3.4.0 - Project Reorganization ====== */
    /* ====== 主题变量定义 ====== */
    :root {
      /* 亮色主题 */
      --nz-light-bg: rgba(245, 247, 250, 0.95);
      --nz-light-border: rgba(200, 210, 230, 0.3);
      --nz-light-shadow: rgba(0, 0, 0, 0.1);
      --nz-light-text: #2c3e50;
      --nz-light-text-secondary: #5a6c7d;
      --nz-light-accent: #3498db;
      --nz-light-accent-hover: #2980b9;
      
      /* 暗色主题 */
      --nz-dark-bg: rgba(25, 30, 40, 0.95);
      --nz-dark-border: rgba(100, 120, 180, 0.3);
      --nz-dark-shadow: rgba(0, 0, 0, 0.3);
      --nz-dark-text: #e0f0ff;
      --nz-dark-text-secondary: #b0c0d0;
      --nz-dark-accent: #6bb6ff;
      --nz-dark-accent-hover: #4a9eff;
      
      /* 主题切换动画 */
      --nz-transition-duration: 0.3s;
      --nz-transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* 主题切换动画 */
    .nz-manager,
    .nz-header,
    .nz-toolbar-btn,
    .nz-path-display,
    .nz-content,
    .nz-status-bar,
    .nz-default-dir-footer,
    .nz-main-warning,
    .nz-floating-warning,
    .nz-path-drag-overlay {
      transition: all var(--nz-transition-duration) var(--nz-transition-timing);
    }
    
    /* 强制移除所有文件项边框 - 最高优先级 */
    .nz-manager .nz-file-item,
    .nz-manager .file-item,
    .nz-workflow-manager .nz-file-item,
    .nz-workflow-manager .file-item,
    .nz-floating-manager .nz-file-item,
    .nz-floating-manager .file-item {
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }
    
    /* 亮色主题样式 */
    .nz-manager.nz-theme-light {
      background: var(--nz-light-bg);
      color: var(--nz-light-text);
      box-shadow: 0 4px 20px var(--nz-light-shadow);
    }
    
                .nz-manager.nz-theme-light .nz-header {
              background:
                linear-gradient(135deg, rgba(52, 152, 219, 0.15), rgba(41, 128, 185, 0.08)),
                url('bg.jpg');
              background-size: 100% 100%, cover;
              background-position: 0 0, right top;
              background-repeat: no-repeat, no-repeat;
      border: 1px solid var(--nz-light-border);
      box-shadow: 0 4px 12px var(--nz-light-shadow);
    }
    
    .nz-manager.nz-theme-light .nz-header h2 {
      background: linear-gradient(135deg, #3498db, #2980b9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .nz-manager.nz-theme-light .nz-toolbar-btn {
      background: rgba(52, 152, 219, 0.1);
      border: 1px solid var(--nz-light-border);
      color: var(--nz-light-text);
    }
    
    .nz-manager.nz-theme-light .nz-toolbar-btn:hover {
      background: rgba(52, 152, 219, 0.2);
      border-color: var(--nz-light-accent);
      box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
    }
    
    .nz-manager.nz-theme-light .nz-path-display {
      background: linear-gradient(135deg, rgba(60, 80, 100, 0.4), rgba(50, 70, 90, 0.2));
      border: 1px solid var(--nz-light-border);
      color: var(--nz-light-text);
    }
    
    .nz-manager.nz-theme-light .nz-status-bar {
      background: rgba(52, 152, 219, 0.02);
      border-top: none !important;
      color: rgba(100, 120, 140, 0.6);
    }
    
    .nz-manager.nz-theme-light .nz-default-dir-footer {
      background: rgba(52, 152, 219, 0.05);
      border-top: 1px solid var(--nz-light-border);
      color: var(--nz-light-text-secondary);
    }
    
    /* 暗色主题样式 */
    .nz-manager.nz-theme-dark {
      background: var(--nz-dark-bg);
      color: var(--nz-dark-text);
      box-shadow: 0 4px 20px var(--nz-dark-shadow);
    }
    
                .nz-manager.nz-theme-dark .nz-header {
              background:
                linear-gradient(135deg, rgba(107, 182, 255, 0.15), rgba(74, 158, 255, 0.08)),
                url('bg.jpg');
              background-size: 100% 100%, cover;
              background-position: 0 0, right top;
              background-repeat: no-repeat, no-repeat;
      border: 1px solid var(--nz-dark-border);
      box-shadow: 0 4px 12px var(--nz-dark-shadow);
    }
    
    .nz-manager.nz-theme-dark .nz-header h2 {
      background: linear-gradient(135deg, #6bb6ff, #4a9eff);
      -webkit-background-clip: text;
      background-clip: text;
    }
    
    .nz-manager.nz-theme-dark .nz-toolbar-btn {
      background: rgba(107, 182, 255, 0.1);
      border: 1px solid var(--nz-dark-border);
      color: var(--nz-dark-text);
    }
    
    .nz-manager.nz-theme-dark .nz-toolbar-btn:hover {
      background: rgba(107, 182, 255, 0.2);
      border-color: var(--nz-dark-accent);
      box-shadow: 0 2px 8px rgba(107, 182, 255, 0.2);
    }
    
    .nz-manager.nz-theme-dark .nz-path-display {
      background: linear-gradient(135deg, rgba(60, 80, 100, 0.4), rgba(50, 70, 90, 0.2));
      border: 1px solid var(--nz-dark-border);
      color: var(--nz-dark-text);
    }
    
    .nz-manager.nz-theme-dark .nz-status-bar {
      background: rgba(107, 182, 255, 0.02);
      border-top: none !important;
      color: rgba(160, 180, 200, 0.5);
    }
    
    .nz-manager.nz-theme-dark .nz-default-dir-footer {
      background: rgba(107, 182, 255, 0.05);
      border-top: 1px solid var(--nz-dark-border);
      color: var(--nz-dark-text-secondary);
    }
    

    
    /* 主题切换动画效果 */
    .nz-theme-transition {
      animation: nz-theme-change 0.3s ease;
    }
    
    @keyframes nz-theme-change {
      0% {
        opacity: 0.8;
        transform: scale(0.98);
      }
      50% {
        opacity: 0.9;
        transform: scale(1.02);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    

    
    .nz-manager {
      padding: 15px;
      background: var(--comfy-menu-bg, rgba(25, 30, 40, 0.9));
      border-radius: 8px;
      color: var(--fg-color, #e0f0ff);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .nz-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 16px 20px 12px 20px;
                    background:
                linear-gradient(135deg, rgba(107, 182, 255, 0.15), rgba(74, 158, 255, 0.08)),
                url('bg.jpg');
              background-size: 100% 100%, cover;
              background-position: 0 0, right top;
              background-repeat: no-repeat, no-repeat;
      border: 1px solid rgba(107, 182, 255, 0.2);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      position: relative;
    }
    
    .nz-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(42, 42, 42, 0.7);
      border-radius: 12px;
      z-index: 1;
    }
    
    .nz-header > * {
      position: relative;
      z-index: 2;
    }
    
    .nz-header-icon {
      font-size: 28px;
      margin-right: 12px;
      color: #FFD700;
      text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
      animation: starGlow 2s ease-in-out infinite;
    }
    
    .nz-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .nz-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .nz-header h2 {
      margin: 0;
      background: linear-gradient(135deg, #6bb6ff, #4a9eff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
      font-size: 20px;
      letter-spacing: 0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .nz-header-settings-btn {
      background: rgba(102, 126, 234, 0.1);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 6px;
      color: #6bb6ff;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      backdrop-filter: blur(5px);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }
    
    .nz-header-settings-btn:hover {
      background: rgba(102, 126, 234, 0.2);
      border-color: rgba(102, 126, 234, 0.5);
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    .nz-header-settings-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
    }
    
    .nz-header-settings-btn i {
      font-size: 16px;
    }
    
    /* 重要信息按钮样式 */
    .nz-header-info-btn {
      background: rgba(234, 84, 85, 0.1);
      border: 1px solid rgba(234, 84, 85, 0.3);
      border-radius: 6px;
      color: #ff6b6b;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      backdrop-filter: blur(5px);
      box-shadow: 0 2px 8px rgba(234, 84, 85, 0.2);
      margin-right: 8px;
    }
    
    .nz-header-info-btn:hover {
      background: rgba(234, 84, 85, 0.2);
      border-color: rgba(234, 84, 85, 0.5);
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(234, 84, 85, 0.3);
    }
    
    .nz-header-info-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(234, 84, 85, 0.3);
    }
    
    .nz-header-info-btn i {
      font-size: 16px;
    }
    
    /* 主界面警告提示样式 */
    .nz-main-warning {
      background: rgba(234, 84, 85, 0.1);
      border: 1px solid rgba(234, 84, 85, 0.3);
      border-radius: 8px;
      margin-bottom: 15px;
      padding: 12px 16px;
      backdrop-filter: blur(5px);
    }
    
    .nz-warning-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .nz-warning-icon {
      color: #ff6b6b;
      font-size: 18px;
      flex-shrink: 0;
    }
    
    .nz-warning-text {
      color: #e0e0e0;
      font-size: 13px;
      line-height: 1.4;
      flex-grow: 1;
    }
    
    /* 浮动管理器警告提示样式 */
    .nz-floating-warning {
      background: rgba(234, 84, 85, 0.1);
      border-bottom: 1px solid rgba(234, 84, 85, 0.3);
      padding: 8px 12px;
    }
    
    .nz-floating-warning-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    
    .nz-floating-warning-text {
      color: #e0e0e0;
      font-size: 12px;
      line-height: 1.3;
      flex-grow: 1;
    }
    
    .nz-floating-warning-close {
      background: none;
      border: none;
      color: #ff6b6b;
      cursor: pointer;
      padding: 2px;
      border-radius: 3px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    
    .nz-floating-warning-close:hover {
      background: rgba(234, 84, 85, 0.2);
      color: #ffffff;
    }
    
    .nz-floating-warning-close i {
      font-size: 12px;
    }
    
    /* 主题适配 - 亮色主题下的警告样式 */
    .nz-manager.nz-theme-light .nz-main-warning {
      background: rgba(231, 76, 60, 0.08);
      border-color: rgba(231, 76, 60, 0.2);
    }
    
    .nz-manager.nz-theme-light .nz-warning-icon {
      color: #e74c3c;
    }
    
    .nz-manager.nz-theme-light .nz-warning-text {
      color: #2c3e50;
    }
    
    .nz-manager.nz-theme-light .nz-header-info-btn {
      background: rgba(231, 76, 60, 0.08);
      border-color: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
    }
    
    .nz-manager.nz-theme-light .nz-header-info-btn:hover {
      background: rgba(231, 76, 60, 0.15);
      border-color: rgba(231, 76, 60, 0.4);
      color: #c0392b;
    }
    
    /* 浮动管理器主题适配 */
    .nz-floating-manager.nz-theme-light .nz-floating-warning {
      background: rgba(231, 76, 60, 0.08);
      border-color: rgba(231, 76, 60, 0.2);
    }
    
    .nz-floating-manager.nz-theme-light .nz-floating-warning-text {
      color: #2c3e50;
    }
    
    .nz-floating-manager.nz-theme-light .nz-floating-warning-close {
      color: #e74c3c;
    }
    
    .nz-floating-manager.nz-theme-light .nz-floating-warning-close:hover {
      background: rgba(231, 76, 60, 0.15);
      color: #c0392b;
    }
    
    @keyframes starGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    
    .nz-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      gap: 20px;
    }
    
    .nz-toolbar-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .nz-toolbar-controls {
      display: flex;
      gap: 8px;
    }
    
    .nz-default-dir-footer {
      padding: 6px 12px;
      text-align: center;
      border-top: 1px solid rgba(100, 120, 180, 0.1);
      background: rgba(40, 50, 60, 0.2);
    }
    
    .nz-default-dir-footer span {
      font-size: 10px;
      color: #505060;
      opacity: 0.7;
      word-break: break-all;
    }
    
    .nz-floating-btn-highlight {
      background: linear-gradient(135deg, rgba(107, 182, 255, 0.2), rgba(74, 158, 255, 0.1)) !important;
      border: 1px solid rgba(107, 182, 255, 0.4) !important;
      box-shadow: 0 2px 8px rgba(107, 182, 255, 0.2);
    }
    
    .nz-floating-btn-highlight:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(107, 182, 255, 0.3), rgba(74, 158, 255, 0.2)) !important;
      border-color: rgba(107, 182, 255, 0.6) !important;
      box-shadow: 0 4px 12px rgba(107, 182, 255, 0.3);
      transform: translateY(-1px);
    }
    
    /* 多选容器 */
    .nz-multi-select-container {
      position: relative;
      display: inline-block;
    }
    
    /* 多选按钮 */
    .nz-multi-select-toggle {
      position: relative;
    }
    
    .nz-multi-select-toggle.active {
      background: #4a9eff !important;
      color: white !important;
      border-color: #4a9eff !important;
    }
    
    /* 多选菜单 */
    .nz-multi-select-menu {
      position: absolute;
      top: 100%;
      left: 0;
      background: var(--comfy-menu-bg, #2a2a2a);
      border: 1px solid var(--border-color, #444);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 180px;
      z-index: 10000;
      padding: 8px 0;
      margin-top: 4px;
    }
    
    .nz-menu-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      cursor: pointer;
      color: var(--fg-color, #ccc);
      transition: all 0.2s ease;
    }
    
    .nz-menu-item:hover {
      background: var(--comfy-input-bg, #3a3a3a);
      color: var(--fg-color, #fff);
    }
    
    .nz-menu-item i {
      margin-right: 10px;
      width: 16px;
      font-size: 14px;
    }
    
    .nz-menu-item span {
      font-size: 13px;
    }
    
    .nz-menu-separator {
      height: 1px;
      background: var(--border-color, #444);
      margin: 8px 0;
    }
    
    /* 多选状态下的选中项样式 */
    .nz-file-item.selected {
      background: rgba(74, 158, 255, 0.15) !important;
      border: none !important;
      border-radius: 6px;
      transform: scale(0.98);
      outline: 2px solid #4a9eff !important;
      outline-offset: -2px !important;
    }
    
    .nz-file-item.selected::after {
      content: '✓';
      position: absolute;
      top: 5px;
      right: 5px;
      background: #4a9eff;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      z-index: 10;
    }
    
    .nz-file-item.selected:hover {
      background: rgba(74, 158, 255, 0.25) !important;
    }
    
    .nz-toolbar-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(100, 120, 180, 0.3);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    
    .nz-toolbar-btn:hover:not(:disabled) {
      background: rgba(100, 120, 180, 0.5);
    }
    
    .nz-toolbar-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba(60, 70, 80, 0.3);
    }
    
    .nz-toolbar-btn:hover::after {
      content: attr(title);
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 100;
    }
    
    .nz-path-display {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding: 8px 12px;
      background: linear-gradient(135deg, rgba(60, 80, 100, 0.4), rgba(50, 70, 90, 0.2));
      border: none !important;
      border-radius: 8px;
      font-size: 0.85em;
      word-break: break-word;
      box-shadow: none !important;
      min-height: 32px;
      flex-wrap: wrap;
    }
    
    .nz-path-display i {
      color: #6bb6ff;
      font-size: 14px;
    }
    
    .nz-path-display {
      position: relative;
    }
    
    .nz-path-actions {
      margin-left: auto;
      display: flex;
      gap: 6px;
      flex-shrink: 0;
      align-items: center;
    }
    
    .nz-path-action-btn {
      background: rgba(100, 120, 180, 0.2);
      border: 1px solid rgba(100, 120, 180, 0.3);
      border-radius: 4px;
      padding: 6px 8px;
      color: #6bb6ff;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
      white-space: nowrap;
      flex-shrink: 0;
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .nz-path-action-btn:hover {
      background: rgba(100, 120, 180, 0.4);
      border-color: rgba(100, 120, 180, 0.5);
      transform: scale(1.05);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    /* 删除按钮特殊样式 */
    .nz-path-action-btn[title*="删除"], 
    .nz-path-action-btn[title*="Delete"] {
      background: rgba(220, 50, 50, 0.2);
      border-color: rgba(220, 50, 50, 0.3);
      color: #ff6b6b;
    }
    
    .nz-path-action-btn[title*="删除"]:hover, 
    .nz-path-action-btn[title*="Delete"]:hover {
      background: rgba(220, 50, 50, 0.4);
      border-color: rgba(220, 50, 50, 0.5);
      color: #ff8a8a;
    }
    
    /* 路径栏拖拽样式 */
    .nz-path-display.drag-over {
      background: linear-gradient(135deg, rgba(100, 150, 255, 0.3), rgba(80, 130, 255, 0.2));
      border-color: rgba(100, 150, 255, 0.5);
      box-shadow: 0 0 0 2px rgba(100, 150, 255, 0.3);
    }
    
    /* 路径栏拖拽覆盖层 */
    .nz-path-drag-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 150, 0, 0.95);  /* 增加不透明度完全遮盖背景 */
      border: 2px dashed #00aa00;
      border-radius: 8px;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;  /* 增加z-index确保覆盖所有内容 */
      color: #ffffff;  /* 改为白色文字确保可见性 */
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      transition: all 0.2s ease;
      pointer-events: none;
      box-shadow: 0 2px 10px rgba(0, 150, 0, 0.4);
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);  /* 添加文字阴影增强可读性 */
    }
    
    .nz-path-drag-overlay.visible {
      display: flex;
    }
    
    .nz-path-drag-overlay.drag-over {
      background: rgba(0, 180, 0, 0.98);  /* 悬停时更亮的绿色，更高不透明度 */
      border-color: #00ff00;  /* 更亮的边框 */
      color: #ffffff;  /* 保持白色文字 */
      transform: scale(1.02);
      box-shadow: 0 4px 15px rgba(0, 150, 0, 0.6);
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);  /* 增强文字阴影 */
    }
    
    .nz-path-drag-overlay .icon {
      font-size: 18px;
      margin-right: 8px;
    }
    
    /* 显示覆盖层时隐藏路径内容 */
    .nz-path-display.drag-overlay-active > *:not(.nz-path-drag-overlay) {
      opacity: 0;
      visibility: hidden;
    }
    
    /* 拖拽到上级目录的目标区域 */
    .nz-drag-to-parent {
      position: relative;
      width: 100%;
      height: 60px;
      background: rgba(0, 150, 0, 0.15);
      border: 2px dashed #00aa00;
      border-radius: 8px;
      display: none !important;
      align-items: center;
      justify-content: center;
      z-index: 10000 !important;
      backdrop-filter: blur(5px);
      font-size: 14px;
      font-weight: bold;
      color: #00aa00;
      text-align: center;
      transition: all 0.2s ease;
      pointer-events: auto;
      box-shadow: 0 2px 10px rgba(0, 150, 0, 0.2);
      margin: 15px 0;
      padding: 10px;
      box-sizing: border-box;
    }
    
    .nz-drag-to-parent.drag-over {
      background: rgba(0, 150, 0, 0.25);
      border-color: #00dd00;
      color: #00dd00;
      transform: scale(1.05);
      pointer-events: auto;
      box-shadow: 0 4px 15px rgba(0, 150, 0, 0.3);
    }
    
    .nz-drag-to-parent.visible {
      display: flex !important;
    }
    
    /* 窄屏优化 */
    @media (max-width: 768px) {
      .nz-path-display {
        padding: 6px 10px;
        font-size: 0.8em;
        gap: 6px;
      }
      
      .nz-path-drag-overlay {
        font-size: 12px;
        border-width: 1px;
      }
      
      .nz-path-drag-overlay .icon {
        font-size: 16px;
        margin-right: 6px;
      }
      
      .nz-path-action-btn {
        padding: 4px 6px;
        font-size: 11px;
        min-width: 24px;
        height: 24px;
      }
      
      .nz-path-display i {
        font-size: 12px;
      }
    }
    
    @media (max-width: 480px) {
      .nz-path-display {
        padding: 6px 8px;
        font-size: 0.8em;
        gap: 6px;
        min-height: 32px;
      }
      
      .nz-path-drag-overlay {
        font-size: 11px;
        border-width: 1px;
      }
      
      .nz-path-drag-overlay .icon {
        font-size: 14px;
        margin-right: 4px;
      }
      
      .nz-path-actions {
        gap: 4px;
      }
      
      .nz-path-action-btn {
        padding: 3px 5px;
        font-size: 10px;
        min-width: 22px;
        height: 22px;
      }
    }
    
    .nz-drag-to-parent .icon {
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .nz-default-dir-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
      padding: 6px 10px;
      background: rgba(60, 80, 100, 0.2);
      border-radius: 4px;
      font-size: 0.8em;
      opacity: 0.7;
      color: #b0c0d0;
    }
    
    .nz-content {
      position: relative;
      min-height: 300px;
      max-height: 600px;
      overflow-y: auto;
      background: linear-gradient(135deg, rgba(60, 80, 100, 0.15), rgba(50, 70, 90, 0.08));
      border-radius: 6px;
      padding: 15px;
      border: none !important;
    }
    
    /* 自定义滚动条样式 */
    .nz-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .nz-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
    
    .nz-content::-webkit-scrollbar-thumb {
      background: rgba(100, 120, 180, 0.4);
      border-radius: 4px;
      transition: background 0.3s ease;
    }
    
    .nz-content::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 120, 180, 0.6);
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    
    .file-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      padding: 5px;
    }
    
    /* 响应式设计 */
    @media (max-width: 800px) {
      .file-grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
      }
    }
    
    @media (max-width: 600px) {
      .file-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
      }
    }
    
    .nz-file-item {
      background: rgba(60, 70, 90, 0.6);
      padding: 12px;
      border-radius: 10px;
      border: none !important;
      cursor: pointer;
      transition: all 0.3s ease;
      color: var(--fg-color, inherit);
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      position: relative;
      height: 74px !important;
      min-height: 74px !important;
      max-height: 74px !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: visible;
      gap: 12px;
      box-sizing: border-box !important;
    }
    
    .nz-file-item:hover {
      background: rgba(60, 70, 90, 0.6);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
      border: none !important;
    }
    
    /* 缩略图样式 */
    .nz-file-item-thumbnail {
      width: 50px !important;
      height: 50px !important;
      min-height: 50px !important;
      max-height: 50px !important;
      flex-shrink: 0 !important;
      display: flex !important;
      align-items: stretch !important;
      justify-content: stretch !important;
      border-radius: 8px;
      background: transparent;
      border: none !important;
      position: relative;
      overflow: hidden;
      margin: 0 !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      align-self: center !important;
    }
    
    .nz-file-item-thumbnail.nz-folder-thumbnail {
      background: transparent;
      border: none !important;
    }
    
    /* 文件夹整体背景渐变 */
    .nz-file-item.folder {
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 152, 0, 0.12)) !important;
      border-radius: 8px;
    }
    
    .nz-thumbnail-icon {
      font-size: 48px !important;
      opacity: 0.9;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 50px !important;
      max-height: 50px !important;
      line-height: 1 !important;
      margin: 0 !important;
      padding: 0 !important;
      vertical-align: top !important;
      box-sizing: border-box !important;
      flex: 1 !important;
      position: relative !important;
      top: 0 !important;
      left: 0 !important;
      transform: none !important;
    }
    
    /* 文件夹图标 */
    .nz-folder-thumbnail .nz-thumbnail-icon {
      font-size: 50px !important;
    }
    
    /* 文件项内容区域 */
    .nz-file-item-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 50px;
    }
    
    .nz-file-item-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--fg-color, #e0f0ff);
      line-height: 1.3;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .nz-file-item-comment {
      font-size: 12px;
      color: var(--fg-color, rgba(224, 240, 255, 0.7));
      line-height: 1.2;
      margin: 2px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .nz-file-item-date {
      font-size: 10px;
      color: var(--fg-color, rgba(224, 240, 255, 0.5));
      line-height: 1.2;
      margin-top: auto;
      margin-bottom: 2px;
      flex-shrink: 0;
    }
    
    /* 主题适配 - 亮色主题下的文件项样式 */
    .nz-manager.nz-theme-light .nz-file-item {
      background: rgba(250, 250, 250, 0.95);
      border: none !important;
      color: var(--nz-light-text);
    }
    
    .nz-manager.nz-theme-light .nz-file-item:hover {
      background: rgba(250, 250, 250, 0.95);
      border: none !important;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .nz-manager.nz-theme-light .nz-file-item-thumbnail {
      background: transparent;
      border: none !important;
    }
    
    .nz-manager.nz-theme-light .nz-file-item-thumbnail.nz-folder-thumbnail {
      background: transparent;
      border: none !important;
    }
    
    /* 浅色主题文件夹整体背景渐变 */
    .nz-manager.nz-theme-light .nz-file-item.folder {
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.15)) !important;
      border-radius: 8px;
    }
    
    .nz-manager.nz-theme-light .nz-file-item-name:not(.nz-priority-high):not(.nz-priority-low) {
      color: var(--nz-light-text) !important;
    }
    
    .nz-manager.nz-theme-light .nz-file-item-comment {
      color: var(--nz-light-text-secondary) !important;
    }
    
    .nz-manager.nz-theme-light .nz-file-item-date {
      color: rgba(44, 62, 80, 0.6);
    }
    
    /* 兼容旧版本的样式 - 已被新的缩略图布局替代 */
    
    .nz-file-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 11px;
      opacity: 0.7;
      color: #a0b0c0;
    }
    
    .nz-file-date {
      font-size: 11px;
      opacity: 0.6;
    }
    
    .nz-file-comment {
      font-size: 12px;
      color: var(--fg-color, rgba(255, 255, 255, 0.6));
      margin-top: 4px;
    }
    
    .file-item.folder {
      background: rgba(60, 80, 60, 0.5);
      border: none !important;
    }
    
    .file-item.folder:hover {
      background: rgba(80, 120, 80, 0.5);
    }
    

    
    /* 批量操作栏样式 */
    .nz-batch-operations {
      background: rgba(40, 50, 70, 0.95);
      border: 1px solid rgba(100, 120, 180, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(10px);
      animation: slideDown 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      flex-wrap: wrap;
      gap: 8px;
    }
    
    /* 工具栏位置的批量操作栏样式 */
    .nz-batch-operations.nz-batch-toolbar {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      margin: 4px 0;
    }
    
    .nz-batch-operations.nz-batch-toolbar .nz-batch-count {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
      border: 1px solid rgba(255, 193, 7, 0.3);
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .nz-batch-info {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #e0e6ed;
      font-size: 13px;
      font-weight: 500;
    }
    
    .nz-batch-count {
      background: rgba(74, 158, 255, 0.2);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid rgba(74, 158, 255, 0.3);
      color: #4a9eff;
      font-weight: 600;
      min-width: 120px;
      text-align: center;
    }
    
    .nz-batch-actions {
      display: flex;
      gap: 8px;
    }
    
    .nz-batch-btn {
      background: rgba(60, 80, 120, 0.8);
      border: 1px solid rgba(100, 120, 180, 0.3);
      color: #e0e6ed;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      font-weight: 500;
      min-width: 70px;
      justify-content: center;
    }
    
    .nz-batch-btn:hover {
      background: rgba(80, 100, 140, 0.9);
      border-color: rgba(120, 140, 200, 0.5);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .nz-batch-btn.danger {
      background: rgba(180, 60, 60, 0.8);
      border-color: rgba(200, 80, 80, 0.5);
    }
    
    .nz-batch-btn.danger:hover {
      background: rgba(200, 80, 80, 0.9);
      border-color: rgba(220, 100, 100, 0.7);
    }
    
    .nz-batch-btn i {
      font-size: 12px;
    }
    
    .nz-batch-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
    
    .nz-batch-btn:disabled:hover {
      background: rgba(60, 80, 120, 0.8);
      border-color: rgba(100, 120, 180, 0.3);
      transform: none;
    }

    /* 批量操作栏响应式设计 */
    @media (max-width: 900px) {
      .nz-batch-operations {
        justify-content: center;
        gap: 12px;
      }
      
      .nz-batch-info, .nz-batch-actions {
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
      }
    }

    @media (max-width: 768px) {
      .nz-batch-operations {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 12px;
      }
      
      .nz-batch-info {
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .nz-batch-actions {
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px;
      }
    }

    @media (max-width: 600px) {
      .nz-batch-operations {
        padding: 10px;
        gap: 10px;
      }
      
      /* 按钮文字在极窄屏幕下隐藏，只显示图标 */
      .nz-batch-btn span.btn-text {
        display: none;
      }
      
      .nz-batch-btn {
        padding: 8px;
        min-width: 36px;
        justify-content: center;
      }
      
      .nz-batch-btn i {
        margin-right: 0;
      }
    }

    @media (min-width: 601px) {
      /* 宽屏下显示完整的图标+文字 */
      .nz-batch-btn span.btn-text {
        display: inline;
        margin-left: 4px;
      }
    }
    
    /* 拖拽状态样式 */
    .file-item.dragging {
      opacity: 0.5;
      transform: scale(0.95);
    }
    
    .file-item.drag-over {
      background: rgba(100, 150, 255, 0.3) !important;
      border: none !important;
      box-shadow: 0 0 0 2px rgba(100, 150, 255, 0.5);
    }
    
    .empty-state {
      text-align: center;
      padding: 30px;
      color: #999;
    }
    
    .empty-state .error-message {
      text-align: left;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #2b2b2b;
      border-radius: 8px;
      border-left: 4px solid #ff6b6b;
    }
    
    .empty-state .error-message h3 {
      color: #ff6b6b;
      margin: 0 0 15px 0;
      font-size: 18px;
    }
    
    .empty-state .error-message p {
      color: #ccc;
      margin: 10px 0;
      line-height: 1.4;
    }
    
    .empty-state .error-message ol {
      color: #ccc;
      margin: 15px 0;
      padding-left: 20px;
    }
    
    .empty-state .error-message li {
      margin: 8px 0;
      line-height: 1.4;
    }
    
    .empty-state .error-message small {
      color: #999;
      font-size: 13px;
    }
    
    .nz-status-bar {
      margin-top: 15px;
      padding-top: 10px;
      border-top: none !important;
      font-size: 0.75em;
      opacity: 0.5;
    }
    
    /* 通知样式 */
    .nz-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--comfy-menu-bg, rgba(25, 30, 40, 0.95));
      border: 1px solid var(--border-color, rgba(100, 120, 180, 0.3));
      border-radius: 12px;
      padding: 12px 16px;
      color: #e0f0ff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      word-wrap: break-word;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .nz-notification.show {
      transform: translateX(0);
      opacity: 1;
    }
    
    .nz-notification-hide {
      transform: translateX(100%);
      opacity: 0;
    }
    
    .nz-notification-content {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      line-height: 1.4;
    }
    
    .nz-notification-content span {
      white-space: pre-line;
    }
    
    .nz-notification i {
      font-size: 18px;
    }
    
    .nz-notification-success {
      border-color: rgba(100, 200, 100, 0.6);
      background: linear-gradient(135deg, rgba(25, 40, 30, 0.95), rgba(30, 50, 35, 0.9));
      box-shadow: 0 4px 16px rgba(100, 200, 100, 0.2);
    }
    
    .nz-notification-success i {
      color: #64c864;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .nz-notification-error {
      border-color: rgba(200, 100, 100, 0.6);
      background: linear-gradient(135deg, rgba(40, 25, 25, 0.95), rgba(50, 30, 30, 0.9));
      box-shadow: 0 4px 16px rgba(200, 100, 100, 0.2);
    }
    
    .nz-notification-error i {
      color: #c86464;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .nz-notification-info {
      border-color: rgba(100, 150, 200, 0.6);
      background: linear-gradient(135deg, rgba(25, 30, 40, 0.95), rgba(30, 40, 50, 0.9));
      box-shadow: 0 4px 16px rgba(100, 150, 200, 0.2);
    }
    
    .nz-notification-info i {
      color: #6496c8;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .nz-notification-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #999;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .nz-notification-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
    
    /* 文件项拖拽样式 */
    .nz-file-item[draggable="true"] {
      cursor: grab;
    }
    
    .nz-file-item[draggable="true"]:active {
      cursor: grabbing;
    }
    
    /* 右键上下文菜单样式 (v3.0.0新增) */
    .nz-context-menu {
      position: fixed;
      background: var(--comfy-menu-bg, rgba(25, 30, 40, 0.98));
      border: 1px solid var(--border-color, rgba(100, 120, 180, 0.3));
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      padding: 6px 0;
      min-width: 180px;
      z-index: 10001;
      backdrop-filter: blur(10px);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .nz-context-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 10px 16px;
      cursor: pointer;
      color: var(--fg-color, #e0f0ff);
      font-size: 13px;
      border: 1px solid transparent;
      background: none;
      text-align: left;
      transition: all 0.2s ease;
      border-radius: 4px;
      margin: 2px 0;
      position: relative;
    }
    
    .nz-context-menu-item:hover {
      background: rgba(100, 120, 180, 0.2);
    }
    
    .nz-context-menu-item:active {
      background: rgba(100, 120, 180, 0.3);
    }
    
    /* 选中状态样式 - 超强优先级版本 */
    .nz-context-menu-item.selected,
    .nz-context-menu-item.selected.selected,
    .nz-context-menu-item.selected.selected.selected {
      background: linear-gradient(135deg, rgba(74, 158, 255, 0.8), rgba(100, 180, 255, 0.7)) !important;
      border: 3px solid rgba(74, 158, 255, 1) !important;
      color: #ffffff !important;
      font-weight: bold !important;
      box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.4), 0 6px 16px rgba(74, 158, 255, 0.5) !important;
      transform: scale(1.03) !important;
      position: relative !important;
      padding-left: 32px !important;
      outline: none !important;
      z-index: 9999 !important;
    }
    
    .nz-context-menu-item.selected::before {
      content: '✓' !important;
      position: absolute !important;
      left: 8px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: #ffffff !important;
      font-weight: bold !important;
      font-size: 14px !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
    }
    
    .nz-context-menu-item.selected:hover {
      background: linear-gradient(135deg, rgba(74, 158, 255, 0.5), rgba(100, 180, 255, 0.4)) !important;
      border-color: rgba(74, 158, 255, 0.9) !important;
      box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.3), 0 6px 16px rgba(74, 158, 255, 0.4) !important;
      transform: scale(1.03) !important;
    }
    
    .nz-context-menu-item.danger {
      color: #ff9999;
    }
    
    .nz-context-menu-item.danger:hover {
      background: rgba(200, 100, 100, 0.2);
      color: #ffcccc;
    }
    
    
    .nz-context-menu-separator {
      height: 1px;
      background: var(--border-color, rgba(100, 120, 180, 0.2));
      margin: 6px 0;
    }
    
    /* 子菜单样式 */
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
      backdrop-filter: blur(10px);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: none;
      margin-left: 5px;
    }
    
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
    
    /* 对话框样式 (v3.0.0新增) */
    .nz-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    
    .nz-dialog {
      background: var(--comfy-menu-bg, rgba(25, 30, 40, 0.98));
      border: 1px solid var(--border-color, rgba(100, 120, 180, 0.3));
      border-radius: 12px;
      padding: 24px;
      max-width: 450px;
      min-width: 320px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .nz-dialog-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--fg-color, #e0f0ff);
      text-align: center;
    }
    
    .nz-dialog-message {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 20px;
      color: var(--fg-color, #c0d0e0);
      text-align: center;
      white-space: pre-line;
    }
    
    .nz-dialog-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border-color, rgba(100, 120, 180, 0.3));
      border-radius: 6px;
      background: var(--comfy-input-bg, rgba(40, 50, 70, 0.8));
      color: var(--input-text, #e0f0ff);
      margin-bottom: 20px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }
    
    .nz-dialog-input:focus {
      outline: none;
      border-color: rgba(100, 150, 200, 0.6);
      box-shadow: 0 0 0 2px rgba(100, 150, 200, 0.2);
    }
    
    .nz-dialog-input::placeholder {
      color: #999;
    }
    
    .nz-dialog-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    
    .nz-dialog-button {
      padding: 10px 20px;
      border: 1px solid rgba(100, 120, 180, 0.3);
      border-radius: 6px;
      background: rgba(40, 50, 70, 0.8);
      color: #e0f0ff;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      min-width: 80px;
    }
    
    .nz-dialog-button:hover {
      background: rgba(60, 80, 120, 0.8);
      border-color: rgba(120, 140, 200, 0.4);
    }
    
    .nz-dialog-button:active {
      transform: translateY(1px);
    }
    
    .nz-dialog-button.primary {
      background: rgba(70, 130, 200, 0.8);
      border-color: rgba(100, 150, 220, 0.6);
      color: white;
    }
    
    .nz-dialog-button.primary:hover {
      background: rgba(90, 150, 220, 0.9);
      border-color: rgba(120, 170, 240, 0.7);
    }
    
    .nz-dialog-button.danger {
      background: rgba(200, 70, 70, 0.8);
      border-color: rgba(220, 100, 100, 0.6);
      color: white;
    }
    
    .nz-dialog-button.danger:hover {
      background: rgba(220, 90, 90, 0.9);
      border-color: rgba(240, 120, 120, 0.7);
    }
    
    /* 目录选择器样式 */
    .nz-directory-chooser {
      min-width: 450px;
    }
    
    .nz-input-container {
      display: flex;
      gap: 8px;
      align-items: stretch;
      margin-bottom: 20px;
    }
    
    .nz-input-container .nz-dialog-input {
      margin-bottom: 0;
      flex: 1;
    }
    
    .nz-dialog-button.browse-btn {
      background: rgba(70, 130, 200, 0.7);
      border-color: rgba(100, 150, 220, 0.5);
      white-space: nowrap;
      min-width: auto;
      padding: 10px 16px;
    }
    
    .nz-dialog-button.browse-btn:hover {
      background: rgba(90, 150, 220, 0.8);
      border-color: rgba(120, 170, 240, 0.6);
    }
    
    .nz-dialog-button.browse-btn i {
      margin-right: 4px;
    }
    
    /* 消息对话框样式 */
    .nz-message-dialog.success .nz-dialog-title {
      color: #90ee90;
    }
    
    .nz-message-dialog.error .nz-dialog-title {
      color: #ff9999;
    }
    
    .nz-message-dialog.warning .nz-dialog-title {
      color: #ffd700;
    }
    
    /* 备注编辑器样式 */
    .nz-note-editor {
      max-width: 500px;
      width: 90vw;
    }
    
    .nz-form-group {
      margin-bottom: 16px;
    }
    
    .nz-form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--fg-color, #e0f0ff);
    }
    
    .nz-form-group input,
    .nz-form-group textarea,
    .nz-form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color, rgba(100, 120, 180, 0.3));
      border-radius: 6px;
      background: var(--comfy-input-bg, rgba(40, 50, 70, 0.8));
      color: var(--fg-color, #e0f0ff);
      font-size: 13px;
      font-family: inherit;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    
    .nz-form-group input:focus,
    .nz-form-group textarea:focus,
    .nz-form-group select:focus {
      outline: none;
      border-color: rgba(100, 150, 200, 0.6);
      box-shadow: 0 0 0 2px rgba(100, 150, 200, 0.2);
    }
    
    .nz-form-group textarea {
      resize: vertical;
      min-height: 80px;
      max-height: 200px;
    }
    
    .nz-form-row {
      display: flex;
      gap: 16px;
    }
    
    .nz-form-row .nz-form-group {
      flex: 1;
    }
    
    .nz-category-container {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    .nz-category-container input {
      flex: 1;
    }
    
    .nz-manage-btn {
      padding: 4px 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      z-index: 100;
      pointer-events: auto;
    }
    
    .nz-manage-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 1);
    }
    
    .nz-manage-btn:active {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0.95);
    }
    
    /* 标签输入器 */
    .nz-tag-input {
      position: relative;
    }
    
    .nz-tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
      min-height: 24px;
    }
    
    .nz-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      background: rgba(100, 150, 200, 0.2);
      border: 1px solid rgba(100, 150, 200, 0.3);
      border-radius: 12px;
      font-size: 11px;
      color: var(--fg-color, #e0f0ff);
      gap: 4px;
    }
    
    .nz-tag .remove-tag {
      cursor: pointer;
      color: #ff9999;
      font-weight: bold;
      font-size: 14px;
      padding: 0 2px;
      border-radius: 50%;
      line-height: 1;
    }
    
    .nz-tag .remove-tag:hover {
      background: rgba(255, 100, 100, 0.2);
    }
    
    /* 优先级标记 */
    .nz-priority-high {
      color: #ff6b6b !important;
    }
    
    .nz-priority-normal {
      color: #ffffff !important;
    }
    
    .nz-priority-low {
      color: #999 !important;
    }
    
    /* 文件项备注指示器 */
    .nz-note-indicator {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 12px;
      background: rgba(100, 150, 200, 0.8);
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .nz-file-note-title {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 2px;
      margin-bottom: 2px;
      font-style: italic;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
      max-width: 100%;
      min-height: 14px;
    }
    
    .nz-file-tags {
      display: none;
    }
    
    .nz-file-tags-inline {
      display: none;
    }
    
    .nz-file-tags .nz-tag {
      font-size: 10px;
      padding: 2px 6px;
    }
    
    /* 浮动管理器备注样式 */
    .nz-workflow-notes {
      margin-top: 12px;
      padding: 10px;
      background: rgba(60, 80, 120, 0.1);
      border: 1px solid rgba(100, 120, 180, 0.2);
      border-radius: 6px;
    }
    
    .nz-note-content-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      gap: 8px;
    }
    
    .nz-note-edit-btn {
      padding: 4px 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 11px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .nz-note-edit-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 1);
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    /* 增加备注按钮样式 */
    .nz-add-note-btn {
      display: none; /* 默认隐藏 */
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: 1px solid rgba(107, 182, 255, 0.3);
      background: rgba(107, 182, 255, 0.1);
      color: rgba(107, 182, 255, 0.9);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 11px;
      white-space: nowrap;
      margin-left: auto;
      /* 重置文字样式，防止继承渐变效果 */
      -webkit-background-clip: initial;
      -webkit-text-fill-color: initial;
      background-clip: initial;
      text-shadow: none;
    }
    
    .nz-add-note-btn:hover {
      background: rgba(107, 182, 255, 0.2) !important;
      color: rgba(107, 182, 255, 1) !important;
      border-color: rgba(107, 182, 255, 0.5) !important;
      transform: translateY(-1px) !important;
      -webkit-text-fill-color: rgba(107, 182, 255, 1) !important;
    }
    
    .nz-add-note-btn i {
      font-size: 10px;
    }
    
    .nz-note-header i {
      color: #6bb6ff;
    }
    
    .nz-note-description-text {
      font-size: 12px;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.8);
      flex: 1;
      margin-bottom: 0;
      word-wrap: break-word;
      word-break: break-word;
    }
    
    .nz-note-tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 6px;
      margin-top: 4px;
    }
    
    .nz-note-tags-container .nz-tag {
      font-size: 10px;
      padding: 2px 6px;
    }
    
    .nz-note-meta {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 4px;
    }
    
    .nz-note-category-text {
      font-style: italic;
    }
    
    .nz-note-priority-text {
      font-weight: 500;
    }
    
    /* 浮动管理器中的优先级颜色 */
    .nz-workflow-notes .nz-priority-high {
      color: #ff6b6b !important;
    }
    
    .nz-workflow-notes .nz-priority-normal {
      color: #ffffff !important;
    }
    
    .nz-workflow-notes .nz-priority-low {
      color: #999 !important;
    }
    
    /* 分类管理器样式 */
    .category-manager-dialog {
      width: 500px;
      max-height: 600px;
    }
    
    .category-manager-content {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .category-list {
      margin-bottom: 20px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.05);
    }
    
    .category-name {
      flex: 1;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .category-actions {
      display: flex;
      gap: 4px;
    }
    
    .edit-category-btn, .delete-category-btn {
      padding: 2px 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 3px;
      transition: background 0.2s;
    }
    
    .edit-category-btn:hover {
      background: rgba(76, 175, 80, 0.2);
    }
    
    .delete-category-btn:hover {
      background: rgba(244, 67, 54, 0.2);
    }
    
    .category-edit-input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.9);
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 14px;
    }
    
    .add-category-section {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .add-category-section input {
      flex: 1;
    }
    
    .add-category-section button {
      padding: 6px 12px;
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid rgba(76, 175, 80, 0.3);
      color: rgba(255, 255, 255, 0.9);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .add-category-section button:hover {
      background: rgba(76, 175, 80, 0.3);
      border-color: rgba(76, 175, 80, 0.5);
    }
    
    /* 文件拖拽视觉反馈增强 */
    .file-item.dragging {
      opacity: 0.6;
      transform: rotate(2deg) scale(0.95);
    }
    
    .file-item.drop-target {
      background: rgba(70, 130, 200, 0.3) !important;
      border: none !important;
      transform: scale(1.02);
    }
    
    /* 浮动工作流助手样式 (v3.1.0新增) */
    .nz-floating-manager {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 280px;
      background: rgba(25, 30, 40, 0.98);
      border: 1px solid rgba(100, 120, 180, 0.3);
      border-radius: 12px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      z-index: 9999;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .nz-floating-manager.show {
      transform: translateX(0);
      opacity: 1;
    }
    
    /* 浮动管理器亮色主题 */
    .nz-floating-manager.nz-theme-light {
      background: var(--nz-light-bg);
      border-color: var(--nz-light-border);
      box-shadow: 0 12px 36px var(--nz-light-shadow);
      color: var(--nz-light-text);
    }
    
    .nz-floating-manager.nz-theme-light .nz-floating-header {
      background: rgba(52, 152, 219, 0.1);
      border-bottom-color: var(--nz-light-border);
    }
    
    .nz-floating-manager.nz-theme-light .nz-floating-title {
      color: var(--nz-light-text);
    }
    
    .nz-floating-manager.nz-theme-light .nz-floating-title i {
      color: var(--nz-light-accent);
    }
    
    .nz-floating-manager.nz-theme-light .nz-floating-btn {
      background: rgba(52, 152, 219, 0.1);
      color: var(--nz-light-text);
    }
    
    .nz-floating-manager.nz-theme-light .nz-floating-btn:hover {
      background: rgba(52, 152, 219, 0.2);
      color: var(--nz-light-text);
    }
    
    .nz-floating-manager.nz-theme-light .nz-workflow-info {
      background: rgba(52, 152, 219, 0.05);
      border-color: var(--nz-light-border);
    }
    
    .nz-floating-manager.nz-theme-light .nz-workflow-name {
      color: var(--nz-light-text) !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-workflow-name i {
      color: var(--nz-light-accent) !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-workflow-path,
    .nz-floating-manager.nz-theme-light .nz-workflow-time {
      color: var(--nz-light-text-secondary) !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-workflow-path i,
    .nz-floating-manager.nz-theme-light .nz-workflow-time i {
      color: var(--nz-light-text-secondary) !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-name-text {
      color: var(--nz-light-text) !important;
      background: linear-gradient(135deg, #2c3e50, #34495e) !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-path-text {
      color: var(--nz-light-text-secondary) !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-note-description-text {
      color: var(--nz-light-text) !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-modified-indicator {
      color: #e74c3c !important;
    }
    
    /* 修复列表中备注文本在浅色模式下的可见性 */
    .nz-theme-light .nz-file-note-title {
      color: var(--nz-light-text-secondary) !important;
    }
    
    /* 修复浮动框内分类和优先级文字在浅色模式下的可见性 */
    .nz-floating-manager.nz-theme-light .nz-note-category-text,
    .nz-floating-manager.nz-theme-light .nz-note-priority-text {
      color: var(--nz-light-text-secondary) !important;
    }
    
    /* 浅色主题下的优先级颜色 - 增强权重 */
    .nz-manager.nz-theme-light .nz-file-item-name.nz-priority-high {
      color: #d63384 !important; /* 深红色 */
    }
    
    .nz-manager.nz-theme-light .nz-file-item-name.nz-priority-normal {
      color: var(--nz-light-text) !important; /* 正常深色文字 */
    }
    
    .nz-manager.nz-theme-light .nz-file-item-name.nz-priority-low {
      color: #6c757d !important; /* 灰色 */
    }
    
    /* 浮动管理器中的优先级颜色在浅色主题下 */
    .nz-floating-manager.nz-theme-light .nz-priority-high {
      color: #d63384 !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-priority-normal {
      color: var(--nz-light-text) !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-priority-low {
      color: #6c757d !important;
    }
    
    .nz-floating-manager.nz-theme-light .nz-action-btn {
      background: rgba(52, 152, 219, 0.1);
      border-color: var(--nz-light-border);
      color: var(--nz-light-text);
    }
    
    .nz-floating-manager.nz-theme-light .nz-action-btn:hover:not(:disabled) {
      background: rgba(52, 152, 219, 0.2);
      border-color: var(--nz-light-accent);
    }
    
    .nz-floating-manager.nz-theme-light .nz-action-btn i {
      color: var(--nz-light-accent);
    }
    
    .nz-floating-manager.nz-theme-light .nz-action-btn span {
      color: var(--nz-light-text);
    }
    
    .nz-floating-manager.nz-theme-light .nz-collapsed-filename {
      color: var(--nz-light-text);
    }
    
    .nz-floating-manager.nz-theme-light .nz-collapsed-filename:hover {
      background: rgba(52, 152, 219, 0.1);
    }
    
    .nz-floating-manager.nz-theme-light .nz-collapsed-btn {
      background: rgba(52, 152, 219, 0.1);
      border-color: var(--nz-light-border);
      color: var(--nz-light-text);
    }
    
    .nz-floating-manager.nz-theme-light .nz-collapsed-btn:hover:not(:disabled) {
      background: rgba(52, 152, 219, 0.2);
      border-color: var(--nz-light-accent);
    }
    
    /* 浮动管理器暗色主题（默认样式保持不变） */
    .nz-floating-manager.nz-theme-dark {
      background: var(--nz-dark-bg);
      border-color: var(--nz-dark-border);
      box-shadow: 0 12px 36px var(--nz-dark-shadow);
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-floating-header {
      background: rgba(107, 182, 255, 0.1);
      border-bottom-color: var(--nz-dark-border);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-floating-title {
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-floating-title i {
      color: var(--nz-dark-accent);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-floating-btn {
      background: rgba(107, 182, 255, 0.1);
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-floating-btn:hover {
      background: rgba(107, 182, 255, 0.2);
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-workflow-info {
      background: rgba(107, 182, 255, 0.05);
      border-color: var(--nz-dark-border);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-workflow-name {
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-workflow-name i {
      color: var(--nz-dark-accent);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-workflow-path,
    .nz-floating-manager.nz-theme-dark .nz-workflow-time {
      color: var(--nz-dark-text-secondary);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-workflow-path i,
    .nz-floating-manager.nz-theme-dark .nz-workflow-time i {
      color: var(--nz-dark-text-secondary);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-action-btn {
      background: rgba(107, 182, 255, 0.1);
      border-color: var(--nz-dark-border);
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-action-btn:hover:not(:disabled) {
      background: rgba(107, 182, 255, 0.2);
      border-color: var(--nz-dark-accent);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-action-btn i {
      color: var(--nz-dark-accent);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-action-btn span {
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-collapsed-filename {
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-collapsed-filename:hover {
      background: rgba(107, 182, 255, 0.1);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-collapsed-btn {
      background: rgba(107, 182, 255, 0.1);
      border-color: var(--nz-dark-border);
      color: var(--nz-dark-text);
    }
    
    .nz-floating-manager.nz-theme-dark .nz-collapsed-btn:hover:not(:disabled) {
      background: rgba(107, 182, 255, 0.2);
      border-color: var(--nz-dark-accent);
    }
    
    /* 浮动管理器头部 */
    .nz-floating-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(100, 120, 180, 0.2);
      background: rgba(40, 50, 70, 0.5);
      border-radius: 12px 12px 0 0;
      user-select: none;
      cursor: grab;
    }
    
    .nz-floating-header:active {
      cursor: grabbing;
    }
    
    .nz-floating-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #e0f0ff;
      font-size: 14px;
      font-weight: 600;
    }
    
    .nz-floating-title i {
      color: #6bb6ff;
    }
    
    .nz-floating-controls {
      display: flex;
      gap: 4px;
    }
    
    .nz-floating-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: rgba(100, 120, 180, 0.2);
      color: #c0d0e0;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-size: 12px;
    }
    
    .nz-floating-btn:hover {
      background: rgba(100, 120, 180, 0.4);
      color: #e0f0ff;
    }
    
    /* 浮动管理器内容 */
    .nz-floating-content {
      padding: 12px;
    }
    
    /* 当前工作流信息 */
    .nz-current-workflow {
      margin-bottom: 12px;
    }
    
    .nz-no-workflow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 20px;
      color: #999;
      font-size: 13px;
      text-align: center;
    }
    
    .nz-no-workflow i {
      font-size: 16px;
    }
    
    .nz-workflow-info {
      background: rgba(40, 50, 70, 0.3);
      border: 1px solid rgba(100, 120, 180, 0.2);
      border-radius: 8px;
      padding: 12px;
    }
    
    .nz-workflow-name {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 8px;
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      background: linear-gradient(135deg, #6bb6ff, #4a9eff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .nz-workflow-name-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    
    .nz-workflow-name i {
      color: #6bb6ff;
      font-size: 18px;
    }
    
    .nz-name-text {
      color: #ffffff !important;
      background: linear-gradient(135deg, #6bb6ff, #4a9eff) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
      font-weight: 700 !important;
      font-size: 16px !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .nz-modified-indicator {
      color: #ff9999;
      font-size: 12px;
      margin-left: auto;
      display: none;
    }
    
    .nz-workflow-path,
    .nz-workflow-time {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 12px;
      color: #a0b0c0;
    }
    
    .nz-workflow-path i,
    .nz-workflow-time i {
      color: #8090a0;
      width: 12px;
    }
    
    .nz-path-text {
      font-size: 10px;
      opacity: 0.7;
    }
    

    
    /* 工作流操作按钮 */
    .nz-workflow-actions {
      display: flex;
      flex-direction: row;
      gap: 12px;
      margin-bottom: 8px;
      justify-content: center;
    }
    
    .nz-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      border: 1px solid rgba(100, 120, 180, 0.3);
      border-radius: 6px;
      background: rgba(40, 50, 70, 0.6);
      color: #e0f0ff;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s ease;
      text-align: center;
      flex: 1;
      min-width: 44px;
      height: 44px;
      position: relative;
    }
    
    .nz-action-btn:hover:not(:disabled) {
      background: rgba(60, 80, 120, 0.8);
      border-color: rgba(120, 140, 200, 0.4);
      transform: translateY(-1px);
    }
    
    .nz-action-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .nz-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba(30, 35, 45, 0.5);
    }
    
    .nz-action-btn.nz-loading {
      opacity: 0.7;
      cursor: wait;
    }
    
    .nz-collapsed-btn.nz-loading {
      opacity: 0.7;
      cursor: wait;
    }
    
    .nz-action-btn i {
      width: 16px;
      font-size: 16px;
      color: #6bb6ff;
    }
    
    .nz-action-btn span {
      font-size: 12px;
      font-weight: 500;
      margin-left: 6px;
      white-space: nowrap;
    }
    
    /* 折叠时的紧凑布局 */
    .nz-collapsed-layout {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      gap: 8px;
    }
    
    .nz-collapsed-filename {
      color: #e0f0ff;
      font-size: 13px;
      font-weight: 500;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: move;
      user-select: none;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background-color 0.2s ease;
      margin: -4px -8px;
    }
    
    .nz-collapsed-filename:hover {
      background: rgba(107, 182, 255, 0.1);
    }
    
    .nz-collapsed-filename.dragging {
      background: rgba(107, 182, 255, 0.2);
      color: #6bb6ff;
    }
    
    .nz-collapsed-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    
    .nz-collapsed-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid rgba(100, 120, 180, 0.3);
      border-radius: 4px;
      background: rgba(40, 50, 70, 0.6);
      color: #e0f0ff;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .nz-collapsed-btn:hover:not(:disabled) {
      background: rgba(60, 80, 120, 0.8);
      border-color: rgba(120, 140, 200, 0.4);
    }
    
    .nz-collapsed-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    .nz-collapsed-btn i {
      font-size: 12px;
    }
    
    .nz-collapsed-controls {
      display: flex;
      gap: 4px;
      align-items: center;
      margin-left: 8px;
    }
    
    .nz-collapsed-controls .nz-floating-btn {
      width: 28px;
      height: 28px;
    }
    
    .nz-collapsed-controls .nz-floating-btn i {
      font-size: 12px;
    }
    
    
    .nz-save-btn:hover:not(:disabled) {
      background: rgba(70, 130, 70, 0.8);
      border-color: rgba(100, 180, 100, 0.6);
    }
    
    .nz-save-btn i {
      color: #90ff90;
    }
    
    .nz-saveas-btn:hover:not(:disabled) {
      background: rgba(70, 90, 130, 0.8);
      border-color: rgba(100, 140, 200, 0.6);
    }
    
    /* 设置对话框样式 */
    .nz-settings-dialog {
      max-width: 600px;
      min-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .nz-settings-content {
      max-height: 60vh;
      overflow-y: auto;
      padding-right: 8px;
    }
    
    .nz-settings-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .nz-settings-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
    }
    
    .nz-settings-content::-webkit-scrollbar-thumb {
      background: rgba(100, 120, 180, 0.4);
      border-radius: 3px;
    }
    
    .nz-settings-section {
      margin-bottom: 24px;
      padding: 16px;
      background: rgba(40, 50, 70, 0.3);
      border: 1px solid rgba(100, 120, 180, 0.2);
      border-radius: 8px;
    }
    
    .nz-settings-section h4 {
      margin: 0 0 16px 0;
      color: #6bb6ff;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .nz-settings-section h4 i {
      font-size: 18px;
    }
    
    /* 插件信息网格 */
    .nz-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .nz-info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: rgba(60, 80, 120, 0.3);
      border-radius: 6px;
      border: 1px solid rgba(100, 120, 180, 0.2);
    }
    
    .nz-info-label {
      font-size: 13px;
      color: #b0c0d0;
      font-weight: 500;
    }
    
    .nz-info-value {
      font-size: 13px;
      color: #e0f0ff;
      font-weight: 600;
    }
    
    /* 主题选择器 */
    .nz-theme-selector {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .nz-theme-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border: 2px solid rgba(100, 120, 180, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(40, 50, 70, 0.3);
      min-width: 100px;
    }
    
    .nz-theme-option:hover {
      border-color: rgba(100, 120, 180, 0.4);
      background: rgba(60, 80, 120, 0.4);
    }
    
    .nz-theme-option input[type="radio"] {
      display: none;
    }
    
    .nz-theme-option input[type="radio"]:checked + .nz-theme-preview {
      border-color: #6bb6ff;
      box-shadow: 0 0 0 2px rgba(107, 182, 255, 0.3);
    }
    
    .nz-theme-option input[type="radio"]:checked ~ .nz-theme-name {
      color: #6bb6ff;
      font-weight: 600;
    }
    
    .nz-theme-preview {
      width: 40px;
      height: 30px;
      border: 2px solid rgba(100, 120, 180, 0.3);
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    
    .nz-theme-preview.nz-theme-auto {
      background: linear-gradient(45deg, 
        rgba(25, 30, 40, 0.9) 0%, rgba(25, 30, 40, 0.9) 50%,
        rgba(245, 247, 250, 0.9) 50%, rgba(245, 247, 250, 0.9) 100%);
    }
    
    .nz-theme-preview.nz-theme-dark {
      background: rgba(25, 30, 40, 0.9);
    }
    
    .nz-theme-preview.nz-theme-light {
      background: rgba(245, 247, 250, 0.9);
    }
    
    .nz-theme-name {
      font-size: 12px;
      color: #c0d0e0;
      text-align: center;
      transition: all 0.2s ease;
    }
    
    /* 功能设置 */
    .nz-feature-settings {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .nz-checkbox-option {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 12px;
      border: 1px solid rgba(100, 120, 180, 0.2);
      border-radius: 6px;
      background: rgba(60, 80, 120, 0.2);
      transition: all 0.2s ease;
    }
    
    .nz-checkbox-option:hover {
      background: rgba(80, 100, 140, 0.3);
      border-color: rgba(100, 120, 180, 0.4);
    }
    
    .nz-checkbox-option input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin: 0;
      accent-color: #6bb6ff;
    }
    
    .nz-checkbox-option .nz-checkbox-label {
      font-size: 14px;
      color: #e0f0ff;
      font-weight: 500;
      line-height: 1.4;
      flex: 1;
    }
    
    .nz-checkbox-option .nz-checkbox-desc {
      font-size: 12px;
      color: #b0c0d0;
      line-height: 1.3;
      margin-top: 4px;
      display: block;
    }
    
    /* 帮助内容 */
    .nz-help-content {
      font-size: 14px;
      line-height: 1.6;
      color: #c0d0e0;
    }
    
    .nz-help-content p {
      margin: 0 0 12px 0;
    }
    
    .nz-help-content ul {
      margin: 8px 0 16px 20px;
      padding: 0;
    }
    
    .nz-help-content li {
      margin: 4px 0;
    }
    
    .nz-help-content kbd {
      background: rgba(60, 80, 120, 0.6);
      border: 1px solid rgba(100, 120, 180, 0.3);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      color: #e0f0ff;
      margin: 0 2px;
    }
    
    .nz-help-content strong {
      color: #6bb6ff;
      font-weight: 600;
    }

  `;
  
  document.head.appendChild(style);
  console.log(`[${config.PLUGIN_NAME}] 管理器样式已添加`);
}



// ====== 通知显示函数 ======
// window.nzWorkflowManager.showNotification() 函数已迁移到 modules/ui/ui-manager.js
// 如需调用，请使用: window.nzWorkflowManager.showNotification()
// ✅ Stage4已完成：showNotification() 函数已迁移到 modules/ui/ui-manager.js
// 旧函数定义已删除，现通过 uiManager.showNotification() 调用

// ====== 初始化UI事件监听器 ======
// initializeUIEventListeners() 函数保留用于向后兼容和目录切换功能
// ✅ Stage4已完成：UI管理器已模块化，此函数将在Stage5一起处理
// TODO: Stage5 - 将此函数迁移到 modules/features/workflow-manager.js
function initializeUIEventListeners() {
  console.log(`[${config.PLUGIN_NAME}] 初始化事件监听器`);
  
  try {
    // 返回按钮事件
    const backBtn = document.getElementById('nz-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        console.log(`[${config.PLUGIN_NAME}] 返回按钮点击`);
        goBack();
      });
    }
    
    // 刷新按钮事件
    const refreshBtn = document.getElementById('nz-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log(`[${config.PLUGIN_NAME}] 刷新按钮点击`);
        loadDirectory(config.getCurrentPath());
      });
    }
    
    // 打开目录按钮事件
    const chooseDirBtn = document.getElementById('nz-choose-dir-btn');
    if (chooseDirBtn) {
      chooseDirBtn.addEventListener('click', () => {
        console.log(`[${config.PLUGIN_NAME}] 打开目录按钮点击`);
        chooseDirectory();
      });
    }
    
    // 新建文件夹按钮事件
    const newFolderBtn = document.getElementById('nz-new-folder-btn');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => {
        console.log(`[${config.PLUGIN_NAME}] 新建文件夹按钮点击`);
        createNewFolder();
      });
    }
    
    // 浮动管理器按钮事件
    const floatingManagerBtn = document.getElementById('nz-floating-manager-btn');
    if (floatingManagerBtn) {
      floatingManagerBtn.addEventListener('click', () => {
        console.log(`[${config.PLUGIN_NAME}] 浮动管理器按钮点击`);
        toggleFloatingManager();
      });
    }
    
    // 设置按钮事件
    const settingsBtn = document.getElementById('nz-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        console.log(`[${config.PLUGIN_NAME}] 设置按钮点击`);
        
        // 检查DialogManager是否已初始化，如果没有则等待
        const tryShowDialog = () => {
          if (window.nzDialogManager) {
            console.log(`[${config.PLUGIN_NAME}] DialogManager已就绪，显示设置对话框`);
            window.nzDialogManager.showSettingsDialog();
          } else {
            console.log(`[${config.PLUGIN_NAME}] DialogManager未就绪，等待100ms后重试`);
            setTimeout(tryShowDialog, 100);
          }
        };
        
        tryShowDialog();
      });
    }
    
    // 重要信息按钮事件
    const importantInfoBtn = document.getElementById('nz-important-info-btn');
    if (importantInfoBtn) {
      importantInfoBtn.addEventListener('click', () => {
        console.log(`[${config.PLUGIN_NAME}] 重要信息按钮点击`);
        
        // 检查DialogManager是否已初始化，如果没有则等待
        const tryShowDialog = () => {
          if (window.nzDialogManager) {
            console.log(`[${config.PLUGIN_NAME}] DialogManager已就绪，显示重要信息对话框`);
            window.nzDialogManager.showImportantInfoDialog();
          } else {
            console.log(`[${config.PLUGIN_NAME}] DialogManager未就绪，等待100ms后重试`);
            setTimeout(tryShowDialog, 100);
          }
        };
        
        tryShowDialog();
      });
    }
    
    // 设置关闭按钮事件
    const settingsCloseBtn = document.querySelector('.nz-settings-close-btn');
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', () => {
        console.log(`[${config.PLUGIN_NAME}] 设置关闭按钮点击`);
        hideSettingsPanel();
      });
    }
    

    
    // 多选按钮事件
    const multiSelectBtn = document.getElementById('nz-multi-select-btn');
    const multiSelectMenu = document.getElementById('nz-multi-select-menu');
    if (multiSelectBtn && multiSelectMenu) {
      multiSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`[${config.PLUGIN_NAME}] 多选按钮点击`);
        
        // 如果当前处于多选模式，退出多选模式（红框按钮功能）
        if (multiSelectManager.isMultiSelectMode()) {
          console.log(`[${config.PLUGIN_NAME}] 通过多选按钮退出多选模式`);
          multiSelectManager.setMultiSelectMode(false);
        } else {
          // 否则进入多选模式
          multiSelectManager.toggleMultiSelectMode();
        }
      });
      
      // 多选菜单项事件
      multiSelectMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.nz-menu-item');
        if (menuItem) {
          const action = menuItem.dataset.action;
          console.log(`[${config.PLUGIN_NAME}] 多选菜单操作: ${action}`);
          handleMultiSelectAction(action);
          hideMultiSelectMenu();
        }
      });
      
      // 点击其他地方时隐藏菜单
      document.addEventListener('click', (e) => {
        if (!multiSelectBtn.contains(e.target) && !multiSelectMenu.contains(e.target)) {
          hideMultiSelectMenu();
        }
      });
    }
    
    console.log(`[${config.PLUGIN_NAME}] 事件监听器初始化完成`);
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 事件监听器初始化失败:`, error);
  }
}

// ====== 新建文件夹功能 ======
function createNewFolder() {
  console.log(`[${config.PLUGIN_NAME}] 新建文件夹功能被调用`);
  
  if (!config.getCurrentPath()) {
    window.nzWorkflowManager.showNotification('请先选择一个目录', 'warning');
    return;
  }
  
  // 使用上下文菜单管理器的创建目录功能
  if (typeof contextMenuManager !== 'undefined' && contextMenuManager) {
    contextMenuManager.createDirectory(config.getCurrentPath());
  } else {
    window.nzWorkflowManager.showNotification('功能暂时不可用', 'error');
  }
}



// ====== 多选菜单功能 ======
function toggleMultiSelectMenu() {
  const multiSelectBtn = document.getElementById('nz-multi-select-btn');
  const multiSelectMenu = document.getElementById('nz-multi-select-menu');
  
  if (multiSelectMenu.style.display === 'none' || !multiSelectMenu.style.display) {
    showMultiSelectMenu();
  } else {
    hideMultiSelectMenu();
  }
}

async function showMultiSelectMenu() {
  const multiSelectBtn = document.getElementById('nz-multi-select-btn');
  const multiSelectMenu = document.getElementById('nz-multi-select-menu');
  
  // 清空现有菜单内容
  multiSelectMenu.innerHTML = '';
  
  // 获取选中的项目
  const selectedItems = multiSelectManager.getSelectedItems();
  const hasSelection = selectedItems.length > 0;
  
  // 获取目录列表用于子菜单（包含历史目录）
  const directories = await contextMenuManager.getDirectoryList(config.getCurrentPath());
  
  // 创建菜单项数据
  const menuData = [
    {
      icon: 'pi-copy',
      label: '复制选中项',
      enabled: hasSelection,
      submenu: hasSelection ? [
        {
          label: '📁 选择其他目录...',
          action: () => {
            hideMultiSelectMenu();
            showMultiSelectCopyDialog(selectedItems);
          }
        },
        { separator: true },
        ...directories.slice(0, 6).map(dir => ({
          label: dir.name,
          action: () => {
            hideMultiSelectMenu();
            performBatchCopy(selectedItems, dir.path);
          }
        }))
      ] : null
    },
    {
      icon: 'pi-arrow-right',
      label: '移动选中项',
      enabled: hasSelection,
      submenu: hasSelection ? [
        {
          label: '📁 选择其他目录...',
          action: () => {
            hideMultiSelectMenu();
            showMultiSelectMoveDialog(selectedItems);
          }
        },
        { separator: true },
        ...directories.slice(0, 6).map(dir => ({
          label: dir.name,
          action: () => {
            hideMultiSelectMenu();
            performBatchMove(selectedItems, dir.path);
          }
        }))
      ] : null
    },
    {
      icon: 'pi-trash',
      label: '删除选中项',
      enabled: hasSelection,
      action: () => {
        hideMultiSelectMenu();
        handleMultiSelectAction('delete');
      }
    },
    { separator: true },
    {
      icon: 'pi-check',
      label: '全选',
      enabled: true,
      action: () => {
        hideMultiSelectMenu();
        handleMultiSelectAction('select-all');
      }
    },
    {
      icon: 'pi-refresh',
      label: '反选',
      enabled: true,
      action: () => {
        hideMultiSelectMenu();
        handleMultiSelectAction('invert');
      }
    },
    {
      icon: 'pi-times',
      label: '清除选择',
      enabled: hasSelection,
      action: () => {
        hideMultiSelectMenu();
        handleMultiSelectAction('clear');
      }
    },
    { separator: true },
    {
      icon: 'pi-sign-out',
      label: '退出多选模式',
      enabled: true,
      action: () => {
        hideMultiSelectMenu();
        handleMultiSelectAction('exit-mode');
      }
    }
  ];
  
  // 生成菜单HTML
  menuData.forEach(item => {
    if (item.separator) {
      const separator = document.createElement('div');
      separator.className = 'nz-menu-separator';
      multiSelectMenu.appendChild(separator);
    } else {
      const menuItem = document.createElement('div');
      menuItem.className = 'nz-menu-item';
      
      if (!item.enabled) {
        menuItem.style.opacity = '0.5';
        menuItem.style.pointerEvents = 'none';
      }
      
      // 如果有子菜单，添加相应的类和结构
      if (item.submenu && item.enabled) {
        menuItem.classList.add('has-submenu');
        
        // 主菜单项内容
        const mainContent = document.createElement('div');
        mainContent.style.display = 'flex';
        mainContent.style.alignItems = 'center';
        mainContent.style.justifyContent = 'space-between';
        mainContent.style.width = '100%';
        
        const contentLeft = document.createElement('div');
        contentLeft.style.display = 'flex';
        contentLeft.style.alignItems = 'center';
        contentLeft.innerHTML = `<i class="pi ${item.icon}"></i><span>${item.label}</span>`;
        
        const arrow = document.createElement('span');
        arrow.textContent = '▶';
        arrow.style.fontSize = '10px';
        arrow.style.opacity = '0.7';
        
        mainContent.appendChild(contentLeft);
        mainContent.appendChild(arrow);
        menuItem.appendChild(mainContent);
        
        // 创建子菜单
        const submenu = document.createElement('div');
        submenu.className = 'nz-context-submenu';
        submenu.style.position = 'absolute';
        submenu.style.left = '100%';
        submenu.style.top = '0';
        submenu.style.display = 'none';
        
        item.submenu.forEach(subItem => {
          if (subItem.separator) {
            const subSeparator = document.createElement('div');
            subSeparator.className = 'nz-menu-separator';
            submenu.appendChild(subSeparator);
          } else {
            const subMenuItem = document.createElement('div');
            subMenuItem.className = 'nz-context-submenu-item';
            subMenuItem.textContent = subItem.label;
            subMenuItem.onclick = (e) => {
              e.stopPropagation();
              subItem.action();
            };
            submenu.appendChild(subMenuItem);
          }
        });
        
        menuItem.appendChild(submenu);
        
        // 鼠标悬停显示子菜单
        menuItem.addEventListener('mouseenter', () => {
          submenu.style.display = 'block';
        });
        
        menuItem.addEventListener('mouseleave', () => {
          submenu.style.display = 'none';
        });
      } else if (item.action) {
        // 普通菜单项
        menuItem.innerHTML = `<i class="pi ${item.icon}"></i><span>${item.label}</span>`;
        
        if (item.enabled) {
          menuItem.onclick = item.action;
        }
      }
      
      multiSelectMenu.appendChild(menuItem);
    }
  });
  
  multiSelectMenu.style.display = 'block';
  multiSelectBtn.classList.add('active');
}

function hideMultiSelectMenu() {
  const multiSelectBtn = document.getElementById('nz-multi-select-btn');
  const multiSelectMenu = document.getElementById('nz-multi-select-menu');
  
  if (multiSelectMenu) {
    multiSelectMenu.style.display = 'none';
  }
  if (multiSelectBtn) {
    multiSelectBtn.classList.remove('active');
  }
}

// 已移除 updateMultiSelectMenuItems 函数，现在菜单是动态生成的

function handleMultiSelectAction(action) {
  const selectedItems = multiSelectManager.getSelectedItems();
  
  switch (action) {
    case 'copy':
      if (selectedItems.length > 0) {
        showMultiSelectCopyDialog(selectedItems);
      }
      break;
      
    case 'move':
      if (selectedItems.length > 0) {
        showMultiSelectMoveDialog(selectedItems);
      }
      break;
      
    case 'delete':
      if (selectedItems.length > 0) {
        showMultiSelectDeleteDialog(selectedItems);
      }
      break;
      
    case 'select-all':
      selectAllItems();
      break;
      
    case 'invert':
      invertSelection();
      break;
      
    case 'clear':
      multiSelectManager.clearSelection();
      break;
      
    case 'exit-mode':
      multiSelectManager.setMultiSelectMode(false);
      break;
  }
}

function selectAllItems() {
  const fileItems = document.querySelectorAll('.nz-file-item');
  fileItems.forEach(item => {
    const filePath = item.dataset.filePath;
    if (filePath) {
      const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
      const itemType = item.classList.contains('folder') ? 'directory' : 'file';
      multiSelectManager.addToSelection(item, filePath, fileName, itemType);
    }
  });
  window.nzWorkflowManager.showNotification(`已选择 ${fileItems.length} 个项目`, 'info');
}

function invertSelection() {
  const fileItems = document.querySelectorAll('.nz-file-item');
  const selectedItems = multiSelectManager.getSelectedItems();
  const selectedPaths = new Set(selectedItems.map(item => item.filePath));
  
  let invertedCount = 0;
  
  fileItems.forEach(item => {
    const filePath = item.dataset.filePath;
    if (filePath) {
      const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
      const itemType = item.classList.contains('folder') ? 'directory' : 'file';
      const itemId = `${itemType}:${filePath}`;
      
      if (selectedPaths.has(filePath)) {
        // 如果已选中，取消选择
        multiSelectManager.deselectItem(item, itemId);
      } else {
        // 如果未选中，选择它
        multiSelectManager.selectItem(item, itemId, filePath, fileName, itemType);
        invertedCount++;
      }
    }
  });
  
  const newSelectedCount = multiSelectManager.getSelectedItems().length;
  window.nzWorkflowManager.showNotification(`反选完成，当前选择 ${newSelectedCount} 个项目`, 'info');
}

async function showMultiSelectCopyDialog(selectedItems) {
  // 获取目录列表用于菜单（包含历史目录）
  const directories = await contextMenuManager.getDirectoryList(config.getCurrentPath());
  console.log(`[${config.PLUGIN_NAME}] 📁 获取到的目录列表:`, directories);
  
  // 创建层级菜单
  const menuItems = [
    {
      label: '📁 选择其他目录...',
      action: () => {
        window.dialogManager.showDirectoryTreeChooser((targetPath) => {
          console.log(`[${config.PLUGIN_NAME}] 批量复制到: ${targetPath}`);
          performBatchCopy(selectedItems, targetPath);
        });
      }
    },
    { separator: true },
    ...directories.slice(0, 8).map(dir => ({
      label: dir.name,
      action: () => {
        console.log(`[${config.PLUGIN_NAME}] 批量复制到: ${dir.path}`);
        performBatchCopy(selectedItems, dir.path);
      }
    }))
  ];
  
  // 显示简单的选择菜单
  showDirectorySelectionMenu(menuItems, '选择复制目标目录');
}

async function showMultiSelectMoveDialog(selectedItems) {
  // 获取目录列表用于菜单（包含历史目录）
  const directories = await contextMenuManager.getDirectoryList(config.getCurrentPath());
  console.log(`[${config.PLUGIN_NAME}] 📁 获取到的目录列表 (移动):`, directories);
  
  // 创建层级菜单
  const menuItems = [
    {
      label: '📁 选择其他目录...',
      action: () => {
        window.dialogManager.showDirectoryTreeChooser((targetPath) => {
          console.log(`[${config.PLUGIN_NAME}] 批量移动到: ${targetPath}`);
          performBatchMove(selectedItems, targetPath);
        });
      }
    },
    { separator: true },
    ...directories.slice(0, 8).map(dir => ({
      label: dir.name,
      action: () => {
        console.log(`[${config.PLUGIN_NAME}] 批量移动到: ${dir.path}`);
        performBatchMove(selectedItems, dir.path);
      }
    }))
  ];
  
  // 显示简单的选择菜单
  showDirectorySelectionMenu(menuItems, '选择移动目标目录');
}

// 检查路径是否为目录（临时函数，Stage7将删除）
async function isDirectoryPath(path) {
  try {
    // 优先使用模块化的方法
    if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
      const interactionSystem = window.nzWorkflowManager.interactionSystem;
      if (interactionSystem.isDirectoryPath) {
        return await interactionSystem.isDirectoryPath(path);
      }
    }
    
    // 降级：如果有fileOperationsAPI，使用新的准确方法
    if (typeof fileOperationsAPI !== 'undefined' && fileOperationsAPI.getPathInfo) {
      const pathInfo = await fileOperationsAPI.getPathInfo(path);
      if (pathInfo.exists) {
        return pathInfo.isDirectory;
      }
      
      // 如果路径不存在，使用扩展名进行启发式判断
      return !/\.[^/.]+$/.test(path);
    }
    
    // 最后降级到简单的扩展名检查
    return !/\.[^/.]+$/.test(path);
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 检查路径类型失败:`, error);
    return !/\.[^/.]+$/.test(path);
  }
}

// 显示目录选择菜单（简单版本）
function showDirectorySelectionMenu(menuItems, title) {
  // 创建菜单覆盖层
  const overlay = document.createElement('div');
  overlay.className = 'nz-dialog-overlay';
  overlay.style.zIndex = '10003';
  
  // 创建菜单容器
  const menuContainer = document.createElement('div');
  menuContainer.className = 'nz-dialog';
  menuContainer.style.maxWidth = '350px';
  menuContainer.style.maxHeight = '450px';
  menuContainer.style.overflow = 'hidden';
  
  // 创建标题
  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  titleElement.style.margin = '0 0 16px 0';
  titleElement.style.padding = '0';
  titleElement.style.fontSize = '16px';
  titleElement.style.color = 'var(--fg-color, #e0f0ff)';
  menuContainer.appendChild(titleElement);
  
  // 创建选择状态指示器
  const selectionIndicator = document.createElement('div');
  selectionIndicator.style.margin = '0 0 12px 0';
  selectionIndicator.style.padding = '8px 12px';
  selectionIndicator.style.backgroundColor = 'rgba(74, 158, 255, 0.1)';
  selectionIndicator.style.border = '1px solid rgba(74, 158, 255, 0.3)';
  selectionIndicator.style.borderRadius = '4px';
  selectionIndicator.style.fontSize = '13px';
  selectionIndicator.style.color = 'var(--fg-color, #e0f0ff)';
  selectionIndicator.style.display = 'none'; // 初始隐藏
  selectionIndicator.innerHTML = '<span style="color: #4a9eff;">📁</span> <span id="selected-dir-name">未选择</span>';
  menuContainer.appendChild(selectionIndicator);
  
  // 创建菜单列表
  const menuList = document.createElement('div');
  menuList.style.maxHeight = '320px';
  menuList.style.overflowY = 'auto';
  menuList.style.padding = '4px';
  
  let selectedMenuItem = null; // 记录当前选中的菜单项
  let confirmButton = null; // 确认按钮引用
  
  menuItems.forEach((item, index) => {
    if (item.separator) {
      const separator = document.createElement('div');
      separator.style.height = '1px';
      separator.style.background = 'var(--border-color, rgba(100, 120, 180, 0.2))';
      separator.style.margin = '8px 0';
      menuList.appendChild(separator);
    } else {
      const menuItem = document.createElement('button');
      menuItem.className = 'nz-context-menu-item';
      menuItem.textContent = item.label;
      menuItem.dataset.index = index;
      
      // 点击选择事件
      menuItem.onclick = (e) => {
        e.stopPropagation();
        
        // 清除之前的选中状态
        if (selectedMenuItem) {
          selectedMenuItem.classList.remove('selected');
        }
        
        // 设置新的选中状态 - 多重保护
        menuItem.classList.add('selected');
        menuItem.classList.add('selected'); // 双重添加确保生效
        menuItem.setAttribute('data-selected', 'true'); // 备用标记
        selectedMenuItem = menuItem;
        
        // 强制重绘以确保样式生效
        menuItem.offsetHeight; // 触发重绘
        
        // 确保样式真正应用
        requestAnimationFrame(() => {
          menuItem.classList.add('selected');
          menuItem.style.setProperty('background', 'linear-gradient(135deg, rgba(74, 158, 255, 0.8), rgba(100, 180, 255, 0.7))', 'important');
          menuItem.style.setProperty('border', '3px solid rgba(74, 158, 255, 1)', 'important');
        });
        
        // 启用确认按钮并显示选中的目录名
        if (confirmButton) {
          confirmButton.disabled = false;
          confirmButton.style.opacity = '1';
          confirmButton.style.cursor = 'pointer';
          confirmButton.textContent = `确定 (${item.label})`;
        }
        
        // 更新选择状态指示器
        const selectedDirName = selectionIndicator.querySelector('#selected-dir-name');
        if (selectedDirName) {
          selectedDirName.textContent = `已选择: ${item.label}`;
          selectedDirName.style.color = '#4a9eff';
          selectedDirName.style.fontWeight = 'bold';
        }
        selectionIndicator.style.display = 'block';
        
        // 调试信息
        console.log('Menu item selected:', item.label, 'Classes:', menuItem.className);
        console.log('Selected state immediately after:', menuItem.classList.contains('selected'));
        
        // 延迟检查状态是否持久
            setTimeout(() => {
          console.log('After 100ms - Selected state:', menuItem.classList.contains('selected'), 'Classes:', menuItem.className);
        }, 100);
        
        setTimeout(() => {
          console.log('After 500ms - Selected state:', menuItem.classList.contains('selected'), 'Classes:', menuItem.className);
        }, 500);
      };
      
      // 双击直接执行
      menuItem.ondblclick = () => {
        overlay.remove();
        item.action();
      };
      
      menuList.appendChild(menuItem);
    }
  });
  
  menuContainer.appendChild(menuList);
  
  // 创建按钮区域
  const buttonContainer = document.createElement('div');
  buttonContainer.style.marginTop = '16px';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'flex-end';
  buttonContainer.style.gap = '8px';
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'nz-dialog-button';
  cancelButton.textContent = '取消';
  cancelButton.onclick = () => overlay.remove();
  
  confirmButton = document.createElement('button');
  confirmButton.className = 'nz-dialog-button primary';
  confirmButton.textContent = '确定';
  confirmButton.disabled = true;
  confirmButton.style.opacity = '0.5';
  confirmButton.style.cursor = 'not-allowed';
  confirmButton.onclick = () => {
    if (selectedMenuItem) {
      const index = parseInt(selectedMenuItem.dataset.index);
      const selectedItem = menuItems.filter(item => !item.separator)[index];
      overlay.remove();
      selectedItem.action();
    }
  };
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(confirmButton);
  menuContainer.appendChild(buttonContainer);
  
  overlay.appendChild(menuContainer);
  document.body.appendChild(overlay);
  
  // 点击覆盖层关闭
  overlay.addEventListener('click', (e) => {
    console.log('Overlay click event:', e.target, 'Is overlay:', e.target === overlay);
    if (e.target === overlay) {
      console.log('Removing overlay due to overlay click');
      overlay.remove();
    }
  });
  
  // 键盘导航支持
  overlay.addEventListener('keydown', (e) => {
    const menuItemElements = menuList.querySelectorAll('.nz-context-menu-item');
    const currentIndex = selectedMenuItem ? Array.from(menuItemElements).indexOf(selectedMenuItem) : -1;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % menuItemElements.length;
        menuItemElements[nextIndex].click();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? menuItemElements.length - 1 : currentIndex - 1;
        menuItemElements[prevIndex].click();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedMenuItem) {
          confirmButton.click();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        cancelButton.click();
        break;
    }
  });
  
  // 聚焦到对话框以支持键盘导航
  overlay.focus();
  overlay.tabIndex = -1;
}

function showMultiSelectDeleteDialog(selectedItems) {
  const itemNames = selectedItems.map(item => item.name).join('\n');
  const message = `确定要删除以下 ${selectedItems.length} 个项目吗？\n\n${itemNames}`;
  
  window.dialogManager.showConfirm('批量删除', message).then((confirmed) => {
    if (confirmed) {
    performBatchDelete(selectedItems);
    }
  });
}

async function performBatchCopy(selectedItems, targetPath) {
  window.nzWorkflowManager.showNotification(`正在复制 ${selectedItems.length} 个项目...`, 'info');
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  let cancelledAll = false;
  let globalConflictChoice = null; // 用于存储"应用到所有"的选择
  
  for (const item of selectedItems) {
    try {
      // 如果用户选择了取消全部操作，停止处理
      if (cancelledAll) {
        break;
      }
      
      // 检查是文件还是目录
      const isDirectory = await isDirectoryPath(item.filePath);
      
      // 如果有全局冲突选择，传递给文件操作API
      const options = globalConflictChoice ? { globalConflictChoice } : {};
      let result;
      if (isDirectory) {
        result = await fileOperationsAPI.copyDirectory(item.filePath, targetPath, null, options);
      } else {
        result = await fileOperationsAPI.copyFile(item.filePath, targetPath, null, options);
      }
      
      if (result && result.success) {
        successCount++;
        console.log(`[${config.PLUGIN_NAME}] 成功复制: ${item.fileName}`);
      } else if (result && result.conflictResult) {
        // 处理冲突结果
        const conflictResult = result.conflictResult;
        
        if (conflictResult.action === 'cancel') {
          cancelledAll = true;
          console.log(`[${config.PLUGIN_NAME}] 用户取消全部复制操作`);
          break;
        } else if (conflictResult.action === 'skip') {
          skipCount++;
          console.log(`[${config.PLUGIN_NAME}] 跳过复制: ${item.fileName}`);
          
          // 如果用户选择了"应用到所有"，保存这个选择
          if (conflictResult.applyToAll) {
            globalConflictChoice = conflictResult;
          }
        } else {
          // replace 或 rename 操作已由API处理
          successCount++;
          console.log(`[${config.PLUGIN_NAME}] 成功复制 (${conflictResult.action}): ${item.fileName}`);
          
          // 如果用户选择了"应用到所有"，保存这个选择
          if (conflictResult.applyToAll) {
            globalConflictChoice = conflictResult;
          }
        }
      } else {
        // 检查是否是用户取消操作
        if (result && result.error && result.error.includes('用户取消操作')) {
          console.log(`[${config.PLUGIN_NAME}] 用户取消复制: ${item.fileName}`);
          break;
      } else {
        failCount++;
          console.error(`[${config.PLUGIN_NAME}] 复制失败: ${item.fileName}`, result?.error);
        }
      }
    } catch (error) {
      failCount++;
      console.error(`[${config.PLUGIN_NAME}] 复制异常: ${item.fileName}`, error);
    }
  }
  
  // 显示结果
  if (cancelledAll) {
    window.nzWorkflowManager.showNotification(`批量复制已取消`, 'info');
  } else if (failCount === 0 && skipCount === 0) {
    window.nzWorkflowManager.showNotification(`成功复制 ${successCount} 个项目`, 'success');
  } else {
    let message = `复制完成：成功 ${successCount} 个`;
    if (skipCount > 0) message += `，跳过 ${skipCount} 个`;
    if (failCount > 0) message += `，失败 ${failCount} 个`;
    window.nzWorkflowManager.showNotification(message, 'warning');
  }
  
  // 清除选择，但保持多选模式
  multiSelectManager.clearSelection();
  
  // 确保多选按钮状态正确
  setTimeout(() => {
    if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
      multiSelectManager.updateMultiSelectButtonState();
    }
            }, 100);
}

async function performBatchMove(selectedItems, targetPath) {
  window.nzWorkflowManager.showNotification(`正在移动 ${selectedItems.length} 个项目...`, 'info');
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  let cancelledAll = false;
  let globalConflictChoice = null; // 用于存储"应用到所有"的选择
  
  for (const item of selectedItems) {
    try {
      // 如果用户选择了取消全部操作，停止处理
      if (cancelledAll) {
        break;
      }
      
      // 检查是文件还是目录
      const isDirectory = await isDirectoryPath(item.filePath);
      
      // 如果有全局冲突选择，传递给文件操作API
      const options = globalConflictChoice ? { globalConflictChoice } : {};
      let result;
      if (isDirectory) {
        result = await fileOperationsAPI.moveDirectory(item.filePath, targetPath, null, options);
      } else {
        result = await fileOperationsAPI.moveFile(item.filePath, targetPath, options);
      }
      
      if (result && result.success) {
        successCount++;
        console.log(`[${config.PLUGIN_NAME}] 成功移动: ${item.fileName}`);
      } else if (result && result.conflictResult) {
        // 处理冲突结果
        const conflictResult = result.conflictResult;
        
        if (conflictResult.action === 'cancel') {
          cancelledAll = true;
          console.log(`[${config.PLUGIN_NAME}] 用户取消全部移动操作`);
          break;
        } else if (conflictResult.action === 'skip') {
          skipCount++;
          console.log(`[${config.PLUGIN_NAME}] 跳过移动: ${item.fileName}`);
          
          // 如果用户选择了"应用到所有"，保存这个选择
          if (conflictResult.applyToAll) {
            globalConflictChoice = conflictResult;
          }
        } else {
          // replace 或 rename 操作已由API处理
          successCount++;
          console.log(`[${config.PLUGIN_NAME}] 成功移动 (${conflictResult.action}): ${item.fileName}`);
          
          // 如果用户选择了"应用到所有"，保存这个选择
          if (conflictResult.applyToAll) {
            globalConflictChoice = conflictResult;
          }
        }
      } else {
        // 检查是否是用户取消操作
        if (result && result.error && result.error.includes('用户取消操作')) {
          console.log(`[${config.PLUGIN_NAME}] 用户取消移动: ${item.fileName}`);
          break;
      } else {
        failCount++;
          console.error(`[${config.PLUGIN_NAME}] 移动失败: ${item.fileName}`, result?.error);
        }
      }
    } catch (error) {
      failCount++;
      console.error(`[${config.PLUGIN_NAME}] 移动异常: ${item.fileName}`, error);
    }
  }
  
  // 显示结果
  if (cancelledAll) {
    window.nzWorkflowManager.showNotification(`批量移动已取消`, 'info');
  } else if (failCount === 0 && skipCount === 0) {
    window.nzWorkflowManager.showNotification(`成功移动 ${successCount} 个项目`, 'success');
  } else {
    let message = `移动完成：成功 ${successCount} 个`;
    if (skipCount > 0) message += `，跳过 ${skipCount} 个`;
    if (failCount > 0) message += `，失败 ${failCount} 个`;
    window.nzWorkflowManager.showNotification(message, 'warning');
  }
  
  // 清除选择并刷新目标目录，但保持多选模式
  multiSelectManager.clearSelection();
  console.log(`[${config.PLUGIN_NAME}] 批量移动后刷新目标目录: ${targetPath}`);
  loadDirectory(targetPath);
  
  // 确保多选按钮状态正确
  setTimeout(() => {
    if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
      multiSelectManager.updateMultiSelectButtonState();
          }
        }, 100);
}

async function performBatchDelete(selectedItems) {
  window.nzWorkflowManager.showNotification(`正在删除 ${selectedItems.length} 个项目...`, 'info');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const item of selectedItems) {
    try {
      let result;
      if (item.type === 'file') {
        result = await fileOperationsAPI.deleteFile(item.filePath);
      } else {
        result = await fileOperationsAPI.deleteDirectory(item.filePath);
      }
      
      if (result && result.success) {
        successCount++;
        console.log(`[${config.PLUGIN_NAME}] 成功删除: ${item.fileName}`);
      } else {
        failCount++;
        console.error(`[${config.PLUGIN_NAME}] 删除失败: ${item.fileName}`, result?.error);
      }
  } catch (error) {
      failCount++;
      console.error(`[${config.PLUGIN_NAME}] 删除异常: ${item.fileName}`, error);
    }
  }
  
  if (successCount > 0) {
    window.nzWorkflowManager.showNotification(`成功删除 ${successCount} 个项目${failCount > 0 ? `，${failCount} 个失败` : ''}`, 'success');
  } else {
    window.nzWorkflowManager.showNotification(`删除失败`, 'error');
  }
  
  // 清除选择并刷新
  multiSelectManager.clearSelection();
  loadDirectory(config.getCurrentPath());
}

// ====== 选择目录功能 ======
// ✅ Stage5已完成: chooseDirectory() 函数已迁移到 modules/features/workflow-manager.js
function chooseDirectory() {
  console.log(`[${config.PLUGIN_NAME}] 选择目录功能被调用`);
  
  try {
    // 在ComfyUI环境中，使用内置的文件选择器
    if (typeof app !== 'undefined' && app.filePicker) {
      console.log(`[${config.PLUGIN_NAME}] 使用ComfyUI文件选择器`);
      
      app.filePicker.show({
        title: "设置默认工作流目录",
        type: "directory",
        callback: (path) => {
          if (path) {
            console.log(`[${config.PLUGIN_NAME}] 选择的目录: ${path}`);
            saveDefaultDirectory(path);
            
            // 重新加载界面以更新UI
            setTimeout(() => {
              const container = document.querySelector('.nz-manager').parentElement;
              if (container && uiManager) {
                // 使用UI管理器的模块化方法
                uiManager.createManagerInterface(container);
                uiManager.initializeUIEventListeners();
                
                // 确保加载新目录
                setTimeout(() => {
                  loadDirectory(path);
                }, 100);
              }
            }, 100);
          } else {
            console.log(`[${config.PLUGIN_NAME}] 目录选择已取消`);
          }
        }
      });
    } else {
      // 备用方案：模拟目录选择
      console.log(`[${config.PLUGIN_NAME}] 使用模拟目录选择器`);
      simulateDirectorySelection();
    }
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 目录选择失败:`, error);
    simulateDirectorySelection();
  }
}

// ====== 模拟目录选择 ======
function simulateDirectorySelection() {
  console.log(`[${config.PLUGIN_NAME}] 模拟目录选择`);
  
  // 创建模拟的目录选择界面
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  modal.innerHTML = `
    <div style="background: #2a2f3b; padding: 20px; border-radius: 8px; width: 400px;">
      <h3 style="margin-top: 0; color: #6ecbfb;">设置默认工作流目录</h3>
      <p style="color: #e0f0ff; margin-bottom: 10px;">请输入目录路径:</p>
      <input type="text" id="nz-dir-input" style="width: 100%; padding: 8px; margin-bottom: 15px; background: #1a1f2b; color: white; border: 1px solid #3a3f4b; border-radius: 4px;" placeholder="D:\\共享网盘-Zero\\000.工作流参考\\My_workspace - backup1\\000.我的文件夹">
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="nz-dir-cancel" style="padding: 8px 16px; background: #4a4f5b; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
        <button id="nz-dir-confirm" style="padding: 8px 16px; background: #4a67e3; color: white; border: none; border-radius: 4px; cursor: pointer;">设置为默认目录</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 添加事件监听
  document.getElementById('nz-dir-cancel').addEventListener('click', () => {
    document.body.removeChild(modal);
    console.log(`[${config.PLUGIN_NAME}] 目录选择已取消`);
  });
  
  document.getElementById('nz-dir-confirm').addEventListener('click', () => {
    const dirPath = document.getElementById('nz-dir-input').value;
    if (dirPath) {
      console.log(`[${config.PLUGIN_NAME}] 选择的目录: ${dirPath}`);
      saveDefaultDirectory(dirPath);
      
      // 重新加载界面以更新UI
      setTimeout(() => {
        const container = document.querySelector('.nz-manager').parentElement;
        if (container && uiManager) {
          // 使用UI管理器的模块化方法
          uiManager.createManagerInterface(container);
          uiManager.initializeUIEventListeners();
          
          // 确保加载新目录
          setTimeout(() => {
            loadDirectory(dirPath);
          }, 100);
        }
      }, 100);
    }
    document.body.removeChild(modal);
  });
  
  // 自动聚焦输入框
  setTimeout(() => {
    const input = document.getElementById('nz-dir-input');
    if (input) input.focus();
  }, 100);
}

// ====== 检查服务器连接 ======
async function checkServerConnection() {
  try {
    const response = await fetch(`${window.location.origin}/system_stats`, {
      method: 'GET',
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    console.log(`[${config.PLUGIN_NAME}] 服务器连接检查失败:`, error.message);
    return false;
  }
}

// ====== 加载目录（会更新历史记录） ======
// ✅ Stage5已完成: loadDirectory() 函数已迁移到 modules/features/workflow-manager.js
// 如需调用，请使用: workflowManager.loadDirectory(path) 或 window.nzWorkflowManager.loadDirectory(path)
function loadDirectory(path = "") {
  console.log(`[${config.PLUGIN_NAME}] 加载目录: ${path}`);
  
  try {
    // 如果没有提供路径，使用默认目录
    if (!path && defaultDirectory) {
      path = defaultDirectory;
      console.log(`[${config.PLUGIN_NAME}] 使用默认目录: ${path}`);
    }
    
    // 如果仍然没有路径，显示提示信息
    if (!path) {
      console.log(`[${config.PLUGIN_NAME}] 没有设置目录，显示提示信息`);
      window.nzWorkflowManager.displayNoDirectoryMessage();
      return;
    }
    
    // 更新当前路径和历史记录（只有在用户主动导航时才更新历史）
    if (path !== config.getCurrentPath() && config.getCurrentPath()) {
      config.addToPathHistory(config.getCurrentPath());
      console.log(`[${config.PLUGIN_NAME}] 路径历史记录已更新: [${config.getPathHistory().join(' -> ')}]`);
    }
    config.setCurrentPath(path);
    
    // 更新路径显示
    const pathDisplay = document.getElementById('nz-current-path');
    if (pathDisplay) {
      pathDisplay.textContent = path;
    }
    
    // 更新返回按钮状态
    window.nzWorkflowManager.updateBackButtonState();
    
    // 显示加载状态
    const contentElement = document.getElementById('nz-content');
    if (contentElement) {
      contentElement.querySelector('.loading-overlay').style.display = 'block';
      contentElement.querySelector('.file-grid').style.display = 'none';
      contentElement.querySelector('.empty-state').style.display = 'none';
    }
    
    // 优先使用HTTP端点（已验证可用）
    console.log(`[${config.PLUGIN_NAME}] 加载目录: ${path}`);
    
    fetch(`${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(path)}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .then(data => {
        console.log(`[${config.PLUGIN_NAME}] 目录加载成功: ${data.directories?.length || 0}个文件夹, ${data.files?.length || 0}个文件`);
        console.log(`[${config.PLUGIN_NAME}] API响应数据结构:`, data);
        displayDirectoryContent(data);
        
        // 记录目录访问历史
        if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
          const contextMenuManager = window.nzWorkflowManager.interactionSystem.getContextMenuManager();
          if (contextMenuManager && path) {
            contextMenuManager.recordDirectoryVisit(path);
          }
        }
        
        // 目录加载完成后更新返回按钮状态
        window.nzWorkflowManager.updateBackButtonState();
      })
      .catch(httpError => {
        console.log(`[${config.PLUGIN_NAME}] HTTP失败，尝试WebSocket备用方案...`);
        
        // 检查是否是连接错误（服务器未运行）
        const isConnectionError = httpError.message.includes('Failed to fetch') || 
                                 httpError.message.includes('NetworkError') ||
                                 httpError.message.includes('HTTP 404') ||
                                 httpError.message.includes('HTTP 500');
        
        if (isConnectionError) {
          console.error(`[${config.PLUGIN_NAME}] 无法连接到ComfyUI服务器`);
          window.nzWorkflowManager.displayError('无法连接到ComfyUI服务器，请确保ComfyUI正在运行');
          return;
        }
        
        // HTTP失败后尝试WebSocket
        loadDirectoryUsingWebSocket(path)
          .then(result => {
            console.log(`[${config.PLUGIN_NAME}] WebSocket目录读取成功`);
            displayDirectoryContent(result);
            
            // 记录目录访问历史
            if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
              const contextMenuManager = window.nzWorkflowManager.interactionSystem.getContextMenuManager();
              if (contextMenuManager && path) {
                contextMenuManager.recordDirectoryVisit(path);
              }
            }
          })
          .catch(wsError => {
            console.error(`[${config.PLUGIN_NAME}] 所有通信方案均失败 - HTTP: ${httpError.message}, WebSocket: ${wsError.message}`);
            
            // 检查WebSocket错误类型
            const wsConnectionError = wsError.message.includes('WebSocket') || 
                                     wsError.message.includes('连接') ||
                                     wsError.message.includes('timeout');
            
            if (wsConnectionError) {
              window.nzWorkflowManager.displayError('无法连接到ComfyUI服务器，请确保ComfyUI正在运行');
            } else {
              window.nzWorkflowManager.displayError('无法访问目录，请检查路径是否正确');
            }
          });
      });
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 目录加载失败:`, error);
    window.nzWorkflowManager.displayError(`请先设置默认目录`);
  }
}

// ====== 加载目录（不更新历史记录） ======
// ✅ Stage5已完成: loadDirectoryWithoutHistory() 函数已迁移到 modules/features/workflow-manager.js
function loadDirectoryWithoutHistory(path = "") {
  console.log(`[${config.PLUGIN_NAME}] 加载目录（不更新历史）: ${path}`);
  
  try {
    // 如果没有提供路径，使用默认目录
    if (!path && defaultDirectory) {
      path = defaultDirectory;
      console.log(`[${config.PLUGIN_NAME}] 使用默认目录: ${path}`);
    }
    
    // 如果仍然没有路径，显示提示信息
    if (!path) {
      console.log(`[${config.PLUGIN_NAME}] 没有设置目录，显示提示信息`);
      window.nzWorkflowManager.displayNoDirectoryMessage();
               return;
             }
    
    // 仅更新当前路径，不修改历史记录
    config.setCurrentPath(path);
    console.log(`[${config.PLUGIN_NAME}] 当前路径已更新为: ${path}`);
    
    // 更新路径显示
    const pathDisplay = document.getElementById('nz-current-path');
    if (pathDisplay) {
      pathDisplay.textContent = path;
    }
    
    // 更新返回按钮状态
    window.nzWorkflowManager.updateBackButtonState();
    
    // 显示加载状态
    const contentElement = document.getElementById('nz-content');
    if (contentElement) {
      contentElement.querySelector('.loading-overlay').style.display = 'block';
      contentElement.querySelector('.file-grid').style.display = 'none';
      contentElement.querySelector('.empty-state').style.display = 'none';
    }
    
    // 优先使用HTTP端点（已验证可用）
    console.log(`[${config.PLUGIN_NAME}] 加载目录: ${path}`);
    
    fetch(`${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(path)}`)
           .then(response => {
             if (response.ok) {
               return response.json();
             } else {
               throw new Error(`HTTP ${response.status}: ${response.statusText}`);
             }
           })
           .then(data => {
        console.log(`[${config.PLUGIN_NAME}] 目录加载成功: ${data.directories?.length || 0}个文件夹, ${data.files?.length || 0}个文件`);
        displayDirectoryContent(data);
        
        // 记录目录访问历史
        if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
          const contextMenuManager = window.nzWorkflowManager.interactionSystem.getContextMenuManager();
          if (contextMenuManager && path) {
            contextMenuManager.recordDirectoryVisit(path);
          }
        }
        
        // 目录加载完成后更新返回按钮状态
        window.nzWorkflowManager.updateBackButtonState();
      })
      .catch(httpError => {
        console.log(`[${config.PLUGIN_NAME}] HTTP失败，尝试WebSocket备用方案...`);
        
        // 检查是否是连接错误（服务器未运行）
        const isConnectionError = httpError.message.includes('Failed to fetch') || 
                                 httpError.message.includes('NetworkError') ||
                                 httpError.message.includes('HTTP 404') ||
                                 httpError.message.includes('HTTP 500');
        
        if (isConnectionError) {
          console.error(`[${config.PLUGIN_NAME}] 无法连接到ComfyUI服务器`);
          window.nzWorkflowManager.displayError('无法连接到ComfyUI服务器，请确保ComfyUI正在运行');
          return;
        }
        
        // HTTP失败后尝试WebSocket
        loadDirectoryUsingWebSocket(path)
          .then(result => {
            console.log(`[${config.PLUGIN_NAME}] WebSocket目录读取成功`);
            displayDirectoryContent(result);
            
            // 记录目录访问历史
            if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
              const contextMenuManager = window.nzWorkflowManager.interactionSystem.getContextMenuManager();
              if (contextMenuManager && path) {
                contextMenuManager.recordDirectoryVisit(path);
              }
            }
          })
          .catch(wsError => {
            console.error(`[${config.PLUGIN_NAME}] 所有通信方案均失败 - HTTP: ${httpError.message}, WebSocket: ${wsError.message}`);
            
            // 检查WebSocket错误类型
            const wsConnectionError = wsError.message.includes('WebSocket') || 
                                     wsError.message.includes('连接') ||
                                     wsError.message.includes('timeout');
            
            if (wsConnectionError) {
              window.nzWorkflowManager.displayError('无法连接到ComfyUI服务器，请确保ComfyUI正在运行');
            } else {
              window.nzWorkflowManager.displayError('无法访问目录，请检查路径是否正确');
            }
          });
      });
      
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 目录加载失败:`, error);
    window.nzWorkflowManager.displayError(`请先设置默认目录`);
  }
}

// ====== 统一工作流文件加载器 ======
// ✅ Stage5已完成: loadWorkflowFile() 函数已迁移到 modules/features/workflow-loader.js
function loadWorkflowFile(filePath) {
  console.log(`[${config.PLUGIN_NAME}] 开始加载工作流文件: ${filePath}`);
  
  return new Promise((resolve, reject) => {
    // 方法1: 先尝试HTTP端点（最直接）
    loadWorkflowUsingHTTP(filePath)
      .then(result => {
        console.log(`[${config.PLUGIN_NAME}] HTTP读取成功`);
        resolve(result);
      })
      .catch(httpError => {
        console.log(`[${config.PLUGIN_NAME}] HTTP失败，尝试WebSocket:`, httpError.message);
        
        // 方法2: 尝试WebSocket
        loadWorkflowUsingWebSocket(filePath)
          .then(result => {
            console.log(`[${config.PLUGIN_NAME}] WebSocket读取成功`);
            resolve(result);
          })
          .catch(wsError => {
            console.log(`[${config.PLUGIN_NAME}] WebSocket失败，尝试节点系统:`, wsError.message);
            
            // 方法3: 尝试节点系统
            loadWorkflowUsingNode(filePath)
              .then(result => {
                console.log(`[${config.PLUGIN_NAME}] 节点系统读取成功`);
                resolve(result);
              })
              .catch(nodeError => {
                console.error(`[${config.PLUGIN_NAME}] 所有文件读取方法都失败`);
                reject(new Error(`无法读取文件: ${nodeError.message}`));
              });
          });
      });
  });
}

// ====== 使用HTTP端点读取工作流文件 ======
function loadWorkflowUsingHTTP(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`[${config.PLUGIN_NAME}] 使用HTTP端点读取工作流文件: ${filePath}`);
    
    try {
      // 使用自定义的文件读取端点
      const params = new URLSearchParams({
        path: filePath,
        action: 'load_workflow'
      });
      
      const url = `${window.location.origin}/local_files?${params.toString()}`;
      console.log(`[${config.PLUGIN_NAME}] 请求URL:`, url);
      
      fetch(url)
               .then(response => {
                 if (response.ok) {
                   return response.json();
                 } else {
                   throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                 }
               })
               .then(data => {
          console.log(`[${config.PLUGIN_NAME}] HTTP响应数据:`, data);
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          if (data.type === "workflow_loaded" && data.data) {
            resolve(data.data);
          } else if (data.type === "directory_listing") {
            throw new Error('请求的是文件但返回了目录列表');
                 } else {
            throw new Error('HTTP端点返回数据格式错误');
                 }
               })
               .catch(error => {
          console.error(`[${config.PLUGIN_NAME}] HTTP读取失败:`, error);
          reject(error);
        });
    } catch (error) {
      reject(new Error(`HTTP请求失败: ${error.message}`));
    }
  });
}

// ====== 使用文件路径直接读取 ======
function loadWorkflowUsingFilePath(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`[${config.PLUGIN_NAME}] 尝试直接读取文件: ${filePath}`);
    
    try {
      // 尝试使用fetch读取本地文件
      const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
      fetch(fileUrl)
        .then(response => {
          if (response.ok) {
            return response.text();
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        })
        .then(text => {
          resolve(text);
        })
        .catch(error => {
          reject(new Error(`文件读取失败: ${error.message}`));
        });
    } catch (error) {
      reject(new Error(`直接读取失败: ${error.message}`));
    }
  });
}

// ====== 通用WebSocket获取函数 ======
function getAvailableWebSocket() {
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

// ====== 使用WebSocket加载工作流文件 ======
function loadWorkflowUsingWebSocket(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`[${config.PLUGIN_NAME}] 使用WebSocket读取文件: ${filePath}`);
    
    try {
      // 检查WebSocket是否可用
      const socket = getAvailableWebSocket();
      console.log(`[${config.PLUGIN_NAME}] WebSocket连接检查: socket=${socket ? '存在' : '不存在'}, readyState=${socket?.readyState}`);
      if (socket) {
        console.log(`[${config.PLUGIN_NAME}] 使用ComfyUI WebSocket发送文件读取消息`);
        
        // 创建WebSocket消息
        const message = {
          type: "nz_workflow_manager",
          action: "load_workflow",
          path: filePath
        };
        
        // 设置消息监听器
        const originalMessageHandler = socket.onmessage;
        let resultReceived = false;
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "nz_workflow_manager_response" && 
                data.action === "load_workflow" && 
                !resultReceived) {
              
                       resultReceived = true;
              console.log(`[${config.PLUGIN_NAME}] WebSocket文件读取响应:`, data);
              
              // 恢复原始消息处理器
              socket.onmessage = originalMessageHandler;
              
              if (data.result && data.result.data) {
                resolve(data.result.data);
              } else if (data.error) {
                reject(new Error(data.error));
                 } else {
                reject(new Error('WebSocket文件读取响应格式错误'));
              }
               return;
             }
          } catch (parseError) {
            console.error(`[${config.PLUGIN_NAME}] 解析WebSocket消息失败:`, parseError);
          }
          
          // 调用原始处理器
          if (originalMessageHandler) {
            originalMessageHandler(event);
          }
        };
        
        // 发送消息
        socket.send(JSON.stringify(message));
        console.log(`[${config.PLUGIN_NAME}] WebSocket文件读取消息已发送`);
        
        // 设置超时
        setTimeout(() => {
          if (!resultReceived) {
            console.log(`[${config.PLUGIN_NAME}] WebSocket文件读取请求超时`);
            socket.onmessage = originalMessageHandler;
            reject(new Error('WebSocket文件读取请求超时'));
          }
        }, 5000);
        
      } else {
        console.log(`[${config.PLUGIN_NAME}] WebSocket状态检查: app=${typeof app}, socket=${app?.socket ? '存在' : '不存在'}`);
        throw new Error('WebSocket不可用');
      }
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket文件读取请求失败:`, error);
      reject(error);
    }
  });
}

// ====== 使用WebSocket加载目录 ======
function loadDirectoryUsingWebSocket(dirPath) {
  return new Promise((resolve, reject) => {
    console.log(`[${config.PLUGIN_NAME}] 使用WebSocket读取目录: ${dirPath}`);
    
    try {
      // 检查WebSocket是否可用
      const socket = getAvailableWebSocket();
      console.log(`[${config.PLUGIN_NAME}] WebSocket连接检查: socket=${socket ? '存在' : '不存在'}, readyState=${socket?.readyState}`);
      if (socket) {
        console.log(`[${config.PLUGIN_NAME}] 使用ComfyUI WebSocket发送消息`);
        
        // 创建WebSocket消息
        const message = {
          type: "nz_workflow_manager",
          action: "list_directory",
          path: dirPath
        };
        
        // 设置消息监听器
        const originalMessageHandler = socket.onmessage;
        let resultReceived = false;
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "nz_workflow_manager_response" && 
                data.action === "list_directory" && 
                !resultReceived) {
              
              resultReceived = true;
              console.log(`[${config.PLUGIN_NAME}] WebSocket响应:`, data);
              
              // 恢复原始消息处理器
              socket.onmessage = originalMessageHandler;
              
              if (data.result) {
                resolve(data.result);
              } else if (data.error) {
                reject(new Error(data.error));
             } else {
                reject(new Error('WebSocket响应格式错误'));
              }
                       return;
                     }
          } catch (parseError) {
            console.error(`[${config.PLUGIN_NAME}] 解析WebSocket消息失败:`, parseError);
          }
          
          // 调用原始处理器
          if (originalMessageHandler) {
            originalMessageHandler(event);
          }
        };
        
        // 发送消息
        socket.send(JSON.stringify(message));
        console.log(`[${config.PLUGIN_NAME}] WebSocket消息已发送`);
        
        // 设置超时
       setTimeout(() => {
         if (!resultReceived) {
            console.log(`[${config.PLUGIN_NAME}] WebSocket请求超时`);
            socket.onmessage = originalMessageHandler;
            reject(new Error('WebSocket请求超时'));
          }
        }, 5000);
       
     } else {
        console.log(`[${config.PLUGIN_NAME}] WebSocket状态检查: app=${typeof app}, socket=${app?.socket ? '存在' : '不存在'}`);
        throw new Error('WebSocket不可用');
     }
    
  } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket请求失败:`, error);
      reject(error);
    }
  });
}

// ====== 使用HTTP端点加载目录 ======
function loadDirectoryUsingHTTP(dirPath) {
  return new Promise((resolve, reject) => {
    console.log(`[${config.PLUGIN_NAME}] 使用HTTP端点读取目录: ${dirPath}`);
    
    // 使用正确的/file_operations端点
    const localFileUrl = `${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(dirPath)}`;
    console.log(`[${config.PLUGIN_NAME}] 访问HTTP端点: ${localFileUrl}`);
    
    fetch(localFileUrl)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .then(data => {
        console.log(`[${config.PLUGIN_NAME}] HTTP端点返回数据:`, data);
        
        if (data && data.type === "directory_listing") {
          resolve(data);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error('HTTP端点返回数据格式错误');
        }
      })
      .catch(error => {
        console.error(`[${config.PLUGIN_NAME}] HTTP端点访问失败:`, error);
        reject(error);
      });
  });
}

// ====== 确保正确布局 ======
function ensureCorrectLayout(fileItem) {
  const contentContainer = fileItem.querySelector('.nz-file-item-content');
  const tagsContainer = fileItem.querySelector('.nz-file-tags-inline');
  
  if (contentContainer) {
    // 强制应用垂直布局样式
    contentContainer.style.setProperty('display', 'flex', 'important');
    contentContainer.style.setProperty('flex-direction', 'column', 'important');
    contentContainer.style.setProperty('justify-content', 'center', 'important');
    contentContainer.style.setProperty('gap', '2px', 'important');
    contentContainer.style.setProperty('flex', '1', 'important');
    contentContainer.style.setProperty('min-width', '0', 'important');
    
    // console.log(`[${config.PLUGIN_NAME}] 强制应用内容容器垂直布局样式`); // 减少日志输出
  }
  
  if (tagsContainer) {
    // 隐藏标签容器
    tagsContainer.style.setProperty('display', 'none', 'important');
  }
  
  // 强制确保文件项边框显示（抑制日志避免重复输出）
  ensureFileItemBorder(fileItem, true);
}

// ====== 强制确保文件项边框 ======
function ensureFileItemBorder(fileItem, suppressLog = false) {
  // 🚫 边框已被禁用 - 不再添加边框样式
  // 改为确保无边框状态
  fileItem.style.setProperty('border', 'none', 'important');
  fileItem.style.setProperty('box-sizing', 'border-box', 'important');
  
  // 只在非批量操作时输出日志
  if (!suppressLog) {
    console.log(`[${config.PLUGIN_NAME}] 确保文件项无边框: ${fileItem.getAttribute('data-filename')}`);
  }
}

// ====== 动态标签显示调整 ======
function adjustTagsDisplay(fileItem) {
  const tagsContainer = fileItem.querySelector('.nz-file-tags-inline');
  if (!tagsContainer) return;
  
  const allTags = JSON.parse(tagsContainer.dataset.allTags || '[]');
  if (allTags.length === 0) return;
  
  const containerWidth = tagsContainer.offsetWidth;
  const dateElement = fileItem.querySelector('.nz-file-item-date');
  const dateWidth = dateElement ? dateElement.offsetWidth : 0;
  
  // 计算可用宽度（减去日期宽度和间距）
  const availableWidth = containerWidth - 16; // 留出一些边距
  
  // 清空容器
  tagsContainer.innerHTML = '';
  
  let currentWidth = 0;
  let visibleCount = 0;
  const tagElements = [];
  
  // 创建临时元素来测量每个标签的宽度
  const tempTag = document.createElement('span');
  tempTag.className = 'nz-tag';
  tempTag.style.visibility = 'hidden';
  tempTag.style.position = 'absolute';
  document.body.appendChild(tempTag);
  
  try {
    for (let i = 0; i < allTags.length; i++) {
      tempTag.textContent = allTags[i];
      const tagWidth = tempTag.offsetWidth + 3; // 加上gap
      
      // 如果添加这个标签会超出宽度，并且还有更多标签，则停止
      if (currentWidth + tagWidth > availableWidth && i < allTags.length - 1) {
        // 检查是否还有空间显示"+N"指示器
        tempTag.textContent = `+${allTags.length - i}`;
        const indicatorWidth = tempTag.offsetWidth;
        
        if (currentWidth + indicatorWidth <= availableWidth) {
          // 有空间显示指示器
          const indicator = document.createElement('span');
          indicator.className = 'nz-tag overflow-indicator';
          indicator.textContent = `+${allTags.length - i}`;
          indicator.title = `还有 ${allTags.length - i} 个标签: ${allTags.slice(i).join(', ')}`;
          tagsContainer.appendChild(indicator);
        }
        break;
      }
      
      // 添加标签
      const tag = document.createElement('span');
      tag.className = 'nz-tag';
      tag.textContent = allTags[i];
      tagsContainer.appendChild(tag);
      
      currentWidth += tagWidth;
      visibleCount++;
    }
  } finally {
    document.body.removeChild(tempTag);
  }
}

// ====== 显示目录内容 ======
// 🛡️ 零停机备份：保存原始函数作为降级备用
window.nzOriginalDisplayDirectoryContent = function(data) {
  console.log(`[${config.PLUGIN_NAME}] 显示目录内容:`, data);
  
  const contentElement = document.getElementById('nz-content');
  if (!contentElement) {
    console.error(`[${config.PLUGIN_NAME}] 找不到内容元素`);
    return;
  }
  
  const fileGrid = contentElement.querySelector('#nz-file-grid');
  if (!fileGrid) {
    console.error(`[${config.PLUGIN_NAME}] 找不到文件网格元素`);
    return;
  }
  
  // 清空现有内容
  fileGrid.innerHTML = '';
  
  let totalItems = 0;
  
  // 显示文件夹
  if (data.directories && data.directories.length > 0) {
    console.log(`[${config.PLUGIN_NAME}] 显示 ${data.directories.length} 个文件夹`);
    console.log(`[${config.PLUGIN_NAME}] 文件夹数据示例:`, data.directories[0]);
    data.directories.forEach(dirInfo => {
      // 兼容旧格式和新格式
      const dirName = typeof dirInfo === 'string' ? dirInfo : dirInfo.name;
      const dirDate = typeof dirInfo === 'object' ? dirInfo.date : '--/--/--';
      console.log(`[${config.PLUGIN_NAME}] 处理文件夹 - 类型: ${typeof dirInfo}, 名称: ${dirName}, 日期: ${dirDate}`);
      
      const dirItem = document.createElement('div');
      dirItem.className = 'nz-file-item folder';
      dirItem.innerHTML = `
        <div class="nz-file-item-thumbnail nz-folder-thumbnail size-medium">
          <div class="nz-thumbnail-icon">📁</div>
        </div>
        <div class="nz-file-item-content">
          <div class="nz-file-item-name">${dirName}</div>
          <div class="nz-file-item-comment" style="display: none;">注释预留位置</div>
          <div class="nz-file-item-date">${dirDate}</div>
        </div>
      `;
      
      // 添加数据属性便于调试和修复
      dirItem.setAttribute('data-filename', dirName);
      dirItem.setAttribute('data-filepath', dirName);
      
      // 强制确保文件夹边框显示（抑制日志避免重复输出）
      ensureFileItemBorder(dirItem, true);
      
      // 设置数据属性用于多选
      const directoryPath = data.path ? `${data.path}\\${dirName}` : dirName;
      dirItem.dataset.filePath = directoryPath;
      
      // 添加点击事件 - 支持多选
      dirItem.addEventListener('click', (e) => {
        // 如果正在拖拽，不执行点击操作
        if (window.nzIsDragging) {
          console.log(`[${config.PLUGIN_NAME}] 拖拽状态，跳过目录点击事件`);
          return;
        }
        
        const handled = window.multiSelectManager.handleItemClick(
          dirItem, directoryPath, dirName, 'directory', e
        );
        
        // 如果没有被多选处理，执行默认操作
        if (!handled) {
          console.log(`[${config.PLUGIN_NAME}] 点击文件夹: ${dirName}, 新路径: ${directoryPath}`);
          loadDirectory(directoryPath);
        }
      });
      
      // 添加右键菜单支持 (v3.0.0新增)
      dirItem.addEventListener('contextmenu', (e) => {
        // 如果正在拖拽，不显示右键菜单
        if (window.nzIsDragging) {
          console.log(`[${config.PLUGIN_NAME}] 拖拽状态，跳过右键菜单`);
          e.preventDefault();
          return;
        }
        
        // 动态获取当前正确的路径，确保移动后的路径信息是最新的
        const currentPath = config.getCurrentPath();
        const currentDirectoryPath = currentPath + (currentPath.endsWith('\\') ? '' : '\\') + dirName;
        console.log(`[${config.PLUGIN_NAME}] 右键菜单使用动态路径: ${currentDirectoryPath}`);
        
        window.contextMenuManager.showDirectoryContextMenu(e, currentDirectoryPath, dirName);
      });
      
      // 添加拖拽支持 - 目录也可以被拖拽
      dirItem.draggable = true;
      
      dirItem.addEventListener('dragstart', (e) => {
        console.log(`[${config.PLUGIN_NAME}] 开始拖拽目录: ${directoryPath}`);
        
        // 设置拖拽数据
        e.dataTransfer.setData('text/plain', dirName);
        e.dataTransfer.setData('application/x-nz-workflow', directoryPath);
        e.dataTransfer.setData('application/x-nz-filename', dirName);
        e.dataTransfer.effectAllowed = 'copyMove'; // 允许复制和移动
        
        // 设置拖拽图像（可选）- 使用更安全的实现
        if (e.dataTransfer.setDragImage) {
          const dragImage = document.createElement('div');
          dragImage.textContent = `📁 ${dirName}`;
          dragImage.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
            pointer-events: none;
            z-index: 10000;
            width: 120px;
            height: 32px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            box-sizing: border-box;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: -1000px;
            left: -1000px;
          `;
          document.body.appendChild(dragImage);
          e.dataTransfer.setDragImage(dragImage, 60, 16);
          console.log(`[${config.PLUGIN_NAME}] 设置目录拖拽图像:`, dragImage.style.cssText);
          // 延迟移除拖拽图像元素
          setTimeout(() => {
            if (document.body.contains(dragImage)) {
              document.body.removeChild(dragImage);
              console.log(`[${config.PLUGIN_NAME}] 目录拖拽图像已移除`);
            }
          }, 0);
        }
        
        // 添加拖拽样式
        dirItem.classList.add('dragging');
        
        // TODO: Stage9_CLEANUP - 拖拽状态管理已迁移到模块，待清理
        // 设置全局拖拽状态，防止意外打开目录
        window.nzIsDragging = true;
        console.log(`[${config.PLUGIN_NAME}] 拖拽状态已设置: ${window.nzIsDragging}`);
        
        // 显示拖拽提示
        window.nzWorkflowManager.showNotification(`拖拽中: ${dirName}`, 'info');
        
        // 显示拖拽到上级目录的目标区域
        showDragToParentTarget();
      });
      
      dirItem.addEventListener('dragend', (e) => {
        dirItem.classList.remove('dragging');
        
        // 检查拖拽是否成功完成
        const dropEffect = e.dataTransfer.dropEffect;
        if (dropEffect === 'copy' || dropEffect === 'move') {
          console.log(`[${config.PLUGIN_NAME}] 目录拖拽成功完成，效果: ${dropEffect}`);
        } else {
          console.log(`[${config.PLUGIN_NAME}] 目录拖拽取消或失败`);
        }
        
        // 隐藏拖拽到上级目录的目标区域
        hideDragToParentTarget();
        
        // 延迟清除拖拽状态，确保拖拽事件完全结束
        setTimeout(() => {
          window.nzIsDragging = false;
          console.log(`[${config.PLUGIN_NAME}] 目录拖拽状态已清除: ${window.nzIsDragging}`);
          // 确保多选按钮状态正确
          if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
            multiSelectManager.updateMultiSelectButtonState();
          }
        }, 200);
      });
      
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
          const selectedItems = multiSelectManager.getSelectedItems();
          const isMultiSelect = selectedItems.length > 1;
          
          // 检查是否在多选模式且有多个选中的文件
          const isInMultiSelectMode = multiSelectManager.isMultiSelectMode();
          
          if (isInMultiSelectMode && isMultiSelect) {
            // 多选拖拽：移动所有选中的文件
            console.log(`[${config.PLUGIN_NAME}] 多选拖拽移动: ${selectedItems.length} 个文件 -> ${targetDirPath}`);
            const selectedPaths = selectedItems.map(item => item.filePath);
            workflowManager.performMultiDragMove(selectedPaths, targetDirPath);
          } else {
            // 单选拖拽：移动单个文件
            console.log(`[${config.PLUGIN_NAME}] 拖拽文件移动: ${draggedFilePath} -> ${targetDirPath}`);
            workflowManager.performDragMove(draggedFilePath, targetDirPath);
          }
        }
        
        // 拖拽完成后清除拖拽状态
        setTimeout(() => {
          window.nzIsDragging = false;
          console.log(`[${config.PLUGIN_NAME}] 拖拽完成后状态已清除: ${window.nzIsDragging}`);
          // 确保多选按钮状态正确
          if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
            multiSelectManager.updateMultiSelectButtonState();
          }
        }, 100);
      });
      
      fileGrid.appendChild(dirItem);
      totalItems++;
    });
  }
  
  // 显示文件 - 只显示JSON工作流文件
  if (data.files && data.files.length > 0) {
    console.log(`[${config.PLUGIN_NAME}] 显示 ${data.files.length} 个JSON工作流文件`);
    console.log(`[${config.PLUGIN_NAME}] 文件数据示例:`, data.files[0]);
    data.files.forEach(fileInfo => {
      // 兼容旧格式和新格式
      const fileName = typeof fileInfo === 'string' ? fileInfo : fileInfo.name;
      const fileDate = typeof fileInfo === 'object' ? fileInfo.date : '--/--/--';
      console.log(`[${config.PLUGIN_NAME}] 处理文件 - 类型: ${typeof fileInfo}, 名称: ${fileName}, 日期: ${fileDate}`);
      
      const fileItem = document.createElement('div');
      fileItem.className = 'nz-file-item';
      
      // 首先设置文件路径用于后续使用
      const filePath = data.path ? `${data.path}\\${fileName}` : fileName;
      
      // 获取备注信息
      const note = workflowNotesManager.getNote(filePath);
      const hasNote = !!note;
      
      // JSON工作流文件固定图标
      const fileIcon = '📄';
      
      // 如果有备注描述，显示简要预览
      const notePreview = note?.description ? 
        `<div class="nz-file-note-title">${note.description.substring(0, 30)}${note.description.length > 30 ? '...' : ''}</div>` : '';
      
      // 标签现在在底部行与日期一起显示
      
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
      
      // 新的缩略图布局结构 - 不包含标签
      fileItem.innerHTML = `
        <div class="nz-file-item-thumbnail size-medium">
          <div class="nz-thumbnail-icon ${priorityClass}">${fileIcon}</div>
        </div>
        <div class="nz-file-item-content">
          <div class="nz-file-item-name ${priorityClass}" title="${fileName}">${fileName}</div>
          ${notePreview}
          <div class="nz-file-item-date">${fileDate}</div>
        </div>
      `;
      
      // 添加数据属性便于调试和修复
      fileItem.setAttribute('data-filename', fileName);
      fileItem.setAttribute('data-filepath', filePath);
    
      // 设置数据属性用于拖拽和多选
      fileItem.dataset.filePath = filePath;
      
      // 立即应用自定义图标（如果存在）- 避免延迟导致的视觉移动
      const hasCustomIcon = window.CustomIconManager && window.CustomIconManager.applyCustomIconToFileItem 
        ? window.CustomIconManager.applyCustomIconToFileItem(fileItem, filePath) 
        : false;
      
      // 应用布局 - 只在必要时进行单次修复
      requestAnimationFrame(() => {
        // 只对没有自定义图标的文件项进行布局修复，避免重复修改
        if (!hasCustomIcon) {
          ensureCorrectLayout(fileItem);
        }
      });
      
      // 添加点击事件 - 支持多选
      fileItem.addEventListener('click', (e) => {
        // 如果正在拖拽，不执行点击操作
        if (window.nzIsDragging) {
          console.log(`[${config.PLUGIN_NAME}] 拖拽状态，跳过点击事件`);
          return;
        }
        
        const handled = window.multiSelectManager.handleItemClick(
          fileItem, filePath, fileName, 'file', e
        );
        
        // 如果没有被多选处理，执行默认操作
        if (!handled) {
          console.log(`[${config.PLUGIN_NAME}] 点击文件: ${fileName}, 文件路径: ${filePath}`);
          loadWorkflow(filePath);
        }
      });
      
      // 添加右键菜单支持 (v3.0.0新增)
      fileItem.addEventListener('contextmenu', (e) => {
        // 如果正在拖拽，不显示右键菜单
        if (window.nzIsDragging) {
          console.log(`[${config.PLUGIN_NAME}] 拖拽状态，跳过文件右键菜单`);
          e.preventDefault();
          return;
        }
        
        window.contextMenuManager.showFileContextMenu(e, filePath, fileName);
      });
        
      // 添加拖拽支持
      fileItem.draggable = true;
        
        fileItem.addEventListener('dragstart', (e) => {
          const filePath = fileItem.dataset.filePath;
          
          // 检查是否有多选状态
          const selectedItems = multiSelectManager.getSelectedItems();
          const isMultiSelect = selectedItems.length > 1;
          
          if (isMultiSelect) {
            console.log(`[${config.PLUGIN_NAME}] 开始拖拽多选文件: ${selectedItems.length} 个文件`);
            
            // 如果当前拖拽的文件不在选中列表中，将其添加到选中列表
            const isCurrentFileSelected = selectedItems.some(item => item.filePath === filePath);
            if (!isCurrentFileSelected) {
              const itemType = fileItem.classList.contains('folder') ? 'directory' : 'file';
              multiSelectManager.addToSelection(fileItem, filePath, fileName, itemType);
              const updatedItems = multiSelectManager.getSelectedItems();
              console.log(`[${config.PLUGIN_NAME}] 当前拖拽文件已添加到选中列表，总计: ${updatedItems.length} 个文件`);
            }
          } else {
            console.log(`[${config.PLUGIN_NAME}] 开始拖拽单个文件: ${filePath}`);
          }
          
          // 设置拖拽数据（始终设置当前文件的信息，drop处理会检查多选状态）
          e.dataTransfer.setData('text/plain', fileName);
          e.dataTransfer.setData('application/x-nz-workflow', filePath);
          e.dataTransfer.setData('application/x-nz-filename', fileName);
          e.dataTransfer.effectAllowed = 'copyMove'; // 允许复制和移动
          
          // 设置拖拽图像（可选）- 使用更安全的实现
          if (e.dataTransfer.setDragImage) {
            const dragImage = document.createElement('div');
            
            if (isMultiSelect) {
              // 多选拖拽图像
              dragImage.textContent = `📄 ${selectedItems.length} 个文件`;
              dragImage.style.cssText = `
                background: rgba(74, 144, 226, 0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
                pointer-events: none;
                z-index: 10000;
                width: 120px;
                height: 32px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                box-sizing: border-box;
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                position: fixed;
                top: -1000px;
                left: -1000px;
              `;
            } else {
              // 单选拖拽图像
              dragImage.textContent = `📄 ${fileName}`;
              dragImage.style.cssText = `
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
                pointer-events: none;
                z-index: 10000;
                width: 120px;
                height: 32px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                box-sizing: border-box;
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                position: fixed;
                top: -1000px;
                left: -1000px;
              `;
            }
            
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 60, 16);
            console.log(`[${config.PLUGIN_NAME}] 设置${isMultiSelect ? '多选' : '单选'}拖拽图像`);
            
            // 延迟移除拖拽图像元素
            setTimeout(() => {
              if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
                console.log(`[${config.PLUGIN_NAME}] 拖拽图像已移除`);
              }
            }, 0);
          }
          
          // 添加拖拽样式
          fileItem.classList.add('dragging');
          
          // TODO: Stage9_CLEANUP - 拖拽状态管理已迁移到模块，待清理
          // 设置全局拖拽状态，防止意外打开文件
          window.nzIsDragging = true;
          console.log(`[${config.PLUGIN_NAME}] 拖拽状态已设置: ${window.nzIsDragging}`);
          
          // 显示拖拽提示
          window.nzWorkflowManager.showNotification(`拖拽中: ${fileName}`, 'info');
          
          // 显示拖拽到上级目录的目标区域
          showDragToParentTarget();
        });
        
        fileItem.addEventListener('dragend', (e) => {
          fileItem.classList.remove('dragging');
          
          // 检查拖拽是否成功完成
          const dropEffect = e.dataTransfer.dropEffect;
          if (dropEffect === 'copy' || dropEffect === 'move') {
            console.log(`[${config.PLUGIN_NAME}] 拖拽成功完成，效果: ${dropEffect}`);
          } else {
            console.log(`[${config.PLUGIN_NAME}] 拖拽取消或失败`);
          }
          
          // 隐藏拖拽到上级目录的目标区域
          hideDragToParentTarget();
          
          // 延迟清除拖拽状态，确保拖拽事件完全结束
          setTimeout(() => {
            window.nzIsDragging = false;
            console.log(`[${config.PLUGIN_NAME}] 拖拽状态已清除: ${window.nzIsDragging}`);
            // 确保多选按钮状态正确
            if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
              multiSelectManager.updateMultiSelectButtonState();
            }
          }, 200);
      });
      
      fileGrid.appendChild(fileItem);
      totalItems++;
    });
  }
  
  // 隐藏加载状态
  contentElement.querySelector('.loading-overlay').style.display = 'none';
  
  if (totalItems > 0) {
    contentElement.querySelector('.file-grid').style.display = 'grid';
    contentElement.querySelector('.empty-state').style.display = 'none';
    
    // 强制应用所有文件项的正确布局 - 延迟执行确保DOM完全渲染
    setTimeout(() => {
      console.log(`[${config.PLUGIN_NAME}] 目录显示完成，强制修复所有布局...`);
      const fileItems = document.querySelectorAll('.nz-file-item');
      let fixedCount = 0;
      fileItems.forEach((item, index) => {
        // 跳过有自定义图标的文件项，避免重复修改导致移动
        const hasCustomIcon = item.querySelector('.nz-file-item-thumbnail[data-nz-custom-icon="true"]');
        if (!hasCustomIcon) {
          ensureCorrectLayout(item);
          adjustTagsDisplay(item);
          fixedCount++;
        }
      });
      console.log(`[${config.PLUGIN_NAME}] 已修复 ${fixedCount}/${fileItems.length} 个文件项的布局（跳过 ${fileItems.length - fixedCount} 个自定义图标项）`);
      
      // 初始化DOM观察器
      initLayoutObserver();
    }, 100);
  } else {
    contentElement.querySelector('.file-grid').style.display = 'none';
    contentElement.querySelector('.empty-state').textContent = '该目录中没有内容';
    contentElement.querySelector('.empty-state').style.display = 'block';
  }
  
  // 添加空白区域右键菜单支持 (v3.0.0新增)
  fileGrid.addEventListener('contextmenu', (e) => {
    // 如果正在拖拽，不显示右键菜单
    if (window.nzIsDragging) {
      console.log(`[${config.PLUGIN_NAME}] 拖拽状态，跳过空白区域右键菜单`);
      e.preventDefault();
      return;
    }
    
    // 只有在点击空白区域时才显示菜单
    if (e.target === fileGrid) {
      contextMenuManager.showEmptyAreaContextMenu(e, data.path || config.getCurrentPath());
    }
  });
  
  // 添加空白区域点击清除选择功能
  fileGrid.addEventListener('click', (e) => {
    // 如果正在拖拽，不执行点击操作
    if (window.nzIsDragging) {
      console.log(`[${config.PLUGIN_NAME}] 拖拽状态，跳过空白区域点击事件`);
      return;
    }
    
    // 只有在点击空白区域时才清除选择
    if (e.target === fileGrid) {
      multiSelectManager.clearSelection();
    }
  });
  
  // 更新状态栏
  const statusBar = document.querySelector('.nz-status-bar span');
  if (statusBar) {
    statusBar.textContent = `状态: 已加载目录 ${data.path} (${totalItems} 个项目)`;
  }
  
  console.log(`[${config.PLUGIN_NAME}] 目录内容显示完成，共 ${totalItems} 个项目`);
}

// 🎯 零停机时间智能调度函数
function displayDirectoryContent(data) {
  console.log(`[${config.PLUGIN_NAME}] 智能调度显示目录内容`);
  
  // 🛡️ 优先使用模块化版本，失败时自动降级
  if (workflowUI && typeof workflowUI.displayDirectoryContent === 'function') {
    try {
      workflowUI.displayDirectoryContent(data);
      return;
    } catch (error) {
      console.warn(`[${config.PLUGIN_NAME}] 模块化版本失败，自动降级:`, error);
    }
  }
  
  // 🔄 降级到原始代码备份
  if (window.nzOriginalDisplayDirectoryContent) {
    console.log(`[${config.PLUGIN_NAME}] 使用原始代码备份`);
    window.nzOriginalDisplayDirectoryContent(data);
  } else {
    console.error(`[${config.PLUGIN_NAME}] 所有显示方案均不可用`);
  }
  
  // 设置路径栏的拖拽支持（向上级目录拖拽文件）（使用模块化版本）
  dragDropManager.setupPathBarDragSupport(data.path);
}



// ====== 加载工作流 ======
// ✅ Stage5已完成: loadWorkflow() 函数已迁移到 modules/features/workflow-loader.js
function loadWorkflow(filePath) {
  console.log(`[${config.PLUGIN_NAME}] 加载工作流: ${filePath}`);
  
  try {
    // 使用ComfyUI的API加载工作流
    if (typeof app !== 'undefined') {
      console.log(`[${config.PLUGIN_NAME}] 使用ComfyUI API加载工作流`);
      
      // 方法1: 使用app.loadGraphData直接加载
      if (app.loadGraphData) {
        console.log(`[${config.PLUGIN_NAME}] 调用ComfyUI loadGraphData API`);
        
        // 读取文件内容并加载
        console.log(`[${config.PLUGIN_NAME}] 尝试读取工作流文件: ${filePath}`);
        
                                // 使用多种方式读取文件
        loadWorkflowFile(filePath)
          .then(workflowData => {
            try {
              // 解析JSON数据
              const workflow = JSON.parse(workflowData);
              console.log(`[${config.PLUGIN_NAME}] 工作流数据解析成功，原始格式:`, workflow);
              
              // 验证和修复工作流格式
              const fixedWorkflow = validateAndFixWorkflow(workflow);
              console.log(`[${config.PLUGIN_NAME}] 工作流格式验证完成，修复后:`, fixedWorkflow);
              
              // 直接加载到ComfyUI，使用原始格式
              console.log(`[${config.PLUGIN_NAME}] 尝试加载工作流到ComfyUI`);
              
              // 检查app.loadGraphData是否存在
              if (typeof app.loadGraphData === 'function') {
                app.loadGraphData(workflow); // 使用原始工作流，不使用修复版本
                console.log(`[${config.PLUGIN_NAME}] 工作流加载成功`);
      } else {
                console.error(`[${config.PLUGIN_NAME}] app.loadGraphData不是一个函数:`, typeof app.loadGraphData);
                throw new Error('ComfyUI loadGraphData API不可用');
              }
              
              // 通知浮动管理器工作流已加载
              console.log(`[${config.PLUGIN_NAME}] 准备通知浮动管理器加载工作流`);
              if (floatingWorkflowManager) {
                console.log(`[${config.PLUGIN_NAME}] 浮动管理器实例状态:`, {
                  hasElement: !!floatingWorkflowManager.element,
                  isInitializing: floatingWorkflowManager.isInitializing,
                  isVisible: floatingWorkflowManager.isVisible
                });
                floatingWorkflowManager.loadWorkflow(filePath, workflowData);
              } else {
                console.warn(`[${config.PLUGIN_NAME}] 浮动管理器未初始化，跳过工作流加载通知`);
              }
              
              window.nzWorkflowManager.showNotification('工作流加载成功', 'success');
              
            } catch (parseError) {
              console.error(`[${config.PLUGIN_NAME}] JSON解析或加载失败:`, parseError);
              
              // 如果加载失败，尝试使用修复版本
              try {
                console.log(`[${config.PLUGIN_NAME}] 尝试使用修复版本加载`);
                const workflow = JSON.parse(workflowData);
                const fixedWorkflow = validateAndFixWorkflow(workflow);
                
                // 检查app.loadGraphData是否存在
                if (typeof app.loadGraphData === 'function') {
                  app.loadGraphData(fixedWorkflow);
                  
                  // 通知浮动管理器工作流已加载
                  // ✅ Stage7: 使用模块化的浮动管理器
                  if (floatingWorkflowManager) {
                    floatingWorkflowManager.loadWorkflow(filePath, workflowData);
                  }
                  
                  window.nzWorkflowManager.showNotification('工作流加载成功（已修复格式）', 'success');
    } else {
                  throw new Error('ComfyUI loadGraphData API不可用');
                }
              } catch (secondError) {
                console.error(`[${config.PLUGIN_NAME}] 修复版本也加载失败:`, secondError);
                window.nzWorkflowManager.showNotification(`工作流加载失败: ${secondError.message}`, 'error');
              }
            }
          })
          .catch(fetchError => {
            console.error(`[${config.PLUGIN_NAME}] 文件读取失败:`, fetchError);
            window.nzWorkflowManager.showNotification(`无法读取工作流文件: ${fetchError.message}`, 'error');
          });
        
      } else {
        console.log(`[${config.PLUGIN_NAME}] loadGraphData API不可用，尝试其他方法`);
        
        // 使用改进的拖拽模拟（模块化版本）
        console.log(`[${config.PLUGIN_NAME}] 使用改进的拖拽模拟加载`);
        dragDropManager.simulateWorkflowDragWithFile(filePath);
      }
      
    } else {
      console.log(`[${config.PLUGIN_NAME}] ComfyUI API不可用，使用拖拽模拟（模块化版本）`);
      dragDropManager.simulateWorkflowDragWithFile(filePath);
    }
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 工作流加载失败:`, error);
    window.nzWorkflowManager.showNotification('工作流加载失败', 'error');
  }
}







// ====== 显示通知函数已在上方定义，此处删除重复定义 ======

// ====== 使用节点系统加载目录 ======
function loadDirectoryUsingNode(dirPath) {
  return new Promise((resolve, reject) => {
    console.log(`[${config.PLUGIN_NAME}] 使用节点系统读取目录: ${dirPath}`);
    
    try {
      // 创建一个临时的工作流来执行目录读取操作
      const tempWorkflow = {
        "1": {
          "inputs": {
            "action": "list_directory",
            "path": dirPath,
            "workflow_data": "{}"
          },
          "class_type": "NZ_Workflow_Manager",
          "outputs": ["STRING"]
        }
      };
      
      // 使用ComfyUI的API执行工作流
      if (app.queuePrompt) {
        console.log(`[${config.PLUGIN_NAME}] 使用queuePrompt执行目录读取`);
        
        // 保存当前的执行结果监听器
        const originalOnPromptExecuted = app.onPromptExecuted;
        let resultReceived = false;
        
        // 设置结果监听器
        app.onPromptExecuted = (e) => {
          try {
            if (!resultReceived && e.detail && e.detail.output) {
              const outputs = e.detail.output;
              
              // 查找我们的节点输出
              if (outputs["1"] && outputs["1"]["STRING"]) {
                const result = outputs["1"]["STRING"][0];
                
                try {
                  const parsedResult = JSON.parse(result);
                  if (parsedResult.type === "directory_listing") {
                    resultReceived = true;
                    console.log(`[${config.PLUGIN_NAME}] 目录读取成功`);
                    
                    // 恢复原始监听器
                    app.onPromptExecuted = originalOnPromptExecuted;
                    
                    resolve(parsedResult);
                    return;
                  }
                } catch (parseError) {
                  console.error(`[${config.PLUGIN_NAME}] 解析节点输出失败:`, parseError);
                }
              }
            }
          } catch (error) {
            console.error(`[${config.PLUGIN_NAME}] 处理执行结果失败:`, error);
          }
          
          // 调用原始监听器
          if (originalOnPromptExecuted) {
            originalOnPromptExecuted(e);
          }
        };
        
        // 执行工作流
        app.queuePrompt(0, tempWorkflow);
        
        // 设置超时
        setTimeout(() => {
          if (!resultReceived) {
            console.log(`[${config.PLUGIN_NAME}] 节点系统目录读取超时`);
            app.onPromptExecuted = originalOnPromptExecuted;
            reject(new Error('目录读取超时'));
          }
        }, 10000);
        
      } else {
        throw new Error('ComfyUI queuePrompt API不可用');
      }
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 节点系统目录读取失败:`, error);
      reject(error);
    }
  });
}

// ====== 使用节点系统加载工作流 ======
function loadWorkflowUsingNode(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`[${config.PLUGIN_NAME}] 使用节点系统读取文件: ${filePath}`);
    
    try {
      // 创建一个临时的工作流来执行文件读取操作
      const tempWorkflow = {
        "1": {
          "inputs": {
            "action": "load_workflow",
            "path": filePath,
            "workflow_data": "{}"
          },
          "class_type": "NZ_Workflow_Manager",
          "outputs": ["STRING"]
        }
      };
      
      // 使用ComfyUI的API执行工作流
      if (app.queuePrompt) {
        console.log(`[${config.PLUGIN_NAME}] 使用queuePrompt执行文件读取`);
        
        // 保存当前的执行结果监听器
        const originalOnPromptExecuted = app.onPromptExecuted;
        let resultReceived = false;
        
        // 设置结果监听器
        app.onPromptExecuted = (e) => {
          try {
            if (!resultReceived && e.detail && e.detail.output) {
              const outputs = e.detail.output;
              
              // 查找我们的节点输出
              if (outputs["1"] && outputs["1"]["STRING"]) {
                const result = outputs["1"]["STRING"][0];
                
                try {
                  const parsedResult = JSON.parse(result);
                  if (parsedResult.type === "workflow_loaded" && parsedResult.data) {
                    resultReceived = true;
                    console.log(`[${config.PLUGIN_NAME}] 文件读取成功`);
                    
                    // 恢复原始监听器
                    app.onPromptExecuted = originalOnPromptExecuted;
                    
                    resolve(parsedResult.data);
                    return;
                  }
                } catch (parseError) {
                  console.error(`[${config.PLUGIN_NAME}] 解析节点输出失败:`, parseError);
                }
              }
            }
          } catch (error) {
            console.error(`[${config.PLUGIN_NAME}] 处理执行结果失败:`, error);
          }
          
          // 调用原始监听器
          if (originalOnPromptExecuted) {
            originalOnPromptExecuted(e);
          }
        };
        
        // 执行工作流
        app.queuePrompt(0, tempWorkflow);
        
        // 设置超时
        setTimeout(() => {
          if (!resultReceived) {
            console.log(`[${config.PLUGIN_NAME}] 节点系统读取超时`);
            app.onPromptExecuted = originalOnPromptExecuted;
            reject(new Error('文件读取超时'));
          }
        }, 10000);
        
      } else {
        throw new Error('ComfyUI queuePrompt API不可用');
      }
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 节点系统读取失败:`, error);
      reject(error);
    }
  });
}

// ====== 验证和修复工作流格式 ======
function validateAndFixWorkflow(workflow) {
  console.log(`[${config.PLUGIN_NAME}] 开始验证工作流格式`);
  
  try {
    // 检查工作流是否为空或无效
    if (!workflow || typeof workflow !== 'object') {
      throw new Error('工作流数据无效');
    }
    
    // 检测工作流格式类型
    const isOldFormat = detectOldFormat(workflow);
    
    if (isOldFormat) {
      console.log(`[${config.PLUGIN_NAME}] 检测到旧版ComfyUI格式，直接使用`);
      // 旧格式（节点直接在根级别）直接返回，ComfyUI会自动处理
      return workflow;
    } else {
      console.log(`[${config.PLUGIN_NAME}] 检测到新版格式或需要修复的格式`);
      return fixNewFormatWorkflow(workflow);
    }
    
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 工作流格式验证失败:`, error);
    // 如果修复失败，返回原始工作流
    return workflow;
  }
}

// 检测是否为旧版ComfyUI格式
function detectOldFormat(workflow) {
  // 旧版格式特征：
  // 1. 根级别直接包含数字键的节点对象
  // 2. 节点对象包含 class_type, inputs 等字段
  // 3. 没有 nodes, edges 这样的包装结构
  
  for (const key in workflow) {
    const value = workflow[key];
    if (typeof value === 'object' && 
        value !== null && 
        value.class_type && 
        typeof value.class_type === 'string') {
      return true;
    }
  }
  
  return false;
}

// 修复新版格式工作流
function fixNewFormatWorkflow(workflow) {
  const fixedWorkflow = JSON.parse(JSON.stringify(workflow));
  const fixDetails = [];
  
  // 添加必需的字段
  if (!fixedWorkflow.version) {
    console.log(`[${config.PLUGIN_NAME}] 添加缺失的version字段`);
    fixedWorkflow.version = "1.0.0";
    fixDetails.push('添加了version字段');
  }
  
  if (!fixedWorkflow.nodes) {
    console.log(`[${config.PLUGIN_NAME}] 添加缺失的nodes字段`);
    fixedWorkflow.nodes = {};
    fixDetails.push('添加了nodes字段');
  }
  
  if (!fixedWorkflow.edges) {
    console.log(`[${config.PLUGIN_NAME}] 添加缺失的edges字段`);
    fixedWorkflow.edges = [];
    fixDetails.push('添加了edges字段');
  }
  
  // 验证节点数据
  if (fixedWorkflow.nodes && typeof fixedWorkflow.nodes === 'object') {
    Object.keys(fixedWorkflow.nodes).forEach(nodeId => {
      const node = fixedWorkflow.nodes[nodeId];
      
      if (!node.id) {
        node.id = nodeId;
      }
      
      if (!node.class_type) {
        console.log(`[${config.PLUGIN_NAME}] 节点 ${nodeId} 缺少class_type`);
        node.class_type = "Unknown";
      }
      
      if (!node.inputs) {
        node.inputs = {};
      }
      
      if (!node.outputs) {
        node.outputs = [];
      }
    });
  }
  
  // 添加元数据
  if (!fixedWorkflow.meta) {
    fixedWorkflow.meta = {
      title: "Imported Workflow"
    };
  }
  
  // 记录修复详情
  if (fixDetails.length > 0) {
    window.nzWorkflowFixDetails = fixDetails;
    console.log(`[${config.PLUGIN_NAME}] 工作流格式修复完成:`, fixDetails);
  }
  
  return fixedWorkflow;
}

// ====== 改进的工作流拖拽模拟 ======
// Stage6-COMPLETED: 已迁移到 modules/ui/interaction-system.js
// 保留原始函数定义以防兼容性问题，但实际使用模块化版本
function simulateWorkflowDragWithFile(filePath) {
  console.log(`[${config.PLUGIN_NAME}] 工作流拖拽：直接加载模式: ${filePath}`);
  
  // 直接使用点击加载的成功逻辑，不模拟拖拽事件
  loadWorkflowFile(filePath)
    .then(workflowData => {
      try {
        // 使用与点击加载完全相同的逻辑
        const workflow = JSON.parse(workflowData);
        console.log(`[${config.PLUGIN_NAME}] 拖拽：工作流数据解析成功，原始格式:`, workflow);
        
        // 直接加载到ComfyUI，使用原始格式
        console.log(`[${config.PLUGIN_NAME}] 拖拽：尝试加载工作流到ComfyUI`);
        app.loadGraphData(workflow); // 使用原始工作流，不使用修复版本
        console.log(`[${config.PLUGIN_NAME}] 拖拽：工作流加载成功`);
        
        // 通知浮动管理器工作流已加载
        // ✅ Stage7: 使用模块化的浮动管理器
        if (floatingWorkflowManager) {
          floatingWorkflowManager.loadWorkflow(filePath, workflowData);
        }
        
        window.nzWorkflowManager.showNotification('工作流拖拽加载成功', 'success');
        
      } catch (parseError) {
        console.error(`[${config.PLUGIN_NAME}] 拖拽：JSON解析或加载失败:`, parseError);
        
        // 如果加载失败，尝试使用修复版本
        try {
          console.log(`[${config.PLUGIN_NAME}] 拖拽：尝试使用修复版本加载`);
          const workflow = JSON.parse(workflowData);
          const fixedWorkflow = validateAndFixWorkflow(workflow);
          app.loadGraphData(fixedWorkflow);
          
          // 通知浮动管理器工作流已加载
          // ✅ Stage7: 使用模块化的浮动管理器
        if (floatingWorkflowManager) {
          floatingWorkflowManager.loadWorkflow(filePath, workflowData);
        }
          
          window.nzWorkflowManager.showNotification('工作流拖拽加载成功（已修复格式）', 'success');
        } catch (secondError) {
          console.error(`[${config.PLUGIN_NAME}] 拖拽：修复版本也加载失败:`, secondError);
          window.nzWorkflowManager.showNotification('工作流文件格式错误，无法加载', 'error');
        }
      }
    })
    .catch(error => {
      console.error(`[${config.PLUGIN_NAME}] 拖拽：无法读取工作流文件:`, error);
      window.nzWorkflowManager.showNotification('无法读取工作流文件', 'error');
    });
}

// ====== 直接工作流加载 ======
function tryDirectWorkflowLoad(workflow) {
  console.log(`[${config.PLUGIN_NAME}] 尝试直接加载工作流`);
  
  try {
    // 尝试多种ComfyUI加载方法
    if (app && app.loadGraphData) {
      console.log(`[${config.PLUGIN_NAME}] 使用app.loadGraphData`);
      app.loadGraphData(workflow);
      window.nzWorkflowManager.showNotification('工作流加载成功', 'success');
    } else if (app && app.graph && app.graph.configure) {
      console.log(`[${config.PLUGIN_NAME}] 使用app.graph.configure`);
      app.graph.configure(workflow);
      window.nzWorkflowManager.showNotification('工作流加载成功', 'success');
    } else {
      console.log(`[${config.PLUGIN_NAME}] 无法找到ComfyUI加载方法`);
      window.nzWorkflowManager.showNotification('无法加载工作流：ComfyUI API不可用', 'error');
    }
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 直接加载失败:`, error);
    window.nzWorkflowManager.showNotification('工作流加载失败', 'error');
  }
}



// ====== 全局拖拽处理器 ======
// Stage6-COMPLETED: 已迁移到 modules/ui/interaction-system.js
// 保留原始函数定义以防兼容性问题，但实际使用模块化版本
function setupGlobalDragHandler() {
  console.log(`[${config.PLUGIN_NAME}] 设置全局拖拽接收处理器`);
  
  // 移除可能存在的旧监听器
  document.removeEventListener('dragover', window.nzGlobalDragOverHandler);
  document.removeEventListener('drop', window.nzGlobalDropHandler);
  
  // 创建拖拽处理器函数
  window.nzGlobalDragOverHandler = (e) => {
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
  
  window.nzGlobalDropHandler = (e) => {
    // 检查是否包含我们的自定义数据
    if (e.dataTransfer.types.includes('application/x-nz-workflow')) {
      // 移除所有高亮效果
      document.querySelectorAll('#graph, .comfy-canvas, .comfy-graph, canvas').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
      });
      
      console.log(`[${config.PLUGIN_NAME}] 拖拽放置检测 - 目标元素:`, e.target);
      console.log(`[${config.PLUGIN_NAME}] 拖拽放置检测 - 目标元素类名:`, e.target.className);
      console.log(`[${config.PLUGIN_NAME}] 拖拽放置检测 - 目标元素ID:`, e.target.id);
      console.log(`[${config.PLUGIN_NAME}] 拖拽放置检测 - 目标元素标签:`, e.target.tagName);
      
      // 🎯 优先检查拖拽到上级目录的特殊情况
      const pathDragOverlay = e.target.closest('#nz-path-drag-overlay, .nz-path-drag-overlay');
      const pathDisplay = e.target.closest('#nz-path-display, .nz-path-display');
      
      if (pathDragOverlay || pathDisplay) {
        console.log(`[${config.PLUGIN_NAME}] 拖拽到路径栏区域，处理移动到上级目录`);
        e.preventDefault(); // 阻止默认处理
        
        // 获取拖拽的文件信息
        const draggedFilePath = e.dataTransfer.getData('application/x-nz-workflow');
        const fileName = e.dataTransfer.getData('text/plain');
        
        if (draggedFilePath && window.nzIsDragging) {
          // 获取上级目录路径
          const currentPath = config.getCurrentPath();
          const defaultDir = config.getDefaultDirectory();
          
          // 计算上级目录路径
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'));
          
          // 检查是否可以移动到上级目录（不能超出默认目录范围）
          if (parentPath && parentPath.length >= defaultDir.length && parentPath.startsWith(defaultDir)) {
            console.log(`[${config.PLUGIN_NAME}] 执行拖拽移动到上级目录: ${draggedFilePath} -> ${parentPath}`);
            
            // 检查是否是多选拖拽
            const isMultiSelect = multiSelectManager && multiSelectManager.isMultiSelectMode();
            const selectedItems = isMultiSelect ? multiSelectManager.getSelectedItems() : [];
            const isDraggedFileSelected = selectedItems.some(item => item.filePath === draggedFilePath);
            
            if (isMultiSelect && isDraggedFileSelected) {
              // 多选拖拽：移动所有选中的文件到上级目录
              console.log(`[${config.PLUGIN_NAME}] 多选拖拽到上级目录: ${selectedItems.length} 个文件`);
              const selectedPaths = selectedItems.map(item => item.filePath);
              workflowManager.performMultiDragMove(selectedPaths, parentPath);
            } else {
              // 单选拖拽：移动单个文件到上级目录
              console.log(`[${config.PLUGIN_NAME}] 单选拖拽到上级目录: ${fileName}`);
              workflowManager.performDragMove(draggedFilePath, parentPath);
            }
          } else {
            console.log(`[${config.PLUGIN_NAME}] 无法移动到上级目录或超出范围限制`);
            window.nzWorkflowManager.showNotification('无法移动到上级目录', 'warning');
          }
        }
        
        // 隐藏拖拽覆盖层
        hidePathBarDragOverlay();
        
        // 清除拖拽状态
        setTimeout(() => {
          window.nzIsDragging = false;
          console.log(`[${config.PLUGIN_NAME}] 拖拽到上级目录完成后状态已清除`);
        }, 100);
        
        return; // 处理完成，不继续执行后面的逻辑
      } else {
      // 检查是否拖拽到了我们的插件界面内 (黄色框区域)
      const pluginElement = e.target.closest('.nz-manager, .nz-workflow-manager, .nz-floating-manager');
      if (pluginElement) {
          console.log(`[${config.PLUGIN_NAME}] 拖拽到插件界面内（黄色框），跳过全局处理器`);
        return; // 在插件界面内不打开JSON文件
      }
      
      // 检查是否拖拽到了文件项或目录项（插件内部元素）
      const fileElement = e.target.closest('.nz-file-item, .folder-item, .nz-file-browser');
      if (fileElement) {
          console.log(`[${config.PLUGIN_NAME}] 拖拽到文件管理区域（黄色框），跳过全局处理器`);
        return; // 让文件管理器的处理器处理
        }
      }
      
      // 更广泛地检查ComfyUI画布区域 (红色框区域)
      const canvasElement = e.target.closest('#graph, .comfy-canvas, .comfy-graph, canvas, #graphcanvas') ||
                           e.target.querySelector('canvas') ||
                           (e.target.tagName === 'CANVAS');
      
      if (canvasElement) {
        console.log(`[${config.PLUGIN_NAME}] 拖拽到ComfyUI画布（红色框），加载工作流`);
        e.preventDefault(); // 阻止默认处理
        
        const filePath = e.dataTransfer.getData('application/x-nz-workflow');
        const fileName = e.dataTransfer.getData('text/plain');
        
        console.log(`[${config.PLUGIN_NAME}] 检测到工作流拖拽放置到ComfyUI画布:`, { fileName, filePath });
        
        // 拖拽到画布时加载工作流（模块化版本）
        dragDropManager.simulateWorkflowDragWithFile(filePath);
        return;
      }
      
      // 检查是否拖拽到了ComfyUI的主要区域（红色框内的任何位置）
      // 排除插件界面后，其他区域都认为是ComfyUI区域
      const bodyElement = e.target === document.body || e.target === document.documentElement;
      const isInPluginArea = e.target.closest('.nz-manager, .nz-workflow-manager, .nz-floating-manager, .nz-file-item, .folder-item, .nz-file-browser');
      
      if (!isInPluginArea && !bodyElement) {
        console.log(`[${config.PLUGIN_NAME}] 拖拽到ComfyUI区域（红色框），加载工作流`);
        e.preventDefault(); // 阻止默认处理
        
        const filePath = e.dataTransfer.getData('application/x-nz-workflow');
        const fileName = e.dataTransfer.getData('text/plain');
        
        console.log(`[${config.PLUGIN_NAME}] 检测到工作流拖拽放置到ComfyUI区域:`, { fileName, filePath });
        
        // 拖拽到ComfyUI区域时加载工作流（模块化版本）
        dragDropManager.simulateWorkflowDragWithFile(filePath);
        return;
      }
      
      // 其他情况（如拖拽到浏览器其他区域）不处理
      console.log(`[${config.PLUGIN_NAME}] 拖拽到未知区域或页面边缘，不处理`);
    }
  };
  
  // 添加拖拽离开事件处理，移除高亮效果
  window.nzGlobalDragLeaveHandler = (e) => {
    // 检查是否真正离开了ComfyUI画布区域
    const canvasElement = e.target.closest('#graph, .comfy-canvas, .comfy-graph');
    if (canvasElement && !canvasElement.contains(e.relatedTarget)) {
      canvasElement.style.outline = '';
      canvasElement.style.outlineOffset = '';
    }
  };
  
  // 监听整个document的拖拽事件
  document.addEventListener('dragover', window.nzGlobalDragOverHandler, false);
  document.addEventListener('drop', window.nzGlobalDropHandler, false);
  document.addEventListener('dragleave', window.nzGlobalDragLeaveHandler, false);
  
  console.log(`[${config.PLUGIN_NAME}] 全局拖拽处理器设置完成`);
}

// ====== 传统拖拽模拟（保留作为最后备用） ======
function simulateWorkflowDrag(filePath) {
  console.log(`[${config.PLUGIN_NAME}] 传统拖拽模拟: ${filePath}`);
  
  try {
    // 创建拖拽事件
    const dragEvent = new DragEvent('drop', {
      dataTransfer: {
        files: [{
          name: filePath.split('\\').pop(),
          path: filePath,
          type: 'application/json'
        }]
      }
    });
    
    // 尝试触发ComfyUI的拖拽处理
    if (app.canvas) {
      console.log(`[${config.PLUGIN_NAME}] 触发ComfyUI画布拖拽事件`);
      app.canvas.dispatchEvent(dragEvent);
      window.nzWorkflowManager.showNotification('工作流拖拽成功', 'success');
    } else {
      // 备用方案：显示拖拽提示
      window.nzWorkflowManager.showNotification('请将工作流文件拖拽到ComfyUI界面', 'info');
    }
    
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 拖拽模拟失败:`, error);
    window.nzWorkflowManager.showNotification('拖拽模拟失败，请手动拖拽文件', 'error');
  }
}

// ====== 显示无目录提示 ======
// ✅ displayNoDirectoryMessage() 函数已迁移到 modules/ui/ui-manager.js
// 如需调用，请使用: uiManager.displayNoDirectoryMessage()
// 旧函数定义已删除，避免代码冗余

// ====== 显示错误 ======
// ✅ displayError() 函数已迁移到 modules/ui/ui-manager.js
// 如需调用，请使用: uiManager.displayError()
// 旧函数定义已删除，避免代码冗余

// ====== 更新返回按钮状态 ======
// ✅ updateBackButtonState() 函数已迁移到 modules/ui/ui-manager.js
// 如需调用，请使用: uiManager.updateBackButtonState()
// 旧函数定义已删除，避免代码冗余

// ====== 返回上级目录 ======
// ✅ Stage5已完成: goBack() 函数已迁移到 modules/features/workflow-manager.js
function goBack() {
  // 优先使用历史记录返回
  if (config.getPathHistoryLength() > 0) {
    const previousPath = config.popFromPathHistory();
    console.log(`[${config.PLUGIN_NAME}] 从历史记录返回: ${config.getCurrentPath()} -> ${previousPath}`);
    loadDirectoryWithoutHistory(previousPath);
    } else {
    // 如果没有历史记录，尝试获取当前路径的上级目录（限制在默认目录范围内）
    const parentPath = getParentDirectoryWithLimit(config.getCurrentPath());
    if (parentPath && parentPath !== config.getCurrentPath()) {
      console.log(`[${config.PLUGIN_NAME}] 返回上级目录（限制范围内）: ${config.getCurrentPath()} -> ${parentPath}`);
      loadDirectoryWithoutHistory(parentPath);
    } else if (config.getDefaultDirectory() && config.getCurrentPath() !== config.getDefaultDirectory()) {
      console.log(`[${config.PLUGIN_NAME}] 返回默认目录: ${config.getCurrentPath()} -> ${config.getDefaultDirectory()}`);
      loadDirectoryWithoutHistory(config.getDefaultDirectory());
    } else {
      console.log(`[${config.PLUGIN_NAME}] 无法返回，已在默认目录根目录`);
    }
  }
}

// ====== 样式应用重试机制 ======
function applyStylesWithRetry(attempt = 1, maxAttempts = 8) {
  const initialDelay = attempt === 1 ? 100 : 0; // 减少首次延迟
  
  setTimeout(() => {
    console.log(`[${config.PLUGIN_NAME}] 🎨 第${attempt}次尝试应用主题和样式...`);
    
    // 更全面的DOM元素检测
    const headers = document.querySelectorAll('.nz-header');
    const managers = document.querySelectorAll('.nz-manager');
    const sidebarTabs = document.querySelectorAll('[data-nz-tab]');
    const hasElements = headers.length > 0 || managers.length > 0 || sidebarTabs.length > 0;
    
    if (hasElements || attempt >= maxAttempts) {
      // DOM元素存在或已达到最大尝试次数，应用样式
      try {
        // 主题初始化和样式应用已迁移到模块化管理
        themeSystem.initializeTheme();
        themeSystem.applyBackgroundImage();
        
        if (hasElements) {
          console.log(`[${config.PLUGIN_NAME}] ✅ 样式应用成功！找到${headers.length}个头部和${managers.length}个管理器`);
          
          // ✅ 初始化布局观察器（确保DOM变化时样式正确）
          if (typeof initLayoutObserver === 'function') {
            initLayoutObserver();
      }
    } else {
          console.warn(`[${config.PLUGIN_NAME}] ⚠️  达到最大重试次数(${maxAttempts})，强制应用样式`);
        }
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] ❌ 样式应用失败:`, error);
      }
    } else {
      // DOM元素尚未创建，继续重试
      const nextDelay = Math.min(300 * attempt, 2000); // 减少延迟时间，更快响应
      console.log(`[${config.PLUGIN_NAME}] 🔄 DOM元素未找到，${nextDelay}ms后进行第${attempt + 1}次重试...`);
      
    setTimeout(() => {
        applyStylesWithRetry(attempt + 1, maxAttempts);
      }, nextDelay);
    }
  }, initialDelay);
}

// ====== 插件注册 ======
function registerPlugin() {
  // 确保模块已初始化
  if (!config) {
    console.log(`[NZWorkflowManager] 模块未初始化，先执行初始化`);
    const initSuccess = initializeModules(typeof app !== 'undefined' ? app : null);
    if (!initSuccess) {
      console.error(`[NZWorkflowManager] 模块初始化失败，无法注册插件`);
    return;
    }
  }
  
  if (!config) {
    console.error(`[NZWorkflowManager] 配置模块仍然为null，无法继续`);
    return;
  }
  
  if (config.isRegistered) {
    console.log(`[${config.PLUGIN_NAME}] 插件已注册，跳过重复注册`);
    return;
  }
  
  try {
    // 首先添加样式
    console.log(`[${config.PLUGIN_NAME}] 添加管理器样式`);
    addManagerStyles();
    
    // 确保所有模块都已初始化
    if (!sidebarRegistration) {
      console.error(`[${config.PLUGIN_NAME}] 侧边栏注册模块未初始化`);
      return;
    }
    
    if (!themeSystem) {
      console.error(`[${config.PLUGIN_NAME}] 主题系统模块未初始化`);
      return;
    }
    
    // ✅ 真模块化：使用侧边栏注册模块
    sidebarRegistration.registerPlugin();
    
    // 等待DOM创建完成后再应用样式（使用改进的重试机制）
    applyStylesWithRetry();
    
    // 应用背景图片
    themeSystem.applyBackgroundImage();
    
    config.setRegistered(true);
    console.log(`[${config.PLUGIN_NAME}] 插件注册成功`);
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 插件注册失败:`, error);
  }
}

// ====== 启动逻辑 ======
function startPlugin() {
  // 确保模块已初始化
  if (!config) {
    console.log(`[NZWorkflowManager] 启动时模块未初始化，先执行初始化`);
    const initSuccess = initializeModules(typeof app !== 'undefined' ? app : null);
    if (!initSuccess) {
      console.error(`[NZWorkflowManager] 启动时模块初始化失败`);
      return;
    }
  }
  
  if (config && config.isRegistered) return;
  
  if (typeof app !== 'undefined' && app.extensionManager) {
    console.log(`[${config ? config.PLUGIN_NAME : 'NZWorkflowManager'}] ComfyUI已就绪，开始初始化`);
    registerPlugin();
  } else {
    console.log(`[${config ? config.PLUGIN_NAME : 'NZWorkflowManager'}] ComfyUI未就绪，等待...`);
    setTimeout(startPlugin, 500);
  }
}

// 启动方式1: 通过comfy-app-ready事件
document.addEventListener('comfy-app-ready', startPlugin);

// 启动方式2: 直接尝试启动
startPlugin();

// 启动方式3: 超时回退
setTimeout(() => {
  if (!config.isRegistered) {
    console.warn(`[${config.PLUGIN_NAME}] 超时回退启动`);
    startPlugin();
  }
}, 3000);

console.log(`[${config.PLUGIN_NAME}] 启动流程完成`);
  
  // 添加全局拖拽接收处理器（使用模块化版本）
  dragDropManager.setupGlobalDragHandler();
  
  // 确保全局拖拽处理器正确设置（使用模块化版本）
  setTimeout(() => {
    dragDropManager.setupGlobalDragHandler();
  }, 1000);

// ====== 拖拽移动功能 ======
// TODO: Stage9_CLEANUP - 已迁移到模块，待清理
// performDragMove 函数已迁移到 modules/features/workflow-manager.js
// 如需调用，请使用: workflowManager.performDragMove()
// 此函数保留作为临时方案，将在第六阶段清理
async function performDragMove(sourcePath, targetPath) {
  try {
    // 获取文件/目录名
    const itemName = sourcePath.split('\\').pop();
    
    // 显示确认对话框
    const confirmed = await window.dialogManager.showConfirm(
      '确认移动文件',
      `确定要将文件 "${itemName}" 移动到目标目录吗？`
    );
    
    if (!confirmed) {
      // 用户取消操作，确保UI状态正确更新
      if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
        setTimeout(() => {
          multiSelectManager.updateMultiSelectButtonState();
        }, 100);
      }
      return;
    }
    
    window.nzWorkflowManager.showNotification('正在移动文件...', 'info');
    
    // 检查源路径是否存在
    try {
      const pathExists = await fileOperationsAPI.pathExists(sourcePath);
      if (!pathExists) {
        console.warn(`[${config.PLUGIN_NAME}] 源路径不存在，可能已被移动: ${sourcePath}`);
        window.nzWorkflowManager.showNotification('文件或目录已被移动或不存在', 'warning');
        loadDirectory(config.getCurrentPath());
        return;
      }
    } catch (pathCheckError) {
      console.warn(`[${config.PLUGIN_NAME}] 无法检查源路径存在性，继续移动操作:`, pathCheckError);
    }
    
    // 检测是否为目录，选择相应的移动方法
    let result;
    try {
      // 使用启发式方法检测目录：没有扩展名的通常是目录
      const isDirectory = !/\.[^/.]+$/.test(sourcePath);
      
      if (isDirectory) {
        result = await fileOperationsAPI.moveDirectory(sourcePath, targetPath);
      } else {
        result = await fileOperationsAPI.moveFile(sourcePath, targetPath);
      }
    } catch (error) {
      // 降级：默认使用 moveFile
      console.warn(`[${config.PLUGIN_NAME}] 类型检测失败，使用默认文件移动:`, error);
      result = await fileOperationsAPI.moveFile(sourcePath, targetPath);
    }
    
    if (result && result.success) {
      window.nzWorkflowManager.showNotification(`成功移动 "${itemName}" 到目标目录`, 'success');
      // 刷新当前目录显示
      loadDirectory(config.getCurrentPath());
      
      // 确保多选按钮状态正确
      setTimeout(() => {
        if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
          multiSelectManager.updateMultiSelectButtonState();
        }
      }, 100);
    } else {
      window.nzWorkflowManager.showNotification(`移动失败: ${result?.error || '未知错误'}`, 'error');
      
      // 确保多选按钮状态正确
      setTimeout(() => {
        if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
          multiSelectManager.updateMultiSelectButtonState();
        }
      }, 100);
    }
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 拖拽移动失败:`, error);
    
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
      if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
        multiSelectManager.updateMultiSelectButtonState();
      }
    }, 100);
  }
}

// ====== 多选拖拽移动功能 ======
// TODO: Stage9_CLEANUP - 已迁移到模块，待清理
// performMultiDragMove 函数已迁移到 modules/features/workflow-manager.js
// 如需调用，请使用: workflowManager.performMultiDragMove()
// 此函数保留作为临时方案，将在第六阶段清理
async function performMultiDragMove(sourcePaths, targetPath) {
  try {
    // 获取文件名列表
    const fileNames = sourcePaths.map(filePath => filePath.split('\\').pop());
    const fileNamesText = fileNames.join('", "');
    
    // 显示确认对话框
    const confirmed = await window.dialogManager.showConfirm(
      '确认移动多个项目',
      `确定要将以下 ${sourcePaths.length} 个文件移动到目标目录吗？\n\n"${fileNamesText}"`
    );
    
    if (!confirmed) {
      // 用户取消操作，确保UI状态正确更新
      if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
        setTimeout(() => {
          multiSelectManager.updateMultiSelectButtonState();
        }, 100);
      }
      return;
    }
    
    window.nzWorkflowManager.showNotification(`正在移动 ${sourcePaths.length} 个文件...`, 'info');
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    // 逐个移动文件
    for (const filePath of sourcePaths) {
      try {
        const result = await fileOperationsAPI.moveFile(filePath, targetPath);
        if (result && result.success) {
          successCount++;
        } else {
          failCount++;
          const fileName = filePath.split('\\').pop();
          errors.push(`${fileName}: ${result?.error || '未知错误'}`);
        }
      } catch (error) {
        failCount++;
        const fileName = filePath.split('\\').pop();
        errors.push(`${fileName}: ${error.message}`);
      }
    }
    
    // 显示结果
    if (failCount === 0) {
      window.nzWorkflowManager.showNotification(`成功移动所有 ${successCount} 个文件到目标目录`, 'success');
    } else {
      window.nzWorkflowManager.showNotification(`移动完成: ${successCount} 个成功, ${failCount} 个失败`, 'warning');
      console.error(`[${config.PLUGIN_NAME}] 部分文件移动失败:`, errors);
    }
    
    // 清除多选状态，但保持多选模式
    multiSelectManager.clearSelection();
    
    // 刷新当前目录显示
    loadDirectory(config.getCurrentPath());
    
    // 确保多选按钮状态正确（在拖拽完成后强制更新）
    setTimeout(() => {
      if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
        multiSelectManager.updateMultiSelectButtonState();
      }
    }, 200);
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 多选拖拽移动失败:`, error);
    window.nzWorkflowManager.showNotification(`移动失败: ${error.message}`, 'error');
  }
}

// ====== 右键上下文菜单系统 (v3.0.0新增) ======
// ✅ Stage6已完成：交互系统已迁移到 modules/ui/interaction-system.js
// 包含：ContextMenuManager, DialogManager, ConflictResolutionDialogManager, MultiSelectManager
// TODO: Stage9_CLEANUP - 以下类定义已迁移到模块中，待清理

// TODO: Stage9_CLEANUP - 以下类定义已迁移到模块中，待清理
// ⚠️ 已迁移：此类已迁移到 modules/ui/interaction-system.js，现在使用模块化版本
// 现在使用: modules/ui/interaction-system.js 中的 ContextMenuManager 类
class ContextMenuManager {
  constructor() {
    this.currentMenu = null;
    this.directoryCache = new Map(); // 缓存目录列表
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
  
  // 获取目录列表（用于子菜单）
  async getDirectoryList(rootPath = null) {
    // 优先使用模块化的方法（包含历史目录功能）
    if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
      const contextMenuManager = window.nzWorkflowManager.interactionSystem.getContextMenuManager();
      if (contextMenuManager && contextMenuManager.getDirectoryList) {
        return await contextMenuManager.getDirectoryList(rootPath);
      }
    }
    
    // 降级到原始实现
    const basePath = rootPath || defaultDirectory || config.getCurrentPath();
    
    // 检查缓存
    if (this.directoryCache.has(basePath)) {
      const cached = this.directoryCache.get(basePath);
      // 缓存5分钟
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return cached.directories;
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
      
      return result;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 获取目录列表失败:`, error);
      return [];
    }
  }
  
  // 为菜单加载目录（简化版本的loadDirectory）
  async loadDirectoriesForMenu(dirPath) {
    console.log(`[${config.PLUGIN_NAME}] 🔍 加载目录菜单: ${dirPath}`);
    try {
      // 使用正确的/file_operations端点
      const response = await fetch(`${window.location.origin}/file_operations?action=list_directory&path=${encodeURIComponent(dirPath)}`);
      console.log(`[${config.PLUGIN_NAME}] 📡 HTTP请求状态: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[${config.PLUGIN_NAME}] 📋 服务器返回数据:`, data);
        
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
          console.log(`[${config.PLUGIN_NAME}] 📁 解析目录数组:`, directories);
          const processedDirs = directories.map(dir => {
            // 处理字符串格式的目录名
            const dirName = typeof dir === 'string' ? dir : (dir.name || dir);
            return {
              name: dirName,
              path: dirPath ? `${dirPath}\\${dirName}` : dirName
            };
          });
          console.log(`[${config.PLUGIN_NAME}] ✅ 处理后的目录列表:`, processedDirs);
          return processedDirs;
        } else {
          console.warn(`[${config.PLUGIN_NAME}] ⚠️ directories不是数组:`, directories);
        }
      }
    } catch (error) {
      console.log(`[${config.PLUGIN_NAME}] HTTP端点失败，尝试WebSocket`);
    }
    
    // 如果HTTP失败，返回特殊目录（根目录和历史目录）
    const specialDirectories = [];
    
    // 添加根目录
    if (defaultDirectory) {
      specialDirectories.push({
        name: '🏠 根目录',
        path: defaultDirectory,
        isRoot: true
      });
    }
    
    // 添加历史目录
    if (window.nzWorkflowManager && window.nzWorkflowManager.interactionSystem) {
      const directoryHistory = window.nzWorkflowManager.interactionSystem.getDirectoryHistory();
      if (directoryHistory) {
        const historyDirectories = directoryHistory.getFormattedHistory();
        specialDirectories.push(...historyDirectories);
      }
    }
    
    return specialDirectories;
  }
  
  // 显示文件右键菜单
  async showFileContextMenu(event, filePath, fileName) {
    event.preventDefault();
    
    // 获取目录列表用于子菜单
    const directories = await this.getDirectoryList();
    
    // 检查是否有备注
    const hasNote = window.nzWorkflowManager.workflowNotesManager.hasNote(filePath);
    
    const menuItems = [
      { 
        label: '📄 加载工作流', 
        action: () => {
          this.hideMenu();
          loadWorkflow(filePath);
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
              window.nzWorkflowManager.openNoteEditor(filePath);
            }
          },
          ...(hasNote ? [
            {
              label: '🗑️ 删除备注',
              action: () => {
                this.hideMenu();
                window.nzWorkflowManager.deleteWorkflowNote(filePath);
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
              window.nzWorkflowManager.CustomIconManager.showIconSelectorDialog(filePath, fileName);
            }
          },
          {
            label: '🔄 重置为默认',
            action: () => {
              this.hideMenu();
              window.nzWorkflowManager.CustomIconManager.removeCustomIcon(filePath);
              window.nzWorkflowManager.showNotification(`已重置 ${fileName} 的图标`, 'success');
              // 刷新当前目录
              const currentPath = window.nzWorkflowManager?.config?.getCurrentPath?.();
              if (currentPath && typeof window.loadDirectory === 'function') {
                console.log(`[${window.nzWorkflowManager?.config?.PLUGIN_NAME || 'NZWorkflowManager'}] 图标重置成功，刷新目录: ${currentPath}`);
                window.loadDirectory(currentPath);
              } else if (currentPath && typeof loadDirectory === 'function') {
                console.log(`[${window.nzWorkflowManager?.config?.PLUGIN_NAME || 'NZWorkflowManager'}] 图标重置成功，刷新目录: ${currentPath}`);
                loadDirectory(currentPath);
              } else {
                console.warn(`[${window.nzWorkflowManager?.config?.PLUGIN_NAME || 'NZWorkflowManager'}] 无法刷新目录，loadDirectory函数或当前路径不可用`);
              }
            }
          }
        ]
      },
      { separator: true },
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
            label: dir.name,
            action: () => {
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
              this.copyItem(filePath, fileName, 'file');
            }
          },
          { separator: true },
          ...directories.slice(0, 8).map(dir => ({
            label: dir.name,
            action: () => {
              this.copyItemToPath(filePath, fileName, dir.path);
            }
          }))
        ]
      },
      { separator: true },
      { 
        label: '✏️ 重命名', 
        action: () => {
          this.hideMenu();
          this.renameItem(filePath, fileName, 'file');
        }
      },
      { separator: true },
      { 
        label: '🗑️ 删除', 
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
  async showDirectoryContextMenu(event, directoryPath, directoryName) {
    event.preventDefault();
    
    // 获取目录列表用于子菜单
    const directories = await this.getDirectoryList();
    
    const menuItems = [
      { 
        label: '📂 进入目录', 
        action: () => {
          this.hideMenu();
          loadDirectory(directoryPath);
        }
      },
      { separator: true },
      { 
        label: '📋 复制目录副本', 
        action: () => {
          this.hideMenu();
          this.copyDirectory(directoryPath, directoryName);
        }
      },
      { 
        label: '🚀 移动到',
        submenu: [
          {
            label: '📁 选择其他目录...',
            action: () => {
              this.moveItem(directoryPath, directoryName, 'directory');
            }
          },
          { separator: true },
          ...directories.slice(0, 8).map(dir => ({
            label: dir.name,
            action: () => {
              this.moveItemToPath(directoryPath, directoryName, dir.path);
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
              this.copyItem(directoryPath, directoryName, 'directory');
            }
          },
          { separator: true },
          ...directories.slice(0, 8).map(dir => ({
            label: dir.name,
            action: () => {
              this.copyItemToPath(directoryPath, directoryName, dir.path);
            }
          }))
        ]
      },
      { separator: true },
      { 
        label: '✏️ 重命名', 
        action: () => {
          this.hideMenu();
          this.renameItem(directoryPath, directoryName, 'directory');
        }
      },
      { separator: true },
      { 
        label: '🗑️ 删除', 
        action: () => {
          this.hideMenu();
          this.deleteItem(directoryPath, directoryName, 'directory');
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
          loadDirectory(config.getCurrentPath());
        }
      }
    ];
    
    this.showMenu(event, menuItems);
  }
  
  // 显示菜单
  showMenu(event, menuItems) {
    this.hideMenu(); // 先隐藏现有菜单
    
    const menu = document.createElement('div');
    menu.className = 'nz-context-menu';
    
    menuItems.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = 'nz-context-menu-separator';
        menu.appendChild(separator);
      } else {
        const menuItem = document.createElement('button');
        menuItem.className = 'nz-context-menu-item';
        if (item.className) {
          menuItem.classList.add(item.className);
        }
        
        // 处理有子菜单的项目
        if (item.submenu) {
          menuItem.classList.add('has-submenu');
          
          // 创建标签文本
          const labelSpan = document.createElement('span');
          labelSpan.textContent = item.label;
          menuItem.appendChild(labelSpan);
          
          // 创建子菜单
          const submenu = document.createElement('div');
          submenu.className = 'nz-context-submenu';
          
          // 添加子菜单项
          item.submenu.forEach(subItem => {
            if (subItem.separator) {
              const separator = document.createElement('div');
              separator.className = 'nz-context-menu-separator';
              submenu.appendChild(separator);
            } else {
              const subMenuItem = document.createElement('button');
              subMenuItem.className = 'nz-context-submenu-item';
              subMenuItem.textContent = subItem.label;
              subMenuItem.onclick = (e) => {
                e.stopPropagation();
                this.hideMenu();
                subItem.action();
              };
              submenu.appendChild(subMenuItem);
            }
          });
          
          menuItem.appendChild(submenu);
          
          // 添加鼠标事件监听器确保子菜单正常显示
          menuItem.addEventListener('mouseenter', () => {
            submenu.style.display = 'block';
          });
          
          menuItem.addEventListener('mouseleave', () => {
            submenu.style.display = 'none';
          });
        } else {
          // 普通菜单项
          menuItem.textContent = item.label;
          menuItem.onclick = item.action;
        }
        
        menu.appendChild(menuItem);
      }
    });
    
    // 定位菜单
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    
    // 检查边界，防止菜单超出屏幕
    document.body.appendChild(menu);
    
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = (event.clientX - rect.width) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = (event.clientY - rect.height) + 'px';
      }
    }, 0);
    
    this.currentMenu = menu;
  }
  
  // 隐藏菜单
  hideMenu() {
    if (this.currentMenu) {
      this.currentMenu.remove();
      this.currentMenu = null;
    }
  }
  
  // 直接移动项目到指定路径
  async moveItemToPath(itemPath, itemName, targetPath) {
    if (itemPath === targetPath) {
      window.nzWorkflowManager.showNotification('源路径和目标路径相同', 'warning');
      return;
    }
    
    try {
      window.nzWorkflowManager.showNotification('正在移动...', 'info');
      
      const result = await fileOperationsAPI.moveFile(itemPath, targetPath);
      
      if (result && result.success) {
        window.nzWorkflowManager.showNotification(`成功移动"${itemName}"到 ${targetPath}`, 'success');
        loadDirectory(config.getCurrentPath()); // 刷新当前目录
      } else {
        window.nzWorkflowManager.showNotification(`移动失败: ${result?.error || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 移动操作失败:`, error);
      window.nzWorkflowManager.showNotification(`移动失败: ${error.message}`, 'error');
    }
  }
  
  // 直接复制项目到指定路径
  async copyItemToPath(itemPath, itemName, targetPath) {
    if (itemPath === targetPath) {
      window.nzWorkflowManager.showNotification('源路径和目标路径相同', 'warning');
      return;
    }
    
    try {
      window.nzWorkflowManager.showNotification('正在复制...', 'info');
      
      const result = await fileOperationsAPI.copyFile(itemPath, targetPath);
      
      if (result && result.success) {
        window.nzWorkflowManager.showNotification(`成功复制"${itemName}"到 ${targetPath}`, 'success');
        loadDirectory(config.getCurrentPath()); // 刷新当前目录
      } else {
        window.nzWorkflowManager.showNotification(`复制失败: ${result?.error || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 复制操作失败:`, error);
      window.nzWorkflowManager.showNotification(`复制失败: ${error.message}`, 'error');
    }
  }
  
  // 创建目录
  async createDirectory(parentPath) {
    const directoryName = await window.dialogManager.showInput(
      '新建文件夹', 
      '请输入文件夹名称',
      '新建文件夹'
    );
    
    if (directoryName && directoryName.trim()) {
      try {
        window.nzWorkflowManager.showNotification('正在创建文件夹...', 'info');
        const result = await fileOperationsAPI.createDirectory(parentPath, directoryName.trim());
        
        if (result && result.success) {
          window.nzWorkflowManager.showNotification('文件夹创建成功', 'success');
          // 刷新当前目录
          loadDirectory(config.getCurrentPath());
        } else {
          window.nzWorkflowManager.showNotification(`创建失败: ${result?.error || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] 创建目录失败:`, error);
        window.nzWorkflowManager.showNotification(`创建失败: ${error.message}`, 'error');
      }
    }
  }
  
  // 重命名项目
  async renameItem(itemPath, currentName, itemType) {
    const newName = await window.dialogManager.showInput(
      itemType === 'file' ? '重命名文件' : '重命名文件夹',
      '请输入新名称',
      currentName.replace(/\.[^/.]+$/, "") // 移除文件扩展名
    );
    
    if (newName && newName.trim() && newName.trim() !== currentName.replace(/\.[^/.]+$/, "")) {
      try {
        window.nzWorkflowManager.showNotification('正在重命名...', 'info');
        
        // 如果是文件，保留原扩展名
        let finalName = newName.trim();
        if (itemType === 'file') {
          const extension = currentName.substring(currentName.lastIndexOf('.'));
          if (extension && !finalName.endsWith(extension)) {
            finalName += extension;
          }
        }
        
        const result = await fileOperationsAPI.rename(itemPath, finalName);
        
        if (result && result.success) {
          window.nzWorkflowManager.showNotification('重命名成功', 'success');
          // 刷新当前目录
          loadDirectory(config.getCurrentPath());
        } else {
          window.nzWorkflowManager.showNotification(`重命名失败: ${result?.error || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] 重命名失败:`, error);
        window.nzWorkflowManager.showNotification(`重命名失败: ${error.message}`, 'error');
      }
    }
  }
  
  // 删除项目
  async deleteItem(itemPath, itemName, itemType) {
    const confirmed = await window.dialogManager.showConfirm(
      itemType === 'file' ? '删除文件' : '删除文件夹',
      `确定要删除 "${itemName}" 吗？${itemType === 'directory' ? '\\n\\n注意：这将删除文件夹及其所有内容！' : ''}`
    );
    
    if (confirmed) {
      try {
        window.nzWorkflowManager.showNotification('正在删除...', 'info');
        
        let result;
        if (itemType === 'file') {
          result = await fileOperationsAPI.deleteFile(itemPath);
        } else {
          result = await fileOperationsAPI.deleteDirectory(itemPath);
        }
        
        if (result && result.success) {
          window.nzWorkflowManager.showNotification('删除成功', 'success');
          // 刷新当前目录
          loadDirectory(config.getCurrentPath());
        } else {
          window.nzWorkflowManager.showNotification(`删除失败: ${result?.error || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] 删除失败:`, error);
        window.nzWorkflowManager.showNotification(`删除失败: ${error.message}`, 'error');
      }
    }
  }
  
  // 移动项目到其他目录
  async moveItem(itemPath, itemName, itemType) {
    const targetPath = await window.dialogManager.showDirectoryChooser(
      '选择目标目录',
      `请选择要移动 "${itemName}" 到的目标目录：`
    );
    
    if (targetPath) {
      try {
        window.nzWorkflowManager.showNotification('正在移动...', 'info');
        
        // 检查路径类型并调用相应API
        let result;
        try {
          const isDirectory = await isDirectoryPath(itemPath);
          if (isDirectory) {
            result = await fileOperationsAPI.moveDirectory(itemPath, targetPath);
          } else {
            result = await fileOperationsAPI.moveFile(itemPath, targetPath);
          }
        } catch (error) {
          console.error(`[${config.PLUGIN_NAME}] 检查路径类型失败，默认使用moveFile:`, error);
          result = await fileOperationsAPI.moveFile(itemPath, targetPath);
        }
        
        if (result && result.success) {
          window.nzWorkflowManager.showNotification(`成功移动到 ${targetPath}`, 'success');
          loadDirectory(config.getCurrentPath()); // 刷新当前目录
        } else {
          window.nzWorkflowManager.showNotification(`移动失败: ${result?.error || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] 移动失败:`, error);
        window.nzWorkflowManager.showNotification(`移动失败: ${error.message}`, 'error');
      }
    }
  }
  
  // 复制项目到其他目录
  async copyItem(itemPath, itemName, itemType) {
    const targetPath = await window.dialogManager.showDirectoryChooser(
      '选择目标目录',
      `请选择要复制 "${itemName}" 到的目标目录：`
    );
    
    if (targetPath) {
      try {
        window.nzWorkflowManager.showNotification('正在复制...', 'info');
        
        // 检查源路径是文件还是目录
        const isDirectory = itemType === 'directory' || !/\.[^/.]+$/.test(itemPath);
        let result;
        
        if (isDirectory) {
          result = await fileOperationsAPI.copyDirectory(itemPath, targetPath);
        } else {
          result = await fileOperationsAPI.copyFile(itemPath, targetPath);
        }
        
        if (result && result.success) {
          const itemTypeStr = isDirectory ? '目录' : '文件';
          window.nzWorkflowManager.showNotification(`成功复制${itemTypeStr}到 ${targetPath}`, 'success');
          loadDirectory(config.getCurrentPath()); // 刷新当前目录
        } else {
          window.nzWorkflowManager.showNotification(`复制失败: ${result?.error || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] 复制失败:`, error);
        window.nzWorkflowManager.showNotification(`复制失败: ${error.message}`, 'error');
      }
    }
  }
  
  // 复制工作流副本（在同一目录创建副本）
  async copyWorkflow(filePath, fileName) {
    // 生成副本名称
    const fileExt = fileName.split('.').pop();
    const baseName = fileName.replace(`.${fileExt}`, '');
    const copyName = `${baseName}_副本.${fileExt}`;
    
    const newName = await window.dialogManager.showInput(
      '复制工作流副本',
      '请输入副本名称：',
      copyName
    );
    
    if (newName && newName !== fileName) {
      try {
        window.nzWorkflowManager.showNotification('正在创建副本...', 'info');
        
        // 获取当前目录路径
        const currentDir = filePath.substring(0, filePath.lastIndexOf('\\'));
        const targetPath = `${currentDir}\\${newName}`;
        
        const result = await fileOperationsAPI.copyFile(filePath, currentDir, newName);
        
        if (result && result.success) {
          window.nzWorkflowManager.showNotification(`成功创建副本: ${newName}`, 'success');
          loadDirectory(config.getCurrentPath()); // 刷新当前目录
        } else {
          window.nzWorkflowManager.showNotification(`创建副本失败: ${result?.error || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] 创建副本失败:`, error);
        
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
        } else {
          errorMessage += `：${error.message}`;
        }
        
        if (suggestion) {
          errorMessage += ` (${suggestion})`;
        }
        
        window.nzWorkflowManager.showNotification(errorMessage, 'error');
      }
    }
  }
  
  // 复制目录副本（在同一目录创建副本）
  async copyDirectory(directoryPath, directoryName) {
    const copyName = `${directoryName}_副本`;
    
    const newName = await window.dialogManager.showInput(
      '复制目录副本',
      '请输入副本名称：',
      copyName
    );
    
    if (newName && newName !== directoryName) {
      try {
        window.nzWorkflowManager.showNotification('正在创建目录副本...', 'info');
        
        // 获取父目录路径
        const parentDir = directoryPath.substring(0, directoryPath.lastIndexOf('\\'));
        
        const result = await fileOperationsAPI.copyDirectory(directoryPath, parentDir, newName);
        
        if (result && result.success) {
          window.nzWorkflowManager.showNotification(`成功创建目录副本: ${newName}`, 'success');
          loadDirectory(config.getCurrentPath()); // 刷新当前目录
        } else {
          window.nzWorkflowManager.showNotification(`创建目录副本失败: ${result?.error || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] 创建目录副本失败:`, error);
        window.nzWorkflowManager.showNotification(`创建目录副本失败: ${error.message}`, 'error');
      }
    }
  }
}

// TODO: Stage9_CLEANUP - 以下类定义已迁移到模块中，待清理
// ⚠️ 已迁移：此类已迁移到 modules/ui/interaction-system.js，现在使用模块化版本
// 现在使用: modules/ui/interaction-system.js 中的 DialogManager 类
class DialogManager {
  constructor() {
    this.currentDialog = null;
  }
  
  // 显示输入对话框
  showInputDialog(title, placeholder, defaultValue = '') {
    return new Promise((resolve) => {
      this.hideDialog(); // 先隐藏现有对话框
      
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
        this.hideDialog();
        resolve(null);
      };
      
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'nz-dialog-button primary';
      confirmBtn.textContent = '确定';
      confirmBtn.onclick = () => {
        const value = input.value.trim();
        this.hideDialog();
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
    });
  }
  
  // 显示确认对话框
  showConfirmDialog(title, message, dangerAction = false) {
    return new Promise((resolve) => {
      this.hideDialog(); // 先隐藏现有对话框
      
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
        this.hideDialog();
        resolve(false);
      };
      
      const confirmBtn = document.createElement('button');
      confirmBtn.className = `nz-dialog-button ${dangerAction ? 'danger' : 'primary'}`;
      confirmBtn.textContent = '确定';
      confirmBtn.onclick = () => {
        this.hideDialog();
        resolve(true);
      };
      
      // ESC键取消
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelBtn.click();
        }
      });
      
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
          cancelBtn.click();
        }
      });
      
      this.currentDialog = overlay;
    });
  }
  
  // 隐藏对话框
  hideDialog() {
    if (this.currentDialog) {
      this.currentDialog.remove();
      this.currentDialog = null;
    }
  }
  
  // 显示设置对话框
  showSettingsDialog() {
    this.hideDialog(); // 先隐藏现有对话框
    
    const overlay = document.createElement('div');
    overlay.className = 'nz-dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'nz-dialog nz-settings-dialog';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'nz-dialog-title';
    titleEl.innerHTML = '<i class="pi pi-cog"></i> NZ工作流助手 - 设置';
    
    const content = document.createElement('div');
    content.className = 'nz-settings-content';
    content.innerHTML = `
      <div class="nz-settings-section">
        <h4><i class="pi pi-info-circle"></i> 插件信息</h4>
        <div class="nz-info-grid">
          <div class="nz-info-item">
            <span class="nz-info-label">插件名称:</span>
            <span class="nz-info-value">NZ工作流助手</span>
          </div>
          <div class="nz-info-item">
            <span class="nz-info-label">版本:</span>
            <span class="nz-info-value">v3.2.9</span>
          </div>
          <div class="nz-info-item">
            <span class="nz-info-label">作者:</span>
            <span class="nz-info-value">NZan</span>
          </div>
          <div class="nz-info-item">
            <span class="nz-info-label">功能:</span>
            <span class="nz-info-value">ComfyUI工作流管理器</span>
          </div>
        </div>
      </div>
      
      <div class="nz-settings-section">
        <h4><i class="pi pi-palette"></i> 主题设置</h4>
        <div class="nz-theme-selector">
          <label class="nz-theme-option">
            <input type="radio" name="theme" value="auto" checked>
            <span class="nz-theme-preview nz-theme-auto"></span>
            <span class="nz-theme-name">自动适配</span>
          </label>
          <label class="nz-theme-option">
            <input type="radio" name="theme" value="dark">
            <span class="nz-theme-preview nz-theme-dark"></span>
            <span class="nz-theme-name">深色主题</span>
          </label>
          <label class="nz-theme-option">
            <input type="radio" name="theme" value="light">
            <span class="nz-theme-preview nz-theme-light"></span>
            <span class="nz-theme-name">浅色主题</span>
          </label>
        </div>
      </div>
      
      <div class="nz-settings-section">
        <h4><i class="pi pi-info-circle"></i> 版本信息</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div class="nz-version-info" style="background: rgba(50, 70, 90, 0.3); padding: 12px; border-radius: 6px; border: 1px solid rgba(80, 120, 160, 0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #a0b0c0; font-size: 13px;">当前版本:</span>
              <span style="color: #6ecbfb; font-weight: bold;">${config.PLUGIN_VERSION}</span>
            </div>
            <div style="color: #90a0b0; font-size: 12px;">
              NZ工作流助手 - 本地文件管理工具
            </div>
          </div>
          
          <p style="font-size: 12px; color: #b0c0d0; margin: 0; line-height: 1.4;">
            专注于本地工作流文件管理，提供高效的浏览和导入功能。
          </p>
        </div>
      </div>

      <div class="nz-settings-section">
        <h4><i class="pi pi-wrench"></i> 调试选项</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button type="button" class="nz-dialog-button" id="nz-reset-warnings-btn" style="background: rgba(200, 120, 70, 0.8); border-color: rgba(220, 140, 90, 0.6);">
            <i class="pi pi-refresh"></i> 重置警告提示
          </button>
          <p style="font-size: 12px; color: #b0c0d0; margin: 0; line-height: 1.4;">
            此功能可以重置浮动工作流管理器的警告提示，使其立即显示（无需等待一周）。
          </p>
        </div>
      </div>

    `;
    
    const buttons = document.createElement('div');
    buttons.className = 'nz-dialog-buttons';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'nz-dialog-button primary';
    saveBtn.innerHTML = '<i class="pi pi-check"></i> 保存设置';
    saveBtn.onclick = () => {
      // 保存设置
      this.saveSettings();
      this.hideDialog();
      window.nzWorkflowManager.showNotification('设置已保存！', 'success');
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'nz-dialog-button';
    cancelBtn.innerHTML = '<i class="pi pi-times"></i> 取消';
    cancelBtn.onclick = () => {
      this.hideDialog();
    };
    
    // ESC键关闭
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hideDialog();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(saveBtn);
    
    dialog.appendChild(titleEl);
    dialog.appendChild(content);
    dialog.appendChild(buttons);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideDialog();
      }
    });
    
    // 加载当前设置
    this.loadSettings();
    
    // 更新管理按钮事件已移除 (v3.4.0) - 已备份到 privateserver-function/
    
    // 更新设置按钮事件已移除 (v3.4.0) - 已备份到 privateserver-function/

    // 绑定重置警告按钮事件
    const resetWarningsBtn = dialog.querySelector('#nz-reset-warnings-btn');
    if (resetWarningsBtn) {
      resetWarningsBtn.addEventListener('click', () => {
        try {
          // 重置浮动警告
          if (window.floatingWorkflowManager && window.floatingWorkflowManager.resetFloatingWarning) {
            window.floatingWorkflowManager.resetFloatingWarning();
          }
          window.nzWorkflowManager.showNotification('警告提示已重置！', 'success');
        } catch (error) {
          console.error(`[${config.PLUGIN_NAME}] 重置警告失败:`, error);
          window.nzWorkflowManager.showNotification('重置警告失败！', 'error');
        }
      });
    }
    
    this.currentDialog = overlay;
  }
  
  // 保存设置
  saveSettings() {
    try {
      const settings = {
        theme: document.querySelector('input[name="theme"]:checked')?.value || 'auto'
      };
      
      localStorage.setItem('nz_settings', JSON.stringify(settings));
      
      // 应用主题设置
      this.applyThemeSettings(settings.theme);
      
      console.log(`[${config.PLUGIN_NAME}] 设置已保存:`, settings);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 保存设置失败:`, error);
      window.nzWorkflowManager.showNotification('保存设置失败！', 'error');
    }
  }
  
  // 加载设置
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('nz_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // 应用设置到界面
        const themeRadio = document.querySelector(`input[name="theme"][value="${settings.theme}"]`);
        if (themeRadio) themeRadio.checked = true;
        
        // 应用主题
        this.applyThemeSettings(settings.theme);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 加载设置失败:`, error);
    }
  }
  
  // 应用主题设置
  applyThemeSettings(theme) {
    try {
      if (theme === 'auto') {
        // 自动模式：检测ComfyUI当前主题并应用
        const detectedTheme = themeSystem.detectComfyUITheme(true);
        if (detectedTheme) {
          console.log(`[${config.PLUGIN_NAME}] 自动模式检测到主题: ${detectedTheme}`);
          applyTheme(detectedTheme);
        }
      } else if (theme === 'light' || theme === 'dark') {
        // 手动模式：直接应用指定主题
        console.log(`[${config.PLUGIN_NAME}] 手动应用主题: ${theme}`);
        applyTheme(theme);
      }
      
      // 保存主题设置到localStorage
      localStorage.setItem('nz_theme_mode', theme);
      window.nzWorkflowManager.showNotification(`主题已切换到: ${theme === 'auto' ? '自动适配' : theme === 'light' ? '浅色' : '深色'}`, 'success');
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 应用主题设置失败:`, error);
      window.nzWorkflowManager.showNotification('主题切换失败！', 'error');
    }
  }
  
  // 显示重要信息对话框
  showImportantInfoDialog() {
    this.hideDialog(); // 先隐藏现有对话框
    
    const overlay = document.createElement('div');
    overlay.className = 'nz-dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'nz-dialog nz-important-info-dialog';
    dialog.style.maxWidth = '420px';
    dialog.style.minWidth = '380px';
    dialog.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
    dialog.style.border = '2px solid #4a90e2';
    dialog.style.borderRadius = '12px';
    dialog.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.25), 0 0 15px rgba(74, 144, 226, 0.15)';
    dialog.style.overflow = 'hidden';
    
    // 调整为更宽松的布局
    const content = document.createElement('div');
    content.className = 'nz-dialog-content';
    content.style.padding = '20px';
    content.style.lineHeight = '1.4';
    content.innerHTML = `
      <!-- 标题区域 -->
      <div style="text-align: center; margin-bottom: 18px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #ff6b6b;">
          <i class="pi pi-exclamation-triangle" style="margin-right: 8px;"></i>重要说明
        </h3>
      </div>
      
      <!-- 警告信息 -->
      <div style="background: rgba(255, 107, 107, 0.08); border-left: 3px solid #ff6b6b; padding: 12px 14px; border-radius: 6px; margin-bottom: 14px;">
        <div style="color: #ff9999; font-size: 14px; font-weight: 600; margin-bottom: 6px;">
          ⚠️ 使用时请勿操作官方工作流功能
        </div>
        <div style="color: #ffcccc; font-size: 12px; line-height: 1.5;">
          在使用插件期间，避免点击"新建"、"保存"、"切换TAB"、"清空"等操作，这些会导致当前工作流文件被覆盖或丢失！
        </div>
      </div>
      
      <!-- 说明信息 -->
      <div style="background: rgba(74, 144, 226, 0.08); border-left: 3px solid #4a90e2; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px;">
        <div style="color: #b3d9ff; font-size: 12px; line-height: 1.4;">
          <i class="pi pi-info-circle" style="margin-right: 6px;"></i>
          由于ComfyUI的内部机制限制，目前无法完美解决与官方功能的冲突问题
        </div>
      </div>
      
      <!-- 建议信息 -->
      <div style="background: rgba(52, 168, 83, 0.08); border-left: 3px solid #34a853; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px;">
        <div style="color: #b3e5c3; font-size: 12px; line-height: 1.4;">
          <i class="pi pi-lightbulb" style="margin-right: 6px;"></i>
          建议：在设置中将"已打开工作流"显示模式改为"侧边栏"模式，可以减少冲突
        </div>
      </div>
      
      <!-- 文档链接区域 -->
      <div style="text-align: center; background: rgba(138, 43, 226, 0.08); border: 1px solid rgba(138, 43, 226, 0.2); border-radius: 8px; padding: 14px;">
        <div style="color: #e6ccff; font-size: 13px; font-weight: 600; margin-bottom: 10px;">
          📚 获取更新/反馈问题
        </div>
        <a href="https://www.notion.so/25b3834f177a800493d9d915d26c398c" 
           target="_blank" 
           style="display: inline-block; background: linear-gradient(135deg, #9966cc, #663399); color: white; text-decoration: none; 
                  font-weight: 600; font-size: 13px; padding: 8px 16px; border-radius: 14px; 
                  box-shadow: 0 3px 10px rgba(153, 102, 204, 0.25); transition: all 0.2s ease;"
           onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(153, 102, 204, 0.35)';"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(153, 102, 204, 0.25)';">
          <i class="pi pi-book" style="margin-right: 6px;"></i>访问文档
        </a>
      </div>
    `;
    
    const buttons = document.createElement('div');
    buttons.className = 'nz-dialog-buttons';
    buttons.style.justifyContent = 'center';
    buttons.style.padding = '12px 20px 16px 20px';
    buttons.style.background = 'rgba(74, 144, 226, 0.03)';
    buttons.style.borderTop = '1px solid rgba(74, 144, 226, 0.15)';
    
    const okBtn = document.createElement('button');
    okBtn.className = 'nz-dialog-button primary';
    okBtn.style.background = 'linear-gradient(135deg, #4a90e2, #357abd)';
    okBtn.style.border = 'none';
    okBtn.style.borderRadius = '18px';
    okBtn.style.padding = '8px 24px';
    okBtn.style.fontSize = '14px';
    okBtn.style.fontWeight = '600';
    okBtn.style.color = 'white';
    okBtn.style.cursor = 'pointer';
    okBtn.style.transition = 'all 0.2s ease';
    okBtn.style.boxShadow = '0 3px 12px rgba(74, 144, 226, 0.25)';
    okBtn.innerHTML = '<i class="pi pi-check" style="margin-right: 8px;"></i>我知道了';
    okBtn.onmouseover = () => {
      okBtn.style.transform = 'translateY(-1px)';
      okBtn.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.35)';
    };
    okBtn.onmouseout = () => {
      okBtn.style.transform = 'translateY(0)';
      okBtn.style.boxShadow = '0 3px 12px rgba(74, 144, 226, 0.25)';
    };
    okBtn.onclick = () => {
      this.hideDialog();
    };
    
    // ESC键关闭
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hideDialog();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    buttons.appendChild(okBtn);
    
    dialog.appendChild(content);
    dialog.appendChild(buttons);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideDialog();
      }
    });
    
    this.currentDialog = overlay;
  }
  
  // 显示目录选择器（优化版本 - 直接显示目录树）
  showDirectoryChooser(title, message) {
    return new Promise((resolve) => {
      this.hideDialog(); // 先隐藏现有对话框
      
      // 直接显示目录树选择器，跳过中间步骤
      this.showDirectoryTreeChooser((selectedPath) => {
        resolve(selectedPath);
      });
    });
  }
  
  // 调用系统目录选择器
  async chooseDirectory() {
    try {
      const response = await fileOperationsAPI.chooseDirectory();
      if (response && response.success && response.path) {
        return response.path;
      }
      return null;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 目录选择失败:`, error);
      return null;
    }
  }
  
  // 显示消息对话框
  showMessage(title, message, type = 'info') {
    return new Promise((resolve) => {
      this.hideDialog();
      
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
        this.hideDialog();
        resolve(true);
      };
      
      buttons.appendChild(confirmBtn);
      dialog.appendChild(titleEl);
      dialog.appendChild(messageEl);
      dialog.appendChild(buttons);
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      this.currentDialog = overlay;
      
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
  
  // 显示目录树选择器
  showDirectoryTreeChooser(callback) {
    console.log(`[${config.PLUGIN_NAME}] 显示目录树选择器`);
    
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
    const defaultDir = localStorage.getItem('nz_default_directory') || config.getCurrentPath() || '';
    if (!defaultDir) {
      window.nzWorkflowManager.showNotification('请先设置默认目录', 'warning');
      return;
    }
    
    let selectedPath = defaultDir; // 默认选择根目录
    
    // 加载目录树
    this.loadDirectoryTree(treeContainer, defaultDir, (path) => {
      console.log(`[${config.PLUGIN_NAME}] 🔍 目录树项被点击: ${path}`);
      selectedPath = path;
      
      // 更新选中状态
      treeContainer.querySelectorAll('.nz-tree-item').forEach(item => {
        item.classList.remove('selected');
        item.style.backgroundColor = 'transparent';
        item.style.color = '';
      });
      
      // 使用更安全的方法查找元素
      console.log(`[${config.PLUGIN_NAME}] 🔍 查找路径:`, path);
      
      // 方法1: 直接遍历查找（避免CSS选择器转义问题）
      let selectedItem = null;
      treeContainer.querySelectorAll('.nz-tree-item').forEach(item => {
        if (item.dataset.path === path) {
          selectedItem = item;
        }
      });
      console.log(`[${config.PLUGIN_NAME}] 🎯 找到选中项:`, selectedItem);
      
      if (selectedItem) {
        // 应用选中状态 - 多重保护
        selectedItem.classList.add('selected');
        selectedItem.style.backgroundColor = '#4a9eff';
        selectedItem.style.color = 'white';
        
        console.log(`[${config.PLUGIN_NAME}] ✅ 选中状态已应用 - 类: ${selectedItem.className}, 背景: ${selectedItem.style.backgroundColor}`);
        
        // 验证选中状态
        setTimeout(() => {
          console.log(`[${config.PLUGIN_NAME}] 🕐 100ms后验证 - 类: ${selectedItem.className}, 背景: ${selectedItem.style.backgroundColor}`);
        }, 100);
        
        setTimeout(() => {
          console.log(`[${config.PLUGIN_NAME}] 🕐 500ms后验证 - 类: ${selectedItem.className}, 背景: ${selectedItem.style.backgroundColor}`);
        }, 500);
      } else {
        console.log(`[${config.PLUGIN_NAME}] ❌ 未找到选中项 data-path="${path}"`);
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
      console.log(`[${config.PLUGIN_NAME}] 加载目录树: ${rootPath}`);
      
      // 显示加载状态
      container.innerHTML = '<div style="text-align: center; padding: 20px;">加载中...</div>';
      
      // 获取目录内容 - 使用正确的file_operations端点
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
      console.error(`[${config.PLUGIN_NAME}] 加载目录树失败:`, error);
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
              // 处理新的对象格式和旧的字符串格式
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
        console.log(`[${config.PLUGIN_NAME}] 跳过子目录加载: ${fullPath}`);
      }
    }
  }
  
  // 创建目录树项
  createTreeItem(path, displayName, isRoot, onSelect) {
    const item = document.createElement('div');
    item.className = 'nz-tree-item';
    item.dataset.path = path;
    item.textContent = displayName;
    item.style.padding = '8px';
    item.style.cursor = 'pointer';
    item.style.borderRadius = '4px';
    item.style.marginBottom = '2px';
    
    if (isRoot) {
      item.classList.add('selected');
      item.style.backgroundColor = '#4a9eff';
      item.style.color = 'white';
    }
    
    item.onclick = () => {
      console.log(`[${config.PLUGIN_NAME}] 🖱️ 目录树项点击: ${path}`);
      console.log(`[${config.PLUGIN_NAME}] 📋 点击前状态 - 类: ${item.className}, 背景: ${item.style.backgroundColor}`);
      onSelect(path);
      
      // 验证点击后的状态
      setTimeout(() => {
        console.log(`[${config.PLUGIN_NAME}] 📋 点击后50ms - 类: ${item.className}, 背景: ${item.style.backgroundColor}`);
      }, 50);
    };
    
    // 悬停效果
    item.addEventListener('mouseenter', () => {
      if (!item.classList.contains('selected')) {
        item.style.backgroundColor = '#555';
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

// TODO: Stage9_CLEANUP - 以下类定义已迁移到模块中，待清理
// ⚠️ 已迁移：此类已迁移到 modules/ui/interaction-system.js，现在使用模块化版本
// 现在使用: modules/ui/interaction-system.js 中的 ConflictResolutionDialogManager 类
class ConflictResolutionDialogManager {
  constructor() {
    this.currentDialog = null;
    this.resolvePromise = null;
    this.isProcessing = false; // 防止重复点击
  }

  // 显示冲突解决对话框
  async showConflictDialog(sourceName, targetPath, isDirectory = false) {
    console.log(`[${config.PLUGIN_NAME}] ========== showConflictDialog 被调用 ==========`);
    console.log(`[${config.PLUGIN_NAME}] sourceName: ${sourceName}`);
    console.log(`[${config.PLUGIN_NAME}] targetPath: ${targetPath}`);
    console.log(`[${config.PLUGIN_NAME}] isDirectory: ${isDirectory}`);
    
    // 如果已有对话框，先关闭
    if (this.currentDialog) {
      console.log(`[${config.PLUGIN_NAME}] 关闭现有对话框`);
      this.closeDialog();
    }
    
    // 重置处理状态
    this.isProcessing = false;
    console.log(`[${config.PLUGIN_NAME}] 重置 isProcessing = false`);

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      console.log(`[${config.PLUGIN_NAME}] 设置 resolvePromise`);
      
      
      const dialog = document.createElement('div');
      dialog.className = 'conflict-dialog-overlay';
      dialog.innerHTML = `
        <div class="conflict-dialog">
          <div class="conflict-dialog-header">
            <h3>${isDirectory ? '目录' : '文件'}名称冲突</h3>
            <button class="conflict-dialog-close" data-choice="cancel">×</button>
          </div>
          <div class="conflict-dialog-content">
            <p>目标位置 <strong>${targetPath}</strong> 已存在名为 <strong>${sourceName}</strong> 的${isDirectory ? '目录' : '文件'}。</p>
            <p>请选择如何处理此冲突：</p>
          </div>
          <div class="conflict-dialog-actions">
            <button class="conflict-dialog-btn conflict-dialog-btn-overwrite" data-choice="overwrite" 
                    onclick="if(this.disabled) return false; this.disabled=true; event.preventDefault(); event.stopPropagation(); window.conflictDialogManager.handleConflictDirect('overwrite'); return false;">
              <span class="conflict-dialog-btn-icon">🔄</span>
              覆盖
            </button>
            <button class="conflict-dialog-btn conflict-dialog-btn-copy" data-choice="copy" 
                    onclick="if(this.disabled) return false; this.disabled=true; event.preventDefault(); event.stopPropagation(); window.conflictDialogManager.handleConflictDirect('copy'); return false;">
              <span class="conflict-dialog-btn-icon">📋</span>
              建立副本
            </button>
            <button class="conflict-dialog-btn conflict-dialog-btn-cancel" data-choice="cancel" 
                    onclick="if(this.disabled) return false; this.disabled=true; event.preventDefault(); event.stopPropagation(); window.conflictDialogManager.handleConflictDirect('cancel'); return false;">
              <span class="conflict-dialog-btn-icon">❌</span>
              取消操作
            </button>
          </div>
        </div>
      `;

      // 添加到页面
      document.body.appendChild(dialog);
      this.currentDialog = dialog;

      // 添加样式
      this.addStyles();
      
      // 移除事件委托，完全依赖直接的 onmousedown 事件
      console.log(`[${config.PLUGIN_NAME}] 对话框已创建，使用直接事件处理（onmousedown）`);
    });
  }

  // 直接处理用户选择（绕过事件委托）- 激进版本
  handleConflictDirect(choice) {
    console.log(`[${config.PLUGIN_NAME}] ========== handleConflictDirect 被调用 ==========`);
    console.log(`[${config.PLUGIN_NAME}] choice: ${choice}`);
    console.log(`[${config.PLUGIN_NAME}] isProcessing: ${this.isProcessing}`);
    
    // 防止重复处理 - 如果已经在处理中，直接返回
    if (this.isProcessing) {
      console.log(`[${config.PLUGIN_NAME}] 正在处理中，忽略重复点击`);
      return;
    }
    
    // 立即设置处理状态
    this.isProcessing = true;
    console.log(`[${config.PLUGIN_NAME}] 设置 isProcessing = true，开始处理`);
    
    // 多重强制移除对话框策略
    console.log(`[${config.PLUGIN_NAME}] 开始多重强制移除对话框`);
    
    // 策略1：移除所有可能的对话框类
    const dialogSelectors = [
      '.conflict-resolution-dialog',
      '[data-dialog="conflict"]',
      '.nz-conflict-dialog',
      '.modal',
      '.dialog'
    ];
    
    let totalRemoved = 0;
    dialogSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`[${config.PLUGIN_NAME}] 选择器 ${selector} 找到 ${elements.length} 个元素`);
      elements.forEach((element, index) => {
        console.log(`[${config.PLUGIN_NAME}] 移除元素 ${selector}[${index}]:`, element);
        element.remove();
        totalRemoved++;
      });
    });
    
    // 策略2：移除当前存储的对话框引用
    if (this.currentDialog) {
      console.log(`[${config.PLUGIN_NAME}] 移除 currentDialog 引用:`, this.currentDialog);
      try {
        this.currentDialog.remove();
        totalRemoved++;
      } catch (e) {
        console.log(`[${config.PLUGIN_NAME}] currentDialog 移除失败:`, e);
      }
      this.currentDialog = null;
    }
    
    // 策略3：暴力搜索所有可能的对话框
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element, index) => {
      const text = element.textContent || '';
      const hasConflictText = text.includes('覆盖') || text.includes('跳过') || text.includes('文件冲突') || text.includes('选择操作');
      const hasDialogStyle = element.style.position === 'fixed' || element.style.position === 'absolute';
      const hasDialogClass = element.className && typeof element.className === 'string' && (element.className.includes('dialog') || element.className.includes('modal'));
      
      if ((hasConflictText && hasDialogStyle) || (hasConflictText && hasDialogClass)) {
        console.log(`[${config.PLUGIN_NAME}] 发现疑似冲突对话框[${index}]:`, element);
        element.remove();
        totalRemoved++;
      }
    });
    
    console.log(`[${config.PLUGIN_NAME}] 总共移除了 ${totalRemoved} 个对话框元素`);
    
    // 立即处理回调 - 修复：同步执行避免时序问题
    if (this.resolvePromise) {
      const resolve = this.resolvePromise;
      this.resolvePromise = null;
      console.log(`[${config.PLUGIN_NAME}] 直接调用：立即调用 resolvePromise(${choice})`);
      
      // 直接同步执行，避免异步导致的重复点击问题
      console.log(`[${config.PLUGIN_NAME}] 同步执行 resolve(${choice})`);
      resolve(choice);
      console.log(`[${config.PLUGIN_NAME}] resolve 已执行完成`);
    } else {
      console.log(`[${config.PLUGIN_NAME}] 警告：resolvePromise 不存在！`);
    }
    
    // 重置状态 - 立即重置避免重复点击
    this.isProcessing = false;
    console.log(`[${config.PLUGIN_NAME}] 立即重置状态：isProcessing = false`);
    
    // 保险机制：延迟重置（防止意外情况）
    setTimeout(() => {
      this.isProcessing = false;
      console.log(`[${config.PLUGIN_NAME}] 保险重置：isProcessing = false`);
    }, 100);
    
    // 超时保险重置（防止状态卡死）
    setTimeout(() => {
      if (this.isProcessing) {
        console.log(`[${config.PLUGIN_NAME}] 超时强制重置：isProcessing = false`);
        this.isProcessing = false;
      }
    }, 1000);
    
    console.log(`[${config.PLUGIN_NAME}] ========== handleConflictDirect 结束 ==========`);
  }

  // 紧急清理函数 - 手动调用
  emergencyCleanup() {
    console.log(`[${config.PLUGIN_NAME}] ========== 紧急清理开始 ==========`);
    
    // 清理所有对话框
    const allDialogs = document.querySelectorAll('*');
    let cleaned = 0;
    
    allDialogs.forEach(element => {
      const text = element.textContent || '';
      const isConflictDialog = text.includes('覆盖') || text.includes('跳过') || text.includes('文件冲突');
      const hasDialogStyle = element.style.position === 'fixed' || element.style.position === 'absolute';
      
      if (isConflictDialog || element.classList.contains('conflict-resolution-dialog')) {
        console.log(`[${config.PLUGIN_NAME}] 紧急清理移除:`, element);
        element.remove();
        cleaned++;
      }
    });
    
    // 重置所有状态
    this.isProcessing = false;
    this.currentDialog = null;
    this.resolvePromise = null;
    
    console.log(`[${config.PLUGIN_NAME}] 紧急清理完成，移除了 ${cleaned} 个元素`);
    console.log(`[${config.PLUGIN_NAME}] ========== 紧急清理结束 ==========`);
  }

  // 处理用户选择
  handleConflict(choice) {
    console.log(`[${config.PLUGIN_NAME}] ========== handleConflict 被调用 ==========`);
    console.log(`[${config.PLUGIN_NAME}] choice: ${choice}`);
    console.log(`[${config.PLUGIN_NAME}] isProcessing: ${this.isProcessing}`);
    console.log(`[${config.PLUGIN_NAME}] resolvePromise: ${this.resolvePromise ? 'exists' : 'null'}`);
    console.log(`[${config.PLUGIN_NAME}] currentDialog: ${this.currentDialog ? 'exists' : 'null'}`);
    
    // 防止重复处理
    if (this.isProcessing) {
      console.log(`[${config.PLUGIN_NAME}] 正在处理中，忽略重复点击`);
      return;
    }
    
    this.isProcessing = true;
    console.log(`[${config.PLUGIN_NAME}] 设置 isProcessing = true`);
    console.log(`[${config.PLUGIN_NAME}] 用户选择: ${choice}`);
    
    // 先关闭对话框，再处理回调
    console.log(`[${config.PLUGIN_NAME}] 准备关闭对话框`);
    this.closeDialog();
    console.log(`[${config.PLUGIN_NAME}] 对话框已关闭`);
    
    // 返回用户选择
    if (this.resolvePromise) {
      console.log(`[${config.PLUGIN_NAME}] 调用 resolvePromise(${choice})`);
      const resolve = this.resolvePromise;
      this.resolvePromise = null;
      resolve(choice);
      console.log(`[${config.PLUGIN_NAME}] resolvePromise 已调用并清空`);
    } else {
      console.log(`[${config.PLUGIN_NAME}] 警告: resolvePromise 不存在!`);
    }
    
    console.log(`[${config.PLUGIN_NAME}] ========== handleConflict 结束 ==========`);
  }

  // 关闭对话框
  closeDialog() {
    if (this.currentDialog) {
      this.currentDialog.remove();
      this.currentDialog = null;
    }
    if (this.resolvePromise && !this.isProcessing) {
      this.resolvePromise('cancel');
      this.resolvePromise = null;
    }
    this.isProcessing = false;
  }

  // 添加样式
  addStyles() {
    if (document.getElementById('conflict-dialog-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'conflict-dialog-styles';
    style.textContent = `
      .conflict-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .conflict-dialog {
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        max-width: 500px;
        width: 90%;
        color: #e0e0e0;
      }

      .conflict-dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 20px 0 20px;
        border-bottom: 1px solid #444;
        padding-bottom: 15px;
      }

      .conflict-dialog-header h3 {
        margin: 0;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
      }

      .conflict-dialog-close {
        background: none;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .conflict-dialog-close:hover {
        background: #444;
        color: #fff;
      }

      .conflict-dialog-content {
        padding: 20px;
        line-height: 1.5;
      }

      .conflict-dialog-content p {
        margin: 0 0 15px 0;
        color: #ccc;
        font-size: 14px;
      }

      .conflict-dialog-content strong {
        color: #fff;
        font-weight: 600;
      }

      .conflict-dialog-actions {
        display: flex;
        gap: 10px;
        padding: 0 20px 20px 20px;
        justify-content: flex-end;
      }

      .conflict-dialog-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 100px;
        justify-content: center;
        user-select: none;
      }

      .conflict-dialog-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .conflict-dialog-btn-overwrite {
        background: #e74c3c;
        color: white;
      }

      .conflict-dialog-btn-overwrite:hover:not(:disabled) {
        background: #c0392b;
        transform: translateY(-1px);
      }

      .conflict-dialog-btn-copy {
        background: #3498db;
        color: white;
      }

      .conflict-dialog-btn-copy:hover:not(:disabled) {
        background: #2980b9;
        transform: translateY(-1px);
      }

      .conflict-dialog-btn-cancel {
        background: #6c757d;
        color: white;
      }

      .conflict-dialog-btn-cancel:hover:not(:disabled) {
        background: #5a6268;
        transform: translateY(-1px);
      }

      .conflict-dialog-btn-icon {
        font-size: 16px;
      }

      @media (max-width: 600px) {
        .conflict-dialog {
          width: 95%;
          margin: 20px;
        }
        
        .conflict-dialog-actions {
          flex-direction: column;
        }
        
        .conflict-dialog-btn {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// ✅ Stage6已完成：冲突对话框管理器已迁移到 modules/ui/interaction-system.js
// 老实例创建已移除，现在使用模块化版本（在initializeModules中初始化）

// ====== WebSocket连接状态管理 ======
// WebSocket等待函数已删除，直接使用简单的检查方式

// TODO: Stage9_CLEANUP - 以下类定义已迁移到模块中，待清理
// 现在使用: modules/ui/interaction-system.js 中的 FileOperationsAPI 类
// 文件操作API管理器
class FileOperationsAPI {
  
  // 错误处理方法
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
    if (typeof showNotification === 'function') {
      window.nzWorkflowManager.showNotification(userMessage, 'error');
    } else {
      console.error(`[${config.PLUGIN_NAME}] ${userMessage}`);
    }
  }
  
  // WebSocket连接状态缓存
  _wsConnectionCache = {
    lastCheckTime: 0,
    isAvailable: false,
    checkInterval: 2000 // 2秒内不重复检查
  };
  
  // 发送WebSocket消息的通用方法
  async sendWebSocketMessage(message, timeout = 3000) {
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
        console.log(`[${config.PLUGIN_NAME}] WebSocket连接检查失败: ${status}, 立即使用HTTP备用方案`);
        
        // 更新缓存状态
        this._wsConnectionCache.lastCheckTime = now;
        this._wsConnectionCache.isAvailable = false;
        
        reject(new Error(`WebSocket不可用 (${status})`));
        return;
      }
      
      // 额外检查：如果socket在发送过程中断开连接，立即失败
      if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
        console.log(`[${config.PLUGIN_NAME}] WebSocket连接正在关闭或已关闭，立即使用HTTP备用方案`);
        
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
  
  // 创建目录
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
      console.error(`[${config.PLUGIN_NAME}] WebSocket创建目录失败，尝试HTTP方式:`, error);
      return await this.createDirectoryHTTP(parentPath, directoryName);
    }
  }
  
  // HTTP方式创建目录
  async createDirectoryHTTP(parentPath, directoryName) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=create_directory&parent_path=${encodeURIComponent(parentPath)}&directory_name=${encodeURIComponent(directoryName)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP创建目录失败:`, error);
      throw error;
    }
  }
  
  // 删除文件
  async deleteFile(filePath) {
    const message = {
      type: 'nz_workflow_manager',
      action: 'delete_file',
      file_path: filePath
    };
    
    try {
      return await this.sendWebSocketMessage(message);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket删除文件失败，尝试HTTP方式:`, error);
      return await this.deleteFileHTTP(filePath);
    }
  }
  
  // HTTP方式删除文件
  async deleteFileHTTP(filePath) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=delete_file&file_path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP删除文件失败:`, error);
      throw error;
    }
  }
  
  // 删除目录
  async deleteDirectory(directoryPath) {
    const message = {
      type: 'nz_workflow_manager',
      action: 'delete_directory',
      directory_path: directoryPath
    };
    
    try {
      return await this.sendWebSocketMessage(message);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket删除目录失败，尝试HTTP方式:`, error);
      return await this.deleteDirectoryHTTP(directoryPath);
    }
  }
  
  // HTTP方式删除目录
  async deleteDirectoryHTTP(directoryPath) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=delete_directory&directory_path=${encodeURIComponent(directoryPath)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP删除目录失败:`, error);
      throw error;
    }
  }
  
  // 重命名文件/目录
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
      console.error(`[${config.PLUGIN_NAME}] WebSocket重命名失败，尝试HTTP方式:`, error);
      return await this.renameHTTP(oldPath, newName);
    }
  }
  
  // HTTP方式重命名
  async renameHTTP(oldPath, newName) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=rename&old_path=${encodeURIComponent(oldPath)}&new_name=${encodeURIComponent(newName)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP重命名失败:`, error);
      throw error;
    }
  }
  
  // 移动文件
  async moveFile(sourcePath, targetPath, options = {}) {
    let userChoice = null;
    const { globalConflictChoice } = options;
    
    try {
      
      // 检查目标位置是否存在同名文件
      const targetFileName = config.path.basename(sourcePath);
      const fullTargetPath = config.path.join(targetPath, targetFileName);
      
      if (await this.pathExists(fullTargetPath)) {
        // 如果有全局冲突选择，直接使用
        if (globalConflictChoice) {
          userChoice = globalConflictChoice;
        } else {
        // 显示冲突解决对话框
        userChoice = await window.conflictDialogManager.showConflictDialog(
          targetFileName, 
          targetPath, 
          false // 不是目录
        );
        }
        
        if (userChoice && userChoice.action === 'cancel') {
          return { success: false, error: '用户取消操作', conflictResult: userChoice };
        }
        
        if (userChoice && userChoice.action === 'skip') {
          return { success: false, error: '用户跳过文件', conflictResult: userChoice };
        }
        
        if (userChoice === 'cancel') {
          return { success: false, error: '用户取消操作' };
        }
        
        if (userChoice === 'copy') {
          // 移动操作不支持建立副本，改为复制操作
          window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
          // 传递userChoice避免重复询问
          return await communicationAPI.copyFile(sourcePath, targetPath, null, { userChoice });
        }
        
        if (userChoice && userChoice.action === 'rename') {
          // 移动操作不支持建立副本，改为复制操作
          window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
          // 传递userChoice避免重复询问
          return await communicationAPI.copyFile(sourcePath, targetPath, null, { userChoice });
        }
        // choice === 'overwrite' 或 'replace' 时继续使用原名称
      }
      
      const message = {
        type: 'nz_workflow_manager',
        action: 'move_file',
        source_path: sourcePath,
        target_path: targetPath
      };
      
      // 文件移动操作使用较短的超时时间，快速转到HTTP备用方案
      const result = await this.sendWebSocketMessage(message, 1500);
      if (userChoice && result.success) {
        result.conflictResult = userChoice;
      }
      return result;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket移动文件失败，尝试HTTP:`, error);
      // 传递用户选择给HTTP备用方案
      return await this.moveFileHTTP(sourcePath, targetPath, userChoice);
    }
  }
  
  // HTTP方式移动文件
  async moveFileHTTP(sourcePath, targetPath, userChoice = null) {
    try {
      let resolvedChoice = userChoice;
      
      // 如果没有传入用户选择，才进行冲突检查
      if (!resolvedChoice) {
        // 检查目标位置是否存在同名文件
        const targetFileName = config.path.basename(sourcePath);
        const fullTargetPath = config.path.join(targetPath, targetFileName);
        
        if (await this.pathExistsHTTP(fullTargetPath)) {
          // 显示冲突解决对话框
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
            window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
            return await communicationAPI.copyFileHTTP(sourcePath, targetPath, null, resolvedChoice);
          }
          
          if (resolvedChoice && resolvedChoice.action === 'rename') {
            // 移动操作不支持建立副本，改为复制操作
            window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
            return await communicationAPI.copyFileHTTP(sourcePath, targetPath, null, resolvedChoice);
          }
          // choice === 'overwrite' 时继续使用原名称
        }
      } else {
        console.log(`[${config.PLUGIN_NAME}] HTTP移动备用方案使用已有用户选择:`, resolvedChoice);
        
        // 🔥 修复Bug: 检查用户是否取消操作
        if (resolvedChoice && resolvedChoice.action === 'cancel') {
          console.log(`[${config.PLUGIN_NAME}] 用户在HTTP备用方案中取消了移动操作`);
          return { success: false, error: '用户已取消操作', cancelled: true };
        }
        
        if (resolvedChoice === 'copy' || (resolvedChoice && resolvedChoice.action === 'copy')) {
          // 移动操作不支持建立副本，改为复制操作
          window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
          return await communicationAPI.copyFileHTTP(sourcePath, targetPath, null, resolvedChoice);
        }
        
        if (resolvedChoice && resolvedChoice.action === 'rename') {
          // 移动操作不支持建立副本，改为复制操作
          window.nzWorkflowManager.showNotification('移动操作不支持建立副本，将执行复制操作', 'warning');
          return await communicationAPI.copyFileHTTP(sourcePath, targetPath, null, resolvedChoice);
        }
      }
      
      let url = `${window.location.origin}/file_operations?action=move_file&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
      
      // 如果用户选择了覆盖，传递overwrite参数
      if (resolvedChoice === 'overwrite' || (resolvedChoice && resolvedChoice.action === 'replace')) {
        url += `&overwrite=true`;
        console.log(`[${config.PLUGIN_NAME}] HTTP移动请求包含覆盖参数: ${url}`);
      }
      
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP移动文件失败:`, error);
      throw error;
    }
  }
  
  // 移动目录
  async moveDirectory(sourcePath, targetPath, newDirName = null, userChoice = null) {
    let resolvedChoice = userChoice;
    let finalNewName = newDirName;
    let validatedSourcePath = sourcePath; // 记录验证后的源路径
    
    try {
      // 首先验证源路径是否存在
      if (!await this.pathExists(sourcePath)) {
        // 尝试路径修复
        const sourceName = config.path.basename(sourcePath);
        const parentPath = config.path.dirname(sourcePath);
        const correctedPath = config.path.join(parentPath, sourceName);
        
        if (await this.pathExists(correctedPath)) {
          validatedSourcePath = correctedPath;
          console.log(`[${config.PLUGIN_NAME}] 源路径已修正: ${sourcePath} -> ${validatedSourcePath}`);
        } else {
          throw new Error(`源目录不存在: ${sourcePath}`);
        }
      }
      
      // 生成最终目标名称
      if (!finalNewName) {
        finalNewName = config.path.basename(validatedSourcePath);
      }
      
      const fullTargetPath = config.path.join(targetPath, finalNewName);
      
      // 检查目标是否存在冲突
      if (await this.pathExists(fullTargetPath)) {
        // 如果有用户选择，直接使用
        if (!resolvedChoice) {
          // 显示冲突解决对话框
          resolvedChoice = await window.conflictDialogManager.showConflictDialog(
            finalNewName, 
            targetPath, 
            true // 是目录
          );
          
          if (resolvedChoice === 'cancel') {
            return { success: false, error: '用户取消操作' };
          }
          
          if (resolvedChoice === 'copy') {
            // 为目录生成唯一名称
            const uniqueName = await this.generateUniqueDirectoryName(targetPath, finalNewName);
            finalNewName = uniqueName;
          }
        }
      }
      
      const message = {
        type: 'nz_workflow_manager',
        action: 'move_directory',
        source_path: validatedSourcePath,
        target_path: targetPath,
        new_name: finalNewName
      };
      
      return await this.sendWebSocketMessage(message, 5000);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket移动目录失败，尝试HTTP:`, error);
      return await this.moveDirectoryHTTP(validatedSourcePath, targetPath, finalNewName, resolvedChoice); // 使用验证后的路径
    }
  }
  
  // HTTP方式移动目录
  async moveDirectoryHTTP(sourcePath, targetPath, newDirName = null, userChoice = null) {
    try {
      // 首先验证源路径是否存在
      if (!await this.pathExistsHTTP(sourcePath)) {
        throw new Error(`源目录不存在: ${sourcePath}`);
      }
      
      // 生成最终目标名称
      let finalNewName = newDirName || config.path.basename(sourcePath);
      let resolvedChoice = userChoice;
      
      const fullTargetPath = config.path.join(targetPath, finalNewName);
      
      // 如果没有传入用户选择，才进行冲突检查
      if (!resolvedChoice) {
        // 检查目标是否存在冲突
        if (await this.pathExistsHTTP(fullTargetPath)) {
          // 显示冲突解决对话框
          resolvedChoice = await window.conflictDialogManager.showConflictDialog(
            finalNewName, 
            targetPath, 
            true // 是目录
          );
          
          if (resolvedChoice === 'cancel') {
            return { success: false, error: '用户取消操作' };
          }
          
          if (resolvedChoice === 'copy') {
            // 为目录生成唯一名称
            const uniqueName = await this.generateUniqueDirectoryName(targetPath, finalNewName);
            finalNewName = uniqueName;
          }
        }
      }
      
      let url = `${window.location.origin}/file_operations?action=move_directory&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}&new_name=${encodeURIComponent(finalNewName)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (resolvedChoice && result.success) {
        result.conflictResult = resolvedChoice;
      }
      return result;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP移动目录失败:`, error);
      throw error;
    }
  }
  
  // 检查路径是否存在
  async pathExists(path) {
    try {
      const message = {
        type: 'nz_workflow_manager',
        action: 'path_exists',
        path: path
      };
      
      // 路径检查是快速操作，使用更短的超时时间
      const result = await this.sendWebSocketMessage(message, 500);
      return result && result.exists;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 检查路径存在失败:`, error);
      // 如果WebSocket失败，尝试HTTP方式
      return await this.pathExistsHTTP(path);
    }
  }

  // HTTP方式检查路径是否存在
  async pathExistsHTTP(path) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=path_exists&path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const result = await response.json();
        return result && result.exists;
      } else {
        console.warn(`[${config.PLUGIN_NAME}] HTTP检查路径存在响应非200: ${response.status}`);
        // 404可能意味着文件不存在，这是正常情况
        if (response.status === 404) {
          return false;
        }
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP检查路径存在失败:`, error);
      // 对于网络错误或服务器错误，假设路径不存在以避免操作阻塞
      return false;
    }
  }

  // 获取路径类型信息（新增方法）
  async getPathInfo(path) {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=path_exists&path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const result = await response.json();
        return {
          exists: result.exists === true,
          isDirectory: result.is_directory === true,
          isFile: result.is_file === true
        };
      } else {
        return { exists: false, isDirectory: false, isFile: false };
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 获取路径信息失败:`, error);
      return { exists: false, isDirectory: false, isFile: false };
    }
  }

  // 检查目录是否存在
  async checkDirectoryExists(directoryPath) {
    try {
      const url = `${window.location.origin}/file_operations?action=check_directory_exists&path=${encodeURIComponent(directoryPath)}`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        return result.exists || false;
      }
      // 对于网络错误或服务器错误，假设路径不存在以避免操作阻塞
      return false;
    } catch (error) {
      console.warn(`[${config.PLUGIN_NAME}] 检查目录存在性失败:`, error);
      // 对于网络错误或服务器错误，假设路径不存在以避免操作阻塞
      return false;
    }
  }

  // 生成唯一的文件名（异步版本，真正检查文件存在性）
  async generateUniqueFileName(targetPath, baseFileName) {
    const nameWithoutExt = baseFileName.replace(/\.[^/.]+$/, '');
    const extension = baseFileName.includes('.') ? baseFileName.substring(baseFileName.lastIndexOf('.')) : '';
    let counter = 1;
    let newFileName = baseFileName;
    
    // 生成形如 "filename_副本(1).ext" 的名称，统一命名格式
    while (counter < 1000) { // 防止无限循环
      if (counter === 1) {
        newFileName = `${nameWithoutExt}_副本${extension}`;
      } else {
        newFileName = `${nameWithoutExt}_副本(${counter})${extension}`;
      }
      const fullPath = `${targetPath}\\${newFileName}`;
      
      // 检查文件是否存在
      const exists = await this.pathExists(fullPath);
      if (!exists) {
        break; // 找到可用的名称
      }
      counter++;
    }
    
    return newFileName;
  }

  // 生成唯一的目录名（异步版本，真正检查目录存在性）
  async generateUniqueDirectoryName(targetPath, baseDirName) {
    let counter = 1;
    let newDirName = baseDirName;
    
    // 生成形如 "dirname_副本(1)" 的名称，统一命名格式
    while (counter < 1000) { // 防止无限循环
      if (counter === 1) {
        newDirName = `${baseDirName}_副本`;
      } else {
        newDirName = `${baseDirName}_副本(${counter})`;
      }
      const fullPath = `${targetPath}\\${newDirName}`;
      
      // 检查目录是否存在
      const exists = await this.pathExists(fullPath);
      if (!exists) {
        break; // 找到可用的名称
      }
      counter++;
    }
    
    return newDirName;
  }

  // 复制文件
  async copyFile(sourcePath, targetPath, newName = null, options = {}) {
    let finalNewName = newName;
    let resolvedChoice = options.userChoice || options.globalConflictChoice;
    
    try {
      console.log(`[${config.PLUGIN_NAME}] 开始复制文件: ${sourcePath} -> ${targetPath}`);
      
      // 只有在没有预设选择时才检查冲突
      if (!resolvedChoice) {
        // 检查目标位置是否存在同名文件
        const targetFileName = newName || config.path.basename(sourcePath);
        const fullTargetPath = config.path.join(targetPath, targetFileName);
        
        console.log(`[${config.PLUGIN_NAME}] 目标文件名: ${targetFileName}, 完整路径: ${fullTargetPath}`);
        
        if (await this.pathExists(fullTargetPath)) {
          // 显示冲突解决对话框
          console.log(`[${config.PLUGIN_NAME}] 文件冲突，显示对话框: ${targetFileName}`);
          resolvedChoice = await window.conflictDialogManager.showConflictDialog(
            targetFileName, 
            targetPath, 
            false // 不是目录
          );
          
          console.log(`[${config.PLUGIN_NAME}] 用户选择:`, resolvedChoice);
        }
      } else {
        console.log(`[${config.PLUGIN_NAME}] 使用预设用户选择:`, resolvedChoice);
      }
      
      // 处理用户选择
      if (resolvedChoice && resolvedChoice.action === 'cancel') {
        console.log(`[${config.PLUGIN_NAME}] 用户取消操作`);
        return { success: false, error: '用户取消操作', conflictResult: resolvedChoice };
      }
      
      if (resolvedChoice && resolvedChoice.action === 'skip') {
        console.log(`[${config.PLUGIN_NAME}] 用户跳过此文件`);
        return { success: false, error: '用户跳过文件', conflictResult: resolvedChoice };
      }
          
          if (resolvedChoice === 'cancel') {
        console.log(`[${config.PLUGIN_NAME}] 用户取消操作`);
            return { success: false, error: '用户取消操作' };
          }
          
      if (resolvedChoice === 'copy' || (resolvedChoice && resolvedChoice.action === 'rename')) {
        // 处理用户重命名选择
        if (resolvedChoice && resolvedChoice.action === 'rename' && resolvedChoice.newName) {
          const sourceExt = config.path.extname(sourcePath);
          finalNewName = resolvedChoice.newName + sourceExt;
          console.log(`[${config.PLUGIN_NAME}] 使用用户自定义名称: ${finalNewName}`);
        } else {
            // 生成新的文件名
          const targetFileName = newName || config.path.basename(sourcePath);
            const newFileName = await this.generateUniqueFileName(targetPath, targetFileName);
          console.log(`[${config.PLUGIN_NAME}] 选择了重命名/复制，生成新文件名: ${newFileName}`);
            finalNewName = newFileName;
          }
      }
      // choice === 'overwrite' 或 'replace' 时继续使用原名称
      
      if (resolvedChoice && typeof resolvedChoice === 'object') {
        console.log(`[${config.PLUGIN_NAME}] 使用预设用户选择:`, resolvedChoice);
        // 如果用户已经选择了copy，确保使用正确的新文件名
        if (resolvedChoice === 'copy' && !finalNewName) {
          const targetFileName = config.path.basename(sourcePath);
          finalNewName = await this.generateUniqueFileName(targetPath, targetFileName);
        }
      }
      
      const message = {
        type: 'nz_workflow_manager',
        action: 'copy_file',
        source_path: sourcePath,
        target_path: targetPath,
        new_name: finalNewName
      };
      
      console.log(`[${config.PLUGIN_NAME}] 发送WebSocket消息:`, message);
      // 文件复制操作使用较短的超时时间，快速转到HTTP备用方案
      const result = await this.sendWebSocketMessage(message, 1500);
      console.log(`[${config.PLUGIN_NAME}] WebSocket复制结果:`, result);
      
      // 如果有冲突处理结果，添加到返回值中
      if (resolvedChoice && result.success) {
        result.conflictResult = resolvedChoice;
      }
      return result;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket复制文件失败，尝试HTTP:`, error);
      // 传递用户选择给HTTP备用方案，避免重复询问
      return await communicationAPI.copyFileHTTP(sourcePath, targetPath, finalNewName, resolvedChoice);
    }
  }
  
  // HTTP方式复制文件
  async copyFileHTTP(sourcePath, targetPath, newName = null, userChoice = null) {
    try {
      let finalNewName = newName;
      
      // 如果没有传入用户选择，才进行冲突检查
      if (!userChoice) {
        // 检查目标位置是否存在同名文件
        const targetFileName = newName || config.path.basename(sourcePath);
        const fullTargetPath = config.path.join(targetPath, targetFileName);
        
        if (await this.pathExistsHTTP(fullTargetPath)) {
          // 显示冲突解决对话框
          userChoice = await window.conflictDialogManager.showConflictDialog(
            targetFileName, 
            targetPath, 
            false // 不是目录
          );
          
          if (userChoice && userChoice.action === 'cancel') {
            return { success: false, error: '用户取消操作', conflictResult: userChoice };
          }
          
          if (userChoice && userChoice.action === 'skip') {
            return { success: false, error: '用户跳过文件', conflictResult: userChoice };
          }
          
          if (userChoice === 'cancel') {
            return { success: false, error: '用户取消操作' };
          }
          
          if (userChoice === 'copy' || (userChoice && userChoice.action === 'rename')) {
            // 生成新的文件名
            const newFileName = await this.generateUniqueFileName(targetPath, targetFileName);
            finalNewName = newFileName;
          }
          // choice === 'overwrite' 时继续使用原名称
        }
      } else {
        console.log(`[${config.PLUGIN_NAME}] HTTP备用方案使用已有用户选择:`, userChoice);
        
        // 🔥 修复Bug: 检查用户是否取消操作
        if (userChoice && userChoice.action === 'cancel') {
          console.log(`[${config.PLUGIN_NAME}] 用户在HTTP备用方案中取消了复制操作`);
          return { success: false, error: '用户已取消操作', cancelled: true };
        }
        
        // 如果用户已经选择了copy，确保使用正确的新文件名
        if ((userChoice === 'copy' || (userChoice && userChoice.action === 'copy')) && !finalNewName) {
          const targetFileName = config.path.basename(sourcePath);
          finalNewName = await this.generateUniqueFileName(targetPath, targetFileName);
        }
      }
      
      let url = `${window.location.origin}/file_operations?action=copy_file&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
      if (finalNewName) {
        url += `&new_name=${encodeURIComponent(finalNewName)}`;
      }
      
      // 如果用户选择了覆盖，传递overwrite参数
      if (userChoice === 'overwrite' || (userChoice && userChoice.action === 'replace')) {
        url += `&overwrite=true`;
        console.log(`[${config.PLUGIN_NAME}] HTTP请求包含覆盖参数: ${url}`);
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        // 如果有冲突处理结果，添加到返回值中
        if (userChoice && result.success) {
          result.conflictResult = userChoice;
        }
        return result;
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP复制文件失败:`, error);
      this.handleFileOperationError('复制文件', error);
      throw error;
    }
  }
  
  // 复制目录
  async copyDirectory(sourcePath, targetPath, newName = null) {
    try {
      // 检查目标位置是否存在同名目录
      const targetDirName = newName || config.path.basename(sourcePath);
      const fullTargetPath = config.path.join(targetPath, targetDirName);
      
      if (await this.pathExists(fullTargetPath)) {
        // 显示冲突解决对话框
        const choice = await window.conflictDialogManager.showConflictDialog(
          targetDirName, 
          targetPath, 
          true // 是目录
        );
        
        if (choice === 'cancel') {
          return { success: false, error: '用户取消操作' };
        }
        
        if (choice === 'copy') {
          // 生成新的目录名
          const newDirName = await this.generateUniqueDirectoryName(targetPath, targetDirName);
          newName = newDirName;
        }
        // choice === 'overwrite' 时继续使用原名称
      }
      
      const message = {
        type: 'nz_workflow_manager',
        action: 'copy_directory',
        source_path: sourcePath,
        target_path: targetPath,
        new_name: newName
      };
      
      return await this.sendWebSocketMessage(message);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket复制目录失败，尝试HTTP:`, error);
      return await this.copyDirectoryHTTP(sourcePath, targetPath, newName);
    }
  }
  
  // HTTP方式复制目录
  async copyDirectoryHTTP(sourcePath, targetPath, newName = null) {
    try {
      // 检查目标位置是否存在同名目录
      const targetDirName = newName || config.path.basename(sourcePath);
      const fullTargetPath = config.path.join(targetPath, targetDirName);
      
      if (await this.pathExistsHTTP(fullTargetPath)) {
        // 显示冲突解决对话框
        const choice = await window.conflictDialogManager.showConflictDialog(
          targetDirName, 
          targetPath, 
          true // 是目录
        );
        
        if (choice === 'cancel') {
          return { success: false, error: '用户取消操作' };
        }
        
        if (choice === 'copy') {
          // 生成新的目录名
          const newDirName = await this.generateUniqueDirectoryName(targetPath, targetDirName);
          newName = newDirName;
        }
        // choice === 'overwrite' 时继续使用原名称
      }
      
      let url = `${window.location.origin}/file_operations?action=copy_directory&source_path=${encodeURIComponent(sourcePath)}&target_path=${encodeURIComponent(targetPath)}`;
      if (newName) {
        url += `&new_name=${encodeURIComponent(newName)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP复制目录失败:`, error);
      throw error;
    }
  }
  
  // 选择目录
  async chooseDirectory() {
    try {
      const message = {
        type: 'nz_workflow_manager',
        action: 'choose_directory'
      };
      
      return await this.sendWebSocketMessage(message);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] WebSocket选择目录失败，尝试HTTP:`, error);
      return await this.chooseDirectoryHTTP();
    }
  }
  
  // HTTP方式选择目录
  async chooseDirectoryHTTP() {
    try {
      const response = await fetch(`${window.location.origin}/file_operations?action=choose_directory`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP选择目录失败:`, error);
      throw error;
    }
  }
}



// ====== 浮动工作流助手 (v3.1.0新增) ======

// TODO: Stage9_CLEANUP - 以下类定义已迁移到模块中，待清理
// ✅ Stage7: 工作流状态类已迁移到 modules/features/floating-manager.js
// 现在使用: modules/features/floating-manager.js 中的 WorkflowState 类
/*
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
*/

// TODO: Stage9_CLEANUP - 以下类定义已迁移到模块中，待清理
// ✅ Stage7: 浮动工作流助手主类已迁移到 modules/features/floating-manager.js
// 现在使用: modules/features/floating-manager.js 中的 FloatingWorkflowManager 类
/*
class FloatingWorkflowManager {
  constructor() {
    this.currentWorkflow = null;
    this.isVisible = false;
    this.isCollapsed = false;
    this.element = null;
    this.isInitializing = false;
    this.pendingWorkflow = null;
    
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
      console.log(`[${config.PLUGIN_NAME}] 开始初始化浮动管理器`);
      this.isInitializing = true;
      
      // 检查是否已有DOM元素，如果有则先清理
      if (this.element) {
        console.log(`[${config.PLUGIN_NAME}] 发现已存在的DOM元素，先清理`);
        this.cleanup();
      }
      
      this.createFloatingManager();
      
      this.isInitializing = false;
      console.log(`[${config.PLUGIN_NAME}] 浮动工作流助手初始化完成`);
    } catch (error) {
      this.isInitializing = false;
      console.error(`[${config.PLUGIN_NAME}] 浮动管理器初始化失败:`, error);
    }
  }
  
  // 清理DOM元素
  cleanup() {
    try {
      if (this.element && this.element.parentNode) {
        console.log(`[${config.PLUGIN_NAME}] 清理浮动管理器DOM元素`);
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
      this.isVisible = false;
      this.isCollapsed = false;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 清理DOM元素失败:`, error);
    }
  }
  
  // 确保样式已添加
  ensureStyles() {
    // 检查是否已有样式
    if (document.querySelector('#nz-floating-manager-styles')) {
      return;
    }
    
    // 调用全局样式添加函数
    if (typeof addManagerStyles === 'function') {
      console.log(`[${config.PLUGIN_NAME}] 添加浮动管理器样式`);
      addManagerStyles();
    }
  }
  
  // 创建浮动管理器UI
  createFloatingManager() {
    // 确保样式已添加
    this.ensureStyles();
    
    this.element = document.createElement('div');
    this.element.className = 'nz-floating-manager';
    this.element.innerHTML = `
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
          <button class="nz-action-btn nz-save-btn" disabled>
            <i class="pi pi-save"></i>
            <span>保存到原文件</span>
          </button>
          <button class="nz-action-btn nz-saveas-btn" disabled>
            <i class="pi pi-download"></i>
            <span>另存为…</span>
          </button>
        </div>
      </div>
    `;
    
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
    saveBtn.addEventListener('click', () => this.saveToOriginal());
    collapsedSaveBtn.addEventListener('click', () => this.saveToOriginal());
    
    // 另存为 (内容区域和折叠布局中都有)
    const saveAsBtn = this.element.querySelector('.nz-saveas-btn');
    const collapsedSaveAsBtn = this.element.querySelector('.nz-collapsed-saveas-btn');
    saveAsBtn.addEventListener('click', () => this.saveAs());
    collapsedSaveAsBtn.addEventListener('click', () => this.saveAs());
    
    // 拖拽功能
    this.makeDraggable();
    this.setupNoteEditButton();
    this.setupAddNoteButton();
    
    // 初始化时更新备注显示状态
    setTimeout(() => {
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器：延迟调用备注显示更新`);
      this.updateWorkflowNoteDisplay();
    }, 100);
  }
  
  // 设置备注编辑按钮事件
  setupNoteEditButton() {
    const editBtn = this.element.querySelector('.nz-note-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (this.currentWorkflow && this.currentWorkflow.filePath) {
          const existingNote = workflowNotesManager.getNote(this.currentWorkflow.filePath);
          WorkflowNoteEditor.openEditor(this.currentWorkflow.filePath, existingNote);
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
          console.log(`[${config.PLUGIN_NAME}] 浮动管理器：点击增加备注按钮`);
          WorkflowNoteEditor.openEditor(this.currentWorkflow.filePath, null);
        }
      });
    }
  }
  
  // 加载工作流
  loadWorkflow(filePath, workflowData) {
    console.log(`[${config.PLUGIN_NAME}] 浮动管理器：加载工作流 ${filePath}`);
    
    try {
      // 如果元素还没有创建，先保存工作流信息，并等待初始化完成
      if (!this.element) {
        console.log(`[${config.PLUGIN_NAME}] 浮动管理器UI未准备好，保存工作流信息并等待初始化`);
        this.pendingWorkflow = { filePath, workflowData };
        
        // 如果初始化还没开始，立即开始初始化
        if (!this.isInitializing) {
          console.log(`[${config.PLUGIN_NAME}] 立即启动初始化流程`);
          this.isInitializing = true;
          this.initialize();
        }
        
        // 等待初始化完成后重试
        this.waitForInitialization().then(() => {
          if (this.pendingWorkflow && this.pendingWorkflow.filePath === filePath) {
            console.log(`[${config.PLUGIN_NAME}] 初始化完成，重新加载工作流`);
            const pendingData = this.pendingWorkflow;
            this.pendingWorkflow = null;
            this.loadWorkflow(pendingData.filePath, pendingData.workflowData);
          }
        });
        return;
      }
      
      // TODO: Stage9_CLEANUP - WorkflowState已迁移到模块中，待清理
      // 现在使用: modules/features/floating-manager.js 中的 WorkflowState 类
      // 创建工作流状态
      this.currentWorkflow = new WorkflowState(filePath, workflowData);
      
      // 更新UI
      this.updateCurrentWorkflowDisplay();
      
      // 显示管理器
      this.show();
      
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器：工作流加载完成`);
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 浮动管理器：加载工作流失败`, error);
    }
  }
  
  // 等待初始化完成
  waitForInitialization() {
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (this.element && !this.isInitializing) {
          console.log(`[${config.PLUGIN_NAME}] 浮动管理器初始化检查：已完成`);
          resolve();
        } else {
          console.log(`[${config.PLUGIN_NAME}] 浮动管理器初始化检查：未完成，继续等待`);
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
      nameSpan.textContent = this.currentWorkflow.getDisplayName();
      
      // 更新路径
      const pathSpan = this.element.querySelector('.nz-path-text');
      pathSpan.textContent = this.currentWorkflow.getDirectory();
      
      // 更新备注信息
      this.updateWorkflowNoteDisplay();
      
      // 启用操作按钮
      this.element.querySelector('.nz-save-btn').disabled = false;
      this.element.querySelector('.nz-saveas-btn').disabled = false;
      
      // 更新修改状态指示器
      this.updateModifiedIndicator();
      
    } else {
      // 显示"未加载"提示，隐藏工作流信息
      noWorkflowDiv.style.display = 'block';
      workflowInfoDiv.style.display = 'none';
      
      // 禁用操作按钮
      this.element.querySelector('.nz-save-btn').disabled = true;
      this.element.querySelector('.nz-saveas-btn').disabled = true;
    }
  }
  
  // 更新修改状态指示器
  updateModifiedIndicator() {
    if (!this.element) return; // 安全检查
    
    const indicator = this.element.querySelector('.nz-modified-indicator');
    if (this.currentWorkflow && this.currentWorkflow.isModified) {
      indicator.style.display = 'inline';
      indicator.style.color = '#ff9999';
    } else {
      indicator.style.display = 'none';
    }
  }
  
  // 更新工作流备注显示
  updateWorkflowNoteDisplay() {
    console.log(`[${config.PLUGIN_NAME}] 浮动管理器：开始更新备注显示`);
    console.log(`[${config.PLUGIN_NAME}] 浮动管理器：element存在=${!!this.element}, currentWorkflow存在=${!!this.currentWorkflow}`);
    
    if (!this.element || !this.currentWorkflow) {
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器：缺少必要元素，跳过备注更新`);
      return;
    }
    
    const notesDiv = this.element.querySelector('.nz-workflow-notes');
    const addNoteBtn = this.element.querySelector('.nz-add-note-btn');
    const filePath = this.currentWorkflow.filePath;
    const note = workflowNotesManager.getNote(filePath);
    
    console.log(`[${config.PLUGIN_NAME}] 浮动管理器：notesDiv存在=${!!notesDiv}, addNoteBtn存在=${!!addNoteBtn}, filePath=${filePath}, note存在=${!!note}`);
    if (note) {
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器：备注内容=`, note);
    }
    
    if (note) {
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器：显示备注区域`);
      // 有备注：显示备注区域，隐藏"增加备注"按钮
      notesDiv.style.display = 'block';
      if (addNoteBtn) {
        addNoteBtn.style.cssText = 'display: none !important;';
        console.log(`[${config.PLUGIN_NAME}] 浮动管理器：强制隐藏增加备注按钮`);
      }
      
      // 备注指示器已简化，不再需要标题文本
      
      // 更新描述
      const descriptionDiv = this.element.querySelector('.nz-note-description-text');
      if (note.description) {
        descriptionDiv.textContent = note.description;
        descriptionDiv.style.display = 'block';
      } else {
        descriptionDiv.style.display = 'none';
      }
      
      // 更新标签
      const tagsContainer = this.element.querySelector('.nz-note-tags-container');
      if (note.tags && note.tags.length > 0) {
        tagsContainer.innerHTML = note.tags.map(tag => 
          `<span class="nz-tag">${tag}</span>`
        ).join('');
        tagsContainer.style.display = 'flex';
      } else {
        tagsContainer.style.display = 'none';
      }
      
      // 更新分类和优先级
      const categorySpan = this.element.querySelector('.nz-note-category-text');
      const prioritySpan = this.element.querySelector('.nz-note-priority-text');
      
      if (note.category || note.priority) {
        categorySpan.textContent = note.category ? `📁 ${note.category}` : '';
        prioritySpan.textContent = note.priority ? this.getPriorityText(note.priority) : '';
        
        // 应用优先级颜色
        prioritySpan.className = `nz-note-priority-text ${note.priority ? 'nz-priority-' + note.priority : ''}`;
        
        categorySpan.parentElement.style.display = 'flex';
      } else {
        categorySpan.parentElement.style.display = 'none';
      }
      
    } else {
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器：没有备注，隐藏备注区域，显示增加备注按钮`);
      // 没有备注：隐藏备注区域，显示"增加备注"按钮
      if (notesDiv) {
        notesDiv.style.display = 'none';
      }
      if (addNoteBtn) {
        // 多种方式强制显示按钮
        addNoteBtn.style.display = 'inline-flex';
        addNoteBtn.style.visibility = 'visible';
        addNoteBtn.style.opacity = '1';
        addNoteBtn.classList.remove('hidden');
        // 使用 setAttribute 强制覆盖
        addNoteBtn.setAttribute('style', 'display: inline-flex !important; align-items: center !important; gap: 4px !important; padding: 4px 8px !important; border: 1px solid rgba(107, 182, 255, 0.3) !important; background: rgba(107, 182, 255, 0.1) !important; color: rgba(107, 182, 255, 0.9) !important; border-radius: 4px !important; cursor: pointer !important; transition: all 0.2s !important; font-size: 11px !important; white-space: nowrap !important; margin-left: auto !important; -webkit-background-clip: initial !important; -webkit-text-fill-color: initial !important; background-clip: initial !important; text-shadow: none !important;');
        console.log(`[${config.PLUGIN_NAME}] 浮动管理器：强制显示增加备注按钮`);
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
  
  // 设置保存按钮加载状态
  setSaveButtonsLoading(loading) {
    if (!this.element) return;
    
    const saveBtn = this.element.querySelector('.nz-save-btn');
    const saveAsBtn = this.element.querySelector('.nz-saveas-btn');
    const collapsedSaveBtn = this.element.querySelector('.nz-collapsed-save-btn');
    const collapsedSaveAsBtn = this.element.querySelector('.nz-collapsed-saveas-btn');
    
    const buttons = [saveBtn, saveAsBtn, collapsedSaveBtn, collapsedSaveAsBtn].filter(btn => btn);
    
    buttons.forEach(btn => {
      if (loading) {
        btn.disabled = true;
        btn.classList.add('nz-loading');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = 'pi pi-spin pi-spinner';
        }
      } else {
        btn.disabled = false;
        btn.classList.remove('nz-loading');
        const icon = btn.querySelector('i');
        if (icon) {
          // 恢复原始图标
          if (btn.classList.contains('nz-save-btn') || btn.classList.contains('nz-collapsed-save-btn')) {
            icon.className = 'pi pi-save';
          } else {
            icon.className = 'pi pi-download';
          }
        }
      }
    });
  }
  
  // 保存到原文件
  async saveToOriginal() {
    if (!this.currentWorkflow) {
      window.nzWorkflowManager.showNotification('没有可保存的工作流', 'error');
      return;
    }
    
    // 显示保存中状态
    this.setSaveButtonsLoading(true);
    window.nzWorkflowManager.showNotification('正在保存...', 'info');
    
    try {
      console.log(`[${config.PLUGIN_NAME}] 保存工作流到原文件: ${this.currentWorkflow.filePath}`);
      
      // 获取当前ComfyUI的工作流数据
      const currentData = this.getCurrentWorkflowData();
      if (!currentData) {
        window.nzWorkflowManager.showNotification('无法获取当前工作流数据', 'error');
        this.setSaveButtonsLoading(false);
        return;
      }
      
      // 保存到文件（这里需要实现文件保存API）
      const saved = await this.saveWorkflowToFile(this.currentWorkflow.filePath, currentData);
      
      if (saved) {
        // 更新状态
        this.currentWorkflow.isModified = false;
        this.currentWorkflow.lastSaved = Date.now();
        this.currentWorkflow.data = currentData;
        
        // 更新UI
        this.updateModifiedIndicator();
        
        // 自动刷新文件列表
        try {
          if (typeof loadDirectory === 'function' && typeof config.getCurrentPath !== 'undefined') {
            console.log(`[${config.PLUGIN_NAME}] 保存成功后刷新文件列表: ${config.getCurrentPath()}`);
            loadDirectory(config.getCurrentPath());
          }
        } catch (refreshError) {
          console.warn(`[${config.PLUGIN_NAME}] 刷新文件列表失败:`, refreshError);
        }
        
        window.nzWorkflowManager.showNotification(`已保存到：${this.currentWorkflow.fileName}`, 'success');
      } else {
        window.nzWorkflowManager.showNotification('保存失败', 'error');
      }
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 保存失败:`, error);
      window.nzWorkflowManager.showNotification(`保存失败: ${error.message}`, 'error');
    } finally {
      // 恢复按钮状态
      this.setSaveButtonsLoading(false);
    }
  }
  
  // 另存为
  async saveAs() {
    if (!this.currentWorkflow) {
      window.nzWorkflowManager.showNotification('没有可保存的工作流', 'error');
      return;
    }
    
    // 使用对话框获取新文件名
    const newFileName = await window.dialogManager.showInput(
      '另存为',
      '请输入新文件名',
      this.currentWorkflow.getDisplayName()
    );
    
    if (newFileName && newFileName.trim()) {
      // 显示保存中状态
      this.setSaveButtonsLoading(true);
      window.nzWorkflowManager.showNotification('正在另存为...', 'info');
      
      try {
        // 构建新文件路径
        const directory = this.currentWorkflow.getDirectory();
        const newFilePath = `${directory}\\${newFileName.trim()}.json`;
        
        // 获取当前工作流数据
        const currentData = this.getCurrentWorkflowData();
        if (!currentData) {
          window.nzWorkflowManager.showNotification('无法获取当前工作流数据', 'error');
          return;
        }
        
        // 保存到新文件
        const saved = await this.saveWorkflowToFile(newFilePath, currentData);
        
        if (saved) {
          // TODO: Stage9_CLEANUP - WorkflowState已迁移到模块中，待清理
          // 现在使用: modules/features/floating-manager.js 中的 WorkflowState 类
          // 创建新的工作流状态
          this.currentWorkflow = new WorkflowState(newFilePath, currentData);
          
          // 更新UI
          this.updateCurrentWorkflowDisplay();
          
          // 自动刷新文件列表
          try {
            if (typeof loadDirectory === 'function' && typeof config.getCurrentPath !== 'undefined') {
              console.log(`[${config.PLUGIN_NAME}] 保存成功后刷新文件列表: ${config.getCurrentPath()}`);
              loadDirectory(config.getCurrentPath());
            }
          } catch (refreshError) {
            console.warn(`[${config.PLUGIN_NAME}] 刷新文件列表失败:`, refreshError);
          }
          
          window.nzWorkflowManager.showNotification(`已另存为：${newFileName}.json`, 'success');
        } else {
          window.nzWorkflowManager.showNotification('另存为失败', 'error');
        }
        
      } catch (error) {
          console.error(`[${config.PLUGIN_NAME}] 另存为失败:`, error);
        window.nzWorkflowManager.showNotification(`另存为失败: ${error.message}`, 'error');
        } finally {
          // 恢复按钮状态
          this.setSaveButtonsLoading(false);
      }
    }
  }
  
  // 获取当前ComfyUI工作流数据
  getCurrentWorkflowData() {
    try {
      if (typeof app !== 'undefined' && app.graph) {
        // 使用ComfyUI的API获取当前工作流
        return app.graph.serialize();
      }
      return null;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 获取工作流数据失败:`, error);
      return null;
    }
  }
  
  // 保存工作流到文件
  async saveWorkflowToFile(filePath, workflowData) {
    try {
      // 使用现有的文件操作API
      const dataString = typeof workflowData === 'string' ? 
        workflowData : JSON.stringify(workflowData, null, 2);
      
      console.log(`[${config.PLUGIN_NAME}] 保存工作流到: ${filePath}`);
      console.log(`[${config.PLUGIN_NAME}] 数据大小: ${dataString.length} 字符`);
      
      // 首先尝试使用WebSocket
      try {
        const result = await this.saveWorkflowUsingWebSocket(filePath, dataString);
        if (result.success) {
          console.log(`[${config.PLUGIN_NAME}] WebSocket保存成功`);
          return true;
        }
      } catch (wsError) {
        console.log(`[${config.PLUGIN_NAME}] WebSocket保存失败，尝试HTTP:`, wsError.message);
      }
      
      // WebSocket失败，尝试HTTP
      try {
        const result = await this.saveWorkflowUsingHTTP(filePath, dataString);
        if (result.success) {
          console.log(`[${config.PLUGIN_NAME}] HTTP保存成功`);
          return true;
        }
      } catch (httpError) {
        console.error(`[${config.PLUGIN_NAME}] HTTP保存也失败:`, httpError.message);
      }
      
      return false;
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 保存文件失败:`, error);
      return false;
    }
  }
  
  // 使用WebSocket保存工作流
  async saveWorkflowUsingWebSocket(filePath, workflowData) {
    return new Promise((resolve, reject) => {
      try {
        // 检查WebSocket是否可用
        const socket = getAvailableWebSocket();
        if (!socket) {
          throw new Error('WebSocket不可用');
        }
        
        console.log(`[${config.PLUGIN_NAME}] 使用WebSocket保存工作流: ${filePath}`);
        
        // 创建WebSocket消息
        const message = {
          type: "nz_workflow_manager",
          action: "save_workflow",
          file_path: filePath,
          workflow_data: workflowData
        };
        
        // 设置消息监听器
        const originalMessageHandler = socket.onmessage;
        let resultReceived = false;
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "nz_workflow_manager_response" && 
                data.action === "save_workflow" && 
                !resultReceived) {
              
              resultReceived = true;
              console.log(`[${config.PLUGIN_NAME}] WebSocket保存响应:`, data);
              
              // 恢复原始消息处理器
              socket.onmessage = originalMessageHandler;
              
              if (data.result && data.result.success) {
                resolve(data.result);
              } else {
                reject(new Error(data.result?.error || data.error || 'WebSocket保存失败'));
              }
              return;
            }
          } catch (parseError) {
            console.error(`[${config.PLUGIN_NAME}] 解析WebSocket消息失败:`, parseError);
          }
          
          // 调用原始处理器
          if (originalMessageHandler) {
            originalMessageHandler(event);
          }
        };
        
        // 发送消息
        socket.send(JSON.stringify(message));
        console.log(`[${config.PLUGIN_NAME}] WebSocket保存消息已发送`);
        
        // 设置超时（缩短到1.5秒，保存操作应该很快）
        setTimeout(() => {
          if (!resultReceived) {
            resultReceived = true;
            socket.onmessage = originalMessageHandler;
            reject(new Error('WebSocket保存超时'));
          }
        }, 1500);
        
      } catch (error) {
        console.error(`[${config.PLUGIN_NAME}] WebSocket保存失败:`, error);
        reject(error);
      }
    });
  }
  
  // 使用HTTP保存工作流
  async saveWorkflowUsingHTTP(filePath, workflowData) {
    try {
      console.log(`[${config.PLUGIN_NAME}] 使用HTTP保存工作流: ${filePath}`);
      console.log(`[${config.PLUGIN_NAME}] 数据大小: ${workflowData.length} 字符`);
      
      // 使用POST方法传输大数据，避免URL长度限制
      const url = `${window.location.origin}/file_operations`;
      
      // 构建表单数据
      const formData = new FormData();
      formData.append('action', 'save_workflow');
      formData.append('file_path', filePath);
      formData.append('workflow_data', workflowData);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`[${config.PLUGIN_NAME}] HTTP保存响应:`, result);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'HTTP保存失败');
      }
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] HTTP保存失败:`, error);
      throw error;
    }
  }
  

  

  

  
  // 显示管理器
  show() {
    if (!this.element) {
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器DOM未就绪，无法显示`);
      return;
    }
    
    console.log(`[${config.PLUGIN_NAME}] 显示浮动管理器`);
    
    // 确保元素具有正确的CSS样式
    this.element.style.position = 'fixed';
    this.element.style.top = '80px';
    this.element.style.right = '20px';
    this.element.style.zIndex = '9999';
    this.element.style.display = 'block';
    this.isVisible = true;
    
    // 强制重排然后添加显示类
    this.element.offsetHeight; // 触发重排
    this.element.classList.add('show');
    
    // 检查并显示浮动警告
    this.checkAndShowFloatingWarning();
    
    console.log(`[${config.PLUGIN_NAME}] 浮动管理器已显示`);
    console.log(`[${config.PLUGIN_NAME}] 浮动管理器最终样式:`, {
      position: this.element.style.position,
      top: this.element.style.top,
      right: this.element.style.right,
      zIndex: this.element.style.zIndex,
      display: this.element.style.display,
      transform: getComputedStyle(this.element).transform,
      opacity: getComputedStyle(this.element).opacity
    });
  }
  
  // 隐藏管理器
  hide() {
    if (!this.element) return; // 安全检查
    
    console.log(`[${config.PLUGIN_NAME}] 隐藏浮动管理器`);
    this.element.classList.remove('show');
    this.isVisible = false;
    
    // 动画完成后隐藏
    setTimeout(() => {
      if (this.element && !this.isVisible) {
        this.element.style.display = 'none';
      }
    }, 300);
  }
  
  // 检查并显示浮动警告
  checkAndShowFloatingWarning() {
    try {
      const warningElement = this.element.querySelector('#nz-floating-warning');
      if (!warningElement) return;
      
      // 检查警告是否已被关闭
      const warningDismissed = localStorage.getItem('nz_floating_warning_dismissed');
      if (warningDismissed) {
        const dismissedTime = parseInt(warningDismissed);
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000; // 一周的毫秒数
        const now = Date.now();
        
        // 如果关闭时间未超过一周，继续隐藏
        if (now - dismissedTime < oneWeekMs) {
          warningElement.style.display = 'none';
          return;
        }
        // 超过一周，清除记录，显示警告
        localStorage.removeItem('nz_floating_warning_dismissed');
      }
      
      // 显示警告
      warningElement.style.display = 'block';
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 检查浮动警告失败:`, error);
    }
  }
  
  // 隐藏浮动警告
  hideFloatingWarning() {
    try {
      const warningElement = this.element.querySelector('#nz-floating-warning');
      if (warningElement) {
        warningElement.style.display = 'none';
        // 记录关闭时间
        localStorage.setItem('nz_floating_warning_dismissed', Date.now().toString());
        console.log(`[${config.PLUGIN_NAME}] 浮动警告已关闭`);
      }
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 隐藏浮动警告失败:`, error);
    }
  }
  
  // 重置浮动警告（调试用）
  resetFloatingWarning() {
    try {
      localStorage.removeItem('nz_floating_warning_dismissed');
      const warningElement = this.element.querySelector('#nz-floating-warning');
      if (warningElement) {
        warningElement.style.display = 'block';
      }
      console.log(`[${config.PLUGIN_NAME}] 浮动警告已重置`);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 重置浮动警告失败:`, error);
    }
  }
  
  // 折叠/展开
  toggleCollapse() {
    if (!this.element) return; // 安全检查
    
    this.isCollapsed = !this.isCollapsed;
    
    const header = this.element.querySelector('.nz-floating-header');
    const content = this.element.querySelector('.nz-floating-content');
    const collapsedLayout = this.element.querySelector('.nz-collapsed-layout');
    
    if (this.isCollapsed) {
      // 折叠时：隐藏头部和内容，显示紧凑布局
      header.style.display = 'none';
      content.style.display = 'none';
      collapsedLayout.style.display = 'flex';
      
      // 更新折叠布局中的工作流名称
      const collapsedFilename = this.element.querySelector('.nz-collapsed-filename');
      if (this.currentWorkflow) {
        collapsedFilename.textContent = this.currentWorkflow.getDisplayName();
        
        // 同步按钮状态
        const collapsedSaveBtn = this.element.querySelector('.nz-collapsed-save-btn');
        const collapsedSaveAsBtn = this.element.querySelector('.nz-collapsed-saveas-btn');
        collapsedSaveBtn.disabled = false;
        collapsedSaveAsBtn.disabled = false;
      } else {
        collapsedFilename.textContent = '未加载工作流';
        
        // 禁用按钮
        const collapsedSaveBtn = this.element.querySelector('.nz-collapsed-save-btn');
        const collapsedSaveAsBtn = this.element.querySelector('.nz-collapsed-saveas-btn');
        collapsedSaveBtn.disabled = true;
        collapsedSaveAsBtn.disabled = true;
      }
      
      this.element.style.height = 'auto';
      
    } else {
      // 展开时：显示头部和内容，隐藏紧凑布局
      header.style.display = 'flex';
      content.style.display = 'block';
      collapsedLayout.style.display = 'none';
      
      this.element.style.height = 'auto';
    }
  }
  

  
  // 使浮动窗口可拖拽
  makeDraggable() {
    const header = this.element.querySelector('.nz-floating-header');
    const collapsedFilename = this.element.querySelector('.nz-collapsed-filename');
    const collapsedLayout = this.element.querySelector('.nz-collapsed-layout');
    let isDragging = false;
    let startX, startY, initialX, initialY;
    let dragElement = null;
    
    // 通用的拖拽开始处理函数
    const startDrag = (e, element) => {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      dragElement = element;
      
      const rect = this.element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      element.style.cursor = 'grabbing';
      if (element === collapsedFilename) {
        element.classList.add('dragging');
      } else if (element === collapsedLayout) {
        collapsedFilename.classList.add('dragging');
      }
      console.log(`[${config.PLUGIN_NAME}] 开始拖拽浮动窗口`);
    };
    
    // 头部拖拽
    header.addEventListener('mousedown', (e) => {
      // 如果点击的是控制按钮，不要启动拖拽
      if (e.target.closest('.nz-floating-controls')) return;
      startDrag(e, header);
    });
    
    // 折叠状态拖拽 - 整个布局都可以拖拽，但排除按钮区域
    collapsedLayout.addEventListener('mousedown', (e) => {
      // 确保点击的不是按钮区域
      if (e.target.closest('.nz-collapsed-actions') || e.target.closest('.nz-collapsed-controls')) {
        console.log(`[${config.PLUGIN_NAME}] 点击了按钮区域，不启动拖拽`);
        return;
      }
      console.log(`[${config.PLUGIN_NAME}] 折叠状态被点击，开始拖拽`);
      e.stopPropagation(); // 防止事件冒泡
      startDrag(e, collapsedLayout);
    });
    
    // 折叠状态文件名拖拽（保留原有功能作为备用）
    collapsedFilename.addEventListener('mousedown', (e) => {
      // 确保点击的是文件名本身，而不是按钮
      if (e.target.closest('.nz-collapsed-actions') || e.target.closest('.nz-collapsed-controls')) {
        console.log(`[${config.PLUGIN_NAME}] 点击了按钮区域，不启动拖拽`);
        return;
      }
      console.log(`[${config.PLUGIN_NAME}] 折叠状态标题被点击，开始拖拽`);
      e.stopPropagation(); // 防止事件冒泡
      startDrag(e, collapsedFilename);
    });
    
    // 通用的鼠标移动处理
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newX = Math.max(0, Math.min(window.innerWidth - this.element.offsetWidth, initialX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - this.element.offsetHeight, initialY + deltaY));
      
      this.element.style.left = newX + 'px';
      this.element.style.top = newY + 'px';
      this.element.style.right = 'auto';
    });
    
    // 通用的鼠标释放处理
    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        e.preventDefault();
        isDragging = false;
        
        if (dragElement) {
          if (dragElement === header) {
            dragElement.style.cursor = 'grab';
          } else if (dragElement === collapsedFilename) {
            dragElement.style.cursor = 'move';
            dragElement.classList.remove('dragging');
          } else if (dragElement === collapsedLayout) {
            dragElement.style.cursor = 'default';
            collapsedFilename.classList.remove('dragging');
          }
          dragElement = null;
        }
        
        console.log(`[${config.PLUGIN_NAME}] 结束拖拽浮动窗口`);
      }
    });
    
    // 设置初始光标样式
    header.style.cursor = 'grab';
    console.log(`[${config.PLUGIN_NAME}] 浮动窗口拖拽功能已启用`);
  }
  
  // ====== 应用当前主题方法 ======
  applyCurrentTheme() {
    try {
      if (!this.element) {
        return;
      }
      
      // 获取当前主题
      const savedTheme = localStorage.getItem('nz_theme') || 'dark';
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器应用当前主题: ${savedTheme}`);
      
      // 移除现有主题类
      this.element.classList.remove('nz-theme-light', 'nz-theme-dark');
      
      // 添加当前主题类
      this.element.classList.add(`nz-theme-${savedTheme}`);
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 浮动管理器应用当前主题失败:`, error);
    }
  }
  
  // ====== 主题同步方法 ======
  syncTheme(theme) {
    try {
      if (!this.element) {
        console.log(`[${config.PLUGIN_NAME}] 浮动管理器元素不存在，无法同步主题`);
        return;
      }
      
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器同步主题: ${theme}`);
      
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
      
      console.log(`[${config.PLUGIN_NAME}] 浮动管理器主题同步完成: ${theme}`);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 浮动管理器主题同步失败:`, error);
    }
  }
}
*/

// ====== 多选管理器 ======
// TODO: Stage9_CLEANUP - 以下类定义已迁移到模块中，待清理
// ⚠️ 已迁移：此类已迁移到 modules/ui/interaction-system.js，现在使用模块化版本
// 现在使用: modules/ui/interaction-system.js 中的 MultiSelectManager 类
class MultiSelectManager {
  constructor() {
    this.selectedItems = new Set();
    this.lastSelectedItem = null;
    this.isShiftPressed = false;
    this.isCtrlPressed = false;
    this.multiSelectMode = false; // 新增：多选模式状态
    
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
    
    // 传统模式的逻辑
    if (this.isCtrlPressed) {
      // Ctrl+点击：切换选择状态
      this.toggleSelection(itemElement, itemId, filePath, fileName, itemType);
      return true; // 表示处理了选择
    } else if (this.isShiftPressed && this.lastSelectedItem) {
      // Shift+点击：范围选择
      this.selectRange(itemElement, itemId, filePath, fileName, itemType);
      return true; // 表示处理了选择
    } else if (this.selectedItems.size > 1) {
      // 如果有多个选中项，单击切换到单选模式
      this.clearSelection();
      this.selectItem(itemElement, itemId, filePath, fileName, itemType);
      return true; // 表示处理了选择
    } else {
      // 普通点击：让外部处理默认操作，避免重复调用
      return false; // 表示没有处理，让外部执行默认操作
    }
  }
  
  // 选择项目
  selectItem(element, itemId, filePath, fileName, itemType) {
    element.classList.add('selected');
    this.selectedItems.add({
      id: itemId,
      element: element,
      filePath: filePath,
      fileName: fileName,
      type: itemType
    });
    this.lastSelectedItem = element;
    this.updateSelectionUI();
    this.updateMultiSelectButtonState();
  }
  
  // 取消选择项目
  deselectItem(element, itemId) {
    element.classList.remove('selected');
    this.selectedItems.forEach(item => {
      if (item.id === itemId) {
        this.selectedItems.delete(item);
      }
    });
    this.updateSelectionUI();
    this.updateMultiSelectButtonState();
  }
  
  // 切换选择状态
  toggleSelection(element, itemId, filePath, fileName, itemType) {
    if (element.classList.contains('selected')) {
      this.deselectItem(element, itemId);
    } else {
      this.selectItem(element, itemId, filePath, fileName, itemType);
    }
  }
  
  // 范围选择
  selectRange(currentElement, itemId, filePath, fileName, itemType) {
    const fileGrid = document.getElementById('nz-file-grid');
    if (!fileGrid) return;
    
    const allItems = Array.from(fileGrid.children);
    const lastIndex = allItems.indexOf(this.lastSelectedItem);
    const currentIndex = allItems.indexOf(currentElement);
    
    if (lastIndex === -1 || currentIndex === -1) {
      this.selectItem(currentElement, itemId, filePath, fileName, itemType);
      return;
    }
    
    const startIndex = Math.min(lastIndex, currentIndex);
    const endIndex = Math.max(lastIndex, currentIndex);
    
    // 清除现有选择
    this.clearSelection();
    
    // 选择范围内的所有项目
    for (let i = startIndex; i <= endIndex; i++) {
      const item = allItems[i];
      if (item) {
        const isFolder = item.classList.contains('folder');
        const itemType = isFolder ? 'directory' : 'file';
        const itemPath = item.dataset.filePath || '';
        const itemName = item.querySelector('div:last-child')?.textContent || '';
        const itemId = `${itemType}:${itemPath}`;
        
        this.selectItem(item, itemId, itemPath, itemName, itemType);
      }
    }
  }
  
  // 清除所有选择
  clearSelection() {
    this.clearSelectionInternal();
    this.updateSelectionUI();
    this.updateMultiSelectButtonState();
  }
  
  // 内部清除选择方法，不触发UI更新
  clearSelectionInternal() {
    this.selectedItems.forEach(item => {
      item.element.classList.remove('selected');
    });
    this.selectedItems.clear();
    this.lastSelectedItem = null;
  }
  
  // 更新选择UI
  updateSelectionUI() {
    // 在多选模式下，更新批量操作栏的状态
    if (this.multiSelectMode) {
      this.updateBatchOperationsBar();
    } else {
      // 如果不在多选模式但有选中项，清除选择
      if (this.selectedItems.size > 0) {
        this.clearSelection();
      }
    }
  }
  
  // 设置多选模式
  setMultiSelectMode(enabled) {
    this.multiSelectMode = enabled;
    console.log(`[${config.PLUGIN_NAME}] 多选模式: ${enabled ? '开启' : '关闭'}`);
    
    // 更新UI状态
    const multiSelectBtn = document.getElementById('nz-multi-select-btn');
    if (multiSelectBtn) {
      if (enabled) {
        multiSelectBtn.classList.add('nz-multi-select-toggle', 'active');
        multiSelectBtn.title = '退出多选模式';
        // 显示多选提示
        window.nzWorkflowManager.showNotification('多选模式已开启，点击文件/目录进行选择', 'info');
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
  
  // 更新工具栏多选按钮状态
  updateMultiSelectButtonState() {
    const multiSelectBtn = document.getElementById('nz-multi-select-btn');
    if (multiSelectBtn) {
      if (this.multiSelectMode) {
        // 在多选模式下，按钮应该显示为激活状态（蓝色）
        multiSelectBtn.classList.add('nz-multi-select-toggle', 'active');
        multiSelectBtn.title = '退出多选模式';
      } else {
        // 不在多选模式下，按钮应该显示为普通状态（灰色）
        multiSelectBtn.classList.remove('active');
        multiSelectBtn.title = '多选模式';
      }
    }
  }
  
  // 显示批量操作栏（在工具栏位置）
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
    
    // 绑定批量操作事件
    batchBar.querySelector('.nz-batch-exit').addEventListener('click', () => {
      console.log(`[${config.PLUGIN_NAME}] 退出多选模式按钮点击`);
      this.setMultiSelectMode(false);
    });
    
    batchBar.querySelector('.nz-batch-clear').addEventListener('click', () => {
      if (this.selectedItems.size > 0) {
        console.log(`[${config.PLUGIN_NAME}] 清除选择按钮点击`);
        this.clearSelection();
        // 重新显示批量操作栏以更新状态
        this.showBatchOperationsBar();
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

  // 获取选中的项目列表
  getSelectedItems() {
    return Array.from(this.selectedItems);
  }
  
  // 获取选中的文件路径列表
  getSelectedPaths() {
    return Array.from(this.selectedItems).map(item => item.filePath);
  }
  
  // 获取选中的文件名列表
  getSelectedNames() {
    return Array.from(this.selectedItems).map(item => item.fileName);
  }
}

// ✅ Stage6已完成：交互系统已迁移到 modules/ui/interaction-system.js
// 老实例创建已移除，现在使用模块化版本（在initializeModules中初始化）

// TODO: Stage9_CLEANUP - 以下实例已迁移到模块中，待清理
// 现在使用: modules/ui/interaction-system.js 中的 FileOperationsAPI 实例
const fileOperationsAPI = new FileOperationsAPI();
window.fileOperationsAPI = fileOperationsAPI;  // 修复拖拽功能所需 - 保留全局访问
window.toggleFloatingManager = toggleFloatingManager;
window.createNewFolder = createNewFolder;
window.loadDirectory = loadDirectory;
window.goBack = goBack;
window.chooseDirectory = chooseDirectory;
window.hideSettingsPanel = hideSettingsPanel;

// ====== 工作流备注编辑器 ======
// ✅ Stage8: WorkflowNoteEditor已迁移到 modules/features/workflow-note-editor.js
// TODO: Stage8_CLEANUP - 以下WorkflowNoteEditor类定义已迁移，待清理
/*
class WorkflowNoteEditor {
  static async openEditor(filePath, existingNote = null) {
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
        existingNote.tags.forEach(tag => WorkflowNoteEditor.addTag(tag));
      }
    }
    
    // 设置事件监听器
    WorkflowNoteEditor.setupEventListeners(overlay, filePath, saveBtn);
    
    // 聚焦到描述输入框
    setTimeout(() => {
      document.getElementById('note-description').focus();
    }, 100);
  }
  
  static setupEventListeners(overlay, filePath, saveBtn) {
    const tagInput = document.getElementById('note-tag-input');
    
    // 初始化分类列表
    WorkflowNoteEditor.initializeCategoryList();
    
    // 分类管理按钮事件
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    if (manageCategoriesBtn) {
      console.log('找到分类管理按钮，绑定事件...');
      manageCategoriesBtn.addEventListener('click', () => {
        console.log('分类管理按钮被点击！');
        try {
          WorkflowNoteEditor.showCategoryManager();
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
        WorkflowNoteEditor.addTag(tagInput.value.trim());
        tagInput.value = '';
      }
    });
    
    // 保存按钮事件
    saveBtn.onclick = () => {
      WorkflowNoteEditor.saveNote(filePath, overlay);
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
  
  static addTag(tagText) {
    const tagList = document.getElementById('note-tag-list');
    const existingTags = Array.from(tagList.children).map(tag => tag.textContent.replace('×', '').trim());
    
    // 检查标签是否已存在
    if (existingTags.includes(tagText)) {
      window.nzWorkflowManager.showNotification('标签已存在', 'warning');
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
  
  static saveNote(filePath, overlay) {
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
      window.nzWorkflowManager.showNotification('请填写描述', 'warning');
      return;
    }
    
    // 保存备注数据
    const noteData = {
      description,
      tags,
      category,
      priority
    };
    
    workflowNotesManager.saveNote(filePath, noteData);
    
    // 刷新文件显示
    WorkflowNoteEditor.refreshFileDisplay();
    
    // 更新浮动管理器显示
    const floatingManager = window.floatingWorkflowManager;
    if (floatingManager && floatingManager.currentWorkflow && 
        floatingManager.currentWorkflow.filePath === filePath) {
      floatingManager.updateWorkflowNoteDisplay();
    }
    
    // 关闭对话框
    overlay.remove();
    
    window.nzWorkflowManager.showNotification('备注保存成功', 'success');
  }
  
  static refreshFileDisplay() {
    // 刷新当前文件列表以显示新的备注信息
    const fileGrid = document.getElementById('nz-file-grid');
    if (fileGrid) {
      // 重新加载当前目录
      loadDirectory(config.getCurrentPath());
    }
  }
  
  static initializeCategoryList() {
    const datalist = document.getElementById('category-datalist');
    const categories = WorkflowCategoriesManager.getCategories();
    
    datalist.innerHTML = '';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      datalist.appendChild(option);
    });
  }
  
  static showCategoryManager() {
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
    
    const categories = WorkflowCategoriesManager.getCategories();
    
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
  
  static setupCategoryManagerEvents(overlay) {
    const addBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category-input');
    const doneBtn = document.getElementById('category-done-btn');
    
    // 添加分类
    const addCategory = () => {
      const name = newCategoryInput.value.trim();
      if (!name) return;
      
      if (WorkflowCategoriesManager.addCategory(name)) {
        this.refreshCategoryList();
        newCategoryInput.value = '';
        window.nzWorkflowManager.showNotification('分类添加成功', 'success');
      } else {
        window.nzWorkflowManager.showNotification('分类已存在或添加失败', 'warning');
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
          if (WorkflowCategoriesManager.removeCategory(categoryName)) {
            this.refreshCategoryList();
            window.nzWorkflowManager.showNotification('分类删除成功', 'success');
          } else {
            window.nzWorkflowManager.showNotification('删除失败', 'error');
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
            if (WorkflowCategoriesManager.renameCategory(categoryName, newName)) {
              this.refreshCategoryList();
              window.nzWorkflowManager.showNotification('分类重命名成功', 'success');
            } else {
              window.nzWorkflowManager.showNotification('重命名失败，分类名可能已存在', 'warning');
              nameSpan.style.display = '';
              input.remove();
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
      WorkflowNoteEditor.initializeCategoryList();
      overlay.remove();
    });
    
    // ESC关闭
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        WorkflowNoteEditor.initializeCategoryList();
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // 点击覆盖层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        WorkflowNoteEditor.initializeCategoryList();
        overlay.remove();
      }
    });
  }
  
  static refreshCategoryList() {
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) return;
    
    const categories = WorkflowCategoriesManager.getCategories();
    categoryList.innerHTML = categories.map(cat => `
      <div class="category-item" data-category="${cat}">
        <span class="category-name">${cat}</span>
        <div class="category-actions">
          <button class="edit-category-btn" title="编辑">✏️</button>
          <button class="delete-category-btn" title="删除">🗑️</button>
        </div>
      </div>
    `).join('');
  }
}
*/

// 备注操作函数
// ✅ Stage8: 以下备注操作函数已迁移到模块中，这里保留兼容性接口
// TODO: Stage8_CLEANUP - 这些函数调用现在由模块处理
// 注意：openNoteEditor 和 deleteWorkflowNote 现在通过模块的全局包装器提供

// TODO: Stage9_CLEANUP - 以下实例已迁移到模块中，待清理
// 现在使用: modules/ui/interaction-system.js 中的 DialogManager 实例
// 将DialogManager设置为全局可用
// 创建主文件的DialogManager实例，包含完整功能（包括showImportantInfoDialog）
const mainDialogManager = new DialogManager();
window.nzDialogManager = mainDialogManager;  // 保留全局访问

// 同时保持模块化版本的兼容性
if (window.dialogManager) {
  // 如果需要，可以合并两个DialogManager的功能
  console.log(`[${config.PLUGIN_NAME}] 主DialogManager和模块DialogManager都已就绪`);
}

// ✅ Stage8: WorkflowNoteEditor现在通过模块提供
// TODO: Stage8_CLEANUP - 全局WorkflowNoteEditor现在由模块管理

// ✅ Stage7: 浮动管理器变量已迁移到模块系统顶部声明
// Stage7-TODO: 删除以下老变量声明
// let floatingWorkflowManager = null;

// ✅ Stage7: 浮动管理器初始化已迁移到模块化系统
// Stage7-TODO: 删除以下老函数定义
/*
function initializeFloatingManager() {
  if (!floatingWorkflowManager) {
    try {
      console.log(`[${config.PLUGIN_NAME}] 创建浮动工作流助手实例`);
      
      // 先清理页面上可能存在的旧的浮动管理器元素
      const existingElements = document.querySelectorAll('.nz-floating-manager');
      existingElements.forEach(el => {
        console.log(`[${config.PLUGIN_NAME}] 清理页面上的旧浮动管理器元素`);
        el.parentNode.removeChild(el);
      });
      
      // TODO: Stage9_CLEANUP - 以下实例已迁移到模块中，待清理
      // 现在使用: modules/features/floating-manager.js 中的 FloatingWorkflowManager 实例
      floatingWorkflowManager = new FloatingWorkflowManager();
      // 同时设置为全局变量，方便其他地方访问 - 保留全局访问
      window.floatingWorkflowManager = floatingWorkflowManager;
      console.log(`[${config.PLUGIN_NAME}] 浮动工作流助手实例已创建`);
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 浮动管理器创建失败:`, error);
      // 创建一个简单的占位对象，避免调用时出错
      floatingWorkflowManager = {
        loadWorkflow: (filePath, workflowData) => {
          console.log(`[${config.PLUGIN_NAME}] 浮动管理器暂时不可用，文件: ${filePath}`);
          window.nzWorkflowManager.showNotification('浮动管理器暂时不可用', 'warning');
        },
        show: () => console.log(`[${config.PLUGIN_NAME}] 浮动管理器暂时不可用`),
        hide: () => console.log(`[${config.PLUGIN_NAME}] 浮动管理器暂时不可用`),
        isVisible: false,
        syncTheme: (theme) => console.log(`[${config.PLUGIN_NAME}] 浮动管理器暂时不可用，无法同步主题: ${theme}`)
      };
      window.floatingWorkflowManager = floatingWorkflowManager;
    }
  }
  return floatingWorkflowManager;
}
*/

// 打开浮动管理器
// ✅ Stage7: 使用模块化的浮动管理器
function toggleFloatingManager() {
  console.log(`[${config.PLUGIN_NAME}] 切换浮动管理器`);
  
  try {
    // 使用模块化的浮动管理器实例
    if (floatingWorkflowManager) {
      if (floatingWorkflowManager.isVisible) {
        floatingWorkflowManager.hide();
        console.log(`[${config.PLUGIN_NAME}] 浮动管理器已隐藏`);
      } else {
        floatingWorkflowManager.show();
        console.log(`[${config.PLUGIN_NAME}] 浮动管理器已显示`);
      }
    } else {
      console.warn(`[${config.PLUGIN_NAME}] 浮动管理器未初始化`);
      if (uiManager && uiManager.showNotification) {
        uiManager.showNotification('浮动管理器未就绪', 'warning');
      }
    }
  } catch (error) {
    console.error(`[${config.PLUGIN_NAME}] 切换浮动管理器失败:`, error);
    if (uiManager && uiManager.showNotification) {
      uiManager.showNotification('切换浮动管理器失败', 'error');
    }
  }
}

console.log(`[${config.PLUGIN_NAME}] 右键菜单系统已初始化`);

// ====== 拖拽到上级目录功能 ======
// 注意：现在使用路径栏覆盖层显示拖拽提示，不再需要单独的拖拽区域
function createDragToParentTarget() {
  console.log(`[${config.PLUGIN_NAME}] 创建拖拽到上级目录的目标区域`);
  
  // 检查是否已经存在
  let dragTarget = document.getElementById('nz-drag-to-parent');
  if (dragTarget) {
    console.log(`[${config.PLUGIN_NAME}] 拖拽目标区域已存在，移除旧的`);
    dragTarget.remove();
  }
  
  // 创建拖拽目标区域
  dragTarget = document.createElement('div');
  dragTarget.id = 'nz-drag-to-parent';
  dragTarget.className = 'nz-drag-to-parent';
  dragTarget.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div class="icon">⬆️</div>
      <div>拖拽到上一级目录</div>
    </div>
  `;
  
  // 添加到插件界面的正确位置：文件列表下方，状态信息上方
  const contentContainer = document.getElementById('nz-content');
  const statusBar = document.querySelector('.nz-status-bar');
  
  if (contentContainer && statusBar) {
    // 在状态栏之前插入拖拽区域
    statusBar.parentNode.insertBefore(dragTarget, statusBar);
    console.log(`[${config.PLUGIN_NAME}] 拖拽目标区域已插入到状态栏之前`);
  } else if (contentContainer) {
    // 如果找不到状态栏，则添加到内容容器末尾
    contentContainer.appendChild(dragTarget);
    console.log(`[${config.PLUGIN_NAME}] 拖拽目标区域已添加到内容容器末尾`);
  } else {
    // 如果都找不到，则添加到管理器容器作为备选
    const managerContainer = document.querySelector('.nz-manager');
    if (managerContainer) {
      managerContainer.appendChild(dragTarget);
      console.log(`[${config.PLUGIN_NAME}] 拖拽目标区域已添加到管理器容器（备选方案）`);
    } else {
      // 最后备选：添加到body
      document.body.appendChild(dragTarget);
      console.log(`[${config.PLUGIN_NAME}] 拖拽目标区域已添加到body（最后备选方案）`);
    }
  }
  
  // 设置拖拽事件监听器
  setupDragToParentListeners(dragTarget);
  
  console.log(`[${config.PLUGIN_NAME}] 拖拽到上级目录的目标区域已创建`);
}

function setupDragToParentListeners(dragTarget) {
  // 拖拽悬停事件
  dragTarget.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/x-nz-workflow')) {
      e.dataTransfer.dropEffect = 'move';
      dragTarget.classList.add('drag-over');
    }
  });
  
  // 拖拽离开事件
  dragTarget.addEventListener('dragleave', (e) => {
    // 只有在真正离开元素时才移除样式
    if (!dragTarget.contains(e.relatedTarget)) {
      dragTarget.classList.remove('drag-over');
    }
  });
  
  // 拖拽放置事件
  dragTarget.addEventListener('drop', (e) => {
    e.preventDefault();
    dragTarget.classList.remove('drag-over');
    
    const draggedFilePath = e.dataTransfer.getData('application/x-nz-workflow');
    
    if (draggedFilePath && config.getCurrentPath()) {
      // 获取上级目录路径，但限制在默认目录范围内
      const parentPath = getParentDirectoryWithLimit(config.getCurrentPath());
      
      if (parentPath && parentPath !== draggedFilePath) {
        // 检查是否有多个选中的文件
        const selectedItems = multiSelectManager.getSelectedItems();
        const isMultiSelect = selectedItems.length > 1;
        
        // 确保拖拽的文件在选中列表中
        const isDraggedFileSelected = selectedItems.some(item => item.filePath === draggedFilePath);
        
        if (isMultiSelect && isDraggedFileSelected) {
          // 多选拖拽：移动所有选中的文件到上级目录
          console.log(`[${config.PLUGIN_NAME}] 多选拖拽到上级目录: ${selectedItems.length} 个文件 -> ${parentPath}`);
          const selectedPaths = selectedItems.map(item => item.filePath);
          workflowManager.performMultiDragMove(selectedPaths, parentPath);
        } else {
          // 单选拖拽：移动单个文件到上级目录
          console.log(`[${config.PLUGIN_NAME}] 拖拽文件到上级目录: ${draggedFilePath} -> ${parentPath}`);
          workflowManager.performDragMove(draggedFilePath, parentPath);
        }
      } else {
        console.log(`[${config.PLUGIN_NAME}] 无法移动到上级目录或路径相同`);
        window.nzWorkflowManager.showNotification('无法移动到上级目录', 'warning');
      }
    }
    
    // 隐藏拖拽目标区域
    hideDragToParentTarget();
    
    // 拖拽完成后清除拖拽状态
    setTimeout(() => {
      window.nzIsDragging = false;
      console.log(`[${config.PLUGIN_NAME}] 拖拽到上级目录完成后状态已清除: ${window.nzIsDragging}`);
      // 确保多选按钮状态正确
      if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
        multiSelectManager.updateMultiSelectButtonState();
      }
    }, 100);
  });
}

function showDragToParentTarget() {
  console.log(`[${config.PLUGIN_NAME}] 尝试显示拖拽到上级目录区域`);
  console.log(`[${config.PLUGIN_NAME}] 当前路径: ${config.getCurrentPath()}`);
  console.log(`[${config.PLUGIN_NAME}] 默认目录: ${defaultDirectory}`);
  
  // 使用新的路径栏覆盖层而不是底部区域
  showPathBarDragOverlay();
}

// 暴露拖拽相关函数到全局，供模块化系统使用
window.showDragToParentTarget = showDragToParentTarget;

function hideDragToParentTarget() {
  // 使用新的路径栏覆盖层而不是底部区域
  hidePathBarDragOverlay();
}

// 暴露隐藏拖拽相关函数到全局，供模块化系统使用
window.hideDragToParentTarget = hideDragToParentTarget;
window.hidePathBarDragOverlay = hidePathBarDragOverlay;

// ====== 路径栏拖拽覆盖层控制 ======
function showPathBarDragOverlay() {
  console.log(`[${config.PLUGIN_NAME}] 尝试显示路径栏拖拽覆盖层`);
  console.log(`[${config.PLUGIN_NAME}] 当前路径: ${config.getCurrentPath()}`);
  console.log(`[${config.PLUGIN_NAME}] 默认目录: ${defaultDirectory}`);
  
  const dragOverlay = document.getElementById('nz-path-drag-overlay');
  console.log(`[${config.PLUGIN_NAME}] 拖拽覆盖层元素:`, dragOverlay);
  
  if (dragOverlay && config.getCurrentPath()) {
    // 检查是否可以返回上级目录
    const parentPath = getParentDirectoryWithLimit(config.getCurrentPath());
    console.log(`[${config.PLUGIN_NAME}] 上级目录路径: ${parentPath}`);
    
    if (parentPath) {
      // 给路径显示容器添加类，隐藏背景内容
      const pathDisplay = document.querySelector('.nz-path-display');
      if (pathDisplay) {
        pathDisplay.classList.add('drag-overlay-active');
      }
      
      // 显示拖拽覆盖层
      dragOverlay.classList.add('visible');
      console.log(`[${config.PLUGIN_NAME}] 显示路径栏拖拽覆盖层 - 已添加visible类`);
      
      // 设置拖拽事件监听器
      setupPathBarDragOverlayListeners(dragOverlay);
      
    } else {
      console.log(`[${config.PLUGIN_NAME}] 无法获取上级目录路径，不显示拖拽覆盖层`);
    }
  } else {
    console.log(`[${config.PLUGIN_NAME}] 拖拽覆盖层元素不存在或当前路径为空`);
  }
}

function hidePathBarDragOverlay() {
  const dragOverlay = document.getElementById('nz-path-drag-overlay');
  if (dragOverlay) {
    dragOverlay.classList.remove('visible', 'drag-over');
    console.log(`[${config.PLUGIN_NAME}] 隐藏路径栏拖拽覆盖层 - 已移除visible类`);
  }
  
  // 移除路径显示容器的隐藏类，恢复背景内容显示
  const pathDisplay = document.querySelector('.nz-path-display');
  if (pathDisplay) {
    pathDisplay.classList.remove('drag-overlay-active');
  }
}

function setupPathBarDragOverlayListeners(dragOverlay) {
  // 移除之前的事件监听器以避免重复绑定
  const newOverlay = dragOverlay.cloneNode(true);
  dragOverlay.parentNode.replaceChild(newOverlay, dragOverlay);
  
  // 拖拽悬停事件
  newOverlay.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    newOverlay.classList.add('drag-over');
    console.log(`[${config.PLUGIN_NAME}] 路径栏拖拽覆盖层悬停`);
  });

  newOverlay.addEventListener('dragleave', (e) => {
    newOverlay.classList.remove('drag-over');
    console.log(`[${config.PLUGIN_NAME}] 路径栏拖拽覆盖层离开`);
  });
  
  // 拖拽放置事件
  newOverlay.addEventListener('drop', (e) => {
    e.preventDefault();
    console.log(`[${config.PLUGIN_NAME}] 路径栏拖拽覆盖层放置事件`);
    
    const draggedFilePath = e.dataTransfer.getData('application/x-nz-workflow');
    
    if (draggedFilePath && config.getCurrentPath()) {
      // 获取上级目录路径，但限制在默认目录范围内
      const parentPath = getParentDirectoryWithLimit(config.getCurrentPath());
      
      if (parentPath && parentPath !== draggedFilePath) {
        // 检查是否有多个选中的文件
        const selectedItems = multiSelectManager.getSelectedItems();
        const isMultiSelect = selectedItems.length > 1;
        
        // 确保拖拽的文件在选中列表中
        const isDraggedFileSelected = selectedItems.some(item => item.filePath === draggedFilePath);
        
        if (isMultiSelect && isDraggedFileSelected) {
          // 多选拖拽：移动所有选中的文件到上级目录
          console.log(`[${config.PLUGIN_NAME}] 多选拖拽到上级目录: ${selectedItems.length} 个文件 -> ${parentPath}`);
          const selectedPaths = selectedItems.map(item => item.filePath);
          workflowManager.performMultiDragMove(selectedPaths, parentPath);
        } else {
          // 单选拖拽：移动单个文件到上级目录
          console.log(`[${config.PLUGIN_NAME}] 拖拽文件到上级目录: ${draggedFilePath} -> ${parentPath}`);
          workflowManager.performDragMove(draggedFilePath, parentPath);
        }
      } else {
        console.log(`[${config.PLUGIN_NAME}] 无法移动到上级目录或路径相同`);
        window.nzWorkflowManager.showNotification('无法移动到上级目录', 'warning');
      }
    }
    
    // 隐藏拖拽覆盖层
    hidePathBarDragOverlay();
    
    // 拖拽完成后清除拖拽状态
    setTimeout(() => {
      window.nzIsDragging = false;
      console.log(`[${config.PLUGIN_NAME}] 路径栏拖拽完成后状态已清除: ${window.nzIsDragging}`);
      // 确保多选按钮状态正确
      if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
        multiSelectManager.updateMultiSelectButtonState();
      }
    }, 100);
  });
}

// ====== 路径栏拖拽支持 ======
// Stage6-COMPLETED: 已迁移到 modules/ui/interaction-system.js
// 保留原始函数定义以防兼容性问题，但实际使用模块化版本
function setupPathBarDragSupport(currentPath) {
  console.log(`[${config.PLUGIN_NAME}] 设置路径栏拖拽支持，当前路径: ${currentPath}`);
  
  const pathDisplay = document.getElementById('nz-path-display');
  
  if (!pathDisplay) {
    console.error(`[${config.PLUGIN_NAME}] 找不到路径栏元素`);
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
    
    if (draggedFilePath && config.getCurrentPath()) {
      // 获取上级目录路径，但限制在默认目录范围内
      const parentPath = getParentDirectoryWithLimit(config.getCurrentPath());
      
      if (parentPath && parentPath !== draggedFilePath) {
        // 检查是否有多个选中的文件
        const selectedItems = multiSelectManager.getSelectedItems();
        const isMultiSelect = selectedItems.length > 1;
        
        // 确保拖拽的文件在选中列表中
        const isDraggedFileSelected = selectedItems.some(item => item.filePath === draggedFilePath);
        
        if (isMultiSelect && isDraggedFileSelected) {
          // 多选拖拽：移动所有选中的文件到上级目录
          console.log(`[${config.PLUGIN_NAME}] 多选拖拽到上级目录: ${selectedItems.length} 个文件 -> ${parentPath}`);
          const selectedPaths = selectedItems.map(item => item.filePath);
          workflowManager.performMultiDragMove(selectedPaths, parentPath);
        } else {
          // 单选拖拽：移动单个文件到上级目录
          console.log(`[${config.PLUGIN_NAME}] 拖拽文件到上级目录: ${draggedFilePath} -> ${parentPath}`);
          workflowManager.performDragMove(draggedFilePath, parentPath);
        }
      } else {
        console.log(`[${config.PLUGIN_NAME}] 无法移动到上级目录或路径相同`);
        window.nzWorkflowManager.showNotification('无法移动到上级目录', 'warning');
      }
    }
    
    // 拖拽完成后清除拖拽状态
    setTimeout(() => {
      window.nzIsDragging = false;
      console.log(`[${config.PLUGIN_NAME}] 路径栏拖拽完成后状态已清除: ${window.nzIsDragging}`);
      // 确保多选按钮状态正确
      if (multiSelectManager && multiSelectManager.isMultiSelectMode()) {
        multiSelectManager.updateMultiSelectButtonState();
      }
    }, 100);
  });
}

// ====== 获取上级目录路径（无限制版本） ======
function getParentDirectory(currentPath) {
  if (!currentPath || currentPath === '') {
    return null; // 没有路径
  }
  
  // 移除末尾的反斜杠
  const cleanPath = currentPath.replace(/[\\\/]+$/, '');
  
  // 检查是否已经是根目录
  if (cleanPath.length <= 3 && cleanPath.match(/^[A-Za-z]:\\?$/)) {
    return null; // 已经是根目录 (如 C:\ 或 C:)
  }
  
  // 获取上级目录
  const lastSeparatorIndex = Math.max(cleanPath.lastIndexOf('\\'), cleanPath.lastIndexOf('/'));
  if (lastSeparatorIndex === -1) {
    return null; // 无法获取上级目录
  }
  
  let parentPath = cleanPath.substring(0, lastSeparatorIndex);
  
  // 如果上级目录是驱动器根目录，确保以反斜杠结尾
  if (parentPath.length === 2 && parentPath.match(/^[A-Za-z]:$/)) {
    parentPath += '\\';
  }
  
  return parentPath || null;
}

// ====== 获取上级目录路径（限制在默认目录范围内） ======
function getParentDirectoryWithLimit(currentPath) {
  if (!currentPath || currentPath === '') {
    return null;
  }
  
  // 获取默认目录的根目录（即默认目录本身）
  const defaultRoot = getDefaultDirectoryRoot();
  
  // 标准化路径格式（统一使用反斜杠，移除末尾反斜杠）
  const normalizedCurrentPath = currentPath.replace(/\//g, '\\').replace(/\\+$/, '');
  const normalizedDefaultRoot = defaultRoot.replace(/\//g, '\\').replace(/\\+$/, '');
  
  // 如果当前路径已经是默认目录，则不能再往上
  if (normalizedCurrentPath === normalizedDefaultRoot) {
    console.log(`[${config.PLUGIN_NAME}] 已达到默认目录限制，不能再返回上级: ${currentPath}`);
    return null;
  }
  
  // 获取上级目录
  const parentPath = getParentDirectory(currentPath);
  if (!parentPath) {
    console.log(`[${config.PLUGIN_NAME}] 无法获取上级目录: ${currentPath}`);
    return null;
  }
  
  // 标准化上级目录路径
  const normalizedParentPath = parentPath.replace(/\//g, '\\').replace(/\\+$/, '');
  
  // 调试信息
  console.log(`[${config.PLUGIN_NAME}] 路径检查:`);
  console.log(`  当前路径: ${normalizedCurrentPath}`);
  console.log(`  上级路径: ${normalizedParentPath}`);
  console.log(`  默认根目录: ${normalizedDefaultRoot}`);
  
  // 如果上级目录是默认目录或在默认目录内，允许返回
  if (normalizedParentPath === normalizedDefaultRoot || normalizedParentPath.startsWith(normalizedDefaultRoot + '\\')) {
    console.log(`[${config.PLUGIN_NAME}] 返回上级目录（限制范围内）: ${currentPath} -> ${parentPath}`);
    return parentPath;
  }
  
  // 如果上级目录超出默认目录范围，不允许返回
  console.log(`[${config.PLUGIN_NAME}] 上级目录超出默认目录范围，禁止返回: 当前=${currentPath}, 上级=${parentPath}, 限制=${defaultRoot}`);
  return null;
}

// ====== 获取默认目录的根目录 ======
function getDefaultDirectoryRoot() {
  if (!defaultDirectory || defaultDirectory === '') {
    return 'D:\\'; // 如果没有设置默认目录，返回D盘根目录
  }
  
  // 直接返回默认目录本身作为根目录限制
  // 用户最多只能返回到默认目录，不能再往上
  console.log(`[${config.PLUGIN_NAME}] 默认目录根目录限制: ${defaultDirectory} (不允许返回到上级目录)`);
  return defaultDirectory;
}

// ====== 主要的应用注册 ======
// 使用ComfyUI的标准扩展导入方式
import { app } from "../../scripts/app.js";

app.registerExtension({
  name: "NZWorkflowManager", // 直接使用字符串，避免依赖未初始化的模块
  
  async setup() {
          try {
      // 首先初始化所有模块
      const initSuccess = initializeModules(app);
      if (!initSuccess) {
        console.error('模块初始化失败，插件可能无法正常工作');
        return;
      }
      
      console.log(`[${config.PLUGIN_NAME}] 开始注册扩展...`);
        
        // 强制修复左侧留白问题
        setTimeout(() => {
          if (typeof window.nzForceLeftPadding === 'function') {
            console.log(`[${config.PLUGIN_NAME}] 应用左侧留白修复...`);
            window.nzForceLeftPadding();
          }
        }, 1000);
        
        console.log(`[${config.PLUGIN_NAME}] app对象状态:`, typeof app, app ? '可用' : '不可用');
        console.log(`[${config.PLUGIN_NAME}] app.extensionManager状态:`, app?.extensionManager ? '可用' : '不可用');
      console.log(`[${config.PLUGIN_NAME}] app.socket状态: ${app?.socket ? '存在' : '不存在'}, readyState=${app?.socket?.readyState}, WebSocket.OPEN=${WebSocket?.OPEN}`);
      
      // 初始化全局变量
      window.nzCurrentPath = '';
      window.nzDefaultDirectory = '';
      window.nzDragStartPos = null;
      
      // 等待一小段时间确保ComfyUI完全初始化
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 再次检查WebSocket状态
      console.log(`[${config.PLUGIN_NAME}] 延迟后WebSocket状态: ${app?.socket ? '存在' : '不存在'}, readyState=${app?.socket?.readyState}`);
      
      // 使用新的标签注册机制，不再使用旧的按钮创建机制
      registerPlugin();
      
      // 设置全局拖拽处理器（使用模块化版本）
      dragDropManager.setupGlobalDragHandler();
      
      // 注意：拖拽到上级目录的功能现在通过路径栏覆盖层实现
      
      console.log(`[${config.PLUGIN_NAME}] 扩展注册完成`);
      
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 注册扩展时发生错误:`, error);
      // 如果注册失败，记录错误但不创建额外按钮
      console.log(`[${config.PLUGIN_NAME}] 扩展注册失败，但标签注册机制应该已经处理了界面创建`);
    }
  },
  
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    // 可以在这里添加节点相关的扩展逻辑
  }
});

// 注意：旧的按钮创建机制已被删除，现在使用标签注册机制





// ====== 初始化确保插件可用 ======
// 如果DOM已加载，立即注册；否则等待加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log(`[${config.PLUGIN_NAME}] DOM加载完成，准备注册插件`);
  });
} else {
  console.log(`[${config.PLUGIN_NAME}] DOM已就绪，插件准备完成`);
}

console.log(`[${config.PLUGIN_NAME}] 插件脚本加载完成 v${config.PLUGIN_VERSION}`);

// ====== 暴露紧急清理函数到全局作用域 ======
window.nzEmergencyCleanup = () => {
  console.log(`[${config.PLUGIN_NAME}] 全局紧急清理函数被调用`);
  
  // 清理所有可能的冲突对话框
  const allElements = document.querySelectorAll('*');
  let cleaned = 0;
  
  allElements.forEach(element => {
    const text = element.textContent || '';
    const isConflictDialog = text.includes('覆盖') || text.includes('跳过') || text.includes('文件冲突') || text.includes('选择操作');
    const hasDialogClass = element.classList.contains('conflict-resolution-dialog');
    const hasDialogStyle = element.style.position === 'fixed' || element.style.position === 'absolute';
    
    if (isConflictDialog || hasDialogClass) {
      console.log(`[${config.PLUGIN_NAME}] 全局清理移除:`, element);
      element.remove();
      cleaned++;
    }
  });
  
  console.log(`[${config.PLUGIN_NAME}] 全局清理完成，移除了 ${cleaned} 个元素`);
  alert(`已清理 ${cleaned} 个对话框元素`);
};

console.log(`[${config.PLUGIN_NAME}] 紧急清理函数已暴露：window.nzEmergencyCleanup()`);

// ====== 调试工具 ======
window.debugNZWorkflow = {
  // 检查标签布局
  checkTagLayout: () => {
    console.log('=== 标签布局调试信息 ===');
    const fileItems = document.querySelectorAll('.nz-file-item');
    console.log(`找到 ${fileItems.length} 个文件项`);
    
    fileItems.forEach((item, index) => {
      const bottom = item.querySelector('.nz-file-item-bottom');
      const date = item.querySelector('.nz-file-item-date');
      const tags = item.querySelector('.nz-file-tags-inline');
      
      console.log(`文件项 ${index + 1}:`);
      console.log('  - 底部容器:', bottom ? '存在' : '不存在');
      console.log('  - 日期元素:', date ? date.textContent : '不存在');
      console.log('  - 标签容器:', tags ? '存在' : '不存在');
      
      if (bottom) {
        const computedStyle = getComputedStyle(bottom);
        console.log('  - 底部容器样式:');
        console.log(`    display: ${computedStyle.display}`);
        console.log(`    justify-content: ${computedStyle.justifyContent}`);
        console.log(`    align-items: ${computedStyle.alignItems}`);
        console.log(`    flex-direction: ${computedStyle.flexDirection}`);
        console.log('  - 底部容器HTML:', bottom.outerHTML);
      }
      
      if (tags && tags.children.length > 0) {
        console.log(`  - 标签数量: ${tags.children.length}`);
        const tagsStyle = getComputedStyle(tags);
        console.log(`  - 标签容器样式: display=${tagsStyle.display}, justify-content=${tagsStyle.justifyContent}`);
      }
      
      // 强制修复布局
      ensureCorrectLayout(item);
    });
  },
  
  // 修复所有文件项的布局
  fixAllLayouts: () => {
    console.log('=== 强制修复所有布局 ===');
    const fileItems = document.querySelectorAll('.nz-file-item');
    fileItems.forEach((item, index) => {
      ensureCorrectLayout(item);
      ensureFileItemBorder(item, true); // 抑制单个日志
    });
    console.log(`已修复 ${fileItems.length} 个文件项的布局和边框`);
    console.log('布局修复完成');
  },
  
  // 打开主对话框
  openManager: () => {
    console.log('=== 打开管理器 ===');
    const button = document.querySelector('button[title*="NZ"]') || 
                   document.querySelector('.nz-workflow-btn') ||
                   document.querySelector('[data-nz-workflow]');
    if (button) {
      button.click();
      console.log('已点击管理器按钮');
    } else {
      console.log('未找到管理器按钮');
    }
  },
  
  testCategoryManager: () => {
    console.log('=== 分类管理调试信息 ===');
    
    // 检查备注编辑器对话框是否打开
    const noteEditor = document.querySelector('.nz-dialog-overlay');
    console.log('备注编辑器是否打开:', !!noteEditor);
    
    if (noteEditor) {
      // 在编辑器内查找按钮
      const btn = noteEditor.querySelector('#manage-categories-btn');
      console.log('编辑器内按钮元素:', btn);
      if (btn) {
        console.log('按钮样式:', getComputedStyle(btn));
        console.log('按钮是否可见:', btn.offsetWidth > 0 && btn.offsetHeight > 0);
        console.log('按钮是否禁用:', btn.disabled);
        console.log('按钮事件监听器数量:', getEventListeners ? getEventListeners(btn) : '需要在开发者工具中查看');
      }
    } else {
      console.log('⚠️ 备注编辑器未打开，齿轮按钮只在编辑器内存在');
      console.log('请先打开工作流备注编辑器（点击"增加备注"按钮）');
    }
    
    console.log('WorkflowNoteEditor:', WorkflowNoteEditor);
    console.log('showCategoryManager 方法:', WorkflowNoteEditor.showCategoryManager);
  },
  showCategoryManager: () => {
    try {
      console.log('手动调用 showCategoryManager...');
      if (window.WorkflowNoteEditor) {
        window.WorkflowNoteEditor.showCategoryManager();
      } else {
        console.error('WorkflowNoteEditor 未找到，可能插件尚未完全加载');
      }
    } catch (error) {
      console.error('手动调用失败:', error);
    }
  },
  clickButton: () => {
    // 首先检查编辑器是否打开
    const noteEditor = document.querySelector('.nz-dialog-overlay');
    if (!noteEditor) {
      console.error('❌ 备注编辑器未打开，无法找到齿轮按钮');
      console.log('💡 解决方案：请先点击"增加备注"按钮打开编辑器');
      return;
    }
    
    const btn = noteEditor.querySelector('#manage-categories-btn');
    if (btn) {
      console.log('模拟点击按钮...');
      btn.click();
    } else {
      console.error('按钮未找到');
    }
  },
  // 新增：打开备注编辑器的便捷方法
  openNoteEditor: () => {
    const floatingManager = document.querySelector('.nz-floating-manager');
    if (!floatingManager || floatingManager.style.display === 'none') {
      console.error('❌ 浮动管理器未打开，无法打开备注编辑器');
      console.log('💡 解决方案：请先加载一个工作流');
      return;
    }
    
    const addNoteBtn = floatingManager.querySelector('#add-note-btn');
    if (addNoteBtn && addNoteBtn.style.display !== 'none') {
      console.log('点击"增加备注"按钮...');
      addNoteBtn.click();
    } else {
      console.error('未找到"增加备注"按钮或按钮不可见');
    }
  },
  
  // 检查UI元素状态
  checkUIStatus: () => {
    console.log('=== NZ工作流助手UI状态调试 ===');
    console.log('插件版本:', config.PLUGIN_VERSION);
    console.log('当前路径:', config.getCurrentPath());
    console.log('全局实例:', {
      dialogManager: window.nzDialogManager ? '已初始化' : '未初始化',
      contextMenuManager: typeof contextMenuManager !== 'undefined' ? '已初始化' : '未初始化',
      fileOperationsAPI: typeof fileOperationsAPI !== 'undefined' ? '已初始化' : '未初始化',
      multiSelectManager: typeof multiSelectManager !== 'undefined' ? '已初始化' : '未初始化'
    });
    
    // 检查DOM元素
    const manager = document.querySelector('.nz-manager');
    console.log('主管理器元素:', manager ? '已找到' : '未找到');
    
    if (manager) {
      const styles = getComputedStyle(manager);
      console.log('管理器状态:', {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        位置信息: manager.getBoundingClientRect()
      });
    }
    
    // 检查文件网格
    const fileGrid = document.getElementById('nz-file-grid');
    console.log('文件网格:', fileGrid ? '已找到' : '未找到');
    
    if (fileGrid) {
      console.log('文件项数量:', fileGrid.children.length);
    }
    
    // 检查浮动管理器
    const floatingManager = document.querySelector('.nz-floating-manager');
    console.log('浮动管理器元素:', floatingManager ? '已找到' : '未找到');
    
    if (floatingManager) {
      const styles = getComputedStyle(floatingManager);
      console.log('浮动管理器状态:', {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position,
        top: styles.top,
        right: styles.right,
        transform: styles.transform,
        位置信息: floatingManager.getBoundingClientRect(),
        classes: floatingManager.className
      });
    }
    
    // 检查对话框
    const dialogs = document.querySelectorAll('.nz-dialog-overlay');
    console.log('活动对话框数量:', dialogs.length);
    
    dialogs.forEach((dialog, index) => {
      const styles = getComputedStyle(dialog);
      console.log(`对话框 ${index + 1}:`, {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        位置信息: dialog.getBoundingClientRect()
      });
    });
  },
  
  // 强制显示浮动管理器（调试用）
  forceShowFloating: () => {
    console.log('=== 强制显示浮动管理器 ===');
    const floatingManager = document.querySelector('.nz-floating-manager');
    
    if (!floatingManager) {
      console.log('浮动管理器不存在，尝试显示模块化版本...');
      // 使用模块化的浮动管理器
      if (floatingWorkflowManager) {
        floatingWorkflowManager.show();
        console.log('模块化浮动管理器已显示');
      } else {
        console.error('模块化浮动管理器未初始化');
      }
      return;
    }
    
    console.log('找到浮动管理器，强制设置样式...');
    
    // 强制设置样式
    floatingManager.style.display = 'block';
    floatingManager.style.visibility = 'visible';
    floatingManager.style.opacity = '1';
    floatingManager.style.zIndex = '9999';
    floatingManager.style.position = 'fixed';
    floatingManager.style.top = '80px';
    floatingManager.style.right = '20px';
    floatingManager.style.transform = 'translateX(0)';
    floatingManager.classList.add('show');
    
    console.log('浮动管理器样式已强制设置');
    console.log('当前状态:', {
      display: floatingManager.style.display,
      visibility: floatingManager.style.visibility,
      opacity: floatingManager.style.opacity,
      zIndex: floatingManager.style.zIndex,
      transform: floatingManager.style.transform,
      classes: floatingManager.className,
      位置信息: floatingManager.getBoundingClientRect()
    });
  }
};

console.log(`[${config.PLUGIN_NAME}] 调试工具已暴露：window.debugNZWorkflow`);

// ====== 页面卸载清理 ======
window.addEventListener('beforeunload', () => {
  try {
    cleanupThemeMonitors();
    console.log(`[${config.PLUGIN_NAME}] 页面卸载，清理主题监听器`);
  } catch (error) {
    console.warn(`[${config.PLUGIN_NAME}] 清理主题监听器失败:`, error);
  }
});

// ====== 响应式标签显示 ======
window.addEventListener('resize', () => {
  // 防抖处理，避免过频繁调用
  clearTimeout(window.nzResizeTimeout);
  window.nzResizeTimeout = setTimeout(() => {
    document.querySelectorAll('.nz-file-item').forEach(fileItem => {
      adjustTagsDisplay(fileItem);
    });
  }, 150);
});

// ====== DOM监听器 - 确保布局始终正确 ======
let nzLayoutObserver = null;

function initLayoutObserver() {
  // 如果已经存在观察器，先断开
  if (nzLayoutObserver) {
    nzLayoutObserver.disconnect();
    nzLayoutObserver = null;
  }
  
  // 创建DOM变化观察器
  nzLayoutObserver = new MutationObserver((mutations) => {
    let needsLayoutFix = false;
    
    mutations.forEach((mutation) => {
      // 检查是否有新增的文件项
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('nz-file-item') || 
                node.querySelector('.nz-file-item')) {
              needsLayoutFix = true;
            }
          }
        });
      }
    });
    
    if (needsLayoutFix) {
      // 清除DOM缓存，因为有新增项
      fileItemsCache = null;
      console.log(`[${config.PLUGIN_NAME}] DOM变化检测到新文件项，延迟修复布局...`);
      // 延迟执行避免频繁触发
      setTimeout(() => {
        const fileItems = getCachedFileItems();
        fileItems.forEach((item) => {
          // 跳过有自定义图标的文件项，避免重复修改导致移动
          const hasCustomIcon = item.querySelector('.nz-file-item-thumbnail[data-nz-custom-icon="true"]');
          if (!hasCustomIcon) {
            ensureCorrectLayout(item);
            adjustTagsDisplay(item);
            // 确保边框显示（抑制日志避免重复输出）
            ensureFileItemBorder(item, true);
          }
        });
      }, 50);
    }
  });
  
  // 开始观察文件网格容器
  const fileGrid = document.querySelector('.nz-file-grid');
  if (fileGrid) {
    nzLayoutObserver.observe(fileGrid, {
      childList: true,
      subtree: true
    });
    console.log(`[${config.PLUGIN_NAME}] DOM布局观察器已启动`);
  }
}

// ====== 调试和刷新工具 ======
window.nzRefreshLayout = function() {
  console.log('=== 强制刷新所有文件项布局 ===');
  const fileItems = document.querySelectorAll('.nz-file-item');
  fileItems.forEach((item, index) => {
    ensureCorrectLayout(item);
    adjustTagsDisplay(item);
    console.log(`已修复文件项 ${index + 1} 的布局`);
  });
  console.log('布局修复完成！请检查效果。');
};

// 强制应用图标样式的调试函数
window.nzForceIconStyle = function() {
  console.log('=== 强制应用图标样式 ===');
  
  // 强制设置图标大小
  const icons = document.querySelectorAll('.nz-thumbnail-icon');
  icons.forEach((icon, index) => {
    icon.style.setProperty('font-size', '44px', 'important');
    console.log(`已强制设置图标 ${index + 1} 的大小为 44px`);
  });
  
  // 强制移除图标外框边框（跳过自定义图标）
  const thumbnails = document.querySelectorAll('.nz-file-item-thumbnail');
  thumbnails.forEach((thumbnail, index) => {
    // 跳过自定义图标，保留其边框
    if (thumbnail.getAttribute('data-nz-custom-icon') === 'true') {
      console.log(`跳过自定义图标 ${index + 1} 的边框移除`);
      return;
    }
    thumbnail.style.setProperty('border', 'none', 'important');
    thumbnail.style.setProperty('border-width', '0px', 'important');
    console.log(`已强制移除图标外框 ${index + 1} 的边框`);
  });
  
  console.log(`强制样式应用完成！处理了 ${icons.length} 个图标，${thumbnails.length} 个外框`);
};

// 图标大小调整工具 - 提供多种选择
window.nzAdjustIconSize = function(size = 'large') {
  console.log(`=== 调整图标大小: ${size} ===`);
  
  const sizeMap = {
    'small': { file: '32px', folder: '36px' },
    'medium': { file: '38px', folder: '42px' },
    'large': { file: '44px', folder: '48px' },
    'extra-large': { file: '50px', folder: '54px' }
  };
  
  const sizes = sizeMap[size] || sizeMap['large'];
  
  const icons = document.querySelectorAll('.nz-thumbnail-icon');
  icons.forEach((icon, index) => {
    const isFolder = icon.closest('.nz-folder-thumbnail');
    const iconSize = isFolder ? sizes.folder : sizes.file;
    
    icon.style.setProperty('font-size', iconSize, 'important');
    icon.style.setProperty('display', 'flex', 'important');
    icon.style.setProperty('align-items', 'center', 'important');
    icon.style.setProperty('justify-content', 'center', 'important');
    icon.style.setProperty('width', '100%', 'important');
    icon.style.setProperty('height', '100%', 'important');
    icon.style.setProperty('line-height', '1', 'important');
    
    console.log(`设置${isFolder ? '文件夹' : '文件'}图标 ${index + 1} 大小为 ${iconSize}`);
  });
  
  console.log(`图标大小调整完成！可用选项: 'small', 'medium', 'large', 'extra-large'`);
};

// 终极修复图标空隙问题
window.nzFixIconGapUltimate = function() {
  console.log('=== 终极修复图标空隙 ===');
  
  const icons = document.querySelectorAll('.nz-thumbnail-icon');
  const containers = document.querySelectorAll('.nz-file-item-thumbnail');
  const fileItems = document.querySelectorAll('.nz-file-item');
  
  // 强制设置文件项固定高度（解决Grid布局不一致问题）
  fileItems.forEach((item, index) => {
    item.style.setProperty('height', '74px', 'important');
    item.style.setProperty('min-height', '74px', 'important');
    item.style.setProperty('max-height', '74px', 'important');
    item.style.setProperty('box-sizing', 'border-box', 'important');
    console.log(`修复文件项 ${index + 1} 高度`);
  });
  
  // 强制设置容器样式
  containers.forEach((container, index) => {
    container.style.setProperty('height', '50px', 'important');
    container.style.setProperty('width', '50px', 'important');
    container.style.setProperty('flex-shrink', '0', 'important');
    container.style.setProperty('display', 'flex', 'important');
    container.style.setProperty('align-items', 'center', 'important');
    container.style.setProperty('justify-content', 'center', 'important');
    container.style.setProperty('align-self', 'center', 'important');
    container.style.setProperty('padding', '0', 'important');
    container.style.setProperty('margin', '0', 'important');
    container.style.setProperty('box-sizing', 'border-box', 'important');
    console.log(`修复容器 ${index + 1}`);
  });
  
  // 强制设置图标样式
  icons.forEach((icon, index) => {
    const isFolder = icon.closest('.nz-folder-thumbnail');
    const iconSize = isFolder ? '52px' : '50px';
    
    // 移除可能的默认样式
    icon.style.removeProperty('margin');
    icon.style.removeProperty('margin-top');
    icon.style.removeProperty('margin-bottom');
    icon.style.removeProperty('padding');
    icon.style.removeProperty('padding-top');
    icon.style.removeProperty('padding-bottom');
    
    // 强制应用新样式
    icon.style.setProperty('font-size', iconSize, 'important');
    icon.style.setProperty('display', 'flex', 'important');
    icon.style.setProperty('align-items', 'center', 'important');
    icon.style.setProperty('justify-content', 'center', 'important');
    icon.style.setProperty('width', '100%', 'important');
    icon.style.setProperty('height', '100%', 'important');
    icon.style.setProperty('line-height', '1', 'important');
    icon.style.setProperty('margin', '0', 'important');
    icon.style.setProperty('padding', '0', 'important');
    icon.style.setProperty('vertical-align', 'middle', 'important');
    
    console.log(`终极修复${isFolder ? '文件夹' : '文件'}图标 ${index + 1} (${iconSize})`);
  });
  
  console.log(`终极修复完成！处理了 ${fileItems.length} 个文件项，${containers.length} 个容器，${icons.length} 个图标`);
  return { fileItems: fileItems.length, containers: containers.length, icons: icons.length };
};

// 调试Grid布局和图标空隙的函数
window.nzDebugGridLayout = function() {
  console.log('=== 调试Grid布局和图标空隙 ===');
  
  const fileGrid = document.querySelector('.file-grid');
  const fileItems = document.querySelectorAll('.nz-file-item');
  
  if (!fileGrid) {
    console.log('❌ 未找到 .file-grid 容器');
    return;
  }
  
  // 获取Grid容器信息
  const gridStyles = window.getComputedStyle(fileGrid);
  console.log(`📏 Grid容器宽度: ${fileGrid.offsetWidth}px`);
  console.log(`📐 Grid模板列: ${gridStyles.gridTemplateColumns}`);
  console.log(`📦 Gap间距: ${gridStyles.gap}`);
  
  // 分析每行的项目数量和高度
  const itemsPerRow = {};
  const rowHeights = {};
  
  fileItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const row = Math.floor(rect.top / 100); // 粗略计算行数
    
    if (!itemsPerRow[row]) {
      itemsPerRow[row] = 0;
      rowHeights[row] = rect.height;
    }
    itemsPerRow[row]++;
    
    // 检查图标容器
    const thumbnail = item.querySelector('.nz-file-item-thumbnail');
    const icon = item.querySelector('.nz-thumbnail-icon');
    
    if (thumbnail && icon) {
      const thumbRect = thumbnail.getBoundingClientRect();
      const iconStyles = window.getComputedStyle(icon);
      
      console.log(`📁 项目 ${index + 1} (行${row}): 项目高度=${rect.height.toFixed(1)}px, 图标容器=${thumbRect.height.toFixed(1)}px, 图标大小=${iconStyles.fontSize}`);
    }
  });
  
  // 报告每行统计
  Object.keys(itemsPerRow).forEach(row => {
    console.log(`📊 第${parseInt(row) + 1}行: ${itemsPerRow[row]}个项目, 高度=${rowHeights[row].toFixed(1)}px`);
  });
  
  // 检查是否存在高度不一致
  const heights = Object.values(rowHeights);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  
  if (maxHeight - minHeight > 5) {
    console.log(`⚠️ 检测到高度不一致！最小: ${minHeight.toFixed(1)}px, 最大: ${maxHeight.toFixed(1)}px, 差异: ${(maxHeight - minHeight).toFixed(1)}px`);
    console.log(`💡 建议运行 nzFixIconGapUltimate() 来修复`);
  } else {
    console.log(`✅ 行高度基本一致，差异在可接受范围内`);
  }
  
  return {
    gridWidth: fileGrid.offsetWidth,
    totalItems: fileItems.length,
    itemsPerRow,
    rowHeights,
    heightDifference: maxHeight - minHeight
  };
};

// 修复图标显示的平衡版本 - 避免变形
window.nzFillIconContainer = function() {
  console.log('=== 修复图标显示 - 平衡版本 ===');
  
  const containers = document.querySelectorAll('.nz-file-item-thumbnail');
  const icons = document.querySelectorAll('.nz-thumbnail-icon');
  
  // 设置容器居中布局
  containers.forEach((container, index) => {
    container.style.setProperty('display', 'flex', 'important');
    container.style.setProperty('align-items', 'center', 'important');
    container.style.setProperty('justify-content', 'center', 'important');
    container.style.setProperty('padding', '0', 'important');
    container.style.setProperty('margin', '0', 'important');
    container.style.setProperty('box-sizing', 'border-box', 'important');
    
    // 固定容器尺寸
    container.style.setProperty('width', '50px', 'important');
    container.style.setProperty('height', '50px', 'important');
    container.style.setProperty('min-height', '50px', 'important');
    container.style.setProperty('max-height', '50px', 'important');
    
    console.log(`设置容器 ${index + 1} 居中布局`);
  });
  
  // 设置图标合理大小，避免变形
  icons.forEach((icon, index) => {
    const isFolder = icon.closest('.nz-folder-thumbnail');
    const iconSize = isFolder ? '36px' : '32px'; // 保持比例，避免拉伸
    
    // 清除可能导致变形的样式
    icon.style.removeProperty('width');
    icon.style.removeProperty('height');
    icon.style.removeProperty('min-width');
    icon.style.removeProperty('min-height');
    icon.style.removeProperty('max-width');
    icon.style.removeProperty('max-height');
    icon.style.removeProperty('flex');
    icon.style.removeProperty('margin');
    icon.style.removeProperty('padding');
    icon.style.removeProperty('transform');
    
    // 设置合理的图标样式
    icon.style.setProperty('font-size', iconSize, 'important');
    icon.style.setProperty('line-height', iconSize, 'important');
    icon.style.setProperty('display', 'inline-flex', 'important');
    icon.style.setProperty('align-items', 'center', 'important');
    icon.style.setProperty('justify-content', 'center', 'important');
    icon.style.setProperty('text-align', 'center', 'important');
    icon.style.setProperty('margin', '0', 'important');
    icon.style.setProperty('padding', '0', 'important');
    icon.style.setProperty('box-sizing', 'border-box', 'important');
    icon.style.setProperty('position', 'relative', 'important');
    icon.style.setProperty('top', '0', 'important');
    icon.style.setProperty('left', '0', 'important');
    icon.style.setProperty('transform', 'none', 'important');
    
    console.log(`设置${isFolder ? '文件夹' : '文件'}图标 ${index + 1} 尺寸 (${iconSize})`);
  });
  
  console.log(`图标修复完成！处理了 ${containers.length} 个容器，${icons.length} 个图标`);
  return { containers: containers.length, icons: icons.length };
};

// 强制修复左侧留白问题
window.nzForceLeftPadding = function() {
  console.log('=== 强制修复文件项左侧留白 ===');
  
  // 创建最高优先级的样式
  const paddingFixStyle = document.createElement('style');
  paddingFixStyle.id = 'nz-force-left-padding';
  
  // 移除现有的修复样式
  const existing = document.getElementById('nz-force-left-padding');
  if (existing) existing.remove();
  
  paddingFixStyle.textContent = `
    /* 强制左侧留白 - 绝对最高优先级 */
    html body .nz-file-item,
    html body .nz-manager .nz-file-item,
    html body div.nz-file-item,
    html body .nz-file-grid .nz-file-item,
    html body .nz-file-grid div.nz-file-item,
    body.app .nz-file-item,
    body.app .nz-manager .nz-file-item,
    body.app div.nz-file-item,
    .nz-file-item,
    div.nz-file-item {
      padding-left: 3px !important;
      box-sizing: border-box !important;
    }
    
    /* 确保缩略图不覆盖左侧空间 */
    .nz-file-item .nz-file-item-thumbnail {
      margin-left: 0 !important;
      position: relative !important;
    }
    
    /* 调试辅助 - 可视化左侧空间 */
    .nz-file-item.debug-padding {
      border-left: 2px solid red !important;
    }
  `;
  
  document.head.appendChild(paddingFixStyle);
  
  // 强制重新渲染所有文件项
  const fileItems = document.querySelectorAll('.nz-file-item');
  console.log(`找到 ${fileItems.length} 个文件项，开始修复...`);
  
  fileItems.forEach((item, index) => {
    // 强制移除任何可能冲突的内联样式
    item.style.paddingLeft = '';
    item.style.setProperty('padding-left', '3px', 'important');
    
    // 强制重排
    item.offsetHeight;
    
    console.log(`文件项 ${index + 1}: 左侧padding = ${getComputedStyle(item).paddingLeft}`);
  });
  
  console.log('✅ 左侧留白修复完成！');
  return { processedItems: fileItems.length };
};

// 调试函数：检查当前padding状态
window.nzCheckPadding = function() {
  console.log('=== 检查文件项padding状态 ===');
  
  const fileItems = document.querySelectorAll('.nz-file-item');
  console.log(`总计 ${fileItems.length} 个文件项`);
  
  fileItems.forEach((item, index) => {
    const styles = getComputedStyle(item);
    console.log(`文件项 ${index + 1}:`);
    console.log(`  - padding-left: ${styles.paddingLeft}`);
    console.log(`  - padding-right: ${styles.paddingRight}`);
    console.log(`  - padding-top: ${styles.paddingTop}`);
    console.log(`  - padding-bottom: ${styles.paddingBottom}`);
    console.log(`  - margin-left: ${styles.marginLeft}`);
  });
};

// 临时调试：添加可视化边框
window.nzDebugPadding = function() {
  console.log('=== 调试模式：显示padding边框 ===');
  
  const fileItems = document.querySelectorAll('.nz-file-item');
  fileItems.forEach((item, index) => {
    item.classList.add('debug-padding');
  });
  
  console.log(`已为 ${fileItems.length} 个文件项添加调试边框`);
};

// 清除调试边框
window.nzClearDebug = function() {
  const fileItems = document.querySelectorAll('.nz-file-item');
  fileItems.forEach(item => {
    item.classList.remove('debug-padding');
  });
  console.log('已清除调试边框');
};

// 一键修复左侧留白 - 用户友好版本
window.nzFixPadding = function() {
  console.log('🔧 一键修复文件项左侧留白问题');
  
  // 1. 检查当前状态
  console.log('📊 步骤1: 检查当前状态');
  nzCheckPadding();
  
  // 2. 应用修复
  console.log('🔧 步骤2: 应用强制修复');
  const result = nzForceLeftPadding();
  
  // 3. 验证修复效果
  console.log('✅ 步骤3: 验证修复效果');
  setTimeout(() => {
    const fileItems = document.querySelectorAll('.nz-file-item');
    let fixedCount = 0;
    
    fileItems.forEach((item, index) => {
      const paddingLeft = getComputedStyle(item).paddingLeft;
      if (paddingLeft !== '0px') {
        fixedCount++;
      }
    });
    
    console.log('');
    console.log('📈 修复结果统计:');
    console.log(`  • 总文件项: ${fileItems.length}`);
    console.log(`  • 已修复: ${fixedCount}`);
    console.log(`  • 修复率: ${Math.round(fixedCount / fileItems.length * 100)}%`);
    
    if (fixedCount === fileItems.length) {
      console.log('🎉 恭喜！所有文件项左侧留白已修复！');
    } else {
      console.log('⚠️ 部分文件项可能需要手动调试');
      console.log('💡 建议：刷新页面后重新运行 nzFixPadding()');
    }
    
    return {
      total: fileItems.length,
      fixed: fixedCount,
      rate: Math.round(fixedCount / fileItems.length * 100)
    };
  }, 100);
  
  return result;
};

// 帮助命令
window.nzPaddingHelp = function() {
  console.log('📚 NZ工作流助手 - 左侧留白修复工具');
  console.log('');
  console.log('🔧 可用命令:');
  console.log('  • nzFixPadding()     - 一键修复左侧留白');
  console.log('  • nzCheckPadding()   - 检查当前padding状态');
  console.log('  • nzDebugPadding()   - 显示调试边框');
  console.log('  • nzClearDebug()     - 清除调试边框');
  console.log('  • nzForceLeftPadding() - 强制应用修复');
  console.log('');
  console.log('💡 推荐流程:');
  console.log('  1. 运行 nzFixPadding() 进行一键修复');
  console.log('  2. 如果还有问题，运行 nzDebugPadding() 查看边框');
  console.log('  3. 最后运行 nzClearDebug() 清除调试边框');
  console.log('');
  console.log('🚨 注意: 如果修复无效，请刷新页面后重试');
};

// 精确填充图标修复 - 消除0.3px微小空隙
window.nzPreciseIconFill = function() {
  console.log('=== 精确填充图标 - 消除微小空隙 ===');
  
  const containers = document.querySelectorAll('.nz-file-item-thumbnail');
  let fixes = 0;
  
  containers.forEach((container, index) => {
    const icon = container.querySelector('.nz-thumbnail-icon');
    if (!icon) return;
    
    // 获取容器的精确尺寸
    const containerRect = container.getBoundingClientRect();
    const containerSize = Math.min(containerRect.width, containerRect.height);
    
    console.log(`容器 ${index + 1}: ${containerSize}px`);
    
    // 计算完美填充的字体大小
    // 对于字体图标，通常需要略大于容器尺寸来完全填充
    const perfectSize = Math.ceil(containerSize * 1.02); // 增加2%确保完全填充
    
    // 应用精确尺寸
    icon.style.setProperty('font-size', `${perfectSize}px`, 'important');
    icon.style.setProperty('line-height', '1', 'important');
    icon.style.setProperty('width', `${containerSize}px`, 'important');
    icon.style.setProperty('height', `${containerSize}px`, 'important');
    icon.style.setProperty('display', 'flex', 'important');
    icon.style.setProperty('align-items', 'center', 'important');
    icon.style.setProperty('justify-content', 'center', 'important');
    icon.style.setProperty('overflow', 'hidden', 'important');
    
    fixes++;
    console.log(`  设置图标尺寸: ${perfectSize}px (容器: ${containerSize}px)`);
  });
  
  console.log(`精确填充完成！修复了 ${fixes} 个图标`);
  return { fixes };
};

// CSS修复版本 - 通过样式表修复图标变形
window.nzCSSFixIconDeformation = function() {
  console.log('=== CSS修复图标变形 ===');
  
  // 强制重新应用CSS样式
  const style = document.createElement('style');
  style.id = 'nz-icon-deformation-fix';
  
  // 移除现有的修复样式
  const existingFix = document.getElementById('nz-icon-deformation-fix');
  if (existingFix) {
    existingFix.remove();
  }
  
  style.textContent = `
    /* 紧急修复：强制覆盖JS设置的变形样式 */
    .nz-thumbnail-icon {
      width: auto !important;
      height: auto !important;
      min-width: unset !important;
      min-height: unset !important;
      max-width: unset !important;
      max-height: unset !important;
      flex: none !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      aspect-ratio: 1 / 1 !important;
      font-size: 36px !important;
      line-height: 1 !important;
    }
    
    /* 文件夹图标稍大一些 */
    .nz-folder-thumbnail .nz-thumbnail-icon {
      font-size: 40px !important;
    }
  `;
  
  document.head.appendChild(style);
  
  const icons = document.querySelectorAll('.nz-thumbnail-icon');
  console.log(`CSS修复已应用，影响 ${icons.length} 个图标`);
  
  // 强制重新渲染
  icons.forEach((icon, index) => {
    icon.style.display = 'none';
    icon.offsetHeight; // 强制重排
    icon.style.removeProperty('display');
  });
  
  console.log('CSS修复完成！');
  return { icons: icons.length };
};

// 重置图标样式 - 清除之前的变形样式
window.nzResetIconStyles = function() {
  console.log('=== 重置图标样式 - 清除变形 ===');
  
  const containers = document.querySelectorAll('.nz-file-item-thumbnail');
  const icons = document.querySelectorAll('.nz-thumbnail-icon');
  
  // 重置容器
  containers.forEach((container, index) => {
    // 移除可能导致问题的样式
    container.style.removeProperty('align-items');
    container.style.removeProperty('justify-content');
    
    // 重新设置正确的布局
    container.style.setProperty('display', 'flex', 'important');
    container.style.setProperty('align-items', 'center', 'important');
    container.style.setProperty('justify-content', 'center', 'important');
    
    console.log(`重置容器 ${index + 1}`);
  });
  
  // 重置图标
  icons.forEach((icon, index) => {
    // 完全清除所有可能导致变形的样式
    const problematicProps = [
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
      'align-self', 'justify-self'
    ];
    
    problematicProps.forEach(prop => {
      icon.style.removeProperty(prop);
    });
    
    console.log(`重置图标 ${index + 1} 样式`);
  });
  
  console.log(`样式重置完成！处理了 ${containers.length} 个容器，${icons.length} 个图标`);
  return { containers: containers.length, icons: icons.length };
};

// 诊断图标空隙问题的函数
window.nzDiagnoseIconGaps = function() {
  console.log('=== 诊断图标空隙问题 ===');
  
  const containers = document.querySelectorAll('.nz-file-item-thumbnail');
  const icons = document.querySelectorAll('.nz-thumbnail-icon');
  
  containers.forEach((container, index) => {
    const icon = container.querySelector('.nz-thumbnail-icon');
    if (!icon) return;
    
    const containerRect = container.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const containerStyle = getComputedStyle(container);
    const iconStyle = getComputedStyle(icon);
    
    const topGap = iconRect.top - containerRect.top;
    const bottomGap = containerRect.bottom - iconRect.bottom;
    const leftGap = iconRect.left - containerRect.left;
    const rightGap = containerRect.right - iconRect.right;
    
    console.log(`📦 容器 ${index + 1}:`);
    console.log(`   容器尺寸: ${containerRect.width.toFixed(1)}x${containerRect.height.toFixed(1)}`);
    console.log(`   图标尺寸: ${iconRect.width.toFixed(1)}x${iconRect.height.toFixed(1)}`);
    console.log(`   空隙分析: 上=${topGap.toFixed(1)}px, 下=${bottomGap.toFixed(1)}px, 左=${leftGap.toFixed(1)}px, 右=${rightGap.toFixed(1)}px`);
    console.log(`   容器样式: padding=${containerStyle.padding}, margin=${containerStyle.margin}`);
    console.log(`   图标样式: margin=${iconStyle.margin}, transform=${iconStyle.transform}`);
    console.log(`   图标字体: ${iconStyle.fontSize}, line-height=${iconStyle.lineHeight}`);
    
    if (topGap > 2 || bottomGap > 2) {
      console.log(`   ⚠️  检测到明显的上下空隙！`);
    }
  });
  
  return { containers: containers.length, icons: icons.length };
};

// 调试文件项显示的函数
window.nzDebugFileItems = function() {
  console.log('=== 调试文件项显示 ===');
  
  const fileItems = document.querySelectorAll('.nz-file-item');
  console.log(`找到 ${fileItems.length} 个文件项`);
  
  fileItems.forEach((item, index) => {
    const nameEl = item.querySelector('.nz-file-item-name');
    const tagsEl = item.querySelector('.nz-file-tags-inline');
    const dateEl = item.querySelector('.nz-file-item-date');
    const iconEl = item.querySelector('.nz-thumbnail-icon');
    
    console.log(`文件项 ${index + 1}:`);
    console.log(`  文件名: ${nameEl ? nameEl.textContent : '未找到'} (显示: ${nameEl ? getComputedStyle(nameEl).display : 'N/A'})`);
    console.log(`  标签: ${tagsEl ? tagsEl.textContent : '未找到'}`);
    console.log(`  日期: ${dateEl ? dateEl.textContent : '未找到'}`);
    console.log(`  图标: ${iconEl ? iconEl.textContent : '未找到'}`);
    
    // 检查文件名的可见性
    if (nameEl) {
      const style = getComputedStyle(nameEl);
      console.log(`  文件名样式: display=${style.display}, visibility=${style.visibility}, opacity=${style.opacity}, height=${style.height}`);
    }
  });
};

// 强制修复文件名显示的函数
window.nzFixFileNameDisplay = function() {
  console.log('=== 强制修复文件名显示 ===');
  
  const fileItems = document.querySelectorAll('.nz-file-item');
  console.log(`找到 ${fileItems.length} 个文件项`);
  
  fileItems.forEach((item, index) => {
    const nameEl = item.querySelector('.nz-file-item-name');
    
    if (nameEl) {
      // 强制设置文件名显示样式
      nameEl.style.setProperty('display', 'block', 'important');
      nameEl.style.setProperty('visibility', 'visible', 'important');
      nameEl.style.setProperty('opacity', '1', 'important');
      nameEl.style.setProperty('height', 'auto', 'important');
      nameEl.style.setProperty('max-height', 'none', 'important');
      nameEl.style.setProperty('overflow', 'visible', 'important');
      nameEl.style.setProperty('color', '#ccc', 'important');
      nameEl.style.setProperty('font-size', '13px', 'important');
      nameEl.style.setProperty('line-height', '1.2', 'important');
      nameEl.style.setProperty('margin', '0', 'important');
      nameEl.style.setProperty('padding', '0', 'important');
      nameEl.style.setProperty('text-indent', '0', 'important');
      nameEl.style.setProperty('position', 'static', 'important');
      nameEl.style.setProperty('z-index', 'auto', 'important');
      
      console.log(`文件项 ${index + 1}: 文件名="${nameEl.textContent || nameEl.innerText}" 强制修复样式完成`);
    } else {
      console.log(`文件项 ${index + 1}: 未找到文件名元素`);
      
      // 尝试重新创建文件名元素
      const contentEl = item.querySelector('.nz-file-item-content');
      if (contentEl) {
        const fileName = item.getAttribute('data-filename') || '未知文件名';
        const nameElNew = document.createElement('div');
        nameElNew.className = 'nz-file-item-name';
        nameElNew.textContent = fileName;
        nameElNew.title = fileName;
        
        // 插入到内容容器的第一位
        contentEl.insertBefore(nameElNew, contentEl.firstChild);
        console.log(`文件项 ${index + 1}: 重新创建了文件名元素`);
      }
    }
  });
  
  console.log('文件名显示修复完成！');
};

// 调试备注预览的函数
window.nzDebugNotes = function() {
  console.log('=== 调试备注预览 ===');
  
  const fileItems = document.querySelectorAll('.nz-file-item:not(.folder)');
  console.log(`找到 ${fileItems.length} 个文件项`);
  
  fileItems.forEach((item, index) => {
    const nameEl = item.querySelector('.nz-file-item-name');
    const noteEl = item.querySelector('.nz-file-note-title');
    const fileName = nameEl ? nameEl.textContent : '未知';
    const filePath = item.getAttribute('data-filepath') || fileName;
    
    // 检查备注数据
    const note = workflowNotesManager.getNote(filePath);
    
    console.log(`文件 ${index + 1}: ${fileName}`);
    console.log(`  路径: ${filePath}`);
    console.log(`  备注数据:`, note);
    console.log(`  备注描述: ${note?.description || '无'}`);
    console.log(`  备注预览元素: ${noteEl ? noteEl.textContent : '未找到'}`);
    console.log(`  应该显示的预览: ${note?.description ? note.description.substring(0, 30) + (note.description.length > 30 ? '...' : '') : '无备注'}`);
    console.log('---');
  });
};

// 检查备注预览CSS样式的函数
window.nzDebugNoteStyles = function() {
  console.log('=== 调试备注预览CSS样式 ===');
  
  const fileItems = document.querySelectorAll('.nz-file-item:not(.folder)');
  fileItems.forEach((item, index) => {
    const nameEl = item.querySelector('.nz-file-item-name');
    const noteEl = item.querySelector('.nz-file-note-title');
    const fileName = nameEl ? nameEl.textContent : '未知';
    
    if (noteEl) {
      console.log(`文件 ${index + 1}: ${fileName}`);
      console.log(`  备注元素存在: 是`);
      console.log(`  备注文本: "${noteEl.textContent}"`);
      
      // 检查计算样式
      const style = window.getComputedStyle(noteEl);
      console.log(`  display: ${style.display}`);
      console.log(`  visibility: ${style.visibility}`);
      console.log(`  opacity: ${style.opacity}`);
      console.log(`  color: ${style.color}`);
      console.log(`  font-size: ${style.fontSize}`);
      console.log(`  height: ${style.height}`);
      console.log(`  width: ${style.width}`);
      console.log(`  margin: ${style.margin}`);
      console.log(`  padding: ${style.padding}`);
      console.log(`  position: ${style.position}`);
      console.log(`  z-index: ${style.zIndex}`);
      
      // 检查父容器
      const parent = noteEl.parentElement;
      if (parent) {
        const parentStyle = window.getComputedStyle(parent);
        console.log(`  父容器 overflow: ${parentStyle.overflow}`);
        console.log(`  父容器 height: ${parentStyle.height}`);
      }
      
      // 检查元素位置
      const rect = noteEl.getBoundingClientRect();
      console.log(`  元素位置: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`);
      console.log(`  元素在视口内: ${rect.width > 0 && rect.height > 0}`);
      console.log('---');
    } else {
      console.log(`文件 ${index + 1}: ${fileName} - 无备注预览元素`);
    }
  });
};

// 快速测试备注预览显示
window.nzTestNotePreview = function() {
  console.log('=== 快速测试备注预览显示 ===');
  
  const fileItems = document.querySelectorAll('.nz-file-item:not(.folder)');
  let hasNotePreview = false;
  let totalFiles = fileItems.length;
  let filesWithNotes = 0;
  let filesWithPreview = 0;
  
  fileItems.forEach((item, index) => {
    const nameEl = item.querySelector('.nz-file-item-name');
    const noteEl = item.querySelector('.nz-file-note-title');
    const fileName = nameEl ? nameEl.textContent : '未知';
    const filePath = item.getAttribute('data-filepath') || fileName;
    
    // 检查是否有备注数据
    const note = workflowNotesManager.getNote(filePath);
    if (note && note.description) {
      filesWithNotes++;
      console.log(`✓ 文件 "${fileName}" 有备注: "${note.description}"`);
      
      if (noteEl) {
        filesWithPreview++;
        hasNotePreview = true;
        console.log(`  ✓ 备注预览元素存在，内容: "${noteEl.textContent}"`);
        
        // 高亮显示这个元素
        noteEl.style.border = '2px solid #ff6b6b';
        noteEl.style.background = 'rgba(255, 107, 107, 0.2)';
        setTimeout(() => {
          noteEl.style.border = '';
          noteEl.style.background = 'rgba(255, 255, 255, 0.05)';
        }, 3000);
      } else {
        console.log(`  ✗ 备注预览元素不存在`);
      }
    }
  });
  
  console.log(`\n=== 统计结果 ===`);
  console.log(`总文件数: ${totalFiles}`);
  console.log(`有备注的文件数: ${filesWithNotes}`);
  console.log(`有预览元素的文件数: ${filesWithPreview}`);
  console.log(`备注预览功能状态: ${hasNotePreview ? '✓ 正常' : '✗ 异常'}`);
  
  if (filesWithNotes > 0 && filesWithPreview === 0) {
    console.log('\n⚠️ 发现问题：有备注但没有预览元素，可能需要刷新文件列表');
  }
  
  return {
    totalFiles,
    filesWithNotes,
    filesWithPreview,
    working: hasNotePreview
  };
};

// 测试文件卡片布局和高度
window.nzTestCardLayout = function() {
  console.log('=== 测试文件卡片布局和高度 ===');
  
  const fileItems = document.querySelectorAll('.nz-file-item:not(.folder)');
  fileItems.forEach((item, index) => {
    const nameEl = item.querySelector('.nz-file-item-name');
    const noteEl = item.querySelector('.nz-file-note-title');
    const tagsEl = item.querySelector('.nz-file-tags-inline');
    const dateEl = item.querySelector('.nz-file-item-date');
    const contentEl = item.querySelector('.nz-file-item-content');
    
    const fileName = nameEl ? nameEl.textContent : '未知';
    
    console.log(`\n文件 ${index + 1}: ${fileName}`);
    
    // 检查整体卡片尺寸
    const itemRect = item.getBoundingClientRect();
    console.log(`  卡片尺寸: ${itemRect.width.toFixed(1)} x ${itemRect.height.toFixed(1)}`);
    
    // 检查内容区域
    if (contentEl) {
      const contentRect = contentEl.getBoundingClientRect();
      console.log(`  内容区域: ${contentRect.width.toFixed(1)} x ${contentRect.height.toFixed(1)}`);
    }
    
    // 检查各个元素的位置和可见性
    if (nameEl) {
      const nameRect = nameEl.getBoundingClientRect();
      console.log(`  ✓ 文件名: "${nameEl.textContent}" (${nameRect.height.toFixed(1)}px高)`);
    }
    
    if (noteEl) {
      const noteRect = noteEl.getBoundingClientRect();
      console.log(`  ✓ 备注预览: "${noteEl.textContent}" (${noteRect.height.toFixed(1)}px高)`);
    } else {
      console.log(`  - 无备注预览`);
    }
    
    if (tagsEl && tagsEl.children.length > 0) {
      const tagsRect = tagsEl.getBoundingClientRect();
      console.log(`  ✓ 标签区域: ${tagsEl.children.length}个标签 (${tagsRect.height.toFixed(1)}px高)`);
    } else {
      console.log(`  - 无标签`);
    }
    
    if (dateEl) {
      const dateRect = dateEl.getBoundingClientRect();
      console.log(`  ✓ 日期: "${dateEl.textContent}" (${dateRect.height.toFixed(1)}px高)`);
    }
    
    // 检查是否有内容被截断
    const hasOverflow = itemRect.height < 90 && (noteEl || (tagsEl && tagsEl.children.length > 0));
    if (hasOverflow) {
      console.log(`  ⚠️ 可能存在内容截断问题`);
    }
  });
  
  console.log('\n=== 布局测试完成 ===');
};

// 更详细的备注路径调试函数
window.nzDebugNotePaths = function() {
  console.log('=== 调试备注路径匹配 ===');
  
  // 显示所有存储的备注
  console.log('所有存储的备注键:');
  const notes = config.getWorkflowNotes();
  Object.keys(notes).forEach(key => {
    console.log(`  "${key}": ${notes[key]?.description || '无描述'}`);
  });
  
  console.log('\n当前目录文件项路径:');
  const fileItems = document.querySelectorAll('.nz-file-item:not(.folder)');
  fileItems.forEach((item, index) => {
    const nameEl = item.querySelector('.nz-file-item-name');
    const fileName = nameEl ? nameEl.textContent : '未知';
    const filePath = item.getAttribute('data-filepath') || fileName;
    
    console.log(`文件 ${index + 1}: ${fileName}`);
    console.log(`  构建的路径: "${filePath}"`);
    console.log(`  备注查找结果:`, workflowNotesManager.getNote(filePath));
    
    // 尝试不同的路径格式
    const pathVariants = [
      filePath,
      fileName,
      filePath.replace(/\\\\/g, '\\'),
      filePath.replace(/\\/g, '/'),
    ];
    
    pathVariants.forEach(variant => {
      const notes = config.getWorkflowNotes();
      const result = notes[variant];
      if (result) {
        console.log(`    路径变体 "${variant}" 找到备注:`, result);
      }
    });
    console.log('---');
  });
};

// ====== 自定义图标管理器 (新增功能) ======
// ✅ Stage8: CustomIconManager已迁移到 modules/features/custom-icon-manager.js
// TODO: Stage8_CLEANUP - 以下CustomIconManager类定义已迁移，待清理
/*
class CustomIconManager {
  static ICON_TYPES = {
    UPLOADED: 'uploaded',        // 用户上传的图片
    WORKFLOW_IMAGE: 'workflow',  // 工作流内的图片
    GENERATED: 'generated',      // 自动生成的预览图
    DEFAULT: 'default'           // 默认图标
  };
  
  static STORAGE_KEY = 'nz_custom_icons';
  static MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB localStorage 限制
  
  // 获取所有自定义图标数据
  static getAllCustomIcons() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 读取自定义图标数据失败:`, error);
      return {};
    }
  }
  
  // 保存所有自定义图标数据
  static saveAllCustomIcons(data) {
    try {
      const jsonData = JSON.stringify(data);
      if (jsonData.length > this.MAX_STORAGE_SIZE) {
        throw new Error('存储空间不足，请删除一些自定义图标');
      }
      localStorage.setItem(this.STORAGE_KEY, jsonData);
      return true;
    } catch (error) {
      console.error(`[${config.PLUGIN_NAME}] 保存自定义图标数据失败:`, error);
      window.nzWorkflowManager.showNotification(`保存图标失败: ${error.message}`, 'error');
      return false;
    }
  }
  
  // 设置自定义图标
  static setCustomIcon(filePath, iconData, iconType = this.ICON_TYPES.UPLOADED, metadata = {}) {
    console.log(`[${config.PLUGIN_NAME}] 设置自定义图标: ${filePath}`);
    
    const icons = this.getAllCustomIcons();
    icons[filePath] = {
      iconData: iconData,
      iconType: iconType,
      createdAt: new Date().toISOString(),
      ...metadata
    };
    
    return this.saveAllCustomIcons(icons);
  }
  
  // 获取自定义图标
  static getCustomIcon(filePath) {
    const icons = this.getAllCustomIcons();
    return icons[filePath] || null;
  }
  
  // 移除自定义图标
  static removeCustomIcon(filePath) {
    console.log(`[${config.PLUGIN_NAME}] 移除自定义图标: ${filePath}`);
    
    const icons = this.getAllCustomIcons();
    if (icons[filePath]) {
      delete icons[filePath];
      this.saveAllCustomIcons(icons);
      return true;
    }
    return false;
  }
  
  // 压缩图片数据
  static compressImage(file, maxWidth = 100, maxHeight = 100, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 计算缩放比例
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 转换为 base64
        const compressedData = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedData);
      };
      
      img.onerror = reject;
      
      // 读取文件
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  // 生成图标数据URL
  static generateIconDataURL(iconChar, size = 100) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 透明背景 - 不设置背景色
    // ctx.fillStyle = '#333333';
    // ctx.fillRect(0, 0, size, size);
    
    // 绘制图标 - 使用emoji的原始颜色，不覆盖为白色
    ctx.font = `${size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconChar, size / 2, size / 2);
    
    return canvas.toDataURL('image/png');
  }
  
  // 应用自定义图标到文件项
  static applyCustomIconToFileItem(fileItem, filePath) {
    const customIcon = this.getCustomIcon(filePath);
    if (!customIcon) return false;
    
    const thumbnailContainer = fileItem.querySelector('.nz-file-item-thumbnail');
    if (!thumbnailContainer) return false;
    
    // 根据主题动态设置边框颜色
    const borderColor = currentTheme === 'light' ? 'rgba(200, 200, 200, 0.8)' : 'rgba(68, 68, 68, 0.6)';
    
    // 添加自定义标识以避免边框被后续代码移除
    thumbnailContainer.setAttribute('data-nz-custom-icon', 'true');
    
    // CSS已经处理了样式，这里只需要设置标识即可
    
    // 创建自定义图标元素
    thumbnailContainer.innerHTML = `
      <img src="${customIcon.iconData}" 
           class="nz-custom-icon" 
           style="
             position: absolute !important;
             top: 0 !important;
             left: 0 !important;
             right: 0 !important;
             bottom: 0 !important;
             width: 100% !important;
             height: 100% !important;
             object-fit: fill !important;
             object-position: center !important;
             border-radius: 6px !important;
             display: block !important;
             max-width: none !important;
             max-height: none !important;
           " 
           alt="自定义图标">
      <div class="nz-icon-badge" title="自定义图标" style="
        position: absolute !important; 
        bottom: 1px !important; 
        left: 1px !important; 
        width: 8px !important; 
        height: 8px !important; 
        background: #007acc !important; 
        border-radius: 50% !important; 
        border: 1px solid #fff !important;
        z-index: 10 !important;
        box-sizing: border-box !important;
      "></div>
    `;
    
    // 强制刷新样式 - 使用绝对定位确保完全填充
    const customImg = thumbnailContainer.querySelector('.nz-custom-icon');
    const customBadge = thumbnailContainer.querySelector('.nz-icon-badge');
    if (customImg) {
      customImg.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: fill !important; border-radius: 6px !important; display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; max-width: none !important; max-height: none !important; min-width: 100% !important; min-height: 100% !important; transform: none !important; margin: 0 !important; padding: 0 !important; border: none !important; box-sizing: border-box !important;';
      
      // 超级强制设置 - 完全填充容器边缘对齐
      const forceStyles = {
        'position': 'absolute',
        'top': '0',
        'left': '0', 
        'right': '0',
        'bottom': '0',
        'width': '100%',
        'height': '100%',
        'min-width': '100%',
        'min-height': '100%',
        'max-width': 'none',
        'max-height': 'none',
        'object-fit': 'fill',
        'object-position': 'center',
        'display': 'block',
        'transform': 'none',
        'transform-origin': 'center',
        'transform-style': 'flat',
        'margin': '0',
        'padding': '0',
        'border': 'none',
        'outline': 'none',
        'border-radius': '6px',
        'box-sizing': 'border-box',
        'vertical-align': 'top',
        'float': 'none'
      };
      
      Object.entries(forceStyles).forEach(([prop, value]) => {
        customImg.style.setProperty(prop, value, 'important');
      });
      
      // 自定义图标容器样式 - 无边框，匹配卡片高度
      const containerForceStyles = {
        'width': '70px',
        'height': '70px',
        'min-width': '70px',
        'max-width': '70px', 
        'min-height': '70px',
        'max-height': '70px',
        'padding': '0',
        'margin': '0',
        'border': 'none',
        'border-radius': '6px',
        'box-sizing': 'border-box',
        'overflow': 'hidden'
      };
      
      Object.entries(containerForceStyles).forEach(([prop, value]) => {
        thumbnailContainer.style.setProperty(prop, value, 'important');
      });
      
      // 调试输出 - 检查实际尺寸
      console.log('NZ调试 - 容器实际尺寸:', {
        container: thumbnailContainer.getBoundingClientRect(),
        img: customImg.getBoundingClientRect(),
        containerStyle: window.getComputedStyle(thumbnailContainer),
        imgStyle: window.getComputedStyle(customImg)
      });
      
      // 超强制方法 - 直接设置像素值
      customImg.setAttribute('width', '70');
      customImg.setAttribute('height', '70');
      
      // 强制重新计算布局
      customImg.offsetHeight;
      thumbnailContainer.offsetHeight;
      
      // 专门的边缘贴合处理函数
      const forceEdgeAlignment = () => {
        // 获取容器实际尺寸
        const containerRect = thumbnailContainer.getBoundingClientRect();
        const imgRect = customImg.getBoundingClientRect();
        
        // 检查父元素和周围环境
        const parentElement = thumbnailContainer.parentElement;
        const grandParentElement = parentElement ? parentElement.parentElement : null;
        
        console.log('NZ边缘贴合调试:', {
          containerSize: `${containerRect.width}x${containerRect.height}`,
          imgSize: `${imgRect.width}x${imgRect.height}`,
          gap: {
            horizontal: containerRect.width - imgRect.width,
            vertical: containerRect.height - imgRect.height
          },
          containerStyles: {
            width: getComputedStyle(thumbnailContainer).width,
            height: getComputedStyle(thumbnailContainer).height,
            padding: getComputedStyle(thumbnailContainer).padding,
            margin: getComputedStyle(thumbnailContainer).margin,
            border: getComputedStyle(thumbnailContainer).border,
            boxSizing: getComputedStyle(thumbnailContainer).boxSizing
          },
          parentInfo: parentElement ? {
            className: parentElement.className,
            width: getComputedStyle(parentElement).width,
            height: getComputedStyle(parentElement).height,
            padding: getComputedStyle(parentElement).padding,
            margin: getComputedStyle(parentElement).margin,
            border: getComputedStyle(parentElement).border
          } : null,
          grandParentInfo: grandParentElement ? {
            className: grandParentElement.className,
            width: getComputedStyle(grandParentElement).width,
            height: getComputedStyle(grandParentElement).height,
            padding: getComputedStyle(grandParentElement).padding,
            margin: getComputedStyle(grandParentElement).margin
          } : null,
          imgStyles: {
            width: customImg.style.width,
            height: customImg.style.height,
            objectFit: customImg.style.objectFit,
            transform: customImg.style.transform
          }
        });
        
        // 智能缩放计算 - 只在需要时放大
        const scaleX = containerRect.width > 0 ? containerRect.width / Math.max(imgRect.width, 1) : 1;
        const scaleY = containerRect.height > 0 ? containerRect.height / Math.max(imgRect.height, 1) : 1;
        
        // 检查是否已经完美贴合
        const horizontalGap = Math.abs(containerRect.width - imgRect.width);
        const verticalGap = Math.abs(containerRect.height - imgRect.height);
        const isPerfectFit = horizontalGap < 0.1 && verticalGap < 0.1;
        
        // 只在未完美贴合时才放大
        const scale = isPerfectFit ? 1 : Math.max(scaleX, scaleY, 1.02);
        
        // 应用智能填充策略 - 考虑边框和内边距
        customImg.style.setProperty('position', 'absolute', 'important');
        customImg.style.setProperty('top', '2px', 'important'); // 对应padding
        customImg.style.setProperty('left', '2px', 'important');
        customImg.style.setProperty('right', '2px', 'important'); 
        customImg.style.setProperty('bottom', '2px', 'important');
        customImg.style.setProperty('width', 'calc(100% - 4px)', 'important'); // 减去padding空间
        customImg.style.setProperty('height', 'calc(100% - 4px)', 'important');
        customImg.style.setProperty('object-fit', 'fill', 'important'); // 改为fill确保完全填充
        customImg.style.setProperty('object-position', 'center', 'important'); // 确保居中
        customImg.style.setProperty('border-radius', '4px', 'important'); // 稍小的圆角匹配内边距
        customImg.style.setProperty('transform', isPerfectFit ? 'none' : `scale(${scale})`, 'important');
        
        console.log('NZ智能缩放应用:', {
          scale: scale,
          scaleX: scaleX,
          scaleY: scaleY,
          isPerfectFit: isPerfectFit,
          horizontalGap: horizontalGap,
          verticalGap: verticalGap,
          strategy: isPerfectFit ? 'perfect-fit-no-scale' : 'scale-to-fill'
        });
        
        // 根据主题动态设置边框颜色
        const borderColor = currentTheme === 'light' ? 'rgba(200, 200, 200, 0.8)' : 'rgba(68, 68, 68, 0.6)';
        
        // 添加自定义标识以避免边框被后续代码移除（CSS已处理样式）
        thumbnailContainer.setAttribute('data-nz-custom-icon', 'true');
        thumbnailContainer.style.setProperty('position', 'relative', 'important');
        thumbnailContainer.style.setProperty('display', 'flex', 'important');
        thumbnailContainer.style.setProperty('align-items', 'center', 'important');
        thumbnailContainer.style.setProperty('justify-content', 'center', 'important');
        thumbnailContainer.style.setProperty('background', 'transparent', 'important');
        
        // 强制父容器样式（如果存在）
        if (parentElement) {
          parentElement.style.setProperty('padding', '0', 'important');
          parentElement.style.setProperty('margin', '0', 'important');
          parentElement.style.setProperty('border', 'none', 'important');
          parentElement.style.setProperty('box-sizing', 'border-box', 'important');
        }
        
        if (grandParentElement) {
          grandParentElement.style.setProperty('padding', '0', 'important');
          grandParentElement.style.setProperty('margin', '0', 'important');
          grandParentElement.style.setProperty('border', 'none', 'important');
        }
        
        // 强制应用所有样式
        Object.entries(forceStyles).forEach(([prop, value]) => {
          customImg.style.setProperty(prop, value, 'important');
        });
        Object.entries(containerForceStyles).forEach(([prop, value]) => {
          thumbnailContainer.style.setProperty(prop, value, 'important');
        });
      };
      
      // 延迟应用 - 已禁用，因为初始样式已经正确
      // setTimeout(forceEdgeAlignment, 100);
      // setTimeout(forceEdgeAlignment, 500); // 再次确保
    }
    if (customBadge) {
      customBadge.style.cssText = 'position: absolute !important; bottom: 1px !important; left: 1px !important; width: 8px !important; height: 8px !important; background: #007acc !important; border-radius: 50% !important; border: 1px solid #fff !important; z-index: 10 !important; box-sizing: border-box !important;';
    }
    
    return true;
  }
  
  // 显示图标选择对话框
  static showIconSelectorDialog(filePath, fileName) {
    console.log(`[${config.PLUGIN_NAME}] 显示图标选择对话框: ${fileName}`);
    
    // 先隐藏现有对话框
    const existingOverlay = document.querySelector('.nz-dialog-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'nz-dialog-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const dialog = document.createElement('div');
    dialog.className = 'nz-dialog nz-icon-selector-dialog';
    dialog.style.cssText = `
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      background: #2a2a2a;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
    
    // 获取当前图标
    const currentIcon = this.getCustomIcon(filePath);
    const currentIconSrc = currentIcon ? currentIcon.iconData : '';
    
    dialog.innerHTML = `
      <div class="nz-dialog-title" style="
        padding: 20px;
        border-bottom: 1px solid #444;
        background: #333;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <i class="pi pi-image"></i> 自定义文件图标 - ${fileName}
      </div>
      
      <div class="nz-dialog-content" style="
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      ">
        <!-- 当前图标预览 -->
        <div class="nz-current-icon-preview" style="
          text-align: center; 
          margin-bottom: 20px; 
          padding: 20px; 
          background: rgba(255,255,255,0.05); 
          border-radius: 8px;
        ">
          <div style="display: inline-block; position: relative;">
            <div class="nz-preview-thumbnail" style="
              width: 80px; 
              height: 80px; 
              background: #333; 
              border-radius: 8px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              margin: 0 auto 10px;
            ">
              ${currentIconSrc ? 
                `<img src="${currentIconSrc}" style="width: 100%; height: 100%; object-fit: fill; border-radius: 8px;" alt="当前图标">` :
                `<div class="nz-thumbnail-icon" style="font-size: 48px; color: #e74c3c;">📄</div>`
              }
            </div>
          </div>
          <div style="color: #ccc; font-size: 12px;">
            ${currentIcon ? `当前图标 (${currentIcon.iconType})` : '默认图标'}
          </div>
        </div>
        
        <!-- 选择方式标签 -->
        <div class="nz-icon-source-tabs" style="
          display: flex; 
          border-bottom: 1px solid #444; 
          margin-bottom: 20px;
        ">
          <button class="nz-tab active" data-tab="upload" style="
            flex: 1; 
            padding: 10px; 
            background: none; 
            border: none; 
            color: #ccc; 
            border-bottom: 2px solid #007acc; 
            cursor: pointer;
          ">
            📤 上传图片
          </button>
          <button class="nz-tab" data-tab="preset" style="
            flex: 1; 
            padding: 10px; 
            background: none; 
            border: none; 
            color: #888; 
            border-bottom: 2px solid transparent; 
            cursor: pointer;
          ">
            🎨 预设图标
          </button>
        </div>
        
        <!-- 上传区域 -->
        <div class="nz-tab-content" data-tab="upload">
          <div class="nz-upload-area" style="
            border: 2px dashed #666; 
            border-radius: 8px; 
            padding: 40px; 
            text-align: center; 
            cursor: pointer; 
            transition: all 0.3s ease;
          ">
            <input type="file" accept="image/*" style="display: none;" id="nz-icon-file-input">
            <div class="nz-upload-dropzone">
              <i class="pi pi-cloud-upload" style="
                font-size: 48px; 
                color: #666; 
                margin-bottom: 15px; 
                display: block;
              "></i>
              <p style="margin: 0 0 10px; color: #ccc; font-size: 16px;">点击或拖拽图片到此处</p>
              <small style="color: #888; font-size: 12px;">
                支持 JPG, PNG, GIF (最大 2MB)<br>建议尺寸: 100x100像素
              </small>
            </div>
          </div>
        </div>
        
        <!-- 预设图标 -->
        <div class="nz-tab-content" data-tab="preset" style="display: none;">
          <div class="nz-preset-icons-grid" style="
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); 
            gap: 10px;
          ">
            ${this.generatePresetIconsHTML()}
          </div>
        </div>
      </div>
      
      <div class="nz-dialog-buttons" style="
        padding: 20px;
        border-top: 1px solid #444;
        background: #333;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      ">
        <button type="button" class="nz-dialog-button nz-dialog-cancel" style="
          padding: 8px 16px;
          background: #666;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">
          取消
        </button>
        <button type="button" class="nz-dialog-button nz-dialog-reset" style="
          padding: 8px 16px;
          background: #d9534f;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">
          重置为默认
        </button>
        <button type="button" class="nz-dialog-button nz-dialog-apply" style="
          padding: 8px 16px;
          background: #5cb85c;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          opacity: 0.5;
        " disabled>
          应用
        </button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    if (window.dialogManager) {
      window.dialogManager.currentDialog = overlay;
    }
    
    // 设置事件监听器
    this.setupIconSelectorEvents(dialog, filePath, fileName);
  }
  
  // 生成预设图标HTML
  static generatePresetIconsHTML() {
    const presetIcons = [
      '📄', '📋', '📊', '📈', '📉', '🎨', '🖼️', '🎯', '⚙️', '🔧',
      '💡', '⭐', '🎵', '🎬', '📷', '🎮', '💻', '📱', '🖥️', '🌟',
      '🔥', '💎', '🏆', '🎪', '🎭', '🎨', '🌈', '🔮', '✨', '🎊'
    ];
    
    return presetIcons.map(icon => `
      <div class="nz-preset-icon" data-icon="${icon}" style="
        width: 60px; 
        height: 60px; 
        background: transparent; 
        border-radius: 8px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 32px; 
        cursor: pointer; 
        transition: all 0.3s ease;
        border: 2px solid transparent;
      " title="使用图标: ${icon}">
        ${icon}
      </div>
    `).join('');
  }
  
  // 设置图标选择器事件
  static setupIconSelectorEvents(dialog, filePath, fileName) {
    let selectedIconData = null;
    let selectedIconType = null;
    
    // 标签切换
    const tabs = dialog.querySelectorAll('.nz-tab');
    const tabContents = dialog.querySelectorAll('.nz-tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        console.log('切换到标签:', tab.getAttribute('data-tab'));
        // 移除所有活动状态
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = '#888';
        });
        tabContents.forEach(content => {
          content.style.display = 'none';
          content.style.visibility = 'hidden';
          content.style.opacity = '0';
        });
        
        // 激活当前标签
        tab.classList.add('active');
        tab.style.borderBottomColor = '#007acc';
        tab.style.color = '#ccc';
        
        const targetTab = tab.getAttribute('data-tab');
        // 正确选择内容区域，使用class选择器而不是data-tab
        const targetContent = dialog.querySelector(`.nz-tab-content[data-tab="${targetTab}"]`);
        if (targetContent) {
          console.log('显示标签内容:', targetTab);
          targetContent.style.display = 'block';
          // 确保内容可见
          setTimeout(() => {
            targetContent.style.visibility = 'visible';
            targetContent.style.opacity = '1';
          }, 10);
        } else {
          console.error('未找到标签内容:', targetTab);
        }
      });
    });
    
    // 初始化第一个标签为激活状态
    if (tabs.length > 0) {
      const firstTab = tabs[0];
      firstTab.classList.add('active');
      firstTab.style.borderBottomColor = '#007acc';
      firstTab.style.color = '#ccc';
      
      const firstTabId = firstTab.getAttribute('data-tab');
      const firstTabContent = dialog.querySelector(`.nz-tab-content[data-tab="${firstTabId}"]`);
      if (firstTabContent) {
        firstTabContent.style.display = 'block';
        firstTabContent.style.visibility = 'visible';
        firstTabContent.style.opacity = '1';
      }
      
      // 隐藏其他标签内容
      tabContents.forEach(content => {
        if (content !== firstTabContent) {
          content.style.display = 'none';
          content.style.visibility = 'hidden';
          content.style.opacity = '0';
        }
      });
    }
    
    // 文件上传相关
    const fileInput = dialog.querySelector('#nz-icon-file-input');
    const uploadArea = dialog.querySelector('.nz-upload-area');
    const applyBtn = dialog.querySelector('.nz-dialog-apply');
    
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#007acc';
      uploadArea.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#666';
      uploadArea.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#666';
      uploadArea.style.backgroundColor = 'transparent';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0], dialog, (iconData) => {
          selectedIconData = iconData;
          selectedIconType = this.ICON_TYPES.UPLOADED;
          applyBtn.disabled = false;
          applyBtn.style.opacity = '1';
        });
      }
    });
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileUpload(file, dialog, (iconData) => {
          selectedIconData = iconData;
          selectedIconType = this.ICON_TYPES.UPLOADED;
          applyBtn.disabled = false;
          applyBtn.style.opacity = '1';
        });
      }
    });
    
    // 预设图标选择
    const presetIcons = dialog.querySelectorAll('.nz-preset-icon');
    presetIcons.forEach(iconEl => {
      iconEl.addEventListener('click', () => {
        // 清除其他选中状态
        presetIcons.forEach(el => {
          el.style.borderColor = 'transparent';
          el.style.background = 'transparent';
        });
        
        // 设置当前选中
        iconEl.style.borderColor = '#007acc';
        iconEl.style.background = 'rgba(0, 122, 204, 0.2)';
        
        // 生成图标数据
        const iconChar = iconEl.getAttribute('data-icon');
        selectedIconData = this.generateIconDataURL(iconChar);
        selectedIconType = this.ICON_TYPES.GENERATED;
        applyBtn.disabled = false;
        applyBtn.style.opacity = '1';
      });
    });
    
    // 按钮事件
    dialog.querySelector('.nz-dialog-cancel').addEventListener('click', () => {
      this.closeDialog();
    });
    
    dialog.querySelector('.nz-dialog-reset').addEventListener('click', () => {
      this.removeCustomIcon(filePath);
      window.nzWorkflowManager.showNotification(`已重置 ${fileName} 的图标`, 'success');
      this.closeDialog();
      
      // 刷新当前目录
      const currentPath = window.nzWorkflowManager?.config?.getCurrentPath?.();
      if (currentPath && typeof window.loadDirectory === 'function') {
        console.log(`[${window.nzWorkflowManager?.config?.PLUGIN_NAME || 'NZWorkflowManager'}] 图标重置成功，刷新目录: ${currentPath}`);
        window.loadDirectory(currentPath);
      } else if (currentPath && typeof loadDirectory === 'function') {
        console.log(`[${window.nzWorkflowManager?.config?.PLUGIN_NAME || 'NZWorkflowManager'}] 图标重置成功，刷新目录: ${currentPath}`);
        loadDirectory(currentPath);
      } else {
        console.warn(`[${window.nzWorkflowManager?.config?.PLUGIN_NAME || 'NZWorkflowManager'}] 无法刷新目录，loadDirectory函数或当前路径不可用`);
      }
    });
    
    applyBtn.addEventListener('click', () => {
      if (selectedIconData && selectedIconType) {
        const success = this.setCustomIcon(filePath, selectedIconData, selectedIconType, {
          fileName: fileName
        });
        
        if (success) {
          window.nzWorkflowManager.showNotification(`已设置 ${fileName} 的自定义图标`, 'success');
          this.closeDialog();
          
          // 🔄 自动刷新当前目录以显示新图标
          const currentPath = config.getCurrentPath();
          if (currentPath && typeof loadDirectory === 'function') {
            console.log(`[${config.PLUGIN_NAME}] 自定义图标设置成功，刷新目录: ${currentPath}`);
            loadDirectory(currentPath);
          } else {
            console.warn(`[${config.PLUGIN_NAME}] 无法刷新目录，loadDirectory函数或当前路径不可用`);
          }
        }
      }
    });
    
    // 点击遮罩关闭
    dialog.parentElement.addEventListener('click', (e) => {
      if (e.target === dialog.parentElement) {
        this.closeDialog();
      }
    });
  }
  
  // 处理文件上传
  static handleFileUpload(file, dialog, callback) {
    // 检查文件大小
    if (file.size > 2 * 1024 * 1024) { // 2MB
      window.nzWorkflowManager.showNotification('图片文件过大，请选择小于2MB的图片', 'error');
      return;
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      window.nzWorkflowManager.showNotification('请选择图片文件', 'error');
      return;
    }
    
    // 压缩并处理图片
    this.compressImage(file, 100, 100, 0.8)
      .then(compressedData => {
        // 更新预览
        const previewImg = dialog.querySelector('.nz-preview-thumbnail');
        previewImg.innerHTML = `<img src="${compressedData}" style="width: 100%; height: 100%; object-fit: fill; border-radius: 8px;" alt="预览">`;
        
        // 更新状态文本
        const statusText = dialog.querySelector('.nz-current-icon-preview').lastElementChild;
        statusText.textContent = '新上传的图标';
        
        callback(compressedData);
      })
      .catch(error => {
        console.error(`[${config.PLUGIN_NAME}] 图片处理失败:`, error);
        window.nzWorkflowManager.showNotification('图片处理失败，请重试', 'error');
      });
  }
  
  // 关闭对话框
  static closeDialog() {
    const overlay = document.querySelector('.nz-dialog-overlay');
    if (overlay) {
      overlay.remove();
    }
    if (window.dialogManager) {
      window.dialogManager.currentDialog = null;
    }
  }
}
*/

// ✅ Stage8: CustomIconManager和测试函数已迁移到模块中
// TODO: Stage8_CLEANUP - 以下全局对象设置和测试函数已迁移，待清理

// ====== 自定义图标测试函数 ======
// ✅ Stage8: 以下测试函数已迁移到模块中，这里保留兼容性接口
// TODO: Stage8_CLEANUP - nzTestCustomIcon现在由模块处理
/*
window.nzTestCustomIcon = function() {
  console.log('=== 测试自定义图标功能 ===');
  
  // 检查功能是否正确加载
  if (typeof CustomIconManager === 'undefined') {
    console.error('❌ CustomIconManager 未定义');
    return false;
  }
  
  console.log('✅ CustomIconManager 已加载');
  
  // 检查存储功能
  try {
    const testData = CustomIconManager.getAllCustomIcons();
    console.log('✅ 存储功能正常，当前自定义图标数量:', Object.keys(testData).length);
  } catch (error) {
    console.error('❌ 存储功能异常:', error);
    return false;
  }
  
  // 检查对话框显示功能
  try {
    // 模拟显示对话框（不实际显示）
    console.log('✅ 对话框功能已集成');
  } catch (error) {
    console.error('❌ 对话框功能异常:', error);
    return false;
  }
  
  // 检查右键菜单集成
  const hasContextMenu = typeof contextMenuManager !== 'undefined';
  console.log(hasContextMenu ? '✅ 右键菜单已集成' : '❌ 右键菜单未找到');
  
  console.log('🎉 自定义图标功能测试完成！');
  console.log('使用方法: 右键点击工作流文件 → "🎨 自定义图标" → "🖼️ 设置图标"');
  
  return true;
};
*/

// ====== 边框修复调试工具 ======
window.nzFixAllBorders = () => {
  console.log('=== 强制修复所有文件项边框 ===');
  const fileItems = document.querySelectorAll('.nz-file-item');
  console.log(`找到 ${fileItems.length} 个文件项`);
  
  fileItems.forEach((item, index) => {
    const filename = item.getAttribute('data-filename') || '未知';
    const isFolder = item.classList.contains('folder');
    console.log(`修复第 ${index + 1} 个文件项: ${filename} (${isFolder ? '文件夹' : '文件'})`);
    
    // 手动应用边框
    const isLightTheme = document.body.classList.contains('light-theme');
    const borderColor = isLightTheme ? 'rgba(200, 200, 200, 0.8)' : '#8b9dc3';
    item.style.setProperty('border', `1px solid ${borderColor}`, 'important');
    item.style.setProperty('box-sizing', 'border-box', 'important');
  });
  
  console.log('所有边框修复完成！');
};

console.log(`[${config.PLUGIN_NAME}] 边框修复工具已暴露：window.nzFixAllBorders()`);

// ====== 自动边框修复系统 ======
let borderFixObserver = null;
let themeChangeObserver = null;
let borderCheckInterval = null;

// DOM查询缓存
let fileItemsCache = null;
let cacheUpdateTime = 0;
const CACHE_DURATION = 1000; // 缓存1秒

function getCachedFileItems() {
  const now = Date.now();
  if (!fileItemsCache || (now - cacheUpdateTime) > CACHE_DURATION) {
    fileItemsCache = document.querySelectorAll('.nz-file-item');
    cacheUpdateTime = now;
  }
  return fileItemsCache;
}

// 自动边框修复观察器
function initAutoBorderFix() {
  console.log(`[${config.PLUGIN_NAME}] 启动自动边框修复系统`);
  
  // 1. DOM变化观察器 - 监控新增的文件项
  if (borderFixObserver) {
    borderFixObserver.disconnect();
  }
  
  let lastBorderFixTime = 0;
  const BORDER_FIX_THROTTLE_MS = 1000; // 1秒内最多输出一次日志
  
  borderFixObserver = new MutationObserver((mutations) => {
    let needsFix = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 检查新增的文件项
            if (node.classList && node.classList.contains('nz-file-item')) {
              ensureFileItemBorder(node, true); // 抑制日志避免重复输出
              needsFix = true;
            }
            
            // 检查新增节点内的文件项
            const fileItems = node.querySelectorAll && node.querySelectorAll('.nz-file-item');
            if (fileItems && fileItems.length > 0) {
              fileItems.forEach(item => ensureFileItemBorder(item, true)); // 抑制日志避免重复输出
              needsFix = true;
            }
          }
        });
      }
      
      // 监控属性变化（如class变化可能影响样式）
      if (mutation.type === 'attributes' && 
          mutation.target.classList && 
          mutation.target.classList.contains('nz-file-item')) {
        ensureFileItemBorder(mutation.target, true); // 抑制日志避免重复输出
        needsFix = true;
      }
    });
    
    if (needsFix) {
      // 清除DOM缓存，因为有新增项
      fileItemsCache = null;
      
      // 节流日志输出，避免频繁打印
      const now = Date.now();
      if (now - lastBorderFixTime > BORDER_FIX_THROTTLE_MS) {
        console.log(`[${config.PLUGIN_NAME}] 自动修复了新增/变化的文件项边框`);
        lastBorderFixTime = now;
      }
    }
  });
  
  // 开始观察整个侧边栏区域
  const sidebarContainer = document.querySelector('.nz-sidebar-container') || document.body;
  borderFixObserver.observe(sidebarContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // 2. 主题变化监听器
  if (themeChangeObserver) {
    themeChangeObserver.disconnect();
  }
  
  themeChangeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'class' &&
          mutation.target === document.body) {
        console.log(`[${config.PLUGIN_NAME}] 检测到主题变化，更新所有边框颜色和背景图片`);
        // 主题变化时重新应用所有边框（批量操作，抑制单个日志）
        setTimeout(() => {
          const fileItems = getCachedFileItems();
          fileItems.forEach(item => ensureFileItemBorder(item, true)); // 抑制日志
          if (fileItems.length > 0) {
            console.log(`[${config.PLUGIN_NAME}] 主题变化修复完成，共处理 ${fileItems.length} 个文件项`);
          }
          
          // 重新应用背景图片以适应新主题
          themeSystem.applyBackgroundImage();
        }, 100);
      }
    });
  });
  
  themeChangeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  // 3. 定期检查机制 - 每30秒检查一次（进一步降低频率）
  if (borderCheckInterval) {
    clearInterval(borderCheckInterval);
  }
  
  borderCheckInterval = setInterval(() => {
    const fileItems = getCachedFileItems();
    let fixedCount = 0;
    
    fileItems.forEach((item) => {
      const currentBorder = window.getComputedStyle(item).border;
      // 检查是否有边框，如果没有则修复
      if (!currentBorder || currentBorder === 'none' || currentBorder.includes('0px')) {
        ensureFileItemBorder(item, true); // 抑制单个日志
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      console.log(`[${config.PLUGIN_NAME}] 定期检查修复了 ${fixedCount} 个文件项的边框`);
    }
  }, 30000); // 改为30秒，进一步降低频率
  
  // 4. 立即修复现有的所有文件项（延迟执行，避免无效操作）
  setTimeout(() => {
    const fileItems = getCachedFileItems();
    if (fileItems.length > 0) {
      console.log(`[${config.PLUGIN_NAME}] 初始化时修复 ${fileItems.length} 个现有文件项的边框`);
      fileItems.forEach(item => ensureFileItemBorder(item, true)); // 抑制单个日志
      console.log(`[${config.PLUGIN_NAME}] 初始化边框修复完成`);
    } else {
      console.log(`[${config.PLUGIN_NAME}] 初始化时未找到文件项，跳过边框修复`);
    }
  }, 2000); // 延长到2秒，确保DOM加载完成
  
  console.log(`[${config.PLUGIN_NAME}] 自动边框修复系统已启动`);
}

// 清理函数
window.nzCleanupBorderFix = () => {
  console.log(`[${config.PLUGIN_NAME}] 清理自动边框修复系统`);
  
  if (borderFixObserver) {
    borderFixObserver.disconnect();
    borderFixObserver = null;
  }
  
  if (themeChangeObserver) {
    themeChangeObserver.disconnect();
    themeChangeObserver = null;
  }
  
  if (borderCheckInterval) {
    clearInterval(borderCheckInterval);
    borderCheckInterval = null;
  }
  
  console.log(`[${config.PLUGIN_NAME}] 自动边框修复系统已清理`);
};

// 启动自动修复系统
initAutoBorderFix();

// 强制移除内联边框样式
function forceRemoveInlineBorders() {
  const fileItems = document.querySelectorAll('.nz-file-item, .file-item');
  let fixedCount = 0;
  
  fileItems.forEach(item => {
    // 直接移除内联样式中的边框
    if (item.style.border) {
      item.style.border = 'none';
      fixedCount++;
    }
    if (item.style.borderTop) item.style.borderTop = 'none';
    if (item.style.borderBottom) item.style.borderBottom = 'none';
    if (item.style.borderLeft) item.style.borderLeft = 'none';
    if (item.style.borderRight) item.style.borderRight = 'none';
    if (item.style.boxShadow) item.style.boxShadow = 'none';
    if (item.style.outline) item.style.outline = 'none';
  });
  
  console.log(`[${config.PLUGIN_NAME}] 强制移除了 ${fixedCount} 个文件项的内联边框样式`);
  return fixedCount;
}



// 暴露拖拽移动函数到全局，供模块化系统调用
window.performDragMove = performDragMove;
window.performMultiDragMove = performMultiDragMove;
console.log(`[${config.PLUGIN_NAME}] 拖拽移动函数已暴露到全局: window.performDragMove, window.performMultiDragMove`);

// 暴露多选操作函数到全局，供模块化系统调用
window.handleMultiSelectAction = handleMultiSelectAction;
window.hideMultiSelectMenu = hideMultiSelectMenu;
console.log(`[${config.PLUGIN_NAME}] 多选操作函数已暴露到全局: window.handleMultiSelectAction, window.hideMultiSelectMenu`);

// NZ Plugin loaded successfully
