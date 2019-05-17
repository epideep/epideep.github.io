// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = 1100 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// Parse the date / time
var parseDate = d3.timeParse("%U-%Y");

// Set the ranges
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// Define the axes
var yAxis = d3.axisLeft(y).ticks(10);

// Define the line
var valueline = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.ILI); });
    
// Adds the svg canvas
var svg = d3.select("body")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");


var dateSelect = document.getElementById("dateSelect")
var regionSelect = document.getElementById("regionSelect")

dateSelect.onchange = function() {
    drawAllData(parseInt(dateSelect.value), parseInt(regionSelect.value));
};

regionSelect.onchange = function() {
    drawAllData(parseInt(dateSelect.value), parseInt(regionSelect.value));
}

yearsList = []

d3.csv("NationalILINet.csv", function(error, data) {
    
    data.forEach(function(d) {
        var date = parseDate(d['WEEK'] + "-" + d['YEAR'])
        if (yearsList.indexOf(date.getFullYear()) === -1) {
            yearsList.push(date.getFullYear());
        }
    });

    for (var year in yearsList) {
        if (year < yearsList.length - 1) {
            var option = document.createElement("option");
            option.text = yearsList[year].toString() + "-" + (yearsList[year]+1).toString();
            option.value = yearsList[year];
            dateSelect.add(option);
        }
    }
});

bisectDate = d3.bisector(function(d) { return d.date; }).left;

drawAllData(-1, -1);

function drawAllData(season, region) {
    svg.selectAll("*").remove();

    // all regions
    if (region === -1) {
        csv_filename = "NationalILINet.csv"
    } else {
        csv_filename = "RegionalILINet.csv"
    }

    var line = d3.line()
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y(d.value); });

    // TODO: deal with the csv header, which currently must be manually deleted from the file
    d3.csv(csv_filename, function(error, data) {

        data = data.filter(function(row) {
            console.log('Region ' + region.toString())
            if (row['REGION'] === 'Region ' + region.toString() || row['REGION'] === 'X') {
                return row
            }
        });

        console.log(data)

        data.forEach(function(d) {

            d.date = parseDate(d['WEEK'] + "-" + d['YEAR'])
            d.ILI = +d["% WEIGHTED ILI"];
        });

        // Scale the range of the data to the correct season
        if (season === -1) {
            var xAxis = d3.axisBottom(x).ticks(10);
            var xLabel = "Year"
            x.domain(d3.extent(data, function(d) { return d.date; }));
        } else {
            var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%U")).ticks(26);
            var xLabel = "Week"
            x.domain([
                parseDate("20-"+dateSelect.value),
                parseDate("20-"+(parseInt(dateSelect.value)+1).toString())
            ]);
        }
        y.domain([0, d3.max(data, function(d) { return d.ILI; })]);
    
        // Add the valueline path.
        svg.append("path")
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueline(data));

        svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);
    
        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    
        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // code for the hover action (show the ILI value)
        var focus = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");
    
        focus.append("line")
            .attr("class", "x-hover-line hover-line")
            .attr("y1", 0)
            .attr("y2", height);
    
        focus.append("line")
            .attr("class", "y-hover-line hover-line")
            .attr("x1", width)
            .attr("x2", width);
    
        focus.append("circle")
            .attr("r", 5);
    
        focus.append("text")
            .attr("x", 15)
              .attr("dy", ".31em");
    
        svg.append("rect")
            // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0.0)
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", mousemove);
    
        function mousemove() {
          var x0 = x.invert(d3.mouse(this)[0]),
              i = bisectDate(data, x0, 1),
              d0 = data[i - 1],
              d1 = data[i],
              d = x0 - d0.date > d1.date - x0 ? d1 : d0;
          focus.attr("transform", "translate(" + x(d.date) + "," + y(d.ILI) + ")");
          focus.select("text").text(function() { return d.ILI; });
          focus.select(".x-hover-line").attr("y2", height - y(d.ILI));
          focus.select(".y-hover-line").attr("x2", width + width);
        }
    
        // text label for the y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("% Weighted ILI"); 

        // text label for the x axis
        svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text(xLabel);
    });

}