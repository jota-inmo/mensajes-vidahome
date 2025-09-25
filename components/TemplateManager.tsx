import React, { useState, useRef, useEffect } from 'react';
import { MessageTemplate } from '../types';
import AIGenerator from './AIGenerator';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { PlusIcon, TrashIcon, ImageIcon, CloseIcon, SettingsIcon, EditIcon, SpanishFlagIcon, UKFlagIcon, FrenchFlagIcon, ItalianFlagIcon, PortugueseFlagIcon, GermanFlagIcon, RomanianFlagIcon, PolishFlagIcon, DutchFlagIcon, UkrainianFlagIcon, RussianFlagIcon, ChevronDownIcon } from './ui/Icons';

type Language = 'es' | 'en' | 'fr' | 'it' | 'pt' | 'de' | 'ro' | 'pl' | 'nl' | 'uk' | 'ru';

interface TemplateManagerProps {
  templates: MessageTemplate[];
  selectedTemplateId: string | null;
  onAddTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'language'>) => void;
  onUpdateTemplate: (id: string, template: Omit<MessageTemplate, 'id' | 'createdAt' | 'language'>) => void;
  onDeleteTemplate: (id: string) => void;
  onSelectTemplate: (id: string) => void;
  generateMessage: (prompt: string) => Promise<string>;
  stepNumber: number;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  isAdmin: boolean;
}

const languages: { code: Language; name: string; flag: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { code: 'es', name: 'Español', flag: SpanishFlagIcon },
  { code: 'en', name: 'English', flag: UKFlagIcon },
  { code: 'fr', name: 'Français', flag: FrenchFlagIcon },
  { code: 'it', name: 'Italiano', flag: ItalianFlagIcon },
  { code: 'pt', name: 'Português', flag: PortugueseFlagIcon },
  { code: 'de', name: 'Deutsch', flag: GermanFlagIcon },
  { code: 'ro', name: 'Română', flag: RomanianFlagIcon },
  { code: 'pl', name: 'Polski', flag: PolishFlagIcon },
  { code: 'nl', name: 'Nederlands', flag: DutchFlagIcon },
  { code: 'uk', name: 'Українська', flag: UkrainianFlagIcon },
  { code: 'ru', name: 'Русский', flag: RussianFlagIcon },
];

