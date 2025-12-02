/**
 * Haptic feedback utility for mobile devices
 * Uses the Vibration API available in modern mobile browsers
 */

/**
 * Trigger haptic feedback with a success pattern
 * Double vibration: short-long for a satisfying "done" feeling
 */
export const hapticSuccess = () => {
  if ('vibrate' in navigator) {
    // Pattern: vibrate 50ms, pause 100ms, vibrate 100ms
    navigator.vibrate([50, 100, 100]);
  }
};

/**
 * Trigger haptic feedback with an error pattern
 * Triple short vibrations for error indication
 */
export const hapticError = () => {
  if ('vibrate' in navigator) {
    // Pattern: three short vibrations
    navigator.vibrate([50, 50, 50, 50, 50]);
  }
};

/**
 * Trigger a light haptic feedback
 * Single short vibration for button presses or selection
 */
export const hapticLight = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(30);
  }
};

/**
 * Trigger a medium haptic feedback
 * Single medium vibration for notifications
 */
export const hapticMedium = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
};

/**
 * Check if vibration is supported on this device
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator;
};
