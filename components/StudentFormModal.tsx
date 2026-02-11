
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Student, Classroom } from '../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, 'id'> | Student) => void;
  classes: Classroom[];
  editingStudent?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ 
  isOpen, onClose, onSave, classes, editingStudent 
}) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [classroomId, setClassroomId] = useState('');

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name);
      setSurname(editingStudent.surname);
      setClassroomId(editingStudent.classroomId);
    } else {
      setName('');
      setSurname('');
      setClassroomId(classes.length > 0 ? classes[0].id : '');
    }
  }, [editingStudent, classes, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studentData = {
      name, 
      surname, 
      classroomId
    };

    if (editingStudent) {
      onSave({ ...editingStudent, ...studentData });
    } else {
      onSave(studentData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-700">
        <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-900 text-white">
          <h3 className="text-base font-semibold">
            {editingStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci'}
          </h3>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Ad</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Soyad</label>
              <input
                required
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"
              />
            </div>
          </div>

          <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Sınıf</label>
              <select
                required
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              {editingStudent ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
