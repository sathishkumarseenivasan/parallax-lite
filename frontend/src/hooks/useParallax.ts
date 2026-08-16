import { useState, useEffect } from 'react';

export interface Transaction {
    id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    status: string;
    expected_schema: string;
    actual_output?: string;
    rejection_reason?: string;
    validation_time_ms?: number;
    seq: number;
    created_at: string;
    updated_at: string;
}

/**
 * Hook to consume live transaction events via WebSocket
 * 
 * @param url The WebSocket URL (e.g. ws://localhost:8000/api/stream/events)
 * @returns { events: Record<string, unknown>[], isConnected: boolean }
 */
export function useLiveStream(url: string) {
    const [events, setEvents] = useState<Record<string, unknown>[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const ws = new WebSocket(url);
        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);
        ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                setEvents((prev) => [data, ...prev].slice(0, 50));
            } catch (e) {
                // Ignore parse errors
            }
        };
        return () => ws.close();
    }, [url]);

    return { events, isConnected };
}

/**
 * Hook to fetch trust score for an agent
 * 
 * @param agentId The ID of the agent
 * @param apiUrl Base API URL
 */
export function useTrustScore(agentId: string, apiUrl: string = 'http://localhost:8000') {
    const [score, setScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${apiUrl}/api/trust/${agentId}`)
            .then(res => res.json())
            .then(data => {
                setScore(data.score);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [agentId, apiUrl]);

    return { score, loading };
}

/**
 * Hook to list transactions
 * 
 * @param apiUrl Base API URL
 */
export function useTransactions(apiUrl: string = 'http://localhost:8000') {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${apiUrl}/api/transactions`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [apiUrl]);

    return { transactions, loading };
}
