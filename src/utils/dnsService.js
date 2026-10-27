const { Resolver, lookup } = require('node:dns/promises');
const net = require('node:net');
const types = ['A','AAAA','CNAME','MX','TXT','NS','SOA'];
const validDomain = value => typeof value === 'string' && value.length <= 253 && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.?$/i.test(value);
module.exports = {
 async resolve(domain) { try { return (await lookup(domain)).address; } catch { return domain; } },
 async test(domain,recordType='A',dnsServer='default') {
  const started=Date.now();
  try {
   if(!validDomain(domain) || !types.includes(recordType.toUpperCase()))throw new Error('Invalid domain or record type');
   // 每次检测使用独立 Resolver，不修改进程全局 DNS 配置。
   const resolver=new Resolver({timeout:5000,tries:1});
   if(dnsServer!=='default') {
    if(!net.isIP(dnsServer))throw new Error('Invalid DNS server IP');
    resolver.setServers([dnsServer]);
   }
   const records=await resolver.resolve(domain,recordType.toUpperCase());
   const list=Array.isArray(records)?records:[records];
   const values=list.map(r=>Array.isArray(r)?r.join(''):typeof r==='object'?JSON.stringify(r):r);
   return {success:true,domain,recordType,result:values.join(', ')||'No records',responseTime:Date.now()-started,dnsServer};
  } catch(error) {return {success:false,domain,recordType,result:error.message,error:error.message,responseTime:Date.now()-started,dnsServer};}
 },
 getSupportedRecordTypes:()=>[...types],validateDomain:validDomain,
 validateDnsServer:value=>value==='default'||Boolean(net.isIP(value)),
 async batchTest(queries){return Promise.all(queries.map(q=>this.test(q.domain,q.recordType,q.dnsServer)));},
};
