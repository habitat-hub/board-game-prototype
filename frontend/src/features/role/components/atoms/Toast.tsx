import React from 'react';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  show: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, show, onClose }) => {
  if (!show) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <FaCheckCircle className="h-5 w-5 text-green-600 mr-3" />,
          bgColor: 'bg-green-100 border border-green-200',
          textColor: 'text-green-800',
          buttonColor: 'text-green-600 hover:bg-green-200',
        };
      case 'error':
        return {
          icon: <FaExclamationTriangle className="h-5 w-5 text-red-600 mr-3" />,
          bgColor: 'bg-red-100 border border-red-200',
          textColor: 'text-red-800',
          buttonColor: 'text-red-600 hover:bg-red-200',
        };
      case 'warning':
        return {
          icon: <FaInfoCircle className="h-5 w-5 text-orange-600 mr-3" />,
          bgColor: 'bg-orange-100 border border-orange-200',
          textColor: 'text-orange-800',
          buttonColor: 'text-orange-600 hover:bg-orange-200',
        };
    }
  };

  const config = getToastConfig();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-lg p-4 shadow-lg max-w-sm ${config.bgColor}`}>
        <div className="flex items-center">
          {config.icon}
          <span className={`text-sm font-medium ${config.textColor}`}>
            {message}
          </span>
          <button
            onClick={onClose}
            className={`ml-3 p-1 rounded ${config.buttonColor}`}
          >
            <IoClose className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
