import { create } from 'zustand'
import { MOCK_TRANSACTIONS, TELEMETRY_SERIES } from '@/lib/mock-pragmatic-data'
import type { PragmaticTx } from '@/lib/mock-pragmatic-data'

interface AppState {
  transactions: PragmaticTx[]
  telemetry: { index: number; confidence: number; latency_ms: number; timestamp: string }[]
  metrics: Record<string, unknown>
  addTransaction: (tx: PragmaticTx) => void
  updateTransaction: (tx: PragmaticTx) => void
  updateMetrics: (metrics: Record<string, unknown>) => void
  setTransactions: (txs: PragmaticTx[]) => void
  connectWebSocket: () => void
}

export const useStore = create<AppState>((set) => ({
  transactions: MOCK_TRANSACTIONS,
  telemetry: TELEMETRY_SERIES,
  metrics: {},
  
  addTransaction: (tx) => set((state) => ({
    transactions: [tx, ...state.transactions],
    telemetry: [...state.telemetry, {
      index: state.telemetry.length,
      confidence: tx.semantic_score || 0,
      latency_ms: tx.latency_ms || 0,
      timestamp: new Date().toISOString()
    }].slice(-100)
  })),
  
  updateTransaction: (tx) => set((state) => ({
    transactions: state.transactions.map(t => t.id === tx.id ? tx : t)
  })),
  
  updateMetrics: (metrics) => set({ metrics }),
  
  setTransactions: (txs) => set({ transactions: txs }),

  connectWebSocket: () => {
    if (typeof window === 'undefined') return;
    const wsUrl = `ws://${window.location.hostname}:8000/ws/stream`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'tx.updated' || data.type === 'tx.created') {
          const payload = data.payload;
          
          // Helper to map backend tx to frontend PragmaticTx
          const newTx: PragmaticTx = {
            id: payload.id || `tx_${Math.random().toString(36).substring(2, 10)}`,
            created_at: payload.created_at || new Date().toISOString(),
            buyer_id: payload.buyer_id || 'agent_alpha',
            seller_id: payload.seller_id || 'agent_beta',
            task: payload.task_description || payload.expected_schema || 'Auto Task',
            task_type: payload.expected_schema || 'Custom',
            schema_name: payload.expected_schema || 'Custom',
            status: payload.status || 'CLEARED',
            rejection_reason: payload.rejection_reason,
            base_value: payload.amount || 0,
            amount: payload.amount || 0,
            final_payout_usdc: payload.status === 'CLEARED' ? (payload.amount || 0) : 0,
            entropy_score: payload.entropy_score ?? (payload.status === 'CLEARED' ? 1.0 : 0.3),
            semantic_score: Math.round((payload.entropy_score ?? (payload.status === 'CLEARED' ? 1.0 : 0.3)) * 100),
            latency_ms: payload.validation_time_ms || 350,
            expected_schema: {},
            actual_output: payload.actual_output ? (typeof payload.actual_output === 'string' ? JSON.parse(payload.actual_output) : payload.actual_output) : {},
            expected_schema_json: '{}',
            actual_output_json: typeof payload.actual_output === 'string' ? payload.actual_output : JSON.stringify(payload.actual_output || {}),
            trace: [],
            http_trace: [],
            settlement: [],
            settlement_breakdown: { base_value: payload.amount || 0, schema_validation_adjustment: 0, entropy_adjustment: 0, latency_adjustment: 0 }
          };
          
          set((state) => {
            const existing = state.transactions.findIndex(t => t.id === newTx.id);
            if (existing >= 0) {
              const updated = [...state.transactions];
              updated[existing] = newTx;
              return { transactions: updated };
            } else {
              return {
                transactions: [newTx, ...state.transactions],
                telemetry: [...state.telemetry, {
                  index: state.telemetry.length,
                  confidence: newTx.semantic_score || 0,
                  latency_ms: newTx.latency_ms || 0,
                  timestamp: new Date().toISOString()
                }].slice(-100)
              };
            }
          });
        }
      } catch (e) {
        // Ignored
      }
    };
    
    ws.onclose = () => {
      setTimeout(() => set(state => { state.connectWebSocket(); return state; }), 5000);
    };
  }
}))
