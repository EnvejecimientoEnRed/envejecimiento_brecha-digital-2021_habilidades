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
let innerData = [], chartBlock = d3.select('#chart'), chart, x_c, x_cAxis, y_c, y_cAxis, z_c;

initChart();

function initChart() {
    let csv = d3.dsvFormat(';');
    d3.text(dataSource, function (error, data) {
        if (error) throw error;

        innerData = csv.parse(data);

        ///Agrupación de datos > Por edad y por tipo de conocimiento
        let edades = innerData.columns.slice(1);
        edades = edades.reverse();

        let keys = innerData.map(function(item) {
            return item.habilidades_digitales_2020;
        });

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

        //Stacked data
        z_c = d3.scaleOrdinal()
            .range(['red', 'blue', 'yellow', 'green'])
            .domain(keys);

        //Visualización
        chart.selectAll('.bar')
            .data(d3.stack().keys(keys)(innerData))
            .enter()
            .append("g")
            .attr("fill", function(d) { console.log(d); return z_c(d.key); })
            .attr("class", function(d) { return 'g_rect rect-' + d.key; })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter()
            .append("rect")                
            .attr("y", function(d) { console.log(d); return y_c(d.data.tipo) + y_c.bandwidth() / 4; })
            .attr("x", function(d) { return x_c(0); })
            .attr("height", y_c.bandwidth() / 2);
        
    });
}

function animateChart() {
    
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