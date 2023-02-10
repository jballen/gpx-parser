import "./types";
import { Elevation, GeoJson, GpxJson, Point, StreamJson, StreamJSONInputOptions } from "./types";
export default class GpxParser {
    constructor();
    parse(gpxstring: string): Promise<GpxJson>;
    /**
     * Computes the total distance traveled for a given track
     *
     * @param  {} track - The track which to calculate the total distance
     *
     * @return {number} The total distance traveled, reported in
     */
    calculateTotalDistanceForPoints(points: Point[]): number;
    /**
     * Calculate Distance between two points with lat and lon
     *
     * @param  {} wpt1 - A geographic point with lat and lon properties
     * @param  {} wpt2 - A geographic point with lat and lon properties
     *
     * @returns {number} The distance between the two points, returned in kilometers
     */
    calculateDistanceBetweenPoints(wpt1: Point, wpt2: Point): number;
    calculateGradeAdjustedDistanceBetweenPoints(wpt1: Point, wpt2: Point): number;
    private toRadian;
    /**
     * Generate Elevation Object from an array of points
     *
     * @param  {Point[]} points - An array of points with ele property
     *
     * @returns {Elevation} An object with negative and positive height difference and average, max and min altitude data
     */
    calculateElevationData(points: Point[]): Elevation;
    /**
     * Generate a StreamJson object, which comprises easy-to-digest data points in separate arrays.
     *
     * @param  {Point[]} points - An array of points with ele property
     *
     * @returns {StreamJson} An object of arrays where for array A and array B, A[i] is the same timestamp as B[i]
     */
    toStreamJSON(points: Point[], options?: StreamJSONInputOptions): StreamJson;
    /**
     * Export the GPX object to a GeoJSON formatted Object
     *
     * @returns {} a GeoJSON formatted Object
     */
    toGeoJSON(gpxJson: GpxJson): GeoJson;
}
