import React from 'react';
import { SectionListView } from '../components/sections/SectionListView';
import { Building } from 'lucide-react';

export function RealEstatePage() {
  return (
    <SectionListView
      sectionId="real-estate"
      sectionName="Real Estate"
      icon={Building}
      color="text-blue-600"
    />
  );
}