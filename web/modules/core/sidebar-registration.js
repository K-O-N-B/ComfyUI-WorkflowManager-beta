/**
 * 侧边栏注册模块 - 真模块化实现
 * 
 * 经验教训总结：
 * ❌ 避免：动态函数绑定 (manager.createManagerInterface = createManagerInterface)
 * ✅ 实现：完整功能在模块内实现，无外部依赖
 * 
 * 这个模块负责：
 * 1. 侧边栏标签的注册和管理
 * 2. 管理器界面的创建和初始化
 * 3. 传统按钮备用方案
 * 4. 防重复注册机制
 */

// 导入必要的模块和依赖
// 注意：app对象通过构造函数参数传递，避免直接导入

class SidebarRegistration {
  constructor(pluginName, app = null) {
    this.pluginName = pluginName;
    this.app = app || window.app; // 支持传入app对象或使用全局app
    this.isRegistered = false;
    this.sidebarTabRegistered = false;
    
    // 绑定方法到实例
    this.createWorkflowManagerTab = this.createWorkflowManagerTab.bind(this);
    this.createTraditionalButton = this.createTraditionalButton.bind(this);
    this.createManagerInterface = this.createManagerInterface.bind(this);
  }

  /**
   * 创建侧边栏标签 - 真模块化实现
   */
  createWorkflowManagerTab() {
    console.log(`[${this.pluginName}] 创建侧边栏标签`);
    
    // 防重复注册机制
    if (this.sidebarTabRegistered) {
      console.log(`[${this.pluginName}] 侧边栏标签已注册，跳过重复注册`);
      return;
    }

    // 方案1: 尝试新版侧边栏API
    if (this.app.extensionManager && typeof this.app.extensionManager.registerSidebarTab === 'function') {
      console.log(`[${this.pluginName}] 尝试新版侧边栏API...`);
      
      // 检查是否已有相同ID的标签
      if (this.app.extensionManager.sidebarTabs) {
        const existingTab = this.app.extensionManager.sidebarTabs.find(tab => tab.id === "nz-workflow-manager");
        if (existingTab) {
          console.log(`[${this.pluginName}] 发现已存在的标签，设置防重复标记`);
          this.sidebarTabRegistered = true;
          return;
        }
      }

      try {
        console.log(`[${this.pluginName}] 注册侧边栏参数:`, {
          id: "nz-workflow-manager",
          icon: "star",
          title: "NZ工作流助手",
          tooltip: "NZ工作流助手工具",
          type: "custom"
        });
        
        this.app.extensionManager.registerSidebarTab({
          id: "nz-workflow-manager",
          icon: "pi pi-star",
          title: "NZ工作流助手",
          tooltip: "NZ工作流助手工具",
          type: "custom",
          render: (el) => {
            console.log(`[${this.pluginName}] 渲染侧边栏内容`);
            
            // 立即设置防重复标记
            this.sidebarTabRegistered = true;
            console.log(`[${this.pluginName}] 已设置侧边栏标签防重复标记`);
            
            // ✅ 真模块化：调用模块内的方法，而非外部函数
            this.createManagerInterface(el);
            
            // 延迟初始化以确保DOM完全加载
            setTimeout(() => {
              this.initializeUIEventListeners();
              
              // 从localStorage重新获取默认目录状态
              const currentDefaultDir = localStorage.getItem('nz_default_directory') || '';
              
              if (currentDefaultDir) {
                console.log(`[${this.pluginName}] 自动加载默认目录: ${currentDefaultDir}`);
                // 更新全局变量 - 这里需要与主文件协调
                if (window.nzWorkflowManager) {
                  window.nzWorkflowManager.setDefaultDirectory(currentDefaultDir);
                  window.nzWorkflowManager.setCurrentPath(currentDefaultDir);
                  window.nzWorkflowManager.loadDirectory(currentDefaultDir);
                }
              } else {
                console.log(`[${this.pluginName}] 没有默认目录，显示提示信息`);
                this.displayNoDirectoryMessage();
              }
              
              // 确保返回按钮状态正确
              this.updateBackButtonState();
            }, 100);
          }
        });
        
        console.log(`[${this.pluginName}] 侧边栏标签创建成功`);
        return; // 成功则退出
      } catch (error) {
        console.error(`[${this.pluginName}] 侧边栏标签创建失败:`, error);
      }
    }
    
    // 方案2: 创建传统按钮作为备用
    console.log(`[${this.pluginName}] 侧边栏不可用，创建传统按钮...`);
    this.createTraditionalButton();
  }

