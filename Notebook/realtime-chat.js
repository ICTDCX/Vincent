/**
 * Real-time Chat System for Vincent E Neu
 * Handles WebSocket connections, chat rooms, and real-time messaging
 */

class RealtimeChatSystem {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.rooms = new Map();
        this.messages = [];
        this.currentRoom = null;
        this.userId = null;
        this.userName = null;
        this.userRole = null;
        
        // Event handlers
        this.onMessage = null;
        this.onUserJoin = null;
        this.onUserLeave = null;
        this.onTyping = null;
        this.onConnectionChange = null;
        
        // Typing indicators
        this.typingUsers = new Map();
        this.typingTimeout = null;
    }

    /**
     * Initialize chat system
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} userRole - User role
     */
    init(userId, userName, userRole) {
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        
        // Generate WebSocket URL (in production, use real WebSocket server)
        const wsUrl = this.generateWebSocketUrl();
        this.connect(wsUrl);
    }

    /**
     * Generate WebSocket URL
     * @returns {string} WebSocket URL
     */
    generateWebSocketUrl() {
        // For demo purposes, simulate WebSocket connection
        // In production, this would be a real WebSocket server
        return 'wss://demo.vincent-e-neu.com/ws';
    }

    /**
     * Connect to WebSocket server
     * @param {string} url - WebSocket URL
     */
    connect(url) {
        try {
            // Simulate WebSocket connection
            this.simulateConnection(url);
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleConnectionError(error);
        }
    }

    /**
     * Simulate WebSocket connection for demo
     * @param {string} url - WebSocket URL
     */
    simulateConnection(url) {
        // Simulate connection delay
        setTimeout(() => {
            this.connected = true;
            this.socket = {
                send: (data) => this.handleOutgoingMessage(data),
                close: () => this.disconnect()
            };
            
            this.handleConnectionSuccess();
            
            // Simulate incoming messages
            this.startMessageSimulation();
            
        }, 1000);
    }

    /**
     * Handle connection success
     */
    handleConnectionSuccess() {
        console.log('WebSocket connected successfully');
        
        // Send user join message
        this.sendSystemMessage({
            type: 'user_join',
            userId: this.userId,
            userName: this.userName,
            userRole: this.userRole
        });
        
        // Notify connection change
        if (this.onConnectionChange) {
            this.onConnectionChange({ connected: true });
        }
    }

    /**
     * Handle connection error
     * @param {Error} error - Connection error
     */
    handleConnectionError(error) {
        console.error('WebSocket connection error:', error);
        this.connected = false;
        
        if (this.onConnectionChange) {
            this.onConnectionChange({ connected: false, error: error.message });
        }
        
        // Retry connection after 5 seconds
        setTimeout(() => {
            if (!this.connected) {
                this.connect(this.generateWebSocketUrl());
            }
        }, 5000);
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.socket) {
            this.connected = false;
            
            // Send user leave message
            this.sendSystemMessage({
                type: 'user_leave',
                userId: this.userId,
                userName: this.userName
            });
            
            // Clear simulation
            this.stopMessageSimulation();
            
            if (this.onConnectionChange) {
                this.onConnectionChange({ connected: false });
            }
        }
    }

    /**
     * Join a chat room
     * @param {string} roomId - Room ID
     * @param {string} roomName - Room name
     */
    joinRoom(roomId, roomName) {
        if (!this.connected) {
            throw new Error('Not connected to chat server');
        }
        
        this.currentRoom = { id: roomId, name: roomName };
        
        // Send join room message
        this.sendSystemMessage({
            type: 'join_room',
            roomId: roomId,
            roomName: roomName,
            userId: this.userId,
            userName: this.userName
        });
        
        // Load room messages
        this.loadRoomMessages(roomId);
    }

    /**
     * Leave current room
     */
    leaveRoom() {
        if (this.currentRoom) {
            this.sendSystemMessage({
                type: 'leave_room',
                roomId: this.currentRoom.id,
                userId: this.userId,
                userName: this.userName
            });
            
            this.currentRoom = null;
        }
    }

    /**
     * Send message to current room
     * @param {string} content - Message content
     * @param {string} type - Message type (text, file, image)
     */
    sendMessage(content, type = 'text') {
        if (!this.connected || !this.currentRoom) {
            throw new Error('Not connected or not in a room');
        }
        
        const message = {
            id: this.generateMessageId(),
            roomId: this.currentRoom.id,
            userId: this.userId,
            userName: this.userName,
            userRole: this.userRole,
            content: content,
            type: type,
            timestamp: new Date().toISOString(),
            status: 'sending'
        };
        
        // Add to local messages
        this.messages.push(message);
        
        // Send via WebSocket
        this.sendWebSocketMessage({
            type: 'chat_message',
            data: message
        });
        
        // Update message status
        setTimeout(() => {
            message.status = 'sent';
            this.updateMessage(message);
        }, 1000);
        
        return message;
    }

    /**
     * Send system message
     * @param {Object} data - System message data
     */
    sendSystemMessage(data) {
        this.sendWebSocketMessage({
            type: 'system_message',
            data: data
        });
    }

    /**
     * Send typing indicator
     * @param {boolean} isTyping - Whether user is typing
     */
    sendTypingIndicator(isTyping) {
        if (!this.connected || !this.currentRoom) return;
        
        this.sendWebSocketMessage({
            type: 'typing',
            data: {
                roomId: this.currentRoom.id,
                userId: this.userId,
                userName: this.userName,
                isTyping: isTyping
            }
        });
        
        // Clear typing indicator after 3 seconds
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        if (isTyping) {
            this.typingTimeout = setTimeout(() => {
                this.sendTypingIndicator(false);
            }, 3000);
        }
    }

    /**
     * Handle outgoing WebSocket message
     * @param {Object} message - Message to send
     */
    sendWebSocketMessage(message) {
        if (this.socket && this.connected) {
            this.socket.send(JSON.stringify(message));
        }
    }

    /**
     * Handle incoming WebSocket message
     * @param {Object} message - Incoming message
     */
    handleIncomingMessage(message) {
        try {
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            
            switch (data.type) {
                case 'chat_message':
                    this.handleChatMessage(data.data);
                    break;
                case 'system_message':
                    this.handleSystemMessage(data.data);
                    break;
                case 'typing':
                    this.handleTypingIndicator(data.data);
                    break;
                case 'user_join':
                    this.handleUserJoin(data.data);
                    break;
                case 'user_leave':
                    this.handleUserLeave(data.data);
                    break;
                case 'room_update':
                    this.handleRoomUpdate(data.data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
            
        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }

    /**
     * Handle chat message
     * @param {Object} message - Chat message
     */
    handleChatMessage(message) {
        // Don't add own messages twice
        if (message.userId === this.userId) return;
        
        this.messages.push(message);
        
        if (this.onMessage) {
            this.onMessage(message);
        }
    }

    /**
     * Handle system message
     * @param {Object} data - System message data
     */
    handleSystemMessage(data) {
        const systemMessage = {
            id: this.generateMessageId(),
            type: 'system',
            content: this.formatSystemMessage(data),
            timestamp: new Date().toISOString(),
            data: data
        };
        
        this.messages.push(systemMessage);
        
        if (this.onMessage) {
            this.onMessage(systemMessage);
        }
    }

    /**
     * Handle typing indicator
     * @param {Object} data - Typing data
     */
    handleTypingIndicator(data) {
        if (data.userId === this.userId) return;
        
        if (data.isTyping) {
            this.typingUsers.set(data.userId, {
                userName: data.userName,
                timestamp: Date.now()
            });
        } else {
            this.typingUsers.delete(data.userId);
        }
        
        if (this.onTyping) {
            this.onTyping(Array.from(this.typingUsers.values()));
        }
    }

    /**
     * Handle user join
     * @param {Object} data - User join data
     */
    handleUserJoin(data) {
        if (this.onUserJoin) {
            this.onUserJoin(data);
        }
    }

    /**
     * Handle user leave
     * @param {Object} data - User leave data
     */
    handleUserLeave(data) {
        if (this.onUserLeave) {
            this.onUserLeave(data);
        }
    }

    /**
     * Handle room update
     * @param {Object} data - Room update data
     */
    handleRoomUpdate(data) {
        // Update room information
        if (this.currentRoom && this.currentRoom.id === data.roomId) {
            this.currentRoom = { ...this.currentRoom, ...data };
        }
    }

    /**
     * Format system message
     * @param {Object} data - System message data
     * @returns {string} Formatted message
     */
    formatSystemMessage(data) {
        switch (data.type) {
            case 'user_join':
                return `${data.userName} đã tham gia phòng chat`;
            case 'user_leave':
                return `${data.userName} đã rời khỏi phòng chat`;
            case 'join_room':
                return `${data.userName} đã vào phòng ${data.roomName}`;
            case 'leave_room':
                return `${data.userName} đã rời khỏi phòng ${data.roomName}`;
            default:
                return 'Hệ thống thông báo';
        }
    }

    /**
     * Load room messages
     * @param {string} roomId - Room ID
     */
    loadRoomMessages(roomId) {
        // In production, this would load from server
        // For demo, load from localStorage
        const storedMessages = JSON.parse(localStorage.getItem(`chat_${roomId}`) || '[]');
        this.messages = storedMessages;
    }

    /**
     * Save room messages
     * @param {string} roomId - Room ID
     */
    saveRoomMessages(roomId) {
        localStorage.setItem(`chat_${roomId}`, JSON.stringify(this.messages));
    }

    /**
     * Update message
     * @param {Object} message - Message to update
     */
    updateMessage(message) {
        const index = this.messages.findIndex(m => m.id === message.id);
        if (index !== -1) {
            this.messages[index] = { ...this.messages[index], ...message };
        }
    }

    /**
     * Generate message ID
     * @returns {string} Message ID
     */
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get messages for current room
     * @returns {Array} Messages
     */
    getMessages() {
        return this.messages;
    }

    /**
     * Get typing users
     * @returns {Array} Typing users
     */
    getTypingUsers() {
        return Array.from(this.typingUsers.values());
    }

    /**
     * Clear messages
     */
    clearMessages() {
        this.messages = [];
        if (this.currentRoom) {
            this.saveRoomMessages(this.currentRoom.id);
        }
    }

    /**
     * Start message simulation for demo
     */
    startMessageSimulation() {
        this.simulationInterval = setInterval(() => {
            if (this.currentRoom && Math.random() < 0.1) { // 10% chance
                this.simulateIncomingMessage();
            }
        }, 5000);
    }

    /**
     * Stop message simulation
     */
    stopMessageSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }

    /**
     * Simulate incoming message for demo
     */
    simulateIncomingMessage() {
        const demoUsers = [
            { name: 'Học sinh A', role: 'student' },
            { name: 'Giáo viên B', role: 'teacher' },
            { name: 'Admin C', role: 'admin' }
        ];
        
        const demoUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
        const demoMessages = [
            'Có ai biết cách giải bài này không?',
            'Tôi đã upload file đề thi mới',
            'AI trả lời rất hay!',
            'Cảm ơn bạn đã chia sẻ',
            'Có câu hỏi gì về môn học này không?'
        ];
        
        const message = {
            id: this.generateMessageId(),
            roomId: this.currentRoom.id,
            userId: 'demo_' + Math.random(),
            userName: demoUser.name,
            userRole: demoUser.role,
            content: demoMessages[Math.floor(Math.random() * demoMessages.length)],
            type: 'text',
            timestamp: new Date().toISOString(),
            status: 'sent'
        };
        
        this.handleChatMessage(message);
    }

    /**
     * Set event handlers
     * @param {Object} handlers - Event handlers
     */
    setEventHandlers(handlers) {
        this.onMessage = handlers.onMessage;
        this.onUserJoin = handlers.onUserJoin;
        this.onUserLeave = handlers.onUserLeave;
        this.onTyping = handlers.onTyping;
        this.onConnectionChange = handlers.onConnectionChange;
    }

    /**
     * Get connection status
     * @returns {boolean} Connection status
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Get current room
     * @returns {Object} Current room
     */
    getCurrentRoom() {
        return this.currentRoom;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeChatSystem;
} else {
    window.RealtimeChatSystem = RealtimeChatSystem;
}

