gpx-parser-ts
===========

Yet another GPX parser... This might be useful to you if you are looking for:
* a way to parse a GPX document into a typed TS object
* a way to calculate distance or elevation change on a GPX document
* a way to convert a GPX document into GeoJson

Installation
============

Simplest way to install `gpx-parser-ts` is to use [npm](http://npmjs.org), just `npm
install gpx-parser-ts` which will download gpx-parser-ts and all dependencies.

Usage
=====

### Basic setup:

```javascript
  const parser: GpxParser = new GpxParser();
  const gpxJson: GeoJson = await parser.parse(gpxString);
  // Do whatever you like with the geoJson object
```

### Calculate distance:

```javascript
  const runDistance = parser.calculateTotalDistanceForPoints(gpxJson.trk[0].trkseg.trkpt)  
```
### Convert to geoJson:

```javascript
    const geoJson = parser.toGeoJSON(gpxJson);
```