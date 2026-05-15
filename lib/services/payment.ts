import type { PaymentStatus } from "@/lib/types";

export type PaymentIntent = {
  providerReference: string;
  status: PaymentStatus;
  instructions: string;
};

export interface PaymentProvider {
  createManualIntent(bookingCode: string, totalPriceRsd: number): Promise<PaymentIntent>;
  markPaid(bookingCode: string): Promise<PaymentIntent>;
  requestRefund(bookingCode: string, amountRsd?: number): Promise<PaymentIntent>;
}

export class ManualPaymentProvider implements PaymentProvider {
  async createManualIntent(bookingCode: string, totalPriceRsd: number) {
    return {
      providerReference: `manual-${bookingCode}`,
      status: "MANUAL_PENDING" as const,
      instructions: `Ručna uplata za ${bookingCode}: ${totalPriceRsd} RSD.`
    };
  }

  async markPaid(bookingCode: string) {
    return {
      providerReference: `manual-${bookingCode}`,
      status: "PAID" as const,
      instructions: "Uplata je ručno potvrđena."
    };
  }

  async requestRefund(bookingCode: string, amountRsd?: number) {
    return {
      providerReference: `manual-${bookingCode}`,
      status: "REFUND_PENDING" as const,
      instructions: amountRsd ? `Refundacija u obradi: ${amountRsd} RSD.` : "Refundacija u obradi."
    };
  }
}

export const paymentProvider = new ManualPaymentProvider();
