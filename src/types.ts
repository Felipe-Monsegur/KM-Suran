export type Trip = {
  id: string;
  userId: string;
  userDisplayName: string;
  km: number;
  date: string;
  note: string;
  createdAt: string;
};

export type FuelCharge = {
  id: string;
  userId: string;
  userDisplayName: string;
  amount: number;
  liters: number | null;
  date: string;
  note: string;
  createdAt: string;
};
