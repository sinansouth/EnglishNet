import React, { useState, useEffect, useMemo } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
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
  onClose: () => void;
  onProcess: (text: string) => void;
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, onClose, onProcess }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 flex flex-col h-[80vh]">
         <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
            <div className="flex items-center gap-2">
                <ClipboardList className="text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Hızlı Öğrenci Girişi</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
         </div>
         <div className="p-4 flex-1 flex flex-col gap-3 bg-gray-800 overflow-y-auto">
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700 text-sm text-gray-300 space-y-2">
                <p>Excel'den veya başka bir listeden verileri kopyalayıp aşağıdaki alana yapıştırın.</p>
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-400 text-xs uppercase">Format:</span>
                    <div className="font-mono bg-black/30 p-2 rounded text-indigo-300 text-xs">
                        Ad Soyad Sınıf
                    </div>
                </div>
                <p className="text-xs text-gray-500">
                    * Veriler boşluk veya tab ile ayrılabilir.<br/>
                    * Eğer sınıf sistemde yoksa otomatik oluşturulur.<br/>
                    * Örnek: <span className="font-mono text-gray-300">Ali Yılmaz 8/A</span>
                </p>
            </div>
            <textarea 
              className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Ahmet Yılmaz 8/A&#10;Ayşe Demir 8/B&#10;Mehmet Can Kaya 8/C..."
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

