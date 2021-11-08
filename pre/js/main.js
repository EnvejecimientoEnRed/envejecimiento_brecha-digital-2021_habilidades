import { numberWithCommas, numberWithCommas2 } from './helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from './tooltip';
import { getIframeParams } from './height';
import { setChartCanvas, setChartCanvasImage } from './modules/canvas-image';
import { setRRSSLinks } from './modules/rrss';
import './modules/tabs';
import 'url-search-params-polyfill';

//Desarrollo de la visualización
import * as d3 from 'd3';

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

///// VISUALIZACIÓN DEL GRÁFICO //////
let dataSource = 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/envejecimiento_brecha-digital-2021_habilidades/main/data/habilidades_digital_2020.csv';
let tooltip = d3.select('#tooltip');

//Variables para visualización
let innerData = [], chartBlock = d3.select('#chart'), chart, x_c, x_cAxis, y_c, y_cAxis;

initChart();

function initChart() {
    let csv = d3.dsvFormat(';');
    d3.text(dataSource, function (error, data) {
        if (error) throw error;

        innerData = csv.parse(data);
        console.log(innerData);

        ///Agrupación de datos > Por edad y por tipo de conocimiento
        let edades = innerData.columns.slice(1);
        edades = edades.reverse();

        let keys = innerData.forEach(function(item) {
            return habilidades_digitales_2020;
        });

        console.log(keys);

        //Desarrollo del gráfico > Debemos hacer muchas variables genéricas para luego actualizar el gráfico
        let margin = {top: 5, right: 17.5, bottom: 20, left: 50};
        let width = parseInt(chartBlock.style('width')) - margin.left - margin.right,
            height = parseInt(chartBlock.style('height')) - margin.top - margin.bottom;

        chart = chartBlock
            .append('svg')
            .lower()
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //Disposición del eje X
        x_c = d3.scaleLinear()
            .domain([0,100])
            .range([0, width])
            .nice();

        //Estilos para eje X
        x_cAxis = function(g){
            g.call(d3.axisBottom(x_c).ticks(6).tickFormat(function(d) { return d + '%'; }))
            g.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr('y1', '0%')
                    .attr('y2', `-${height}`)
            })
            g.call(function(g){g.select('.domain').remove()});
        }

        chart.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(x_cAxis);

        //Estilos para eje Y
        y_c = d3.scaleBand()
            .domain(edades.map(function(d) { return d; }))
            .range([height, 0]);

        y_cAxis = function(svg){
            svg.call(d3.axisLeft(y_c).tickFormat(function(d) { return d; }))
            svg.call(function(g){g.selectAll('.tick line').remove()})
            svg.call(function(g){g.select('.domain').remove()});
        }        
        
        chart.append("g")
            .call(y_cAxis);
        
    });
}

