/**
 * 网络配置模块
 * 提供不同平台的网络配置选项
 */

class NetworkConfig {
    constructor() {
        this.isDev = process.env.NODE_ENV === 'development';
        this.platform = process.platform;
    }

    /**
     * 获取HTTP请求的默认配置
     * @param {boolean} isHttps - 是否为HTTPS
     * @returns {Object} 请求配置
     */
    getHttpConfig(isHttps = false) {
        const config = {
            headers: {
                'User-Agent': 'MultiSiteLatencyTool/1.0',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'close'
            }
        };

        // 平台特定配置
        if (this.platform === 'linux') {
            Object.assign(config, this._getLinuxConfig(isHttps));
        } else if (this.platform === 'win32') {
            Object.assign(config, this._getWindowsConfig(isHttps));
        } else if (this.platform === 'darwin') {
            Object.assign(config, this._getMacConfig(isHttps));
        }

        return config;
    }

    /**
     * 获取Linux平台特定配置
     * @param {boolean} isHttps - 是否为HTTPS
     * @returns {Object} Linux配置
     */
    _getLinuxConfig(isHttps) {
        const config = {
            family: 0 // 允许IPv4和IPv6
        };

        if (isHttps) {
            config.rejectUnauthorized = true;
            config.minVersion = 'TLSv1.2';

            // 构建版本特定的SSL配置
            if (!this.isDev) {
                try {
                    config.secureOptions = require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1;
                } catch (e) {
                    console.warn('无法设置SSL选项:', e.message);
                }
                config.lookup = require('dns').lookup;
            }
        }

        return config;
    }

    /**
     * 获取Windows平台特定配置
     * @param {boolean} isHttps - 是否为HTTPS
     * @returns {Object} Windows配置
     */
    _getWindowsConfig(isHttps) {
        const config = {};

        if (isHttps) {
            // Windows通常有更好的SSL支持
            config.secureProtocol = 'TLSv1_2_method';
        }

        return config;
    }

    /**
     * 获取macOS平台特定配置
     * @param {boolean} isHttps - 是否为HTTPS
     * @returns {Object} macOS配置
     */
    _getMacConfig(isHttps) {
        const config = {};

        if (isHttps) {
            config.secureProtocol = 'TLSv1_2_method';
        }

        return config;
    }

    /**
     * 获取超时配置
     * @param {number} baseTimeout - 基础超时时间
     * @returns {Object} 超时配置
     */
    getTimeoutConfig(baseTimeout = 10000) {
        const config = {
            timeout: baseTimeout
        };

        // 根据平台调整超时时间
        if (this.platform === 'linux' && !this.isDev) {
            // Linux构建版本可能需要更长的超时时间
            config.timeout = Math.max(baseTimeout, 15000);
        }

        return config;
    }

    /**
     * 获取重试配置
     * @returns {Object} 重试配置
     */
    getRetryConfig() {
        return {
            maxRetries: 3,
            retryDelay: 1000,
            retryMultiplier: 2,
            maxRetryDelay: 10000
        };
    }

    /**
     * 获取DNS配置
     * @returns {Object} DNS配置
     */
    getDnsConfig() {
        const config = {
            family: 0, // 允许IPv4和IPv6
            hints: require('dns').ADDRCONFIG
        };

        // 平台特定的DNS配置
        if (this.platform === 'linux') {
            config.verbatim = true; // 保持DNS查询结果的原始顺序
        }

        return config;
    }

    /**
     * 获取Socket配置
     * @param {number} timeout - 超时时间
     * @returns {Object} Socket配置
     */
    getSocketConfig(timeout = 10000) {
        const config = {
            timeout,
            keepAlive: false,
            noDelay: true
        };

        // Linux特定的Socket配置
        if (this.platform === 'linux') {
            config.keepAlive = true;
            config.keepAliveInitialDelay = 1000;
        }

        return config;
    }

    /**
     * 获取代理配置
     * @returns {Object|null} 代理配置
     */
    getProxyConfig() {
        // 检查环境变量中的代理设置
        const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
        const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
        const noProxy = process.env.NO_PROXY || process.env.no_proxy;

        if (httpProxy || httpsProxy) {
            return {
                http: httpProxy,
                https: httpsProxy,
                no: noProxy ? noProxy.split(',').map(s => s.trim()) : []
            };
        }

        return null;
    }

    /**
     * 检查是否需要使用代理
     * @param {string} hostname - 目标主机名
     * @returns {boolean} 是否需要代理
     */
    shouldUseProxy(hostname) {
        const proxyConfig = this.getProxyConfig();
        if (!proxyConfig || !proxyConfig.no) {
            return !!proxyConfig;
        }

        // 检查是否在no_proxy列表中
        return !proxyConfig.no.some(pattern => {
            if (pattern === '*') return true;
            if (pattern.startsWith('.')) {
                return hostname.endsWith(pattern) || hostname === pattern.slice(1);
            }
            return hostname === pattern;
        });
    }

    /**
     * 获取用户代理字符串
     * @returns {string} 用户代理字符串
     */
    getUserAgent() {
        const version = require('../../package.json').version;
        const platform = this.platform;
        const nodeVersion = process.version;

        return `MultiSiteLatencyTool/${version} (${platform}; Node.js ${nodeVersion})`;
    }

    /**
     * 获取完整的网络配置
     * @param {Object} options - 配置选项
     * @returns {Object} 完整配置
     */
    getFullConfig(options = {}) {
        const {
            isHttps = false,
            timeout = 10000,
            useProxy = true
        } = options;

        const config = {
            ...this.getHttpConfig(isHttps),
            ...this.getTimeoutConfig(timeout),
            ...this.getDnsConfig()
        };

        // 更新用户代理
        config.headers['User-Agent'] = this.getUserAgent();

        // 代理配置
        if (useProxy) {
            const proxyConfig = this.getProxyConfig();
            if (proxyConfig) {
                config.proxy = proxyConfig;
            }
        }

        return config;
    }
}

module.exports = new NetworkConfig();
