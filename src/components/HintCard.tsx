'use client';

import { HintType, HINT_ORDER } from '@/types/episode';

// Icon and label mapping for hint types
const HINT_CONFIG: Record<HintType, { icon: string; label: string }> = {
    burger_name: { icon: '🍔', label: 'Burger of the Day' },
    store_next_door: { icon: '🏪', label: 'Store Next Door' },
    pest_control: { icon: '🚐', label: 'Pest Control Truck' },
    other_burgers: { icon: '🍔', label: 'Other Burgers' },
    plot_summary: { icon: '📝', label: 'Plot Summary' },
};

interface HintCardProps {
    type: HintType;
    content: string | null;
    isRevealed: boolean;
    isNextHint: boolean;
    index: number;
    burgerDescription?: string | null;
}

export function HintCard({ type, content, isRevealed, isNextHint, index, burgerDescription }: HintCardProps) {
    const config = HINT_CONFIG[type];
    const isEmpty = !content || content === 'Not featured this episode';
    const isBurgerHint = type === 'burger_name';

    // Determine card state
    const cardClass = isRevealed
        ? 'hint-card revealed'
        : isNextHint
            ? 'hint-card next-hint'
            : 'hint-card locked';

    const iconClass = isRevealed
        ? 'hint-icon revealed'
        : isNextHint
            ? 'hint-icon next'
            : 'hint-icon locked';

    const labelClass = isRevealed
        ? 'hint-label'
        : isNextHint
            ? 'hint-label next'
            : 'hint-label locked';

    return (
        <div className={cardClass}>
            {/* Icon */}
            <div className={iconClass}>
                {isRevealed ? (
                    isBurgerHint ? '🍔' : config.icon
                ) : (
                    <span className="text-lg">{config.icon}</span>
                )}
            </div>

            {/* Content area */}
            <div className="flex-1 min-w-0">
                <div className={labelClass}>
                    Hint {index + 1}: {config.label}
                </div>

                {isRevealed ? (
                    isBurgerHint && content ? (
                        <div className="mt-2">
                            <p className="font-handwritten text-xl text-(--mustard-yellow)">
                                &quot;{content}&quot;
                            </p>
                            {burgerDescription && (
                                <p className="text-sm text-(--chalk-gray) italic mt-1">
                                    {burgerDescription}
                                </p>
                            )}
                        </div>
                    ) : isEmpty ? (
                        <p className="hint-content text-(--chalk-gray) italic mt-1">
                            Not featured this episode
                        </p>
                    ) : (
                        <p className="hint-content mt-1">
                            &quot;{content}&quot;
                        </p>
                    )
                ) : (
                    <p className="text-sm text-(--chalk-gray) mt-1">
                        LOCKED
                    </p>
                )}
            </div>

            {/* Badge area */}
            {!isRevealed && (
                <div className="hint-badge locked flex items-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            )}
        </div>
    );
}

interface HintGridProps {
    hints: Record<string, string | null>;
    revealedCount: number;
}

export function HintGrid({ hints, revealedCount }: HintGridProps) {
    return (
        <div className="space-y-3">
            {HINT_ORDER.map((hintType, index) => (
                <HintCard
                    key={hintType}
                    type={hintType}
                    content={hints[hintType] || null}
                    isRevealed={index < revealedCount}
                    isNextHint={index === revealedCount}
                    index={index}
                    burgerDescription={hintType === 'burger_name' ? hints['burger_description'] : undefined}
                />
            ))}
        </div>
    );
}
