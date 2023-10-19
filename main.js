'use strict';

var obsidian = require('obsidian');

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

/**
 * Get the current value from a store by subscribing and immediately unsubscribing.
 *
 * https://svelte.dev/docs/svelte-store#get
 * @template T
 * @param {import('../store/public.js').Readable<T>} store
 * @returns {T}
 */
function get_store_value(store) {
	let value;
	subscribe(store, (_) => (value = _))();
	return value;
}

/** @returns {void} */
function component_subscribe(component, store, callback) {
	component.$$.on_destroy.push(subscribe(store, callback));
}

/** @returns {{}} */
function exclude_internal_props(props) {
	const result = {};
	for (const k in props) if (k[0] !== '$') result[k] = props[k];
	return result;
}

/** @returns {{}} */
function compute_rest_props(props, keys) {
	const rest = {};
	keys = new Set(keys);
	for (const k in props) if (!keys.has(k) && k[0] !== '$') rest[k] = props[k];
	return rest;
}

function null_to_empty(value) {
	return value == null ? '' : value;
}

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
 * Associates an arbitrary `context` object with the current component and the specified `key`
 * and returns that object. The context is then available to children of the component
 * (including slotted content) with `getContext`.
 *
 * Like lifecycle functions, this must be called during component initialisation.
 *
 * https://svelte.dev/docs/svelte#setcontext
 * @template T
 * @param {any} key
 * @param {T} context
 * @returns {T}
 */
function setContext(key, context) {
	get_current_component().$$.context.set(key, context);
	return context;
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

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var weekOfYear$1 = {exports: {}};

(function (module, exports) {
	!function(e,t){module.exports=t();}(commonjsGlobal,(function(){var e="week",t="year";return function(i,n,r){var f=n.prototype;f.week=function(i){if(void 0===i&&(i=null),null!==i)return this.add(7*(i-this.week()),"day");var n=this.$locale().yearStart||1;if(11===this.month()&&this.date()>25){var f=r(this).startOf(t).add(1,t).date(n),s=r(this).endOf(e);if(f.isBefore(s))return 1}var a=r(this).startOf(t).date(n).startOf(e).subtract(1,"millisecond"),o=this.diff(a,e,!0);return o<0?r(this).startOf("week").week():Math.ceil(o)},f.weeks=function(e){return void 0===e&&(e=null),this.week(e)};}})); 
} (weekOfYear$1));

var weekOfYearExports = weekOfYear$1.exports;
var weekOfYear = /*@__PURE__*/getDefaultExportFromCjs(weekOfYearExports);

var isoWeek$1 = {exports: {}};

(function (module, exports) {
	!function(e,t){module.exports=t();}(commonjsGlobal,(function(){var e="day";return function(t,i,s){var a=function(t){return t.add(4-t.isoWeekday(),e)},d=i.prototype;d.isoWeekYear=function(){return a(this).year()},d.isoWeek=function(t){if(!this.$utils().u(t))return this.add(7*(t-this.isoWeek()),e);var i,d,n,o,r=a(this),u=(i=this.isoWeekYear(),d=this.$u,n=(d?s.utc:s)().year(i).startOf("year"),o=4-n.isoWeekday(),n.isoWeekday()>4&&(o+=7),n.add(o,e));return r.diff(u,"week")+1},d.isoWeekday=function(e){return this.$utils().u(e)?this.day()||7:this.day(this.day()%7?e:e-7)};var n=d.startOf;d.startOf=function(e,t){var i=this.$utils(),s=!!i.u(t)||t;return "isoweek"===i.p(e)?s?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):n.bind(this)(e,t)};}})); 
} (isoWeek$1));

var isoWeekExports = isoWeek$1.exports;
var isoWeek = /*@__PURE__*/getDefaultExportFromCjs(isoWeekExports);

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

const IS_MOBILE = Symbol("isMobile");
const DISPLAYED_DATE = Symbol("displayedDate");
const VIEW = Symbol('view');

function isMacOS() {
    return navigator.appVersion.indexOf('Mac') !== -1;
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
/**
 * Generate a 2D array of daily information to power
 * the calendar view.
 */
function getMonth(displayedDate) {
    const locale = window.moment().locale();
    const month = [];
    let week = { days: [], weekNum: 0 };
    const startOfMonth = displayedDate.clone().locale(locale).date(1);
    const startOffset = startOfMonth.weekday();
    let date = startOfMonth.clone().subtract(startOffset, 'days');
    for (let _day = 0; _day < 42; _day++) {
        if (_day % 7 === 0) {
            week = {
                days: [],
                weekNum: date.week()
            };
            month.push(week);
        }
        week.days.push(date);
        date = date.clone().add(1, 'days');
    }
    return month;
}
function getYears({ startRangeYear }) {
    let crrRangeYear = startRangeYear;
    const COLUMNS = 3;
    const ROWS = 4;
    const years = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
        for (let colIndex = 0; colIndex < COLUMNS; colIndex++) {
            years[rowIndex][colIndex] = crrRangeYear;
            crrRangeYear++;
        }
    }
    return years;
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
        // get First file matching given templatePath
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

const NOTE_FORMATS = {
    DAILY: 'YYYY-MM-DD',
    WEEKLY: 'gggg-[W]ww',
    MONTHLY: 'YYYY-MM',
    QUARTERLY: 'YYYY-[Q]Q',
    YEARLY: 'YYYY',
};

function shouldUsePeriodicNotesSettings(periodicity) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotes = window.app.plugins.getPlugin('periodic-notes');
    return periodicNotes && periodicNotes.settings?.[periodicity]?.enabled;
}
/**
 * Read the user settings for the `${granularity}-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
function getNoteSettingsByGranularity(granularity) {
    const periodicity = getPeriodicityFromGranularity(granularity);
    const defaultNoteFormat = NOTE_FORMATS[periodicity.toUpperCase()];
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { internalPlugins, plugins } = window.app;
        if (shouldUsePeriodicNotesSettings(periodicity)) {
            const { format, folder, template } = plugins.getPlugin('periodic-notes')?.settings?.[periodicity] || {};
            return {
                format: format || defaultNoteFormat,
                folder: folder?.trim() || '/',
                template: template?.trim() || ''
            };
        }
        if (periodicity === 'daily') {
            const { folder, format, template } = internalPlugins.getPluginById('daily-notes')?.instance?.options || {};
            return {
                format: format || defaultNoteFormat,
                folder: folder?.trim() || '/',
                template: template?.trim() || ''
            };
        }
        return {
            format: defaultNoteFormat,
            folder: '/',
            template: ''
        };
    }
    catch (err) {
        console.info('No custom daily note settings found! Ensure the plugin is active.', err);
        return {
            format: defaultNoteFormat,
            folder: '/',
            template: ''
        };
    }
}

/**
 * dateUID is a way of weekly identifying daily/weekly/monthly notes.
 * They are prefixed with the granularity to avoid ambiguity.
 */
function getDateUID(date, granularity = 'day') {
    return `${granularity}-${date.startOf(granularity).format()}`;
}
function removeEscapedCharacters(format) {
    return format.replace(/\[[^\]]*\]/g, ''); // remove everything within brackets
}
/**
 * XXX: When parsing dates that contain both week numbers and months,
 * Moment choses to ignore the week numbers. For the week dateUID, we
 * want the opposite behavior. Strip the MMM from the format to patch.
 */
function isWeekFormatAmbiguous(format) {
    const cleanFormat = removeEscapedCharacters(format);
    return /w{1,2}/i.test(cleanFormat) && (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat));
}
function getDateFromFile(file, granularity) {
    return getDateFromFilename(file.basename, granularity);
}
function getDateFromFilename(filename, granularity) {
    const format = getNoteSettingsByGranularity(granularity).format.split('/').pop();
    // TODO: Find a way to validate if a filename represents a valid date without using format to avoid:
    // every time periodic notes update and format changes only notes created with the new format are stored, the rest are neglected.
    // evaluate if current format creates a valid date
    const noteDate = window.moment(filename, format, true);
    if (!noteDate.isValid()) {
        return null;
    }
    if (granularity === 'week') {
        if (format && isWeekFormatAmbiguous(format)) {
            const cleanFormat = removeEscapedCharacters(format);
            if (/w{1,2}/i.test(cleanFormat)) {
                return window.moment(filename, 
                // If format contains week, remove day & month formatting
                format.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''), false);
            }
        }
    }
    return noteDate;
}
function getPeriodicityFromGranularity(granularity) {
    return granularity === 'day' ? 'daily' : `${granularity}ly`;
}

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var moment = {exports: {}};

