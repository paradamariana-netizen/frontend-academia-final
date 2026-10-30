import { dancerRepository } from "./dancerRepository";
import { storageService } from "../services/storageService";
import type { NewPaymentRecord, PaymentRecord } from "../types/payment";

const PAYMENT_KEY = "app_payments";

function createId(): string {
  return `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getRecords(): PaymentRecord[] {
  return storageService.get<PaymentRecord[]>(PAYMENT_KEY) ?? [];
}

function saveRecords(records: PaymentRecord[]): void {
  storageService.set(PAYMENT_KEY, records);
}

function ensureCurrentMonthRecords(): PaymentRecord[] {
  const current = getRecords();
  const month = getMonthKey();
  const dancers = dancerRepository.getDancers();
  const existingIds = new Set(
    current.filter((payment) => payment.month === month).map((payment) => payment.dancerId)
  );

  const missing = dancers
    .filter((dancer) => !existingIds.has(dancer.id))
    .map<PaymentRecord>((dancer) => ({
      id: createId(),
      dancerId: dancer.id,
      dancerName: dancer.name,
      month,
      amount: 150,
      status: "PENDIENTE",
      paymentDate: null,
    }));

  if (missing.length === 0) return current;

  const updated = [...current, ...missing];
  saveRecords(updated);
  return updated;
}

export const paymentRepository = {
  getPayments(): PaymentRecord[] {
    return ensureCurrentMonthRecords();
  },

  getMonthKey,

  registerPayment(id: string): boolean {
    const records = getRecords();
    const index = records.findIndex((payment) => payment.id === id);
    if (index === -1) return false;

    records[index] = {
      ...records[index],
      status: "PAGADO",
      paymentDate: new Date().toISOString(),
    };
    saveRecords(records);
    return true;
  },

  updateAmount(id: string, amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0) return false;

    const records = getRecords();
    const index = records.findIndex((payment) => payment.id === id);
    if (index === -1) return false;

    records[index] = { ...records[index], amount };
    saveRecords(records);
    return true;
  },

  createPayment(data: NewPaymentRecord): PaymentRecord {
    const payment: PaymentRecord = {
      ...data,
      id: createId(),
      status: "PENDIENTE",
      paymentDate: null,
    };
    saveRecords([...getRecords(), payment]);
    return payment;
  },
};
