
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { calculateNet } from '../services/dataService';
import { ExamResult, ExamDefinition } from '../types';

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: ExamResult | Omit<ExamResult, 'id'>) => void;
  studentId: string;
  examDefinitions: ExamDefinition[];
  initialData?: ExamResult | null;
  preselectedExamDefId?: string | null;
  existingExamIds?: string[]; // IDs of exams the student has already taken
}

export const ExamModal: React.FC<ExamModalProps> = ({ 
  isOpen, onClose, onSave, studentId, examDefinitions, initialData, preselectedExamDefId, existingExamIds = []
}) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [previewNet, setPreviewNet] = useState(0);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    if (isOpen) {
       if (initialData) {
         setSelectedExamId(initialData.examId || '');
         setCorrect(initialData.correct);
         setIncorrect(initialData.incorrect);
         setIsMissing(initialData.status === 'MISSING');
       } else {
         if (preselectedExamDefId) {
            setSelectedExamId(preselectedExamDefId);
         } else {
           // Find first exam that isn't already taken
           const availableExam = examDefinitions.find(ed => !existingExamIds.includes(ed.id));
           // If all taken, just default to first (it will be disabled but visible)
           setSelectedExamId(availableExam ? availableExam.id : (examDefinitions[0]?.id || ''));
         }
         setCorrect(0);
         setIncorrect(0);
         setIsMissing(false);
       }
    }
  }, [isOpen, initialData, examDefinitions, preselectedExamDefId, existingExamIds]);

  useEffect(() => {
    if (isMissing) {
        setPreviewNet(0);
    } else {
        setPreviewNet(calculateNet(correct, incorrect));
    }
  }, [correct, incorrect, isMissing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto calculate empty
    const empty = 10 - (correct + incorrect);
    if (empty < 0) {
      alert("Toplam soru sayısı 10'dur. Doğru ve Yanlış toplamı 10'u geçemez.");
      return;
    }

    const selectedExam = examDefinitions.find(ed => ed.id === selectedExamId);
    
    // Prevent saving if exam is already taken (and we are not editing)
    if (!initialData && existingExamIds.includes(selectedExamId)) {
        alert("Bu öğrenci için bu deneme zaten girilmiş.");
        return;
    }

    const examName = selectedExam ? selectedExam.name : (initialData?.examName || 'Bilinmeyen Sınav');
    const examDate = selectedExam ? selectedExam.date : (initialData?.date || new Date().toISOString().split('T')[0]);

    const resultData = {
      studentId,
      examId: selectedExamId,
      examName: examName,
      date: examDate,
      correct: isMissing ? 0 : correct,
      incorrect: isMissing ? 0 : incorrect,
      empty: isMissing ? 0 : empty,
      net: isMissing ? 0 : previewNet,
      status: isMissing ? 'MISSING' as const : 'ATTENDED' as const,
    };

    if (initialData) {
      onSave({ ...resultData, id: initialData.id });
    } else {
      onSave(resultData);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-700">
        <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-900 text-white">
          <h3 className="text-base font-semibold">
            {initialData ? 'Sonuç Düzenle' : 'Sonuç Ekle'}
          </h3>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {examDefinitions.length === 0 && !initialData ? (
            <div className="text-red-400 bg-red-900/20 p-3 rounded text-sm border border-red-900/50">
              Önce "Denemeler" menüsünden bir deneme tanımlamalısınız.
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Deneme</label>
              <select
                required
                disabled={!!initialData || !!preselectedExamDefId}
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 text-white disabled:bg-gray-800 disabled:text-gray-500"
              >
                {examDefinitions.map(exam => {
                  const isTaken = existingExamIds.includes(exam.id) && exam.id !== initialData?.examId;
                  return (
                    <option key={exam.id} value={exam.id} disabled={isTaken} className={isTaken ? 'text-gray-500 bg-gray-800' : ''}>
                      {exam.name} {isTaken ? '(Girildi)' : ''}
                    </option>
                  );
                })}
                {initialData && !examDefinitions.find(e => e.id === initialData.examId) && (
                   <option value={initialData.examId}>{initialData.examName} (Silinmiş)</option>
                )}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 py-1">
            <input 
                type="checkbox" 
                id="isMissing" 
                checked={isMissing} 
                onChange={(e) => setIsMissing(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isMissing" className="text-gray-300 text-sm font-medium select-none">
                Sınava Girmedi
            </label>
          </div>

          {!isMissing && (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-green-400 mb-1">Doğru</label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            required={!isMissing}
                            value={correct}
                            onChange={(e) => setCorrect(Number(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-green-500 focus:border-green-500 text-white text-lg font-bold text-center"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-red-400 mb-1">Yanlış</label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            required={!isMissing}
                            value={incorrect}
                            onChange={(e) => setIncorrect(Number(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-white text-lg font-bold text-center"
                        />
                    </div>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded flex justify-between items-center text-sm">
                   <span className="text-gray-400">Boş (Oto):</span>
                   <span className="font-bold text-gray-200">{10 - (correct + incorrect)}</span>
                </div>
            </div>
          )}

          {!isMissing && (
            <div className="bg-indigo-900/30 p-3 rounded-lg flex justify-between items-center border border-indigo-900/50">
                <span className="font-semibold text-gray-300">NET:</span>
                <span className={`text-2xl font-bold ${previewNet >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                {previewNet}
                </span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={examDefinitions.length === 0 && !initialData}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:bg-gray-600 disabled:text-gray-400"
            >
              {initialData ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
