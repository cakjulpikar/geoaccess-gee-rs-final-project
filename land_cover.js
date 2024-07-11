// Dont forget to import and align the shp file

var dataset = ee.ImageCollection('ESA/WorldCover/v200').first();

var visualization = {
  bands: ['Map'],
};

function clipToGeometry(image) {
  return image.clip(banten);
}

var clippedDataset = clipToGeometry(dataset);

var landCoverClass = clippedDataset
  .where(clippedDataset.eq(10), 1)
  .where(clippedDataset.eq(20), 2)
  .where(clippedDataset.eq(30), 3)
  .where(clippedDataset.eq(40), 4)
  .where(clippedDataset.eq(50), 5)
  .where(clippedDataset.eq(60), 6)
  .where(clippedDataset.eq(70), 7)
  .where(clippedDataset.eq(80), 8)
  .where(clippedDataset.eq(90), 9)
  .where(clippedDataset.eq(100), 10)

var templatePalette = [
  '#006400', // Tree cover
  '#ffbb22', // Shrubland
  '#ffff4c', // Grassland
  '#f096ff', // Cropland
  '#fa0000', // Built-up
  '#b4b4b4', // Bare / sparse vegetation
  '#f0f0f0', // Snow and ice
  '#0064c8', // Permanent water bodies
  '#0096a0', // Herbaceous wetland
  '#00cf75', // Mangroves
  '#fae6a0'  // Moss and lichen
];

var classDesc = [
  'Tree cover',
  'Shrubland',
  'Grassland',
  'Cropland',
  'Built-up',
  'Bare / sparse vegetation',
  'Snow and ice',
  'Permanent water bodies',
  'Herbaceous wetland',
  'Mangroves',
  'Moss and lichen'
]

var landCoverClassParam = {
  min: 1,
  max: 10,
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
  value: 'Land Cover Classification',
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
  var areaImage = ee.Image.pixelArea().mask(landCoverClass.eq(classValue));
  var area = areaImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: banten,
    scale: 10,
    maxPixels: 1e12
  });
  var areaSqm = ee.Number(area.get('area'));
  var areaSqkm = areaSqm.divide(1e6);
  return areaSqkm;
}

var areaValues = [];

for (var i = 0; i < 10; i++) {
  var currVal = calculateArea(i + 1);
  areaValues.push(currVal);
}

ee.List(areaValues).evaluate(function(areas) {
  for (var i = 0; i < 10; i++) {
    legendBox.add(makeRow(templatePalette[i], classDesc[i], areas[i]));
  }
});

Map.centerObject(banten);
Map.addLayer(clippedDataset, visualization, 'Landcover');
Map.add(legendBox);