import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
    message: string | null;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 1000 }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 min-w-[200px] justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">{message}</span>
            </div>
        </div>
    );
};