(function (module, exports) {
(function (global, factory) {
	    module.exports = factory() ;
	}(commonjsGlobal, (function () {
	    var hookCallback;

	    function hooks() {
	        return hookCallback.apply(null, arguments);
	    }

	    // This is done to register the method called with moment()
	    // without creating circular dependencies.
	    function setHookCallback(callback) {
	        hookCallback = callback;
	    }

	    function isArray(input) {
	        return (
	            input instanceof Array ||
	            Object.prototype.toString.call(input) === '[object Array]'
	        );
	    }

	    function isObject(input) {
	        // IE8 will treat undefined and null as object if it wasn't for
	        // input != null
	        return (
	            input != null &&
	            Object.prototype.toString.call(input) === '[object Object]'
	        );
	    }

	    function hasOwnProp(a, b) {
	        return Object.prototype.hasOwnProperty.call(a, b);
	    }

	    function isObjectEmpty(obj) {
	        if (Object.getOwnPropertyNames) {
	            return Object.getOwnPropertyNames(obj).length === 0;
	        } else {
	            var k;
	            for (k in obj) {
	                if (hasOwnProp(obj, k)) {
	                    return false;
	                }
	            }
	            return true;
	        }
	    }

	    function isUndefined(input) {
	        return input === void 0;
	    }

	    function isNumber(input) {
	        return (
	            typeof input === 'number' ||
	            Object.prototype.toString.call(input) === '[object Number]'
	        );
	    }

	    function isDate(input) {
	        return (
	            input instanceof Date ||
	            Object.prototype.toString.call(input) === '[object Date]'
	        );
	    }

	    function map(arr, fn) {
	        var res = [],
	            i,
	            arrLen = arr.length;
	        for (i = 0; i < arrLen; ++i) {
	            res.push(fn(arr[i], i));
	        }
	        return res;
	    }

	    function extend(a, b) {
	        for (var i in b) {
	            if (hasOwnProp(b, i)) {
	                a[i] = b[i];
	            }
	        }

	        if (hasOwnProp(b, 'toString')) {
	            a.toString = b.toString;
	        }

	        if (hasOwnProp(b, 'valueOf')) {
	            a.valueOf = b.valueOf;
	        }

	        return a;
	    }

	    function createUTC(input, format, locale, strict) {
	        return createLocalOrUTC(input, format, locale, strict, true).utc();
	    }

	    function defaultParsingFlags() {
	        // We need to deep clone this object.
	        return {
	            empty: false,
	            unusedTokens: [],
	            unusedInput: [],
	            overflow: -2,
	            charsLeftOver: 0,
	            nullInput: false,
	            invalidEra: null,
	            invalidMonth: null,
	            invalidFormat: false,
	            userInvalidated: false,
	            iso: false,
	            parsedDateParts: [],
	            era: null,
	            meridiem: null,
	            rfc2822: false,
	            weekdayMismatch: false,
	        };
	    }

	    function getParsingFlags(m) {
	        if (m._pf == null) {
	            m._pf = defaultParsingFlags();
	        }
	        return m._pf;
	    }

	    var some;
	    if (Array.prototype.some) {
	        some = Array.prototype.some;
	    } else {
	        some = function (fun) {
	            var t = Object(this),
	                len = t.length >>> 0,
	                i;

	            for (i = 0; i < len; i++) {
	                if (i in t && fun.call(this, t[i], i, t)) {
	                    return true;
	                }
	            }

	            return false;
	        };
	    }

	    function isValid(m) {
	        if (m._isValid == null) {
	            var flags = getParsingFlags(m),
	                parsedParts = some.call(flags.parsedDateParts, function (i) {
	                    return i != null;
	                }),
	                isNowValid =
	                    !isNaN(m._d.getTime()) &&
	                    flags.overflow < 0 &&
	                    !flags.empty &&
	                    !flags.invalidEra &&
	                    !flags.invalidMonth &&
	                    !flags.invalidWeekday &&
	                    !flags.weekdayMismatch &&
	                    !flags.nullInput &&
	                    !flags.invalidFormat &&
	                    !flags.userInvalidated &&
	                    (!flags.meridiem || (flags.meridiem && parsedParts));

	            if (m._strict) {
	                isNowValid =
	                    isNowValid &&
	                    flags.charsLeftOver === 0 &&
	                    flags.unusedTokens.length === 0 &&
	                    flags.bigHour === undefined;
	            }

	            if (Object.isFrozen == null || !Object.isFrozen(m)) {
	                m._isValid = isNowValid;
	            } else {
	                return isNowValid;
	            }
	        }
	        return m._isValid;
	    }

	    function createInvalid(flags) {
	        var m = createUTC(NaN);
	        if (flags != null) {
	            extend(getParsingFlags(m), flags);
	        } else {
	            getParsingFlags(m).userInvalidated = true;
	        }

	        return m;
	    }

	    // Plugins that add properties should also add the key here (null value),
	    // so we can properly clone ourselves.
	    var momentProperties = (hooks.momentProperties = []),
	        updateInProgress = false;

	    function copyConfig(to, from) {
	        var i,
	            prop,
	            val,
	            momentPropertiesLen = momentProperties.length;

	        if (!isUndefined(from._isAMomentObject)) {
	            to._isAMomentObject = from._isAMomentObject;
	        }
	        if (!isUndefined(from._i)) {
	            to._i = from._i;
	        }
	        if (!isUndefined(from._f)) {
	            to._f = from._f;
	        }
	        if (!isUndefined(from._l)) {
	            to._l = from._l;
	        }
	        if (!isUndefined(from._strict)) {
	            to._strict = from._strict;
	        }
	        if (!isUndefined(from._tzm)) {
	            to._tzm = from._tzm;
	        }
	        if (!isUndefined(from._isUTC)) {
	            to._isUTC = from._isUTC;
	        }
	        if (!isUndefined(from._offset)) {
	            to._offset = from._offset;
	        }
	        if (!isUndefined(from._pf)) {
	            to._pf = getParsingFlags(from);
	        }
	        if (!isUndefined(from._locale)) {
	            to._locale = from._locale;
	        }

	        if (momentPropertiesLen > 0) {
	            for (i = 0; i < momentPropertiesLen; i++) {
	                prop = momentProperties[i];
	                val = from[prop];
	                if (!isUndefined(val)) {
	                    to[prop] = val;
	                }
	            }
	        }

	        return to;
	    }

	    // Moment prototype object
	    function Moment(config) {
	        copyConfig(this, config);
	        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
	        if (!this.isValid()) {
	            this._d = new Date(NaN);
	        }
	        // Prevent infinite loop in case updateOffset creates new moment
	        // objects.
	        if (updateInProgress === false) {
	            updateInProgress = true;
	            hooks.updateOffset(this);
	            updateInProgress = false;
	        }
	    }

	    function isMoment(obj) {
	        return (
	            obj instanceof Moment || (obj != null && obj._isAMomentObject != null)
	        );
	    }

	    function warn(msg) {
	        if (
	            hooks.suppressDeprecationWarnings === false &&
	            typeof console !== 'undefined' &&
	            console.warn
	        ) {
	            console.warn('Deprecation warning: ' + msg);
	        }
	    }

	    function deprecate(msg, fn) {
	        var firstTime = true;

	        return extend(function () {
	            if (hooks.deprecationHandler != null) {
	                hooks.deprecationHandler(null, msg);
	            }
	            if (firstTime) {
	                var args = [],
	                    arg,
	                    i,
	                    key,
	                    argLen = arguments.length;
	                for (i = 0; i < argLen; i++) {
	                    arg = '';
	                    if (typeof arguments[i] === 'object') {
	                        arg += '\n[' + i + '] ';
	                        for (key in arguments[0]) {
	                            if (hasOwnProp(arguments[0], key)) {
	                                arg += key + ': ' + arguments[0][key] + ', ';
	                            }
	                        }
	                        arg = arg.slice(0, -2); // Remove trailing comma and space
	                    } else {
	                        arg = arguments[i];
	                    }
	                    args.push(arg);
	                }
	                warn(
	                    msg +
	                        '\nArguments: ' +
	                        Array.prototype.slice.call(args).join('') +
	                        '\n' +
	                        new Error().stack
	                );
	                firstTime = false;
	            }
	            return fn.apply(this, arguments);
	        }, fn);
	    }

	    var deprecations = {};

	    function deprecateSimple(name, msg) {
	        if (hooks.deprecationHandler != null) {
	            hooks.deprecationHandler(name, msg);
	        }
	        if (!deprecations[name]) {
	            warn(msg);
	            deprecations[name] = true;
	        }
	    }

	    hooks.suppressDeprecationWarnings = false;
	    hooks.deprecationHandler = null;

	    function isFunction(input) {
	        return (
	            (typeof Function !== 'undefined' && input instanceof Function) ||
	            Object.prototype.toString.call(input) === '[object Function]'
	        );
	    }

	    function set(config) {
	        var prop, i;
	        for (i in config) {
	            if (hasOwnProp(config, i)) {
	                prop = config[i];
	                if (isFunction(prop)) {
	                    this[i] = prop;
	                } else {
	                    this['_' + i] = prop;
	                }
	            }
	        }
	        this._config = config;
	        // Lenient ordinal parsing accepts just a number in addition to
	        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
	        // TODO: Remove "ordinalParse" fallback in next major release.
	        this._dayOfMonthOrdinalParseLenient = new RegExp(
	            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
	                '|' +
	                /\d{1,2}/.source
	        );
	    }

	    function mergeConfigs(parentConfig, childConfig) {
	        var res = extend({}, parentConfig),
	            prop;
	        for (prop in childConfig) {
	            if (hasOwnProp(childConfig, prop)) {
	                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
	                    res[prop] = {};
	                    extend(res[prop], parentConfig[prop]);
	                    extend(res[prop], childConfig[prop]);
	                } else if (childConfig[prop] != null) {
	                    res[prop] = childConfig[prop];
	                } else {
	                    delete res[prop];
	                }
	            }
	        }
	        for (prop in parentConfig) {
	            if (
	                hasOwnProp(parentConfig, prop) &&
	                !hasOwnProp(childConfig, prop) &&
	                isObject(parentConfig[prop])
	            ) {
	                // make sure changes to properties don't modify parent config
	                res[prop] = extend({}, res[prop]);
	            }
	        }
	        return res;
	    }

	    function Locale(config) {
	        if (config != null) {
	            this.set(config);
	        }
	    }

	    var keys;

	    if (Object.keys) {
	        keys = Object.keys;
	    } else {
	        keys = function (obj) {
	            var i,
	                res = [];
	            for (i in obj) {
	                if (hasOwnProp(obj, i)) {
	                    res.push(i);
	                }
	            }
	            return res;
	        };
	    }

	    var defaultCalendar = {
	        sameDay: '[Today at] LT',
	        nextDay: '[Tomorrow at] LT',
	        nextWeek: 'dddd [at] LT',
	        lastDay: '[Yesterday at] LT',
	        lastWeek: '[Last] dddd [at] LT',
	        sameElse: 'L',
	    };

	    function calendar(key, mom, now) {
	        var output = this._calendar[key] || this._calendar['sameElse'];
	        return isFunction(output) ? output.call(mom, now) : output;
	    }

	    function zeroFill(number, targetLength, forceSign) {
	        var absNumber = '' + Math.abs(number),
	            zerosToFill = targetLength - absNumber.length,
	            sign = number >= 0;
	        return (
	            (sign ? (forceSign ? '+' : '') : '-') +
	            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) +
	            absNumber
	        );
	    }

	    var formattingTokens =
	            /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
	        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
	        formatFunctions = {},
	        formatTokenFunctions = {};

	    // token:    'M'
	    // padded:   ['MM', 2]
	    // ordinal:  'Mo'
	    // callback: function () { this.month() + 1 }
	    function addFormatToken(token, padded, ordinal, callback) {
	        var func = callback;
	        if (typeof callback === 'string') {
	            func = function () {
	                return this[callback]();
	            };
	        }
	        if (token) {
	            formatTokenFunctions[token] = func;
	        }
	        if (padded) {
	            formatTokenFunctions[padded[0]] = function () {
	                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
	            };
	        }
	        if (ordinal) {
	            formatTokenFunctions[ordinal] = function () {
	                return this.localeData().ordinal(
	                    func.apply(this, arguments),
	                    token
	                );
	            };
	        }
	    }

	    function removeFormattingTokens(input) {
	        if (input.match(/\[[\s\S]/)) {
	            return input.replace(/^\[|\]$/g, '');
	        }
	        return input.replace(/\\/g, '');
	    }

	    function makeFormatFunction(format) {
	        var array = format.match(formattingTokens),
	            i,
	            length;

	        for (i = 0, length = array.length; i < length; i++) {
	            if (formatTokenFunctions[array[i]]) {
	                array[i] = formatTokenFunctions[array[i]];
	            } else {
	                array[i] = removeFormattingTokens(array[i]);
	            }
	        }

	        return function (mom) {
	            var output = '',
	                i;
	            for (i = 0; i < length; i++) {
	                output += isFunction(array[i])
	                    ? array[i].call(mom, format)
	                    : array[i];
	            }
	            return output;
	        };
	    }

	    // format date using native date object
	    function formatMoment(m, format) {
	        if (!m.isValid()) {
	            return m.localeData().invalidDate();
	        }

	        format = expandFormat(format, m.localeData());
	        formatFunctions[format] =
	            formatFunctions[format] || makeFormatFunction(format);

	        return formatFunctions[format](m);
	    }

	    function expandFormat(format, locale) {
	        var i = 5;

	        function replaceLongDateFormatTokens(input) {
	            return locale.longDateFormat(input) || input;
	        }

	        localFormattingTokens.lastIndex = 0;
	        while (i >= 0 && localFormattingTokens.test(format)) {
	            format = format.replace(
	                localFormattingTokens,
	                replaceLongDateFormatTokens
	            );
	            localFormattingTokens.lastIndex = 0;
	            i -= 1;
	        }

	        return format;
	    }

	    var defaultLongDateFormat = {
	        LTS: 'h:mm:ss A',
	        LT: 'h:mm A',
	        L: 'MM/DD/YYYY',
	        LL: 'MMMM D, YYYY',
	        LLL: 'MMMM D, YYYY h:mm A',
	        LLLL: 'dddd, MMMM D, YYYY h:mm A',
	    };

	    function longDateFormat(key) {
	        var format = this._longDateFormat[key],
	            formatUpper = this._longDateFormat[key.toUpperCase()];

	        if (format || !formatUpper) {
	            return format;
	        }

	        this._longDateFormat[key] = formatUpper
	            .match(formattingTokens)
	            .map(function (tok) {
	                if (
	                    tok === 'MMMM' ||
	                    tok === 'MM' ||
	                    tok === 'DD' ||
	                    tok === 'dddd'
	                ) {
	                    return tok.slice(1);
	                }
	                return tok;
	            })
	            .join('');

	        return this._longDateFormat[key];
	    }

	    var defaultInvalidDate = 'Invalid date';

	    function invalidDate() {
	        return this._invalidDate;
	    }

	    var defaultOrdinal = '%d',
	        defaultDayOfMonthOrdinalParse = /\d{1,2}/;

	    function ordinal(number) {
	        return this._ordinal.replace('%d', number);
	    }

	    var defaultRelativeTime = {
	        future: 'in %s',
	        past: '%s ago',
	        s: 'a few seconds',
	        ss: '%d seconds',
	        m: 'a minute',
	        mm: '%d minutes',
	        h: 'an hour',
	        hh: '%d hours',
	        d: 'a day',
	        dd: '%d days',
	        w: 'a week',
	        ww: '%d weeks',
	        M: 'a month',
	        MM: '%d months',
	        y: 'a year',
	        yy: '%d years',
	    };

	    function relativeTime(number, withoutSuffix, string, isFuture) {
	        var output = this._relativeTime[string];
	        return isFunction(output)
	            ? output(number, withoutSuffix, string, isFuture)
	            : output.replace(/%d/i, number);
	    }

	    function pastFuture(diff, output) {
	        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
	        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
	    }

	    var aliases = {};

	    function addUnitAlias(unit, shorthand) {
	        var lowerCase = unit.toLowerCase();
	        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
	    }

	    function normalizeUnits(units) {
	        return typeof units === 'string'
	            ? aliases[units] || aliases[units.toLowerCase()]
	            : undefined;
	    }

	    function normalizeObjectUnits(inputObject) {
	        var normalizedInput = {},
	            normalizedProp,
	            prop;

	        for (prop in inputObject) {
	            if (hasOwnProp(inputObject, prop)) {
	                normalizedProp = normalizeUnits(prop);
	                if (normalizedProp) {
	                    normalizedInput[normalizedProp] = inputObject[prop];
	                }
	            }
	        }

	        return normalizedInput;
	    }

	    var priorities = {};

	    function addUnitPriority(unit, priority) {
	        priorities[unit] = priority;
	    }

	    function getPrioritizedUnits(unitsObj) {
	        var units = [],
	            u;
	        for (u in unitsObj) {
	            if (hasOwnProp(unitsObj, u)) {
	                units.push({ unit: u, priority: priorities[u] });
	            }
	        }
	        units.sort(function (a, b) {
	            return a.priority - b.priority;
	        });
	        return units;
	    }

	    function isLeapYear(year) {
	        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
	    }

	    function absFloor(number) {
	        if (number < 0) {
	            // -0 -> 0
	            return Math.ceil(number) || 0;
	        } else {
	            return Math.floor(number);
	        }
	    }

	    function toInt(argumentForCoercion) {
	        var coercedNumber = +argumentForCoercion,
	            value = 0;

	        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
	            value = absFloor(coercedNumber);
	        }

	        return value;
	    }

	    function makeGetSet(unit, keepTime) {
	        return function (value) {
	            if (value != null) {
	                set$1(this, unit, value);
	                hooks.updateOffset(this, keepTime);
	                return this;
	            } else {
	                return get(this, unit);
	            }
	        };
	    }

	    function get(mom, unit) {
	        return mom.isValid()
	            ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]()
	            : NaN;
	    }

	    function set$1(mom, unit, value) {
	        if (mom.isValid() && !isNaN(value)) {
	            if (
	                unit === 'FullYear' &&
	                isLeapYear(mom.year()) &&
	                mom.month() === 1 &&
	                mom.date() === 29
	            ) {
	                value = toInt(value);
	                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](
	                    value,
	                    mom.month(),
	                    daysInMonth(value, mom.month())
	                );
	            } else {
	                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
	            }
	        }
	    }

	    // MOMENTS

	    function stringGet(units) {
	        units = normalizeUnits(units);
	        if (isFunction(this[units])) {
	            return this[units]();
	        }
	        return this;
	    }

	    function stringSet(units, value) {
	        if (typeof units === 'object') {
	            units = normalizeObjectUnits(units);
	            var prioritized = getPrioritizedUnits(units),
	                i,
	                prioritizedLen = prioritized.length;
	            for (i = 0; i < prioritizedLen; i++) {
	                this[prioritized[i].unit](units[prioritized[i].unit]);
	            }
	        } else {
	            units = normalizeUnits(units);
	            if (isFunction(this[units])) {
	                return this[units](value);
	            }
	        }
	        return this;
	    }

	    var match1 = /\d/, //       0 - 9
	        match2 = /\d\d/, //      00 - 99
	        match3 = /\d{3}/, //     000 - 999
	        match4 = /\d{4}/, //    0000 - 9999
	        match6 = /[+-]?\d{6}/, // -999999 - 999999
	        match1to2 = /\d\d?/, //       0 - 99
	        match3to4 = /\d\d\d\d?/, //     999 - 9999
	        match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
	        match1to3 = /\d{1,3}/, //       0 - 999
	        match1to4 = /\d{1,4}/, //       0 - 9999
	        match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
	        matchUnsigned = /\d+/, //       0 - inf
	        matchSigned = /[+-]?\d+/, //    -inf - inf
	        matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
	        matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
	        matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
	        // any word (or two) characters or numbers including two/three word month in arabic.
	        // includes scottish gaelic two word and hyphenated months
	        matchWord =
	            /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
	        regexes;

	    regexes = {};

	    function addRegexToken(token, regex, strictRegex) {
	        regexes[token] = isFunction(regex)
	            ? regex
	            : function (isStrict, localeData) {
	                  return isStrict && strictRegex ? strictRegex : regex;
	              };
	    }

	    function getParseRegexForToken(token, config) {
	        if (!hasOwnProp(regexes, token)) {
	            return new RegExp(unescapeFormat(token));
	        }

	        return regexes[token](config._strict, config._locale);
	    }

	    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
	    function unescapeFormat(s) {
	        return regexEscape(
	            s
	                .replace('\\', '')
	                .replace(
	                    /\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,
	                    function (matched, p1, p2, p3, p4) {
	                        return p1 || p2 || p3 || p4;
	                    }
	                )
	        );
	    }

	    function regexEscape(s) {
	        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	    }

	    var tokens = {};

	    function addParseToken(token, callback) {
	        var i,
	            func = callback,
	            tokenLen;
	        if (typeof token === 'string') {
	            token = [token];
	        }
	        if (isNumber(callback)) {
	            func = function (input, array) {
	                array[callback] = toInt(input);
	            };
	        }
	        tokenLen = token.length;
	        for (i = 0; i < tokenLen; i++) {
	            tokens[token[i]] = func;
	        }
	    }

	    function addWeekParseToken(token, callback) {
	        addParseToken(token, function (input, array, config, token) {
	            config._w = config._w || {};
	            callback(input, config._w, config, token);
	        });
	    }

	    function addTimeToArrayFromToken(token, input, config) {
	        if (input != null && hasOwnProp(tokens, token)) {
	            tokens[token](input, config._a, config, token);
	        }
	    }

	    var YEAR = 0,
	        MONTH = 1,
	        DATE = 2,
	        HOUR = 3,
	        MINUTE = 4,
	        SECOND = 5,
	        MILLISECOND = 6,
	        WEEK = 7,
	        WEEKDAY = 8;

	    function mod(n, x) {
	        return ((n % x) + x) % x;
	    }

	    var indexOf;

	    if (Array.prototype.indexOf) {
	        indexOf = Array.prototype.indexOf;
	    } else {
	        indexOf = function (o) {
	            // I know
	            var i;
	            for (i = 0; i < this.length; ++i) {
	                if (this[i] === o) {
	                    return i;
	                }
	            }
	            return -1;
	        };
	    }

	    function daysInMonth(year, month) {
	        if (isNaN(year) || isNaN(month)) {
	            return NaN;
	        }
	        var modMonth = mod(month, 12);
	        year += (month - modMonth) / 12;
	        return modMonth === 1
	            ? isLeapYear(year)
	                ? 29
	                : 28
	            : 31 - ((modMonth % 7) % 2);
	    }

	    // FORMATTING

	    addFormatToken('M', ['MM', 2], 'Mo', function () {
	        return this.month() + 1;
	    });

	    addFormatToken('MMM', 0, 0, function (format) {
	        return this.localeData().monthsShort(this, format);
	    });

	    addFormatToken('MMMM', 0, 0, function (format) {
	        return this.localeData().months(this, format);
	    });

	    // ALIASES

	    addUnitAlias('month', 'M');

	    // PRIORITY

	    addUnitPriority('month', 8);

	    // PARSING

	    addRegexToken('M', match1to2);
	    addRegexToken('MM', match1to2, match2);
	    addRegexToken('MMM', function (isStrict, locale) {
	        return locale.monthsShortRegex(isStrict);
	    });
	    addRegexToken('MMMM', function (isStrict, locale) {
	        return locale.monthsRegex(isStrict);
	    });

	    addParseToken(['M', 'MM'], function (input, array) {
	        array[MONTH] = toInt(input) - 1;
	    });

	    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
	        var month = config._locale.monthsParse(input, token, config._strict);
	        // if we didn't find a month name, mark the date as invalid.
	        if (month != null) {
	            array[MONTH] = month;
	        } else {
	            getParsingFlags(config).invalidMonth = input;
	        }
	    });

	    // LOCALES

	    var defaultLocaleMonths =
	            'January_February_March_April_May_June_July_August_September_October_November_December'.split(
	                '_'
	            ),
	        defaultLocaleMonthsShort =
	            'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
	        MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
	        defaultMonthsShortRegex = matchWord,
	        defaultMonthsRegex = matchWord;

	    function localeMonths(m, format) {
	        if (!m) {
	            return isArray(this._months)
	                ? this._months
	                : this._months['standalone'];
	        }
	        return isArray(this._months)
	            ? this._months[m.month()]
	            : this._months[
	                  (this._months.isFormat || MONTHS_IN_FORMAT).test(format)
	                      ? 'format'
	                      : 'standalone'
	              ][m.month()];
	    }

	    function localeMonthsShort(m, format) {
	        if (!m) {
	            return isArray(this._monthsShort)
	                ? this._monthsShort
	                : this._monthsShort['standalone'];
	        }
	        return isArray(this._monthsShort)
	            ? this._monthsShort[m.month()]
	            : this._monthsShort[
	                  MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'
	              ][m.month()];
	    }

	    function handleStrictParse(monthName, format, strict) {
	        var i,
	            ii,
	            mom,
	            llc = monthName.toLocaleLowerCase();
	        if (!this._monthsParse) {
	            // this is not used
	            this._monthsParse = [];
	            this._longMonthsParse = [];
	            this._shortMonthsParse = [];
	            for (i = 0; i < 12; ++i) {
	                mom = createUTC([2000, i]);
	                this._shortMonthsParse[i] = this.monthsShort(
	                    mom,
	                    ''
	                ).toLocaleLowerCase();
	                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
	            }
	        }

	        if (strict) {
	            if (format === 'MMM') {
	                ii = indexOf.call(this._shortMonthsParse, llc);
	                return ii !== -1 ? ii : null;
	            } else {
	                ii = indexOf.call(this._longMonthsParse, llc);
	                return ii !== -1 ? ii : null;
	            }
	        } else {
	            if (format === 'MMM') {
	                ii = indexOf.call(this._shortMonthsParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._longMonthsParse, llc);
	                return ii !== -1 ? ii : null;
	            } else {
	                ii = indexOf.call(this._longMonthsParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._shortMonthsParse, llc);
	                return ii !== -1 ? ii : null;
	            }
	        }
	    }

	    function localeMonthsParse(monthName, format, strict) {
	        var i, mom, regex;

	        if (this._monthsParseExact) {
	            return handleStrictParse.call(this, monthName, format, strict);
	        }

	        if (!this._monthsParse) {
	            this._monthsParse = [];
	            this._longMonthsParse = [];
	            this._shortMonthsParse = [];
	        }

	        // TODO: add sorting
	        // Sorting makes sure if one month (or abbr) is a prefix of another
	        // see sorting in computeMonthsParse
	        for (i = 0; i < 12; i++) {
	            // make the regex if we don't have it already
	            mom = createUTC([2000, i]);
	            if (strict && !this._longMonthsParse[i]) {
	                this._longMonthsParse[i] = new RegExp(
	                    '^' + this.months(mom, '').replace('.', '') + '$',
	                    'i'
	                );
	                this._shortMonthsParse[i] = new RegExp(
	                    '^' + this.monthsShort(mom, '').replace('.', '') + '$',
	                    'i'
	                );
	            }
	            if (!strict && !this._monthsParse[i]) {
	                regex =
	                    '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
	                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
	            }
	            // test the regex
	            if (
	                strict &&
	                format === 'MMMM' &&
	                this._longMonthsParse[i].test(monthName)
	            ) {
	                return i;
	            } else if (
	                strict &&
	                format === 'MMM' &&
	                this._shortMonthsParse[i].test(monthName)
	            ) {
	                return i;
	            } else if (!strict && this._monthsParse[i].test(monthName)) {
	                return i;
	            }
	        }
	    }

	    // MOMENTS

	    function setMonth(mom, value) {
	        var dayOfMonth;

	        if (!mom.isValid()) {
	            // No op
	            return mom;
	        }

	        if (typeof value === 'string') {
	            if (/^\d+$/.test(value)) {
	                value = toInt(value);
	            } else {
	                value = mom.localeData().monthsParse(value);
	                // TODO: Another silent failure?
	                if (!isNumber(value)) {
	                    return mom;
	                }
	            }
	        }

	        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
	        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
	        return mom;
	    }

	    function getSetMonth(value) {
	        if (value != null) {
	            setMonth(this, value);
	            hooks.updateOffset(this, true);
	            return this;
	        } else {
	            return get(this, 'Month');
	        }
	    }

	    function getDaysInMonth() {
	        return daysInMonth(this.year(), this.month());
	    }

	    function monthsShortRegex(isStrict) {
	        if (this._monthsParseExact) {
	            if (!hasOwnProp(this, '_monthsRegex')) {
	                computeMonthsParse.call(this);
	            }
	            if (isStrict) {
	                return this._monthsShortStrictRegex;
	            } else {
	                return this._monthsShortRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_monthsShortRegex')) {
	                this._monthsShortRegex = defaultMonthsShortRegex;
	            }
	            return this._monthsShortStrictRegex && isStrict
	                ? this._monthsShortStrictRegex
	                : this._monthsShortRegex;
	        }
	    }

	    function monthsRegex(isStrict) {
	        if (this._monthsParseExact) {
	            if (!hasOwnProp(this, '_monthsRegex')) {
	                computeMonthsParse.call(this);
	            }
	            if (isStrict) {
	                return this._monthsStrictRegex;
	            } else {
	                return this._monthsRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_monthsRegex')) {
	                this._monthsRegex = defaultMonthsRegex;
	            }
	            return this._monthsStrictRegex && isStrict
	                ? this._monthsStrictRegex
	                : this._monthsRegex;
	        }
	    }

	    function computeMonthsParse() {
	        function cmpLenRev(a, b) {
	            return b.length - a.length;
	        }

	        var shortPieces = [],
	            longPieces = [],
	            mixedPieces = [],
	            i,
	            mom;
	        for (i = 0; i < 12; i++) {
	            // make the regex if we don't have it already
	            mom = createUTC([2000, i]);
	            shortPieces.push(this.monthsShort(mom, ''));
	            longPieces.push(this.months(mom, ''));
	            mixedPieces.push(this.months(mom, ''));
	            mixedPieces.push(this.monthsShort(mom, ''));
	        }
	        // Sorting makes sure if one month (or abbr) is a prefix of another it
	        // will match the longer piece.
	        shortPieces.sort(cmpLenRev);
	        longPieces.sort(cmpLenRev);
	        mixedPieces.sort(cmpLenRev);
	        for (i = 0; i < 12; i++) {
	            shortPieces[i] = regexEscape(shortPieces[i]);
	            longPieces[i] = regexEscape(longPieces[i]);
	        }
	        for (i = 0; i < 24; i++) {
	            mixedPieces[i] = regexEscape(mixedPieces[i]);
	        }

	        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
	        this._monthsShortRegex = this._monthsRegex;
	        this._monthsStrictRegex = new RegExp(
	            '^(' + longPieces.join('|') + ')',
	            'i'
	        );
	        this._monthsShortStrictRegex = new RegExp(
	            '^(' + shortPieces.join('|') + ')',
	            'i'
	        );
	    }

	    // FORMATTING

	    addFormatToken('Y', 0, 0, function () {
	        var y = this.year();
	        return y <= 9999 ? zeroFill(y, 4) : '+' + y;
	    });

	    addFormatToken(0, ['YY', 2], 0, function () {
	        return this.year() % 100;
	    });

	    addFormatToken(0, ['YYYY', 4], 0, 'year');
	    addFormatToken(0, ['YYYYY', 5], 0, 'year');
	    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

	    // ALIASES

	    addUnitAlias('year', 'y');

	    // PRIORITIES

	    addUnitPriority('year', 1);

	    // PARSING

	    addRegexToken('Y', matchSigned);
	    addRegexToken('YY', match1to2, match2);
	    addRegexToken('YYYY', match1to4, match4);
	    addRegexToken('YYYYY', match1to6, match6);
	    addRegexToken('YYYYYY', match1to6, match6);

	    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
	    addParseToken('YYYY', function (input, array) {
	        array[YEAR] =
	            input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
	    });
	    addParseToken('YY', function (input, array) {
	        array[YEAR] = hooks.parseTwoDigitYear(input);
	    });
	    addParseToken('Y', function (input, array) {
	        array[YEAR] = parseInt(input, 10);
	    });

	    // HELPERS

	    function daysInYear(year) {
	        return isLeapYear(year) ? 366 : 365;
	    }

	    // HOOKS

	    hooks.parseTwoDigitYear = function (input) {
	        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
	    };

	    // MOMENTS

	    var getSetYear = makeGetSet('FullYear', true);

	    function getIsLeapYear() {
	        return isLeapYear(this.year());
	    }

	    function createDate(y, m, d, h, M, s, ms) {
	        // can't just apply() to create a date:
	        // https://stackoverflow.com/q/181348
	        var date;
	        // the date constructor remaps years 0-99 to 1900-1999
	        if (y < 100 && y >= 0) {
	            // preserve leap years using a full 400 year cycle, then reset
	            date = new Date(y + 400, m, d, h, M, s, ms);
	            if (isFinite(date.getFullYear())) {
	                date.setFullYear(y);
	            }
	        } else {
	            date = new Date(y, m, d, h, M, s, ms);
	        }

	        return date;
	    }

	    function createUTCDate(y) {
	        var date, args;
	        // the Date.UTC function remaps years 0-99 to 1900-1999
	        if (y < 100 && y >= 0) {
	            args = Array.prototype.slice.call(arguments);
	            // preserve leap years using a full 400 year cycle, then reset
	            args[0] = y + 400;
	            date = new Date(Date.UTC.apply(null, args));
	            if (isFinite(date.getUTCFullYear())) {
	                date.setUTCFullYear(y);
	            }
	        } else {
	            date = new Date(Date.UTC.apply(null, arguments));
	        }

	        return date;
	    }

	    // start-of-first-week - start-of-year
	    function firstWeekOffset(year, dow, doy) {
	        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
	            fwd = 7 + dow - doy,
	            // first-week day local weekday -- which local weekday is fwd
	            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

	        return -fwdlw + fwd - 1;
	    }

	    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
	    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
	        var localWeekday = (7 + weekday - dow) % 7,
	            weekOffset = firstWeekOffset(year, dow, doy),
	            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
	            resYear,
	            resDayOfYear;

	        if (dayOfYear <= 0) {
	            resYear = year - 1;
	            resDayOfYear = daysInYear(resYear) + dayOfYear;
	        } else if (dayOfYear > daysInYear(year)) {
	            resYear = year + 1;
	            resDayOfYear = dayOfYear - daysInYear(year);
	        } else {
	            resYear = year;
	            resDayOfYear = dayOfYear;
	        }

	        return {
	            year: resYear,
	            dayOfYear: resDayOfYear,
	        };
	    }

	    function weekOfYear(mom, dow, doy) {
	        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
	            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
	            resWeek,
	            resYear;

	        if (week < 1) {
	            resYear = mom.year() - 1;
	            resWeek = week + weeksInYear(resYear, dow, doy);
	        } else if (week > weeksInYear(mom.year(), dow, doy)) {
	            resWeek = week - weeksInYear(mom.year(), dow, doy);
	            resYear = mom.year() + 1;
	        } else {
	            resYear = mom.year();
	            resWeek = week;
	        }

	        return {
	            week: resWeek,
	            year: resYear,
	        };
	    }

	    function weeksInYear(year, dow, doy) {
	        var weekOffset = firstWeekOffset(year, dow, doy),
	            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
	        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
	    }

	    // FORMATTING

	    addFormatToken('w', ['ww', 2], 'wo', 'week');
	    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

	    // ALIASES

	    addUnitAlias('week', 'w');
	    addUnitAlias('isoWeek', 'W');

	    // PRIORITIES

	    addUnitPriority('week', 5);
	    addUnitPriority('isoWeek', 5);

	    // PARSING

	    addRegexToken('w', match1to2);
	    addRegexToken('ww', match1to2, match2);
	    addRegexToken('W', match1to2);
	    addRegexToken('WW', match1to2, match2);

	    addWeekParseToken(
	        ['w', 'ww', 'W', 'WW'],
	        function (input, week, config, token) {
	            week[token.substr(0, 1)] = toInt(input);
	        }
	    );

	    // HELPERS

	    // LOCALES

	    function localeWeek(mom) {
	        return weekOfYear(mom, this._week.dow, this._week.doy).week;
	    }

	    var defaultLocaleWeek = {
	        dow: 0, // Sunday is the first day of the week.
	        doy: 6, // The week that contains Jan 6th is the first week of the year.
	    };

	    function localeFirstDayOfWeek() {
	        return this._week.dow;
	    }

	    function localeFirstDayOfYear() {
	        return this._week.doy;
	    }

	    // MOMENTS

	    function getSetWeek(input) {
	        var week = this.localeData().week(this);
	        return input == null ? week : this.add((input - week) * 7, 'd');
	    }

	    function getSetISOWeek(input) {
	        var week = weekOfYear(this, 1, 4).week;
	        return input == null ? week : this.add((input - week) * 7, 'd');
	    }

	    // FORMATTING

	    addFormatToken('d', 0, 'do', 'day');

	    addFormatToken('dd', 0, 0, function (format) {
	        return this.localeData().weekdaysMin(this, format);
	    });

	    addFormatToken('ddd', 0, 0, function (format) {
	        return this.localeData().weekdaysShort(this, format);
	    });

	    addFormatToken('dddd', 0, 0, function (format) {
	        return this.localeData().weekdays(this, format);
	    });

	    addFormatToken('e', 0, 0, 'weekday');
	    addFormatToken('E', 0, 0, 'isoWeekday');

	    // ALIASES

	    addUnitAlias('day', 'd');
	    addUnitAlias('weekday', 'e');
	    addUnitAlias('isoWeekday', 'E');

	    // PRIORITY
	    addUnitPriority('day', 11);
	    addUnitPriority('weekday', 11);
	    addUnitPriority('isoWeekday', 11);

	    // PARSING

	    addRegexToken('d', match1to2);
	    addRegexToken('e', match1to2);
	    addRegexToken('E', match1to2);
	    addRegexToken('dd', function (isStrict, locale) {
	        return locale.weekdaysMinRegex(isStrict);
	    });
	    addRegexToken('ddd', function (isStrict, locale) {
	        return locale.weekdaysShortRegex(isStrict);
	    });
	    addRegexToken('dddd', function (isStrict, locale) {
	        return locale.weekdaysRegex(isStrict);
	    });

	    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
	        var weekday = config._locale.weekdaysParse(input, token, config._strict);
	        // if we didn't get a weekday name, mark the date as invalid
	        if (weekday != null) {
	            week.d = weekday;
	        } else {
	            getParsingFlags(config).invalidWeekday = input;
	        }
	    });

	    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
	        week[token] = toInt(input);
	    });

	    // HELPERS

	    function parseWeekday(input, locale) {
	        if (typeof input !== 'string') {
	            return input;
	        }

	        if (!isNaN(input)) {
	            return parseInt(input, 10);
	        }

	        input = locale.weekdaysParse(input);
	        if (typeof input === 'number') {
	            return input;
	        }

	        return null;
	    }

	    function parseIsoWeekday(input, locale) {
	        if (typeof input === 'string') {
	            return locale.weekdaysParse(input) % 7 || 7;
	        }
	        return isNaN(input) ? null : input;
	    }

	    // LOCALES
	    function shiftWeekdays(ws, n) {
	        return ws.slice(n, 7).concat(ws.slice(0, n));
	    }

	    var defaultLocaleWeekdays =
	            'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
	        defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
	        defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
	        defaultWeekdaysRegex = matchWord,
	        defaultWeekdaysShortRegex = matchWord,
	        defaultWeekdaysMinRegex = matchWord;

	    function localeWeekdays(m, format) {
	        var weekdays = isArray(this._weekdays)
	            ? this._weekdays
	            : this._weekdays[
	                  m && m !== true && this._weekdays.isFormat.test(format)
	                      ? 'format'
	                      : 'standalone'
	              ];
	        return m === true
	            ? shiftWeekdays(weekdays, this._week.dow)
	            : m
	            ? weekdays[m.day()]
	            : weekdays;
	    }

	    function localeWeekdaysShort(m) {
	        return m === true
	            ? shiftWeekdays(this._weekdaysShort, this._week.dow)
	            : m
	            ? this._weekdaysShort[m.day()]
	            : this._weekdaysShort;
	    }

	    function localeWeekdaysMin(m) {
	        return m === true
	            ? shiftWeekdays(this._weekdaysMin, this._week.dow)
	            : m
	            ? this._weekdaysMin[m.day()]
	            : this._weekdaysMin;
	    }

	    function handleStrictParse$1(weekdayName, format, strict) {
	        var i,
	            ii,
	            mom,
	            llc = weekdayName.toLocaleLowerCase();
	        if (!this._weekdaysParse) {
	            this._weekdaysParse = [];
	            this._shortWeekdaysParse = [];
	            this._minWeekdaysParse = [];

	            for (i = 0; i < 7; ++i) {
	                mom = createUTC([2000, 1]).day(i);
	                this._minWeekdaysParse[i] = this.weekdaysMin(
	                    mom,
	                    ''
	                ).toLocaleLowerCase();
	                this._shortWeekdaysParse[i] = this.weekdaysShort(
	                    mom,
	                    ''
	                ).toLocaleLowerCase();
	                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
	            }
	        }

	        if (strict) {
	            if (format === 'dddd') {
	                ii = indexOf.call(this._weekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            } else if (format === 'ddd') {
	                ii = indexOf.call(this._shortWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            } else {
	                ii = indexOf.call(this._minWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            }
	        } else {
	            if (format === 'dddd') {
	                ii = indexOf.call(this._weekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._shortWeekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._minWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            } else if (format === 'ddd') {
	                ii = indexOf.call(this._shortWeekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._weekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._minWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            } else {
	                ii = indexOf.call(this._minWeekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._weekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._shortWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            }
	        }
	    }

	    function localeWeekdaysParse(weekdayName, format, strict) {
	        var i, mom, regex;

	        if (this._weekdaysParseExact) {
	            return handleStrictParse$1.call(this, weekdayName, format, strict);
	        }

	        if (!this._weekdaysParse) {
	            this._weekdaysParse = [];
	            this._minWeekdaysParse = [];
	            this._shortWeekdaysParse = [];
	            this._fullWeekdaysParse = [];
	        }

	        for (i = 0; i < 7; i++) {
	            // make the regex if we don't have it already

	            mom = createUTC([2000, 1]).day(i);
	            if (strict && !this._fullWeekdaysParse[i]) {
	                this._fullWeekdaysParse[i] = new RegExp(
	                    '^' + this.weekdays(mom, '').replace('.', '\\.?') + '$',
	                    'i'
	                );
	                this._shortWeekdaysParse[i] = new RegExp(
	                    '^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$',
	                    'i'
	                );
	                this._minWeekdaysParse[i] = new RegExp(
	                    '^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$',
	                    'i'
	                );
	            }
	            if (!this._weekdaysParse[i]) {
	                regex =
	                    '^' +
	                    this.weekdays(mom, '') +
	                    '|^' +
	                    this.weekdaysShort(mom, '') +
	                    '|^' +
	                    this.weekdaysMin(mom, '');
	                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
	            }
	            // test the regex
	            if (
	                strict &&
	                format === 'dddd' &&
	                this._fullWeekdaysParse[i].test(weekdayName)
	            ) {
	                return i;
	            } else if (
	                strict &&
	                format === 'ddd' &&
	                this._shortWeekdaysParse[i].test(weekdayName)
	            ) {
	                return i;
	            } else if (
	                strict &&
	                format === 'dd' &&
	                this._minWeekdaysParse[i].test(weekdayName)
	            ) {
	                return i;
	            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
	                return i;
	            }
	        }
	    }

	    // MOMENTS

	    function getSetDayOfWeek(input) {
	        if (!this.isValid()) {
	            return input != null ? this : NaN;
	        }
	        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
	        if (input != null) {
	            input = parseWeekday(input, this.localeData());
	            return this.add(input - day, 'd');
	        } else {
	            return day;
	        }
	    }

	    function getSetLocaleDayOfWeek(input) {
	        if (!this.isValid()) {
	            return input != null ? this : NaN;
	        }
	        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
	        return input == null ? weekday : this.add(input - weekday, 'd');
	    }

	    function getSetISODayOfWeek(input) {
	        if (!this.isValid()) {
	            return input != null ? this : NaN;
	        }

	        // behaves the same as moment#day except
	        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
	        // as a setter, sunday should belong to the previous week.

	        if (input != null) {
	            var weekday = parseIsoWeekday(input, this.localeData());
	            return this.day(this.day() % 7 ? weekday : weekday - 7);
	        } else {
	            return this.day() || 7;
	        }
	    }

	    function weekdaysRegex(isStrict) {
	        if (this._weekdaysParseExact) {
	            if (!hasOwnProp(this, '_weekdaysRegex')) {
	                computeWeekdaysParse.call(this);
	            }
	            if (isStrict) {
	                return this._weekdaysStrictRegex;
	            } else {
	                return this._weekdaysRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_weekdaysRegex')) {
	                this._weekdaysRegex = defaultWeekdaysRegex;
	            }
	            return this._weekdaysStrictRegex && isStrict
	                ? this._weekdaysStrictRegex
	                : this._weekdaysRegex;
	        }
	    }

	    function weekdaysShortRegex(isStrict) {
	        if (this._weekdaysParseExact) {
	            if (!hasOwnProp(this, '_weekdaysRegex')) {
	                computeWeekdaysParse.call(this);
	            }
	            if (isStrict) {
	                return this._weekdaysShortStrictRegex;
	            } else {
	                return this._weekdaysShortRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
	                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
	            }
	            return this._weekdaysShortStrictRegex && isStrict
	                ? this._weekdaysShortStrictRegex
	                : this._weekdaysShortRegex;
	        }
	    }

	    function weekdaysMinRegex(isStrict) {
	        if (this._weekdaysParseExact) {
	            if (!hasOwnProp(this, '_weekdaysRegex')) {
	                computeWeekdaysParse.call(this);
	            }
	            if (isStrict) {
	                return this._weekdaysMinStrictRegex;
	            } else {
	                return this._weekdaysMinRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
	                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
	            }
	            return this._weekdaysMinStrictRegex && isStrict
	                ? this._weekdaysMinStrictRegex
	                : this._weekdaysMinRegex;
	        }
	    }

	    function computeWeekdaysParse() {
	        function cmpLenRev(a, b) {
	            return b.length - a.length;
	        }

	        var minPieces = [],
	            shortPieces = [],
	            longPieces = [],
	            mixedPieces = [],
	            i,
	            mom,
	            minp,
	            shortp,
	            longp;
	        for (i = 0; i < 7; i++) {
	            // make the regex if we don't have it already
	            mom = createUTC([2000, 1]).day(i);
	            minp = regexEscape(this.weekdaysMin(mom, ''));
	            shortp = regexEscape(this.weekdaysShort(mom, ''));
	            longp = regexEscape(this.weekdays(mom, ''));
	            minPieces.push(minp);
	            shortPieces.push(shortp);
	            longPieces.push(longp);
	            mixedPieces.push(minp);
	            mixedPieces.push(shortp);
	            mixedPieces.push(longp);
	        }
	        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
	        // will match the longer piece.
	        minPieces.sort(cmpLenRev);
	        shortPieces.sort(cmpLenRev);
	        longPieces.sort(cmpLenRev);
	        mixedPieces.sort(cmpLenRev);

	        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
	        this._weekdaysShortRegex = this._weekdaysRegex;
	        this._weekdaysMinRegex = this._weekdaysRegex;

	        this._weekdaysStrictRegex = new RegExp(
	            '^(' + longPieces.join('|') + ')',
	            'i'
	        );
	        this._weekdaysShortStrictRegex = new RegExp(
	            '^(' + shortPieces.join('|') + ')',
	            'i'
	        );
	        this._weekdaysMinStrictRegex = new RegExp(
	            '^(' + minPieces.join('|') + ')',
	            'i'
	        );
	    }

	    // FORMATTING

	    function hFormat() {
	        return this.hours() % 12 || 12;
	    }

	    function kFormat() {
	        return this.hours() || 24;
	    }

	    addFormatToken('H', ['HH', 2], 0, 'hour');
	    addFormatToken('h', ['hh', 2], 0, hFormat);
	    addFormatToken('k', ['kk', 2], 0, kFormat);

	    addFormatToken('hmm', 0, 0, function () {
	        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
	    });

	    addFormatToken('hmmss', 0, 0, function () {
	        return (
	            '' +
	            hFormat.apply(this) +
	            zeroFill(this.minutes(), 2) +
	            zeroFill(this.seconds(), 2)
	        );
	    });

	    addFormatToken('Hmm', 0, 0, function () {
	        return '' + this.hours() + zeroFill(this.minutes(), 2);
	    });

	    addFormatToken('Hmmss', 0, 0, function () {
	        return (
	            '' +
	            this.hours() +
	            zeroFill(this.minutes(), 2) +
	            zeroFill(this.seconds(), 2)
	        );
	    });

	    function meridiem(token, lowercase) {
	        addFormatToken(token, 0, 0, function () {
	            return this.localeData().meridiem(
	                this.hours(),
	                this.minutes(),
	                lowercase
	            );
	        });
	    }

	    meridiem('a', true);
	    meridiem('A', false);

	    // ALIASES

	    addUnitAlias('hour', 'h');

	    // PRIORITY
	    addUnitPriority('hour', 13);

	    // PARSING

	    function matchMeridiem(isStrict, locale) {
	        return locale._meridiemParse;
	    }

	    addRegexToken('a', matchMeridiem);
	    addRegexToken('A', matchMeridiem);
	    addRegexToken('H', match1to2);
	    addRegexToken('h', match1to2);
	    addRegexToken('k', match1to2);
	    addRegexToken('HH', match1to2, match2);
	    addRegexToken('hh', match1to2, match2);
	    addRegexToken('kk', match1to2, match2);

	    addRegexToken('hmm', match3to4);
	    addRegexToken('hmmss', match5to6);
	    addRegexToken('Hmm', match3to4);
	    addRegexToken('Hmmss', match5to6);

	    addParseToken(['H', 'HH'], HOUR);
	    addParseToken(['k', 'kk'], function (input, array, config) {
	        var kInput = toInt(input);
	        array[HOUR] = kInput === 24 ? 0 : kInput;
	    });
	    addParseToken(['a', 'A'], function (input, array, config) {
	        config._isPm = config._locale.isPM(input);
	        config._meridiem = input;
	    });
	    addParseToken(['h', 'hh'], function (input, array, config) {
	        array[HOUR] = toInt(input);
	        getParsingFlags(config).bigHour = true;
	    });
	    addParseToken('hmm', function (input, array, config) {
	        var pos = input.length - 2;
	        array[HOUR] = toInt(input.substr(0, pos));
	        array[MINUTE] = toInt(input.substr(pos));
	        getParsingFlags(config).bigHour = true;
	    });
	    addParseToken('hmmss', function (input, array, config) {
	        var pos1 = input.length - 4,
	            pos2 = input.length - 2;
	        array[HOUR] = toInt(input.substr(0, pos1));
	        array[MINUTE] = toInt(input.substr(pos1, 2));
	        array[SECOND] = toInt(input.substr(pos2));
	        getParsingFlags(config).bigHour = true;
	    });
	    addParseToken('Hmm', function (input, array, config) {
	        var pos = input.length - 2;
	        array[HOUR] = toInt(input.substr(0, pos));
	        array[MINUTE] = toInt(input.substr(pos));
	    });
	    addParseToken('Hmmss', function (input, array, config) {
	        var pos1 = input.length - 4,
	            pos2 = input.length - 2;
	        array[HOUR] = toInt(input.substr(0, pos1));
	        array[MINUTE] = toInt(input.substr(pos1, 2));
	        array[SECOND] = toInt(input.substr(pos2));
	    });

	    // LOCALES

	    function localeIsPM(input) {
	        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
	        // Using charAt should be more compatible.
	        return (input + '').toLowerCase().charAt(0) === 'p';
	    }

	    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
	        // Setting the hour should keep the time, because the user explicitly
	        // specified which hour they want. So trying to maintain the same hour (in
	        // a new timezone) makes sense. Adding/subtracting hours does not follow
	        // this rule.
	        getSetHour = makeGetSet('Hours', true);

	    function localeMeridiem(hours, minutes, isLower) {
	        if (hours > 11) {
	            return isLower ? 'pm' : 'PM';
	        } else {
	            return isLower ? 'am' : 'AM';
	        }
	    }

	    var baseConfig = {
	        calendar: defaultCalendar,
	        longDateFormat: defaultLongDateFormat,
	        invalidDate: defaultInvalidDate,
	        ordinal: defaultOrdinal,
	        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
	        relativeTime: defaultRelativeTime,

	        months: defaultLocaleMonths,
	        monthsShort: defaultLocaleMonthsShort,

	        week: defaultLocaleWeek,

	        weekdays: defaultLocaleWeekdays,
	        weekdaysMin: defaultLocaleWeekdaysMin,
	        weekdaysShort: defaultLocaleWeekdaysShort,

	        meridiemParse: defaultLocaleMeridiemParse,
	    };

	    // internal storage for locale config files
	    var locales = {},
	        localeFamilies = {},
	        globalLocale;

	    function commonPrefix(arr1, arr2) {
	        var i,
	            minl = Math.min(arr1.length, arr2.length);
	        for (i = 0; i < minl; i += 1) {
	            if (arr1[i] !== arr2[i]) {
	                return i;
	            }
	        }
	        return minl;
	    }

	    function normalizeLocale(key) {
	        return key ? key.toLowerCase().replace('_', '-') : key;
	    }

	    // pick the locale from the array
	    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
	    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
	    function chooseLocale(names) {
	        var i = 0,
	            j,
	            next,
	            locale,
	            split;

	        while (i < names.length) {
	            split = normalizeLocale(names[i]).split('-');
	            j = split.length;
	            next = normalizeLocale(names[i + 1]);
	            next = next ? next.split('-') : null;
	            while (j > 0) {
	                locale = loadLocale(split.slice(0, j).join('-'));
	                if (locale) {
	                    return locale;
	                }
	                if (
	                    next &&
	                    next.length >= j &&
	                    commonPrefix(split, next) >= j - 1
	                ) {
	                    //the next array item is better than a shallower substring of this one
	                    break;
	                }
	                j--;
	            }
	            i++;
	        }
	        return globalLocale;
	    }

	    function isLocaleNameSane(name) {
	        // Prevent names that look like filesystem paths, i.e contain '/' or '\'
	        return name.match('^[^/\\\\]*$') != null;
	    }

	    function loadLocale(name) {
	        var oldLocale = null,
	            aliasedRequire;
	        // TODO: Find a better way to register and load all the locales in Node
	        if (
	            locales[name] === undefined &&
	            'object' !== 'undefined' &&
	            module &&
	            module.exports &&
	            isLocaleNameSane(name)
	        ) {
	            try {
	                oldLocale = globalLocale._abbr;
	                aliasedRequire = commonjsRequire;
	                aliasedRequire('./locale/' + name);
	                getSetGlobalLocale(oldLocale);
	            } catch (e) {
	                // mark as not found to avoid repeating expensive file require call causing high CPU
	                // when trying to find en-US, en_US, en-us for every format call
	                locales[name] = null; // null means not found
	            }
	        }
	        return locales[name];
	    }

	    // This function will load locale and then set the global locale.  If
	    // no arguments are passed in, it will simply return the current global
	    // locale key.
	    function getSetGlobalLocale(key, values) {
	        var data;
	        if (key) {
	            if (isUndefined(values)) {
	                data = getLocale(key);
	            } else {
	                data = defineLocale(key, values);
	            }

	            if (data) {
	                // moment.duration._locale = moment._locale = data;
	                globalLocale = data;
	            } else {
	                if (typeof console !== 'undefined' && console.warn) {
	                    //warn user if arguments are passed but the locale could not be set
	                    console.warn(
	                        'Locale ' + key + ' not found. Did you forget to load it?'
	                    );
	                }
	            }
	        }

	        return globalLocale._abbr;
	    }

	    function defineLocale(name, config) {
	        if (config !== null) {
	            var locale,
	                parentConfig = baseConfig;
	            config.abbr = name;
	            if (locales[name] != null) {
	                deprecateSimple(
	                    'defineLocaleOverride',
	                    'use moment.updateLocale(localeName, config) to change ' +
	                        'an existing locale. moment.defineLocale(localeName, ' +
	                        'config) should only be used for creating a new locale ' +
	                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
	                );
	                parentConfig = locales[name]._config;
	            } else if (config.parentLocale != null) {
	                if (locales[config.parentLocale] != null) {
	                    parentConfig = locales[config.parentLocale]._config;
	                } else {
	                    locale = loadLocale(config.parentLocale);
	                    if (locale != null) {
	                        parentConfig = locale._config;
	                    } else {
	                        if (!localeFamilies[config.parentLocale]) {
	                            localeFamilies[config.parentLocale] = [];
	                        }
	                        localeFamilies[config.parentLocale].push({
	                            name: name,
	                            config: config,
	                        });
	                        return null;
	                    }
	                }
	            }
	            locales[name] = new Locale(mergeConfigs(parentConfig, config));

	            if (localeFamilies[name]) {
	                localeFamilies[name].forEach(function (x) {
	                    defineLocale(x.name, x.config);
	                });
	            }

	            // backwards compat for now: also set the locale
	            // make sure we set the locale AFTER all child locales have been
	            // created, so we won't end up with the child locale set.
	            getSetGlobalLocale(name);

	            return locales[name];
	        } else {
	            // useful for testing
	            delete locales[name];
	            return null;
	        }
	    }

	    function updateLocale(name, config) {
	        if (config != null) {
	            var locale,
	                tmpLocale,
	                parentConfig = baseConfig;

	            if (locales[name] != null && locales[name].parentLocale != null) {
	                // Update existing child locale in-place to avoid memory-leaks
	                locales[name].set(mergeConfigs(locales[name]._config, config));
	            } else {
	                // MERGE
	                tmpLocale = loadLocale(name);
	                if (tmpLocale != null) {
	                    parentConfig = tmpLocale._config;
	                }
	                config = mergeConfigs(parentConfig, config);
	                if (tmpLocale == null) {
	                    // updateLocale is called for creating a new locale
	                    // Set abbr so it will have a name (getters return
	                    // undefined otherwise).
	                    config.abbr = name;
	                }
	                locale = new Locale(config);
	                locale.parentLocale = locales[name];
	                locales[name] = locale;
	            }

	            // backwards compat for now: also set the locale
	            getSetGlobalLocale(name);
	        } else {
	            // pass null for config to unupdate, useful for tests
	            if (locales[name] != null) {
	                if (locales[name].parentLocale != null) {
	                    locales[name] = locales[name].parentLocale;
	                    if (name === getSetGlobalLocale()) {
	                        getSetGlobalLocale(name);
	                    }
	                } else if (locales[name] != null) {
	                    delete locales[name];
	                }
	            }
	        }
	        return locales[name];
	    }

	    // returns locale data
	    function getLocale(key) {
	        var locale;

	        if (key && key._locale && key._locale._abbr) {
	            key = key._locale._abbr;
	        }

	        if (!key) {
	            return globalLocale;
	        }

	        if (!isArray(key)) {
	            //short-circuit everything else
	            locale = loadLocale(key);
	            if (locale) {
	                return locale;
	            }
	            key = [key];
	        }

	        return chooseLocale(key);
	    }

	    function listLocales() {
	        return keys(locales);
	    }

	    function checkOverflow(m) {
	        var overflow,
	            a = m._a;

	        if (a && getParsingFlags(m).overflow === -2) {
	            overflow =
	                a[MONTH] < 0 || a[MONTH] > 11
	                    ? MONTH
	                    : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH])
	                    ? DATE
	                    : a[HOUR] < 0 ||
	                      a[HOUR] > 24 ||
	                      (a[HOUR] === 24 &&
	                          (a[MINUTE] !== 0 ||
	                              a[SECOND] !== 0 ||
	                              a[MILLISECOND] !== 0))
	                    ? HOUR
	                    : a[MINUTE] < 0 || a[MINUTE] > 59
	                    ? MINUTE
	                    : a[SECOND] < 0 || a[SECOND] > 59
	                    ? SECOND
	                    : a[MILLISECOND] < 0 || a[MILLISECOND] > 999
	                    ? MILLISECOND
	                    : -1;

	            if (
	                getParsingFlags(m)._overflowDayOfYear &&
	                (overflow < YEAR || overflow > DATE)
	            ) {
	                overflow = DATE;
	            }
	            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
	                overflow = WEEK;
	            }
	            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
	                overflow = WEEKDAY;
	            }

	            getParsingFlags(m).overflow = overflow;
	        }

	        return m;
	    }

	    // iso 8601 regex
	    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
	    var extendedIsoRegex =
	            /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
	        basicIsoRegex =
	            /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
	        tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
	        isoDates = [
	            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
	            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
	            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
	            ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
	            ['YYYY-DDD', /\d{4}-\d{3}/],
	            ['YYYY-MM', /\d{4}-\d\d/, false],
	            ['YYYYYYMMDD', /[+-]\d{10}/],
	            ['YYYYMMDD', /\d{8}/],
	            ['GGGG[W]WWE', /\d{4}W\d{3}/],
	            ['GGGG[W]WW', /\d{4}W\d{2}/, false],
	            ['YYYYDDD', /\d{7}/],
	            ['YYYYMM', /\d{6}/, false],
	            ['YYYY', /\d{4}/, false],
	        ],
	        // iso time formats and regexes
	        isoTimes = [
	            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
	            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
	            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
	            ['HH:mm', /\d\d:\d\d/],
	            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
	            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
	            ['HHmmss', /\d\d\d\d\d\d/],
	            ['HHmm', /\d\d\d\d/],
	            ['HH', /\d\d/],
	        ],
	        aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
	        // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
	        rfc2822 =
	            /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
	        obsOffsets = {
	            UT: 0,
	            GMT: 0,
	            EDT: -4 * 60,
	            EST: -5 * 60,
	            CDT: -5 * 60,
	            CST: -6 * 60,
	            MDT: -6 * 60,
	            MST: -7 * 60,
	            PDT: -7 * 60,
	            PST: -8 * 60,
	        };

	    // date from iso format
	    function configFromISO(config) {
	        var i,
	            l,
	            string = config._i,
	            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
	            allowTime,
	            dateFormat,
	            timeFormat,
	            tzFormat,
	            isoDatesLen = isoDates.length,
	            isoTimesLen = isoTimes.length;

	        if (match) {
	            getParsingFlags(config).iso = true;
	            for (i = 0, l = isoDatesLen; i < l; i++) {
	                if (isoDates[i][1].exec(match[1])) {
	                    dateFormat = isoDates[i][0];
	                    allowTime = isoDates[i][2] !== false;
	                    break;
	                }
	            }
	            if (dateFormat == null) {
	                config._isValid = false;
	                return;
	            }
	            if (match[3]) {
	                for (i = 0, l = isoTimesLen; i < l; i++) {
	                    if (isoTimes[i][1].exec(match[3])) {
	                        // match[2] should be 'T' or space
	                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
	                        break;
	                    }
	                }
	                if (timeFormat == null) {
	                    config._isValid = false;
	                    return;
	                }
	            }
	            if (!allowTime && timeFormat != null) {
	                config._isValid = false;
	                return;
	            }
	            if (match[4]) {
	                if (tzRegex.exec(match[4])) {
	                    tzFormat = 'Z';
	                } else {
	                    config._isValid = false;
	                    return;
	                }
	            }
	            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
	            configFromStringAndFormat(config);
	        } else {
	            config._isValid = false;
	        }
	    }

	    function extractFromRFC2822Strings(
	        yearStr,
	        monthStr,
	        dayStr,
	        hourStr,
	        minuteStr,
	        secondStr
	    ) {
	        var result = [
	            untruncateYear(yearStr),
	            defaultLocaleMonthsShort.indexOf(monthStr),
	            parseInt(dayStr, 10),
	            parseInt(hourStr, 10),
	            parseInt(minuteStr, 10),
	        ];

	        if (secondStr) {
	            result.push(parseInt(secondStr, 10));
	        }

	        return result;
	    }

	    function untruncateYear(yearStr) {
	        var year = parseInt(yearStr, 10);
	        if (year <= 49) {
	            return 2000 + year;
	        } else if (year <= 999) {
	            return 1900 + year;
	        }
	        return year;
	    }

	    function preprocessRFC2822(s) {
	        // Remove comments and folding whitespace and replace multiple-spaces with a single space
	        return s
	            .replace(/\([^()]*\)|[\n\t]/g, ' ')
	            .replace(/(\s\s+)/g, ' ')
	            .replace(/^\s\s*/, '')
	            .replace(/\s\s*$/, '');
	    }

	    function checkWeekday(weekdayStr, parsedInput, config) {
	        if (weekdayStr) {
	            // TODO: Replace the vanilla JS Date object with an independent day-of-week check.
	            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
	                weekdayActual = new Date(
	                    parsedInput[0],
	                    parsedInput[1],
	                    parsedInput[2]
	                ).getDay();
	            if (weekdayProvided !== weekdayActual) {
	                getParsingFlags(config).weekdayMismatch = true;
	                config._isValid = false;
	                return false;
	            }
	        }
	        return true;
	    }

	    function calculateOffset(obsOffset, militaryOffset, numOffset) {
	        if (obsOffset) {
	            return obsOffsets[obsOffset];
	        } else if (militaryOffset) {
	            // the only allowed military tz is Z
	            return 0;
	        } else {
	            var hm = parseInt(numOffset, 10),
	                m = hm % 100,
	                h = (hm - m) / 100;
	            return h * 60 + m;
	        }
	    }

	    // date and time from ref 2822 format
	    function configFromRFC2822(config) {
	        var match = rfc2822.exec(preprocessRFC2822(config._i)),
	            parsedArray;
	        if (match) {
	            parsedArray = extractFromRFC2822Strings(
	                match[4],
	                match[3],
	                match[2],
	                match[5],
	                match[6],
	                match[7]
	            );
	            if (!checkWeekday(match[1], parsedArray, config)) {
	                return;
	            }

	            config._a = parsedArray;
	            config._tzm = calculateOffset(match[8], match[9], match[10]);

	            config._d = createUTCDate.apply(null, config._a);
	            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

	            getParsingFlags(config).rfc2822 = true;
	        } else {
	            config._isValid = false;
	        }
	    }

	    // date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
	    function configFromString(config) {
	        var matched = aspNetJsonRegex.exec(config._i);
	        if (matched !== null) {
	            config._d = new Date(+matched[1]);
	            return;
	        }

	        configFromISO(config);
	        if (config._isValid === false) {
	            delete config._isValid;
	        } else {
	            return;
	        }

	        configFromRFC2822(config);
	        if (config._isValid === false) {
	            delete config._isValid;
	        } else {
	            return;
	        }

	        if (config._strict) {
	            config._isValid = false;
	        } else {
	            // Final attempt, use Input Fallback
	            hooks.createFromInputFallback(config);
	        }
	    }

	    hooks.createFromInputFallback = deprecate(
	        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
	            'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
	            'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
	        function (config) {
	            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
	        }
	    );

	    // Pick the first defined of two or three arguments.
	    function defaults(a, b, c) {
	        if (a != null) {
	            return a;
	        }
	        if (b != null) {
	            return b;
	        }
	        return c;
	    }

	    function currentDateArray(config) {
	        // hooks is actually the exported moment object
	        var nowValue = new Date(hooks.now());
	        if (config._useUTC) {
	            return [
	                nowValue.getUTCFullYear(),
	                nowValue.getUTCMonth(),
	                nowValue.getUTCDate(),
	            ];
	        }
	        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
	    }

	    // convert an array to a date.
	    // the array should mirror the parameters below
	    // note: all values past the year are optional and will default to the lowest possible value.
	    // [year, month, day , hour, minute, second, millisecond]
	    function configFromArray(config) {
	        var i,
	            date,
	            input = [],
	            currentDate,
	            expectedWeekday,
	            yearToUse;

	        if (config._d) {
	            return;
	        }

	        currentDate = currentDateArray(config);

	        //compute day of the year from weeks and weekdays
	        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
	            dayOfYearFromWeekInfo(config);
	        }

	        //if the day of the year is set, figure out what it is
	        if (config._dayOfYear != null) {
	            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

	            if (
	                config._dayOfYear > daysInYear(yearToUse) ||
	                config._dayOfYear === 0
	            ) {
	                getParsingFlags(config)._overflowDayOfYear = true;
	            }

	            date = createUTCDate(yearToUse, 0, config._dayOfYear);
	            config._a[MONTH] = date.getUTCMonth();
	            config._a[DATE] = date.getUTCDate();
	        }

	        // Default to current date.
	        // * if no year, month, day of month are given, default to today
	        // * if day of month is given, default month and year
	        // * if month is given, default only year
	        // * if year is given, don't default anything
	        for (i = 0; i < 3 && config._a[i] == null; ++i) {
	            config._a[i] = input[i] = currentDate[i];
	        }

	        // Zero out whatever was not defaulted, including time
	        for (; i < 7; i++) {
	            config._a[i] = input[i] =
	                config._a[i] == null ? (i === 2 ? 1 : 0) : config._a[i];
	        }

	        // Check for 24:00:00.000
	        if (
	            config._a[HOUR] === 24 &&
	            config._a[MINUTE] === 0 &&
	            config._a[SECOND] === 0 &&
	            config._a[MILLISECOND] === 0
	        ) {
	            config._nextDay = true;
	            config._a[HOUR] = 0;
	        }

	        config._d = (config._useUTC ? createUTCDate : createDate).apply(
	            null,
	            input
	        );
	        expectedWeekday = config._useUTC
	            ? config._d.getUTCDay()
	            : config._d.getDay();

	        // Apply timezone offset from input. The actual utcOffset can be changed
	        // with parseZone.
	        if (config._tzm != null) {
	            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
	        }

	        if (config._nextDay) {
	            config._a[HOUR] = 24;
	        }

	        // check for mismatching day of week
	        if (
	            config._w &&
	            typeof config._w.d !== 'undefined' &&
	            config._w.d !== expectedWeekday
	        ) {
	            getParsingFlags(config).weekdayMismatch = true;
	        }
	    }

	    function dayOfYearFromWeekInfo(config) {
	        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

	        w = config._w;
	        if (w.GG != null || w.W != null || w.E != null) {
	            dow = 1;
	            doy = 4;

	            // TODO: We need to take the current isoWeekYear, but that depends on
	            // how we interpret now (local, utc, fixed offset). So create
	            // a now version of current config (take local/utc/offset flags, and
	            // create now).
	            weekYear = defaults(
	                w.GG,
	                config._a[YEAR],
	                weekOfYear(createLocal(), 1, 4).year
	            );
	            week = defaults(w.W, 1);
	            weekday = defaults(w.E, 1);
	            if (weekday < 1 || weekday > 7) {
	                weekdayOverflow = true;
	            }
	        } else {
	            dow = config._locale._week.dow;
	            doy = config._locale._week.doy;

	            curWeek = weekOfYear(createLocal(), dow, doy);

	            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

	            // Default to current week.
	            week = defaults(w.w, curWeek.week);

	            if (w.d != null) {
	                // weekday -- low day numbers are considered next week
	                weekday = w.d;
	                if (weekday < 0 || weekday > 6) {
	                    weekdayOverflow = true;
	                }
	            } else if (w.e != null) {
	                // local weekday -- counting starts from beginning of week
	                weekday = w.e + dow;
	                if (w.e < 0 || w.e > 6) {
	                    weekdayOverflow = true;
	                }
	            } else {
	                // default to beginning of week
	                weekday = dow;
	            }
	        }
	        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
	            getParsingFlags(config)._overflowWeeks = true;
	        } else if (weekdayOverflow != null) {
	            getParsingFlags(config)._overflowWeekday = true;
	        } else {
	            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
	            config._a[YEAR] = temp.year;
	            config._dayOfYear = temp.dayOfYear;
	        }
	    }

	    // constant that refers to the ISO standard
	    hooks.ISO_8601 = function () {};

	    // constant that refers to the RFC 2822 form
	    hooks.RFC_2822 = function () {};

	    // date from string and format string
	    function configFromStringAndFormat(config) {
	        // TODO: Move this to another part of the creation flow to prevent circular deps
	        if (config._f === hooks.ISO_8601) {
	            configFromISO(config);
	            return;
	        }
	        if (config._f === hooks.RFC_2822) {
	            configFromRFC2822(config);
	            return;
	        }
	        config._a = [];
	        getParsingFlags(config).empty = true;

	        // This array is used to make a Date, either with `new Date` or `Date.UTC`
	        var string = '' + config._i,
	            i,
	            parsedInput,
	            tokens,
	            token,
	            skipped,
	            stringLength = string.length,
	            totalParsedInputLength = 0,
	            era,
	            tokenLen;

	        tokens =
	            expandFormat(config._f, config._locale).match(formattingTokens) || [];
	        tokenLen = tokens.length;
	        for (i = 0; i < tokenLen; i++) {
	            token = tokens[i];
	            parsedInput = (string.match(getParseRegexForToken(token, config)) ||
	                [])[0];
	            if (parsedInput) {
	                skipped = string.substr(0, string.indexOf(parsedInput));
	                if (skipped.length > 0) {
	                    getParsingFlags(config).unusedInput.push(skipped);
	                }
	                string = string.slice(
	                    string.indexOf(parsedInput) + parsedInput.length
	                );
	                totalParsedInputLength += parsedInput.length;
	            }
	            // don't parse if it's not a known token
	            if (formatTokenFunctions[token]) {
	                if (parsedInput) {
	                    getParsingFlags(config).empty = false;
	                } else {
	                    getParsingFlags(config).unusedTokens.push(token);
	                }
	                addTimeToArrayFromToken(token, parsedInput, config);
	            } else if (config._strict && !parsedInput) {
	                getParsingFlags(config).unusedTokens.push(token);
	            }
	        }

	        // add remaining unparsed input length to the string
	        getParsingFlags(config).charsLeftOver =
	            stringLength - totalParsedInputLength;
	        if (string.length > 0) {
	            getParsingFlags(config).unusedInput.push(string);
	        }

	        // clear _12h flag if hour is <= 12
	        if (
	            config._a[HOUR] <= 12 &&
	            getParsingFlags(config).bigHour === true &&
	            config._a[HOUR] > 0
	        ) {
	            getParsingFlags(config).bigHour = undefined;
	        }

	        getParsingFlags(config).parsedDateParts = config._a.slice(0);
	        getParsingFlags(config).meridiem = config._meridiem;
	        // handle meridiem
	        config._a[HOUR] = meridiemFixWrap(
	            config._locale,
	            config._a[HOUR],
	            config._meridiem
	        );

	        // handle era
	        era = getParsingFlags(config).era;
	        if (era !== null) {
	            config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
	        }

	        configFromArray(config);
	        checkOverflow(config);
	    }

	    function meridiemFixWrap(locale, hour, meridiem) {
	        var isPm;

	        if (meridiem == null) {
	            // nothing to do
	            return hour;
	        }
	        if (locale.meridiemHour != null) {
	            return locale.meridiemHour(hour, meridiem);
	        } else if (locale.isPM != null) {
	            // Fallback
	            isPm = locale.isPM(meridiem);
	            if (isPm && hour < 12) {
	                hour += 12;
	            }
	            if (!isPm && hour === 12) {
	                hour = 0;
	            }
	            return hour;
	        } else {
	            // this is not supposed to happen
	            return hour;
	        }
	    }

	    // date from string and array of format strings
	    function configFromStringAndArray(config) {
	        var tempConfig,
	            bestMoment,
	            scoreToBeat,
	            i,
	            currentScore,
	            validFormatFound,
	            bestFormatIsValid = false,
	            configfLen = config._f.length;

	        if (configfLen === 0) {
	            getParsingFlags(config).invalidFormat = true;
	            config._d = new Date(NaN);
	            return;
	        }

	        for (i = 0; i < configfLen; i++) {
	            currentScore = 0;
	            validFormatFound = false;
	            tempConfig = copyConfig({}, config);
	            if (config._useUTC != null) {
	                tempConfig._useUTC = config._useUTC;
	            }
	            tempConfig._f = config._f[i];
	            configFromStringAndFormat(tempConfig);

	            if (isValid(tempConfig)) {
	                validFormatFound = true;
	            }

	            // if there is any input that was not parsed add a penalty for that format
	            currentScore += getParsingFlags(tempConfig).charsLeftOver;

	            //or tokens
	            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

	            getParsingFlags(tempConfig).score = currentScore;

	            if (!bestFormatIsValid) {
	                if (
	                    scoreToBeat == null ||
	                    currentScore < scoreToBeat ||
	                    validFormatFound
	                ) {
	                    scoreToBeat = currentScore;
	                    bestMoment = tempConfig;
	                    if (validFormatFound) {
	                        bestFormatIsValid = true;
	                    }
	                }
	            } else {
	                if (currentScore < scoreToBeat) {
	                    scoreToBeat = currentScore;
	                    bestMoment = tempConfig;
	                }
	            }
	        }

	        extend(config, bestMoment || tempConfig);
	    }

	    function configFromObject(config) {
	        if (config._d) {
	            return;
	        }

	        var i = normalizeObjectUnits(config._i),
	            dayOrDate = i.day === undefined ? i.date : i.day;
	        config._a = map(
	            [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
	            function (obj) {
	                return obj && parseInt(obj, 10);
	            }
	        );

	        configFromArray(config);
	    }

	    function createFromConfig(config) {
	        var res = new Moment(checkOverflow(prepareConfig(config)));
	        if (res._nextDay) {
	            // Adding is smart enough around DST
	            res.add(1, 'd');
	            res._nextDay = undefined;
	        }

	        return res;
	    }

	    function prepareConfig(config) {
	        var input = config._i,
	            format = config._f;

	        config._locale = config._locale || getLocale(config._l);

	        if (input === null || (format === undefined && input === '')) {
	            return createInvalid({ nullInput: true });
	        }

	        if (typeof input === 'string') {
	            config._i = input = config._locale.preparse(input);
	        }

	        if (isMoment(input)) {
	            return new Moment(checkOverflow(input));
	        } else if (isDate(input)) {
	            config._d = input;
	        } else if (isArray(format)) {
	            configFromStringAndArray(config);
	        } else if (format) {
	            configFromStringAndFormat(config);
	        } else {
	            configFromInput(config);
	        }

	        if (!isValid(config)) {
	            config._d = null;
	        }

	        return config;
	    }

	    function configFromInput(config) {
	        var input = config._i;
	        if (isUndefined(input)) {
	            config._d = new Date(hooks.now());
	        } else if (isDate(input)) {
	            config._d = new Date(input.valueOf());
	        } else if (typeof input === 'string') {
	            configFromString(config);
	        } else if (isArray(input)) {
	            config._a = map(input.slice(0), function (obj) {
	                return parseInt(obj, 10);
	            });
	            configFromArray(config);
	        } else if (isObject(input)) {
	            configFromObject(config);
	        } else if (isNumber(input)) {
	            // from milliseconds
	            config._d = new Date(input);
	        } else {
	            hooks.createFromInputFallback(config);
	        }
	    }

	    function createLocalOrUTC(input, format, locale, strict, isUTC) {
	        var c = {};

	        if (format === true || format === false) {
	            strict = format;
	            format = undefined;
	        }

	        if (locale === true || locale === false) {
	            strict = locale;
	            locale = undefined;
	        }

	        if (
	            (isObject(input) && isObjectEmpty(input)) ||
	            (isArray(input) && input.length === 0)
	        ) {
	            input = undefined;
	        }
	        // object construction must be done this way.
	        // https://github.com/moment/moment/issues/1423
	        c._isAMomentObject = true;
	        c._useUTC = c._isUTC = isUTC;
	        c._l = locale;
	        c._i = input;
	        c._f = format;
	        c._strict = strict;

	        return createFromConfig(c);
	    }

	    function createLocal(input, format, locale, strict) {
	        return createLocalOrUTC(input, format, locale, strict, false);
	    }

	    var prototypeMin = deprecate(
	            'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
	            function () {
	                var other = createLocal.apply(null, arguments);
	                if (this.isValid() && other.isValid()) {
	                    return other < this ? this : other;
	                } else {
	                    return createInvalid();
	                }
	            }
	        ),
	        prototypeMax = deprecate(
	            'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
	            function () {
	                var other = createLocal.apply(null, arguments);
	                if (this.isValid() && other.isValid()) {
	                    return other > this ? this : other;
	                } else {
	                    return createInvalid();
	                }
	            }
	        );

	    // Pick a moment m from moments so that m[fn](other) is true for all
	    // other. This relies on the function fn to be transitive.
	    //
	    // moments should either be an array of moment objects or an array, whose
	    // first element is an array of moment objects.
	    function pickBy(fn, moments) {
	        var res, i;
	        if (moments.length === 1 && isArray(moments[0])) {
	            moments = moments[0];
	        }
	        if (!moments.length) {
	            return createLocal();
	        }
	        res = moments[0];
	        for (i = 1; i < moments.length; ++i) {
	            if (!moments[i].isValid() || moments[i][fn](res)) {
	                res = moments[i];
	            }
	        }
	        return res;
	    }

	    // TODO: Use [].sort instead?
	    function min() {
	        var args = [].slice.call(arguments, 0);

	        return pickBy('isBefore', args);
	    }

	    function max() {
	        var args = [].slice.call(arguments, 0);

	        return pickBy('isAfter', args);
	    }

	    var now = function () {
	        return Date.now ? Date.now() : +new Date();
	    };

	    var ordering = [
	        'year',
	        'quarter',
	        'month',
	        'week',
	        'day',
	        'hour',
	        'minute',
	        'second',
	        'millisecond',
	    ];

	    function isDurationValid(m) {
	        var key,
	            unitHasDecimal = false,
	            i,
	            orderLen = ordering.length;
	        for (key in m) {
	            if (
	                hasOwnProp(m, key) &&
	                !(
	                    indexOf.call(ordering, key) !== -1 &&
	                    (m[key] == null || !isNaN(m[key]))
	                )
	            ) {
	                return false;
	            }
	        }

	        for (i = 0; i < orderLen; ++i) {
	            if (m[ordering[i]]) {
	                if (unitHasDecimal) {
	                    return false; // only allow non-integers for smallest unit
	                }
	                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
	                    unitHasDecimal = true;
	                }
	            }
	        }

	        return true;
	    }

	    function isValid$1() {
	        return this._isValid;
	    }

	    function createInvalid$1() {
	        return createDuration(NaN);
	    }

	    function Duration(duration) {
	        var normalizedInput = normalizeObjectUnits(duration),
	            years = normalizedInput.year || 0,
	            quarters = normalizedInput.quarter || 0,
	            months = normalizedInput.month || 0,
	            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
	            days = normalizedInput.day || 0,
	            hours = normalizedInput.hour || 0,
	            minutes = normalizedInput.minute || 0,
	            seconds = normalizedInput.second || 0,
	            milliseconds = normalizedInput.millisecond || 0;

	        this._isValid = isDurationValid(normalizedInput);

	        // representation for dateAddRemove
	        this._milliseconds =
	            +milliseconds +
	            seconds * 1e3 + // 1000
	            minutes * 6e4 + // 1000 * 60
	            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
	        // Because of dateAddRemove treats 24 hours as different from a
	        // day when working around DST, we need to store them separately
	        this._days = +days + weeks * 7;
	        // It is impossible to translate months into days without knowing
	        // which months you are are talking about, so we have to store
	        // it separately.
	        this._months = +months + quarters * 3 + years * 12;

	        this._data = {};

	        this._locale = getLocale();

	        this._bubble();
	    }

	    function isDuration(obj) {
	        return obj instanceof Duration;
	    }

	    function absRound(number) {
	        if (number < 0) {
	            return Math.round(-1 * number) * -1;
	        } else {
	            return Math.round(number);
	        }
	    }

	    // compare two arrays, return the number of differences
	    function compareArrays(array1, array2, dontConvert) {
	        var len = Math.min(array1.length, array2.length),
	            lengthDiff = Math.abs(array1.length - array2.length),
	            diffs = 0,
	            i;
	        for (i = 0; i < len; i++) {
	            if (
	                (dontConvert && array1[i] !== array2[i]) ||
	                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))
	            ) {
	                diffs++;
	            }
	        }
	        return diffs + lengthDiff;
	    }

	    // FORMATTING

	    function offset(token, separator) {
	        addFormatToken(token, 0, 0, function () {
	            var offset = this.utcOffset(),
	                sign = '+';
	            if (offset < 0) {
	                offset = -offset;
	                sign = '-';
	            }
	            return (
	                sign +
	                zeroFill(~~(offset / 60), 2) +
	                separator +
	                zeroFill(~~offset % 60, 2)
	            );
	        });
	    }

	    offset('Z', ':');
	    offset('ZZ', '');

	    // PARSING

	    addRegexToken('Z', matchShortOffset);
	    addRegexToken('ZZ', matchShortOffset);
	    addParseToken(['Z', 'ZZ'], function (input, array, config) {
	        config._useUTC = true;
	        config._tzm = offsetFromString(matchShortOffset, input);
	    });

	    // HELPERS

	    // timezone chunker
	    // '+10:00' > ['10',  '00']
	    // '-1530'  > ['-15', '30']
	    var chunkOffset = /([\+\-]|\d\d)/gi;

	    function offsetFromString(matcher, string) {
	        var matches = (string || '').match(matcher),
	            chunk,
	            parts,
	            minutes;

	        if (matches === null) {
	            return null;
	        }

	        chunk = matches[matches.length - 1] || [];
	        parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
	        minutes = +(parts[1] * 60) + toInt(parts[2]);

	        return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
	    }

	    // Return a moment from input, that is local/utc/zone equivalent to model.
	    function cloneWithOffset(input, model) {
	        var res, diff;
	        if (model._isUTC) {
	            res = model.clone();
	            diff =
	                (isMoment(input) || isDate(input)
	                    ? input.valueOf()
	                    : createLocal(input).valueOf()) - res.valueOf();
	            // Use low-level api, because this fn is low-level api.
	            res._d.setTime(res._d.valueOf() + diff);
	            hooks.updateOffset(res, false);
	            return res;
	        } else {
	            return createLocal(input).local();
	        }
	    }

	    function getDateOffset(m) {
	        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
	        // https://github.com/moment/moment/pull/1871
	        return -Math.round(m._d.getTimezoneOffset());
	    }

	    // HOOKS

	    // This function will be called whenever a moment is mutated.
	    // It is intended to keep the offset in sync with the timezone.
	    hooks.updateOffset = function () {};

	    // MOMENTS

	    // keepLocalTime = true means only change the timezone, without
	    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
	    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
	    // +0200, so we adjust the time as needed, to be valid.
	    //
	    // Keeping the time actually adds/subtracts (one hour)
	    // from the actual represented time. That is why we call updateOffset
	    // a second time. In case it wants us to change the offset again
	    // _changeInProgress == true case, then we have to adjust, because
	    // there is no such time in the given timezone.
	    function getSetOffset(input, keepLocalTime, keepMinutes) {
	        var offset = this._offset || 0,
	            localAdjust;
	        if (!this.isValid()) {
	            return input != null ? this : NaN;
	        }
	        if (input != null) {
	            if (typeof input === 'string') {
	                input = offsetFromString(matchShortOffset, input);
	                if (input === null) {
	                    return this;
	                }
	            } else if (Math.abs(input) < 16 && !keepMinutes) {
	                input = input * 60;
	            }
	            if (!this._isUTC && keepLocalTime) {
	                localAdjust = getDateOffset(this);
	            }
	            this._offset = input;
	            this._isUTC = true;
	            if (localAdjust != null) {
	                this.add(localAdjust, 'm');
	            }
	            if (offset !== input) {
	                if (!keepLocalTime || this._changeInProgress) {
	                    addSubtract(
	                        this,
	                        createDuration(input - offset, 'm'),
	                        1,
	                        false
	                    );
	                } else if (!this._changeInProgress) {
	                    this._changeInProgress = true;
	                    hooks.updateOffset(this, true);
	                    this._changeInProgress = null;
	                }
	            }
	            return this;
	        } else {
	            return this._isUTC ? offset : getDateOffset(this);
	        }
	    }

	    function getSetZone(input, keepLocalTime) {
	        if (input != null) {
	            if (typeof input !== 'string') {
	                input = -input;
	            }

	            this.utcOffset(input, keepLocalTime);

	            return this;
	        } else {
	            return -this.utcOffset();
	        }
	    }

	    function setOffsetToUTC(keepLocalTime) {
	        return this.utcOffset(0, keepLocalTime);
	    }

	    function setOffsetToLocal(keepLocalTime) {
	        if (this._isUTC) {
	            this.utcOffset(0, keepLocalTime);
	            this._isUTC = false;

	            if (keepLocalTime) {
	                this.subtract(getDateOffset(this), 'm');
	            }
	        }
	        return this;
	    }

	    function setOffsetToParsedOffset() {
	        if (this._tzm != null) {
	            this.utcOffset(this._tzm, false, true);
	        } else if (typeof this._i === 'string') {
	            var tZone = offsetFromString(matchOffset, this._i);
	            if (tZone != null) {
	                this.utcOffset(tZone);
	            } else {
	                this.utcOffset(0, true);
	            }
	        }
	        return this;
	    }

	    function hasAlignedHourOffset(input) {
	        if (!this.isValid()) {
	            return false;
	        }
	        input = input ? createLocal(input).utcOffset() : 0;

	        return (this.utcOffset() - input) % 60 === 0;
	    }

	    function isDaylightSavingTime() {
	        return (
	            this.utcOffset() > this.clone().month(0).utcOffset() ||
	            this.utcOffset() > this.clone().month(5).utcOffset()
	        );
	    }

	    function isDaylightSavingTimeShifted() {
	        if (!isUndefined(this._isDSTShifted)) {
	            return this._isDSTShifted;
	        }

	        var c = {},
	            other;

	        copyConfig(c, this);
	        c = prepareConfig(c);

	        if (c._a) {
	            other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
	            this._isDSTShifted =
	                this.isValid() && compareArrays(c._a, other.toArray()) > 0;
	        } else {
	            this._isDSTShifted = false;
	        }

	        return this._isDSTShifted;
	    }

	    function isLocal() {
	        return this.isValid() ? !this._isUTC : false;
	    }

	    function isUtcOffset() {
	        return this.isValid() ? this._isUTC : false;
	    }

	    function isUtc() {
	        return this.isValid() ? this._isUTC && this._offset === 0 : false;
	    }

	    // ASP.NET json date format regex
	    var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
	        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
	        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
	        // and further modified to allow for strings containing both week and day
	        isoRegex =
	            /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

	    function createDuration(input, key) {
	        var duration = input,
	            // matching against regexp is expensive, do it on demand
	            match = null,
	            sign,
	            ret,
	            diffRes;

	        if (isDuration(input)) {
	            duration = {
	                ms: input._milliseconds,
	                d: input._days,
	                M: input._months,
	            };
	        } else if (isNumber(input) || !isNaN(+input)) {
	            duration = {};
	            if (key) {
	                duration[key] = +input;
	            } else {
	                duration.milliseconds = +input;
	            }
	        } else if ((match = aspNetRegex.exec(input))) {
	            sign = match[1] === '-' ? -1 : 1;
	            duration = {
	                y: 0,
	                d: toInt(match[DATE]) * sign,
	                h: toInt(match[HOUR]) * sign,
	                m: toInt(match[MINUTE]) * sign,
	                s: toInt(match[SECOND]) * sign,
	                ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
	            };
	        } else if ((match = isoRegex.exec(input))) {
	            sign = match[1] === '-' ? -1 : 1;
	            duration = {
	                y: parseIso(match[2], sign),
	                M: parseIso(match[3], sign),
	                w: parseIso(match[4], sign),
	                d: parseIso(match[5], sign),
	                h: parseIso(match[6], sign),
	                m: parseIso(match[7], sign),
	                s: parseIso(match[8], sign),
	            };
	        } else if (duration == null) {
	            // checks for null or undefined
	            duration = {};
	        } else if (
	            typeof duration === 'object' &&
	            ('from' in duration || 'to' in duration)
	        ) {
	            diffRes = momentsDifference(
	                createLocal(duration.from),
	                createLocal(duration.to)
	            );

	            duration = {};
	            duration.ms = diffRes.milliseconds;
	            duration.M = diffRes.months;
	        }

	        ret = new Duration(duration);

	        if (isDuration(input) && hasOwnProp(input, '_locale')) {
	            ret._locale = input._locale;
	        }

	        if (isDuration(input) && hasOwnProp(input, '_isValid')) {
	            ret._isValid = input._isValid;
	        }

	        return ret;
	    }

	    createDuration.fn = Duration.prototype;
	    createDuration.invalid = createInvalid$1;

	    function parseIso(inp, sign) {
	        // We'd normally use ~~inp for this, but unfortunately it also
	        // converts floats to ints.
	        // inp may be undefined, so careful calling replace on it.
	        var res = inp && parseFloat(inp.replace(',', '.'));
	        // apply sign while we're at it
	        return (isNaN(res) ? 0 : res) * sign;
	    }

	    function positiveMomentsDifference(base, other) {
	        var res = {};

	        res.months =
	            other.month() - base.month() + (other.year() - base.year()) * 12;
	        if (base.clone().add(res.months, 'M').isAfter(other)) {
	            --res.months;
	        }

	        res.milliseconds = +other - +base.clone().add(res.months, 'M');

	        return res;
	    }

	    function momentsDifference(base, other) {
	        var res;
	        if (!(base.isValid() && other.isValid())) {
	            return { milliseconds: 0, months: 0 };
	        }

	        other = cloneWithOffset(other, base);
	        if (base.isBefore(other)) {
	            res = positiveMomentsDifference(base, other);
	        } else {
	            res = positiveMomentsDifference(other, base);
	            res.milliseconds = -res.milliseconds;
	            res.months = -res.months;
	        }

	        return res;
	    }

	    // TODO: remove 'name' arg after deprecation is removed
	    function createAdder(direction, name) {
	        return function (val, period) {
	            var dur, tmp;
	            //invert the arguments, but complain about it
	            if (period !== null && !isNaN(+period)) {
	                deprecateSimple(
	                    name,
	                    'moment().' +
	                        name +
	                        '(period, number) is deprecated. Please use moment().' +
	                        name +
	                        '(number, period). ' +
	                        'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
	                );
	                tmp = val;
	                val = period;
	                period = tmp;
	            }

	            dur = createDuration(val, period);
	            addSubtract(this, dur, direction);
	            return this;
	        };
	    }

	    function addSubtract(mom, duration, isAdding, updateOffset) {
	        var milliseconds = duration._milliseconds,
	            days = absRound(duration._days),
	            months = absRound(duration._months);

	        if (!mom.isValid()) {
	            // No op
	            return;
	        }

	        updateOffset = updateOffset == null ? true : updateOffset;

	        if (months) {
	            setMonth(mom, get(mom, 'Month') + months * isAdding);
	        }
	        if (days) {
	            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
	        }
	        if (milliseconds) {
	            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
	        }
	        if (updateOffset) {
	            hooks.updateOffset(mom, days || months);
	        }
	    }

	    var add = createAdder(1, 'add'),
	        subtract = createAdder(-1, 'subtract');

	    function isString(input) {
	        return typeof input === 'string' || input instanceof String;
	    }

	    // type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
	    function isMomentInput(input) {
	        return (
	            isMoment(input) ||
	            isDate(input) ||
	            isString(input) ||
	            isNumber(input) ||
	            isNumberOrStringArray(input) ||
	            isMomentInputObject(input) ||
	            input === null ||
	            input === undefined
	        );
	    }

	    function isMomentInputObject(input) {
	        var objectTest = isObject(input) && !isObjectEmpty(input),
	            propertyTest = false,
	            properties = [
	                'years',
	                'year',
	                'y',
	                'months',
	                'month',
	                'M',
	                'days',
	                'day',
	                'd',
	                'dates',
	                'date',
	                'D',
	                'hours',
	                'hour',
	                'h',
	                'minutes',
	                'minute',
	                'm',
	                'seconds',
	                'second',
	                's',
	                'milliseconds',
	                'millisecond',
	                'ms',
	            ],
	            i,
	            property,
	            propertyLen = properties.length;

	        for (i = 0; i < propertyLen; i += 1) {
	            property = properties[i];
	            propertyTest = propertyTest || hasOwnProp(input, property);
	        }

	        return objectTest && propertyTest;
	    }

	    function isNumberOrStringArray(input) {
	        var arrayTest = isArray(input),
	            dataTypeTest = false;
	        if (arrayTest) {
	            dataTypeTest =
	                input.filter(function (item) {
	                    return !isNumber(item) && isString(input);
	                }).length === 0;
	        }
	        return arrayTest && dataTypeTest;
	    }

	    function isCalendarSpec(input) {
	        var objectTest = isObject(input) && !isObjectEmpty(input),
	            propertyTest = false,
	            properties = [
	                'sameDay',
	                'nextDay',
	                'lastDay',
	                'nextWeek',
	                'lastWeek',
	                'sameElse',
	            ],
	            i,
	            property;

	        for (i = 0; i < properties.length; i += 1) {
	            property = properties[i];
	            propertyTest = propertyTest || hasOwnProp(input, property);
	        }

	        return objectTest && propertyTest;
	    }

	    function getCalendarFormat(myMoment, now) {
	        var diff = myMoment.diff(now, 'days', true);
	        return diff < -6
	            ? 'sameElse'
	            : diff < -1
	            ? 'lastWeek'
	            : diff < 0
	            ? 'lastDay'
	            : diff < 1
	            ? 'sameDay'
	            : diff < 2
	            ? 'nextDay'
	            : diff < 7
	            ? 'nextWeek'
	            : 'sameElse';
	    }

	    function calendar$1(time, formats) {
	        // Support for single parameter, formats only overload to the calendar function
	        if (arguments.length === 1) {
	            if (!arguments[0]) {
	                time = undefined;
	                formats = undefined;
	            } else if (isMomentInput(arguments[0])) {
	                time = arguments[0];
	                formats = undefined;
	            } else if (isCalendarSpec(arguments[0])) {
	                formats = arguments[0];
	                time = undefined;
	            }
	        }
	        // We want to compare the start of today, vs this.
	        // Getting start-of-today depends on whether we're local/utc/offset or not.
	        var now = time || createLocal(),
	            sod = cloneWithOffset(now, this).startOf('day'),
	            format = hooks.calendarFormat(this, sod) || 'sameElse',
	            output =
	                formats &&
	                (isFunction(formats[format])
	                    ? formats[format].call(this, now)
	                    : formats[format]);

	        return this.format(
	            output || this.localeData().calendar(format, this, createLocal(now))
	        );
	    }

	    function clone() {
	        return new Moment(this);
	    }

	    function isAfter(input, units) {
	        var localInput = isMoment(input) ? input : createLocal(input);
	        if (!(this.isValid() && localInput.isValid())) {
	            return false;
	        }
	        units = normalizeUnits(units) || 'millisecond';
	        if (units === 'millisecond') {
	            return this.valueOf() > localInput.valueOf();
	        } else {
	            return localInput.valueOf() < this.clone().startOf(units).valueOf();
	        }
	    }

	    function isBefore(input, units) {
	        var localInput = isMoment(input) ? input : createLocal(input);
	        if (!(this.isValid() && localInput.isValid())) {
	            return false;
	        }
	        units = normalizeUnits(units) || 'millisecond';
	        if (units === 'millisecond') {
	            return this.valueOf() < localInput.valueOf();
	        } else {
	            return this.clone().endOf(units).valueOf() < localInput.valueOf();
	        }
	    }

	    function isBetween(from, to, units, inclusivity) {
	        var localFrom = isMoment(from) ? from : createLocal(from),
	            localTo = isMoment(to) ? to : createLocal(to);
	        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
	            return false;
	        }
	        inclusivity = inclusivity || '()';
	        return (
	            (inclusivity[0] === '('
	                ? this.isAfter(localFrom, units)
	                : !this.isBefore(localFrom, units)) &&
	            (inclusivity[1] === ')'
	                ? this.isBefore(localTo, units)
	                : !this.isAfter(localTo, units))
	        );
	    }

	    function isSame(input, units) {
	        var localInput = isMoment(input) ? input : createLocal(input),
	            inputMs;
	        if (!(this.isValid() && localInput.isValid())) {
	            return false;
	        }
	        units = normalizeUnits(units) || 'millisecond';
	        if (units === 'millisecond') {
	            return this.valueOf() === localInput.valueOf();
	        } else {
	            inputMs = localInput.valueOf();
	            return (
	                this.clone().startOf(units).valueOf() <= inputMs &&
	                inputMs <= this.clone().endOf(units).valueOf()
	            );
	        }
	    }

	    function isSameOrAfter(input, units) {
	        return this.isSame(input, units) || this.isAfter(input, units);
	    }

	    function isSameOrBefore(input, units) {
	        return this.isSame(input, units) || this.isBefore(input, units);
	    }

	    function diff(input, units, asFloat) {
	        var that, zoneDelta, output;

	        if (!this.isValid()) {
	            return NaN;
	        }

	        that = cloneWithOffset(input, this);

	        if (!that.isValid()) {
	            return NaN;
	        }

	        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

	        units = normalizeUnits(units);

	        switch (units) {
	            case 'year':
	                output = monthDiff(this, that) / 12;
	                break;
	            case 'month':
	                output = monthDiff(this, that);
	                break;
	            case 'quarter':
	                output = monthDiff(this, that) / 3;
	                break;
	            case 'second':
	                output = (this - that) / 1e3;
	                break; // 1000
	            case 'minute':
	                output = (this - that) / 6e4;
	                break; // 1000 * 60
	            case 'hour':
	                output = (this - that) / 36e5;
	                break; // 1000 * 60 * 60
	            case 'day':
	                output = (this - that - zoneDelta) / 864e5;
	                break; // 1000 * 60 * 60 * 24, negate dst
	            case 'week':
	                output = (this - that - zoneDelta) / 6048e5;
	                break; // 1000 * 60 * 60 * 24 * 7, negate dst
	            default:
	                output = this - that;
	        }

	        return asFloat ? output : absFloor(output);
	    }

	    function monthDiff(a, b) {
	        if (a.date() < b.date()) {
	            // end-of-month calculations work correct when the start month has more
	            // days than the end month.
	            return -monthDiff(b, a);
	        }
	        // difference in months
	        var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
	            // b is in (anchor - 1 month, anchor + 1 month)
	            anchor = a.clone().add(wholeMonthDiff, 'months'),
	            anchor2,
	            adjust;

	        if (b - anchor < 0) {
	            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
	            // linear across the month
	            adjust = (b - anchor) / (anchor - anchor2);
	        } else {
	            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
	            // linear across the month
	            adjust = (b - anchor) / (anchor2 - anchor);
	        }

	        //check for negative zero, return zero if negative zero
	        return -(wholeMonthDiff + adjust) || 0;
	    }

	    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
	    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

	    function toString() {
	        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
	    }

	    function toISOString(keepOffset) {
	        if (!this.isValid()) {
	            return null;
	        }
	        var utc = keepOffset !== true,
	            m = utc ? this.clone().utc() : this;
	        if (m.year() < 0 || m.year() > 9999) {
	            return formatMoment(
	                m,
	                utc
	                    ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
	                    : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
	            );
	        }
	        if (isFunction(Date.prototype.toISOString)) {
	            // native implementation is ~50x faster, use it when we can
	            if (utc) {
	                return this.toDate().toISOString();
	            } else {
	                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000)
	                    .toISOString()
	                    .replace('Z', formatMoment(m, 'Z'));
	            }
	        }
	        return formatMoment(
	            m,
	            utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
	        );
	    }

	    /**
	     * Return a human readable representation of a moment that can
	     * also be evaluated to get a new moment which is the same
	     *
	     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
	     */
	    function inspect() {
	        if (!this.isValid()) {
	            return 'moment.invalid(/* ' + this._i + ' */)';
	        }
	        var func = 'moment',
	            zone = '',
	            prefix,
	            year,
	            datetime,
	            suffix;
	        if (!this.isLocal()) {
	            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
	            zone = 'Z';
	        }
	        prefix = '[' + func + '("]';
	        year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
	        datetime = '-MM-DD[T]HH:mm:ss.SSS';
	        suffix = zone + '[")]';

	        return this.format(prefix + year + datetime + suffix);
	    }

	    function format(inputString) {
	        if (!inputString) {
	            inputString = this.isUtc()
	                ? hooks.defaultFormatUtc
	                : hooks.defaultFormat;
	        }
	        var output = formatMoment(this, inputString);
	        return this.localeData().postformat(output);
	    }

	    function from(time, withoutSuffix) {
	        if (
	            this.isValid() &&
	            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
	        ) {
	            return createDuration({ to: this, from: time })
	                .locale(this.locale())
	                .humanize(!withoutSuffix);
	        } else {
	            return this.localeData().invalidDate();
	        }
	    }

	    function fromNow(withoutSuffix) {
	        return this.from(createLocal(), withoutSuffix);
	    }

	    function to(time, withoutSuffix) {
	        if (
	            this.isValid() &&
	            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
	        ) {
	            return createDuration({ from: this, to: time })
	                .locale(this.locale())
	                .humanize(!withoutSuffix);
	        } else {
	            return this.localeData().invalidDate();
	        }
	    }

	    function toNow(withoutSuffix) {
	        return this.to(createLocal(), withoutSuffix);
	    }

	    // If passed a locale key, it will set the locale for this
	    // instance.  Otherwise, it will return the locale configuration
	    // variables for this instance.
	    function locale(key) {
	        var newLocaleData;

	        if (key === undefined) {
	            return this._locale._abbr;
	        } else {
	            newLocaleData = getLocale(key);
	            if (newLocaleData != null) {
	                this._locale = newLocaleData;
	            }
	            return this;
	        }
	    }

	    var lang = deprecate(
	        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
	        function (key) {
	            if (key === undefined) {
	                return this.localeData();
	            } else {
	                return this.locale(key);
	            }
	        }
	    );

	    function localeData() {
	        return this._locale;
	    }

	    var MS_PER_SECOND = 1000,
	        MS_PER_MINUTE = 60 * MS_PER_SECOND,
	        MS_PER_HOUR = 60 * MS_PER_MINUTE,
	        MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

	    // actual modulo - handles negative numbers (for dates before 1970):
	    function mod$1(dividend, divisor) {
	        return ((dividend % divisor) + divisor) % divisor;
	    }

	    function localStartOfDate(y, m, d) {
	        // the date constructor remaps years 0-99 to 1900-1999
	        if (y < 100 && y >= 0) {
	            // preserve leap years using a full 400 year cycle, then reset
	            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
	        } else {
	            return new Date(y, m, d).valueOf();
	        }
	    }

	    function utcStartOfDate(y, m, d) {
	        // Date.UTC remaps years 0-99 to 1900-1999
	        if (y < 100 && y >= 0) {
	            // preserve leap years using a full 400 year cycle, then reset
	            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
	        } else {
	            return Date.UTC(y, m, d);
	        }
	    }

	    function startOf(units) {
	        var time, startOfDate;
	        units = normalizeUnits(units);
	        if (units === undefined || units === 'millisecond' || !this.isValid()) {
	            return this;
	        }

	        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

	        switch (units) {
	            case 'year':
	                time = startOfDate(this.year(), 0, 1);
	                break;
	            case 'quarter':
	                time = startOfDate(
	                    this.year(),
	                    this.month() - (this.month() % 3),
	                    1
	                );
	                break;
	            case 'month':
	                time = startOfDate(this.year(), this.month(), 1);
	                break;
	            case 'week':
	                time = startOfDate(
	                    this.year(),
	                    this.month(),
	                    this.date() - this.weekday()
	                );
	                break;
	            case 'isoWeek':
	                time = startOfDate(
	                    this.year(),
	                    this.month(),
	                    this.date() - (this.isoWeekday() - 1)
	                );
	                break;
	            case 'day':
	            case 'date':
	                time = startOfDate(this.year(), this.month(), this.date());
	                break;
	            case 'hour':
	                time = this._d.valueOf();
	                time -= mod$1(
	                    time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
	                    MS_PER_HOUR
	                );
	                break;
	            case 'minute':
	                time = this._d.valueOf();
	                time -= mod$1(time, MS_PER_MINUTE);
	                break;
	            case 'second':
	                time = this._d.valueOf();
	                time -= mod$1(time, MS_PER_SECOND);
	                break;
	        }

	        this._d.setTime(time);
	        hooks.updateOffset(this, true);
	        return this;
	    }

	    function endOf(units) {
	        var time, startOfDate;
	        units = normalizeUnits(units);
	        if (units === undefined || units === 'millisecond' || !this.isValid()) {
	            return this;
	        }

	        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

	        switch (units) {
	            case 'year':
	                time = startOfDate(this.year() + 1, 0, 1) - 1;
	                break;
	            case 'quarter':
	                time =
	                    startOfDate(
	                        this.year(),
	                        this.month() - (this.month() % 3) + 3,
	                        1
	                    ) - 1;
	                break;
	            case 'month':
	                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
	                break;
	            case 'week':
	                time =
	                    startOfDate(
	                        this.year(),
	                        this.month(),
	                        this.date() - this.weekday() + 7
	                    ) - 1;
	                break;
	            case 'isoWeek':
	                time =
	                    startOfDate(
	                        this.year(),
	                        this.month(),
	                        this.date() - (this.isoWeekday() - 1) + 7
	                    ) - 1;
	                break;
	            case 'day':
	            case 'date':
	                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
	                break;
	            case 'hour':
	                time = this._d.valueOf();
	                time +=
	                    MS_PER_HOUR -
	                    mod$1(
	                        time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
	                        MS_PER_HOUR
	                    ) -
	                    1;
	                break;
	            case 'minute':
	                time = this._d.valueOf();
	                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
	                break;
	            case 'second':
	                time = this._d.valueOf();
	                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
	                break;
	        }

	        this._d.setTime(time);
	        hooks.updateOffset(this, true);
	        return this;
	    }

	    function valueOf() {
	        return this._d.valueOf() - (this._offset || 0) * 60000;
	    }

	    function unix() {
	        return Math.floor(this.valueOf() / 1000);
	    }

	    function toDate() {
	        return new Date(this.valueOf());
	    }

	    function toArray() {
	        var m = this;
	        return [
	            m.year(),
	            m.month(),
	            m.date(),
	            m.hour(),
	            m.minute(),
	            m.second(),
	            m.millisecond(),
	        ];
	    }

	    function toObject() {
	        var m = this;
	        return {
	            years: m.year(),
	            months: m.month(),
	            date: m.date(),
	            hours: m.hours(),
	            minutes: m.minutes(),
	            seconds: m.seconds(),
	            milliseconds: m.milliseconds(),
	        };
	    }

	    function toJSON() {
	        // new Date(NaN).toJSON() === null
	        return this.isValid() ? this.toISOString() : null;
	    }

	    function isValid$2() {
	        return isValid(this);
	    }

	    function parsingFlags() {
	        return extend({}, getParsingFlags(this));
	    }

	    function invalidAt() {
	        return getParsingFlags(this).overflow;
	    }

	    function creationData() {
	        return {
	            input: this._i,
	            format: this._f,
	            locale: this._locale,
	            isUTC: this._isUTC,
	            strict: this._strict,
	        };
	    }

	    addFormatToken('N', 0, 0, 'eraAbbr');
	    addFormatToken('NN', 0, 0, 'eraAbbr');
	    addFormatToken('NNN', 0, 0, 'eraAbbr');
	    addFormatToken('NNNN', 0, 0, 'eraName');
	    addFormatToken('NNNNN', 0, 0, 'eraNarrow');

	    addFormatToken('y', ['y', 1], 'yo', 'eraYear');
	    addFormatToken('y', ['yy', 2], 0, 'eraYear');
	    addFormatToken('y', ['yyy', 3], 0, 'eraYear');
	    addFormatToken('y', ['yyyy', 4], 0, 'eraYear');

	    addRegexToken('N', matchEraAbbr);
	    addRegexToken('NN', matchEraAbbr);
	    addRegexToken('NNN', matchEraAbbr);
	    addRegexToken('NNNN', matchEraName);
	    addRegexToken('NNNNN', matchEraNarrow);

	    addParseToken(
	        ['N', 'NN', 'NNN', 'NNNN', 'NNNNN'],
	        function (input, array, config, token) {
	            var era = config._locale.erasParse(input, token, config._strict);
	            if (era) {
	                getParsingFlags(config).era = era;
	            } else {
	                getParsingFlags(config).invalidEra = input;
	            }
	        }
	    );

	    addRegexToken('y', matchUnsigned);
	    addRegexToken('yy', matchUnsigned);
	    addRegexToken('yyy', matchUnsigned);
	    addRegexToken('yyyy', matchUnsigned);
	    addRegexToken('yo', matchEraYearOrdinal);

	    addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
	    addParseToken(['yo'], function (input, array, config, token) {
	        var match;
	        if (config._locale._eraYearOrdinalRegex) {
	            match = input.match(config._locale._eraYearOrdinalRegex);
	        }

	        if (config._locale.eraYearOrdinalParse) {
	            array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
	        } else {
	            array[YEAR] = parseInt(input, 10);
	        }
	    });

	    function localeEras(m, format) {
	        var i,
	            l,
	            date,
	            eras = this._eras || getLocale('en')._eras;
	        for (i = 0, l = eras.length; i < l; ++i) {
	            switch (typeof eras[i].since) {
	                case 'string':
	                    // truncate time
	                    date = hooks(eras[i].since).startOf('day');
	                    eras[i].since = date.valueOf();
	                    break;
	            }

	            switch (typeof eras[i].until) {
	                case 'undefined':
	                    eras[i].until = +Infinity;
	                    break;
	                case 'string':
	                    // truncate time
	                    date = hooks(eras[i].until).startOf('day').valueOf();
	                    eras[i].until = date.valueOf();
	                    break;
	            }
	        }
	        return eras;
	    }

	    function localeErasParse(eraName, format, strict) {
	        var i,
	            l,
	            eras = this.eras(),
	            name,
	            abbr,
	            narrow;
	        eraName = eraName.toUpperCase();

	        for (i = 0, l = eras.length; i < l; ++i) {
	            name = eras[i].name.toUpperCase();
	            abbr = eras[i].abbr.toUpperCase();
	            narrow = eras[i].narrow.toUpperCase();

	            if (strict) {
	                switch (format) {
	                    case 'N':
	                    case 'NN':
	                    case 'NNN':
	                        if (abbr === eraName) {
	                            return eras[i];
	                        }
	                        break;

	                    case 'NNNN':
	                        if (name === eraName) {
	                            return eras[i];
	                        }
	                        break;

	                    case 'NNNNN':
	                        if (narrow === eraName) {
	                            return eras[i];
	                        }
	                        break;
	                }
	            } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
	                return eras[i];
	            }
	        }
	    }

	    function localeErasConvertYear(era, year) {
	        var dir = era.since <= era.until ? +1 : -1;
	        if (year === undefined) {
	            return hooks(era.since).year();
	        } else {
	            return hooks(era.since).year() + (year - era.offset) * dir;
	        }
	    }

	    function getEraName() {
	        var i,
	            l,
	            val,
	            eras = this.localeData().eras();
	        for (i = 0, l = eras.length; i < l; ++i) {
	            // truncate time
	            val = this.clone().startOf('day').valueOf();

	            if (eras[i].since <= val && val <= eras[i].until) {
	                return eras[i].name;
	            }
	            if (eras[i].until <= val && val <= eras[i].since) {
	                return eras[i].name;
	            }
	        }

	        return '';
	    }

	    function getEraNarrow() {
	        var i,
	            l,
	            val,
	            eras = this.localeData().eras();
	        for (i = 0, l = eras.length; i < l; ++i) {
	            // truncate time
	            val = this.clone().startOf('day').valueOf();

	            if (eras[i].since <= val && val <= eras[i].until) {
	                return eras[i].narrow;
	            }
	            if (eras[i].until <= val && val <= eras[i].since) {
	                return eras[i].narrow;
	            }
	        }

	        return '';
	    }

	    function getEraAbbr() {
	        var i,
	            l,
	            val,
	            eras = this.localeData().eras();
	        for (i = 0, l = eras.length; i < l; ++i) {
	            // truncate time
	            val = this.clone().startOf('day').valueOf();

	            if (eras[i].since <= val && val <= eras[i].until) {
	                return eras[i].abbr;
	            }
	            if (eras[i].until <= val && val <= eras[i].since) {
	                return eras[i].abbr;
	            }
	        }

	        return '';
	    }

	    function getEraYear() {
	        var i,
	            l,
	            dir,
	            val,
	            eras = this.localeData().eras();
	        for (i = 0, l = eras.length; i < l; ++i) {
	            dir = eras[i].since <= eras[i].until ? +1 : -1;

	            // truncate time
	            val = this.clone().startOf('day').valueOf();

	            if (
	                (eras[i].since <= val && val <= eras[i].until) ||
	                (eras[i].until <= val && val <= eras[i].since)
	            ) {
	                return (
	                    (this.year() - hooks(eras[i].since).year()) * dir +
	                    eras[i].offset
	                );
	            }
	        }

	        return this.year();
	    }

	    function erasNameRegex(isStrict) {
	        if (!hasOwnProp(this, '_erasNameRegex')) {
	            computeErasParse.call(this);
	        }
	        return isStrict ? this._erasNameRegex : this._erasRegex;
	    }

	    function erasAbbrRegex(isStrict) {
	        if (!hasOwnProp(this, '_erasAbbrRegex')) {
	            computeErasParse.call(this);
	        }
	        return isStrict ? this._erasAbbrRegex : this._erasRegex;
	    }

	    function erasNarrowRegex(isStrict) {
	        if (!hasOwnProp(this, '_erasNarrowRegex')) {
	            computeErasParse.call(this);
	        }
	        return isStrict ? this._erasNarrowRegex : this._erasRegex;
	    }

	    function matchEraAbbr(isStrict, locale) {
	        return locale.erasAbbrRegex(isStrict);
	    }

	    function matchEraName(isStrict, locale) {
	        return locale.erasNameRegex(isStrict);
	    }

	    function matchEraNarrow(isStrict, locale) {
	        return locale.erasNarrowRegex(isStrict);
	    }

	    function matchEraYearOrdinal(isStrict, locale) {
	        return locale._eraYearOrdinalRegex || matchUnsigned;
	    }

	    function computeErasParse() {
	        var abbrPieces = [],
	            namePieces = [],
	            narrowPieces = [],
	            mixedPieces = [],
	            i,
	            l,
	            eras = this.eras();

	        for (i = 0, l = eras.length; i < l; ++i) {
	            namePieces.push(regexEscape(eras[i].name));
	            abbrPieces.push(regexEscape(eras[i].abbr));
	            narrowPieces.push(regexEscape(eras[i].narrow));

	            mixedPieces.push(regexEscape(eras[i].name));
	            mixedPieces.push(regexEscape(eras[i].abbr));
	            mixedPieces.push(regexEscape(eras[i].narrow));
	        }

	        this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
	        this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
	        this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
	        this._erasNarrowRegex = new RegExp(
	            '^(' + narrowPieces.join('|') + ')',
	            'i'
	        );
	    }

	    // FORMATTING

	    addFormatToken(0, ['gg', 2], 0, function () {
	        return this.weekYear() % 100;
	    });

	    addFormatToken(0, ['GG', 2], 0, function () {
	        return this.isoWeekYear() % 100;
	    });

	    function addWeekYearFormatToken(token, getter) {
	        addFormatToken(0, [token, token.length], 0, getter);
	    }

	    addWeekYearFormatToken('gggg', 'weekYear');
	    addWeekYearFormatToken('ggggg', 'weekYear');
	    addWeekYearFormatToken('GGGG', 'isoWeekYear');
	    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

	    // ALIASES

	    addUnitAlias('weekYear', 'gg');
	    addUnitAlias('isoWeekYear', 'GG');

	    // PRIORITY

	    addUnitPriority('weekYear', 1);
	    addUnitPriority('isoWeekYear', 1);

	    // PARSING

	    addRegexToken('G', matchSigned);
	    addRegexToken('g', matchSigned);
	    addRegexToken('GG', match1to2, match2);
	    addRegexToken('gg', match1to2, match2);
	    addRegexToken('GGGG', match1to4, match4);
	    addRegexToken('gggg', match1to4, match4);
	    addRegexToken('GGGGG', match1to6, match6);
	    addRegexToken('ggggg', match1to6, match6);

	    addWeekParseToken(
	        ['gggg', 'ggggg', 'GGGG', 'GGGGG'],
	        function (input, week, config, token) {
	            week[token.substr(0, 2)] = toInt(input);
	        }
	    );

	    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
	        week[token] = hooks.parseTwoDigitYear(input);
	    });

	    // MOMENTS

	    function getSetWeekYear(input) {
	        return getSetWeekYearHelper.call(
	            this,
	            input,
	            this.week(),
	            this.weekday(),
	            this.localeData()._week.dow,
	            this.localeData()._week.doy
	        );
	    }

	    function getSetISOWeekYear(input) {
	        return getSetWeekYearHelper.call(
	            this,
	            input,
	            this.isoWeek(),
	            this.isoWeekday(),
	            1,
	            4
	        );
	    }

	    function getISOWeeksInYear() {
	        return weeksInYear(this.year(), 1, 4);
	    }

	    function getISOWeeksInISOWeekYear() {
	        return weeksInYear(this.isoWeekYear(), 1, 4);
	    }

	    function getWeeksInYear() {
	        var weekInfo = this.localeData()._week;
	        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
	    }

	    function getWeeksInWeekYear() {
	        var weekInfo = this.localeData()._week;
	        return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
	    }

	    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
	        var weeksTarget;
	        if (input == null) {
	            return weekOfYear(this, dow, doy).year;
	        } else {
	            weeksTarget = weeksInYear(input, dow, doy);
	            if (week > weeksTarget) {
	                week = weeksTarget;
	            }
	            return setWeekAll.call(this, input, week, weekday, dow, doy);
	        }
	    }

	    function setWeekAll(weekYear, week, weekday, dow, doy) {
	        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
	            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

	        this.year(date.getUTCFullYear());
	        this.month(date.getUTCMonth());
	        this.date(date.getUTCDate());
	        return this;
	    }

	    // FORMATTING

	    addFormatToken('Q', 0, 'Qo', 'quarter');

	    // ALIASES

	    addUnitAlias('quarter', 'Q');

	    // PRIORITY

	    addUnitPriority('quarter', 7);

	    // PARSING

	    addRegexToken('Q', match1);
	    addParseToken('Q', function (input, array) {
	        array[MONTH] = (toInt(input) - 1) * 3;
	    });

	    // MOMENTS

	    function getSetQuarter(input) {
	        return input == null
	            ? Math.ceil((this.month() + 1) / 3)
	            : this.month((input - 1) * 3 + (this.month() % 3));
	    }

	    // FORMATTING

	    addFormatToken('D', ['DD', 2], 'Do', 'date');

	    // ALIASES

	    addUnitAlias('date', 'D');

	    // PRIORITY
	    addUnitPriority('date', 9);

	    // PARSING

	    addRegexToken('D', match1to2);
	    addRegexToken('DD', match1to2, match2);
	    addRegexToken('Do', function (isStrict, locale) {
	        // TODO: Remove "ordinalParse" fallback in next major release.
	        return isStrict
	            ? locale._dayOfMonthOrdinalParse || locale._ordinalParse
	            : locale._dayOfMonthOrdinalParseLenient;
	    });

	    addParseToken(['D', 'DD'], DATE);
	    addParseToken('Do', function (input, array) {
	        array[DATE] = toInt(input.match(match1to2)[0]);
	    });

	    // MOMENTS

	    var getSetDayOfMonth = makeGetSet('Date', true);

	    // FORMATTING

	    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

	    // ALIASES

	    addUnitAlias('dayOfYear', 'DDD');

	    // PRIORITY
	    addUnitPriority('dayOfYear', 4);

	    // PARSING

	    addRegexToken('DDD', match1to3);
	    addRegexToken('DDDD', match3);
	    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
	        config._dayOfYear = toInt(input);
	    });

	    // HELPERS

	    // MOMENTS

	    function getSetDayOfYear(input) {
	        var dayOfYear =
	            Math.round(
	                (this.clone().startOf('day') - this.clone().startOf('year')) / 864e5
	            ) + 1;
	        return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
	    }

	    // FORMATTING

	    addFormatToken('m', ['mm', 2], 0, 'minute');

	    // ALIASES

	    addUnitAlias('minute', 'm');

	    // PRIORITY

	    addUnitPriority('minute', 14);

	    // PARSING

	    addRegexToken('m', match1to2);
	    addRegexToken('mm', match1to2, match2);
	    addParseToken(['m', 'mm'], MINUTE);

	    // MOMENTS

	    var getSetMinute = makeGetSet('Minutes', false);

	    // FORMATTING

	    addFormatToken('s', ['ss', 2], 0, 'second');

	    // ALIASES

	    addUnitAlias('second', 's');

	    // PRIORITY

	    addUnitPriority('second', 15);

	    // PARSING

	    addRegexToken('s', match1to2);
	    addRegexToken('ss', match1to2, match2);
	    addParseToken(['s', 'ss'], SECOND);

	    // MOMENTS

	    var getSetSecond = makeGetSet('Seconds', false);

	    // FORMATTING

	    addFormatToken('S', 0, 0, function () {
	        return ~~(this.millisecond() / 100);
	    });

	    addFormatToken(0, ['SS', 2], 0, function () {
	        return ~~(this.millisecond() / 10);
	    });

	    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
	    addFormatToken(0, ['SSSS', 4], 0, function () {
	        return this.millisecond() * 10;
	    });
	    addFormatToken(0, ['SSSSS', 5], 0, function () {
	        return this.millisecond() * 100;
	    });
	    addFormatToken(0, ['SSSSSS', 6], 0, function () {
	        return this.millisecond() * 1000;
	    });
	    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
	        return this.millisecond() * 10000;
	    });
	    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
	        return this.millisecond() * 100000;
	    });
	    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
	        return this.millisecond() * 1000000;
	    });

	    // ALIASES

	    addUnitAlias('millisecond', 'ms');

	    // PRIORITY

	    addUnitPriority('millisecond', 16);

	    // PARSING

	    addRegexToken('S', match1to3, match1);
	    addRegexToken('SS', match1to3, match2);
	    addRegexToken('SSS', match1to3, match3);

	    var token, getSetMillisecond;
	    for (token = 'SSSS'; token.length <= 9; token += 'S') {
	        addRegexToken(token, matchUnsigned);
	    }

	    function parseMs(input, array) {
	        array[MILLISECOND] = toInt(('0.' + input) * 1000);
	    }

	    for (token = 'S'; token.length <= 9; token += 'S') {
	        addParseToken(token, parseMs);
	    }

	    getSetMillisecond = makeGetSet('Milliseconds', false);

	    // FORMATTING

	    addFormatToken('z', 0, 0, 'zoneAbbr');
	    addFormatToken('zz', 0, 0, 'zoneName');

	    // MOMENTS

	    function getZoneAbbr() {
	        return this._isUTC ? 'UTC' : '';
	    }

	    function getZoneName() {
	        return this._isUTC ? 'Coordinated Universal Time' : '';
	    }

	    var proto = Moment.prototype;

	    proto.add = add;
	    proto.calendar = calendar$1;
	    proto.clone = clone;
	    proto.diff = diff;
	    proto.endOf = endOf;
	    proto.format = format;
	    proto.from = from;
	    proto.fromNow = fromNow;
	    proto.to = to;
	    proto.toNow = toNow;
	    proto.get = stringGet;
	    proto.invalidAt = invalidAt;
	    proto.isAfter = isAfter;
	    proto.isBefore = isBefore;
	    proto.isBetween = isBetween;
	    proto.isSame = isSame;
	    proto.isSameOrAfter = isSameOrAfter;
	    proto.isSameOrBefore = isSameOrBefore;
	    proto.isValid = isValid$2;
	    proto.lang = lang;
	    proto.locale = locale;
	    proto.localeData = localeData;
	    proto.max = prototypeMax;
	    proto.min = prototypeMin;
	    proto.parsingFlags = parsingFlags;
	    proto.set = stringSet;
	    proto.startOf = startOf;
	    proto.subtract = subtract;
	    proto.toArray = toArray;
	    proto.toObject = toObject;
	    proto.toDate = toDate;
	    proto.toISOString = toISOString;
	    proto.inspect = inspect;
	    if (typeof Symbol !== 'undefined' && Symbol.for != null) {
	        proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
	            return 'Moment<' + this.format() + '>';
	        };
	    }
	    proto.toJSON = toJSON;
	    proto.toString = toString;
	    proto.unix = unix;
	    proto.valueOf = valueOf;
	    proto.creationData = creationData;
	    proto.eraName = getEraName;
	    proto.eraNarrow = getEraNarrow;
	    proto.eraAbbr = getEraAbbr;
	    proto.eraYear = getEraYear;
	    proto.year = getSetYear;
	    proto.isLeapYear = getIsLeapYear;
	    proto.weekYear = getSetWeekYear;
	    proto.isoWeekYear = getSetISOWeekYear;
	    proto.quarter = proto.quarters = getSetQuarter;
	    proto.month = getSetMonth;
	    proto.daysInMonth = getDaysInMonth;
	    proto.week = proto.weeks = getSetWeek;
	    proto.isoWeek = proto.isoWeeks = getSetISOWeek;
	    proto.weeksInYear = getWeeksInYear;
	    proto.weeksInWeekYear = getWeeksInWeekYear;
	    proto.isoWeeksInYear = getISOWeeksInYear;
	    proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
	    proto.date = getSetDayOfMonth;
	    proto.day = proto.days = getSetDayOfWeek;
	    proto.weekday = getSetLocaleDayOfWeek;
	    proto.isoWeekday = getSetISODayOfWeek;
	    proto.dayOfYear = getSetDayOfYear;
	    proto.hour = proto.hours = getSetHour;
	    proto.minute = proto.minutes = getSetMinute;
	    proto.second = proto.seconds = getSetSecond;
	    proto.millisecond = proto.milliseconds = getSetMillisecond;
	    proto.utcOffset = getSetOffset;
	    proto.utc = setOffsetToUTC;
	    proto.local = setOffsetToLocal;
	    proto.parseZone = setOffsetToParsedOffset;
	    proto.hasAlignedHourOffset = hasAlignedHourOffset;
	    proto.isDST = isDaylightSavingTime;
	    proto.isLocal = isLocal;
	    proto.isUtcOffset = isUtcOffset;
	    proto.isUtc = isUtc;
	    proto.isUTC = isUtc;
	    proto.zoneAbbr = getZoneAbbr;
	    proto.zoneName = getZoneName;
	    proto.dates = deprecate(
	        'dates accessor is deprecated. Use date instead.',
	        getSetDayOfMonth
	    );
	    proto.months = deprecate(
	        'months accessor is deprecated. Use month instead',
	        getSetMonth
	    );
	    proto.years = deprecate(
	        'years accessor is deprecated. Use year instead',
	        getSetYear
	    );
	    proto.zone = deprecate(
	        'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
	        getSetZone
	    );
	    proto.isDSTShifted = deprecate(
	        'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
	        isDaylightSavingTimeShifted
	    );

	    function createUnix(input) {
	        return createLocal(input * 1000);
	    }

	    function createInZone() {
	        return createLocal.apply(null, arguments).parseZone();
	    }

	    function preParsePostFormat(string) {
	        return string;
	    }

	    var proto$1 = Locale.prototype;

	    proto$1.calendar = calendar;
	    proto$1.longDateFormat = longDateFormat;
	    proto$1.invalidDate = invalidDate;
	    proto$1.ordinal = ordinal;
	    proto$1.preparse = preParsePostFormat;
	    proto$1.postformat = preParsePostFormat;
	    proto$1.relativeTime = relativeTime;
	    proto$1.pastFuture = pastFuture;
	    proto$1.set = set;
	    proto$1.eras = localeEras;
	    proto$1.erasParse = localeErasParse;
	    proto$1.erasConvertYear = localeErasConvertYear;
	    proto$1.erasAbbrRegex = erasAbbrRegex;
	    proto$1.erasNameRegex = erasNameRegex;
	    proto$1.erasNarrowRegex = erasNarrowRegex;

	    proto$1.months = localeMonths;
	    proto$1.monthsShort = localeMonthsShort;
	    proto$1.monthsParse = localeMonthsParse;
	    proto$1.monthsRegex = monthsRegex;
	    proto$1.monthsShortRegex = monthsShortRegex;
	    proto$1.week = localeWeek;
	    proto$1.firstDayOfYear = localeFirstDayOfYear;
	    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

	    proto$1.weekdays = localeWeekdays;
	    proto$1.weekdaysMin = localeWeekdaysMin;
	    proto$1.weekdaysShort = localeWeekdaysShort;
	    proto$1.weekdaysParse = localeWeekdaysParse;

	    proto$1.weekdaysRegex = weekdaysRegex;
	    proto$1.weekdaysShortRegex = weekdaysShortRegex;
	    proto$1.weekdaysMinRegex = weekdaysMinRegex;

	    proto$1.isPM = localeIsPM;
	    proto$1.meridiem = localeMeridiem;

	    function get$1(format, index, field, setter) {
	        var locale = getLocale(),
	            utc = createUTC().set(setter, index);
	        return locale[field](utc, format);
	    }

	    function listMonthsImpl(format, index, field) {
	        if (isNumber(format)) {
	            index = format;
	            format = undefined;
	        }

	        format = format || '';

	        if (index != null) {
	            return get$1(format, index, field, 'month');
	        }

	        var i,
	            out = [];
	        for (i = 0; i < 12; i++) {
	            out[i] = get$1(format, i, field, 'month');
	        }
	        return out;
	    }

	    // ()
	    // (5)
	    // (fmt, 5)
	    // (fmt)
	    // (true)
	    // (true, 5)
	    // (true, fmt, 5)
	    // (true, fmt)
	    function listWeekdaysImpl(localeSorted, format, index, field) {
	        if (typeof localeSorted === 'boolean') {
	            if (isNumber(format)) {
	                index = format;
	                format = undefined;
	            }

	            format = format || '';
	        } else {
	            format = localeSorted;
	            index = format;
	            localeSorted = false;

	            if (isNumber(format)) {
	                index = format;
	                format = undefined;
	            }

	            format = format || '';
	        }

	        var locale = getLocale(),
	            shift = localeSorted ? locale._week.dow : 0,
	            i,
	            out = [];

	        if (index != null) {
	            return get$1(format, (index + shift) % 7, field, 'day');
	        }

	        for (i = 0; i < 7; i++) {
	            out[i] = get$1(format, (i + shift) % 7, field, 'day');
	        }
	        return out;
	    }

	    function listMonths(format, index) {
	        return listMonthsImpl(format, index, 'months');
	    }

	    function listMonthsShort(format, index) {
	        return listMonthsImpl(format, index, 'monthsShort');
	    }

	    function listWeekdays(localeSorted, format, index) {
	        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
	    }

	    function listWeekdaysShort(localeSorted, format, index) {
	        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
	    }

	    function listWeekdaysMin(localeSorted, format, index) {
	        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
	    }

	    getSetGlobalLocale('en', {
	        eras: [
	            {
	                since: '0001-01-01',
	                until: +Infinity,
	                offset: 1,
	                name: 'Anno Domini',
	                narrow: 'AD',
	                abbr: 'AD',
	            },
	            {
	                since: '0000-12-31',
	                until: -Infinity,
	                offset: 1,
	                name: 'Before Christ',
	                narrow: 'BC',
	                abbr: 'BC',
	            },
	        ],
	        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
	        ordinal: function (number) {
	            var b = number % 10,
	                output =
	                    toInt((number % 100) / 10) === 1
	                        ? 'th'
	                        : b === 1
	                        ? 'st'
	                        : b === 2
	                        ? 'nd'
	                        : b === 3
	                        ? 'rd'
	                        : 'th';
	            return number + output;
	        },
	    });

	    // Side effect imports

	    hooks.lang = deprecate(
	        'moment.lang is deprecated. Use moment.locale instead.',
	        getSetGlobalLocale
	    );
	    hooks.langData = deprecate(
	        'moment.langData is deprecated. Use moment.localeData instead.',
	        getLocale
	    );

	    var mathAbs = Math.abs;

	    function abs() {
	        var data = this._data;

	        this._milliseconds = mathAbs(this._milliseconds);
	        this._days = mathAbs(this._days);
	        this._months = mathAbs(this._months);

	        data.milliseconds = mathAbs(data.milliseconds);
	        data.seconds = mathAbs(data.seconds);
	        data.minutes = mathAbs(data.minutes);
	        data.hours = mathAbs(data.hours);
	        data.months = mathAbs(data.months);
	        data.years = mathAbs(data.years);

	        return this;
	    }

	    function addSubtract$1(duration, input, value, direction) {
	        var other = createDuration(input, value);

	        duration._milliseconds += direction * other._milliseconds;
	        duration._days += direction * other._days;
	        duration._months += direction * other._months;

	        return duration._bubble();
	    }

	    // supports only 2.0-style add(1, 's') or add(duration)
	    function add$1(input, value) {
	        return addSubtract$1(this, input, value, 1);
	    }

	    // supports only 2.0-style subtract(1, 's') or subtract(duration)
	    function subtract$1(input, value) {
	        return addSubtract$1(this, input, value, -1);
	    }

	    function absCeil(number) {
	        if (number < 0) {
	            return Math.floor(number);
	        } else {
	            return Math.ceil(number);
	        }
	    }

	    function bubble() {
	        var milliseconds = this._milliseconds,
	            days = this._days,
	            months = this._months,
	            data = this._data,
	            seconds,
	            minutes,
	            hours,
	            years,
	            monthsFromDays;

	        // if we have a mix of positive and negative values, bubble down first
	        // check: https://github.com/moment/moment/issues/2166
	        if (
	            !(
	                (milliseconds >= 0 && days >= 0 && months >= 0) ||
	                (milliseconds <= 0 && days <= 0 && months <= 0)
	            )
	        ) {
	            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
	            days = 0;
	            months = 0;
	        }

	        // The following code bubbles up values, see the tests for
	        // examples of what that means.
	        data.milliseconds = milliseconds % 1000;

	        seconds = absFloor(milliseconds / 1000);
	        data.seconds = seconds % 60;

	        minutes = absFloor(seconds / 60);
	        data.minutes = minutes % 60;

	        hours = absFloor(minutes / 60);
	        data.hours = hours % 24;

	        days += absFloor(hours / 24);

	        // convert days to months
	        monthsFromDays = absFloor(daysToMonths(days));
	        months += monthsFromDays;
	        days -= absCeil(monthsToDays(monthsFromDays));

	        // 12 months -> 1 year
	        years = absFloor(months / 12);
	        months %= 12;

	        data.days = days;
	        data.months = months;
	        data.years = years;

	        return this;
	    }

	    function daysToMonths(days) {
	        // 400 years have 146097 days (taking into account leap year rules)
	        // 400 years have 12 months === 4800
	        return (days * 4800) / 146097;
	    }

	    function monthsToDays(months) {
	        // the reverse of daysToMonths
	        return (months * 146097) / 4800;
	    }

	    function as(units) {
	        if (!this.isValid()) {
	            return NaN;
	        }
	        var days,
	            months,
	            milliseconds = this._milliseconds;

	        units = normalizeUnits(units);

	        if (units === 'month' || units === 'quarter' || units === 'year') {
	            days = this._days + milliseconds / 864e5;
	            months = this._months + daysToMonths(days);
	            switch (units) {
	                case 'month':
	                    return months;
	                case 'quarter':
	                    return months / 3;
	                case 'year':
	                    return months / 12;
	            }
	        } else {
	            // handle milliseconds separately because of floating point math errors (issue #1867)
	            days = this._days + Math.round(monthsToDays(this._months));
	            switch (units) {
	                case 'week':
	                    return days / 7 + milliseconds / 6048e5;
	                case 'day':
	                    return days + milliseconds / 864e5;
	                case 'hour':
	                    return days * 24 + milliseconds / 36e5;
	                case 'minute':
	                    return days * 1440 + milliseconds / 6e4;
	                case 'second':
	                    return days * 86400 + milliseconds / 1000;
	                // Math.floor prevents floating point math errors here
	                case 'millisecond':
	                    return Math.floor(days * 864e5) + milliseconds;
	                default:
	                    throw new Error('Unknown unit ' + units);
	            }
	        }
	    }

	    // TODO: Use this.as('ms')?
	    function valueOf$1() {
	        if (!this.isValid()) {
	            return NaN;
	        }
	        return (
	            this._milliseconds +
	            this._days * 864e5 +
	            (this._months % 12) * 2592e6 +
	            toInt(this._months / 12) * 31536e6
	        );
	    }

	    function makeAs(alias) {
	        return function () {
	            return this.as(alias);
	        };
	    }

	    var asMilliseconds = makeAs('ms'),
	        asSeconds = makeAs('s'),
	        asMinutes = makeAs('m'),
	        asHours = makeAs('h'),
	        asDays = makeAs('d'),
	        asWeeks = makeAs('w'),
	        asMonths = makeAs('M'),
	        asQuarters = makeAs('Q'),
	        asYears = makeAs('y');

	    function clone$1() {
	        return createDuration(this);
	    }

	    function get$2(units) {
	        units = normalizeUnits(units);
	        return this.isValid() ? this[units + 's']() : NaN;
	    }

	    function makeGetter(name) {
	        return function () {
	            return this.isValid() ? this._data[name] : NaN;
	        };
	    }

	    var milliseconds = makeGetter('milliseconds'),
	        seconds = makeGetter('seconds'),
	        minutes = makeGetter('minutes'),
	        hours = makeGetter('hours'),
	        days = makeGetter('days'),
	        months = makeGetter('months'),
	        years = makeGetter('years');

	    function weeks() {
	        return absFloor(this.days() / 7);
	    }

	    var round = Math.round,
	        thresholds = {
	            ss: 44, // a few seconds to seconds
	            s: 45, // seconds to minute
	            m: 45, // minutes to hour
	            h: 22, // hours to day
	            d: 26, // days to month/week
	            w: null, // weeks to month
	            M: 11, // months to year
	        };

	    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
	    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
	        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
	    }

	    function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
	        var duration = createDuration(posNegDuration).abs(),
	            seconds = round(duration.as('s')),
	            minutes = round(duration.as('m')),
	            hours = round(duration.as('h')),
	            days = round(duration.as('d')),
	            months = round(duration.as('M')),
	            weeks = round(duration.as('w')),
	            years = round(duration.as('y')),
	            a =
	                (seconds <= thresholds.ss && ['s', seconds]) ||
	                (seconds < thresholds.s && ['ss', seconds]) ||
	                (minutes <= 1 && ['m']) ||
	                (minutes < thresholds.m && ['mm', minutes]) ||
	                (hours <= 1 && ['h']) ||
	                (hours < thresholds.h && ['hh', hours]) ||
	                (days <= 1 && ['d']) ||
	                (days < thresholds.d && ['dd', days]);

	        if (thresholds.w != null) {
	            a =
	                a ||
	                (weeks <= 1 && ['w']) ||
	                (weeks < thresholds.w && ['ww', weeks]);
	        }
	        a = a ||
	            (months <= 1 && ['M']) ||
	            (months < thresholds.M && ['MM', months]) ||
	            (years <= 1 && ['y']) || ['yy', years];

	        a[2] = withoutSuffix;
	        a[3] = +posNegDuration > 0;
	        a[4] = locale;
	        return substituteTimeAgo.apply(null, a);
	    }

	    // This function allows you to set the rounding function for relative time strings
	    function getSetRelativeTimeRounding(roundingFunction) {
	        if (roundingFunction === undefined) {
	            return round;
	        }
	        if (typeof roundingFunction === 'function') {
	            round = roundingFunction;
	            return true;
	        }
	        return false;
	    }

	    // This function allows you to set a threshold for relative time strings
	    function getSetRelativeTimeThreshold(threshold, limit) {
	        if (thresholds[threshold] === undefined) {
	            return false;
	        }
	        if (limit === undefined) {
	            return thresholds[threshold];
	        }
	        thresholds[threshold] = limit;
	        if (threshold === 's') {
	            thresholds.ss = limit - 1;
	        }
	        return true;
	    }

	    function humanize(argWithSuffix, argThresholds) {
	        if (!this.isValid()) {
	            return this.localeData().invalidDate();
	        }

	        var withSuffix = false,
	            th = thresholds,
	            locale,
	            output;

	        if (typeof argWithSuffix === 'object') {
	            argThresholds = argWithSuffix;
	            argWithSuffix = false;
	        }
	        if (typeof argWithSuffix === 'boolean') {
	            withSuffix = argWithSuffix;
	        }
	        if (typeof argThresholds === 'object') {
	            th = Object.assign({}, thresholds, argThresholds);
	            if (argThresholds.s != null && argThresholds.ss == null) {
	                th.ss = argThresholds.s - 1;
	            }
	        }

	        locale = this.localeData();
	        output = relativeTime$1(this, !withSuffix, th, locale);

	        if (withSuffix) {
	            output = locale.pastFuture(+this, output);
	        }

	        return locale.postformat(output);
	    }

	    var abs$1 = Math.abs;

	    function sign(x) {
	        return (x > 0) - (x < 0) || +x;
	    }

	    function toISOString$1() {
	        // for ISO strings we do not use the normal bubbling rules:
	        //  * milliseconds bubble up until they become hours
	        //  * days do not bubble at all
	        //  * months bubble up until they become years
	        // This is because there is no context-free conversion between hours and days
	        // (think of clock changes)
	        // and also not between days and months (28-31 days per month)
	        if (!this.isValid()) {
	            return this.localeData().invalidDate();
	        }

	        var seconds = abs$1(this._milliseconds) / 1000,
	            days = abs$1(this._days),
	            months = abs$1(this._months),
	            minutes,
	            hours,
	            years,
	            s,
	            total = this.asSeconds(),
	            totalSign,
	            ymSign,
	            daysSign,
	            hmsSign;

	        if (!total) {
	            // this is the same as C#'s (Noda) and python (isodate)...
	            // but not other JS (goog.date)
	            return 'P0D';
	        }

	        // 3600 seconds -> 60 minutes -> 1 hour
	        minutes = absFloor(seconds / 60);
	        hours = absFloor(minutes / 60);
	        seconds %= 60;
	        minutes %= 60;

	        // 12 months -> 1 year
	        years = absFloor(months / 12);
	        months %= 12;

	        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
	        s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';

	        totalSign = total < 0 ? '-' : '';
	        ymSign = sign(this._months) !== sign(total) ? '-' : '';
	        daysSign = sign(this._days) !== sign(total) ? '-' : '';
	        hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

	        return (
	            totalSign +
	            'P' +
	            (years ? ymSign + years + 'Y' : '') +
	            (months ? ymSign + months + 'M' : '') +
	            (days ? daysSign + days + 'D' : '') +
	            (hours || minutes || seconds ? 'T' : '') +
	            (hours ? hmsSign + hours + 'H' : '') +
	            (minutes ? hmsSign + minutes + 'M' : '') +
	            (seconds ? hmsSign + s + 'S' : '')
	        );
	    }

	    var proto$2 = Duration.prototype;

	    proto$2.isValid = isValid$1;
	    proto$2.abs = abs;
	    proto$2.add = add$1;
	    proto$2.subtract = subtract$1;
	    proto$2.as = as;
	    proto$2.asMilliseconds = asMilliseconds;
	    proto$2.asSeconds = asSeconds;
	    proto$2.asMinutes = asMinutes;
	    proto$2.asHours = asHours;
	    proto$2.asDays = asDays;
	    proto$2.asWeeks = asWeeks;
	    proto$2.asMonths = asMonths;
	    proto$2.asQuarters = asQuarters;
	    proto$2.asYears = asYears;
	    proto$2.valueOf = valueOf$1;
	    proto$2._bubble = bubble;
	    proto$2.clone = clone$1;
	    proto$2.get = get$2;
	    proto$2.milliseconds = milliseconds;
	    proto$2.seconds = seconds;
	    proto$2.minutes = minutes;
	    proto$2.hours = hours;
	    proto$2.days = days;
	    proto$2.weeks = weeks;
	    proto$2.months = months;
	    proto$2.years = years;
	    proto$2.humanize = humanize;
	    proto$2.toISOString = toISOString$1;
	    proto$2.toString = toISOString$1;
	    proto$2.toJSON = toISOString$1;
	    proto$2.locale = locale;
	    proto$2.localeData = localeData;

	    proto$2.toIsoString = deprecate(
	        'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
	        toISOString$1
	    );
	    proto$2.lang = lang;

	    // FORMATTING

	    addFormatToken('X', 0, 0, 'unix');
	    addFormatToken('x', 0, 0, 'valueOf');

	    // PARSING

	    addRegexToken('x', matchSigned);
	    addRegexToken('X', matchTimestamp);
	    addParseToken('X', function (input, array, config) {
	        config._d = new Date(parseFloat(input) * 1000);
	    });
	    addParseToken('x', function (input, array, config) {
	        config._d = new Date(toInt(input));
	    });

	    //! moment.js

	    hooks.version = '2.29.4';

	    setHookCallback(createLocal);

	    hooks.fn = proto;
	    hooks.min = min;
	    hooks.max = max;
	    hooks.now = now;
	    hooks.utc = createUTC;
	    hooks.unix = createUnix;
	    hooks.months = listMonths;
	    hooks.isDate = isDate;
	    hooks.locale = getSetGlobalLocale;
	    hooks.invalid = createInvalid;
	    hooks.duration = createDuration;
	    hooks.isMoment = isMoment;
	    hooks.weekdays = listWeekdays;
	    hooks.parseZone = createInZone;
	    hooks.localeData = getLocale;
	    hooks.isDuration = isDuration;
	    hooks.monthsShort = listMonthsShort;
	    hooks.weekdaysMin = listWeekdaysMin;
	    hooks.defineLocale = defineLocale;
	    hooks.updateLocale = updateLocale;
	    hooks.locales = listLocales;
	    hooks.weekdaysShort = listWeekdaysShort;
	    hooks.normalizeUnits = normalizeUnits;
	    hooks.relativeTimeRounding = getSetRelativeTimeRounding;
	    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
	    hooks.calendarFormat = getCalendarFormat;
	    hooks.prototype = proto;

	    // currently HTML5 input type only supports 24-hour formats
	    hooks.HTML5_FMT = {
	        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
	        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
	        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
	        DATE: 'YYYY-MM-DD', // <input type="date" />
	        TIME: 'HH:mm', // <input type="time" />
	        TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
	        TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
	        WEEK: 'GGGG-[W]WW', // <input type="week" />
	        MONTH: 'YYYY-MM', // <input type="month" />
	    };

	    return hooks;

	}))); 
} (moment));

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
            new obsidian.Notice(`Something went wrong. Retry ${retries + 1}`);
            return fetchWithRetry(url, retries + 1);
        }
        else {
            new obsidian.Notice(`Fetch failed after ${retries} attempts. Using local, possibly outdated locales. Check internet and restart plugin.`);
            return null;
        }
    }
}
function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
}
function getOnCreateNoteDialogNoteFromGranularity(granularity) {
    const periodicity = getPeriodicityFromGranularity(granularity);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotesPlugin = window.app.plugins.getPlugin('periodic-notes');
    const noteSettingsFromPeriodicNotesPlugin = periodicNotesPlugin?.settings[periodicity].enabled;
    if (granularity === 'day') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dailyNotesPlugin = app.internalPlugins.plugins['daily-notes']?.enabled;
        if (periodicNotesPlugin) {
            if (noteSettingsFromPeriodicNotesPlugin) {
                return 'Note: Using Daily notes config from Periodic Notes plugin.';
            }
            else {
                if (dailyNotesPlugin) {
                    return 'Note: Daily notes from Periodic Notes plugin are disabled. Using Daily Notes plugin config for now.';
                }
                else {
                    return 'Note: Daily notes from Periodic Notes plugin and Daily Notes plugin are disabled. Using default config for now.';
                }
            }
        }
        else {
            if (dailyNotesPlugin) {
                return 'Note: Missing Periodic Notes plugin! Please install or activate. Using Daily Notes plugin config for now.';
            }
            else {
                return 'Note: Missing Periodic Notes and Daily Notes plugin! Please install or activate. Using default config for now.';
            }
        }
    }
    if (periodicNotesPlugin) {
        if (noteSettingsFromPeriodicNotesPlugin) {
            return `Note: Using ${capitalize(periodicity)} notes config from Periodic Notes plugin.`;
        }
        else {
            return `Note: ${capitalize(periodicity)} notes from Periodic Notes plugin are disabled. Using default config for now.`;
        }
    }
    else {
        return 'Note: Missing Periodic Notes plugin! Please install or activate. Defaults will be used for now.';
    }
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

