import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onCancel() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <Modal className="w-full max-w-sm rounded-3xl border border-white/15 bg-black/20 p-6 text-white shadow-2xl backdrop-blur outline-none">
        <Dialog className="outline-none">
          <Heading slot="title" className="text-lg font-bold tracking-tight">
            {title}
          </Heading>
          {description && (
            <p className="mt-2 text-sm text-white/70">{description}</p>
          )}
          <div className="mt-6 flex gap-3">
            <Button onPress={onConfirm} variant="secondary" className="flex-1">
              {confirmLabel}
            </Button>
            <Button onPress={onCancel} variant="ghost" className="flex-1">
              {cancelLabel}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
