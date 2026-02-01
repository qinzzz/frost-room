import { io, Socket } from 'socket.io-client';

const DEV_URL = import.meta.env.VITE_SERVER_URL_DEV || 'http://localhost:3030';
const PROD_URL = import.meta.env.VITE_SERVER_URL_PROD || 'https://frost-room-production.up.railway.app';
const USE_PROD = import.meta.env.VITE_USE_PROD_URL === 'true';

const SOCKET_URL = USE_PROD ? PROD_URL : DEV_URL;

console.log(`Connecting to socket at: ${SOCKET_URL} (Mode: ${USE_PROD ? 'PROD' : 'DEV'})`);

class SocketService {
    socket: Socket | null = null;

    connect() {
        this.socket = io(SOCKET_URL);

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    updateLocation(lat: number, lng: number) {
        if (this.socket) {
            this.socket.emit('update_location', { lat, lng });
        }
    }

    onUsersUpdate(callback: (users: any[]) => void) {
        if (this.socket) {
            this.socket.on('users_list', callback);
        }
    }

    onCountUpdate(callback: (count: number) => void) {
        if (this.socket) {
            this.socket.on('online_count', callback);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export const socketService = new SocketService();
