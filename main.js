'use strict';

var require$$0 = require('obsidian');

const min = Math.min;
const max = Math.max;
const round = Math.round;
const floor = Math.floor;
const createCoords = v => ({
  x: v,
  y: v
});
const oppositeSideMap = {
  left: 'right',
  right: 'left',
  bottom: 'top',
  top: 'bottom'
};
const oppositeAlignmentMap = {
  start: 'end',
  end: 'start'
};
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === 'function' ? value(param) : value;
}
function getSide(placement) {
  return placement.split('-')[0];
}
function getAlignment(placement) {
  return placement.split('-')[1];
}
function getOppositeAxis(axis) {
  return axis === 'x' ? 'y' : 'x';
}
function getAxisLength(axis) {
  return axis === 'y' ? 'height' : 'width';
}
function getSideAxis(placement) {
  return ['top', 'bottom'].includes(getSide(placement)) ? 'y' : 'x';
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === 'x' ? alignment === (rtl ? 'end' : 'start') ? 'right' : 'left' : alignment === 'start' ? 'bottom' : 'top';
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.replace(/start|end/g, alignment => oppositeAlignmentMap[alignment]);
}
function getSideList(side, isStart, rtl) {
  const lr = ['left', 'right'];
  const rl = ['right', 'left'];
  const tb = ['top', 'bottom'];
  const bt = ['bottom', 'top'];
  switch (side) {
    case 'top':
    case 'bottom':
      if (rtl) return isStart ? rl : lr;
      return isStart ? lr : rl;
    case 'left':
    case 'right':
      return isStart ? tb : bt;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === 'start', rtl);
  if (alignment) {
    list = list.map(side => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, side => oppositeSideMap[side]);
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== 'number' ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  return {
    ...rect,
    top: rect.y,
    left: rect.x,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  };
}

function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === 'y';
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case 'top':
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case 'bottom':
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case 'right':
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case 'left':
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case 'start':
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case 'end':
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a reference element when it is given a certain positioning strategy.
 *
 * This export does not have any `platform` interface logic. You will need to
 * write one for the platform you are using Floating UI with.
 */
const computePosition$1 = async (reference, floating, config) => {
  const {
    placement = 'bottom',
    strategy = 'absolute',
    middleware = [],
    platform
  } = config;
  const validMiddleware = middleware.filter(Boolean);
  const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
  let rects = await platform.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let middlewareData = {};
  let resetCount = 0;
  for (let i = 0; i < validMiddleware.length; i++) {
    const {
      name,
      fn
    } = validMiddleware[i];
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData = {
      ...middlewareData,
      [name]: {
        ...middlewareData[name],
        ...data
      }
    };
    if (reset && resetCount <= 50) {
      resetCount++;
      if (typeof reset === 'object') {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
      continue;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};

/**
 * Resolves with an object of overflow side offsets that determine how much the
 * element is overflowing a given clipping boundary on each side.
 * - positive = overflowing the boundary by that number of pixels
 * - negative = how many pixels left before it will overflow
 * - 0 = lies flush with the boundary
 * @see https://floating-ui.com/docs/detectOverflow
 */
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = 'clippingAncestors',
    rootBoundary = 'viewport',
    elementContext = 'floating',
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === 'floating' ? 'reference' : 'floating';
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform.getClippingRect({
    element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || (await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating))),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === 'floating' ? {
    ...rects.floating,
    x,
    y
  } : rects.reference;
  const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
  const offsetScale = (await (platform.isElement == null ? void 0 : platform.isElement(offsetParent))) ? (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow = options => ({
  name: 'arrow',
  options,
  async fn(state) {
    const {
      x,
      y,
      placement,
      rects,
      platform,
      elements
    } = state;
    // Since `element` is required, we don't Partial<> the type.
    const {
      element,
      padding = 0
    } = evaluate(options, state) || {};
    if (element == null) {
      return {};
    }
    const paddingObject = getPaddingObject(padding);
    const coords = {
      x,
      y
    };
    const axis = getAlignmentAxis(placement);
    const length = getAxisLength(axis);
    const arrowDimensions = await platform.getDimensions(element);
    const isYAxis = axis === 'y';
    const minProp = isYAxis ? 'top' : 'left';
    const maxProp = isYAxis ? 'bottom' : 'right';
    const clientProp = isYAxis ? 'clientHeight' : 'clientWidth';
    const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];
    const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
    let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;

    // DOM platform can return `window` as the `offsetParent`.
    if (!clientSize || !(await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent)))) {
      clientSize = elements.floating[clientProp] || rects.floating[length];
    }
    const centerToReference = endDiff / 2 - startDiff / 2;

    // If the padding is large enough that it causes the arrow to no longer be
    // centered, modify the padding so that it is centered.
    const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
    const minPadding = min(paddingObject[minProp], largestPossiblePadding);
    const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);

    // Make sure the arrow doesn't overflow the floating element if the center
    // point is outside the floating element's bounds.
    const min$1 = minPadding;
    const max = clientSize - arrowDimensions[length] - maxPadding;
    const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset = clamp(min$1, center, max);

    // If the reference is small enough that the arrow's padding causes it to
    // to point to nothing for an aligned placement, adjust the offset of the
    // floating element itself. This stops `shift()` from taking action, but can
    // be worked around by calling it again after the `arrow()` if desired.
    const shouldAddOffset = getAlignment(placement) != null && center != offset && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
    const alignmentOffset = shouldAddOffset ? center < min$1 ? min$1 - center : max - center : 0;
    return {
      [axis]: coords[axis] - alignmentOffset,
      data: {
        [axis]: offset,
        centerOffset: center - offset + alignmentOffset
      }
    };
  }
});

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'flip',
    options,
    async fn(state) {
      var _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = 'bestFit',
        fallbackAxisSideDirection = 'none',
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);
      const side = getSide(placement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      if (!specifiedFallbackPlacements && fallbackAxisSideDirection !== 'none') {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements = [initialPlacement, ...fallbackPlacements];
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides[0]], overflow[sides[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];

      // One or more sides is overflowing.
      if (!overflows.every(side => side <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements[nextIndex];
        if (nextPlacement) {
          // Try next placement and re-run the lifecycle.
          return {
            data: {
              index: nextIndex,
              overflows: overflowsData
            },
            reset: {
              placement: nextPlacement
            }
          };
        }

        // First, find the candidates that fit on the mainAxis side of overflow,
        // then find the placement that fits the best on the main crossAxis side.
        let resetPlacement = (_overflowsData$filter = overflowsData.filter(d => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;

        // Otherwise fallback.
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case 'bestFit':
              {
                var _overflowsData$map$so;
                const placement = (_overflowsData$map$so = overflowsData.map(d => [d.placement, d.overflows.filter(overflow => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$map$so[0];
                if (placement) {
                  resetPlacement = placement;
                }
                break;
              }
            case 'initialPlacement':
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};

// For type backwards-compatibility, the `OffsetOptions` type was also
// Derivable.
async function convertValueToCoords(state, options) {
  const {
    placement,
    platform,
    elements
  } = state;
  const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === 'y';
  const mainAxisMulti = ['left', 'top'].includes(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);

  // eslint-disable-next-line prefer-const
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === 'number' ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: 0,
    crossAxis: 0,
    alignmentAxis: null,
    ...rawValue
  };
  if (alignment && typeof alignmentAxis === 'number') {
    crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}

/**
 * Modifies the placement by translating the floating element along the
 * specified axes.
 * A number (shorthand for `mainAxis` or distance), or an axes configuration
 * object may be passed.
 * @see https://floating-ui.com/docs/offset
 */
const offset = function (options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: 'offset',
    options,
    async fn(state) {
      const {
        x,
        y
      } = state;
      const diffCoords = await convertValueToCoords(state, options);
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: diffCoords
      };
    }
  };
};

/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */
const shift = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'shift',
    options,
    async fn(state) {
      const {
        x,
        y,
        placement
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: _ref => {
            let {
              x,
              y
            } = _ref;
            return {
              x,
              y
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(getSide(placement));
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      if (checkMainAxis) {
        const minSide = mainAxis === 'y' ? 'top' : 'left';
        const maxSide = mainAxis === 'y' ? 'bottom' : 'right';
        const min = mainAxisCoord + overflow[minSide];
        const max = mainAxisCoord - overflow[maxSide];
        mainAxisCoord = clamp(min, mainAxisCoord, max);
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === 'y' ? 'top' : 'left';
        const maxSide = crossAxis === 'y' ? 'bottom' : 'right';
        const min = crossAxisCoord + overflow[minSide];
        const max = crossAxisCoord - overflow[maxSide];
        crossAxisCoord = clamp(min, crossAxisCoord, max);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y
        }
      };
    }
  };
};

function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || '').toLowerCase();
  }
  // Mocked nodes in testing environments may not be instances of Node. By
  // returning `#document` an infinite loop won't occur.
  // https://github.com/floating-ui/floating-ui/issues/2317
  return '#document';
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null ? void 0 : (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  // Browsers without `ShadowRoot` support.
  if (typeof ShadowRoot === 'undefined') {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !['inline', 'contents'].includes(display);
}
function isTableElement(element) {
  return ['table', 'td', 'th'].includes(getNodeName(element));
}
function isContainingBlock(element) {
  const webkit = isWebKit();
  const css = getComputedStyle(element);

  // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
  return css.transform !== 'none' || css.perspective !== 'none' || (css.containerType ? css.containerType !== 'normal' : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== 'none' : false) || !webkit && (css.filter ? css.filter !== 'none' : false) || ['transform', 'perspective', 'filter'].some(value => (css.willChange || '').includes(value)) || ['paint', 'layout', 'strict', 'content'].some(value => (css.contain || '').includes(value));
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else {
      currentNode = getParentNode(currentNode);
    }
  }
  return null;
}
function isWebKit() {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('-webkit-backdrop-filter', 'none');
}
function isLastTraversableNode(node) {
  return ['html', 'body', '#document'].includes(getNodeName(node));
}
function getComputedStyle(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.pageXOffset,
    scrollTop: element.pageYOffset
  };
}
function getParentNode(node) {
  if (getNodeName(node) === 'html') {
    return node;
  }
  const result =
  // Step into the shadow DOM of the parent of a slotted node.
  node.assignedSlot ||
  // DOM Element detected.
  node.parentNode ||
  // ShadowRoot detected.
  isShadowRoot(node) && node.host ||
  // Fallback.
  getDocumentElement(node);
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : []);
  }
  return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor));
}

function getCssDimensions(element) {
  const css = getComputedStyle(element);
  // In testing environments, the `width` and `height` properties are empty
  // strings for SVG elements, returning NaN. Fallback to `0` in this case.
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}

function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}

function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;

  // 0, NaN, or Infinity should always fallback to 1.

  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}

const noOffsets = /*#__PURE__*/createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}

function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentIFrame = win.frameElement;
    while (currentIFrame && offsetParent && offsetWin !== win) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentIFrame = getWindow(currentIFrame).frameElement;
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}

function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  if (offsetParent === documentElement) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && strategy !== 'fixed') {
    if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y
  };
}

function getClientRects(element) {
  return Array.from(element.getClientRects());
}

function getWindowScrollBarX(element) {
  // If <html> has a CSS width greater than the viewport, then this will be
  // incorrect for RTL.
  return getBoundingClientRect(getDocumentElement(element)).left + getNodeScroll(element).scrollLeft;
}

// Gets the entire size of the scrollable document area, even extending outside
// of the `<html>` and `<body>` rect bounds if horizontally scrollable.
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;
  if (getComputedStyle(body).direction === 'rtl') {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}

function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === 'fixed') {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x,
    y
  };
}

// Returns the inner client rect, subtracting scrollbars if present.
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === 'fixed');
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === 'viewport') {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === 'document') {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      ...clippingAncestor,
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle(parentNode).position === 'fixed' || hasFixedPositionAncestor(parentNode, stopNode);
}

// A "clipping ancestor" is an `overflow` element with the characteristic of
// clipping (or hiding) child elements. This returns all clipping ancestors
// of the given element up the tree.
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element).filter(el => isElement(el) && getNodeName(el) !== 'body');
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle(element).position === 'fixed';
  let currentNode = elementIsFixed ? getParentNode(element) : element;

  // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === 'static' && !!currentContainingBlockComputedStyle && ['absolute', 'fixed'].includes(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      // Drop non-containing blocks.
      result = result.filter(ancestor => ancestor !== currentNode);
    } else {
      // Record last containing block for next iteration.
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}

// Gets the maximum area that the element is visible in due to any number of
// clipping ancestors.
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === 'clippingAncestors' ? getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstClippingAncestor = clippingAncestors[0];
  const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top
  };
}

function getDimensions(element) {
  return getCssDimensions(element);
}

function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === 'fixed';
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }
  return {
    x: rect.left + scroll.scrollLeft - offsets.x,
    y: rect.top + scroll.scrollTop - offsets.y,
    width: rect.width,
    height: rect.height
  };
}

function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle(element).position === 'fixed') {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  return element.offsetParent;
}

// Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.
function getOffsetParent(element, polyfill) {
  const window = getWindow(element);
  if (!isHTMLElement(element)) {
    return window;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && getComputedStyle(offsetParent).position === 'static') {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle(offsetParent).position === 'static' && !isContainingBlock(offsetParent))) {
    return window;
  }
  return offsetParent || getContainingBlock(element) || window;
}

const getElementRects = async function (_ref) {
  let {
    reference,
    floating,
    strategy
  } = _ref;
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  return {
    reference: getRectRelativeToOffsetParent(reference, await getOffsetParentFn(floating), strategy),
    floating: {
      x: 0,
      y: 0,
      ...(await getDimensionsFn(floating))
    }
  };
};

function isRTL(element) {
  return getComputedStyle(element).direction === 'rtl';
}

const platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};

// https://samthor.au/2021/observing-dom/
function observeMove(element, onMove) {
  let io = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    clearTimeout(timeoutId);
    io && io.disconnect();
    io = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const {
      left,
      top,
      width,
      height
    } = element.getBoundingClientRect();
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 100);
        } else {
          refresh(false, ratio);
        }
      }
      isFirstUpdate = false;
    }

    // Older browsers don't support a `document` as the root and will throw an
    // error.
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (e) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  refresh(true);
  return cleanup;
}

