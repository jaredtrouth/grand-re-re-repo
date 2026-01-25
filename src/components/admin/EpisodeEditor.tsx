'use client';

import { useState, useRef } from 'react';

interface Episode {
    id: string;
    season: number;
    episode_number: number;
    title: string;
    still_url: string | null;
    store_next_door: string | null;
    pest_control_truck: string | null;
    original_air_date: string | null;
    guest_stars: string | null;
}

interface Quote {
    quote: string;
    speaker: string | null;
    location: string | null;
}

interface Burger {
    id: string;
    name: string;
    description: string | null;
    episode_id: string;
}

interface EpisodeEditorProps {
    episode: Episode;
    burgers: Burger[];
    quotes: Quote[];
    onClose: () => void;
    onSave: () => void;
}

export default function EpisodeEditor({ episode, burgers, quotes, onClose, onSave }: EpisodeEditorProps) {
    const [formData, setFormData] = useState({
        quotes: quotes || [],
        still_url: episode.still_url || '',
        store_next_door: episode.store_next_door || '',
        pest_control_truck: episode.pest_control_truck || '',
        original_air_date: episode.original_air_date || '',
        guest_stars: episode.guest_stars || '',
    });

    const [burgerData, setBurgerData] = useState<Burger[]>(
        burgers.length > 0 ? burgers : [{ id: '', name: '', description: '', episode_id: episode.id }]
    );

    const [quoteData, setQuoteData] = useState<Quote[]>(
        quotes?.length > 0 ? quotes : [{ quote: '', speaker: '', location: '' }]
    );

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = async (file: File) => {
        setError('');
        setIsUploading(true);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, still_url: data.url }));
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to upload image');
            }
        } catch {
            setError('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    };

    const handleBurgerChange = (index: number, field: string, value: string) => {
        setBurgerData(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddBurger = () => {
        setBurgerData(prev => [...prev, { id: '', name: '', description: '', episode_id: episode.id }]);
    };

    const handleRemoveBurger = (index: number) => {
        setBurgerData(prev => prev.filter((_, i) => i !== index));
    };

    const handleQuoteChange = (index: number, field: string, value: string) => {
        setQuoteData(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };
    const handleAddQuote = () => {
        setQuoteData(prev => [...prev, { quote: '', speaker: '', location: '' }]);
    };

    const handleRemoveQuote = (index: number) => {
        setQuoteData(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            const response = await fetch('/api/admin/episodes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    episodeId: episode.id,
                    episode: formData,
                    burgers: burgerData.filter(b => b.name.trim()),
                    quotes: quoteData.filter(q => q.quote.trim()),
                }),
            });

            if (response.ok) {
                onSave();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to save');
            }
        } catch {
            setError('Failed to save episode');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>
                        S{episode.season}E{episode.episode_number}: {episode.title}
                    </h2>
                    <button onClick={onClose} className="admin-modal-close">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="admin-form-section">
                        <h3>📝 Quotes</h3>
                        {quoteData.map((quote, index) => (
                            <div key={index} className="admin-burger-row">
                                <div className="admin-field">
                                    <label className="admin-label">Quote Text</label>
                                    <input
                                        type="text"
                                        value={quote.quote}
                                        onChange={(e) => handleQuoteChange(index, 'quote', e.target.value)}
                                        className="admin-input"
                                        placeholder="Enter a memorable quote from this episode..."
                                    />
                                </div>
                                <div className="mt-2 admin-field-row">
                                    <div className="admin-field">
                                        <label className="admin-label">Speaker</label>
                                        <input
                                            type="text"
                                            value={quote.speaker || ''}
                                            onChange={(e) => handleQuoteChange(index, 'speaker', e.target.value)}
                                            className="admin-input"
                                            placeholder="e.g., Bob, Linda, Louise..."
                                        />
                                    </div>
                                    <div className="admin-field">
                                        <label className="admin-label">Location</label>
                                        <input
                                            type="text"
                                            value={quote.location || ''}
                                            onChange={(e) => handleQuoteChange(index, 'location', e.target.value)}
                                            className="admin-input"
                                            placeholder="e.g., the restaurant, Wonder Wharf..."
                                        />
                                    </div>
                                </div>
                                {quoteData.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuote(index)}
                                        className="my-3 admin-button admin-button-danger admin-button-small"
                                    >
                                        Remove Quote
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddQuote}
                            className="mt-3 admin-button admin-button-secondary admin-button-small"
                        >
                            Add Quote
                        </button>
                    </div>

                    <div className="admin-form-section">
                        <h3>🖼️ Episode Still</h3>
                        <div
                            className={`admin-upload-zone ${isUploading ? 'uploading' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            {isUploading ? (
                                <div className="admin-upload-status">
                                    <span>📄</span>
                                    <p>Uploading...</p>
                                </div>
                            ) : formData.still_url ? (
                                <div className="admin-image-preview-large">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={formData.still_url} alt="Episode still" />
                                    <p className="admin-upload-hint">Click or drag to replace</p>
                                </div>
                            ) : (
                                <div className="admin-upload-status">
                                    <span>📷</span>
                                    <p>Click or drag image to upload</p>
                                    <span className="admin-upload-formats">JPEG, PNG, WebP, GIF (max 5MB)</span>
                                </div>
                            )}
                        </div>
                        {formData.still_url && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, still_url: '' }))}
                                className="admin-button admin-button-secondary admin-button-small"
                                style={{ marginTop: '0.5rem' }}
                            >
                                Remove Image
                            </button>
                        )}
                    </div>

                    <div className="admin-form-section">
                        <h3>🍔 Burgers</h3>
                        {burgerData.map((burger, index) => (
                            <div key={index} className="admin-burger-row">
                                <div className="admin-field">
                                    <label className="admin-label">Burger Name</label>
                                    <input
                                        type="text"
                                        value={burger.name}
                                        onChange={(e) => handleBurgerChange(index, 'name', e.target.value)}
                                        className="admin-input"
                                        placeholder="The Some Like It Tot Burger"
                                    />
                                </div>
                                <div className="admin-field">
                                    <label className="admin-label">Description</label>
                                    <input
                                        type="text"
                                        value={burger.description || ''}
                                        onChange={(e) => handleBurgerChange(index, 'description', e.target.value)}
                                        className="admin-input"
                                        placeholder="Comes with tater tots"
                                    />
                                </div>
                                {burgerData.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveBurger(index)}
                                        className="admin-button admin-button-danger admin-button-small"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddBurger}
                            className="admin-button admin-button-secondary admin-button-small"
                        >
                            + Add Burger
                        </button>
                    </div>

                    <div className="admin-form-section">
                        <h3>🏪 Location Details</h3>
                        <div className="admin-field">
                            <label className="admin-label">Store Next Door</label>
                            <input
                                type="text"
                                value={formData.store_next_door}
                                onChange={(e) => handleChange('store_next_door', e.target.value)}
                                className="admin-input"
                                placeholder="Punny Store Name"
                            />
                        </div>
                        <div className="admin-field">
                            <label className="admin-label">Pest Control Truck</label>
                            <input
                                type="text"
                                value={formData.pest_control_truck}
                                onChange={(e) => handleChange('pest_control_truck', e.target.value)}
                                className="admin-input"
                                placeholder="Punny Exterminator Name"
                            />
                        </div>
                    </div>

                    <div className="admin-form-section">
                        <h3>📅 Additional Info</h3>
                        <div className="admin-field-row">
                            <div className="admin-field">
                                <label className="admin-label">Original Air Date</label>
                                <input
                                    type="date"
                                    value={formData.original_air_date}
                                    onChange={(e) => handleChange('original_air_date', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                        </div>
                        <div className="admin-field">
                            <label className="admin-label">Guest Stars</label>
                            <input
                                type="text"
                                value={formData.guest_stars}
                                onChange={(e) => handleChange('guest_stars', e.target.value)}
                                className="admin-input"
                                placeholder="List of guest voice actors..."
                            />
                        </div>
                    </div>

                    {error && <div className="admin-error">{error}</div>}

                    <div className="admin-form-actions">
                        <button type="button" onClick={onClose} className="admin-button admin-button-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className="admin-button admin-button-primary">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
