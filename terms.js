(() => {
  const list = document.querySelector("#terms-list");
  const toggle = document.querySelector(".terms-and-conditions__toggle");
  if (!list || !toggle) return;

  const mobile = window.matchMedia("(max-width: 640px)");
  const additionalTerms = [...list.children].slice(3);
  const label = toggle.querySelector(".terms-and-conditions__toggle-label");
  let expanded = false;

  function syncTerms() {
    const showAll = !mobile.matches || expanded;
    additionalTerms.forEach((item) => {
      item.hidden = !showAll;
    });
    toggle.hidden = !mobile.matches || additionalTerms.length === 0;
    toggle.setAttribute("aria-expanded", String(showAll));
    label.textContent = showAll ? "See less" : "See more";
  }

  toggle.addEventListener("click", () => {
    expanded = !expanded;
    syncTerms();
    if (!expanded) {
      toggle.scrollIntoView({ behavior: "instant", block: "center" });
    }
  });

  mobile.addEventListener("change", syncTerms);
  syncTerms();
})();
