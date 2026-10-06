// Multi-sample instruments: the zone map, fitting one to a device's memory,
// and reading and writing other tools' instrument files (docs/zone-sampler.md).

export {
  ZONE_FIELD_COUNT,
  compactZone,
  encodeZoneFields,
  normalizeZoneMap,
  planZoneLoad,
  prepareZoneLoad,
  type PreparedZoneLoad,
  type ResolvedZone,
  type ResolvedZoneMap,
  type Zone,
  type ZoneCapacity,
  type ZoneLoop,
  type ZoneMap,
  type ZoneOverBudget,
  type ZonePlan,
  type ZonePlanOptions,
  type ZoneRoundRobin,
  type ZoneSample,
  type ZoneSampleInfo,
  type ZoneThinning,
} from './zone-map'
export { type ParsedInstrument, type UnsupportedFeature, type WrittenInstrument } from './report'
export { parseSfz, writeSfz, type SfzReadOptions, type SfzWriteOptions } from './sfz'
export {
  parseDspreset,
  writeDspreset,
  type DspresetReadOptions,
  type DspresetWriteOptions,
} from './dspreset'
