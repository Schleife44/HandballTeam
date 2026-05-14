import React from 'react';
import { AnimatePresence } from 'framer-motion';
import ActionOverlay from './ActionOverlay';
import OpponentSelectionOverlay from './OpponentSelectionOverlay';
import SevenMeterShooterOverlay from './SevenMeterShooterOverlay';
import SevenMeterResultOverlay from './SevenMeterResultOverlay';
import ShotDetailsModal from './ShotDetailsModal';

const ActionOverlayManager = ({ 
  selectedPlayer, setSelectedPlayer,
  sevenMeterFlow, setSevenMeterFlow,
  foulFlow, setFoulFlow,
  activeShotAction, setActiveShotAction,
  handleAction,
  handle7mOpponentSelected,
  handleFoulOpponentSelected,
  home, away, squad, squadSettings
}) => {
  return (
    <AnimatePresence>
      {selectedPlayer && (
        <ActionOverlay 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
          onAction={handleAction} 
        />
      )}
      
      {sevenMeterFlow?.step === 'opponent' && (
        <OpponentSelectionOverlay 
          players={sevenMeterFlow.earner.team === 'home' ? away : home}
          title="Wer hat das Foul begangen?"
          subtitle="Gegenspieler auswählen"
          onSelect={handle7mOpponentSelected}
          onCancel={() => setSevenMeterFlow(null)}
        />
      )}

      {foulFlow?.step === 'opponent' && (
        <OpponentSelectionOverlay 
          players={foulFlow.earner.team === 'home' ? away : home}
          title="Wer hat die Strafe bekommen?"
          subtitle="Gegenspieler auswählen"
          onSelect={handleFoulOpponentSelected}
          onCancel={() => setFoulFlow(null)}
        />
      )}

      {sevenMeterFlow?.step === 'shooter' && (
        <SevenMeterShooterOverlay 
          players={squad[sevenMeterFlow.earner.team] || []}
          onSelect={(player) => setSevenMeterFlow({ ...sevenMeterFlow, shooter: player, step: 'result' })}
          onCancel={() => setSevenMeterFlow(null)}
        />
      )}

      {sevenMeterFlow?.step === 'result' && (
        <SevenMeterResultOverlay 
          shooter={sevenMeterFlow.shooter} 
          onResult={(res) => handleAction(res)}
          onCancel={() => setSevenMeterFlow(null)}
        />
      )}

      {activeShotAction && (
        <ShotDetailsModal 
          player={activeShotAction.player} 
          action={activeShotAction.actionId} 
          squad={squad}
          onSave={(data) => handleAction(activeShotAction.actionId, data)}
          onCancel={() => setActiveShotAction(null)}
          isZoneMode={squadSettings.isZoneMode}
          isSevenMeter={activeShotAction.actionId.startsWith('7M')}
        />
      )}
    </AnimatePresence>
  );
};

export default ActionOverlayManager;