function sortData<T>(data: T[], config: SortConfig<T>): T[] {
  return [...data].sort((a: any, b: any) => {
    const aVal = config.key.toString().split('.').reduce((o, i) => (o ? o[i] : undefined), a);
    const bVal = config.key.toString().split('.').reduce((o, i) => (o ? o[i] : undefined), b);

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

  // --- INITIAL LOAD ---
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const data = await fetchAllData();
      setStudents(data.students);
      setClasses(data.classes);
      setExams(data.exams);
      setExamDefinitions(data.examDefinitions);
      setIsLoading(false);
    };
    initData();
  }, []);

  // Removed automatic saveData effects because we now use explicit API calls

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

    return { totalStudents, totalExams, globalAvgNet, examStats };
  }, [students, exams, classes, examDefinitions]);

  // --- HANDLERS ---
  const handleSort = (config: SortConfig<any>, setConfig: React.Dispatch<React.SetStateAction<SortConfig<any>>>, key: string) => {
    setConfig({
        key,
        direction: config.key === key && config.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const navigateToStudent = (id: string) => {
    setSelectedStudentId(id);
    setView('STUDENT_DETAIL');
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
    if ('id' in studentData) {
        await apiUpdateStudent(studentData);
        setStudents(prev => prev.map(s => s.id === studentData.id ? studentData : s));
    } else {
        const newStudent = { ...studentData, id: Date.now().toString() };
        await apiAddStudent(newStudent);
        setStudents(prev => [...prev, newStudent]);
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
            setView('STUDENTS');
            
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
        }
    });
  };

  // --- BATCH IMPORT HANDLER ---
  const handleBatchImport = async (text: string) => {
    setIsLoading(true);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const newStudentsPayload: any[] = [];
    const classNamesFound = new Set<string>();

    lines.forEach(line => {
        // Splitting logic: Try tab first, then regex for spaces
        let parts = line.split('\t').map(p => p.trim()).filter(p => p);
        if (parts.length < 2) {
            parts = line.trim().split(/\s+/);
        }

        if (parts.length >= 2) {
             const className = parts.pop()!; // Last element is always Class
             const surname = parts.length > 1 ? parts.pop()! : ''; // Second last is Surname if exists
             const name = parts.join(' ');   // Rest is Name
             
             if (name && className) {
                 classNamesFound.add(className);
                 // If no surname found (2 parts total: Name Class), use empty or handle appropriately
                 // Ideally format is Name Surname Class
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
        // 1. Handle Classes
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

        // 2. Add Students
        const addedStudents = [];
        for (const s of newStudentsPayload) {
            const cls = tempClasses.find(c => c.name.toLowerCase() === s.className.toLowerCase());
            if (cls) {
                const newStudent = {
                    id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
                    name: s.name,
                    surname: s.surname,
                    classroomId: cls.id,
                    targetCorrect: 6
                };
                await apiAddStudent(newStudent);
                addedStudents.push(newStudent);
            }
        }

        setStudents(prev => [...prev, ...addedStudents]);
        setIsBatchModalOpen(false);
        alert(`İşlem Tamamlandı!\n\n${addedStudents.length} öğrenci eklendi.\n${createdClasses.length} yeni sınıf oluşturuldu.`);
    
    } catch (e) {
        console.error(e);
        alert("Veriler kaydedilirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || '-';
  
  const SortIcon = ({ active }: { active: boolean }) => (
    <ArrowUpDown size={12} className={`ml-1 inline-block ${active ? 'text-indigo-400' : 'text-gray-600'}`} />
  );
  
  const renderTrend = (current: number, previous: number | undefined) => {
      const trend = getTrend(current, previous);
      return <TrendIcon trend={trend} />;
  }

  // --- VIEWS ---
  
  const renderDashboard = () => {
    const displayData = stats.examStats;
    const xKey = 'formattedDate'; // Changed to Date
    const yKey = 'avgNet';

    // To allow scrolling max 5 visible:
    const minWidthPerItem = 80;
    const dynamicWidth = Math.max(displayData.length * minWidthPerItem, 300); // minimum container width

    return (
    <div className="space-y-4 animate-fade-in pb-20 md:pb-0">
      
      <div className="flex justify-end">
          <button 
             onClick={() => setIsBatchModalOpen(true)}
             className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors border border-green-500"
          >
             <ClipboardList size={16} /> Hızlı Veri Girişi (Toplu)
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Toplam Öğrenci</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalStudents}</h3>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Genel Net Ort.</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.globalAvgNet}</h3>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Deneme Sayısı</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalExams}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-100">Deneme Bazlı Ortalama Analizi</h3>
        </div>
        
        <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ width: `${dynamicWidth}px`, height: 250 }}>
            {displayData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                    <XAxis 
                        dataKey={xKey} 
                        stroke="#9CA3AF" 
                        tick={{fontSize: 10}} 
                        interval={0} 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis domain={[0, 10]} stroke="#9CA3AF" tick={{fontSize: 10}} />
                    <Tooltip 
                        cursor={{fill: '#374151', opacity: 0.4}} 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6', fontSize: '12px' }}
                        labelFormatter={(label, payload) => {
                             if(payload && payload.length > 0) {
                                 const item = payload[0].payload;
                                 return `${item.name} (${item.formattedDate})`;
                             }
                             return label;
                        }}
                    />
                    <Bar 
                        dataKey={yKey} 
                        fill="#6366f1" 
                        radius={[4, 4, 0, 0]} 
                        name="Ortalama Net" 
                    />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Veri yok.
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  )};

  const renderStudents = () => (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex flex-col gap-3 bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-700">
        <div className="flex gap-2">
           <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Öğrenci ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 w-full bg-gray-700 border border-gray-600 rounded-md text-sm outline-none text-white placeholder-gray-400"
            />
          </div>
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded-md py-2 px-2 text-sm outline-none w-28"
          >
            <option value="all">Sınıf: Tümü</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <select
            value={filterExamId}
            onChange={(e) => setFilterExamId(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md py-2 px-2 text-sm outline-none"
          >
            <option value="all">Deneme: Tümü (Ortalama)</option>
            {examDefinitions.map(ed => (
              <option key={ed.id} value={ed.id}>{ed.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingStudent(null); setIsStudentModalOpen(true); }}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition flex-1 justify-center text-sm"
          >
            <Plus size={16} /> Yeni Öğrenci
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th onClick={() => handleSort(sortStudents, setSortStudents, 'name')} className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase cursor-pointer whitespace-nowrap">Ad Soyad <SortIcon active={sortStudents.key === 'name'} /></th>
                <th onClick={() => handleSort(sortStudents, setSortStudents, 'classroomId')} className="px-2 py-3 text-xs font-semibold text-gray-400 uppercase cursor-pointer text-center">Sınıf <SortIcon active={sortStudents.key === 'classroomId'} /></th>
                
                <th onClick={() => handleSort(sortStudents, setSortStudents, 'targetCorrect')} className="px-2 py-3 text-xs font-semibold text-yellow-500 uppercase cursor-pointer text-center" title="Hedef">Hedef <SortIcon active={sortStudents.key === 'targetCorrect'} /></th>
                <th onClick={() => handleSort(sortStudents, setSortStudents, 'averageCorrect')} className="px-2 py-3 text-xs font-semibold text-green-400 uppercase cursor-pointer text-center w-8" title="Doğru">D <SortIcon active={sortStudents.key === 'averageCorrect'} /></th>
                <th onClick={() => handleSort(sortStudents, setSortStudents, 'averageIncorrect')} className="px-2 py-3 text-xs font-semibold text-red-400 uppercase cursor-pointer text-center w-8" title="Yanlış">Y <SortIcon active={sortStudents.key === 'averageIncorrect'} /></th>
                <th onClick={() => handleSort(sortStudents, setSortStudents, 'averageNet')} className="px-2 py-3 text-xs font-semibold text-indigo-400 uppercase cursor-pointer text-center w-12" title="Net">N <SortIcon active={sortStudents.key === 'averageNet'} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-gray-300">
              {filteredStudents.map(student => {
                 const lastRes = student.lastResult;
                 const prevRes = student.previousResult;
                 const showTrends = filterExamId === 'all'; 

                 const d = student.averageCorrect;
                 const y = student.averageIncorrect;

                 return (
                <tr key={student.id} className="hover:bg-gray-700/50 transition cursor-pointer" onClick={() => navigateToStudent(student.id)}>
                  <td className="px-3 py-3 text-sm text-indigo-300 font-medium">
                      {student.name} {student.surname}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded text-xs">
                      {getClassName(student.classroomId)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-yellow-500">
                    {student.targetCorrect}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-green-400">
                     {d} {showTrends && lastRes && renderTrend(lastRes.correct, prevRes?.correct)}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-red-400">
                     {y} {showTrends && lastRes && renderTrend(lastRes.incorrect, prevRes?.incorrect)}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-bold text-indigo-300">
                      {student.averageNet} {showTrends && lastRes && renderTrend(lastRes.net, prevRes?.net)}
                  </td>
                </tr>
              )})}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStudentDetail = () => {
    const student = studentsWithStats.find(s => s.id === selectedStudentId); 
    if (!student || !selectedStudentId) return null;

    const studentExams = exams.filter(e => e.studentId === student.id && e.status !== 'MISSING')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Sort ascending for chart (Oldest to Newest)
    const chartData = [...studentExams].reverse().map(e => ({
      name: e.examName,
      net: e.net,
      correct: e.correct,
      date: formatDate(e.date)
    }));

    // Dynamic width for student chart (same logic: 60px per item min)
    const minWidthPerItem = 60;
    const dynamicChartWidth = Math.max(chartData.length * minWidthPerItem, 300);

    const averageCorrect = student.averageCorrect;
    const targetCorrect = student.targetCorrect || 6;
    const progress = Math.min((averageCorrect / targetCorrect) * 100, 100);

    const rawExamHistory = examDefinitions.map(def => {
            const result = exams.find(e => e.studentId === student.id && (e.examId === def.id || e.examName === def.name));
            return { def, result };
    });
    
    const examHistory = sortData<any>(rawExamHistory, sortExamHistory);
    const existingExamIds = exams.filter(e => e.studentId === student.id).map(e => e.examId || '');

    return (
      <div className="space-y-4 pb-20 md:pb-0">
        <div className="flex justify-between items-center">
             <button 
              onClick={() => setView('STUDENTS')}
              className="flex items-center text-gray-400 hover:text-indigo-400 transition text-sm"
            >
              <ArrowLeft size={16} className="mr-1" /> Listeye Dön
            </button>
            <div className="flex gap-2">
                 <button 
                    onClick={() => { setEditingStudent(student); setIsStudentModalOpen(true); }}
                    className="p-1.5 bg-gray-700 text-blue-400 rounded hover:bg-gray-600"
                    title="Düzenle"
                 >
                    <Edit size={16} />
                 </button>
                 <button 
                    onClick={() => handleDeleteStudent(student.id)}
                    className="p-1.5 bg-gray-700 text-red-400 rounded hover:bg-gray-600"
                    title="Sil"
                 >
                    <Trash2 size={16} />
                 </button>
            </div>
        </div>

        {/* Profile Header */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div>
                     <h2 className="text-xl font-bold text-gray-100">{student.name} {student.surname}</h2>
                     <p className="text-sm text-gray-400">{getClassName(student.classroomId)}</p>
                </div>
                <div className="text-right">
                     <div className="text-xs text-gray-400">Ort. Net</div>
                     <div className="text-2xl font-bold text-indigo-400">{student.averageNet}</div>
                </div>
            </div>
            
            <div className="w-full">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Hedef: {targetCorrect} Doğru</span>
                    <span className="font-medium text-gray-300">{averageCorrect} / {targetCorrect} Doğru</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
            </div>

            <button
                onClick={() => handleOpenExamModal()}
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
            >
                <Plus size={16} /> Deneme Ekle
            </button>
        </div>

        {/* Chart */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 relative">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-100">Gelişim</h3>
                <div className="flex gap-2 items-center">
                    <div className="flex bg-gray-700 rounded-lg p-0.5">
                    <button 
                        onClick={() => setStudentChartMetric('net')}
                        className={`px-2 py-0.5 text-xs rounded transition ${studentChartMetric === 'net' ? 'bg-gray-600 text-indigo-400' : 'text-gray-400'}`}
                    >Net</button>
                    <button 
                        onClick={() => setStudentChartMetric('correct')}
                        className={`px-2 py-0.5 text-xs rounded transition ${studentChartMetric === 'correct' ? 'bg-gray-600 text-green-400' : 'text-gray-400'}`}
                    >Doğru</button>
                    </div>
                </div>
            </div>
              
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <div style={{ width: `${dynamicChartWidth}px`, height: 200 }}>
                    {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                        <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            tick={{fontSize: 10}} 
                            interval={0} 
                            angle={-45}
                            textAnchor="end"
                            height={40}
                        />
                        <YAxis domain={[0, 10]} stroke="#9CA3AF" tick={{fontSize: 10}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6', fontSize: '12px' }} 
                            labelFormatter={(label, payload) => {
                                if(payload && payload.length > 0) {
                                    const item = payload[0].payload;
                                    return `${item.name} (${item.date})`;
                                }
                                return label;
                           }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey={studentChartMetric} 
                            stroke={studentChartMetric === 'net' ? "#6366f1" : "#22c55e"} 
                            strokeWidth={2} 
                            dot={{ r: 3 }} 
                        />
                        </LineChart>
                    </ResponsiveContainer>
                    ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs">Veri yok.</div>
                    )}
                </div>
            </div>
        </div>

        {/* History Table */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700">
               <h3 className="text-sm font-bold text-gray-100">Geçmiş</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-900">
                    <tr>
                      <th onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'def.date')} className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase whitespace-nowrap cursor-pointer">Tarih <SortIcon active={sortExamHistory.key === 'def.date'} /></th>
                      <th onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'def.name')} className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase whitespace-nowrap cursor-pointer">Sınav <SortIcon active={sortExamHistory.key === 'def.name'} /></th>
                      <th onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.correct')} className="px-2 py-2 text-xs font-semibold text-green-400 uppercase text-center cursor-pointer">D <SortIcon active={sortExamHistory.key === 'result.correct'} /></th>
                      <th onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.incorrect')} className="px-2 py-2 text-xs font-semibold text-red-400 uppercase text-center cursor-pointer">Y <SortIcon active={sortExamHistory.key === 'result.incorrect'} /></th>
                      <th onClick={() => handleSort(sortExamHistory, setSortExamHistory, 'result.net')} className="px-2 py-2 text-xs font-semibold text-indigo-400 uppercase text-center cursor-pointer">Net <SortIcon active={sortExamHistory.key === 'result.net'} /></th>
                      <th className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 text-gray-300">
                    {examHistory.map(({ def, result }: any, idx: number) => {
                        const isMissing = result?.status === 'MISSING';
                        const prevResult = examHistory[idx + 1]?.result;
                        const showTrend = result && prevResult && !isMissing && prevResult.status !== 'MISSING';

                        return (
                            <tr key={def.id} className="hover:bg-gray-700/50">
                                <td className="px-3 py-2 text-xs text-gray-400">{formatDate(def.date)}</td>
                                <td className="px-3 py-2 text-xs font-medium text-gray-200">{def.name}</td>
                                {result ? (
                                    isMissing ? (
                                        <td colSpan={3} className="px-2 py-2 text-xs text-center font-bold text-red-400">GİRMEDİ</td>
                                    ) : (
                                        <>
                                        <td className="px-2 py-2 text-sm text-center font-medium text-green-400">
                                            {result.correct} {showTrend && renderTrend(result.correct, prevResult?.correct)}
                                        </td>
                                        <td className="px-2 py-2 text-sm text-center font-medium text-red-400">
                                            {result.incorrect} {showTrend && renderTrend(result.incorrect, prevResult?.incorrect)}
                                        </td>
                                        <td className="px-2 py-2 text-sm text-center font-bold text-indigo-400">
                                            {result.net} {showTrend && renderTrend(result.net, prevResult?.net)}
                                        </td>
                                        </>
                                    )
                                ) : (
                                    <td colSpan={3} className="px-2 py-2 text-xs text-center text-gray-500 italic">-</td>
                                )}
                                
                                <td className="px-2 py-2 text-right">
                                    <div className="flex justify-end gap-2">
                                        {result ? (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenExamModal(result, undefined); }}
                                                    className="p-1 text-blue-400 hover:bg-blue-900/50 rounded pointer-events-auto"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteExamResult(result.id); }}
                                                    className="p-1 text-red-400 hover:bg-red-900/50 rounded pointer-events-auto"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenExamModal(undefined, def.id); }}
                                                className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded transition pointer-events-auto"
                                            >
                                                Ekle
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                  </tbody>
                </table>
             </div>
        </div>
        <ExamModal
          isOpen={isExamModalOpen}
          onClose={() => { setIsExamModalOpen(false); setEditingExamResult(null); setPreselectedExamDefId(null); }}
          onSave={handleSaveExam}
          studentId={selectedStudentId}
          examDefinitions={examDefinitions}
          initialData={editingExamResult}
          preselectedExamDefId={preselectedExamDefId}
          existingExamIds={existingExamIds}
        />
      </div>
    );
  };

  const renderClassDetail = () => {
    const classroom = classes.find(c => c.id === selectedClassId);
    if (!classroom) return null;

    const classStudents = students.filter(s => s.classroomId === classroom.id).map(student => {
        let targetExam: ExamResult | undefined;
        let prevExam: ExamResult | undefined;

        const studentExams = exams.filter(e => e.studentId === student.id && e.status !== 'MISSING')
                             .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (classDetailExamFilter === 'last') {
            targetExam = studentExams[0];
            prevExam = studentExams[1];
        } else if (classDetailExamFilter === 'all') {
            if (studentExams.length > 0) {
               const avgC = studentExams.reduce((s,e) => s + e.correct, 0) / studentExams.length;
               const avgI = studentExams.reduce((s,e) => s + e.incorrect, 0) / studentExams.length;
               const avgN = studentExams.reduce((s,e) => s + e.net, 0) / studentExams.length;
               targetExam = {
                   id: 'avg',
                   studentId: student.id,
                   examName: 'Ortalama',
                   date: '',
                   correct: parseFloat(avgC.toFixed(1)),
                   incorrect: parseFloat(avgI.toFixed(1)),
                   empty: 0,
                   net: parseFloat(avgN.toFixed(2))
               } as ExamResult;
            }
        } else {
            targetExam = studentExams.find(e => e.examId === classDetailExamFilter);
            const currentIndex = studentExams.findIndex(e => e.examId === classDetailExamFilter);
            if (currentIndex !== -1 && currentIndex < studentExams.length - 1) {
                prevExam = studentExams[currentIndex + 1];
            }
        }
        
        return {
            ...student,
            targetExam,
            prevExam
        };
    });

    const sortedClassStudents = sortData<any>(classStudents, sortClassStudents);

    const avgNet = classStudents.filter(s => s.targetExam).length > 0 
      ? (classStudents.reduce((sum, s) => sum + (s.targetExam?.net || 0), 0) / classStudents.filter(s => s.targetExam).length).toFixed(2)
      : '0.00';

    return (
      <div className="space-y-4 pb-20 md:pb-0">
        <button 
          onClick={() => setView('CLASSES')}
          className="flex items-center text-gray-400 hover:text-indigo-400 transition text-sm mb-2"
        >
          <ArrowLeft size={16} className="mr-1" /> Sınıflara Dön
        </button>

        <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 flex flex-col gap-3">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-gray-100">{classroom.name}</h2>
                 <div className="text-right">
                    <span className="text-xs text-gray-400 block">Seçili Sınav Ort.</span>
                    <span className="text-xl font-bold text-indigo-400">{avgNet}</span>
                 </div>
             </div>
             
             {/* Filter Bar */}
             <div className="w-full">
                 <label className="text-xs text-gray-500 mb-1 block">Görüntülenen Sınav</label>
                 <select 
                    value={classDetailExamFilter}
                    onChange={(e) => setClassDetailExamFilter(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md py-2 px-2 text-sm outline-none"
                 >
                    <option value="last">Son Deneme (Varsayılan)</option>
                    <option value="all">Tüm Sınavlar (Ortalama)</option>
                    {examDefinitions.map(ed => (
                        <option key={ed.id} value={ed.id}>{ed.name} ({formatDate(ed.date)})</option>
                    ))}
                 </select>
             </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
             <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-100">Öğrenci Sonuçları</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'name')} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase cursor-pointer">Ad Soyad <SortIcon active={sortClassStudents.key === 'name'} /></th>
                      <th onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'targetCorrect')} className="px-2 py-3 text-xs font-semibold text-yellow-500 uppercase cursor-pointer text-center" title="Hedef">Hedef <SortIcon active={sortClassStudents.key === 'targetCorrect'} /></th>
                      <th onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'targetExam.correct')} className="px-2 py-3 text-xs font-semibold text-green-400 uppercase text-center w-8 cursor-pointer">D <SortIcon active={sortClassStudents.key === 'targetExam.correct'} /></th>
                      <th onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'targetExam.incorrect')} className="px-2 py-3 text-xs font-semibold text-red-400 uppercase text-center w-8 cursor-pointer">Y <SortIcon active={sortClassStudents.key === 'targetExam.incorrect'} /></th>
                      <th onClick={() => handleSort(sortClassStudents, setSortClassStudents, 'targetExam.net')} className="px-2 py-3 text-xs font-semibold text-indigo-400 uppercase text-center cursor-pointer w-12">Net <SortIcon active={sortClassStudents.key === 'targetExam.net'} /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 text-gray-300">
                    {sortedClassStudents.map((s: any) => {
                      const res = s.targetExam;
                      const prev = s.prevExam;
                      const showTrend = classDetailExamFilter !== 'all';

                      return (
                      <tr key={s.id} className="hover:bg-gray-700/50 cursor-pointer" onClick={() => navigateToStudent(s.id)}>
                        <td className="px-4 py-3 text-sm font-medium text-indigo-300">
                             <div>{s.name} {s.surname}</div>
                             <div className="text-[10px] text-gray-500">{res ? res.examName : 'Sonuç Yok'}</div>
                        </td>
                        <td className="px-2 py-3 text-center text-sm font-medium text-yellow-500">
                             {s.targetCorrect}
                        </td>
                        <td className="px-2 py-3 text-center text-sm text-green-400 font-medium">
                            {res ? (
                                <span>{res.correct} {showTrend && renderTrend(res.correct, prev?.correct)}</span>
                            ) : '-'}
                        </td>
                        <td className="px-2 py-3 text-center text-sm text-red-400 font-medium">
                            {res ? (
                                <span>{res.incorrect} {showTrend && renderTrend(res.incorrect, prev?.incorrect)}</span>
                            ) : '-'}
                        </td>
                        <td className="px-2 py-3 text-center text-sm text-indigo-300 font-bold">
                             {res ? (
                                <span>{res.net} {showTrend && renderTrend(res.net, prev?.net)}</span>
                            ) : '-'}
                        </td>
                      </tr>
                    )})}
                    {sortedClassStudents.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-gray-500 text-sm">Öğrenci yok.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
        </div>
      </div>
    );
  };

  const renderClasses = () => (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-700">
        <h2 className="text-lg font-bold text-gray-100">Sınıflar</h2>
        <button
          onClick={handleAddClass}
          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition text-sm"
        >
          <Plus size={16} /> Ekle
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {classes.map(c => {
          const studentCount = students.filter(s => s.classroomId === c.id).length;
          return (
            <div 
              key={c.id} 
              onClick={() => { setSelectedClassId(c.id); setView('CLASS_DETAIL'); }}
              className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 hover:bg-gray-750 transition cursor-pointer relative group"
            >
              <div className="absolute top-2 right-2 flex gap-1">
                 <button
                  onClick={(e) => { e.stopPropagation(); handleEditClass(c.id, c.name); }}
                  className="text-gray-600 hover:text-blue-400 transition pointer-events-auto p-1"
                >
                  <Edit size={16} />
                </button>
                 <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}
                  className="text-gray-600 hover:text-red-400 transition pointer-events-auto p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-1">{c.name}</h3>
              <p className="text-gray-400 text-xs">{studentCount} Öğrenci</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderExams = () => {
    const examTableData = examDefinitions.map(def => {
        const examResults = exams.filter(e => e.examId === def.id || e.examName === def.name);
        const effectiveResults = examResults.filter(e => e.status !== 'MISSING');
        const avg = effectiveResults.length > 0
            ? (effectiveResults.reduce((s, e) => s + e.net, 0) / effectiveResults.length).toFixed(2)
            : '-';
        return {
            ...def,
            attendeesCount: effectiveResults.length,
            avgNet: avg === '-' ? -1 : parseFloat(avg),
            displayAvg: avg
        };
    });

    const sortedExams = sortData<any>(examTableData, sortExamList);

    return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex flex-col gap-3 bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-700">
        <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold text-gray-100">Denemeler</h2>
             <button
                onClick={handleAddExamDefinition}
                className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition text-sm"
             >
                <Plus size={16} /> Yeni
             </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900 border-b border-gray-700">
               <tr>
                 <th onClick={() => handleSort(sortExamList, setSortExamList, 'name')} className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase cursor-pointer whitespace-nowrap">Deneme <SortIcon active={sortExamList.key === 'name'} /></th>
                 <th onClick={() => handleSort(sortExamList, setSortExamList, 'date')} className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase cursor-pointer whitespace-nowrap">Tarih <SortIcon active={sortExamList.key === 'date'} /></th>
                 <th onClick={() => handleSort(sortExamList, setSortExamList, 'avgNet')} className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase text-center cursor-pointer whitespace-nowrap">Ort. <SortIcon active={sortExamList.key === 'avgNet'} /></th>
                 <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase text-right">İşlem</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-gray-300">
              {sortedExams.map((def: any) => (
                  <tr key={def.id} className="hover:bg-gray-700/50 transition" onClick={() => { setSelectedExamDefId(def.id); setView('EXAM_DETAIL'); }}>
                    <td className="px-3 py-3 text-sm font-medium text-indigo-300 cursor-pointer">
                        {def.name}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400">{formatDate(def.date)}</td>
                    <td className="px-3 py-3 text-center font-bold text-gray-300 text-sm">{def.displayAvg}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditExamDefinition(def.id, def.name, def.date); }}
                          className="text-blue-400 hover:text-blue-300 pointer-events-auto"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteExamDefinition(def.id); }}
                          className="text-red-400 hover:text-red-300 pointer-events-auto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
               {sortedExams.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500 text-sm">Kayıt yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  };

  const renderExamDetail = () => {
    const examDef = examDefinitions.find(e => e.id === selectedExamDefId);
    if (!examDef) return null;
    
    // Original raw results
    const rawResults = exams
      .filter(e => e.examId === examDef.id || e.examName === examDef.name)
      .map(result => {
        const student = students.find(s => s.id === result.studentId);
        return {
          ...result,
          studentName: student ? `${student.name} ${student.surname}` : '?',
          className: student ? getClassName(student.classroomId) : '-',
          classroomId: student ? student.classroomId : '',
          target: student ? student.targetCorrect : 6
        };
      });

    // Filter by class if selected
    let filteredResults = rawResults;
    if (filterExamDetailClassId !== 'all') {
        filteredResults = rawResults.filter(r => r.classroomId === filterExamDetailClassId);
    }

    const sortedResults = sortData<any>(filteredResults, sortExamDetail);
    const effectiveResults = filteredResults.filter(r => r.status !== 'MISSING');
    const totalStudents = effectiveResults.length;
    const avgNet = totalStudents > 0 ? (effectiveResults.reduce((s, r) => s + r.net, 0) / totalStudents).toFixed(2) : '0';

    return (
      <div className="space-y-4 pb-20 md:pb-0">
        <button 
          onClick={() => setView('EXAMS')}
          className="flex items-center text-gray-400 hover:text-indigo-400 transition text-sm mb-2"
        >
          <ArrowLeft size={16} className="mr-1" /> Denemelere Dön
        </button>

        <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700">
           <div className="flex justify-between items-center mb-4">
               <div>
                   <h2 className="text-lg font-bold text-gray-100">{examDef.name}</h2>
                   <span className="text-xs text-gray-400">{formatDate(examDef.date)}</span>
               </div>
               {/* Filter Dropdown */}
               <select 
                  value={filterExamDetailClassId}
                  onChange={(e) => setFilterExamDetailClassId(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white rounded-md py-1 px-2 text-xs outline-none"
               >
                   <option value="all">Sınıf: Tümü</option>
                   {classes.map(c => (
                       <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
               </select>
           </div>
           
           <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-700 p-2 rounded flex justify-between">
                    <span className="text-gray-400">Katılım</span>
                    <span className="font-bold text-white">{totalStudents}</span>
                </div>
                <div className="bg-gray-700 p-2 rounded flex justify-between">
                    <span className="text-gray-400">Ort. Net</span>
                    <span className="font-bold text-indigo-400">{avgNet}</span>
                </div>
           </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-gray-900 border-b border-gray-700">
                 <tr>
                   <th className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase w-8">#</th>
                   <th onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'studentName')} className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase cursor-pointer whitespace-nowrap">Öğrenci <SortIcon active={sortExamDetail.key === 'studentName'} /></th>
                   <th onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'target')} className="px-2 py-3 text-xs font-semibold text-yellow-500 uppercase text-center cursor-pointer" title="Hedef">Hedef <SortIcon active={sortExamDetail.key === 'target'} /></th>
                   <th onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'correct')} className="px-2 py-3 text-xs font-semibold text-green-400 uppercase text-center w-8 cursor-pointer">D <SortIcon active={sortExamDetail.key === 'correct'} /></th>
                   <th onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'incorrect')} className="px-2 py-3 text-xs font-semibold text-red-400 uppercase text-center w-8 cursor-pointer">Y <SortIcon active={sortExamDetail.key === 'incorrect'} /></th>
                   <th onClick={() => handleSort(sortExamDetail, setSortExamDetail, 'net')} className="px-3 py-2 text-xs font-semibold text-indigo-400 uppercase text-center cursor-pointer">Net <SortIcon active={sortExamDetail.key === 'net'} /></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-700 text-gray-300">
                 {sortedResults.map((r: any, index: number) => {
                   const isMissing = r.status === 'MISSING';
                   return (
                    <tr key={r.id} className="hover:bg-gray-700/50" onClick={() => navigateToStudent(r.studentId)}>
                        <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-200 cursor-pointer">
                            <div>{r.studentName}</div>
                            <div className="text-xs text-gray-500">{r.className}</div>
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-yellow-500">
                             {r.target}
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-green-400">
                            {isMissing ? '-' : r.correct}
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-red-400">
                            {isMissing ? '-' : r.incorrect}
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-bold text-indigo-400">
                            {isMissing ? <span className="text-red-400 text-xs">GİRMEDİ</span> : r.net}
                        </td>
                    </tr>
                   );
                 })}
                 {sortedResults.length === 0 && (
                   <tr><td colSpan={6} className="p-6 text-center text-gray-500 text-sm">Sonuç yok.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  };

  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Özet' },
    { id: 'STUDENTS', icon: Users, label: 'Öğrenci' },
    { id: 'CLASSES', icon: Users, label: 'Sınıf' },
    { id: 'EXAMS', icon: FileText, label: 'Deneme' },
  ];

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-indigo-400 animate-pulse font-medium">Veriler Yükleniyor...</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row text-gray-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-gray-800 border-r border-gray-700 flex-col fixed h-full z-10">
        <div className="p-4 border-b border-gray-700 flex items-center justify-center">
          <h1 className="text-lg font-bold text-gray-100 tracking-tight">EnglishNet</h1>
        </div>
        <nav className="p-2 space-y-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === item.id || (view.includes(item.id.slice(0, 4)) && item.id !== 'DASHBOARD')
                  ? 'bg-gray-700 text-indigo-400' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-56 p-3 md:p-6 max-w-full overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {view === 'DASHBOARD' && renderDashboard()}
          {view === 'STUDENTS' && renderStudents()}
          {view === 'STUDENT_DETAIL' && renderStudentDetail()}
          {view === 'CLASSES' && renderClasses()}
          {view === 'CLASS_DETAIL' && renderClassDetail()}
          {view === 'EXAMS' && renderExams()}
          {view === 'EXAM_DETAIL' && renderExamDetail()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-gray-800 border-t border-gray-700 flex justify-around p-2 z-50 safe-area-pb">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`flex flex-col items-center p-1 rounded-lg text-[10px] font-medium transition ${
              view === item.id || (view.includes(item.id.slice(0, 4)) && item.id !== 'DASHBOARD')
                ? 'text-indigo-400' 
                : 'text-gray-500'
            }`}
          >
            <item.icon size={20} className="mb-0.5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Modals */}
      {selectedStudentId && (
        <ExamModal
          isOpen={isExamModalOpen}
          onClose={() => { setIsExamModalOpen(false); setEditingExamResult(null); setPreselectedExamDefId(null); }}
          onSave={handleSaveExam}
          studentId={selectedStudentId}
          examDefinitions={examDefinitions}
          initialData={editingExamResult}
          preselectedExamDefId={preselectedExamDefId}
          existingExamIds={studentsWithStats.find(s => s.id === selectedStudentId) 
             ? exams.filter(e => e.studentId === selectedStudentId).map(e => e.examId || '') 
             : []
          }
        />
      )}
      
      <StudentFormModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        classes={classes}
        editingStudent={editingStudent}
      />

      <BatchImportModal 
        isOpen={isBatchModalOpen} 
        onClose={() => setIsBatchModalOpen(false)} 
        onProcess={handleBatchImport} 
      />

      <InputModal 
        isOpen={inputModalConfig.isOpen}
        onClose={() => setInputModalConfig({ ...inputModalConfig, isOpen: false })}
        onSubmit={inputModalConfig.onSubmit}
        title={inputModalConfig.title}
        placeholder={inputModalConfig.placeholder}
        initialValue={inputModalConfig.initialValue}
        initialDate={inputModalConfig.initialDate}
        showDatePicker={inputModalConfig.showDatePicker}
      />

      <ConfirmModal 
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
      />
    </div>
  );
}

export default App;