import React, { useEffect, useRef } from 'react';
import { useClearSoundMutation } from '../helpers/playerQueries';

interface SoundPlayerProps {
  soundId: string | null;
  gameCode: string;
}

export const SoundPlayer: React.FC<SoundPlayerProps> = ({ soundId, gameCode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clearSoundMutation = useClearSoundMutation();

  useEffect(() => {
    if (soundId) {
      const soundFile = `/sounds/${soundId}.mp3`; // Assuming sounds are in public/sounds
      if (audioRef.current) {
        audioRef.current.src = soundFile;
        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
        clearSoundMutation.mutate({ gameCode });
      }
    }
  }, [soundId, gameCode, clearSoundMutation]);

  return <audio ref={audioRef} />;
};