/**
 * Automatically updates the position of the floating element when necessary.
 * Should only be called when the floating element is mounted on the DOM or
 * visible on the screen.
 * @returns cleanup function that should be invoked when the floating element is
 * removed from the DOM or hidden from the screen.
 * @see https://floating-ui.com/docs/autoUpdate
 */
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === 'function',
    layoutShift = typeof IntersectionObserver === 'function',
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...(referenceEl ? getOverflowAncestors(referenceEl) : []), ...getOverflowAncestors(floating)] : [];
  ancestors.forEach(ancestor => {
    ancestorScroll && ancestor.addEventListener('scroll', update, {
      passive: true
    });
    ancestorResize && ancestor.addEventListener('resize', update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver(_ref => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
        // Prevent update loops when using the `size` middleware.
        // https://github.com/floating-ui/floating-ui/issues/1740
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          resizeObserver && resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    resizeObserver.observe(floating);
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    ancestors.forEach(ancestor => {
      ancestorScroll && ancestor.removeEventListener('scroll', update);
      ancestorResize && ancestor.removeEventListener('resize', update);
    });
    cleanupIo && cleanupIo();
    resizeObserver && resizeObserver.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a reference element when it is given a certain CSS positioning
 * strategy.
 */
const computePosition = (reference, floating, options) => {
  // This caches the expensive `getClippingElementAncestors` function so that
  // multiple lifecycle resets re-use the same result. It only lives for a
  // single call. If other functions become expensive, we can add them as well.
  const cache = new Map();
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition$1(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

/** @returns {void} */
function noop() {}

/**
 * @template T
 * @template S
 * @param {T} tar
 * @param {S} src
 * @returns {T & S}
 */
function assign(tar, src) {
	// @ts-ignore
	for (const k in src) tar[k] = src[k];
	return /** @type {T & S} */ (tar);
}

// Adapted from https://github.com/then/is-promise/blob/master/index.js
// Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
/**
 * @param {any} value
 * @returns {value is PromiseLike<any>}
 */
function is_promise(value) {
	return (
		!!value &&
		(typeof value === 'object' || typeof value === 'function') &&
		typeof (/** @type {any} */ (value).then) === 'function'
	);
}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/**
 * @param {any} thing
 * @returns {thing is Function}
 */
function is_function(thing) {
	return typeof thing === 'function';
}

/** @returns {boolean} */
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

/** @returns {boolean} */
function not_equal(a, b) {
	return a != a ? b == b : a !== b;
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

function subscribe(store, ...callbacks) {
	if (store == null) {
		for (const callback of callbacks) {
			callback(undefined);
		}
		return noop;
	}
	const unsub = store.subscribe(...callbacks);
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}

/** @returns {void} */
function component_subscribe(component, store, callback) {
	component.$$.on_destroy.push(subscribe(store, callback));
}

function create_slot(definition, ctx, $$scope, fn) {
	if (definition) {
		const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
		return definition[0](slot_ctx);
	}
}

function get_slot_context(definition, ctx, $$scope, fn) {
	return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}

function get_slot_changes(definition, $$scope, dirty, fn) {
	if (definition[2] && fn) {
		const lets = definition[2](fn(dirty));
		if ($$scope.dirty === undefined) {
			return lets;
		}
		if (typeof lets === 'object') {
			const merged = [];
			const len = Math.max($$scope.dirty.length, lets.length);
			for (let i = 0; i < len; i += 1) {
				merged[i] = $$scope.dirty[i] | lets[i];
			}
			return merged;
		}
		return $$scope.dirty | lets;
	}
	return $$scope.dirty;
}

/** @returns {void} */
function update_slot_base(
	slot,
	slot_definition,
	ctx,
	$$scope,
	slot_changes,
	get_slot_context_fn
) {
	if (slot_changes) {
		const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
		slot.p(slot_context, slot_changes);
	}
}

/** @returns {any[] | -1} */
function get_all_dirty_from_scope($$scope) {
	if ($$scope.ctx.length > 32) {
		const dirty = [];
		const length = $$scope.ctx.length / 32;
		for (let i = 0; i < length; i++) {
			dirty[i] = -1;
		}
		return dirty;
	}
	return -1;
}

function null_to_empty(value) {
	return value == null ? '' : value;
}

const contenteditable_truthy_values = ['', true, 1, 'true', 'contenteditable'];

/**
 * @param {Node} target
 * @param {Node} node
 * @returns {void}
 */
function append(target, node) {
	target.appendChild(node);
}

/**
 * @param {Node} target
 * @param {string} style_sheet_id
 * @param {string} styles
 * @returns {void}
 */
function append_styles(target, style_sheet_id, styles) {
	const append_styles_to = get_root_for_style(target);
	if (!append_styles_to.getElementById(style_sheet_id)) {
		const style = element('style');
		style.id = style_sheet_id;
		style.textContent = styles;
		append_stylesheet(append_styles_to, style);
	}
}

/**
 * @param {Node} node
 * @returns {ShadowRoot | Document}
 */
function get_root_for_style(node) {
	if (!node) return document;
	const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
	if (root && /** @type {ShadowRoot} */ (root).host) {
		return /** @type {ShadowRoot} */ (root);
	}
	return node.ownerDocument;
}

/**
 * @param {ShadowRoot | Document} node
 * @param {HTMLStyleElement} style
 * @returns {CSSStyleSheet}
 */
function append_stylesheet(node, style) {
	append(/** @type {Document} */ (node).head || node, style);
	return style.sheet;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @param {Node} [anchor]
 * @returns {void}
 */
function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

/**
 * @param {Node} node
 * @returns {void}
 */
function detach(node) {
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
}

/**
 * @returns {void} */
function destroy_each(iterations, detaching) {
	for (let i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d(detaching);
	}
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} name
 * @returns {HTMLElementTagNameMap[K]}
 */
function element(name) {
	return document.createElement(name);
}

/**
 * @template {keyof SVGElementTagNameMap} K
 * @param {K} name
 * @returns {SVGElement}
 */
function svg_element(name) {
	return document.createElementNS('http://www.w3.org/2000/svg', name);
}

/**
 * @param {string} data
 * @returns {Text}
 */
function text(data) {
	return document.createTextNode(data);
}

/**
 * @returns {Text} */
function space() {
	return text(' ');
}

/**
 * @returns {Text} */
function empty() {
	return text('');
}

/**
 * @param {EventTarget} node
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} handler
 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
 * @returns {() => void}
 */
function listen(node, event, handler, options) {
	node.addEventListener(event, handler, options);
	return () => node.removeEventListener(event, handler, options);
}

/**
 * @param {Element} node
 * @param {string} attribute
 * @param {string} [value]
 * @returns {void}
 */
function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}
/**
 * List of attributes that should always be set through the attr method,
 * because updating them through the property setter doesn't work reliably.
 * In the example of `width`/`height`, the problem is that the setter only
 * accepts numeric values, but the attribute can also be set to a string like `50%`.
 * If this list becomes too big, rethink this approach.
 */
const always_set_through_set_attribute = ['width', 'height'];

/**
 * @param {Element & ElementCSSInlineStyle} node
 * @param {{ [x: string]: string }} attributes
 * @returns {void}
 */
function set_attributes(node, attributes) {
	// @ts-ignore
	const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
	for (const key in attributes) {
		if (attributes[key] == null) {
			node.removeAttribute(key);
		} else if (key === 'style') {
			node.style.cssText = attributes[key];
		} else if (key === '__value') {
			/** @type {any} */ (node).value = node[key] = attributes[key];
		} else if (
			descriptors[key] &&
			descriptors[key].set &&
			always_set_through_set_attribute.indexOf(key) === -1
		) {
			node[key] = attributes[key];
		} else {
			attr(node, key, attributes[key]);
		}
	}
}

/**
 * @param {Element} element
 * @returns {ChildNode[]}
 */
function children(element) {
	return Array.from(element.childNodes);
}

/**
 * @param {Text} text
 * @param {unknown} data
 * @returns {void}
 */
function set_data(text, data) {
	data = '' + data;
	if (text.data === data) return;
	text.data = /** @type {string} */ (data);
}

/**
 * @param {Text} text
 * @param {unknown} data
 * @returns {void}
 */
function set_data_contenteditable(text, data) {
	data = '' + data;
	if (text.wholeText === data) return;
	text.data = /** @type {string} */ (data);
}

/**
 * @param {Text} text
 * @param {unknown} data
 * @param {string} attr_value
 * @returns {void}
 */
function set_data_maybe_contenteditable(text, data, attr_value) {
	if (~contenteditable_truthy_values.indexOf(attr_value)) {
		set_data_contenteditable(text, data);
	} else {
		set_data(text, data);
	}
}

/**
 * @returns {void} */
function set_style(node, key, value, important) {
	if (value == null) {
		node.style.removeProperty(key);
	} else {
		node.style.setProperty(key, value, important ? 'important' : '');
	}
}

/**
 * @returns {void} */
function toggle_class(element, name, toggle) {
	// The `!!` is required because an `undefined` flag means flipping the current state.
	element.classList.toggle(name, !!toggle);
}

/**
 * @template T
 * @param {string} type
 * @param {T} [detail]
 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
 * @returns {CustomEvent<T>}
 */
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
	return new CustomEvent(type, { detail, bubbles, cancelable });
}

/**
 * @typedef {Node & {
 * 	claim_order?: number;
 * 	hydrate_init?: true;
 * 	actual_end_child?: NodeEx;
 * 	childNodes: NodeListOf<NodeEx>;
 * }} NodeEx
 */

/** @typedef {ChildNode & NodeEx} ChildNodeEx */

/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

/**
 * @typedef {ChildNodeEx[] & {
 * 	claim_info?: {
 * 		last_index: number;
 * 		total_claimed: number;
 * 	};
 * }} ChildNodeArray
 */

let current_component;

/** @returns {void} */
function set_current_component(component) {
	current_component = component;
}

function get_current_component() {
	if (!current_component) throw new Error('Function called outside component initialization');
	return current_component;
}

/**
 * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
 *
 * Component events created with `createEventDispatcher` create a
 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
 * property and can contain any type of data.
 *
 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
 * ```ts
 * const dispatch = createEventDispatcher<{
 *  loaded: never; // does not take a detail argument
 *  change: string; // takes a detail argument of type string, which is required
 *  optional: number | null; // takes an optional detail argument of type number
 * }>();
 * ```
 *
 * https://svelte.dev/docs/svelte#createeventdispatcher
 * @template {Record<string, any>} [EventMap=any]
 * @returns {import('./public.js').EventDispatcher<EventMap>}
 */
function createEventDispatcher() {
	const component = get_current_component();
	return (type, detail, { cancelable = false } = {}) => {
		const callbacks = component.$$.callbacks[type];
		if (callbacks) {
			// TODO are there situations where events could be dispatched
			// in a server (non-DOM) environment?
			const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
			callbacks.slice().forEach((fn) => {
				fn.call(component, event);
			});
			return !event.defaultPrevented;
		}
		return true;
	};
}

/**
 * Retrieves the context that belongs to the closest parent component with the specified `key`.
 * Must be called during component initialisation.
 *
 * https://svelte.dev/docs/svelte#getcontext
 * @template T
 * @param {any} key
 * @returns {T}
 */
function getContext(key) {
	return get_current_component().$$.context.get(key);
}

const dirty_components = [];
const binding_callbacks = [];

let render_callbacks = [];

const flush_callbacks = [];

const resolved_promise = /* @__PURE__ */ Promise.resolve();

let update_scheduled = false;

/** @returns {void} */
function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

/** @returns {void} */
function add_render_callback(fn) {
	render_callbacks.push(fn);
}

// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();

let flushidx = 0; // Do *not* move this inside the flush() function

/** @returns {void} */
function flush() {
	// Do not reenter flush while dirty components are updated, as this can
	// result in an infinite loop. Instead, let the inner flush handle it.
	// Reentrancy is ok afterwards for bindings etc.
	if (flushidx !== 0) {
		return;
	}
	const saved_component = current_component;
	do {
		// first, call beforeUpdate functions
		// and update components
		try {
			while (flushidx < dirty_components.length) {
				const component = dirty_components[flushidx];
				flushidx++;
				set_current_component(component);
				update(component.$$);
			}
		} catch (e) {
			// reset dirty state to not end up in a deadlocked state and then rethrow
			dirty_components.length = 0;
			flushidx = 0;
			throw e;
		}
		set_current_component(null);
		dirty_components.length = 0;
		flushidx = 0;
		while (binding_callbacks.length) binding_callbacks.pop()();
		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];
			if (!seen_callbacks.has(callback)) {
				// ...so guard against infinite loops
				seen_callbacks.add(callback);
				callback();
			}
		}
		render_callbacks.length = 0;
	} while (dirty_components.length);
	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}
	update_scheduled = false;
	seen_callbacks.clear();
	set_current_component(saved_component);
}

/** @returns {void} */
function update($$) {
	if ($$.fragment !== null) {
		$$.update();
		run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [-1];
		$$.fragment && $$.fragment.p($$.ctx, dirty);
		$$.after_update.forEach(add_render_callback);
	}
}

/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 * @param {Function[]} fns
 * @returns {void}
 */
function flush_render_callbacks(fns) {
	const filtered = [];
	const targets = [];
	render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
	targets.forEach((c) => c());
	render_callbacks = filtered;
}

const outroing = new Set();

/**
 * @type {Outro}
 */
let outros;

/**
 * @returns {void} */
function group_outros() {
	outros = {
		r: 0,
		c: [],
		p: outros // parent group
	};
}

/**
 * @returns {void} */
function check_outros() {
	if (!outros.r) {
		run_all(outros.c);
	}
	outros = outros.p;
}

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} [local]
 * @returns {void}
 */
function transition_in(block, local) {
	if (block && block.i) {
		outroing.delete(block);
		block.i(local);
	}
}

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} local
 * @param {0 | 1} [detach]
 * @param {() => void} [callback]
 * @returns {void}
 */
function transition_out(block, local, detach, callback) {
	if (block && block.o) {
		if (outroing.has(block)) return;
		outroing.add(block);
		outros.c.push(() => {
			outroing.delete(block);
			if (callback) {
				if (detach) block.d(1);
				callback();
			}
		});
		block.o(local);
	} else if (callback) {
		callback();
	}
}

/** @typedef {1} INTRO */
/** @typedef {0} OUTRO */
/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

/**
 * @typedef {Object} Outro
 * @property {number} r
 * @property {Function[]} c
 * @property {Object} p
 */

/**
 * @typedef {Object} PendingProgram
 * @property {number} start
 * @property {INTRO|OUTRO} b
 * @property {Outro} [group]
 */

/**
 * @typedef {Object} Program
 * @property {number} a
 * @property {INTRO|OUTRO} b
 * @property {1|-1} d
 * @property {number} duration
 * @property {number} start
 * @property {number} end
 * @property {Outro} [group]
 */

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {import('./private.js').PromiseInfo<T>} info
 * @returns {boolean}
 */
function handle_promise(promise, info) {
	const token = (info.token = {});
	/**
	 * @param {import('./private.js').FragmentFactory} type
	 * @param {0 | 1 | 2} index
	 * @param {number} [key]
	 * @param {any} [value]
	 * @returns {void}
	 */
	function update(type, index, key, value) {
		if (info.token !== token) return;
		info.resolved = value;
		let child_ctx = info.ctx;
		if (key !== undefined) {
			child_ctx = child_ctx.slice();
			child_ctx[key] = value;
		}
		const block = type && (info.current = type)(child_ctx);
		let needs_flush = false;
		if (info.block) {
			if (info.blocks) {
				info.blocks.forEach((block, i) => {
					if (i !== index && block) {
						group_outros();
						transition_out(block, 1, 1, () => {
							if (info.blocks[i] === block) {
								info.blocks[i] = null;
							}
						});
						check_outros();
					}
				});
			} else {
				info.block.d(1);
			}
			block.c();
			transition_in(block, 1);
			block.m(info.mount(), info.anchor);
			needs_flush = true;
		}
		info.block = block;
		if (info.blocks) info.blocks[index] = block;
		if (needs_flush) {
			flush();
		}
	}
	if (is_promise(promise)) {
		const current_component = get_current_component();
		promise.then(
			(value) => {
				set_current_component(current_component);
				update(info.then, 1, info.value, value);
				set_current_component(null);
			},
			(error) => {
				set_current_component(current_component);
				update(info.catch, 2, info.error, error);
				set_current_component(null);
				if (!info.hasCatch) {
					throw error;
				}
			}
		);
		// if we previously had a then/catch block, destroy it
		if (info.current !== info.pending) {
			update(info.pending, 0);
			return true;
		}
	} else {
		if (info.current !== info.then) {
			update(info.then, 1, info.value, promise);
			return true;
		}
		info.resolved = /** @type {T} */ (promise);
	}
}

/** @returns {void} */
function update_await_block_branch(info, ctx, dirty) {
	const child_ctx = ctx.slice();
	const { resolved } = info;
	if (info.current === info.then) {
		child_ctx[info.value] = resolved;
	}
	if (info.current === info.catch) {
		child_ctx[info.error] = resolved;
	}
	info.block.p(child_ctx, dirty);
}

// general each functions:

function ensure_array_like(array_like_or_iterator) {
	return array_like_or_iterator?.length !== undefined
		? array_like_or_iterator
		: Array.from(array_like_or_iterator);
}

/** @returns {void} */
function outro_and_destroy_block(block, lookup) {
	transition_out(block, 1, 1, () => {
		lookup.delete(block.key);
	});
}

/** @returns {any[]} */
function update_keyed_each(
	old_blocks,
	dirty,
	get_key,
	dynamic,
	ctx,
	list,
	lookup,
	node,
	destroy,
	create_each_block,
	next,
	get_context
) {
	let o = old_blocks.length;
	let n = list.length;
	let i = o;
	const old_indexes = {};
	while (i--) old_indexes[old_blocks[i].key] = i;
	const new_blocks = [];
	const new_lookup = new Map();
	const deltas = new Map();
	const updates = [];
	i = n;
	while (i--) {
		const child_ctx = get_context(ctx, list, i);
		const key = get_key(child_ctx);
		let block = lookup.get(key);
		if (!block) {
			block = create_each_block(key, child_ctx);
			block.c();
		} else if (dynamic) {
			// defer updates until all the DOM shuffling is done
			updates.push(() => block.p(child_ctx, dirty));
		}
		new_lookup.set(key, (new_blocks[i] = block));
		if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
	}
	const will_move = new Set();
	const did_move = new Set();
	/** @returns {void} */
	function insert(block) {
		transition_in(block, 1);
		block.m(node, next);
		lookup.set(block.key, block);
		next = block.first;
		n--;
	}
	while (o && n) {
		const new_block = new_blocks[n - 1];
		const old_block = old_blocks[o - 1];
		const new_key = new_block.key;
		const old_key = old_block.key;
		if (new_block === old_block) {
			// do nothing
			next = new_block.first;
			o--;
			n--;
		} else if (!new_lookup.has(old_key)) {
			// remove old block
			destroy(old_block, lookup);
			o--;
		} else if (!lookup.has(new_key) || will_move.has(new_key)) {
			insert(new_block);
		} else if (did_move.has(old_key)) {
			o--;
		} else if (deltas.get(new_key) > deltas.get(old_key)) {
			did_move.add(new_key);
			insert(new_block);
		} else {
			will_move.add(old_key);
			o--;
		}
	}
	while (o--) {
		const old_block = old_blocks[o];
		if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
	}
	while (n) insert(new_blocks[n - 1]);
	run_all(updates);
	return new_blocks;
}

/** @returns {{}} */
function get_spread_update(levels, updates) {
	const update = {};
	const to_null_out = {};
	const accounted_for = { $$scope: 1 };
	let i = levels.length;
	while (i--) {
		const o = levels[i];
		const n = updates[i];
		if (n) {
			for (const key in o) {
				if (!(key in n)) to_null_out[key] = 1;
			}
			for (const key in n) {
				if (!accounted_for[key]) {
					update[key] = n[key];
					accounted_for[key] = 1;
				}
			}
			levels[i] = n;
		} else {
			for (const key in o) {
				accounted_for[key] = 1;
			}
		}
	}
	for (const key in to_null_out) {
		if (!(key in update)) update[key] = undefined;
	}
	return update;
}

function get_spread_object(spread_props) {
	return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}

/** @returns {void} */
function create_component(block) {
	block && block.c();
}

/** @returns {void} */
function mount_component(component, target, anchor) {
	const { fragment, after_update } = component.$$;
	fragment && fragment.m(target, anchor);
	// onMount happens before the initial afterUpdate
	add_render_callback(() => {
		const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
		// if the component was destroyed immediately
		// it will update the `$$.on_destroy` reference to `null`.
		// the destructured on_destroy may still reference to the old array
		if (component.$$.on_destroy) {
			component.$$.on_destroy.push(...new_on_destroy);
		} else {
			// Edge case - component was destroyed immediately,
			// most likely as a result of a binding initialising
			run_all(new_on_destroy);
		}
		component.$$.on_mount = [];
	});
	after_update.forEach(add_render_callback);
}

/** @returns {void} */
function destroy_component(component, detaching) {
	const $$ = component.$$;
	if ($$.fragment !== null) {
		flush_render_callbacks($$.after_update);
		run_all($$.on_destroy);
		$$.fragment && $$.fragment.d(detaching);
		// TODO null out other refs, including component.$$ (but need to
		// preserve final state?)
		$$.on_destroy = $$.fragment = null;
		$$.ctx = [];
	}
}

/** @returns {void} */
function make_dirty(component, i) {
	if (component.$$.dirty[0] === -1) {
		dirty_components.push(component);
		schedule_update();
		component.$$.dirty.fill(0);
	}
	component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
}

/** @returns {void} */
function init(
	component,
	options,
	instance,
	create_fragment,
	not_equal,
	props,
	append_styles,
	dirty = [-1]
) {
	const parent_component = current_component;
	set_current_component(component);
	/** @type {import('./private.js').T$$} */
	const $$ = (component.$$ = {
		fragment: null,
		ctx: [],
		// state
		props,
		update: noop,
		not_equal,
		bound: blank_object(),
		// lifecycle
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
		// everything else
		callbacks: blank_object(),
		dirty,
		skip_bound: false,
		root: options.target || parent_component.$$.root
	});
	append_styles && append_styles($$.root);
	let ready = false;
	$$.ctx = instance
		? instance(component, options.props || {}, (i, ret, ...rest) => {
				const value = rest.length ? rest[0] : ret;
				if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
					if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
					if (ready) make_dirty(component, i);
				}
				return ret;
		  })
		: [];
	$$.update();
	ready = true;
	run_all($$.before_update);
	// `false` as a special case of no DOM component
	$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
	if (options.target) {
		if (options.hydrate) {
			const nodes = children(options.target);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.l(nodes);
			nodes.forEach(detach);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.c();
		}
		if (options.intro) transition_in(component.$$.fragment);
		mount_component(component, options.target, options.anchor);
		flush();
	}
	set_current_component(parent_component);
}

