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
const DISPLAYED_MONTH = Symbol("displayedMonth");
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
function getMonth(displayedMonth) {
    const locale = window.moment().locale();
    const month = [];
    let week = { days: [], weekNum: 0 };
    const startOfMonth = displayedMonth.clone().locale(locale).date(1);
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
// export const periodicities = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const

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

/* src/calendar-ui/components/Dot.svelte generated by Svelte v4.2.0 */

function add_css$8(target) {
	append_styles(target, "svelte-hy1a6n", ".container.svelte-hy1a6n{width:100%\n}@media(min-width: 640px){.container.svelte-hy1a6n{max-width:640px\n    }}@media(min-width: 768px){.container.svelte-hy1a6n{max-width:768px\n    }}@media(min-width: 1024px){.container.svelte-hy1a6n{max-width:1024px\n    }}@media(min-width: 1280px){.container.svelte-hy1a6n{max-width:1280px\n    }}@media(min-width: 1536px){.container.svelte-hy1a6n{max-width:1536px\n    }}.pointer-events-none.svelte-hy1a6n{pointer-events:none\n}.visible.svelte-hy1a6n{visibility:visible\n}.invisible.svelte-hy1a6n{visibility:hidden\n}.collapse.svelte-hy1a6n{visibility:collapse\n}.absolute.svelte-hy1a6n{position:absolute\n}.relative.svelte-hy1a6n{position:relative\n}.left-0.svelte-hy1a6n{left:0px\n}.top-0.svelte-hy1a6n{top:0px\n}.m-0.svelte-hy1a6n{margin:0px\n}.mx-\\[1px\\].svelte-hy1a6n{margin-left:1px;margin-right:1px\n}.mt-2.svelte-hy1a6n{margin-top:0.5rem\n}.mt-3.svelte-hy1a6n{margin-top:0.75rem\n}.mt-7.svelte-hy1a6n{margin-top:1.75rem\n}.block.svelte-hy1a6n{display:block\n}.inline-block.svelte-hy1a6n{display:inline-block\n}.flex.svelte-hy1a6n{display:flex\n}.table.svelte-hy1a6n{display:table\n}.grid.svelte-hy1a6n{display:grid\n}.contents.svelte-hy1a6n{display:contents\n}.hidden.svelte-hy1a6n{display:none\n}.h-3.svelte-hy1a6n{height:0.75rem\n}.h-\\[6px\\].svelte-hy1a6n{height:6px\n}.w-3.svelte-hy1a6n{width:0.75rem\n}.w-\\[6px\\].svelte-hy1a6n{width:6px\n}.w-max.svelte-hy1a6n{width:-moz-max-content;width:max-content\n}.flex-shrink.svelte-hy1a6n{flex-shrink:1\n}.border-collapse.svelte-hy1a6n{border-collapse:collapse\n}.transform.svelte-hy1a6n{transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.flex-wrap.svelte-hy1a6n{flex-wrap:wrap\n}.items-center.svelte-hy1a6n{align-items:center\n}.text-sm.svelte-hy1a6n{font-size:0.875rem;line-height:1.25rem\n}.text-xs.svelte-hy1a6n{font-size:0.75rem;line-height:1rem\n}.uppercase.svelte-hy1a6n{text-transform:uppercase\n}.capitalize.svelte-hy1a6n{text-transform:capitalize\n}.text-\\[--text-muted\\].svelte-hy1a6n{color:var(--text-muted)\n}.text-\\[--text-on-accent\\].svelte-hy1a6n{color:var(--text-on-accent)\n}.opacity-0.svelte-hy1a6n{opacity:0\n}.filter.svelte-hy1a6n{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\n}.transition.svelte-hy1a6n{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms\n}.duration-300.svelte-hy1a6n{transition-duration:300ms\n}.hover\\:cursor-pointer.svelte-hy1a6n:hover{cursor:pointer\n}");
}

function create_fragment$8(ctx) {
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
			attr(svg, "class", svg_class_value = "" + (null_to_empty(`${/*$$restProps*/ ctx[3].class} inline-block h-[6px] w-[6px] mx-[1px] ${/*isActive*/ ctx[2] ? 'text-[--text-on-accent]' : ''}`) + " svelte-hy1a6n"));
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

			if (dirty & /*$$restProps, isActive*/ 12 && svg_class_value !== (svg_class_value = "" + (null_to_empty(`${/*$$restProps*/ ctx[3].class} inline-block h-[6px] w-[6px] mx-[1px] ${/*isActive*/ ctx[2] ? 'text-[--text-on-accent]' : ''}`) + " svelte-hy1a6n"))) {
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

function instance$8($$self, $$props, $$invalidate) {
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
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { color: 0, isFilled: 1, isActive: 2 }, add_css$8);
	}
}

/* src/calendar-ui/components/Day.svelte generated by Svelte v4.2.0 */

function add_css$7(target) {
	append_styles(target, "svelte-1fn1hj9", ".day.svelte-1fn1hj9{background-color:var(--color-background-day);border-radius:4px;color:var(--color-text-day);cursor:pointer;font-size:0.8em;height:100%;padding:4px;position:relative;text-align:center;transition:background-color 0.1s ease-in, color 0.1s ease-in;vertical-align:baseline}.day.svelte-1fn1hj9:hover{background-color:var(--interactive-hover)}.day.svelte-1fn1hj9:active{color:var(--text-on-accent);background-color:var(--interactive-accent)}");
}

function create_fragment$7(ctx) {
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
				dispose = listen(button, "click", /*click_handler*/ ctx[2]);
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
			dispose();
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let { date } = $$props;

	// Global state
	getContext(IS_MOBILE);

	getContext(DISPLAYED_MONTH);
	createEventDispatcher();
	const { eventHandlers } = getContext(VIEW);

	const click_handler = event => eventHandlers.onClick({
		date,
		isNewSplit: isMetaPressed(event),
		granularity: 'day'
	});

	$$self.$$set = $$props => {
		if ('date' in $$props) $$invalidate(0, date = $$props.date);
	};

	return [date, eventHandlers, click_handler];
}

class Day extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, not_equal, { date: 0 }, add_css$7);
	}
}

