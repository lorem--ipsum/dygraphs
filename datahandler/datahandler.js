/**
 * @license
 * Copyright 2013 David Eberlein (david.eberlein@ch.sauter-bc.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

/**
 * @fileoverview This file contains the managment of data handlers
 * @author David Eberlein (david.eberlein@ch.sauter-bc.com)
 * 
 * The idea is to define a common, generic data format that works for all data
 * structures supported by dygraphs. To make this possible, the DataHandler
 * interface is introduced. This makes it possible, that dygraph itself can work
 * with the same logic for every data type independent of the actual format and
 * the DataHandler takes care of the data format specific jobs. 
 * DataHandlers are implemented for all data types supported by Dygraphs and
 * return Dygraphs compliant formats.
 * By default the correct DataHandler is chosen based on the options set.
 * Optionally the user may use his own DataHandler (similar to the plugin
 * system).
 * 
 * 
 * The unified data format returend by each handler is defined as so: 
 * series[n][point] = [x,y,(extras)] 
 * 
 * This format contains the common basis that is needed to draw a simple line
 * series extended by optional extras for more complex graphing types. It
 * contains a primitive x value as first array entry, a primitive y value as
 * second array entry and an optional extras object for additional data needed.
 * 
 * x must always be a number.
 * y must always be a number, NaN of type number or null.
 * extras is optional and must be interpreted by the DataHandler. It may be of
 * any type. 
 * 
 * In practice this might look something like this:
 * default: [x, yVal]
 * errorBar / customBar: [x, yVal, [yTopVariance, yBottomVariance] ]
 * 
 */
/*global Dygraph:false */
/*global DygraphLayout:false */

