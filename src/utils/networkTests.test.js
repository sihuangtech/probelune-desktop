const { test } = require('node:test');
const assert = require('node:assert/strict');
const dgram = require('node:dgram');
const net = require('node:net');
const { once } = require('node:events');
const { executeTransportTest } = require('./networkTests');

test('TCP and UDP use validated, bounded local transport checks', async () => {
  const tcp = net.createServer(socket => socket.end());
  tcp.listen(0, '127.0.0.1');
  await once(tcp, 'listening');
  const udp = dgram.createSocket('udp4');
  udp.on('message', (data, peer) => udp.send(Buffer.from([0, 255, 1]), peer.port, peer.address));
  udp.bind(0, '127.0.0.1');
  await once(udp, 'listening');
  try {
    assert.equal((await executeTransportTest({ protocol:'tcp', host:'127.0.0.1', port:tcp.address().port })).status, 'success');
    const options = { protocol:'udp', host:'127.0.0.1', port:udp.address().port, payload:'1234', encoding:'hex' };
    assert.equal((await executeTransportTest({ ...options, expected:'ff' })).status, 'success');
    assert.equal((await executeTransportTest({ ...options, expected:'abcd' })).stage, 'assertion');
    assert.throws(() => executeTransportTest({ ...options, payload:'not hex' }));
    assert.throws(() => executeTransportTest({ ...options, host:'example.com;id' }));
  } finally { tcp.close(); udp.close(); }
});

test('UDP silence does not imply a closed port', async () => {
  const socket = dgram.createSocket('udp4');
  socket.bind(0, '127.0.0.1');
  await once(socket, 'listening');
  try {
    const result = await executeTransportTest({ protocol:'udp', host:'127.0.0.1', port:socket.address().port, payload:'ping', timeout:100 });
    assert.equal(result.status, 'failure');
    assert.equal(result.observation, 'no_response');
    assert.match(result.error, /does not prove/);
  } finally { socket.close(); }
});
