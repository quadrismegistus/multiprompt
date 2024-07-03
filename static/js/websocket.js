// static/js/websocket.js

// WebSocketHandler object to manage WebSocket connection and communication
const WebSocketHandler = {
    // WebSocket URI, dynamically set based on the current host
    URI: `ws://${window.location.host}/ws/multiprompt`,
    
    // WebSocket instance
    ws: null,

    /**
     * Sets up the WebSocket connection
     * @returns {WebSocket} The WebSocket instance
     */
    setupWebSocket() {
        console.log('WebSocket: Setting up WebSocket connection...');
        this.ws = new WebSocket(this.URI);

        // Event handler for successful connection
        this.ws.onopen = () => {
            console.log("WebSocket: Connection established successfully");
        };

        // Event handler for incoming messages
        this.ws.onmessage = (event) => {
            //console.log('WebSocket: Received message', event.data);
            try {
                const data = JSON.parse(event.data);
                if (data.error) {
                    console.error(`WebSocket: Error for ${data.model}:`, data.error);
                    return;
                }
                // console.log(`WebSocket: Updating output for model ${data.model}`);
                UI.updateOutput(data);
            } catch (error) {
                console.error('WebSocket: Error parsing message', error);
            }
        };

        // Event handler for connection closure
        this.ws.onclose = (event) => {
            console.log(`WebSocket: Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        };

        // Event handler for connection errors
        this.ws.onerror = (error) => {
            console.error('WebSocket: Connection error', error);
        };

        return this.ws;
    },

    /**
     * Sends a message through the WebSocket connection
     * @param {Object} message - The message to send
     */
    sendMessage(message) {
        console.log('WebSocket: Attempting to send message', message);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const jsonMessage = JSON.stringify(message);
            this.ws.send(jsonMessage);
            console.log('WebSocket: Message sent successfully', jsonMessage);
        } else {
            console.error("WebSocket: Connection is not open. Cannot send message.");
            if (!this.ws) {
                console.error("WebSocket: WebSocket instance is null. Did you call setupWebSocket()?");
            } else {
                console.error(`WebSocket: Current state is ${this.getReadyStateString(this.ws.readyState)}`);
            }
        }
    },

    /**
     * Gets a string representation of the WebSocket ready state
     * @param {number} readyState - The WebSocket ready state
     * @returns {string} A string describing the ready state
     */
    getReadyStateString(readyState) {
        const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
        return states[readyState] || 'UNKNOWN';
    }
};

console.log('WebSocket: Handler loaded');