(function() {

"use strict";

/**
 * A collection of functions to create and retrieve data handlers.
 * @type {Object.<!Dygraph.DataHandler>}
 */
Dygraph.DataHandlers = {};

/**
 * 
 * The data handler is responsible for all data specific operations. All of the
 * series data it receives and returns is always in the unified data format.
 * Initially the unified data is created by the extractSeries method
 */
Dygraph.DataHandler = function () {
  /**
   * Constructor for all data handlers.
   * @constructor
   */
  var handler = function() {
    return this;
  };

  /**
   * X-value array index constant for unified data samples.
   * @const
   * @type {number}
   */
  handler.X = 0;

  /**
   * Y-value array index constant for unified data samples.
   * @const
   * @type {number}
   */
  handler.Y = 1;

  /**
   * Extras-value array index constant for unified data samples.
   * @const
   * @type {number}
   */
  handler.EXTRAS = 2;

  /**
   * Extracts one series from the raw data (a 2D array) into an array of the
   * unified data format.
   * This is where undesirable points (i.e. negative values on log scales and
   * missing values through which we wish to connect lines) are dropped.
   * TODO(danvk): the "missing values" bit above doesn't seem right.
   * 
   * @param rawData {!Array.<Array>} The raw data passed into dygraphs where 
   *          rawData[i] = [x,ySeries1,...,ySeriesN].
   * @param seriesIndex {!number} Index of the series to extract. All other series should
   *          be ignored.
   * @param options {!DygraphOptions} Dygraph options.
   * @returns {Array.<[!number,?number,?]>} The series in the unified data format
   *          where series[i] = [x,y,{extras}]. 
   * @public
   */
  handler.prototype.extractSeries = function(rawData, seriesIndex, options) {
  };

  /**
   * Converts a series to a Point array.
   * 
   * @param {!Array.<[!number,?number,?]>} series The series in the unified 
   *          data format where series[i] = [x,y,{extras}].
   * @param {!string} setName Name of the series.
   * @param {!number} boundaryIdStart Index offset of the first point, equal to the
   *          number of skipped points left of the date window minimum (if any).
   * @return {!Array.<Dygraph.PointType>} List of points for this series.
   * @public
   */
  handler.prototype.seriesToPoints = function(series, setName, boundaryIdStart) {
    // TODO(bhs): these loops are a hot-spot for high-point-count charts. In
    // fact,
    // on chrome+linux, they are 6 times more expensive than iterating through
    // the
    // points and drawing the lines. The brunt of the cost comes from allocating
    // the |point| structures.
    var points = [];
    for ( var i = 0; i < series.length; ++i) {
      var item = series[i];
      var yraw = item[1];
      var yval = yraw === null ? null : DygraphLayout.parseFloat_(yraw);
      var point = {
        x : NaN,
        y : NaN,
        xval : DygraphLayout.parseFloat_(item[0]),
        yval : yval,
        name : setName, // TODO(danvk): is this really necessary?
        idx : i + boundaryIdStart
      };
      points.push(point);
    }
    handler.prototype.onPointsCreated_(series, points);
    return points;
  };

  /**
   * Callback called for each series after the series points have been generated
   * which will later be used by the plotters to draw the graph.
   * Here data may be added to the seriesPoints which is needed by the plotters.
   * The indexes of series and points are in sync meaning the original data
   * sample for series[i] is points[i].
   * 
   * @param {!Array.<[!number,?number,?]>} series The series in the unified 
   *          data format where series[i] = [x,y,{extras}].
   * @param {!Array.<Dygraph.PointType>} points The corresponding points passed 
   *          to the plotter.
   * @private
   */
  handler.prototype.onPointsCreated_ = function(series, points) {
  };

  /**
   * Calculates the rolling average of a data set.
   * 
   * @param {!Array.<[!number,?number,?]>} series The series in the unified 
   *          data format where series[i] = [x,y,{extras}].
   * @param {!number} rollPeriod The number of points over which to average the data
   * @param {!DygraphOptions} options The dygraph options.
   * @return the rolled series.
   * @public
   */
  handler.prototype.rollingAverage = function(series, rollPeriod, options) {
  };

  /**
   * Computes the range of the data series (including confidence intervals).
   * 
   * @param {!Array.<[!number,?number,?]>} series The series in the unified 
   *          data format where series[i] = [x,y,{extras}].
   * @param {!Array.<number>} dateWindow The x-value range to display with 
   *          the format: [min,max].
   * @param {!DygraphOptions} options The dygraph options.
   * @return {Array.<number>} The low and high extremes of the series in the given window with 
   *          the format: [low, high].
   * @public
   */
  handler.prototype.getExtremeYValues = function(series, dateWindow, options) {
  };

  /**
   * Callback called for each series after the layouting data has been
   * calculated before the series is drawn. Here normalized positioning data
   * should be calculated for the extras of each point.
   * 
   * @param {!Array.<Dygraph.PointType>} points The points passed to 
   *          the plotter.
   * @param {!Object} axis The axis on which the series will be plotted.
   * @param {!boolean} logscale Weather or not to use a logscale.
   * @public
   */
  handler.prototype.onLineEvaluated = function(points, axis, logscale) {
  };

  /**
   * Helper method that computes the y value of a line defined by the points p1
   * and p2 and a given x value.
   * 
   * @param {!Array.<number>} p1 left point ([x,y]).
   * @param {!Array.<number>} p2 right point ([x,y]).
   * @param {!number} xValue The x value to compute the y-intersection for.
   * @return {number} corresponding y value to x on the line defined by p1 and p2.
   * @private
   */
  handler.prototype.computeYInterpolation_ = function(p1, p2, xValue) {
    var deltaY = p2[1] - p1[1];
    var deltaX = p2[0] - p1[0];
    var gradient = deltaY / deltaX;
    var growth = (xValue - p1[0]) * gradient;
    return p1[1] + growth;
  };

  /**
   * Helper method that returns the first and the last index of the given series
   * that lie inside the given dateWindow.
   * 
   * @param {!Array.<[!number,?number,?]>} series The series in the unified 
   *          data format where series[i] = [x,y,{extras}].
   * @param {!Array.<number>} dateWindow The x-value range to display with 
   *          the format: [min,max].
   * @return {!Array.<[!number,?number,?]>} The samples of the series that 
   *          are in the given date window.
   * @private
   */
  handler.prototype.getIndexesInWindow_ = function(series, dateWindow) {
    var firstIdx = 0, lastIdx = series.length - 1;
    if (dateWindow) {
      var idx = 0;
      var low = dateWindow[0];
      var high = dateWindow[1];

      // Start from each side of the array to minimize the performance
      // needed.
      while (idx < series.length - 1 && series[idx][0] < low) {
        firstIdx++;
        idx++;
      }
      idx = series.length - 1;
      while (idx > 0 && series[idx][0] > high) {
        lastIdx--;
        idx--;
      }
    }
    if (firstIdx <= lastIdx) {
      return [ firstIdx, lastIdx ];
    } else {
      return [ 0, series.length - 1 ];
    }
  };

  return handler;
};

})();
