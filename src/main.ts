import * as xml2js from "xml2js";
import { parseNumbers } from "xml2js/lib/processors";
import "./types";
import { Elevation, GeoJson, GeoJsonFeature, GpxJson, Point } from "./types";

export default class GpxParser {
  constructor(){}

  async parse(gpxstring: string): Promise<GpxJson> {
    const parserOptions = {
      tagNameProcessors: [parseNumbers],
      attrNameProcessors: [parseNumbers],
      valueProcessors: [parseNumbers],
      attrValueProcessors: [parseNumbers],
      preserveChildrenOrder: true,
      trim: true,
      explicitArray: false,
      mergeAttrs: true,
    };
    let parser = new xml2js.Parser(parserOptions);
    let jsonReturn: GpxJson = {} as GpxJson;
    try {
      let result = await parser.parseStringPromise(gpxstring);
      jsonReturn.metadata = result.gpx.metadata;
      jsonReturn.wpt = result.gpx.wpt;
      if (Array.isArray(result.gpx.rte)) {
        jsonReturn.rte = result.gpx.rte;
      } else {
        jsonReturn.rte = [result.gpx.rte];
      }

      if (Array.isArray(result.gpx.trk)) {
        jsonReturn.trk = result.gpx.trk;
      } else {
        jsonReturn.trk = [result.gpx.trk];
      }
    } catch (e) {
      console.error(e);
    }

    return jsonReturn;
  }

  /**
   * Computes the total distance traveled for a given track
   *
   * @param  {} track - The track which to calculate the total distance
   *
   * @return {number} The total distance traveled, reported in
   */
  calculateTotalDistanceForPoints(points: Point[]): number {
    let totalDistance: number = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistanceBetweenPoints(
        points[i],
        points[i + 1]
      );
    }

    return totalDistance;
  }

  /**
   * Calcul Distance between two points with lat and lon
   *
   * @param  {} wpt1 - A geographic point with lat and lon properties
   * @param  {} wpt2 - A geographic point with lat and lon properties
   *
   * @returns {float} The distance between the two points, returned in kilometers
   */
  calculateDistanceBetweenPoints(wpt1: Point, wpt2: Point) {
    let lat1 = wpt1.lat,
      lat2 = wpt2.lat,
      long1 = wpt1.lon,
      long2 = wpt2.lon;

    return (
      Math.acos(
        Math.cos(this.toRadian(90 - lat1)) *
          Math.cos(this.toRadian(90 - lat2)) +
          Math.sin(this.toRadian(90 - lat1)) *
            Math.sin(this.toRadian(90 - lat2)) *
            Math.cos(this.toRadian(long1 - long2))
      ) * 6371
    );
  }

  private toRadian(degree: number): number {
    return degree * (Math.PI / 180);
  }

  /**
   * Generate Elevation Object from an array of points
   *
   * @param  {} points - An array of points with ele property
   *
   * @returns {ElevationObject} An object with negative and positive height difference and average, max and min altitude data
   */
  calculateElevationData(points: Point[]): Elevation {
    let posEleChange = 0,
      negEleChange = 0,
      ret: Elevation = {} as Elevation,
      elevations: number[] = [],
      sum = 0;

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
          } else if (diff > 0) {
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
   * Export the GPX object to a GeoJSON formatted Object
   *
   * @returns {} a GeoJSON formatted Object
   */
  toGeoJSON(gpxJson: GpxJson): GeoJson {
    let geoJson = {
      type: "FeatureCollection",
      features: [] as GeoJsonFeature[],
      properties: {
        name: gpxJson.metadata.name,
        desc: gpxJson.metadata.desc,
        time: gpxJson.metadata.time,
        author: gpxJson.metadata.author,
        link: gpxJson.metadata.link,
      },
    };

    gpxJson.trk.forEach((track, index) => {
      let feature: GeoJsonFeature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [] as Point[],
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
        let geoPt: Point = {
          lon: pt.lon,
          lat: pt.lat,
          ele: pt.ele,
          time: pt.time,
        };

        feature.geometry.coordinates.push(geoPt);
      });

      geoJson.features.push(feature);
    });

    gpxJson.rte.forEach((track) => {
      let feature: GeoJsonFeature = {
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

      track.rtept.forEach((pt) => {
        let geoPt: Point = {
          lon: pt.lon,
          lat: pt.lat,
          ele: pt.ele,
          time: pt.time,
        };

        feature.geometry.coordinates.push(geoPt);
      });

      geoJson.features.push(feature);
    });

    gpxJson.wpt.forEach((pt) => {
      let feature: GeoJsonFeature = {
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
        } as Point,
      ];

      geoJson.features.push(feature);
    });

    return geoJson;
  }
}
