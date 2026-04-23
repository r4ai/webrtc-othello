import {
  Button as AriaButton,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components'
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
      <Modal className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900 p-6 text-white shadow-2xl outline-none">
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
            <AriaButton
              onPress={onCancel}
              className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-sm font-bold tracking-wide text-white transition hover:bg-white/10 pressed:bg-white/20"
            >
              {cancelLabel}
            </AriaButton>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
