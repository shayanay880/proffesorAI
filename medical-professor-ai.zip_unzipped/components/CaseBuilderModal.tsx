
import React, { useState } from 'react';

interface CaseBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

interface CaseData {
  isPediatric: boolean;
  age: string;
  sex: 'Male' | 'Female' | 'Other' | '';
  setting: 'ED' | 'Ward' | 'Clinic' | 'Pre-hospital' | '';
  cc: string;
  hpi: string;
  pmh: string;
  meds: string;
  allergies: string;
  vitals: {
    bp: string;
    hr: string;
    rr: string;
    temp: string;
    spo2: string;
  };
  exam: string;
  labs: string;
  imaging: string;
  assessment: string;
  notes: string;
}

const INITIAL_DATA: CaseData = {
  isPediatric: false,
  age: '',
  sex: '',
  setting: 'ED',
  cc: '',
  hpi: '',
  pmh: '',
  meds: '',
  allergies: '',
  vitals: { bp: '', hr: '', rr: '', temp: '', spo2: '' },
  exam: '',
  labs: '',
  imaging: '',
  assessment: '',
  notes: ''
};

// Moved outside CaseBuilderModal for better performance and to fix typing issues with children prop in React 18+
const InputRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

export const CaseBuilderModal: React.FC<CaseBuilderModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [data, setData] = useState<CaseData>(INITIAL_DATA);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof CaseData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleVitalChange = (vital: keyof CaseData['vitals'], value: string) => {
    setData(prev => ({
      ...prev,
      vitals: { ...prev.vitals, [vital]: value }
    }));
  };

  const generatePrompt = () => {
    const parts = [];

    // Demographics
    const ageStr = data.age ? `${data.age}-year-old` : 'Unknown age';
    const sexStr = data.sex || 'patient';
    const pedsStr = data.isPediatric ? '(Pediatric)' : '';
    const settingStr = data.setting ? `presenting to **${data.setting}**` : '';
    
    parts.push(`**Patient Case:** ${ageStr} ${sexStr} ${pedsStr} ${settingStr}`);

    if (data.cc) parts.push(`**Chief Complaint:** ${data.cc}`);
    if (data.hpi) parts.push(`**HPI:**\n${data.hpi}`);
    
    // Context
    const context = [];
    if (data.pmh) context.push(`PMH/PSH: ${data.pmh}`);
    if (data.meds) context.push(`Meds: ${data.meds}`);
    if (data.allergies) context.push(`Allergies: ${data.allergies}`);
    if (context.length > 0) parts.push(`**History:**\n${context.join('\n')}`);

    // Vitals
    const v = data.vitals;
    const vitalsList = [];
    if (v.bp) vitalsList.push(`BP: ${v.bp}`);
    if (v.hr) vitalsList.push(`HR: ${v.hr}`);
    if (v.rr) vitalsList.push(`RR: ${v.rr}`);
    if (v.temp) vitalsList.push(`T: ${v.temp}`);
    if (v.spo2) vitalsList.push(`SpO2: ${v.spo2}`);
    
    if (vitalsList.length > 0) parts.push(`**Vitals:** ${vitalsList.join(' | ')}`);

    // Objective
    if (data.exam) parts.push(`**Physical Exam:**\n${data.exam}`);
    if (data.labs) parts.push(`**Labs:**\n${data.labs}`);
    if (data.imaging) parts.push(`**Imaging:**\n${data.imaging}`);

    // Synthesis
    if (data.assessment) parts.push(`**Assessment/Concern:**\n${data.assessment}`);
    if (data.notes) parts.push(`**Special Notes:**\n${data.notes}`);

    parts.push('\nPlease answer according to the current Mode (ED/Study/Exam).');

    return parts.join('\n\n');
  };

  const handleInsert = () => {
    onInsert(generatePrompt());
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800">Case Builder</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="md:col-span-2">
               <label className="block text-xs font-semibold text-gray-500 uppercase">Age</label>
               <input 
                 type="number" 
                 className="w-full mt-1 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                 value={data.age}
                 onChange={(e) => handleChange('age', e.target.value)}
                 placeholder="yr"
               />
            </div>
            <div className="md:col-span-3">
               <label className="block text-xs font-semibold text-gray-500 uppercase">Sex</label>
               <select 
                 className="w-full mt-1 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                 value={data.sex}
                 onChange={(e) => handleChange('sex', e.target.value)}
               >
                 <option value="">Select...</option>
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
                 <option value="Other">Other</option>
               </select>
            </div>
            <div className="md:col-span-4">
               <label className="block text-xs font-semibold text-gray-500 uppercase">Setting</label>
               <select 
                 className="w-full mt-1 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                 value={data.setting}
                 onChange={(e) => handleChange('setting', e.target.value)}
               >
                 <option value="ED">Emergency Dept</option>
                 <option value="Ward">Inpatient Ward</option>
                 <option value="Clinic">Outpatient Clinic</option>
                 <option value="Pre-hospital">Pre-hospital / EMS</option>
               </select>
            </div>
            <div className="md:col-span-3 flex items-end pb-2">
                <label className="inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-blue-600 rounded"
                        checked={data.isPediatric}
                        onChange={(e) => handleChange('isPediatric', e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-700">Pediatric</span>
                </label>
            </div>
          </div>

          <InputRow label="Chief Complaint">
            <input 
                type="text" 
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                value={data.cc}
                onChange={(e) => handleChange('cc', e.target.value)}
                placeholder="e.g. Chest pain, onset 2 hours ago"
            />
          </InputRow>

          <InputRow label="History of Present Illness (HPI)">
            <textarea 
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                value={data.hpi}
                onChange={(e) => handleChange('hpi', e.target.value)}
                placeholder="Describe the symptoms, timeline, and associated factors..."
            />
          </InputRow>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Vitals</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                <input type="text" placeholder="BP (120/80)" className="border p-2 rounded text-sm" value={data.vitals.bp} onChange={e => handleVitalChange('bp', e.target.value)} />
                <input type="text" placeholder="HR (bpm)" className="border p-2 rounded text-sm" value={data.vitals.hr} onChange={e => handleVitalChange('hr', e.target.value)} />
                <input type="text" placeholder="RR (min)" className="border p-2 rounded text-sm" value={data.vitals.rr} onChange={e => handleVitalChange('rr', e.target.value)} />
                <input type="text" placeholder="Temp (°C)" className="border p-2 rounded text-sm" value={data.vitals.temp} onChange={e => handleVitalChange('temp', e.target.value)} />
                <input type="text" placeholder="SpO2 (%)" className="border p-2 rounded text-sm" value={data.vitals.spo2} onChange={e => handleVitalChange('spo2', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputRow label="PMH / PSH">
                <textarea rows={2} className="w-full border p-2 rounded text-sm" value={data.pmh} onChange={e => handleChange('pmh', e.target.value)} placeholder="Past medical/surgical history..." />
            </InputRow>
            <InputRow label="Meds & Allergies">
                <textarea rows={2} className="w-full border p-2 rounded text-sm" value={data.meds} onChange={e => handleChange('meds', e.target.value)} placeholder="Current meds, NKDA..." />
            </InputRow>
          </div>

          <InputRow label="Physical Exam">
            <textarea rows={2} className="w-full border p-2 rounded text-sm" value={data.exam} onChange={e => handleChange('exam', e.target.value)} placeholder="Key positive/negative findings..." />
          </InputRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputRow label="Labs">
                <textarea rows={2} className="w-full border p-2 rounded text-sm" value={data.labs} onChange={e => handleChange('labs', e.target.value)} placeholder="CBC, BMP, Trop, etc..." />
            </InputRow>
            <InputRow label="Imaging">
                <textarea rows={2} className="w-full border p-2 rounded text-sm" value={data.imaging} onChange={e => handleChange('imaging', e.target.value)} placeholder="CXR, CT, US..." />
            </InputRow>
          </div>

          <InputRow label="Assessment Concern / Question">
            <textarea rows={2} className="w-full border p-2 rounded text-sm bg-blue-50 border-blue-200" value={data.assessment} onChange={e => handleChange('assessment', e.target.value)} placeholder="e.g. Rule out PE? Antibiotic choice? Disposition?" />
          </InputRow>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button 
            onClick={handleCopy}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button 
            onClick={handleInsert}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold"
          >
            Insert into Chat
          </button>
        </div>
      </div>
    </div>
  );
};
