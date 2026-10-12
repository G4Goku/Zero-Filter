const menuToggle = document.querySelector(".menu-toggle");
const mobileNavigation = document.querySelector("#mobile-navigation");
const mobileNavigationClose = document.querySelector(".mobile-nav__close");
const mobileNavigationLinks = document.querySelectorAll(".mobile-nav__link");
const mobileNavigationBreakpoint = window.matchMedia("(max-width: 640px)");
let closeTimer;

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
  closeTimer = window.setTimeout(finishMobileNavigationClose, 500);
}

function finishMobileNavigationClose() {
  if (mobileNavigation.open && mobileNavigation.classList.contains("is-closing")) {
    mobileNavigation.close();
    mobileNavigation.classList.remove("is-closing");
    syncMenuToggle();
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
  link.addEventListener("click", closeMobileNavigation);
});

function handleBreakpointChange() {
  if (!mobileNavigationBreakpoint.matches) {
    closeMobileNavigation();
  }
}

mobileNavigationBreakpoint.addEventListener("change", handleBreakpointChange);
window.addEventListener("resize", handleBreakpointChange);
