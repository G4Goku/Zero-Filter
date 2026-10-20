(() => {
  const root = document.documentElement;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopMotion = window.matchMedia(
    "(min-width: 901px) and (hover: hover) and (pointer: fine)",
  );
  const revealGroups = [
    [".about__intro, .about__vision, .about__approach", "rise", 70],
    [".why-choose-us__heading", "rise", 0],
    [".why-choose-us__item", "rise", 60],
    [".why-choose-us__art, .featured-stories__arch", "draw", 0],
    [".featured-stories__heading", "rise", 0],
    [".featured-stories__photo", "photo", 60],
    [".terms-and-conditions__banner", "media", 0],
    [".terms-and-conditions__eyebrow, .terms-and-conditions__title", "rise", 80],
    [".terms-and-conditions__rule", "line", 0],
    [".terms-and-conditions__item", "rise", 45],
    [".site-footer__brand, .site-footer__link", "rise", 35],
  ];
  const revealTargets = [];
  let revealObserver;
  let effectObserver;
  let animationFrame = 0;
  let previousFrameTime = 0;
  let geometryChanged = true;
  let effectsEnabled = false;

  revealGroups.forEach(([selector, type, stagger]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.dataset.motion = type;
      element.style.setProperty("--motion-delay", `${(index % 3) * stagger}ms`);
      revealTargets.push(element);
    });
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const centeredProgress = (rect) => clamp(
    (window.innerHeight - rect.top * 2 - rect.height) /
      (window.innerHeight + rect.height),
    -1,
    1,
  );
  const effects = [
    [".hero", ".hero__media", "--hero-media-y", (rect) =>
      clamp(-rect.top * 0.12, 0, Math.min(rect.height * 0.08, 84))],
    [".hero", ".hero__content", "--hero-content-y", (rect) =>
      -clamp(-rect.top * 0.045, 0, 24)],
    [".about", ".about", "--about-media-y", (rect) => centeredProgress(rect) * 26],
    [".why-choose-us", ".why-choose-us__art", "--ornament-y", (rect) =>
      centeredProgress(rect) * 12],
    [".featured-stories", ".featured-stories__arch", "--ornament-y", (rect) =>
      centeredProgress(rect) * 14],
    [".terms-and-conditions__banner", ".terms-and-conditions__banner", "--terms-media-y", (rect) =>
      centeredProgress(rect) * 12],
  ].map(([trigger, selector, property, measure]) => ({
    trigger: document.querySelector(trigger),
    element: document.querySelector(selector),
    property,
    measure,
    current: null,
    target: 0,
  })).filter(({ trigger, element }) => trigger && element);
  const activeEffects = new Set();

  function reveal(element) {
    element.classList.add("is-revealed");
    revealObserver?.unobserve(element);
  }

  function updateEffects(time) {
    animationFrame = 0;
    if (!effectsEnabled || document.hidden) return;

    // Read layout together, then update the transforms without changing layout.
    if (geometryChanged) {
      const measurements = new Map();
      activeEffects.forEach(({ trigger }) => {
        if (!measurements.has(trigger)) {
          measurements.set(trigger, trigger.getBoundingClientRect());
        }
      });
      activeEffects.forEach((effect) => {
        effect.target = effect.measure(measurements.get(effect.trigger));
      });
      geometryChanged = false;
    }

    const elapsed = previousFrameTime ? Math.min(time - previousFrameTime, 64) : 16;
    const blend = 1 - Math.exp(-elapsed / 90);
    let settling = false;
    activeEffects.forEach((effect) => {
      effect.current ??= effect.target;
      effect.current += (effect.target - effect.current) * blend;
      if (Math.abs(effect.target - effect.current) > 0.05) settling = true;
      else effect.current = effect.target;
      effect.element.style.setProperty(effect.property, `${effect.current.toFixed(2)}px`);
    });
    previousFrameTime = time;
    if (settling) animationFrame = requestAnimationFrame(updateEffects);
    else previousFrameTime = 0;
  }

  function scheduleEffects() {
    geometryChanged = true;
    if (effectsEnabled && !document.hidden && !animationFrame) {
      animationFrame = requestAnimationFrame(updateEffects);
    }
  }

  function syncEffects() {
    effectObserver?.disconnect();
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    previousFrameTime = 0;
    activeEffects.clear();
    effects.forEach((effect) => {
      effect.element.style.removeProperty(effect.property);
      effect.current = null;
    });
    effectsEnabled = !motionPreference.matches && desktopMotion.matches &&
      "IntersectionObserver" in window;
    if (!effectsEnabled) return;

    effectObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        effects.filter(({ trigger }) => trigger === entry.target).forEach((effect) => {
          if (entry.isIntersecting) activeEffects.add(effect);
          else activeEffects.delete(effect);
        });
      });
      scheduleEffects();
    }, { rootMargin: "120px 0px", threshold: 0 });
    new Set(effects.map(({ trigger }) => trigger)).forEach((element) => {
      effectObserver.observe(element);
    });
  }

  function syncMotion() {
    revealObserver?.disconnect();
    root.classList.remove("scroll-motion-ready");
    if (!motionPreference.matches && "IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      }, { rootMargin: "0px 0px -24px 0px", threshold: 0 });
      revealTargets.forEach((element) => {
        if (!element.classList.contains("is-revealed")) revealObserver.observe(element);
      });
      root.classList.add("scroll-motion-ready");
    }
    syncEffects();
  }

  // Keyboard navigation must never arrive at an invisible control or heading.
  document.addEventListener("focusin", (event) => {
    const element = event.target.closest("[data-motion]");
    if (element) reveal(element);
  });
  window.addEventListener("scroll", scheduleEffects, { passive: true });
  window.addEventListener("resize", scheduleEffects);
  window.addEventListener("pageshow", scheduleEffects);
  document.addEventListener("visibilitychange", scheduleEffects);
  document.fonts?.ready.then(scheduleEffects);
  motionPreference.addEventListener("change", syncMotion);
  desktopMotion.addEventListener("change", syncEffects);
  syncMotion();
})();
