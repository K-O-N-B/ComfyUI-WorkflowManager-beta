/**
 * NZ工作流管理器 - 工作流加载器模块
 * 
 * 功能：
 * - 工作流文件加载
 * - 工作流格式验证和修复
 * - 工作流数据处理
 * 
 * 第五阶段模块化完成
 */

class WorkflowLoader {
  constructor(pluginName) {
    this.pluginName = pluginName;
    
    console.log(`[${this.pluginName}] 工作流加载器模块已初始化`);
  }

  // ====== 工作流文件加载功能 ======

  /**
   * 统一工作流文件加载器
   * @param {string} filePath - 文件路径
   * @returns {Promise} 工作流数据
   */
  loadWorkflowFile(filePath) {
    console.log(`[${this.pluginName}] 开始加载工作流文件: ${filePath}`);
    
    return new Promise((resolve, reject) => {
      // 方法1: 先尝试HTTP端点（最直接）
      this.loadWorkflowUsingHTTP(filePath)
        .then(result => {
          console.log(`[${this.pluginName}] HTTP读取成功`);
          resolve(result);
        })
        .catch(httpError => {
          console.log(`[${this.pluginName}] HTTP失败，尝试WebSocket:`, httpError.message);
          
          // 方法2: 尝试WebSocket
          this.loadWorkflowUsingWebSocket(filePath)
            .then(result => {
              console.log(`[${this.pluginName}] WebSocket读取成功`);
              resolve(result);
            })
            .catch(wsError => {
              console.log(`[${this.pluginName}] WebSocket失败，尝试节点系统:`, wsError.message);
              
              // 方法3: 尝试节点系统
              this.loadWorkflowUsingNode(filePath)
                .then(result => {
                  console.log(`[${this.pluginName}] 节点系统读取成功`);
                  resolve(result);
                })
                .catch(nodeError => {
                  console.error(`[${this.pluginName}] 所有文件读取方法都失败`);
                  reject(new Error(`无法读取文件: ${nodeError.message}`));
                });
            });
        });
    });
  }

