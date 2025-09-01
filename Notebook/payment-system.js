/**
 * Payment System for Vincent E Neu
 * Handles subscriptions, payments, and usage limits
 */

class PaymentSystem {
    constructor() {
        this.plans = {
            free: {
                name: 'Free',
                price: 0,
                features: {
                    maxFileUploads: 5,
                    maxFileSize: 5 * 1024 * 1024, // 5MB
                    maxAiInteractions: 10,
                    maxSearchQueries: 20,
                    subjects: ['toanHoc'],
                    support: 'Email'
                }
            },
            basic: {
                name: 'Basic',
                price: 99000, // 99k VND/month
                features: {
                    maxFileUploads: 50,
                    maxFileSize: 10 * 1024 * 1024, // 10MB
                    maxAiInteractions: 100,
                    maxSearchQueries: 200,
                    subjects: ['toanHoc', 'vanHoc'],
                    support: 'Email + Chat'
                }
            },
            premium: {
                name: 'Premium',
                price: 199000, // 199k VND/month
                features: {
                    maxFileUploads: 200,
                    maxFileSize: 20 * 1024 * 1024, // 20MB
                    maxAiInteractions: 500,
                    maxSearchQueries: 1000,
                    subjects: ['toanHoc', 'vanHoc', 'tiengAnh', 'vatLy'],
                    support: 'Priority Support'
                }
            },
            vip: {
                name: 'VIP',
                price: 399000, // 399k VND/month
                features: {
                    maxFileUploads: -1, // Unlimited
                    maxFileSize: 50 * 1024 * 1024, // 50MB
                    maxAiInteractions: -1, // Unlimited
                    maxSearchQueries: -1, // Unlimited
                    subjects: ['toanHoc', 'vanHoc', 'tiengAnh', 'vatLy'],
                    support: '24/7 Support',
                    priority: true
                }
            }
        };
        
        this.currentPlan = 'free';
        this.usage = this.loadUsage();
        this.subscription = this.loadSubscription();
    }

    /**
     * Get current plan details
     * @returns {Object} Current plan
     */
    getCurrentPlan() {
        return this.plans[this.currentPlan];
    }

    /**
     * Get all available plans
     * @returns {Object} All plans
     */
    getAllPlans() {
        return this.plans;
    }

    /**
     * Check if user can perform action
     * @param {string} action - Action to check
     * @param {number} count - Count for the action
     * @returns {Object} Check result
     */
    canPerformAction(action, count = 1) {
        const plan = this.getCurrentPlan();
        const currentUsage = this.usage[action] || 0;
        const limit = plan.features[action];
        
        if (limit === -1) {
            return { allowed: true, remaining: -1 };
        }
        
        const remaining = limit - currentUsage;
        const allowed = remaining >= count;
        
        return { allowed, remaining, limit };
    }

    /**
     * Record usage for an action
     * @param {string} action - Action performed
     * @param {number} count - Count to add
     */
    recordUsage(action, count = 1) {
        if (!this.usage[action]) {
            this.usage[action] = 0;
        }
        this.usage[action] += count;
        this.saveUsage();
    }

    /**
     * Get usage statistics
     * @returns {Object} Usage statistics
     */
    getUsageStats() {
        const plan = this.getCurrentPlan();
        const stats = {};
        
        Object.keys(plan.features).forEach(feature => {
            if (typeof plan.features[feature] === 'number') {
                const current = this.usage[feature] || 0;
                const limit = plan.features[feature];
                const percentage = limit > 0 ? (current / limit) * 100 : 0;
                
                stats[feature] = {
                    current,
                    limit,
                    remaining: limit > 0 ? limit - current : -1,
                    percentage: Math.min(percentage, 100)
                };
            }
        });
        
        return stats;
    }

    /**
     * Upgrade subscription
     * @param {string} planName - Plan to upgrade to
     * @returns {Promise<Object>} Upgrade result
     */
    async upgradeSubscription(planName) {
        if (!this.plans[planName]) {
            throw new Error('Invalid plan');
        }
        
        if (planName === this.currentPlan) {
            throw new Error('Already on this plan');
        }
        
        try {
            // Simulate payment processing
            const paymentResult = await this.processPayment(planName);
            
            if (paymentResult.success) {
                this.currentPlan = planName;
                this.subscription = {
                    plan: planName,
                    startDate: new Date().toISOString(),
                    endDate: this.calculateEndDate(),
                    status: 'active',
                    paymentId: paymentResult.paymentId
                };
                
                this.saveSubscription();
                return { success: true, message: 'Upgrade successful' };
            } else {
                throw new Error(paymentResult.error);
            }
            
        } catch (error) {
            throw new Error(`Upgrade failed: ${error.message}`);
        }
    }

