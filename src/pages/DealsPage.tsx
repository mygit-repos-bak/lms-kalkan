import React from 'react';
import { SectionListView } from '../components/sections/SectionListView';
import { Handshake } from 'lucide-react';

export function DealsPage() {
  return (
    <SectionListView
      sectionId="deals"
      sectionName="Business Deals"
      icon={Handshake}
      color="text-green-600"
    />
  );
}