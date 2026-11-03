/**
 * 网络测试服务
 * 统一的网络测试功能入口，整合各个测试服务模块
 */

const { executeMtrTest, parseMtrOutput } = require('./mtrService');
const { executeTracerouteTest, parseTracerouteOutput } = require('./tracerouteService');

module.exports = {
    executeMtrTest,
    executeTracerouteTest,
    parseMtrOutput,
    parseTracerouteOutput
};
const net = require('node:net');
const dgram = require('node:dgram');
const dns = require('node:dns/promises');
const safe = require('./safeCommand');

function datagramBytes(value = '', encoding = 'text') {
    if (typeof value !== 'string' || value.length > 16384) throw new Error('Invalid datagram data');
    if (encoding === 'text') return Buffer.from(value, 'utf8');
    const hex = value.replace(/\s+/g, '');
    if (encoding !== 'hex' || !/^(?:[\da-f]{2})*$/i.test(hex)) throw new Error('Invalid datagram encoding');
    return Buffer.from(hex, 'hex');
}

// TCP and UDP share validated input, DNS resolution and a total deadline.
function executeTransportTest(options = {}) {
    const target = safe.host(options.host);
    const port = Number(safe.integer(Number(options.port), 1, 65535));
    const timeout = Number(safe.integer(Number(options.timeout ?? 10000), 100, 60000));
    const protocol = options.protocol;
    if (!['tcp', 'udp'].includes(protocol)) throw new Error('Unsupported transport');
    const payload = datagramBytes(options.payload, options.encoding);
    const expected = datagramBytes(options.expected, options.encoding);
    if (protocol === 'udp' && (!payload.length || payload.length > 1400 || expected.length > 4096)) throw new Error('Invalid UDP payload or assertion size');
    const started = performance.now();
    return new Promise(resolve => {
        let socket, settled = false, stage = 'dns';
        const finish = result => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try { if (socket?.destroy) socket.destroy(); else socket?.close(); } catch { /* Socket may not have bound yet. */ }
            resolve({ status: 'failure', stage, latency_ms: performance.now() - started, ...result });
        };
        const timer = setTimeout(() => finish({ stage: 'timeout', observation: 'no_response', error: protocol === 'udp' ? 'No UDP response observed; this does not prove the port is closed.' : 'TCP deadline exceeded.' }), timeout);
        dns.lookup(target, { family: options.family === 'ipv6' ? 6 : options.family === 'ipv4' ? 4 : 0 }).then(address => {
            if (settled) return;
            stage = 'connect';
            if (protocol === 'tcp') {
                socket = net.createConnection({ host: address.address, port });
                socket.once('connect', () => finish({ status: 'success', stage: 'complete', remote_address: `${address.address}:${port}` }));
            } else {
                socket = dgram.createSocket(address.family === 6 ? 'udp6' : 'udp4');
                socket.once('message', response => {
                    if (response.length > 4096) return finish({ stage: 'assertion', error: 'UDP response exceeds the 4096-byte limit.', truncated: true });
                    const matched = response.length > 0 && (!expected.length || response.includes(expected));
                    finish({ status: matched ? 'success' : 'failure', stage: matched ? 'complete' : 'assertion', observation: 'response', sent_bytes: payload.length, received_bytes: response.length, response_hex: response.subarray(0, 256).toString('hex'), ...(matched ? {} : { error: 'UDP response did not match the expected content.' }) });
                });
                socket.connect(port, address.address, () => {
                    if (settled) return;
                    stage = 'response';
                    socket.send(payload, error => { if (error) finish({ error: error.message }); });
                });
            }
            socket.once('error', error => finish({ observation: error.code === 'ECONNREFUSED' ? 'unreachable' : 'error', error: error.message }));
        }).catch(error => finish({ stage: 'dns', error: error.message }));
    });
}
module.exports.executeTransportTest = executeTransportTest;
