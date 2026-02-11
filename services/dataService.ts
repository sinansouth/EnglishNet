
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Classroom, ExamResult, Student, ExamDefinition } from '../types';

// Collection References
const STUDENTS_COL = 'students';
const CLASSES_COL = 'classrooms';
const EXAMS_COL = 'examResults';
const DEFINITIONS_COL = 'examDefinitions';

// --- DATA FETCHING ---

export const fetchAllData = async () => {
  try {
    const [studentsSnap, classesSnap, examsSnap, defsSnap] = await Promise.all([
      getDocs(collection(db, STUDENTS_COL)),
      getDocs(collection(db, CLASSES_COL)),
      getDocs(collection(db, EXAMS_COL)),
      getDocs(collection(db, DEFINITIONS_COL))
    ]);

    const students = studentsSnap.docs.map(d => ({ ...d.data(), id: d.id })) as Student[];
    const classes = classesSnap.docs.map(d => ({ ...d.data(), id: d.id })) as Classroom[];
    const exams = examsSnap.docs.map(d => ({ ...d.data(), id: d.id })) as ExamResult[];
    const examDefinitions = defsSnap.docs.map(d => ({ ...d.data(), id: d.id })) as ExamDefinition[];

    return { students, classes, exams, examDefinitions };
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
    // Return empty arrays on error so app doesn't crash
    return { students: [], classes: [], exams: [], examDefinitions: [] };
  }
};

// --- STUDENTS ---

export const apiAddStudent = async (student: Student) => {
  const payload: Record<string, any> = {
    id: student.id,
    name: student.name,
    surname: student.surname,
    classroomId: student.classroomId
  };
  await setDoc(doc(db, STUDENTS_COL, student.id), payload);
};

export const apiUpdateStudent = async (student: Student) => {
  const payload: Record<string, any> = {
    name: student.name,
    surname: student.surname,
    classroomId: student.classroomId
  };
  await updateDoc(doc(db, STUDENTS_COL, student.id), payload);
};

export const apiDeleteStudent = async (id: string) => {
  await deleteDoc(doc(db, STUDENTS_COL, id));
};

export const apiDeleteMultipleStudents = async (ids: string[]) => {
  const batch = writeBatch(db);
  ids.forEach(id => {
    batch.delete(doc(db, STUDENTS_COL, id));
  });
  await batch.commit();
};

// --- CLASSES ---

export const apiAddClass = async (classroom: Classroom) => {
  await setDoc(doc(db, CLASSES_COL, classroom.id), { ...classroom });
};

export const apiUpdateClass = async (classroom: Classroom) => {
  await updateDoc(doc(db, CLASSES_COL, classroom.id), { ...classroom });
};

export const apiDeleteClass = async (id: string) => {
  await deleteDoc(doc(db, CLASSES_COL, id));
};

// --- EXAM RESULTS ---

export const apiAddExamResult = async (result: ExamResult) => {
  const payload = JSON.parse(JSON.stringify(result));
  await setDoc(doc(db, EXAMS_COL, result.id), payload);
};

export const apiUpdateExamResult = async (result: ExamResult) => {
  const payload = JSON.parse(JSON.stringify(result));
  await updateDoc(doc(db, EXAMS_COL, result.id), payload);
};

export const apiDeleteExamResult = async (id: string) => {
  await deleteDoc(doc(db, EXAMS_COL, id));
};

// --- EXAM DEFINITIONS ---

export const apiAddExamDefinition = async (def: ExamDefinition) => {
  await setDoc(doc(db, DEFINITIONS_COL, def.id), { ...def });
};

export const apiUpdateExamDefinition = async (def: ExamDefinition) => {
  await updateDoc(doc(db, DEFINITIONS_COL, def.id), { ...def });
};

export const apiDeleteExamDefinition = async (id: string) => {
  await deleteDoc(doc(db, DEFINITIONS_COL, id));
};

// --- UTILS ---

export const calculateNet = (correct: number, incorrect: number): number => {
  const net = correct - (incorrect * 0.33);
  return parseFloat(net.toFixed(2));
};
