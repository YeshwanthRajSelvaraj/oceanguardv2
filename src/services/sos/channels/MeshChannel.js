import { meshService } from '../../meshService';

export class MeshChannel {
    constructor() {
        this.name = 'mesh';
        this.priority = 0; // Highest priority: It's free, immediate, and local.
    }

    /**
     * Check if Mesh is available (i.e., initialized and has peers).
     */
    async isAvailable() {
        // We consider it available if the service is running. 
        // Even if no peers are currently connected, we might want to try broadcasting 
        // (though sending requires peers, but the engine checks availability first).

        // Better check: Do we have any connected peers?
        // If we are isolated, we can't send via mesh.
        return meshService.connectedEndpoints.size > 0;
    }

    /**
     * Send SOS payload via Mesh.
     * @param {object} sos - The SOS payload
     */
    async send(sos) {
        try {
            // Convert SOS object to a string message
            const message = JSON.stringify({
                type: 'SOS_ALERT', // distinct header for parsing
                payload: sos
            });

            const success = await meshService.sendMessage(message);

            if (success) {
                return {
                    success: true,
                    messageId: `MESH-${Date.now()}`,
                    meta: { peerCount: meshService.connectedEndpoints.size }
                };
            } else {
                throw new Error("Mesh send returned false");
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    getHealth() {
        return {
            status: 'active',
            details: `${meshService.connectedEndpoints.size} peers connected`
        };
    }
}
