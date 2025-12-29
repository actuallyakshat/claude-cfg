import React, { useState, useRef } from 'react';
import { Box } from 'ink';
import { MainMenu } from './components/MainMenu.js';
import { AddConfig } from './components/AddConfig.js';
import { ConfigList } from './components/ConfigList.js';
import { ConfigDetail } from './components/ConfigDetail.js';
import { StatusView } from './components/StatusView.js';
import { SwitchConfig } from './components/SwitchConfig.js';
import type { Screen, AppState } from './types/index.js';

interface AppProps {
  onExit: () => void;
}

export function App({ onExit }: AppProps): React.ReactElement {
  const [state, setState] = useState<AppState>({
    screen: 'main-menu',
  });
  const addConfigKeyRef = useRef(0);

  const navigate = (screen: Screen, selectedConfigId?: string) => {
    if (screen === 'add-config') {
      addConfigKeyRef.current += 1;
    }
    setState({ screen, selectedConfigId });
  };

  const goToMainMenu = () => {
    setState({ screen: 'main-menu' });
  };

  switch (state.screen) {
    case 'main-menu':
      return (
        <MainMenu
          onNavigate={navigate}
          onExit={onExit}
        />
      );

    case 'add-config':
      return (
        <AddConfig
          key={addConfigKeyRef.current}
          onBack={goToMainMenu}
          onComplete={goToMainMenu}
        />
      );

    case 'config-list':
      return (
        <ConfigList
          onBack={goToMainMenu}
          onSelectConfig={(configId) => navigate('config-detail', configId)}
        />
      );

    case 'config-detail':
      return (
        <ConfigDetail
          configId={state.selectedConfigId!}
          onBack={() => navigate('config-list')}
        />
      );

    case 'status':
      return (
        <StatusView
          onBack={goToMainMenu}
        />
      );

    case 'switch-config':
      return (
        <SwitchConfig
          onBack={goToMainMenu}
        />
      );

    default:
      return (
        <Box>
          <MainMenu onNavigate={navigate} onExit={onExit} />
        </Box>
      );
  }
}
