import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

export const MapChartBubblesComponent = ({data = []}) => {

    const chartRef = useRef(null);
   
    useEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);

        const myTheme = am5.Theme.new(root);
        myTheme.rule("InterfaceColors").setAll({
            // primaryButton: am5.color(0x0b2967),
            primaryButtonHover: am5.Color.lighten(am5.color(0x0b2967), 0.2),
            primaryButtonDown: am5.Color.lighten(am5.color(0x0b2967), -0.2),
            primaryButtonActive: am5.color(0xd9cec8),
        });
        root.setThemes([am5themes_Animated.new(root), myTheme]);

        const chart = root.container.children.push(
            am5map.MapChart.new(root, {})
        );

        let zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
        zoomControl.homeButton.set("visible", true);

        // const polygonSeries = chart.series.push(
        //     am5map.MapPolygonSeries.new(root, {
        //         geoJSON: am5geodata_worldLow,
        //         exclude: ["AQ"]
        //     })
        // );

        // SWITCH: Map / Globe
        const cont = chart.children.push(
        am5.Container.new(root, {
            layout: root.horizontalLayout,
            x: am5.percent(15),
            centerX: 0,
            y: am5.percent(100),
            dy: -40,
        })
        );

        cont.children.push(
        am5.Label.new(root, {
            centerY: am5.p50,
            text: "Mapa",
        })
        );

        const switchButton = cont.children.push(
        am5.Button.new(root, {
            themeTags: ["switch"],
            centerY: am5.p50,
            icon: am5.Circle.new(root, { themeTags: ["icon"] }),
        })
        );

        // POLYGON SERIES (countries)
        const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
            geoJSON: am5geodata_worldLow,
            valueField: "value",
            calculateAggregates: true,
            exclude: ["AQ"],
        })
        );

        switchButton.on("active", () => {
        if (!switchButton.get("active")) {
            chart.set("projection", am5map.geoMercator());
            chart.set("panY", "translateY");
            chart.set("rotationY", 0);
            polygonSeries.set("exclude", ["AQ"]);
        } else {
            chart.set("projection", am5map.geoOrthographic());
            chart.set("panY", "rotateY");
            chart.set("panX", "rotateX");
            polygonSeries.set("exclude", []);
            chart.animate({
            // key: "rotationX",
            // to: chart.get("rotationX") + 360,
            // duration: 15000,
            // easing: am5.ease.inOut(am5.ease.cubic),
            });
        }
        });

        cont.children.push(
        am5.Label.new(root, {
            centerY: am5.p50,
            text: "Globo",
        })
        );

        // const bubbleSeries = chart.series.push(
        //     am5map.MapPointSeries.new(root, {
        //         valueField: "value",
        //         calculateAggregates: true,
        //         polygonIdField: "id",
        //         clustered: true
        //     })
        // );
        const clusterSeries = chart.series.push(
            am5map.ClusteredPointSeries.new(root, {
                valueField: "value",
                polygonIdField: "id",
                calculateAggregates: true,
                clusterDelay: 50, // optional: delay before reclustering (ms)
                // minimum number of points to form a cluster:
                minClusterSize: 2
            })
        );

        const circleTemplate = am5.Template.new({});

        // BULLET: circle + label
        clusterSeries.bullets.push(function (root, series, dataItem) {
        const container = am5.Container.new(root, {});

        const circle = container.children.push(
            am5.Circle.new(
            root,
            {
                radius: 20,
                fillOpacity: 0.7,
                fill: am5.color(0xff0000),
                tooltipText: `{name}: [bold]{value}[/]`,
                cursorOverStyle: "pointer"
            },
            circleTemplate
            )
        );

        const label = container.children.push(
            am5.Label.new(root, {
                text: "{name}",
                populateText: true,
                paddingLeft: 5,
                fontWeight: "bold",
                fontSize: 13,
                centerY: am5.p50
            })
        );

        circle.on("radius", (r) => label.set("x", r));

            return am5.Bullet.new(root, {
                sprite: container,
                dynamic: true
            });
        });

        // BULLET: value text
        clusterSeries.bullets.push(function (root) {
            return am5.Bullet.new(root, {
                sprite: am5.Label.new(root, {
                text: "{value.formatNumber('#.')}",
                populateText: true,
                fill: am5.color(0xffffff),
                centerX: am5.p50,
                centerY: am5.p50
                }),
                dynamic: true
            });
        });

        // radius scaling
        clusterSeries.set("heatRules", [
        {
            target: circleTemplate,
            dataField: "value",
            min: 10,
            max: 50,
            minValue: 0,
            maxValue: 500,
            key: "radius"
        }
        ]);

        // **Use passed data**
        clusterSeries.data.setAll(data || []);

        return () => root.dispose();
    }, [data]);

    return (
        <div
            ref={chartRef}
            id="chartdiv"
            style={{ width: "100%", height: "700px" }}
        ></div>
    );
}   