function main() {
  var canvas = document.getElementById("landscape");
  canvas.width = document.documentElement.clientWidth;
  canvas.height = 500;
  var landscape = new Landscape(canvas);

  var refresh = document.getElementById("refresh");
  refresh.width = 30;
  refresh.height = 30;
  refresh.style.margin = "8px";
  refresh.style.left = canvas.width - refresh.width - 16 + "px";
  drawRefresh(refresh);
  refresh.addEventListener('mousedown', function() { 
      landscape.generate();
      landscape.draw() 
  });

  var margin = 100;
  document.addEventListener("scroll", function(elem) {
    var scrollDist = document.body.scrollTop || 
                     document.documentElement.scrollTop;
    var maxScroll = document.documentElement.scrollHeight;
    var clientHeight = document.documentElement.clientHeight;

    var scrollPercent = Math.max(0, scrollDist - maxScroll + 
                                    clientHeight + canvas.height + margin) / 
                                    (canvas.height + margin);

    var color = mix(250, 250, 250, 53, 56, 96, scrollPercent);
    document.body.style.backgroundColor = colorToCSS(color);
    landscape.setBackgroundColor(color); 
    landscape.draw();
  });
}

function mix(r1, g1, b1, r2, g2, b2, fraction) {
  return [((r1 * (1 - fraction)) + (r2 * fraction)),
          ((g1 * (1 - fraction)) + (g2 * fraction)),
          ((b1 * (1 - fraction)) + (b2 * fraction))]
}

function colorToCSS(color) {
  return "rgb(" + Math.floor(color[0]) + ", " + 
                  Math.floor(color[1]) + ", " + 
                  Math.floor(color[2]) + ")"
}

function Landscape(canvas) {
  this.canvas = canvas;
  this.backgroundColor = [53, 56, 96]
  this.generate();
  this.draw();
  addResizeListener(this);
}

function resizeFooter(self) {
  var h = document.documentElement.clientHeight;
  var w = document.documentElement.clientWidth;
  document.getElementById("landscape-container").style.marginTop = h + "px";
  self.canvas.width = w
  self.draw();
  var refresh = document.getElementById("refresh");
  refresh.style.left = w - refresh.width - 16 + "px";
}

function addResizeListener(self) {
  var resizeTimeout;
  window.addEventListener("resize", function() {
    if (!resizeTimeout) {
      resizeTimeout = setTimeout(function() {
        resizeTimeout = null;
        resizeFooter(self);
      }, 22);
    }
  }, false);
  window.addEventListener("load", function() { resizeFooter(self); });
}

Landscape.prototype.generate = function() {
  var w = this.canvas.width;
  var h = this.canvas.height;
  this.backTerrain = genTerrain(h, 0.44, 8, h / 4);
  this.midTerrain = genTerrain(h, 0.48, 8, h / 10);
  this.frontTerrain = genTerrain(h, 0.48, 8, h / 10);

  this.meanBackHeight = meanHeight(this.backTerrain);

  this.backOffset = h * 2/5 - this.meanBackHeight; 
  this.midOffset = h * 3/10 - meanHeight(this.midTerrain)
  this.frontOffset = h * 1/5 - meanHeight(this.frontTerrain)

  var starArea = (h - this.backOffset - this.meanBackHeight) * w;
  this.stars = genStars(h, starArea * 0.00015, minHeight(this.backTerrain))
}

Landscape.prototype.draw = function() {
  this.clear();
  this.drawBackground();
  this.drawStars(); 
  this.drawTerrain(this.backTerrain, "#445", this.backOffset);
  this.drawTerrain(this.midTerrain, "#334", this.midOffset);
  this.drawTerrain(this.frontTerrain, "#223", this.frontOffset);
}

Landscape.prototype.clear = function() {
  var w = this.canvas.width;
  var h = this.canvas.height;
  this.canvas.getContext("2d").clearRect(0, 0, w, h);
}

Landscape.prototype.setBackgroundColor = function(color) {
  this.backgroundColor = color;
}

Landscape.prototype.drawBackground = function() {
  var w = this.canvas.width;
  var h = this.canvas.height;
  var step = 20;

  var ctx = this.canvas.getContext("2d");

  var r = this.backgroundColor[0];
  var g = this.backgroundColor[1];
  var b = this.backgroundColor[2];
  var y = 0;

  while (y < h) {
    ctx.fillStyle = "#" + Math.floor(r).toString(16) + 
                          Math.floor(g).toString(16) + 
                          Math.floor(b).toString(16); 
    ctx.fillRect(0, y, w, step);
    y += Math.floor(step);
    step = Math.max(1, step * 0.99);
    r += 8;
    g += 3;
    b -= 1.5;
  }
}

