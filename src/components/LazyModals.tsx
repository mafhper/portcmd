import React, { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SavedProject } from '../types';

const SettingsModal = lazy(() => import('./SettingsModal'));
const ConsoleModal = lazy(() => import('./ConsoleModal'));

interface LazyModalsProps {
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  selectedProjectLogs: SavedProject | null;
  onCloseConsole: () => void;
}

const LazyModals: React.FC<LazyModalsProps> = ({
  isSettingsOpen,
  onCloseSettings,
  selectedProjectLogs,
  onCloseConsole
}) => {
  return (
    <AnimatePresence>
      <Suspense fallback={null}>
        {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={onCloseSettings} />}
        {selectedProjectLogs && <ConsoleModal project={selectedProjectLogs} onClose={onCloseConsole} />}
      </Suspense>
    </AnimatePresence>
  );
};

export default LazyModals;
