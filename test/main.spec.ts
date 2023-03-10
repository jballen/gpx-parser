import assert from "assert";
import * as fs from "fs";
import GpxParser from "../src/main";
import { GpxJson, GeoJson, Point } from '../src/types';

describe("GPX parser", function () {
  let parser: GpxParser = new GpxParser();
  let gpxJson: GpxJson = {} as GpxJson;
  beforeAll(() => {
    return new Promise<void>(async (resolve) => {
      fs.readFile(
        __dirname + "/gpx-test-short.gpx",
        async function (err, data) {
          gpxJson = await parser.parse(data.toString());
          resolve();
        }
      );
    });
  });

  it("should parse metadata", function () {
    let parsedMetadata = gpxJson.metadata;

    assert.equal("GPX DEMO", parsedMetadata.name);
    assert.equal("A full featured gpx demo file", parsedMetadata.desc);
    assert.equal("2020-01-12T21:32:52", parsedMetadata.time);
    assert.equal("Demo Author", parsedMetadata.author.name);
    assert.equal("demo", parsedMetadata.author.email.id);
    assert.equal("example.com", parsedMetadata.author.email.domain);
    assert.equal("http://example.com", parsedMetadata.author.link.href);
    assert.equal("Web", parsedMetadata.author.link.type);
    assert.equal("http://example.com", parsedMetadata.link.href);
    assert.equal("Author website", parsedMetadata.link.text);
    assert.equal("Web", parsedMetadata.link.type);
  });

  it("should parse waypoints", function () {
    let parsedWaypoints = gpxJson.wpt;
    assert.notEqual(parsedWaypoints, undefined);
    assert.equal(2, parsedWaypoints?.length);

    let wpt0 = parsedWaypoints?.at(0);
    assert.equal("Porte de Carquefou", wpt0?.name);
    assert.equal(47.253146555709, wpt0?.lat);
    assert.equal(-1.5153741828293, wpt0?.lon);
    assert.equal(35, wpt0?.ele);
    assert.equal("Warning", wpt0?.cmt);
    assert.equal("Route", wpt0?.desc);

    let wpt1 = parsedWaypoints?.at(1);
    assert.equal("Pont de la Tortière", wpt1?.name);
    assert.equal(47.235331031612, wpt1?.lat);
    assert.equal(-1.5482325613225, wpt1?.lon);
    assert.equal(20, wpt1?.ele);
    assert.equal("Bridge", wpt1?.cmt);
    assert.equal("Route", wpt1?.desc);
  });

  it("should parse tracks", function () {
    let parsedTracks = gpxJson.trk;
    assert.equal(1, parsedTracks.length);

    let track = parsedTracks[0];

    assert.equal("Track", track.name);
    assert.equal("Bridge", track.cmt);
    assert.equal("Demo track", track.desc);
    assert.equal("GPX Parser", track.src);
    assert.equal("1", track.number);
    assert.equal("MTB", track.type);

    assert.equal("http://example.com", track.link.href);
    assert.equal("Author website", track.link.text);
    assert.equal("Web", track.link.type);

    assert.equal(205, track.trkseg.trkpt.length);

    track.trkseg.trkpt.forEach(function (pt) {
      assert.notEqual(pt.lat, undefined);
      assert.notEqual(pt.lon, undefined);
      assert.notEqual(pt.ele, undefined);
      assert(pt.time == null);
    });
  });

  it("should parse routes", function () {
    let parsedRoutes = gpxJson.rte;

    assert.equal(1, parsedRoutes?.length);

    let route = parsedRoutes?.at(0);

    assert.equal("Track", route?.name);
    assert.equal("Bridge", route?.cmt);
    assert.equal("Demo track", route?.desc);
    assert.equal("GPX Parser", route?.src);
    assert.equal("1", route?.number);
    assert.equal("MTB", route?.type);

    assert.equal("http://example.com", route?.link.href);
    assert.equal("Author website", route?.link.text);
    assert.equal("Web", route?.link.type);
    assert.equal(205, route?.rtept.length);

    route?.rtept.forEach(function (pt) {
      assert.notEqual(pt.lat, undefined);
      assert.notEqual(pt.lon, undefined);
      assert.notEqual(pt.ele, undefined);
      assert(pt.time == null);
    });
  });
});

