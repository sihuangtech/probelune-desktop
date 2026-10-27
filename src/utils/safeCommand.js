const net = require("node:net");
function host(value) {
  if (
    typeof value !== "string" ||
    value.length > 253 ||
    (!net.isIP(value) && !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.?$/i.test(value))
  )
    throw new Error("Invalid host");
  return value;
}
function integer(value, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error(`Expected integer ${min}–${max}`);
  return String(value);
}
module.exports = { host, integer };
