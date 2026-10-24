for (const hero of document.querySelectorAll<HTMLElement>('.hero')) {
  const slides = [...hero.querySelectorAll<HTMLElement>('.slide')];
  const dots = [...hero.querySelectorAll<HTMLButtonElement>('[data-slide]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0, timer: ReturnType<typeof setTimeout> | undefined;
  let hovered = false, touching = false, suppressClickUntil = 0;
  const stop = () => { clearTimeout(timer); timer = undefined; };
  const schedule = () => {
    stop();
    if (reduced.matches || hovered || touching || document.hidden || hero.contains(document.activeElement)) return;
    timer = setTimeout(() => show(active + 1), Number(hero.dataset.interval) || 7000);
  };
  function show(index: number) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== active; });
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === active)));
    schedule();
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  hero.querySelectorAll<HTMLElement>('[data-step]').forEach(button => button.addEventListener('click', () => {
    if (Date.now() >= suppressClickUntil) show(active + Number(button.dataset.step));
  }));
  hero.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; stop(); } });
  hero.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; schedule(); } });
  hero.addEventListener('focusin', stop);
  hero.addEventListener('focusout', () => queueMicrotask(schedule));
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  for (const media of hero.querySelectorAll<HTMLElement>('.hero-media')) {
    let start: { x: number; y: number; id: number } | undefined;
    media.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' || !event.isPrimary) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      touching = true; stop();
    });
    media.addEventListener('pointerup', event => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      start = undefined; touching = false;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        suppressClickUntil = Date.now() + 500;
        show(active + (dx < 0 ? 1 : -1));
      } else schedule();
    });
    media.addEventListener('pointercancel', () => { start = undefined; touching = false; schedule(); });
  }
  schedule();
}
