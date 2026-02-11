
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
  FileSpreadsheet,
  ListChecks,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Hash,
  CheckSquare,
  Square,
  Repeat,
  Filter
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

import { Classroom, ExamResult, Student, StudentWithStats, ViewState, ExamDefinition } from './types';
import { 
  fetchAllData, 
  apiAddStudent, apiUpdateStudent, apiDeleteStudent,
  apiAddClass, apiUpdateClass, apiDeleteClass,
  apiAddExamResult, apiUpdateExamResult, apiDeleteExamResult,
  apiAddExamDefinition, apiUpdateExamDefinition, apiDeleteExamDefinition,
  apiDeleteMultipleStudents
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

// --- HELPER COMPONENTS ---

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
  mode: 'student' | 'result' | 'class_change';
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

  const getTitle = () => {
    switch (mode) {
      case 'student': return 'Hızlı Öğrenci Girişi';
      case 'result': return 'Hızlı Sonuç Girişi';
      case 'class_change': return 'Toplu Sınıf Değişimi';
      default: return '';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'student': return <ClipboardList className="text-indigo-400" />;
      case 'result': return <FileSpreadsheet className="text-green-400" />;
      case 'class_change': return <Repeat className="text-orange-400" />;
      default: return null;
    }
  };

  const getFormat = () => {
    switch (mode) {
      case 'student': return 'Ad Soyad Sınıf';
      case 'result': return 'SınavAdı ÖğrenciAdıSoyadı Doğru Yanlış';
      case 'class_change': return 'Ad Soyad YeniSınıf';
      default: return '';
    }
  };

  const getPlaceholder = () => {
    switch (mode) {
      case 'student': return "Ahmet Yılmaz 8/A...";
      case 'result': return "Deneme 1 Ahmet Yılmaz 8 2...";
      case 'class_change': return "Esma Ozan 8/04...";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 flex flex-col h-[80vh]">
         <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
            <div className="flex items-center gap-2">
                {getIcon()}
                <h3 className="text-lg font-bold text-white">{getTitle()}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
         </div>
         <div className="p-4 flex-1 flex flex-col gap-3 bg-gray-800 overflow-y-auto">
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700 text-sm text-gray-300 space-y-2">
                <p>Excel'den veya başka bir listeden verileri kopyalayıp aşağıdaki alana yapıştırın.</p>
                
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-400 text-xs uppercase">Format:</span>
                    <div className="font-mono bg-black/30 p-2 rounded text-indigo-300 text-xs">
                        {getFormat()}
                    </div>
                </div>

                {mode === 'result' && (
                    <p className="text-xs text-red-400 font-semibold">
                        * Önemli: Sınavın mutlaka "Denemeler" sekmesinde önceden tanımlı olması gerekir. Tanımlı olmayan sınav sonuçları kaydedilmez.
                    </p>
                )}

                {mode === 'class_change' && (
                    <p className="text-xs text-orange-400 font-semibold">
                        * Sadece ismi listede olan mevcut öğrencilerin sınıfları güncellenir. İsim/Soyad eşleşmezse işlem yapılmaz.
                    </p>
                )}
                
                {mode === 'student' && (
                    <p className="text-xs text-blue-400 font-semibold">
                        * Not: Öğrenci sistemde zaten kayıtlıysa, sadece sınıf bilgisi güncellenir (tekrar kayıt oluşturulmaz).
                    </p>
                )}
            </div>
            <textarea 
              className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder={getPlaceholder()}
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
function sortData<T>(data: T[], config: { key: string, direction: 'asc' | 'desc' }): T[] {
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
  
  // Batch Selection for Students
  const [selectedBatchStudentIds, setSelectedBatchStudentIds] = useState<Set<string>>(new Set());

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
  const [batchModalMode, setBatchModalMode] = useState<'student' | 'result' | 'class_change'>('student');

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
  const [filterExamId, setFilterExamId] = useState<string>('all'); 
  const [classDetailExamFilter, setClassDetailExamFilter] = useState<string>('last'); 
  const [filterExamDetailClassId, setFilterExamDetailClassId] = useState<string>('all'); 
  const [showBelowAverageOnly, setShowBelowAverageOnly] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting States
  const [sortStudents, setSortStudents] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [sortExamHistory, setSortExamHistory] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'def.date', direction: 'desc' });
  const [sortClassStudents, setSortClassStudents] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [sortExamList, setSortExamList] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [sortExamDetail, setSortExamDetail] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'net', direction: 'desc' });
  const [sortResults, setSortResults] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const [studentChartMetric, setStudentChartMetric] = useState<'net' | 'correct'>('net');

  // --- NAVIGATION ---

  const handleNavigation = useCallback((newView: ViewState, params?: { studentId?: string, classId?: string, examDefId?: string }) => {
    if (params?.studentId) setSelectedStudentId(params.studentId);
    if (params?.classId) setSelectedClassId(params.classId);
    if (params?.examDefId) setSelectedExamDefId(params.examDefId);

    // Reset view specific states
    setSelectedBatchStudentIds(new Set());
    setShowBelowAverageOnly(false);

    window.history.pushState({ 
        view: newView, 
        selectedStudentId: params?.studentId || selectedStudentId,
        selectedClassId: params?.classId || selectedClassId,
        selectedExamDefId: params?.examDefId || selectedExamDefId
    }, '');

    setView(newView);
  }, [selectedStudentId, selectedClassId, selectedExamDefId]);

  useEffect(() => {
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

  const handleBack = () => window.history.back();

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
        setErrorMsg("Veriler yüklenirken bir hata oluştu.");
      } finally {
         setIsLoading(false);
      }
    };
    initData();
  }, []);

  // --- DERIVED DATA ---
  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    return students.map(student => {
      const studentExams = exams.filter(e => e.studentId === student.id);
      // GİRMEDİ olanları hesaplamadan ÇIKAR
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
      const validExams = sortedExams.filter(e => e.status !== 'MISSING');
      const previousResult = validExams.length > 1 ? validExams[1] : undefined;

      return {
        ...student,
        examCount, // Katıldığı gerçek sınav sayısı
        averageNet,
        averageCorrect,
        averageIncorrect,
        lastNet,
        lastResult, 
        previousResult
      };
    });
  }, [students, exams, filterExamId]);

  const filteredStudents = useMemo(() => {
    let result = studentsWithStats;
    if (filterClassId !== 'all') result = result.filter(s => s.classroomId === filterClassId);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.surname.toLowerCase().includes(q));
    }
    return sortData(result, sortStudents);
  }, [studentsWithStats, filterClassId, searchQuery, sortStudents]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    // GİRMEDİ (MISSING) olan sonuçları istatistikten ÇIKAR
    const effectiveExams = exams.filter(e => e.status !== 'MISSING');
    const totalExams = effectiveExams.length;
    const totalExamDefinitions = examDefinitions.length;
    const globalTotalNet = effectiveExams.reduce((sum, e) => sum + e.net, 0);
    const globalTotalCorrect = effectiveExams.reduce((sum, e) => sum + e.correct, 0);
    const globalTotalIncorrect = effectiveExams.reduce((sum, e) => sum + e.incorrect, 0);
    
    const globalAvgNet = totalExams > 0 ? (globalTotalNet / totalExams).toFixed(2) : '0.00';
    const globalAvgCorrect = totalExams > 0 ? (globalTotalCorrect / totalExams).toFixed(1) : '0.0';
    const globalAvgIncorrect = totalExams > 0 ? (globalTotalIncorrect / totalExams).toFixed(1) : '0.0';

    const examStats = examDefinitions.map(def => {
        const results = effectiveExams.filter(e => e.examId === def.id || e.examName === def.name);
        let avgNet = 0;
        let avgCorrect = 0;
        let avgIncorrect = 0;
        if (results.length > 0) {
            avgNet = results.reduce((s, e) => s + e.net, 0) / results.length;
            avgCorrect = results.reduce((s, e) => s + e.correct, 0) / results.length;
            avgIncorrect = results.reduce((s, e) => s + e.incorrect, 0) / results.length;
        }
        return {
            name: def.name,
            avgNet: parseFloat(avgNet.toFixed(2)),
            avgCorrect: parseFloat(avgCorrect.toFixed(1)),
            avgIncorrect: parseFloat(avgIncorrect.toFixed(1)),
            date: def.date,
            formattedDate: formatDate(def.date)
        };
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { 
        totalStudents, 
        totalExams, 
        totalExamDefinitions, 
        globalAvgNet, 
        globalAvgCorrect, 
        globalAvgIncorrect, 
        examStats 
    };
  }, [students, exams, examDefinitions]);

  // --- HANDLERS ---
  const handleSort = (config: { key: string, direction: 'asc' | 'desc' }, setConfig: React.Dispatch<React.SetStateAction<any>>, key: string) => {
    setConfig({
        key,
        direction: config.key === key && config.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedBatchStudentIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
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
                await apiUpdateClass(updated); // Servis kullanıldı
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
    if ('id' in studentData) {
        await apiUpdateStudent(studentData as Student);
        setStudents(prev => prev.map(s => s.id === studentData.id ? studentData as Student : s));
    } else {
        const newStudent = { ...studentData, id: Date.now().toString() };
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
            setStudents(prev => prev.filter(s => s.id !== id));
            setExams(prev => prev.filter(e => e.studentId !== id));
            handleNavigation('STUDENTS');
            await apiDeleteStudent(id);
            const studentExams = exams.filter(e => e.studentId === id);
            for(const ex of studentExams) await apiDeleteExamResult(ex.id);
        }
    });
  };

  const handleDeleteMultipleStudents = () => {
    const count = selectedBatchStudentIds.size;
    if (count === 0) return;

    setConfirmModalConfig({
        isOpen: true,
        title: 'Toplu Silme',
        message: `${count} öğrenciyi ve tüm sonuçlarını silmek istediğinize emin misiniz?`,
        onConfirm: async () => {
            const idsToDelete: string[] = Array.from(selectedBatchStudentIds);
            
            setIsLoading(true);
            try {
                const studentExamsToDelete = exams.filter(e => idsToDelete.includes(e.studentId));
                for(const ex of studentExamsToDelete) await apiDeleteExamResult(ex.id);
                await apiDeleteMultipleStudents(idsToDelete);
                setStudents(prev => prev.filter(s => !idsToDelete.includes(s.id)));
                setExams(prev => prev.filter(e => !idsToDelete.includes(e.studentId)));
                setSelectedBatchStudentIds(new Set());
            } catch (err) {
                alert("Toplu silme sırasında hata oluştu.");
            } finally {
                setIsLoading(false);
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
    const examName = examDefinitions.find(ed => ed.id === id)?.name;
    setConfirmModalConfig({
        isOpen: true,
        title: 'Denemeyi Sil',
        message: 'DİKKAT: Bu denemeyi sildiğinizde bu denemeye ait TÜM öğrenci sonuçları da kalıcı olarak silinecektir. Devam etmek istiyor musunuz?',
        onConfirm: async () => {
            const relatedExams = exams.filter(e => e.examId === id || e.examName === examName);
            for (const r of relatedExams) {
                await apiDeleteExamResult(r.id);
            }
            await apiDeleteExamDefinition(id);
            setExamDefinitions(prev => prev.filter(e => e.id !== id));
            setExams(prev => prev.filter(e => e.examId !== id && e.examName !== examName));
            if (view === 'EXAM_DETAIL') handleNavigation('EXAMS');
        }
    });
  };

  const handleBatchStudentImport = async (text: string) => {
    setIsLoading(true);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const newStudentsPayload: any[] = [];
    const classNamesFound = new Set<string>();

    const norm = (str: string) => str.trim().toLocaleLowerCase('tr').replace(/\s+/g, ' ');

    lines.forEach(line => {
        let parts = line.split('\t').map(p => p.trim()).filter(p => p);
        if (parts.length < 2) parts = line.trim().split(/\s+/);
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
        alert("Geçerli veri bulunamadı.");
        setIsLoading(false);
        return;
    }

    try {
        const tempClasses = [...classes];
        for (const cName of Array.from(classNamesFound)) {
            let cls = tempClasses.find(c => norm(c.name) === norm(cName));
            if (!cls) {
                cls = { id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(), name: cName };
                await apiAddClass(cls);
                tempClasses.push(cls);
            }
        }
        setClasses(tempClasses);

        const tempStudents = [...students];
        let addedCount = 0; let updatedCount = 0;

        for (const s of newStudentsPayload) {
            const cls = tempClasses.find(c => norm(c.name) === norm(s.className));
            if (cls) {
                const existingStudentIndex = tempStudents.findIndex(st => norm(st.name) === norm(s.name) && norm(st.surname) === norm(s.surname));
                
                if (existingStudentIndex !== -1) {
                    const existingStudent = tempStudents[existingStudentIndex];
                    if (existingStudent.classroomId !== cls.id) {
                        const updatedStudent = { ...existingStudent, classroomId: cls.id };
                        await apiUpdateStudent(updatedStudent);
                        tempStudents[existingStudentIndex] = updatedStudent;
                        updatedCount++;
                    }
                } else {
                    const newStudent = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), name: s.name, surname: s.surname, classroomId: cls.id };
                    await apiAddStudent(newStudent);
                    tempStudents.push(newStudent);
                    addedCount++;
                }
            }
        }
        setStudents(tempStudents);
        setIsBatchModalOpen(false);
        alert(`Bitti! ${addedCount} yeni eklendi, ${updatedCount} öğrencinin sınıfı güncellendi.`);
    } catch (e) {
        alert("Hata oluştu.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleBatchResultImport = async (text: string) => {
    setIsLoading(true);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const norm = (str: string) => str.trim().toLocaleLowerCase('tr').replace(/\s+/g, ' ');

    let addedCount = 0; let updatedCount = 0; let skippedCount = 0; let missingCount = 0;
    const skippedExams = new Set<string>();

    try {
        const tempStudents = [...students];
        const tempResults = [...exams];
        const processedExamStudentIds = new Map<string, Set<string>>();
        const involvedClassIdsByExam = new Map<string, Set<string>>();

        for (const line of lines) {
            let parts = line.split('\t').map(p => p.trim()).filter(p => p !== "");
            if (parts.length < 3) {
                 const spaceParts = line.trim().split(/\s+/);
                 if (spaceParts.length >= 4) {
                     const incStr = spaceParts.pop(); const corrStr = spaceParts.pop(); const rest = spaceParts.join(' ');
                     parts = [rest, corrStr!, incStr!];
                 }
            }

            if (parts.length >= 3) {
                const incorrectStr = parts.pop()!;
                const correctStr = parts.pop()!;
                const correct = parseInt(correctStr);
                const incorrect = parseInt(incorrectStr);

                if (isNaN(correct) || isNaN(incorrect) || (correct + incorrect > 10)) {
                    skippedCount++; continue;
                }
                
                let examNameStr = ""; let studentNameStr = "";

                if (parts.length >= 2) {
                    studentNameStr = parts.pop()!; examNameStr = parts.join(' ');
                } else {
                    const mixedStr = parts[0];
                    const matchedExam = examDefinitions.sort((a,b) => b.name.length - a.name.length).find(e => norm(mixedStr).startsWith(norm(e.name)));
                    if (matchedExam) {
                        examNameStr = matchedExam.name;
                        studentNameStr = mixedStr.substring(examNameStr.length).trim();
                    } else {
                        skippedCount++; continue;
                    }
                }

                const examDef = examDefinitions.find(e => norm(e.name) === norm(examNameStr));
                if (!examDef) {
                    skippedExams.add(examNameStr);
                    skippedCount++; continue;
                }

                const student = tempStudents.find(s => norm(`${s.name} ${s.surname}`) === norm(studentNameStr) || norm(`${s.surname} ${s.name}`) === norm(studentNameStr));
                if (!student) {
                    skippedCount++; continue;
                }

                if (!processedExamStudentIds.has(examDef.id)) {
                    processedExamStudentIds.set(examDef.id, new Set());
                    involvedClassIdsByExam.set(examDef.id, new Set());
                }
                processedExamStudentIds.get(examDef.id)!.add(student.id);
                involvedClassIdsByExam.get(examDef.id)!.add(student.classroomId);

                const empty = 10 - (correct + incorrect);
                const net = parseFloat((correct - (incorrect * 0.33)).toFixed(2));
                const existingResult = tempResults.find(r => r.studentId === student.id && r.examId === examDef!.id);
                 
                const resultData = {
                    studentId: student.id, examId: examDef!.id, examName: examDef!.name, date: examDef!.date,
                    correct, incorrect, empty, net, status: 'ATTENDED' as const
                };

                if (existingResult) {
                    const updated = { ...resultData, id: existingResult.id };
                    await apiUpdateExamResult(updated);
                    const idx = tempResults.findIndex(r => r.id === existingResult.id);
                    tempResults[idx] = updated;
                    updatedCount++;
                } else {
                    const newResult = { ...resultData, id: Date.now().toString() + Math.random().toString() };
                    await apiAddExamResult(newResult);
                    tempResults.push(newResult);
                    addedCount++;
                }
            } else skippedCount++;
        }

        for (const [examId, classIds] of involvedClassIdsByExam.entries()) {
             const processedStudentIds = processedExamStudentIds.get(examId)!;
             const examDef = examDefinitions.find(e => e.id === examId);
             if (!examDef) continue;
             const studentsInvolved = tempStudents.filter(s => classIds.has(s.classroomId));
             for (const student of studentsInvolved) {
                 if (!processedStudentIds.has(student.id)) {
                     const existingResult = tempResults.find(r => r.studentId === student.id && r.examId === examId);
                     if (!existingResult) {
                         const missingResult = {
                            id: Date.now() + Math.random().toString(), studentId: student.id, examId: examId, examName: examDef.name, date: examDef.date,
                            correct: 0, incorrect: 0, empty: 0, net: 0, status: 'MISSING' as const
                         };
                         await apiAddExamResult(missingResult);
                         tempResults.push(missingResult);
                         missingCount++;
                     }
                 }
             }
        }

        setExams(tempResults);
        setIsBatchModalOpen(false);
        let msg = `${addedCount} yeni, ${updatedCount} güncellendi, ${missingCount} girmedi.`;
        if (skippedExams.size > 0) msg += `\n\nTanımsız sınavlar (atlandı): ${Array.from(skippedExams).join(', ')}`;
        alert(msg);
    } catch (e) {
        alert("Hata.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleBatchClassChange = async (text: string) => {
    setIsLoading(true);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const norm = (str: string) => str.trim().toLocaleLowerCase('tr').replace(/\s+/g, ' ');

    let updatedCount = 0;
    let notFoundCount = 0;

    try {
        const tempStudents = [...students];
        const tempClasses = [...classes];

        for (const line of lines) {
            let parts = line.split('\t').map(p => p.trim()).filter(p => p);
            if (parts.length < 2) parts = line.trim().split(/\s+/);
            
            if (parts.length >= 2) {
                const className = parts.pop()!;
                const studentNameStr = parts.join(' ');

                let cls = tempClasses.find(c => norm(c.name) === norm(className));
                if (!cls) {
                    cls = { id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(), name: className };
                    await apiAddClass(cls);
                    tempClasses.push(cls);
                }

                const studentIndex = tempStudents.findIndex(s => 
                    norm(`${s.name} ${s.surname}`) === norm(studentNameStr) || 
                    norm(`${s.surname} ${s.name}`) === norm(studentNameStr)
                );

                if (studentIndex !== -1) {
                    const student = tempStudents[studentIndex];
                    if (student.classroomId !== cls.id) {
                        const updatedStudent = { ...student, classroomId: cls.id };
                        await apiUpdateStudent(updatedStudent);
                        tempStudents[studentIndex] = updatedStudent;
                        updatedCount++;
                    }
                } else {
                    notFoundCount++;
                }
            }
        }

        setStudents(tempStudents);
        setClasses(tempClasses);
        setIsBatchModalOpen(false);
        alert(`Bitti! ${updatedCount} öğrencinin sınıfı güncellendi.${notFoundCount > 0 ? `\n${notFoundCount} öğrenci bulunamadı.` : ''}`);
    } catch (e) {
        alert("Sınıf değişimi sırasında hata oluştu.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- RENDER VIEWS ---

  const renderDashboard = () => (
    <div className="space-y-4 pb-safe animate-in fade-in duration-500">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700 shadow-sm">
          <p className="text-gray-400 text-[10px] md:text-xs uppercase font-bold tracking-tight">Öğrenci</p>
          <p className="text-xl md:text-3xl font-black text-white">{stats.totalStudents}</p>
        </div>
        <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700 shadow-sm">
          <p className="text-gray-400 text-[10px] md:text-xs uppercase font-bold tracking-tight">Deneme</p>
          <p className="text-xl md:text-3xl font-black text-white">{stats.totalExamDefinitions}</p>
        </div>
        <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700 shadow-sm">
          <p className="text-gray-400 text-[10px] md:text-xs uppercase font-bold tracking-tight">Ort. Net</p>
          <p className="text-xl md:text-3xl font-black text-indigo-400">{stats.globalAvgNet}</p>
        </div>
      </div>

      <div className="bg-gray-800 p-4 md:p-5 rounded-3xl border border-gray-700 shadow-lg">
            <h3 className="text-gray-100 font-black text-sm mb-6 flex items-center justify-between">
                Genel Başarı Grafiği
                <div className="flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 rounded-full border border-gray-700">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Net Ortalaması</span>
                </div>
            </h3>
            <div className="h-[250px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.examStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="dashboardNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF" 
                            tick={{fill: '#9CA3AF', fontSize: 9}} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10} 
                            interval={0}
                            angle={stats.examStats.length > 5 ? -15 : 0}
                        />
                        <YAxis stroke="#9CA3AF" domain={[0, 10]} tick={{fill: '#9CA3AF', fontSize: 10}} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '16px', border: '1px solid #374151', color: '#F3F4F6' }} 
                            itemStyle={{ color: '#818CF8', fontWeight: 'black' }} 
                        />
                        <Area type="monotone" dataKey="avgNet" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#dashboardNet)" activeDot={{ r: 6, stroke: '#111827', strokeWidth: 2 }} name="Net" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-2">
            <button onClick={() => { setIsBatchModalOpen(true); setBatchModalMode('class_change'); }} className="bg-orange-700/20 text-orange-400 border border-orange-700/50 p-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95">
                <Repeat size={18} /> SINIF DEĞİŞİMİ
            </button>
            <button onClick={() => { setIsBatchModalOpen(true); setBatchModalMode('result'); }} className="bg-green-700/20 text-green-400 border border-green-700/50 p-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95">
                <FileSpreadsheet size={18} /> HIZLI SONUÇ GİRİŞİ
            </button>
            <button onClick={() => { setIsBatchModalOpen(true); setBatchModalMode('student'); }} className="bg-indigo-600 text-white p-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95">
                <Plus size={18} /> YENİ ÖĞRENCİ
            </button>
       </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 pb-safe animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2"><BarChart3 className="text-indigo-400" /> BAŞARI ANALİZİ</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 text-indigo-400 mb-1"><Hash size={16} /><span className="text-[10px] uppercase font-bold tracking-widest">Ortalama Net</span></div>
                <div className="text-4xl font-black text-white">{stats.globalAvgNet}</div>
             </div>
             <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 text-green-400 mb-1"><CheckCircle2 size={16} /><span className="text-[10px] uppercase font-bold tracking-widest">Ortalama Doğru</span></div>
                <div className="text-4xl font-black text-white">{stats.globalAvgCorrect}</div>
             </div>
             <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 text-red-400 mb-1"><XCircle size={16} /><span className="text-[10px] uppercase font-bold tracking-widest">Ortalama Yanlış</span></div>
                <div className="text-4xl font-black text-white">{stats.globalAvgIncorrect}</div>
             </div>
        </div>

        <div className="bg-gray-800 p-5 rounded-3xl border border-gray-700 shadow-lg">
            <h3 className="text-gray-100 font-bold mb-6 flex items-center justify-between">
                Deneme Bazlı Gelişim
                <span className="text-[10px] font-bold text-gray-500 bg-gray-900 px-3 py-1 rounded-full">TÜM SINIFLAR</span>
            </h3>
            <div className="h-[300px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.examStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF" 
                            tick={{fill: '#9CA3AF', fontSize: 10}} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10} 
                            interval={0}
                            angle={stats.examStats.length > 5 ? -15 : 0}
                        />
                        <YAxis stroke="#9CA3AF" domain={[0, 10]} tick={{fill: '#9CA3AF', fontSize: 11}} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', border: '1px solid #374151', color: '#F3F4F6' }} 
                            itemStyle={{ color: '#818CF8', fontWeight: 'bold' }} 
                        />
                        <Area type="monotone" dataKey="avgNet" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorNet)" activeDot={{ r: 8, stroke: '#111827', strokeWidth: 2 }} name="Ortalama Net" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );

  const renderResults = () => {
    let resultRows = exams.map(e => {
        const student = students.find(s => s.id === e.studentId);
        const cls = classes.find(c => c.id === student?.classroomId);
        return {
            ...e,
            studentName: student ? `${student.name} ${student.surname}` : 'Bilinmeyen',
            className: cls?.name || '-'
        };
    });

    if (filterClassId !== 'all') resultRows = resultRows.filter(r => {
        const s = students.find(stu => stu.id === r.studentId);
        return s && s.classroomId === filterClassId;
    });
    
    if (filterExamId !== 'all') resultRows = resultRows.filter(r => r.examId === filterExamId);

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        resultRows = resultRows.filter(r => r.studentName.toLowerCase().includes(q) || r.examName.toLowerCase().includes(q));
    }

    const sortedResultsList = sortData<any>(resultRows, sortResults);

    return (
        <div className="space-y-4 pb-safe animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">SONUÇLAR</h2>
                <button onClick={() => { setIsBatchModalOpen(true); setBatchModalMode('result'); }} className="bg-green-600/10 text-green-400 border border-green-600/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                    <FileSpreadsheet size={16} /> TOPLU GİRİŞ
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <select className="bg-gray-800 text-white text-xs p-3 rounded-2xl border border-gray-700 outline-none appearance-none shadow-sm" value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}><option value="all">TÜM SINIFLAR</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select className="bg-gray-800 text-white text-xs p-3 rounded-2xl border border-gray-700 outline-none appearance-none shadow-sm" value={filterExamId} onChange={(e) => setFilterExamId(e.target.value)}><option value="all">TÜM DENEMELER</option>{examDefinitions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            </div>

            <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left text-gray-300">
                        <thead className="text-[10px] uppercase bg-gray-900 text-gray-500 font-black">
                            <tr>
                                <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort(sortResults, setSortResults, 'date')}>TARİH <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort(sortResults, setSortResults, 'studentName')}>ÖĞRENCİ <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                <th className="px-2 py-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortResults, setSortResults, 'correct')}>D <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                <th className="px-2 py-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortResults, setSortResults, 'incorrect')}>Y <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                <th className="px-4 py-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortResults, setSortResults, 'net')}>NET <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                <th className="px-4 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50 text-sm">
                            {sortedResultsList.map(row => (
                                <tr key={row.id} className="hover:bg-gray-700/30 active:bg-gray-700/50">
                                    <td className="px-4 py-4 text-[10px] text-gray-500">{formatDate(row.date)}</td>
                                    <td className="px-4 py-4 font-bold text-white">
                                        <div className="flex flex-col">
                                            <span>{row.studentName}</span>
                                            <span className="text-[9px] text-indigo-400/70 font-medium uppercase">{row.examName}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 text-center text-green-400 font-bold">{row.status === 'MISSING' ? 'G' : row.correct}</td>
                                    <td className="px-2 py-4 text-center text-red-400 font-bold">{row.status === 'MISSING' ? 'G' : row.incorrect}</td>
                                    <td className="px-4 py-4 text-center font-black text-indigo-400 text-base">{row.status === 'MISSING' ? 'G' : row.net}</td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => handleOpenExamModal(row)} className="text-gray-500 p-2 hover:text-indigo-400"><Edit size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  const renderClassDetail = () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return <div>Sınıf bulunamadı</div>;
    const baseStudents = studentsWithStats.filter(s => s.classroomId === selectedClassId);
    const displayStudents = baseStudents.map(s => {
        let relevantExam: ExamResult | undefined;
        let displayNet = 0; let displayCorrect = 0; let displayIncorrect = 0; let status = 'ATTENDED';
        if (classDetailExamFilter === 'last') {
            relevantExam = s.lastResult || undefined;
            displayNet = s.lastNet; displayCorrect = relevantExam?.correct || 0; displayIncorrect = relevantExam?.incorrect || 0; status = relevantExam?.status || 'ATTENDED';
        } else if (classDetailExamFilter === 'all') {
             // Eğer öğrenci hiç sınava girmemişse genel ortalamada 'MISSING' (G) görünüp ortalamayı bozmamalı
             displayNet = s.averageNet; displayCorrect = s.averageCorrect; displayIncorrect = s.averageIncorrect; 
             status = s.examCount > 0 ? 'ATTENDED' : 'MISSING';
        } else {
            relevantExam = exams.find(e => e.studentId === s.id && e.examId === classDetailExamFilter);
            displayNet = relevantExam ? relevantExam.net : 0; displayCorrect = relevantExam ? relevantExam.correct : 0; displayIncorrect = relevantExam ? relevantExam.incorrect : 0; status = relevantExam?.status || 'MISSING';
        }
        return { ...s, displayNet, displayCorrect, displayIncorrect, displayStatus: status };
    });
    
    const sortedClassStudents = sortData<any>(displayStudents, sortClassStudents);
    // ORTALAMA HESABINDA GİRMEYENLERİ KESİNLİKLE ÇIKAR
    const validStudents = displayStudents.filter(s => s.displayStatus !== 'MISSING');
    const avgNet = validStudents.length > 0 ? (validStudents.reduce((sum, s) => sum + s.displayNet, 0) / validStudents.length).toFixed(2) : '0.00';
    const avgCorrect = validStudents.length > 0 ? (validStudents.reduce((sum, s) => sum + s.displayCorrect, 0) / validStudents.length).toFixed(1) : '0.0';
    const avgIncorrect = validStudents.length > 0 ? (validStudents.reduce((sum, s) => sum + s.displayIncorrect, 0) / validStudents.length).toFixed(1) : '0.0';

    return (
      <div className="space-y-4 pb-safe animate-in fade-in duration-300">
        <div className="flex items-center justify-between px-1">
            <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold"><ArrowLeft size={18} /> GERİ</button>
            <h2 className="text-xl font-black text-white">{cls.name} ANALİZİ</h2>
            <div className="w-10"></div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
             <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center"><p className="text-indigo-400 text-[10px] font-black uppercase mb-1">NET</p><p className="text-xl font-black text-white">{avgNet}</p></div>
             <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center"><p className="text-green-400 text-[10px] font-black uppercase mb-1">D</p><p className="text-xl font-black text-white">{avgCorrect}</p></div>
             <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center"><p className="text-red-400 text-[10px] font-black uppercase mb-1">Y</p><p className="text-xl font-black text-white">{avgIncorrect}</p></div>
        </div>

        <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row justify-between gap-4 bg-gray-900/30">
                <h3 className="text-gray-200 font-black text-sm uppercase">Öğrenci Listesi</h3>
                <div className="flex gap-2 items-center">
                    <select className="flex-1 bg-gray-900 text-white text-xs p-2.5 rounded-xl border border-gray-700 outline-none" value={classDetailExamFilter} onChange={(e) => setClassDetailExamFilter(e.target.value)}>
                        <option value="last">SON DENEME</option>
                        <option value="all">GENEL ORTALAMA</option>
                        {examDefinitions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(def => (<option key={def.id} value={def.id}>{def.name}</option>))}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left text-gray-300">
                    <thead className="text-[10px] uppercase bg-gray-900 text-gray-500 font-black">
                        <tr>
                            <th className="px-5 py-3 cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'name')}>ÖĞRENCİ <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-2 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'displayCorrect')}>D <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-2 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'displayIncorrect')}>Y <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-5 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'displayNet')}>NET <ArrowUpDown size={10} className="inline opacity-30"/></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50 text-sm">
                        {sortedClassStudents.map(student => (
                            <tr key={student.id} className="hover:bg-gray-700/30 active:bg-gray-700/50 cursor-pointer" onClick={() => handleNavigation('STUDENT_DETAIL', { studentId: student.id })}>
                                <td className="px-5 py-5 font-bold text-white uppercase tracking-tight">{student.name} {student.surname}</td>
                                <td className="px-2 py-5 text-center text-green-400 font-bold">{student.displayStatus === 'MISSING' ? 'G' : student.displayCorrect}</td>
                                <td className="px-2 py-5 text-center text-red-400 font-bold">{student.displayStatus === 'MISSING' ? 'G' : student.displayIncorrect}</td>
                                <td className="px-5 py-5 text-center font-black text-indigo-400 text-lg">{student.displayStatus === 'MISSING' ? 'G' : student.displayNet}</td>
                            </tr>
                        ))}
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
    const studentResults = exams.filter(e => e.studentId === student.id && e.status !== 'MISSING').sort((a,b) => new Date(a.date).getTime() - new Date(a.date).getTime()).map(e => ({ name: e.examName, net: e.net, correct: e.correct, date: formatDate(e.date) }));
    const history = exams.filter(e => e.studentId === student.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const fullHistory = examDefinitions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(def => ({ def, result: history.find(h => h.examId === def.id) }));
    const sortedFullHistory = sortData<any>(fullHistory, sortExamHistory);

    return (
      <div className="space-y-4 pb-safe animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-1">
            <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold"><ArrowLeft size={18} /> GERİ</button>
            <div className="flex gap-2">
                <button onClick={() => { setEditingStudent(student); setIsStudentModalOpen(true); }} className="p-3 bg-gray-800 text-indigo-400 rounded-2xl border border-gray-700 shadow-sm active:scale-90 transition-all"><Edit size={20} /></button>
                <button onClick={() => handleDeleteStudent(student.id)} className="p-3 bg-gray-800 text-red-400 rounded-2xl border border-gray-700 shadow-sm active:scale-90 transition-all"><Trash2 size={20} /></button>
            </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={80} /></div>
             <div className="relative z-10">
                <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">{student.name} {student.surname}</h2>
                <div className="text-sm text-indigo-400 font-bold mb-6">{cls?.name || 'SINIFSIZ'}</div>
                <div className="flex items-center gap-8">
                    <div><span className="text-gray-500 block text-[10px] uppercase font-black tracking-widest mb-1">ORTALAMA NET</span><span className="font-black text-white text-3xl">{student.averageNet}</span></div>
                    <div><span className="text-gray-500 block text-[10px] uppercase font-black tracking-widest mb-1">SINAV</span><span className="font-black text-white text-3xl">{student.examCount}</span></div>
                </div>
             </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-3xl border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-200 font-black text-sm uppercase">GELİŞİM GRAFİĞİ</h3>
                <div className="flex bg-gray-900 rounded-2xl p-1 border border-gray-700 shadow-inner">
                    <button onClick={() => setStudentChartMetric('net')} className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all ${studentChartMetric === 'net' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>NET</button>
                    <button onClick={() => setStudentChartMetric('correct')} className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all ${studentChartMetric === 'correct' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>D</button>
                </div>
            </div>
            {studentResults.length > 0 ? (
                <div className="h-[220px] md:h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={studentResults} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#9CA3AF" 
                                tick={{fill: '#9CA3AF', fontSize: 10}} 
                                tickLine={false} 
                                axisLine={false}
                                interval={0}
                                angle={studentResults.length > 5 ? -15 : 0}
                            />
                            <YAxis stroke="#9CA3AF" domain={[0, 10]} tick={{fill: '#9CA3AF', fontSize: 10}} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }} itemStyle={{ color: '#818CF8', fontWeight: 'black' }} />
                            <Line type="monotone" dataKey={studentChartMetric} stroke="#818CF8" strokeWidth={5} dot={{r: 6, fill: '#818CF8', stroke: '#111827', strokeWidth: 2}} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm font-bold">YETERLİ VERİ YOK</div>}
        </div>

        <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-lg mb-4">
             <div className="p-4 border-b border-gray-700 bg-gray-900/30"><h3 className="text-gray-200 font-black text-sm uppercase tracking-wider">GEÇMİŞ ANALİZİ</h3></div>
             <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left text-gray-300">
                    <thead className="text-[10px] uppercase bg-gray-900 text-gray-500 font-black">
                        <tr>
                            <th className="px-5 py-3 cursor-pointer hover:text-white" onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'def.name')}>DENEME <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-2 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.correct')}>D <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-2 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.incorrect')}>Y <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-5 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.net')}>NET <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50 text-sm">
                        {sortedFullHistory.map((item: any) => (
                                <tr key={item.def.id} className="hover:bg-gray-700/30 active:bg-gray-700/50">
                                    <td className="px-5 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold uppercase tracking-tight">{item.def.name}</span>
                                            <span className="text-[9px] text-gray-500">{formatDate(item.def.date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-5 text-center text-green-400 font-bold">{!item.result || item.result.status === 'MISSING' ? 'G' : item.result.correct}</td>
                                    <td className="px-2 py-5 text-center text-red-400 font-bold">{!item.result || item.result.status === 'MISSING' ? 'G' : item.result.incorrect}</td>
                                    <td className="px-5 py-5 text-center font-black text-indigo-400 text-base">{!item.result || item.result.status === 'MISSING' ? (item.result ? 'G' : '-') : item.result.net}</td>
                                    <td className="px-5 py-5 text-right">
                                        <button onClick={() => item.result ? handleOpenExamModal(item.result) : handleOpenExamModal(undefined, item.def.id)} className={`p-2 rounded-xl border border-gray-700 ${item.result ? 'text-indigo-400' : 'text-green-500'}`}>{item.result ? <Edit size={16} /> : <Plus size={16} />}</button>
                                    </td>
                                </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
      </div>
    );
  };

  const renderExams = () => {
    const sortedDefs = sortData<ExamDefinition>(examDefinitions, sortExamList);
    return (
      <div className="space-y-4 pb-safe animate-in fade-in duration-300">
        <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">DENEMELER</h2>
            <button onClick={handleAddExamDefinition} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={18} /> YENİ DENEME</button>
        </div>
        <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left text-gray-300">
                    <thead className="text-[10px] uppercase bg-gray-900 text-gray-500 font-black">
                        <tr>
                            <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => handleSort(sortExamList, setSortExamList, 'name')}>DENEME ADI <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-5 py-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamList, setSortExamList, 'date')}>TARİH <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            <th className="px-5 py-4 text-center">ORT.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50 text-sm">
                        {sortedDefs.map(def => {
                            const results = exams.filter(e => (e.examId === def.id || e.examName === def.name) && e.status !== 'MISSING');
                            const attendedCount = results.length;
                            const avg = attendedCount > 0 ? (results.reduce((sum, e) => sum + e.net, 0) / attendedCount).toFixed(2) : '-';
                            return (
                                <tr key={def.id} className="hover:bg-gray-700/30 active:bg-gray-700/50 cursor-pointer" onClick={() => handleNavigation('EXAM_DETAIL', { examDefId: def.id })}>
                                    <td className="px-5 py-5 font-bold text-white uppercase tracking-tight">
                                        <div className="flex flex-col">
                                            <span>{def.name}</span>
                                            <span className="text-[9px] text-gray-500 font-medium">{formatDate(def.date)} • {attendedCount} KATILIM</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-center font-black text-indigo-400 text-xl">{avg}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {examDefinitions.length === 0 && (<div className="p-16 text-center text-gray-500 font-black uppercase tracking-widest text-xs">HENÜZ DENEME YOK</div>)}
        </div>
      </div>
    );
  };

  const renderExamDetail = () => {
      const def = examDefinitions.find(d => d.id === selectedExamDefId);
      if (!def) return <div>Deneme bulunamadı</div>;
      
      let allResults = exams.filter(e => e.examId === def.id || e.examName === def.name);
      // SADECE KATILANLAR ÜZERİNDEN ORTALAMA HESAPLA
      const attended = allResults.filter(e => e.status !== 'MISSING');
      const avgNetValue = attended.length > 0 ? parseFloat((attended.reduce((s, e) => s + e.net, 0) / attended.length).toFixed(2)) : 0;
      const avgNet = avgNetValue.toFixed(2);
      const avgCorrect = attended.length > 0 ? (attended.reduce((s, e) => s + e.correct, 0) / attended.length).toFixed(1) : '0.0';
      const avgIncorrect = attended.length > 0 ? (attended.reduce((s, e) => s + e.incorrect, 0) / attended.length).toFixed(1) : '0.0';

      let results = [...allResults];
      if (filterExamDetailClassId !== 'all') {
          results = results.filter(r => { const s = students.find(student => student.id === r.studentId); return s && s.classroomId === filterExamDetailClassId; });
      }
      
      if (showBelowAverageOnly) {
          results = results.filter(r => r.status === 'ATTENDED' && r.net < avgNetValue);
      }

      const rows = results.map(r => { const s = students.find(stu => stu.id === r.studentId); return { ...r, studentName: s ? `${s.name} ${s.surname}` : 'Bilinmeyen', className: s ? classes.find(c => c.id === s.classroomId)?.name || '-' : '-' }; });
      const sortedRows = sortData<any>(rows, sortExamDetail);

      return (
        <div className="space-y-4 pb-safe animate-in zoom-in-95 duration-300">
             <div className="flex items-center justify-between px-1">
                <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold"><ArrowLeft size={18} /> GERİ</button>
                <div className="flex gap-2">
                    <button onClick={() => handleEditExamDefinition(def.id, def.name, def.date)} className="p-3 bg-gray-800 text-indigo-400 rounded-2xl border border-gray-700 shadow-sm"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteExamDefinition(def.id)} className="p-3 bg-gray-800 text-red-400 rounded-2xl border border-gray-700 shadow-sm"><Trash2 size={18} /></button>
                </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-900/20">
                <h2 className="text-white text-2xl font-black uppercase tracking-tighter mb-4">{def.name}</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl"><p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">ORTALAMA NET</p><p className="text-2xl font-black text-white">{avgNet}</p></div>
                    <div className="bg-white/10 p-3 rounded-2xl"><p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">KATILIM</p><p className="text-2xl font-black text-white">{attended.length} / {allResults.length}</p></div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                 <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center shadow-sm"><p className="text-green-400 text-[10px] font-black uppercase mb-1">ORT. DOĞRU</p><p className="text-xl font-black text-white">{avgCorrect}</p></div>
                 <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center shadow-sm"><p className="text-red-400 text-[10px] font-black uppercase mb-1">ORT. YANLIŞ</p><p className="text-xl font-black text-white">{avgIncorrect}</p></div>
            </div>

            <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex flex-col gap-3 bg-gray-900/50">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-100 font-black text-xs uppercase tracking-widest">Sıralama Listesi</h3>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowBelowAverageOnly(!showBelowAverageOnly)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${showBelowAverageOnly ? 'bg-red-500 text-white border-red-400' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
                            >
                                <Filter size={12} /> Ortalama Altı ({allResults.filter(r => r.status === 'ATTENDED' && r.net < avgNetValue).length})
                            </button>
                        </div>
                    </div>
                    <select className="w-full bg-gray-900 text-white text-xs p-3 rounded-2xl border border-gray-700 outline-none appearance-none" value={filterExamDetailClassId} onChange={(e) => setFilterExamDetailClassId(e.target.value)}><option value="all">TÜM SINIFLAR</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left text-gray-300 font-medium">
                        <thead className="text-[10px] uppercase bg-gray-900 text-gray-500 font-black">
                            <tr>
                                <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'studentName')}>ÖĞRENCİ <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                <th className="px-2 py-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'correct')}>D <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                <th className="px-2 py-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'incorrect')}>Y <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                <th className="px-5 py-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'net')}>NET <ArrowUpDown size={10} className="inline opacity-30"/></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50 text-sm">
                            {sortedRows.map(row => {
                                const isBelowAvg = row.status === 'ATTENDED' && row.net < avgNetValue;
                                return (
                                    <tr key={row.id} onClick={() => handleNavigation('STUDENT_DETAIL', { studentId: row.studentId })} className="hover:bg-gray-700/30 active:bg-gray-700/50 cursor-pointer">
                                        <td className="px-5 py-5 uppercase tracking-tighter">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-black ${isBelowAvg ? 'text-red-400' : 'text-white'}`}>{row.studentName}</span>
                                                {isBelowAvg && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                                            </div>
                                            <div className="text-[9px] text-gray-500 font-bold">{row.className}</div>
                                        </td>
                                        <td className="px-2 py-5 text-center text-green-400 font-bold">{row.status === 'MISSING' ? 'G' : row.correct}</td>
                                        <td className="px-2 py-5 text-center text-red-400 font-bold">{row.status === 'MISSING' ? 'G' : row.incorrect}</td>
                                        <td className={`px-5 py-5 text-center font-black text-lg ${isBelowAvg ? 'text-red-400' : 'text-indigo-400'}`}>{row.status === 'MISSING' ? 'G' : row.net}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  if (isLoading) return (<div className="flex h-[100dvh] items-center justify-center bg-gray-900 text-white"><div className="text-center"><div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-indigo-600/20"></div><p className="font-black tracking-widest uppercase text-[10px] text-indigo-400">ENGLISHNET</p></div></div>);
  if (errorMsg) return (<div className="flex h-[100dvh] items-center justify-center bg-gray-900 text-white p-4"><div className="max-w-md bg-gray-800 p-8 rounded-3xl border border-red-900/30 shadow-2xl text-center"><AlertTriangle size={48} className="mx-auto text-red-500 mb-6" /><h2 className="text-2xl font-black mb-2">HATA</h2><p className="text-gray-400 mb-6">{errorMsg}</p><button onClick={() => window.location.reload()} className="w-full bg-indigo-600 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-900/20">TEKRAR DENE</button></div></div>);

  return (
    <div className="flex h-[100dvh] bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 flex justify-around p-2 pb-safe z-40 shadow-2xl">
        <button onClick={() => handleNavigation('DASHBOARD')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${view === 'DASHBOARD' ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-500'}`}><LayoutDashboard size={24} /><span className="text-[8px] font-black mt-1.5 uppercase tracking-widest">ÖZET</span></button>
        <button onClick={() => handleNavigation('RESULTS')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${view === 'RESULTS' ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-500'}`}><ListChecks size={24} /><span className="text-[8px] font-black mt-1.5 uppercase tracking-widest">LİSTE</span></button>
        <button onClick={() => handleNavigation('STUDENTS')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${view === 'STUDENTS' || view === 'STUDENT_DETAIL' ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-500'}`}><Users size={24} /><span className="text-[8px] font-black mt-1.5 uppercase tracking-widest">ÖĞRENCİ</span></button>
        <button onClick={() => handleNavigation('EXAMS')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${view === 'EXAMS' || view === 'EXAM_DETAIL' ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-500'}`}><FileText size={24} /><span className="text-[8px] font-black mt-1.5 uppercase tracking-widest">DENEME</span></button>
        <button onClick={() => handleNavigation('ANALYTICS')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${view === 'ANALYTICS' ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-500'}`}><BarChart3 size={24} /><span className="text-[8px] font-black mt-1.5 uppercase tracking-widest">ANALİZ</span></button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-72 bg-gray-800 border-r border-gray-700 shadow-2xl z-20">
        <div className="p-8 border-b border-gray-700"><h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter"><div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">E</div>EnglishNet</h1></div>
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
            <button onClick={() => handleNavigation('DASHBOARD')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${view === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-700'}`}><LayoutDashboard size={20} /><span>ANA SAYFA</span></button>
            <button onClick={() => handleNavigation('ANALYTICS')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${view === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-700'}`}><BarChart3 size={20} /><span>ANALİZ MERKEZİ</span></button>
            <button onClick={() => handleNavigation('RESULTS')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${view === 'RESULTS' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-700'}`}><ListChecks size={20} /><span>TÜM SONUÇLAR</span></button>
            <div className="h-px bg-gray-700 my-6 mx-2 opacity-50"></div>
            <button onClick={() => handleNavigation('STUDENTS')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${view === 'STUDENTS' || view === 'STUDENT_DETAIL' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-700'}`}><Users size={20} /><span>ÖĞRENCİLER</span></button>
            <button onClick={() => handleNavigation('CLASSES')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${view === 'CLASSES' || view === 'CLASS_DETAIL' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-700'}`}><Users size={20} className="scale-x-[-1]" /><span>SINIFLAR</span></button>
            <button onClick={() => handleNavigation('EXAMS')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${view === 'EXAMS' || view === 'EXAM_DETAIL' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-700'}`}><FileText size={20} /><span>DENEMELER</span></button>
        </nav>
        <div className="p-6 border-t border-gray-700 text-center"><p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">VERSION 2.1 ELITE</p></div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-900">
         <div className="md:hidden bg-gray-800 px-5 py-4 border-b border-gray-700 flex justify-between items-center z-30 sticky top-0 pt-safe shadow-xl"><h1 className="text-xl font-black text-white tracking-tighter">EnglishNet</h1><div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-900/30">E</div></div>
         <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-28 md:pb-10">
            <div className="max-w-4xl mx-auto w-full">
                {view === 'DASHBOARD' && renderDashboard()}
                {view === 'ANALYTICS' && renderAnalytics()}
                {view === 'RESULTS' && renderResults()}
                {view === 'STUDENTS' && (
                  <div className="space-y-4 pb-safe animate-in fade-in duration-300">
                     <div className="flex items-center gap-2">
                         <div className="relative flex-1 group shadow-xl rounded-2xl overflow-hidden border border-gray-700"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400" size={18} /><input type="text" placeholder="ÖĞRENCİ ARA..." className="w-full bg-gray-800 text-white pl-12 pr-4 py-4 outline-none text-xs font-black tracking-widest placeholder:text-gray-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
                         {selectedBatchStudentIds.size > 0 ? (
                            <button onClick={handleDeleteMultipleStudents} className="bg-red-600 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all"><Trash2 size={24} /></button>
                         ) : (
                            <button onClick={() => { setEditingStudent(null); setIsStudentModalOpen(true); }} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all"><Plus size={24} /></button>
                         )}
                     </div>
                     <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left text-gray-300">
                                <thead className="text-[10px] uppercase bg-gray-900 text-gray-500 font-black">
                                    <tr>
                                        <th className="px-5 py-4 w-12"></th>
                                        <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'name')}>ÖĞRENCİ <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                        <th className="px-5 py-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort(sortStudents, setSortStudents, 'lastNet')}>SON NET <ArrowUpDown size={10} className="inline opacity-30"/></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50 text-sm font-medium">
                                    {filteredStudents.map(student => (
                                        <tr key={student.id} className={`hover:bg-gray-700/30 active:bg-gray-700/50 cursor-pointer transition-colors ${selectedBatchStudentIds.has(student.id) ? 'bg-indigo-600/10' : ''}`} onClick={() => handleNavigation('STUDENT_DETAIL', { studentId: student.id })}>
                                            <td className="px-5 py-5" onClick={(e) => { e.stopPropagation(); toggleStudentSelection(student.id); }}>
                                                {selectedBatchStudentIds.has(student.id) ? <CheckSquare size={22} className="text-indigo-400" /> : <Square size={22} className="text-gray-700" />}
                                            </td>
                                            <td className="px-5 py-5 uppercase tracking-tighter">
                                                <div className="font-black text-white">{student.name} {student.surname}</div>
                                                <div className="text-[9px] text-indigo-400/80 font-bold">{classes.find(c => c.id === student.classroomId)?.name || '-'}</div>
                                            </td>
                                            <td className="px-5 py-5 text-center font-black text-indigo-400 text-lg">{student.lastResult ? (student.lastResult.status === 'MISSING' ? 'G' : student.lastNet) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                  </div>
                )}
                {view === 'CLASSES' && (
                  <div className="space-y-6 pb-safe animate-in fade-in duration-300">
                     <div className="flex justify-between items-center px-1"><h2 className="text-xl font-black text-white uppercase tracking-tight">SINIFLAR</h2><button onClick={handleAddClass} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg active:scale-95 transition-all flex items-center gap-2"><Plus size={18} /> YENİ SINIF</button></div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{classes.map(c => (<div key={c.id} className="bg-gray-800 p-6 rounded-3xl border border-gray-700 hover:border-indigo-500 transition-all cursor-pointer relative group shadow-xl active:scale-[0.98]" onClick={() => handleNavigation('CLASS_DETAIL', { classId: c.id })}><div className="flex justify-between items-start mb-6"><h3 className="text-2xl font-black text-white uppercase tracking-tighter">{c.name}</h3><button onClick={(e) => { e.stopPropagation(); handleEditClass(c.id, c.name); }} className="text-gray-600 hover:text-white p-2"><Edit size={18} /></button></div><div className="flex justify-between items-end"><div className="flex items-center gap-2 text-gray-400"><Users size={16} /> <span className="text-xs font-black uppercase tracking-widest">{students.filter(s => s.classroomId === c.id).length} ÖĞRENCİ</span></div><button onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} className="text-gray-700 hover:text-red-400 p-2"><Trash2 size={20} /></button></div></div>))}</div>
                  </div>
                )}
                {view === 'CLASS_DETAIL' && renderClassDetail()}
                {view === 'STUDENT_DETAIL' && renderStudentDetail()}
                {view === 'EXAMS' && renderExams()}
                {view === 'EXAM_DETAIL' && renderExamDetail()}
            </div>
         </div>
      </div>

      <ExamModal isOpen={isExamModalOpen} onClose={() => { setIsExamModalOpen(false); setEditingExamResult(null); setPreselectedExamDefId(null); }} onSave={handleSaveExam} studentId={selectedStudentId || ''} examDefinitions={examDefinitions} initialData={editingExamResult} preselectedExamDefId={preselectedExamDefId} existingExamIds={editingExamResult ? [] : exams.filter(e => e.studentId === selectedStudentId).map(e => e.examId || '')} />
      <StudentFormModal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} onSave={handleSaveStudent} classes={classes} editingStudent={editingStudent} />
      <InputModal {...inputModalConfig} onClose={() => setInputModalConfig(prev => ({ ...prev, isOpen: false }))} />
      <ConfirmModal {...confirmModalConfig} onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))} />
      <BatchImportModal isOpen={isBatchModalOpen} mode={batchModalMode} onClose={() => setIsBatchModalOpen(false)} onProcess={batchModalMode === 'student' ? handleBatchStudentImport : (batchModalMode === 'result' ? handleBatchResultImport : handleBatchClassChange)} />
    </div>
  );
}

export default App;
