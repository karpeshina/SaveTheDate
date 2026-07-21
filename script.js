const form = document.querySelector("#guestForm");
const formMessage = document.querySelector("#formMessage");
const weddingDate = new Date("2026-10-03T15:00:00+03:00");
const countdownDays = document.querySelector("[data-countdown-days]");
const countdownHours = document.querySelector("[data-countdown-hours]");
const countdownMinutes = document.querySelector("[data-countdown-minutes]");
const countdownSeconds = document.querySelector("[data-countdown-seconds]");

const updateCountdown = () => {
  if (!countdownDays || !countdownHours || !countdownMinutes || !countdownSeconds) {
    return;
  }

  const diff = Math.max(0, weddingDate.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  countdownDays.textContent = String(days);
  countdownHours.textContent = String(hours);
  countdownMinutes.textContent = String(minutes);
  countdownSeconds.textContent = String(seconds);
};

updateCountdown();
setInterval(updateCountdown, 1000);

const timeline = document.querySelector(".timeline");
const timelineMarker = document.querySelector(".timeline__marker");
const timelineItems = timeline ? [...timeline.querySelectorAll("li")] : [];

if (timeline && timelineMarker && timelineItems.length) {
  let markerY = 0;
  let targetY = 0;
  let rafId = 0;

  // Must match .timeline::before top / bottom
  const LINE_INSET_TOP = 12;
  const LINE_INSET_BOTTOM = 8;

  const getWaypoints = () => {
    const centers = timelineItems.map(
      (item) => item.offsetTop + item.offsetHeight / 2
    );
    const lineEnd = Math.max(
      LINE_INSET_TOP,
      timeline.offsetHeight - LINE_INSET_BOTTOM
    );
    return [LINE_INSET_TOP, ...centers, lineEnd];
  };

  const getWaypointViewportYs = () => {
    const timelineRect = timeline.getBoundingClientRect();
    const centers = timelineItems.map((item) => {
      const rect = item.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    return [
      timelineRect.top + LINE_INSET_TOP,
      ...centers,
      timelineRect.bottom - LINE_INSET_BOTTOM,
    ];
  };

  const updateTarget = () => {
    const points = getWaypoints();
    const viewYs = getWaypointViewportYs();
    const focusY = window.innerHeight * 0.42;

    if (focusY <= viewYs[0]) {
      targetY = points[0];
      return;
    }

    if (focusY >= viewYs[viewYs.length - 1]) {
      targetY = points[points.length - 1];
      return;
    }

    for (let i = 0; i < viewYs.length - 1; i += 1) {
      const a = viewYs[i];
      const b = viewYs[i + 1];
      if (focusY >= a && focusY <= b) {
        const t = (focusY - a) / (b - a || 1);
        targetY = points[i] + (points[i + 1] - points[i]) * t;
        return;
      }
    }

    targetY = points[points.length - 1];
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const applyMarker = () => {
    timelineMarker.style.top = `${markerY}px`;
  };

  const smoothToTarget = () => {
    rafId = 0;
    if (reducedMotion) {
      markerY = targetY;
      applyMarker();
      return;
    }

    markerY += (targetY - markerY) * 0.22;
    if (Math.abs(targetY - markerY) < 0.4) {
      markerY = targetY;
    }
    applyMarker();

    if (markerY !== targetY) {
      rafId = requestAnimationFrame(smoothToTarget);
    }
  };

  const onScrollOrResize = () => {
    updateTarget();

    if (reducedMotion) {
      markerY = targetY;
      applyMarker();
      return;
    }

    markerY += (targetY - markerY) * 0.45;
    if (Math.abs(targetY - markerY) < 0.5) {
      markerY = targetY;
    }
    applyMarker();

    if (!rafId && markerY !== targetY) {
      rafId = requestAnimationFrame(smoothToTarget);
    }
  };

  updateTarget();
  markerY = targetY;
  applyMarker();

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
}

const dressPair = document.querySelector(".dress__pair");
const dressSection = document.querySelector("#dress-code");

if (dressPair && dressSection) {
  if ("IntersectionObserver" in window) {
    const dressObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          dressPair.classList.add("is-inview");
          dressObserver.disconnect();
        });
      },
      { threshold: 0.35 }
    );

    dressObserver.observe(dressSection);
  } else {
    dressPair.classList.add("is-inview");
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const drinks = data.getAll("drinks");
  const guestName = String(data.get("guestName") || "").trim();
  const attendance = data.get("attendance");

  const answer = {
    guestName,
    attendance,
    drinks,
    sentAt: new Date().toISOString(),
  };

  const savedAnswers = JSON.parse(localStorage.getItem("weddingRsvpAnswers") || "[]");
  savedAnswers.push(answer);
  localStorage.setItem("weddingRsvpAnswers", JSON.stringify(savedAnswers));

  const success = document.createElement("h3");
  success.className = "form__success";
  success.setAttribute("role", "status");
  success.setAttribute("aria-live", "polite");
  success.textContent = "Форма отправлена";

  form.classList.add("form--sent");
  form.replaceChildren(success);
});
