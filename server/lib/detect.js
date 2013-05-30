var fs = require('fs'),
    path = require('path'),
    cv = require('opencv'),
    Canvas = require('canvas'),
    geom = require('./geom');

function main() {
  var indir = process.argv[2] || 'line-challenge',
      outdir = process.argv[3] || 'extracted',
      images;

  images = fs.readdirSync(indir);

  images.forEach(function(imageName) {
    var p = path.resolve('', indir+ '/' +imageName);
    cv.readImage(p, function(err, im) {
      var vis,
          lines,
          angle,
          centroid;

      if (err) {
        console.error('error reading ' + imageName);
        return;
      }
      vis = createVisualizerImage(im);

      lines = findLines(im);
      angle = getAngle(lines);
      centroid = getCentroid(lines);

      lines.forEach(function(line) {
        drawLine(vis, line, '#000000');
      });

      drawAngle(vis, angle, centroid);
      drawCentroid(vis, centroid);

      saveImage(vis, '../' + outdir + '/' + imageName);
    });
  });
}

function findLines(im) {
  global.im = im;
  im.canny(10, 100);
  im.save('canny.png');
  // Hough threshold appear to be hard-coded in node-opencv implementation
  return im.houghLinesP();
}

// Convert angle to a heading where "straight" is 0, and normalize to range
// [-pi/2, pi/2]
function normalizeAngle(angle) {
  var ret = angle;

  while (ret > Math.PI / 2) {
    ret -= Math.PI;
  }
  while (ret <= -Math.PI / 2) {
    ret += Math.PI;
  }

  return ret;
}

function getAngle(lines) {
  var angles = lines.map(geom.getAngle),
      meanAngle = normalizeAngle(geom.meanAngle(angles));

  console.log(angles.length, meanAngle / Math.PI * 180);

  // possible TODO: threshold angles, reject lines not near meanAngle, recalculate meanAngle
  return meanAngle;
}

function getCentroid(lines) {
  var points = [];
  lines.forEach(function(line) {
    points.push([line[0], line[1]]);
    points.push([line[2], line[3]]);
  });

  return geom.centroid(points);
}

function drawAngle(ctx, angle, centroid) {
  var lineParams = geom.lineThrough(centroid[0], centroid[1], angle),
      a = lineParams[0],
      b = lineParams[1],
      c = lineParams[2],
      w = ctx.canvas.width,
      h = ctx.canvas.height,
      x0,
      y0,
      x1,
      y1;

  function y(x) {
    // ax+by+c=0 => y = -(a/b)*x  - (c/b)
    return -a/b * x - c/b;
  }

  function x(y) {
    // ax+by+c=0 => x = -(b/a)*y - (c/a)
    return -b/a * y - c/a;
  }

  if (b === 0) {
    x0 = -c/a;
    y0 = 0;
  } else {
    x0 = 0;
    y0 = y(x0);
  }

  if (y0 > h) {
    y0 = h;
    x0 = x(y0);
  } else if (y0 < 0) {
    y0 = 0;
    x0 = x(y0);
  }

  // copy-paste heaven
  if (b === 0) {
    x1 = -c/a;
    y1 = h;
  } else {
    x1 = w;
    y1 = y(x1);
  }

  if (y1 > h) {
    y1 = h;
    x1 = x(y1);
  } else if (y1 < 0) {
    y1 = 0;
    x1 = x(y1);
  }

  drawLine(ctx, [x0, y0, x1, y1], '#ff0000');
}

function drawCentroid(ctx, centroid) {
  ctx.beginPath();
  ctx.arc(centroid[0], centroid[1], 5, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#ff0000';
  ctx.fill();
}

function createVisualizerImage(im) {
  var h = im.height(),
      w = im.width(),
      canvas = new Canvas(w, h),
      ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  return ctx;
}

function drawLine(ctx, line, color) {
  ctx.strokeStyle = color || '#ffffff';
  ctx.beginPath();
  ctx.moveTo(line[0], line[1]);
  ctx.lineTo(line[2], line[3]);
  ctx.stroke();
}

function saveImage(ctx, name) {
  var out = fs.createWriteStream(__dirname + '/' + name),
      stream = ctx.canvas.pngStream();

  stream.on('data', function(chunk){
    out.write(chunk);
  });

  stream.on('end', function(){
    console.log('saved png ' + name);
  });
}

module.exports = main;
