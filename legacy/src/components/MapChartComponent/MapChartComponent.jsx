import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";

const MapChartComponent = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // ROOT
    const root = am5.Root.new(chartRef.current);

    const myTheme = am5.Theme.new(root);

    myTheme.rule("InterfaceColors").setAll({
      primaryButton: am5.color(0x0b2967),
      primaryButtonHover: am5.Color.lighten(am5.color(0x0b2967), 0.2),
      primaryButtonDown: am5.Color.lighten(am5.color(0x0b2967), -0.2),
      primaryButtonActive: am5.color(0xd9cec8),
    });

    myTheme.rule("Label").setAll({
      fontSize: "0.8em",
    });

    root.setThemes([am5themes_Animated.new(root), myTheme]);

    // CHART
    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        projection: am5map.geoMercator(),
      })
    );

    // GRATICULE
    const graticuleSeries = chart.series.unshift(
      am5map.GraticuleSeries.new(root, {
        step: 10,
      })
    );

    graticuleSeries.mapLines.template.set("strokeOpacity", 0.05);

    // ZOOM
    let zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    zoomControl.homeButton.set("visible", true);

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
          key: "rotationX",
          to: chart.get("rotationX") + 360,
          duration: 15000,
          easing: am5.ease.inOut(am5.ease.cubic),
        });
      }
    });

    cont.children.push(
      am5.Label.new(root, {
        centerY: am5.p50,
        text: "Globo",
      })
    );

    // HEAT RULES
    polygonSeries.set("heatRules", [
      {
        target: polygonSeries.mapPolygons.template,
        dataField: "value",
        min: am5.color(0xb5bed1),
        max: am5.color(0x0b2967),
        key: "fill",
      },
    ]);

    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}: {value}",
      fill: am5.color(0xc3c1c1),
      stroke: am5.color(0xffffff),
    });

    polygonSeries.data.setAll(data);

    // HEAT LEGEND
    const heatLegend = chart.children.push(
      am5.HeatLegend.new(root, {
        orientation: "vertical",
        startColor: am5.color(0xb5bed1),
        endColor: am5.color(0x0b2967),
        startText: "Menor",
        endText: "Mayor",
        stepCount: 8,
        x: am5.p100,
        centerX: am5.p100,
        paddingRight: 20,
        paddingTop: 20,
        paddingBottom: 200,
      })
    );

    polygonSeries.events.on("datavalidated", () => {
      heatLegend.set("startValue", polygonSeries.getPrivate("valueLow"));
      heatLegend.set("endValue", polygonSeries.getPrivate("valueHigh"));
    });

    // // TITLE
    // chart.children.push(
    //   am5.Label.new(root, {
    //     text: "Embarques",
    //     fontSize: 20,
    //     x: am5.percent(50),
    //     centerX: am5.p50,
    //     y: 40,
    //   })
    // );

    return () => {
      root.dispose();
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "600PX" }} />;
};

export default MapChartComponent;
