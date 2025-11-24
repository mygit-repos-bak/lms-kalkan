import React from 'react';
import { SectionListView } from '../components/sections/SectionListView';
import { MoreHorizontal } from 'lucide-react';

export function OthersPage() {
  return (
    <SectionListView
      sectionId="others"
      sectionName="Others"
      icon={MoreHorizontal}
      color="text-purple-600"
    />
  );
}