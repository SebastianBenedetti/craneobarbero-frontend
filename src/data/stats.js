// La fecha de fundación es el 1 de mayo de 2020
const foundingDate = new Date(2020, 5, 1);
const yearsInBusiness = Math.floor(
  (new Date() - foundingDate) / (1000 * 60 * 60 * 24 * 365.25),
);

const stats = [
  { value: 4, suffix: "", label: "Sucursales" },
  { value: 12000, suffix: "+", label: "Clientes" },
  { value: yearsInBusiness, suffix: "", label: "Años en el rubro" },
];

export default stats;
