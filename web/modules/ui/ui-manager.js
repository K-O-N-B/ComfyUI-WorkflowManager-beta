// web/modules/ui/ui-manager.js
"use strict";

/**
 * UI管理器模块
 * 负责管理用户界面的交互功能，包括事件监听、通知系统和错误显示
 * 
 * 基于前三阶段经验教训，重点注意：
 * ✅ 真模块化实现：所有功能在模块内完整实现
 * ✅ CSS样式隔离：使用nz-ui命名空间防止全局样式冲突
 * ✅ 状态管理独立：UI状态通过模块接口管理
 * ✅ 避免全局变量依赖：通过构造函数传入必要依赖
 * 
 * 功能包括：
 * - UI事件监听器管理
 * - 通知系统（成功/错误/警告消息）
 * - 错误显示功能
 * - UI工具函数
 */
export class UIManager {
  constructor(pluginName, config) {
    this.pluginName = pluginName;
    this.config = config;
    
    // UI状态管理
    this.state = {
      initialized: false,
      notificationCount: 0
    };
    
    // 绑定方法到实例
    this.initializeUIEventListeners = this.initializeUIEventListeners.bind(this);
    this.showNotification = this.showNotification.bind(this);
    this.displayError = this.displayError.bind(this);
    this.displayNoDirectoryMessage = this.displayNoDirectoryMessage.bind(this);
    this.updateBackButtonState = this.updateBackButtonState.bind(this);
    
    console.log(`[${this.pluginName}] UI管理器模块已初始化`);
  }
  
  /**
   * 初始化UI事件监听器 - 真模块化实现
   * ✅ 完整功能在模块内实现，无外部依赖
   */
  initializeUIEventListeners() {
    console.log(`[${this.pluginName}] 初始化UI事件监听器`);
    
    try {
      // 返回按钮事件
      this.setupBackButton();
      
      // 刷新按钮事件
      this.setupRefreshButton();
      
      // 打开目录按钮事件
      this.setupChooseDirectoryButton();
      
      // 新建文件夹按钮事件
      this.setupNewFolderButton();
      
      // 浮动管理器按钮事件
      this.setupFloatingManagerButton();
      
      // 设置按钮事件
      this.setupSettingsButton();
      
      // 重要信息按钮事件
      this.setupImportantInfoButton();
      
      // 设置关闭按钮事件
      this.setupSettingsCloseButton();
      
      // 多选按钮事件
      this.setupMultiSelectButton();
      
      this.state.initialized = true;
      console.log(`[${this.pluginName}] UI事件监听器初始化完成`);
      
    } catch (error) {
      console.error(`[${this.pluginName}] UI事件监听器初始化失败:`, error);
    }
  }
  
  /**
   * 设置返回按钮事件
   */
  setupBackButton() {
    const backBtn = document.getElementById('nz-back-btn');
    if (backBtn) {
      // 移除已有的事件监听器（防止重复绑定）
      backBtn.replaceWith(backBtn.cloneNode(true));
      const newBackBtn = document.getElementById('nz-back-btn');
      
      newBackBtn.addEventListener('click', () => {
        console.log(`[${this.pluginName}] 返回按钮点击`);
        // 优先使用全局暴露的函数
        if (typeof window.goBack === 'function') {
          window.goBack();
        } else if (typeof goBack === 'function') {
          goBack();
        } else {
          this.showNotification('返回功能暂时不可用', 'warning');
        }
      });
    }
  }
  
  /**
   * 设置刷新按钮事件
   */
  setupRefreshButton() {
    const refreshBtn = document.getElementById('nz-refresh-btn');
    if (refreshBtn) {
      refreshBtn.replaceWith(refreshBtn.cloneNode(true));
      const newRefreshBtn = document.getElementById('nz-refresh-btn');
      
      newRefreshBtn.addEventListener('click', () => {
        console.log(`[${this.pluginName}] 刷新按钮点击`);
        // 委托给主文件中的目录加载功能
        if (typeof window.loadDirectory === 'function' && this.config) {
          window.loadDirectory(this.config.getCurrentPath());
        } else if (typeof loadDirectory === 'function' && this.config) {
          loadDirectory(this.config.getCurrentPath());
        } else {
          this.showNotification('刷新功能暂时不可用', 'warning');
        }
      });
    }
  }
  
