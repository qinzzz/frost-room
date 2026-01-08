import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

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
