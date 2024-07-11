// Dont forget to import and align the shp file

var imgColl = ee
  .ImageCollection("WCMC/biomass_carbon_density/v1_0")
  .filterBounds(banten)
  .select('carbon_tonnes_per_ha')
  .map(function(image){
    return image.clip(banten)
  });

print(imgColl);

var biomassMean = imgColl
  .mean()
  .clip(banten);

var biomassClass = biomassMean
  .where(biomassMean.gte(1).and(biomassMean.lt(30)), 1)
  .where(biomassMean.gte(30).and(biomassMean.lt(60)), 2)
  .where(biomassMean.gte(60).and(biomassMean.lt(90)), 3)
  .where(biomassMean.gte(90).and(biomassMean.lt(120)), 4)
  .where(biomassMean.gte(120).and(biomassMean.lt(150)), 5)
  .where(biomassMean.gte(150).and(biomassMean.lte(180)), 6);

var palette = ['d9f0a3', 'addd8e', '78c679', '41ab5d', '238443', '005a32'];
var labelsDescription = [
  'Under 30 t/ha',
  'Between 30 t/ha to 59 t/ha',
  'Between 60 t/ha to 89 t/ha',
  'Between 90 t/ha to 119 t/ha',
  'Between 120 t/ha to 149 t/ha',
  'Between 150 t/ha to 180 t/ha'
];

var biomassClassParam = {
  min: 1,
  max: 6,
  palette: palette,
  labels: labelsDescription
};

var legendBox = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

var legendTitle = ui.Label({
  value: 'Biomass Classification',
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
      backgroundColor: '#' + color,
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  var areaDesc = ui.Label({
    value: 'Total area: ' +  area + ' ha',
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description, areaDesc],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

function calculateArea(classValue) {
  var areaImage = ee.Image.pixelArea().mask(biomassClass.eq(classValue));
  var area = areaImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: banten,
    scale: 300,
  });
  var areaSqm = ee.Number(area.get('area'));
  var areaHa = areaSqm.multiply(0.0001);
  return areaHa;
}

var areaValues = [];

for (var i = 0; i < 6; i++) {
  var currVal = calculateArea(i + 1);
  areaValues.push(currVal);
}

ee.List(areaValues).evaluate(function(areas) {
  for (var i = 0; i < 6; i++) {
    legendBox.add(makeRow(palette[i], labelsDescription[i], areas[i]));
  }
});

Map.centerObject(banten);
Map.addLayer(biomassClass, biomassClassParam, 'Banten Biomass Classification');
Map.add(legendBox);

Export.image.toDrive({
  image: biomassClass,
  description: 'Biomass_Clasification_of_Banten',
  scale: 300,
  region: banten,
  fileFormat: 'GeoTIFF'
});
