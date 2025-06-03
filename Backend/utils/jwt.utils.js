import { sign, verify } from "jsonwebtoken";

export const ACCESS_TOKEN_EXPIRY = 60 * 24 * 60 * 60;
export const REFRESH_TOKEN_EXPIRY = 60 * 24 * 60 * 60;
const getTokenExpiration = (accessToken, secretKey) => {
  try {
    const decodedAccessToken = verify(accessToken, secretKey);
    return decodedAccessToken.exp;
  } catch (err) {
    console.error("Error decoding access token:", err);
    return null;
  }
};

export const createToken = (user) => {
  const secretKey = `${process.env.ACCESS_SECRET_KEY}${user?.id}`;
  const expiresIn = ACCESS_TOKEN_EXPIRY;
  const accessToken = sign(user, secretKey, { expiresIn: expiresIn });
  return {
    expiresIn: Number(getTokenExpiration(accessToken, secretKey)),
    accessToken: accessToken,
  };
};

export const createRefreshToken = (user) => {
  const expiresIn = REFRESH_TOKEN_EXPIRY;
  const secret = `${process.env.REFRESH_SECRET_KEY}${user?.id}`;
  const dataStoredInToken = {
    ...user,
    iat: Math.floor(Date.now() / 1000),
  };
  const refreshToken = sign(dataStoredInToken, secret, {
    expiresIn: expiresIn,
  });
  return {
    refreshExpiresIn: Number(getTokenExpiration(refreshToken, secret)),
    refreshToken: refreshToken,
  };
};
