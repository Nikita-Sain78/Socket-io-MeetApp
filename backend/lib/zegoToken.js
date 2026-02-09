import crypto from "crypto";

export function generateToken04(appId, userId, serverSecret, effectiveTimeInSeconds, roomId) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    app_id: appId,
    user_id: userId,
    room_id: roomId,
    exp: Math.floor(Date.now() / 1000) + effectiveTimeInSeconds,
    nonce: Math.floor(Math.random() * 100000),
    iat: Math.floor(Date.now() / 1000),
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", serverSecret)
    .update(`${base64Header}.${base64Payload}`)
    .digest("base64url");

  return `${base64Header}.${base64Payload}.${signature}`;
}
