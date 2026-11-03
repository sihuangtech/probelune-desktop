/**
 * IPC处理程序模块
 * 提供主进程和渲染进程之间的通信处理
 */

const toolChecker = require('./toolChecker');
const networkTests = require('./networkTests');
const httpService = require('./httpService');
const ipLocationService = require('./ipLocationService');
const dnsService = require('./dnsService');
const pingService = require('./pingService');

/**
 * DNS 解析处理程序
 */
async function handleDnsResolve(event, domain) {
    return await dnsService.resolve(domain);
}

/**
 * DNS 测试处理程序
 */
async function handleDnsTest(event, domain, recordType, dnsServer = 'default') {
    return await dnsService.test(domain, recordType, dnsServer);
}

/**
 * 打开外部链接处理程序
 */
async function handleOpenExternal(event, url, shell) {
    try {
        await shell.openExternal(url);
        return { success: true };
    } catch (error) {
        console.error('打开外部链接失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Ping 测试处理程序
 */
async function handlePingTest(event, options) {
    return await pingService.test(options);
}

/**
 * HTTP 测试处理程序
 */
async function handleHttpTest(event, options) {
    try {
        return await httpService.executeTest(options);
    } catch (error) {
        console.error('HTTP测试处理失败:', error);
        throw error;
    }
}

/**
 * IP2Location 查询处理程序
 */
async function handleIp2LocationLookup(event, ip, userSettings = null) {
    try {
        return await ipLocationService.lookup(ip, userSettings);
    } catch (error) {
        console.error('IP地理位置查询处理失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * MTR 状态检查处理程序
 */
async function handleCheckMtrStatus(event) {
    return await toolChecker.checkMtrStatus();
}

/**
 * Traceroute 状态检查处理程序
 */
async function handleCheckTracerouteStatus(event) {
    try {
        return await toolChecker.checkTracerouteStatus();
    } catch (error) {
        console.error('检查traceroute状态失败:', error);
        return {
            installed: false,
            status: 'check_error',
            error: error.message,
            installInstructions: '检查工具状态时发生错误，请手动安装traceroute工具'
        };
    }
}

/**
 * MTR 测试处理程序
 */
async function handleMtrTest(event, address, options) {
    return await networkTests.executeMtrTest(address, options);
}

/**
 * 路由追踪测试处理程序
 */
async function handleTracerouteTest(event, address, options) {
    return await networkTests.executeTracerouteTest(address, options);
}

module.exports = {
    handleDnsResolve,
    handleDnsTest,
    handleOpenExternal,
    handlePingTest,
    handleIp2LocationLookup,
    handleCheckMtrStatus,
    handleCheckTracerouteStatus,
    handleMtrTest,
    handleTracerouteTest,
    handleHttpTest,
    handleNetworkTest: (_event, options) => networkTests.executeTransportTest(options)
};