/**
 * Base class for Svelte components. Used when dev=false.
 *
 * @template {Record<string, any>} [Props=any]
 * @template {Record<string, any>} [Events=any]
 */
class SvelteComponent {
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$ = undefined;
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$set = undefined;

	/** @returns {void} */
	$destroy() {
		destroy_component(this, 1);
		this.$destroy = noop;
	}

	/**
	 * @template {Extract<keyof Events, string>} K
	 * @param {K} type
	 * @param {((e: Events[K]) => void) | null | undefined} callback
	 * @returns {() => void}
	 */
	$on(type, callback) {
		if (!is_function(callback)) {
			return noop;
		}
		const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
		callbacks.push(callback);
		return () => {
			const index = callbacks.indexOf(callback);
			if (index !== -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * @param {Partial<Props>} props
	 * @returns {void}
	 */
	$set(props) {
		if (this.$$set && !is_empty(props)) {
			this.$$.skip_bound = true;
			this.$$set(props);
			this.$$.skip_bound = false;
		}
	}
}

/**
 * @typedef {Object} CustomElementPropDefinition
 * @property {string} [attribute]
 * @property {boolean} [reflect]
 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
 */

// generated during release, do not modify

const PUBLIC_VERSION = '4';

if (typeof window !== 'undefined')
	// @ts-ignore
	(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e))for(t=0;t<e.length;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);else for(t in e)e[t]&&(n&&(n+=" "),n+=t);return n}function clsx(){for(var e,t,f=0,n="";f<arguments.length;)(e=arguments[f++])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

const subscriber_queue = [];

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 *
 * https://svelte.dev/docs/svelte-store#writable
 * @template T
 * @param {T} [value] initial value
 * @param {import('./public.js').StartStopNotifier<T>} [start]
 * @returns {import('./public.js').Writable<T>}
 */
function writable(value, start = noop) {
	/** @type {import('./public.js').Unsubscriber} */
	let stop;
	/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
	const subscribers = new Set();
	/** @param {T} new_value
	 * @returns {void}
	 */
	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value;
			if (stop) {
				// store is ready
				const run_queue = !subscriber_queue.length;
				for (const subscriber of subscribers) {
					subscriber[1]();
					subscriber_queue.push(subscriber, value);
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue.length; i += 2) {
						subscriber_queue[i][0](subscriber_queue[i + 1]);
					}
					subscriber_queue.length = 0;
				}
			}
		}
	}

	/**
	 * @param {import('./public.js').Updater<T>} fn
	 * @returns {void}
	 */
	function update(fn) {
		set(fn(value));
	}

	/**
	 * @param {import('./public.js').Subscriber<T>} run
	 * @param {import('./private.js').Invalidator<T>} [invalidate]
	 * @returns {import('./public.js').Unsubscriber}
	 */
	function subscribe(run, invalidate = noop) {
		/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
		const subscriber = [run, invalidate];
		subscribers.add(subscriber);
		if (subscribers.size === 1) {
			stop = start(set, update) || noop;
		}
		run(value);
		return () => {
			subscribers.delete(subscriber);
			if (subscribers.size === 0 && stop) {
				stop();
				stop = null;
			}
		};
	}
	return { set, update, subscribe };
}

const localesMap = new Map();
const locales = [
    { key: 'af', name: 'Afrikaans' },
    { key: 'am', name: 'Amharic' },
    { key: 'ar-dz', name: 'Arabic (Algeria)' },
    { key: 'ar-iq', name: ' Arabic (Iraq)' },
    { key: 'ar-kw', name: 'Arabic (Kuwait)' },
    { key: 'ar-ly', name: 'Arabic (Lybia)' },
    { key: 'ar-ma', name: 'Arabic (Morocco)' },
    { key: 'ar-sa', name: 'Arabic (Saudi Arabia)' },
    { key: 'ar-tn', name: ' Arabic (Tunisia)' },
    { key: 'ar', name: 'Arabic' },
    { key: 'az', name: 'Azerbaijani' },
    { key: 'be', name: 'Belarusian' },
    { key: 'bg', name: 'Bulgarian' },
    { key: 'bi', name: 'Bislama' },
    { key: 'bm', name: 'Bambara' },
    { key: 'bn-bd', name: 'Bengali (Bangladesh)' },
    { key: 'bn', name: 'Bengali' },
    { key: 'bo', name: 'Tibetan' },
    { key: 'br', name: 'Breton' },
    { key: 'bs', name: 'Bosnian' },
    { key: 'ca', name: 'Catalan' },
    { key: 'cs', name: 'Czech' },
    { key: 'cv', name: 'Chuvash' },
    { key: 'cy', name: 'Welsh' },
    { key: 'da', name: 'Danish' },
    { key: 'de-at', name: 'German (Austria)' },
    { key: 'de-ch', name: 'German (Switzerland)' },
    { key: 'de', name: 'German' },
    { key: 'dv', name: 'Maldivian' },
    { key: 'el', name: 'Greek' },
    { key: 'en-au', name: 'English (Australia)' },
    { key: 'en-ca', name: 'English (Canada)' },
    { key: 'en-gb', name: 'English (United Kingdom)' },
    { key: 'en-ie', name: 'English (Ireland)' },
    { key: 'en-il', name: 'English (Israel)' },
    { key: 'en-in', name: 'English (India)' },
    { key: 'en-nz', name: 'English (New Zealand)' },
    { key: 'en-sg', name: 'English (Singapore)' },
    { key: 'en-tt', name: 'English (Trinidad & Tobago)' },
    { key: 'en', name: 'English' },
    { key: 'eo', name: 'Esperanto' },
    { key: 'es-do', name: 'Spanish (Dominican Republic)' },
    { key: 'es-mx', name: 'Spanish (Mexico)' },
    { key: 'es-pr', name: 'Spanish (Puerto Rico)' },
    { key: 'es-us', name: 'Spanish (United States)' },
    { key: 'es', name: 'Spanish' },
    { key: 'et', name: 'Estonian' },
    { key: 'eu', name: 'Basque' },
    { key: 'fa', name: 'Persian' },
    { key: 'fi', name: 'Finnish' },
    { key: 'fo', name: 'Faroese' },
    { key: 'fr-ca', name: 'French (Canada)' },
    { key: 'fr-ch', name: 'French (Switzerland)' },
    { key: 'fr', name: 'French' },
    { key: 'fy', name: 'Frisian' },
    { key: 'ga', name: 'Irish or Irish Gaelic' },
    { key: 'gd', name: 'Scottish Gaelic' },
    { key: 'gl', name: 'Galician' },
    { key: 'gom-latn', name: 'Konkani Latin script' },
    { key: 'gu', name: 'Gujarati' },
    { key: 'he', name: 'Hebrew' },
    { key: 'hi', name: 'Hindi' },
    { key: 'hr', name: 'Croatian' },
    { key: 'ht', name: 'Haitian Creole (Haiti)' },
    { key: 'hu', name: 'Hungarian' },
    { key: 'hy-am', name: 'Armenian' },
    { key: 'id', name: 'Indonesian' },
    { key: 'is', name: 'Icelandic' },
    { key: 'it-ch', name: 'Italian (Switzerland)' },
    { key: 'it', name: 'Italian' },
    { key: 'ja', name: 'Japanese' },
    { key: 'jv', name: 'Javanese' },
    { key: 'ka', name: 'Georgian' },
    { key: 'kk', name: 'Kazakh' },
    { key: 'km', name: 'Cambodian' },
    { key: 'kn', name: 'Kannada' },
    { key: 'ko', name: 'Korean' },
    { key: 'ku', name: 'Kurdish' },
    { key: 'ky', name: 'Kyrgyz' },
    { key: 'lb', name: 'Luxembourgish' },
    { key: 'lo', name: 'Lao' },
    { key: 'lt', name: 'Lithuanian' },
    { key: 'lv', name: 'Latvian' },
    { key: 'me', name: 'Montenegrin' },
    { key: 'mi', name: 'Maori' },
    { key: 'mk', name: 'Macedonian' },
    { key: 'ml', name: 'Malayalam' },
    { key: 'mn', name: 'Mongolian' },
    { key: 'mr', name: 'Marathi' },
    { key: 'ms-my', name: 'Malay' },
    { key: 'ms', name: 'Malay' },
    { key: 'mt', name: 'Maltese (Malta)' },
    { key: 'my', name: 'Burmese' },
    { key: 'nb', name: 'Norwegian Bokmål' },
    { key: 'ne', name: 'Nepalese' },
    { key: 'nl-be', name: 'Dutch (Belgium)' },
    { key: 'nl', name: 'Dutch' },
    { key: 'nn', name: 'Nynorsk' },
    { key: 'oc-lnc', name: 'Occitan, lengadocian dialecte' },
    { key: 'pa-in', name: 'Punjabi (India)' },
    { key: 'pl', name: 'Polish' },
    { key: 'pt-br', name: 'Portuguese (Brazil)' },
    { key: 'pt', name: 'Portuguese' },
    { key: 'rn', name: 'Kirundi' },
    { key: 'sd', name: 'Sindhi' },
    { key: 'se', name: 'Northern Sami' },
    { key: 'si', name: 'Sinhalese' },
    { key: 'sk', name: 'Slovak' },
    { key: 'sl', name: 'Slovenian' },
    { key: 'sq', name: 'Albanian' },
    { key: 'sr-cyrl', name: 'Serbian Cyrillic' },
    { key: 'sr', name: 'Serbian' },
    { key: 'ss', name: 'siSwati' },
    { key: 'sv-fi', name: 'Finland Swedish' },
    { key: 'sv', name: 'Swedish' },
    { key: 'sw', name: 'Swahili' },
    { key: 'ta', name: 'Tamil' },
    { key: 'te', name: 'Telugu' },
    { key: 'tet', name: 'Tetun Dili (East Timor)' },
    { key: 'tg', name: 'Tajik' },
    { key: 'th', name: 'Thai' },
    { key: 'tk', name: 'Turkmen' },
    { key: 'tl-ph', name: 'Tagalog (Philippines)' },
    { key: 'tlh', name: 'Klingon' },
    { key: 'tr', name: 'Turkish' },
    { key: 'tzl', name: 'Talossan' },
    { key: 'tzm-latn', name: 'Central Atlas Tamazight Latin' },
    { key: 'tzm', name: 'Central Atlas Tamazight' },
    { key: 'ug-cn', name: 'Uyghur (China)' },
    { key: 'uk', name: 'Ukrainian' },
    { key: 'ur', name: 'Urdu' },
    { key: 'uz-latn', name: 'Uzbek Latin' },
    { key: 'uz', name: 'Uzbek' },
    { key: 'vi', name: 'Vietnamese' },
    { key: 'x-pseudo', name: 'Pseudo' },
    { key: 'yo', name: 'Yoruba Nigeria' },
    { key: 'zh-cn', name: 'Chinese (China)' },
    { key: 'zh-hk', name: 'Chinese (Hong Kong)' },
    { key: 'zh-tw', name: 'Chinese (Taiwan)' },
    { key: 'zh', name: 'Chinese' },
    { key: 'rw', name: 'Kinyarwanda (Rwanda)' },
    { key: 'ru', name: 'Russian' },
    { key: 'ro', name: 'Romanian' }
];
locales.forEach((obj) => {
    localesMap.set(obj.key, obj.name);
});

