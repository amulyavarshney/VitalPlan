import { test, expect } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

test.describe('API-backed checkout', () => {
  test('register, create demo order, pay, and see history', async ({ request }) => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = 'secret12';

    const register = await request.post(`${API_URL}/auth/register`, {
      data: { email, password, name: 'E2E Shopper' },
    });
    expect(register.ok()).toBeTruthy();

    const login = await request.post(`${API_URL}/auth/login`, {
      data: { email, password },
    });
    expect(login.ok()).toBeTruthy();
    const { access_token } = await login.json();
    expect(access_token).toBeTruthy();

    const auth = { Authorization: `Bearer ${access_token}` };
    const create = await request.post(`${API_URL}/orders/`, {
      headers: auth,
      data: {
        items: [
          {
            id: 'e2e-item-1',
            name: 'E2E Whey',
            quantity: 1,
            price: 49.99,
            type: 'supplement',
          },
        ],
        total: 59.98,
        vendor: 'amazon',
        delivery_address: '123 E2E Street',
        payment_method: 'card',
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = await create.json();
    expect(created.order_id).toBeGreaterThan(0);
    expect(created.payment.provider).toBe('demo');

    const pay = await request.post(`${API_URL}/orders/${created.order_id}/pay`, {
      headers: auth,
      data: { payment_intent_id: created.payment.payment_intent_id },
    });
    expect(pay.ok()).toBeTruthy();
    const paid = await pay.json();
    expect(paid.payment_status).toBe('paid');

    const history = await request.get(`${API_URL}/orders/`, { headers: auth });
    expect(history.ok()).toBeTruthy();
    const list = await history.json();
    expect(list.total).toBeGreaterThanOrEqual(1);
    const match = list.items.find((order: { id: number }) => order.id === created.order_id);
    expect(match).toBeTruthy();
    expect(match.payment_status).toBe('paid');
  });
});
