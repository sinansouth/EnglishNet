import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowLeft, 
  Search,
  FileText,
  ArrowUpDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ClipboardList,
  FileSpreadsheet
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

import { Classroom, ExamResult, Student, StudentWithStats, ViewState, ExamDefinition } from './types';
import { 
  fetchAllData, 
  apiAddStudent, apiUpdateStudent, apiDeleteStudent,
  apiAddClass, apiUpdateClass, apiDeleteClass,
  apiAddExamResult, apiUpdateExamResult, apiDeleteExamResult,
  apiAddExamDefinition, apiUpdateExamDefinition, apiDeleteExamDefinition
} from './services/dataService';
import { ExamModal } from './components/ExamModal';
import { StudentFormModal } from './components/StudentFormModal';

// --- HELPER FUNCTIONS ---

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

const getTrend = (current: number, previous: number | undefined) => {
    if (previous === undefined) return 'flat';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'flat';
};

// --- HELPER COMPONENTS ---

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-green-500 inline" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-red-500 inline" />;
    return <Minus size={14} className="text-gray-500 inline" />;
};

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string, date?: string) => void;
  title: string;
  placeholder: string;
  initialValue?: string;
  initialDate?: string;
  showDatePicker?: boolean;
}

const InputModal: React.FC<InputModalProps> = ({ isOpen, onClose, onSubmit, title, placeholder, initialValue = '', initialDate = '', showDatePicker }) => {
  const [value, setValue] = useState(initialValue);
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setDate(initialDate || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, initialValue, initialDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-xs border border-gray-700 p-4">
        <h3 className="text-base font-bold text-white mb-3">{title}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(value, date); onClose(); }}>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mb-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          {showDatePicker && (
            <div className="mb-3">
               <label className="block text-xs text-gray-400 mb-1">Tarih</label>
               <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">İptal</button>
            <button type="submit" className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-xs border border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2 text-red-400">
           <AlertTriangle size={20} />
           <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">Vazgeç</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700">Sil</button>
        </div>
      </div>
    </div>
  );
};