/* src/calendar-ui/components/Arrow.svelte generated by Svelte v4.2.0 */

function add_css$6(target) {
	append_styles(target, "svelte-ecm1o", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.arrow.svelte-ecm1o.svelte-ecm1o{all:inherit;align-items:center;cursor:pointer;display:flex;justify-content:center;width:24px}.arrow.is-mobile.svelte-ecm1o.svelte-ecm1o{width:32px}.right.svelte-ecm1o.svelte-ecm1o{transform:rotate(180deg)}.arrow.svelte-ecm1o svg.svelte-ecm1o{color:var(--color-arrow);height:16px;width:16px}");
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
			attr(svg, "class", "svelte-ecm1o");
			attr(button, "class", "arrow svelte-ecm1o");
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

/* src/calendar-ui/components/Month.svelte generated by Svelte v4.2.0 */

function add_css$5(target) {
	append_styles(target, "svelte-lbaehh", ".title.svelte-lbaehh{color:var(--color-text-title);cursor:pointer;display:flex;font-size:1.4em;gap:0.3em;margin:0}.month.svelte-lbaehh{font-weight:500}.year.svelte-lbaehh{color:var(--interactive-accent)}");
}

function create_fragment$5(ctx) {
	let button;
	let span2;
	let span0;
	let t0_value = /*$displayedMonth*/ ctx[0].format('MMM') + "";
	let t0;
	let t1;
	let span1;
	let t2_value = /*$displayedMonth*/ ctx[0].format('YYYY') + "";
	let t2;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			span2 = element("span");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			attr(span0, "class", "month svelte-lbaehh");
			attr(span1, "class", "year svelte-lbaehh");
			attr(span2, "class", "title svelte-lbaehh");
			set_style(button, "all", "inherit");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span2);
			append(span2, span0);
			append(span0, t0);
			append(span2, t1);
			append(span2, span1);
			append(span1, t2);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[3]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*$displayedMonth*/ 1 && t0_value !== (t0_value = /*$displayedMonth*/ ctx[0].format('MMM') + "")) set_data(t0, t0_value);
			if (dirty & /*$displayedMonth*/ 1 && t2_value !== (t2_value = /*$displayedMonth*/ ctx[0].format('YYYY') + "")) set_data(t2, t2_value);
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

function instance$5($$self, $$props, $$invalidate) {
	let $displayedMonth;
	const { eventHandlers } = getContext(VIEW);
	let displayedMonth = getContext(DISPLAYED_MONTH);
	component_subscribe($$self, displayedMonth, value => $$invalidate(0, $displayedMonth = value));

	const click_handler = event => {
		console.log('Month clicked');

		eventHandlers.onClick({
			date: $displayedMonth,
			isNewSplit: isMetaPressed(event),
			granularity: 'month'
		});
	};

	return [$displayedMonth, eventHandlers, displayedMonth, click_handler];
}

class Month extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, add_css$5);
	}
}