Landscape.prototype.drawStars = function() {
  var w = this.canvas.width;
  var h = this.canvas.height;
  var ctx = this.canvas.getContext("2d");
  this.stars.forEach(function(elem) {
    ctx.fillStyle = elem[3];
    ctx.fillRect(w * elem[0], h - elem[1], elem[2], elem[2]);
  });
}

Landscape.prototype.drawTerrain = function(terrain, color, offset) {
  var w = this.canvas.width;
  var h = this.canvas.height;
  var ctx = this.canvas.getContext("2d");
  var current = terrain;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(current.startX * w, h - (current.startY + offset));

  while (current != null) {
    ctx.lineTo(current.endX * w, h - (current.endY + offset));
    current = current.next;
  }

  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.lineTo(0, terrain.startY);

  ctx.fill();
}

function drawRefresh(canvas) {
  var w = canvas.width;
  var h = canvas.height;
  var x = w / 2;
  var y = h / 2;
  var r = 0.7 * (Math.min(w, h) / 2);
  var ctx = canvas.getContext("2d");
  var color = "rgba(220, 220, 220, 0.5)";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 6;

  var startTh = 11/6 * Math.PI;
  var endTh = 1/4 * Math.PI;

  //head
  var size = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + r * Math.cos(endTh), canvas.height - (y + r * Math.sin(endTh)));
  ctx.lineTo(x + r * Math.cos(endTh) + 
                 r * size / Math.sqrt(2), 
             canvas.height - (y + r * Math.sin(endTh) + 
                                  r * size / Math.sqrt(2)));
  ctx.lineTo(x + r * Math.cos(endTh) + 
                 r * size / Math.sqrt(2), 
             canvas.height - (y + r * Math.sin(endTh) - 
                                  r * size / Math.sqrt(2)));
  ctx.lineTo(x + r * Math.cos(endTh) - 
                 r * size / Math.sqrt(2), 
             canvas.height - (y + r * Math.sin(endTh) - 
                                  r * size / Math.sqrt(2)));
  ctx.lineTo(x + r * Math.cos(endTh), canvas.height - (y + r * Math.sin(endTh)));
  ctx.fill();

  // circle
  ctx.beginPath();
  ctx.arc(x, y, r, 2 * Math.PI - startTh, 2 * Math.PI - endTh + 0.01);
  ctx.stroke();
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function weightedRandom(min, max) {
  return Math.sqrt(Math.random()) * (max - min) + min;
}

function minHeight(terrain) {
  var min = terrain.startY;
  var current = terrain;
  while (current != null) { 
    min = Math.min(min, current.startY, current.endY);
    current = current.next;
  }
  return min;
}

function maxHeight(terrain) {
  var max = terrain.startY;
  var current = terrain;
  while (current != null) { 
    max = Math.max(max, current.startY, current.endY);
    current = current.next;
  }
  return max;
}

function meanHeight(terrain) {
  var total = 0;
  var count = 0;
  var current = terrain;
  while (current != null) { 
    total += current.startY;
    total += current.endY;
    count += 1;
    current = current.next;
  }
  return total / count;
}


function genStars(h, count, minY) {
  var stars = []
  for (var i = 0; i < count; i++) {
    var x = random(0, 1);
    var y = weightedRandom(minY, h)
    var r = Math.ceil(random(1, 3));
    var color = "rgba(170, 190, 190, " + Math.pow(0.8 * (y - minY) / (h - minY), 2) + ")"
    stars.push([x, y, r, color]);
  }
  return stars;
}

function genTerrain(h, k, iters, magnitude) {
  var terrain =
  { "next" : null,
    "startX" : 0,
    "startY" : 0, 
    "endX" : 1,
    "endY" : 0.2 * h }

  for (var i = 0; i < iters; i++) {
    var current = terrain
    while (current != null) {
      var midX = (current.startX + current.endX) / 2    
      var midY = (current.startY + current.endY) / 2    
      var newMidY = midY + 2 * (Math.random() - 0.5) * magnitude; 
      var newTerrain = {}
      newTerrain.next = current.next;
      newTerrain.startX = midX;
      newTerrain.startY = newMidY;
      newTerrain.endX = current.endX;
      newTerrain.endY = current.endY;
      current.next = newTerrain;
      current.endX = midX;
      current.endY = newMidY
      current = newTerrain.next;
    }
    magnitude *= k;
  }

  return terrain;
}

document.addEventListener("DOMContentLoaded", main);
