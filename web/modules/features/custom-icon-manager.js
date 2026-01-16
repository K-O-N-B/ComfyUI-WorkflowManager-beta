// web/modules/features/custom-icon-manager.js
"use strict";

/**
 * 自定义图标管理器模块
 * 负责工作流文件的自定义图标管理功能
 * 
 * 功能包括：
 * - 自定义图标的创建、读取、更新、删除
 * - 图片上传和压缩处理
 * - 预设图标生成
 * - 图标选择对话框
 * - 图标应用和显示
 */
export class CustomIconManager {
  static ICON_TYPES = {
    UPLOADED: 'uploaded',        // 用户上传的图片
    WORKFLOW_IMAGE: 'workflow',  // 工作流内的图片
    GENERATED: 'generated',      // 自动生成的预览图
    DEFAULT: 'default'           // 默认图标
  };
  
  static STORAGE_KEY = 'nz_custom_icons';
  static MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB localStorage 限制

  constructor(config, uiManager) {
    this.config = config;
    this.uiManager = uiManager;
    this.pluginName = config.PLUGIN_NAME;
    
    console.log(`[${this.pluginName}] 自定义图标管理器模块已初始化`);
  }
  
  /**
   * 获取所有自定义图标数据
   */
  getAllCustomIcons() {
    try {
      const data = localStorage.getItem(CustomIconManager.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error(`[${this.pluginName}] 读取自定义图标数据失败:`, error);
      return {};
    }
  }
  
  /**
   * 保存所有自定义图标数据
   */
  saveAllCustomIcons(data) {
    try {
      const jsonData = JSON.stringify(data);
      if (jsonData.length > CustomIconManager.MAX_STORAGE_SIZE) {
        throw new Error('存储空间不足，请删除一些自定义图标');
      }
      localStorage.setItem(CustomIconManager.STORAGE_KEY, jsonData);
      return true;
    } catch (error) {
      console.error(`[${this.pluginName}] 保存自定义图标数据失败:`, error);
      this.uiManager.showNotification(`保存图标失败: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * 设置自定义图标
   */
  setCustomIcon(filePath, iconData, iconType = CustomIconManager.ICON_TYPES.UPLOADED, metadata = {}) {
    console.log(`[${this.pluginName}] 设置自定义图标: ${filePath}`);
    
    const icons = this.getAllCustomIcons();
    icons[filePath] = {
      iconData: iconData,
      iconType: iconType,
      createdAt: new Date().toISOString(),
      ...metadata
    };
    
    return this.saveAllCustomIcons(icons);
  }
  
  /**
   * 获取自定义图标
   */
  getCustomIcon(filePath) {
    const icons = this.getAllCustomIcons();
    return icons[filePath] || null;
  }
  
  /**
   * 移除自定义图标
   */
  removeCustomIcon(filePath) {
    console.log(`[${this.pluginName}] 移除自定义图标: ${filePath}`);
    
    const icons = this.getAllCustomIcons();
    if (icons[filePath]) {
      delete icons[filePath];
      this.saveAllCustomIcons(icons);
      return true;
    }
    return false;
  }
  
  /**
   * 压缩图片数据
   */
  compressImage(file, maxWidth = 100, maxHeight = 100, quality = 0.8) {
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
  
  /**
   * 生成图标数据URL
   */
  generateIconDataURL(iconChar, size = 100) {
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
  
  /**
   * 应用自定义图标到文件项
   */
  applyCustomIconToFileItem(fileItem, filePath) {
    const customIcon = this.getCustomIcon(filePath);
    if (!customIcon) return false;
    
    const thumbnailContainer = fileItem.querySelector('.nz-file-item-thumbnail');
    if (!thumbnailContainer) return false;
    
    // 获取当前主题
    // TODO: Stage8_CLEANUP - 这里需要通过模块获取主题信息
    const currentTheme = this.config.getCurrentTheme ? this.config.getCurrentTheme() : 'dark';
    
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
    
    this.applyForceStyles(thumbnailContainer, customIcon.iconData);
    
    return true;
  }
  
  /**
   * 应用强制样式确保图标正确显示
   */
  applyForceStyles(thumbnailContainer, iconData) {
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
      
      // 强制重新计算布局
      customImg.offsetHeight;
      thumbnailContainer.offsetHeight;
      
      this.applyEdgeAlignment(thumbnailContainer, customImg, forceStyles, containerForceStyles);
    }
    
    if (customBadge) {
      customBadge.style.cssText = 'position: absolute !important; bottom: 1px !important; left: 1px !important; width: 8px !important; height: 8px !important; background: #007acc !important; border-radius: 50% !important; border: 1px solid #fff !important; z-index: 10 !important; box-sizing: border-box !important;';
    }
  }
  
  /**
   * 应用边缘对齐处理
   */
  applyEdgeAlignment(thumbnailContainer, customImg, forceStyles, containerForceStyles) {
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
      
      // 获取当前主题
      const currentTheme = this.config.getCurrentTheme ? this.config.getCurrentTheme() : 'dark';
      
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
    
    // 延迟应用确保DOM更新
    setTimeout(forceEdgeAlignment, 50);
  }
  
  /**
   * 显示图标选择对话框
   */
  showIconSelectorDialog(filePath, fileName) {
    console.log(`[${this.pluginName}] 显示图标选择对话框: ${fileName}`);
    
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
    
    dialog.innerHTML = this.generateDialogHTML(fileName, currentIcon, currentIconSrc);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    this.setupDialogEvents(dialog, filePath, fileName, overlay);
  }
  
  /**
   * 生成对话框HTML内容
   */
  generateDialogHTML(fileName, currentIcon, currentIconSrc) {
    return `
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
            background: rgba(255,255,255,0.02);
          ">
            <div style="font-size: 48px; margin-bottom: 10px; color: #666;">📁</div>
            <div style="color: #ccc; margin-bottom: 10px;">点击或拖拽上传图片</div>
            <div style="color: #888; font-size: 12px;">支持 JPG、PNG、GIF 格式，文件大小不超过 2MB</div>
            <input type="file" accept="image/*" style="display: none;" class="nz-file-input">
          </div>
        </div>
        
        <!-- 预设图标区域 -->
        <div class="nz-tab-content" data-tab="preset" style="display: none;">
          <div class="nz-preset-icons" style="
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); 
            gap: 10px; 
            max-height: 300px; 
            overflow-y: auto;
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
        <button class="nz-dialog-cancel" style="
          padding: 10px 20px;
          background: #666;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">取消</button>
        <button class="nz-dialog-reset" style="
          padding: 10px 20px;
          background: #e74c3c;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">重置</button>
        <button class="nz-dialog-apply" style="
          padding: 10px 20px;
          background: #666;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          opacity: 0.5;
        " disabled>应用</button>
      </div>
    `;
  }
  
  /**
   * 生成预设图标HTML
   */
  generatePresetIconsHTML() {
    const presetIcons = [
      '📄', '📊', '🎨', '⚙️', '🔧', '📱', '💻', '🎵', '🎬', '📷',
      '🔥', '⭐', '❤️', '💡', '🚀', '🎯', '📈', '🔒', '🌟', '💎',
      '🎪', '🎨', '🎭', '🎪', '🎨', '🎯', '🎲', '🎸', '🎤', '🎧'
    ];
    
    return presetIcons.map(icon => `
      <div class="nz-preset-icon" data-icon="${icon}" style="
        width: 50px; 
        height: 50px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: #444; 
        border-radius: 8px; 
        cursor: pointer; 
        font-size: 24px; 
        border: 2px solid transparent; 
        transition: all 0.2s ease;
      " 
      onmouseover="this.style.background='#555'" 
      onmouseout="this.style.background='#444'">${icon}</div>
    `).join('');
  }
  
  /**
   * 设置对话框事件监听器
   */
  setupDialogEvents(dialog, filePath, fileName, overlay) {
    let selectedIconData = null;
    let selectedIconType = null;
    
    // 获取元素
    const tabs = dialog.querySelectorAll('.nz-tab');
    const tabContents = dialog.querySelectorAll('.nz-tab-content');
    const uploadArea = dialog.querySelector('.nz-upload-area');
    const fileInput = dialog.querySelector('.nz-file-input');
    const presetIcons = dialog.querySelectorAll('.nz-preset-icon');
    const applyBtn = dialog.querySelector('.nz-dialog-apply');
    
    // 标签切换
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // 切换标签状态
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = '#888';
        });
        tab.classList.add('active');
        tab.style.borderBottomColor = '#007acc';
        tab.style.color = '#ccc';
        
        // 切换内容
        const targetTab = tab.getAttribute('data-tab');
        tabContents.forEach(content => {
          content.style.display = content.getAttribute('data-tab') === targetTab ? 'block' : 'none';
        });
      });
    });
    
    // 文件上传
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#007acc';
      uploadArea.style.background = 'rgba(0, 122, 204, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#666';
      uploadArea.style.background = 'rgba(255,255,255,0.02)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#666';
      uploadArea.style.background = 'rgba(255,255,255,0.02)';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0], dialog, (data) => {
          selectedIconData = data;
          selectedIconType = CustomIconManager.ICON_TYPES.UPLOADED;
          applyBtn.disabled = false;
          applyBtn.style.opacity = '1';
        });
      }
    });
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileUpload(file, dialog, (data) => {
          selectedIconData = data;
          selectedIconType = CustomIconManager.ICON_TYPES.UPLOADED;
          applyBtn.disabled = false;
          applyBtn.style.opacity = '1';
        });
      }
    });
    
    // 预设图标选择
    presetIcons.forEach(iconEl => {
      iconEl.addEventListener('click', () => {
        // 清除其他选中状态
        presetIcons.forEach(el => {
          el.style.borderColor = 'transparent';
          el.style.background = '#444';
        });
        
        // 设置当前选中
        iconEl.style.borderColor = '#007acc';
        iconEl.style.background = 'rgba(0, 122, 204, 0.2)';
        
        // 生成图标数据
        const iconChar = iconEl.getAttribute('data-icon');
        selectedIconData = this.generateIconDataURL(iconChar);
        selectedIconType = CustomIconManager.ICON_TYPES.GENERATED;
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
      this.uiManager.showNotification(`已重置 ${fileName} 的图标`, 'success');
      this.closeDialog();
      
      // 刷新当前目录
      this.refreshCurrentDirectory();
    });
    
    applyBtn.addEventListener('click', () => {
      if (selectedIconData && selectedIconType) {
        const success = this.setCustomIcon(filePath, selectedIconData, selectedIconType, {
          fileName: fileName
        });
        
        if (success) {
          this.uiManager.showNotification(`已设置 ${fileName} 的自定义图标`, 'success');
          this.closeDialog();
          
          // 🔄 自动刷新当前目录以显示新图标
          this.refreshCurrentDirectory();
        }
      }
    });
    
    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeDialog();
      }
    });
  }
  
  /**
   * 处理文件上传
   */
  handleFileUpload(file, dialog, callback) {
    // 检查文件大小
    if (file.size > 2 * 1024 * 1024) { // 2MB
      this.uiManager.showNotification('图片文件过大，请选择小于2MB的图片', 'error');
      return;
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      this.uiManager.showNotification('请选择图片文件', 'error');
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
        console.error(`[${this.pluginName}] 图片处理失败:`, error);
        this.uiManager.showNotification('图片处理失败，请重试', 'error');
      });
  }
  
  /**
   * 刷新当前目录
   */
  refreshCurrentDirectory() {
    const currentPath = this.config.getCurrentPath();
    if (currentPath && typeof window.loadDirectory === 'function') {
      console.log(`[${this.pluginName}] 自定义图标操作完成，刷新目录: ${currentPath}`);
      window.loadDirectory(currentPath);
    } else if (currentPath && typeof loadDirectory === 'function') {
      console.log(`[${this.pluginName}] 自定义图标操作完成，刷新目录: ${currentPath}`);
      loadDirectory(currentPath);
    } else {
      console.warn(`[${this.pluginName}] 无法刷新目录，loadDirectory函数或当前路径不可用`);
    }
  }
  
  /**
   * 关闭对话框
   */
  closeDialog() {
    const overlay = document.querySelector('.nz-dialog-overlay');
    if (overlay) {
      overlay.remove();
    }
    // TODO: Stage8_CLEANUP - 这里的dialogManager需要明确
    if (window.dialogManager) {
      window.dialogManager.currentDialog = null;
    }
  }
  
  /**
   * 测试自定义图标功能
   */
  testCustomIconFeature() {
    console.log('=== 测试自定义图标功能 ===');
    
    console.log('✅ CustomIconManager 已加载');
    
    // 检查存储功能
    try {
      const testData = this.getAllCustomIcons();
      console.log('✅ 存储功能正常，当前自定义图标数量:', Object.keys(testData).length);
    } catch (error) {
      console.error('❌ 存储功能异常:', error);
      return false;
    }
    
    // 检查图标生成功能
    try {
      const testIconData = this.generateIconDataURL('🔥');
      console.log('✅ 图标生成功能正常，生成数据长度:', testIconData.length);
    } catch (error) {
      console.error('❌ 图标生成功能异常:', error);
      return false;
    }
    
    console.log('✅ 所有自定义图标功能测试通过');
    return true;
  }
}

/**
 * 全局函数包装器 - 提供向后兼容性
 * TODO: Stage8_CLEANUP - 在模块化完成后这些全局函数可以被移除
 */

// 存储模块实例的全局变量
let customIconManagerInstance = null;

/**
 * 设置模块实例
 * @param {CustomIconManager} instance - 模块实例
 */
export function setCustomIconManagerInstance(instance) {
  customIconManagerInstance = instance;
  
  // 为了向后兼容，将一些方法设置为全局可用
  window.CustomIconManager = {
    ICON_TYPES: CustomIconManager.ICON_TYPES,
    STORAGE_KEY: CustomIconManager.STORAGE_KEY,
    MAX_STORAGE_SIZE: CustomIconManager.MAX_STORAGE_SIZE,
    
    // 静态方法包装器
    getAllCustomIcons: () => customIconManagerInstance ? customIconManagerInstance.getAllCustomIcons() : {},
    saveAllCustomIcons: (data) => customIconManagerInstance ? customIconManagerInstance.saveAllCustomIcons(data) : false,
    setCustomIcon: (filePath, iconData, iconType, metadata) => 
      customIconManagerInstance ? customIconManagerInstance.setCustomIcon(filePath, iconData, iconType, metadata) : false,
    getCustomIcon: (filePath) => customIconManagerInstance ? customIconManagerInstance.getCustomIcon(filePath) : null,
    removeCustomIcon: (filePath) => customIconManagerInstance ? customIconManagerInstance.removeCustomIcon(filePath) : false,
    compressImage: (file, maxWidth, maxHeight, quality) => 
      customIconManagerInstance ? customIconManagerInstance.compressImage(file, maxWidth, maxHeight, quality) : Promise.reject('Instance not available'),
    generateIconDataURL: (iconChar, size) => 
      customIconManagerInstance ? customIconManagerInstance.generateIconDataURL(iconChar, size) : '',
    applyCustomIconToFileItem: (fileItem, filePath) => 
      customIconManagerInstance ? customIconManagerInstance.applyCustomIconToFileItem(fileItem, filePath) : false,
    showIconSelectorDialog: (filePath, fileName) => {
      if (customIconManagerInstance) {
        customIconManagerInstance.showIconSelectorDialog(filePath, fileName);
      }
    },
    handleFileUpload: (file, dialog, callback) => {
      if (customIconManagerInstance) {
        customIconManagerInstance.handleFileUpload(file, dialog, callback);
      }
    },
    closeDialog: () => {
      if (customIconManagerInstance) {
        customIconManagerInstance.closeDialog();
      }
    }
  };
  
  // 添加到 nzWorkflowManager
  if (window.nzWorkflowManager) {
    window.nzWorkflowManager.CustomIconManager = window.CustomIconManager;
  }
  
  // 测试函数
  window.nzTestCustomIcon = () => {
    return customIconManagerInstance ? customIconManagerInstance.testCustomIconFeature() : false;
  };
}
