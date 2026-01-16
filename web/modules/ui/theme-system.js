// web/modules/ui/theme-system.js
"use strict";

/**
 * 主题系统模块
 * 负责管理插件的主题切换、背景图片应用和ComfyUI主题检测
 * 
 * 功能包括：
 * - ComfyUI主题自动检测
 * - 背景图片智能检测和应用
 * - 主题切换和应用
 * - 主题变化监听
 */
export class ThemeSystem {
  constructor(pluginName) {
    this.pluginName = pluginName;
    
    // ====== 主题管理状态 ======
    this.currentTheme = 'dark'; // 默认暗色主题
    this.isThemeTransitioning = false; // 主题切换状态
    
    // ====== 主题检测缓存 ======
    this.lastThemeDetectionTime = 0;
    this.lastDetectedTheme = null;
    
    // ====== 监听器状态 ======
    this.themeObserver = null;
    this.cssVariableMonitorInterval = null;
    this.lastCSSVariableValues = {};
    
    console.log(`[${this.pluginName}] 主题系统模块已初始化`);
  }
  
  /**
   * 智能背景检测
   * 测试多个可能的背景图片路径，找到可用的路径
   */
  async detectBackgroundImagePath() {
    const possiblePaths = [
      `${window.location.origin}/nz_static/bg.jpg`, // v3.3.3新增：自定义静态文件服务
      'bg.jpg', // 相对路径（测试环境优先）
      './bg.jpg', // 当前目录
      'web/bg.jpg', // web子目录
      '../bg.jpg', // 上级目录
      '../web/bg.jpg', // 相对于上级目录
      './extensions/NZ_workflow_manager/bg.jpg', // 相对扩展路径
      './custom_nodes/NZ_workflow_manager/web/bg.jpg', // 相对自定义节点路径
      'extensions/NZ_workflow_manager/bg.jpg', // 扩展路径（无前导点）
      'extensions/NZ_workflow_manager/web/bg.jpg', // 扩展web目录（无前导点）
      'custom_nodes/NZ_workflow_manager/bg.jpg', // 自定义节点根目录（无前导点）
      'custom_nodes/NZ_workflow_manager/web/bg.jpg' // 自定义节点web目录（无前导点）
    ];

    return new Promise((resolve) => {
      let pathIndex = 0;

      const testPath = () => {
        if (pathIndex >= possiblePaths.length) {
          console.warn(`[${this.pluginName}] ⚠️ 所有背景图片路径都无效，使用CSS渐变背景`);
          console.log(`[${this.pluginName}] 📋 已测试的路径:`, possiblePaths);
          
          // 返回null表示使用CSS渐变背景
          resolve(null);
          return;
        }

        const currentPath = possiblePaths[pathIndex];
        console.log(`[${this.pluginName}] 🔍 正在测试背景图片路径 (${pathIndex + 1}/${possiblePaths.length}): ${currentPath}`);
        
        const img = new Image();
        
        // 缩短超时时间，加快检测速度
        const timeout = setTimeout(() => {
          console.log(`[${this.pluginName}] ⏱️ 路径测试超时: ${currentPath}`);
          pathIndex++;
          testPath();
        }, 1000); // 为自定义端点增加一点时间
        
        img.onload = () => {
          clearTimeout(timeout);
          console.log(`[${this.pluginName}] ✅ 背景图片路径检测成功: ${currentPath}`);
          console.log(`[${this.pluginName}] 📊 图片尺寸: ${img.naturalWidth}x${img.naturalHeight}`);
          resolve(currentPath);
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          console.log(`[${this.pluginName}] ❌ 背景图片路径测试失败: ${currentPath}`);
          pathIndex++;
          testPath();
        };
        
        img.src = currentPath;
      };

      testPath();
    });
  }
  
