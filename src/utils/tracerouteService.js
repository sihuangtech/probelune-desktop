/**
 * 路由追踪测试服务
 * 提供路由追踪网络测试功能
 */

const { execFile } = require('child_process');
const { host, integer } = require('./safeCommand');
const { batchQueryIPLocations } = require('./ipLocationService');

/**
 * 执行路由追踪测试
 * @param {string} address 目标地址
 * @param {Object} options 测试选项
 * @returns {Promise<Object>} 测试结果
 */
async function executeTracerouteTest(address, options = {}) {
    const { maxHops = 15, timeout = 2, packetSize = 64 } = options;

    try {
        // 根据操作系统构建路由追踪命令
        host(address);integer(maxHops,1,30);integer(timeout,1,10);integer(packetSize,16,1400);
        let command,args;

        if (process.platform === 'win32') {
            command='tracert';args=['-d','-h',String(maxHops),'-w',String(timeout*1000),address];
        } else {
            command='traceroute';args=['-m',String(maxHops),'-w',String(timeout),'-q','1','-n',address,String(packetSize)];
        }

        // 执行命令并获取输出
        const output = await new Promise((resolve, reject) => {
            execFile(command,args, { encoding: 'utf8',timeout:60000, maxBuffer: 1024 * 1024,env:{...process.env,LC_ALL:'C'} }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Traceroute 命令执行失败:', error);
                    console.error('stderr:', stderr);
                    reject(error);
                } else {
                    console.log('Traceroute 命令输出:', stdout);
                    resolve(stdout);
                }
            });
        });

        // 解析输出
        const hops = await parseTracerouteOutput(output);

        return {
            success: true,
            target: address,
            hops: hops
        };

    } catch (error) {
        return {
            success: false,
            error: error.message || '执行命令失败'
        };
    }
}

/**
 * 解析路由追踪输出
 * @param {string} output traceroute 命令输出
 * @returns {Promise<Array>} 解析后的跳数数据
 */
async function parseTracerouteOutput(output) {
    const hops = [];
    const lines = output.split('\n');

    if (process.platform === 'win32') {
        // 解析 Windows tracert 输出
        let hop = 1;
        for (const line of lines) {
            const match = line.match(/\s*\d+\s+(<\d+ ms|\d+ ms|\*)\s+(<\d+ ms|\d+ ms|\*)\s+(<\d+ ms|\d+ ms|\*)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?/);
            if (match) {
                const rtt1 = match[1] === '*' ? null : match[1];
                const rtt2 = match[2] === '*' ? null : match[2];
                const rtt3 = match[3] === '*' ? null : match[3];
                const ip = match[4] || '';

                if (ip) {
                    hops.push({
                        hop: hop++,
                        ip: ip,
                        hostname: ip,
                        rtt1: rtt1,
                        rtt2: rtt2,
                        rtt3: rtt3,
                        location: ''
                    });
                }
            }
        }
    } else {
        // 解析 Linux/macOS traceroute 输出
        for (const line of lines) {
            if (line.startsWith('traceroute to')) {
                continue;
            }

            // 匹配格式：" 1  192.168.2.1  3.937 ms" 或 " 4  *"
            const match = line.match(/^\s*(\d+)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([\d.]+)\s+ms/);
            const timeoutMatch = line.match(/^\s*(\d+)\s+\*/);

            if (match) {
                const hopNum = parseInt(match[1]);
                const ip = match[2];
                const rtt = `${match[3]} ms`;

                hops.push({
                    hop: hopNum,
                    ip: ip,
                    hostname: ip,
                    rtt1: rtt,
                    rtt2: null,
                    rtt3: null,
                    location: ''
                });
            } else if (timeoutMatch) {
                const hopNum = parseInt(timeoutMatch[1]);

                hops.push({
                    hop: hopNum,
                    ip: '*',
                    hostname: '*',
                    rtt1: '*',
                    rtt2: null,
                    rtt3: null,
                    location: ''
                });
            }
        }
    }

    // 批量查询地理位置信息
    await batchQueryIPLocations(hops, '路由追踪');

    console.log('路由追踪解析完成，共解析到', hops.length, '个跳数');
    return hops;
}

module.exports = {
    executeTracerouteTest,
    parseTracerouteOutput
};