dayjs.extend(weekday);
dayjs.extend(localeData);
const DEFAULT_SETTINGS = Object.freeze({
    viewOpen: false,
    shouldConfirmBeforeCreate: true,
    yearsRangesStart: 2020,
    localeData: {
        loading: false,
        weekStart: dayjs.weekdays()[dayjs().weekday(0).day()],
        showWeekNums: false,
        sysLocale: navigator.languages.find((locale) => localesMap.has(locale.toLocaleLowerCase())) ||
            navigator.languages[0],
        localeOverride: null,
        localizedWeekdays: dayjs.weekdays(),
        localizedWeekdaysShort: dayjs.weekdaysShort()
    }
});
class SettingsTab extends obsidian.PluginSettingTab {
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
        this.addConfirmCreateSetting();
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
        new obsidian.Setting(this.containerEl)
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
    addConfirmCreateSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Confirm before creating new note')
            .setDesc('Display a confirmation dialog before creating a new note')
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.shouldConfirmBeforeCreate);
            toggle.onChange(async (value) => {
                this.plugin.saveSettings(() => ({
                    shouldConfirmBeforeCreate: value
                }));
            });
        });
    }
    addShowWeeklyNoteSetting() {
        new obsidian.Setting(this.containerEl)
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
        new obsidian.Setting(this.containerEl)
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
        new obsidian.Setting(this.containerEl)
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
                            new obsidian.Notice('Locales loaded');
                        }
                        // remove loading option
                        dropdown.selectEl.remove(2);
                    }
                    catch (error) {
                        console.error(error);
                        new obsidian.Notice(error);
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
                        new obsidian.Notice(`Retrying to load locale: ${locale}, attempt ${retries + 1}`);
                        loadLocaleWithRetry(locale, retries + 1)
                            .then(resolve) // Resolve with the selected locale after successful retry
                            .catch(reject);
                    }
                    else {
                        new obsidian.Notice(`Failed to load locale: ${locale} after ${retries} attempts`);
                        // Resolve to default English if locale cannot be fetched
                        new obsidian.Notice('Defaulting to English - en');
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
                    weekStart: dayjs.weekdays()[dayjs().weekday(0).day()],
                    localeOverride: 'en',
                    localizedWeekdays: dayjs.weekdays(),
                    localizedWeekdaysShort: dayjs.weekdaysShort()
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
                                weekStart: dayjs.weekdays()[dayjs().weekday(0).day()],
                                localeOverride: localeKey,
                                localizedWeekdays: dayjs.weekdays(),
                                localizedWeekdaysShort: dayjs.weekdaysShort()
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
    const { template, folder, format } = getNoteSettingsByGranularity('day');
    // TODO: Find out what IFoldInfo is used for (think it is for keeping track of openned folders)
    const [templateContents, IFoldInfo] = await getTemplateInfo(template);
    const filename = date.format(format);
    const normalizedPath = await getNotePath(folder, filename);
    // console.table(getNoteSettingsByGranularity('day'));
    // console.log('getTemplateInfo:', templateContents, IFoldInfo);
    // console.log("onClickDay() > createDailyNote > filename, format: ", filename, format)
    // console.log('NOrmalized path', normalizedPath);
    try {
        const createdFile = await vault.create(normalizedPath, templateContents
            .replace(/{{\s*date\s*}}/gi, filename)
            .replace(/{{\s*time\s*}}/gi, date.format('HH:mm'))
            .replace(/{{\s*title\s*}}/gi, filename)
            .replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, dayjsFormat) => {
            let currentDate = window.dayjs();
            if (calc) {
                currentDate = currentDate.add(parseInt(timeDelta, 10), unit);
            }
            if (dayjsFormat) {
                return currentDate.format(dayjsFormat.substring(1).trim());
            }
            return currentDate.format(format);
        })
            .replace(/{{\s*yesterday\s*}}/gi, date.subtract(1, 'd').format(format))
            .replace(/{{\s*tomorrow\s*}}/gi, date.add(1, 'd').format(format)));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
    }
    catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice(`Failed to create file: '${normalizedPath}'`);
    }
}

