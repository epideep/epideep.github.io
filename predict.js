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
        .attr("height", height + margin.top + margin.bottom);
    
var chart = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var historyPath = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var predictionsPath = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var legend = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// add the legend to the chart
legend.append("line")
.attr("x1", width - 28)
.attr("x2", width)
.attr("y1", 10)
.attr("y2", 10)
.style("stroke-dasharray","5,5")
.style("stroke", "red")
.style("stroke-width", "2");

legend.append("text")
.attr("x", width - 44)
.attr("y", 9)
.attr("dy", ".35em")
.style("text-anchor", "end")
.text("Prediction");

legend.append("line")
.attr("x1", width - 28)
.attr("x2", width)
.attr("y1", 25)
.attr("y2", 25)
.style("stroke", "steelblue")
.style("stroke-width", "2");

legend.append("text")
.attr("x", width - 44)
.attr("y", 24)
.attr("dy", ".35em")
.style("text-anchor", "end")
.text("Historical Data");

legend.append("circle")
.attr("cx", width - 15)
.attr("cy", 39)
.attr("r", 4)
.style("stroke", "red")
.style("fill", "red");

legend.append("text")
.attr("x", width - 44)
.attr("y", 39)
.attr("dy", ".35em")
.style("text-anchor", "end")
.text("Predicted Peak");


var dateSelect = document.getElementById("dateSelect");
var regionSelect = document.getElementById("regionSelect");

dateSelect.onchange = function() {
    drawAllData(parseInt(dateSelect.value), parseInt(regionSelect.value));
};

regionSelect.onchange = function() {
    drawAllData(parseInt(dateSelect.value), parseInt(regionSelect.value));
}

yearsList = []

d3.text("NationalILINet.csv").then(function(data){
    data = d3.csvParse(data.split('\n').slice(1).join('\n'));
    
    data.forEach(function(d) {
        var date = parseDate(d['WEEK'] + "-" + d['YEAR'])
        if (yearsList.indexOf(date.getFullYear()) === -1) {
            yearsList.push(date.getFullYear());
        }
    });

    // populate the years select dropdown - uncomment to add all years to dropdown
    // for (var year in yearsList) {
    //     if (year < yearsList.length - 1) {
    //         var option = document.createElement("option");
    //         option.text = yearsList[year].toString() + "-" + (yearsList[year]+1).toString();
    //         option.value = yearsList[year];
    //         dateSelect.add(option);
    //     }
    // }

    // comment this out when uncommenting the above
    var option = document.createElement("option");
    option.text = "2018-2019";
    option.value = "2018";
    dateSelect.add(option);

    dateSelect.selectedIndex = 0;
    drawAllData(2018, -1);
});

bisectDate = d3.bisector(function(d) { return d.date; }).left;


// NOTE to maintainer:
// write code that changes this variable when a dropdown is changed, similarly to how
// changing the season redraws everything with the new season on line 90
var predictionName = "EpiDeep"


