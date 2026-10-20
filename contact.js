const enquiryForm = document.querySelector(".contact__form");
const enquiryStatus = document.querySelector(".contact__status");
const enquirySubmit = enquiryForm?.querySelector(".contact__submit");
const enquiryToast = document.querySelector(".enquiry-toast");
const enquiryToastTitle = enquiryToast?.querySelector(".enquiry-toast__title");
const enquiryToastMessage = enquiryToast?.querySelector(".enquiry-toast__message");
const enquiryToastProgress = enquiryToast?.querySelector(".enquiry-toast__progress-fill");
const contactMotionPreference = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
let enquirySending = false;
let enquiryToastTimer;
let enquiryToastAnimation;
let enquiryToastRemaining = 0;
let enquiryToastStarted = 0;
let enquiryToastHovered = false;

function dismissEnquiryToast() {
  window.clearTimeout(enquiryToastTimer);
  enquiryToastTimer = null;
  enquiryToastRemaining = 0;
  enquiryToastHovered = false;
  enquiryToastAnimation?.cancel();
  if (!enquiryToast) return;

  if (enquiryToast.contains(document.activeElement)) {
    const focusTarget = enquirySubmit?.disabled
      ? enquiryForm?.querySelector("[required]:not(:disabled)")
      : enquirySubmit;
    focusTarget?.focus({ preventScroll: true });
  }
  enquiryToast.classList.remove("is-visible");
  enquiryToast.inert = true;
  enquiryToast.setAttribute("aria-hidden", "true");
}

function pauseEnquiryToast() {
  if (!enquiryToastTimer) return;
  window.clearTimeout(enquiryToastTimer);
  enquiryToastTimer = null;
  enquiryToastRemaining = Math.max(
    0,
    enquiryToastRemaining - (performance.now() - enquiryToastStarted),
  );
  enquiryToastAnimation?.pause();
}

function resumeEnquiryToast() {
  if (
    !enquiryToast?.classList.contains("is-visible") ||
    !enquiryToastRemaining ||
    enquiryToastTimer ||
    enquiryToastHovered ||
    enquiryToast.contains(document.activeElement) ||
    document.hidden
  ) return;

  enquiryToastStarted = performance.now();
  enquiryToastTimer = window.setTimeout(dismissEnquiryToast, enquiryToastRemaining);
  enquiryToastAnimation?.play();
}

function showEnquiryToast(state, title, message) {
  window.clearTimeout(enquiryToastTimer);
  enquiryToastTimer = null;
  enquiryToastAnimation?.cancel();
  enquiryToastAnimation = null;
  enquiryToastRemaining = state === "pending" ? 0 : state === "error" ? 9000 : 6000;
  enquiryStatus.textContent = `${title}. ${message}`;
  if (!enquiryToast) return;

  enquiryToastTitle.textContent = title;
  enquiryToastMessage.textContent = message;
  enquiryToast.querySelector(".enquiry-toast__email").hidden = state !== "error";
  enquiryToast.dataset.state = state;
  enquiryToast.inert = false;
  enquiryToast.setAttribute("aria-hidden", "false");
  enquiryToast.classList.add("is-visible");

  if (enquiryToastRemaining && !contactMotionPreference.matches) {
    enquiryToastAnimation = enquiryToastProgress.animate(
      [{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
      { duration: enquiryToastRemaining, easing: "linear", fill: "forwards" },
    );
    enquiryToastAnimation.pause();
  }
  resumeEnquiryToast();
}

enquiryToast?.querySelector(".enquiry-toast__close").addEventListener("click", dismissEnquiryToast);
enquiryToast?.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "touch") return;
  enquiryToastHovered = true;
  pauseEnquiryToast();
});
enquiryToast?.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "touch") return;
  enquiryToastHovered = false;
  resumeEnquiryToast();
});
enquiryToast?.addEventListener("focusin", pauseEnquiryToast);
enquiryToast?.addEventListener("focusout", (event) => {
  if (!enquiryToast.contains(event.relatedTarget)) {
    queueMicrotask(resumeEnquiryToast);
  }
});
enquiryToast?.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.stopPropagation();
  dismissEnquiryToast();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseEnquiryToast();
  else resumeEnquiryToast();
});

