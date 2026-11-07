import React from 'react';

export interface HeaderProps {
  currentScreen?: string;
  setCurrentScreen?: (screen: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

export default function Header({ 
  currentScreen = 'pdv', 
  setCurrentScreen,
  activeTab,
  setActiveTab
}: HeaderProps) {
  return (
    <header className="flex justify-between items-center p-4 bg-[#131313] border-b border-white/10">
      <h1 className="text-lg font-bold text-white">Sistema Masakula</h1>
    </header>
  );
}

export { Header };