async function fetchWithRetry(url, retries = 0) {
    try {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error('Network response was not OK');
        const localesArr = (await response.json());
        return localesArr;
    }
    catch (error) {
        if (retries < 3) {
            new require$$0.Notice(`Something went wrong. Retry ${retries + 1}`);
            return fetchWithRetry(url, retries + 1);
        }
        else {
            new require$$0.Notice(`Fetch failed after ${retries} attempts. Using local, possibly outdated locales. Check internet and restart plugin.`);
            return null;
        }
    }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var dayjs_min = {exports: {}};

(function (module, exports) {
	!function(t,e){module.exports=e();}(commonjsGlobal,(function(){var t=1e3,e=6e4,n=36e5,r="millisecond",i="second",s="minute",u="hour",a="day",o="week",c="month",f="quarter",h="year",d="date",l="Invalid Date",$=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,y=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,M={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),ordinal:function(t){var e=["th","st","nd","rd"],n=t%100;return "["+t+(e[(n-20)%10]||e[n]||e[0])+"]"}},m=function(t,e,n){var r=String(t);return !r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},v={s:m,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return (e<=0?"+":"-")+m(r,2,"0")+":"+m(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return -t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,c),s=n-i<0,u=e.clone().add(r+(s?-1:1),c);return +(-(r+(n-i)/(s?i-u:u-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(t){return {M:c,y:h,w:o,d:a,D:d,h:u,m:s,s:i,ms:r,Q:f}[t]||String(t||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},g="en",D={};D[g]=M;var p="$isDayjsObject",S=function(t){return t instanceof _||!(!t||!t[p])},w=function t(e,n,r){var i;if(!e)return g;if("string"==typeof e){var s=e.toLowerCase();D[s]&&(i=s),n&&(D[s]=n,i=s);var u=e.split("-");if(!i&&u.length>1)return t(u[0])}else {var a=e.name;D[a]=e,i=a;}return !r&&i&&(g=i),i||!r&&g},O=function(t,e){if(S(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new _(n)},b=v;b.l=w,b.i=S,b.w=function(t,e){return O(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var _=function(){function M(t){this.$L=w(t.locale,null,!0),this.parse(t),this.$x=this.$x||t.x||{},this[p]=!0;}var m=M.prototype;return m.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(b.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match($);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.init();},m.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds();},m.$utils=function(){return b},m.isValid=function(){return !(this.$d.toString()===l)},m.isSame=function(t,e){var n=O(t);return this.startOf(e)<=n&&n<=this.endOf(e)},m.isAfter=function(t,e){return O(t)<this.startOf(e)},m.isBefore=function(t,e){return this.endOf(e)<O(t)},m.$g=function(t,e,n){return b.u(t)?this[e]:this.set(n,t)},m.unix=function(){return Math.floor(this.valueOf()/1e3)},m.valueOf=function(){return this.$d.getTime()},m.startOf=function(t,e){var n=this,r=!!b.u(e)||e,f=b.p(t),l=function(t,e){var i=b.w(n.$u?Date.UTC(n.$y,e,t):new Date(n.$y,e,t),n);return r?i:i.endOf(a)},$=function(t,e){return b.w(n.toDate()[t].apply(n.toDate("s"),(r?[0,0,0,0]:[23,59,59,999]).slice(e)),n)},y=this.$W,M=this.$M,m=this.$D,v="set"+(this.$u?"UTC":"");switch(f){case h:return r?l(1,0):l(31,11);case c:return r?l(1,M):l(0,M+1);case o:var g=this.$locale().weekStart||0,D=(y<g?y+7:y)-g;return l(r?m-D:m+(6-D),M);case a:case d:return $(v+"Hours",0);case u:return $(v+"Minutes",1);case s:return $(v+"Seconds",2);case i:return $(v+"Milliseconds",3);default:return this.clone()}},m.endOf=function(t){return this.startOf(t,!1)},m.$set=function(t,e){var n,o=b.p(t),f="set"+(this.$u?"UTC":""),l=(n={},n[a]=f+"Date",n[d]=f+"Date",n[c]=f+"Month",n[h]=f+"FullYear",n[u]=f+"Hours",n[s]=f+"Minutes",n[i]=f+"Seconds",n[r]=f+"Milliseconds",n)[o],$=o===a?this.$D+(e-this.$W):e;if(o===c||o===h){var y=this.clone().set(d,1);y.$d[l]($),y.init(),this.$d=y.set(d,Math.min(this.$D,y.daysInMonth())).$d;}else l&&this.$d[l]($);return this.init(),this},m.set=function(t,e){return this.clone().$set(t,e)},m.get=function(t){return this[b.p(t)]()},m.add=function(r,f){var d,l=this;r=Number(r);var $=b.p(f),y=function(t){var e=O(l);return b.w(e.date(e.date()+Math.round(t*r)),l)};if($===c)return this.set(c,this.$M+r);if($===h)return this.set(h,this.$y+r);if($===a)return y(1);if($===o)return y(7);var M=(d={},d[s]=e,d[u]=n,d[i]=t,d)[$]||1,m=this.$d.getTime()+r*M;return b.w(m,this)},m.subtract=function(t,e){return this.add(-1*t,e)},m.format=function(t){var e=this,n=this.$locale();if(!this.isValid())return n.invalidDate||l;var r=t||"YYYY-MM-DDTHH:mm:ssZ",i=b.z(this),s=this.$H,u=this.$m,a=this.$M,o=n.weekdays,c=n.months,f=n.meridiem,h=function(t,n,i,s){return t&&(t[n]||t(e,r))||i[n].slice(0,s)},d=function(t){return b.s(s%12||12,t,"0")},$=f||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r};return r.replace(y,(function(t,r){return r||function(t){switch(t){case"YY":return String(e.$y).slice(-2);case"YYYY":return b.s(e.$y,4,"0");case"M":return a+1;case"MM":return b.s(a+1,2,"0");case"MMM":return h(n.monthsShort,a,c,3);case"MMMM":return h(c,a);case"D":return e.$D;case"DD":return b.s(e.$D,2,"0");case"d":return String(e.$W);case"dd":return h(n.weekdaysMin,e.$W,o,2);case"ddd":return h(n.weekdaysShort,e.$W,o,3);case"dddd":return o[e.$W];case"H":return String(s);case"HH":return b.s(s,2,"0");case"h":return d(1);case"hh":return d(2);case"a":return $(s,u,!0);case"A":return $(s,u,!1);case"m":return String(u);case"mm":return b.s(u,2,"0");case"s":return String(e.$s);case"ss":return b.s(e.$s,2,"0");case"SSS":return b.s(e.$ms,3,"0");case"Z":return i}return null}(t)||i.replace(":","")}))},m.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},m.diff=function(r,d,l){var $,y=this,M=b.p(d),m=O(r),v=(m.utcOffset()-this.utcOffset())*e,g=this-m,D=function(){return b.m(y,m)};switch(M){case h:$=D()/12;break;case c:$=D();break;case f:$=D()/3;break;case o:$=(g-v)/6048e5;break;case a:$=(g-v)/864e5;break;case u:$=g/n;break;case s:$=g/e;break;case i:$=g/t;break;default:$=g;}return l?$:b.a($)},m.daysInMonth=function(){return this.endOf(c).$D},m.$locale=function(){return D[this.$L]},m.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=w(t,e,!0);return r&&(n.$L=r),n},m.clone=function(){return b.w(this.$d,this)},m.toDate=function(){return new Date(this.valueOf())},m.toJSON=function(){return this.isValid()?this.toISOString():null},m.toISOString=function(){return this.$d.toISOString()},m.toString=function(){return this.$d.toUTCString()},M}(),k=_.prototype;return O.prototype=k,[["$ms",r],["$s",i],["$m",s],["$H",u],["$W",a],["$M",c],["$y",h],["$D",d]].forEach((function(t){k[t[1]]=function(e){return this.$g(e,t[0],t[1])};})),O.extend=function(t,e){return t.$i||(t(e,_,O),t.$i=!0),O},O.locale=w,O.isDayjs=S,O.unix=function(t){return O(1e3*t)},O.en=D[g],O.Ls=D,O.p={},O})); 
} (dayjs_min));

var dayjs_minExports = dayjs_min.exports;
var dayjs = /*@__PURE__*/getDefaultExportFromCjs(dayjs_minExports);

var weekday$1 = {exports: {}};

(function (module, exports) {
	!function(e,t){module.exports=t();}(commonjsGlobal,(function(){return function(e,t){t.prototype.weekday=function(e){var t=this.$locale().weekStart||0,i=this.$W,n=(i<t?i+7:i)-t;return this.$utils().u(e)?n:this.subtract(n,"day").add(e,"day")};}})); 
} (weekday$1));

var weekdayExports = weekday$1.exports;
var weekday = /*@__PURE__*/getDefaultExportFromCjs(weekdayExports);

var localeData$1 = {exports: {}};

(function (module, exports) {
	!function(n,e){module.exports=e();}(commonjsGlobal,(function(){return function(n,e,t){var r=e.prototype,o=function(n){return n&&(n.indexOf?n:n.s)},u=function(n,e,t,r,u){var i=n.name?n:n.$locale(),a=o(i[e]),s=o(i[t]),f=a||s.map((function(n){return n.slice(0,r)}));if(!u)return f;var d=i.weekStart;return f.map((function(n,e){return f[(e+(d||0))%7]}))},i=function(){return t.Ls[t.locale()]},a=function(n,e){return n.formats[e]||function(n){return n.replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(n,e,t){return e||t.slice(1)}))}(n.formats[e.toUpperCase()])},s=function(){var n=this;return {months:function(e){return e?e.format("MMMM"):u(n,"months")},monthsShort:function(e){return e?e.format("MMM"):u(n,"monthsShort","months",3)},firstDayOfWeek:function(){return n.$locale().weekStart||0},weekdays:function(e){return e?e.format("dddd"):u(n,"weekdays")},weekdaysMin:function(e){return e?e.format("dd"):u(n,"weekdaysMin","weekdays",2)},weekdaysShort:function(e){return e?e.format("ddd"):u(n,"weekdaysShort","weekdays",3)},longDateFormat:function(e){return a(n.$locale(),e)},meridiem:this.$locale().meridiem,ordinal:this.$locale().ordinal}};r.localeData=function(){return s.bind(this)()},t.localeData=function(){var n=i();return {firstDayOfWeek:function(){return n.weekStart||0},weekdays:function(){return t.weekdays()},weekdaysShort:function(){return t.weekdaysShort()},weekdaysMin:function(){return t.weekdaysMin()},months:function(){return t.months()},monthsShort:function(){return t.monthsShort()},longDateFormat:function(e){return a(n,e)},meridiem:n.meridiem,ordinal:n.ordinal}},t.months=function(){return u(i(),"months")},t.monthsShort=function(){return u(i(),"monthsShort","months",3)},t.weekdays=function(n){return u(i(),"weekdays",null,null,n)},t.weekdaysShort=function(n){return u(i(),"weekdaysShort","weekdays",3,n)},t.weekdaysMin=function(n){return u(i(),"weekdaysMin","weekdays",2,n)};}})); 
} (localeData$1));

var localeDataExports = localeData$1.exports;
var localeData = /*@__PURE__*/getDefaultExportFromCjs(localeDataExports);

dayjs.extend(weekday);
dayjs.extend(localeData);
const DEFAULT_SETTINGS = Object.freeze({
    viewOpen: false,
    localeData: {
        loading: false,
        weekStart: null,
        showWeekNums: false,
        sysLocale: navigator.languages.find((locale) => localesMap.has(locale.toLocaleLowerCase())) ||
            navigator.languages[0],
        localeOverride: null,
        localizedWeekdays: null
    }
});
class SettingsTab extends require$$0.PluginSettingTab {
    plugin;
    unsubscribeSettingsStore;
    locales = localesMap;
    localesUpdated = false;
    settings = DEFAULT_SETTINGS;
    firstRender = true;
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        window.dayjs = dayjs;
    }
    display() {
        console.log('Displaying setttings ⚙️');
        if (!this.unsubscribeSettingsStore) {
            this.unsubscribeSettingsStore = settingsStore.subscribe((settings) => {
                console.log('Subscribed to store!');
                this.settings = settings;
            });
        }
        if (this.firstRender) {
            this.firstRender = false;
            this.loadLocale(this.settings.localeData.localeOverride || this.settings.localeData.sysLocale);
        }
        this.containerEl.empty();
        this.containerEl.createEl('h3', {
            text: 'General Settings'
        });
        this.addPopoverSetting();
        this.addShowWeeklyNoteSetting();
        this.containerEl.createEl('h3', {
            text: 'Locale Settings'
        });
        this.addWeekStartSetting();
        this.addLocaleOverrideSetting();
    }
    hide() {
        this.unsubscribeSettingsStore();
        console.log('HIding settings 🏵️');
    }
    addPopoverSetting() {
        // TODO: improve wording
        new require$$0.Setting(this.containerEl)
            .setName('Ribbon icon opens Calendar view')
            .setDesc('Show Calendar view when clicking on ribbon icon instead of default popup')
            .addToggle((viewOpen) => viewOpen.setValue(this.plugin.settings.viewOpen).onChange(async (viewOpen) => {
            console.log('ON toggle setting ⚙️');
            // destroy popup when no longer active
            viewOpen && this.plugin.popupCalendar && this.plugin.cleanupPopup();
            await this.plugin.saveSettings(() => ({
                viewOpen
            }));
            // rerender popup when reactivated
            !viewOpen && this.plugin.handlePopup();
        }));
    }
    addShowWeeklyNoteSetting() {
        new require$$0.Setting(this.containerEl)
            .setName('Show week number')
            .setDesc('Enable this to add a column with the week number')
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.localeData.showWeekNums);
            toggle.onChange(async (value) => {
                this.plugin.saveSettings((settings) => ({
                    localeData: {
                        ...settings.localeData,
                        showWeekNums: value
                    }
                }));
                this.display(); // show/hide weekly settings
            });
        });
    }
    addWeekStartSetting() {
        console.log('running addWEekStart setting 🙌');
        const removeAllOptions = (dropdown) => {
            const selectNode = dropdown.selectEl;
            while (selectNode.firstChild) {
                selectNode.removeChild(selectNode.firstChild);
            }
        };
        const weekStart = this.settings.localeData.weekStart;
        const localizedWeekdays = this.settings.localeData.localizedWeekdays;
        const loading = this.settings.localeData.loading;
        new require$$0.Setting(this.containerEl)
            .setName('Start week on:')
            .setDesc("Choose what day of the week to start. Select 'Locale default' to use the default specified by day.js")
            .addDropdown((dropdown) => {
            removeAllOptions(dropdown);
            if (weekStart && localizedWeekdays && !loading) {
                dropdown.addOption(weekStart, `Locale default - ${weekStart}`);
                localizedWeekdays.forEach((day) => {
                    dropdown.addOption(day, day);
                });
                dropdown.setValue(weekStart);
                dropdown.onChange(async (value) => {
                    this.plugin.saveSettings((settings) => ({
                        localeData: {
                            ...settings.localeData,
                            weekStart: value
                        }
                    }));
                });
            }
            else {
                dropdown.addOption('loading', 'Loading...');
                // add invisible option to reduce layout shifting when actual data is loaded
                dropdown.addOption('invisible', '.'.repeat(40));
                dropdown.selectEl.options[1].disabled = true;
                dropdown.selectEl.options[1].style.display = 'none';
                dropdown.setDisabled(true);
            }
        });
    }
    addLocaleOverrideSetting() {
        const navLocales = navigator.languages;
        const sysLocale = this.settings.localeData.sysLocale;
        const localeOverride = this.settings.localeData.localeOverride;
        new require$$0.Setting(this.containerEl)
            .setName('Override locale:')
            .setDesc('Set this if you want to use a locale different from the default')
            .addDropdown(async (dropdown) => {
            console.log('Running locale override dropdown 👟');
            //// Load default locale based on local locales file
            const fetchableSysLocaleValue = this.locales.get(sysLocale) || navLocales[0];
            // add default option even if system locale is not fetchable
            dropdown.addOption(sysLocale, `Same as system - ${fetchableSysLocaleValue}`);
            // set temporary default value
            dropdown.setValue(localeOverride || sysLocale);
            //
            //// Request locales list from the internet if connection available and locales are not updated already, otherwise load from local file
            if (navigator.onLine) {
                if (!this.localesUpdated) {
                    console.log('Requesting locales 🤲');
                    // add invisible option to ensure <select /> doesn't break
                    dropdown.addOption('invisible', '.'.repeat(60));
                    dropdown.selectEl.options[1].disabled = true;
                    dropdown.selectEl.options[1].style.display = 'none';
                    // add loading option
                    dropdown.addOption('loading', 'Loading...');
                    dropdown.selectEl.options[2].disabled = true;
                    try {
                        const localesArr = await fetchWithRetry('https://cdn.jsdelivr.net/npm/dayjs@1/locale.json');
                        if (!localesArr) {
                            this.locales = localesMap;
                        }
                        else {
                            const localesMap = new Map();
                            localesArr.forEach((obj) => {
                                localesMap.set(obj.key, obj.name);
                            });
                            this.locales = localesMap;
                            this.localesUpdated = true;
                            new require$$0.Notice('Locales loaded');
                        }
                        // remove loading option
                        dropdown.selectEl.remove(2);
                    }
                    catch (error) {
                        console.error(error);
                        new require$$0.Notice(error);
                    }
                }
            }
            else {
                console.log('Offline 😥');
                this.locales = localesMap;
            }
            ////
            // Add options once locales loaded from the internet or local file
            this.locales.forEach((value, key) => {
                dropdown.addOption(key, value);
            });
            // update dropdown value to avoid reset after locale list loading
            dropdown.setValue(localeOverride || sysLocale);
            ////
            dropdown.onChange(async (localeKey) => {
                this.loadLocale(localeKey);
            });
        });
    }
    // helpers
    loadLocale(localeKey) {
        const loadLocaleWithRetry = (locale, retries = 0) => {
            return new Promise((resolve, reject) => {
                // resolve if locale already loaded
                if (document.querySelector(`script[src="https://cdn.jsdelivr.net/npm/dayjs@1/locale/${locale}.js"]`)) {
                    resolve(locale);
                    return;
                }
                const script = document.createElement('script');
                script.src = `https://cdn.jsdelivr.net/npm/dayjs@1/locale/${locale}.js`;
                document.body.appendChild(script);
                script.onload = () => {
                    resolve(locale); // Resolve with the selected locale
                };
                script.onerror = () => {
                    if (retries < 3) {
                        new require$$0.Notice(`Retrying to load locale: ${locale}, attempt ${retries + 1}`);
                        loadLocaleWithRetry(locale, retries + 1)
                            .then(resolve) // Resolve with the selected locale after successful retry
                            .catch(reject);
                    }
                    else {
                        new require$$0.Notice(`Failed to load locale: ${locale} after ${retries} attempts`);
                        // Resolve to default English if locale cannot be fetched
                        new require$$0.Notice('Defaulting to English - en');
                        resolve('en');
                    }
                };
            });
        };
        const defaultToEnglish = () => {
            console.log('Defaulting to English 🏴󠁧󠁢!');
            const { dayjs } = window;
            dayjs.locale('en');
            this.plugin.saveSettings((settings) => ({
                localeData: {
                    ...settings.localeData,
                    localeOverride: 'en',
                    localizedWeekdays: dayjs.weekdays(),
                    weekStart: dayjs.weekdays()[dayjs().weekday(0).day()]
                }
            }));
            this.display();
        };
        (async () => {
            try {
                if (!localeKey || localeKey === 'en') {
                    defaultToEnglish();
                }
                else {
                    if (!this.settings.localeData.loading) {
                        this.plugin.saveSettings((settings) => ({
                            localeData: {
                                ...settings.localeData,
                                loading: true
                            }
                        }));
                        this.display();
                    }
                    const selectedLocale = await loadLocaleWithRetry(localeKey);
                    if (selectedLocale === 'en') {
                        defaultToEnglish();
                    }
                    else {
                        const { dayjs } = window;
                        dayjs.locale(selectedLocale);
                        this.plugin.saveSettings((settings) => ({
                            localeData: {
                                ...settings.localeData,
                                loading: false,
                                localeOverride: localeKey,
                                localizedWeekdays: dayjs.weekdays(),
                                weekStart: dayjs.weekdays()[dayjs().weekday(0).day()]
                            }
                        }));
                        this.display();
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
        })();
    }
}

const settingsStore = writable(DEFAULT_SETTINGS);

const IS_MOBILE = Symbol("isMobile");
const DISPLAYED_MONTH = Symbol("displayedMonth");

var main = {};

Object.defineProperty(main, '__esModule', { value: true });

var obsidian = require$$0;

const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";
const DEFAULT_WEEKLY_NOTE_FORMAT = "gggg-[W]ww";
const DEFAULT_MONTHLY_NOTE_FORMAT = "YYYY-MM";

function shouldUsePeriodicNotesSettings(periodicity) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotes = window.app.plugins.getPlugin("periodic-notes");
    return periodicNotes && periodicNotes.settings?.[periodicity]?.enabled;
}
/**
 * Read the user settings for the `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
function getDailyNoteSettings() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { internalPlugins, plugins } = window.app;
        if (shouldUsePeriodicNotesSettings("daily")) {
            const { format, folder, template } = plugins.getPlugin("periodic-notes")?.settings?.daily || {};
            return {
                format: format || DEFAULT_DAILY_NOTE_FORMAT,
                folder: folder?.trim() || "",
                template: template?.trim() || "",
            };
        }
        const { folder, format, template } = internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
        return {
            format: format || DEFAULT_DAILY_NOTE_FORMAT,
            folder: folder?.trim() || "",
            template: template?.trim() || "",
        };
    }
    catch (err) {
        console.info("No custom daily note settings found!", err);
    }
}
/**
 * Read the user settings for the `weekly-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
function getWeeklyNoteSettings() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pluginManager = window.app.plugins;
        const calendarSettings = pluginManager.getPlugin("calendar")?.options;
        const periodicNotesSettings = pluginManager.getPlugin("periodic-notes")
            ?.settings?.weekly;
        if (shouldUsePeriodicNotesSettings("weekly")) {
            return {
                format: periodicNotesSettings.format || DEFAULT_WEEKLY_NOTE_FORMAT,
                folder: periodicNotesSettings.folder?.trim() || "",
                template: periodicNotesSettings.template?.trim() || "",
            };
        }
        const settings = calendarSettings || {};
        return {
            format: settings.weeklyNoteFormat || DEFAULT_WEEKLY_NOTE_FORMAT,
            folder: settings.weeklyNoteFolder?.trim() || "",
            template: settings.weeklyNoteTemplate?.trim() || "",
        };
    }
    catch (err) {
        console.info("No custom weekly note settings found!", err);
    }
}
/**
 * Read the user settings for the `periodic-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
function getMonthlyNoteSettings() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pluginManager = window.app.plugins;
    try {
        const settings = (shouldUsePeriodicNotesSettings("monthly") &&
            pluginManager.getPlugin("periodic-notes")?.settings?.monthly) ||
            {};
        return {
            format: settings.format || DEFAULT_MONTHLY_NOTE_FORMAT,
            folder: settings.folder?.trim() || "",
            template: settings.template?.trim() || "",
        };
    }
    catch (err) {
        console.info("No custom monthly note settings found!", err);
    }
}

// Credit: @creationix/path.js
function join(...partSegments) {
    // Split the inputs into a list of path commands.
    let parts = [];
    for (let i = 0, l = partSegments.length; i < l; i++) {
        parts = parts.concat(partSegments[i].split("/"));
    }
    // Interpret the path commands to get the new resolved path.
    const newParts = [];
    for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i];
        // Remove leading and trailing slashes
        // Also remove "." segments
        if (!part || part === ".")
            continue;
        // Push new path segments.
        else
            newParts.push(part);
    }
    // Preserve the initial slash if there was one.
    if (parts[0] === "")
        newParts.unshift("");
    // Turn back into a single string path.
    return newParts.join("/");
}
function basename(fullPath) {
    let base = fullPath.substring(fullPath.lastIndexOf("/") + 1);
    if (base.lastIndexOf(".") != -1)
        base = base.substring(0, base.lastIndexOf("."));
    return base;
}
async function ensureFolderExists(path) {
    const dirs = path.replace(/\\/g, "/").split("/");
    dirs.pop(); // remove basename
    if (dirs.length) {
        const dir = join(...dirs);
        if (!window.app.vault.getAbstractFileByPath(dir)) {
            await window.app.vault.createFolder(dir);
        }
    }
}
async function getNotePath(directory, filename) {
    if (!filename.endsWith(".md")) {
        filename += ".md";
    }
    const path = obsidian.normalizePath(join(directory, filename));
    await ensureFolderExists(path);
    return path;
}
async function getTemplateInfo(template) {
    const { metadataCache, vault } = window.app;
    const templatePath = obsidian.normalizePath(template);
    if (templatePath === "/") {
        return Promise.resolve(["", null]);
    }
    try {
        const templateFile = metadataCache.getFirstLinkpathDest(templatePath, "");
        const contents = await vault.cachedRead(templateFile);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const IFoldInfo = window.app.foldManager.load(templateFile);
        return [contents, IFoldInfo];
    }
    catch (err) {
        console.error(`Failed to read the daily note template '${templatePath}'`, err);
        new obsidian.Notice("Failed to read the daily note template");
        return ["", null];
    }
}

/**
 * dateUID is a way of weekly identifying daily/weekly/monthly notes.
 * They are prefixed with the granularity to avoid ambiguity.
 */
function getDateUID(date, granularity = "day") {
    const ts = date.clone().startOf(granularity).format();
    return `${granularity}-${ts}`;
}
function removeEscapedCharacters(format) {
    return format.replace(/\[[^\]]*\]/g, ""); // remove everything within brackets
}
/**
 * XXX: When parsing dates that contain both week numbers and months,
 * Moment choses to ignore the week numbers. For the week dateUID, we
 * want the opposite behavior. Strip the MMM from the format to patch.
 */
