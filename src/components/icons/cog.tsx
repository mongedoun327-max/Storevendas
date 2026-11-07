import React from 'react';
import { Cog as LucideCog, Settings, LucideProps } from 'lucide-react';

export const Cog: React.FC<LucideProps> = (props) => <LucideCog {...props} />;
export const CogIcon: React.FC<LucideProps> = (props) => <LucideCog {...props} />;
export const SettingsIcon: React.FC<LucideProps> = (props) => <Settings {...props} />;
export default Cog;
