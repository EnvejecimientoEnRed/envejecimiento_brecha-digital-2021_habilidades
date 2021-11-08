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
        let keys = innerData.columns.slice(1);

        innerData = innerData.map(function(d) {
            return {
                tipo: d['habilidades_digitales_2020'],
                'Sin Habilidades': +d['Sin Habilidades'].replace(',','.'),
                'Hab. Baja': +d['Hab. Baja'].replace(',','.'),
                'Hab. Básica': +d['Hab. Básica'].replace(',','.'),
                'Hab. Avanzada': +d['Hab. Avanzada'].replace(',','.')
            }
        });

        ///Agrupación de datos > Por edad y por tipo de conocimiento       

        let edades = innerData.map(function(item) {
            return item.tipo;
        });
        edades = edades.reverse();

        //Desarrollo del gráfico > Debemos hacer muchas variables genéricas para luego actualizar el gráfico
        let margin = {top: 5, right: 13.5, bottom: 20, left: 105};
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
            svg.call(function(g){g.selectAll('.tick text').style('font-weight', function(d) {
                if(d == 'Media de edades') {
                    return 'bold';
                }
            })})
            svg.call(function(g){g.selectAll('.tick line').remove()})
            svg.call(function(g){g.select('.domain').remove()});
        }        
        
        chart.append("g")
            .call(y_cAxis);

        //Stacked data
        z_c = d3.scaleOrdinal()
            .range(['#BD0202', '#F55656', '#19FCFC', '#0C9494'])
            .domain(keys);

        //Visualización > Barras
        chart.selectAll('.bar')
            .data(d3.stack().keys(keys)(innerData))
            .enter()
            .append("g")
            .attr("fill", function(d) { return z_c(d.key); })
            .attr("class", function(d) { return 'g_rect rect-' + d.key; })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter()
            .append("rect")                
            .attr("y", function(d) { return y_c(d.data.tipo) + y_c.bandwidth() / 4; })
            .attr("x", function(d) { return x_c(0); })
            .attr("height", y_c.bandwidth() / 2)
            .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                let css = e[i].parentNode.getAttribute('class').split('-')[1];

                let currentData = {edad: d.data.tipo, data: d.data[`${css}`]};
                //Texto
                let html = `<p class="chart__tooltip--title">${currentData.edad}</p>
                            <p class="chart__tooltip--text">${css}: ${currentData.data.toString().replace('.',',')}%</p>`;

                tooltip.html(html);

                //Posibilidad visualización línea diferente
                let bars = chartBlock.selectAll('.g_rect');
                
                bars.each(function() {
                    this.style.opacity = '0.2';
                    if(this.getAttribute('class').indexOf(`rect-${css}`) != -1) {
                        this.style.opacity = '1';
                    }
                });

                //Tooltip
                positionTooltip(window.event, tooltip);
                getInTooltip(tooltip);
            })
            .on('mouseout', function(d, i, e) {
                //Quitamos los estilos de la línea
                let bars = chartBlock.selectAll('.g_rect');
                bars.each(function() {
                    this.style.opacity = '1';
                });

                //Quitamos el tooltip
                getOutTooltip(tooltip); 
            })
            .transition()
            .duration(3000)
            .attr("x", function(d) { return x_c(d[0]); })	
            .attr("width", function(d) { return x_c(d[1]) - x_c(d[0]); });

        
        
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