function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured`);
  }
  return value;
}

module.exports = {
  uiHost: "0.0.0.0",
  uiPort: Number(process.env.PORT || "1880"),
  flowFile: "flows.json",
  credentialSecret: required("NODE_RED_CREDENTIAL_SECRET"),
  httpAdminRoot: "/editor",
  httpNodeRoot: "/plc",
  adminAuth: {
    type: "credentials",
    users: [{
      username: required("NODE_RED_ADMIN_USER"),
      password: required("NODE_RED_ADMIN_PASSWORD_HASH"),
      permissions: "*",
    }],
  },
  httpNodeAuth: {
    user: required("NODE_RED_BRIDGE_USER"),
    pass: required("NODE_RED_BRIDGE_PASSWORD_HASH"),
  },
};
