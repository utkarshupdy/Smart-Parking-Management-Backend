import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/ApiError.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const processPayment = async ({ price, name }, token) => {
    const idempotencyKey = uuidv4();

    try {
        const customer = await stripe.customers.create({
            email: token.email,
            source: token.id,
        });

        const charge = await stripe.charges.create({
            amount: price * 100, 
            currency: 'usd',
            customer: customer.id,
            receipt_email: token.email,
            description: `Purchase of ${name}`,
            shipping: {
                name: token.card.name,
                address: {
                    country: token.card.address_country,
                },
            },
        }, { idempotencyKey });

        return { success: true, charge };
    } catch (error) {
        console.error('Stripe Payment Error:', error);
        throw new ApiError(500, "Payment processing error.");
    }
};
