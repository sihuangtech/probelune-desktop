/**
 * IP地理位置服务模块
 * 提供IP地址地理位置查询功能
 */

const https = require('https');
const http = require('http');
const ErrorHandler = require('./errorHandler');

class IpLocationService {
    constructor() {
        this.services = this._initializeServices();
    }

    /**
     * 初始化服务配置
     * @returns {Object} 服务配置
     */
    _initializeServices() {
        return {
            'ip-api': {
                name: 'ip-api',
                getCurrentIpUrl: () => `http://ip-api.com/json/?fields=status,message,country,regionName,city,isp,query`,
                getIpUrl: (ip) => `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp,query`,
                parseResponse: (data) => {
                    const result = JSON.parse(data);
                    if (result.status === 'success') {
                        return {
                            ip: result.query,
                            country_name: result.country,
                            region_name: result.regionName,
                            city_name: result.city,
                            isp: result.isp
                        };
                    } else {
                        throw new Error(result.message || '查询失败');
                    }
                }
            },
            'ipapi': {
                name: 'ipapi',
                getCurrentIpUrl: () => `https://ipapi.co/json/`,
                getIpUrl: (ip) => `https://ipapi.co/${ip}/json/`,
                parseResponse: (data) => {
                    const result = JSON.parse(data);
                    if (result.error) {
                        throw new Error(result.reason || '查询失败');
                    }
                    return {
                        ip: result.ip,
                        country_name: result.country_name,
                        region_name: result.region,
                        city_name: result.city,
                        isp: result.org
                    };
                }
            },
            'ip2location': {
                name: 'ip2location',
                getCurrentIpUrl: (apiKey) => `https://api.ip2location.io/v2/ip?key=${apiKey}&format=json`,
                getIpUrl: (ip, apiKey) => `https://api.ip2location.io/v2/ip?ip=${ip}&key=${apiKey}&format=json`,
                parseResponse: (data) => {
                    const result = JSON.parse(data);
                    if (result.error) {
                        throw new Error(result.error.error_message || '查询失败');
                    }
                    return {
                        ip: result.ip,
                        country_name: result.country_name,
                        region_name: result.region_name,
                        city_name: result.city_name,
                        isp: result.isp
                    };
                },
                requiresKey: true
            },
            'ipinfo': {
                name: 'ipinfo',
                getCurrentIpUrl: (token) => token
                    ? `https://ipinfo.io/json?token=${token}`
                    : `https://ipinfo.io/json`,
                getIpUrl: (ip, token) => token
                    ? `https://ipinfo.io/${ip}?token=${token}`
                    : `https://ipinfo.io/${ip}/json`,
                parseResponse: (data) => {
                    const result = JSON.parse(data);
                    if (result.error) {
                        throw new Error(result.error.message || '查询失败');
                    }
                    return {
                        ip: result.ip,
                        country_name: result.country,
                        region_name: result.region,
                        city_name: result.city,
                        isp: result.org
                    };
                }
            }
        };
    }

    /**
     * 查询IP地理位置
     * @param {string} ip - IP地址或'current'
     * @param {Object} settings - 用户设置
     * @returns {Promise} 查询结果
     */
    async lookup(ip, settings = {}) {
        settings = settings || {};
        try {
            const defaultSettings = {
                ipLookupService: 'auto',
                ip2locationApiKey: '',
                ipinfoToken: '',
                ipLookupTimeout: 8
            };

            const userSettings = { ...defaultSettings, ...settings };

            if (ip === 'current') {
                return await this._getCurrentIpLocation(userSettings);
            } else {
                return await this._getIpLocation(ip, userSettings);
            }
        } catch (error) {
            ErrorHandler.logError(error, 'IP_LOCATION_LOOKUP', { ip, service: settings.ipLookupService });
            throw error;
        }
    }

    /**
     * 获取当前IP地理位置
     * @param {Object} settings - 用户设置
     * @returns {Promise} 查询结果
     */
    async _getCurrentIpLocation(settings) {
        console.log('检测到查询当前IP请求，正在获取当前IP...');

        const servicesToTry = this._getServicesToTry(settings, true);

        for (const serviceName of servicesToTry) {
            const service = this.services[serviceName];
            if (!service) continue;

            try {
                console.log(`尝试使用 ${service.name} 查询当前IP和地理位置...`);

                const url = this._getServiceUrl(service, '', settings, true);
                const result = await this._queryService(url, service, settings.ipLookupTimeout);

                console.log(`成功从 ${service.name} 获取到当前IP信息:`, result);

                return {
                    success: true,
                    data: {
                        ip: result.ip,
                        country: result.country_name,
                        region: result.region_name,
                        city: result.city_name,
                        isp: result.isp
                    },
                    service: service.name
                };
            } catch (error) {
                console.error(`${service.name} 查询失败:`, error.message);
                continue;
            }
        }

        throw new Error('所有IP查询服务都不可用');
    }

    /**
     * 获取指定IP的地理位置
     * @param {string} ip - IP地址
     * @param {Object} settings - 用户设置
     * @returns {Promise} 查询结果
     */
    async _getIpLocation(ip, settings) {
        const servicesToTry = this._getServicesToTry(settings, false);

        for (const serviceName of servicesToTry) {
            const service = this.services[serviceName];
            if (!service) continue;

            try {
                console.log(`尝试使用 ${service.name} 查询IP地理位置...`);

                const url = this._getServiceUrl(service, ip, settings, false);
                const result = await this._queryService(url, service, settings.ipLookupTimeout);

                console.log(`成功从 ${service.name} 获取到地理位置信息:`, result);

                return {
                    success: true,
                    data: {
                        ip: ip,
                        country: result.country_name,
                        region: result.region_name,
                        city: result.city_name,
                        isp: result.isp
                    },
                    service: service.name
                };
            } catch (error) {
                console.error(`${service.name} 查询失败:`, error.message);
                continue;
            }
        }

        throw new Error('所有IP地理位置服务都不可用');
    }

