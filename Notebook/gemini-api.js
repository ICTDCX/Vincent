// Gemini API Integration với hỗ trợ nhiều API keys
class GeminiAPI {
    constructor() {
        this.apiKeys = ['AIzaSyCdZmRnl6cUxgo8ObjBcxz135PuFTKNLyo']; // API keys array
        this.currentKeyIndex = 0; // Index của key đang sử dụng
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
        this.isConnected = this.apiKeys.length > 0;
        this.fallbackEnabled = true; // Tự động chuyển key khi bị lỗi
        this.loadBalanceEnabled = true; // Cân bằng tải giữa các keys
        this.keyStats = {}; // Thống kê sử dụng của từng key
        
        // Khởi tạo stats cho mỗi key
        this.apiKeys.forEach((key, index) => {
            this.keyStats[index] = {
                requests: 0,
                errors: 0,
                lastUsed: null,
                status: 'unknown'
            };
        });
    }

    // Set API key
    setApiKey(apiKey) {
        // Thêm key mới hoặc cập nhật key hiện tại
        if (this.apiKeys.length === 0) {
            this.apiKeys.push(apiKey);
            this.currentKeyIndex = 0;
        } else {
            this.apiKeys[this.currentKeyIndex] = apiKey;
        }
        this.isConnected = apiKey && apiKey.length > 0;
        return this.isConnected;
    }

    addApiKey(apiKey) {
        this.apiKeys.push(apiKey);
        const newIndex = this.apiKeys.length - 1;
        this.keyStats[newIndex] = {
            requests: 0,
            errors: 0,
            lastUsed: null,
            status: 'unknown'
        };
        return newIndex;
    }

    removeApiKey(index) {
        if (index >= 0 && index < this.apiKeys.length) {
            this.apiKeys.splice(index, 1);
            delete this.keyStats[index];
            
            // Cập nhật lại stats indices
            const newStats = {};
            this.apiKeys.forEach((key, newIndex) => {
                newStats[newIndex] = this.keyStats[newIndex] || {
                    requests: 0,
                    errors: 0,
                    lastUsed: null,
                    status: 'unknown'
                };
            });
            this.keyStats = newStats;
            
            // Điều chỉnh currentKeyIndex nếu cần
            if (this.currentKeyIndex >= this.apiKeys.length) {
                this.currentKeyIndex = Math.max(0, this.apiKeys.length - 1);
            }
        }
    }

    getCurrentApiKey() {
        return this.apiKeys[this.currentKeyIndex] || null;
    }

    switchToNextKey() {
        if (this.apiKeys.length > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
            return this.apiKeys[this.currentKeyIndex];
        }
        return null;
    }

    getKeyStats() {
        return this.keyStats;
    }

    // Kiểm tra kết nối
    async testConnection() {
        if (!this.isConnected) {
            throw new Error('API key chưa được cấu hình');
        }

        try {
            const response = await this.sendMessage('Xin chào, kiểm tra kết nối');
            return response.success;
        } catch (error) {
            console.error('Lỗi kết nối Gemini API:', error);
            return false;
        }
    }

    // Gửi tin nhắn đến Gemini với fallback
    async sendMessage(message, context = '') {
        if (!this.isConnected || this.apiKeys.length === 0) {
            throw new Error('API key chưa được cấu hình');
        }

        let lastError = null;
        const triedKeys = new Set();

        // Thử với tất cả keys cho đến khi thành công
        for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
            const currentKey = this.apiKeys[this.currentKeyIndex];
            
            if (triedKeys.has(this.currentKeyIndex)) {
                // Đã thử key này rồi, chuyển sang key tiếp theo
                this.switchToNextKey();
                continue;
            }

            triedKeys.add(this.currentKeyIndex);

            try {
                const url = `${this.baseURL}?key=${currentKey}`;
                
                // Cập nhật stats
                this.keyStats[this.currentKeyIndex].requests++;
                this.keyStats[this.currentKeyIndex].lastUsed = new Date().toISOString();
                this.keyStats[this.currentKeyIndex].status = 'active';
                
                // Tạo prompt với context về hệ thống đề thi
                const systemPrompt = `Bạn là Vincent E Neu, trợ lý thông minh hỗ trợ học tập chuyên về hệ thống tổng hợp đề thi và đáp án đại học. 
                
Hãy trả lời bằng tiếng Việt, ngắn gọn và chính xác. Nếu được hỏi về đề thi, hãy cung cấp thông tin hữu ích dựa trên kiến thức của bạn.

Context: ${context}

Câu hỏi của người dùng: ${message}`;

                const requestBody = {
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    
                    // Kiểm tra nếu là lỗi rate limit hoặc quota exceeded
                    if (response.status === 429 || errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('rate')) {
                        // Đánh dấu key này bị giới hạn
                        this.keyStats[this.currentKeyIndex].status = 'limited';
                        this.keyStats[this.currentKeyIndex].errors++;
                        lastError = new Error(`Key ${this.currentKeyIndex + 1} bị giới hạn: ${errorData.error?.message}`);
                        
                        // Chuyển sang key tiếp theo nếu có
                        if (this.fallbackEnabled && this.apiKeys.length > 1) {
                            this.switchToNextKey();
                            continue;
                        }
                    }
                    
                    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    // Cập nhật stats thành công
                    this.keyStats[this.currentKeyIndex].status = 'active';
                    
                    return {
                        success: true,
                        message: data.candidates[0].content.parts[0].text,
                        usage: data.usageMetadata,
                        usedKeyIndex: this.currentKeyIndex
                    };
                } else {
                    throw new Error('Không nhận được phản hồi từ AI');
                }

            } catch (error) {
                // Cập nhật stats lỗi
                this.keyStats[this.currentKeyIndex].errors++;
                this.keyStats[this.currentKeyIndex].status = 'error';
                lastError = error;
                
                // Nếu còn key khác và fallback được bật, thử key tiếp theo
                if (this.fallbackEnabled && triedKeys.size < this.apiKeys.length) {
                    this.switchToNextKey();
                    continue;
                }
            }
        }

        // Nếu tất cả keys đều thất bại
        console.error('Tất cả API keys đều thất bại:', lastError);
        return {
            success: false,
            error: lastError ? lastError.message : 'Tất cả API keys đều không khả dụng'
        };
    }

    // Xử lý tin nhắn với context từ tài liệu
    async sendMessageWithContext(message, selectedDocument = null) {
        let context = '';
        
        if (selectedDocument) {
            // Thêm context từ tài liệu được chọn
            context = `Người dùng đang tra cứu về: ${selectedDocument.ten}. 
            Nội dung tài liệu: ${selectedDocument.noiDung}`;
        }

        return await this.sendMessage(message, context);
    }
}

// Khởi tạo instance
const geminiAPI = new GeminiAPI();

// Export để sử dụng trong file khác
window.geminiAPI = geminiAPI;

// Test kết nối khi load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const isConnected = await geminiAPI.testConnection();
        console.log('Gemini API kết nối:', isConnected ? 'Thành công' : 'Thất bại');
        
        if (isConnected) {
            // Cập nhật trạng thái nếu có element
            const statusElement = document.getElementById('apiStatus');
            if (statusElement) {
                statusElement.className = 'api-status connected';
                statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Đã kết nối</span>';
            }
        }
    } catch (error) {
        console.error('Lỗi test kết nối:', error);
    }
});