function drawAllData(season, region, predictionWeek=8, drawPredictions=false) {
    chart.selectAll("*").remove();
    historyPath.selectAll("*").remove();
    predictionsPath.selectAll("*").remove();

    // all regions
    if (region === -1) {
        csv_filename = "NationalILINet.csv"
    } else {
        csv_filename = "RegionalILINet.csv"
    }

    if (drawPredictions) {
        csv_filename = "PredictionData/Data/Week" + predictionWeek.toString() + "/ILINet.csv"
    }

    var lastILI, lastDate;

    d3.text(csv_filename).then(function(data){
        if (!drawPredictions) {
            data = d3.csvParse(data.split('\n').slice(1).join('\n'));
        } else {
            var headers = ['REGION TYPE',	'REGION', 'YEAR', 'WEEK','% WEIGHTED ILI', 
            '%UNWEIGHTED ILI', 'AGE 0-4', 'AGE 25-49', 'AGE 25-64', 'AGE 5-24', 'AGE 50-64', 
            'AGE 65', 'ILITOTAL', 'NUM. OF PROVIDERS', 'TOTAL PATIENTS'].join(",");

            data = d3.csvParse(headers + "\n" + data);
        }

        data = data.filter(function(row) {
            if (region === -1 && row['REGION'] === 'X') {
                return row;
            }
            if (row['REGION'] === 'Region ' + region.toString()) {
                return row;
            }
        });

        data.forEach(function(d) {
            d.date = parseDate(d['WEEK'] + "-" + d['YEAR'])
            d.ILI = +d["% WEIGHTED ILI"];
            
            lastILI = d.ILI;
            lastDate = d.date;
        });

        // Scale the range of the data to the correct season
        var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%U")).ticks(26);
        var xLabel = "Week"
        x.domain([
            parseDate("20-"+season.toString()),
            parseDate("20-"+(season+1).toString())
        ]);
        y.domain([0, d3.max(data, function(d) { return d.ILI; })]);
    
        // Add the valueline path.
        historyPath.append("path")
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .attr("d", valueline(data))
            .style("stroke", "steelblue")
            .style("stroke-width", "2")
            .style("fill", "none");

        historyPath.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);
    
        // Add the X Axis
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    
        // Add the Y Axis
        chart.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // code for the hover action (show the ILI value)
        var focus = historyPath.append("g")
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
    
        historyPath.append("rect")
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
        chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("% Weighted ILI"); 

        // text label for the x axis
        chart.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text(xLabel);

        chart.selectAll(".x.axis .tick").on("click", showPrediction);

        // draw the actual prediction data
        if (drawPredictions) {
            d3.text("PredictionData/" + predictionName + "/Week" + 
            predictionWeek.toString() + "/EpiDeep_submission.csv").then(function(data){
                data = d3.csvParse(data);
        
                data = data.filter(function(row) {
                    if (row['Type'] == "Point") {
                        if (region === -1 && row['Location'] === 'US National') {
                            return row;
                        }
                        if (row['Location'] === 'HHS Region ' + region.toString()) {
                            return row;
                        }
                    }
                });

                var peakVal, peakWeek, week1, week2, week3, week4;


                data.forEach(function(d) {
                    switch(d.Target) {
                        case 'Season peak week':
                        peakWeek = parseInt(d.Value);
                        break;

                        case 'Season peak percentage':
                        peakVal = parseFloat(d.Value);
                        break;

                        case '1 wk ahead':
                        week1 = parseFloat(d.Value);
                        break;

                        case '2 wk ahead':
                        week2 = parseFloat(d.Value);
                        break;

                        case '3 wk ahead':
                        week3 = parseFloat(d.Value);
                        break;

                        case '4 wk ahead':
                        week4 = parseFloat(d.Value);
                        break;
                    }
                });

                var predictionDate;

                if (weekVal < 20) {
                    predictionDate = parseDate(weekVal.toString() + "-" + '2019');
                } else {
                    predictionDate = parseDate(weekVal.toString() + "-" + '2018')
                }

                if (peakWeek < 20) {
                    peakWeek = parseDate(peakWeek.toString() + "-" + '2019');
                } else {
                    peakWeek = parseDate(peakWeek.toString() + "-" + '2018')
                }


                predictionData = [
                    {
                        date: lastDate,
                        ILI: lastILI
                    },
                    {
                        date: d3.timeWeek.offset(predictionDate, 1),
                        ILI: week1
                    },
                    {
                        date: d3.timeWeek.offset(predictionDate, 2),
                        ILI: week2
                    },
                    {
                        date: d3.timeWeek.offset(predictionDate, 3),
                        ILI: week3
                    },
                    {
                        date: d3.timeWeek.offset(predictionDate, 4),
                        ILI: week4
                    }
                ]

                var peakData = {date: peakWeek, ILI: peakVal}

                predictionsPath.append("path")
                .attr("class", "line")
                .attr("d", valueline(predictionData))
                .style("stroke", "red")
                .style("stroke-width", "2")
                .style("fill", "none")
                .style("stroke-dasharray", "4 1");

                // predicted peak
                predictionsPath.append("circle")
                .attr("cx", x(peakWeek))
                .attr("cy", y(peakVal))
                .attr("stroke", "red")
                .attr("r", 4)
                .attr("fill", "red");

                predictionsPath.append("text")
                .attr("dy", ".31em")
                .attr("x", x(peakWeek) + 5)
                .attr("y", y(peakVal) - 5)
                .text(peakVal.toString());

            });
        }
    });
}

var weekVal;

function showPrediction(date) {
    var weekFormat = d3.timeFormat("%U")(date); 
    var weekNum = parseInt(weekFormat);
    weekVal = weekNum;
    if (weekNum >= 42 || weekNum <= 18) {
        weekNum -= 41;
        if (weekNum < 0) {
            weekNum += 52;
        }

        // hard coded for only the 2018-2019 data
        drawAllData(2018, parseInt(regionSelect.value), weekNum, true);
    }
}