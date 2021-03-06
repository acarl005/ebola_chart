
// capture the height/width defined in the div so we only have it defined in one place
var chartHeight = parseInt(document.getElementById('graph').style.height);
var chartWidth = parseInt(document.getElementById('graph').style.width);

d3.json('ebola.json', function(err, json) {
  json.forEach(function(point, i) {
    setTimeout(addData, i * 100, 'graph', {'id':'v'+i, 'cases': point.cases - point.deaths, 'deaths': point.deaths});
  });
});

// TODO we need a ceiling value
var ceiling = 25000;
// Y scale will fit values from 0-10 within pixels 0 - height
var y = d3.scale.linear().domain([0, ceiling]).range([0, chartHeight]);

/**
* Create an empty shell of a chart that bars can be added to
*/
function displayStackedChart(chartId) {
  // create an SVG element inside the div that fills 100% of the div
  var vis = d3.select("#" + chartId).append("svg:svg").attr("width", "100%").attr("height", "100%")
  // transform down to simulate making the origin bottom-left instead of top-left
  // we will then need to always make Y values negative
  .append("g").attr("class","barChart").attr("transform", "translate(0, " + chartHeight + ")");
}

/* the property names on the data objects that we'll get data from */
var propertyNames = ["cases", "deaths"];

/**
* Add or update a bar of data in the given chart
*
* The data object expects to have an 'id' property to identify itself (id == a single bar)
* and have object properties with numerical values for each property in the 'propertyNames' array.
*/
function addData(chartId, data) {

  // if data already exists for this data ID, update it instead of adding it
  var existingBarNode = document.querySelectorAll("#" + chartId + "_" + data.id);
  if(existingBarNode.length > 0) {
    var existingBar = d3.select(existingBarNode.item());
    // reset the decay since we received an update
    existingBar.transition().duration(100)
      .attr("style", "opacity:1.0");
    // update the data on each data point defined by 'propertyNames'
    for(index in propertyNames) {
      existingBar.select("rect." + propertyNames[index])
        .transition().ease("linear").duration(300)
        .attr("y", barY(data, propertyNames[index]))
        .attr("height", barHeight(data, propertyNames[index]));
    }
  } else {
    // it's new data so add a bar
    var barDimensions = updateBarWidthsAndPlacement(chartId);

    // select the chart and add the new bar
    var barGroup = d3.select("#" + chartId).selectAll("g.barChart")
      .append("g")
        .attr("class", "bar")
        .attr("id", chartId + "_" + data.id)
        .attr("style", "opacity:1.0");

    // now add each data point to the stack of this bar
    for(index in propertyNames) {
      barGroup.append("rect")
        .attr("class", propertyNames[index])
        .attr("width", (barDimensions.barWidth-1))
        .attr("x", function () { return (barDimensions.numBars-1) * barDimensions.barWidth;})
        .attr("y", barY(data, propertyNames[index]))
        .attr("height", barHeight(data, propertyNames[index]));
    }
  }
}



/**
* Update the bar widths and x positions based on the number of bars.
* @returns {barWidth: X, numBars:Y}
*/
function updateBarWidthsAndPlacement(chartId) {
  /**
  * Since we dynamically add/remove bars we can't use data indexes but must determine how
  * many bars we have already in the graph to calculate x-axis placement
  */
  var numBars = document.querySelectorAll("#" + chartId + " g.bar").length + 1;

  // determine what the width of all bars should be
  var barWidth = chartWidth/numBars;
  if(barWidth > 50) {
    barWidth=50;
  }

  // reset the width and x position of each bar to fit
  var barNodes = document.querySelectorAll(("#" + chartId + " g.barChart g.bar"));
  for(var i=0; i < barNodes.length; i++) {
    d3.select(barNodes.item(i)).selectAll("rect")
      //.transition().duration(10) // animation makes the display choppy, so leaving it out
      .attr("x", i * barWidth)
      .attr("width", (barWidth-1));
  }

  return {"barWidth":barWidth, "numBars":numBars};
}

/*
* Function to calculate the Y position of a bar
*/
function barY(data, propertyOfDataToDisplay) {
  /*
  * Determine the baseline by summing the previous values in the data array.
  * There may be a cleaner way of doing this with d3.layout.stack() but it
  * wasn't obvious how to do so while playing with it.
  */
  var baseline = 0;
  for(var j=0; j < index; j++) {
    baseline = baseline + data[propertyNames[j]];
  }
  // make the y value negative 'height' instead of 0 due to origin moved to bottom-left
  return -y(baseline + data[propertyOfDataToDisplay]);
}

/*
* Function to calculate height of a bar
*/
function barHeight(data, propertyOfDataToDisplay) {
  return data[propertyOfDataToDisplay];
}

displayStackedChart("graph");