  /**
   * 创建传统按钮 (备用方案) - 真模块化实现
   */
  createTraditionalButton() {
    try {
      // 查找合适的位置插入按钮
      const targetSelectors = [
        '.comfy-menu',
        '#queue-button',
        '.comfyui-menu',
        '.comfy-ui-button',
        '#comfyui-flow-menu'
      ];
      
      let toolbar = null;
      for (const selector of targetSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          toolbar = element.parentElement || element;
          break;
        }
      }
      
      if (!toolbar) {
        // 如果找不到合适位置，创建在body顶部
        toolbar = document.body;
      }
      
      // 检查是否已存在按钮
      const existingBtn = document.getElementById('nz-workflow-manager-btn');
      if (existingBtn) {
        console.log(`[${this.pluginName}] 传统按钮已存在`);
        return;
      }
      
      const button = document.createElement('button');
      button.id = 'nz-workflow-manager-btn';
      button.innerHTML = '⭐ NZ管理器';
      button.title = 'NZ工作流助手';
      button.style.cssText = `
        background: #007cba;
        color: white;
        border: none;
        padding: 8px 12px;
        margin: 2px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        z-index: 1000;
        position: relative;
      `;
      
      button.addEventListener('click', () => {
        // ✅ 真模块化：调用模块内方法处理点击事件
        this.toggleFloatingManager();
      });
      
      // 如果toolbar是body，则定位到右上角
      if (toolbar === document.body) {
        button.style.cssText += `
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 10000;
        `;
      }
      
      toolbar.appendChild(button);
      
      // 设置防重复标记
      this.sidebarTabRegistered = true;
      
      console.log(`[${this.pluginName}] 传统按钮创建成功`);
      
    } catch (error) {
      console.error(`[${this.pluginName}] 传统按钮创建失败:`, error);
    }
  }

  /**
   * 创建管理器界面 - 真模块化实现
   * ✅ 完整功能在模块内实现，无外部依赖
   */
  createManagerInterface(container) {
    console.log(`[${this.pluginName}] 创建管理器界面`);
    
    // 确保样式已应用
    this.ensureStyles();
    
    try {
      // 确保在创建界面时已经加载了默认目录
      const currentDefaultDir = localStorage.getItem('nz_default_directory') || '';
      const currentPath = window.nzWorkflowManager?.getCurrentPath() || currentDefaultDir || '';
      const currentPathValue = currentPath || '未设置目录';
      const hasDefaultDir = !!currentDefaultDir;
      
      container.innerHTML = `
        <div class="nz-manager">
          <div class="nz-header">
            <div class="nz-header-left">
              <h2>NZ工作流助手</h2>
            </div>
            <div class="nz-header-right">
              <button id="nz-important-info-btn" class="nz-header-info-btn" title="重要说明">
                <i class="pi pi-exclamation-triangle"></i>
              </button>
              <button id="nz-settings-btn" class="nz-header-settings-btn" title="设置">
                <i class="pi pi-cog"></i>
              </button>
            </div>
          </div>
          
          <!-- 轮播Banner提示 -->
          <div class="nz-banner-carousel" id="nz-banner-carousel">
            <div class="nz-banner-wrapper">
              <div class="nz-banner-slide active" data-slide="0">
                <div class="nz-banner-content">
                  <i class="pi pi-exclamation-triangle nz-banner-icon"></i>
                  <span class="nz-banner-text">在使用本插件的同时，请不要使用官方的工作流管理功能和TAB功能，会造成保存混乱和冲突！</span>
                </div>
              </div>
              <div class="nz-banner-slide" data-slide="1">
                <div class="nz-banner-content">
                  <i class="pi pi-info-circle nz-banner-icon"></i>
                  <span class="nz-banner-text">V1.5.2新版本已经发布，请前往主页免费下载</span>
                </div>
              </div>
            </div>
            <div class="nz-banner-indicators">
              <span class="nz-banner-dot active" data-index="0"></span>
              <span class="nz-banner-dot" data-index="1"></span>
            </div>
          </div>
          
          <div class="nz-toolbar">
            <div class="nz-toolbar-group">
              <div class="nz-toolbar-controls">
                <button id="nz-back-btn" class="nz-toolbar-btn" title="返回上级目录">
                  <i class="pi pi-arrow-left"></i>
                </button>
                <button id="nz-refresh-btn" class="nz-toolbar-btn" title="刷新当前目录">
                  <i class="pi pi-refresh"></i>
                </button>
                <button id="nz-choose-dir-btn" class="nz-toolbar-btn" title="设置默认目录">
                  <i class="pi pi-folder-open"></i>
                </button>
                <button id="nz-new-folder-btn" class="nz-toolbar-btn" title="新建文件夹">
                  <i class="pi pi-plus"></i>
                </button>

                <div class="nz-multi-select-container">
                  <button id="nz-multi-select-btn" class="nz-toolbar-btn nz-multi-select-toggle" title="多选模式">
                    <i class="pi pi-check-square"></i>
                  </button>
                  <div id="nz-multi-select-menu" class="nz-multi-select-menu" style="display: none;">
                    <!-- 动态生成的菜单内容 -->
                  </div>
                </div>
              </div>
            </div>
            <div class="nz-toolbar-group">
              <button id="nz-floating-manager-btn" class="nz-toolbar-btn nz-floating-btn-highlight" title="打开浮动框">
                <i class="pi pi-window-maximize"></i>
              </button>
            </div>
          </div>
          
          <div class="nz-path-display" id="nz-path-display" data-current-path="${currentPathValue}">
            <i class="pi pi-folder"></i>
            <span id="nz-current-path">${currentPathValue}</span>
            <div class="nz-path-actions">
              <!-- 上级目录按钮已删除 -->
            </div>
            <div class="nz-path-drag-overlay" id="nz-path-drag-overlay">
              <span class="icon">⬆️</span>
              <span>拖拽到上一级目录</span>
            </div>
          </div>
          
          <div class="nz-content" id="nz-content">
            <div class="loading-overlay">加载中...</div>
            <div class="file-grid" id="nz-file-grid"></div>
            <div class="empty-state">暂无工作流</div>
          </div>
          
          <!-- 设置界面 -->
          <div class="nz-settings-panel" id="nz-settings-panel" style="display: none;">
            <div class="nz-settings-header">
              <h3>设置</h3>
              <button class="nz-settings-close-btn" title="关闭设置">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <div class="nz-settings-content">
              <div class="nz-settings-section">
                <h4>关于</h4>
                <div class="nz-settings-item">
                  <label>插件名称：</label>
                  <span>NZ工作流助手</span>
                </div>
                <div class="nz-settings-item">
                  <label>版本：</label>
                  <span>2.0.0</span>
                </div>
              </div>
              
              <div class="nz-settings-section">
                <h4>功能设置</h4>
                <div class="nz-settings-item">
                  <label>
                    <input type="checkbox" id="nz-enable-thumbnails" checked>
                    启用缩略图预览
                  </label>
                </div>
                <div class="nz-settings-item">
                  <label>
                    <input type="checkbox" id="nz-enable-drag-drop" checked>
                    启用拖拽功能
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      console.log(`[${this.pluginName}] 管理器界面HTML创建完成`);
      
      // 初始化轮播Banner
      this.initializeBannerCarousel(container);
      
    } catch (error) {
      console.error(`[${this.pluginName}] 创建管理器界面失败:`, error);
    }
  }

  /**
   * 初始化轮播Banner
   */
  initializeBannerCarousel(container) {
    const carousel = container.querySelector('#nz-banner-carousel');
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.nz-banner-slide');
    const dots = carousel.querySelectorAll('.nz-banner-dot');
    let currentSlide = 0;
    let carouselInterval = null;
    
    // 切换到指定幻灯片
    const goToSlide = (index) => {
      if (index < 0 || index >= slides.length) return;
      
      // 移除所有活动状态
      slides.forEach(slide => slide.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));
      
      // 添加当前活动状态
      slides[index].classList.add('active');
      dots[index].classList.add('active');
      
      currentSlide = index;
    };
    
    // 下一张
    const nextSlide = () => {
      const next = (currentSlide + 1) % slides.length;
      goToSlide(next);
    };
    
    // 自动轮播
    const startCarousel = () => {
      if (carouselInterval) clearInterval(carouselInterval);
      carouselInterval = setInterval(nextSlide, 5000); // 每5秒切换一次
    };
    
    // 停止轮播
    const stopCarousel = () => {
      if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
      }
    };
    
    // 点击指示器切换
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        stopCarousel();
        goToSlide(index);
        startCarousel();
      });
    });
    
    // 鼠标悬停时暂停轮播
    carousel.addEventListener('mouseenter', stopCarousel);
    carousel.addEventListener('mouseleave', startCarousel);
    
    // 开始自动轮播
    startCarousel();
    
    console.log(`[${this.pluginName}] 轮播Banner初始化完成`);
  }

  /**
   * 初始化UI事件监听器 - 委托给UI管理器
   * ✅ 已迁移到 modules/ui/ui-manager.js，这里只做转发
   */
  initializeUIEventListeners() {
    console.log(`[${this.pluginName}] 侧边栏模块：委托UI事件监听器初始化给UI管理器`);
    
    // Stage4修复：UI事件监听器已迁移到UI管理器模块
    // 这里通过全局接口调用UI管理器的方法
    if (window.nzWorkflowManager && window.nzWorkflowManager.initializeUIEventListeners) {
      window.nzWorkflowManager.initializeUIEventListeners();
    } else {
      console.log(`[${this.pluginName}] UI管理器尚未初始化，等待后续调用`);
    }
  }

  /**
   * 显示无目录消息 - 委托给UI管理器
   * ✅ 已迁移到 modules/ui/ui-manager.js，这里只做转发
   */
  displayNoDirectoryMessage() {
    console.log(`[${this.pluginName}] 侧边栏模块：委托无目录消息显示给UI管理器`);
    
    // Stage4修复：显示无目录消息已迁移到UI管理器模块
    // 这里通过全局接口调用UI管理器的方法
    if (window.nzWorkflowManager && window.nzWorkflowManager.displayNoDirectoryMessage) {
      window.nzWorkflowManager.displayNoDirectoryMessage();
    } else {
      // 临时回退方案
      const content = document.getElementById('nz-content');
      if (content) {
        content.innerHTML = `
          <div class="empty-state">
            <i class="pi pi-folder-open"></i>
            <p>请先设置默认目录</p>
            <button class="nz-btn nz-btn-primary" onclick="document.getElementById('nz-choose-dir-btn').click()">
              选择目录
            </button>
          </div>
        `;
      }
    }
  }

  /**
   * 更新返回按钮状态 - 委托给UI管理器
   * ✅ 已迁移到 modules/ui/ui-manager.js，这里只做转发
   */
  updateBackButtonState() {
    console.log(`[${this.pluginName}] 侧边栏模块：委托返回按钮状态更新给UI管理器`);
    
    // Stage4修复：返回按钮状态更新已迁移到UI管理器模块
    // 这里通过全局接口调用UI管理器的方法
    if (window.nzWorkflowManager && window.nzWorkflowManager.updateBackButtonState) {
      window.nzWorkflowManager.updateBackButtonState();
    } else {
      // 临时回退方案
      const backBtn = document.getElementById('nz-back-btn');
      if (backBtn && window.nzWorkflowManager) {
        const currentPath = window.nzWorkflowManager.getCurrentPath();
        const defaultDir = window.nzWorkflowManager.getDefaultDirectory();
        
        if (currentPath && defaultDir && currentPath !== defaultDir) {
          backBtn.disabled = false;
          backBtn.classList.remove('disabled');
        } else {
          backBtn.disabled = true;
          backBtn.classList.add('disabled');
        }
      }
    }
  }

  /**
   * 切换浮动管理器 - 模块内实现
   */
  toggleFloatingManager() {
    console.log(`[${this.pluginName}] 切换浮动管理器`);
    
    // 与浮动管理器模块协调
    if (window.nzWorkflowManager && window.nzWorkflowManager.toggleFloatingManager) {
      window.nzWorkflowManager.toggleFloatingManager();
    }
  }

  /**
   * 确保样式已应用 - 临时解决方案
   * TODO: 样式管理应该在UI管理器模块中统一处理
   */
  ensureStyles() {
    if (document.getElementById('nz-manager-styles')) {
      return; // 样式已存在
    }
    
    // 应用基本样式以确保界面可见
    const style = document.createElement('style');
    style.id = 'nz-manager-styles';
    style.textContent = `
      .nz-manager {
        background: rgba(25, 30, 40, 0.95);
        color: #e0f0ff;
        border-radius: 10px;
        padding: 15px;
        margin: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      .nz-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding: 10px;
        background: linear-gradient(135deg, rgba(107, 182, 255, 0.15), rgba(74, 158, 255, 0.08));
        border-radius: 8px;
      }
      .nz-header h2 {
        margin: 0;
        color: #6bb6ff;
      }
      .nz-toolbar-btn {
        background: rgba(107, 182, 255, 0.2);
        border: 1px solid rgba(100, 120, 180, 0.3);
        color: #e0f0ff;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        margin: 0 2px;
      }
      .nz-toolbar-btn:hover {
        background: rgba(107, 182, 255, 0.3);
      }
      .nz-content {
        min-height: 200px;
        padding: 10px;
      }
      .nz-banner-carousel {
        position: relative;
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: 5px;
        margin-bottom: 15px;
        overflow: hidden;
        min-height: 40px;
      }
      .nz-banner-wrapper {
        position: relative;
        width: 100%;
      }
      .nz-banner-slide {
        display: none;
        padding: 10px;
        color: #ffc107;
        animation: fadeIn 0.5s ease-in-out;
      }
      .nz-banner-slide.active {
        display: block;
      }
      .nz-banner-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .nz-banner-icon {
        font-size: 16px;
        flex-shrink: 0;
      }
      .nz-banner-text {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }
      .nz-banner-indicators {
        display: flex;
        justify-content: center;
        gap: 6px;
        padding: 6px;
        background: rgba(0, 0, 0, 0.1);
      }
      .nz-banner-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 193, 7, 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .nz-banner-dot.active {
        background: #ffc107;
        width: 20px;
        border-radius: 3px;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
    console.log(`[${this.pluginName}] 基本样式已应用`);
  }

  /**
   * 注册插件 - 主要入口点
   */
  registerPlugin() {
    if (this.isRegistered) {
      console.log(`[${this.pluginName}] 插件已注册，跳过重复注册`);
      return;
    }
    
    try {
      console.log(`[${this.pluginName}] 开始注册侧边栏模块...`);
      
      // 创建侧边栏标签
      this.createWorkflowManagerTab();
      
      this.isRegistered = true;
      console.log(`[${this.pluginName}] 侧边栏模块注册成功`);
    } catch (error) {
      console.error(`[${this.pluginName}] 侧边栏模块注册失败:`, error);
    }
  }
}

// 导出模块
export { SidebarRegistration };

// 为了向后兼容，也提供默认导出
export default SidebarRegistration;
