import { useState } from 'react'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@store/auth.store'
import { Share2, Copy, Check, Gift, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface InviteFriendsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InviteFriendsModal({ open, onOpenChange }: InviteFriendsModalProps) {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)

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
    if (navigator.share) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem]">
        <DialogHeader className="space-y-4">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-2 animate-bounce">
            <Gift className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <DialogTitle className="text-2xl font-black text-center">¡Invitá y ganá!</DialogTitle>
          <DialogDescription className="text-center text-balance font-medium">
            Compartí tu enlace con otros comerciantes. Si se suscriben, <b>ambos reciben un 5% de descuento</b> en su próxima cuota mensual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 text-center">TU CÓDIGO DE REFERIDO</p>
            <p className="text-3xl font-black text-center tracking-[0.2em] text-gray-900 dark:text-white uppercase">{referralCode}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Enlace de invitación</label>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={referralLink} 
                className="bg-accent/50 border-none font-medium h-12 rounded-xl text-xs"
              />
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                className="h-12 w-12 p-0 rounded-xl flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleShare} 
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl gap-2 shadow-lg shadow-indigo-500/20"
          >
            {navigator.share ? <Share2 className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            {navigator.share ? 'COMPARTIR ENLACE' : 'ENVIAR POR WHATSAPP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