/* src/calendar-ui/components/Nav.svelte generated by Svelte v4.2.0 */

function add_css$4(target) {
	append_styles(target, "svelte-ayk0l2", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.nav.svelte-ayk0l2{align-items:baseline;display:flex;margin:0.6em 0 1em;padding:0 8px;width:100%}.right-nav.svelte-ayk0l2{align-items:center;display:flex;justify-content:center;margin-left:auto}.reset-button.svelte-ayk0l2{all:inherit;cursor:pointer;align-items:center;color:var(--color-arrow);display:flex;opacity:0.4;padding:0.5em}.reset-button.active.svelte-ayk0l2{cursor:pointer;opacity:1}");
}

function create_fragment$4(ctx) {
	let div1;
	let month;
	let t0;
	let div0;
	let arrow0;
	let t1;
	let button;
	let dot;
	let button_aria_label_value;
	let t2;
	let arrow1;
	let current;
	let mounted;
	let dispose;
	month = new Month({});

	arrow0 = new Arrow({
			props: {
				direction: "left",
				onClick: /*decrementDisplayedMonth*/ ctx[3],
				tooltip: "Previous Month"
			}
		});

	dot = new Dot({
			props: {
				class: "h-3 w-3",
				isFilled: /*showingCurrentMonth*/ ctx[0]
			}
		});

	arrow1 = new Arrow({
			props: {
				direction: "right",
				onClick: /*incrementDisplayedMonth*/ ctx[2],
				tooltip: "Next Month"
			}
		});

	return {
		c() {
			div1 = element("div");
			create_component(month.$$.fragment);
			t0 = space();
			div0 = element("div");
			create_component(arrow0.$$.fragment);
			t1 = space();
			button = element("button");
			create_component(dot.$$.fragment);
			t2 = space();
			create_component(arrow1.$$.fragment);

			attr(button, "aria-label", button_aria_label_value = !/*showingCurrentMonth*/ ctx[0]
			? 'Reset to current month'
			: null);

			attr(button, "class", "reset-button svelte-ayk0l2");
			toggle_class(button, "active", /*showingCurrentMonth*/ ctx[0]);
			attr(div0, "class", "right-nav svelte-ayk0l2");
			attr(div1, "class", "nav svelte-ayk0l2");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			mount_component(month, div1, null);
			append(div1, t0);
			append(div1, div0);
			mount_component(arrow0, div0, null);
			append(div0, t1);
			append(div0, button);
			mount_component(dot, button, null);
			append(div0, t2);
			mount_component(arrow1, div0, null);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*resetDisplayedMonth*/ ctx[4]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			const dot_changes = {};
			if (dirty & /*showingCurrentMonth*/ 1) dot_changes.isFilled = /*showingCurrentMonth*/ ctx[0];
			dot.$set(dot_changes);

			if (!current || dirty & /*showingCurrentMonth*/ 1 && button_aria_label_value !== (button_aria_label_value = !/*showingCurrentMonth*/ ctx[0]
			? 'Reset to current month'
			: null)) {
				attr(button, "aria-label", button_aria_label_value);
			}

			if (!current || dirty & /*showingCurrentMonth*/ 1) {
				toggle_class(button, "active", /*showingCurrentMonth*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(month.$$.fragment, local);
			transition_in(arrow0.$$.fragment, local);
			transition_in(dot.$$.fragment, local);
			transition_in(arrow1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(month.$$.fragment, local);
			transition_out(arrow0.$$.fragment, local);
			transition_out(dot.$$.fragment, local);
			transition_out(arrow1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(month);
			destroy_component(arrow0);
			destroy_component(dot);
			destroy_component(arrow1);
			mounted = false;
			dispose();
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let $displayedMonth;
	let { today } = $$props;
	let displayedMonth = getContext(DISPLAYED_MONTH);
	component_subscribe($$self, displayedMonth, value => $$invalidate(6, $displayedMonth = value));

	function incrementDisplayedMonth() {
		displayedMonth.update(month => month.clone().add(1, "month"));
	}

	function decrementDisplayedMonth() {
		displayedMonth.update(month => month.clone().subtract(1, "month"));
	}

	function resetDisplayedMonth() {
		displayedMonth.set(today.clone());
	}

	let showingCurrentMonth;

	$$self.$$set = $$props => {
		if ('today' in $$props) $$invalidate(5, today = $$props.today);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedMonth, today*/ 96) {
			$$invalidate(0, showingCurrentMonth = $displayedMonth.isSame(today, "month"));
		}
	};

	return [
		showingCurrentMonth,
		displayedMonth,
		incrementDisplayedMonth,
		decrementDisplayedMonth,
		resetDisplayedMonth,
		today,
		$displayedMonth
	];
}

class Nav extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { today: 5 }, add_css$4);
	}
}

