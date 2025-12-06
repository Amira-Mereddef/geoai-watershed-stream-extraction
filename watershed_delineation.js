// ======================
// Watershed delineation + stream extraction (GEE)
// ======================

// 0. ---- User inputs ----
var pourLon = 6.5;
var pourLat = 36.8;
    
var accumulationThreshold_km2 = 0.05;
var snapRadius = 1000; // meters

// 1. ---- Pour point ----
var pourPoint = ee.Geometry.Point([pourLon, pourLat]);
Map.centerObject(pourPoint, 10);

// 2. ---- Load MERIT Hydro ----
var merit = ee.Image('MERIT/Hydro/v1_0_1');
var upa = merit.select('upa'); // upstream area (km²)
Map.addLayer(merit.select('hnd'), {min:0, max:2000}, 'MERIT elevation');
Map.addLayer(upa, {min:0, max:10}, 'Upstream area (km²)');

// 3. ---- Stream mask ----
var streamMask = upa.gt(accumulationThreshold_km2);
Map.addLayer(streamMask.updateMask(streamMask), {palette:['0000FF']}, 'Streams');

// 4. ---- Snap pour point ----
var maxInBuffer = upa.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: pourPoint.buffer(snapRadius),
  scale: 90,
  maxPixels: 1e8
});

print('Max upa in buffer (km²):', maxInBuffer);

var maxVal = ee.Number(maxInBuffer.get('upa'));

// 🛠️ Handle null case (no streams in buffer)
maxVal = ee.Algorithms.If(maxVal, maxVal, 0);
maxVal = ee.Number(maxVal);

// Only proceed if maxVal > 0
var snappedPoint = ee.Algorithms.If(
  maxVal.gt(0),
  (function() {
    var upaInt = upa.toInt();
    var masked = upaInt.updateMask(upa.gte(maxVal));
    var snappedVectors = masked.reduceToVectors({
      geometry: pourPoint.buffer(snapRadius),
      scale: 90,
      geometryType: 'centroid',
      eightConnected: false,
      maxPixels: 1e8
    });
    return ee.Algorithms.If(
      snappedVectors.size().gt(0),
      ee.Feature(snappedVectors.first()).geometry(),
      pourPoint
    );
  })(),
  pourPoint
);
snappedPoint = ee.Geometry(snappedPoint);
Map.addLayer(snappedPoint, {color:'red'}, 'Snapped pour point');

// 5. ---- Get containing basin ----
var hybas = ee.FeatureCollection('WWF/HydroSHEDS/v1/Basins/hybas_7');
var basin = hybas.filterBounds(snappedPoint).first();

// Fallback if no basin found
basin = ee.Algorithms.If(basin, basin, ee.Feature(pourPoint.buffer(1)));
basin = ee.Feature(basin);

Map.addLayer(
  ee.FeatureCollection(basin).style({color:'FF0000', fillColor:'00000000', width:2}),
  {},
  'HYBAS basin'
);

// 6. ---- Clip streams ----
var basinGeom = basin.geometry();
var streamsInBasin = streamMask.clip(basinGeom);
Map.addLayer(streamsInBasin.updateMask(streamsInBasin), {palette:['0000FF']}, 'Streams in basin');

// 7. ---- Compute basin area ----
var basinArea_km2 = basinGeom.area().divide(1e6);
print('Basin area (km²):', basinArea_km2);

// 8. ---- Stream pixel area ----
var pixelArea_m2 = ee.Image.pixelArea();
var streamArea_m2 = streamsInBasin.multiply(pixelArea_m2).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: basinGeom,
  scale: 90,
  maxPixels: 1e9
});
print('Stream area (m²):', streamArea_m2);

// 9. ---- Flow accumulation stats ----
var accStats = upa.reduceRegion({
  reducer: ee.Reducer.minMax().combine({reducer2: ee.Reducer.mean(), sharedInputs: true}),
  geometry: basinGeom,
  scale: 90,
  maxPixels: 1e9
});
print('Accumulation stats (km²):', accStats);
