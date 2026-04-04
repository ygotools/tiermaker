import React, { useCallback, useRef, useState } from 'react';
import { Deck } from '../types';

type CustomThemeModalProps = {
  onAdd: (deck: Deck) => void;
  onClose: () => void;
};

const CustomThemeModal: React.FC<CustomThemeModalProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('画像ファイルを選択してください');
      return;
    }

    setImageError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;
    if (!imagePreview) return;

    onAdd({ name: name.trim(), image: imagePreview });
    onClose();
  }, [name, imagePreview, onAdd, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const isSubmittable = name.trim() !== '' && imagePreview !== '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 text-white">
        <h2 className="text-xl font-bold mb-4">カスタムテーマを追加</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">テーマ名</label>
            <input
              type="text"
              className="w-full rounded p-2 text-black"
              placeholder="テーマ名を入力"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-300">画像</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-500 rounded text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors text-sm"
            >
              クリックして画像を選択
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {imageError && <p className="text-red-400 text-sm mt-1">{imageError}</p>}
            {imagePreview && (
              <div className="mt-2 relative inline-block border border-gray-600">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-40 h-24 object-cover rounded-sm"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!isSubmittable}
              className={`px-4 py-2 rounded font-bold transition-colors ${
                isSubmittable
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomThemeModal;
