import React from 'react';

const MockSvgComponent = (props: Record<string, unknown>) => React.createElement('svg', props);

export const Svg = MockSvgComponent;
export const Path = MockSvgComponent;
export const Circle = MockSvgComponent;
export const Rect = MockSvgComponent;
export const G = MockSvgComponent;
export const Line = MockSvgComponent;
export const Polygon = MockSvgComponent;
export const Polyline = MockSvgComponent;

export default MockSvgComponent;