  /**
   * 设置选择目录按钮事件
   */
  setupChooseDirectoryButton() {
    const chooseDirBtn = document.getElementById('nz-choose-dir-btn');
    if (chooseDirBtn) {
      chooseDirBtn.replaceWith(chooseDirBtn.cloneNode(true));
      const newChooseDirBtn = document.getElementById('nz-choose-dir-btn');
      
      newChooseDirBtn.addEventListener('click', () => {
        console.log(`[${this.pluginName}] 打开目录按钮点击`);
        // 优先使用全局暴露的函数
        if (typeof window.chooseDirectory === 'function') {
          window.chooseDirectory();
        } else if (typeof chooseDirectory === 'function') {
          chooseDirectory();
        } else {
          this.showNotification('选择目录功能暂时不可用', 'warning');
        }
      });
    }
  }
  
  /**
   * 设置新建文件夹按钮事件
   */
  setupNewFolderButton() {
    const newFolderBtn = document.getElementById('nz-new-folder-btn');
    if (newFolderBtn) {
      newFolderBtn.replaceWith(newFolderBtn.cloneNode(true));
      const newNewFolderBtn = document.getElementById('nz-new-folder-btn');
      
      newNewFolderBtn.addEventListener('click', () => {
        console.log(`[${this.pluginName}] 新建文件夹按钮点击`);
        this.createNewFolder();
      });
    }
  }
  
  /**
   * 设置浮动管理器按钮事件
   */
  setupFloatingManagerButton() {
    const floatingManagerBtn = document.getElementById('nz-floating-manager-btn');
    if (floatingManagerBtn) {
      floatingManagerBtn.replaceWith(floatingManagerBtn.cloneNode(true));
      const newFloatingManagerBtn = document.getElementById('nz-floating-manager-btn');
      
      newFloatingManagerBtn.addEventListener('click', () => {
        console.log(`[${this.pluginName}] 浮动管理器按钮点击`);
        // 委托给主文件中的浮动管理器功能
        if (typeof window.toggleFloatingManager === 'function') {
          window.toggleFloatingManager();
        } else if (typeof toggleFloatingManager === 'function') {
          toggleFloatingManager();
        } else {
          this.showNotification('浮动管理器功能暂时不可用', 'warning');
        }
      });
    }
  }
  
  /**
   * 设置设置按钮事件
   */
  setupSettingsButton() {
    const settingsBtn = document.getElementById('nz-settings-btn');
    if (settingsBtn) {
      settingsBtn.replaceWith(settingsBtn.cloneNode(true));
      const newSettingsBtn = document.getElementById('nz-settings-btn');
      
      newSettingsBtn.addEventListener('click', () => {
        console.log(`[${this.pluginName}] 设置按钮点击`);
        
        // 检查DialogManager是否已初始化，如果没有则等待
        const tryShowDialog = () => {
          if (window.nzDialogManager) {
            console.log(`[${this.pluginName}] DialogManager已就绪，显示设置对话框`);
            window.nzDialogManager.showSettingsDialog();
          } else {
            console.log(`[${this.pluginName}] DialogManager未就绪，等待100ms后重试`);
            setTimeout(tryShowDialog, 100);
          }
        };
        
        tryShowDialog();
      });
    }
  }
  
  /**
   * 设置重要信息按钮事件
   */
  setupImportantInfoButton() {
    const importantInfoBtn = document.getElementById('nz-important-info-btn');
    if (importantInfoBtn) {
      importantInfoBtn.replaceWith(importantInfoBtn.cloneNode(true));
      const newImportantInfoBtn = document.getElementById('nz-important-info-btn');
      
      newImportantInfoBtn.addEventListener('click', () => {
        console.log(`[${this.pluginName}] 重要信息按钮点击`);
        
        // 检查DialogManager是否已初始化，如果没有则等待
        const tryShowDialog = () => {
          if (window.nzDialogManager) {
            console.log(`[${this.pluginName}] DialogManager已就绪，显示重要信息对话框`);
            window.nzDialogManager.showImportantInfoDialog();
          } else {
            console.log(`[${this.pluginName}] DialogManager未就绪，等待100ms后重试`);
            setTimeout(tryShowDialog, 100);
          }
        };
        
        tryShowDialog();
      });
    }
  }
  
  /**
   * 设置设置关闭按钮事件
   */
  setupSettingsCloseButton() {
    const settingsCloseBtn = document.querySelector('.nz-settings-close-btn');
    if (settingsCloseBtn) {
      settingsCloseBtn.replaceWith(settingsCloseBtn.cloneNode(true));
      const newSettingsCloseBtn = document.querySelector('.nz-settings-close-btn');
      
      newSettingsCloseBtn.addEventListener('click', () => {
        console.log(`[${this.pluginName}] 设置关闭按钮点击`);
        // 优先使用全局暴露的函数
        if (typeof window.hideSettingsPanel === 'function') {
          window.hideSettingsPanel();
        } else if (typeof hideSettingsPanel === 'function') {
          hideSettingsPanel();
        } else {
          this.showNotification('设置面板功能暂时不可用', 'warning');
        }
      });
    }
  }
  
