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
    Send,
    X
} from 'lucide-react';
import { useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Message } from '../../types/chat';

interface RichTextEditorProps {
    onSend: (content: string, files?: File[]) => void;
    onTyping: () => void;
    placeholder?: string;
    replyingTo?: Message | null;
    onCancelReply?: () => void;
}

const RichTextEditor = ({ onSend, onTyping, placeholder, replyingTo, onCancelReply }: RichTextEditorProps) => {
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
                class: 'prose prose-sm dark:prose-invert focus:outline-none max-h-40 overflow-y-auto px-4 py-3 min-h-[44px] text-slate-900 dark:text-white',
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
        <div className="relative border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.03] shadow-md transition-all focus-within:ring-4 focus-within:ring-[#8252e9]/10 focus-within:border-[#8252e9]/50">
            {/* Hidden File Input */}
            <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Reply Preview */}
            {replyingTo && (
                <div className="flex items-center justify-between p-2 pb-0 bg-blue-50/50 dark:bg-purple-500/10 rounded-t-xl animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-1 min-w-0 border-l-2 border-blue-500 dark:border-purple-500 pl-3 py-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-purple-400">Replying to {replyingTo.user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate italic">{replyingTo.content.replace(/<[^>]*>/g, '')}</p>
                    </div>
                    <button 
                        onClick={onCancelReply}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className={`flex items-center gap-1 p-1.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 overflow-x-auto no-scrollbar ${replyingTo ? '' : 'rounded-t-2xl'}`}>
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-white/20 text-blue-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}
                    title="Bold"
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-white/20 text-blue-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}
                    title="Italic"
                >
                    <Italic size={16} />
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1" />
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-white/20 text-blue-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}
                    title="Bullet List"
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-white/20 text-blue-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}
                    title="Ordered List"
                >
                    <ListOrdered size={16} />
                </button>
            </div>

            {/* File Previews */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border-b dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white dark:bg-white/10 border dark:border-white/10 rounded-lg px-2 py-1 text-xs shadow-sm group">
                            <span className="max-w-[100px] truncate text-gray-900 dark:text-white">{file.name}</span>
                            <button
                                onClick={() => removeFile(index)}
                                className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
                    <div className="absolute top-2 left-4 text-gray-400 dark:text-gray-500 pointer-events-none text-sm">
                        {placeholder || 'Type your message...'}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-2 md:p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/5 rounded-b-2xl">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-purple-400 hover:bg-blue-50 dark:hover:bg-white/10 rounded-lg transition-all"
                        title="Emoji"
                    >
                        <Smile size={18} />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-1.5 rounded-lg transition-all ${selectedFiles.length > 0 ? 'text-blue-600 dark:text-purple-400 bg-blue-50 dark:bg-white/10' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-purple-400 hover:bg-blue-50 dark:hover:bg-white/10'}`}
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
                    className="bg-blue-600 dark:bg-gradient-to-r dark:from-purple-600 dark:to-blue-600 hover:bg-blue-700 dark:hover:from-purple-700 dark:hover:to-blue-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!editor.getText().trim() && selectedFiles.length === 0}
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50 max-w-[calc(100vw-2rem)]">
                    <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                    <div className="relative overflow-hidden rounded-xl shadow-2xl">
                        <EmojiPicker onEmojiClick={handleEmojiClick} width="min(350px, calc(100vw - 2rem))" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
