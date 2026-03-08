
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, UserPlus, Paperclip, AlertCircle, Loader2, FileText, Trash2 } from 'lucide-react';
import { CreateMemoRequest, MemoUser } from '../../types/memo';
import { employeeService } from '../../services/employeeService';
import { memoService } from '../../services/memoService';
import RichTextEditor from './RichTextEditor';
import { toast } from 'sonner';

interface MemoComposeProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<any>;
    isDark: boolean;
    mode?: 'compose' | 'reply' | 'forward';
    initialMemo?: any;
}

const MemoCompose: React.FC<MemoComposeProps> = ({ isOpen, onClose, onSubmit, isDark, mode = 'compose', initialMemo }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [recipients, setRecipients] = useState<{ to: number[], cc: number[], bcc: number[] }>({
        to: [],
        cc: [],
        bcc: []
    });
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
    const [isConfidential, setIsConfidential] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeRecipientField, setActiveRecipientField] = useState<'to' | 'cc' | 'bcc' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await employeeService.getDirectory({ per_page: 1000 });
                setEmployees(response.data);
            } catch (err) {
                console.error('Failed to fetch employees', err);
            }
        };
        if (isOpen) fetchEmployees();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialMemo) {
            if (mode === 'reply') {
                setSubject(`Re: ${initialMemo.subject}`);
                setRecipients({ to: [initialMemo.sender_id], cc: [], bcc: [] });
                setPriority(initialMemo.priority);
            } else if (mode === 'forward') {
                setSubject(`Fwd: ${initialMemo.subject}`);
                setBody(`<br/><br/>--- Forwarded Message ---<br/><b>From:</b> ${initialMemo.sender?.name}<br/><b>Date:</b> ${new Date(initialMemo.created_at).toLocaleString()}<br/><b>Subject:</b> ${initialMemo.subject}<br/><br/>${initialMemo.body}`);
                setPriority(initialMemo.priority);
                // Attachments are handled by the backend in forwardMemo, but we could display original ones if needed
            } else {
                setSubject('');
                setBody('');
                setRecipients({ to: [], cc: [], bcc: [] });
            }
        }
    }, [isOpen, initialMemo, mode]);

    const handleAddRecipient = (type: 'to' | 'cc' | 'bcc', userId: number) => {
        if (!userId) {
            toast.error('This employee does not have a linked user account.');
            return;
        }
        setRecipients(prev => {
            if (prev[type].includes(userId)) return prev;
            return { ...prev, [type]: [...prev[type], userId] };
        });
        setSearchTerm('');
        setActiveRecipientField(null);
    };

    const handleRemoveRecipient = (type: 'to' | 'cc' | 'bcc', userId: number) => {
        setRecipients(prev => ({
            ...prev,
            [type]: prev[type].filter(id => id !== userId)
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !body.trim() || (mode !== 'reply' && recipients.to.length === 0)) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            let memo;

            if (mode === 'reply') {
                memo = await onSubmit({
                    body,
                    reply_all: false // Default to false for single reply
                });
            } else if (mode === 'forward') {
                memo = await onSubmit({
                    recipients,
                    body
                });
            } else {
                memo = await onSubmit({
                    subject,
                    body,
                    recipients,
                    priority,
                    is_confidential: isConfidential
                });
            }

            // Upload attachments if any
            if (attachments.length > 0 && memo?.id) {
                toast.info(`Uploading ${attachments.length} attachment(s)...`);
                for (const file of attachments) {
                    try {
                        await memoService.uploadAttachment(memo.id, file);
                    } catch (uploadErr) {
                        console.error(`Failed to upload ${file.name}`, uploadErr);
                        toast.error(`Failed to upload ${file.name}`);
                    }
                }
            }

            toast.success(mode === 'reply' ? 'Reply sent' : mode === 'forward' ? 'Forwarded successfully' : 'Memo sent successfully');
            onClose();
            // Reset form
            setSubject('');
            setBody('');
            setRecipients({ to: [], cc: [], bcc: [] });
            setAttachments([]);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to process memo');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const filteredEmployees = employees.filter(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        const email = emp.email.toLowerCase();
        const search = searchTerm.toLowerCase();

        return (fullName.includes(search) || email.includes(search)) &&
            !recipients.to.includes(emp.user_id) &&
            !recipients.cc.includes(emp.user_id) &&
            !recipients.bcc.includes(emp.user_id);
    });

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[32px] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#1e293b] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                {/* Header */}
                <div className={`px-8 py-6 border-b flex items-center justify-between ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-[#8252e9]/20 text-[#8252e9]' : 'bg-blue-50 text-blue-600'}`}>
                            <Send size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight italic">Compose New Memo</h3>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Internal Communication System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                    {/* Recipients Section */}
                    <div className="space-y-4">
                        {(['to', 'cc', 'bcc'] as const).map(type => (
                            <div key={type} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                        {type === 'to' ? 'Recipients' : type.toUpperCase()} {type === 'to' && <span className="text-red-500">*</span>}
                                    </label>
                                    {activeRecipientField !== type && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveRecipientField(type)}
                                            className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors ${isDark ? 'text-[#8252e9] hover:text-[#9b73ef]' : 'text-blue-600 hover:text-blue-700'
                                                }`}
                                        >
                                            <UserPlus size={10} /> Add {type.toUpperCase()}
                                        </button>
                                    )}
                                </div>

                                <div className={`flex flex-wrap gap-2 p-3 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 group-focus-within:border-[#8252e9]/30' : 'bg-gray-50 border-gray-200 group-focus-within:border-blue-200'
                                    }`}>
                                    {recipients[type].map(id => {
                                        const emp = employees.find(e => e.user_id === id);
                                        return (
                                            <div key={id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold ${isDark ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
                                                }`}>
                                                <span>{emp ? `${emp.first_name} ${emp.last_name}` : id}</span>
                                                <button type="button" onClick={() => handleRemoveRecipient(type, id)} className="text-slate-500 hover:text-red-500 transition-colors">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    {activeRecipientField === type && (
                                        <div className="relative flex-1 min-w-[200px]">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder={`Search for employees...`}
                                                className="w-full bg-transparent border-none outline-none text-[11px] text-white py-1"
                                                onBlur={() => !searchTerm && setActiveRecipientField(null)}
                                            />
                                            {searchTerm && filteredEmployees.length > 0 && (
                                                <div className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border shadow-xl overflow-hidden ${isDark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-gray-200'
                                                    }`}>
                                                    {filteredEmployees.slice(0, 10).map(emp => (
                                                        <button
                                                            key={emp.id}
                                                            type="button"
                                                            onClick={() => handleAddRecipient(type, emp.user_id)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                                                                }`}>
                                                                {emp.first_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black uppercase tracking-tight">{emp.first_name} {emp.last_name}</p>
                                                                <p className="text-[9px] text-slate-500">{emp.email}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {recipients[type].length === 0 && activeRecipientField !== type && (
                                        <span className="text-[11px] text-slate-500 italic py-1">No recipients selected</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Memo Subject"
                                className={`w-full px-4 py-3 rounded-2xl border text-[12px] font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-[#8252e9]/30 text-white' : 'bg-gray-50 border-gray-200 focus:border-blue-200 text-gray-900'
                                    }`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                Priority Level
                            </label>
                            <div className="flex gap-2">
                                {(['low', 'normal', 'high', 'urgent'] as const).map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${priority === p
                                            ? isDark ? 'bg-[#8252e9]/20 border-[#8252e9]/40 text-white' : 'bg-blue-600 border-blue-600 text-white'
                                            : isDark ? 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                Memo Content <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isConfidential
                                        ? isDark ? 'bg-amber-500 border-amber-500' : 'bg-amber-600 border-amber-600'
                                        : isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                                        }`}>
                                        {isConfidential && <X size={10} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={isConfidential} onChange={() => setIsConfidential(!isConfidential)} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-gray-500 group-hover:text-gray-700'}`}>Confidential</span>
                                </label>
                            </div>
                        </div>
                        <div className={`rounded-2xl border min-h-[300px] overflow-hidden flex flex-col ${isDark ? 'bg-[#0f172a] border-white/10 focus-within:border-[#8252e9]/30' : 'bg-white border-gray-200 focus-within:border-blue-200'
                            }`}>
                            <RichTextEditor
                                value={body}
                                onChange={setBody}
                                isDark={isDark}
                                placeholder="Write your memo content here..."
                            />
                        </div>
                    </div>

                    {/* Attachments Display */}
                    {attachments.length > 0 && (
                        <div className="space-y-3">
                            <label className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                Attachments ({attachments.length})
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {attachments.map((file, index) => (
                                    <div key={index} className={`flex items-center justify-between p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText size={16} className="text-blue-500 flex-shrink-0" />
                                            <div className="overflow-hidden">
                                                <p className="text-[11px] font-bold truncate">{file.name}</p>
                                                <p className="text-[9px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className={`px-8 py-6 border-t flex items-center justify-between ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'
                    }`}>
                    <div className="flex gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Paperclip size={16} /> Attach Files
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-[#8252e9]/20 ${isDark ? 'bg-[#8252e9] text-white hover:bg-[#6d3fd4]' : 'bg-blue-600 text-white hover:bg-blue-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Send Memo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemoCompose;
