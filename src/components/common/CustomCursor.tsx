import { useEffect, useRef, useState } from 'react';

const finePointerQuery = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const followerRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(finePointerQuery);
    const updateEnabled = () => setEnabled(mediaQuery.matches);

    updateEnabled();
    mediaQuery.addEventListener('change', updateEnabled);
    return () => mediaQuery.removeEventListener('change', updateEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    root.classList.add('jalsetu-custom-cursor-enabled');
    let targetX = 0;
    let targetY = 0;
    let followerX = 0;
    let followerY = 0;
    let lastFrameTime = 0;
    let animationFrameId: number | null = null;
    let hasPointerPosition = false;

    const positionAt = (x: number, y: number) =>
      `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

    const animateFollower = (timestamp: number) => {
      animationFrameId = null;
      if (!root.classList.contains('jalsetu-custom-cursor-visible') || !followerRef.current) return;

      const elapsed = lastFrameTime ? Math.min(timestamp - lastFrameTime, 48) : 16;
      lastFrameTime = timestamp;
      const easing = 1 - Math.exp(-elapsed / 36);
      followerX += (targetX - followerX) * easing;
      followerY += (targetY - followerY) * easing;
      followerRef.current.style.transform = positionAt(followerX, followerY);

      if (Math.abs(targetX - followerX) > 0.1 || Math.abs(targetY - followerY) > 0.1) {
        animationFrameId = window.requestAnimationFrame(animateFollower);
      } else {
        lastFrameTime = 0;
      }
    };

    const scheduleFollower = () => {
      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(animateFollower);
      }
    };

    const hideCursor = () => {
      root.classList.remove(
        'jalsetu-custom-cursor-visible',
        'jalsetu-custom-cursor-interactive',
        'jalsetu-custom-cursor-text',
        'jalsetu-custom-cursor-pressed',
      );
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      lastFrameTime = 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        hideCursor();
        return;
      }

      targetX = event.clientX;
      targetY = event.clientY;
      if (dotRef.current) dotRef.current.style.transform = positionAt(targetX, targetY);
      if (!hasPointerPosition) {
        followerX = targetX;
        followerY = targetY;
        hasPointerPosition = true;
        if (followerRef.current) followerRef.current.style.transform = positionAt(followerX, followerY);
      }

      const target = event.target instanceof Element ? event.target : null;
      const isTextField = Boolean(
        target?.closest('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'),
      );
      const isInteractive = Boolean(
        target?.closest('a, button:not(:disabled), [role="button"], [data-cursor="interactive"], .cursor-pointer, article, input[type="checkbox"], input[type="radio"], input[type="range"], select, summary, label'),
      );

      root.classList.add('jalsetu-custom-cursor-visible');
      root.classList.toggle('jalsetu-custom-cursor-text', isTextField);
      root.classList.toggle('jalsetu-custom-cursor-interactive', isInteractive && !isTextField);
      if (!isTextField) scheduleFollower();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') root.classList.add('jalsetu-custom-cursor-pressed');
    };
    const handlePointerUp = () => root.classList.remove('jalsetu-custom-cursor-pressed');
    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) hideCursor();
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('pointercancel', handlePointerUp, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    window.addEventListener('blur', hideCursor);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      document.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('blur', hideCursor);
      root.classList.remove('jalsetu-custom-cursor-enabled');
      hideCursor();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <span ref={followerRef} className="jalsetu-cursor-follower" aria-hidden="true" />
      <span ref={dotRef} className="jalsetu-cursor-dot" aria-hidden="true" />
    </>
  );
}