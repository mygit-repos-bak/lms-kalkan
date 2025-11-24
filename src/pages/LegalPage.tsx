import React from 'react';
import { SectionListView } from '../components/sections/SectionListView';
import { Scale } from 'lucide-react';

export function LegalPage() {
  return (
    <SectionListView
      sectionId="legal"
      sectionName="Legal Fights"
      icon={Scale}
      color="text-red-600"
    />
  );
}