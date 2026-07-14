import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import StripeCheckoutForm from './StripeCheckoutForm';
import type { Order } from '../../types';

interface PendingPayment {
  orderId: number;
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
  orderDraft: Omit<Order, 'id' | 'createdAt'>;
}

let stripePromiseCache: Promise<Stripe | null> | null = null;

function getStripe(publishableKey: string) {
  if (!stripePromiseCache) {
    stripePromiseCache = loadStripe(publishableKey);
  }
  return stripePromiseCache;
}

interface Props {
  pendingPayment: PendingPayment;
  onCancel: () => void;
  onSuccess: () => void | Promise<void>;
}

export default function StripePaymentPanel({ pendingPayment, onCancel, onSuccess }: Props) {
  return (
    <Elements
      stripe={getStripe(pendingPayment.publishableKey)}
      options={{
        clientSecret: pendingPayment.clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <StripeCheckoutForm onCancel={onCancel} onSuccess={onSuccess} />
    </Elements>
  );
}