    /**
     * 获取要尝试的服务列表
     * @param {Object} settings - 用户设置
     * @param {boolean} isCurrentIp - 是否查询当前IP
     * @returns {Array} 服务列表
     */
    _getServicesToTry(settings, isCurrentIp) {
        if (settings.ipLookupService === 'auto') {
            // 自动模式：按优先级尝试所有可用服务
            let servicesToTry = ['ip-api', 'ipapi'];

            // 如果有API密钥，添加付费服务
            if (settings.ip2locationApiKey) {
                servicesToTry.unshift('ip2location'); // 优先使用付费服务
            }
            if (settings.ipinfoToken) {
                servicesToTry.push('ipinfo');
            } else {
                servicesToTry.push('ipinfo'); // 免费版本
            }

            return servicesToTry;
        } else {
            // 指定服务模式
            const selectedService = this.services[settings.ipLookupService];
            if (!selectedService) {
                throw new Error('不支持的IP查询服务');
            }

            // 检查是否需要API密钥
            if (selectedService.requiresKey && !settings.ip2locationApiKey) {
                throw new Error('IP2Location服务需要API密钥');
            }

            return [settings.ipLookupService];
        }
    }

    /**
     * 获取服务URL
     * @param {Object} service - 服务配置
     * @param {string} ip - IP地址
     * @param {Object} settings - 用户设置
     * @param {boolean} isCurrentIp - 是否查询当前IP
     * @returns {string} 服务URL
     */
    _getServiceUrl(service, ip, settings, isCurrentIp) {
        if (isCurrentIp) {
            if (service.name === 'ip2location') {
                return service.getCurrentIpUrl(settings.ip2locationApiKey);
            } else if (service.name === 'ipinfo') {
                return service.getCurrentIpUrl(settings.ipinfoToken);
            } else {
                return service.getCurrentIpUrl();
            }
        } else {
            if (service.name === 'ip2location') {
                return service.getIpUrl(ip, settings.ip2locationApiKey);
            } else if (service.name === 'ipinfo') {
                return service.getIpUrl(ip, settings.ipinfoToken);
            } else {
                return service.getIpUrl(ip);
            }
        }
    }

    /**
     * 查询服务
     * @param {string} url - 查询URL
     * @param {Object} service - 服务配置
     * @param {number} timeout - 超时时间
     * @returns {Promise} 查询结果
     */
    _queryService(url, service, timeout = 8000) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                timeout: timeout * 1000,
                headers: {
                    'User-Agent': 'MultiSiteLatencyTool/1.0'
                }
            };

            const protocol = urlObj.protocol === 'https:' ? https : http;

            const req = protocol.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const result = service.parseResponse(data);
                        resolve(result);
                    } catch (error) {
                        ErrorHandler.logError(error, 'IP_SERVICE_PARSE_RESPONSE', {
                            service: service.name,
                            url,
                            responseData: data.substring(0, 200)
                        });
                        reject(new Error('解析响应失败: ' + error.message));
                    }
                });
            });

            req.on('error', (error) => {
                ErrorHandler.logError(error, 'IP_SERVICE_REQUEST', {
                    service: service.name,
                    url
                });
                reject(new Error('请求失败: ' + error.message));
            });

            req.on('timeout', () => {
                req.destroy();
                const timeoutError = new Error('请求超时');
                ErrorHandler.logError(timeoutError, 'IP_SERVICE_TIMEOUT', {
                    service: service.name,
                    url,
                    timeout
                });
                reject(timeoutError);
            });

            req.end();
        });
    }

    /**
     * 获取支持的服务列表
     * @returns {Array} 服务列表
     */
    getSupportedServices() {
        return Object.keys(this.services).map(key => ({
            id: key,
            name: this.services[key].name,
            requiresKey: this.services[key].requiresKey || false
        }));
    }

    /**
     * 验证服务配置
     * @param {string} serviceName - 服务名称
     * @param {Object} settings - 用户设置
     * @returns {boolean} 是否有效
     */
    validateServiceConfig(serviceName, settings) {
        const service = this.services[serviceName];
        if (!service) {
            return false;
        }

        if (service.requiresKey && serviceName === 'ip2location') {
            return !!settings.ip2locationApiKey;
        }

        return true;
    }
}

module.exports = new IpLocationService();
// 路由结果保留真实跳点；位置查询失败只影响注释，不把路由诊断判为失败。
module.exports.batchQueryIPLocations = async (hops) => {
    const service = module.exports;
    await Promise.all(hops.map(async hop => {
        if (!hop.ip || hop.ip === '*' || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hop.ip)) return;
        try {
            const value = await service.lookup(hop.ip, {ipLookupService:'ipapi',ipLookupTimeout:3000});
            if (value.success) hop.location = [value.data.country,value.data.region,value.data.city,value.data.isp].filter(Boolean).join(' · ');
        } catch { hop.location = ''; }
    }));
    return hops;
};