function getDaysOfWeek() {
    const { moment } = window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let weekStart = moment.localeData()._week.dow;
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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
    const { template, format, folder } = getNoteSettingsByGranularity('week');
    const [templateContents, IFoldInfo] = await getTemplateInfo(template);
    const filename = date.format(format);
    const normalizedPath = await getNotePath(folder, filename);
    try {
        const createdFile = await vault.create(normalizedPath, templateContents
            .replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
            const now = window.moment();
            const currentDate = date.clone().set({
                hour: now.get('hour'),
                minute: now.get('minute'),
                second: now.get('second')
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
            .replace(/{{\s*time\s*}}/gi, window.moment().format('HH:mm'))
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
        new obsidian.Notice(`Failed to create file: '${normalizedPath}'`);
    }
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
    const { template, format, folder } = getNoteSettingsByGranularity('month');
    const [templateContents, IFoldInfo] = await getTemplateInfo(template);
    const filename = date.format(format);
    const normalizedPath = await getNotePath(folder, filename);
    try {
        const createdFile = await vault.create(normalizedPath, templateContents
            .replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
            const now = window.moment();
            const currentDate = date.clone().set({
                hour: now.get('hour'),
                minute: now.get('minute'),
                second: now.get('second')
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
            .replace(/{{\s*time\s*}}/gi, window.moment().format('HH:mm'))
            .replace(/{{\s*title\s*}}/gi, filename));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
    }
    catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice(`Failed to create file: '${normalizedPath}'`);
    }
}

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
async function createQuarterlyNote(date) {
    const { vault } = window.app;
    const { template, format, folder } = getNoteSettingsByGranularity('quarter');
    const [templateContents, IFoldInfo] = await getTemplateInfo(template);
    const filename = date.format(format);
    const normalizedPath = await getNotePath(folder, filename);
    try {
        const createdFile = await vault.create(normalizedPath, templateContents
            .replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
            const now = window.moment();
            const currentDate = date.clone().set({
                hour: now.get('hour'),
                minute: now.get('minute'),
                second: now.get('second')
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
            .replace(/{{\s*time\s*}}/gi, window.moment().format('HH:mm'))
            .replace(/{{\s*title\s*}}/gi, filename));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
    }
    catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice(`Failed to create file: '${normalizedPath}'`);
    }
}

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
async function createYearlyNote(date) {
    const { vault } = window.app;
    const { template, format, folder } = getNoteSettingsByGranularity('year');
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
        new obsidian.Notice(`Failed to create file: '${normalizedPath}'`);
    }
}

function getNoteByGranularity({ date, granularity }) {
    const notesStore = get_store_value(notesStores[granularity]);
    return notesStore[getDateUID(date, granularity)];
}
function getAllNotesByGranularity(granularity) {
    const notes = {};
    const { vault } = window.app;
    try {
        const { folder } = getNoteSettingsByGranularity(granularity);
        const notesFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
        if (!notesFolder) {
            throw new Error(`Unable to locate the ${getPeriodicityFromGranularity(granularity)} notes folder. Check your plugin's settings or restart calendar plugin.`);
        }
        obsidian.Vault.recurseChildren(notesFolder, (note) => {
            // console.log(`getAllNotesByGranularity() > Vault.recurseChildren(${notesFolder}) > note: `, note)
            if (note instanceof obsidian.TFile) {
                // if file name maps to a valid dayjs date, it is saved in store.
                const date = getDateFromFile(note, granularity);
                if (date) {
                    const dateUID = getDateUID(date, granularity);
                    notes[dateUID] = note;
                }
            }
        });
        return notes;
    }
    catch (error) {
        typeof error === 'string' && new obsidian.Notice(error);
        return notes;
    }
}
const noteCreator = {
    'day': createDailyNote,
    'week': createWeeklyNote,
    'month': createMonthlyNote,
    'quarter': createQuarterlyNote,
    'year': createYearlyNote
};

const granularities = ['day', 'week', 'month', 'quarter', 'year'];
const togglePeriods = ['days', 'months', 'years'];
const monthsIndexesInQuarters = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11]
];
const YEARS_RANGE_SIZE = 12;

function createNotesStore(granularity) {
    let hasError = false;
    const store = writable({});
    return {
        reindex: () => {
            console.log(`create${granularity}NotesStore > reindexing`);
            try {
                const notes = getAllNotesByGranularity(granularity);
                if (Object.keys(notes).length === 0) {
                    throw new Error('No notes found');
                }
                store.set(notes);
                hasError = false;
            }
            catch (err) {
                if (!hasError) {
                    // Avoid error being shown multiple times
                    console.log('[Calendar] Failed to find daily notes folder', err);
                }
                store.set({});
                hasError = true;
            }
        },
        ...store
    };
}
function createYearsRangesStore() {
    console.log('stores.ts > createYearsRangesStore() 🏪');
    const store = writable();
    const defaultStart = DEFAULT_SETTINGS.yearsRangesStart;
    const crrYear = window.moment().year();
    const ranges = [];
    let lastRangeYear = 0;
    while (crrYear > lastRangeYear) {
        if (ranges.length === 0) {
            ranges.push(`${defaultStart}-${defaultStart + YEARS_RANGE_SIZE - 1}`);
            lastRangeYear = defaultStart + YEARS_RANGE_SIZE - 1;
        }
        else {
            const lastYear = ranges[ranges.length - 1].split('-')[1];
            ranges.push(`${lastYear}-${+lastYear + YEARS_RANGE_SIZE - 1}`);
            lastRangeYear = +lastYear + YEARS_RANGE_SIZE - 1;
        }
    }
    for (const [i, range] of ranges.entries()) {
        const [start, end] = range.split('-');
        if (crrYear >= +start && crrYear <= +end) {
            store.update((values) => ({
                ...values,
                todayRange: range,
                crrRangeIndex: i
            }));
            break;
        }
    }
    store.update((values) => ({
        ...values,
        ranges
    }));
    return {
        addNewRange: ({ year, action }) => {
            if (action === 'decrement') {
                store.update((values) => {
                    const newRanges = values.ranges;
                    newRanges.unshift(`${year - YEARS_RANGE_SIZE + 1}-${year}`);
                    return {
                        ...values,
                        ranges: newRanges
                    };
                });
            }
            if (action === 'increment') {
                store.update((values) => {
                    const newRanges = values.ranges;
                    newRanges.push(`${year}-${year + YEARS_RANGE_SIZE - 1}`);
                    return {
                        ...values,
                        ranges: newRanges
                    };
                });
            }
        },
        updateRanges: ({ year, action }) => {
            const { ranges, crrRangeIndex } = get_store_value(store);
            const crrRange = ranges[crrRangeIndex];
            const [start, end] = crrRange.split('-');
            if (action === 'decrement') {
                if (year < +start) {
                    const prevRange = ranges[crrRangeIndex - 1];
                    if (prevRange) {
                        if (crrRangeIndex > 0) {
                            yearsRanges.updateCrrRangeIndex({ modifier: -1 });
                        }
                        return;
                    }
                    yearsRanges.addNewRange({ year, action });
                    if (crrRangeIndex > 0) {
                        yearsRanges.updateCrrRangeIndex({ modifier: -1 });
                    }
                }
            }
            if (action === 'increment') {
                if (year > +end) {
                    const nextRange = ranges[crrRangeIndex + 1];
                    if (nextRange) {
                        yearsRanges.updateCrrRangeIndex({ modifier: +1 });
                        return;
                    }
                    yearsRanges.addNewRange({ year, action });
                    yearsRanges.updateCrrRangeIndex({ modifier: +1 });
                }
            }
        },
        updateCrrRangeIndex: ({ modifier }) => {
            yearsRanges.update((values) => ({
                ...values,
                crrRangeIndex: values.crrRangeIndex + modifier
            }));
        },
        ...store
    };
}
const notesStores = {};
granularities.forEach((granularity) => {
    const notesExtStore = createNotesStore(granularity);
    notesStores[granularity] = notesExtStore;
});
const settingsStore = writable(DEFAULT_SETTINGS);
function createSelectedFileStore() {
    const store = writable(null);
    return {
        setFile: (id) => {
            store.set(id);
            // console.log('createSelectedFileStore > setFile > activeFileUID: ', get(store));
        },
        ...store
    };
}
const activeFile = createSelectedFileStore();
const yearsRanges = createYearsRangesStore();

/* src/calendar-ui/components/Dot.svelte generated by Svelte v4.2.0 */

function add_css$9(target) {
	append_styles(target, "svelte-1doygss", ".container.svelte-1doygss{width:100%\n}@media(min-width: 640px){.container.svelte-1doygss{max-width:640px\n    }}@media(min-width: 768px){.container.svelte-1doygss{max-width:768px\n    }}@media(min-width: 1024px){.container.svelte-1doygss{max-width:1024px\n    }}@media(min-width: 1280px){.container.svelte-1doygss{max-width:1280px\n    }}@media(min-width: 1536px){.container.svelte-1doygss{max-width:1536px\n    }}.pointer-events-none.svelte-1doygss{pointer-events:none\n}.visible.svelte-1doygss{visibility:visible\n}.invisible.svelte-1doygss{visibility:hidden\n}.collapse.svelte-1doygss{visibility:collapse\n}.absolute.svelte-1doygss{position:absolute\n}.relative.svelte-1doygss{position:relative\n}.left-0.svelte-1doygss{left:0px\n}.top-0.svelte-1doygss{top:0px\n}.m-0.svelte-1doygss{margin:0px\n}.mx-\\[1px\\].svelte-1doygss{margin-left:1px;margin-right:1px\n}.mt-2.svelte-1doygss{margin-top:0.5rem\n}.mt-3.svelte-1doygss{margin-top:0.75rem\n}.mt-7.svelte-1doygss{margin-top:1.75rem\n}.block.svelte-1doygss{display:block\n}.inline-block.svelte-1doygss{display:inline-block\n}.flex.svelte-1doygss{display:flex\n}.table.svelte-1doygss{display:table\n}.grid.svelte-1doygss{display:grid\n}.contents.svelte-1doygss{display:contents\n}.hidden.svelte-1doygss{display:none\n}.h-3.svelte-1doygss{height:0.75rem\n}.h-\\[6px\\].svelte-1doygss{height:6px\n}.w-3.svelte-1doygss{width:0.75rem\n}.w-\\[6px\\].svelte-1doygss{width:6px\n}.w-full.svelte-1doygss{width:100%\n}.w-max.svelte-1doygss{width:-moz-max-content;width:max-content\n}.flex-shrink.svelte-1doygss{flex-shrink:1\n}.border-collapse.svelte-1doygss{border-collapse:collapse\n}.transform.svelte-1doygss{transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.cursor-pointer.svelte-1doygss{cursor:pointer\n}.flex-wrap.svelte-1doygss{flex-wrap:wrap\n}.items-center.svelte-1doygss{align-items:center\n}.justify-between.svelte-1doygss{justify-content:space-between\n}.rounded-md.svelte-1doygss{border-radius:0.375rem\n}.bg-gray-100.svelte-1doygss{--tw-bg-opacity:1;background-color:rgb(243 244 246 / var(--tw-bg-opacity))\n}.p-1.svelte-1doygss{padding:0.25rem\n}.px-4.svelte-1doygss{padding-left:1rem;padding-right:1rem\n}.py-2.svelte-1doygss{padding-top:0.5rem;padding-bottom:0.5rem\n}.text-sm.svelte-1doygss{font-size:0.875rem;line-height:1.25rem\n}.text-xs.svelte-1doygss{font-size:0.75rem;line-height:1rem\n}.uppercase.svelte-1doygss{text-transform:uppercase\n}.capitalize.svelte-1doygss{text-transform:capitalize\n}.text-\\[--text-muted\\].svelte-1doygss{color:var(--text-muted)\n}.text-\\[--text-on-accent\\].svelte-1doygss{color:var(--text-on-accent)\n}.text-black.svelte-1doygss{--tw-text-opacity:1;color:rgb(0 0 0 / var(--tw-text-opacity))\n}.text-white.svelte-1doygss{--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity))\n}.opacity-0.svelte-1doygss{opacity:0\n}.filter.svelte-1doygss{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\n}.transition.svelte-1doygss{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms\n}.duration-300.svelte-1doygss{transition-duration:300ms\n}.hover\\:cursor-pointer.svelte-1doygss:hover{cursor:pointer\n}");
}

function create_fragment$9(ctx) {
	let svg;
	let circle;
	let circle_stroke_value;
	let circle_fill_value;
	let svg_class_value;

	return {
		c() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "stroke", circle_stroke_value = !/*isFilled*/ ctx[1] ? 'currentColor' : 'none');
			attr(circle, "fill", circle_fill_value = /*isFilled*/ ctx[1] ? 'currentColor' : 'none');
			attr(circle, "cx", "3");
			attr(circle, "cy", "3");
			attr(circle, "r", "2");
			attr(svg, "class", svg_class_value = "" + (null_to_empty(`${/*$$restProps*/ ctx[3].class} inline-block h-[6px] w-[6px] mx-[1px] ${/*isActive*/ ctx[2] ? 'text-[--text-on-accent]' : ''}`) + " svelte-1doygss"));
			set_style(svg, "color", /*color*/ ctx[0]);
			attr(svg, "viewBox", "0 0 6 6");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
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

			if (dirty & /*$$restProps, isActive*/ 12 && svg_class_value !== (svg_class_value = "" + (null_to_empty(`${/*$$restProps*/ ctx[3].class} inline-block h-[6px] w-[6px] mx-[1px] ${/*isActive*/ ctx[2] ? 'text-[--text-on-accent]' : ''}`) + " svelte-1doygss"))) {
				attr(svg, "class", svg_class_value);
			}

			if (dirty & /*color*/ 1) {
				set_style(svg, "color", /*color*/ ctx[0]);
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

function instance$9($$self, $$props, $$invalidate) {
	const omit_props_names = ["color","isFilled","isActive"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { color = '' } = $$props;
	let { isFilled = false } = $$props;
	let { isActive = false } = $$props;

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('color' in $$new_props) $$invalidate(0, color = $$new_props.color);
		if ('isFilled' in $$new_props) $$invalidate(1, isFilled = $$new_props.isFilled);
		if ('isActive' in $$new_props) $$invalidate(2, isActive = $$new_props.isActive);
	};

	return [color, isFilled, isActive, $$restProps];
}

class Dot extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, { color: 0, isFilled: 1, isActive: 2 }, add_css$9);
	}
}

/* src/calendar-ui/components/Day.svelte generated by Svelte v4.2.0 */

function add_css$8(target) {
	append_styles(target, "svelte-1fn1hj9", ".day.svelte-1fn1hj9{background-color:var(--color-background-day);border-radius:4px;color:var(--color-text-day);cursor:pointer;font-size:0.8em;height:100%;padding:4px;position:relative;text-align:center;transition:background-color 0.1s ease-in, color 0.1s ease-in;vertical-align:baseline}.day.svelte-1fn1hj9:hover{background-color:var(--interactive-hover)}.day.svelte-1fn1hj9:active{color:var(--text-on-accent);background-color:var(--interactive-accent)}");
}

function create_fragment$8(ctx) {
	let td;
	let button;
	let t_value = /*date*/ ctx[0].format('D') + "";
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			button = element("button");
			t = text(t_value);
			attr(button, "class", "day svelte-1fn1hj9");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t);

			if (!mounted) {
				dispose = [
					listen(button, "click", /*click_handler*/ ctx[2]),
					listen(button, "contextmenu", /*contextmenu_handler*/ ctx[3])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*date*/ 1 && t_value !== (t_value = /*date*/ ctx[0].format('D') + "")) set_data(t, t_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let { date } = $$props;

	// Global state
	getContext(IS_MOBILE);

	getContext(DISPLAYED_DATE);
	createEventDispatcher();
	const { eventHandlers } = getContext(VIEW);

	const click_handler = event => eventHandlers.onClick({
		date,
		isNewSplit: isMetaPressed(event),
		granularity: 'day'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({ date, event, granularity: 'day' });

	$$self.$$set = $$props => {
		if ('date' in $$props) $$invalidate(0, date = $$props.date);
	};

	return [date, eventHandlers, click_handler, contextmenu_handler];
}

class Day extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, not_equal, { date: 0 }, add_css$8);
	}
}

/* src/calendar-ui/components/WeekNum.svelte generated by Svelte v4.2.0 */

function add_css$7(target) {
	append_styles(target, "svelte-xfgncl", "td.svelte-xfgncl{border-right:1px solid var(--background-modifier-border)}");
}

function create_fragment$7(ctx) {
	let td;
	let button;
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			button = element("button");
			t = text(/*weekNum*/ ctx[0]);
			attr(button, "class", "day");
			attr(td, "class", "svelte-xfgncl");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t);

			if (!mounted) {
				dispose = [
					listen(button, "click", /*click_handler*/ ctx[3]),
					listen(button, "contextmenu", /*contextmenu_handler*/ ctx[4])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*weekNum*/ 1) set_data(t, /*weekNum*/ ctx[0]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let { weekNum } = $$props;
	let { startOfWeekDate } = $$props;

	// Global state;
	// export let selectedId: string = null;
	// let file: TFile | null;
	// let startOfWeek: Moment;
	// let metadata: Promise<IDayMetadata[]> | null;
	// const dispatch = createEventDispatcher();
	const { eventHandlers } = getContext(VIEW);

	const click_handler = event => eventHandlers.onClick({
		date: startOfWeekDate,
		isNewSplit: isMetaPressed(event),
		granularity: 'week'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({
		date: startOfWeekDate,
		event,
		granularity: 'week'
	});

	$$self.$$set = $$props => {
		if ('weekNum' in $$props) $$invalidate(0, weekNum = $$props.weekNum);
		if ('startOfWeekDate' in $$props) $$invalidate(1, startOfWeekDate = $$props.startOfWeekDate);
	};

	return [weekNum, startOfWeekDate, eventHandlers, click_handler, contextmenu_handler];
}

class WeekNum extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, not_equal, { weekNum: 0, startOfWeekDate: 1 }, add_css$7);
	}
}

/* src/calendar-ui/components/Arrow.svelte generated by Svelte v4.2.0 */

function add_css$6(target) {
	append_styles(target, "svelte-r6omsm", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.arrow.svelte-r6omsm.svelte-r6omsm{all:inherit;align-items:center;cursor:pointer;display:flex;justify-content:center;width:24px}.arrow.is-mobile.svelte-r6omsm.svelte-r6omsm{width:32px}.right.svelte-r6omsm.svelte-r6omsm{transform:rotate(180deg)}.arrow.svelte-r6omsm svg.svelte-r6omsm{color:var(--color-arrow);height:16px;width:16px}");
}

function create_fragment$6(ctx) {
	let button;
	let svg;
	let path;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			svg = svg_element("svg");
			path = svg_element("path");
			attr(path, "fill", "currentColor");
			attr(path, "d", "M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z");
			attr(svg, "focusable", "false");
			attr(svg, "role", "img");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "viewBox", "0 0 320 512");
			attr(svg, "class", "svelte-r6omsm");
			attr(button, "class", "arrow svelte-r6omsm");
			attr(button, "aria-label", /*tooltip*/ ctx[1]);
			toggle_class(button, "is-mobile", /*isMobile*/ ctx[3]);
			toggle_class(button, "right", /*direction*/ ctx[2] === 'right');
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, svg);
			append(svg, path);

			if (!mounted) {
				dispose = listen(button, "click", function () {
					if (is_function(/*onClick*/ ctx[0])) /*onClick*/ ctx[0].apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (dirty & /*tooltip*/ 2) {
				attr(button, "aria-label", /*tooltip*/ ctx[1]);
			}

			if (dirty & /*direction*/ 4) {
				toggle_class(button, "right", /*direction*/ ctx[2] === 'right');
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let { onClick } = $$props;
	let { tooltip } = $$props;
	let { direction } = $$props;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let isMobile = window.app.isMobile;

	$$self.$$set = $$props => {
		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
		if ('tooltip' in $$props) $$invalidate(1, tooltip = $$props.tooltip);
		if ('direction' in $$props) $$invalidate(2, direction = $$props.direction);
	};

	return [onClick, tooltip, direction, isMobile];
}

class Arrow extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { onClick: 0, tooltip: 1, direction: 2 }, add_css$6);
	}
}

/* src/calendar-ui/components/MonthNav.svelte generated by Svelte v4.2.0 */

function add_css$5(target) {
	append_styles(target, "svelte-1h7g43h", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.flex.svelte-1h7g43h{display:flex}.justify-between.svelte-1h7g43h{justify-content:space-between}.nav.svelte-1h7g43h{align-items:baseline;display:flex;margin:0.6em 0 1em;padding:0 8px;width:100%}.title.svelte-1h7g43h{color:var(--color-text-title);cursor:pointer;display:flex;font-size:1.4em;gap:0.3em;margin:0}.month.svelte-1h7g43h{font-weight:500}.year.svelte-1h7g43h{color:var(--interactive-accent)}.right-nav.svelte-1h7g43h{align-items:center;display:flex;justify-content:center;margin-left:auto}.reset-button.svelte-1h7g43h{all:inherit;cursor:pointer;align-items:center;color:var(--color-arrow);display:flex;opacity:0.4;padding:0.5em}.reset-button.active.svelte-1h7g43h{cursor:pointer;opacity:1}");
}

function create_fragment$5(ctx) {
	let div1;
	let button0;
	let span2;
	let span0;
	let t0_value = /*$displayedDate*/ ctx[0].format('MMMM') + "";
	let t0;
	let t1;
	let span1;
	let t2_value = /*$displayedDate*/ ctx[0].format('YYYY') + "";
	let t2;
	let t3;
	let div0;
	let arrow0;
	let t4;
	let button1;
	let dot;
	let button1_aria_label_value;
	let t5;
	let arrow1;
	let current;
	let mounted;
	let dispose;

	arrow0 = new Arrow({
			props: {
				direction: "left",
				onClick: /*decrementdisplayedDate*/ ctx[4],
				tooltip: "Previous Month"
			}
		});

	dot = new Dot({
			props: {
				class: "h-3 w-3",
				isFilled: /*showingCurrentMonth*/ ctx[1]
			}
		});

	arrow1 = new Arrow({
			props: {
				direction: "right",
				onClick: /*incrementdisplayedDate*/ ctx[5],
				tooltip: "Next Month"
			}
		});

	return {
		c() {
			div1 = element("div");
			button0 = element("button");
			span2 = element("span");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			t3 = space();
			div0 = element("div");
			create_component(arrow0.$$.fragment);
			t4 = space();
			button1 = element("button");
			create_component(dot.$$.fragment);
			t5 = space();
			create_component(arrow1.$$.fragment);
			attr(span0, "class", "month svelte-1h7g43h");
			attr(span1, "class", "year svelte-1h7g43h");
			attr(span2, "class", "flex justify-between title svelte-1h7g43h");
			set_style(button0, "all", "inherit");

			attr(button1, "aria-label", button1_aria_label_value = !/*showingCurrentMonth*/ ctx[1]
			? 'Reset to current month'
			: null);

			attr(button1, "class", "reset-button svelte-1h7g43h");
			toggle_class(button1, "active", /*showingCurrentMonth*/ ctx[1]);
			attr(div0, "class", "right-nav svelte-1h7g43h");
			attr(div1, "class", "nav svelte-1h7g43h");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, button0);
			append(button0, span2);
			append(span2, span0);
			append(span0, t0);
			append(span2, t1);
			append(span2, span1);
			append(span1, t2);
			append(div1, t3);
			append(div1, div0);
			mount_component(arrow0, div0, null);
			append(div0, t4);
			append(div0, button1);
			mount_component(dot, button1, null);
			append(div0, t5);
			mount_component(arrow1, div0, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[8]),
					listen(button1, "click", /*resetdisplayedDate*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*$displayedDate*/ 1) && t0_value !== (t0_value = /*$displayedDate*/ ctx[0].format('MMMM') + "")) set_data(t0, t0_value);
			if ((!current || dirty & /*$displayedDate*/ 1) && t2_value !== (t2_value = /*$displayedDate*/ ctx[0].format('YYYY') + "")) set_data(t2, t2_value);
			const dot_changes = {};
			if (dirty & /*showingCurrentMonth*/ 2) dot_changes.isFilled = /*showingCurrentMonth*/ ctx[1];
			dot.$set(dot_changes);

			if (!current || dirty & /*showingCurrentMonth*/ 2 && button1_aria_label_value !== (button1_aria_label_value = !/*showingCurrentMonth*/ ctx[1]
			? 'Reset to current month'
			: null)) {
				attr(button1, "aria-label", button1_aria_label_value);
			}

			if (!current || dirty & /*showingCurrentMonth*/ 2) {
				toggle_class(button1, "active", /*showingCurrentMonth*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(arrow0.$$.fragment, local);
			transition_in(dot.$$.fragment, local);
			transition_in(arrow1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(arrow0.$$.fragment, local);
			transition_out(dot.$$.fragment, local);
			transition_out(arrow1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(arrow0);
			destroy_component(dot);
			destroy_component(arrow1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let $displayedDate;
	let { today } = $$props;
	const { eventHandlers } = getContext(VIEW);
	let displayedDate = getContext(DISPLAYED_DATE);
	component_subscribe($$self, displayedDate, value => $$invalidate(0, $displayedDate = value));

	function decrementdisplayedDate() {
		let newYear = 0;

		displayedDate.update(date => {
			const newDate = date.clone().subtract(1, 'month');
			newYear = newDate.year();
			return newDate;
		});

		yearsRanges.updateRanges({ year: newYear, action: 'decrement' });
	}

	function incrementdisplayedDate() {
		let newYear = 0;

		displayedDate.update(date => {
			const newDate = date.clone().add(1, 'month');
			newYear = newDate.year();
			return newDate;
		});

		yearsRanges.updateRanges({ year: newYear, action: 'increment' });
	}

	function resetdisplayedDate() {
		yearsRanges.update(values => ({
			...values,
			crrRangeIndex: values.ranges.findIndex(range => range === values.todayRange)
		}));

		displayedDate.set(today.clone());
	}

	let showingCurrentMonth;

	const click_handler = event => eventHandlers.onClick({
		date: $displayedDate,
		isNewSplit: isMetaPressed(event),
		granularity: 'month'
	});

	$$self.$$set = $$props => {
		if ('today' in $$props) $$invalidate(7, today = $$props.today);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDate, today*/ 129) {
			$$invalidate(1, showingCurrentMonth = $displayedDate.isSame(today, 'month'));
		}
	};

	return [
		$displayedDate,
		showingCurrentMonth,
		eventHandlers,
		displayedDate,
		decrementdisplayedDate,
		incrementdisplayedDate,
		resetdisplayedDate,
		today,
		click_handler
	];
}

class MonthNav extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { today: 7 }, add_css$5);
	}
}

