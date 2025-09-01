/**
 * Analytics System for Vincent E Neu
 * Tracks usage statistics, performance metrics, and user behavior
 */

class AnalyticsSystem {
    constructor() {
        this.events = [];
        this.metrics = {
            pageViews: 0,
            fileUploads: 0,
            searches: 0,
            aiInteractions: 0,
            userLogins: 0,
            errors: 0
        };
        this.performance = {
            apiResponseTimes: [],
            fileProcessingTimes: [],
            pageLoadTimes: []
        };
        this.userBehavior = {
            sessionDuration: 0,
            pagesVisited: [],
            featuresUsed: new Set(),
            searchQueries: []
        };
        
        this.startTime = Date.now();
        this.loadAnalytics();
    }

    /**
     * Track page view
     * @param {string} page - Page name
     * @param {Object} metadata - Additional metadata
     */
    trackPageView(page, metadata = {}) {
        const event = {
            type: 'page_view',
            page: page,
            timestamp: new Date().toISOString(),
            metadata: metadata
        };
        
        this.events.push(event);
        this.metrics.pageViews++;
        this.userBehavior.pagesVisited.push(page);
        
        this.saveAnalytics();
    }

    /**
     * Track file upload
     * @param {Object} fileData - File information
     * @param {number} processingTime - Processing time in ms
     */
    trackFileUpload(fileData, processingTime = 0) {
        const event = {
            type: 'file_upload',
            file: {
                name: fileData.name,
                size: fileData.size,
                type: fileData.type,
                subject: fileData.subject
            },
            processingTime: processingTime,
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        this.metrics.fileUploads++;
        this.performance.fileProcessingTimes.push(processingTime);
        this.userBehavior.featuresUsed.add('file_upload');
        
        this.saveAnalytics();
    }

    /**
     * Track search
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @param {number} resultCount - Number of results
     */
    trackSearch(query, filters = {}, resultCount = 0) {
        const event = {
            type: 'search',
            query: query,
            filters: filters,
            resultCount: resultCount,
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        this.metrics.searches++;
        this.userBehavior.searchQueries.push(query);
        this.userBehavior.featuresUsed.add('search');
        
        this.saveAnalytics();
    }

    /**
     * Track AI interaction
     * @param {string} question - User question
     * @param {string} response - AI response
     * @param {number} responseTime - Response time in ms
     * @param {string} subject - Subject context
     */
    trackAIInteraction(question, response, responseTime = 0, subject = null) {
        const event = {
            type: 'ai_interaction',
            question: question.substring(0, 100), // Truncate for storage
            responseLength: response.length,
            responseTime: responseTime,
            subject: subject,
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        this.metrics.aiInteractions++;
        this.performance.apiResponseTimes.push(responseTime);
        this.userBehavior.featuresUsed.add('ai_chat');
        
        this.saveAnalytics();
    }

    /**
     * Track user login
     * @param {string} userRole - User role
     * @param {string} loginMethod - Login method used
     */
    trackUserLogin(userRole, loginMethod = 'password') {
        const event = {
            type: 'user_login',
            userRole: userRole,
            loginMethod: loginMethod,
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        this.metrics.userLogins++;
        
        this.saveAnalytics();
    }

    /**
     * Track error
     * @param {string} errorType - Type of error
     * @param {string} errorMessage - Error message
     * @param {string} context - Error context
     */
    trackError(errorType, errorMessage, context = '') {
        const event = {
            type: 'error',
            errorType: errorType,
            errorMessage: errorMessage,
            context: context,
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        this.metrics.errors++;
        
        this.saveAnalytics();
    }

    /**
     * Track performance metric
     * @param {string} metricType - Type of metric
     * @param {number} value - Metric value
     */
    trackPerformance(metricType, value) {
        if (this.performance[metricType]) {
            this.performance[metricType].push(value);
        }
        
        this.saveAnalytics();
    }

    /**
     * End session and calculate metrics
     */
    endSession() {
        const sessionDuration = Date.now() - this.startTime;
        this.userBehavior.sessionDuration = sessionDuration;
        
        const event = {
            type: 'session_end',
            duration: sessionDuration,
            pagesVisited: this.userBehavior.pagesVisited.length,
            featuresUsed: Array.from(this.userBehavior.featuresUsed),
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        this.saveAnalytics();
    }

    /**
     * Get analytics summary
     * @returns {Object} Analytics summary
     */
    getAnalyticsSummary() {
        const avgApiResponseTime = this.performance.apiResponseTimes.length > 0 
            ? this.performance.apiResponseTimes.reduce((a, b) => a + b, 0) / this.performance.apiResponseTimes.length 
            : 0;
            
        const avgFileProcessingTime = this.performance.fileProcessingTimes.length > 0 
            ? this.performance.fileProcessingTimes.reduce((a, b) => a + b, 0) / this.performance.fileProcessingTimes.length 
            : 0;
            
        const avgPageLoadTime = this.performance.pageLoadTimes.length > 0 
            ? this.performance.pageLoadTimes.reduce((a, b) => a + b, 0) / this.performance.pageLoadTimes.length 
            : 0;

        return {
            metrics: this.metrics,
            performance: {
                avgApiResponseTime: Math.round(avgApiResponseTime),
                avgFileProcessingTime: Math.round(avgFileProcessingTime),
                avgPageLoadTime: Math.round(avgPageLoadTime),
                totalApiCalls: this.performance.apiResponseTimes.length,
                totalFilesProcessed: this.performance.fileProcessingTimes.length
            },
            userBehavior: {
                sessionDuration: this.userBehavior.sessionDuration,
                pagesVisited: this.userBehavior.pagesVisited.length,
                featuresUsed: Array.from(this.userBehavior.featuresUsed),
                searchQueries: this.userBehavior.searchQueries.length
            },
            recentEvents: this.events.slice(-10) // Last 10 events
        };
    }

    /**
     * Get subject usage statistics
     * @returns {Object} Subject usage stats
     */
    getSubjectUsageStats() {
        const stats = {
            toanHoc: 0,
            vanHoc: 0,
            tiengAnh: 0,
            vatLy: 0
        };
        
        this.events.forEach(event => {
            if (event.type === 'file_upload' && event.file.subject) {
                stats[event.file.subject] = (stats[event.file.subject] || 0) + 1;
            }
            if (event.type === 'ai_interaction' && event.subject) {
                stats[event.subject] = (stats[event.subject] || 0) + 1;
            }
        });
        
        return stats;
    }

    /**
     * Get popular search queries
     * @param {number} limit - Number of queries to return
     * @returns {Array} Popular queries
     */
    getPopularSearchQueries(limit = 10) {
        const queryCount = {};
        
        this.userBehavior.searchQueries.forEach(query => {
            queryCount[query] = (queryCount[query] || 0) + 1;
        });
        
        return Object.entries(queryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([query, count]) => ({ query, count }));
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const errorStats = {};
        
        this.events.forEach(event => {
            if (event.type === 'error') {
                errorStats[event.errorType] = (errorStats[event.errorType] || 0) + 1;
            }
        });
        
        return errorStats;
    }

    /**
     * Get daily activity
     * @param {number} days - Number of days to look back
     * @returns {Array} Daily activity data
     */
    getDailyActivity(days = 7) {
        const dailyData = {};
        const now = new Date();
        
        // Initialize daily data
        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyData[dateStr] = {
                pageViews: 0,
                fileUploads: 0,
                searches: 0,
                aiInteractions: 0,
                userLogins: 0,
                errors: 0
            };
        }
        
        // Count events by date
        this.events.forEach(event => {
            const eventDate = event.timestamp.split('T')[0];
            if (dailyData[eventDate]) {
                switch (event.type) {
                    case 'page_view':
                        dailyData[eventDate].pageViews++;
                        break;
                    case 'file_upload':
                        dailyData[eventDate].fileUploads++;
                        break;
                    case 'search':
                        dailyData[eventDate].searches++;
                        break;
                    case 'ai_interaction':
                        dailyData[eventDate].aiInteractions++;
                        break;
                    case 'user_login':
                        dailyData[eventDate].userLogins++;
                        break;
                    case 'error':
                        dailyData[eventDate].errors++;
                        break;
                }
            }
        });
        
        return Object.entries(dailyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({ date, ...data }));
    }

    /**
     * Export analytics data
     * @returns {Object} Complete analytics data
     */
    exportAnalytics() {
        return {
            summary: this.getAnalyticsSummary(),
            subjectUsage: this.getSubjectUsageStats(),
            popularQueries: this.getPopularSearchQueries(),
            errorStats: this.getErrorStats(),
            dailyActivity: this.getDailyActivity(),
            events: this.events,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Save analytics to localStorage
     */
    saveAnalytics() {
        const analyticsData = {
            events: this.events.slice(-1000), // Keep last 1000 events
            metrics: this.metrics,
            performance: this.performance,
            userBehavior: this.userBehavior,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('analytics', JSON.stringify(analyticsData));
    }

    /**
     * Load analytics from localStorage
     */
    loadAnalytics() {
        try {
            const data = JSON.parse(localStorage.getItem('analytics') || '{}');
            
            if (data.events) this.events = data.events;
            if (data.metrics) this.metrics = data.metrics;
            if (data.performance) this.performance = data.performance;
            if (data.userBehavior) this.userBehavior = data.userBehavior;
            
        } catch (error) {
            console.warn('Failed to load analytics:', error);
        }
    }

    /**
     * Clear analytics data
     */
    clearAnalytics() {
        this.events = [];
        this.metrics = {
            pageViews: 0,
            fileUploads: 0,
            searches: 0,
            aiInteractions: 0,
            userLogins: 0,
            errors: 0
        };
        this.performance = {
            apiResponseTimes: [],
            fileProcessingTimes: [],
            pageLoadTimes: []
        };
        this.userBehavior = {
            sessionDuration: 0,
            pagesVisited: [],
            featuresUsed: new Set(),
            searchQueries: []
        };
        
        localStorage.removeItem('analytics');
    }

    /**
     * Initialize analytics tracking
     */
    init() {
        // Track page load time
        if (window.performance && window.performance.timing) {
            const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
            this.trackPerformance('pageLoadTimes', loadTime);
        }
        
        // Track current page view
        this.trackPageView(window.location.pathname || 'index');
        
        // Set up session end tracking
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsSystem;
} else {
    window.AnalyticsSystem = AnalyticsSystem;
}

