import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Type,
    Smile,
    Paperclip,
    Send
} from 'lucide-react';
import { useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';

interface RichTextEditorProps {
    onSend: (content: string, files?: File[]) => void;
    onTyping: () => void;
    placeholder?: string;
}

const RichTextEditor = ({ onSend, onTyping, placeholder }: RichTextEditorProps) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention',
                },
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            onTyping();
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-h-40 overflow-y-auto px-4 py-2 min-h-[40px]',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    const content = editor?.getHTML();
                    if ((content && content !== '<p></p>') || selectedFiles.length > 0) {
                        onSend(content || '', selectedFiles);
                        editor?.commands.clearContent();
                        setSelectedFiles([]);
                        return true;
                    }
                }
                return false;
            },
            handleDrop: (view, event) => {
                event.preventDefault();
                if (event.dataTransfer?.files) {
                    const files = Array.from(event.dataTransfer.files);
                    setSelectedFiles(prev => [...prev, ...files]);
                    return true;
                }
                return false;
            },
        },
    });

    if (!editor) return null;

    const handleEmojiClick = (emojiData: any) => {
        editor.commands.insertContent(emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="relative border rounded-xl bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
            {/* Hidden File Input */}
            <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Toolbar */}
            <div className="flex items-center gap-1 p-1 border-b bg-gray-50/50 rounded-t-xl">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="Bold"
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="Italic"
                >
                    <Italic size={16} />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="Bullet List"
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
                    title="Ordered List"
                >
                    <ListOrdered size={16} />
                </button>
            </div>

            {/* File Previews */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50/30">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1 text-xs shadow-sm group">
                            <span className="max-w-[100px] truncate">{file.name}</span>
                            <button
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor Content */}
            <div className="relative">
                <EditorContent editor={editor} />
                {!editor.getText() && (
                    <div className="absolute top-2 left-4 text-gray-400 pointer-events-none text-sm">
                        {placeholder || 'Type your message...'}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-2 border-t bg-gray-50/30 rounded-b-xl">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Emoji"
                    >
                        <Smile size={18} />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-1.5 rounded-lg transition-all ${selectedFiles.length > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                        title="Attach file"
                    >
                        <Paperclip size={18} />
                    </button>
                </div>

                <button
                    onClick={() => {
                        const content = editor.getHTML();
                        if ((content && content !== '<p></p>') || selectedFiles.length > 0) {
                            onSend(content || '', selectedFiles);
                            editor.commands.clearContent();
                            setSelectedFiles([]);
                        }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95"
                    disabled={!editor.getText().trim() && selectedFiles.length === 0}
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                    <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                    <div className="relative">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