  /**
   * 使用HTTP端点读取工作流文件
   * @param {string} filePath - 文件路径
   * @returns {Promise} 工作流数据
   */
  loadWorkflowUsingHTTP(filePath) {
    return new Promise((resolve, reject) => {
      console.log(`[${this.pluginName}] 使用HTTP端点读取工作流文件: ${filePath}`);
      
      try {
        // 使用自定义的文件读取端点
        const params = new URLSearchParams({
          path: filePath,
          action: 'load_workflow'
        });
        
        const url = `${window.location.origin}/local_files?${params.toString()}`;
        console.log(`[${this.pluginName}] 请求URL:`, url);
        
        fetch(url)
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          })
          .then(data => {
            console.log(`[${this.pluginName}] HTTP响应数据:`, data);
            
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
            console.error(`[${this.pluginName}] HTTP读取失败:`, error);
            reject(error);
          });
      } catch (error) {
        reject(new Error(`HTTP请求失败: ${error.message}`));
      }
    });
  }

  /**
   * 使用WebSocket加载工作流文件
   * @param {string} filePath - 文件路径
   * @returns {Promise} 工作流数据
   */
  loadWorkflowUsingWebSocket(filePath) {
    return new Promise((resolve, reject) => {
      console.log(`[${this.pluginName}] 使用WebSocket读取文件: ${filePath}`);
      
      try {
        // 检查WebSocket是否可用
        const socket = this.getAvailableWebSocket();
        console.log(`[${this.pluginName}] WebSocket连接检查: socket=${socket ? '存在' : '不存在'}, readyState=${socket?.readyState}`);
        if (!socket) {
          reject(new Error('WebSocket不可用'));
          return;
        }
        
        console.log(`[${this.pluginName}] 使用ComfyUI WebSocket发送文件读取消息`);
        
        // 创建WebSocket消息
        const message = {
          type: "nz_workflow_manager",
          action: "load_workflow",
          path: filePath
        };
        
        // 设置响应监听器
        const messageHandler = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log(`[${this.pluginName}] WebSocket响应:`, response);
            
            if (response.type === "nz_workflow_manager" && response.action === "load_workflow") {
              socket.removeEventListener('message', messageHandler);
              
              if (response.error) {
                reject(new Error(response.error));
              } else if (response.data) {
                resolve(response.data);
              } else {
                reject(new Error('WebSocket响应中没有工作流数据'));
              }
            }
          } catch (error) {
            socket.removeEventListener('message', messageHandler);
            reject(new Error(`WebSocket响应解析失败: ${error.message}`));
          }
        };
        
        socket.addEventListener('message', messageHandler);
        
        // 发送WebSocket消息
        socket.send(JSON.stringify(message));
        console.log(`[${this.pluginName}] WebSocket消息已发送:`, message);
        
        // 设置超时
        setTimeout(() => {
          socket.removeEventListener('message', messageHandler);
          reject(new Error('WebSocket响应超时'));
        }, 10000);
        
      } catch (error) {
        reject(new Error(`WebSocket请求失败: ${error.message}`));
      }
    });
  }

  /**
   * 使用节点系统读取文件
   * @param {string} filePath - 文件路径
   * @returns {Promise} 工作流数据
   */
  loadWorkflowUsingNode(filePath) {
    return new Promise((resolve, reject) => {
      console.log(`[${this.pluginName}] 使用节点系统读取文件: ${filePath}`);
      
      try {
        // 创建一个临时的工作流来执行文件读取操作
        const nodeWorkflow = {
          "1": {
            "class_type": "LoadWorkflowFile",
            "inputs": {
              "file_path": filePath
            }
          }
        };
        
        // 检查ComfyUI API是否可用
        if (!app || !app.queuePrompt) {
          reject(new Error('ComfyUI应用不可用'));
          return;
        }
        
        // 执行工作流
        app.queuePrompt(0, nodeWorkflow)
          .then(result => {
            console.log(`[${this.pluginName}] 节点系统执行结果:`, result);
            // 这里需要根据实际的ComfyUI节点返回格式来解析结果
            // 由于这是一个高级功能，暂时返回错误让其使用其他方法
            reject(new Error('节点系统文件读取暂未实现'));
          })
          .catch(error => {
            reject(new Error(`节点系统执行失败: ${error.message}`));
          });
          
      } catch (error) {
        reject(new Error(`节点系统请求失败: ${error.message}`));
      }
    });
  }

  /**
   * 加载工作流到ComfyUI
   * @param {string} filePath - 工作流文件路径
   */
  loadWorkflow(filePath) {
    console.log(`[${this.pluginName}] 加载工作流: ${filePath}`);
    
    try {
      // 使用ComfyUI的API加载工作流
      if (typeof app !== 'undefined') {
        this.loadWorkflowFile(filePath)
          .then(workflowData => {
            console.log(`[${this.pluginName}] 工作流数据读取成功，开始验证格式`);
            
            // 验证和修复工作流格式
            const fixedWorkflow = this.validateAndFixWorkflow(workflowData);
            
            if (fixedWorkflow) {
              console.log(`[${this.pluginName}] 工作流格式验证通过，开始加载到ComfyUI`);
              
              // 尝试直接加载工作流
              if (this.tryDirectWorkflowLoad(fixedWorkflow)) {
                // 显示成功消息
                this.displaySuccess(`工作流已成功加载: ${filePath}`);
              } else {
                this.displayError('工作流加载失败，格式可能不兼容');
              }
            } else {
              this.displayError('工作流格式验证失败');
            }
          })
          .catch(error => {
            console.error(`[${this.pluginName}] 工作流加载失败:`, error);
            this.displayError(`工作流加载失败: ${error.message}`);
          });
      } else {
        this.displayError('ComfyUI应用未就绪');
      }
    } catch (error) {
      console.error(`[${this.pluginName}] 工作流加载异常:`, error);
      this.displayError(`工作流加载异常: ${error.message}`);
    }
  }

  // ====== 工作流格式验证和修复 ======

  /**
   * 验证和修复工作流格式
   * @param {Object} workflow - 工作流数据
   * @returns {Object|null} 修复后的工作流或null
   */
  validateAndFixWorkflow(workflow) {
    console.log(`[${this.pluginName}] 开始验证工作流格式`);
    
    try {
      // 检查工作流是否为空或无效
      if (!workflow || typeof workflow !== 'object') {
        console.error(`[${this.pluginName}] 工作流数据为空或格式无效`);
        return null;
      }
      
      // 如果工作流是字符串，尝试解析为JSON
      if (typeof workflow === 'string') {
        try {
          workflow = JSON.parse(workflow);
        } catch (parseError) {
          console.error(`[${this.pluginName}] 工作流JSON解析失败:`, parseError);
          return null;
        }
      }
      
      // 检测工作流格式类型
      if (this.detectOldFormat(workflow)) {
        console.log(`[${this.pluginName}] 检测到旧版工作流格式，直接使用`);
        return workflow;
      } else {
        console.log(`[${this.pluginName}] 检测到新版工作流格式，尝试修复`);
        return this.fixNewFormatWorkflow(workflow);
      }
      
    } catch (error) {
      console.error(`[${this.pluginName}] 工作流验证过程出错:`, error);
      return null;
    }
  }

  /**
   * 检测旧版格式
   * @param {Object} workflow - 工作流数据
   * @returns {boolean} 是否为旧版格式
   */
  detectOldFormat(workflow) {
    // 旧版格式特征：
    // 1. 根级别直接包含数字键的节点对象
    // 2. 节点对象包含 class_type, inputs 等字段
    
    const keys = Object.keys(workflow);
    
    // 检查是否有数字键
    const hasNumericKeys = keys.some(key => !isNaN(parseInt(key)));
    
    if (hasNumericKeys) {
      // 检查第一个数字键对应的对象是否有 class_type 字段
      const firstNumericKey = keys.find(key => !isNaN(parseInt(key)));
      const firstNode = workflow[firstNumericKey];
      
      return firstNode && typeof firstNode === 'object' && firstNode.class_type;
    }
    
    return false;
  }

  /**
   * 修复新版格式工作流
   * @param {Object} workflow - 工作流数据
   * @returns {Object|null} 修复后的工作流
   */
  fixNewFormatWorkflow(workflow) {
    const fixedWorkflow = JSON.parse(JSON.stringify(workflow));
    const fixDetails = [];
    
    try {
      // 新版格式可能的结构：
      // { workflow: {...}, extra: {...}, version: ... }
      // 或者 { nodes: [...], links: [...], ... }
      
      if (workflow.workflow && typeof workflow.workflow === 'object') {
        console.log(`[${this.pluginName}] 发现 workflow 字段，提取内容`);
        const extractedWorkflow = workflow.workflow;
        fixDetails.push('提取了 workflow 字段内容');
        
        // 递归检查提取出的工作流
        if (this.detectOldFormat(extractedWorkflow)) {
          return extractedWorkflow;
        } else {
          return this.fixNewFormatWorkflow(extractedWorkflow);
        }
      }
      
      // 检查是否有 nodes 数组格式
      if (Array.isArray(workflow.nodes)) {
        console.log(`[${this.pluginName}] 发现 nodes 数组格式，尝试转换`);
        
        const convertedWorkflow = {};
        
        workflow.nodes.forEach((node, index) => {
          if (node && typeof node === 'object') {
            // 使用节点ID或索引作为键
            const nodeId = node.id || (index + 1).toString();
            convertedWorkflow[nodeId] = {
              class_type: node.type || node.class_type || 'UnknownNode',
              inputs: node.inputs || node.widgets_values || {}
            };
          }
        });
        
        if (Object.keys(convertedWorkflow).length > 0) {
          fixDetails.push(`从 nodes 数组转换了 ${Object.keys(convertedWorkflow).length} 个节点`);
          return convertedWorkflow;
        }
      }
      
      // 检查是否已经是正确格式但缺少必要字段
      const keys = Object.keys(workflow);
      const numericKeys = keys.filter(key => !isNaN(parseInt(key)));
      
      if (numericKeys.length > 0) {
        console.log(`[${this.pluginName}] 发现数字键，检查节点格式`);
        
        numericKeys.forEach(key => {
          const node = fixedWorkflow[key];
          if (node && typeof node === 'object') {
            // 确保每个节点都有必要的字段
            if (!node.class_type && node.type) {
              node.class_type = node.type;
              fixDetails.push(`节点 ${key}: 从 type 字段复制到 class_type`);
            }
            
            if (!node.inputs) {
              node.inputs = {};
              fixDetails.push(`节点 ${key}: 添加了空的 inputs 对象`);
            }
          }
        });
        
        if (fixDetails.length > 0) {
          console.log(`[${this.pluginName}] 工作流修复完成: ${fixDetails.join(', ')}`);
          return fixedWorkflow;
        }
      }
      
      // 如果无法识别格式，尝试直接使用
      console.log(`[${this.pluginName}] 无法识别工作流格式，尝试直接使用`);
      return workflow;
      
    } catch (error) {
      console.error(`[${this.pluginName}] 工作流修复失败:`, error);
      return null;
    }
  }

  /**
   * 尝试直接加载工作流
   * @param {Object} workflow - 工作流数据
   * @returns {boolean} 加载是否成功
   */
  tryDirectWorkflowLoad(workflow) {
    console.log(`[${this.pluginName}] 尝试直接加载工作流`);
    
    try {
      // 检查ComfyUI应用是否可用
      if (!app) {
        console.error(`[${this.pluginName}] ComfyUI app 对象不可用`);
        return false;
      }
      
      // 尝试使用app.loadGraphData加载工作流
      if (typeof app.loadGraphData === 'function') {
        console.log(`[${this.pluginName}] 使用 app.loadGraphData 加载工作流`);
        app.loadGraphData(workflow);
        return true;
      }
      
      // 尝试使用app.graph.configure加载工作流
      if (app.graph && typeof app.graph.configure === 'function') {
        console.log(`[${this.pluginName}] 使用 app.graph.configure 加载工作流`);
        app.graph.configure(workflow);
        return true;
      }
      
      console.error(`[${this.pluginName}] 没有找到适合的工作流加载方法`);
      return false;
      
    } catch (error) {
      console.error(`[${this.pluginName}] 工作流加载异常:`, error);
      return false;
    }
  }

  // ====== 工具方法 ======

  /**
   * 获取可用的WebSocket连接
   * @returns {WebSocket|null} WebSocket对象或null
   */
  getAvailableWebSocket() {
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
      console.error(`[${this.pluginName}] ${message}`);
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
}

// 导出模块
export { WorkflowLoader };
