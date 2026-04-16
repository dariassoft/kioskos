import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '@store/auth.store'

export const SUPERADMIN_PENDING_SOUND_STORAGE_KEY = 'kioskos-superadmin-pending-sound'

interface PendingPaymentAlertPayload {
  pendingId: string
  businessName: string
  ownerEmail: string
  paymentMethod: string
  amount: number
  timestamp: string
}

interface PendingPaymentResolvedPayload {
  pendingId: string
  businessName: string
  paymentMethod: string
  timestamp: string
}

interface MinimalAudioContext {
  currentTime: number
  destination: AudioDestinationNode
  createOscillator(): OscillatorNode
  createGain(): GainNode
  close(): Promise<void>
}

type AudioContextConstructor = new () => MinimalAudioContext

export function playSoftNotificationSound() {
  try {
	const audioWindow = window as Window & {
	  AudioContext?: AudioContextConstructor
	  webkitAudioContext?: AudioContextConstructor
	}
	const AudioCtx = audioWindow.AudioContext || audioWindow.webkitAudioContext
	if (!AudioCtx) return

	const ctx = new AudioCtx()
	const oscillator = ctx.createOscillator()
	const gainNode = ctx.createGain()

	oscillator.type = 'sine'
	oscillator.frequency.value = 880
	gainNode.gain.value = 0.0001

	oscillator.connect(gainNode)
	gainNode.connect(ctx.destination)

	const now = ctx.currentTime
	gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
	gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

	oscillator.start(now)
	oscillator.stop(now + 0.38)

	oscillator.onended = () => {
	  void ctx.close().catch(() => undefined)
	}
  } catch {
	// Silencioso: si el navegador bloquea el audio, la UI igual notifica por toast/badge.
  }
}

export function useSuperAdminPendingRealtime() {
  const queryClient = useQueryClient()
  const { token, user } = useAuthStore()

  useEffect(() => {
	if (!token || user?.role !== 'superadmin') return

	const socket: Socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
	  transports: ['websocket'],
	  auth: { token },
	  reconnection: true,
	  reconnectionAttempts: 5,
	  timeout: 10000,
	})

	const refreshQueries = () => {
	  queryClient.invalidateQueries({ queryKey: ['checkout', 'manual-pending'] })
	  queryClient.invalidateQueries({ queryKey: ['billing-history'] })
	  queryClient.invalidateQueries({ queryKey: ['billing-subscriptions'] })
	  queryClient.invalidateQueries({ queryKey: ['billing-mrr'] })
	  queryClient.invalidateQueries({ queryKey: ['billing-expiring'] })
	  queryClient.invalidateQueries({ queryKey: ['tenants'] })
	}

	const handlePendingAlert = (payload: PendingPaymentAlertPayload) => {
	  refreshQueries()

	  if (window.localStorage.getItem(SUPERADMIN_PENDING_SOUND_STORAGE_KEY) !== '0') {
		playSoftNotificationSound()
	  }

	  toast.success(`Nuevo pago pendiente: ${payload.businessName} · ${new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS',
		maximumFractionDigits: 0,
	  }).format(payload.amount)}`)
	}

	const handlePendingResolved = (payload: PendingPaymentResolvedPayload) => {
	  refreshQueries()
	  toast.success(`Pago pendiente resuelto: ${payload.businessName}`)
	}

	socket.on('pending_payment_alert', handlePendingAlert)
	socket.on('pending_payment_resolved', handlePendingResolved)

	return () => {
	  socket.off('pending_payment_alert', handlePendingAlert)
	  socket.off('pending_payment_resolved', handlePendingResolved)
	  socket.disconnect()
	}
  }, [queryClient, token, user?.role])
}

export function SuperAdminPendingRealtimeBridge() {
  useSuperAdminPendingRealtime()
  return null
}