function isFormatAmbiguous(format, granularity) {
    if (granularity === "week") {
        const cleanFormat = removeEscapedCharacters(format);
        return (/w{1,2}/i.test(cleanFormat) &&
            (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat)));
    }
    return false;
}
function getDateFromFile(file, granularity) {
    return getDateFromFilename(file.basename, granularity);
}
function getDateFromPath(path, granularity) {
    return getDateFromFilename(basename(path), granularity);
}
function getDateFromFilename(filename, granularity) {
    const getSettings = {
        day: getDailyNoteSettings,
        week: getWeeklyNoteSettings,
        month: getMonthlyNoteSettings,
    };
    const format = getSettings[granularity]().format.split("/").pop();
    const noteDate = window.moment(filename, format, true);
    if (!noteDate.isValid()) {
        return null;
    }
    if (isFormatAmbiguous(format, granularity)) {
        if (granularity === "week") {
            const cleanFormat = removeEscapedCharacters(format);
            if (/w{1,2}/i.test(cleanFormat)) {
                return window.moment(filename, 
                // If format contains week, remove day & month formatting
                format.replace(/M{1,4}/g, "").replace(/D{1,4}/g, ""), false);
            }
        }
    }
    return noteDate;
}

class DailyNotesFolderMissingError extends Error {
}
/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
async function createDailyNote(date) {
    const app = window.app;
    const { vault } = app;
    const moment = window.moment;
    const { template, format, folder } = getDailyNoteSettings();
    const [templateContents, IFoldInfo] = await getTemplateInfo(template);
    const filename = date.format(format);
    const normalizedPath = await getNotePath(folder, filename);
    try {
        const createdFile = await vault.create(normalizedPath, templateContents
            .replace(/{{\s*date\s*}}/gi, filename)
            .replace(/{{\s*time\s*}}/gi, moment().format("HH:mm"))
            .replace(/{{\s*title\s*}}/gi, filename)
            .replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
            const now = moment();
            const currentDate = date.clone().set({
                hour: now.get("hour"),
                minute: now.get("minute"),
                second: now.get("second"),
            });
            if (calc) {
                currentDate.add(parseInt(timeDelta, 10), unit);
            }
            if (momentFormat) {
                return currentDate.format(momentFormat.substring(1).trim());
            }
            return currentDate.format(format);
        })
            .replace(/{{\s*yesterday\s*}}/gi, date.clone().subtract(1, "day").format(format))
            .replace(/{{\s*tomorrow\s*}}/gi, date.clone().add(1, "d").format(format)));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
    }
    catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
    }
}
function getDailyNote(date, dailyNotes) {
    return dailyNotes[getDateUID(date, "day")] ?? null;
}
function getAllDailyNotes() {
    /**
     * Find all daily notes in the daily note folder
     */
    const { vault } = window.app;
    const { folder } = getDailyNoteSettings();
    const dailyNotesFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
    if (!dailyNotesFolder) {
        throw new DailyNotesFolderMissingError("Failed to find daily notes folder");
    }
    const dailyNotes = {};
    obsidian.Vault.recurseChildren(dailyNotesFolder, (note) => {
        if (note instanceof obsidian.TFile) {
            const date = getDateFromFile(note, "day");
            if (date) {
                const dateString = getDateUID(date, "day");
                dailyNotes[dateString] = note;
            }
        }
    });
    return dailyNotes;
}

class WeeklyNotesFolderMissingError extends Error {
}
function getDaysOfWeek() {
    const { moment } = window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let weekStart = moment.localeData()._week.dow;
    const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];
    while (weekStart) {
        daysOfWeek.push(daysOfWeek.shift());
        weekStart--;
    }
    return daysOfWeek;
}
function getDayOfWeekNumericalValue(dayOfWeekName) {
    return getDaysOfWeek().indexOf(dayOfWeekName.toLowerCase());
}
async function createWeeklyNote(date) {
    const { vault } = window.app;
    const { template, format, folder } = getWeeklyNoteSettings();
    const [templateContents, IFoldInfo] = await getTemplateInfo(template);
    const filename = date.format(format);
    const normalizedPath = await getNotePath(folder, filename);
    try {
        const createdFile = await vault.create(normalizedPath, templateContents
            .replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
            const now = window.moment();
            const currentDate = date.clone().set({
                hour: now.get("hour"),
                minute: now.get("minute"),
                second: now.get("second"),
            });
            if (calc) {
                currentDate.add(parseInt(timeDelta, 10), unit);
            }
            if (momentFormat) {
                return currentDate.format(momentFormat.substring(1).trim());
            }
            return currentDate.format(format);
        })
            .replace(/{{\s*title\s*}}/gi, filename)
            .replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm"))
            .replace(/{{\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*:(.*?)}}/gi, (_, dayOfWeek, momentFormat) => {
            const day = getDayOfWeekNumericalValue(dayOfWeek);
            return date.weekday(day).format(momentFormat.trim());
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
    }
    catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
    }
}
function getWeeklyNote(date, weeklyNotes) {
    return weeklyNotes[getDateUID(date, "week")] ?? null;
}
function getAllWeeklyNotes() {
    const weeklyNotes = {};
    if (!appHasWeeklyNotesPluginLoaded()) {
        return weeklyNotes;
    }
    const { vault } = window.app;
    const { folder } = getWeeklyNoteSettings();
    const weeklyNotesFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
    if (!weeklyNotesFolder) {
        throw new WeeklyNotesFolderMissingError("Failed to find weekly notes folder");
    }
    obsidian.Vault.recurseChildren(weeklyNotesFolder, (note) => {
        if (note instanceof obsidian.TFile) {
            const date = getDateFromFile(note, "week");
            if (date) {
                const dateString = getDateUID(date, "week");
                weeklyNotes[dateString] = note;
            }
        }
    });
    return weeklyNotes;
}

class MonthlyNotesFolderMissingError extends Error {
}
/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
async function createMonthlyNote(date) {
    const { vault } = window.app;
    const { template, format, folder } = getMonthlyNoteSettings();
    const [templateContents, IFoldInfo] = await getTemplateInfo(template);
    const filename = date.format(format);
    const normalizedPath = await getNotePath(folder, filename);
    try {
        const createdFile = await vault.create(normalizedPath, templateContents
            .replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
            const now = window.moment();
            const currentDate = date.clone().set({
                hour: now.get("hour"),
                minute: now.get("minute"),
                second: now.get("second"),
            });
            if (calc) {
                currentDate.add(parseInt(timeDelta, 10), unit);
            }
            if (momentFormat) {
                return currentDate.format(momentFormat.substring(1).trim());
            }
            return currentDate.format(format);
        })
            .replace(/{{\s*date\s*}}/gi, filename)
            .replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm"))
            .replace(/{{\s*title\s*}}/gi, filename));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
    }
    catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
    }
}
function getMonthlyNote(date, monthlyNotes) {
    return monthlyNotes[getDateUID(date, "month")] ?? null;
}
function getAllMonthlyNotes() {
    const monthlyNotes = {};
    if (!appHasMonthlyNotesPluginLoaded()) {
        return monthlyNotes;
    }
    const { vault } = window.app;
    const { folder } = getMonthlyNoteSettings();
    const monthlyNotesFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
    if (!monthlyNotesFolder) {
        throw new MonthlyNotesFolderMissingError("Failed to find monthly notes folder");
    }
    obsidian.Vault.recurseChildren(monthlyNotesFolder, (note) => {
        if (note instanceof obsidian.TFile) {
            const date = getDateFromFile(note, "month");
            if (date) {
                const dateString = getDateUID(date, "month");
                monthlyNotes[dateString] = note;
            }
        }
    });
    return monthlyNotes;
}

function appHasDailyNotesPluginLoaded() {
    const { app } = window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dailyNotesPlugin = app.internalPlugins.plugins["daily-notes"];
    if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotes = app.plugins.getPlugin("periodic-notes");
    return periodicNotes && periodicNotes.settings?.daily?.enabled;
}
/**
 * XXX: "Weekly Notes" live in either the Calendar plugin or the periodic-notes plugin.
 * Check both until the weekly notes feature is removed from the Calendar plugin.
 */
