import { useState } from 'react'
import { useAuthStore } from '@store/auth.store'
import { Share2, Copy, Check, Gift, MessageCircle, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface InviteFriendsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InviteFriendsModal({ open, onOpenChange }: InviteFriendsModalProps) {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const referralCode = user?.referral_code || 'PROMO2026'
  const referralLink = `${window.location.origin}/checkout?ref=${referralCode}`
  const shareText = `¡Hola! Te recomiendo "Kioskos & Despenzas", el sistema que uso para mi negocio. Si te registras con mi link, ¡ambos ganamos un 5% de descuento! 😉\n\nLink: ${referralLink}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('¡Enlace copiado al portapapeles!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Kioskos & Despenzas - Referidos',
          text: shareText,
          url: referralLink,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback: WhatsApp
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-accent transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-8">
          <div className="space-y-4 text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Gift className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-foreground">¡Invitá y ganá!</h2>
            <p className="text-muted-foreground font-medium text-sm text-balance">
              Compartí tu enlace con otros comerciantes. Si se suscriben, <b>ambos reciben un 5% de descuento</b> en su próxima cuota mensual.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 text-center">TU CÓDIGO DE REFERIDO</p>
              <p className="text-3xl font-black text-center tracking-[0.2em] text-gray-900 dark:text-white uppercase">{referralCode}</p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Enlace de invitación</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={referralLink} 
                  className="flex-1 h-12 px-4 bg-accent/50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button 
                  onClick={handleCopy} 
                  className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl flex-shrink-0 hover:bg-accent transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={handleShare} 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {typeof navigator.share === 'function' ? <Share2 className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
              {typeof navigator.share === 'function' ? 'COMPARTIR ENLACE' : 'ENVIAR POR WHATSAPP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
