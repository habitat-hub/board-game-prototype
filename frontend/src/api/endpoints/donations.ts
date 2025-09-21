import axiosInstance from '@/api/client';

export interface CreateDonationCheckoutSessionRequest {
  amount: number;
}

export interface CreateDonationCheckoutSessionResponse {
  sessionId: string;
  sessionUrl: string | null;
}

export const donationsService = {
  async createCheckoutSession({
    amount,
  }: CreateDonationCheckoutSessionRequest) {
    const response =
      await axiosInstance.post<CreateDonationCheckoutSessionResponse>(
        '/api/donations/checkout-session',
        {
          amount,
        }
      );

    return response.data;
  },
};