/* src/calendar-ui/components/WeekNum.svelte generated by Svelte v4.2.0 */

function add_css$3(target) {
	append_styles(target, "svelte-xfgncl", "td.svelte-xfgncl{border-right:1px solid var(--background-modifier-border)}");
}

function create_fragment$3(ctx) {
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
				dispose = listen(button, "click", /*click_handler*/ ctx[3]);
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
			dispose();
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
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

	$$self.$$set = $$props => {
		if ('weekNum' in $$props) $$invalidate(0, weekNum = $$props.weekNum);
		if ('startOfWeekDate' in $$props) $$invalidate(1, startOfWeekDate = $$props.startOfWeekDate);
	};

	return [weekNum, startOfWeekDate, eventHandlers, click_handler];
}

class WeekNum extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, not_equal, { weekNum: 0, startOfWeekDate: 1 }, add_css$3);
	}
}

/* src/calendar-ui/components/Calendar.svelte generated by Svelte v4.2.0 */

function add_css$2(target) {
	append_styles(target, "svelte-193a61l", ".container.svelte-193a61l{--color-background-heading:transparent;--color-background-day:transparent;--color-background-weeknum:transparent;--color-background-weekend:transparent;--color-dot:var(--text-muted);--color-arrow:var(--text-muted);--color-button:var(--text-muted);--color-text-title:var(--text-normal);--color-text-heading:var(--text-muted);--color-text-day:var(--text-normal);--color-text-today:var(--interactive-accent);--color-text-weeknum:var(--text-muted);padding:0 8px}.weekend.svelte-193a61l{background-color:var(--color-background-weekend)}.calendar.svelte-193a61l{border-collapse:collapse;width:100%}th.svelte-193a61l{background-color:var(--color-background-heading);color:var(--color-text-heading);font-size:0.6em;letter-spacing:1px;padding:4px;text-align:center;text-transform:uppercase}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[8] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[11] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i];
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i];
	return child_ctx;
}

