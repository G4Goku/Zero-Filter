const menuToggle = document.querySelector(".menu-toggle");
const mobileNavigation = document.querySelector("#mobile-navigation");
const mobileNavigationClose = document.querySelector(".mobile-nav__close");
const mobileNavigationLinks = document.querySelectorAll(".mobile-nav__link, .mobile-nav__brand");
const mobileNavigationBreakpoint = window.matchMedia("(max-width: 640px)");
const navigationMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const siteHeader = document.querySelector(".site-header");
const siteFooter = document.querySelector(".site-footer");
const sectionNavigationLinks = document.querySelectorAll(".site-nav__link, .mobile-nav__link");
const sectionNavigationTargets = [...document.querySelectorAll(".site-nav__link")]
  .map((link) => document.getElementById(link.hash.slice(1)))
  .filter(Boolean);
let closeTimer;
let pendingMobileTarget = null;
let headerAnimationFrame = 0;

function syncFooterHeight() {
  if (!siteFooter) return;
  document.documentElement.style.setProperty(
    "--site-footer-height",
    `${siteFooter.getBoundingClientRect().height}px`,
  );
}

function updateSiteHeader() {
  headerAnimationFrame = 0;
  siteHeader.classList.toggle("is-at-top", window.scrollY <= 32);

  const marker = siteHeader.getBoundingClientRect().bottom + 1;
  let activeId = sectionNavigationTargets[0]?.id;
  sectionNavigationTargets.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) activeId = section.id;
  });
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
    activeId = sectionNavigationTargets.at(-1)?.id;
  }

  sectionNavigationLinks.forEach((link) => {
    if (link.hash === `#${activeId}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function scheduleSiteHeaderUpdate() {
  if (!headerAnimationFrame) headerAnimationFrame = requestAnimationFrame(updateSiteHeader);
}

syncFooterHeight();
if (siteFooter && "ResizeObserver" in window) {
  new ResizeObserver(syncFooterHeight).observe(siteFooter);
}
updateSiteHeader();
requestAnimationFrame(() => siteHeader.classList.add("is-ready"));
window.addEventListener("scroll", scheduleSiteHeaderUpdate, { passive: true });
window.addEventListener("resize", scheduleSiteHeaderUpdate);
window.addEventListener("resize", syncFooterHeight);
window.addEventListener("pageshow", scheduleSiteHeaderUpdate);
window.addEventListener("hashchange", scheduleSiteHeaderUpdate);

function syncMenuToggle() {
  const isOpen = mobileNavigation.open;

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu",
  );
}

function closeMobileNavigation() {
  if (
    !mobileNavigation.open ||
    mobileNavigation.classList.contains("is-closing")
  ) {
    return;
  }

  clearTimeout(closeTimer);
  mobileNavigation.classList.add("is-closing");
  if (navigationMotionPreference.matches || !mobileNavigationBreakpoint.matches) {
    finishMobileNavigationClose();
    return;
  }
  closeTimer = window.setTimeout(finishMobileNavigationClose, 500);
}

function finishMobileNavigationClose() {
  if (mobileNavigation.open && mobileNavigation.classList.contains("is-closing")) {
    const destination = pendingMobileTarget;
    pendingMobileTarget = null;
    mobileNavigation.close();
    mobileNavigation.classList.remove("is-closing");
    syncMenuToggle();
    if (destination) {
      requestAnimationFrame(() => {
        if (location.hash !== `#${destination.id}`) {
          history.pushState(null, "", `#${destination.id}`);
        }
        destination.scrollIntoView({
          behavior: navigationMotionPreference.matches ? "instant" : "smooth",
          block: "start",
        });
        if (!destination.hasAttribute("tabindex")) {
          destination.setAttribute("tabindex", "-1");
          destination.addEventListener("blur", () => destination.removeAttribute("tabindex"), { once: true });
        }
        destination.focus({ preventScroll: true });
      });
    }
  }
}

menuToggle.addEventListener("click", () => {
  if (mobileNavigation.open) {
    closeMobileNavigation();
    return;
  }

  clearTimeout(closeTimer);
  mobileNavigation.classList.remove("is-closing");
  mobileNavigation.showModal();
  syncMenuToggle();
});

mobileNavigation.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMobileNavigation();
});

mobileNavigation.addEventListener("close", () => {
  clearTimeout(closeTimer);
  mobileNavigation.classList.remove("is-closing");
  pendingMobileTarget = null;
  syncMenuToggle();
});

mobileNavigation.addEventListener("animationend", (event) => {
  if (
    event.target === mobileNavigation &&
    event.animationName === "mobile-nav-rise"
  ) {
    clearTimeout(closeTimer);
    finishMobileNavigationClose();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileNavigation.open) {
    event.preventDefault();
    closeMobileNavigation();
  }
});

mobileNavigation.addEventListener("click", (event) => {
  if (event.target === mobileNavigation) {
    closeMobileNavigation();
  }
});

mobileNavigationClose.addEventListener("click", closeMobileNavigation);

mobileNavigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const destination = document.getElementById(link.hash.slice(1));
    if (!destination || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    pendingMobileTarget = destination;
    closeMobileNavigation();
  });
});

function handleBreakpointChange() {
  if (!mobileNavigationBreakpoint.matches) {
    closeMobileNavigation();
  }
}

mobileNavigationBreakpoint.addEventListener("change", handleBreakpointChange);
window.addEventListener("resize", handleBreakpointChange);