  /**
   * 应用背景图片
   * 检测背景图片路径并应用到界面
   */
  async applyBackgroundImage() {
    try {
      console.log(`[${this.pluginName}] 🎨 开始应用背景图片...`);
      const bgPath = await this.detectBackgroundImagePath();
      console.log(`[${this.pluginName}] ✅ 使用背景图片路径: ${bgPath}`);
      
      // 移除现有的背景样式
      const existingStyle = document.getElementById('nz-bg-style');
      if (existingStyle) {
        existingStyle.remove();
        console.log(`[${this.pluginName}] 🗑️ 已移除现有背景样式`);
      }
      
      // 动态更新CSS中的背景图片路径
      const style = document.createElement('style');
      style.id = 'nz-bg-style';
      
      if (bgPath) {
        style.textContent = `
          /* 动态背景图片路径修复 */
          .nz-manager.nz-theme-light .nz-header {
            background:
              linear-gradient(135deg, rgba(52, 152, 219, 0.15), rgba(41, 128, 185, 0.08)),
              url('${bgPath}') !important;
            background-size: 100% 100%, cover !important;
            background-position: 0 0, right top !important;
            background-repeat: no-repeat, no-repeat !important;
          }
          
          .nz-manager.nz-theme-dark .nz-header {
            background:
              linear-gradient(135deg, rgba(107, 182, 255, 0.15), rgba(74, 158, 255, 0.08)),
              url('${bgPath}') !important;
            background-size: 100% 100%, cover !important;
            background-position: 0 0, right top !important;
            background-repeat: no-repeat, no-repeat !important;
          }
          
          .nz-header {
            background:
              linear-gradient(135deg, rgba(107, 182, 255, 0.15), rgba(74, 158, 255, 0.08)),
              url('${bgPath}') !important;
            background-size: 100% 100%, cover !important;
            background-position: 0 0, right top !important;
            background-repeat: no-repeat, no-repeat !important;
          }
        `;
      } else {
        // 使用CSS渐变背景
        style.textContent = `
          /* CSS渐变背景 */
          .nz-manager.nz-theme-light .nz-header {
            background: linear-gradient(135deg, rgba(52, 152, 219, 0.15), rgba(41, 128, 185, 0.08)) !important;
          }
          
          .nz-manager.nz-theme-dark .nz-header {
            background: linear-gradient(135deg, rgba(107, 182, 255, 0.15), rgba(74, 158, 255, 0.08)) !important;
          }
          
          .nz-header {
            background: linear-gradient(135deg, rgba(107, 182, 255, 0.15), rgba(74, 158, 255, 0.08)) !important;
          }
        `;
      }
      
      document.head.appendChild(style);
      
      // 验证样式是否生效
      setTimeout(() => {
        const headers = document.querySelectorAll('.nz-header');
        const managers = document.querySelectorAll('.nz-manager');
        console.log(`[${this.pluginName}] 📊 验证结果: 找到 ${managers.length} 个管理器, ${headers.length} 个头部元素`);
        
        if (managers.length === 0 && headers.length === 0) {
          console.warn(`[${this.pluginName}] ⚠️ 未找到目标元素，背景可能未生效。稍后会重试应用。`);
        } else {
          console.log(`[${this.pluginName}] ✅ 背景图片应用成功`);
        }
      }, 1000);
      
    } catch (error) {
      console.error(`[${this.pluginName}] ❌ 应用背景图片失败:`, error);
    }
  }
  
  /**
   * 检测ComfyUI当前主题
   * 通过多种方法检测ComfyUI的主题设置
   */
  detectComfyUITheme(forceDetect = false) {
    try {
      // 只在非强制检测时进行频率限制，增加缓存时间减少频繁检测
      const now = Date.now();
      if (!forceDetect && now - this.lastThemeDetectionTime < 3000) { // 增加到3秒
        return this.lastDetectedTheme;
      }
      this.lastThemeDetectionTime = now;
      
      // 检查ComfyUI的主题相关元素
      const body = document.body;
      const html = document.documentElement;
      
      // 减少日志输出，只在强制检测时输出
      if (forceDetect) {
        console.log(`[${this.pluginName}] 开始检测ComfyUI主题...`);
      }
      
      // 1. 检查ComfyUI特有的CSS变量（最准确的方法）
      const computedStyle = getComputedStyle(document.documentElement);
      
      // 检查多个ComfyUI主题相关的CSS变量
      const themeVariables = [
        '--comfy-menu-bg',
        '--comfy-input-bg', 
        '--bg-color',
        '--comfy-panel-bg',
        '--primary-bg'
      ];
      
      for (const variable of themeVariables) {
        const value = computedStyle.getPropertyValue(variable).trim();
        if (value) {
          // 减少日志输出，只在强制检测时输出
          if (forceDetect) {
            console.log(`[${this.pluginName}] 检测到CSS变量 ${variable}: ${value}`);
          }
          
          // 分析颜色值来判断主题
          const rgb = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgb) {
            const r = parseInt(rgb[1]);
            const g = parseInt(rgb[2]);
            const b = parseInt(rgb[3]);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const detectedTheme = brightness > 128 ? 'light' : 'dark';
            if (forceDetect) {
              console.log(`[${this.pluginName}] 通过${variable}检测到主题: ${detectedTheme} (亮度: ${brightness})`);
            }
            this.lastDetectedTheme = detectedTheme;
            return detectedTheme;
          }
          
          // 检查十六进制颜色值
          const hex = value.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/);
          if (hex) {
            const hexColor = hex[1];
            let r, g, b;
            if (hexColor.length === 3) {
              r = parseInt(hexColor[0] + hexColor[0], 16);
              g = parseInt(hexColor[1] + hexColor[1], 16);
              b = parseInt(hexColor[2] + hexColor[2], 16);
            } else {
              r = parseInt(hexColor.substr(0, 2), 16);
              g = parseInt(hexColor.substr(2, 2), 16);
              b = parseInt(hexColor.substr(4, 2), 16);
            }
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const detectedTheme = brightness > 128 ? 'light' : 'dark';
            if (forceDetect) {
              console.log(`[${this.pluginName}] 通过${variable}检测到主题: ${detectedTheme} (十六进制亮度: ${brightness})`);
            }
            this.lastDetectedTheme = detectedTheme;
            return detectedTheme;
          }
        }
      }
      
