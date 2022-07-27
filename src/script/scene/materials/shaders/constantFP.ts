export const ConstantFragProgram: string = `
  precision highp float;

  uniform float distance;
  uniform int shadingType;
  uniform vec3 color;
  uniform vec3 colorSecondary;
  uniform int fogType;
  uniform float fogDensity;
  uniform vec3 fogColor;

  varying float shade;

  void main() {
    float fogSteps = 12.0;
    if (fogType == 2) {
      fogSteps = 24.0;
    }

    float fogFactor = exp2(-fogDensity * distance);
    fogFactor = 1.0 - clamp(fogFactor, 0.0, 1.0);
    fogFactor = floor(fogFactor * fogSteps + 0.5) / fogSteps;

    vec3 diffuse;
    if (shadingType == 0) {
      if (shade > 0.9) {
        diffuse = color;
      } else if (shade > 0.8) {
        vec2 screen = gl_FragCoord.xy;
        bool dithering = mod(floor(screen.x + screen.y), 2.0) > 0.5;
        diffuse = dithering ? color : colorSecondary;
      } else {
        diffuse = colorSecondary;
      }
    } else {
      diffuse = color * shade;
    }
    gl_FragColor = mix(vec4(diffuse, 1.0), vec4(fogColor, 1.0), fogFactor * 0.92);
  }
`;