function appHasWeeklyNotesPluginLoaded() {
    const { app } = window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (app.plugins.getPlugin("calendar")) {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotes = app.plugins.getPlugin("periodic-notes");
    return periodicNotes && periodicNotes.settings?.weekly?.enabled;
}
function appHasMonthlyNotesPluginLoaded() {
    const { app } = window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotes = app.plugins.getPlugin("periodic-notes");
    return periodicNotes && periodicNotes.settings?.monthly?.enabled;
}
function getPeriodicNoteSettings(granularity) {
    const getSettings = {
        day: getDailyNoteSettings,
        week: getWeeklyNoteSettings,
        month: getMonthlyNoteSettings,
    }[granularity];
    return getSettings();
}
function createPeriodicNote(granularity, date) {
    const createFn = {
        day: createDailyNote,
        month: createMonthlyNote,
        week: createWeeklyNote,
    };
    return createFn[granularity](date);
}

main.DEFAULT_DAILY_NOTE_FORMAT = DEFAULT_DAILY_NOTE_FORMAT;
main.DEFAULT_MONTHLY_NOTE_FORMAT = DEFAULT_MONTHLY_NOTE_FORMAT;
main.DEFAULT_WEEKLY_NOTE_FORMAT = DEFAULT_WEEKLY_NOTE_FORMAT;
main.appHasDailyNotesPluginLoaded = appHasDailyNotesPluginLoaded;
main.appHasMonthlyNotesPluginLoaded = appHasMonthlyNotesPluginLoaded;
main.appHasWeeklyNotesPluginLoaded = appHasWeeklyNotesPluginLoaded;
main.createDailyNote = createDailyNote;
main.createMonthlyNote = createMonthlyNote;
main.createPeriodicNote = createPeriodicNote;
main.createWeeklyNote = createWeeklyNote;
main.getAllDailyNotes = getAllDailyNotes;
main.getAllMonthlyNotes = getAllMonthlyNotes;
main.getAllWeeklyNotes = getAllWeeklyNotes;
main.getDailyNote = getDailyNote;
main.getDailyNoteSettings = getDailyNoteSettings;
main.getDateFromFile = getDateFromFile;
main.getDateFromPath = getDateFromPath;
var getDateUID_1 = main.getDateUID = getDateUID;
main.getMonthlyNote = getMonthlyNote;
main.getMonthlyNoteSettings = getMonthlyNoteSettings;
main.getPeriodicNoteSettings = getPeriodicNoteSettings;
main.getTemplateInfo = getTemplateInfo;
main.getWeeklyNote = getWeeklyNote;
main.getWeeklyNoteSettings = getWeeklyNoteSettings;

/* src/calendar/components/Dot.svelte generated by Svelte v4.2.0 */

function add_css$5(target) {
	append_styles(target, "svelte-1hxp8c1", ".dot.svelte-1hxp8c1{display:inline-block;height:6px;width:6px;margin:0 1px}.active.svelte-1hxp8c1{color:var(--text-on-accent)}");
}

function create_fragment$6(ctx) {
	let svg;
	let circle;
	let circle_stroke_value;
	let circle_fill_value;

	return {
		c() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "stroke", circle_stroke_value = !/*isFilled*/ ctx[1] ? 'currentColor' : 'none');
			attr(circle, "fill", circle_fill_value = /*isFilled*/ ctx[1] ? 'currentColor' : 'none');
			attr(circle, "cx", "3");
			attr(circle, "cy", "3");
			attr(circle, "r", "2");
			attr(svg, "class", "dot svelte-1hxp8c1");
			set_style(svg, "color", /*color*/ ctx[0]);
			attr(svg, "viewBox", "0 0 6 6");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			toggle_class(svg, "active", /*isActive*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, circle);
		},
		p(ctx, [dirty]) {
			if (dirty & /*isFilled*/ 2 && circle_stroke_value !== (circle_stroke_value = !/*isFilled*/ ctx[1] ? 'currentColor' : 'none')) {
				attr(circle, "stroke", circle_stroke_value);
			}

			if (dirty & /*isFilled*/ 2 && circle_fill_value !== (circle_fill_value = /*isFilled*/ ctx[1] ? 'currentColor' : 'none')) {
				attr(circle, "fill", circle_fill_value);
			}

			if (dirty & /*color*/ 1) {
				set_style(svg, "color", /*color*/ ctx[0]);
			}

			if (dirty & /*isActive*/ 4) {
				toggle_class(svg, "active", /*isActive*/ ctx[2]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(svg);
			}
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let { color } = $$props;
	let { isFilled } = $$props;
	let { isActive } = $$props;

	$$self.$$set = $$props => {
		if ('color' in $$props) $$invalidate(0, color = $$props.color);
		if ('isFilled' in $$props) $$invalidate(1, isFilled = $$props.isFilled);
		if ('isActive' in $$props) $$invalidate(2, isActive = $$props.isActive);
	};

	return [color, isFilled, isActive];
}

class Dot extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { color: 0, isFilled: 1, isActive: 2 }, add_css$5);
	}
}

/* src/calendar/components/Dots.svelte generated by Svelte v4.2.0 */

function add_css$4(target) {
	append_styles(target, "svelte-pa7w19", ".dot-container.svelte-pa7w19{display:flex;flex-wrap:wrap;line-height:6px;min-height:6px}.centered.svelte-pa7w19{justify-content:center}");
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[3] = list[i].color;
	child_ctx[4] = list[i].display;
	child_ctx[5] = list[i].dots !== undefined ? list[i].dots : [];
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[8] = list[i];
	return child_ctx;
}

// (10:2) {#if metadata}
function create_if_block$2(ctx) {
	let each_1_anchor;
	let current;
	let each_value = ensure_array_like(/*sortedMeta*/ ctx[2]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(target, anchor);
				}
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*sortedMeta, MAX_DOTS_PER_SOURCE*/ 4) {
				each_value = ensure_array_like(/*sortedMeta*/ ctx[2]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(each_1_anchor);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

// (12:6) {#if display === "calendar-and-menu"}
function create_if_block_1$1(ctx) {
	let each_1_anchor;
	let current;
	let each_value_1 = ensure_array_like(/*dots*/ ctx[5].slice(0, MAX_DOTS_PER_SOURCE));
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(target, anchor);
				}
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*sortedMeta, MAX_DOTS_PER_SOURCE*/ 4) {
				each_value_1 = ensure_array_like(/*dots*/ ctx[5].slice(0, MAX_DOTS_PER_SOURCE));
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_1$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(each_1_anchor);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

// (13:8) {#each dots.slice(0, MAX_DOTS_PER_SOURCE) as dot}
function create_each_block_1$1(ctx) {
	let dot_1;
	let current;
	const dot_1_spread_levels = [/*dot*/ ctx[8], { color: /*color*/ ctx[3] }];
	let dot_1_props = {};

	for (let i = 0; i < dot_1_spread_levels.length; i += 1) {
		dot_1_props = assign(dot_1_props, dot_1_spread_levels[i]);
	}

	dot_1 = new Dot({ props: dot_1_props });

	return {
		c() {
			create_component(dot_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(dot_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const dot_1_changes = (dirty & /*sortedMeta, MAX_DOTS_PER_SOURCE*/ 4)
			? get_spread_update(dot_1_spread_levels, [
					get_spread_object(/*dot*/ ctx[8]),
					dirty & /*sortedMeta*/ 4 && { color: /*color*/ ctx[3] }
				])
			: {};

			dot_1.$set(dot_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(dot_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(dot_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(dot_1, detaching);
		}
	};
}

// (11:4) {#each sortedMeta as { color, display, dots = [] }}
function create_each_block$1(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*display*/ ctx[4] === "calendar-and-menu" && create_if_block_1$1(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*display*/ ctx[4] === "calendar-and-menu") {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*sortedMeta*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if (if_block) if_block.d(detaching);
		}
	};
}

function create_fragment$5(ctx) {
	let div;
	let current;
	let if_block = /*metadata*/ ctx[1] && create_if_block$2(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", "dot-container svelte-pa7w19");
			toggle_class(div, "centered", /*centered*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*metadata*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*metadata*/ 2) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (!current || dirty & /*centered*/ 1) {
				toggle_class(div, "centered", /*centered*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();
		}
	};
}

const MAX_DOTS_PER_SOURCE = 5;

function instance$5($$self, $$props, $$invalidate) {
	let { centered = true } = $$props;
	let { metadata } = $$props;
	let sortedMeta;

	$$self.$$set = $$props => {
		if ('centered' in $$props) $$invalidate(0, centered = $$props.centered);
		if ('metadata' in $$props) $$invalidate(1, metadata = $$props.metadata);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*metadata*/ 2) {
			$$invalidate(2, sortedMeta = metadata && metadata.sort((a, b) => a.order - b.order));
		}
	};

	return [centered, metadata, sortedMeta];
}

class Dots extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { centered: 0, metadata: 1 }, add_css$4);
	}
}

/* src/calendar/components/MetadataResolver.svelte generated by Svelte v4.2.0 */
const get_default_slot_changes_2 = dirty => ({});
const get_default_slot_context_2 = ctx => ({ metadata: null });
const get_default_slot_changes_1 = dirty => ({ metadata: dirty & /*metadata*/ 1 });
const get_default_slot_context_1 = ctx => ({ metadata: /*resolvedMeta*/ ctx[3] });
const get_default_slot_changes = dirty => ({});
const get_default_slot_context = ctx => ({ metadata: null });

// (12:0) {:else}
function create_else_block(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], get_default_slot_context_2);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, get_default_slot_changes_2),
						get_default_slot_context_2
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

// (6:0) {#if metadata}
function create_if_block$1(ctx) {
	let await_block_anchor;
	let promise;
	let current;

	let info = {
		ctx,
		current: null,
		token: null,
		hasCatch: false,
		pending: create_pending_block,
		then: create_then_block,
		catch: create_catch_block,
		value: 3,
		blocks: [,,,]
	};

	handle_promise(promise = /*metadata*/ ctx[0], info);

	return {
		c() {
			await_block_anchor = empty();
			info.block.c();
		},
		m(target, anchor) {
			insert(target, await_block_anchor, anchor);
			info.block.m(target, info.anchor = anchor);
			info.mount = () => await_block_anchor.parentNode;
			info.anchor = await_block_anchor;
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			info.ctx = ctx;

			if (dirty & /*metadata*/ 1 && promise !== (promise = /*metadata*/ ctx[0]) && handle_promise(promise, info)) ; else {
				update_await_block_branch(info, ctx, dirty);
			}
		},
		i(local) {
			if (current) return;
			transition_in(info.block);
			current = true;
		},
		o(local) {
			for (let i = 0; i < 3; i += 1) {
				const block = info.blocks[i];
				transition_out(block);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(await_block_anchor);
			}

			info.block.d(detaching);
			info.token = null;
			info = null;
		}
	};
}

// (1:0) <svelte:options immutable />  <script lang="ts">export let metadata; </script>  {#if metadata}
function create_catch_block(ctx) {
	return {
		c: noop,
		m: noop,
		p: noop,
		i: noop,
		o: noop,
		d: noop
	};
}

// (9:2) {:then resolvedMeta}
function create_then_block(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], get_default_slot_context_1);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope, metadata*/ 3)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, get_default_slot_changes_1),
						get_default_slot_context_1
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

// (7:19)      <slot metadata="{null}
function create_pending_block(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], get_default_slot_context);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, get_default_slot_changes),
						get_default_slot_context
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$4(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$1, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*metadata*/ ctx[0]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_blocks[current_block_type_index].d(detaching);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { metadata } = $$props;

	$$self.$$set = $$props => {
		if ('metadata' in $$props) $$invalidate(0, metadata = $$props.metadata);
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [metadata, $$scope, slots];
}

class MetadataResolver extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, not_equal, { metadata: 0 });
	}
}

function isMacOS() {
    return navigator.appVersion.indexOf("Mac") !== -1;
}
function isMetaPressed(e) {
    return isMacOS() ? e.metaKey : e.ctrlKey;
}
function isWeekend(date) {
    return date.isoWeekday() === 6 || date.isoWeekday() === 7;
}
function getStartOfWeek(days) {
    return days[0].weekday(0);
}
// daysjs useful mehtods
// initial day of the week -> dayjs().weekday(0)

/* src/calendar/components/Day.svelte generated by Svelte v4.2.0 */

function add_css$3(target) {
	append_styles(target, "svelte-npyy3h", ".day.svelte-npyy3h{background-color:var(--color-background-day);border-radius:4px;color:var(--color-text-day);cursor:pointer;font-size:0.8em;height:100%;padding:4px;position:relative;text-align:center;transition:background-color 0.1s ease-in, color 0.1s ease-in;vertical-align:baseline}.day.svelte-npyy3h:hover{background-color:var(--interactive-hover)}.day.active.svelte-npyy3h:hover{background-color:var(--interactive-accent-hover)}.adjacent-month.svelte-npyy3h{opacity:0.25}.today.svelte-npyy3h{color:var(--color-text-today)}.day.svelte-npyy3h:active,.active.svelte-npyy3h,.active.today.svelte-npyy3h{color:var(--text-on-accent);background-color:var(--interactive-accent)}");
}

