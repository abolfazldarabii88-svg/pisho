const capsule = document.getElementById('capsule');
const stage = document.getElementById('stage');
const face = document.getElementById('face');
const eyes = [...document.querySelectorAll('.eye')];

let expanded = false;
let sleeping = false;
let lastActivity = Date.now();
let lastPlayful = 0;
let eyeClickTimes = [];
let interactionCount = 0;
let temporaryTimer;
let idleTimer;
let lookTimer;

const now = () => Date.now();
const setState = (name, duration = 0) => {
  capsule.classList.remove('sleeping', 'angry', 'dizzy', 'playful', 'wink', 'blink');
  capsule.classList.add(name);
  clearTimeout(temporaryTimer);
  if (duration) temporaryTimer = setTimeout(() => {
    capsule.classList.remove(name);
    if (!sleeping) capsule.classList.add('normal');
  }, duration);
};

function markActivity() {
  lastActivity = now();
  if (sleeping) {
    sleeping = false;
    capsule.classList.remove('sleeping');
    setState('normal');
    capsule.classList.add('wake');
    setTimeout(() => capsule.classList.remove('wake'), 650);
  }
}
function blinkOnce() {
  capsule.classList.add('blink');
  setTimeout(() => capsule.classList.remove('blink'), 170);
}
function startup() {
  stage.classList.add('starting');
  capsule.classList.add('normal');
  setTimeout(() => {
    capsule.classList.add('wink');
    setTimeout(() => capsule.classList.remove('wink'), 260);
    setTimeout(() => stage.classList.remove('starting'), 900);
  }, 1750);
}
function triggerPlayful() {
  if (sleeping || expanded || now() - lastPlayful < 26000) return;
  lastPlayful = now();
  capsule.classList.add('playful');
  const directions = ['look-left', 'look-right'];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  capsule.classList.add(direction);
  setTimeout(() => capsule.classList.remove('playful', direction), 2500);
}
function triggerDizzy() {
  markActivity();
  setState('dizzy', 4200);
}
function triggerAngry() {
  markActivity();
  setState('angry', 3300);
}

eyes.forEach(eye => {
  eye.addEventListener('click', () => {
    markActivity();
    const t = now();
    eyeClickTimes = eyeClickTimes.filter(x => t - x < 2400);
    eyeClickTimes.push(t);
    if (eyeClickTimes.length >= 5) {
      eyeClickTimes = [];
      triggerAngry();
    } else {
      interactionCount++;
      if (interactionCount >= 9) {
        interactionCount = 0;
        triggerDizzy();
      } else if (Math.random() > .45) {
        triggerPlayful();
      }
    }
  });
});

window.pisho.onExpanded(value => {
  expanded = value;
  capsule.classList.toggle('expanded', value);
  if (value) markActivity();
});

window.pisho.onPointer(data => {
  const x = data.x - (data.displayX + data.displayWidth / 2);
  const y = data.y - data.displayY;
  const closeEnough = data.nearNotch;
  if (closeEnough) markActivity();

  const bounds = capsule.getBoundingClientRect();
  const localX = data.x - (data.displayX + (data.displayWidth - bounds.width) / 2);
  const localY = data.y - data.displayY;
  const dx = Math.max(-1, Math.min(1, (localX - bounds.width / 2) / Math.max(1, bounds.width / 2)));
  const dy = Math.max(-1, Math.min(1, (localY - 35) / 180));
  eyes.forEach(eye => {
    eye.style.transform = `translate(${dx * 5}px, ${dy * 3}px)`;
  });

  if (!closeEnough && !expanded && !sleeping && now() - lastActivity > 150000) {
    sleeping = true;
    setState('sleeping');
  } else if (!closeEnough && !expanded && !sleeping && now() - lastActivity > 38000 && now() - lastPlayful > 26000) {
    triggerPlayful();
  }
});

document.addEventListener('mousemove', markActivity);
document.addEventListener('keydown', markActivity);
document.addEventListener('mousedown', markActivity);

setInterval(() => {
  if (!sleeping && !expanded && now() - lastActivity > 150000) {
    sleeping = true;
    setState('sleeping');
  } else if (!sleeping && !expanded && now() - lastActivity > 38000) {
    triggerPlayful();
  }
}, 1000);

function scheduleBlink() {
  setTimeout(() => {
    if (!sleeping && !capsule.classList.contains('angry') && !capsule.classList.contains('dizzy')) blinkOnce();
    scheduleBlink();
  }, 5200 + Math.random() * 2600);
}
startup();
scheduleBlink();
