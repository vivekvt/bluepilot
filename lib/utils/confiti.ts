import confetti from 'canvas-confetti';

export const showConfetti = () => {
  const end = Date.now() + 5 * 1000; // 3 seconds
  const colors = [
    '#2196f3', // blue
    '#ff4c4c', // bright red
    '#ffeb3b', // yellow
    '#9c27b0', // purple
  ];

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });

    requestAnimationFrame(frame);
  };

  frame();
};
