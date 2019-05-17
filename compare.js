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
var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%U")).ticks(26);

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


var seasonSelect = document.getElementById("dateSelect")
var regionSelect = document.getElementById("regionSelect")

seasonSelect.onchange = function() {
    redrawComparison()
};

regionSelect.onchange = function() {
    redrawComparison()
}

yearsList = []

d3.csv("https://raw.githubusercontent.com/epideep/epideep.github.io/master/NationalILINet.csv", function(error, data) {
    
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
            seasonSelect.add(option);


            var newCheckboxLabel = document.createElement("label");
            newCheckboxLabel.innerHTML = yearsList[year].toString() + "-" + (yearsList[year]+1).toString() + " ";
            newCheckboxLabel.htmlFor = "checkbox" + yearsList[year].toString();

            var season_div

            if (yearsList[year] <= 2007) {
                season_div = document.getElementById("seasons_checkboxes");
            } else {
                season_div = document.getElementById("seasons_checkboxes2");
            }

            season_div.appendChild(newCheckboxLabel);
            season_div.appendChild(document.createElement("br"));

            var newCheckbox = document.createElement("input");
            newCheckbox.type = "checkbox";
            newCheckbox.value = yearsList[year].toString();
            newCheckbox.addEventListener("click", checkBoxChanged, false);
            newCheckbox.id = "checkbox" + yearsList[year].toString();

            newCheckboxLabel.appendChild(newCheckbox);

            $("#" + newCheckbox.id).attr("onClick", "checkBoxChanged(this);");
        }
    }
});

bisectDate = d3.bisector(function(d) { return d.date; }).left;


regionColors = {
    "-1": "#00ffff",
    "1": "#ff00ff",
    "2": "#9932cc",
    "3": "#00ff00",
    "4": "#0000ff",
    "5": "#a52a2a",
    "6": "#ff00ff",
    "7": "#00008b",
    "8": "#008b8b",
    "9": "#a9a9a9",
    "10": "#006400",
}

seasonColors = [
"#0000ff",
"#a52a2a",
"#00ffff",
"#00008b",
"#008b8b",
"#a9a9a9",
"#006400",
"#bdb76b",
"#8b008b",
"#556b2f",
"#ff8c00",
"#9932cc",
"#8b0000",
"#e9967a",
"#9400d3",
"#ff00ff",
"#ffd700",
"#008000",
"#4b0082",
"#f0e68c",
"#add8e6",
"#90ee90",
"#d3d3d3",
"#ffb6c1",
"#ffffe0",
"#00ff00",
"#ff00ff",
"#800000",
"#000080",
"#808000",
"#ffa500",
"#ffc0cb",
"#800080",
"#800080",
"#ff0000",
"#c0c0c0",
"#ffffff",
"#ffff00"]


Colors = {};
Colors.names = {
    aqua: "#00ffff",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    blue: "#0000ff",
    brown: "#a52a2a",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgrey: "#a9a9a9",
    darkgreen: "#006400",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkviolet: "#9400d3",
    fuchsia: "#ff00ff",
    gold: "#ffd700",
    green: "#008000",
    indigo: "#4b0082",
    khaki: "#f0e68c",
    lightblue: "#add8e6",
    lightcyan: "#e0ffff",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    magenta: "#ff00ff",
    maroon: "#800000",
    navy: "#000080",
    olive: "#808000",
    orange: "#ffa500",
    pink: "#ffc0cb",
    purple: "#800080",
    violet: "#800080",
    red: "#ff0000",
    silver: "#c0c0c0",
    white: "#ffffff",
    yellow: "#ffff00"
};

var yMax = 0;

function drawAllData(season, region, drawAxis) {
    // svg.selectAll("*").remove();

    // all regions
    if (region === -1) {
        csv_filename = "https://raw.githubusercontent.com/epideep/epideep.github.io/master/NationalILINet.csv"
    } else {
        csv_filename = "https://raw.githubusercontent.com/epideep/epideep.github.io/master/RegionalILINet.csv"
    }

    var line = d3.line()
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y(d.value); });

    // TODO: deal with the csv header, which currently must be manually deleted from the file
    d3.csv(csv_filename, function(error, data) {

        data = data.filter(function(row) {
            if (row['REGION'] === 'Region ' + region.toString() || row['REGION'] === 'X') {
                return row
            }
        });

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
                parseDate("20-"+season.toString()),
                parseDate("20-"+(season+1).toString())
            ]);
        }

        if (d3.max(data, function(d) { return d.ILI; }) > yMax) {
            yMax = d3.max(data, function(d) { return d.ILI; });
            redrawComparison()
        }
        
        y.domain([0, yMax]);
    

        if (regionRadioButton.checked) {
            var lineColor = regionColors[region.toString()];
        } else {
            var lineColor = seasonColors[season - 1997];
            console.log(season)
        }

        // Add the valueline path.
        svg.append("path")
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueline(data))
            .style('stroke', lineColor);

        svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);
    
        svg.selectAll("g").remove()
            
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
            .attr("class", "x label")
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


seasonCheckBoxes = document.getElementById("seasonCheckBoxes");
regionCheckBoxes = document.getElementById("regionCheckBoxes");

regionRadioButton = document.getElementById("region_radio");

regionSelect.disabled = true;
seasonCheckBoxes.style.display = "none";


// handle comparison radio button change
function comparisonChange(myRadio) {
    if (myRadio.value === "regions") {
        // populate the checkboxes with regions
        regionSelect.disabled = true;
        seasonSelect.disabled = false;
        seasonCheckBoxes.style.display = "none";
        regionCheckBoxes.style.display = "block";

    } else {
        // populate the checkboxes with seasons
        seasonSelect.disabled = true;
        regionSelect.disabled = false;
        seasonCheckBoxes.style.display = "block";
        regionCheckBoxes.style.display = "none";
    }

    redrawComparison()
}


var seasons_list = []
var regions_list = []

function checkBoxChanged(checkbox) {
    var value = parseInt(checkbox.value)

    if (checkbox.tagName !== "INPUT") {
        return
    }

    // a season is selected
    if (value > 10) {
        if (checkbox.checked) {
            seasons_list.push(value)
        } else {
            // remove the element
            seasons_list = seasons_list.filter(item => item !== value)
        }

        if (!regionRadioButton.checked) {
            checkbox.parentNode.style.color = checkbox.checked ? seasonColors[value - 1997] : "#000000";
        }
    }
    // a region is selected
    else {
        if (checkbox.checked) {
            regions_list.push(value)
        } else {
            // remove the element
            regions_list = regions_list.filter(item => item !== value)
        }

        if (regionRadioButton.checked) {
            checkbox.parentNode.style.color = checkbox.checked ? regionColors[checkbox.value] : "#000000";
        }
    }

    redrawComparison()
}

function redrawComparison() {
    svg.selectAll("*").remove();

    // if we are comparing regions
    if (regionRadioButton.checked) {
        regions_list.forEach(function(region) {
            drawAllData(parseInt(seasonSelect.value), region);
        });
    } 
    // if we are comparing seasons
    else {
        seasons_list.forEach(function(season) {
            drawAllData(season, parseInt(regionSelect.value));
        });
    }
}