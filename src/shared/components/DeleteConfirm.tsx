import { Modal } from './Modal';
import { Button } from './Button';

interface DeleteConfirmProps {
  label: string;
  onConfirm: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function DeleteConfirm({ label, onConfirm, onClose, isOpen }: DeleteConfirmProps) {
  if (!isOpen) return null;

  return (
    <Modal title="Confirm delete" onClose={onClose} isOpen={isOpen}>
      <p className="text-muted-foreground mb-5 text-[13px]">
        Delete <strong className="text-foreground">{label}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Delete</Button>
      </div>
    </Modal>
  );
}
