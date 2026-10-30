export type PaymentStatus = "PAGADO" | "PENDIENTE";

export interface PaymentRecord {
  id: string;
  dancerId: string;
  dancerName: string;
  month: string;
  amount: number;
  status: PaymentStatus;
  paymentDate: string | null;
}

export interface NewPaymentRecord {
  dancerId: string;
  dancerName: string;
  month: string;
  amount: number;
}
