// oneko.js: https://github.com/adryd325/oneko.js

(function oneko() {
  const nekoEl = document.createElement("div");
  // Hide neko away outside the screen at first. Pop in instead of teleport.
  let nekoPosX = -16;
  let nekoPosY = -16;
  let mousePosX = 0;
  let mousePosY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;
  const nekoSpeed = 10;
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  function updateFromBg(response) {
    nekoPosX = response.nekoPos.x;
    nekoPosY = response.nekoPos.y;
    mousePosX = response.mousePos.x;
    mousePosY = response.mousePos.y;
  }

  function create() {
    // Neko may already exist on page, don't need another one then.
    let existingNeko = document.querySelector("#oneko");

    if (existingNeko != null) {
      nekoEl = existingNeko;
    }
    else {
      nekoEl.id = "oneko";
      nekoEl.style.width = "32px";
      nekoEl.style.height = "32px";
      nekoEl.style.position = "fixed";
      nekoEl.style.pointerEvents = "none";
      nekoEl.style.backgroundImage = "url('" + browser.runtime.getURL("oneko.gif") + "')";
      nekoEl.style.imageRendering = "pixelated";
      nekoEl.style.left = `${nekoPosX - 16}px`;
      nekoEl.style.top = `${nekoPosY - 16}px`;
      nekoEl.style.zIndex = "9999";

      document.body.appendChild(nekoEl);

      // Get previously known position and direction on another page
      browser.runtime.sendMessage({}).then(updateFromBg, (err) => { console.log(err) });
    }

    document.onmousemove = (event) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    };

    window.onekoInterval = setInterval(frame, 100);

    // When document looses focus, hand off position for next page.
    document.addEventListener("visibilitychange", onVisChanged);
  }

  function onVisChanged() {
    if (document.hidden) {
      browser.runtime.sendMessage({ nekoPos: { x: nekoPosX, y: nekoPosY }, mousePos: { x: mousePosX, y: mousePosY } });
    }
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    // every ~ 20 seconds
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) {
        avalibleIdleAnimations.push("scratchWallW");
      }
      if (nekoPosY < 32) {
        avalibleIdleAnimations.push("scratchWallN");
      }
      if (nekoPosX > window.innerWidth - 32) {
        avalibleIdleAnimations.push("scratchWallE");
      }
      if (nekoPosY > window.innerHeight - 32) {
        avalibleIdleAnimations.push("scratchWallS");
      }
      idleAnimation =
        avalibleIdleAnimations[
        Math.floor(Math.random() * avalibleIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;
    const targetX = Math.min(Math.max(0, mousePosX), window.innerWidth)
    const targetY = Math.min(Math.max(1, mousePosY - 32), window.innerWidth - 1) // Vertical offset to get less in the way
    const diffX = nekoPosX - targetX;
    const diffY = nekoPosY - targetY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    // If Neko is already idle, stay idle at a greater distance than if active.
    // If active, limit vertical range to avoid intentionally ending under the cursor.
    let shouldIdle = (idleTime > 1 && (distance < nekoSpeed || (distance < 64))) ||
      (distance < nekoSpeed || (distance < 48 && Math.abs(diffY) < 16))
    if (shouldIdle) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      // count down after being alerted before moving
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  function destroy() {
    clearInterval(window.onekoInterval);
    let existingNeko = document.querySelector("#oneko");
    if (existingNeko != null) {
      existingNeko.remove();
      nekoEl = existingNeko;
    }
    document.removeEventListener("visibilitychange", onVisChanged);
  }

  function createOrDestroy() {
    browser.storage.local.get({ "everywhere": true, [location.host]: true }).then((visibility) => {
      if (Object.values(visibility).every(Boolean)) {
        create();
      } else {
        destroy();
      }
    });
  }
  createOrDestroy();
  browser.storage.local.onChanged.addListener(createOrDestroy);

})();
