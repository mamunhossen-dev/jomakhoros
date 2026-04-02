export const formatTaka = (amount: number) =>
  '৳' + amount.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
