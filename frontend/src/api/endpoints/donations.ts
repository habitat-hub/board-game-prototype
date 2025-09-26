import type {
  DonationsCheckoutSessionCreateData,
  DonationsCheckoutSessionCreatePayload,
  DonationsOptionsListData,
} from '@/__generated__/api/client';
import axiosInstance from '@/api/client';

export interface CreateCheckoutSessionOptions {
  /**
   * Optional idempotency key used to deduplicate checkout session requests.
   * When provided it is passed as the `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export const donationService = {
  /**
   * Stripeで利用可能な寄付オプションの取得
   */
  getDonationOptions: async (): Promise<DonationsOptionsListData> => {
    const response = await axiosInstance.get<DonationsOptionsListData>(
      '/api/donations/options'
    );
    return response.data;
  },

  /**
   * 選択された寄付金額でStripe Checkoutセッションを作成
   */
  createCheckoutSession: async (
    payload: DonationsCheckoutSessionCreatePayload,
    options: CreateCheckoutSessionOptions = {}
  ): Promise<DonationsCheckoutSessionCreateData> => {
    const headers =
      typeof options.idempotencyKey === 'string' && options.idempotencyKey
        ? { 'Idempotency-Key': options.idempotencyKey }
        : undefined;

    const response =
      await axiosInstance.post<DonationsCheckoutSessionCreateData>(
        '/api/donations/checkout-session',
        payload,
        headers ? { headers } : undefined
      );

    return response.data;
  },
};