    /**
     * Process payment
     * @param {string} planName - Plan name
     * @returns {Promise<Object>} Payment result
     */
    async processPayment(planName) {
        const plan = this.plans[planName];
        
        // Simulate payment processing
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate 95% success rate
                const success = Math.random() > 0.05;
                
                if (success) {
                    resolve({
                        success: true,
                        paymentId: 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        amount: plan.price,
                        currency: 'VND'
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'Payment failed. Please try again.'
                    });
                }
            }, 2000);
        });
    }

    /**
     * Calculate subscription end date
     * @returns {string} End date ISO string
     */
    calculateEndDate() {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        return endDate.toISOString();
    }

    /**
     * Check subscription status
     * @returns {Object} Subscription status
     */
    checkSubscriptionStatus() {
        if (!this.subscription) {
            return { active: false, message: 'No active subscription' };
        }
        
        const now = new Date();
        const endDate = new Date(this.subscription.endDate);
        
        if (now > endDate) {
            this.subscription.status = 'expired';
            this.saveSubscription();
            return { active: false, message: 'Subscription expired' };
        }
        
        return { active: true, subscription: this.subscription };
    }

    /**
     * Cancel subscription
     * @returns {Object} Cancellation result
     */
    cancelSubscription() {
        if (this.subscription) {
            this.subscription.status = 'cancelled';
            this.saveSubscription();
            return { success: true, message: 'Subscription cancelled' };
        }
        
        return { success: false, message: 'No active subscription to cancel' };
    }

    /**
     * Get billing history
     * @returns {Array} Billing history
     */
    getBillingHistory() {
        return JSON.parse(localStorage.getItem('billingHistory') || '[]');
    }

    /**
     * Add billing record
     * @param {Object} record - Billing record
     */
    addBillingRecord(record) {
        const history = this.getBillingHistory();
        history.push({
            ...record,
            date: new Date().toISOString()
        });
        localStorage.setItem('billingHistory', JSON.stringify(history));
    }

    /**
     * Get payment methods
     * @returns {Array} Payment methods
     */
    getPaymentMethods() {
        return [
            { id: 'momo', name: 'MoMo', icon: '💜' },
            { id: 'zalo', name: 'ZaloPay', icon: '💙' },
            { id: 'vnpay', name: 'VNPay', icon: '🟢' },
            { id: 'bank', name: 'Chuyển khoản ngân hàng', icon: '🏦' }
        ];
    }

    /**
     * Generate payment QR code
     * @param {string} planName - Plan name
     * @param {string} method - Payment method
     * @returns {Object} QR code data
     */
    generatePaymentQR(planName, method) {
        const plan = this.plans[planName];
        const paymentId = 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Simulate QR code generation
        const qrData = {
            paymentId,
            amount: plan.price,
            currency: 'VND',
            description: `Vincent E Neu - ${plan.name} Plan`,
            method
        };
        
        return {
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`,
            paymentId,
            amount: plan.price,
            method
        };
    }

    /**
     * Check payment status
     * @param {string} paymentId - Payment ID
     * @returns {Promise<Object>} Payment status
     */
    async checkPaymentStatus(paymentId) {
        // Simulate payment status check
        return new Promise((resolve) => {
            setTimeout(() => {
                const statuses = ['pending', 'completed', 'failed'];
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                
                resolve({
                    paymentId,
                    status: randomStatus,
                    timestamp: new Date().toISOString()
                });
            }, 1000);
        });
    }

    /**
     * Reset usage (monthly reset)
     */
    resetUsage() {
        const now = new Date();
        const lastReset = new Date(localStorage.getItem('lastUsageReset') || 0);
        
        // Reset if it's a new month
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            this.usage = {};
            this.saveUsage();
            localStorage.setItem('lastUsageReset', now.toISOString());
        }
    }

    /**
     * Get upgrade recommendations
     * @returns {Array} Upgrade recommendations
     */
    getUpgradeRecommendations() {
        const recommendations = [];
        const usageStats = this.getUsageStats();
        
        // Check file uploads
        if (usageStats.maxFileUploads && usageStats.maxFileUploads.percentage > 80) {
            recommendations.push({
                type: 'file_uploads',
                message: 'Bạn đã sử dụng gần hết giới hạn upload file. Nâng cấp để có thêm dung lượng!',
                suggestedPlan: 'basic'
            });
        }
        
        // Check AI interactions
        if (usageStats.maxAiInteractions && usageStats.maxAiInteractions.percentage > 80) {
            recommendations.push({
                type: 'ai_interactions',
                message: 'Bạn đã sử dụng gần hết giới hạn tương tác AI. Nâng cấp để có thêm lượt chat!',
                suggestedPlan: 'premium'
            });
        }
        
        // Check subjects
        if (this.currentPlan === 'free') {
            recommendations.push({
                type: 'subjects',
                message: 'Nâng cấp để truy cập tất cả môn học!',
                suggestedPlan: 'basic'
            });
        }
        
        return recommendations;
    }

    /**
     * Load usage from localStorage
     * @returns {Object} Usage data
     */
    loadUsage() {
        try {
            return JSON.parse(localStorage.getItem('usage') || '{}');
        } catch (error) {
            return {};
        }
    }

    /**
     * Save usage to localStorage
     */
    saveUsage() {
        localStorage.setItem('usage', JSON.stringify(this.usage));
    }

    /**
     * Load subscription from localStorage
     * @returns {Object} Subscription data
     */
    loadSubscription() {
        try {
            return JSON.parse(localStorage.getItem('subscription') || 'null');
        } catch (error) {
            return null;
        }
    }

    /**
     * Save subscription to localStorage
     */
    saveSubscription() {
        localStorage.setItem('subscription', JSON.stringify(this.subscription));
    }

    /**
     * Initialize payment system
     */
    init() {
        this.resetUsage();
        this.checkSubscriptionStatus();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentSystem;
} else {
    window.PaymentSystem = PaymentSystem;
}

