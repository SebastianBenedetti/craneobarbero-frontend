export const PASSWORD_POLICY = "La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número.";

export const isStrongPassword = (value) =>
  typeof value === "string" &&
  value.length >= 8 &&
  new TextEncoder().encode(value).length <= 72 &&
  /\p{L}/u.test(value) &&
  /\p{Nd}/u.test(value);