// (72:3) {#if showWeekNums}
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

// (75:3) {#each month[1].days as date}
function create_each_block_3(ctx) {
	let col;

	return {
		c() {
			col = element("col");
			attr(col, "class", "svelte-193a61l");
			toggle_class(col, "weekend", isWeekend(/*date*/ ctx[17]));
		},
		m(target, anchor) {
			insert(target, col, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*month*/ 1) {
				toggle_class(col, "weekend", isWeekend(/*date*/ ctx[17]));
			}
		},
		d(detaching) {
			if (detaching) {
				detach(col);
			}
		}
	};
}

// (81:4) {#if showWeekNums}
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

// (84:4) {#each localizedWeekdaysShort as dayOfWeek}
function create_each_block_2(ctx) {
	let th;
	let t_value = /*dayOfWeek*/ ctx[14] + "";
	let t;

	return {
		c() {
			th = element("th");
			t = text(t_value);
			attr(th, "class", "svelte-193a61l");
		},
		m(target, anchor) {
			insert(target, th, anchor);
			append(th, t);
		},
		p(ctx, dirty) {
			if (dirty & /*localizedWeekdaysShort*/ 2 && t_value !== (t_value = /*dayOfWeek*/ ctx[14] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(th);
			}
		}
	};
}

// (92:5) {#if showWeekNums}
function create_if_block$1(ctx) {
	let weeknum;
	let current;

	weeknum = new WeekNum({
			props: {
				weekNum: /*week*/ ctx[8].weekNum,
				startOfWeekDate: getStartOfWeek(/*week*/ ctx[8].days)
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
			if (dirty & /*month*/ 1) weeknum_changes.weekNum = /*week*/ ctx[8].weekNum;
			if (dirty & /*month*/ 1) weeknum_changes.startOfWeekDate = getStartOfWeek(/*week*/ ctx[8].days);
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

// (97:5) {#each week.days as day (day.format())}
function create_each_block_1(key_1, ctx) {
	let first;
	let day_1;
	let current;
	day_1 = new Day({ props: { date: /*day*/ ctx[11] } });

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
			if (dirty & /*month*/ 1) day_1_changes.date = /*day*/ ctx[11];
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

// (90:3) {#each month as week (week.weekNum)}
function create_each_block(key_1, ctx) {
	let tr;
	let t0;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t1;
	let current;
	let if_block = /*showWeekNums*/ ctx[2] && create_if_block$1(ctx);
	let each_value_1 = ensure_array_like(/*week*/ ctx[8].days);
	const get_key = ctx => /*day*/ ctx[11].format();

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

			if (/*showWeekNums*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*showWeekNums*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$1(ctx);
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

			if (dirty & /*month*/ 1) {
				each_value_1 = ensure_array_like(/*week*/ ctx[8].days);
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

function create_fragment$2(ctx) {
	let div;
	let nav;
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
	nav = new Nav({ props: { today: window.moment() } });
	let if_block0 = /*showWeekNums*/ ctx[2] && create_if_block_2();
	let each_value_3 = ensure_array_like(/*month*/ ctx[0][1].days);
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	let if_block1 = /*showWeekNums*/ ctx[2] && create_if_block_1();
	let each_value_2 = ensure_array_like(/*localizedWeekdaysShort*/ ctx[1]);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	let each_value = ensure_array_like(/*month*/ ctx[0]);
	const get_key = ctx => /*week*/ ctx[8].weekNum;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each2_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			div = element("div");
			create_component(nav.$$.fragment);
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

			attr(table, "class", "calendar svelte-193a61l");
			attr(div, "id", "calendar-container");
			attr(div, "class", "container svelte-193a61l");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(nav, div, null);
			append(div, t0);
			append(div, table);
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
		p(ctx, [dirty]) {
			if (/*showWeekNums*/ ctx[2]) {
				if (if_block0) ; else {
					if_block0 = create_if_block_2();
					if_block0.c();
					if_block0.m(colgroup, t1);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty & /*month*/ 1) {
				each_value_3 = ensure_array_like(/*month*/ ctx[0][1].days);
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

			if (/*showWeekNums*/ ctx[2]) {
				if (if_block1) ; else {
					if_block1 = create_if_block_1();
					if_block1.c();
					if_block1.m(tr, t3);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*localizedWeekdaysShort*/ 2) {
				each_value_2 = ensure_array_like(/*localizedWeekdaysShort*/ ctx[1]);
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

			if (dirty & /*month, showWeekNums*/ 5) {
				each_value = ensure_array_like(/*month*/ ctx[0]);
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each2_lookup, tbody, outro_and_destroy_block, create_each_block, null, get_each_context);
				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(nav.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(nav.$$.fragment, local);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(nav);
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

function instance$2($$self, $$props, $$invalidate) {
	let showWeekNums;
	let localizedWeekdaysShort;
	let month;
	let $settingsStore;
	let $displayedMonth;
	component_subscribe($$self, settingsStore, $$value => $$invalidate(4, $settingsStore = $$value));
	window.dayjs.extend(weekOfYear);
	window.dayjs.extend(isoWeek);
	getContext(VIEW);
	let displayedMonth = writable(window.moment());
	component_subscribe($$self, displayedMonth, value => $$invalidate(5, $displayedMonth = value));
	setContext(DISPLAYED_MONTH, displayedMonth);

	const reindexNotes = () => {
		granularities.forEach(granularity => {
			notesStores[granularity].reindex();
		});
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$settingsStore*/ 16) {
			$$invalidate(2, { localeData: { showWeekNums, localizedWeekdaysShort } } = $settingsStore, showWeekNums, ($$invalidate(1, localizedWeekdaysShort), $$invalidate(4, $settingsStore)));
		}

		if ($$self.$$.dirty & /*$displayedMonth*/ 32) {
			$$invalidate(0, month = getMonth($displayedMonth));
		}

		if ($$self.$$.dirty & /*$settingsStore*/ 16) {
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
		month,
		localizedWeekdaysShort,
		showWeekNums,
		displayedMonth,
		$settingsStore,
		$displayedMonth
	];
}

class Calendar extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, add_css$2);
	}
}

/* src/View.svelte generated by Svelte v4.2.0 */

function add_css$1(target) {
	append_styles(target, "svelte-hy1a6n", ".container.svelte-hy1a6n{width:100%\n}@media(min-width: 640px){.container.svelte-hy1a6n{max-width:640px\n    }}@media(min-width: 768px){.container.svelte-hy1a6n{max-width:768px\n    }}@media(min-width: 1024px){.container.svelte-hy1a6n{max-width:1024px\n    }}@media(min-width: 1280px){.container.svelte-hy1a6n{max-width:1280px\n    }}@media(min-width: 1536px){.container.svelte-hy1a6n{max-width:1536px\n    }}.pointer-events-none.svelte-hy1a6n{pointer-events:none\n}.visible.svelte-hy1a6n{visibility:visible\n}.invisible.svelte-hy1a6n{visibility:hidden\n}.collapse.svelte-hy1a6n{visibility:collapse\n}.absolute.svelte-hy1a6n{position:absolute\n}.relative.svelte-hy1a6n{position:relative\n}.left-0.svelte-hy1a6n{left:0px\n}.top-0.svelte-hy1a6n{top:0px\n}.m-0.svelte-hy1a6n{margin:0px\n}.mx-\\[1px\\].svelte-hy1a6n{margin-left:1px;margin-right:1px\n}.mt-2.svelte-hy1a6n{margin-top:0.5rem\n}.mt-3.svelte-hy1a6n{margin-top:0.75rem\n}.mt-7.svelte-hy1a6n{margin-top:1.75rem\n}.block.svelte-hy1a6n{display:block\n}.inline-block.svelte-hy1a6n{display:inline-block\n}.flex.svelte-hy1a6n{display:flex\n}.table.svelte-hy1a6n{display:table\n}.grid.svelte-hy1a6n{display:grid\n}.contents.svelte-hy1a6n{display:contents\n}.hidden.svelte-hy1a6n{display:none\n}.h-3.svelte-hy1a6n{height:0.75rem\n}.h-\\[6px\\].svelte-hy1a6n{height:6px\n}.w-3.svelte-hy1a6n{width:0.75rem\n}.w-\\[6px\\].svelte-hy1a6n{width:6px\n}.w-max.svelte-hy1a6n{width:-moz-max-content;width:max-content\n}.flex-shrink.svelte-hy1a6n{flex-shrink:1\n}.border-collapse.svelte-hy1a6n{border-collapse:collapse\n}.transform.svelte-hy1a6n{transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.flex-wrap.svelte-hy1a6n{flex-wrap:wrap\n}.items-center.svelte-hy1a6n{align-items:center\n}.text-sm.svelte-hy1a6n{font-size:0.875rem;line-height:1.25rem\n}.text-xs.svelte-hy1a6n{font-size:0.75rem;line-height:1rem\n}.uppercase.svelte-hy1a6n{text-transform:uppercase\n}.capitalize.svelte-hy1a6n{text-transform:capitalize\n}.text-\\[--text-muted\\].svelte-hy1a6n{color:var(--text-muted)\n}.text-\\[--text-on-accent\\].svelte-hy1a6n{color:var(--text-on-accent)\n}.opacity-0.svelte-hy1a6n{opacity:0\n}.filter.svelte-hy1a6n{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\n}.transition.svelte-hy1a6n{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms\n}.duration-300.svelte-hy1a6n{transition-duration:300ms\n}.hover\\:cursor-pointer.svelte-hy1a6n:hover{cursor:pointer\n}");
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
			attr(div, "class", div_class_value = "" + (null_to_empty(clsx(/*popup*/ ctx[0] && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')) + " svelte-hy1a6n"));
			attr(div, "data-popup", div_data_popup_value = /*popup*/ ctx[0] && 'calendarPopup');
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(calendar, div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*popup*/ 1 && div_class_value !== (div_class_value = "" + (null_to_empty(clsx(/*popup*/ ctx[0] && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')) + " svelte-hy1a6n"))) {
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
	append_styles(target, "svelte-hy1a6n", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.m-0.svelte-hy1a6n{margin:0px\n}.mt-2.svelte-hy1a6n{margin-top:0.5rem\n}.mt-3.svelte-hy1a6n{margin-top:0.75rem\n}.mt-7.svelte-hy1a6n{margin-top:1.75rem\n}.flex.svelte-hy1a6n{display:flex\n}.items-center.svelte-hy1a6n{align-items:center\n}.text-sm.svelte-hy1a6n{font-size:0.875rem;line-height:1.25rem\n}.text-xs.svelte-hy1a6n{font-size:0.75rem;line-height:1rem\n}.text-\\[--text-muted\\].svelte-hy1a6n{color:var(--text-muted)\n}.hover\\:cursor-pointer.svelte-hy1a6n:hover{cursor:pointer\n}");
}

// (36:1) {#if note}
function create_if_block(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = `${/*note*/ ctx[3]}`;
			attr(p, "class", "m-0 mt-2 text-xs text-[--text-muted] svelte-hy1a6n");
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
			attr(input, "class", "hover:cursor-pointer svelte-hy1a6n");
			attr(label, "class", "flex items-center hover:cursor-pointer text-sm mt-7 svelte-hy1a6n");
			attr(button1, "class", "mod-cta");
			attr(div0, "class", "modal-button-container mt-3 svelte-hy1a6n");
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
        // showFileMenu(this.app, note, {
        // 	x: event.pageX,
        // 	y: event.pageY
        // });
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
