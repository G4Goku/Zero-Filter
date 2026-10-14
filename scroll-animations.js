const hero = document.querySelector(".hero");
const heroMedia = document.querySelector(".hero__media");
const aboutSection = document.querySelector(".about");
const whyChooseUsSection = document.querySelector(".why-choose-us");
const aboutGlideElements = aboutSection
  ? [
      { element: aboutSection.querySelector(".about__intro"), distance: 36 },
      { element: aboutSection.querySelector(".about__vision"), distance: 48 },
      { element: aboutSection.querySelector(".about__approach"), distance: 60 },
    ]
  : [];
const reducedMotionPreference = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
let animationFrame = 0;

function updateScrollAnimations() {
  animationFrame = 0;

  if (reducedMotionPreference.matches) {
    heroMedia?.style.removeProperty("transform");
    aboutGlideElements.forEach(({ element }) => {
      element?.style.removeProperty("--about-glide-y");
    });
    document.documentElement.classList.remove("scroll-motion-ready");
    return;
  }

  document.documentElement.classList.add("scroll-motion-ready");

  if (hero && heroMedia) {
    const scrolledDistance = Math.max(0, -hero.getBoundingClientRect().top);
    const maxGlide = window.innerHeight * (window.innerWidth <= 640 ? 0.16 : 0.3);
    const glideDistance = Math.min(scrolledDistance * 0.35, maxGlide);

    heroMedia.style.transform = `translate3d(0, ${glideDistance}px, 0)`;
  }

  if (aboutSection) {
    const sectionTop = aboutSection.getBoundingClientRect().top;
    const sectionHeight = aboutSection.offsetHeight;
    const progress = Math.min(
      1,
      Math.max(
        0,
        (window.innerHeight - sectionTop) /
          (window.innerHeight + sectionHeight),
      ),
    );

    aboutGlideElements.forEach(({ element, distance }) => {
      element?.style.setProperty(
        "--about-glide-y",
        `${((0.5 - progress) * distance).toFixed(2)}px`,
      );
    });
  }

  if (
    aboutSection &&
    !aboutSection.classList.contains("is-visible") &&
    aboutSection.getBoundingClientRect().top < window.innerHeight * 0.85
  ) {
    aboutSection.classList.add("is-visible");
  }

  if (
    whyChooseUsSection &&
    !whyChooseUsSection.classList.contains("is-visible") &&
    whyChooseUsSection.getBoundingClientRect().top < window.innerHeight * 0.85
  ) {
    whyChooseUsSection.classList.add("is-visible");
  }
}

function scheduleScrollAnimationUpdate() {
  if (!animationFrame) {
    animationFrame = window.requestAnimationFrame(updateScrollAnimations);
  }
}

window.addEventListener("scroll", scheduleScrollAnimationUpdate, {
  passive: true,
});
window.addEventListener("resize", scheduleScrollAnimationUpdate);
reducedMotionPreference.addEventListener(
  "change",
  scheduleScrollAnimationUpdate,
);
updateScrollAnimations();