enquiryForm?.addEventListener("input", (event) => {
  if (event.target.matches("input, textarea")) event.target.setCustomValidity("");
});

enquiryForm?.addEventListener("submit", async (event) => {
  // Keep the native POST action available when JavaScript is unavailable.
  if (!enquiryForm.dataset.ajaxAction || !("fetch" in window)) return;
  event.preventDefault();
  if (enquirySending) return;

  const details = new FormData(enquiryForm);
  for (const field of enquiryForm.querySelectorAll("[required]")) {
    const value = field.value.trim();
    field.setCustomValidity(value ? "" : "Please fill in this field.");
    details.set(field.name, value);
  }
  if (!enquiryForm.reportValidity()) return;

  // AJAX submissions stay on this page; the native fallback keeps reCAPTCHA.
  details.set("_captcha", "false");
  details.set("_url", window.location.href);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  const buttonLabel = enquirySubmit.textContent;
  enquirySending = true;
  enquirySubmit.disabled = true;
  enquirySubmit.textContent = "Sending...";
  enquiryForm.setAttribute("aria-busy", "true");
  showEnquiryToast("pending", "Sending your enquiry", "Please wait while we send your details.");

  try {
    const response = await fetch(enquiryForm.dataset.ajaxAction, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: details,
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok || ![true, "true"].includes(result.success)) {
      throw new Error("Enquiry submission was not accepted.");
    }

    enquiryForm.reset();
    showEnquiryToast("success", "Enquiry submitted", "Thank you for reaching out. We'll be in touch soon.");
  } catch {
    showEnquiryToast("error", "We couldn't send your enquiry", "Your details are still in the form. Please try again.");
  } finally {
    window.clearTimeout(timeout);
    enquirySending = false;
    enquirySubmit.disabled = false;
    enquirySubmit.textContent = buttonLabel;
    enquiryForm.removeAttribute("aria-busy");
  }
});

const contactSection = document.querySelector(".contact");
const contactRevealTargets = contactSection?.querySelectorAll(
  ".crew__heading, .crew__member, .contact__title, .contact__form",
);
let contactRevealObserver;

function revealContactElement(element) {
  contactRevealObserver?.unobserve(element);
  const portrait = element.querySelector(".crew__portrait");
  const reveal = () => element.classList.add("is-revealed");

  // Let lazy portraits finish loading before their entrance begins.
  if (portrait && !portrait.complete) {
    portrait.addEventListener("load", reveal, { once: true });
    portrait.addEventListener("error", reveal, { once: true });
    portrait.loading = "eager";
    return;
  }

  reveal();
}

function syncContactMotion() {
  contactRevealObserver?.disconnect();

  if (
    !contactSection ||
    contactMotionPreference.matches ||
    !("IntersectionObserver" in window)
  ) {
    contactSection?.classList.remove("contact--motion");
    return;
  }

  contactRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) revealContactElement(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  contactSection.classList.add("contact--motion");
  window.requestAnimationFrame(() => {
    if (!contactSection.classList.contains("contact--motion")) return;

    contactRevealTargets.forEach((element) => {
      if (!element.classList.contains("is-revealed")) {
        contactRevealObserver.observe(element);
      }
    });
  });
}

// Keyboard users should see controls as soon as focus reaches them.
contactSection?.addEventListener("focusin", (event) => {
  const element = event.target.closest(".crew__member, .contact__form");
  if (!element) return;

  element.classList.add("is-revealed");
  contactRevealObserver?.unobserve(element);
});

contactMotionPreference.addEventListener("change", syncContactMotion);
syncContactMotion();

const crewHoverPreference = window.matchMedia("(hover: hover) and (pointer: fine)");
let openCrewProfile = null;
let crewProfileCloseTimer;

