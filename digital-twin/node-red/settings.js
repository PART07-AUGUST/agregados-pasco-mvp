const crypto = require("crypto");

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured`);
  }
  return value;
}

const bridgeUser = required("NODE_RED_BRIDGE_USER");
const bridgeHash = required("NODE_RED_BRIDGE_PASSWORD_SCRYPT");
const hmiUser = required("NODE_RED_HMI_USER");
const hmiHash = required("NODE_RED_HMI_PASSWORD_SCRYPT");

function passwordMatches(password, stored) {
  const parts = stored.split(":");
  if (parts.length !== 2 || !/^[a-f0-9]{32}$/.test(parts[0]) || !/^[a-f0-9]{64}$/.test(parts[1])) {
    return false;
  }
  const salt = Buffer.from(parts[0], "hex");
  const expected = Buffer.from(parts[1], "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function protectHttpNodes(req, res, next) {
  const path = (req.originalUrl || "").split("?", 1)[0];
  const hmi = ["/plc/hmi", "/plc/hmi/", "/plc/hmi/status", "/plc/hmi/control"].includes(path);
  const user = hmi ? hmiUser : bridgeUser;
  const hash = hmi ? hmiHash : bridgeHash;
  const header = req.headers.authorization || "";
  let authorized = false;
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator > 0 && decoded.slice(0, separator) === user) {
      authorized = passwordMatches(decoded.slice(separator + 1), hash);
    }
  }
  if (authorized) return next();
  res.setHeader("WWW-Authenticate", `Basic realm="${hmi ? "Node-RED HMI" : "PLC bridge"}"`);
  res.setHeader("Cache-Control", "no-store");
  return res.status(401).json({ error: "unauthorized" });
}

module.exports = {
  uiHost: "0.0.0.0",
  uiPort: Number(process.env.PORT || "1880"),
  flowFile: "flows.json",
  credentialSecret: required("NODE_RED_CREDENTIAL_SECRET"),
  httpAdminRoot: "/editor",
  httpNodeRoot: "/plc",
  httpNodeMiddleware: protectHttpNodes,
  adminAuth: {
    type: "credentials",
    users: [{
      username: required("NODE_RED_ADMIN_USER"),
      password: required("NODE_RED_ADMIN_PASSWORD_HASH"),
      permissions: "*",
    }],
  },
};
