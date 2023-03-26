nekoPos = {x: 32, y:32};
mousePos = {x:0, y:0};

function handleMessage(request, sender, sendResponse) {
  if (request.nekoPos != undefined){
    nekoPos = request.nekoPos;
  }
  if (request.mousePos != undefined){
    mousePos = request.mousePos;
  }
  sendResponse({nekoPos:nekoPos, mousePos:mousePos});
}

browser.runtime.onMessage.addListener(handleMessage);