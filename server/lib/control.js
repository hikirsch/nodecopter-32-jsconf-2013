function controls(angle, centroidX) {
  // Simple, wild-ass guess
  var controlAngle = -angle,
      speed;

  controlAngle += Math.PI / 6 * (centroidX - 0.5) * (centroidX - 0.5);
  speed = 0.1 + 0.9 * Math.pow(Math.E, controlAngle);

  return [controlAngle / Math.PI * 180, speed];
}

module.exports = controls;

// Pseudocode
// imageCallback = function() {
//   process(image);

//   if (black) {
//     land();
//     // stop
//     return;
//   }

//   if (!red) {
//     high = true;
//     up()
//   } else if (high) {
//     down();
//   }

//   rotate(...)
//   translate(...)
// };
