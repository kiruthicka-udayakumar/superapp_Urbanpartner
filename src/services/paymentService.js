import api from './api';

class PaymentService {
    constructor() {
        this.razorpay = null;
        this.initializeRazorpay();
    }

    initializeRazorpay() {
        if (typeof window !== 'undefined' && !window.Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => console.log('✅ Razorpay SDK loaded');
            script.onerror = () => console.error('❌ Failed to load Razorpay SDK');
            document.head.appendChild(script);
        }
    }

    async getRazorpayKey() {
        try {
            const response = await api.get('/payments/razorpay-key');
            if (response.data.success) {
                return response.data.data.key_id;
            }
            return null;
        } catch (error) {
            console.error('Error getting Razorpay key:', error);
            return null;
        }
    }

    async createRazorpayOrder(paymentData) {
        try {
            const response = await api.post('/payments/create-order', paymentData);
            return response.data;
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw error;
        }
    }

    async verifyPayment(verificationData) {
        try {
            const response = await api.post('/payments/verify', verificationData);
            return response.data;
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    }

    async processPayment(orderData, options = {}) {
        try {
            const razorpayKey = await this.getRazorpayKey();
            if (!razorpayKey) {
                throw new Error('Payment service is currently unavailable');
            }

            const orderResponse = await this.createRazorpayOrder({
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                order_id: orderData.order_id,
                order_model: 'ServiceBooking',
                description: orderData.description || 'Urban Service Payment',
                email: orderData.email || 'customer@example.com',
                contact: orderData.contact || '9876543210'
            });

            if (!orderResponse.success) {
                throw new Error('Failed to create payment order');
            }

            const { razorpayOrder, payment } = orderResponse.data;

            const paymentOptions = {
                key: razorpayKey,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: options.businessName || 'Urban Partner',
                description: orderData.description || 'Payment for service',
                order_id: razorpayOrder.id,
                handler: async (response) => {
                    try {
                        const verificationData = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            payment_id: payment._id
                        };

                        const verificationResponse = await this.verifyPayment(verificationData);
                        if (verificationResponse.success) {
                            if (options.onSuccess) options.onSuccess(verificationResponse.data);
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (error) {
                        if (options.onError) options.onError(error);
                    }
                },
                prefill: {
                    name: orderData.customerName || '',
                    email: orderData.email || '',
                    contact: orderData.contact || ''
                },
                theme: {
                    color: options.themeColor || '#3b82f6'
                },
                modal: {
                    ondismiss: () => {
                        if (options.onCancel) options.onCancel();
                    }
                }
            };

            const rzp = new window.Razorpay(paymentOptions);
            rzp.open();

        } catch (error) {
            console.error('Payment processing error:', error);
            if (options.onError) options.onError(error);
            throw error;
        }
    }
}

export default new PaymentService();