/* src/calendar-ui/components/YearNav.svelte generated by Svelte v4.2.0 */

function add_css$4(target) {
	append_styles(target, "svelte-1h7g43h", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.flex.svelte-1h7g43h{display:flex}.justify-between.svelte-1h7g43h{justify-content:space-between}.nav.svelte-1h7g43h{align-items:baseline;display:flex;margin:0.6em 0 1em;padding:0 8px;width:100%}.title.svelte-1h7g43h{color:var(--color-text-title);cursor:pointer;display:flex;font-size:1.4em;gap:0.3em;margin:0}.month.svelte-1h7g43h{font-weight:500}.year.svelte-1h7g43h{color:var(--interactive-accent)}.right-nav.svelte-1h7g43h{align-items:center;display:flex;justify-content:center;margin-left:auto}.reset-button.svelte-1h7g43h{all:inherit;cursor:pointer;align-items:center;color:var(--color-arrow);display:flex;opacity:0.4;padding:0.5em}.reset-button.active.svelte-1h7g43h{cursor:pointer;opacity:1}");
}

function create_fragment$4(ctx) {
	let div1;
	let button0;
	let span2;
	let span0;
	let t0_value = /*$displayedDate*/ ctx[0].format('YYYY') + "";
	let t0;
	let t1;
	let span1;
	let t2_value = (/*$yearsRanges*/ ctx[2].ranges?.[/*$yearsRanges*/ ctx[2].crrRangeIndex] || '') + "";
	let t2;
	let t3;
	let div0;
	let arrow0;
	let t4;
	let button1;
	let dot;
	let button1_aria_label_value;
	let t5;
	let arrow1;
	let current;
	let mounted;
	let dispose;

	arrow0 = new Arrow({
			props: {
				direction: "left",
				onClick: /*decrementdisplayedDate*/ ctx[5],
				tooltip: "Previous Year"
			}
		});

	dot = new Dot({
			props: {
				class: "h-3 w-3",
				isFilled: /*showingCurrentMonth*/ ctx[1]
			}
		});

	arrow1 = new Arrow({
			props: {
				direction: "right",
				onClick: /*incrementdisplayedDate*/ ctx[6],
				tooltip: "Next Year"
			}
		});

	return {
		c() {
			div1 = element("div");
			button0 = element("button");
			span2 = element("span");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			t3 = space();
			div0 = element("div");
			create_component(arrow0.$$.fragment);
			t4 = space();
			button1 = element("button");
			create_component(dot.$$.fragment);
			t5 = space();
			create_component(arrow1.$$.fragment);
			attr(span0, "class", "month svelte-1h7g43h");
			attr(span1, "class", "year svelte-1h7g43h");
			attr(span2, "class", "flex justify-between title svelte-1h7g43h");
			set_style(button0, "all", "inherit");

			attr(button1, "aria-label", button1_aria_label_value = !/*showingCurrentMonth*/ ctx[1]
			? 'Reset to current year'
			: null);

			attr(button1, "class", "reset-button svelte-1h7g43h");
			toggle_class(button1, "active", /*showingCurrentMonth*/ ctx[1]);
			attr(div0, "class", "right-nav svelte-1h7g43h");
			attr(div1, "class", "nav svelte-1h7g43h");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, button0);
			append(button0, span2);
			append(span2, span0);
			append(span0, t0);
			append(span2, t1);
			append(span2, span1);
			append(span1, t2);
			append(div1, t3);
			append(div1, div0);
			mount_component(arrow0, div0, null);
			append(div0, t4);
			append(div0, button1);
			mount_component(dot, button1, null);
			append(div0, t5);
			mount_component(arrow1, div0, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[9]),
					listen(button1, "click", /*resetdisplayedDate*/ ctx[7])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*$displayedDate*/ 1) && t0_value !== (t0_value = /*$displayedDate*/ ctx[0].format('YYYY') + "")) set_data(t0, t0_value);
			if ((!current || dirty & /*$yearsRanges*/ 4) && t2_value !== (t2_value = (/*$yearsRanges*/ ctx[2].ranges?.[/*$yearsRanges*/ ctx[2].crrRangeIndex] || '') + "")) set_data(t2, t2_value);
			const dot_changes = {};
			if (dirty & /*showingCurrentMonth*/ 2) dot_changes.isFilled = /*showingCurrentMonth*/ ctx[1];
			dot.$set(dot_changes);

			if (!current || dirty & /*showingCurrentMonth*/ 2 && button1_aria_label_value !== (button1_aria_label_value = !/*showingCurrentMonth*/ ctx[1]
			? 'Reset to current year'
			: null)) {
				attr(button1, "aria-label", button1_aria_label_value);
			}

			if (!current || dirty & /*showingCurrentMonth*/ 2) {
				toggle_class(button1, "active", /*showingCurrentMonth*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(arrow0.$$.fragment, local);
			transition_in(dot.$$.fragment, local);
			transition_in(arrow1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(arrow0.$$.fragment, local);
			transition_out(dot.$$.fragment, local);
			transition_out(arrow1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(arrow0);
			destroy_component(dot);
			destroy_component(arrow1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let $displayedDate;
	let $yearsRanges;
	component_subscribe($$self, yearsRanges, $$value => $$invalidate(2, $yearsRanges = $$value));
	let { today } = $$props;
	const { eventHandlers } = getContext(VIEW);
	let displayedDate = getContext(DISPLAYED_DATE);
	component_subscribe($$self, displayedDate, value => $$invalidate(0, $displayedDate = value));

	function decrementdisplayedDate() {
		let newYear = 0;

		displayedDate.update(date => {
			const newDate = date.clone().subtract(1, 'year');
			newYear = newDate.year();
			return newDate;
		});

		yearsRanges.updateRanges({ year: newYear, action: 'decrement' });
	}

	function incrementdisplayedDate() {
		let newYear = 0;

		displayedDate.update(date => {
			const newDate = date.clone().add(1, 'year');
			newYear = newDate.year();
			return newDate;
		});

		yearsRanges.updateRanges({ year: newYear, action: 'increment' });
	}

	function resetdisplayedDate() {
		yearsRanges.update(values => ({
			...values,
			crrRangeIndex: values.ranges.findIndex(range => range === values.todayRange)
		}));

		displayedDate.set(today.clone());
	}

	let showingCurrentMonth;

	const click_handler = event => eventHandlers.onClick({
		date: $displayedDate,
		isNewSplit: isMetaPressed(event),
		granularity: 'year'
	});

	$$self.$$set = $$props => {
		if ('today' in $$props) $$invalidate(8, today = $$props.today);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDate, today*/ 257) {
			$$invalidate(1, showingCurrentMonth = $displayedDate.isSame(today, 'year'));
		}
	};

	return [
		$displayedDate,
		showingCurrentMonth,
		$yearsRanges,
		eventHandlers,
		displayedDate,
		decrementdisplayedDate,
		incrementdisplayedDate,
		resetdisplayedDate,
		today,
		click_handler
	];
}

