export const INPUT_CLASS = "form-control bg-secondary text-white border-secondary";
export const SELECT_CLASS = "form-select bg-secondary text-white border-secondary";

export const toNumberOrNull = (value) => (value === "" || value === null || value === undefined ? null : Number(value));

export const textOrNull = (value) => (value && value.trim() ? value.trim() : null);

export const paginate = (items, page, size) => items.slice((page - 1) * size, page * size);

export const movementTypeNames = {
  in: "Compra",
  sale: "Venta",
  adjustment: "Ajuste",
  refund: "Devolución",
};
