/**
 * Ping服务模块
 * 提供跨平台的Ping测试功能
 */

const { execFile } = require('child_process');
const { host: validateHost, integer } = require('./safeCommand');
const util = require('util');
const ErrorHandler = require('./errorHandler');

const execPromise = util.promisify(execFile);

class PingService {
    constructor() {
        this.platform = process.platform;
    }

    /**
     * 执行Ping测试
     * @param {Object} options - 测试选项
     * @returns {Promise<Object>} 测试结果
     */
    async test(options) {
        const { host, count = 4, size = 32, timeout = 3 } = options;

        try {
            // 构建平台特定的ping命令
            validateHost(host); integer(count,1,20); integer(size,16,1400); integer(timeout,1,30);
            const args = this._buildPingCommand(host, count, size, timeout);
            let stdout;
            try { ({stdout}=await execPromise('ping',args,{timeout:(count*timeout+2)*1000,maxBuffer:65536,env:{...process.env,LC_ALL:'C'}})); }
            catch(error) { if(error.stdout && /packet loss|%.*loss|丢失/i.test(error.stdout))stdout=error.stdout;else throw error; }

            // 解析输出结果
            const result = this._parseOutput(stdout, host);

            return result;
        } catch (error) {
            ErrorHandler.logError(error, 'PING_TEST', { host, count, size, timeout });
            throw new Error(`Ping测试失败: ${error.message}`);
        }
    }

