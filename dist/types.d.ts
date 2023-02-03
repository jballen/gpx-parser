export type Metadata = {
    name: string;
    desc: string;
    link: Link;
    author: Author;
    time: Date;
};
export type Waypoint = {
    name: string;
    cmt: string;
    desc: string;
    lat: number;
    lon: number;
    ele: number;
    time: Date;
    sym: string;
};
export type Track = {
    name: string;
    cmt: string;
    desc: string;
    src: string;
    number: string;
    link: Link;
    type: string;
    trkseg: {
        trkpt: Point[];
    };
    distance: Distance;
    elevation: Elevation;
    slopes: number[];
};
export type Route = {
    name: string;
    cmt: string;
    desc: string;
    src: string;
    number: string;
    link: Link;
    type: string;
    rtept: Point[];
    distance: Distance;
    elevation: Elevation;
    slopes: number[];
};
export type Point = {
    lat: number;
    lon: number;
    ele: number;
    time: Date;
};
export type Distance = {
    total: number;
    cumul: number[];
};
export type Elevation = {
    max: number;
    min: number;
    pos: number;
    neg: number;
    avg: number;
};
export type Author = {
    name: string;
    email: Email;
    link: Link;
};
export type Email = {
    id: string;
    domain: string;
};
export type Link = {
    href: string;
    text: string;
    type: string;
};
export type GeoJsonFeature = {
    type: string;
    geometry: {
        type: string;
        coordinates: Point[];
    };
    properties: {
        name: any;
        cmt: any;
        desc: any;
        src?: any;
        number?: any;
        link?: any;
        type?: any;
        sym?: any;
    };
};
export type GeoJson = {
    type: string;
    features: GeoJsonFeature[];
    properties: {
        name: any;
        desc: any;
        time: any;
        author: Author;
        link: any;
    };
};
export type GpxJson = {
    metadata: Metadata;
    wpt?: Waypoint[];
    trk: Track[];
    rte?: Route[];
};