interface BatchImportModalProps {
  isOpen: boolean;
  mode: 'student' | 'result';
  onClose: () => void;
  onProcess: (text: string) => void;
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, mode, onClose, onProcess }) => {
  const [text, setText] = useState('');

  // Reset text when mode changes or modal opens
  useEffect(() => {
    if (isOpen) setText('');
  }, [isOpen, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 flex flex-col h-[80vh]">
         <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
            <div className="flex items-center gap-2">
                {mode === 'student' ? <ClipboardList className="text-indigo-400" /> : <FileSpreadsheet className="text-green-400" />}
                <h3 className="text-lg font-bold text-white">{mode === 'student' ? 'Hızlı Öğrenci Girişi' : 'Hızlı Sonuç Girişi'}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
         </div>
         <div className="p-4 flex-1 flex flex-col gap-3 bg-gray-800 overflow-y-auto">
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700 text-sm text-gray-300 space-y-2">
                <p>Excel'den veya başka bir listeden verileri kopyalayıp aşağıdaki alana yapıştırın.</p>
                
                {mode === 'student' ? (
                  <>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-400 text-xs uppercase">Format:</span>
                        <div className="font-mono bg-black/30 p-2 rounded text-indigo-300 text-xs">
                            Ad Soyad Sınıf
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        * Sistemde aynı isimde öğrenci varsa yeni kayıt açılmaz.<br/>
                        * Öğrencinin sınıfı farklıysa güncellenir.<br/>
                        * Örnek: <span className="font-mono text-gray-300">Ali Yılmaz 8/A</span>
                    </p>
                  </>
                ) : (
                  <>
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-400 text-xs uppercase">Format:</span>
                        <div className="font-mono bg-black/30 p-2 rounded text-green-300 text-xs">
                            SınavAdı ÖğrenciAdıSoyadı Doğru Yanlış
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        * Sütunlar: Sınav Adı | Öğrenci | D | Y<br/>
                        * <strong>Excel'den kopyalamanız tavsiye edilir (daha iyi ayırt eder).</strong><br/>
                        * Veriler sistemde varsa güncellenir.<br/>
                        * Öğrenci sistemde kayıtlı olmalıdır (Sınıf bilgisine gerek yok).<br/>
                        * <strong>Otomatik Girmedi:</strong> Listede adı olmayan ancak ilgili denemeye katılan sınıflardaki öğrenciler otomatik "GİRMEDİ" işaretlenir.<br/>
                        * Örnek: <span className="font-mono text-gray-300">LGS Deneme 1 Ahmet Demir 8 2</span>
                    </p>
                  </>
                )}
            </div>
            <textarea 
              className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder={mode === 'student' ? "Ahmet Yılmaz 8/A..." : "Deneme 1 Ahmet Yılmaz 8 2..."}
              value={text}
              onChange={e => setText(e.target.value)}
            />
         </div>
         <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-900">
            <button 
                onClick={() => onProcess(text)} 
                disabled={!text.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
               Verileri İşle ve Kaydet
            </button>
         </div>
      </div>
    </div>
  )
}

// --- SORT HELPER ---
type SortDirection = 'asc' | 'desc';
interface SortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
}

function sortData<T>(data: T[], config: SortConfig<any>): T[] {
  return [...data].sort((a: any, b: any) => {
    const aVal = config.key.toString().split('.').reduce((o: any, i: any) => (o ? o[i] : undefined), a);
    const bVal = config.key.toString().split('.').reduce((o: any, i: any) => (o ? o[i] : undefined), b);

    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
        return config.direction === 'asc' 
            ? aVal.localeCompare(bVal, 'tr') 
            : bVal.localeCompare(aVal, 'tr');
    }

    if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function App() {
  // --- STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  
  // Selection State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedExamDefId, setSelectedExamDefId] = useState<string | null>(null);
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [examDefinitions, setExamDefinitions] = useState<ExamDefinition[]>([]);
  
  // Modals & Editing
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamResult, setEditingExamResult] = useState<ExamResult | null>(null);
  const [preselectedExamDefId, setPreselectedExamDefId] = useState<string | null>(null);
  
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchModalMode, setBatchModalMode] = useState<'student' | 'result'>('student');

  // Generic Modals
  const [inputModalConfig, setInputModalConfig] = useState<{ 
    isOpen: boolean, 
    title: string, 
    placeholder: string, 
    initialValue?: string,
    initialDate?: string,
    showDatePicker?: boolean, 
    onSubmit: (val: string, date?: string) => void 
  }>({ isOpen: false, title: '', placeholder: '', onSubmit: () => {} });
  
  const [confirmModalConfig, setConfirmModalConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  // UI Config
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterExamId, setFilterExamId] = useState<string>('all'); // Global Exam Filter
  const [classDetailExamFilter, setClassDetailExamFilter] = useState<string>('last'); // Class Detail specific filter
  const [filterExamDetailClassId, setFilterExamDetailClassId] = useState<string>('all'); // Exam Detail Filter

  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting States
  const [sortStudents, setSortStudents] = useState<SortConfig<StudentWithStats>>({ key: 'name', direction: 'asc' });
  const [sortExamHistory, setSortExamHistory] = useState<SortConfig<any>>({ key: 'def.date', direction: 'desc' });
  const [sortClassStudents, setSortClassStudents] = useState<SortConfig<any>>({ key: 'name', direction: 'asc' });
  const [sortExamList, setSortExamList] = useState<SortConfig<ExamDefinition>>({ key: 'date', direction: 'desc' });
  const [sortExamDetail, setSortExamDetail] = useState<SortConfig<any>>({ key: 'net', direction: 'desc' });

  const [studentChartMetric, setStudentChartMetric] = useState<'net' | 'correct'>('net');

  // --- NAVIGATION HISTORY LOGIC ---

  // Handle navigation requests
  const handleNavigation = useCallback((newView: ViewState, params?: { studentId?: string, classId?: string, examDefId?: string }) => {
    // 1. Update State variables based on params
    if (params?.studentId) setSelectedStudentId(params.studentId);
    if (params?.classId) setSelectedClassId(params.classId);
    if (params?.examDefId) setSelectedExamDefId(params.examDefId);

    // 2. Push state to history
    window.history.pushState({ 
        view: newView, 
        selectedStudentId: params?.studentId || selectedStudentId,
        selectedClassId: params?.classId || selectedClassId,
        selectedExamDefId: params?.examDefId || selectedExamDefId
    }, '');

    // 3. Update View
    setView(newView);
  }, [selectedStudentId, selectedClassId, selectedExamDefId]);

  // Handle Back Button (PopState)
  useEffect(() => {
    // Initial State replacement to ensure we have a state to pop to
    window.history.replaceState({ view: 'DASHBOARD' }, '');

    const handlePopState = (event: PopStateEvent) => {
        if (event.state) {
            setView(event.state.view || 'DASHBOARD');
            if (event.state.selectedStudentId) setSelectedStudentId(event.state.selectedStudentId);
            if (event.state.selectedClassId) setSelectedClassId(event.state.selectedClassId);
            if (event.state.selectedExamDefId) setSelectedExamDefId(event.state.selectedExamDefId);
        } else {
            setView('DASHBOARD');
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // UI Back Button Handler (Uses History)
  const handleBack = () => {
    window.history.back();
  };


  // --- INITIAL LOAD ---
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await fetchAllData();
        setStudents(data.students);
        setClasses(data.classes);
        setExams(data.exams);
        setExamDefinitions(data.examDefinitions);
      } catch (e: any) {
        if (e.code === 'permission-denied') {
            setErrorMsg("Missing or insufficient permissions.");
        } else {
            setErrorMsg("Veriler yüklenirken bir hata oluştu.");
        }
      } finally {
         setIsLoading(false);
      }
    };
    initData();
  }, []);

  // --- DERIVED DATA ---
  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    return students.map(student => {
      // Get all exams for this student
      const studentExams = exams.filter(e => e.studentId === student.id);
      
      // Determine which exams to use for calculations based on filter
      let calculationExams = studentExams.filter(e => e.status !== 'MISSING');
      
      if (filterExamId !== 'all') {
        calculationExams = calculationExams.filter(e => e.examId === filterExamId);
      }

      const examCount = calculationExams.length;
      const totalNet = calculationExams.reduce((sum, e) => sum + e.net, 0);
      const totalCorrect = calculationExams.reduce((sum, e) => sum + e.correct, 0);
      const totalIncorrect = calculationExams.reduce((sum, e) => sum + e.incorrect, 0);
      
      const averageNet = examCount > 0 ? parseFloat((totalNet / examCount).toFixed(2)) : 0;
      const averageCorrect = examCount > 0 ? parseFloat((totalCorrect / examCount).toFixed(1)) : 0;
      const averageIncorrect = examCount > 0 ? parseFloat((totalIncorrect / examCount).toFixed(1)) : 0;
      
      const sortedExams = [...studentExams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastResult = sortedExams.length > 0 ? sortedExams[0] : null;
      const lastNet = lastResult ? lastResult.net : 0;

      // Previous result for trend (only count non-missing for fair comparison if needed, or just raw)
      const validExams = sortedExams.filter(e => e.status !== 'MISSING');
      const previousResult = validExams.length > 1 ? validExams[1] : undefined;

      return {
        ...student,
        examCount,
        averageNet,
        averageCorrect,
        averageIncorrect,
        lastNet,
        lastResult, 
        previousResult: previousResult // Comparison against previous valid exam
      };
    });
  }, [students, exams, filterExamId]);

  const filteredStudents = useMemo(() => {
    let result = studentsWithStats;

    if (filterClassId !== 'all') {
      result = result.filter(s => s.classroomId === filterClassId);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.surname.toLowerCase().includes(q)
      );
    }

    return sortData(result, sortStudents);
  }, [studentsWithStats, filterClassId, searchQuery, sortStudents]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const effectiveExams = exams.filter(e => e.status !== 'MISSING');
    const totalExams = effectiveExams.length;
    const totalExamDefinitions = examDefinitions.length;
    
    const globalTotalNet = effectiveExams.reduce((sum, e) => sum + e.net, 0);
    const globalAvgNet = totalExams > 0 ? (globalTotalNet / totalExams).toFixed(2) : '0.00';

    // Exam Stats Logic
    const examStats = examDefinitions.map(def => {
        const results = effectiveExams.filter(e => e.examId === def.id || e.examName === def.name);
        let avgNet = 0;
        if (results.length > 0) {
            avgNet = results.reduce((s, e) => s + e.net, 0) / results.length;
        }
        return {
            name: def.name,
            avgNet: parseFloat(avgNet.toFixed(2)),
            date: def.date,
            formattedDate: formatDate(def.date)
        };
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Keep all for scroll

    return { totalStudents, totalExams, totalExamDefinitions, globalAvgNet, examStats };
  }, [students, exams, classes, examDefinitions]);

  // --- HANDLERS ---
  const handleSort = (config: SortConfig<any>, setConfig: React.Dispatch<React.SetStateAction<SortConfig<any>>>, key: string) => {
    setConfig({
        key,
        direction: config.key === key && config.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleAddClass = () => {
    setInputModalConfig({
        isOpen: true,
        title: 'Yeni Sınıf Ekle',
        placeholder: 'Sınıf Adı',
        onSubmit: async (name) => {
            if (name) {
                const newClass = { id: Date.now().toString(), name };
                await apiAddClass(newClass);
                setClasses(prev => [...prev, newClass]);
            }
        }
    });
  };

  const handleEditClass = (id: string, currentName: string) => {
    setInputModalConfig({
        isOpen: true,
        title: 'Sınıfı Düzenle',
        placeholder: 'Sınıf Adı',
        initialValue: currentName,
        onSubmit: async (name) => {
            if (name) {
                const updated = { id, name };
                await apiUpdateClass(updated);
                setClasses(prev => prev.map(c => c.id === id ? updated : c));
            }
        }
    });
  };

  const handleDeleteClass = (id: string) => {
    if (students.some(s => s.classroomId === id)) {
      alert("Bu sınıfta öğrenci var, önce öğrencileri taşıyın veya silin.");
      return;
    }
    setConfirmModalConfig({
        isOpen: true,
        title: 'Sınıfı Sil',
        message: 'Bu sınıfı silmek istediğinize emin misiniz?',
        onConfirm: async () => {
            await apiDeleteClass(id);
            setClasses(prev => prev.filter(c => c.id !== id));
        }
    });
  };

  const handleSaveStudent = async (studentData: Omit<Student, 'id'> | Student) => {
    // Sanitize targetCorrect to ensure no undefined values are sent to Firebase
    const cleanData = {
        ...studentData,
        targetCorrect: studentData.targetCorrect === undefined || isNaN(studentData.targetCorrect as number) ? 6 : studentData.targetCorrect
    };

    if ('id' in cleanData) {
        await apiUpdateStudent(cleanData as Student);
        setStudents(prev => prev.map(s => s.id === cleanData.id ? cleanData as Student : s));
    } else {
        const newStudent = { ...cleanData, id: Date.now().toString() };
        await apiAddStudent(newStudent as Student);
        setStudents(prev => [...prev, newStudent as Student]);
    }
  };

  const handleDeleteStudent = (id: string) => {
    setConfirmModalConfig({
        isOpen: true,
        title: 'Öğrenciyi Sil',
        message: 'Öğrenci silinsin mi?',
        onConfirm: async () => {
            // Optimistic update locally
            setStudents(prev => prev.filter(s => s.id !== id));
            setExams(prev => prev.filter(e => e.studentId !== id));
            handleNavigation('STUDENTS');
            
            // Delete from Cloud
            await apiDeleteStudent(id);
            // Also should delete exams from cloud, but for simplicity assuming manual clean up or cloud functions
            // Implementing client side delete for associated exams
            const studentExams = exams.filter(e => e.studentId === id);
            for(const ex of studentExams) {
                await apiDeleteExamResult(ex.id);
            }
        }
    });
  };

  const handleOpenExamModal = (result?: ExamResult, examDefId?: string) => {
    setEditingExamResult(result || null);
    setPreselectedExamDefId(examDefId || null);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (examData: ExamResult | Omit<ExamResult, 'id'>) => {
    if ('id' in examData) {
      await apiUpdateExamResult(examData);
      setExams(prev => prev.map(e => e.id === examData.id ? examData : e));
    } else {
      const newResult = { ...examData, id: Date.now().toString() };
      await apiAddExamResult(newResult);
      setExams(prev => [...prev, newResult]);
    }
  };

  const handleDeleteExamResult = (id: string) => {
    setConfirmModalConfig({
        isOpen: true,
        title: 'Sonucu Sil',
        message: 'Silmek istediğinize emin misiniz?',
        onConfirm: async () => {
            await apiDeleteExamResult(id);
            setExams(prev => prev.filter(e => e.id !== id));
        }
    });
  };

  const handleAddExamDefinition = () => {
    setInputModalConfig({
        isOpen: true,
        title: 'Yeni Deneme Ekle',
        placeholder: 'Deneme Adı',
        showDatePicker: true,
        onSubmit: async (name, date) => {
            if (name && date) {
                const newDef = { id: Date.now().toString(), name, date };
                await apiAddExamDefinition(newDef);
                setExamDefinitions(prev => [...prev, newDef]);
            }
        }
    });
  };

  const handleEditExamDefinition = (id: string, currentName: string, currentDate: string) => {
    setInputModalConfig({
        isOpen: true,
        title: 'Deneme Düzenle',
        placeholder: 'Deneme Adı',
        initialValue: currentName,
        initialDate: currentDate,
        showDatePicker: true,
        onSubmit: async (name, date) => {
            if (name && date) {
                const updated = { id, name, date };
                await apiUpdateExamDefinition(updated);
                setExamDefinitions(prev => prev.map(e => e.id === id ? updated : e));
            }
        }
    });
  }

  const handleDeleteExamDefinition = (id: string) => {
    const hasResults = exams.some(e => e.examId === id || e.examName === examDefinitions.find(ed => ed.id === id)?.name);
    setConfirmModalConfig({
        isOpen: true,
        title: 'Denemeyi Sil',
        message: hasResults 
            ? 'Bu denemeye ait sonuçlar var. Silinirse sonuçlar kalır ama deneme listeden kalkar.'
            : 'Silmek istediğinize emin misiniz?',
        onConfirm: async () => {
            await apiDeleteExamDefinition(id);
            setExamDefinitions(prev => prev.filter(e => e.id !== id));
            handleNavigation('EXAMS');
        }
    });
  };

  // --- BATCH IMPORT HANDLER (STUDENT) ---
  const handleBatchStudentImport = async (text: string) => {
    setIsLoading(true);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const newStudentsPayload: any[] = [];
    const classNamesFound = new Set<string>();

    // 1. Parse Text
    lines.forEach(line => {
        let parts = line.split('\t').map(p => p.trim()).filter(p => p);
        if (parts.length < 2) {
            parts = line.trim().split(/\s+/);
        }

        if (parts.length >= 2) {
             const className = parts.pop()!;
             const surname = parts.length > 1 ? parts.pop()! : '';
             const name = parts.join(' ');
             
             if (name && className) {
                 classNamesFound.add(className);
                 newStudentsPayload.push({ name, surname, className });
             }
        }
    });

    if (newStudentsPayload.length === 0) {
        alert("Geçerli veri bulunamadı. Lütfen formatı kontrol edin.");
        setIsLoading(false);
        return;
    }

    try {
        // 2. Handle Classes (Create missing ones)
        const tempClasses = [...classes];
        const createdClasses = [];
        
        for (const cName of Array.from(classNamesFound)) {
            let cls = tempClasses.find(c => c.name.toLowerCase() === cName.toLowerCase());
            if (!cls) {
                cls = { id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(), name: cName };
                await apiAddClass(cls);
                tempClasses.push(cls);
                createdClasses.push(cls);
            }
        }
        
        if (createdClasses.length > 0) {
            setClasses(tempClasses);
        }

        // 3. Process Students (Add or Update Class)
        const tempStudents = [...students];
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const s of newStudentsPayload) {
            const cls = tempClasses.find(c => c.name.toLowerCase() === s.className.toLowerCase());
            
            if (cls) {
                // Check if student exists by Name+Surname (Case Insensitive & Locale Aware)
                const existingStudentIndex = tempStudents.findIndex(st => 
                    st.name.toLocaleLowerCase('tr') === s.name.toLocaleLowerCase('tr') && 
                    st.surname.toLocaleLowerCase('tr') === s.surname.toLocaleLowerCase('tr')
                );

                if (existingStudentIndex !== -1) {
                    const existingStudent = tempStudents[existingStudentIndex];
                    // If exists, check Class
                    if (existingStudent.classroomId !== cls.id) {
                        // Class Changed -> Update
                        const updatedStudent = { ...existingStudent, classroomId: cls.id };
                        await apiUpdateStudent(updatedStudent);
                        tempStudents[existingStudentIndex] = updatedStudent;
                        updatedCount++;
                    } else {
                        // Same Class -> Skip
                        skippedCount++;
                    }
                } else {
                    // New Student -> Create
                    const newStudent = {
                        id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
                        name: s.name,
                        surname: s.surname,
                        classroomId: cls.id,
                        targetCorrect: 6 // Explicit default value to avoid undefined error in Firebase
                    };
                    await apiAddStudent(newStudent);
                    tempStudents.push(newStudent);
                    addedCount++;
                }
            }
        }

        setStudents(tempStudents);
        setIsBatchModalOpen(false);
        alert(`İşlem Tamamlandı!\n\n${addedCount} yeni öğrenci eklendi.\n${updatedCount} öğrencinin sınıfı güncellendi.\n${skippedCount} kayıt zaten güncel.`);
    
    } catch (e) {
        console.error(e);
        alert("Veriler kaydedilirken bir hata oluştu.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- BATCH IMPORT HANDLER (RESULTS) ---
  const handleBatchResultImport = async (text: string) => {
    setIsLoading(true);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const norm = (str: string) => str.trim().toLocaleLowerCase('tr');

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let missingCount = 0;

    try {
        const tempExamDefs = [...examDefinitions];
        const tempStudents = [...students];
        const tempResults = [...exams];
        
        // Track which exams were processed and which students in those exams were processed
        const processedExamStudentIds = new Map<string, Set<string>>(); // ExamID -> Set<StudentID>
        const involvedClassIdsByExam = new Map<string, Set<string>>(); // ExamID -> Set<ClassID>

        for (const line of lines) {
            // Try explicit TAB split first (Best for Excel)
            let parts = line.split('\t').map(p => p.trim()).filter(p => p !== "");
            
            // If no tabs found, try to split by spaces
            if (parts.length < 3) {
                 const spaceParts = line.trim().split(/\s+/);
                 if (spaceParts.length >= 4) {
                     // We have at least: W1 W2 ... Num Num
                     const incStr = spaceParts.pop();
                     const corrStr = spaceParts.pop();
                     const rest = spaceParts.join(' ');
                     parts = [rest, corrStr!, incStr!];
                     // Note: parts[0] is "ExamName StudentName" mixed
                 }
            }

            if (parts.length >= 3) {
                const incorrectStr = parts.pop()!;
                const correctStr = parts.pop()!;
                // Now parts contains either [ExamName, StudentName] (if tabbed) OR [ExamName StudentName Mixed]
                
                const correct = parseInt(correctStr);
                const incorrect = parseInt(incorrectStr);

                if (isNaN(correct) || isNaN(incorrect) || (correct + incorrect > 10)) {
                    skippedCount++;
                    continue;
                }
                
                let examNameStr = "";
                let studentNameStr = "";

                if (parts.length >= 2) {
                    // Tab case: We have distinct columns
                    studentNameStr = parts.pop()!;
                    examNameStr = parts.join(' ');
                } else {
                    // Mixed case: "Exam Name Student Name"
                    const mixedStr = parts[0];
                    
                    // STRATEGY: Find matching Exam Definition First (Longest Match)
                    const sortedExams = tempExamDefs.sort((a,b) => b.name.length - a.name.length);
                    const matchedExam = sortedExams.find(e => mixedStr.toLocaleLowerCase('tr').startsWith(e.name.toLocaleLowerCase('tr')));
                    
                    if (matchedExam) {
                        examNameStr = matchedExam.name;
                        studentNameStr = mixedStr.substring(examNameStr.length).trim();
                    } else {
                        // If Exam not found, try to match Student Name at the end (Risky but necessary fallback)
                        // Try matching both "Name Surname" and "Surname Name"
                        const matchedStudent = tempStudents.find(s => {
                            const nameSurname = `${s.name} ${s.surname}`;
                            const surnameName = `${s.surname} ${s.name}`;
                            return mixedStr.toLocaleLowerCase('tr').endsWith(nameSurname.toLocaleLowerCase('tr')) || 
                                   mixedStr.toLocaleLowerCase('tr').endsWith(surnameName.toLocaleLowerCase('tr'));
                        });
                        
                        if (matchedStudent) {
                            // Find which one matched to cut correctly
                            const nameSurname = `${matchedStudent.name} ${matchedStudent.surname}`;
                            const surnameName = `${matchedStudent.surname} ${matchedStudent.name}`;
                            if (mixedStr.toLocaleLowerCase('tr').endsWith(nameSurname.toLocaleLowerCase('tr'))) {
                                studentNameStr = nameSurname;
                            } else {
                                studentNameStr = surnameName;
                            }
                            examNameStr = mixedStr.substring(0, mixedStr.length - studentNameStr.length).trim();
                        } else {
                            // Can't identify
                            skippedCount++;
                            continue;
                        }
                    }
                }

                // 1. RESOLVE EXAM
                let examDef = tempExamDefs.find(e => norm(e.name) === norm(examNameStr));
                if (!examDef) {
                    // Create new Exam Def if we identified a name
                    if (examNameStr.length > 0) {
                        const newDef = { id: Date.now() + Math.random().toString(), name: examNameStr, date: new Date().toISOString().split('T')[0] };
                        await apiAddExamDefinition(newDef);
                        tempExamDefs.push(newDef);
                        examDef = newDef;
                    } else {
                        skippedCount++;
                        continue;
                    }
                }

                // 2. RESOLVE STUDENT
                // Find student by name (Global search) - Handle Name Surname OR Surname Name
                const student = tempStudents.find(s => 
                    norm(`${s.name} ${s.surname}`) === norm(studentNameStr) || 
                    norm(`${s.surname} ${s.name}`) === norm(studentNameStr)
                );
                
                if (!student) {
                    // Cannot create student because we don't know the class
                    console.warn(`Öğrenci bulunamadı: ${studentNameStr}`);
                    skippedCount++;
                    continue;
                }

                // Track participation
                if (!processedExamStudentIds.has(examDef.id)) {
                    processedExamStudentIds.set(examDef.id, new Set());
                    involvedClassIdsByExam.set(examDef.id, new Set());
                }
                processedExamStudentIds.get(examDef.id)!.add(student.id);
                involvedClassIdsByExam.get(examDef.id)!.add(student.classroomId);

                // 3. CREATE/UPDATE RESULT
                const empty = 10 - (correct + incorrect);
                const net = parseFloat((correct - (incorrect * 0.33)).toFixed(2));
                
                const existingResult = tempResults.find(r => r.studentId === student.id && r.examId === examDef!.id);
                 
                const resultData = {
                    studentId: student.id,
                    examId: examDef!.id,
                    examName: examDef!.name,
                    date: examDef!.date,
                    correct,
                    incorrect,
                    empty,
                    net,
                    status: 'ATTENDED' as const
                };

                if (existingResult) {
                    const updated = { ...resultData, id: existingResult.id };
                    await apiUpdateExamResult(updated);
                    const idx = tempResults.findIndex(r => r.id === existingResult.id);
                    tempResults[idx] = updated;
                    updatedCount++;
                } else {
                    const newResult = { ...resultData, id: Date.now() + Math.random().toString() };
                    await apiAddExamResult(newResult);
                    tempResults.push(newResult);
                    addedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        // 4. AUTO-FILL "MISSING" (GİRMEDİ) STATUS
        // For each exam processed, find students in the "involved classes" who were NOT in the input list
        for (const [examId, classIds] of involvedClassIdsByExam.entries()) {
             const processedStudentIds = processedExamStudentIds.get(examId)!;
             const examDef = tempExamDefs.find(e => e.id === examId);
             
             if (!examDef) continue;

             const studentsInvolved = tempStudents.filter(s => classIds.has(s.classroomId));

             for (const student of studentsInvolved) {
                 // If student was NOT processed in this batch import
                 if (!processedStudentIds.has(student.id)) {
                     // Check if they already have a result for this exam (maybe entered manually before)
                     const existingResult = tempResults.find(r => r.studentId === student.id && r.examId === examId);
                     
                     if (!existingResult) {
                         // No result exists, create MISSING result
                         const missingResult = {
                            id: Date.now() + Math.random().toString(),
                            studentId: student.id,
                            examId: examDef.id,
                            examName: examDef.name,
                            date: examDef.date,
                            correct: 0,
                            incorrect: 0,
                            empty: 0,
                            net: 0,
                            status: 'MISSING' as const
                         };
                         await apiAddExamResult(missingResult);
                         tempResults.push(missingResult);
                         missingCount++;
                     }
                 }
             }
        }

        setExamDefinitions(tempExamDefs);
        setExams(tempResults);
        
        setIsBatchModalOpen(false);
        alert(`İşlem Tamamlandı!\n\n${addedCount} yeni sonuç eklendi.\n${updatedCount} sonuç güncellendi.\n${missingCount} öğrenci otomatik 'GİRMEDİ' işaretlendi.\n${skippedCount} satır okunamadı/atlandı.`);
    
    } catch (e) {
        console.error(e);
        alert("Veriler kaydedilirken bir hata oluştu.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- RENDER VIEWS ---

  const renderDashboard = () => (
    <div className="space-y-4 pb-safe">
      {/* HEADER STATS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-xs">Öğrenci</p>
          <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-xs">Sınav</p>
          <p className="text-2xl font-bold text-white">{stats.totalExamDefinitions}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-xs">Ort. Net</p>
          <p className="text-2xl font-bold text-indigo-400">{stats.globalAvgNet}</p>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
        <h3 className="text-gray-200 font-semibold mb-3 text-sm flex justify-between items-center">
             Deneme Ortalamaları
        </h3>
        <div className="overflow-x-auto">
            <div style={{ minWidth: Math.max(stats.examStats.length * 50, 300), height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.examStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                        dataKey="formattedDate" 
                        stroke="#9CA3AF" 
                        tick={{fill: '#9CA3AF', fontSize: 10}}
                        interval={0}
                    />
                    <YAxis 
                        stroke="#9CA3AF" 
                        domain={[0, 10]} 
                        tick={{fill: '#9CA3AF', fontSize: 10}} 
                    />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                    itemStyle={{ color: '#818CF8' }}
                    labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                            return `${payload[0].payload.name} (${label})`;
                        }
                        return label;
                    }}
                    />
                    <Line type="monotone" dataKey="avgNet" stroke="#818CF8" strokeWidth={3} dot={{r: 4, fill: '#818CF8'}} activeDot={{ r: 6 }} name="Ortalama Net" />
                </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* RECENT STUDENTS TABLE */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-gray-200 font-semibold text-sm">Son Durum (Tümü)</h3>
          <button 
             onClick={() => { setIsBatchModalOpen(true); setBatchModalMode('student'); }} 
             className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-900 hover:bg-indigo-900 hover:text-white transition-colors flex items-center gap-1"
          >
             <ClipboardList size={14} /> Hızlı Veri
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-900 text-gray-400">
              <tr>
                <th className="px-2 py-2 cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'name')}>Öğrenci <ArrowUpDown size={10} className="inline ml-1"/></th>
                <th className="px-2 py-2 cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'classroomId')}>Sınıf <ArrowUpDown size={10} className="inline ml-1"/></th>
                <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'targetCorrect')}>Hedef <ArrowUpDown size={10} className="inline ml-1"/></th>
                <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'lastResult.correct')}>D <ArrowUpDown size={10} className="inline ml-1"/></th>
                <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'lastResult.incorrect')}>Y <ArrowUpDown size={10} className="inline ml-1"/></th>
                <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'lastNet')}>Net <ArrowUpDown size={10} className="inline ml-1"/></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {filteredStudents.slice(0, 10).map((student) => {
                 const cls = classes.find(c => c.id === student.classroomId);
                 return (
                  <tr key={student.id} onClick={() => handleNavigation('STUDENT_DETAIL', { studentId: student.id })} className="hover:bg-gray-700/50 cursor-pointer transition-colors">
                    <td className="px-2 py-2 font-medium text-white">{student.name} {student.surname}</td>
                    <td className="px-2 py-2 text-xs">{cls?.name || '-'}</td>
                    <td className="px-2 py-2 text-center text-gray-400">{student.targetCorrect ?? '-'}</td>
                    <td className="px-2 py-2 text-center text-green-400 font-medium">
                        {student.lastResult ? (student.lastResult.status === 'MISSING' ? '-' : student.lastResult.correct) : '-'}
                        {student.lastResult && student.previousResult && <span className="ml-1"><TrendIcon trend={getTrend(student.lastResult.correct, student.previousResult?.correct)} /></span>}
                    </td>
                    <td className="px-2 py-2 text-center text-red-400">
                        {student.lastResult ? (student.lastResult.status === 'MISSING' ? '-' : student.lastResult.incorrect) : '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-indigo-400">
                        {student.lastResult ? (student.lastResult.status === 'MISSING' ? 'G' : student.lastResult.net) : '-'}
                        {student.lastResult && student.previousResult && <span className="ml-1"><TrendIcon trend={getTrend(student.lastResult.net, student.previousResult?.net)} /></span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">Öğrenci bulunamadı.</div>
          )}
        </div>
      </div>

       <div className="flex justify-end gap-2">
            <button 
                onClick={() => { setIsBatchModalOpen(true); setBatchModalMode('result'); }}
                className="bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-green-900/20"
            >
                <FileSpreadsheet size={16} /> Hızlı Sonuç Girişi
            </button>
            <button 
                onClick={() => { setIsBatchModalOpen(true); setBatchModalMode('student'); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-indigo-900/20"
            >
                <Plus size={16} /> Yeni Öğrenci Ekle
            </button>
       </div>

    </div>
  );

  const renderClassDetail = () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return <div>Sınıf bulunamadı</div>;
    
    // Determine which exam stats to show
    const baseStudents = studentsWithStats.filter(s => s.classroomId === selectedClassId);
    
    // RE-CALCULATE stats for this specific view based on classDetailExamFilter
    const displayStudents = baseStudents.map(s => {
        let relevantExam: ExamResult | undefined;
        let displayNet = 0;
        let displayCorrect = 0;
        let displayIncorrect = 0;
        let status = 'ATTENDED';

        if (classDetailExamFilter === 'last') {
            // Already computed in studentsWithStats.lastResult
            relevantExam = s.lastResult || undefined;
            displayNet = s.lastNet;
            displayCorrect = relevantExam?.correct || 0;
            displayIncorrect = relevantExam?.incorrect || 0;
            status = relevantExam?.status || 'ATTENDED';
        } else if (classDetailExamFilter === 'all') {
             displayNet = s.averageNet;
             displayCorrect = s.averageCorrect;
             displayIncorrect = s.averageIncorrect;
             status = 'ATTENDED'; // Average is always attended conceptually
        } else {
            // Find specific exam result
            relevantExam = exams.find(e => e.studentId === s.id && e.examId === classDetailExamFilter);
            displayNet = relevantExam ? relevantExam.net : 0;
            displayCorrect = relevantExam ? relevantExam.correct : 0;
            displayIncorrect = relevantExam ? relevantExam.incorrect : 0;
            status = relevantExam?.status || (relevantExam ? 'ATTENDED' : 'MISSING');
        }

        return {
            ...s,
            displayNet,
            displayCorrect,
            displayIncorrect,
            displayStatus: status,
            // For sorting reuse
            lastNet: displayNet, 
            lastResult: relevantExam 
                ? { ...relevantExam, correct: displayCorrect, incorrect: displayIncorrect, net: displayNet } 
                : (classDetailExamFilter === 'all' ? { correct: displayCorrect, incorrect: displayIncorrect, net: displayNet } as any : null)
        };
    });

    const sortedClassStudents = sortData(displayStudents, sortClassStudents);

    // Calculate Class Averages for the selected view
    const validStudents = sortedClassStudents.filter(s => s.displayStatus !== 'MISSING' && (classDetailExamFilter !== 'all' ? s.lastResult : true));
    const avgNet = validStudents.length > 0 
        ? (validStudents.reduce((sum, s) => sum + s.displayNet, 0) / validStudents.length).toFixed(2)
        : '0.00';

    return (
      <div className="space-y-4 pb-safe">
        <div className="flex items-center justify-between mb-2">
            <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                <ArrowLeft size={16} /> Geri
            </button>
            <h2 className="text-lg font-bold text-white">{cls.name}</h2>
            <div className="w-16"></div> 
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 gap-3">
             <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-xs">Öğrenci</p>
                <p className="text-xl font-bold text-white">{displayStudents.length}</p>
             </div>
             <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-xs">Ort. Net ({classDetailExamFilter === 'last' ? 'Son' : (classDetailExamFilter === 'all' ? 'Genel' : 'Seçili')})</p>
                <p className="text-xl font-bold text-indigo-400">{avgNet}</p>
             </div>
        </div>

        {/* STUDENT LIST */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-3 border-b border-gray-700 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-gray-200 font-semibold text-sm">Öğrenciler</h3>
                    <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-400">Görüntülenen:</span>
                         <select 
                            className="bg-gray-900 text-white text-xs p-1 rounded border border-gray-600 outline-none"
                            value={classDetailExamFilter}
                            onChange={(e) => setClassDetailExamFilter(e.target.value)}
                         >
                            <option value="last">Son Deneme</option>
                            <option value="all">Tüm Sınavlar (Ortalama)</option>
                            {examDefinitions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(def => (
                                <option key={def.id} value={def.id}>{def.name}</option>
                            ))}
                         </select>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-900 text-gray-400">
                        <tr>
                            <th className="px-2 py-2 cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'name')}>Ad Soyad <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'targetCorrect')}>Hdf <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'displayCorrect')}>D <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'displayIncorrect')}>Y <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'displayNet')}>Net <ArrowUpDown size={10} className="inline"/></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 text-sm">
                        {sortedClassStudents.map(student => (
                            <tr key={student.id} onClick={() => handleNavigation('STUDENT_DETAIL', { studentId: student.id })} className="hover:bg-gray-700/50 cursor-pointer transition-colors">
                                <td className="px-2 py-2 font-medium text-white">{student.name} {student.surname}</td>
                                <td className="px-2 py-2 text-center text-gray-400">{student.targetCorrect ?? '-'}</td>
                                <td className="px-2 py-2 text-center text-green-400">
                                    {student.displayStatus === 'MISSING' && classDetailExamFilter !== 'all' ? '-' : student.displayCorrect}
                                </td>
                                <td className="px-2 py-2 text-center text-red-400">
                                    {student.displayStatus === 'MISSING' && classDetailExamFilter !== 'all' ? '-' : student.displayIncorrect}
                                </td>
                                <td className="px-2 py-2 text-center font-bold text-indigo-400">
                                    {student.displayStatus === 'MISSING' && classDetailExamFilter !== 'all' ? <span className="text-gray-500 text-xs">G</span> : student.displayNet}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* EXAM PERFORMANCE TABLE */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
             <div className="p-3 border-b border-gray-700 bg-gray-900">
                <h3 className="text-gray-200 font-semibold text-sm">Sınıf Deneme Karnesi</h3>
             </div>
             <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-900 text-gray-400 sticky top-0">
                        <tr>
                            <th className="px-3 py-2">Deneme</th>
                            <th className="px-3 py-2 text-center">Ort. Net</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 text-sm">
                        {examDefinitions.slice().reverse().map(def => {
                             const classResults = exams.filter(e => e.examId === def.id && students.some(s => s.id === e.studentId && s.classroomId === cls.id) && e.status !== 'MISSING');
                             if (classResults.length === 0) return null;
                             const examAvg = (classResults.reduce((sum, e) => sum + e.net, 0) / classResults.length).toFixed(2);
                             return (
                                 <tr key={def.id}>
                                     <td className="px-3 py-2 text-xs">{def.name}</td>
                                     <td className="px-3 py-2 text-center font-bold text-indigo-400">{examAvg}</td>
                                 </tr>
                             )
                        })}
                    </tbody>
                </table>
             </div>
        </div>
      </div>
    );
  };

  const renderStudentDetail = () => {
    const student = studentsWithStats.find(s => s.id === selectedStudentId);
    if (!student) return <div>Öğrenci bulunamadı</div>;
    const cls = classes.find(c => c.id === student.classroomId);

    // Chart Data
    const studentResults = exams
        .filter(e => e.studentId === student.id && e.status !== 'MISSING')
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(e => ({
            name: e.examName,
            net: e.net,
            correct: e.correct,
            date: formatDate(e.date)
        }));

    // Exam History Table
    const history = exams
        .filter(e => e.studentId === student.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Merge with definitions to show missing exams
    const fullHistory = examDefinitions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(def => {
        const result = history.find(h => h.examId === def.id);
        return {
            def,
            result
        };
    });

    const sortedFullHistory = sortData(fullHistory, sortExamHistory);

    return (
      <div className="space-y-4 pb-safe">
        {/* HEADER */}
        <div className="flex items-center justify-between">
            <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                <ArrowLeft size={16} /> Geri
            </button>
            <div className="flex gap-2">
                <button onClick={() => { setEditingStudent(student); setIsStudentModalOpen(true); }} className="p-2 bg-gray-800 hover:bg-gray-700 text-indigo-400 rounded-lg border border-gray-700">
                    <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteStudent(student.id)} className="p-2 bg-gray-800 hover:bg-red-900/50 text-red-400 rounded-lg border border-gray-700">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-start">
             <div>
                <h2 className="text-xl font-bold text-white mb-1">{student.name} {student.surname}</h2>
                <div className="text-sm text-gray-400 mb-3">{cls?.name || 'Sınıfsız'}</div>
                
                <div className="flex items-center gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 block text-xs">Ort. Net</span>
                        <span className="font-bold text-indigo-400 text-lg">{student.averageNet}</span>
                    </div>
                    <div>
                         <span className="text-gray-500 block text-xs">Son Deneme</span>
                         <span className="font-bold text-white">
                            {student.lastResult ? (student.lastResult.status === 'MISSING' ? 'GİRMEDİ' : `${student.lastResult.correct} D / ${student.lastResult.incorrect} Y`) : '-'}
                         </span>
                    </div>
                </div>
             </div>
             <div className="text-right">
                 <div className="text-xs text-gray-400 mb-1">Hedef: <span className="text-white font-bold">{student.targetCorrect || 6} Doğru</span></div>
                 {student.lastResult && student.lastResult.status !== 'MISSING' && (
                     <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${student.lastResult.correct >= (student.targetCorrect || 6) ? 'bg-green-500' : 'bg-yellow-500'}`} 
                            style={{ width: `${Math.min((student.lastResult.correct / (student.targetCorrect || 6)) * 100, 100)}%` }}
                        ></div>
                     </div>
                 )}
                 {student.lastResult && student.lastResult.status !== 'MISSING' && (
                    <div className="text-xs mt-1 text-gray-500">
                        {student.lastResult.correct} / {student.targetCorrect || 6} Doğru
                    </div>
                 )}
             </div>
        </div>

        {/* CHART */}
        {studentResults.length > 0 && (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-gray-200 font-semibold text-sm">Gelişim Grafiği</h3>
                    <div className="flex bg-gray-900 rounded p-0.5">
                        <button 
                            onClick={() => setStudentChartMetric('net')}
                            className={`text-xs px-2 py-1 rounded ${studentChartMetric === 'net' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Net
                        </button>
                        <button 
                            onClick={() => setStudentChartMetric('correct')}
                            className={`text-xs px-2 py-1 rounded ${studentChartMetric === 'correct' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Doğru
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <div style={{ minWidth: Math.max(studentResults.length * 50, 300), height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={studentResults} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 10}} interval={0} />
                                <YAxis stroke="#9CA3AF" domain={[0, 10]} tick={{fill: '#9CA3AF', fontSize: 10}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                    itemStyle={{ color: '#818CF8' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey={studentChartMetric} 
                                    stroke="#818CF8" 
                                    strokeWidth={3} 
                                    dot={{r: 4, fill: '#818CF8'}}
                                    activeDot={{ r: 6 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* EXAM HISTORY */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
             <div className="p-3 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                <h3 className="text-gray-200 font-semibold text-sm">Deneme Geçmişi</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-900 text-gray-400">
                        <tr>
                            <th className="px-2 py-2 cursor-pointer hover:text-white" onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'def.date')}>Tarih <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-2 py-2">Deneme</th>
                            <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.correct')}>D <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.incorrect')}>Y <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.net')}>Net <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-2 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 text-sm">
                        {sortedFullHistory.map((item, idx) => {
                             const isMissing = !item.result || item.result.status === 'MISSING';
                             return (
                                <tr key={item.def.id} className="hover:bg-gray-700/50">
                                    <td className="px-2 py-2 text-xs text-gray-400">{formatDate(item.def.date)}</td>
                                    <td className="px-2 py-2 text-white">{item.def.name}</td>
                                    <td className="px-2 py-2 text-center text-green-400">{isMissing ? '-' : item.result?.correct}</td>
                                    <td className="px-2 py-2 text-center text-red-400">{isMissing ? '-' : item.result?.incorrect}</td>
                                    <td className="px-2 py-2 text-center font-bold text-indigo-400">
                                        {isMissing ? (item.result ? 'G' : '-') : item.result?.net}
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        {item.result ? (
                                            <button onClick={() => handleOpenExamModal(item.result)} className="text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1 border border-gray-600 rounded">
                                                Dzn
                                            </button>
                                        ) : (
                                            <button onClick={() => handleOpenExamModal(undefined, item.def.id)} className="text-green-400 hover:text-green-300 text-xs px-2 py-1 border border-gray-600 rounded">
                                                Ekle
                                            </button>
                                        )}
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
             </div>
        </div>
      </div>
    );
  };

  const renderExams = () => {
    // Sort logic
    const sortedDefs = sortData(examDefinitions, sortExamList);

    return (
      <div className="space-y-4 pb-safe">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-white">Denemeler</h2>
            <button 
                onClick={handleAddExamDefinition} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
            >
                <Plus size={16} /> Yeni Deneme
            </button>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-900 text-gray-400">
                        <tr>
                            <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort(sortExamList, setSortExamList, 'name')}>Deneme Adı <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort(sortExamList, setSortExamList, 'date')}>Tarih <ArrowUpDown size={10} className="inline"/></th>
                            <th className="px-4 py-3 text-center">Katılım</th>
                            <th className="px-4 py-3 text-center">Ortalama</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 text-sm">
                        {sortedDefs.map(def => {
                            const results = exams.filter(e => e.examId === def.id || e.examName === def.name);
                            const attended = results.filter(e => e.status !== 'MISSING');
                            const avg = attended.length > 0 
                                ? (attended.reduce((sum, e) => sum + e.net, 0) / attended.length).toFixed(2)
                                : '-';
                            
                            return (
                                <tr key={def.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td 
                                        className="px-4 py-3 font-medium text-white cursor-pointer hover:underline"
                                        onClick={() => handleNavigation('EXAM_DETAIL', { examDefId: def.id })}
                                    >
                                        {def.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{formatDate(def.date)}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">{attended.length} / {results.length}</td>
                                    <td className="px-4 py-3 text-center font-bold text-indigo-400">{avg}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {examDefinitions.length === 0 && (
                <div className="p-8 text-center text-gray-500">Henüz deneme tanımlanmamış.</div>
            )}
        </div>
      </div>
    );
  };

  const renderExamDetail = () => {
      const def = examDefinitions.find(d => d.id === selectedExamDefId);
      if (!def) return <div>Deneme bulunamadı</div>;

      let results = exams.filter(e => e.examId === def.id || e.examName === def.name);
      
      // Filter by Class
      if (filterExamDetailClassId !== 'all') {
          results = results.filter(r => {
             const s = students.find(student => student.id === r.studentId);
             return s && s.classroomId === filterExamDetailClassId;
          });
      }

      const attended = results.filter(e => e.status !== 'MISSING');
      const avgCorrect = attended.length > 0 ? (attended.reduce((s, e) => s + e.correct, 0) / attended.length).toFixed(1) : '0';
      const avgIncorrect = attended.length > 0 ? (attended.reduce((s, e) => s + e.incorrect, 0) / attended.length).toFixed(1) : '0';
      const avgEmpty = attended.length > 0 ? (attended.reduce((s, e) => s + e.empty, 0) / attended.length).toFixed(1) : '0';
      const avgNet = attended.length > 0 ? (attended.reduce((s, e) => s + e.net, 0) / attended.length).toFixed(2) : '0';

      // Join with student data for table
      const rows = results.map(r => {
          const s = students.find(stu => stu.id === r.studentId);
          return {
              ...r,
              studentName: s ? `${s.name} ${s.surname}` : 'Bilinmeyen',
              className: s ? classes.find(c => c.id === s.classroomId)?.name || '-' : '-',
              targetCorrect: s?.targetCorrect
          };
      });

      const sortedRows = sortData(rows, sortExamDetail);

      return (
        <div className="space-y-4 pb-safe">
             <div className="flex items-center justify-between mb-2">
                <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                    <ArrowLeft size={16} /> Geri
                </button>
                <h2 className="text-lg font-bold text-white">{def.name} Analizi</h2>
                <div className="flex gap-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleEditExamDefinition(def.id, def.name, def.date); }}
                        className="p-1.5 bg-gray-800 border border-gray-700 text-indigo-400 hover:bg-gray-700 rounded transition-colors"
                    >
                        <Edit size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteExamDefinition(def.id); }}
                        className="p-1.5 bg-gray-800 border border-gray-700 text-red-400 hover:bg-gray-700 rounded transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* DASHBOARD */}
            <div className="grid grid-cols-4 gap-2 text-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                 <div>
                    <div className="text-xs text-green-400">Ort. Doğru</div>
                    <div className="text-lg font-bold text-white">{avgCorrect}</div>
                 </div>
                 <div>
                    <div className="text-xs text-red-400">Ort. Yanlış</div>
                    <div className="text-lg font-bold text-white">{avgIncorrect}</div>
                 </div>
                 <div>
                    <div className="text-xs text-gray-400">Ort. Boş</div>
                    <div className="text-lg font-bold text-white">{avgEmpty}</div>
                 </div>
                 <div>
                    <div className="text-xs text-indigo-400">Ort. Net</div>
                    <div className="text-xl font-bold text-white">{avgNet}</div>
                 </div>
            </div>

            {/* LIST */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                    <h3 className="text-gray-200 font-semibold text-sm">Sıralama Listesi</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Sınıf:</span>
                        <select 
                            className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 outline-none"
                            value={filterExamDetailClassId}
                            onChange={(e) => setFilterExamDetailClassId(e.target.value)}
                        >
                            <option value="all">Tümü</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                        <thead className="text-xs uppercase bg-gray-900 text-gray-400">
                            <tr>
                                <th className="px-2 py-2 cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'studentName')}>Öğrenci <ArrowUpDown size={10} className="inline"/></th>
                                <th className="px-2 py-2 cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'className')}>Sınıf <ArrowUpDown size={10} className="inline"/></th>
                                <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'targetCorrect')}>Hdf <ArrowUpDown size={10} className="inline"/></th>
                                <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'correct')}>D <ArrowUpDown size={10} className="inline"/></th>
                                <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'incorrect')}>Y <ArrowUpDown size={10} className="inline"/></th>
                                <th className="px-2 py-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'net')}>Net <ArrowUpDown size={10} className="inline"/></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-sm">
                            {sortedRows.map(row => (
                                <tr key={row.id} onClick={() => handleNavigation('STUDENT_DETAIL', { studentId: row.studentId })} className="hover:bg-gray-700/50 cursor-pointer">
                                    <td className="px-2 py-2 font-medium text-white">{row.studentName}</td>
                                    <td className="px-2 py-2 text-xs">{row.className}</td>
                                    <td className="px-2 py-2 text-center text-gray-400">{row.targetCorrect ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-green-400">{row.status === 'MISSING' ? '-' : row.correct}</td>
                                    <td className="px-2 py-2 text-center text-red-400">{row.status === 'MISSING' ? '-' : row.incorrect}</td>
                                    <td className="px-2 py-2 text-center font-bold text-indigo-400">{row.status === 'MISSING' ? <span className="text-gray-500 text-xs">G</span> : row.net}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  // --- MAIN RENDER ---

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p>Veriler Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
      return (
        <div className="flex h-[100dvh] items-center justify-center bg-gray-900 text-white p-4">
            <div className="max-w-md bg-gray-800 p-6 rounded-lg border border-red-800 shadow-2xl">
                <div className="flex items-center gap-3 text-red-500 mb-4">
                    <AlertTriangle size={32} />
                    <h2 className="text-xl font-bold">Erişim Hatası</h2>
                </div>
                <p className="text-gray-300 mb-4">{errorMsg}</p>
                <div className="bg-black/30 p-3 rounded text-xs font-mono text-gray-400 mb-4 overflow-x-auto">
                    Firestore Rules ayarlarınızın şu şekilde olduğundan emin olun:
                    <br/><br/>
                    allow read, write: if true;
                </div>
                <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 py-2 rounded text-white hover:bg-indigo-700">
                    Tekrar Dene
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="flex h-[100dvh] bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 flex justify-around p-2 pb-safe z-40">
        <button onClick={() => handleNavigation('DASHBOARD')} className={`flex flex-col items-center p-1 ${view === 'DASHBOARD' ? 'text-indigo-400' : 'text-gray-500'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[10px] mt-0.5">Özet</span>
        </button>
        <button onClick={() => handleNavigation('STUDENTS')} className={`flex flex-col items-center p-1 ${view === 'STUDENTS' || view === 'STUDENT_DETAIL' ? 'text-indigo-400' : 'text-gray-500'}`}>
            <Users size={20} />
            <span className="text-[10px] mt-0.5">Öğrenci</span>
        </button>
        <button onClick={() => handleNavigation('CLASSES')} className={`flex flex-col items-center p-1 ${view === 'CLASSES' || view === 'CLASS_DETAIL' ? 'text-indigo-400' : 'text-gray-500'}`}>
            <Users size={20} className="scale-x-[-1]" />
            <span className="text-[10px] mt-0.5">Sınıf</span>
        </button>
        <button onClick={() => handleNavigation('EXAMS')} className={`flex flex-col items-center p-1 ${view === 'EXAMS' || view === 'EXAM_DETAIL' ? 'text-indigo-400' : 'text-gray-500'}`}>
            <FileText size={20} />
            <span className="text-[10px] mt-0.5">Deneme</span>
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-5 border-b border-gray-700">
           <h1 className="text-xl font-bold text-white flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">E</div>
             EnglishNet
           </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => handleNavigation('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'DASHBOARD' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                <LayoutDashboard size={20} />
                <span>Özet</span>
            </button>
            <button onClick={() => handleNavigation('STUDENTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'STUDENTS' || view === 'STUDENT_DETAIL' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                <Users size={20} />
                <span>Öğrenciler</span>
            </button>
             <button onClick={() => handleNavigation('CLASSES')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'CLASSES' || view === 'CLASS_DETAIL' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                <Users size={20} className="scale-x-[-1]" />
                <span>Sınıflar</span>
            </button>
             <button onClick={() => handleNavigation('EXAMS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'EXAMS' || view === 'EXAM_DETAIL' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                <FileText size={20} />
                <span>Denemeler</span>
            </button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pb-0 md:pb-0">
         {/* HEADER MOBILE */}
         <div className="md:hidden bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center z-30 sticky top-0 pt-safe">
            <h1 className="text-lg font-bold text-white">EnglishNet</h1>
         </div>

         <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
            <div className="max-w-5xl mx-auto w-full">
                {view === 'DASHBOARD' && renderDashboard()}
                
                {view === 'STUDENTS' && (
                  <div className="space-y-4 pb-safe">
                     <div className="flex justify-between items-center gap-2">
                         <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Öğrenci Ara..." 
                                className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                         </div>
                         <button onClick={() => { setEditingStudent(null); setIsStudentModalOpen(true); }} className="bg-indigo-600 text-white p-2 rounded-lg shrink-0">
                            <Plus size={24} />
                         </button>
                     </div>
                     
                     <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-300">
                                <thead className="text-xs uppercase bg-gray-900 text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'name')}>Ad Soyad <ArrowUpDown size={10} className="inline"/></th>
                                        <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'classroomId')}>Sınıf <ArrowUpDown size={10} className="inline"/></th>
                                        <th className="px-4 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'targetCorrect')}>Hedef <ArrowUpDown size={10} className="inline"/></th>
                                        <th className="px-4 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'lastNet')}>Son Net <ArrowUpDown size={10} className="inline"/></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700 text-sm">
                                    {filteredStudents.map(student => (
                                        <tr key={student.id} onClick={() => handleNavigation('STUDENT_DETAIL', { studentId: student.id })} className="hover:bg-gray-700/50 cursor-pointer transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{student.name} {student.surname}</td>
                                            <td className="px-4 py-3">{classes.find(c => c.id === student.classroomId)?.name || '-'}</td>
                                            <td className="px-4 py-3 text-center text-gray-400">{student.targetCorrect ?? '-'}</td>
                                            <td className="px-4 py-3 text-center font-bold text-indigo-400">
                                                {student.lastResult ? (student.lastResult.status === 'MISSING' ? <span className="text-gray-500 text-xs">G</span> : student.lastNet) : '-'}
                                                {student.lastResult && student.previousResult && <span className="ml-2"><TrendIcon trend={getTrend(student.lastNet, student.previousResult?.net)} /></span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                  </div>
                )}

                {view === 'CLASSES' && (
                  <div className="space-y-4 pb-safe">
                     <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-white">Sınıflar</h2>
                        <button onClick={handleAddClass} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                            <Plus size={16} /> Yeni Sınıf
                        </button>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {classes.map(c => {
                             const count = students.filter(s => s.classroomId === c.id).length;
                             return (
                                 <div 
                                    key={c.id} 
                                    className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-indigo-500 cursor-pointer transition-all relative group"
                                    onClick={() => handleNavigation('CLASS_DETAIL', { classId: c.id })}
                                 >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-white">{c.name}</h3>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditClass(c.id, c.name); }}
                                            className="text-gray-500 hover:text-indigo-400 p-1"
                                        >
                                            <Edit size={14} className="pointer-events-none" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-gray-400 text-sm">{count} Öğrenci</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}
                                            className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                        >
                                            <Trash2 size={16} className="pointer-events-none" />
                                        </button>
                                    </div>
                                 </div>
                             )
                        })}
                     </div>
                  </div>
                )}

                {view === 'CLASS_DETAIL' && renderClassDetail()}
                {view === 'STUDENT_DETAIL' && renderStudentDetail()}
                {view === 'EXAMS' && renderExams()}
                {view === 'EXAM_DETAIL' && renderExamDetail()}

            </div>
         </div>
      </div>

      {/* MODALS */}
      <ExamModal 
        isOpen={isExamModalOpen} 
        onClose={() => { setIsExamModalOpen(false); setEditingExamResult(null); setPreselectedExamDefId(null); }}
        onSave={handleSaveExam}
        studentId={selectedStudentId || ''}
        examDefinitions={examDefinitions}
        initialData={editingExamResult}
        preselectedExamDefId={preselectedExamDefId}
        existingExamIds={editingExamResult ? [] : exams.filter(e => e.studentId === selectedStudentId).map(e => e.examId || '')}
      />

      <StudentFormModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        classes={classes}
        editingStudent={editingStudent}
      />
      
      <InputModal 
        {...inputModalConfig} 
        onClose={() => setInputModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
      
      <ConfirmModal 
        {...confirmModalConfig} 
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      <BatchImportModal
        isOpen={isBatchModalOpen}
        mode={batchModalMode}
        onClose={() => setIsBatchModalOpen(false)}
        onProcess={batchModalMode === 'student' ? handleBatchStudentImport : handleBatchResultImport}
      />
      
    </div>
  );
}

export default App;