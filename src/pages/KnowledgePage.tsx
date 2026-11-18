import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';

const KnowledgePage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [learnedKnowledge, setLearnedKnowledge] = useState<any>(null);

  const fetchKnowledge = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/training/list-knowledge');
      setLearnedKnowledge(response.data);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    }
  }, []);

  const clearAllKnowledge = async () => {
    if (!window.confirm('Are you sure you want to delete all existing knowledge?')) return;
    try {
      await axios.post('http://localhost:3000/training/reset-knowledge');
      fetchKnowledge();
    } catch (error) {
      console.error('Error clearing knowledge:', error);
    }
  };

  React.useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file =>
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)
    );
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await axios.post('http://localhost:3000/training/upload', formData);
      }
      setUploadStatus({ type: 'success', message: `Successfully trained ${files.length} documents!` });
      setFiles([]);
      fetchKnowledge();
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Error occurred while uploading documents.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto p-10">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">System Knowledge</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Provide documents to make Sirius AI smarter in your specific domain.</p>
        </div>

        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center bg-slate-50 dark:bg-slate-900/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-white dark:bg-slate-800 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700">
            <Upload size={28} />
          </div>
          <h3 className="text-lg font-bold mb-2">Drag and drop PDF/Word documents</h3>
          <p className="text-slate-400 mb-8 text-xs font-medium uppercase tracking-widest">Max 10MB per file</p>

          <label className="bg-slate-800 dark:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold cursor-pointer hover:opacity-90 transition-all active:scale-95 inline-block">
            Select files from computer
            <input type="file" className="hidden" multiple onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))} />
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-10 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Upload Queue</h4>
              <button onClick={() => setFiles([])} className="text-xs font-bold text-rose-500">Cancel all</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-rose-500">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={uploadAll}
              disabled={isUploading}
              className="w-full mt-6 bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {isUploading ? 'Analyzing data...' : 'Start Training'}
            </button>
          </div>
        )}

        {uploadStatus && (
          <div className={`mt-6 p-5 rounded-2xl flex items-center gap-3 ${
            uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20'
          }`}>
            {uploadStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-bold">{uploadStatus.message}</p>
          </div>
        )}

        <div className="mt-20">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Learned Knowledge</h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 uppercase">
                {learnedKnowledge?.documents?.length || 0} Knowledge Chunks
              </span>
              <button onClick={clearAllKnowledge} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {learnedKnowledge?.documents.map((doc: string, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm">
                    <FileText size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 truncate max-w-xs">
                    {learnedKnowledge.metadatas[idx]?.source}
                  </span>
                </div>
                <p className="text-[13.5px] text-slate-600 dark:text-slate-300 leading-7">
                  "{doc.length > 300 ? doc.substring(0, 300) + '...' : doc}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgePage;