class YearNav extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { today: 8 }, add_css$4);
	}
}

/* src/calendar-ui/components/YearsNav.svelte generated by Svelte v4.2.0 */

function add_css$3(target) {
	append_styles(target, "svelte-1h7g43h", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.flex.svelte-1h7g43h{display:flex}.justify-between.svelte-1h7g43h{justify-content:space-between}.nav.svelte-1h7g43h{align-items:baseline;display:flex;margin:0.6em 0 1em;padding:0 8px;width:100%}.title.svelte-1h7g43h{color:var(--color-text-title);cursor:pointer;display:flex;font-size:1.4em;gap:0.3em;margin:0}.month.svelte-1h7g43h{font-weight:500}.right-nav.svelte-1h7g43h{align-items:center;display:flex;justify-content:center;margin-left:auto}.reset-button.svelte-1h7g43h{all:inherit;cursor:pointer;align-items:center;color:var(--color-arrow);display:flex;opacity:0.4;padding:0.5em}.reset-button.active.svelte-1h7g43h{cursor:pointer;opacity:1}");
}

function create_fragment$3(ctx) {
	let div1;
	let button0;
	let span1;
	let span0;
	let t0_value = /*$yearsRanges*/ ctx[2].ranges[/*$yearsRanges*/ ctx[2].crrRangeIndex] + "";
	let t0;
	let t1;
	let div0;
	let arrow0;
	let t2;
	let button1;
	let dot;
	let button1_aria_label_value;
	let t3;
	let arrow1;
	let current;
	let mounted;
	let dispose;

	arrow0 = new Arrow({
			props: {
				direction: "left",
				onClick: /*decrementdisplayedDate*/ ctx[5],
				tooltip: "Previous Year"
			}
		});

	dot = new Dot({
			props: {
				class: "h-3 w-3",
				isFilled: /*showingCurrentMonth*/ ctx[1]
			}
		});

	arrow1 = new Arrow({
			props: {
				direction: "right",
				onClick: /*incrementdisplayedDate*/ ctx[6],
				tooltip: "Next Year"
			}
		});

	return {
		c() {
			div1 = element("div");
			button0 = element("button");
			span1 = element("span");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			div0 = element("div");
			create_component(arrow0.$$.fragment);
			t2 = space();
			button1 = element("button");
			create_component(dot.$$.fragment);
			t3 = space();
			create_component(arrow1.$$.fragment);
			attr(span0, "class", "month svelte-1h7g43h");
			attr(span1, "class", "flex justify-between title svelte-1h7g43h");
			set_style(button0, "all", "inherit");

			attr(button1, "aria-label", button1_aria_label_value = !/*showingCurrentMonth*/ ctx[1]
			? 'Reset to current year'
			: null);

			attr(button1, "class", "reset-button svelte-1h7g43h");
			toggle_class(button1, "active", /*showingCurrentMonth*/ ctx[1]);
			attr(div0, "class", "right-nav svelte-1h7g43h");
			attr(div1, "class", "nav svelte-1h7g43h");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, button0);
			append(button0, span1);
			append(span1, span0);
			append(span0, t0);
			append(div1, t1);
			append(div1, div0);
			mount_component(arrow0, div0, null);
			append(div0, t2);
			append(div0, button1);
			mount_component(dot, button1, null);
			append(div0, t3);
			mount_component(arrow1, div0, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[9]),
					listen(button1, "click", /*resetdisplayedDate*/ ctx[7])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*$yearsRanges*/ 4) && t0_value !== (t0_value = /*$yearsRanges*/ ctx[2].ranges[/*$yearsRanges*/ ctx[2].crrRangeIndex] + "")) set_data(t0, t0_value);
			const dot_changes = {};
			if (dirty & /*showingCurrentMonth*/ 2) dot_changes.isFilled = /*showingCurrentMonth*/ ctx[1];
			dot.$set(dot_changes);

			if (!current || dirty & /*showingCurrentMonth*/ 2 && button1_aria_label_value !== (button1_aria_label_value = !/*showingCurrentMonth*/ ctx[1]
			? 'Reset to current year'
			: null)) {
				attr(button1, "aria-label", button1_aria_label_value);
			}

			if (!current || dirty & /*showingCurrentMonth*/ 2) {
				toggle_class(button1, "active", /*showingCurrentMonth*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(arrow0.$$.fragment, local);
			transition_in(dot.$$.fragment, local);
			transition_in(arrow1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(arrow0.$$.fragment, local);
			transition_out(dot.$$.fragment, local);
			transition_out(arrow1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(arrow0);
			destroy_component(dot);
			destroy_component(arrow1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let $displayedDate;
	let $yearsRanges;
	component_subscribe($$self, yearsRanges, $$value => $$invalidate(2, $yearsRanges = $$value));
	let { today } = $$props;
	const { eventHandlers } = getContext(VIEW);
	let displayedDate = getContext(DISPLAYED_DATE);
	component_subscribe($$self, displayedDate, value => $$invalidate(0, $displayedDate = value));

	function decrementdisplayedDate() {
		console.log('decrementdisplayedDate() > yearsRanges store: ', $yearsRanges);
		let newYear = 0;

		displayedDate.update(date => {
			const newDate = date.clone().subtract(YEARS_RANGE_SIZE, 'year');
			newYear = newDate.year();
			return newDate;
		});

		const prevRange = $yearsRanges.ranges[$yearsRanges.crrRangeIndex - 1];

		if (prevRange) {
			if ($yearsRanges.crrRangeIndex > 0) {
				yearsRanges.updateCrrRangeIndex({ modifier: -1 });
			}

			return;
		}

		yearsRanges.addNewRange({
			year: +newYear + YEARS_RANGE_SIZE - 1,
			action: 'decrement'
		});

		if ($yearsRanges.crrRangeIndex > 0) {
			yearsRanges.updateCrrRangeIndex({ modifier: -1 });
		}
	}

	function incrementdisplayedDate() {
		console.log('incrementedisplayedDate() > yearsRanges store: ', $yearsRanges);
		let newYear = 0;

		displayedDate.update(date => {
			const newDate = date.clone().add(YEARS_RANGE_SIZE, 'year');
			newYear = newDate.year();
			return newDate;
		});

		const nextRange = $yearsRanges.ranges[$yearsRanges.crrRangeIndex + 1];

		if (nextRange) {
			yearsRanges.updateCrrRangeIndex({ modifier: +1 });
			return;
		}

		yearsRanges.addNewRange({ year: +newYear, action: 'increment' });
		yearsRanges.updateCrrRangeIndex({ modifier: +1 });
	}

	function resetdisplayedDate() {
		yearsRanges.update(values => ({
			...values,
			crrRangeIndex: values.ranges.findIndex(range => range === values.todayRange)
		}));

		displayedDate.set(today.clone());
	}

	let showingCurrentMonth;

	const click_handler = event => eventHandlers.onClick({
		date: $displayedDate,
		isNewSplit: isMetaPressed(event),
		granularity: 'year'
	});

	$$self.$$set = $$props => {
		if ('today' in $$props) $$invalidate(8, today = $$props.today);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDate, today*/ 257) {
			$$invalidate(1, showingCurrentMonth = $displayedDate.isSame(today, 'year'));
		}
	};

	return [
		$displayedDate,
		showingCurrentMonth,
		$yearsRanges,
		eventHandlers,
		displayedDate,
		decrementdisplayedDate,
		incrementdisplayedDate,
		resetdisplayedDate,
		today,
		click_handler
	];
}

