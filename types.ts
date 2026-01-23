
export interface Classroom {
  id: string;
  name: string;
}

export interface ExamDefinition {
  id: string;
  name: string;
  date: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examId?: string; // Reference to ExamDefinition
  examName: string; // Kept for display/legacy
  date: string;
  correct: number;
  incorrect: number;
  empty: number;
  net: number;
  status?: 'ATTENDED' | 'MISSING'; // New field
}

export interface Student {
  id: string;
  name: string;
  surname: string;
  classroomId: string;
  targetCorrect?: number; // Changed from targetNet
}

export interface StudentWithStats extends Student {
  averageNet: number;
  averageCorrect: number; // Added for convenience
  averageIncorrect: number; // Added for sorting
  examCount: number;
  lastNet: number;
  lastResult?: ExamResult | null;
  previousResult?: ExamResult;
}

export type ViewState = 'DASHBOARD' | 'STUDENTS' | 'CLASSES' | 'CLASS_DETAIL' | 'STUDENT_DETAIL' | 'EXAMS' | 'EXAM_DETAIL' | 'RESULTS';
