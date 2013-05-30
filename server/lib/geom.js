// returns line in form [a,b,c]
function lineThrough(x0, y0, theta) {
  // NOTE theta is "standard" form (0 is pointing right)

  var a, b, c;

  a = -Math.tan(theta);
  if (isNaN(a) || Math.abs(a) > 1000) {
    // vertical line
    // 1x + 0y - x0 = 0 => x = x0 (vertical line thru x0)
    a = 1;
    b = 0;
    c = -x0;
  } else {
    // a = -tan(theta)
    // ax + 1y + (-ax0 - y0) = 0 when x = x0, y = y0
    // and y = -ax + (ax0 + y0) (slope is -a)
    b = 1;
    c = -a*x0 - y0;
  }
  return [a,b,c];
}


// line: [a,b,c]; ax+by+c=0
function distanceToLine(line, x0, y0) {
  var a = line[0],
      b = line[1],
      c = line[2];

  // lazily copying a formula from Wikipedia
  // http://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line

  return Math.abs(a * x0 + b * y0 + c) / Math.sqrt(a*a + b*b);
}

// line: [x1,y1,x2,y2]
function getAngle(line) {
  var x1 = line[0],
      y1 = line[1],
      x2 = line[2],
      y2 = line[3];

  return Math.atan2(y2-y1, x2-x1);
}

function meanAngle(angles) {
  var xSum = 0,
      ySum = 0;

  angles.forEach(function(angle) {
    xSum += Math.cos(angle);
    ySum += Math.sin(angle);
  });

  return Math.atan2(ySum, xSum);
}

function centroid(points) {
  var xSum = 0,
      ySum = 0;

  points.forEach(function(point) {
    xSum += point[0];
    ySum += point[1];
  });

  return [xSum / points.length, ySum / points.length];
}

module.exports = {
  lineThrough: lineThrough,
  distanceToLine: distanceToLine,
  getAngle: getAngle,
  meanAngle: meanAngle,
  centroid: centroid
};
