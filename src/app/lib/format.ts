export const formatNumber = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(value);