describe("Calculation tests", function () {
  let parser: GpxParser = new GpxParser();
  let gpxJson: GpxJson = {} as GpxJson;
  beforeAll(() => {
    return new Promise<void>(async (resolve) => {
      fs.readFile(
        __dirname + "/gpx-test-long.gpx",
        async function (err, data) {
          gpxJson = await parser.parse(data.toString());
          resolve();
        }
      );
    });
  });

  it("should calculate the proper distance", function () {
    assert.equal(parser.calculateTotalDistanceForPoints(gpxJson.trk[0].trkseg.trkpt).toFixed(8), "11.79915963");
  });

  it("should sum elevation", function () {
    let eleData = parser.calculateElevationData(gpxJson.trk[0].trkseg.trkpt);
    assert.equal(eleData.avg, 89.14508606329807);
    assert.equal(eleData.max, 117.2);
    assert.equal(eleData.min, 76);
    assert.equal(eleData.pos, 140.3999999999994);
    assert.equal(eleData.neg, 112.2);
  });
});

describe('GeoJSON exporter long test file', function() {
    let parser: GpxParser = new GpxParser();
    let gpxJson: GpxJson = {} as GpxJson;
    let geoJson: GeoJson = {} as GeoJson;
    beforeAll(() => {
      return new Promise<void>(async (resolve) => {
        fs.readFile(
          __dirname + "/gpx-test-long.gpx",
          async function (err, data) {
            gpxJson = await parser.parse(data.toString());
            geoJson = parser.toGeoJSON(gpxJson);
            resolve();
          }
        );
      });
    });

    it('should export correct metadata', function(){
        assert.equal(geoJson.properties.time, gpxJson.metadata.time);
    });

    it('should parse extensions', function() {
      expect(gpxJson.trk[0].trkseg.trkpt[0].extensions).toBeTruthy();
    });

    it ('should successfully streamJson', function() {
      let streamJson = parser.toStreamJSON(gpxJson.trk[0].trkseg.trkpt, {speedThreshold: 5.3});
      expect(streamJson.distance.length).toBe(3602); 
      expect(streamJson.altitude.length).toBe(3602);
      expect(streamJson.gradeAdjustedDistance.length).toBe(3602); 
      expect(streamJson.elapsedTime.length).toBe(3602);
      expect(streamJson.extension.length).toBe(3602);
      const totalDist = streamJson.distance.reduce((a,b) => a+b);
      expect(totalDist.toFixed(8)).toBe("11.79915963");
      const totalGradeDist = streamJson.gradeAdjustedDistance.reduce((a,b) => a+b);
      expect(totalGradeDist.toFixed(8)).toBe("11.81015231");
      const elapsedTime = streamJson.elapsedTime.reduce((a,b) => a+b);
      expect(elapsedTime).toBe(3737);

      let moveTime = 0;
      streamJson.elapsedTime.forEach((val, i) => {
        if (streamJson.movingTime[i] === 1) {
          moveTime += val;
        }
      });
      expect(moveTime).toBe(3615);
    })
});

describe('Calcuating graduated distance between two points', function() {
  let parser: GpxParser = new GpxParser();

  it('should calculate graduated distance correctly', function() {
    const p1 = {
      ele: 1,
      lat: 1,
      lon: 1
    } as Point;
    const p2 = {
      ele: 5,
      lat: 1,
      lon: 4
    } as Point;
    const gradeDist = parser.calculateGradeAdjustedDistanceBetweenPoints(p2, p1);
    const dist = parser.calculateDistanceBetweenPoints(p2, p1);
    expect(dist.toFixed(10)).toBe("333.5339617480");
    expect(gradeDist.toFixed(10)).toBe("333.5339617720");
  });
});