// (71:2) <MetadataResolver metadata="{metadata}" let:metadata>
function create_default_slot$1(ctx) {
	let div;
	let t0_value = /*date*/ ctx[0].format("D") + "";
	let t0;
	let t1;
	let dots;
	let div_draggable_value;
	let current;
	let mounted;
	let dispose;
	dots = new Dots({ props: { metadata: /*metadata*/ ctx[6] } });

	let div_levels = [
		{ class: "day" },
		{ draggable: div_draggable_value = true },
		getAttributes(/*metadata*/ ctx[6])
	];

	let div_data = {};

	for (let i = 0; i < div_levels.length; i += 1) {
		div_data = assign(div_data, div_levels[i]);
	}

	function click_handler(...args) {
		return /*click_handler*/ ctx[16](/*metadata*/ ctx[6], ...args);
	}

	function pointerenter_handler(...args) {
		return /*pointerenter_handler*/ ctx[17](/*metadata*/ ctx[6], ...args);
	}

	return {
		c() {
			div = element("div");
			t0 = text(t0_value);
			t1 = space();
			create_component(dots.$$.fragment);
			set_attributes(div, div_data);
			toggle_class(div, "active", /*selectedId*/ ctx[3] === getDateUID_1(/*date*/ ctx[0], 'day'));
			toggle_class(div, "adjacent-month", !/*date*/ ctx[0].isSame(/*$displayedMonth*/ ctx[5], 'month'));
			toggle_class(div, "has-note", !!/*file*/ ctx[4]);
			toggle_class(div, "today", /*date*/ ctx[0].isSame(/*today*/ ctx[2], 'day'));
			toggle_class(div, "svelte-npyy3h", true);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
			mount_component(dots, div, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(div, "click", click_handler),
					listen(div, "contextmenu", /*handleContextmenu*/ ctx[11]),
					listen(div, "pointerenter", pointerenter_handler),
					listen(div, "pointerleave", /*endHover*/ ctx[10]),
					listen(div, "dragstart", /*dragstart_handler*/ ctx[18])
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if ((!current || dirty & /*date*/ 1) && t0_value !== (t0_value = /*date*/ ctx[0].format("D") + "")) set_data_maybe_contenteditable(t0, t0_value, div_data['contenteditable']);
			const dots_changes = {};
			if (dirty & /*metadata*/ 64) dots_changes.metadata = /*metadata*/ ctx[6];
			dots.$set(dots_changes);

			set_attributes(div, div_data = get_spread_update(div_levels, [
				{ class: "day" },
				{ draggable: div_draggable_value },
				dirty & /*metadata*/ 64 && getAttributes(/*metadata*/ ctx[6])
			]));

			toggle_class(div, "active", /*selectedId*/ ctx[3] === getDateUID_1(/*date*/ ctx[0], 'day'));
			toggle_class(div, "adjacent-month", !/*date*/ ctx[0].isSame(/*$displayedMonth*/ ctx[5], 'month'));
			toggle_class(div, "has-note", !!/*file*/ ctx[4]);
			toggle_class(div, "today", /*date*/ ctx[0].isSame(/*today*/ ctx[2], 'day'));
			toggle_class(div, "svelte-npyy3h", true);
		},
		i(local) {
			if (current) return;
			transition_in(dots.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(dots.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(dots);
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$3(ctx) {
	let td;
	let metadataresolver;
	let current;

	metadataresolver = new MetadataResolver({
			props: {
				metadata: /*metadata*/ ctx[6],
				$$slots: {
					default: [
						create_default_slot$1,
						({ metadata }) => ({ 6: metadata }),
						({ metadata }) => metadata ? 64 : 0
					]
				},
				$$scope: { ctx }
			}
		});

	return {
		c() {
			td = element("td");
			create_component(metadataresolver.$$.fragment);
		},
		m(target, anchor) {
			insert(target, td, anchor);
			mount_component(metadataresolver, td, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const metadataresolver_changes = {};
			if (dirty & /*metadata*/ 64) metadataresolver_changes.metadata = /*metadata*/ ctx[6];

			if (dirty & /*$$scope, metadata, selectedId, date, $displayedMonth, file, today, fileCache*/ 2097279) {
				metadataresolver_changes.$$scope = { dirty, ctx };
			}

			metadataresolver.$set(metadataresolver_changes);
		},
		i(local) {
			if (current) return;
			transition_in(metadataresolver.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(metadataresolver.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			destroy_component(metadataresolver);
		}
	};
}

function getAttributes(metadata) {
	if (!metadata) {
		return {};
	}

	return metadata.filter(meta => meta.display === "calendar-and-menu").reduce(
		(acc, meta) => {
			return { ...acc, ...meta.attrs };
		},
		{}
	);
}

function instance$3($$self, $$props, $$invalidate) {
	let $displayedMonth;
	let { date } = $$props;
	let { fileCache } = $$props;
	let { getSourceSettings } = $$props;
	let file;
	let { onHover } = $$props;
	let { onClick } = $$props;
	let { onContextMenu } = $$props;
	let { today } = $$props;
	let { selectedId = null } = $$props;
	const isMobile = getContext(IS_MOBILE);
	const displayedMonth = getContext(DISPLAYED_MONTH);
	component_subscribe($$self, displayedMonth, value => $$invalidate(5, $displayedMonth = value));
	const dispatch = createEventDispatcher();
	let metadata;

	fileCache.store.subscribe(() => {
		$$invalidate(4, file = fileCache.getFile(date, "day"));
		$$invalidate(6, metadata = fileCache.getEvaluatedMetadata("day", date, getSourceSettings));
	});

	function handleClick(event, meta) {
		onClick?.("day", date, file, isMetaPressed(event));

		if (isMobile) {
			dispatch("hoverDay", {
				date,
				metadata: meta,
				target: event.target
			});
		}
	}

	function handleHover(event, meta) {
		onHover?.("day", date, file, event.target, isMetaPressed(event));

		dispatch("hoverDay", {
			date,
			metadata: meta,
			target: event.target
		});
	}

	function endHover(event) {
		dispatch("endHoverDay", { target: event.target });
	}

	function handleContextmenu(event) {
		onContextMenu?.("day", date, file, event);
		endHover(event);
	}

	const click_handler = (metadata, event) => handleClick(event, metadata);
	const pointerenter_handler = (metadata, event) => handleHover(event, metadata);
	const dragstart_handler = event => fileCache.onDragStart(event, file);

	$$self.$$set = $$props => {
		if ('date' in $$props) $$invalidate(0, date = $$props.date);
		if ('fileCache' in $$props) $$invalidate(1, fileCache = $$props.fileCache);
		if ('getSourceSettings' in $$props) $$invalidate(12, getSourceSettings = $$props.getSourceSettings);
		if ('onHover' in $$props) $$invalidate(13, onHover = $$props.onHover);
		if ('onClick' in $$props) $$invalidate(14, onClick = $$props.onClick);
		if ('onContextMenu' in $$props) $$invalidate(15, onContextMenu = $$props.onContextMenu);
		if ('today' in $$props) $$invalidate(2, today = $$props.today);
		if ('selectedId' in $$props) $$invalidate(3, selectedId = $$props.selectedId);
	};

	return [
		date,
		fileCache,
		today,
		selectedId,
		file,
		$displayedMonth,
		metadata,
		displayedMonth,
		handleClick,
		handleHover,
		endHover,
		handleContextmenu,
		getSourceSettings,
		onHover,
		onClick,
		onContextMenu,
		click_handler,
		pointerenter_handler,
		dragstart_handler
	];
}

class Day extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$3,
			create_fragment$3,
			not_equal,
			{
				date: 0,
				fileCache: 1,
				getSourceSettings: 12,
				onHover: 13,
				onClick: 14,
				onContextMenu: 15,
				today: 2,
				selectedId: 3
			},
			add_css$3
		);
	}
}

/* src/calendar/components/WeekNum.svelte generated by Svelte v4.2.0 */

function add_css$2(target) {
	append_styles(target, "svelte-2uqv35", "td.svelte-2uqv35{border-right:1px solid var(--background-modifier-border)}.week-num.svelte-2uqv35{background-color:var(--color-background-weeknum);border-radius:4px;color:var(--color-text-weeknum);cursor:pointer;font-size:0.65em;height:100%;padding:4px;text-align:center;transition:background-color 0.1s ease-in, color 0.1s ease-in;vertical-align:baseline}.week-num.svelte-2uqv35:hover{background-color:var(--interactive-hover)}.week-num.active.svelte-2uqv35:hover{background-color:var(--interactive-accent-hover)}.active.svelte-2uqv35{color:var(--text-on-accent);background-color:var(--interactive-accent)}");
}

// (45:2) <MetadataResolver metadata="{metadata}" let:metadata>
function create_default_slot(ctx) {
	let div;
	let t0;
	let t1;
	let dots;
	let current;
	let mounted;
	let dispose;
	dots = new Dots({ props: { metadata: /*metadata*/ ctx[8] } });

	function pointerenter_handler(...args) {
		return /*pointerenter_handler*/ ctx[16](/*metadata*/ ctx[8], ...args);
	}

	return {
		c() {
			div = element("div");
			t0 = text(/*weekNum*/ ctx[0]);
			t1 = space();
			create_component(dots.$$.fragment);
			attr(div, "class", "week-num svelte-2uqv35");
			attr(div, "draggable", true);
			toggle_class(div, "active", /*selectedId*/ ctx[5] === getDateUID_1(/*days*/ ctx[1][0], 'week'));
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
			mount_component(dots, div, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(div, "click", function () {
						if (is_function(/*onClick*/ ctx[2] && /*click_handler*/ ctx[13])) (/*onClick*/ ctx[2] && /*click_handler*/ ctx[13]).apply(this, arguments);
					}),
					listen(div, "contextmenu", function () {
						if (is_function(/*onContextMenu*/ ctx[3] && /*contextmenu_handler*/ ctx[14])) (/*onContextMenu*/ ctx[3] && /*contextmenu_handler*/ ctx[14]).apply(this, arguments);
					}),
					listen(div, "dragstart", /*dragstart_handler*/ ctx[15]),
					listen(div, "pointerenter", pointerenter_handler),
					listen(div, "pointerleave", /*endHover*/ ctx[10])
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (!current || dirty & /*weekNum*/ 1) set_data(t0, /*weekNum*/ ctx[0]);
			const dots_changes = {};
			if (dirty & /*metadata*/ 256) dots_changes.metadata = /*metadata*/ ctx[8];
			dots.$set(dots_changes);

			if (!current || dirty & /*selectedId, days*/ 34) {
				toggle_class(div, "active", /*selectedId*/ ctx[5] === getDateUID_1(/*days*/ ctx[1][0], 'week'));
			}
		},
		i(local) {
			if (current) return;
			transition_in(dots.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(dots.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(dots);
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$2(ctx) {
	let td;
	let metadataresolver;
	let current;

	metadataresolver = new MetadataResolver({
			props: {
				metadata: /*metadata*/ ctx[8],
				$$slots: {
					default: [
						create_default_slot,
						({ metadata }) => ({ 8: metadata }),
						({ metadata }) => metadata ? 256 : 0
					]
				},
				$$scope: { ctx }
			}
		});

	return {
		c() {
			td = element("td");
			create_component(metadataresolver.$$.fragment);
			attr(td, "class", "svelte-2uqv35");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			mount_component(metadataresolver, td, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const metadataresolver_changes = {};
			if (dirty & /*metadata*/ 256) metadataresolver_changes.metadata = /*metadata*/ ctx[8];

			if (dirty & /*$$scope, selectedId, days, onClick, startOfWeek, file, onContextMenu, fileCache, metadata, weekNum*/ 262655) {
				metadataresolver_changes.$$scope = { dirty, ctx };
			}

			metadataresolver.$set(metadataresolver_changes);
		},
		i(local) {
			if (current) return;
			transition_in(metadataresolver.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(metadataresolver.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			destroy_component(metadataresolver);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { weekNum } = $$props;
	let { days } = $$props;
	let { getSourceSettings } = $$props;
	let { onHover } = $$props;
	let { onClick } = $$props;
	let { onContextMenu } = $$props;
	let { fileCache } = $$props;
	let { selectedId = null } = $$props;
	let file;
	let startOfWeek;
	let metadata;

	fileCache.store.subscribe(() => {
		$$invalidate(6, file = fileCache.getFile(days[0], "week"));
		$$invalidate(8, metadata = fileCache.getEvaluatedMetadata("week", days[0], getSourceSettings));
	});

	const dispatch = createEventDispatcher();

	// TODO: find a way to open link preview using vanilla featuers
	function handleHover(event, meta) {
		onHover?.("week", days[0], file, event.target, isMetaPressed(event));

		dispatch("hoverDay", {
			date: days[0],
			metadata: meta,
			target: event.target
		});
	}

	function endHover(event) {
		dispatch("endHoverDay", { target: event.target });
	}

	const click_handler = e => onClick('week', startOfWeek, file, isMetaPressed(e));
	const contextmenu_handler = e => onContextMenu('week', days[0], file, e);
	const dragstart_handler = event => fileCache.onDragStart(event, file);
	const pointerenter_handler = (metadata, event) => handleHover(event, metadata);

	$$self.$$set = $$props => {
		if ('weekNum' in $$props) $$invalidate(0, weekNum = $$props.weekNum);
		if ('days' in $$props) $$invalidate(1, days = $$props.days);
		if ('getSourceSettings' in $$props) $$invalidate(11, getSourceSettings = $$props.getSourceSettings);
		if ('onHover' in $$props) $$invalidate(12, onHover = $$props.onHover);
		if ('onClick' in $$props) $$invalidate(2, onClick = $$props.onClick);
		if ('onContextMenu' in $$props) $$invalidate(3, onContextMenu = $$props.onContextMenu);
		if ('fileCache' in $$props) $$invalidate(4, fileCache = $$props.fileCache);
		if ('selectedId' in $$props) $$invalidate(5, selectedId = $$props.selectedId);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*days*/ 2) {
			$$invalidate(7, startOfWeek = getStartOfWeek(days));
		}
	};

	return [
		weekNum,
		days,
		onClick,
		onContextMenu,
		fileCache,
		selectedId,
		file,
		startOfWeek,
		metadata,
		handleHover,
		endHover,
		getSourceSettings,
		onHover,
		click_handler,
		contextmenu_handler,
		dragstart_handler,
		pointerenter_handler
	];
}

class WeekNum extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$2,
			create_fragment$2,
			not_equal,
			{
				weekNum: 0,
				days: 1,
				getSourceSettings: 11,
				onHover: 12,
				onClick: 2,
				onContextMenu: 3,
				fileCache: 4,
				selectedId: 5
			},
			add_css$2
		);
	}
}

/* src/calendar/components/Calendar.svelte generated by Svelte v4.2.0 */

function add_css$1(target) {
	append_styles(target, "svelte-193a61l", ".container.svelte-193a61l{--color-background-heading:transparent;--color-background-day:transparent;--color-background-weeknum:transparent;--color-background-weekend:transparent;--color-dot:var(--text-muted);--color-arrow:var(--text-muted);--color-button:var(--text-muted);--color-text-title:var(--text-normal);--color-text-heading:var(--text-muted);--color-text-day:var(--text-normal);--color-text-today:var(--interactive-accent);--color-text-weeknum:var(--text-muted);padding:0 8px}.weekend.svelte-193a61l{background-color:var(--color-background-weekend)}.calendar.svelte-193a61l{border-collapse:collapse;width:100%}th.svelte-193a61l{background-color:var(--color-background-heading);color:var(--color-text-heading);font-size:0.6em;letter-spacing:1px;padding:4px;text-align:center;text-transform:uppercase}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[2] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[8] = list[i];
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[11] = list[i];
	return child_ctx;
}

// (78:6) {#if $settingsStore.showWeekNums}
function create_if_block_2(ctx) {
	let col;

	return {
		c() {
			col = element("col");
		},
		m(target, anchor) {
			insert(target, col, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(col);
			}
		}
	};
}

// (81:6) {#each month[1].days as date}
function create_each_block_3(ctx) {
	let col;

	return {
		c() {
			col = element("col");
			attr(col, "class", "svelte-193a61l");
			toggle_class(col, "weekend", isWeekend(/*date*/ ctx[11]));
		},
		m(target, anchor) {
			insert(target, col, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*month*/ 0) {
				toggle_class(col, "weekend", isWeekend(/*date*/ ctx[11]));
			}
		},
		d(detaching) {
			if (detaching) {
				detach(col);
			}
		}
	};
}

// (87:8) {#if $settingsStore.showWeekNums}
function create_if_block_1(ctx) {
	let th;

	return {
		c() {
			th = element("th");
			th.textContent = "W";
			attr(th, "class", "svelte-193a61l");
		},
		m(target, anchor) {
			insert(target, th, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(th);
			}
		}
	};
}

// (90:8) {#each daysOfWeek as dayOfWeek}
function create_each_block_2(ctx) {
	let th;

	return {
		c() {
			th = element("th");
			th.textContent = `${/*dayOfWeek*/ ctx[8]}`;
			attr(th, "class", "svelte-193a61l");
		},
		m(target, anchor) {
			insert(target, th, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(th);
			}
		}
	};
}

// (98:10) {#if $settingsStore.showWeekNums}
function create_if_block(ctx) {
	let weeknum;
	let current;

	const weeknum_spread_levels = [
		{ fileCache },
		{ selectedId },
		{ getSourceSettings },
		/*week*/ ctx[2],
		eventHandlers
	];

	let weeknum_props = {};

	for (let i = 0; i < weeknum_spread_levels.length; i += 1) {
		weeknum_props = assign(weeknum_props, weeknum_spread_levels[i]);
	}

	weeknum = new WeekNum({ props: weeknum_props });
	weeknum.$on("hoverDay", updatePopover);
	weeknum.$on("endHoverDay", dismissPopover);

	return {
		c() {
			create_component(weeknum.$$.fragment);
		},
		m(target, anchor) {
			mount_component(weeknum, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const weeknum_changes = (dirty & /*fileCache, selectedId, getSourceSettings, month, eventHandlers*/ 0)
			? get_spread_update(weeknum_spread_levels, [
					dirty & /*fileCache*/ 0 && { fileCache },
					dirty & /*selectedId*/ 0 && { selectedId },
					dirty & /*getSourceSettings*/ 0 && { getSourceSettings },
					dirty & /*month*/ 0 && get_spread_object(/*week*/ ctx[2]),
					dirty & /*eventHandlers*/ 0 && get_spread_object(eventHandlers)
				])
			: {};

			weeknum.$set(weeknum_changes);
		},
		i(local) {
			if (current) return;
			transition_in(weeknum.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(weeknum.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(weeknum, detaching);
		}
	};
}

// (109:10) {#each week.days as day (day.format())}
function create_each_block_1(key_1, ctx) {
	let first;
	let day_1;
	let current;

	const day_1_spread_levels = [
		{ date: /*day*/ ctx[5] },
		{ fileCache },
		{ getSourceSettings },
		{ today },
		{ selectedId },
		eventHandlers
	];

	let day_1_props = {};

	for (let i = 0; i < day_1_spread_levels.length; i += 1) {
		day_1_props = assign(day_1_props, day_1_spread_levels[i]);
	}

	day_1 = new Day({ props: day_1_props });
	day_1.$on("hoverDay", updatePopover);
	day_1.$on("endHoverDay", dismissPopover);

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(day_1.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(day_1, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			const day_1_changes = (dirty & /*month, fileCache, getSourceSettings, today, selectedId, eventHandlers*/ 0)
			? get_spread_update(day_1_spread_levels, [
					dirty & /*month*/ 0 && { date: /*day*/ ctx[5] },
					dirty & /*fileCache*/ 0 && { fileCache },
					dirty & /*getSourceSettings*/ 0 && { getSourceSettings },
					dirty & /*today*/ 0 && { today },
					dirty & /*selectedId*/ 0 && { selectedId },
					dirty & /*eventHandlers*/ 0 && get_spread_object(eventHandlers)
				])
			: {};

			day_1.$set(day_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(day_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(day_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(first);
			}

			destroy_component(day_1, detaching);
		}
	};
}

// (96:6) {#each month as week (week.weekNum)}
function create_each_block(key_1, ctx) {
	let tr;
	let t0;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t1;
	let current;
	let if_block = /*$settingsStore*/ ctx[0].showWeekNums && create_if_block(ctx);
	let each_value_1 = ensure_array_like(/*week*/ ctx[2].days);
	const get_key = ctx => /*day*/ ctx[5].format();

	for (let i = 0; i < each_value_1.length; i += 1) {
		let child_ctx = get_each_context_1(ctx, each_value_1, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
	}

	return {
		key: key_1,
		first: null,
		c() {
			tr = element("tr");
			if (if_block) if_block.c();
			t0 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			this.first = tr;
		},
		m(target, anchor) {
			insert(target, tr, anchor);
			if (if_block) if_block.m(tr, null);
			append(tr, t0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tr, null);
				}
			}

			append(tr, t1);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (/*$settingsStore*/ ctx[0].showWeekNums) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*$settingsStore*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(tr, t0);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (dirty & /*month, fileCache, getSourceSettings, today, selectedId, eventHandlers, updatePopover, dismissPopover*/ 0) {
				each_value_1 = ensure_array_like(/*week*/ ctx[2].days);
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, tr, outro_and_destroy_block, create_each_block_1, t1, get_each_context_1);
				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(if_block);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(tr);
			}

			if (if_block) if_block.d();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}
		}
	};
}

function create_fragment$1(ctx) {
	let div0;
	let t1;
	let div1;
	let table;
	let colgroup;
	let t2;
	let t3;
	let thead;
	let tr;
	let t4;
	let t5;
	let tbody;
	let each_blocks = [];
	let each2_lookup = new Map();
	let current;
	let if_block0 = /*$settingsStore*/ ctx[0].showWeekNums && create_if_block_2();
	let each_value_3 = ensure_array_like(month[1].days);
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	let if_block1 = /*$settingsStore*/ ctx[0].showWeekNums && create_if_block_1();
	let each_value_2 = ensure_array_like(daysOfWeek);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	let each_value = ensure_array_like(month);
	const get_key = ctx => /*week*/ ctx[2].weekNum;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each2_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			div0 = element("div");
			div0.textContent = "Hello world!";
			t1 = space();
			div1 = element("div");
			table = element("table");
			colgroup = element("colgroup");
			if (if_block0) if_block0.c();
			t2 = space();

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			t3 = space();
			thead = element("thead");
			tr = element("tr");
			if (if_block1) if_block1.c();
			t4 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t5 = space();
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(table, "class", "calendar svelte-193a61l");
			attr(div1, "id", "calendar-container");
			attr(div1, "class", "container svelte-193a61l");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			insert(target, t1, anchor);
			insert(target, div1, anchor);
			append(div1, table);
			append(table, colgroup);
			if (if_block0) if_block0.m(colgroup, null);
			append(colgroup, t2);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				if (each_blocks_2[i]) {
					each_blocks_2[i].m(colgroup, null);
				}
			}

			append(table, t3);
			append(table, thead);
			append(thead, tr);
			if (if_block1) if_block1.m(tr, null);
			append(tr, t4);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				if (each_blocks_1[i]) {
					each_blocks_1[i].m(tr, null);
				}
			}

			append(table, t5);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tbody, null);
				}
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (/*$settingsStore*/ ctx[0].showWeekNums) {
				if (if_block0) ; else {
					if_block0 = create_if_block_2();
					if_block0.c();
					if_block0.m(colgroup, t2);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty & /*month*/ 0) {
				each_value_3 = ensure_array_like(month[1].days);
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
					} else {
						each_blocks_2[i] = create_each_block_3(child_ctx);
						each_blocks_2[i].c();
						each_blocks_2[i].m(colgroup, null);
					}
				}

				for (; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].d(1);
				}

				each_blocks_2.length = each_value_3.length;
			}

			if (/*$settingsStore*/ ctx[0].showWeekNums) {
				if (if_block1) ; else {
					if_block1 = create_if_block_1();
					if_block1.c();
					if_block1.m(tr, t4);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*daysOfWeek*/ 0) {
				each_value_2 = ensure_array_like(daysOfWeek);
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_2(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(tr, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_2.length;
			}

			if (dirty & /*month, fileCache, getSourceSettings, today, selectedId, eventHandlers, updatePopover, dismissPopover, $settingsStore*/ 1) {
				each_value = ensure_array_like(month);
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each2_lookup, tbody, outro_and_destroy_block, create_each_block, null, get_each_context);
				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div0);
				detach(t1);
				detach(div1);
			}

			if (if_block0) if_block0.d();
			destroy_each(each_blocks_2, detaching);
			if (if_block1) if_block1.d();
			destroy_each(each_blocks_1, detaching);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let $settingsStore;
	component_subscribe($$self, settingsStore, $$value => $$invalidate(0, $settingsStore = $$value));
	const { app } = getContext('view');
	console.log('CONTEXT 🤯', app);
	return [$settingsStore];
}

class Calendar extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, add_css$1);
	}
}

/* src/View.svelte generated by Svelte v4.2.0 */

function add_css(target) {
	append_styles(target, "svelte-awuoct", ".svelte-awuoct,.svelte-awuoct::before,.svelte-awuoct::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-awuoct::before,.svelte-awuoct::after{--tw-content:''}.svelte-awuoct:-moz-focusring{outline:auto}.svelte-awuoct:-moz-ui-invalid{box-shadow:none}.svelte-awuoct::-webkit-inner-spin-button,.svelte-awuoct::-webkit-outer-spin-button{height:auto}.svelte-awuoct::-webkit-search-decoration{-webkit-appearance:none}.svelte-awuoct::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}.svelte-awuoct:disabled{cursor:default}.svelte-awuoct,.svelte-awuoct::before,.svelte-awuoct::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  }.svelte-awuoct::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  }.container.svelte-awuoct{width:100%}@media(min-width: 640px){.container.svelte-awuoct{max-width:640px}}@media(min-width: 768px){.container.svelte-awuoct{max-width:768px}}@media(min-width: 1024px){.container.svelte-awuoct{max-width:1024px}}@media(min-width: 1280px){.container.svelte-awuoct{max-width:1280px}}@media(min-width: 1536px){.container.svelte-awuoct{max-width:1536px}}.pointer-events-none.svelte-awuoct{pointer-events:none}.visible.svelte-awuoct{visibility:visible}.invisible.svelte-awuoct{visibility:hidden}.collapse.svelte-awuoct{visibility:collapse}.absolute.svelte-awuoct{position:absolute}.relative.svelte-awuoct{position:relative}.left-0.svelte-awuoct{left:0px}.top-0.svelte-awuoct{top:0px}.block.svelte-awuoct{display:block}.flex.svelte-awuoct{display:flex}.table.svelte-awuoct{display:table}.grid.svelte-awuoct{display:grid}.contents.svelte-awuoct{display:contents}.hidden.svelte-awuoct{display:none}.w-max.svelte-awuoct{width:-moz-max-content;width:max-content}.flex-shrink.svelte-awuoct{flex-shrink:1}.border-collapse.svelte-awuoct{border-collapse:collapse}.transform.svelte-awuoct{transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.flex-wrap.svelte-awuoct{flex-wrap:wrap}.uppercase.svelte-awuoct{text-transform:uppercase}.ordinal.svelte-awuoct{--tw-ordinal:ordinal;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.opacity-0.svelte-awuoct{opacity:0}.filter.svelte-awuoct{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition.svelte-awuoct{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.duration-300.svelte-awuoct{transition-duration:300ms}");
}

function create_fragment(ctx) {
	let div;
	let calendar;
	let div_class_value;
	let div_data_popup_value;
	let current;
	calendar = new Calendar({});

	return {
		c() {
			div = element("div");
			create_component(calendar.$$.fragment);
			attr(div, "class", div_class_value = "" + (null_to_empty(clsx('space-y-4', /*popup*/ ctx[0] && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')) + " svelte-awuoct"));
			attr(div, "data-popup", div_data_popup_value = /*popup*/ ctx[0] && 'calendarPopup');
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(calendar, div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*popup*/ 1 && div_class_value !== (div_class_value = "" + (null_to_empty(clsx('space-y-4', /*popup*/ ctx[0] && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')) + " svelte-awuoct"))) {
				attr(div, "class", div_class_value);
			}

			if (!current || dirty & /*popup*/ 1 && div_data_popup_value !== (div_data_popup_value = /*popup*/ ctx[0] && 'calendarPopup')) {
				attr(div, "data-popup", div_data_popup_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(calendar.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(calendar.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(calendar);
		}
	};
}

function getToday(settings) {
	return window.moment();
}

function instance($$self, $$props, $$invalidate) {
	let $settingsStore;
	component_subscribe($$self, settingsStore, $$value => $$invalidate(1, $settingsStore = $$value));
	let { popup = false } = $$props;

	$$self.$$set = $$props => {
		if ('popup' in $$props) $$invalidate(0, popup = $$props.popup);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$settingsStore*/ 2) {
			getToday();
		}
	};

	return [popup, $settingsStore];
}

class View extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { popup: 0 }, add_css);
	}
}

const VIEW_TYPE_EXAMPLE = "example-view";
class CalendarView extends require$$0.ItemView {
    view;
    constructor(leaf) {
        super(leaf);
    }
    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }
    getDisplayText() {
        return "Example view";
    }
    async onOpen() {
        console.log("On open view👐");
        const context = new Map();
        context.set('view', this);
        this.view = new View({
            target: this.contentEl,
            context,
        });
    }
    async onClose() {
        console.log('On close view❌');
        this.view.$destroy();
    }
}

class DailyNoteFlexPlugin extends require$$0.Plugin {
    settings;
    popupCalendar;
    cleanupPopup;
    onunload() {
        console.log('ON Unload ⛰️');
        this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE).forEach((leaf) => leaf.detach());
        this.cleanupPopup && this.cleanupPopup();
        this.removeLocaleScripts();
    }
    async onload() {
        console.log('ON Load 🫵');
        this.register(settingsStore.subscribe((settings) => {
            console.log("Settingstore on plugin load, should contain custom DEFAULT_SETTNGS as it is recreated every time pluign reloads", settings);
            this.settings = settings;
        }));
        this.addSettingTab(new SettingsTab(this.app, this));
        await this.loadSettings();
        this.handleRibbon();
        this.handleView();
        // Commands
        this.addCommand({
            id: 'open-calendar-view',
            name: 'Open calendar view',
            callback: () => {
                this.toggleView();
            }
        });
        this.app.workspace.onLayoutReady(() => {
            console.log('ON Layout REady 🙌');
            // const localeWeekStartNum = window._bundledLocaleWeekSpec.dow;
            console.log('localeWeekStartNum 📅', window._bundledLocaleWeekSpec);
            this.handlePopup();
        });
    }
    async loadSettings() {
        const settings = await this.loadData();
        settingsStore.update((old) => ({
            ...old,
            ...(settings || {})
        }));
    }
    async saveSettings(changeSettings) {
        settingsStore.update((old) => {
            console.log('INside saveSettings', changeSettings(old));
            return {
                ...old,
                ...changeSettings(old)
            };
        });
        await this.saveData(this.settings);
    }
    handleRibbon() {
        this.addRibbonIcon('dice', 'daily-note-flex-plugin', () => {
            if (this.settings.viewOpen) {
                this.toggleView();
                console.log('localeWeekStartNum 📅', window._bundledLocaleWeekSpec);
                return;
            }
        });
    }
    handlePopup() {
        console.log('HANDLE popup called 🍿');
        console.log('HandlePopup(): ViewOPen', this.settings.viewOpen);
        if (this.settings.viewOpen)
            return;
        // Local State
        let popupState = {
            open: false,
            autoUpdateCleanup: () => ({})
        };
        const options = {
            target: 'calendarPopup'
        };
        const focusableAllowedList = ':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';
        let focusablePopupElements;
        // Elements
        const referenceEl = document.querySelector(`[aria-label="daily-note-flex-plugin"]`);
        console.log('REFERENCEEl', referenceEl);
        console.log('POPUPCOMPONENT', this.popupCalendar);
        this.popupCalendar = new View({
            target: document.body,
            props: { popup: true }
        });
        const floatingEl = document.querySelector(`[data-popup="${options.target}"]`);
        console.log('FLOATINGEL', floatingEl);
        const arrowEl = document.createElement('div');
        // State Handlers
        function open() {
            // Set open state to on
            popupState.open = true;
            // Update render settings
            render();
            // Update the DOM
            floatingEl.style.display = 'block';
            floatingEl.style.opacity = '1';
            floatingEl.style.pointerEvents = 'auto';
            // enable popup interactions
            floatingEl.removeAttribute('inert');
            // Trigger Floating UI autoUpdate (open only)
            // https://floating-ui.com/docs/autoUpdate
            popupState.autoUpdateCleanup = autoUpdate(referenceEl, floatingEl, render);
        }
        function close() {
            // Set open state to off
            popupState.open = false;
            // Update the DOM
            floatingEl.style.opacity = '0';
            // disable popup interactions
            floatingEl.setAttribute('inert', '');
            // Cleanup Floating UI autoUpdate (close only)
            if (popupState.autoUpdateCleanup)
                popupState.autoUpdateCleanup();
        }
        // Event Handlers
        function toggle() {
            console.log('ON ribbon click 🐭');
            popupState.open ? close() : open();
        }
        function onWindowClick(event) {
            console.log('ON window click 🪟', event);
            // console.log("FloatingEL", floatingEl)
            // console.log("Event target", event.target)
            // Return if the popup is not yet open
            if (!popupState.open)
                return;
            // Return if reference element is clicked
            if (referenceEl.contains(event.target))
                return;
            // If click outside the popup
            if (floatingEl && floatingEl.contains(event.target) === false) {
                close();
                return;
            }
        }
        // Keyboard Interactions for A11y
        const onWindowKeyDown = (event) => {
            if (!popupState.open)
                return;
            // Handle keys
            const key = event.key;
            // On Esc key
            if (key === 'Escape') {
                event.preventDefault();
                referenceEl.focus();
                close();
                return;
            }
            // Update focusable elements (important for Autocomplete)
            focusablePopupElements = Array.from(floatingEl?.querySelectorAll(focusableAllowedList));
            // On Tab or ArrowDown key
            const triggerMenuFocused = popupState.open && document.activeElement === referenceEl;
            if (triggerMenuFocused &&
                (key === 'ArrowDown' || key === 'Tab') &&
                focusableAllowedList.length > 0 &&
                focusablePopupElements.length > 0) {
                event.preventDefault();
                focusablePopupElements[0].focus();
            }
        };
        // Event Listeners
        referenceEl.addEventListener('click', toggle);
        window.addEventListener('click', onWindowClick);
        window.addEventListener('keydown', onWindowKeyDown);
        // Render Floating UI Popup
        const render = () => {
            computePosition(referenceEl, floatingEl, {
                placement: 'right',
                middleware: [offset(16), shift({ padding: 8 }), flip(), arrow({ element: arrowEl })]
            }).then(({ x, y, placement, middlewareData }) => {
                Object.assign(floatingEl.style, {
                    left: `${x}px`,
                    top: `${y}px`
                });
                // Handle Arrow Placement:
                // https://floating-ui.com/docs/arrow
                if (arrowEl && middlewareData.arrow) {
                    const { x: arrowX, y: arrowY } = middlewareData.arrow;
                    const staticSide = {
                        top: 'bottom',
                        right: 'left',
                        bottom: 'top',
                        left: 'right'
                    }[placement.split('-')[0]];
                    staticSide &&
                        Object.assign(arrowEl.style, {
                            left: arrowX != null ? `${arrowX}px` : '',
                            top: arrowY != null ? `${arrowY}px` : '',
                            right: '',
                            bottom: '',
                            [staticSide]: '-4px'
                        });
                }
            });
        };
        // Render popup
        render();
        this.cleanupPopup = () => {
            popupState = {
                open: false,
                autoUpdateCleanup: () => ({})
            };
            // Remove Event Listeners
            referenceEl.removeEventListener('click', toggle);
            window.removeEventListener('click', onWindowClick);
            window.removeEventListener('keydown', onWindowKeyDown);
            this.popupCalendar && this.popupCalendar.$destroy();
        };
    }
    async handleView() {
        // register view
        this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new CalendarView(leaf));
        // TODO: Try to not block initial loading by deferring loading with 'onLayoutReady'
        // activate view
        await this.initView();
    }
    async initView({ active } = { active: true }) {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);
        await this.app.workspace.getLeftLeaf(false).setViewState({
            type: VIEW_TYPE_EXAMPLE,
            active
        });
    }
    revealView() {
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]);
        this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0].setViewState({
            type: VIEW_TYPE_EXAMPLE,
            active: true
        });
    }
    async toggleView() {
        const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0];
        if (!leaf) {
            await this.initView();
            this.revealView();
            return;
        }
        const ACTIVE_CLASSNAME = 'is-active';
        const WORKSPACE_SPLIT_CLASSNAME = '.workspace-split';
        // @ts-ignore
        const closestWorkspaceSplitClassName = leaf.containerEl.closest(WORKSPACE_SPLIT_CLASSNAME)
            .className;
        const leafSplit = (closestWorkspaceSplitClassName.match('right')?.[0] ||
            closestWorkspaceSplitClassName.match('left')?.[0] ||
            'root');
        // @ts-ignore
        const leafActive = leaf.tabHeaderEl.className.includes(ACTIVE_CLASSNAME);
        const leftSplit = this.app.workspace.leftSplit;
        const rightSplit = this.app.workspace.rightSplit;
        const leafSideDockOpen = leafSplit === 'left'
            ? !leftSplit.collapsed
            : leafSplit === 'right'
                ? !rightSplit.collapsed
                : false;
        // Scenarios
        if (leafSideDockOpen) {
            if (leafActive) {
                // 1. leaf sidedock open and leaf active -> close sidedock
                (leafSplit === 'left' && leftSplit.collapse()) ||
                    (leafSplit === 'right' && rightSplit.collapse());
                return;
            }
            if (!leafActive) {
                // 2. leaf sidedock open and leaf not active -> reveal view
                this.revealView();
                return;
            }
        }
        if (!leafSideDockOpen) {
            if (leafSplit === 'root' && leafActive) {
                // 4. root split open and leaf active -> close root split
                leaf.detach();
                await this.initView({ active: false });
                return;
            }
            // 3. leaf sidedock close -> open leaf sidedock and reveal view
            // 5. root split open and leaf not active -> reveal view
            this.revealView();
        }
    }
    removeLocaleScripts() {
        console.log('removing locales scripts 🎑');
        const existingScripts = document.querySelectorAll('script[src^="https://cdn.jsdelivr.net/npm/dayjs@1"]');
        console.log('exisiting scirpt to remove 🤯', existingScripts);
        existingScripts.forEach((script) => {
            script.remove();
        });
    }
}

module.exports = DailyNoteFlexPlugin;
