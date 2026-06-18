import React from 'react';
import HealthScreenFemale from './HealthScreenFemale';
import HealthScreenMale from './HealthScreenMale';

// ─── Health Screen Wrapper ───────────────────────────────────────────────────
// This wrapper selects between the Female and Male health screen variants.
// Currently defaults to 'female' since user profiles are not yet implemented.
// Once profile setup is built, this will read the user's gender from their
// profile and display the appropriate screen automatically.

type Gender = 'female' | 'male';

// TODO: Replace with actual user profile gender when profile setup is implemented
const USER_GENDER: Gender = 'male';

export default function HealthScreen({
  onProfilePress,
  onNotificationsPress,
}: {
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
}) {
  if (USER_GENDER === 'male') {
    return (
      <HealthScreenMale
        onProfilePress={onProfilePress}
        onNotificationsPress={onNotificationsPress}
      />
    );
  }

  return (
    <HealthScreenFemale
      onProfilePress={onProfilePress}
      onNotificationsPress={onNotificationsPress}
    />
  );
}
