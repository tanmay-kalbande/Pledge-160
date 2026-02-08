import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationToastProps {
    message: string;
    onClose: () => void;
    onAction?: () => void;
    actionLabel?: string;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
    message,
    onClose,
    onAction,
    actionLabel = 'View'
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setIsVisible(true), 10);

        // Auto-dismiss after 8 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 8000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const handleAction = () => {
        if (onAction) {
            onAction();
            handleClose();
        }
    };

    return (
        <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <div className="bg-noir-elevated border border-gold/30 rounded-xl shadow-2xl shadow-gold/10 p-4 flex items-start gap-3 backdrop-blur-md">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell size={16} className="text-gold animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium leading-snug">{message}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {onAction && (
                        <button
                            onClick={handleAction}
                            className="px-3 py-1.5 bg-gold text-noir-base text-xs font-bold rounded-lg hover:bg-gold-dim transition-colors"
                        >
                            {actionLabel}
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="p-1 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
