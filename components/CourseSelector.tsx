
import React, { useState, useRef, useEffect } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { CheckIcon, CloseIcon } from './Icons';

const CourseSelector: React.FC = () => {
  const { knowledgeBases, selectedCourseNames, setSelectedCourseNames } = useKnowledgeBase();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleCourse = (courseName: string) => {
    setSelectedCourseNames(prev =>
      prev.includes(courseName)
        ? prev.filter(name => name !== courseName)
        : [...prev, courseName]
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="text-xs text-blue-600 hover:underline">
        {selectedCourseNames.length} curso(s) seleccionado(s)
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
          <div className="flex items-center justify-between p-2 text-sm font-semibold text-gray-700 border-b">
            <span>Seleccionar cursos</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
              aria-label="Cerrar selector de cursos"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
          <ul className="py-1 max-h-40 overflow-y-auto">
            {knowledgeBases.map(kb => (
              <li key={kb.id}>
                <label className="flex items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCourseNames.includes(kb.course)}
                    onChange={() => handleToggleCourse(kb.course)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 mr-3 border-2 rounded flex-shrink-0 flex items-center justify-center ${selectedCourseNames.includes(kb.course) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                    {selectedCourseNames.includes(kb.course) && <CheckIcon className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{kb.course}</span>
                </label>
              </li>
            ))}
             {knowledgeBases.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">No hay cursos disponibles.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CourseSelector;