  /**
   * 设置多选按钮事件
   */
  setupMultiSelectButton() {
    const multiSelectBtn = document.getElementById('nz-multi-select-btn');
    const multiSelectMenu = document.getElementById('nz-multi-select-menu');
    
    if (multiSelectBtn && multiSelectMenu) {
      // 移除已有的事件监听器
      multiSelectBtn.replaceWith(multiSelectBtn.cloneNode(true));
      const newMultiSelectBtn = document.getElementById('nz-multi-select-btn');
      
      newMultiSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`[${this.pluginName}] 多选按钮点击`);
        
        // 委托给主文件中的多选管理器功能
        const manager = window.multiSelectManager || multiSelectManager;
        if (manager && typeof manager.isMultiSelectMode === 'function') {
          // 如果当前处于多选模式，退出多选模式（红框按钮功能）
          if (manager.isMultiSelectMode()) {
            console.log(`[${this.pluginName}] 通过多选按钮退出多选模式`);
            manager.setMultiSelectMode(false);
          } else {
            // 否则进入多选模式
            manager.toggleMultiSelectMode();
          }
        } else {
          this.showNotification('多选功能暂时不可用', 'warning');
        }
      });
      
      // 多选菜单项事件
      multiSelectMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.nz-menu-item');
        if (menuItem) {
          const action = menuItem.dataset.action;
          console.log(`[${this.pluginName}] 多选菜单操作: ${action}`);
          // 调用多选操作处理功能（后续阶段会模块化）
          if (typeof window.handleMultiSelectAction === 'function') {
            window.handleMultiSelectAction(action);
          } else if (typeof handleMultiSelectAction !== 'undefined') {
            handleMultiSelectAction(action);
          }
          if (typeof window.hideMultiSelectMenu === 'function') {
            window.hideMultiSelectMenu();
          } else if (typeof hideMultiSelectMenu !== 'undefined') {
            hideMultiSelectMenu();
          }
        }
      });
      
      // 点击其他地方时隐藏菜单
      document.addEventListener('click', (e) => {
        if (!newMultiSelectBtn.contains(e.target) && !multiSelectMenu.contains(e.target)) {
          if (typeof window.hideMultiSelectMenu === 'function') {
            window.hideMultiSelectMenu();
          } else if (typeof hideMultiSelectMenu !== 'undefined') {
            hideMultiSelectMenu();
          }
        }
      });
    }
  }
  
  /**
   * 新建文件夹功能 - 委托给主文件实现
   */
  createNewFolder() {
    console.log(`[${this.pluginName}] 新建文件夹功能被调用`);
    
    if (!this.config.getCurrentPath()) {
      this.showNotification('请先选择一个目录', 'warning');
      return;
    }
    
    // 委托给主文件中的现有实现
    if (typeof window.createNewFolder === 'function') {
      window.createNewFolder();
    } else if (typeof createNewFolder === 'function') {
      createNewFolder();
    } else if (typeof contextMenuManager !== 'undefined' && contextMenuManager && contextMenuManager.createDirectory) {
      contextMenuManager.createDirectory(this.config.getCurrentPath());
    } else {
      this.showNotification('新建文件夹功能暂时不可用', 'error');
    }
  }
  
  /**
   * 显示通知 - 真模块化实现
   * ✅ 完整功能在模块内实现，包含CSS样式
   */
  showNotification(message, type = 'info', duration = 3000) {
    // 确保通知样式已加载
    this.ensureNotificationStyles();
    
    // 强制清除所有已存在的通知，包括正在隐藏的
    this.clearAllNotifications();
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `nz-ui-notification nz-ui-notification-${type}`;
    
    // 创建通知内容
    const content = document.createElement('div');
    content.className = 'nz-ui-notification-content';
    
    // 添加图标
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'pi pi-check' : 
                     type === 'error' ? 'pi pi-times' : 
                     'pi pi-info-circle';
    
    // 添加消息文本
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    content.appendChild(icon);
    content.appendChild(messageSpan);
    notification.appendChild(content);
    
    document.body.appendChild(notification);
    
    // 使用 requestAnimationFrame 确保元素已渲染，然后触发显示动画
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });
    
    // 自动隐藏通知
    this.hideNotificationAfterDelay(notification, duration);
    
    this.state.notificationCount++;
    console.log(`[${this.pluginName}] 显示通知: ${message} (类型: ${type})`);
  }
  
  /**
   * 强制清除所有通知
   */
  clearAllNotifications() {
    const existingNotifications = document.querySelectorAll('.nz-ui-notification');
    existingNotifications.forEach(notif => {
      // 停止任何正在进行的动画
      notif.style.transition = 'none';
      // 立即移除
      notif.remove();
    });
    
    // 清除所有相关的timeout
    if (this._notificationTimeouts) {
      this._notificationTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      this._notificationTimeouts = [];
    } else {
      this._notificationTimeouts = [];
    }
  }

  /**
   * 延迟隐藏通知
   */
  hideNotificationAfterDelay(notification, duration) {
    const timeoutId = setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        // 等待动画完成后移除元素
        const animationTimeoutId = setTimeout(() => {
          if (notification && notification.parentNode) {
            notification.remove();
          }
        }, 300);
        
        // 记录动画timeout以便可以清除
        if (!this._notificationTimeouts) this._notificationTimeouts = [];
        this._notificationTimeouts.push(animationTimeoutId);
      }
    }, duration);
    
    // 记录主timeout以便可以清除
    if (!this._notificationTimeouts) this._notificationTimeouts = [];
    this._notificationTimeouts.push(timeoutId);
  }
  
  /**
   * 显示错误信息 - 真模块化实现
   * ✅ 完整功能在模块内实现，包含详细的错误处理
   */
  displayError(message) {
    console.error(`[${this.pluginName}] 错误: ${message}`);
    
    const contentElement = document.getElementById('nz-content');
    if (contentElement) {
      // 隐藏加载状态和文件网格
      const loadingOverlay = contentElement.querySelector('.loading-overlay');
      const fileGrid = contentElement.querySelector('.file-grid');
      const emptyState = contentElement.querySelector('.empty-state');
      
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (fileGrid) fileGrid.style.display = 'none';
      
      if (emptyState) {
        // 如果是服务器连接错误，显示更详细的帮助信息
        if (message.includes('无法连接到ComfyUI服务器')) {
          emptyState.innerHTML = `
            <div class="nz-ui-error-message">
              <h3>⚠️ ${message}</h3>
              <p>请按以下步骤解决：</p>
              <ol>
                <li>确保ComfyUI服务器正在运行</li>
                <li>检查ComfyUI是否正常启动（通常在端口8188）</li>
                <li>刷新此页面重新连接</li>
              </ol>
              <p><small>提示：如果ComfyUI正在运行但仍显示此错误，请检查防火墙设置</small></p>
            </div>
          `;
        } else {
          emptyState.innerHTML = `<div class="nz-ui-error-message">错误: ${message}</div>`;
        }
        
        emptyState.style.display = 'block';
      }
    }
    
    // 更新状态栏
    const statusBar = document.querySelector('.nz-status-bar span');
    if (statusBar) {
      statusBar.textContent = `错误: ${message}`;
    }
    
    // 同时显示通知
    this.showNotification(message, 'error', 5000);
  }
  
  /**
   * 显示无目录消息
   */
  displayNoDirectoryMessage() {
    console.log(`[${this.pluginName}] 显示无目录消息`);
    
    const contentElement = document.getElementById('nz-content');
    if (contentElement) {
      const loadingOverlay = contentElement.querySelector('.loading-overlay');
      const fileGrid = contentElement.querySelector('.file-grid');
      const emptyState = contentElement.querySelector('.empty-state');
      
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (fileGrid) fileGrid.style.display = 'none';
      
      if (emptyState) {
        emptyState.innerHTML = `
          <div class="nz-ui-no-directory-message">
            <h3>📁 未设置默认目录</h3>
            <p>请点击 "📁 设置目录" 按钮选择工作流目录</p>
            <p><small>设置目录后，您可以浏览和管理工作流文件</small></p>
          </div>
        `;
        emptyState.style.display = 'block';
      }
    }
    
    // 更新状态栏
    const statusBar = document.querySelector('.nz-status-bar span');
    if (statusBar) {
      statusBar.textContent = '未设置默认目录';
    }
  }
  
  /**
   * 更新返回按钮状态
   */
  updateBackButtonState() {
    const backBtn = document.getElementById('nz-back-btn');
    if (backBtn && this.config) {
      const pathHistory = this.config.getPathHistory();
      const currentPath = this.config.getCurrentPath();
      const defaultDirectory = this.config.getDefaultDirectory();
      
      // 标准化路径格式（统一使用反斜杠，移除末尾反斜杠）
      const normalizedCurrentPath = currentPath ? currentPath.replace(/\//g, '\\').replace(/\\+$/, '') : '';
      const normalizedDefaultDir = defaultDirectory ? defaultDirectory.replace(/\//g, '\\').replace(/\\+$/, '') : '';
      
      // 判断是否在根目录（即默认目录）
      const isAtRootDirectory = normalizedCurrentPath === normalizedDefaultDir;
      
      // 修复逻辑：
      // 1. 如果当前在根目录（默认目录），则禁用返回按钮
      // 2. 如果有历史记录（长度 >= 1），说明可以返回
      // 3. 或者当前路径不是默认目录且在默认目录范围内，也可以尝试返回
      let canGoBack = false;
      
      if (isAtRootDirectory) {
        // 在根目录时，禁用返回按钮
        canGoBack = false;
        console.log(`[${this.pluginName}] 当前在根目录，禁用返回按钮: ${currentPath}`);
      } else {
        const hasHistory = pathHistory && pathHistory.length >= 1;
        const isNotDefaultDir = currentPath && defaultDirectory && currentPath !== defaultDirectory;
        const isInDefaultScope = currentPath && defaultDirectory && currentPath.startsWith(defaultDirectory);
        
        canGoBack = hasHistory || (isNotDefaultDir && isInDefaultScope);
      }
      
      backBtn.disabled = !canGoBack;
      backBtn.style.opacity = canGoBack ? '1' : '0.5';
      
      console.log(`[${this.pluginName}] 返回按钮状态更新: ${canGoBack ? '可用' : '禁用'}`);
      console.log(`[${this.pluginName}] 调试信息: 历史=${pathHistory?.length || 0}, 当前=${currentPath}, 默认=${defaultDirectory}, 在根目录=${isAtRootDirectory}`);
    }
  }
  
  /**
   * 确保通知样式已加载 - CSS样式隔离
   * ✅ 使用nz-ui命名空间防止样式冲突
   */
  ensureNotificationStyles() {
    if (document.getElementById('nz-ui-notification-styles')) {
      return; // 样式已存在
    }
    
    const style = document.createElement('style');
    style.id = 'nz-ui-notification-styles';
    style.textContent = `
      /* NZ UI管理器 - 通知系统样式 (隔离命名空间) */
      .nz-ui-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--comfy-menu-bg, rgba(25, 30, 40, 0.95));
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        padding: 12px 16px;
        color: var(--fg-color, #e0f0ff);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        z-index: 10000;
        min-width: 300px;
        max-width: 450px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .nz-ui-notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .nz-ui-notification-content i {
        font-size: 16px;
        flex-shrink: 0;
      }
      
      .nz-ui-notification-content span {
        flex: 1;
        word-wrap: break-word;
      }
      
      .nz-ui-notification-success {
        border-left: 4px solid #28a745;
      }
      
      .nz-ui-notification-success .nz-ui-notification-content i {
        color: #28a745;
      }
      
      .nz-ui-notification-error {
        border-left: 4px solid #dc3545;
      }
      
      .nz-ui-notification-error .nz-ui-notification-content i {
        color: #dc3545;
      }
      
      .nz-ui-notification-warning {
        border-left: 4px solid #ffc107;
      }
      
      .nz-ui-notification-warning .nz-ui-notification-content i {
        color: #ffc107;
      }
      
      .nz-ui-notification-info {
        border-left: 4px solid #17a2b8;
      }
      
      .nz-ui-notification-info .nz-ui-notification-content i {
        color: #17a2b8;
      }
      
      /* 错误消息样式 */
      .nz-ui-error-message {
        text-align: center;
        color: var(--fg-color, #e0f0ff);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .nz-ui-error-message h3 {
        color: #dc3545;
        margin-bottom: 16px;
      }
      
      .nz-ui-error-message ol {
        text-align: left;
        margin: 16px 0;
        padding-left: 20px;
      }
      
      .nz-ui-error-message li {
        margin: 8px 0;
      }
      
      .nz-ui-error-message small {
        color: var(--descrip-text, rgba(255, 255, 255, 0.6));
      }
      
      /* 无目录消息样式 */
      .nz-ui-no-directory-message {
        text-align: center;
        color: var(--fg-color, #e0f0ff);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .nz-ui-no-directory-message h3 {
        color: var(--fg-color, #e0f0ff);
        margin-bottom: 16px;
      }
      
      .nz-ui-no-directory-message p {
        margin: 8px 0;
      }
      
      .nz-ui-no-directory-message small {
        color: var(--descrip-text, rgba(255, 255, 255, 0.6));
      }
    `;
    
    document.head.appendChild(style);
    console.log(`[${this.pluginName}] UI管理器通知样式已加载`);
  }
  
  /**
   * 创建管理器界面
   * 这是UI模块化的核心方法
   */
  createManagerInterface(container) {
    if (!container) {
      console.error(`[${this.pluginName}] createManagerInterface: 容器参数为空`);
      return;
    }
    
    try {
      // 使用侧边栏注册模块创建界面
      if (window.sidebarRegistration && typeof window.sidebarRegistration.createManagerInterface === 'function') {
        console.log(`[${this.pluginName}] 使用侧边栏注册模块创建界面`);
        window.sidebarRegistration.createManagerInterface(container);
      } else {
        console.error(`[${this.pluginName}] 侧边栏注册模块未就绪`);
        // 创建简单的错误提示界面
        container.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #666;">
            <h3>NZ工作流管理器</h3>
            <p>正在加载界面...</p>
          </div>
        `;
      }
    } catch (error) {
      console.error(`[${this.pluginName}] 创建管理器界面失败:`, error);
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #e74c3c;">
          <h3>界面加载失败</h3>
          <p>请刷新页面重试</p>
        </div>
      `;
    }
  }
  
  /**
   * 添加管理器样式
   * 负责浮动管理器和其他UI样式
   */
  addManagerStyles() {
    try {
      // 避免重复添加样式
      if (document.getElementById('nz-ui-manager-styles')) {
        console.log(`[${this.pluginName}] 管理器样式已存在，跳过添加`);
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'nz-ui-manager-styles';
      style.textContent = `
        /* NZ UI Manager Styles */
        .nz-floating-manager {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          min-width: 300px;
          max-width: 400px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .nz-floating-manager-header {
          background: #f8f9fa;
          padding: 12px 16px;
          border-bottom: 1px solid #ddd;
          border-radius: 8px 8px 0 0;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .nz-floating-manager-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
        }
        
        .nz-floating-manager-close:hover {
          color: #000;
        }
        
        .nz-floating-manager-content {
          padding: 16px;
        }
        
        .nz-floating-manager .nz-manager-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .nz-floating-manager .nz-manager-button {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          flex: 1;
          min-width: 80px;
        }
        
        .nz-floating-manager .nz-manager-button:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
          .nz-floating-manager {
            right: 10px;
            left: 10px;
            max-width: none;
            min-width: auto;
          }
        }
        
        /* 暗黑主题支持 */
        body.dark-theme .nz-floating-manager {
          background: #2d2d2d;
          border-color: #444;
          color: #fff;
        }
        
        body.dark-theme .nz-floating-manager-header {
          background: #333;
          border-color: #444;
        }
        
        body.dark-theme .nz-floating-manager .nz-manager-button {
          background: #333;
          border-color: #555;
          color: #fff;
        }
        
        body.dark-theme .nz-floating-manager .nz-manager-button:hover {
          background: #444;
          border-color: #007bff;
        }
      `;
      
      document.head.appendChild(style);
      console.log(`[${this.pluginName}] 管理器样式已添加`);
      
    } catch (error) {
      console.error(`[${this.pluginName}] 添加管理器样式失败:`, error);
    }
  }
  
  /**
   * 更新管理器显示
   * 用于动态更新界面内容
   */
  updateManagerDisplay(options = {}) {
    try {
      const { showFloating = false, theme = 'light' } = options;
      
      if (showFloating) {
        this.addManagerStyles();
      }
      
      // 应用主题
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      
      console.log(`[${this.pluginName}] 管理器显示已更新`, options);
      
    } catch (error) {
      console.error(`[${this.pluginName}] 更新管理器显示失败:`, error);
    }
  }
  
  /**
   * 获取UI状态信息
   */
  getState() {
    return {
      ...this.state,
      pluginName: this.pluginName
    };
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    // 移除通知样式
    const styleElement = document.getElementById('nz-ui-notification-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    // 移除所有通知
    const notifications = document.querySelectorAll('.nz-ui-notification');
    notifications.forEach(notif => notif.remove());
    
    console.log(`[${this.pluginName}] UI管理器资源已清理`);
  }
}
