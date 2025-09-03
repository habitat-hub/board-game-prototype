import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '削除する',
  cancelText = 'キャンセル',
  confirmButtonColor = 'bg-kibako-danger hover:bg-kibako-danger/80',
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-kibako-black/50 flex items-center justify-center z-modal">
      <div className="bg-kibako-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="h-6 w-6 text-kibako-accent mr-3" />
          <h3 className="text-lg font-medium text-kibako-primary">{title}</h3>
        </div>
        <p className="text-kibako-primary/70 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-kibako-primary/70 border border-kibako-secondary/30 rounded-lg hover:bg-kibako-tertiary/20 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-kibako-white rounded-lg transition-colors ${confirmButtonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
