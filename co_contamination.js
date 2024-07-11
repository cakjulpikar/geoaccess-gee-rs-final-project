// Dont forget to import and align the shp file

var imgColl = ee
  .ImageCollection("COPERNICUS/S5P/OFFL/L3_CO")
  .select('CO_column_number_density')
  .filterBounds(banten)
  .filterDate('2020-01-01', '2020-03-30')
  .map(function(image){
    return image.copyProperties(image, ["system:time_start"]);
  });

print(imgColl);

var coMean = imgColl
  .mean()
  .clip(banten)


var minMax = coMean.reduceRegion({
  geometry: banten,
  reducer: ee.Reducer.minMax(),
  scale: 1113.2,
  maxPixels: 1e9
});
print(minMax);

var coTs = ui.Chart.image.series({
  imageCollection: imgColl,
  region: banten,
  reducer: ee.Reducer.mean(),
  scale: 1113.2,
  xProperty: 'system:time_start'
})
.setOptions({
     title: 'CO Density',
     vAxis: {title: 'mol/sqm for each day'}
});

print(coTs);

var templatePalette = [
  'black',
  'blue',
  'purple',
  'cyan', 
  'green', 
  'yellow', 
  'red'
]

var classDesc = [
  'Very Low CO Contamination',
  'Low CO Contamination',
  'Moderately CO Contamination',
  'Moderate CO Contamination',
  'Moderately High CO Contamination',
  'High CO Contamination',
  'Very High CO Contamination'
]

var min = 0.026537158538607563;
var max = 0.03533038654054848;
var interval = (max - min) / 7;

var coReclass = coMean
  .where(coMean.gte(min).and(coMean.lt(min + interval)), 1)
  .where(coMean.gte(min + interval).and(coMean.lt(min + 2 * interval)), 2)
  .where(coMean.gte(min + 2 * interval).and(coMean.lt(min + 3 * interval)), 3)
  .where(coMean.gte(min + 3 * interval).and(coMean.lt(min + 4 * interval)), 4)
  .where(coMean.gte(min + 4 * interval).and(coMean.lt(min + 5 * interval)), 5)
  .where(coMean.gte(min + 5 * interval).and(coMean.lt(min + 6 * interval)), 6)
  .where(coMean.gte(min + 6 * interval).and(coMean.lte(max)), 7);

var coClassParam = {
  min: 1,
  max: 7,
  palette: templatePalette,
  labels: classDesc
};

var legendBox = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

var legendTitle = ui.Label({
  value: 'CO Contamination Classification',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});

legendBox.add(legendTitle);

var makeRow = function(color, name, area) {
  var colorBox = ui.Label({
    style: {
      backgroundColor: color,
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  var areaDesc = ui.Label({
    value: 'Total area: ' +  area + ' sq km',
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description, areaDesc],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

function calculateArea(classValue) {
  var areaImage = ee.Image.pixelArea().mask(coReclass.eq(classValue));
  var area = areaImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: banten,
    scale: 1113.2,
  });
  var areaSqm = ee.Number(area.get('area'));
  var areaSqkm = areaSqm.divide(1e6);
  return areaSqkm;
}

var areaValues = [];

for (var i = 0; i < 7; i++) {
  var currVal = calculateArea(i + 1);
  areaValues.push(currVal);
}

ee.List(areaValues).evaluate(function(areas) {
  for (var i = 0; i < 7; i++) {
    legendBox.add(makeRow(templatePalette[i], classDesc[i], areas[i]));
  }
});

Map.centerObject(banten);
Map.addLayer(coReclass, coClassParam, 'Banten CO Contamination Classification');
Map.add(legendBox);

Export.image.toDrive({
  image: coReclass,
  description: 'CO_Contamination_of_Banten',
  scale: 1113.2,
  region: banten,
  fileFormat: 'GeoTIFF'
});
