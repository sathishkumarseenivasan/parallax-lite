import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/providers/useStore'
import { mutate } from 'swr'

export type StreamState = 'connecting' | 'live' | 'reconnecting' | 'fallback'

export interface EventLog {
  timestamp: string
  type: string
  payload: unknown
  seq?: number
}

const WS_URL = 'ws://127.0.0.1:8000/ws/stream'

export function useLiveStream() {
  const [status, setStatus] = useState<StreamState>('connecting')
  const [lastSeq, setLastSeq] = useState<number>(0)
  const [logs, setLogs] = useState<EventLog[]>([])
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const isMounted = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const initialized = useRef(false)

  const addLog = useCallback((type: string, payload: unknown, seq?: number) => {
    setLogs(prev => {
      const newLog = { timestamp: new Date().toISOString(), type, payload, seq }
      const next = [newLog, ...prev]
      if (next.length > 50) return next.slice(0, 50)
      return next
    })
  }, [])

  const backfill = async (seq: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/transactions?since_seq=${seq}`, {
        signal: abortControllerRef.current.signal
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      
      if (data && data.length > 0) {
        addLog('backfill', { count: data.length })
        // Deduplicate and process data
        // For now just update seq
        const maxSeq = Math.max(...data.map((d: {seq?: number}) => d.seq || 0))
        if (maxSeq > seq) {
          setLastSeq(maxSeq)
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addLog('error', { message: 'Backfill failed', detail: err.message })
      }
    }
  }

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    setStatus(prev => prev === 'connecting' ? 'connecting' : 'reconnecting')
    
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (!isMounted.current) return
      setStatus('live')
      reconnectAttempts.current = 0
      addLog('connection', { state: 'open' })
      if (lastSeq > 0) {
        backfill(lastSeq)
      }
    }

    ws.onmessage = (event) => {
      if (!isMounted.current) return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'hello' || data.type === 'ping' || data.type === 'pong') {
          if (data.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }))
          return
        }
        
        addLog(data.type, data.payload, data.seq)
        
        if (data.seq) {
          setLastSeq(prev => Math.max(prev, data.seq))
        }
        
        // Update Zustand store
        if (data.type === 'tx.created') {
          useStore.getState().addTransaction(data.payload)
          mutate('/api/agents')
        } else if (data.type === 'tx.cleared' || data.type === 'tx.rejected') {
          useStore.getState().updateTransaction(data.payload)
          mutate('/api/agents')
        } else if (data.type === 'metrics.tick') {
          useStore.getState().updateMetrics(data.payload)
        }
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('stream_event', { detail: data }))
      } catch (err) {
        addLog('error', { message: 'Failed to parse WS message' })
      }
    }

    ws.onclose = (event) => {
      if (!isMounted.current) return
      addLog('connection', { state: 'closed', code: event.code })
      wsRef.current = null
      
      if (event.code === 4001) {
        addLog('warning', { message: 'Evicted as slow consumer' })
      }
      
      const attempts = reconnectAttempts.current
      const delay = Math.min(1000 * Math.pow(2, attempts), 8000)
      const jitter = Math.random() * 500
      
      setStatus(attempts >= 3 ? 'fallback' : 'reconnecting')
      reconnectAttempts.current += 1
      
      setTimeout(() => {
        if (isMounted.current) connect()
      }, delay + jitter)
    }

    ws.onerror = (err) => {
      if (!isMounted.current) return
      addLog('error', { message: 'WebSocket error' })
      // onclose will handle reconnection
    }
  }, [addLog, lastSeq])

  useEffect(() => {
    isMounted.current = true
    if (!initialized.current) {
      initialized.current = true
      connect()
    }
    
    return () => {
      isMounted.current = false
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return { status, lastSeq, logs, reconnect: () => connect() }
}