function closeCrewProfile() {
  window.clearTimeout(crewProfileCloseTimer);
  if (!openCrewProfile) return;

  openCrewProfile.classList.remove("is-profile-open");
  const toggle = openCrewProfile.querySelector(".crew__profile-hit");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", `Show details about ${toggle.dataset.name}`);
  openCrewProfile.querySelector(".crew__designation").setAttribute("aria-hidden", "true");
  openCrewProfile = null;
}

function showCrewProfile(member) {
  window.clearTimeout(crewProfileCloseTimer);
  if (openCrewProfile === member) return;
  closeCrewProfile();

  openCrewProfile = member;
  member.classList.add("is-profile-open", "is-revealed");
  contactRevealObserver?.unobserve(member);
  const toggle = member.querySelector(".crew__profile-hit");
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", `Hide details about ${toggle.dataset.name}`);
  member.querySelector(".crew__designation").setAttribute("aria-hidden", "false");
}

function toggleCrewProfile(member) {
  if (openCrewProfile === member) closeCrewProfile();
  else showCrewProfile(member);
}

contactSection?.querySelectorAll(".crew__member").forEach((member, index) => {
  const caption = member.querySelector(".crew__caption");
  const name = member.querySelector(".crew__name");
  const founderRole = member.querySelector(".crew__role");
  const identity = document.createElement("div");
  identity.className = "crew__identity";
  if (founderRole) identity.append(founderRole);
  identity.append(name);
  caption.prepend(identity);
  caption.id = `crew-profile-${index + 1}`;

  const designation = document.createElement("p");
  designation.className = "crew__designation";
  designation.textContent = member.dataset.designation;
  designation.setAttribute("aria-hidden", "true");
  identity.append(designation);

  // Keep transparent image margins from capturing a neighboring person's hover.
  const toggle = document.createElement("button");
  toggle.className = "crew__profile-hit";
  toggle.type = "button";
  toggle.dataset.name = name.textContent.trim();
  toggle.setAttribute("aria-label", `Show details about ${toggle.dataset.name}`);
  toggle.setAttribute("aria-controls", caption.id);
  toggle.setAttribute("aria-expanded", "false");
  member.insertBefore(toggle, caption);

  toggle.addEventListener("click", () => toggleCrewProfile(member));

  member.addEventListener("pointerenter", (event) => {
    if (crewHoverPreference.matches && event.pointerType !== "touch") {
      showCrewProfile(member);
    }
  });

  member.addEventListener("pointerleave", (event) => {
    if (!crewHoverPreference.matches || event.pointerType === "touch") return;
    if (member.contains(document.activeElement)) return;

    crewProfileCloseTimer = window.setTimeout(() => {
      if (openCrewProfile === member) closeCrewProfile();
    }, 140);
  });

  member.addEventListener("focusin", (event) => {
    window.clearTimeout(crewProfileCloseTimer);
    // Pointer focus must not open the details before a tap toggles them.
    if (event.target.matches(":focus-visible, .crew__instagram")) {
      showCrewProfile(member);
    }
  });
  member.addEventListener("focusout", (event) => {
    if (!member.contains(event.relatedTarget) && openCrewProfile === member) {
      closeCrewProfile();
    }
  });

  member.addEventListener("click", (event) => {
    if (
      (crewHoverPreference.matches && event.pointerType !== "touch") ||
      event.target.closest("button, a")
    ) return;
    toggleCrewProfile(member);
  });
});

contactSection?.classList.add("contact--profiles");

document.addEventListener("pointerdown", (event) => {
  if (openCrewProfile && !openCrewProfile.contains(event.target)) closeCrewProfile();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !openCrewProfile) return;
  const toggle = openCrewProfile.querySelector(".crew__profile-hit");
  const restoreFocus = openCrewProfile.contains(document.activeElement);
  // Restore focus before closing, so focusin cannot reopen the details.
  if (restoreFocus) toggle.focus({ preventScroll: true });
  closeCrewProfile();
});

crewHoverPreference.addEventListener("change", closeCrewProfile);
