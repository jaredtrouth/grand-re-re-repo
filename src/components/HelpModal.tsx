'use client';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="modal-content w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-auto animate-bounce-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="modal-header">
                        🍔 How to Play
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Instructions */}
                <div className="space-y-4 text-(--chalkboard-black)">
                    <p className="text-xl font-handwritten">
                        Guess the <strong>Bob&apos;s Burgers</strong> episode from the Burger of the Day!
                    </p>

                    <div className="space-y-3">
                        <h3 className="font-handwritten text-xl text-(--ketchup-red)">
                            🎯 The Goal
                        </h3>
                        <p>
                            Each day features a different Burger of the Day. Figure out which
                            episode it&apos;s from in 6 guesses or less!
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-handwritten text-xl text-(--ketchup-red)">
                            💡 The Hints
                        </h3>
                        <ul className="space-y-2 list-disc list-inside text-sm">
                            <li><strong>Burger of the Day</strong> - Today&apos;s puzzle burger (displayed like Bob&apos;s chalkboard!)</li>
                            <li><strong>Store Next Door</strong> - The punny shop name next to Bob&apos;s</li>
                            <li><strong>Pest Control Truck</strong> - The exterminator van parody</li>
                            <li><strong>Other Burgers</strong> - Other burgers from the same episode</li>
                            <li><strong>Plot Summary</strong> - A brief description of the episode</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-handwritten text-xl text-(--ketchup-red)">
                            🔓 Progressive Hints
                        </h3>
                        <p>
                            You start with just the Burger of the Day. Each wrong guess reveals
                            another hint to help you narrow it down!
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-handwritten text-xl text-(--ketchup-red)">
                            📝 Tips
                        </h3>
                        <ul className="space-y-2 list-disc list-inside text-sm">
                            <li>Search by episode title or code (e.g., &quot;S03E12&quot;)</li>
                            <li>Some episodes have multiple burgers - each is a separate puzzle!</li>
                            <li>Early seasons may not have all hint types</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-(--chalkboard-black)/20">
                    <p className="text-sm text-(--chalkboard-black)/70 text-center font-handwritten">
                        A new burger puzzle is available every day at midnight UTC!
                    </p>
                </div>
            </div>
        </div>
    );
}
