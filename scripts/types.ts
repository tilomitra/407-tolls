// Types used by the data pipeline scripts.

// Partial interchange access classification
export type Access = "full" | "eb-side" | "wb-side";

export type Direction = "EB" | "WB";

export interface InterchangePair {
  entry: number;
  exit: number;
  direction: Direction;
}

export interface RawInterchange {
  id: number;
  name: string;
  name_fr?: string;
  lat: number;
  lng: number;
  note: string;
  note_fr?: string;
  type: number;
}

export interface DistancePair {
  direction: string;
  entry: number;
  exit: number;
  etr_distance?: number;
  etr_toll?: number;
  east_toll?: number;
  ttc?: number;
  vtc?: number;
  total_transponder?: number;
  total_video?: number;
  etr_rate?: number;
  east_rate?: number;
  east_distance?: number;
  error?: string;
  zone_info?: ZoneInfo[];
}

export interface ZoneInfo {
  zone: string;
  entry: number;
  exit: number;
  toll: number;
  distance: number;
  rate: number;
}

// Ontario Road Network ArcGIS API response shape
export interface OrnGantryFeature {
  attributes: {
    OGF_ID: number;
    TOLL_POINT_TYPE: string;
    LATITUDE: number;
    LONGITUDE: number;
    TOLL_ZONE: number;
    OFFICIAL_NAME_UPPER: string;
    IS_FREE_FLOW: string;
  };
}

// OpenStreetMap Overpass API response element
export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

export interface DistancesFile {
  fetchedAt: string;
  ratedClass: number;
  ratedClassName: string;
  timestamp: string;
  totalPairs: number;
  pairs: DistancePair[];
}
