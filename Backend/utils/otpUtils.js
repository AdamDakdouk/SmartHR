import speakeasy from "speakeasy";

export const generateOTP = async () => {
  const secret = speakeasy.generateSecret({ length: 6 });
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: "base32",
    digits: 6,
  });
  return token;
};

export const formatString = async (str) => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