      // 2. 检查ComfyUI主题按钮状态
      const themeButtons = document.querySelectorAll('button');
      for (const button of themeButtons) {
        const buttonText = button.textContent || button.innerText || '';
        const buttonTitle = button.title || '';
        
        // 检查是否是主题按钮并获取其状态
        if (buttonText.includes('深色') || buttonText.includes('Dark') || 
            buttonTitle.includes('深色') || buttonTitle.includes('Dark')) {
          // 如果按钮显示"深色"，说明当前是浅色主题
          console.log(`[${this.pluginName}] 通过主题按钮检测到浅色主题`);
          this.lastDetectedTheme = 'light';
          return 'light';
        }
        
        if (buttonText.includes('浅色') || buttonText.includes('Light') || 
            buttonTitle.includes('浅色') || buttonTitle.includes('Light')) {
          // 如果按钮显示"浅色"，说明当前是深色主题
          console.log(`[${this.pluginName}] 通过主题按钮检测到深色主题`);
          this.lastDetectedTheme = 'dark';
          return 'dark';
        }
      }
      
      // 3. 检查body的背景色
      const bodyBgColor = computedStyle.getPropertyValue('background-color');
      if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
        const rgb = bodyBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgb) {
          const r = parseInt(rgb[1]);
          const g = parseInt(rgb[2]);
          const b = parseInt(rgb[3]);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const detectedTheme = brightness > 128 ? 'light' : 'dark';
          if (forceDetect) {
            console.log(`[${this.pluginName}] 通过body背景色检测到主题: ${detectedTheme} (背景亮度: ${brightness})`);
          }
          this.lastDetectedTheme = detectedTheme;
          return detectedTheme;
        }
      }
      
      // 4. 检查类名（备用方法）
      if (body.classList.contains('dark') || html.classList.contains('dark') ||
          body.classList.contains('dark-theme') || html.classList.contains('dark-theme')) {
        console.log(`[${this.pluginName}] 通过CSS类名检测到深色主题`);
        this.lastDetectedTheme = 'dark';
        return 'dark';
      }
      
      if (body.classList.contains('light') || html.classList.contains('light') ||
          body.classList.contains('light-theme') || html.classList.contains('light-theme')) {
        console.log(`[${this.pluginName}] 通过CSS类名检测到浅色主题`);
        this.lastDetectedTheme = 'light';
        return 'light';
      }
      
      console.log(`[${this.pluginName}] 无法检测到明确的主题信息，使用默认深色主题`);
      this.lastDetectedTheme = 'dark';
      return 'dark'; // 默认使用深色主题
      
    } catch (error) {
      console.error(`[${this.pluginName}] 检测ComfyUI主题失败:`, error);
      this.lastDetectedTheme = 'dark';
      return 'dark'; // 出错时使用默认主题
    }
  }
  
  /**
   * 应用主题
   * 将主题应用到界面元素
   */
  applyTheme(theme) {
    if (this.isThemeTransitioning) {
      console.log(`[${this.pluginName}] 主题切换中，跳过重复操作`);
      return;
    }
    
    try {
      this.isThemeTransitioning = true;
      this.currentTheme = theme;
      console.log(`[${this.pluginName}] 应用主题: ${theme}`);
      
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
        
        console.log(`[${this.pluginName}] 主界面管理器主题应用完成: ${theme}`);
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
        
        console.log(`[${this.pluginName}] 浮动管理器主题应用完成: ${theme}`);
      }
      
      // 3. 保存主题设置
      localStorage.setItem('nz_theme', theme);
      console.log(`[${this.pluginName}] 主题设置已保存: ${theme}`);
      
      // 重置切换状态
      setTimeout(() => {
        this.isThemeTransitioning = false;
      }, 300);
      
    } catch (error) {
      console.error(`[${this.pluginName}] 应用主题失败:`, error);
      this.isThemeTransitioning = false;
    }
  }
  
  /**
   * 初始化主题设置
   * 从localStorage加载主题设置并应用
   */
  initializeTheme() {
    try {
      // 从localStorage加载主题设置
      const savedTheme = localStorage.getItem('nz_theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        this.currentTheme = savedTheme;
        console.log(`[${this.pluginName}] 已加载主题设置: ${this.currentTheme}`);
      } else {
        // 尝试检测ComfyUI当前主题
        const comfyTheme = this.detectComfyUITheme();
        if (comfyTheme) {
          this.currentTheme = comfyTheme;
          console.log(`[${this.pluginName}] 检测到ComfyUI主题: ${this.currentTheme}`);
        } else {
          console.log(`[${this.pluginName}] 使用默认暗色主题`);
        }
      }
      
      // 应用主题
      this.applyTheme(this.currentTheme);
      
      // 设置主题变化监听器
      this.setupThemeChangeListener();
    } catch (error) {
      console.error(`[${this.pluginName}] 初始化主题失败:`, error);
      // 使用默认主题
      this.applyTheme('dark');
    }
  }
  
  /**
   * 设置主题变化监听器
   * 监听ComfyUI主题变化并自动应用
   */
  setupThemeChangeListener() {
    try {
      // 1. 监听DOM变化（CSS变量、类名、样式等）
      this.themeObserver = new MutationObserver((mutations) => {
        let shouldCheckTheme = false;
        
        mutations.forEach((mutation) => {
          // 监听新添加的主题按钮
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const buttons = node.querySelectorAll ? node.querySelectorAll('button') : [];
                buttons.forEach(button => {
                  const text = button.textContent || button.innerText || '';
                  const title = button.title || '';
                  if (text.includes('主题') || text.includes('Theme') || text.includes('深色') || text.includes('浅色') ||
                      text.includes('Dark') || text.includes('Light') || 
                      title.includes('主题') || title.includes('Theme')) {
                    this.addThemeButtonListener(button);
                  }
                });
              }
            });
          }
          
          // 监听属性变化（如style、class等）
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
            shouldCheckTheme = true;
          }
        });
        
        if (shouldCheckTheme) {
          // 防抖处理，避免频繁检测
          clearTimeout(window.nzThemeCheckTimeout);
          window.nzThemeCheckTimeout = setTimeout(() => {
            const newTheme = this.detectComfyUITheme(true); // 强制检测
            if (newTheme && newTheme !== this.currentTheme) {
              console.log(`[${this.pluginName}] 通过DOM变化检测到主题变化: ${this.currentTheme} -> ${newTheme}`);
              this.applyTheme(newTheme);
            }
          }, 100); // 减少延迟到100ms
        }
      });
      
      // 观察DOM变化，包括属性变化
      this.themeObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      // 2. 为现有的主题按钮添加监听器
      this.addExistingThemeButtonListeners();
      
      // 3. 启动CSS变量监听器
      this.startCSSVariableMonitor();
      
      console.log(`[${this.pluginName}] 主题变化监听器已启动`);
      
    } catch (error) {
      console.error(`[${this.pluginName}] 设置主题变化监听器失败:`, error);
    }
  }
  
  /**
   * 为现有的主题按钮添加监听器
   */
  addExistingThemeButtonListeners() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const text = button.textContent || button.innerText || '';
      const title = button.title || '';
      if (text.includes('主题') || text.includes('Theme') || text.includes('深色') || text.includes('浅色') ||
          text.includes('Dark') || text.includes('Light') || 
          title.includes('主题') || title.includes('Theme')) {
        this.addThemeButtonListener(button);
      }
    });
  }
  
  /**
   * 为主题按钮添加点击监听器
   */
  addThemeButtonListener(button) {
    // 避免重复添加监听器
    if (button.hasNZThemeListener) {
      return;
    }
    button.hasNZThemeListener = true;
    
    button.addEventListener('click', () => {
      console.log(`[${this.pluginName}] 检测到主题按钮点击:`, button.textContent || button.title);
      
      // 延迟检测主题变化，给ComfyUI时间更新UI
      clearTimeout(window.nzThemeButtonTimeout);
      window.nzThemeButtonTimeout = setTimeout(() => {
        const newTheme = this.detectComfyUITheme(true); // 强制检测
        if (newTheme && newTheme !== this.currentTheme) {
          console.log(`[${this.pluginName}] 主题按钮点击后检测到主题变化: ${this.currentTheme} -> ${newTheme}`);
          this.applyTheme(newTheme);
        }
      }, 100); // 减少延迟到100ms
    });
    
    console.log(`[${this.pluginName}] 已为主题按钮添加监听器:`, button);
  }
  
  /**
   * 启动CSS变量监听器
   */
  startCSSVariableMonitor() {
    // 更新CSS变量缓存
    const updateCSSVariableCache = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const variables = ['--comfy-menu-bg', '--comfy-input-bg', '--bg-color', '--comfy-panel-bg', '--primary-bg'];
      
      variables.forEach(variable => {
        this.lastCSSVariableValues[variable] = computedStyle.getPropertyValue(variable).trim();
      });
    };
    
    // 初始化缓存
    updateCSSVariableCache();
    
    // 定期检查CSS变量变化
    this.cssVariableMonitorInterval = setInterval(() => {
      try {
        const computedStyle = getComputedStyle(document.documentElement);
        const variables = ['--comfy-menu-bg', '--comfy-input-bg', '--bg-color', '--comfy-panel-bg', '--primary-bg'];
        
        let hasChanged = false;
        variables.forEach(variable => {
          const currentValue = computedStyle.getPropertyValue(variable).trim();
          if (currentValue !== this.lastCSSVariableValues[variable]) {
            hasChanged = true;
          }
        });
        
        if (hasChanged) {
          console.log(`[${this.pluginName}] 检测到CSS变量变化，触发主题检测`);
          const newTheme = this.detectComfyUITheme(true);
          if (newTheme && newTheme !== this.currentTheme) {
            console.log(`[${this.pluginName}] 通过CSS变量变化检测到主题变化: ${this.currentTheme} -> ${newTheme}`);
            this.applyTheme(newTheme);
          }
          updateCSSVariableCache(); // 更新缓存
        }
      } catch (error) {
        console.warn(`[${this.pluginName}] CSS变量监听器检查失败:`, error);
      }
    }, 5000); // 改为5秒检查一次，进一步降低频率
    
    console.log(`[${this.pluginName}] CSS变量监听器已启动`);
  }
  
  /**
   * 获取当前主题
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * 初始化默认设置
   */
  initializeDefaultSettings() {
    try {
      // 确保显示缩略图和浮动管理器功能默认开启
      const savedSettings = localStorage.getItem('nz_settings');
      if (!savedSettings) {
        const defaultSettings = {
          theme: 'auto',
          showThumbnails: true,      // 默认开启缩略图
          floatingManager: true      // 默认开启浮动管理器
        };
        localStorage.setItem('nz_settings', JSON.stringify(defaultSettings));
        console.log(`[${this.pluginName}] 已设置默认功能配置:`, defaultSettings);
      }
    } catch (error) {
      console.error(`[${this.pluginName}] 初始化默认设置失败:`, error);
    }
  }
  
  /**
   * 销毁主题系统
   * 清理所有监听器和定时器
   */
  destroy() {
    try {
      // 停止主题观察器
      if (this.themeObserver) {
        this.themeObserver.disconnect();
        this.themeObserver = null;
      }
      
      // 停止CSS变量监听器
      if (this.cssVariableMonitorInterval) {
        clearInterval(this.cssVariableMonitorInterval);
        this.cssVariableMonitorInterval = null;
      }
      
      // 清理超时器
      if (window.nzThemeCheckTimeout) {
        clearTimeout(window.nzThemeCheckTimeout);
        window.nzThemeCheckTimeout = null;
      }
      
      if (window.nzThemeButtonTimeout) {
        clearTimeout(window.nzThemeButtonTimeout);
        window.nzThemeButtonTimeout = null;
      }
      
      console.log(`[${this.pluginName}] 主题系统已销毁`);
    } catch (error) {
      console.error(`[${this.pluginName}] 销毁主题系统失败:`, error);
    }
  }
}

