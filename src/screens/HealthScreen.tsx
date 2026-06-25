import React from 'react';
import HealthScreenFemale from './HealthScreenFemale';
import HealthScreenMale from './HealthScreenMale';
import { useAuth } from '../providers/AuthProvider';

// ─── Health Screen Wrapper ───────────────────────────────────────────────────
// This wrapper selects between the Female and Male health screen variants.
// Reads the user's gender from the cached profile in AuthProvider (fetched once on login).

export default function HealthScreen({
  onProfilePress,
  onNotificationsPress,
}: {
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
}) {
  const { gender } = useAuth();

  if (gender === 'female') {
    return (
      <HealthScreenFemale
        onProfilePress={onProfilePress}
        onNotificationsPress={onNotificationsPress}
      />
    );
  }

  return (
    <HealthScreenMale
      onProfilePress={onProfilePress}
      onNotificationsPress={onNotificationsPress}
    />
  );
}