function animateChart() {
    //Animación de las tres líneas
    path_1 = chart.select(".line-chart-1")
        .data([data_65])
        .attr("class", 'line-chart-1')
        .attr("fill", "none")
        .attr("stroke", color_1)
        .attr("stroke-width", '2px')
        .attr("d", line);

    length_1 = path_1.node().getTotalLength();

    path_1.attr("stroke-dasharray", length_1 + " " + length_1)
        .attr("stroke-dashoffset", length_1)
        .transition()
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .duration(3000);

    path_2 = chart.select(".line-chart-2")
        .data([data_85])
        .attr("class", 'line-chart-2')
        .attr("fill", "none")
        .attr("stroke", color_2)
        .attr("stroke-width", '2px')
        .attr("d", line);

    length_2 = path_2.node().getTotalLength();

    path_2.attr("stroke-dasharray", length_2 + " " + length_2)
        .attr("stroke-dashoffset", length_2)
        .transition()
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .duration(3000);

    path_3 = chart.select(".line-chart-3")
        .data([data_100])
        .attr("class", 'line-chart-3')
        .attr("fill", "none")
        .attr("stroke", color_3)
        .attr("stroke-width", '2px')
        .attr("d", line);

    length_3 = path_3.node().getTotalLength();

    path_3.attr("stroke-dasharray", length_3 + " " + length_3)
        .attr("stroke-dashoffset", length_3)
        .transition()
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .duration(3000);

    //Borramos todos los círculos de una tacada
    chart
        .selectAll('.circle-chart')
        .remove();

    chart.selectAll('circles')
        .data(data_65)
        .enter()
        .append('circle')
        .attr('class', 'circle-chart')  
        .attr("r", '3.5')
        .attr("cx", function(d) { return x_c(+d.Periodo)})
        .attr("cy", function(d) { return y_c(+d.superviviente_total.replace(',','.')); })
        .style('fill', 'transparent')
        .style("stroke", color_1)
        .style('opacity', '0')
        .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');

            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '0.4';
            }
            this.style.opacity = '1';

            //Texto
            let html = '<p class="chart__tooltip--title">' + d.Edad + ' ('+ d.Periodo +')</p>' + '<p class="chart__tooltip--text">Media de supervivientes: ' + numberWithCommas2(parseInt(d.superviviente_total.replace('.',','))) + '</p>' +
            '<p class="chart__tooltip--text">Mujeres: ' + numberWithCommas2(parseInt(d.superviviente_mujer.replace('.',','))) + '</p>' + 
            '<p class="chart__tooltip--text">Hombres: ' + numberWithCommas2(parseInt(d.superviviente_hombre.replace('.',','))) + '</p>';
            
            tooltip.html(html);

            //Tooltip
            positionTooltip(window.event, tooltip);
            getInTooltip(tooltip);               
        })
        .on('mouseout', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');
            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '1';
            }
            //Quitamos el tooltip
            getOutTooltip(tooltip);                
        })
        .transition()
        .delay(function(d,i) { return i * (3000 / data_65.length - 1)})
        .style('opacity', '1');

    chart.selectAll('circles')
        .data(data_85)
        .enter()
        .append('circle')
        .attr('class', 'circle-chart')  
        .attr("r", '3.5')
        .attr("cx", function(d) { return x_c(+d.Periodo)})
        .attr("cy", function(d) { return y_c(+d.superviviente_total.replace(',','.')); })
        .style('fill', 'transparent')
        .style("stroke", color_2)
        .style('opacity', '0')
        .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');

            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '0.4';
            }
            this.style.opacity = '1';

            //Texto
            let html = '<p class="chart__tooltip--title">' + d.Edad + ' ('+ d.Periodo +')</p>' + '<p class="chart__tooltip--text">Media de supervivientes: ' + numberWithCommas2(parseInt(d.superviviente_total.replace('.',','))) + '</p>' +
            '<p class="chart__tooltip--text">Mujeres: ' + numberWithCommas2(parseInt(d.superviviente_mujer.replace('.',','))) + '</p>' + 
            '<p class="chart__tooltip--text">Hombres: ' + numberWithCommas2(parseInt(d.superviviente_hombre.replace('.',','))) + '</p>';
            
            tooltip.html(html);

            //Tooltip
            positionTooltip(window.event, tooltip);
            getInTooltip(tooltip);               
        })
        .on('mouseout', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');
            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '1';
            }
            //Quitamos el tooltip
            getOutTooltip(tooltip);                
        })
        .transition()
        .delay(function(d,i) { return i * (3000 / data_85.length - 1)})
        .style('opacity', '1');
    
    chart.selectAll('circles')
        .data(data_100)
        .enter()
        .append('circle')
        .attr('class', 'circle-chart')  
        .attr("r", '3.5')
        .attr("cx", function(d) { return x_c(+d.Periodo)})
        .attr("cy", function(d) { return y_c(+d.superviviente_total.replace(',','.')); })
        .style('fill', 'transparent')
        .style("stroke", color_3)
        .style('opacity', '0')
        .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');

            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '0.4';
            }
            this.style.opacity = '1';

            //Texto
            let html = '<p class="chart__tooltip--title">' + d.Edad + ' ('+ d.Periodo +')</p>' + '<p class="chart__tooltip--text">Media de supervivientes: ' + numberWithCommas2(parseInt(d.superviviente_total.replace('.',','))) + '</p>' +
            '<p class="chart__tooltip--text">Mujeres: ' + numberWithCommas2(parseInt(d.superviviente_mujer.replace('.',','))) + '</p>' + 
            '<p class="chart__tooltip--text">Hombres: ' + numberWithCommas2(parseInt(d.superviviente_hombre.replace('.',','))) + '</p>';
            
            tooltip.html(html);

            //Tooltip
            positionTooltip(window.event, tooltip);
            getInTooltip(tooltip);               
        })
        .on('mouseout', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');
            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '1';
            }
            //Quitamos el tooltip
            getOutTooltip(tooltip);                
        })
        .transition()
        .delay(function(d,i) { return i * (3000 / data_100.length - 1)})
        .style('opacity', '1');
}

document.getElementById('replay').addEventListener('click', function() {
    animateChart();
});

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let pngDownload = document.getElementById('pngImage');

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});