class YearsNav extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { today: 8 }, add_css$3);
	}
}

/* src/calendar-ui/components/Calendar.svelte generated by Svelte v4.2.0 */

function add_css$2(target) {
	append_styles(target, "svelte-11uyi9r", ".container.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{width:100%}@media(min-width: 640px){.container.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{max-width:640px}}@media(min-width: 768px){.container.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{max-width:768px}}@media(min-width: 1024px){.container.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{max-width:1024px}}@media(min-width: 1280px){.container.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{max-width:1280px}}@media(min-width: 1536px){.container.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{max-width:1536px}}.pointer-events-none.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{pointer-events:none}.visible.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{visibility:visible}.invisible.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{visibility:hidden}.collapse.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{visibility:collapse}.absolute.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{position:absolute}.relative.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{position:relative}.left-0.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{left:0px}.top-0.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{top:0px}.m-0.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{margin:0px}.mx-\\[1px\\].svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{margin-left:1px;margin-right:1px}.mt-2.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{margin-top:0.5rem}.mt-3.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{margin-top:0.75rem}.mt-7.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{margin-top:1.75rem}.block.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{display:block}.inline-block.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{display:inline-block}.flex.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{display:flex}.table.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{display:table}.grid.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{display:grid}.contents.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{display:contents}.hidden.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{display:none}.h-3.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{height:0.75rem}.h-\\[6px\\].svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{height:6px}.w-3.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{width:0.75rem}.w-\\[6px\\].svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{width:6px}.w-full.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{width:100%}.w-max.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{width:-moz-max-content;width:max-content}.flex-shrink.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{flex-shrink:1}.border-collapse.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{border-collapse:collapse}.transform.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.cursor-pointer.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{cursor:pointer}.flex-wrap.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{flex-wrap:wrap}.items-center.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{align-items:center}.justify-between.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{justify-content:space-between}.space-x-1.svelte-11uyi9r>.svelte-11uyi9r:not([hidden])~.svelte-11uyi9r:not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.25rem * var(--tw-space-x-reverse));margin-left:calc(0.25rem * calc(1 - var(--tw-space-x-reverse)))}.rounded-md.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{border-radius:0.375rem}.bg-gray-100.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{--tw-bg-opacity:1;background-color:rgb(243 244 246 / var(--tw-bg-opacity))}.p-1.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{padding:0.25rem}.px-4.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{padding-left:1rem;padding-right:1rem}.py-2.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{padding-top:0.5rem;padding-bottom:0.5rem}.text-sm.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{font-size:0.875rem;line-height:1.25rem}.text-xs.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{font-size:0.75rem;line-height:1rem}.uppercase.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{text-transform:uppercase}.capitalize.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{text-transform:capitalize}.text-\\[--text-muted\\].svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{color:var(--text-muted)}.text-\\[--text-on-accent\\].svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{color:var(--text-on-accent)}.text-black.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{--tw-text-opacity:1;color:rgb(0 0 0 / var(--tw-text-opacity))}.text-white.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity))}.opacity-0.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{opacity:0}.filter.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.duration-300.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{transition-duration:300ms}.container.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{--color-background-heading:transparent;--color-background-day:transparent;--color-background-weeknum:transparent;--color-background-weekend:transparent;--color-dot:var(--text-muted);--color-arrow:var(--text-muted);--color-button:var(--text-muted);--color-text-title:var(--text-normal);--color-text-heading:var(--text-muted);--color-text-day:var(--text-normal);--color-text-today:var(--interactive-accent);--color-text-weeknum:var(--text-muted);padding:0 8px}.weekend.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{background-color:var(--color-background-weekend)}.calendar.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{border-collapse:collapse;width:100%}th.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r{background-color:var(--color-background-heading);color:var(--color-text-heading);font-size:0.6em;letter-spacing:1px;padding:4px;text-align:center;text-transform:uppercase}.hover\\:cursor-pointer.svelte-11uyi9r.svelte-11uyi9r.svelte-11uyi9r:hover{cursor:pointer}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[18] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[21] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[24] = list[i];
	child_ctx[26] = i;
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[27] = list[i];
	return child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[30] = list[i];
	return child_ctx;
}

function get_each_context_5(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[33] = list[i];
	return child_ctx;
}

function get_each_context_6(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[36] = list[i];
	return child_ctx;
}

function get_each_context_7(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[39] = list[i];
	return child_ctx;
}

function get_each_context_8(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[42] = list[i];
	return child_ctx;
}

// (75:2) {#each togglePeriods as period}
function create_each_block_8(ctx) {
	let button;
	let t_value = capitalize(/*period*/ ctx[42]) + "";
	let t;
	let button_class_value;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[9](/*period*/ ctx[42]);
	}

	return {
		c() {
			button = element("button");
			t = text(t_value);

			attr(button, "class", button_class_value = "" + (null_to_empty(`w-full cursor-pointer rounded-md px-4 py-2 text-black ${/*crrView*/ ctx[1] === /*period*/ ctx[42]
			? 'bg-gray-100'
			: 'text-white'}`) + " svelte-11uyi9r"));
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, t);

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*crrView*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(`w-full cursor-pointer rounded-md px-4 py-2 text-black ${/*crrView*/ ctx[1] === /*period*/ ctx[42]
			? 'bg-gray-100'
			: 'text-white'}`) + " svelte-11uyi9r"))) {
				attr(button, "class", button_class_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

// (84:1) {#if crrView === 'days'}
function create_if_block_3(ctx) {
	let monthnav;
	let t0;
	let table;
	let colgroup;
	let t1;
	let t2;
	let thead;
	let tr;
	let t3;
	let t4;
	let tbody;
	let each_blocks = [];
	let each2_lookup = new Map();
	let current;
	monthnav = new MonthNav({ props: { today: window.moment() } });
	let if_block0 = /*showWeekNums*/ ctx[4] && create_if_block_6();
	let each_value_7 = ensure_array_like(/*month*/ ctx[2][1].days);
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_7.length; i += 1) {
		each_blocks_2[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
	}

	let if_block1 = /*showWeekNums*/ ctx[4] && create_if_block_5();
	let each_value_6 = ensure_array_like(/*localizedWeekdaysShort*/ ctx[3]);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_6.length; i += 1) {
		each_blocks_1[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
	}

	let each_value_4 = ensure_array_like(/*month*/ ctx[2]);
	const get_key = ctx => /*week*/ ctx[30].weekNum;

	for (let i = 0; i < each_value_4.length; i += 1) {
		let child_ctx = get_each_context_4(ctx, each_value_4, i);
		let key = get_key(child_ctx);
		each2_lookup.set(key, each_blocks[i] = create_each_block_4(key, child_ctx));
	}

	return {
		c() {
			create_component(monthnav.$$.fragment);
			t0 = space();
			table = element("table");
			colgroup = element("colgroup");
			if (if_block0) if_block0.c();
			t1 = space();

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			t2 = space();
			thead = element("thead");
			tr = element("tr");
			if (if_block1) if_block1.c();
			t3 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t4 = space();
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(table, "class", "calendar svelte-11uyi9r");
		},
		m(target, anchor) {
			mount_component(monthnav, target, anchor);
			insert(target, t0, anchor);
			insert(target, table, anchor);
			append(table, colgroup);
			if (if_block0) if_block0.m(colgroup, null);
			append(colgroup, t1);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				if (each_blocks_2[i]) {
					each_blocks_2[i].m(colgroup, null);
				}
			}

			append(table, t2);
			append(table, thead);
			append(thead, tr);
			if (if_block1) if_block1.m(tr, null);
			append(tr, t3);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				if (each_blocks_1[i]) {
					each_blocks_1[i].m(tr, null);
				}
			}

			append(table, t4);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tbody, null);
				}
			}

			current = true;
		},
		p(ctx, dirty) {
			if (/*showWeekNums*/ ctx[4]) {
				if (if_block0) ; else {
					if_block0 = create_if_block_6();
					if_block0.c();
					if_block0.m(colgroup, t1);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty[0] & /*month*/ 4) {
				each_value_7 = ensure_array_like(/*month*/ ctx[2][1].days);
				let i;

				for (i = 0; i < each_value_7.length; i += 1) {
					const child_ctx = get_each_context_7(ctx, each_value_7, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
					} else {
						each_blocks_2[i] = create_each_block_7(child_ctx);
						each_blocks_2[i].c();
						each_blocks_2[i].m(colgroup, null);
					}
				}

				for (; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].d(1);
				}

				each_blocks_2.length = each_value_7.length;
			}

			if (/*showWeekNums*/ ctx[4]) {
				if (if_block1) ; else {
					if_block1 = create_if_block_5();
					if_block1.c();
					if_block1.m(tr, t3);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty[0] & /*localizedWeekdaysShort*/ 8) {
				each_value_6 = ensure_array_like(/*localizedWeekdaysShort*/ ctx[3]);
				let i;

				for (i = 0; i < each_value_6.length; i += 1) {
					const child_ctx = get_each_context_6(ctx, each_value_6, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_6(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(tr, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_6.length;
			}

			if (dirty[0] & /*month, showWeekNums*/ 20) {
				each_value_4 = ensure_array_like(/*month*/ ctx[2]);
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_4, each2_lookup, tbody, outro_and_destroy_block, create_each_block_4, null, get_each_context_4);
				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(monthnav.$$.fragment, local);

			for (let i = 0; i < each_value_4.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(monthnav.$$.fragment, local);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(t0);
				detach(table);
			}

			destroy_component(monthnav, detaching);
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

// (88:4) {#if showWeekNums}
function create_if_block_6(ctx) {
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

// (91:4) {#each month[1].days as date}
function create_each_block_7(ctx) {
	let col;

	return {
		c() {
			col = element("col");
			attr(col, "class", "svelte-11uyi9r");
			toggle_class(col, "weekend", isWeekend(/*date*/ ctx[39]));
		},
		m(target, anchor) {
			insert(target, col, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*month*/ 4) {
				toggle_class(col, "weekend", isWeekend(/*date*/ ctx[39]));
			}
		},
		d(detaching) {
			if (detaching) {
				detach(col);
			}
		}
	};
}

// (97:5) {#if showWeekNums}
function create_if_block_5(ctx) {
	let th;

	return {
		c() {
			th = element("th");
			th.textContent = "W";
			attr(th, "class", "svelte-11uyi9r");
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

// (100:5) {#each localizedWeekdaysShort as dayOfWeek}
function create_each_block_6(ctx) {
	let th;
	let t_value = /*dayOfWeek*/ ctx[36] + "";
	let t;

	return {
		c() {
			th = element("th");
			t = text(t_value);
			attr(th, "class", "svelte-11uyi9r");
		},
		m(target, anchor) {
			insert(target, th, anchor);
			append(th, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*localizedWeekdaysShort*/ 8 && t_value !== (t_value = /*dayOfWeek*/ ctx[36] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(th);
			}
		}
	};
}

// (108:6) {#if showWeekNums}
function create_if_block_4(ctx) {
	let weeknum;
	let current;

	weeknum = new WeekNum({
			props: {
				weekNum: /*week*/ ctx[30].weekNum,
				startOfWeekDate: getStartOfWeek(/*week*/ ctx[30].days)
			}
		});

	return {
		c() {
			create_component(weeknum.$$.fragment);
		},
		m(target, anchor) {
			mount_component(weeknum, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const weeknum_changes = {};
			if (dirty[0] & /*month*/ 4) weeknum_changes.weekNum = /*week*/ ctx[30].weekNum;
			if (dirty[0] & /*month*/ 4) weeknum_changes.startOfWeekDate = getStartOfWeek(/*week*/ ctx[30].days);
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

// (113:6) {#each week.days as day (day.format())}
function create_each_block_5(key_1, ctx) {
	let first;
	let day_1;
	let current;
	day_1 = new Day({ props: { date: /*day*/ ctx[33] } });

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
			const day_1_changes = {};
			if (dirty[0] & /*month*/ 4) day_1_changes.date = /*day*/ ctx[33];
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

// (106:4) {#each month as week (week.weekNum)}
function create_each_block_4(key_1, ctx) {
	let tr;
	let t0;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t1;
	let current;
	let if_block = /*showWeekNums*/ ctx[4] && create_if_block_4(ctx);
	let each_value_5 = ensure_array_like(/*week*/ ctx[30].days);
	const get_key = ctx => /*day*/ ctx[33].format();

	for (let i = 0; i < each_value_5.length; i += 1) {
		let child_ctx = get_each_context_5(ctx, each_value_5, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block_5(key, child_ctx));
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

			if (/*showWeekNums*/ ctx[4]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*showWeekNums*/ 16) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_4(ctx);
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

			if (dirty[0] & /*month*/ 4) {
				each_value_5 = ensure_array_like(/*week*/ ctx[30].days);
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_5, each_1_lookup, tr, outro_and_destroy_block, create_each_block_5, t1, get_each_context_5);
				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);

			for (let i = 0; i < each_value_5.length; i += 1) {
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

// (121:1) {#if crrView === 'months'}
function create_if_block_1(ctx) {
	let yearnav;
	let t;
	let table;
	let tbody;
	let current;
	yearnav = new YearNav({ props: { today: window.moment() } });
	let each_value_2 = ensure_array_like(monthsIndexesInQuarters);
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	return {
		c() {
			create_component(yearnav.$$.fragment);
			t = space();
			table = element("table");
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(table, "class", "calendar svelte-11uyi9r");
		},
		m(target, anchor) {
			mount_component(yearnav, target, anchor);
			insert(target, t, anchor);
			insert(target, table, anchor);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tbody, null);
				}
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*eventHandlers, $displayedDate, showWeekNums*/ 81) {
				each_value_2 = ensure_array_like(monthsIndexesInQuarters);
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(tbody, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_2.length;
			}
		},
		i(local) {
			if (current) return;
			transition_in(yearnav.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(yearnav.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(t);
				detach(table);
			}

			destroy_component(yearnav, detaching);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (127:6) {#if showWeekNums}
function create_if_block_2(ctx) {
	let td;
	let button;
	let mounted;
	let dispose;

	function click_handler_1(...args) {
		return /*click_handler_1*/ ctx[10](/*i*/ ctx[26], ...args);
	}

	function contextmenu_handler(...args) {
		return /*contextmenu_handler*/ ctx[11](/*i*/ ctx[26], ...args);
	}

	return {
		c() {
			td = element("td");
			button = element("button");
			button.textContent = `Q${/*i*/ ctx[26] + 1}`;
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);

			if (!mounted) {
				dispose = [
					listen(button, "click", click_handler_1),
					listen(button, "contextmenu", contextmenu_handler)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (145:6) {#each quarterMonths as monthIndex}
function create_each_block_3(ctx) {
	let td;
	let button;
	let t_value = /*$displayedDate*/ ctx[0].month(/*monthIndex*/ ctx[27]).format('MMMM') + "";
	let t;
	let mounted;
	let dispose;

	function click_handler_2(...args) {
		return /*click_handler_2*/ ctx[12](/*monthIndex*/ ctx[27], ...args);
	}

	function contextmenu_handler_1(...args) {
		return /*contextmenu_handler_1*/ ctx[13](/*monthIndex*/ ctx[27], ...args);
	}

	return {
		c() {
			td = element("td");
			button = element("button");
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t);

			if (!mounted) {
				dispose = [
					listen(button, "click", click_handler_2),
					listen(button, "contextmenu", contextmenu_handler_1)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty[0] & /*$displayedDate*/ 1 && t_value !== (t_value = /*$displayedDate*/ ctx[0].month(/*monthIndex*/ ctx[27]).format('MMMM') + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (125:4) {#each monthsIndexesInQuarters as quarterMonths, i}
function create_each_block_2(ctx) {
	let tr;
	let t0;
	let t1;
	let if_block = /*showWeekNums*/ ctx[4] && create_if_block_2(ctx);
	let each_value_3 = ensure_array_like(/*quarterMonths*/ ctx[24]);
	let each_blocks = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	return {
		c() {
			tr = element("tr");
			if (if_block) if_block.c();
			t0 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
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
		},
		p(ctx, dirty) {
			if (/*showWeekNums*/ ctx[4]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					if_block.m(tr, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty[0] & /*eventHandlers, $displayedDate*/ 65) {
				each_value_3 = ensure_array_like(/*quarterMonths*/ ctx[24]);
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(tr, t1);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_3.length;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(tr);
			}

			if (if_block) if_block.d();
			destroy_each(each_blocks, detaching);
		}
	};
}

// (168:1) {#if crrView === 'years'}
function create_if_block$1(ctx) {
	let yearsnav;
	let t;
	let table;
	let tbody;
	let current;
	yearsnav = new YearsNav({ props: { today: window.moment() } });

	let each_value = ensure_array_like(getYears({
		startRangeYear: +/*$yearsRanges*/ ctx[5].ranges[/*$yearsRanges*/ ctx[5].crrRangeIndex].split('-')[0]
	}));

	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			create_component(yearsnav.$$.fragment);
			t = space();
			table = element("table");
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(table, "class", "calendar svelte-11uyi9r");
		},
		m(target, anchor) {
			mount_component(yearsnav, target, anchor);
			insert(target, t, anchor);
			insert(target, table, anchor);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tbody, null);
				}
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$yearsRanges, eventHandlers, $displayedDate*/ 97) {
				each_value = ensure_array_like(getYears({
					startRangeYear: +/*$yearsRanges*/ ctx[5].ranges[/*$yearsRanges*/ ctx[5].crrRangeIndex].split('-')[0]
				}));

				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(tbody, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i(local) {
			if (current) return;
			transition_in(yearsnav.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(yearsnav.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(t);
				detach(table);
			}

			destroy_component(yearsnav, detaching);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (174:6) {#each yearsRange as year}
function create_each_block_1(ctx) {
	let td;
	let button;
	let t_value = /*year*/ ctx[21] + "";
	let t;
	let mounted;
	let dispose;

	function click_handler_3(...args) {
		return /*click_handler_3*/ ctx[14](/*year*/ ctx[21], ...args);
	}

	function contextmenu_handler_2(...args) {
		return /*contextmenu_handler_2*/ ctx[15](/*year*/ ctx[21], ...args);
	}

	return {
		c() {
			td = element("td");
			button = element("button");
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t);

			if (!mounted) {
				dispose = [
					listen(button, "click", click_handler_3),
					listen(button, "contextmenu", contextmenu_handler_2)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty[0] & /*$yearsRanges*/ 32 && t_value !== (t_value = /*year*/ ctx[21] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (172:4) {#each getYears( { startRangeYear: +$yearsRanges.ranges[$yearsRanges.crrRangeIndex].split('-')[0] } ) as yearsRange}
function create_each_block(ctx) {
	let tr;
	let t;
	let each_value_1 = ensure_array_like(/*yearsRange*/ ctx[18]);
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	return {
		c() {
			tr = element("tr");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
		},
		m(target, anchor) {
			insert(target, tr, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tr, null);
				}
			}

			append(tr, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*eventHandlers, $displayedDate, $yearsRanges*/ 97) {
				each_value_1 = ensure_array_like(/*yearsRange*/ ctx[18]);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(tr, t);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(tr);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function create_fragment$2(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let t2;
	let current;
	let each_value_8 = ensure_array_like(togglePeriods);
	let each_blocks = [];

	for (let i = 0; i < each_value_8.length; i += 1) {
		each_blocks[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
	}

	let if_block0 = /*crrView*/ ctx[1] === 'days' && create_if_block_3(ctx);
	let if_block1 = /*crrView*/ ctx[1] === 'months' && create_if_block_1(ctx);
	let if_block2 = /*crrView*/ ctx[1] === 'years' && create_if_block$1(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			t2 = space();
			if (if_block2) if_block2.c();
			attr(div0, "class", "flex rounded-md space-x-1 p-1 w-full svelte-11uyi9r");
			attr(div1, "id", "calendar-container");
			attr(div1, "class", "container svelte-11uyi9r");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div0, null);
				}
			}

			append(div1, t0);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t1);
			if (if_block1) if_block1.m(div1, null);
			append(div1, t2);
			if (if_block2) if_block2.m(div1, null);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*crrView*/ 2) {
				each_value_8 = ensure_array_like(togglePeriods);
				let i;

				for (i = 0; i < each_value_8.length; i += 1) {
					const child_ctx = get_each_context_8(ctx, each_value_8, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_8(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div0, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_8.length;
			}

			if (/*crrView*/ ctx[1] === 'days') {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*crrView*/ 2) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_3(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div1, t1);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*crrView*/ ctx[1] === 'months') {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty[0] & /*crrView*/ 2) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div1, t2);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (/*crrView*/ ctx[1] === 'years') {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty[0] & /*crrView*/ 2) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$1(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div1, null);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block2);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block2);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_each(each_blocks, detaching);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let showWeekNums;
	let localizedWeekdaysShort;
	let month;
	let $settingsStore;
	let $displayedDate;
	let $yearsRanges;
	component_subscribe($$self, settingsStore, $$value => $$invalidate(8, $settingsStore = $$value));
	component_subscribe($$self, yearsRanges, $$value => $$invalidate(5, $yearsRanges = $$value));
	window.dayjs.extend(weekOfYear);
	window.dayjs.extend(isoWeek);
	const { app, eventHandlers } = getContext(VIEW);
	let displayedDate = writable(window.moment());
	component_subscribe($$self, displayedDate, value => $$invalidate(0, $displayedDate = value));
	setContext(DISPLAYED_DATE, displayedDate);
	let crrView = 'days';

	const reindexNotes = () => {
		granularities.forEach(granularity => {
			notesStores[granularity].reindex();
		});
	};

	const click_handler = period => $$invalidate(1, crrView = period);

	const click_handler_1 = (i, event) => eventHandlers.onClick({
		date: $displayedDate.quarter(i + 1).startOf('quarter'),
		isNewSplit: isMetaPressed(event),
		granularity: 'quarter'
	});

	const contextmenu_handler = (i, event) => eventHandlers.onContextMenu({
		date: $displayedDate.quarter(i + 1).startOf('quarter'),
		event,
		granularity: 'quarter'
	});

	const click_handler_2 = (monthIndex, event) => eventHandlers.onClick({
		date: $displayedDate.month(monthIndex).startOf('month'),
		isNewSplit: isMetaPressed(event),
		granularity: 'month'
	});

	const contextmenu_handler_1 = (monthIndex, event) => eventHandlers.onContextMenu({
		date: $displayedDate.month(monthIndex).startOf('month'),
		event,
		granularity: 'month'
	});

	const click_handler_3 = (year, event) => eventHandlers.onClick({
		date: $displayedDate.year(year).startOf('year'),
		isNewSplit: isMetaPressed(event),
		granularity: 'year'
	});

	const contextmenu_handler_2 = (year, event) => eventHandlers.onContextMenu({
		date: $displayedDate.year(year).startOf('year'),
		event,
		granularity: 'year'
	});

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*$settingsStore*/ 256) {
			$$invalidate(4, { localeData: { showWeekNums, localizedWeekdaysShort } } = $settingsStore, showWeekNums, ($$invalidate(3, localizedWeekdaysShort), $$invalidate(8, $settingsStore)));
		}

		if ($$self.$$.dirty[0] & /*$displayedDate*/ 1) {
			$$invalidate(2, month = getMonth($displayedDate));
		}

		if ($$self.$$.dirty[0] & /*$settingsStore*/ 256) {
			// let hoverTimeout: number;
			// let showPopover: boolean = false;
			// let popoverMetadata: IDayMetadata[];
			// let hoveredDay = writable<HTMLElement>(null);
			// const fileCache = new PeriodicNotesCache(plugin);
			// function openPopover() {
			//   showPopover = true;
			// }
			// function updatePopover(event: CustomEvent) {
			//   const { metadata, target } = event.detail;
			//   if (!showPopover) {
			//     window.clearTimeout(hoverTimeout);
			//     hoverTimeout = window.setTimeout(() => {
			//       if ($hoveredDay === target) {
			//         openPopover(); }
			//     }, 750);
			//   }
			//   if ($hoveredDay !== target) {
			//     hoveredDay.set(target);
			//     popoverMetadata = metadata;
			//   }
			// }
			// const dismissPopover = debounce(
			//   (event: CustomEvent) => {
			//     // if the user didn't hover onto another day
			//     if ($hoveredDay === event.detail.target) {
			//       hoveredDay.set(null);
			//       showPopover = false;
			//     }
			//   },
			//   250,
			//   true
			// );
			(reindexNotes());
		}
	};

	return [
		$displayedDate,
		crrView,
		month,
		localizedWeekdaysShort,
		showWeekNums,
		$yearsRanges,
		eventHandlers,
		displayedDate,
		$settingsStore,
		click_handler,
		click_handler_1,
		contextmenu_handler,
		click_handler_2,
		contextmenu_handler_1,
		click_handler_3,
		contextmenu_handler_2
	];
}

class Calendar extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, add_css$2, [-1, -1]);
	}
}

/* src/View.svelte generated by Svelte v4.2.0 */

function add_css$1(target) {
	append_styles(target, "svelte-1doygss", ".container.svelte-1doygss{width:100%\n}@media(min-width: 640px){.container.svelte-1doygss{max-width:640px\n    }}@media(min-width: 768px){.container.svelte-1doygss{max-width:768px\n    }}@media(min-width: 1024px){.container.svelte-1doygss{max-width:1024px\n    }}@media(min-width: 1280px){.container.svelte-1doygss{max-width:1280px\n    }}@media(min-width: 1536px){.container.svelte-1doygss{max-width:1536px\n    }}.pointer-events-none.svelte-1doygss{pointer-events:none\n}.visible.svelte-1doygss{visibility:visible\n}.invisible.svelte-1doygss{visibility:hidden\n}.collapse.svelte-1doygss{visibility:collapse\n}.absolute.svelte-1doygss{position:absolute\n}.relative.svelte-1doygss{position:relative\n}.left-0.svelte-1doygss{left:0px\n}.top-0.svelte-1doygss{top:0px\n}.m-0.svelte-1doygss{margin:0px\n}.mx-\\[1px\\].svelte-1doygss{margin-left:1px;margin-right:1px\n}.mt-2.svelte-1doygss{margin-top:0.5rem\n}.mt-3.svelte-1doygss{margin-top:0.75rem\n}.mt-7.svelte-1doygss{margin-top:1.75rem\n}.block.svelte-1doygss{display:block\n}.inline-block.svelte-1doygss{display:inline-block\n}.flex.svelte-1doygss{display:flex\n}.table.svelte-1doygss{display:table\n}.grid.svelte-1doygss{display:grid\n}.contents.svelte-1doygss{display:contents\n}.hidden.svelte-1doygss{display:none\n}.h-3.svelte-1doygss{height:0.75rem\n}.h-\\[6px\\].svelte-1doygss{height:6px\n}.w-3.svelte-1doygss{width:0.75rem\n}.w-\\[6px\\].svelte-1doygss{width:6px\n}.w-full.svelte-1doygss{width:100%\n}.w-max.svelte-1doygss{width:-moz-max-content;width:max-content\n}.flex-shrink.svelte-1doygss{flex-shrink:1\n}.border-collapse.svelte-1doygss{border-collapse:collapse\n}.transform.svelte-1doygss{transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.cursor-pointer.svelte-1doygss{cursor:pointer\n}.flex-wrap.svelte-1doygss{flex-wrap:wrap\n}.items-center.svelte-1doygss{align-items:center\n}.justify-between.svelte-1doygss{justify-content:space-between\n}.rounded-md.svelte-1doygss{border-radius:0.375rem\n}.bg-gray-100.svelte-1doygss{--tw-bg-opacity:1;background-color:rgb(243 244 246 / var(--tw-bg-opacity))\n}.p-1.svelte-1doygss{padding:0.25rem\n}.px-4.svelte-1doygss{padding-left:1rem;padding-right:1rem\n}.py-2.svelte-1doygss{padding-top:0.5rem;padding-bottom:0.5rem\n}.text-sm.svelte-1doygss{font-size:0.875rem;line-height:1.25rem\n}.text-xs.svelte-1doygss{font-size:0.75rem;line-height:1rem\n}.uppercase.svelte-1doygss{text-transform:uppercase\n}.capitalize.svelte-1doygss{text-transform:capitalize\n}.text-\\[--text-muted\\].svelte-1doygss{color:var(--text-muted)\n}.text-\\[--text-on-accent\\].svelte-1doygss{color:var(--text-on-accent)\n}.text-black.svelte-1doygss{--tw-text-opacity:1;color:rgb(0 0 0 / var(--tw-text-opacity))\n}.text-white.svelte-1doygss{--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity))\n}.opacity-0.svelte-1doygss{opacity:0\n}.filter.svelte-1doygss{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\n}.transition.svelte-1doygss{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms\n}.duration-300.svelte-1doygss{transition-duration:300ms\n}.hover\\:cursor-pointer.svelte-1doygss:hover{cursor:pointer\n}");
}

function create_fragment$1(ctx) {
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
			attr(div, "class", div_class_value = "" + (null_to_empty(clsx(/*popup*/ ctx[0] && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')) + " svelte-1doygss"));
			attr(div, "data-popup", div_data_popup_value = /*popup*/ ctx[0] && 'calendarPopup');
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(calendar, div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*popup*/ 1 && div_class_value !== (div_class_value = "" + (null_to_empty(clsx(/*popup*/ ctx[0] && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')) + " svelte-1doygss"))) {
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

function instance$1($$self, $$props, $$invalidate) {
	let { popup = false } = $$props;

	$$self.$$set = $$props => {
		if ('popup' in $$props) $$invalidate(0, popup = $$props.popup);
	};

	return [popup];
}

class View extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { popup: 0 }, add_css$1);
	}
}

/* src/calendar-ui/components/ConfirmationModal.svelte generated by Svelte v4.2.0 */

function add_css(target) {
	append_styles(target, "svelte-1doygss", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.m-0.svelte-1doygss{margin:0px\n}.mt-2.svelte-1doygss{margin-top:0.5rem\n}.mt-3.svelte-1doygss{margin-top:0.75rem\n}.mt-7.svelte-1doygss{margin-top:1.75rem\n}.flex.svelte-1doygss{display:flex\n}.items-center.svelte-1doygss{align-items:center\n}.text-sm.svelte-1doygss{font-size:0.875rem;line-height:1.25rem\n}.text-xs.svelte-1doygss{font-size:0.75rem;line-height:1rem\n}.text-\\[--text-muted\\].svelte-1doygss{color:var(--text-muted)\n}.hover\\:cursor-pointer.svelte-1doygss:hover{cursor:pointer\n}");
}

// (36:1) {#if note}
function create_if_block(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = `${/*note*/ ctx[3]}`;
			attr(p, "class", "m-0 mt-2 text-xs text-[--text-muted] svelte-1doygss");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

function create_fragment(ctx) {
	let div1;
	let h2;
	let t1;
	let p;
	let t3;
	let label;
	let input;
	let t4;
	let t5;
	let t6;
	let div0;
	let button0;
	let t8;
	let button1;
	let mounted;
	let dispose;
	let if_block = /*note*/ ctx[3] && create_if_block(ctx);

	return {
		c() {
			div1 = element("div");
			h2 = element("h2");
			h2.textContent = `${/*title*/ ctx[1]}`;
			t1 = space();
			p = element("p");
			p.textContent = `${/*text*/ ctx[2]}`;
			t3 = space();
			label = element("label");
			input = element("input");
			t4 = text(" Don't show\n\t\tagain");
			t5 = space();
			if (if_block) if_block.c();
			t6 = space();
			div0 = element("div");
			button0 = element("button");
			button0.textContent = "Never mind";
			t8 = space();
			button1 = element("button");
			button1.textContent = `${/*cta*/ ctx[4]}`;
			attr(input, "type", "checkbox");
			attr(input, "class", "hover:cursor-pointer svelte-1doygss");
			attr(label, "class", "flex items-center hover:cursor-pointer text-sm mt-7 svelte-1doygss");
			attr(button1, "class", "mod-cta");
			attr(div0, "class", "modal-button-container mt-3 svelte-1doygss");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, h2);
			append(div1, t1);
			append(div1, p);
			append(div1, t3);
			append(div1, label);
			append(label, input);
			input.checked = /*dontConfirmAgain*/ ctx[0];
			append(label, t4);
			append(div1, t5);
			if (if_block) if_block.m(div1, null);
			append(div1, t6);
			append(div1, div0);
			append(div0, button0);
			append(div0, t8);
			append(div0, button1);

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_handler*/ ctx[9]),
					listen(button0, "click", /*handleCancel*/ ctx[5]),
					listen(button1, "click", /*handleAccept*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*dontConfirmAgain*/ 1) {
				input.checked = /*dontConfirmAgain*/ ctx[0];
			}

			if (/*note*/ ctx[3]) if_block.p(ctx, dirty);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { config } = $$props;
	let { modalClass } = $$props;
	const { title, text, note, cta, onAccept } = config;
	let dontConfirmAgain = false;

	const shouldConfirmBeforeCreate = async () => {
		if (dontConfirmAgain && window.plugin) {
			settingsStore.update(oldSettings => {
				const newSettings = {
					...oldSettings,
					shouldConfirmBeforeCreate: false
				};

				return newSettings;
			});

			await window.plugin.saveData(get_store_value(settingsStore));
		}
	};

	const handleCancel = async () => {
		modalClass.close();
	};

	const handleAccept = async () => {
		modalClass.close();
		await onAccept();
		await shouldConfirmBeforeCreate();
	};

	function input_change_handler() {
		dontConfirmAgain = this.checked;
		$$invalidate(0, dontConfirmAgain);
	}

	$$self.$$set = $$props => {
		if ('config' in $$props) $$invalidate(7, config = $$props.config);
		if ('modalClass' in $$props) $$invalidate(8, modalClass = $$props.modalClass);
	};

	return [
		dontConfirmAgain,
		title,
		text,
		note,
		cta,
		handleCancel,
		handleAccept,
		config,
		modalClass,
		input_change_handler
	];
}

let ConfirmationModal$1 = class ConfirmationModal extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { config: 7, modalClass: 8 }, add_css);
	}
};

class ConfirmationModal extends obsidian.Modal {
    constructor(config) {
        super(window.app);
        const { contentEl } = this;
        // Create a div to mount the Svelte component
        const svelteContainer = contentEl.createDiv();
        // Instantiate the Svelte component
        new ConfirmationModal$1({
            target: svelteContainer,
            props: {
                config,
                modalClass: this
            }
        });
    }
}
function createConfirmationDialog(params) {
    new ConfirmationModal(params).open();
}

const VIEW_TYPE_CALENDAR = 'calendar';
class CalendarView extends obsidian.ItemView {
    view;
    settings;
    constructor(leaf) {
        super(leaf);
        this.registerEvent(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.app.workspace.on('periodic-notes:settings-updated', this.onNoteSettingsUpdate));
        this.registerEvent(this.app.vault.on('create', (file) => this.onFileCreated(file)));
        this.registerEvent(this.app.vault.on('delete', (file) => this.onFileDeleted(file)));
        this.registerEvent(this.app.vault.on('modify', (file) => this.onFileModified(file)));
        this.registerEvent(this.app.workspace.on('file-open', () => this.onFileOpen()));
        this.register(settingsStore.subscribe((settings) => {
            console.log('SUBSCRIBED TO settingsStore ⚙️: ', get_store_value(settingsStore));
            this.settings = settings;
        }));
    }
    onClose() {
        console.log('On close view❌');
        if (this.view) {
            this.view.$destroy();
        }
        return Promise.resolve();
    }
    getViewType() {
        return VIEW_TYPE_CALENDAR;
    }
    getDisplayText() {
        return 'Example view';
    }
    async onOpen() {
        console.log('On open view👐');
        const context = new Map();
        context.set(VIEW, {
            app: this.app,
            eventHandlers: {
                onClick: this.onClick.bind(this),
                onHover: this.onHover.bind(this),
                onContextMenu: this.onContextMenu.bind(this)
            }
        });
        this.view = new View({
            target: this.contentEl,
            context
        });
    }
    // app.workspace and app.vault event handlers
    onNoteSettingsUpdate() {
        granularities.forEach((granularity) => {
            notesStores[granularity].reindex();
        });
        this.updateActiveFile();
    }
    async onFileDeleted(file) {
        granularities.forEach((granularity) => {
            if (getDateFromFile(file, granularity)) {
                notesStores[granularity].reindex();
            }
        });
        this.updateActiveFile();
    }
    async onFileModified(file) {
        const date = getDateFromFile(file, 'day') || getDateFromFile(file, 'week');
        if (date && this.view) ;
    }
    onFileCreated(file) {
        console.log('onFileCreated() > file: ', file);
        if (this.app.workspace.layoutReady && this.view) {
            // do this ifs for every single granularity
            granularities.forEach((granularity) => {
                // only add new note from notes folder to store if a date can be obtained from filename
                if (getDateFromFile(file, granularity)) {
                    notesStores[granularity].reindex();
                    // this.view.tick();
                }
            });
        }
    }
    onFileOpen() {
        if (this.app.workspace.layoutReady) {
            this.updateActiveFile();
        }
    }
    // Component event handlers
    async onClick({ date, isNewSplit, granularity }) {
        const { workspace } = window.app;
        const leaf = isNewSplit ? workspace.splitActiveLeaf() : workspace.getUnpinnedLeaf();
        const openFile = async (file) => {
            file && (await leaf.openFile(file));
            activeFile.setFile(getDateUID(date, granularity));
        };
        let file = getNoteByGranularity({ date, granularity });
        if (!file) {
            const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
            const { format } = getNoteSettingsByGranularity(granularity);
            const formattedDate = date.format(format);
            if (this.settings.shouldConfirmBeforeCreate) {
                createConfirmationDialog({
                    title: `New ${periodicity} Note`,
                    text: `File ${formattedDate} does not exist. Would you like to create it?`,
                    note: getOnCreateNoteDialogNoteFromGranularity(granularity),
                    cta: 'Create',
                    onAccept: async () => {
                        file = await noteCreator[granularity](date);
                        file && (await openFile(file));
                        return file;
                    }
                });
            }
            else {
                file = await noteCreator[granularity](date);
                file && (await openFile(file));
            }
        }
        else {
            file && (await openFile(file));
        }
    }
    onHover({ date, targetEl, isMetaPressed, granularity }) {
        if (!isMetaPressed) {
            return;
        }
        const { format } = getNoteSettingsByGranularity(granularity);
        const note = getNoteByGranularity({ date, granularity });
        this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);
    }
    onContextMenu({ date, event, granularity }) {
        const note = getNoteByGranularity({ date, granularity });
        if (!note) {
            // If no file exists for a given day, show nothing.
            return;
        }
        const fileMenu = new obsidian.Menu();
        fileMenu.addItem((item) => item
            .setTitle('Delete')
            .setIcon('trash')
            .onClick(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            app.fileManager.promptForFileDeletion(note);
        }));
        app.workspace.trigger('file-menu', fileMenu, note, 'calendar-context-menu', null);
        fileMenu.showAtPosition({
            x: event.pageX,
            y: event.pageY
        });
    }
    // Utils
    updateActiveFile() {
        console.log('CalendarView > on(periodic-notes:settings-updated) > updateActiveFile()');
        // get activeLeaf view
        const activeLeaf = this.app.workspace.activeLeaf;
        let file = null;
        if (activeLeaf?.view && activeLeaf?.view instanceof obsidian.FileView) {
            // extract file from view
            file = activeLeaf.view.file;
            if (file) {
                let noteDate = null;
                let noteGranularity = null;
                for (const granularity of granularities) {
                    const date = getDateFromFile(file, granularity);
                    if (date) {
                        noteDate = date;
                        noteGranularity = granularity;
                        break;
                    }
                }
                // save file in store activeFile
                if (noteDate && noteGranularity) {
                    activeFile.setFile(getDateUID(noteDate, noteGranularity));
                    this.view && this.view.tick();
                }
            }
        }
    }
}

class DailyNoteFlexPlugin extends obsidian.Plugin {
    settings;
    popupCalendar;
    cleanupPopup;
    onunload() {
        console.log('ON Unload ⛰️');
        this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).forEach((leaf) => leaf.detach());
        this.cleanupPopup && this.cleanupPopup();
        this.removeLocaleScripts();
        window.plugin = null;
    }
    async onload() {
        console.log('ON Load 🫵');
        window.plugin = this; // access plugin methods globally
        this.register(settingsStore.subscribe((settings) => {
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
            this.handlePopup();
        });
    }
    async loadSettings() {
        const settings = await this.loadData();
        console.log('main > loadSettings: settings from this.loadData()', settings);
        !settings && (await this.saveData(DEFAULT_SETTINGS));
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
        this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf));
        // TODO: Try to not block initial loading by deferring loading with 'onLayoutReady'
        // activate view
        await this.initView();
    }
    async initView({ active } = { active: true }) {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
        await this.app.workspace.getLeftLeaf(false).setViewState({
            type: VIEW_TYPE_CALENDAR,
            active
        });
    }
    revealView() {
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0]);
        this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0].setViewState({
            type: VIEW_TYPE_CALENDAR,
            active: true
        });
    }
    async toggleView() {
        const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0];
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