const LanguageSelector: React.FC<{
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}> = ({ currentLanguage, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const CurrentFlag = languages.find(l => l.code === currentLanguage)?.flag || SpanishFlagIcon;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        <CurrentFlag className="w-5 h-5 rounded-sm" />
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10">
          {languages.map(({ code, name, flag: Flag }) => (
            <button
              key={code}
              onClick={() => {
                onLanguageChange(code);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-3 hover:bg-slate-600 first:rounded-t-md last:rounded-b-md"
            >
              <Flag className="w-5 h-5 rounded-sm" />
              <span className="text-slate-200">{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  selectedTemplateId,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onSelectTemplate,
  generateMessage,
  stepNumber,
  currentLanguage,
  onLanguageChange,
  isAdmin,
}) => {
  // Modal states
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Form field states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open the form modal for creating a new template
  const handleCreate = () => {
    setEditingTemplate(null);
    setIsFormModalOpen(true);
  };

  // Open the form modal for editing an existing template
  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setIsFormModalOpen(true);
  };

  // Populate form fields when form opens or editingTemplate changes
  useEffect(() => {
    if (isFormModalOpen) {
      if (editingTemplate) {
        setTitle(editingTemplate.title);
        setCategory(editingTemplate.category);
        setContent(editingTemplate.content);
        setImage(editingTemplate.imageUrl);
      } else {
        setTitle('');
        setCategory('');
        setContent('');
        setImage(null);
      }
    }
  }, [isFormModalOpen, editingTemplate]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && category && content) {
      const templateData = { title, category, content, imageUrl: image };
      if (editingTemplate) {
        onUpdateTemplate(editingTemplate.id, templateData);
      } else {
        onAddTemplate(templateData);
      }
      setIsFormModalOpen(false);
    }
  };
  
  // Handle AI generation
  const handleAIGenerated = (generatedContent: string) => {
    setContent(generatedContent);
    setShowAIGenerator(false);
  };
  
  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, selecciona un archivo PNG o JPG.');
    }
  };

  return (
    <div>
      {/* AI Generator Modal (attached to the form) */}
      {showAIGenerator && (
         <AIGenerator
            onGenerate={generateMessage}
            onContentGenerated={handleAIGenerated}
            onClose={() => setShowAIGenerator(false)}
        />
      )}

      {/* Form Modal (for creating and editing) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setIsFormModalOpen(false)}>
            <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-white">{editingTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</h2>
                        <button onClick={() => setIsFormModalOpen(false)} className="-mt-2 -mr-2 p-2 rounded-full text-slate-400 hover:bg-slate-700">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title-modal" className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                            <Input id="title-modal" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Seguimiento Post-Conferencia" required />
                        </div>
                        <div>
                            <label htmlFor="category-modal" className="block text-sm font-medium text-slate-400 mb-1">Categoría</label>
                            <Input id="category-modal" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Networking" required />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="content-modal" className="block text-sm font-medium text-slate-400">Contenido</label>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setShowAIGenerator(true)}>
                                ✨ Generar con IA
                                </Button>
                            </div>
                            <Textarea
                                id="content-modal"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Escribe la plantilla de tu mensaje aquí..."
                                rows={4}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Tarjeta de Visita (Opcional)</label>
                            {image ? (
                                <div className="relative group">
                                    <img src={image} alt="Vista previa de tarjeta" className="rounded-lg w-full object-contain max-h-48 border border-slate-600"/>
                                    <button type="button" onClick={() => setImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CloseIcon className="h-4 w-4"/>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                                        <ImageIcon className="h-5 w-5 mr-2" />
                                        Adjuntar Tarjeta de Visita
                                    </Button>
                                </>
                            )}
                        </div>
                        <Button type="submit" className="w-full">
                            {editingTemplate ? 'Guardar Cambios' : <><PlusIcon className="h-5 w-5 mr-2" />Añadir Plantilla</>}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Management Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4" onClick={() => setIsManageModalOpen(false)}>
            <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Gestionar Plantillas</h2>
                        <button onClick={() => setIsManageModalOpen(false)} className="-mt-2 -mr-2 p-2 rounded-full text-slate-400 hover:bg-slate-700">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <Button onClick={handleCreate} className="w-full mb-4">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Crear Nueva Plantilla
                    </Button>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                      {templates.length > 0 ? templates.map(template => (
                        <div key={template.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-700/50">
                          <div>
                            <p className="font-semibold text-white">{template.title}</p>
                            <p className="text-sm text-slate-400">{template.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                              <EditIcon className="h-4 w-4 mr-1"/> Editar
                            </Button>
                            <Button size="sm" variant="ghost" className="!text-red-400 hover:!bg-red-500/20" onClick={() => onDeleteTemplate(template.id)}>
                              <TrashIcon className="h-4 w-4"/>
                            </Button>
                          </div>
                        </div>
                      )) : <p className="text-slate-500 text-center py-4">No hay plantillas guardadas.</p>}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Selection Card (in the left column) */}
      <Card>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Paso {stepNumber}: Elige una Plantilla</h2>
            <div className="flex items-center gap-2">
              <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => setIsManageModalOpen(true)} aria-label="Gestionar plantillas">
                    <SettingsIcon className="w-5 h-5"/>
                </Button>
              )}
            </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {templates.length > 0 ? (
                templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => onSelectTemplate(template.id)}
                      className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                        selectedTemplateId === template.id
                          ? 'bg-emerald-500/20 ring-1 ring-emerald-400'
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                         {template.imageUrl && <ImageIcon className="h-5 w-5 text-slate-400" />}
                         <div>
                            <p className="font-semibold text-white">{template.title}</p>
                            <p className="text-sm text-slate-400">{template.category}</p>
                        </div>
                      </div>
                    </div>
                ))
            ) : (
                <p className="text-slate-500 text-center py-4">No hay plantillas para este idioma. ¡Crea una!</p>
            )}
        </div>
      </Card>
    </div>
  );
};

export default TemplateManager;
