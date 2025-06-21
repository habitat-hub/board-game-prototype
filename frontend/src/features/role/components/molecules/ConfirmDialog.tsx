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
  confirmButtonColor = 'bg-red-600 hover:bg-red-700',
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="h-6 w-6 text-orange-500 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${confirmButtonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
