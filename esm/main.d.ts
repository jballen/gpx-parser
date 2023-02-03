import "./types";
import { Elevation, GeoJson, GpxJson, Point } from "./types";
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
     * Calcul Distance between two points with lat and lon
     *
     * @param  {} wpt1 - A geographic point with lat and lon properties
     * @param  {} wpt2 - A geographic point with lat and lon properties
     *
     * @returns {float} The distance between the two points, returned in kilometers
     */
    calculateDistanceBetweenPoints(wpt1: Point, wpt2: Point): number;
    private toRadian;
    /**
     * Generate Elevation Object from an array of points
     *
     * @param  {} points - An array of points with ele property
     *
     * @returns {ElevationObject} An object with negative and positive height difference and average, max and min altitude data
     */
    calculateElevationData(points: Point[]): Elevation;
    /**
     * Export the GPX object to a GeoJSON formatted Object
     *
     * @returns {} a GeoJSON formatted Object
     */
    toGeoJSON(gpxJson: GpxJson): GeoJson;
}
//# sourceMappingURL=main.d.ts.map