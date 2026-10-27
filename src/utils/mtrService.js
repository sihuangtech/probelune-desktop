/**
 * MTR测试服务
 * 提供MTR网络测试功能
 */

const { execFile } = require('child_process');
const { host, integer } = require('./safeCommand');
const { batchQueryIPLocations } = require('./ipLocationService');
const { checkMtrStatus } = require('./toolChecker');

/**
 * 执行 MTR 测试
 * @param {string} address 目标地址
 * @param {Object} options 测试选项
 * @returns {Promise<Object>} 测试结果
 */
async function executeMtrTest(address, options = {}) {
    const { count = 5, packetSize = 64, maxHops = 15 } = options;

    try {
        // 首先检查 MTR 状态
        const mtrStatus = await checkMtrStatus();
        if (!mtrStatus.installed) {
            throw new Error(`MTR 工具未安装。安装方法: ${mtrStatus.installInstructions}`);
        }

        // 获取工具的完整路径和类型
        const toolPath = mtrStatus.path || 'mtr';
        const toolType = mtrStatus.tool || 'mtr';
        console.log('使用工具:', toolType, '路径:', toolPath);

        host(address);integer(count,1,20);integer(packetSize,16,1400);integer(maxHops,1,30);
        // 参数数组直接传给可执行文件，不经过 shell 或自动提权。
        const args=toolType==='pathping'?['-n','-q',String(count),'-h',String(maxHops),address]:
          ['-r','-c',String(count),'-s',String(packetSize),'-m',String(maxHops),'-n',address];

        // 执行命令并获取输出
        const output = await new Promise((resolve, reject) => {
            execFile(toolPath,args, { encoding: 'utf8', timeout:60000,maxBuffer: 1024 * 1024,env:{...process.env,LC_ALL:'C'} }, (error, stdout, stderr) => {
                if (error) {
                    console.error('命令执行失败:', error);
                    console.error('stderr:', stderr);
                    // 检查是否是权限问题
                    if (stderr && (stderr.includes('Failure to open') || stderr.includes('Permission denied') || stderr.includes('需要管理员权限'))) {
                        reject(new Error('工具需要管理员权限才能运行，请查看上方状态区域的解决方案'));
                    } else {
                        reject(error);
                    }
                } else {
                    console.log('命令输出:', stdout);
                    resolve(stdout);
                }
            });
        });

        // 根据工具类型解析输出
        const hops = await parseMtrOutput(output, toolType);
        console.log('解析结果:', hops);

        return {
            success: true,
            target: address,
            hops: hops,
            tool: toolType
        };

    } catch (error) {
        console.error('网络测试失败:', error);
        return {
            success: false,
            error: error.message || '执行命令失败'
        };
    }
}

/**
 * 解析 MTR 输出
 * @param {string} output 命令输出
 * @param {string} toolType 工具类型 (mtr, winmtr, pathping)
 * @returns {Promise<Array>} 解析后的跳数数据
 */
async function parseMtrOutput(output, toolType = 'mtr') {
    const hops = [];
    console.log('原始输出:', JSON.stringify(output));
    console.log('工具类型:', toolType);

    if (toolType === 'pathping') {
        // 解析 Windows pathping 输出
        const lines = output.split('\n').filter(line => line.trim());
        let inStatisticsSection = false;

        for (const line of lines) {
            // 检查是否进入统计部分（包含 IP 地址和统计信息的行）
            if (line.includes('ms') && line.includes('/') && line.includes('=') && line.includes('%')) {
                // 解析统计行，格式类似：
                // 1   11ms     0/   3 =  0%     0/   3 =  0%  192.168.2.1
                const match = line.match(/^\s*(\d+)\s+(\d+)ms\s+(\d+)\/\s*(\d+)\s*=\s*(\d+)%\s+(\d+)\/\s*(\d+)\s*=\s*(\d+)%\s+([^\s]+)/);
                if (match) {
                    const hopNum = parseInt(match[1]);
                    const rtt = parseInt(match[2]);
                    const loss = parseInt(match[5]); // 第一个丢包率
                    const ip = match[9];

                    if (ip !== '0.0.0.0' && ip !== '*' && hopNum > 0) {
                        hops.push({
                            hop: Number(hopNum),
                            ip: String(ip),
                            hostname: String(ip),
                            loss: Number(loss),
                            avg: Number(rtt),
                            min: Number(rtt),
                            max: Number(rtt),
                            location: String('')
                        });
                    }
                }
            }
        }
    } else if (process.platform === 'win32') {
        // 解析传统 Windows mtr 输出（如果有的话）
        const lines = output.split('\n').filter(line => line.trim());
        let hop = 1;
        for (const line of lines) {
            const match = line.match(/\s*\d+\.\s+(\d+\.\d+ms|\*)\s+(\d+\.\d+ms|\*)\s+(\d+\.\d+ms|\*)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?/);
            if (match) {
                const rtt1 = match[1] === '*' ? '*' : match[1];
                const rtt2 = match[2] === '*' ? '*' : match[2];
                const rtt3 = match[3] === '*' ? '*' : match[3];
                const ip = match[4] || '';

                if (ip) {
                    const rtts = [rtt1, rtt2, rtt3].filter(rtt => rtt !== '*').map(rtt => {
                        const m = rtt.match(/(\d+)/);
                        return m ? parseInt(m[1]) : null;
                    }).filter(n => n !== null);

                    const avg = rtts.length > 0 ? rtts.reduce((sum, val) => sum + val, 0) / rtts.length : 0;
                    const min = rtts.length > 0 ? Math.min(...rtts) : 0;
                    const max = rtts.length > 0 ? Math.max(...rtts) : 0;

                    hops.push({
                        hop: hop++,
                        ip: String(ip),
                        hostname: String(ip),
                        loss: Number(rtts.length < 3 ? Math.round((3 - rtts.length) / 3 * 100) : 0),
                        avg: Number(avg),
                        min: Number(min),
                        max: Number(max),
                        location: String('')
                    });
                }
            }
        }
    } else {
        // 解析 Linux/macOS mtr 报告输出
        // 直接使用正则表达式在整个字符串中查找所有跳数行
        // 使用\s+匹配多个空格，处理字段间变长空格
        const hopRegex = /(\d+)\.\|--\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(\d+\.\d+)%\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g;

        let match;
        console.log('开始全局匹配MTR跳数...');
        console.log('使用的正则表达式:', hopRegex);

        while ((match = hopRegex.exec(output)) !== null) {
            console.log('找到跳数:', match);
            hops.push({
                hop: Number(parseInt(match[1])),
                ip: String(match[2]),
                hostname: String(match[2]),
                loss: Number(parseFloat(match[3])),
                avg: Number(parseFloat(match[6])),  // 平均值
                min: Number(parseFloat(match[7])),  // 最小值
                max: Number(parseFloat(match[8])),  // 最大值
                location: String('') // 稍后查询
            });
        }

        // 如果全局匹配失败，尝试手动测试单行
        if (hops.length === 0) {
            console.log('全局匹配失败，尝试手动测试...');
            const testLine = "  1.|-- 192.168.2.1                0.0%     5    4.3   5.0   4.0   8.1   1.7";
            const testMatch = testLine.match(/(\d+)\.\|--\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(\d+\.\d+)%\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
            console.log('测试行匹配结果:', testMatch);
        }
    }

    // 批量查询地理位置信息
    await batchQueryIPLocations(hops, 'MTR');

    console.log('解析完成，共解析到', hops.length, '个跳数');
    return hops;
}

module.exports = {
    executeMtrTest,
    parseMtrOutput
};
