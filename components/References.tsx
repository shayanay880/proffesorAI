import React from 'react';
import { Reference } from '../types';

interface ReferencesProps {
    references: Reference[];
}

export const References: React.FC<ReferencesProps> = ({ references }) => {
    return (
        <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">References</h4>
            <ul className="space-y-2">
                {references.map((ref, index) => (
                    <li key={index} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <a 
                            href={ref.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 text-xs hover:underline break-all"
                            title={ref.title}
                        >
                            <bdi dir="ltr" className="bdi-isolate">{ref.title || new URL(ref.uri).hostname}</bdi>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}