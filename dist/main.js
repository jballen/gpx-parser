"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js = __importStar(require("xml2js"));
const processors_1 = require("xml2js/lib/processors");
require("./types");
class GpxParser {
    constructor() { }
    parse(gpxstring) {
        return __awaiter(this, void 0, void 0, function* () {
            const parserOptions = {
                tagNameProcessors: [processors_1.parseNumbers],
                attrNameProcessors: [processors_1.parseNumbers],
                valueProcessors: [processors_1.parseNumbers],
                attrValueProcessors: [processors_1.parseNumbers],
                preserveChildrenOrder: true,
                trim: true,
                explicitArray: false,
                mergeAttrs: true,
            };
            let parser = new xml2js.Parser(parserOptions);
            let jsonReturn = {};
            try {
                let result = yield parser.parseStringPromise(gpxstring);
                jsonReturn.metadata = result.gpx.metadata;
                jsonReturn.wpt = result.gpx.wpt;
                if (result.gpx.rte) {
                    if (Array.isArray(result.gpx.rte)) {
                        jsonReturn.rte = result.gpx.rte;
                    }
                    else {
                        jsonReturn.rte = [result.gpx.rte];
                    }
                }
                if (Array.isArray(result.gpx.trk)) {
                    jsonReturn.trk = result.gpx.trk;
                }
                else {
                    jsonReturn.trk = [result.gpx.trk];
                }
            }
            catch (e) {
                console.error(e);
            }
            return jsonReturn;
        });
    }
    /**
     * Computes the total distance traveled for a given track
     *
     * @param  {} track - The track which to calculate the total distance
     *
     * @return {number} The total distance traveled, reported in
     */
    calculateTotalDistanceForPoints(points) {
        let totalDistance = 0;
        for (let i = 0; i < points.length - 1; i++) {
            totalDistance += this.calculateDistanceBetweenPoints(points[i], points[i + 1]);
        }
        return totalDistance;
    }
    /**
     * Calculate Distance between two points with lat and lon
     *
     * @param  {} wpt1 - A geographic point with lat and lon properties
     * @param  {} wpt2 - A geographic point with lat and lon properties
     *
     * @returns {number} The distance between the two points, returned in kilometers
     */
    calculateDistanceBetweenPoints(wpt1, wpt2) {
        const earthRadiusKm = 6371;
        const dLat = this.toRadian(wpt2.lat - wpt1.lat);
        const dLon = this.toRadian(wpt2.lon - wpt1.lon);
        const lat1 = this.toRadian(wpt1.lat);
        const lat2 = this.toRadian(wpt2.lat);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }
    calculateGradeAdjustedDistanceBetweenPoints(wpt1, wpt2) {
        const latLongDist = this.calculateDistanceBetweenPoints(wpt1, wpt2);
        const eleDiff = (wpt2.ele - wpt1.ele) / 1000;
        return Math.sqrt(Math.pow(eleDiff, 2) + Math.pow(latLongDist, 2));
    }
    toRadian(degree) {
        return degree * Math.PI / 180;
    }
    /**
     * Generate Elevation Object from an array of points
     *
     * @param  {Point[]} points - An array of points with ele property
     *
     * @returns {Elevation} An object with negative and positive height difference and average, max and min altitude data
     */
    calculateElevationData(points) {
        let posEleChange = 0, negEleChange = 0, ret = {}, elevations = [], sum = 0;
        points.forEach((curPoint, index) => {
            let curEle = curPoint.ele;
            if (curEle) {
                elevations.push(curEle);
                sum += curEle;
                if (index < points.length - 1) {
                    let nextEle = points[index + 1].ele;
                    let diff = nextEle - curEle;
                    if (diff < 0) {
                        negEleChange += diff;
                    }
                    else if (diff > 0) {
                        posEleChange += diff;
                    }
                }
            }
        });
        ret.max = Math.max.apply(null, elevations);
        ret.min = Math.min.apply(null, elevations);
        ret.pos = Math.abs(posEleChange);
        ret.neg = Math.abs(negEleChange);
        ret.avg = sum / elevations.length;
        return ret;
    }
    /**
     * Generate a StreamJson object, which comprises easy-to-digest data points in separate arrays.
     *
     * @param  {Point[]} points - An array of points with ele property
     *
     * @returns {StreamJson} An object of arrays where for array A and array B, A[i] is the same timestamp as B[i]
     */
    toStreamJSON(points, options) {
        let distance = [0];
        let distanceBelowThreshold = [0];
        let altitude = [points[0].ele];
        let gradeAdjustedDistance = [0];
        let elapsedTime = [0];
        let movingTime = [0];
        let extension = [];
        for (let i = 1; i < points.length; i++) {
            let point = points[i];
            let prevPoint = points[i - 1];
            const dist = this.calculateDistanceBetweenPoints(prevPoint, point);
            distance[i] = dist;
            gradeAdjustedDistance[i] = this.calculateGradeAdjustedDistanceBetweenPoints(prevPoint, point);
            altitude[i] = point.ele;
            const date1 = new Date(prevPoint.time), date2 = new Date(point.time);
            elapsedTime[i] = Math.abs(date2.getTime() - date1.getTime()) / 1000;
            const speedThreshold = (options === null || options === void 0 ? void 0 : options.speedThreshold) ? options.speedThreshold : 5.3;
            if (dist * 3600 > speedThreshold) {
                movingTime[i] = 1;
                distanceBelowThreshold[i] = dist;
            }
            else {
                movingTime[i] = 0;
                distanceBelowThreshold[i] = 0;
            }
            if (point.extensions) {
                if (options && options.extensionProcessor) {
                    extension[i] = options.extensionProcessor(point.extensions);
                }
                else {
                    extension[i] = point.extensions;
                }
            }
        }
        return {
            distance,
            altitude: altitude,
            extension,
            gradeAdjustedDistance,
            elapsedTime,
            movingTime
        };
    }
    /**
     * Export the GPX object to a GeoJSON formatted Object
     *
     * @returns {} a GeoJSON formatted Object
     */
    toGeoJSON(gpxJson) {
        var _a, _b;
        let geoJson = {
            type: "FeatureCollection",
            features: [],
            properties: {
                name: gpxJson.metadata.name,
                desc: gpxJson.metadata.desc,
                time: gpxJson.metadata.time,
                author: gpxJson.metadata.author,
                link: gpxJson.metadata.link,
            },
        };
        gpxJson.trk.forEach((track, index) => {
            let feature = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [],
                },
                properties: {
                    name: track.name,
                    cmt: track.cmt,
                    desc: track.desc,
                    src: track.src,
                    number: track.number,
                    link: track.link,
                    type: track.type,
                },
            };
            track.trkseg.trkpt.forEach((pt, index) => {
                let geoPt = {
                    lon: pt.lon,
                    lat: pt.lat,
                    ele: pt.ele,
                    time: pt.time,
                };
                feature.geometry.coordinates.push(geoPt);
            });
            geoJson.features.push(feature);
        });
        (_a = gpxJson.rte) === null || _a === void 0 ? void 0 : _a.forEach((route, index) => {
            let feature = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [],
                },
                properties: {
                    name: route.name,
                    cmt: route.cmt,
                    desc: route.desc,
                    src: route.src,
                    number: route.number,
                    link: route.link,
                    type: route.type,
                },
            };
            route.rtept.forEach((pt) => {
                let geoPt = {
                    lon: pt.lon,
                    lat: pt.lat,
                    ele: pt.ele,
                    time: pt.time,
                };
                feature.geometry.coordinates.push(geoPt);
            });
            geoJson.features.push(feature);
        });
        (_b = gpxJson.wpt) === null || _b === void 0 ? void 0 : _b.forEach((pt) => {
            let feature = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [],
                },
                properties: {
                    name: pt.name,
                    sym: pt.sym,
                    cmt: pt.cmt,
                    desc: pt.desc,
                },
            };
            feature.geometry.coordinates = [
                {
                    lon: pt.lon,
                    lat: pt.lat,
                    ele: pt.ele,
                },
            ];
            geoJson.features.push(feature);
        });
        return geoJson;
    }
}
exports.default = GpxParser;
//# sourceMappingURL=main.js.map