    /**
     * 批量Ping测试
     * @param {Array} hosts - 主机列表
     * @param {Object} options - 测试选项
     * @returns {Promise<Array>} 测试结果列表
     */
    async batchTest(hosts, options = {}) {
        const results = [];

        for (const host of hosts) {
            try {
                const result = await this.test({ ...options, host });
                results.push({ host, ...result });
            } catch (error) {
                ErrorHandler.logError(error, 'PING_BATCH_TEST', { host, options });
                results.push({
                    host,
                    ip: '',
                    min: 0,
                    avg: 0,
                    max: 0,
                    loss: 100,
                    ttl: 0,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 连续Ping测试
     * @param {string} host - 目标主机
     * @param {Object} options - 测试选项
     * @param {Function} callback - 每次结果回调
     * @returns {Promise} 测试控制器
     */
    async continuousTest(host, options = {}, callback) {
        const { interval = 1000, maxCount = 0 } = options; // maxCount为0表示无限制
        let count = 0;
        let isRunning = true;

        const controller = {
            stop: () => { isRunning = false; },
            isRunning: () => isRunning
        };

        const runTest = async () => {
            while (isRunning && (maxCount === 0 || count < maxCount)) {
                try {
                    const result = await this.test({ ...options, host, count: 1 });
                    if (callback) {
                        callback(null, { ...result, sequence: count + 1 });
                    }
                } catch (error) {
                    if (callback) {
                        callback(error, { sequence: count + 1, host });
                    }
                }

                count++;

                if (isRunning && (maxCount === 0 || count < maxCount)) {
                    await new Promise(resolve => setTimeout(resolve, interval));
                }
            }
        };

        // 异步执行测试
        runTest().catch(error => {
            ErrorHandler.logError(error, 'PING_CONTINUOUS_TEST', { host, options });
        });

        return controller;
    }

    /**
     * 构建平台特定的ping命令
     * @param {string} host - 目标主机
     * @param {number} count - 发送包数量
     * @param {number} size - 包大小
     * @param {number} timeout - 超时时间
     * @returns {string} ping命令
     * @private
     */
    _buildPingCommand(host, count, size, timeout) {
        if (this.platform === 'win32') {
            // Windows ping命令
            return ['-n',String(count),'-l',String(size),'-w',String(timeout*1000),host];
        } else {
            // macOS/Linux ping命令
            // 使用简单的ping命令以确保显示每个回复的详细信息（包括TTL）
            return ['-c',String(count),'-s',String(size),'-W',String(this.platform==='darwin'?timeout*1000:timeout),host];
        }
    }

    /**
     * 解析ping输出结果
     * @param {string} stdout - ping命令输出
     * @param {string} host - 目标主机
     * @returns {Object} 解析后的结果
     * @private
     */
    _parseOutput(stdout, host) {
        const result = {
            host,
            ip: '',
            min: 0,
            avg: 0,
            max: 0,
            loss: 100,
            ttl: 0
        };

        // 从输出中提取IP地址
        const ipMatch = stdout.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        if (ipMatch) {
            result.ip = ipMatch[0];
        }

        if (this.platform === 'win32') {
            this._parseWindowsOutput(stdout, result);
        } else {
            this._parseUnixOutput(stdout, result);
        }

        return result;
    }

    /**
     * 解析Windows ping输出
     * @param {string} stdout - ping输出
     * @param {Object} result - 结果对象
     * @private
     */
    _parseWindowsOutput(stdout, result) {
        // Windows 输出解析 - 使用更通用的正则表达式处理编码问题
        // 首先尝试匹配完整的统计行格式
        let statsMatch = stdout.match(/= (\d+)ms.*?= (\d+)ms.*?= (\d+)ms/);

        // 如果没有匹配到，尝试更宽松的匹配
        if (!statsMatch) {
            // 分别匹配最短、最长、平均值
            const allMatches = stdout.match(/(\d+)ms/g);

            if (allMatches && allMatches.length >= 3) {
                // 从所有匹配的时间值中提取统计信息
                const times = allMatches.map(match => parseInt(match.replace('ms', '')));
                // 通常ping输出中，最后三个时间值是统计信息
                const statsValues = times.slice(-3);
                if (statsValues.length === 3) {
                    result.min = statsValues[0];
                    result.max = statsValues[1];
                    result.avg = statsValues[2];
                }
            }
        } else {
            result.min = parseInt(statsMatch[1]);
            result.max = parseInt(statsMatch[2]);
            result.avg = parseInt(statsMatch[3]);
        }

        // 匹配丢包率
        const lossMatch = stdout.match(/(\d+)%/);
        if (lossMatch) {
            result.loss = parseInt(lossMatch[1]);
        }

        // 匹配TTL值
        const ttlMatch = stdout.match(/TTL=(\d+)/i);
        if (ttlMatch) {
            result.ttl = parseInt(ttlMatch[1]);
        }
    }

    /**
     * 解析Unix系统ping输出
     * @param {string} stdout - ping输出
     * @param {Object} result - 结果对象
     * @private
     */
    _parseUnixOutput(stdout, result) {
        // 改进的macOS/Linux输出解析
        const statsMatch = stdout.match(/min\/avg\/max\/(?:mdev|stddev)\s*=\s*([\d.]+)\/([\d.]+)\/([\d.]+)/);
        const lossMatch = stdout.match(/(\d+(?:\.\d+)?)%\s+packet\s+loss/);

        if (statsMatch) {
            result.min = parseFloat(statsMatch[1]);
            result.avg = parseFloat(statsMatch[2]);
            result.max = parseFloat(statsMatch[3]);
        }
        if (lossMatch) {
            result.loss = parseFloat(lossMatch[1]);
        }

        // 从每个ping回复中提取TTL值（如果有的话）
        const ttlMatches = stdout.match(/ttl=(\d+)/gi);
        if (ttlMatches && ttlMatches.length > 0) {
            // 取第一个TTL值
            const ttlMatch = ttlMatches[0].match(/ttl=(\d+)/i);
            if (ttlMatch) {
                result.ttl = parseInt(ttlMatch[1]);
            }
        }
    }

    /**
     * 验证主机地址
     * @param {string} host - 主机地址
     * @returns {boolean} 是否有效
     */
    validateHost(host) {
        if (!host || typeof host !== 'string') {
            return false;
        }

        // IPv4地址验证
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipv4Regex.test(host)) {
            const parts = host.split('.').map(Number);
            return parts.every(part => part >= 0 && part <= 255);
        }

        // 域名验证
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return domainRegex.test(host) && host.length <= 253;
    }

    /**
     * 获取默认测试选项
     * @returns {Object} 默认选项
     */
    getDefaultOptions() {
        return {
            count: 4,
            size: 32,
            timeout: 3,
            interval: 1000
        };
    }

    /**
     * 获取平台信息
     * @returns {Object} 平台信息
     */
    getPlatformInfo() {
        return {
            platform: this.platform,
            supportsContinuous: true,
            supportsBatch: true,
            defaultOptions: this.getDefaultOptions()
        };
    }
}

module.exports = new PingService();
